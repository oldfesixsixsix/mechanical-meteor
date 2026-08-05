# Domain Model

## Glossary

### Immersive Zone
The homepage hero section. The site's full visual theme applies here at maximum
intensity — this is the only zone where continuous/looping animation and a
dominant, high-motion-budget entrance moment are permitted. Theme-neutral term:
what specific artwork/effects populate it changes with the active visual theme
(see Decisions Log for the current one), but the zone boundary and its rules do
not.

### Reading Zone
Everything else — blog index, tag pages, individual post pages (`BlogPost`
layout), about page — plus the site-wide Header and Footer wherever they render.
Inherits the active theme's **palette** only. No looping, floating, or parallax
animation; no decorative artwork (see *Decoration vs. Structural Styling* below
for the one narrow exception). Optimized for long-form reading comfort, not
spectacle.
- **Ambient-drift exception**: one narrow, bounded exception to "no looping
  animation" — a background drift effect is allowed if its full cycle duration
  is > 30s **and** its positional/opacity amplitude is < 5%. Below both
  thresholds it reads as atmosphere, not motion, to a reader. Above either
  threshold, it's decoration and the normal "no looping animation" rule
  applies. Introduced for the ice-3D theme's `.aurora-still`-style background;
  any future use must be checked against these same numbers, not vibes.

### Decoration vs. Structural Styling
A distinction inside the Reading Zone's "no decoration" rule. **Decoration** is
anything whose job is atmosphere/spectacle — animated elements, illustrative
artwork, motifs that exist to build a mood (forbidden in the Reading Zone).
**Structural styling** is a shape/layout choice applied to a real UI element
that would need *some* border treatment regardless of theme (forbidden nothing —
allowed in the Reading Zone). The test: would this still be here, in some form,
under a completely different visual theme? A `border-radius` is structural; a
themed illustrative silhouette is decoration.
- **Ruling (ice theme)**: blog-index article cards using an irregular/fractured
  `clip-path` edge instead of `border-radius` counts as structural styling (it's
  still "the card's edge shape," just a different shape) — allowed in the
  Reading Zone as a named exception. It must stay static; no crack-growth
  animation on cards.

### Threshold Transition
The custom transition that fires only on navigations crossing the Immersive
Zone ↔ Reading Zone boundary (home → blog index/post, or back again). All
other navigation (Reading Zone ↔ Reading Zone, e.g. post → post, list → post)
uses Astro's default `fade` so page-turning during reading stays unobtrusive.
**Redefined for the ice-3D theme** (previously a pure-CSS `data-zone`-keyed
`::view-transition-old/new(root)` rule, no JS involved — that mechanism is
retired along with the CSS-only Immersive Zone it belonged to): now a
JS-orchestrated sequence — camera "dive" toward the ice, a whiteout overlay
fading to full opacity, a real `navigate()` call fired at full whiteout, then
the whiteout fades out on the destination page. The whiteout element uses
`transition:persist` from a shared layout so it survives the real Astro page
swap as one continuous element rather than two independently-timed ones.

### CSS-only, with a scoped Immersive Zone exception
The site's **default** animation architecture is CSS-only: no third-party JS
animation library, because no UI framework is installed, so such a library
would only ever run as a bare `<script>` with no island benefit. A minimal
hand-written script may still read a signal CSS cannot access (e.g. cursor
coordinates) and hand it to CSS as a custom property — JS feeds inputs to CSS,
it never becomes the animation engine. **This default still governs the
Reading Zone and all site chrome.**
- **Scoped exception**: the Immersive Zone (homepage hero) is a genuine
  Three.js/WebGL 3D scene — a real JS rendering engine, not an input-feed. This
  is deliberately narrow: vanilla script written directly in the homepage's own
  `<script>` (no framework wrapper, no `client:*` directive — those only apply
  to framework-component islands, which this project has none of), so Astro's
  default per-page bundling already guarantees it. Reading Zone pages must
  contain zero Three.js-related code in their bundles — this isn't a
  convention to remember, it falls out of the file structure automatically as
  long as the 3D code lives only in `index.astro`.

## Decisions Log

