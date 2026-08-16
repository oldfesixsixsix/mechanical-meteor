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
utility module. Moving between pages plays a *Uniform Fade Transition* rather
than a hard cut. On mobile viewports each page's scene renders a single frame
and pauses its render loop instead of animating continuously — see the Mobile
Static-Frame Rendering decision below.

### Reading Card
The glass panel that long-form body text (blog post body, About page body) is
contained in: the same low-opacity tint as a *Floe Card*, with a stronger
blur (legibility cushion for paragraphs rather than a card label) so the
*Continuous World* background stays visible through it rather than being
hidden behind a solid panel. Revised from an earlier near-opaque version once
seeing it in the browser made the tradeoff concrete — visibility of the 3D
scene through the reading surface won out over maximum text contrast.
Successor to the Reading Zone's "no decorative artwork behind text" concern,
scoped down to the card rather than the whole page.

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

### Directional Transition (retired)
**Retired by the Uniform Fade Transition decision below** — kept only as a
historical record. Previously: the transition that replaced Threshold
Transition once the whole site became one *Continuous World* — the viewport
slid in a fixed direction (down, right, up, or left) between pages, standing
in for movement through one contiguous space rather than a hard cut, with a
canonical (not actual-path-derived) direction per nav tab. Retired because,
in practice, a fixed direction that doesn't reflect how you actually navigated
there read as arbitrary rather than orienting once you'd clicked around the
site for a while. Every navigation now plays the same fade — see *Uniform
Fade Transition*.

### Uniform Fade Transition
The one transition every navigation plays, nav-tab or content-depth link
alike: Astro's plain default fade (the same treatment `/settings` already had
before this decision). Replaced *Directional Transition*'s per-link
`data-nav-direction` slide, which is deleted outright rather than disabled —
see `docs/adr/0007-uniform-fade-transition.md`. The *Continuous World*'s
visual premise (same terrain seed/palette per page) is unaffected; only the
navigation *feel* changed — the "moving through one contiguous space"
illusion no longer gets transition-level reinforcement.

### Utility Page (retired)
**Retired along with Directional Transition** — kept only as a historical
record. Previously: a page that rendered inside the *Continuous World* but
claimed no canonical slide direction (`/settings` was the only one), opting
out of Directional Transition's model via a plain fade. Once every page uses
the same fade (see *Uniform Fade Transition*), this category stopped naming a
real distinction — nothing needs to "opt out" of a model that no longer
exists — so it's retired rather than redefined.

### Ambient Soundtrack
Sitewide background music, played through one `<audio>` element marked
`transition:persist` so playback survives every real navigation without
restarting — unlike the *Continuous World*'s 3D scenes, which deliberately
*don't* persist a single instance (see the Decisions Log's fake-continuity
rationale) because a re-initialized visual scene is imperceptible but a
restarted audio track is jarring. Defaults to on for every visitor, but
actual playback only starts on the first user gesture anywhere on the site
(browser autoplay policy) and the on/off choice thereafter is remembered in
`localStorage`. Controlled from the `/settings` *Utility Page* by its own
independent toggle — a separate control from *Snow Ambience* and *UI Click
Sounds*, not one combined "audio" switch; see the toggle-split Decisions Log
entry below for why.

