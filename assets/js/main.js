(() => {
  "use strict";
  const header = document.querySelector("#site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#site-nav");
  const mobile = window.matchMedia("(max-width: 800px)");

  function setMenu(open, restoreFocus = false) {
    document.body.classList.toggle("nav-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
    toggle?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (restoreFocus) toggle?.focus();
  }

  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 20);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
  toggle?.addEventListener("click", () => setMenu(!document.body.classList.contains("nav-open")));
  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && document.body.classList.contains("nav-open")) setMenu(false, true);
  });
  document.addEventListener("click", event => {
    if (!header?.contains(event.target)) setMenu(false);
  });
  mobile.addEventListener("change", () => setMenu(false));

  if ("IntersectionObserver" in window) {
    const links = [...(nav?.querySelectorAll("a") || [])];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }
    }, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
    document.querySelectorAll("main > section[id]").forEach(section => observer.observe(section));
  }
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
