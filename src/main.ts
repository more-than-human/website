import "./style.css";
import { BASE } from "./base.ts";
import { filterableProjects, people, personById, projectBySlug, projects, showcase, updateCount, updates } from "./content.ts";
import { initMotion } from "./motion.ts";
import { chip, renderNotFound, renderPeople, renderProfile, renderPrototype, renderShowcase, renderUpdate } from "./render.ts";
import { initShowcase } from "./showcase.ts";

const SITE_TITLE = document.title;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const slot = (name: string) => $(`[data-slot="${name}"]`);
const homeView = $("#home");
const pageView = $("#page");

/* ---------------------------------------------------------------- home sections */

function renderHome(): void {
  slot("showcase").innerHTML = renderShowcase(showcase);
  initShowcase($("[data-showcase]"));

  const chips = [chip("", "All", updates.length), ...filterableProjects.map((p) => chip(p.slug, p.label, updateCount(p.slug)))]
    .map((c) => `<li>${c}</li>`)
    .join("");
  slot("updates").innerHTML = `
    <nav class="filter" aria-label="Filter updates by project"><ul>${chips}</ul></nav>
    <p class="filter-status" role="status" aria-live="polite"></p>
    <ol class="update-list">${updates.map(renderUpdate).join("")}</ol>`;

  slot("prototypes").innerHTML = `<ul class="prototype-list">${projects
    .filter((p) => p.prototype)
    .map((p) => renderPrototype(p, filterableProjects.includes(p)))
    .join("")}</ul>`;

  slot("people").innerHTML = renderPeople(people);
}

function applyFilter(): void {
  const slug = new URLSearchParams(location.search).get("project") ?? "";
  const known = !slug || projectBySlug.has(slug);
  let shown = 0;
  for (const item of document.querySelectorAll<HTMLElement>(".update")) {
    const match = !slug || !known || item.dataset.projects!.split(" ").includes(slug);
    item.hidden = !match;
    if (match) shown++;
  }
  for (const c of document.querySelectorAll<HTMLElement>(".chip")) {
    if (c.dataset.project === (known ? slug : "")) c.setAttribute("aria-current", "true");
    else c.removeAttribute("aria-current");
  }
  const status = $(".filter-status");
  if (!known) status.textContent = `No project called "${slug}". Showing all ${updates.length} updates.`;
  else if (slug) status.textContent = `Showing ${shown} of ${updates.length} updates tagged ${projectBySlug.get(slug)!.label}.`;
  else status.textContent = `Showing all ${updates.length} updates.`;
}

/* ---------------------------------------------------------------- router */

type Route = { view: "home" } | { view: "person"; id: string } | { view: "missing"; path: string };

function parseRoute(): Route {
  const path = location.pathname.startsWith(BASE) ? location.pathname.slice(BASE.length) : location.pathname;
  if (path === "" || path === "index.html") return { view: "home" };
  const person = path.match(/^people\/([^/]+)\/?$/);
  if (person) return { view: "person", id: decodeURIComponent(person[1]) };
  return { view: "missing", path };
}

let currentView: Route["view"] | null = null;

function route({ scroll = true } = {}): void {
  const r = parseRoute();
  const viewChanged = r.view !== currentView;
  currentView = r.view;
  homeView.hidden = r.view !== "home";
  pageView.hidden = r.view === "home";
  document.body.dataset.view = r.view;

  if (r.view === "home") {
    document.title = SITE_TITLE;
    applyFilter();
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (scroll && target) {
      target.scrollIntoView();
      land(target);
    }
    else if (scroll && viewChanged) scrollTo(0, 0);
  } else {
    const person = r.view === "person" ? personById.get(r.id) : undefined;
    pageView.innerHTML = person ? renderProfile(person) : renderNotFound(r.view === "person" ? r.id : r.path);
    document.title = person ? `${person.name} · Tangible AI Working Group` : `Not found · Tangible AI Working Group`;
    scrollTo(0, 0);
    // Move focus to the new heading so screen readers announce the page change.
    const heading = pageView.querySelector<HTMLElement>("h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }
  syncActiveSection();
}

/** Brief "selected" blink on the section the reader just jumped to. */
function land(target: HTMLElement): void {
  const section = target.closest<HTMLElement>(".section");
  if (!section) return;
  section.classList.remove("is-landed");
  void section.offsetWidth; // restart the animation if the same section is selected twice
  section.classList.add("is-landed");
  section.addEventListener("animationend", () => section.classList.remove("is-landed"), { once: true });
}

// Plain in-page anchors (handled natively by the browser) land too.
window.addEventListener("hashchange", () => {
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) land(target);
});

function isInternal(a: HTMLAnchorElement): boolean {
  if (a.target || a.hasAttribute("download") || a.origin !== location.origin) return false;
  if (!a.pathname.startsWith(BASE) || a.pathname.startsWith(`${BASE}assets/`)) return false;
  return true;
}

document.addEventListener("click", (e) => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  const a = (e.target as Element).closest<HTMLAnchorElement>("a[href]");
  if (!a || !isInternal(a)) return;

  const url = new URL(a.href);
  const samePage = url.pathname === location.pathname && url.search === location.search;
  if (samePage && currentView === "home" && !a.dataset.project) return; // plain in-page anchor: let the browser scroll

  e.preventDefault();
  history.pushState(null, "", url);
  // Chips in the filter bar keep the reader in place instead of jumping to the section top.
  route({ scroll: !a.closest(".filter") });
});

window.addEventListener("popstate", () => route());

/* ---------------------------------------------------------------- nav: active section, number keys */

const navLinks = [...document.querySelectorAll<HTMLAnchorElement>(".site-nav a")];
const sectionIds = navLinks.map((a) => a.hash.slice(1));
let activeSection = "";

/** The current section is the last one whose top has passed a line just below the header. */
function syncActiveSection(): void {
  if (currentView !== "home") return;
  const line = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 8;
  let id = "top";
  for (const sid of sectionIds) {
    if (document.getElementById(sid)!.getBoundingClientRect().top <= line) id = sid;
  }
  if (id === activeSection) return;
  activeSection = id;
  for (const a of navLinks) {
    if (a.hash === `#${id}`) a.setAttribute("aria-current", "location");
    else a.removeAttribute("aria-current");
  }
}

let scrollQueued = false;
addEventListener(
  "scroll",
  () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      syncActiveSection();
    });
  },
  { passive: true },
);

document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
  if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
  const index = Number(e.key) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= sectionIds.length) return;
  const url = new URL(navLinks[index].href);
  if (currentView === "home") url.search = location.search; // keep the active filter
  history.pushState(null, "", url);
  route();
});

/* ---------------------------------------------------------------- boot */

renderHome();
route();
initMotion();
