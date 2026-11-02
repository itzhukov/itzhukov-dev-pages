(() => {
  const counterId = Number(document.currentScript?.dataset.counterId);
  // Production exports are also previewed locally. Keep those visits out of the counter.
  if (location.hostname !== "itzhukov.dev" || !Number.isSafeInteger(counterId) || counterId <= 0)
    return;
  if (window.itzhukovAnalyticsLoaded) return;
  window.itzhukovAnalyticsLoaded = true;

  window.ym = window.ym || function (...args) {
    (window.ym.a = window.ym.a || []).push(args);
  };
  window.ym.l = Date.now();
  const source = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;
  if (!Array.from(document.scripts).some((script) => script.src === source)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = source;
    document.head.appendChild(script);
  }
  window.ym(counterId, "init", {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: "dataLayer",
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  });

  const language = document.documentElement.lang;
  const languages = ["en", "ru", "ja"];
  const goal = (name, extra = {}) => {
    window.ym(counterId, "reachGoal", name, { language, ...extra });
  };
  const outboundGoals = new Map([
    ["https://t.me/itzhukov", "contact_telegram"],
    ["https://www.linkedin.com/in/itzhukov", "contact_linkedin"],
    ["https://github.com/itzhukov", "outbound_github"],
  ]);

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const element = event.target.closest("a,button");
    if (!element) return;
    if (element.matches("button.print-button")) {
      goal("resume_print");
      return;
    }
    if (!element.matches("a[href]")) return;
    const url = new URL(element.getAttribute("href"), location.href);
    if (url.origin === location.origin) {
      const download = url.pathname.match(/^\/texts\/manifesto\/v(\d+\.\d+(?:\.\d+)?)\/(en|ru|ja)\.md$/);
      if (download && element.hasAttribute("download")) {
        goal("manifesto_download", { version: download[1], download_language: download[2] });
      }
      const targetLanguage = element.getAttribute("hreflang");
      if (languages.includes(targetLanguage) && targetLanguage !== language) {
        goal("language_switch", { target_language: targetLanguage });
      }
      return;
    }
    const name = outboundGoals.get((url.origin + url.pathname).replace(/\/$/, ""));
    if (name) goal(name);
  }, true);

  const article = document.querySelector(".manifesto-text[data-manifesto-version]");
  if (!article) return;
  const reached = new Set();
  let scheduled = false;
  function measure() {
    scheduled = false;
    const rect = article.getBoundingClientRect();
    if (rect.height <= 0) return;
    const depth = (window.innerHeight - rect.top) / rect.height;
    for (const threshold of [50, 90]) {
      if (depth >= threshold / 100 && !reached.has(threshold)) {
        reached.add(threshold);
        goal(`manifesto_depth_${threshold}`, { version: article.dataset.manifestoVersion });
      }
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(measure);
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  schedule();
})();
