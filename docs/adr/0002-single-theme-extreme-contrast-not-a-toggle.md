# Single theme with extreme internal contrast, not a light/dark toggle

The ice theme deliberately pushes background and decorative elements to
extreme contrast — near-black deep blue against near-blinding ice white —
which could look, from the outside, like an argument for reintroducing a
light/dark toggle (one "bright" mode, one "dark" mode). We're not doing that.
The extreme contrast is a **within-one-screen** design choice: both ends of
the palette are visible simultaneously, on every page, by design (dark
background, bright decoration/highlights, body text held to WCAG AA in
between). There are no two states to switch between — there's one theme that
happens to span a wide range. This reaffirms the site staying a single,
non-switchable theme, previously decided for different (jungle-specific)
reasons in [ADR-0001](0001-remove-light-dark-toggle-for-jungle-theme.md),
which is retained only as a historical record.

## Consequences

- No `ThemeToggle`-equivalent component should be reintroduced for the ice
  theme; any future "make it brighter/darker" request is a request to retune
  the single palette, not to add a second one.
