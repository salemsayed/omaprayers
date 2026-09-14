# Changelog

## 2.3.4 - 2026-09-14

- Limit city-search responses to 64 KiB and location-detection responses to
  1 KiB, including transfers without a Content-Length header. Ignore local
  curl configuration so these requests keep their bounded behavior.
- Discard failed transfers before parsing or populating the city picker.
- Limit geocoding to six candidates with bounded text fields and valid
  coordinates; reject oversized detection terms and parser input.
- Avoid a day-strip binding error while changing location timezones.

## 2.3.3 - 2026-09-14

- Fix panel dismissal on Omarchy 4.0.3 so Escape, outside clicks and clicking
  the widget again release desktop input. Use the shell's hover-suppression
  setter while retaining support for older shells. Thanks to Lutfi Zain (#4).
- Add a Center panel toggle under Display settings. Disable it to open the
  panel by the clicked widget; the default keeps the panel centered.
  Thanks to SaifOmar (#2).

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
