# Domain Model

## Glossary

### Immersive Zone
The homepage hero section. Full jungle theme applies here: deep gradient, animated
light shafts, floating/parallax vine and leaf elements, full motion budget. This is
the only zone where continuous/looping animation is permitted.

### Reading Zone
Everything else — blog index, tag pages, individual post pages (`BlogPost` layout),
about page. Inherits the jungle **palette** (gradient tones, accent colors) and may
use **static** decorative elements (e.g. an SVG vine silhouette fixed in a margin),
but carries no floating, parallax, or looping animation. Optimized for long-form
reading comfort, not spectacle. This includes the site-wide Header and Footer:
they take the jungle color palette wherever they render, but never carry vine/leaf
decoration — only the Immersive Zone earns decorative artwork.

### Threshold Transition
The custom "crossing into the jungle" View Transition animation. Fires only on
navigations that cross the Immersive Zone ↔ Reading Zone boundary (home → blog
index/post, or back again). Implemented via `transition:name` on the relevant
elements plus a custom `transition:animate` definition. All other navigations
(Reading Zone ↔ Reading Zone, e.g. post → post, list → post) use Astro's default
`fade` (or no transition) so page-turning during reading stays unobtrusive.

## Decisions Log

- **Theme scope**: Jungle theme is strong in the Immersive Zone, restrained in the
  Reading Zone. Chosen to protect article readability — motion-heavy decoration
  during long-form reading was judged a comfort/accessibility risk.
- **Animation technique**: CSS-only (`@keyframes` + custom properties), no JS
  animation library. Sufficient for float/parallax/light-shaft effects at zero
  bundle cost; avoids introducing a third-party dependency the project doesn't
  otherwise need. GSAP/anime.js were ruled out — no framework integration is
  installed, so they'd only ever run as a bare `<script>`, not an island, and
  weren't judged necessary for this scope of effect.
- **View Transitions scope**: `<ClientRouter />` enabled site-wide (required by
  the API), but the custom Threshold Transition only fires on Immersive↔Reading
  boundary crossings. Reading-internal navigation uses Astro's default fade to
  protect reading flow.
- **Performance floor**: Lighthouse Performance ≥ 90 is a hard constraint, not an
  aspiration. Immersive Zone element count, blur filter use, and mobile-specific
  simplification are all decided in service of this number, not the other way
  around.
- **Reduced motion**: `prefers-reduced-motion` users get a fully static Immersive
  Zone — every animation (float, light shafts, parallax, Threshold Transition)
  disabled, but all decorative artwork (gradient, leaf/vine silhouettes, light
  pools) remains visible as a still composition. Nothing is hidden, only motion
  is removed.
- **Theme system**: The existing light/dark toggle (`ThemeToggle.astro`) is
  removed; the jungle palette becomes the site's single, non-switchable theme.
  See [ADR-0001](docs/adr/0001-remove-light-dark-toggle-for-jungle-theme.md).
