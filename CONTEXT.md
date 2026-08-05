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
The custom View Transition that fires only on navigations crossing the
Immersive Zone ↔ Reading Zone boundary (home → blog index/post, or back again).
Implemented as a pure-CSS rule keyed off the page-root `data-zone` attribute
matched against the View Transition API's `::view-transition-old(root)` /
`::view-transition-new(root)` pseudo-elements — no per-navigation JS
classification needed. All other navigation (Reading Zone ↔ Reading Zone, e.g.
post → post, list → post) uses Astro's default `fade` so page-turning during
reading stays unobtrusive.

### CSS-only, with narrow input-reading exceptions
The project's animation architecture is CSS-only: no third-party JS animation
library (GSAP/anime.js/Framer Motion), because no UI framework is installed, so
such a library would only ever run as a bare `<script>` with no island benefit.
This does **not** ban all JavaScript outright — a minimal hand-written script is
allowed strictly to read a signal CSS cannot access on its own (e.g. live cursor
coordinates) and hand it to CSS as a custom property; the actual animation,
timing, and visual computation must still live in CSS. The line: JS may *feed
inputs to* CSS animation, it may never *be* the animation engine.

## Decisions Log

### Visual theme: Ice / Winter (current, supersedes Jungle)
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
