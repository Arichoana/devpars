/* Nakha Studio — language toggle (de/en/fa), mobile menu, scroll reveal */
(function () {
  "use strict";
  var SUPPORTED = ["de", "en", "fa"];
  var KEY = "nakha-lang";
  var htmlEl = document.documentElement;

  function pickInitial() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved && SUPPORTED.indexOf(saved) > -1) return saved;
    var nav = (navigator.language || "de").slice(0, 2).toLowerCase();
    if (SUPPORTED.indexOf(nav) > -1) return nav;
    return "de";
  }

  function applyLang(lang) {
    if (SUPPORTED.indexOf(lang) < 0) lang = "de";
    htmlEl.setAttribute("lang", lang);
    htmlEl.setAttribute("dir", lang === "fa" ? "rtl" : "ltr");
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang-btn") === lang);
      b.setAttribute("aria-pressed", b.getAttribute("data-lang-btn") === lang);
    });
    // swap <title> and meta description if provided
    var t = document.querySelector('title[data-title-' + lang + ']');
    document.querySelectorAll("[data-t-" + lang + "]").forEach(function (el) {
      el.textContent = el.getAttribute("data-t-" + lang);
    });
  }

  function initLangSwitch() {
    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.addEventListener("click", function () { applyLang(b.getAttribute("data-lang-btn")); });
    });
  }

  function initMobileMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", function () { menu.classList.toggle("open"); });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { menu.classList.remove("open"); });
    });
  }

  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach(function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        ev.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function start() {
    applyLang(pickInitial());
    initLangSwitch();
    initMobileMenu();
    initReveal();
    initSmoothAnchors();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
