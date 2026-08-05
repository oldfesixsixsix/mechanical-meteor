# Remove the light/dark theme toggle in favor of a single jungle theme

The site currently supports a user-switchable light/dark theme (`ThemeToggle.astro`,
`data-theme` attribute, CSS custom properties in both modes). The jungle redesign
calls for a deep gradient dark-green-to-black palette across the whole site. We
considered keeping the toggle and designing a light-mode jungle variant, or gating
the jungle theme to dark mode only, but decided to remove the toggle entirely and
ship the jungle palette as the site's only theme — a toggle-free single theme best
matches the "immersive from the moment you land" goal, and avoids maintaining a
second (light-mode) palette for an effect that is inherently a dark aesthetic.

## Consequences

- Any visitor with a saved `data-theme=light` preference loses that setting; there
  is no light mode to fall back to.
- Removing `ThemeToggle.astro` and its associated storage/toggle logic is in scope
  for this redesign, not just the visual/CSS layer.
