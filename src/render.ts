import { homeHref, personHref } from "./base.ts";
import { creditsFor, projectBySlug, type Person, type Project, type ShowcaseItem, type Update } from "./content.ts";
import { escapeHtml as esc, externalAttrs } from "./markdown.ts";

/** Shared HTML renderers, used by the site (main.ts) and the style sink (style-sink.ts). */

export function filterHref(slug: string): string {
  return slug ? `${homeHref()}?project=${encodeURIComponent(slug)}#updates` : homeHref("updates");
}

export function projectTag(slug: string): string {
  const label = projectBySlug.get(slug)?.label ?? slug;
  return `<a class="tag" href="${filterHref(slug)}" data-project="${esc(slug)}">${esc(label)}</a>`;
}

export function chip(slug: string, label: string, count: number): string {
  return `<a class="chip" href="${filterHref(slug)}" data-project="${esc(slug)}">${esc(label)}<span class="chip-count">${count}</span></a>`;
}

function media(u: Update): string {
  if (u.video) {
    // `image` doubles as the poster frame when an update has a video.
    const poster = u.image ? ` poster="${esc(u.image)}"` : "";
    return `<video class="media" src="${esc(u.video)}"${poster} controls muted loop playsinline preload="metadata"></video>`;
  }
  if (u.image) {
    return `<img class="media" src="${esc(u.image)}" alt="${esc(u.imageAlt ?? "")}" loading="lazy" />`;
  }
  return "";
}

export function renderUpdate(u: Update): string {
  const m = media(u);
  const credit = u.credit ? `<span class="credit">by ${esc(u.credit)}</span>` : "";
  return `<li class="update" data-projects="${esc(u.projects.join(" "))}" id="update-${esc(u.id)}">
    <article class="update-row">
      <p class="update-date">${u.date ? `<time datetime="${esc(u.date)}">${esc(u.date)}</time>` : `<span class="undated">----</span>`}</p>
      <div class="update-body">
        ${u.projects.length ? `<p class="tag-row">${u.projects.map(projectTag).join("")}</p>` : ""}
        <h3 class="update-title">${esc(u.title)}</h3>
        <div class="prose">${u.html}</div>
        ${m ? `<figure class="frame">${m}${credit ? `<figcaption>${credit}</figcaption>` : ""}</figure>` : credit ? `<p>${credit}</p>` : ""}
        ${u.link ? `<p class="update-link"><a class="arrow-link" href="${esc(u.link)}"${externalAttrs(u.link)}>${esc(u.linkLabel ?? "Open")} ↗</a></p>` : ""}
      </div>
    </article>
  </li>`;
}

export function renderPrototype(p: Project, hasUpdates: boolean): string {
  const proto = p.prototype!;
  const thumb = proto.thumbnail
    ? `<img class="media" src="${esc(proto.thumbnail)}" alt="${esc(proto.thumbnailAlt ?? "")}" loading="lazy" />`
    : `<div class="thumb-placeholder" aria-hidden="true">${esc(p.label)}</div>`;
  const links = [
    proto.link ? `<a class="arrow-link" href="${esc(proto.link)}"${externalAttrs(proto.link)}>Try it ↗</a>` : "",
    hasUpdates ? `<a class="arrow-link" href="${filterHref(p.slug)}" data-project="${esc(p.slug)}">Updates →</a>` : "",
  ].filter(Boolean);
  const meta = [p.started ? `since ${esc(p.started)}` : "", proto.credit ? `by ${esc(proto.credit)}` : ""].filter(Boolean);
  return `<li class="prototype">
    <article class="card">
      <div class="thumb">${thumb}</div>
      <div class="card-body">
        <h3 class="card-title">${esc(p.label)}</h3>
        <p>${esc(proto.summary)}</p>
        ${meta.length ? `<p class="credit">${meta.join(" · ")}</p>` : ""}
        ${links.length ? `<p class="card-links">${links.join("")}</p>` : ""}
      </div>
    </article>
  </li>`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3);
}

/** Comic portraits live next to the photo: …/people/x.webp → …/people/comic/x.webp (see scripts/comic.py). */
function comicPath(photo: string): string {
  return photo.replace(/\/([^/]+)\.\w+$/, "/comic/$1.webp");
}

/** Comic drawing at rest; the real photo fades in on hover or focus. */
function portrait(m: Person, eager = false): string {
  if (!m.photo) return `<span class="portrait portrait-initials" aria-hidden="true"><span>${esc(initials(m.name))}</span></span>`;
  const loading = eager ? "" : ' loading="lazy"';
  return `<span class="portrait">
    <img class="portrait-comic" src="${esc(comicPath(m.photo))}" alt=""${loading} />
    <img class="portrait-photo" src="${esc(m.photo)}" alt=""${loading} />
  </span>`;
}

export function renderPerson(m: Person): string {
  return `<li class="person">
    <a class="person-card" href="${personHref(m.id)}" data-route>
      ${portrait(m)}
      <span class="person-text">
        <span class="person-name">${esc(m.name)}</span>
        <span class="person-role">${esc(m.role)}</span>
      </span>
    </a>
  </li>`;
}

function externalLabel(url: string): string {
  return url.includes("tangible.media.mit.edu") ? "TMG profile" : "Website";
}

