/** Deploy base path, e.g. "/" or "/website/" on GitHub Pages. Always ends with "/". */
export const BASE = import.meta.env.BASE_URL;

/** Content uses root-relative paths ("/assets/x.webp"). Rebase them onto the deploy base. */
export function withBase<T extends string | undefined>(path: T): T {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return path;
  return (BASE + path.slice(1)) as T;
}

export const homeHref = (hash = "") => `${BASE}${hash ? `#${hash}` : ""}`;
export const personHref = (id: string) => `${BASE}people/${encodeURIComponent(id)}/`;
