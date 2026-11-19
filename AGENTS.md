# AGENTS.md

Guidance for coding agents working on the Tangible AI Working Group website. The source spec is [docs/01-specs.md](docs/01-specs.md); this file turns it into working rules.

## Project map

- `content/` — site content. `people.json`, `projects.json`, and `updates/*.md` (front matter + Markdown body).
- `src/` — TypeScript renderers (`render.ts`, `content.ts`, `markdown.ts`) and the stylesheet `style.css`.
- `style-sink.html` + `src/style-sink.*` — dev-only page that shows every token and component. Not linked from the site.
- `public/assets/<topic>/` — images and video served at `/assets/...`.
- `docs/` — specs, references, outline. `docs/assets-src/` holds source art that is not shipped.
- `scripts/dither.py` — generates dithered portraits from `public/assets/people/*.webp`.

Commands: `npm run dev`, `npm run build` (runs `tsc` first; must pass before committing). Pushing to `master` deploys to GitHub Pages.

## Content

Sections, in order: Research vision, Projects, Members, Join us.

- Content lives in `content/`, not hardcoded in `src/`.
- Research the web for real content and assets (project pages, papers, official portraits) before writing placeholders. Record sources in `docs/02-refs.md`.
- Write plainly and briefly. Every image needs meaningful `alt` text and, where applicable, a `credit`.
- Credit the user as "Sun Chuanqi".

## Design

- White on black, high contrast.
- Minimalist, brutalist: one monospace typeface, square corners, 1px rules, no shadows, no gradients.
- Color is rare. The accent (`--accent`) marks only the most important thing on screen: the primary call to action, the cursor, keyboard focus. Never decoration. For emphasis without color, invert (white background, black text).
- Vibe: programming and retro gaming. Terminal cues, pixel/dithered imagery, keyboard-friendly.
- Images are monochrome at rest; color may appear on hover or focus.
- Use only the existing CSS custom properties. Add a new token only if nothing fits, and add it to the style sink in the same change.

## Workflow

Work in three rounds. Finish each round before moving on.

1. **Content.** Research and gather content. Output a text-only outline (images as placeholders) in `docs/`. Focus on information architecture and content hierarchy.
2. **Prototype.** Build the outline into a working site. Everything must work (links, navigation, media, responsive layout, keyboard access); it does not have to look good yet.
3. **Polish.** Make it visually appealing and consistent with the design rules above. Do all visual work through the style sink (next section).

For later changes, follow the same order at small scale: content first, then function, then style.

## Style sink: where visual design happens

`style-sink.html` is the visual design workbench and the living record of the design system. Open it with `npm run dev` at `http://localhost:5173/website/style-sink.html`. It loads the real `src/style.css` and renders real content through the site's own renderers (`src/style-sink.ts` calls `render.ts`), so what you see there is what ships.

Rules:

- **Sink first, page second.** Every visual change (new token, new component, a changed spacing, color, or type style) is designed and iterated in the sink before it is checked on the full page.
- **Grow it incrementally.** The sink starts small and grows with the stylesheet. When you add a token or component to `style.css`, add its specimen to the sink in the same change. When you remove one, remove its specimen.
- **Real content, real renderers.** Fill specimens with `fill("<name>", ...)` in `src/style-sink.ts` using items from `content/` and functions from `render.ts`. Do not paste hand-written copies of component markup that can drift from the site.
- **Show every state.** Include the states that matter: hover, focus, `aria-current`, empty, long text, missing image, narrow width.
- **Principles stay current.** The "Principles" list at the top of the sink is the short form of the design rules. If a design decision changes, update it there and in the Design section of this file.
- **Sink-only styles stay in `src/style-sink.css`** (layout of the specimen page itself). Never put site styles there, and never let the site depend on it.
- **Review in the sink.** Check the sink at desktop and mobile widths and with keyboard focus. Then check the full page for layout and flow problems the sink can't show.
- The sink is dev-only: it has `noindex` and is not linked from the site.

## Media

All shipped media goes in `public/assets/<topic>/`. Keep originals out of `public/` (use `docs/assets-src/` or keep them local).

### Images: compressed WebP

- Ship images as `.webp` only. No JPEG, PNG, or GIF in `public/` (exception: the generated `people/dither/*.png` files, which need lossless pixels).
- Resize to the largest size actually displayed (usually ≤ 1600px on the long edge; thumbnails and portraits ≤ 800px).
- Target quality ~75–80. Aim for under 300 KB per image; thumbnails and portraits under 100 KB.

```sh
cwebp -q 78 -resize 1600 0 -metadata none in.jpg -o public/assets/topic/name.webp
# or with ffmpeg
ffmpeg -i in.png -vf "scale='min(1600,iw)':-2" -c:v libwebp -quality 78 public/assets/topic/name.webp
```

### Video: MP4, under 4 MB

- Ship video as H.264 `.mp4` only, with a `.webp` poster frame next to it.
- Every file must be **under 4 MB**. Check with `ls -l` before committing.
- Drop audio unless it is needed, cap width at 1280px, and add `+faststart` so playback starts before the download finishes.

```sh
ffmpeg -i in.mov -vf "scale='min(1280,iw)':-2,fps=30" \
  -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p \
  -an -movflags +faststart public/assets/topic/name.mp4

# poster frame
ffmpeg -ss 1 -i public/assets/topic/name.mp4 -frames:v 1 -c:v libwebp -quality 78 public/assets/topic/name-poster.webp
```

If the result is still 4 MB or larger, raise `-crf` (30–32), lower the width (960 or 720), lower the fps (24), or trim the clip. For a hard size limit, use a two-pass encode with a target bitrate: `bitrate_kbps ≈ 3800 * 8 / duration_s` (subtract audio bitrate if you keep audio).

```sh
ffmpeg -y -i in.mov -vf "scale='min(1280,iw)':-2" -c:v libx264 -b:v ${KBPS}k -pass 1 -an -f mp4 /dev/null
ffmpeg -i in.mov -vf "scale='min(1280,iw)':-2" -c:v libx264 -b:v ${KBPS}k -pass 2 -an -pix_fmt yuv420p -movflags +faststart out.mp4
```

Embed with `muted`, `playsinline`, `poster`, and `preload="none"` or `"metadata"`.

## Before committing

- `npm run build` passes.
- If styles changed: the sink shows the new or changed specimen, and both the sink and the full page look right at desktop and mobile widths.
- Every new image is `.webp`, every new video is `.mp4` under 4 MB with a poster.
- No originals or large files in `public/`.