### Snow Ambience
A second, independently-toggled `transition:persist` `<audio>` element
layered under the *Ambient Soundtrack* at a deliberately lower relative
volume (`0.45` against the music's `1.0`) — texture, not a second melody.
Same autoplay-on-first-gesture and `localStorage`-remembered on/off
mechanics as the Ambient Soundtrack, but its own key and its own `/settings`
toggle, independent of whether the background music is on.

### UI Click Sounds
One-shot sound effects (not looping, not persistent playback state) fired on
nav-tab clicks and on links that enter a post, via a single delegated click
listener keyed off a `data-sfx` attribute rather than per-trigger-site
wiring. Controlled by its own `/settings` toggle, independent of *Ambient
Soundtrack* and *Snow Ambience*. Like both of those, its `<audio>` elements
are marked `transition:persist` — without it, a soft-navigation recreates
the elements via DOM-swap rather than the browser's HTML parser, which never
runs the media resource-selection algorithm, so `.play()` throws
`NotSupportedError` on every page after the first. This was a real bug (only
the very first click of a session ever made a sound) fixed by persisting the
nodes, the same mechanism the other two audio layers already relied on.

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

### Split the combined audio toggle into three, and fixed a persistence bug (current)
- **Bug**: UI click sounds (*UI Click Sounds*) only ever played on the very
  first click of a session. Root cause, confirmed by reproducing it in a
  live browser: their `<audio>` elements weren't marked `transition:persist`,
  so every soft-navigation recreated them via DOM-swap instead of the
  browser's HTML parser — the media resource-selection algorithm never ran,
  and `.play()` threw `NotSupportedError` on every page after the first.
  Fixed by persisting the nodes, the same mechanism *Ambient Soundtrack* and
  *Snow Ambience* already used.
- **Problem**: the `/settings` toggle labeled "環境音" (environment sound)
  actually controlled both the background music and the snow ambience
  together, as one combined on/off state — the name implied only the snow
  layer, and the site owner couldn't isolate the snow track to confirm by
  ear whether it was actually playing (it was — just deliberately mixed
  quiet, see *Snow Ambience*).
- **Decision**: split into three fully independent toggles — background
  music, snow ambience, and UI click sounds (already independent) — each
  with its own `localStorage` key and its own `/settings` row. No prior
  decision blocked this: `AmbientAudio.astro`'s comment had claimed a
  rationale lived in this file for why the toggle wasn't split, but no such
  rationale actually existed here — a dangling reference from before *Snow
  Ambience* existed, now corrected.
- **Accepted edge case**: a returning visitor who'd already turned the old
  combined toggle off will see the new, separate snow-ambience toggle default
  back to on (no `localStorage` key exists for it yet, and unset means on).
  Not worth migration code for a low-traffic personal site.

### Uniform fade transition, retiring Directional Transition and Utility Page (current)
- **Problem**: *Directional Transition*'s canonical-not-actual-path direction
  per nav tab (Home always up, Blog always down, About always left,
  regardless of where you clicked from) read as arbitrary after repeated use
  rather than orienting — flagged directly by the site owner as something
  that "gets annoying after a while."
- **Decision**: every navigation, nav-tab or content-depth link alike, now
  plays the same *Uniform Fade Transition*. `DirectionalTransition.astro` and
  every `data-nav-direction` attribute (`Nav.astro`, `FloeGrid.astro`,
  `BlogPost.astro`, `index.astro`) and its CSS keyframes are deleted, not
  disabled-in-place — there's no signal a directional model will be wanted
  back.
- **Utility Page retired, not redefined**: it existed solely to name pages
  that opted out of the (now-gone) directional model; with nothing left to
  opt out of, the category stopped meaning anything distinct and is retired
  alongside it.
- **What's unaffected**: *Continuous World*'s visual premise (every page
  reads as the same frozen lake from a different camera) is untouched — this
  decision only changes how navigation *feels*, not what each page looks
  like.
- **New ADR**: see `docs/adr/0007-uniform-fade-transition.md`.

### Mobile static-frame rendering + render-on-demand (current)
- **Problem**: every *Continuous World* scene's `requestAnimationFrame` loop
  ran continuously regardless of device, competing with scroll/touch handling
  on mobile GPUs. The existing sub-640px breakpoint already lowered segment
  and particle counts (see the Site-wide continuous 3D world entry below),
  but that only reduced per-frame cost — it didn't stop frames from being
  drawn continuously, which was the actual source of visible jank while
  reading on mobile.
- **Decision**: on mobile, every scene (`index.astro`, `IceBackground.astro`,
  `BlogPost.astro`) renders exactly one frame on init, then cancels its
  render loop instead of running it continuously. The breakpoint check stays
  a one-time read at page load, consistent with how it's already checked
  elsewhere — no resize/orientation-change listener.
- **Homepage stays interactive via render-on-demand**: drag-to-orbit and the
  regen button still work on mobile, but draw a frame only in direct response
  to input and stop again once input stops, rather than sharing the desktop's
  always-on loop.
- **Rejected alternative**: swapping WebGL out for a static image/CSS
  gradient on mobile — would need separate art assets and would break
  *Continuous World*'s "same frozen lake, different camera" premise, since
  mobile would visibly not be the same scene as desktop.
- **New ADR**: see `docs/adr/0006-mobile-static-frame-rendering.md`.

### Ambient Soundtrack + a Settings Utility Page (current)
- **Feature**: sitewide background music (an MP3 the site owner personally
  likes — a commercial game track, not original/licensed content; a knowingly
  accepted personal-site risk, not something resolved here). Plays
  continuously across navigation, on by default for every visitor, loops at
  the end.
- **Why the 3D scenes' "fake continuity" trick doesn't work here**: the
  *Continuous World*'s per-page Three.js instances re-initialize on every
  navigation and rely on a fixed seed/palette to look unbroken — acceptable
  because a viewer can't perceive "the terrain regenerated," only that it
  looks the same. A restarted audio track from 0:00 on every page is
  immediately, jarringly perceptible in a way a re-initialized visual scene
  isn't. So the *Ambient Soundtrack* uses real persistence — one `<audio>`
  element marked `transition:persist` — rather than the 3D scenes' pattern.
  Two different continuity problems, two different solutions; this doesn't
  reopen ADR-0004's reasoning for the 3D scenes, which still holds.
- **Autoplay**: browsers block audio-with-sound before a user gesture, so
  "on by default" only actually starts sound on the visitor's first
  click/keypress anywhere on the site, not on page load. The on/off
  preference persists in `localStorage` afterward.
- **New page, new category**: control lives on a new `/settings` page rather
  than a floating always-visible toggle or a fourth Home/Blog/About tab — the
  site owner wants a durable home for future settings too, not just this one.
  `/settings` renders the same 3D background and Nav as every other page
  (visual consistency was explicit), but has no free cardinal direction to
  claim in *Directional Transition*'s model (up/down/left already belong to
  Home/Blog/About, right already means content-depth) and reusing "right" for
  a non-content page was explicitly rejected as confusing. This is the first
  *Utility Page* (see Glossary) — a carve-out from the previously-unqualified
  assumption that every page is a directional-model room.
- **Entry point**: `Nav.astro` (currently just three text links, no logo, no
  bar background — see the most recent nav redesign) gets one small icon-only
  link to `/settings`, not a fourth text tab, to protect that redesign's
  minimalism.
- **New ADR**: see `docs/adr/0005-ambient-soundtrack-and-utility-pages.md`.

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
