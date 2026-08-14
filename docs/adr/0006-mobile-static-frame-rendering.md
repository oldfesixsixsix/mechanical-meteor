# Mobile background renders one frame and pauses, instead of looping continuously

*Status: accepted — refines [ADR-0004](0004-site-wide-continuous-world.md)'s
Device Capability note, doesn't supersede it.*

ADR-0004 established a shared sub-640px breakpoint that lowers segment and
particle counts on mobile for every *Continuous World* scene. That reduced
the cost of each frame, but every scene's `requestAnimationFrame` loop still
ran continuously regardless of device — every frame drawn is a frame
competing with the compositor thread for scroll/touch handling. Mobile
reading pages (blog index, tag lists, individual posts) are exactly where
that competition is most visible, and lowering segment/particle counts
further wasn't going to fix it: the problem isn't per-frame cost, it's that a
frame is being drawn continuously at all.

On mobile, every scene (`index.astro`, `IceBackground.astro`,
`BlogPost.astro`) now renders exactly one frame on init and cancels its
render loop, rather than running it every frame. The homepage's drag-to-orbit
and regen interactions still work on mobile, but move to render-on-demand: a
frame is drawn only in direct response to a pointer/drag/regen event, and the
loop stops again as soon as input stops — unlike desktop, where the loop
always runs. The breakpoint check stays a one-time read at page load, with no
resize/orientation-change listener, consistent with how the breakpoint is
already checked elsewhere in these scenes; rotating a phone or resizing a
window mid-session across the 640px line is judged too rare to justify the
added state-transition complexity.

We considered swapping WebGL out entirely on mobile for a static image or CSS
gradient — the simplest possible fix, and zero Three.js cost on mobile at
all. Rejected because it would need separate art assets to keep and would
visibly break ADR-0004's "same frozen lake, different camera" premise: mobile
would no longer be showing the same scene as desktop, just something that
resembles it.

## Consequences

- The mobile pixel-ratio/segment/particle tuning ADR-0004 already put in
  place still matters (it's the cost of the one frame that does render), but
  is no longer what actually fixes the scroll jank — the loop cancellation is.
- The homepage's render-on-demand path is a second code path from desktop's
  always-on loop; each scene's init script now needs to know which branch
  it's on.
