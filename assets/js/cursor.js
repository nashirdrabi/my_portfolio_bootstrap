(() => {
  "use strict";
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 801px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  let layer;
  let ring;
  let label;
  let trail = [];
  let frame = 0;
  let active = false;
  let hoverDirty = false;
  let target = { x: 0, y: 0 };
  let ringPoint = { x: 0, y: 0 };
  let surface;
  let surfaceBox;
  let magnet;
  let magnetBox;
  let pointerTarget;
  const ripples = new Set();
  const interactive = "a, button, input, select, textarea, [role='button']";
  const eligible = () => finePointer.matches && !reducedMotion.matches && !document.hidden && typeof Element.prototype.animate === "function";

  function createLayer() {
    if (layer) return;
    layer = document.createElement("div");
    layer.className = "cursor-effects";
    layer.setAttribute("aria-hidden", "true");
    ring = document.createElement("div");
    ring.className = "cursor-ring";
    label = document.createElement("span");
    label.textContent = "↗";
    ring.append(label);
    layer.append(ring);
    trail = Array.from({ length: 6 }, (_, index) => {
      const element = document.createElement("span");
      element.className = "cursor-trail";
      element.style.setProperty("--trail-size", `${Math.max(3, 8 - index)}px`);
      element.style.setProperty("--trail-opacity", String(.65 - index * .085));
      layer.append(element);
      return { element, x: target.x, y: target.y };
    });
    document.body.append(layer);
  }

  function resetSurface() {
    if (!surface) return;
    surface.classList.remove("spotlight-active");
    for (const name of ["--spot-x", "--spot-y", "--card-rx", "--card-ry"]) surface.style.removeProperty(name);
    surface = null;
    surfaceBox = null;
  }

  function resetMagnet() {
    magnet?.style.removeProperty("--magnet-x");
    magnet?.style.removeProperty("--magnet-y");
    magnet = null;
    magnetBox = null;
  }

  function stop() {
    active = false;
    hoverDirty = false;
    cancelAnimationFrame(frame);
    frame = 0;
    root.classList.remove("cursor-active");
    resetSurface();
    resetMagnet();
    ripples.forEach(({ animation, element }) => { animation.cancel(); element.remove(); });
    ripples.clear();
  }

  function updateHover() {
    const nextSurface = pointerTarget?.closest(".project-card, .featured-project, .service-card, .hero, .contact-section");
    if (surface !== nextSurface) {
      resetSurface();
      surface = nextSurface;
      if (surface) {
        surfaceBox = surface.getBoundingClientRect();
        surface.classList.add("spotlight-active");
      }
    }
    if (surface && surfaceBox.width && surfaceBox.height) {
      const x = target.x - surfaceBox.left, y = target.y - surfaceBox.top;
      surface.style.setProperty("--spot-x", `${x}px`);
      surface.style.setProperty("--spot-y", `${y}px`);
      if (surface.matches(".project-card")) {
        surface.style.setProperty("--card-rx", `${Math.max(-3, Math.min(3, (.5 - y / surfaceBox.height) * 6))}deg`);
        surface.style.setProperty("--card-ry", `${Math.max(-3, Math.min(3, (x / surfaceBox.width - .5) * 6))}deg`);
      }
    }
    const nextMagnet = pointerTarget?.closest(".button, .nav-cta");
    if (magnet !== nextMagnet) {
      resetMagnet();
      magnet = nextMagnet;
      if (magnet) magnetBox = magnet.getBoundingClientRect();
    }
    if (magnet && magnetBox.width && magnetBox.height) {
      const x = (target.x - magnetBox.left - magnetBox.width / 2) * .12;
      const y = (target.y - magnetBox.top - magnetBox.height / 2) * .18;
      magnet.style.setProperty("--magnet-x", `${Math.max(-7, Math.min(7, x))}px`);
      magnet.style.setProperty("--magnet-y", `${Math.max(-5, Math.min(5, y))}px`);
    }
    ring.classList.toggle("cursor-link", !!pointerTarget?.closest(interactive));
    ring.classList.toggle("cursor-project", !!pointerTarget?.closest(".project-visual"));
  }

  function render() {
    frame = 0;
    if (!active || !eligible()) { stop(); return; }
    if (hoverDirty) { updateHover(); hoverDirty = false; }
    ringPoint.x += (target.x - ringPoint.x) * .22;
    ringPoint.y += (target.y - ringPoint.y) * .22;
    ring.style.transform = `translate3d(${ringPoint.x}px, ${ringPoint.y}px, 0) translate(-50%, -50%)`;
    let previous = target;
    let distance = Math.abs(target.x - ringPoint.x) + Math.abs(target.y - ringPoint.y);
    trail.forEach(point => {
      point.x += (previous.x - point.x) * .38;
      point.y += (previous.y - point.y) * .38;
      point.element.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
      distance += Math.abs(previous.x - point.x) + Math.abs(previous.y - point.y);
      previous = point;
    });
    // The loop stops once the trail settles; stationary pointers do no work.
    if (distance > .35) frame = requestAnimationFrame(render);
  }

  function move(event) {
    if (event.pointerType !== "mouse" || !eligible()) { stop(); return; }
    target = { x: event.clientX, y: event.clientY };
    pointerTarget = event.target instanceof Element ? event.target : null;
    // Preserve native text-selection and form-control cursors.
    if (pointerTarget?.closest("input, textarea, select, [contenteditable='true']")) { stop(); return; }
    createLayer();
    if (!active) {
      ringPoint = { ...target };
      trail.forEach(point => { point.x = target.x; point.y = target.y; });
      active = true;
      root.classList.add("cursor-active");
    }
    hoverDirty = true;
    if (!frame) frame = requestAnimationFrame(render);
  }

  function ripple(event) {
    if (event.pointerType !== "mouse" || event.button !== 0 || !eligible()) return;
    if (!(event.target instanceof Element) || !event.target.closest("a, button")) return;
    createLayer();
    if (ripples.size >= 4) return;
    const element = document.createElement("span");
    element.className = "cursor-ripple";
    element.style.left = `${event.clientX}px`;
    element.style.top = `${event.clientY}px`;
    layer.append(element);
    const animation = element.animate([
      { transform: "translate(-50%, -50%) scale(.35)", opacity: .8 },
      { transform: "translate(-50%, -50%) scale(2.5)", opacity: 0 }
    ], { duration: 550, easing: "cubic-bezier(.16, 1, .3, 1)" });
    const entry = { element, animation };
    ripples.add(entry);
    const cleanup = () => { element.remove(); ripples.delete(entry); };
    animation.finished.then(cleanup, cleanup);
  }

  document.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerdown", ripple, { passive: true });
  document.documentElement.addEventListener("pointerleave", stop);
  document.addEventListener("keydown", event => { if (event.key === "Tab" || event.key === "Escape") stop(); });
  document.addEventListener("visibilitychange", stop);
  window.addEventListener("blur", stop);
  window.addEventListener("scroll", stop, { passive: true });
  window.addEventListener("resize", stop, { passive: true });
  finePointer.addEventListener("change", stop);
  reducedMotion.addEventListener("change", stop);
})();
