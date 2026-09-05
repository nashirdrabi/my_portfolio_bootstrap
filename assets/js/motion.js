(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 801px)");
  const root = document.documentElement;
  const control = document.querySelector(".motion-toggle");
  const progress = document.querySelector(".reading-progress");
  const portrait = document.querySelector(".hero-portrait");
  const animations = new Set();
  const frames = new Set();
  let observer;
  let revealObserver;
  let enabled = false;
  let paused = false;
  let scrollFrame = 0;
  let pointerFrame = 0;
  let documentHeight = 1;
  let heroVisible = true;
  const revealed = new WeakSet();
  const counted = new WeakSet();
  try { paused = localStorage.getItem("portfolio-motion") === "paused"; } catch { /* Storage is optional. */ }

  function animate(element, keyframes, options = {}) {
    if (!enabled || !element) return;
    const animation = element.animate(keyframes, {
      duration: 800, easing: "cubic-bezier(.16, 1, .3, 1)", ...options
    });
    animations.add(animation);
    const done = () => animations.delete(animation);
    animation.finished.then(done, done);
  }

  function measure() {
    documentHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    updateScroll();
  }

  function updateScroll() {
    scrollFrame = 0;
    if (!enabled) return;
    if (progress) progress.style.transform = `scaleX(${Math.min(1, Math.max(0, window.scrollY / documentHeight))})`;
    if (portrait && heroVisible && pointer.matches) {
      portrait.style.setProperty("--portrait-scroll", `${Math.min(window.scrollY * .055, 24)}px`);
    }
  }

  function requestScroll() {
    if (enabled && !scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }

  function count(element) {
    if (counted.has(element)) return;
    counted.add(element);
    const target = Number(element.dataset.count);
    let start;
    function tick(now) {
      if (!enabled) { element.textContent = String(target); return; }
      start ??= now;
      const fraction = Math.min((now - start) / 1100, 1);
      element.textContent = String(Math.round(target * (1 - Math.pow(1 - fraction, 3))));
      if (fraction < 1) {
        const id = requestAnimationFrame(time => { frames.delete(id); tick(time); });
        frames.add(id);
      }
    }
    tick(performance.now());
  }

  function entrance() {
    const heroElements = document.querySelectorAll(".hero-topline, .hero-copy .eyebrow, .hero-line, .hero-lede, .hero-actions, .hero-proof > div, .scroll-cue");
    heroElements.forEach((element, index) => {
      if (revealed.has(element)) return;
      revealed.add(element);
      animate(element, [{ opacity: 0, transform: "translateY(28px)" }, { opacity: 1, transform: "translateY(0)" }], { delay: index * 75, fill: "backwards", duration: 950 });
    });
    const frame = document.querySelector(".portrait-frame");
    if (frame && !revealed.has(frame)) {
      revealed.add(frame);
      animate(frame, [{ opacity: 0, transform: "translateY(28px) scale(.96)" }, { opacity: 1, transform: "translateY(0) scale(1)" }], { delay: 180, fill: "backwards", duration: 1200 });
    }
  }

  function watchReveals() {
    if (!("IntersectionObserver" in window)) return;
    const elements = document.querySelectorAll(".section-heading > *, .featured-project, .more-work-heading > *, .project-card, .service-card, .about-photo, .about-copy > *, .experience-intro > *, .timeline-item, .contact-inner > *, .site-footer .shell > *");
    revealObserver = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => entry.isIntersecting);
      entering.forEach((entry, index) => {
        revealObserver.unobserve(entry.target);
        if (revealed.has(entry.target)) return;
        revealed.add(entry.target);
        // Leave focused content immediately visible when navigating by keyboard.
        if (entry.target.contains(document.activeElement)) return;
        animate(entry.target, [{ opacity: 0, transform: "translateY(32px)" }, { opacity: 1, transform: "translateY(0)" }], { delay: Math.min(index * 70, 210), fill: "backwards" });
      });
    }, { threshold: .06, rootMargin: "0px 0px -24px 0px" });
    elements.forEach(element => { if (!revealed.has(element)) revealObserver.observe(element); });
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.target.matches(".hero")) { heroVisible = entry.isIntersecting; return; }
        if (entry.isIntersecting) { count(entry.target); observer.unobserve(entry.target); }
      });
    }, { threshold: .1 });
    document.querySelectorAll(".stat-number, .hero").forEach(element => observer.observe(element));
  }

  function resetPortrait() {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    portrait?.style.removeProperty("--portrait-x");
    portrait?.style.removeProperty("--portrait-y");
  }

  portrait?.addEventListener("pointermove", event => {
    if (!enabled || !pointer.matches) return;
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    const x = event.clientX, y = event.clientY;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      const box = portrait.getBoundingClientRect();
      portrait.style.setProperty("--portrait-x", `${((x - box.left) / box.width - .5) * 5}deg`);
      portrait.style.setProperty("--portrait-y", `${((y - box.top) / box.height - .5) * -5}deg`);
    });
  });
  portrait?.addEventListener("pointerleave", resetPortrait);
  pointer.addEventListener("change", () => {
    resetPortrait();
    portrait?.style.removeProperty("--portrait-scroll");
  });

  function sync() {
    enabled = !reduce.matches && !paused && typeof Element.prototype.animate === "function";
    root.classList.toggle("motion-enabled", enabled);
    if (control) {
      control.hidden = reduce.matches || typeof Element.prototype.animate !== "function";
      control.setAttribute("aria-pressed", String(paused));
      control.querySelector("span").textContent = paused ? "Resume motion" : "Pause motion";
      control.querySelector("i").className = paused ? "bi bi-play-fill" : "bi bi-pause-fill";
    }
    revealObserver?.disconnect();
    observer?.disconnect();
    if (enabled) {
      entrance();
      watchReveals();
      measure();
    } else {
      animations.forEach(animation => animation.cancel());
      animations.clear();
      frames.forEach(id => cancelAnimationFrame(id));
      frames.clear();
      cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
      resetPortrait();
      portrait?.style.removeProperty("--portrait-scroll");
      document.querySelectorAll(".stat-number").forEach(element => { element.textContent = element.dataset.count; });
    }
  }

  control?.addEventListener("click", () => {
    paused = !paused;
    try { localStorage.setItem("portfolio-motion", paused ? "paused" : "enabled"); } catch { /* Preference remains valid for this page. */ }
    sync();
  });
  reduce.addEventListener("change", sync);
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("load", measure, { once: true });
  document.addEventListener("visibilitychange", () => root.classList.toggle("motion-background", document.hidden));
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(document.body);
  sync();
})();
