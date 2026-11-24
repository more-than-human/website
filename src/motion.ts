/**
 * Motion layer. Everything here is decoration on top of a page that already works without it:
 * with JavaScript off or `prefers-reduced-motion: reduce`, content is fully visible and static.
 *
 * - Title: the hero title is a handle. Letters widen near the pointer (Archivo's width axis), and each letter
 *   can be dragged anywhere in the hero. A dropped letter leaves an outline in its slot and a chain of dots back home,
 *   drawn like a context-puck knob chain. Without a pointer a slow wave breathes through the letters.
 * - Reveal: blocks slide in once as they enter the viewport; plate images wipe open.
 * - Scream: the manifesto's last line ramps up in four chunks as you scroll, ending on a full-bleed ink screen.
 * - Ticker: a strip of verbs that drifts, speeds up with scroll velocity, and follows scroll direction.
 * - Focus color: images take their color back while they sit in the middle of the screen (touch devices have no hover).
 * - Progress: a hairline under the header shows how far down the page you are.
 * - Portrait lens: the real photo opens as a circle from where the pointer enters the comic.
 * - Header mark: hidden while the hero title is on screen, so the name is never shown twice.
 */

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ---------------------------------------------------------------- title: steer + drag */

const WDTH_MIN = 62;
const WDTH_MAX = 125;
const WDTH_BASE = 80; // resting width while steerable; the CSS font-size is set for this
const WDTH_GAIN = 58;
const SVG = "http://www.w3.org/2000/svg";

interface Letter {
  slot: HTMLElement;
  glyph: HTMLElement;
  x: number; // drag offset from home, px
  y: number;
  tilt: number;
  homing: boolean;
  tether: SVGGElement;
}

