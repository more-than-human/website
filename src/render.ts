import { homeHref, personHref } from "./base.ts";
import { creditsFor, projectBySlug, type Person, type Project, type Update } from "./content.ts";
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

/** Dithered portraits live next to the photo: …/people/x.webp → …/people/dither/x.png and x-ansi.png */
function ditherPaths(photo: string): { mono: string; ansi: string } {
  const stem = photo.replace(/\/([^/]+)\.\w+$/, "/dither/$1");
  return { mono: `${stem}.png`, ansi: `${stem}-ansi.png` };
}

function portrait(m: Person, eager = false): string {
  if (!m.photo) return `<span class="portrait portrait-initials" aria-hidden="true">${esc(initials(m.name))}</span>`;
  const { mono, ansi } = ditherPaths(m.photo);
  const loading = eager ? "" : ' loading="lazy"';
  return `<span class="portrait">
    <img class="portrait-mono" src="${esc(mono)}" alt=""${loading} />
    <img class="portrait-ansi" src="${esc(ansi)}" alt=""${loading} />
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
        <h1 id="profile-name" class="profile-name">${esc(m.name)}<span class="cursor" aria-hidden="true"></span></h1>
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
    <h1 class="profile-name">No one here<span class="cursor" aria-hidden="true"></span></h1>
    <p>We couldn't find a profile called <code>${esc(id)}</code>.</p>
  </article>`;
}
