# Real audio persistence, and a Utility Page carve-out from the directional model

*Status: accepted.*

Adding sitewide background music surfaced two decisions worth recording,
both because the obvious-looking alternative was rejected for a reason a
future reader wouldn't otherwise see.

**Real persistence for audio, not the 3D scenes' fake continuity.** ADR-0004
established that every page owns an independent Three.js instance, kept
visually consistent by a shared seed rather than a shared renderer — a
deliberate trade against the complexity of one persistent scene surviving
navigation. The same question came up for the Ambient Soundtrack (see
CONTEXT.md) and got the opposite answer: one real `<audio>` element marked
`transition:persist`, surviving navigation instead of reinitializing per
page. The reason isn't inconsistency — it's that the two features fail
differently when re-initialized. A terrain that regenerates from the same
seed is indistinguishable from one that never stopped; a soundtrack that
jumps back to 0:00 on every click is immediately audible as a restart. Fake
continuity only works when the failure mode is imperceptible.

**Utility Page: a page that looks like the world but isn't a room in it.**
The new `/settings` page needed the same 3D background and Nav as every other
page (visual consistency was explicit), but Directional Transition's
up/down/left/right model had no direction left to give it — Home, Blog, and
About already own up/down/left, and right already means "content depth"
(list → post, post → tag list). Forcing Settings into that model would have
meant either reusing right for something that isn't content, or inventing a
new direction with no cardinal left to express it. Neither was worth it for
one settings page, so Settings opts out of the directional model entirely:
its link carries no `data-nav-direction`, and Astro's default fade handles
the transition instead. This creates a named category — Utility Page — for
any future page that wants the world's look without being a place in it.

## Consequences

- Any future page that isn't blog content and isn't a nav-tab destination
  (a privacy page, a colophon, etc.) has a precedent to follow: Utility Page,
  plain fade, no direction, rather than stretching the direction model.
- The persisted `<audio>` element is now a piece of long-lived cross-page
  state alongside `DirectionalTransition.astro`'s click delegate — both live
  in components rendered on every page and both need to keep working
  correctly across `astro:before-swap`/`astro:page-load`, unlike the 3D
  scenes' per-page init/dispose lifecycle.
- The background track is commercial game music the site owner personally
  likes, not original or licensed content. This ADR doesn't resolve that —
  it's a knowingly accepted risk on a personal site, flagged here so it isn't
  mistaken for an oversight later.
