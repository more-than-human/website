/**
 * "Now showing" window on the front page.
 * - Tabs follow the ARIA tabs pattern (click, ←/→, Home/End).
 * - Only the active panel runs: iframes get their src, videos play. Inactive panels are unloaded.
 * - Auto-advances like a gallery screen loop, with a progress bar on the active tab. It stops for good as soon as
 *   the visitor interacts with the window, and pauses while it is off screen, hovered, or the tab is hidden.
 * - A "live" demo shows a poster and loads the real thing only when the visitor clicks Launch.
 */

const DWELL_MS = 9000;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

export function initShowcase(root: HTMLElement): void {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = tabs.map((t) => root.querySelector<HTMLElement>(`#${t.getAttribute("aria-controls")}`)!);
  let active = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
  if (active < 0) active = 0;

  let auto = !reducedMotion.matches && tabs.length > 1;
  let elapsed = 0;
  let last = 0;
  let onScreen = false;
  let hovering = false;

  function run(panel: HTMLElement, on: boolean): void {
    const frame = panel.querySelector<HTMLIFrameElement>("iframe[data-src]");
    if (frame) {
      if (on && !frame.src) frame.src = frame.dataset.src!;
      if (!on) frame.removeAttribute("src");
    }
    const video = panel.querySelector<HTMLVideoElement>("video");
    if (video) {
      if (on && onScreen) video.play().catch(() => {});
      else video.pause();
    }
    // A launched live demo is unloaded when the visitor moves on; the poster comes back.
    if (!on) panel.querySelector(".showcase-live")?.remove();
  }

  function select(i: number, { focus = false } = {}): void {
    active = (i + tabs.length) % tabs.length;
    tabs.forEach((t, j) => {
      const on = j === active;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      t.style.setProperty("--progress", "0");
      panels[j].hidden = !on;
      run(panels[j], on);
    });
    if (focus) tabs[active].focus();
    elapsed = 0;
  }

  function stopAuto(): void {
    if (!auto) return;
    auto = false;
    root.classList.add("is-manual");
    tabs.forEach((t) => t.style.setProperty("--progress", "0"));
  }

  tabs.forEach((t, i) =>
    t.addEventListener("click", () => {
      stopAuto();
      select(i);
    }),
  );

  root.querySelector('[role="tablist"]')!.addEventListener("keydown", (e) => {
    const k = (e as KeyboardEvent).key;
    const next = k === "ArrowRight" ? active + 1 : k === "ArrowLeft" ? active - 1 : k === "Home" ? 0 : k === "End" ? tabs.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    stopAuto();
    select(next, { focus: true });
  });

  root.addEventListener("click", (e) => {
    const button = (e.target as Element).closest<HTMLButtonElement>("[data-launch]");
    if (!button) return;
    stopAuto();
    const frame = document.createElement("iframe");
    frame.className = "showcase-live";
    frame.src = button.dataset.launch!;
    frame.title = `${button.dataset.title} (live)`;
    frame.allow = "autoplay; fullscreen";
    button.closest(".window-screen")!.append(frame);
    frame.focus();
  });

  // Any deliberate interaction inside the window ends the auto loop.
  root.addEventListener("pointerdown", stopAuto);
  root.addEventListener("pointerenter", () => (hovering = true));
  root.addEventListener("pointerleave", () => (hovering = false));
  root.addEventListener("focusin", (e) => {
    if ((e.target as Element).matches("[role=tab], a, button")) stopAuto();
  });

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    const video = panels[active].querySelector("video");
    if (video) {
      if (onScreen) video.play().catch(() => {});
      else video.pause();
    }
  }).observe(root);

  function tick(now: number): void {
    const dt = last ? now - last : 0;
    last = now;
    if (auto && onScreen && !hovering && !document.hidden) {
      elapsed += dt;
      tabs[active].style.setProperty("--progress", String(Math.min(1, elapsed / DWELL_MS)));
      if (elapsed >= DWELL_MS) select(active + 1);
    }
    if (auto) requestAnimationFrame(tick);
  }

  select(active);
  if (auto) requestAnimationFrame(tick);
  else root.classList.add("is-manual");
}
