import peopleData from "../content/people.json";
import projectsData from "../content/projects.json";
import { withBase } from "./base.ts";
import { parseFrontMatter, renderMarkdown } from "./markdown.ts";

export interface Person {
  /** Stable URL slug: /people/<id>/ */
  id: string;
  name: string;
  role: string;
  group?: string;
  photo?: string;
  link?: string;
}

export interface PeopleGroup {
  group: string;
  members: Person[];
}

export interface Prototype {
  summary: string;
  link?: string;
  thumbnail?: string;
  thumbnailAlt?: string;
  credit?: string;
}

export interface Project {
  slug: string;
  label: string;
  started?: string;
  prototype?: Prototype;
}

export interface Update {
  id: string;
  title: string;
  /** YYYY, YYYY-MM, or YYYY-MM-DD. Undated updates sort last. */
  date?: string;
  projects: string[];
  link?: string;
  linkLabel?: string;
  image?: string;
  imageAlt?: string;
  video?: string;
  credit?: string;
  html: string;
}

export const people: PeopleGroup[] = (peopleData as PeopleGroup[]).map((g) => ({
  group: g.group,
  members: g.members.map((m) => ({ ...m, group: g.group, photo: withBase(m.photo) })),
}));
export const allPeople = people.flatMap((g) => g.members);
export const personById = new Map(allPeople.map((m) => [m.id, m]));

export const projects: Project[] = (projectsData as Project[]).map((p) =>
  p.prototype
    ? {
        ...p,
        prototype: { ...p.prototype, link: withBase(p.prototype.link), thumbnail: withBase(p.prototype.thumbnail) },
      }
    : p,
);
export const projectBySlug = new Map(projects.map((p) => [p.slug, p]));

const files = import.meta.glob("../content/updates/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const str = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);
const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

export const updates: Update[] = Object.entries(files)
  .map(([path, source]) => {
    const { data, body } = parseFrontMatter(source);
    const id = path.split("/").pop()!.replace(/\.md$/, "");
    const update: Update = {
      id,
      title: str(data.title) ?? id,
      date: str(data.date),
      projects: list(data.projects),
      link: withBase(str(data.link)),
      linkLabel: str(data.linkLabel),
      image: withBase(str(data.image)),
      imageAlt: str(data.imageAlt),
      video: withBase(str(data.video)),
      credit: str(data.credit),
      html: renderMarkdown(body),
    };
    for (const slug of update.projects) {
      if (!projectBySlug.has(slug)) console.warn(`[content] ${id}: unknown project "${slug}"`);
    }
    return update;
  })
  .sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date) || a.title.localeCompare(b.title);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });

/** Projects that have at least one update, in projects.json order. */
export const filterableProjects = projects.filter((p) => updates.some((u) => u.projects.includes(p.slug)));

export const updateCount = (slug: string) => updates.filter((u) => u.projects.includes(slug)).length;

/** Work credited to a person. Credits are matched by full name. */
export function creditsFor(person: Person): { updates: Update[]; prototypes: Project[] } {
  return {
    updates: updates.filter((u) => u.credit === person.name),
    prototypes: projects.filter((p) => p.prototype?.credit === person.name),
  };
}
