# Uniform fade transition site-wide, retiring Directional Transition and Utility Page

*Status: accepted — supersedes [ADR-0004](0004-site-wide-continuous-world.md)'s
Directional Transition (not its Continuous World visual premise, which still
holds) and moots [ADR-0005](0005-ambient-soundtrack-and-utility-pages.md)'s
Utility Page carve-out.*

ADR-0004 introduced Directional Transition to sell the site as one
continuous, spatially coherent world: nav-tab clicks always slid in that
tab's fixed canonical direction from Home (Home up, Blog down, About left),
content-depth links always slid right, regardless of the page you actually
navigated from. In practice, a direction that doesn't reflect how you got
there reads as arbitrary rather than orienting once you've clicked around the
site for a while — the site owner flagged it directly as something that gets
annoying with use, not as a bug in the implementation.

Directional Transition is removed outright. Every navigation, nav-tab or
content-depth link alike, now plays the same plain fade Astro's `ClientRouter`
provides by default — the treatment `/settings` already had before this
decision. `DirectionalTransition.astro`, every `data-nav-direction` attribute
(`Nav.astro`, `FloeGrid.astro`, `BlogPost.astro`, `index.astro`), and the
associated CSS keyframes are deleted, not disabled-in-place — there's no
signal a directional model will be wanted back, and leaving the plumbing in
place with the logic switched off would just be dead code wearing a live
attribute.

Because every page now transitions identically, Utility Page — the category
ADR-0005 invented specifically for pages with no canonical direction to
claim — no longer names a real distinction. It's retired alongside
Directional Transition rather than redefined; nothing needs to opt out of a
directional model that no longer exists.

## Consequences

- Continuous World's visual premise (every page reads as the same frozen
  lake from a different camera) is untouched by this decision — only how
  navigation *feels* changed, not what each page looks like. ADR-0004's
  reasoning for the shared seed/palette/terrain-parameters approach still
  holds in full.
- ADR-0005's audio-persistence reasoning (`transition:persist` on the
  `<audio>` element) is unaffected — that was never coupled to Directional
  Transition, only to the same page-lifecycle events.
- Any future page that isn't a nav tab and isn't blog content no longer has a
  named category to reach for (Utility Page is gone); it's just a page with
  the same background and the same fade everything else gets.
