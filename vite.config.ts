import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

/**
 * Deploy base path. "/" for a custom domain or user site, "/<repo>/" for a GitHub Pages project site.
 * Set via BASE_PATH env var (the GitHub Actions workflow passes it from actions/configure-pages).
 */
const base = normalizeBase(process.env.BASE_PATH ?? "/website/");

function normalizeBase(path: string): string {
  return `/${path.replace(/^\/+|\/+$/g, "")}/`.replace(/\/+/g, "/");
}

interface Person {
  id: string;
  name: string;
  role: string;
}

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * GitHub Pages has no rewrites, so give every profile a real file:
 *   dist/people/<id>/index.html  (stable URL, correct <title>/description for sharing)
 *   dist/404.html                (any other path still boots the SPA, which shows its own not-found view)
 */
function staticRoutes(): Plugin {
  return {
    name: "static-routes",
    apply: "build",
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      const shell = readFileSync(resolve(dist, "index.html"), "utf8");
      const groups: { members: Person[] }[] = JSON.parse(readFileSync(resolve(__dirname, "content/people.json"), "utf8"));

      for (const person of groups.flatMap((g) => g.members)) {
        const title = `${person.name} · Tangible AI Working Group`;
        const description = `${person.name}, ${person.role}, Tangible AI Working Group at the MIT Media Lab's Tangible Media Group.`;
        const html = shell
          .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(title)}</title>`)
          .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${escapeAttr(description)}$2`)
          .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${escapeAttr(title)}$2`)
          .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${escapeAttr(description)}$2`);
        const file = resolve(dist, "people", person.id, "index.html");
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, html);
      }
      writeFileSync(resolve(dist, "404.html"), shell);
    },
  };
}

export default defineConfig({
  base,
  plugins: [staticRoutes()],
});