function initTitle(title: HTMLElement, animate: boolean): void {
  const text = title.textContent!.trim();
  title.setAttribute("aria-label", text);
  title.innerHTML = [...text]
    .map((ch) =>
      ch === " "
        ? `<span class="steer-space" aria-hidden="true"> </span>`
        : `<span class="steer-ch" data-ch="${ch}" aria-hidden="true"><span class="steer-glyph">${ch}</span></span>`,
    )
    .join("");
  title.classList.add("is-steerable");

  const hero = title.closest<HTMLElement>(".hero") ?? title.parentElement!;
  const layer = document.createElementNS(SVG, "svg");
  layer.classList.add("tethers");
  layer.setAttribute("aria-hidden", "true");
  hero.append(layer);
  const reset = hero.querySelector<HTMLButtonElement>("[data-title-reset]");

  const letters: Letter[] = [...title.querySelectorAll<HTMLElement>(".steer-ch")].map((slot) => {
    const tether = document.createElementNS(SVG, "g");
    tether.classList.add("tether");
    tether.innerHTML = `<path class="tether-chain"/><circle class="tether-home" r="5"/><text class="tether-label"></text>`;
    tether.style.display = "none";
    layer.append(tether);
    return { slot, glyph: slot.firstElementChild as HTMLElement, x: 0, y: 0, tilt: 0, homing: false, tether };
  });
  const current = letters.map(() => WDTH_BASE);

  let target: number | null = null; // pointer x in px, or null for the idle wave
  let held = -1;
  let centers: number[] = [];
  const measure = () => {
    centers = letters.map(({ slot }) => {
      const r = slot.getBoundingClientRect();
      return r.left + r.width / 2;
    });
  };
  measure();
  addEventListener("resize", measure);
  document.fonts?.ready.then(measure);

  if (finePointer) {
    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse") target = e.clientX;
    });
    hero.addEventListener("pointerleave", () => (target = null));
  }

  /* -- drag */
  let grab = { dx: 0, dy: 0, minX: 0, maxX: 0, minY: 0, maxY: 0, lastX: 0 };
  letters.forEach((l, i) => {
    l.glyph.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      l.glyph.setPointerCapture(e.pointerId);
      held = i;
      l.homing = false;
      l.slot.classList.add("is-held");
      l.tether.classList.add("is-held");
      // Keep the letter inside the hero.
      const home = l.slot.getBoundingClientRect();
      const box = hero.getBoundingClientRect();
      grab = {
        dx: e.clientX - l.x,
        dy: e.clientY - l.y,
        minX: box.left - home.left,
        maxX: box.right - home.right,
        minY: box.top - home.top,
        maxY: box.bottom - home.bottom,
        lastX: e.clientX,
      };
    });
    l.glyph.addEventListener("pointermove", (e) => {
      if (held !== i) return;
      l.x = clamp(e.clientX - grab.dx, grab.minX, grab.maxX);
      l.y = clamp(e.clientY - grab.dy, grab.minY, grab.maxY);
      // Lean into the motion, like something with weight.
      l.tilt = clamp(l.tilt + (e.clientX - grab.lastX) * 0.5, -14, 14);
      grab.lastX = e.clientX;
    });
    const drop = () => {
      if (held !== i) return;
      held = -1;
      l.slot.classList.remove("is-held");
      l.tether.classList.remove("is-held");
      if (Math.hypot(l.x, l.y) < 12) l.homing = true; // dropped near home: snap back in
    };
    l.glyph.addEventListener("pointerup", drop);
    l.glyph.addEventListener("pointercancel", drop);
    l.glyph.addEventListener("dblclick", () => (l.homing = true));
  });
  reset?.addEventListener("click", () => letters.forEach((l) => (l.homing = true)));

  /* -- draw */
  const spread = () => Math.max(60, title.getBoundingClientRect().width * 0.08);

  function drawTether(l: Letter): void {
    const away = Math.hypot(l.x, l.y) > 2;
    l.slot.classList.toggle("is-away", away);
    l.tether.style.display = away ? "" : "none";
    if (!away) return;
    const box = hero.getBoundingClientRect();
    const r = l.slot.getBoundingClientRect();
    const hx = r.left + r.width / 2 - box.left;
    const hy = r.top + r.height / 2 - box.top;
    const tx = hx + l.x;
    const ty = hy + l.y;
    const [path, home, label] = l.tether.children as unknown as [SVGPathElement, SVGCircleElement, SVGTextElement];
    path.setAttribute("d", `M${hx.toFixed(1)} ${hy.toFixed(1)}L${tx.toFixed(1)} ${ty.toFixed(1)}`);
    home.setAttribute("cx", hx.toFixed(1));
    home.setAttribute("cy", hy.toFixed(1));
    // Distance label beside the middle of the chain, on the side away from the line.
    const d = Math.hypot(l.x, l.y);
    const nx = -l.y / d;
    const ny = l.x / d;
    const side = ny > 0 ? -1 : 1;
    label.setAttribute("x", ((hx + tx) / 2 + nx * 12 * side).toFixed(1));
    label.setAttribute("y", ((hy + ty) / 2 + ny * 12 * side).toFixed(1));
    label.setAttribute("text-anchor", nx * side > 0.3 ? "start" : nx * side < -0.3 ? "end" : "middle");
    label.textContent = `${Math.round(d)}px`;
  }

  function frame(now: number): void {
    const s = spread();
    // Raw influence per letter, 0..1: the held letter, else the pointer, else an idle wave.
    const g = letters.map((_, i) => {
      if (held >= 0) return i === held ? 1 : 0;
      if (target !== null) {
        const d = (centers[i] - target) / s;
        return Math.exp(-d * d);
      }
      return animate ? 0.55 * Math.max(0, Math.sin(now / 1400 - i * 0.55)) ** 3 : 0;
    });
    // Zero-sum around the base width: letters near the handle widen, the rest give way,
    // so the line keeps (roughly) its length and never overflows.
    const mean = g.reduce((a, b) => a + b, 0) / g.length;
    let anyAway = false;
    letters.forEach((l, i) => {
      const goal = clamp(WDTH_BASE + WDTH_GAIN * (g[i] - mean), WDTH_MIN, WDTH_MAX);
      current[i] += (goal - current[i]) * 0.14;
      l.slot.style.fontStretch = `${current[i].toFixed(1)}%`;

      if (l.homing) {
        l.x *= 0.82;
        l.y *= 0.82;
        if (Math.hypot(l.x, l.y) < 0.5) {
          l.x = l.y = 0;
          l.homing = false;
        }
      }
      if (i !== held) l.tilt *= 0.85;
      const lift = i === held ? 1.06 : 1;
      l.glyph.style.transform =
        l.x || l.y || Math.abs(l.tilt) > 0.05 || lift !== 1
          ? `translate(${l.x.toFixed(1)}px,${l.y.toFixed(1)}px) rotate(${l.tilt.toFixed(2)}deg) scale(${lift})`
          : "";
      drawTether(l);
      if ((l.x || l.y) && !l.homing) anyAway = true;
    });
    if (reset) reset.hidden = !anyAway;
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

/* ---------------------------------------------------------------- the scream */

const SCREAM_STEPS = [0.04, 0.22, 0.4, 0.6]; // scroll progress at which each chunk lands
const SCREAM_MAX_STRETCH = 2.6;

/** Full bleed and fit run with or without motion: the final frame always spans the screen and fills it. */
function initScreamLayout(scream: HTMLElement): void {
  const stage = scream.querySelector<HTMLElement>(".scream-stage")!;
  const lines = [...stage.querySelectorAll<HTMLElement>(".scream-line")];
  const last = lines[lines.length - 1];
  const word = last.querySelector<HTMLElement>(".scream-word")!;

  const block = stage.querySelector<HTMLElement>(".scream-block")!;

  const layout = () => {
    const parent = scream.parentElement!.getBoundingClientRect();
    scream.style.setProperty("--bleed-left", `${parent.left}px`);
    scream.style.setProperty("--bleed-w", `${document.documentElement.clientWidth}px`);
    // Tall screens get the poster turned sideways (see .is-rotated).
    stage.style.setProperty("--stage-w", `${stage.clientWidth}px`);
    stage.style.setProperty("--stage-h", `${stage.clientHeight}px`);
    stage.classList.toggle("is-rotated", stage.clientHeight > stage.clientWidth * 1.15);
    // Fit the last line to the block width; the others follow by ratio.
    const cs = getComputedStyle(block);
    const inner = block.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    stage.style.setProperty("--S", "100px");
    stage.style.setProperty("--sy", "1");
    const natural = word.offsetWidth; // layout size, ignoring the entrance transform
    const S = Math.floor((100 * inner) / natural) - 1;
    stage.style.setProperty("--S", `${S}px`);
    // Then stretch the last word up into whatever height is left, so the screen is full.
    const room = block.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const used = lines.reduce((h, l) => h + l.offsetHeight, 0);
    const wordH = last.offsetHeight;
    const sy = clamp((room - used + wordH) / wordH, 1, SCREAM_MAX_STRETCH);
    stage.style.setProperty("--sy", sy.toFixed(3));
  };
  layout();
  addEventListener("resize", layout);
  document.fonts?.ready.then(layout);
}

function initScream(scream: HTMLElement): void {
  const stage = scream.querySelector<HTMLElement>(".scream-stage")!;
  const lines = [...stage.querySelectorAll<HTMLElement>(".scream-line")];
  stage.setAttribute("aria-label", stage.textContent!.replace(/\s+/g, " ").trim());
  lines.forEach((l) => l.setAttribute("aria-hidden", "true"));
  const update = () => {
    const r = scream.getBoundingClientRect();
    const travel = r.height - stage.offsetHeight;
    const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    const progress = travel > 0 ? clamp((stickyTop - r.top) / travel, 0, 1) : 1;
    const n = SCREAM_STEPS.filter((t) => progress >= t).length;
    lines.forEach((l, i) => l.classList.toggle("is-lit", i < n));
    stage.classList.toggle("is-full", n === lines.length);
  };
  onScroll(update);
  addEventListener("resize", update);
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

/* ---------------------------------------------------------------- header mark waits until the hero title leaves */

function initMarkSwap(title: HTMLElement): void {
  const root = document.documentElement;
  new IntersectionObserver(([e]) => root.classList.toggle("title-in-view", e.isIntersecting), {
    rootMargin: "-40px 0px 0px 0px",
  }).observe(title);
}

/* ---------------------------------------------------------------- boot */

export function initMotion(): void {
  document.documentElement.classList.add("js");
  const progress = document.querySelector<HTMLElement>(".scroll-progress");
  if (progress) initProgress(progress);
  initFocusColor();
  initPortraitLens();
  const title = document.querySelector<HTMLElement>("[data-steer]");
  if (title) {
    initTitle(title, !reduced);
    initMarkSwap(title);
  }
  if (!reduced) document.documentElement.classList.add("motion");
  const scream = document.querySelector<HTMLElement>("[data-scream]");
  if (scream) initScreamLayout(scream);
  if (reduced) return;

  const ticker = document.querySelector<HTMLElement>(".ticker");
  if (ticker) initTicker(ticker);
  if (scream) initScream(scream);
  initReveal();
}
