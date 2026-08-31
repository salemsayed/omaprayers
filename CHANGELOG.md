# Changelog

## 2.3.2 - 2026-08-31

- Render location, Hijri, status, and prayer labels as literal plain text so
  markup-shaped network responses cannot be interpreted by the shell,
  including the shared Omarchy 4.0.1 bar tooltip.
- Constrain hand-edited bar-display settings to the documented option ring
  before Omarchy's inherited dropdown renders them.

## 2.3.1 - 2026-08-31

- Disclose beside the controls, before any request, that city search sends its
  text to Open-Meteo and Detect asks wttr.in for an IP-derived location.
- Validate the plugin against current Omarchy Quattro and run its isolated test
  suite in CI.

## 2.3.0 - 2026-08-21

- Keep the panel IPC target available while moving its bar slot.
