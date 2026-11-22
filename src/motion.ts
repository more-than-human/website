/**
 * Motion layer. Everything here is decoration on top of a page that already works without it:
 * with JavaScript off or `prefers-reduced-motion: reduce`, content is fully visible and static.
 *
 * - Steerable title: the hero title is a handle. Letters near the pointer widen (Archivo's width axis);
 *   without a pointer a slow wave breathes through them.
 * - Reveal: blocks slide in once as they enter the viewport; plate images wipe open.
 * - Scrub: the manifesto's last line lights up word by word as you scroll through it.
 * - Ticker: a strip of verbs that drifts, speeds up with scroll velocity, and follows scroll direction.
 * - Focus color: images take their color back while they sit in the middle of the screen (touch devices have no hover).
 * - Progress: a hairline under the header shows how far down the page you are.
 * - Portrait lens: the real photo opens as a circle from where the pointer enters the comic.
 */

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ---------------------------------------------------------------- steerable title */

const WDTH_MIN = 62;
const WDTH_MAX = 125;
const WDTH_BASE = 80; // resting width while steerable; the CSS font-size is set for this
const WDTH_GAIN = 58;

function initSteer(title: HTMLElement): void {
  const text = title.textContent!.trim();
  title.setAttribute("aria-label", text);
  title.innerHTML = [...text]
    .map((ch) => (ch === " " ? `<span class="steer-space" aria-hidden="true"> </span>` : `<span class="steer-ch" aria-hidden="true">${ch}</span>`))
    .join("");
  const letters = [...title.querySelectorAll<HTMLElement>(".steer-ch")];
  title.classList.add("is-steerable");

  let target: number | null = null; // pointer x in px, or null for the idle wave
  let centers: number[] = [];
  const current = letters.map(() => WDTH_BASE);

  const measure = () => {
    centers = letters.map((l) => {
      const r = l.getBoundingClientRect();
      return r.left + r.width / 2;
    });
  };
  measure();
  addEventListener("resize", measure);
  document.fonts?.ready.then(measure);

  if (finePointer) {
    const hero = title.closest<HTMLElement>(".hero") ?? title;
    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse") target = e.clientX;
    });
    hero.addEventListener("pointerleave", () => (target = null));
  }

  const spread = () => Math.max(60, title.getBoundingClientRect().width * 0.08);

  function frame(now: number): void {
    const s = spread();
    // Raw influence per letter, 0..1.
    const g = letters.map((_, i) => {
      if (target !== null) {
        const d = (centers[i] - target) / s;
        return Math.exp(-d * d);
      }
      // Idle: a slow wave rolls through the word.
      return 0.55 * Math.max(0, Math.sin(now / 1400 - i * 0.55)) ** 3;
    });
    // Zero-sum around the base width: letters near the handle widen, the rest give way,
    // so the line keeps (roughly) its length and never overflows.
    const mean = g.reduce((a, b) => a + b, 0) / g.length;
    letters.forEach((l, i) => {
      const goal = clamp(WDTH_BASE + WDTH_GAIN * (g[i] - mean), WDTH_MIN, WDTH_MAX);
      current[i] += (goal - current[i]) * 0.14;
      l.style.fontStretch = `${current[i].toFixed(1)}%`;
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // Letter widths change constantly, so re-measure centers on a slow cadence while the pointer is away.
  setInterval(() => target === null && measure(), 1500);
}

/* ---------------------------------------------------------------- reveal on scroll */

const REVEAL = [
  ".section-label",
  ".section-body > .lead",
  ".section-body > .serif",
  ".section-body > h3.label",
  ".manifesto li",
  ".focus",
  ".values > div",
  ".tags",
  ".filter",
  ".update",
  ".prototype",
  ".people-group",
  ".person",
  ".join-cta",
  ".section-join .section-body > p",
].join(",");

function initReveal(): void {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  const observe = () => {
    document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => {
      if (el.classList.contains("reveal")) return;
      // Stagger siblings that enter together (people grid, values, manifesto lines).
      const i = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
      el.style.setProperty("--i", String(i % 6));
      el.classList.add("reveal");
      io.observe(el);
    });
  };
  // Updates hidden by the filter are still observed, so they reveal when the filter shows them again.
  observe();
}

/* ---------------------------------------------------------------- scrubbed manifesto line */

function initScrub(el: HTMLElement): void {
  const words = el.textContent!.trim().split(/\s+/);
  el.setAttribute("aria-label", el.textContent!.trim());
  el.innerHTML = words.map((w) => `<span class="scrub-word" aria-hidden="true">${w}</span>`).join(" ");
  const spans = [...el.querySelectorAll<HTMLElement>(".scrub-word")];
  const update = () => {
    const r = el.getBoundingClientRect();
    const vh = innerHeight;
    // 0 when the line enters the bottom of the screen, 1 when it reaches 35% from the top.
    const p = clamp((vh - r.top) / (vh * 0.65), 0, 1);
    const lit = Math.round(p * spans.length);
    spans.forEach((s, i) => s.classList.toggle("is-lit", i < lit));
  };
  onScroll(update);
  update();
}

/* ---------------------------------------------------------------- ticker */

function initTicker(ticker: HTMLElement): void {
  const track = ticker.querySelector<HTMLElement>(".ticker-track")!;
  // Duplicate the run so the loop is seamless.
  track.innerHTML += track.innerHTML;
  track.querySelectorAll("span").forEach((s, i) => i >= track.children.length / 2 && s.setAttribute("aria-hidden", "true"));

  let x = 0;
  let dir = -1;
  let boost = 0;
  let lastY = scrollY;
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(ticker);

  onScroll(() => {
    const dy = scrollY - lastY;
    lastY = scrollY;
    if (dy !== 0) dir = dy > 0 ? -1 : 1;
    boost = clamp(boost + Math.abs(dy) * 0.12, 0, 14);
  });

  let last = 0;
  function frame(now: number): void {
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    if (visible) {
      const half = track.scrollWidth / 2;
      x += dir * (0.045 + boost * 0.02) * dt;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    }
    boost *= 0.92;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------------------------------------------------------------- images take color in the middle of the screen */

function initFocusColor(): void {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle("in-focus", e.isIntersecting)),
    { rootMargin: "-35% 0px -35% 0px" },
  );
  document.querySelectorAll(".frame, .thumb").forEach((el) => io.observe(el));
}

/* ---------------------------------------------------------------- portraits: photo opens from where the pointer enters */

function initPortraitLens(): void {
  document.addEventListener("pointerover", (e) => {
    const portrait = (e.target as Element).closest<HTMLElement>(".portrait");
    if (!portrait) return;
    const r = portrait.getBoundingClientRect();
    portrait.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(0)}%`);
    portrait.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(0)}%`);
  });
}

/* ---------------------------------------------------------------- page progress */

function initProgress(bar: HTMLElement): void {
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max, 0, 1) : 0})`;
  };
  onScroll(update);
  addEventListener("resize", update);
  update();
}

/* ---------------------------------------------------------------- shared scroll loop */

const scrollHandlers: (() => void)[] = [];
let queued = false;
function onScroll(fn: () => void): void {
  if (!scrollHandlers.length) {
    addEventListener(
      "scroll",
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          scrollHandlers.forEach((h) => h());
        });
      },
      { passive: true },
    );
  }
  scrollHandlers.push(fn);
}

/* ---------------------------------------------------------------- boot */

export function initMotion(): void {
  const progress = document.querySelector<HTMLElement>(".scroll-progress");
  if (progress) initProgress(progress);
  initFocusColor();
  initPortraitLens();
  if (reduced) return;

  document.documentElement.classList.add("motion");
  const title = document.querySelector<HTMLElement>("[data-steer]");
  if (title) initSteer(title);
  const ticker = document.querySelector<HTMLElement>(".ticker");
  if (ticker) initTicker(ticker);
  document.querySelectorAll<HTMLElement>("[data-scrub]").forEach(initScrub);
  initReveal();
}
