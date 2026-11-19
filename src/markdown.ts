import { BASE, withBase } from "./base.ts";

export function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/** Splits `---` front matter from the body. Supports `key: value` and `key: [a, b]`. */
export function parseFrontMatter(source: string): { data: Record<string, string | string[]>; body: string } {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: source };

  const data: Record<string, string | string[]> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, raw] = kv;
    const value = raw.trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((item) => unquote(item.trim()))
        .filter(Boolean);
    } else {
      data[key] = unquote(value);
    }
  }
  return { data, body: match[2].trim() };
}

function unquote(value: string): string {
  return /^(["']).*\1$/.test(value) ? value.slice(1, -1) : value;
}

/** Minimal inline markdown: paragraphs, links, bold, italic, code. Input is escaped first. */
export function renderMarkdown(source: string): string {
  return source
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${renderInline(para)}</p>`)
    .join("");
}

function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const url = withBase(href);
      return `<a href="${url}"${externalAttrs(url)}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, " ");
}

export function externalAttrs(href: string): string {
  // External sites and standalone asset pages (demos, media) open in a new tab.
  return /^https?:\/\//.test(href) || href.startsWith(`${BASE}assets/`) ? ' target="_blank" rel="noopener"' : "";
}
