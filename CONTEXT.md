# Domain Model

## Glossary

### Immersive Zone (retired)
**Retired by the Site-wide Continuous World decision below** — kept only as a
historical record of the zone boundary that existed before every page shared
one 3D world. Previously: the homepage hero section, the only zone where
continuous/looping animation was permitted. There is no zone boundary left;
see *Continuous World*.

### Reading Zone (retired)
**Retired by the Site-wide Continuous World decision below** — kept only as a
historical record. Previously: everything except the homepage (blog index,
tag pages, individual post pages, about page), restricted to the theme's
palette only, no looping animation, no decorative artwork. Its readability
concerns didn't disappear — see *Reading Card* — but the zone boundary itself
is gone; every page now carries the same 3D scene.

### Continuous World
The site-wide spatial metaphor that replaced the Immersive/Reading Zone split:
every page (home, blog index, post, tag list, about) renders as if it's the
same frozen lake, viewed from a different camera position. Implemented as
independent per-page Three.js instances (not one persisted renderer — see the
Decisions Log entry below for why), kept visually continuous by sharing a
fixed Perlin seed, palette, and terrain parameters across pages via a common
utility module. Moving between pages plays a *Directional Transition* rather
than a hard cut, reinforcing the illusion of one contiguous place.

### Reading Card
The near-opaque panel that long-form body text (blog post body, About page
body) is contained in, so paragraph text stays legible over the
now-permanently-animated *Continuous World* background. The 3D scene stays
visible at the card's edges and during page entry, never directly behind body
copy. Successor to the Reading Zone's "no decorative artwork behind text"
concern, scoped down to the card rather than the whole page.

### Floe Card
The pure-text card design for blog-index and tag-filtered-list entries:
category label (the post's first tag), title, excerpt (the content
collection's `description` field), and date — no hero image, no reading-time
figure. Named for the demo's `.floe` class. Uses the same irregular
`clip-path` edge as *Decoration vs. Structural Styling* below.

### Decoration vs. Structural Styling
Originally a distinction inside the (now-retired) Reading Zone's "no
decoration" rule; the ruling below still governs card styling site-wide even
though the zone it was scoped to is gone. **Decoration** is anything whose job
is atmosphere/spectacle — animated elements, illustrative artwork, motifs that
exist to build a mood. **Structural styling** is a shape/layout choice applied
to a real UI element that would need *some* border treatment regardless of
theme. The test: would this still be here, in some form, under a completely
different visual theme? A `border-radius` is structural; a themed illustrative
silhouette is decoration.
- **Ruling (ice theme)**: *Floe Card* entries using an irregular/fractured
  `clip-path` edge instead of `border-radius` counts as structural styling
  (it's still "the card's edge shape," just a different shape). It must stay
  static; no crack-growth animation on cards.

### Threshold Transition (retired)
**Retired by Directional Transition below** — kept only as a historical
record. Previously: the transition that fired on navigations crossing the
Immersive Zone ↔ Reading Zone boundary — a JS-orchestrated camera "dive"
toward the ice, a whiteout overlay fading to full opacity, a real `navigate()`
call fired at full whiteout, then the whiteout fading out on arrival. There is
no zone boundary left to fire it at.

### Directional Transition
The transition that replaced Threshold Transition once the whole site became
one *Continuous World*: the viewport slides in a fixed direction (down,
right, up, or left) between pages, standing in for movement through one
contiguous space rather than a hard cut. Two rules fix the direction for any
navigation:
- **Content depth** moves right: blog index → post, and post → a
  tag-filtered list (clicking one of the post's tags) both slide right — each
  is "going deeper into content," so they share a direction.
- **Nav-tab clicks are always one direct slide to that tab's canonical
  direction from Home, never a multi-step reverse of however the current page
  was reached.** Home's canonical direction is down (Home → blog index);
  About's is left (Home → About). Clicking Home from any depth (a post, a
  tag list, About) plays a single "up" slide straight back; clicking Blog or
  About from any depth plays a single slide straight to that tab's canonical
  direction, never routed back through Home first.

### CSS-only, with a scoped Immersive Zone exception (retired)
**Retired by the Site-wide Continuous World decision** — kept only as a
historical record. Previously: CSS-only was the site's default animation
architecture, with Three.js/WebGL scoped narrowly to the homepage alone, and
every other page's bundle guaranteed free of it by file structure. Three.js is
now the site-wide default background layer (see *Continuous World*); the
guarantee this entry described no longer holds anywhere. The underlying
reason a JS rendering engine needed an exception at all — no UI framework is
installed, so a third-party animation library would only ever run as a bare
`<script>` with no island benefit — still holds and isn't being revisited: the
3D code is still vanilla script with no framework wrapper and no `client:*`
directive, just no longer confined to one file.

## Decisions Log

### Site-wide continuous 3D world (current, supersedes the Immersive/Reading Zone split)
- **Scope**: every page — home, blog index, blog post, tag-filtered list,
  about — now renders the *Continuous World* (see Glossary), not just the
  homepage hero. Retires the Immersive/Reading Zone split, the CSS-only
  default's homepage-only exception, and Threshold Transition (all marked
  retired in the Glossary above) in one move — see
  `docs/adr/0004-site-wide-continuous-world.md` for the full rationale.
- **Independent per-page instances, not one persisted renderer**: each page
  owns its own Three.js instance with its own init/dispose lifecycle — the
  same per-page pattern established below for the homepage — rather than one
  shared renderer/canvas kept alive across real navigations via
  `transition:persist`. Chosen deliberately over true persistence: a shared
  instance's lifecycle bookkeeping (object ownership, camera position at
  arbitrary route depth, dispose correctness) gets harder to reason about as
  more pages are added, and locks every future page into extending one shared
  scene graph. Independent instances stay additive — a new page is a
  self-contained scene module, free to look completely different, with zero
  risk to any other page.
