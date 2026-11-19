# Round 1 — Content Outline Draft (v2)

Text only. `[IMG: …]` marks image placeholders. `[date?]` marks facts to confirm.
Sources are listed at the bottom.

---

## 0. Information architecture

Single page, anchor-navigated (one scroll, like a terminal session / game title screen).

```
/ (index.html)
├── #top        Hero / title screen
├── #vision     Research vision
├── #updates    Updates feed, filterable by project
├── #prototypes Prototypes (link + thumbnail)
├── #people     Members → each card links out to a profile (when one exists)
└── #join       Join us → link-out to UROP opening
```

Nav (persistent, top): `VISION · UPDATES · PROTOTYPES · PEOPLE · JOIN`

Naming: always **Tangible AI Working Group** (short form: "the Working Group"), never "the group".
Parent: **Tangible Media Group (TMG)**, linked to https://tangible.media.mit.edu/ wherever it is named.

Color accent (spec: color only for the most important things):
1. `JOIN` call-to-action (primary accent)
2. The active project filter in Updates (secondary)
Everything else white on black.

Not exposed: the internal project catalog (`code.chuanqisun.com/tmg-urop/projects.html`) is a design reference only. It is never displayed or linked.

---

## 1. Hero (#top)

- Eyebrow: `MIT MEDIA LAB · TANGIBLE MEDIA GROUP` (TMG part links to TMG site)
- **H1: Tangible AI Working Group**
- Tagline: *Interacting with AI should feel like a breath of fresh air.*
- Sub: We design and build interactive systems that make us more human, and more than human.
- Meta line: `Advisor: Prof. Hiroshi Ishii · Leads: Sun Chuanqi, Quincy Kuang, Lucy Li`
- CTA: `[ JOIN US ]` → #join (accent) · secondary: `[ LATEST UPDATES ]` → #updates
- [IMG: hero visual. First choice: Avril's looping puck animation (`assets/pucks/context-pucks-v2-animation.html`, canvas, already in our palette), embedded or captured as a loop. Fallback: pure type.]

---

## 2. Research vision (#vision)

**H2: Computation as human experience**

Lead paragraph:
> The Tangible AI Working Group is part of the [Tangible Media Group](https://tangible.media.mit.edu/) at the MIT Media Lab. For over 30 years, TMG, led by Professor Hiroshi Ishii, has bridged the digital and physical worlds. The Working Group carries that work into the age of AI.

Manifesto block (short lines, reads like terminal output):
- We are tired of screens, chat bots, and endless prompting.
- Why can't we grasp an agent and steer it in real time?
- We are working to increase the speed and bandwidth of human–machine interaction by 100× — without brain–computer interfaces.
- We want to help people achieve more by thinking more, intending more, acting more, and aspiring more.
- **We are the interaction maximalists.**

**H3: Current focus: Hold That Thought**
> Today, people use AI by taking turns: prompt, wait, read, prompt again. You can't grab an idea and nudge it while you watch it change. We give handles to ideas: simple controls bound to the *meaning* of what a model generates, such as a slider bound to "more poetic" or one puck per idea in a brainstorm. Handles can be on screen or physical. Either way the output changes in real time as you move them, with no submit button.
>
> Research question: do people working this way become more creative, feel more in control, and enjoy it more than with chat?

**H3: How we work** (3 short items)
- **Ownership > instruction:** We build to think: sketch, prototype, test, decide.
- **Peer learning > working alone:** Teach what you know, learn what you don't.
- **Growth mindset > ego:** Treat failures as data. Challenge ideas with respect.

**H3: What we build with** (tag row)
`Design & storytelling` `Real-time interaction` `Computer vision & multimodal` `Programming tools & DSLs` `Hardware & embedded` `Research & publication`

---

## 3. Updates (#updates)

**H2: Updates**
Intro: *Notes, demos, and papers from the Working Group, newest first.*

### 3.1 Model
- An **update** is the content unit: date, title, short body (1–3 sentences), optional media, optional link.
- Each update references **zero or more projects** (metadata only). Projects have no pages of their own. They exist only as tags and as the filter.
- Filter bar above the feed: `ALL` + one chip per project that has at least one update. Selecting a chip filters the feed. State lives in the URL (`#updates?project=papershop`) so filtered views can be shared.
- Each update card shows its project tags. Clicking a tag applies that filter.
- Source of truth: one markdown file per update with front matter (`date`, `title`, `projects: [...]`, `link`, `image`). Details in Round 2.

Card anatomy:
```
2026-10-14   [papershop] [hold-that-thought]
TITLE
One to three sentences.
[IMG: optional, our style]          ↗ link
```

### 3.2 Project vocabulary (filter chips)
| slug | Label | Note |
|---|---|---|
| `hold-that-thought` | Hold That Thought | Current thesis focus |
| `papershop` | Papershop | Prototype, started 2026-09 |
| `puck-plus-plus` | Puck++ | Prototype, started 2026-09 |
| `now-then-now` | Now Then Now | Prototype |
| `dream-brush` | Dream Brush | Past work |
| `working-group` | Working Group | Team news: cohort, recruiting |

### 3.3 Seed updates (drafts from public material; dates to confirm)
| Date | Title | Body | Projects | Link |
|---|---|---|---|---|
| 2027-01 | IAP 2027 projects begin | UROPs design, build, and evaluate their own "handles for ideas" over four weeks (Jan 4–29). | working-group, hold-that-thought | — |
| 2026-09 [date?] | Fall 2026 UROP cohort joins | Avril, Shuji, Connie, Fyona, and Sophia join the Working Group. | working-group | — |
| [date?] | Hold That Thought: thesis proposal | Sun presents the thesis proposal on real-time semantic handles. | hold-that-thought | https://youtu.be/letrre__TD4?t=151 |
| 2026-09 | Papershop kicks off | Draw on paper, point at your sketch and say "put that", point at the screen and say "there". A webcam reads the page and drops the drawing into the digital canvas. [IMG: sketch-01, dithered] | papershop, dream-brush | — |
| [date?] | Papershop: real-world attributes | Point at a plant to capture its leaf texture and at a mug to capture its shape. Bind both to a marker cube, then turn the cube to see the combined object update live. Snap cubes together to compose more complex objects. [IMG: poster-01, dithered] | papershop | — |
| 2026-09 | Puck++: steering ideas with knobs | One puck per idea. Pull a knob to go deeper into a concept, push it in to drop it, and turn one puck toward another to mix them. Interaction design by Avril. | puck-plus-plus, hold-that-thought | assets/pucks/context-pucks-v2-interactive.html |
| [date?] | Magnetic puck visualization | How magnetic detents make each knob click into place. Viz by Shuji. | puck-plus-plus | [video: assets/pucks/magnetic-puck-viz.mp4] |
| [date? screenshot is from 2026-10] | Now Then Now: all our complex lives all at once | A map of people's personal /now pages. Each dot is a person, colored by what fills their life right now (family, music, writing, AI…). Click a dot to read their now. Design by Connie. [IMG: concept, map only] | now-then-now | — |
| 2026 [date?] | Dream Brush | An AI painting installation where visitors write Chinese characters with a water brush on a physical canvas. | dream-brush | https://www.youtube.com/watch?v=FUGcTMSbbyM |
| [date?] | Tangible Co-Ideation (paper) | [one-liner TBD] | — | https://dl.acm.org/doi/pdf/10.1145/3802974.3810894 |
| [date?] | Packing Rush | Demo. | — | https://www.instagram.com/reel/DVOl2a0DWNE/ |
| [date?] | Tangible Prompting | Demo. | — | https://www.youtube.com/watch?v=WapWovoUq5U |
| [date?] | Tangible Visual RAG | Demo. | — | https://www.youtube.com/watch?v=F1KOJxsaAfY |
| [date?] | Time Machine | Demo. | — | https://www.youtube.com/watch?v=0V7LAdV-e4c |
| [date?] | Thinking Machine | Demo. | — | https://www.youtube.com/watch?v=-WRwk7b3agE |
| [date?] | CyberMUSE | Demo. | — | https://www.youtube.com/watch?v=DMJaME2IuUs |

---

## 4. Prototypes (#prototypes)

**H2: Prototypes**
Intro: *Things you can try.*

Card anatomy: `[IMG: thumbnail 16:9, our style]` · TITLE · one-liner · `TRY IT ↗` (only if a link exists) · `UPDATES →` (applies that project's filter in #updates)

| Title | One-liner | Link |
|---|---|---|
| Papershop | Draw on paper, point, and speak to compose images and objects. The physical desk is the editor. | — (no live link). Thumbnail: crop of `assets/papershop/sketch-01.webp`, dithered |
| Puck++ | One puck per idea. Pull, push, flip, and turn its knobs to steer what the AI generates in real time. | `assets/pucks/context-pucks-v2-interactive.html` (local, crawled). Thumbnail: still or loop from `context-pucks-v2-animation.html` |
| Now Then Now | A living map of personal /now pages: all our complex lives all at once. | — (no live link). Thumbnail: map area of `assets/now-then-now/concept.webp` |

---

## 5. People (#people)

**H2: People**
Intro: *A small team with complementary hardware, software, and design skills.*

Card anatomy (whole card is a link only when a profile exists):
```
[IMG: portrait, square, our style]
NAME
Role · affiliation
↗
```

### 5.1 Advisor
| Name | Role | Photo source | Profile |
|---|---|---|---|
| Hiroshi Ishii | Faculty Advisor · Director, Tangible Media Group | https://trackr-media.tangiblemedia.org/publishedmedia/People/Hiroshi%20Ishii/badge?width=600 | https://tangible.media.mit.edu/person/hiroshi-ishii/ |

### 5.2 Research leads
| Name | Role | Photo source | Profile |
|---|---|---|---|
| Sun Chuanqi | Research Lead · M.S. Candidate | tmg-30 `chuanqi-sun.webp` | https://tangible.media.mit.edu/person/chuanqi-sun/ |
| Quincy Kuang | Research Lead · Ph.D. Candidate | tmg-30 `quincy-kuang.webp` | https://tangible.media.mit.edu/person/quincy-kuang/ |
| Lucy Li | Research Lead · Ph.D. Candidate | tmg-30 `lucy-li.webp` | https://tangible.media.mit.edu/person/lucy-li/ |

### 5.3 UROP researchers
| Name | Role | Photo source | Profile |
|---|---|---|---|
| Avril Cui | UROP · MIT EECS | tmg-30 `avril-cui.webp` | https://acuvilr.one/ |
| Shuji Hosokawa | UROP | tmg-30 `shuji-hosokawa.webp` | — |
| Connie Huang | UROP · MIT EECS | tmg-30 `connie-huang.webp` | https://conniehuang.dev/ |
| Fyona Shi | UROP | tmg-30 `fyona-shi.webp` | — |
| Sophia Loiselle | UROP · MIT EECS | tmg-30 `sophia-loiselle.webp` | — |

tmg-30 base: `https://code.chuanqisun.com/tmg-30/assets/people/`. Photos are source material only. They get processed into our style (see §8).

---

## 6. Join us (#join)

**H2: Join us**
- *We're recruiting UROPs for 26 Fall · 27 IAP · 27 Spring.*
- *Bring something you can contribute and an appetite for learning the rest. At least 8 dedicated hours a week.*
- CTA (primary accent, largest button on page): `[ READ THE UROP OPENING → ]` → https://code.chuanqisun.com/tmg-urop/

---

## 7. Footer

`Tangible AI Working Group · part of the Tangible Media Group (link) · MIT Media Lab` · © 2026

---

## 8. Imagery direction (all new, our style)

None of the catalog's visual assets are used. Its colored-pencil sketches are dropped completely.

**Style anchor: Avril's puck visuals.** They already match the spec and seed the Round 3 style sink:
- `BG #000` · `FG #f4f4f4` · `DIM #555` · `MUTE #8c8c8c` · `ACC #ff5a1f` (the one accent color)
- Font: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`
- Thin white line art, small lowercase mono labels, orange used only for the active element.

Note: the Papershop images are grey illustrations with an orange accent. That's close to our palette but not white on black. Planned treatment: invert and dither to 1-bit, keep the orange as the accent.

Now Then Now's screenshot is already dark but uses many colors (one per theme). Planned treatment: crop to the map, then either dither it or keep it in color as the one place where many colors carry meaning. Decide in Round 3. The crop also leaves out the real person's name and quote shown in the side panel.

Rules for everything else:
- **Portraits:** source photos converted to 1-bit dithered (Atkinson/Bayer) white on black, same size and crop for everyone. Color shows only on hover/focus, or never.
- **Prototype thumbnails:** dithered screenshots or video stills of each prototype. Until we have those, a pixel-art / ASCII title card with the prototype name.
- **Update media:** same dither treatment. Videos are links, not embeds.
- **Hero / decorative:** pixel-art or ASCII marks (hand, puck, cursor). Monochrome plus the single accent color.
- Generated in the build step from source photos so new members and updates stay consistent.

---

## Asset inventory (local)
| File | What | Credit | Used in |
|---|---|---|---|
| `assets/pucks/context-pucks-v2-interactive.html` | Interactive puck steering demo (canvas) | Avril Cui | Prototypes → Puck++ link; Updates |
| `assets/pucks/context-pucks-v2-animation.html` | Looping puck steering animation (canvas) | Avril Cui | Hero visual; Puck++ thumbnail |
| `assets/pucks/magnetic-puck-viz.mp4` | 4 s, 1280×720 magnetic puck viz | Shuji Hosokawa | Updates; Puck++ media |
| `assets/papershop/sketch-01.webp` | 3-panel storyboard: drawing → selecting ("put that") → positioning ("there") | Sun Chuanqi | Papershop thumbnail; Updates |
| `assets/papershop/poster-01.webp` | 5-panel concept poster: attribute selection, binding, AR mirror, modular tiles, multi-object composition | Sun Chuanqi | Updates |
| `assets/now-then-now/concept.webp` | Screenshot: map of /now pages as colored dots grouped by theme, legend with counts, selected person's card | Connie Huang | Now Then Now thumbnail (crop to the map only); Updates |
| tmg-30 portraits (to fetch in Round 2) | Source photos for dithering | — | People |

Credits are shown on the card that uses each asset ("design: Avril Cui").

## Sources
- UROP opening: https://code.chuanqisun.com/tmg-urop/
- Proposal guide ("Hold That Thought"): https://code.chuanqisun.com/tmg-urop/official-proposal-writeup-guide-IAP.html
- People data/photos: https://code.chuanqisun.com/tmg-30/ (data.json)
- Tangible Media Group: https://tangible.media.mit.edu/
- Puck assets (Avril): https://code.chuanqisun.com/tangible-grammar/v2-interactive.html, https://code.chuanqisun.com/tangible-grammar/v2-animation.html
