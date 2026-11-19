import "./style.css";
import "./style-sink.css";
import { allPeople, projects, updates, type Person } from "./content.ts";
import { chip, projectTag, renderPerson, renderPrototype, renderUpdate } from "./render.ts";

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
fill(
  "people",
  [
    allPeople.find((m) => m.id === "sun-chuanqi")!,
    allPeople.find((m) => m.id === "shuji-hosokawa")!,
    { id: "new-member", name: "New Member", role: "UROP · no photo yet" } satisfies Person,
  ]
    .map(renderPerson)
    .join(""),
);