- **Shared utility module**: the Perlin noise / terrain-generation / sky-shader
  / snow-particle logic is factored into one plain utility module (no
  framework wrapper, no `client:*` directive) that every page's own inline
  script imports independently. This doesn't reopen the "no shared component"
  language from the 3D scene architecture bullet below — that was about
  avoiding a framework component wrapper, not about sharing plain functions.
- **Visual consistency despite independent instances**: every page uses the
  same fixed Perlin seed, palette, and terrain parameters, so it reads as the
  same frozen lake seen from a different camera position each time, not a
  freshly randomized terrain per page.
- **Content legibility**: see *Reading Card* and *Floe Card* in the Glossary —
  the Reading Zone's "no decoration behind text" concern is now handled per
  component (a near-opaque panel around body text, a text-only card for list
  entries) instead of by a page-level zone rule.
- **Chrome**: the shared `Header`/`Footer` components are dropped site-wide,
  replaced by a minimal per-page nav (logo + Home/Blog/About), matching the
  homepage prototype's self-contained nav. Search (`SearchModal`) and social
  links are removed, not redesigned — an open follow-up, not a decision to
  keep them out permanently.
- **Performance floor**: the Lighthouse Performance ≥ 90 hard constraint is
  downgraded to a known, accepted tension site-wide (previously flagged only
  for the homepage in `docs/adr/0003-...`) — visual fidelity is prioritized
  over hitting that number for now.

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
- **Script re-execution**: every page's 3D-scene `<script>` carries
  `data-astro-rerun`, so returning to it via real navigation re-executes setup
  (Astro's bundled scripts otherwise run once per session). Originally
  homepage-only; now applies to every page in the *Continuous World*.
- **Resource disposal**: a cleanup routine (cancel the render loop, dispose
  renderer/geometry/materials/textures/envMap, remove event listeners) runs on
  `astro:before-swap` on every page — the last moment its DOM is still present
  before a real navigation away.
- **Device capability**: reuses the same 640px viewport-width breakpoint
  already established for the (now-retired) CSS hero's mobile simplification,
  for consistency — not `hardwareConcurrency`/`deviceMemory` (inconsistent
  browser support).
- **New ADR**: `docs/adr/0003-scoped-webgl-exception-for-immersive-zone.md`
  recorded the original homepage-only exception; it's superseded by
  `docs/adr/0004-site-wide-continuous-world.md` now that every page carries a
  3D scene — see the Site-wide continuous 3D world entry above.

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

### Carried over from the jungle round (theme-independent, but see notes — several superseded by the Site-wide continuous 3D world decision above)
- **Theme scope** (superseded): "full theme in the Immersive Zone, palette-only
  in the Reading Zone" no longer applies — there's no zone split; the full
  theme now renders on every page. See *Continuous World*.
- **Animation technique**: CSS-only by default; see the (now-retired)
  *CSS-only, with a scoped Immersive Zone exception* entry above — Three.js is
  now the site-wide default rendering layer, not a narrow exception.
- **View Transitions scope**: `<ClientRouter />` enabled site-wide (required by
  the API) — still true. "Threshold Transition fires only at the zone
  boundary" is superseded: see *Directional Transition*, which fires on every
  page-to-page navigation, not just a zone crossing.
- **Performance floor** (superseded): downgraded from a hard constraint to a
  known, accepted tension site-wide — see the Site-wide continuous 3D world
  decision above.
- **Reduced motion**: decorative artwork stays fully visible under
  `prefers-reduced-motion`; only motion is removed. Originally
  Immersive-Zone-only, now applies per page site-wide (each page's own
  capability check, same as the homepage's).
- **Theme system**: no light/dark toggle — single, non-switchable theme (see
  `docs/adr/0002-single-theme-extreme-contrast-not-a-toggle.md`). Unaffected by
  the zone split's retirement — the rationale was never about zones, only
  about contrast living within one screen.
