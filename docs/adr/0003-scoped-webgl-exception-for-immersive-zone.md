# Immersive Zone gets a scoped exception to the CSS-only default

*Status: superseded by [ADR-0004](0004-site-wide-continuous-world.md) — the
"deliberately narrow, homepage-only" premise below no longer holds. Kept as a
historical record of why Three.js needed an exception to CSS-only at all,
which ADR-0004 does not revisit.*

The site's animation architecture defaults to CSS-only, specifically because no
UI framework is installed and a third-party JS animation library would only
ever run as a bare `<script>` with no island benefit. The homepage hero is now
a genuine Three.js/WebGL 3D scene — a real rendering engine, not an
input-reading script feeding CSS. We considered keeping the CSS-only ice hero
(issue #2) and treating the 3D scene as a separate experiment, but the
confirmed prototypes' visual bar (a real procedural terrain, PBR ice material,
camera-orbit interaction) isn't achievable in CSS, so we're accepting the
exception rather than approximating it.

This exception is deliberately narrow: the 3D code lives only in `index.astro`'s
own `<script>` (no framework wrapper, no shared component), so Astro's default
per-page bundling keeps it out of every other page automatically. The Reading
Zone and all site chrome remain governed by the CSS-only default — this ADR
does not open the door to JS animation elsewhere on the site.

## Consequences

- `three` is now a real npm dependency and the homepage requires WebGL for its
  designed experience; a capability check falls back to static markup when
  WebGL or `prefers-reduced-motion` rule it out (see `CONTEXT.md`).
- The Lighthouse Performance ≥ 90 floor, set for the CSS-only hero, is not
  guaranteed to hold for a full WebGL/PBR scene — this is a known, flagged
  tension (see the spec for issue #3), not silently resolved by this ADR.
- The CSS-only ice hero from issue #2 is retired, not kept as a fallback —
  see `CONTEXT.md`'s Ice-3D / Frozen Lake decision log entry.
