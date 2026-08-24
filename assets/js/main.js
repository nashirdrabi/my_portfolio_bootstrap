(() => {
  "use strict";
  const header = document.querySelector("#site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#site-nav");
  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 20);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
  toggle?.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    toggle?.setAttribute("aria-expanded", "false");
  }));
  document.querySelector("#year").textContent = new Date().getFullYear();
  if (window.AOS && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.AOS.init({ duration: 700, easing: "ease-out-cubic", once: true, offset: 45 });
  } else {
    document.querySelectorAll("[data-aos]").forEach((el) => el.removeAttribute("data-aos"));
  }
})();