### Visual theme: Ice-3D / Frozen Lake (current, supersedes CSS-only Ice)
- The CSS-only ice theme (issue #2) is **retired, not carried forward as a
  fallback**. The 3D scene is deliberately independent of it — no shared
  palette, no shared assets, no reuse of its Immersive Zone markup. Its
  decorative CSS/markup (glacier silhouettes, CSS snowfall, cursor-driven
  cracks, the entrance-blur animation, the CSS `threshold-shatter-*`
  keyframes) becomes dead code to remove during implementation.
- **No-WebGL/no-JS/`prefers-reduced-motion` fallback**: a minimal static
  background (near-black, headline text, no motion) — not the retired CSS ice
  hero.
- **Reading Zone visual identity also replaced**, site-wide (blog index, tag
  pages, about page, individual posts — not just the post layout): Noto Serif
  TC (loaded via Astro's `fontProviders.google()`, consistent with how
  Atkinson is already loaded), teal/violet accents, the prototype's
  crack-divider and pull-quote component styles. This supersedes the ice
  theme's Reading Zone typography/palette (Atkinson, cyan accent) from
  issue #2.
- **3D scene architecture**: vanilla Three.js (no React/Vue wrapper, no
  `client:*` directive — see the CSS-only glossary entry above). Package via
  npm (`three`), bundled by Astro's existing Vite pipeline — not the
  prototype's CDN script tag. Porting from the prototype's r128 APIs to
  current Three.js is a mechanical rename only (`outputEncoding` →
  `outputColorSpace`, `THREE.sRGBEncoding` → `THREE.SRGBColorSpace`,
  `RGBFormat` → `RGBAFormat`), not a visual change — the terrain, sky shader,
  lighting, camera orbit, and snow particle system are reused as designed in
  the prototype.
- **Script re-execution**: the homepage's 3D-scene `<script>` carries
  `data-astro-rerun`, so returning to the homepage via real navigation
  re-executes setup (Astro's bundled scripts otherwise run once per session).
- **Resource disposal**: a cleanup routine (cancel the render loop, dispose
  renderer/geometry/materials/textures/envMap, remove event listeners) runs on
  `astro:before-swap` — the last moment the homepage's DOM is still present
  before a real navigation away.
- **Device capability**: reuses the same 640px viewport-width breakpoint
  already established for the (now-retired) CSS hero's mobile simplification,
  for consistency — not `hardwareConcurrency`/`deviceMemory` (inconsistent
  browser support).
- **Reading Zone ambient-drift exception**: see the Reading Zone glossary
  entry's bounded exception (> 30s cycle, < 5% amplitude) — added specifically
  to permit the prototype's `.aurora-still` background.
- **New ADR needed**: this is a hard-to-reverse, surprising-without-context
  architectural shift — the site's CSS-only default now has a real exception
  (a WebGL rendering engine), which a future reader of the CSS-only glossary
  entry would not expect. Author `docs/adr/0003-...` recording this when
  implementation starts, alongside removal of the CSS-only ice hero.

### Visual theme: Ice / Winter (superseded by Ice-3D above — kept for history)
- The jungle theme (deep-green palette, vine/leaf artwork, "crossing into the
  jungle" Threshold Transition framing) is **abandoned**, not iterated on.
  `docs/adr/0001-remove-light-dark-toggle-for-jungle-theme.md` is retained only
  as a historical record of a decision made under that theme; do not treat it as
  a current-state reference.
- The zone architecture above (Immersive/Reading/Threshold Transition/CSS-only)
  is **reused as-is** — it was already theme-neutral in substance, only its
  written descriptions used jungle-specific imagery, now removed.
- Ice theme concept: the tagline "我這一生如履薄冰，你說我能走到對岸嗎？" is the
  design brief. The visitor should feel like they're standing on ice that could
  crack, glare, and bite with cold — not looking at a few decorative snowflakes.
- **Contrast strategy**: background and decorative elements (glacier/mountain
  silhouettes, cracks, aurora, highlights) push to extreme contrast — near-black
  deep blue against near-blinding ice white. Body/paragraph text in the Reading
  Zone stays within WCAG AA contrast range; the extreme end of the palette is
  reserved for backgrounds and accents, not paragraph copy.
- **Depth**: the Immersive Zone background uses 2–3 static (non-animated) layered
  glacier/mountain-silhouette SVGs for spatial depth, instead of a flat gradient.
- **Aurora**: rendered saturated and prominent (a real focal element of the
  hero), not a faint ambient drift — still confined to the Immersive Zone.
- **Opening moment**: the homepage plays a single dominant entrance animation on
  load (blizzard blur clearing to reveal the hero, ~1–1.5s) rather than
  spreading motion budget evenly across many small effects. Plays once per
  homepage entry (not on every reading-zone-to-home return within a session);
  `prefers-reduced-motion` skips straight to the settled state. This doesn't
  block Time-to-Interactive (content is DOM-present and interactive
  immediately) — the cost is purely how long the visitor waits to see the
  settled visual.
- **Snowfall technique**: CSS-only layered `repeating-radial-gradient`/
  `box-shadow`-style faux-particle layers (3–4 layers, one element each),
  each with its own drift speed/angle for a wind-direction feel. Chosen over
  many individual DOM snowflake elements (mobile jank risk) and over a
  canvas/JS particle system (would break the CSS-only architecture) — this
  keeps density high while DOM/repaint cost stays low, protecting the
  Lighthouse ≥ 90 floor carried over as a hard constraint.
- **Cursor interaction**: crack-propagation/cold-light feedback tracks the real
  cursor position. Implemented as the CSS-only architecture's narrow exception —
  a minimal `mousemove` listener writes coordinates into CSS custom properties;
  the crack/light visuals themselves are CSS reacting to those properties.
- **Decoration scale**: cracks/icicles/frost are sized up from a "subtle
  accent" scale to a dominant one, but kept to a small number of large layers
  (not many small repeated shapes) — same low-DOM/high-visual-impact strategy as
  the snowfall layers, to protect the performance floor.

### Carried over from the jungle round (still apply, theme-independent)
- **Theme scope**: full theme in the Immersive Zone, palette-only in the Reading
  Zone. Protects article readability.
- **Animation technique**: CSS-only by default; see *CSS-only, with narrow
  input-reading exceptions* above for the ice-theme refinement.
- **View Transitions scope**: `<ClientRouter />` enabled site-wide (required by
  the API); Threshold Transition fires only at the zone boundary.
- **Performance floor**: Lighthouse Performance ≥ 90 is a hard constraint.
- **Reduced motion**: Immersive Zone decorative artwork stays fully visible
  under `prefers-reduced-motion`; only motion is removed.
- **Theme system**: no light/dark toggle — single, non-switchable theme. Still
  true under the ice theme, but for a new reason (see ADR-0002, to be written
  when implementation starts): the theme's extreme contrast lives *within* one
  screen as a design choice, not as two selectable states.
