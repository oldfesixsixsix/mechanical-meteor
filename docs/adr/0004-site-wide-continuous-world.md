# Site-wide continuous 3D world, built as independent per-page scenes

*Status: accepted — supersedes [ADR-0003](0003-scoped-webgl-exception-for-immersive-zone.md)'s scoping (not its CSS-only-vs-WebGL reasoning, which still holds).*

ADR-0003 scoped the Three.js/WebGL exception to the homepage alone, specifically
to guarantee every other page's bundle stayed free of it. Making the whole site
feel like one continuous ice world — home, blog index, post, tag-filtered list,
about — breaks that guarantee outright: every page now bundles Three.js. We're
accepting this because the payoff (the site *is* one frozen lake, not a themed
hero bolted onto an otherwise plain blog) was judged worth more than the
narrow-scope guarantee ADR-0003 protected.

We considered keeping one persistent Three.js renderer/scene alive across real
navigations (via `transition:persist`), so the camera could pan between "rooms"
without ever reinitializing — the most literally continuous option. We rejected
it: a single shared instance's lifecycle bookkeeping (which objects currently
exist, camera position at arbitrary route depth, dispose correctness) gets
harder to reason about, not easier, as more pages are added, and it locks every
future page into extending one shared scene graph. Instead each page owns an
independent Three.js instance with its own init/dispose lifecycle, using the
exact per-page pattern ADR-0003 already established for the homepage.
Continuity is simulated, not literal: every page uses the same fixed Perlin
seed, palette, and terrain parameters (via a shared plain utility module, no
framework wrapper) so it reads as the same place seen from a different angle,
and navigation plays a directional slide (down/right/up/left) rather than a
hard cut. This trades true camera continuity for an architecture that stays
additive as pages are added — deliberate, given the near-term plan to keep
adding pages with possibly unrelated visual content.

The Threshold Transition's whiteout-dive (camera dive → whiteout → real
`navigate()` → fade) is retired along with the Immersive/Reading Zone split it
was built to bridge — there's no zone boundary left to cross. It's replaced by
a Directional Transition: nav-tab clicks (Home/Blog/About) always play one
direct slide in that tab's fixed canonical direction from Home, regardless of
how deep the current page is, rather than reversing the path taken to get
there.

## Consequences

- The Lighthouse Performance ≥ 90 floor, already flagged as an unresolved
  tension for the homepage alone in ADR-0003, now applies to every page
  carrying a WebGL scene — still not resolved by this ADR, and now a site-wide
  risk rather than a one-page one.
- `ThresholdWhiteout.astro` and the whiteout-dive script in `index.astro` are
  dead code to remove during implementation, replaced by the new
  directional-transition component.
- The shared `Header`/`Footer` components and their search/social-link
  functionality are dropped site-wide in favor of a minimal per-page nav
  (logo + Home/Blog/About); search and social links are unresolved, not
  redesigned, and need a follow-up decision if they come back.