export function renderProfile(m: Person): string {
  const credits = creditsFor(m);
  const creditItems = [
    ...credits.prototypes.map(
      (p) =>
        `<li><span class="credit-kind">prototype</span><a href="${homeHref("prototypes")}">${esc(p.label)}</a></li>`,
    ),
    ...credits.updates.map(
      (u) =>
        `<li><span class="credit-kind">${u.date ? esc(u.date) : "update"}</span><a href="${homeHref(`update-${u.id}`)}">${esc(u.title)}</a></li>`,
    ),
  ];
  return `<article class="profile" aria-labelledby="profile-name">
    <p class="profile-back"><a class="arrow-link" href="${homeHref("people")}" data-route>← All people</a></p>
    <div class="profile-grid">
      <div class="profile-portrait">${portrait(m, true)}</div>
      <div class="profile-info">
        <p class="label">${esc(m.group ?? "People")}</p>
        <h1 id="profile-name" class="profile-name">${esc(m.name)}</h1>
        <p class="profile-role">${esc(m.role)}</p>
        <dl class="profile-facts">
          <div><dt>Working group</dt><dd>Tangible AI Working Group</dd></div>
          <div><dt>Lab</dt><dd><a href="https://tangible.media.mit.edu/" target="_blank" rel="noopener">Tangible Media Group</a>, MIT Media Lab</dd></div>
          ${m.link ? `<div><dt>Elsewhere</dt><dd><a href="${esc(m.link)}" target="_blank" rel="noopener">${externalLabel(m.link)} ↗</a></dd></div>` : ""}
        </dl>
        ${
          creditItems.length
            ? `<h2 class="label">Credits</h2><ul class="credit-list">${creditItems.join("")}</ul>`
            : ""
        }
      </div>
    </div>
  </article>`;
}

export function renderNotFound(id: string): string {
  return `<article class="profile">
    <p class="profile-back"><a class="arrow-link" href="${homeHref("people")}" data-route>← All people</a></p>
    <p class="label">404</p>
    <h1 class="profile-name">No one here</h1>
    <p>We couldn't find a profile called <code>${esc(id)}</code>.</p>
  </article>`;
}

/* ---------------------------------------------------------------- showcase ("Now showing") */

function showcaseMedia(s: ShowcaseItem): string {
  const poster = `<img class="showcase-poster" src="${esc(s.poster)}" alt="${esc(s.posterAlt)}" />`;
  if (s.kind === "video") {
    return `<video class="showcase-video" src="${esc(s.src)}" poster="${esc(s.poster)}" muted loop playsinline preload="none" aria-label="${esc(s.posterAlt)}"></video>`;
  }
  if (s.kind === "embed") {
    // The iframe gets its src only while the panel is active (see showcase.ts). Phones get the still instead.
    return `<iframe class="showcase-frame" data-src="${esc(s.src)}" title="${esc(`${s.title}: ${s.subtitle}`)}" tabindex="-1"></iframe>
      <a class="showcase-still" href="${esc(s.links?.[0]?.href ?? s.src)}"${externalAttrs(s.links?.[0]?.href ?? s.src)}>${poster}</a>`;
  }
  return `${poster}
    <button class="showcase-launch" type="button" data-launch="${esc(s.src)}" data-title="${esc(s.title)}">
      <span class="showcase-launch-icon" aria-hidden="true">▶</span>${esc(s.launchLabel ?? "Launch")}
    </button>`;
}

function shortDate(date: string): string {
  const [y, m] = date.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return m ? `${months[Number(m) - 1]} ${y}` : y;
}

export function renderShowcase(items: ShowcaseItem[], active = 0): string {
  const panels = items
    .map((s, i) => {
      const links = (s.links ?? []).map((l) => `<a href="${esc(l.href)}"${externalAttrs(l.href)}>${esc(l.label)} ↗</a>`).join(" · ");
      return `<figure class="showcase-panel" id="show-${esc(s.id)}" role="tabpanel" aria-labelledby="show-tab-${esc(s.id)}" data-kind="${s.kind}"${i === active ? "" : " hidden"}>
        <div class="window-screen">${showcaseMedia(s)}</div>
        <figcaption class="window-bar">
          <span><strong>Now showing${i === 0 ? " · newest" : ""}</strong> · ${esc(s.title)} / ${esc(s.subtitle)}, ${esc(shortDate(s.date))}</span>
          <span>By ${esc(s.credit)}${links ? ` · ${links}` : ""}</span>
        </figcaption>
      </figure>`;
    })
    .join("");
  const tabs = items
    .map(
      (s, i) => `<button class="showcase-tab" type="button" role="tab" id="show-tab-${esc(s.id)}" aria-controls="show-${esc(s.id)}" aria-selected="${i === active}"${i === active ? "" : ' tabindex="-1"'}>
        <span class="showcase-num">${String(i + 1).padStart(2, "0")}</span>
        <span class="showcase-name">${esc(s.title)}</span>
        <span class="showcase-date">${esc(shortDate(s.date))}</span>
        <span class="showcase-progress" aria-hidden="true"></span>
      </button>`,
    )
    .join("");
  return `<div class="showcase" data-showcase>
    ${panels}
    <div class="showcase-tabs" role="tablist" aria-label="Demos">${tabs}</div>
  </div>`;
}
