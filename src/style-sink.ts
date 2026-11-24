import "./style.css";
import "./style-sink.css";
import { allPeople, people, projects, showcase, updates, type Person } from "./content.ts";
import { initMotion } from "./motion.ts";
import { chip, projectTag, renderPeople, renderPerson, renderPrototype, renderShowcase, renderUpdate } from "./render.ts";
import { initShowcase } from "./showcase.ts";

const fill = (name: string, html: string) => {
  document.querySelector(`[data-sink="${name}"]`)!.innerHTML = html;
};

const byId = (id: string) => updates.find((u) => u.id === id)!;

fill(
  "chips",
  [chip("", "All", 16), chip("papershop", "Papershop", 2), chip("puck-plus-plus", "Puck++", 2)]
    .map((c, i) => `<li>${i === 1 ? c.replace('class="chip"', 'class="chip" aria-current="true"') : c}</li>`)
    .join(""),
);
fill("tags", ["papershop", "hold-that-thought"].map(projectTag).join(""));
fill(
  "updates",
  ["2026-11-16-spaceship-ide", "magnetic-puck-viz", "2026-09-fall-cohort", "cybermuse"].map((id) => renderUpdate(byId(id))).join(""),
);
fill(
  "prototypes",
  projects
    .filter((p) => p.prototype)
    .map((p) => renderPrototype(p, true))
    .join(""),
);
const sun = allPeople.find((m) => m.id === "sun-chuanqi")!;
const shuji = allPeople.find((m) => m.id === "shuji-hosokawa")!;
fill(
  "people",
  [
    renderPerson(sun, "Group label"),
    // Hover state, forced on so it can be reviewed without a pointer.
    renderPerson(shuji).replace('class="person-card"', 'class="person-card sink-hover"'),
    renderPerson({ ...shuji, id: "long-name", name: "Maximiliana Featherstonehaugh-Ishikawa", role: "UROP · MIT EECS & Comparative Media Studies" }),
    renderPerson({ id: "new-member", name: "New Member", role: "UROP · no photo yet" } satisfies Person),
    renderPerson({ ...sun, id: "fifth", name: "Fifth Card", role: "Fills the last row" }),
  ].join(""),
);
fill("people-grid", renderPeople(people));

fill("showcase", renderShowcase(showcase));
initShowcase(document.querySelector<HTMLElement>("[data-showcase]")!);
initMotion();
