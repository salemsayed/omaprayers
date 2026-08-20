# OmaPrayers

Prayer times in the Omarchy bar: a to-scale day strip or a ruled timetable,
Arabic and English, offline calculation and optional notifications.

## Demo

![OmaPrayers demo: layouts, Arabic, and the city search](docs/images/demo.gif)

`S` switches layouts, `A` switches to Arabic, and the gear opens a city
search that resolves a place to its coordinates *and* timezone.

## Screenshots

![Horizon layout: the prayer day drawn to scale](docs/images/panel-horizon.png)

![Compact layout: the ruled timetable](docs/images/panel-compact.png)

![Arabic presentation](docs/images/panel-arabic.png)

![Settings: city search, calculation method, Asr school and minute tuning](docs/images/panel-location.png)

![The searchable method picker](docs/images/panel-method.png)

Five bar label forms, from name and countdown to a miniature day strip to a
single glyph:

![Bar label forms](docs/images/bar-forms.png)

## Highlights

- **Horizon** draws the day to scale, marks where you are, and compares the
  length of each prayer window. **Compact** is a ruled timetable with a
  night-marker grid.
- The bar chip pairs a miniature day strip with the next prayer countdown.
  Vertical bars use a rotated text label.
- English and Arabic names, dates and countdowns; Arabic uses a configurable
  Noto Naskh Arabic face.
- Prayer times are calculated offline for 24 methods. Choose the method and
  Shafi or Hanafi Asr from the panel, then tune individual times if needed.
- Optional prayer-time and advance notifications, deduplicated across
  monitors and shell reloads.
- Location and presentation are set from the panel. The city search lists
  same-named cities with their region and zone — `Springfield` spans two —
  and applies nothing until you pick one.
- Picking a city can suggest its regional calculation method. The suggestion
  is never applied without confirmation.

## Controls

- Left click toggles the panel; middle click cycles the bar label;
  right click (or `R`) reloads timezone data; `Esc` closes; `Tab` switches to
  the neighbouring panel.

| Key | Effect |
|---|---|
| `D` | Show or hide the settings section |
| `C` or `/` | Jump to the city search |
| `M` | Open the calculation-method picker |
| `S` | Switch the panel layout |
| `B` | Cycle the bar label |
| `T` | Switch 24-hour and 12-hour |
| `A` | Switch English and Arabic |

`H`, `J`, `K`, `L` and `X` are reserved by Omarchy's panels.

## Requirements

- Omarchy 4 (Quattro)
- Bash, GNU coreutils, `jq` and installed `tzdata`
- `curl` for city search and the optional Detect button
- `noto-fonts` for Arabic mode

Prayer-time calculation does not require network access.

## Install

```bash
omarchy plugin add https://github.com/salemsayed/omaprayers.git --enable
```

The widget goes to the right section of the bar; move it with
`omarchy bar move io.github.salemsayed.omaprayers --section right --index 0`
if you prefer another spot.

## Configure

Location, calculation method, Asr school, six tuning values, layout, bar
label, clock format, language, sunrise and night markers, notifications and
the accent lead time are on the panel's settings section. Press `M` to open
the method picker directly.

Use `omarchy bar set` for the same settings and for advanced calculation
options:

```bash
omarchy bar set io.github.salemsayed.omaprayers barDisplay "Icon only"
omarchy bar set io.github.salemsayed.omaprayers panelStyle "Compact"
omarchy bar set io.github.salemsayed.omaprayers timeFormat "12-hour"
omarchy bar set io.github.salemsayed.omaprayers notifications true --json
omarchy bar set io.github.salemsayed.omaprayers calculationMethod 5 --json
omarchy bar set io.github.salemsayed.omaprayers hanafi true --json
omarchy bar set io.github.salemsayed.omaprayers highLatitudeRule "Angle based"
```

Change a location as a set — label, coordinates and timezone:

```bash
omarchy bar set io.github.salemsayed.omaprayers locationLabel "Alexandria"
omarchy bar set io.github.salemsayed.omaprayers latitude "31.2001"
omarchy bar set io.github.salemsayed.omaprayers longitude "29.9187"
omarchy bar set io.github.salemsayed.omaprayers timezone "Africa/Cairo"
```

Every option is in [Configuration](docs/CONFIGURATION.md).

## Remove

```bash
omarchy plugin disable io.github.salemsayed.omaprayers
omarchy plugin remove io.github.salemsayed.omaprayers
```

Notification deduplication state is kept. To delete it too:

```bash
rm -r -- "$HOME/.local/state/omarchy/io.github.salemsayed.omaprayers"
```

## Data sources

Prayer times are calculated locally. The astronomy algorithm is ported from
[adhan-js](https://github.com/batoulapps/adhan-js) and checked against
published timetables, adhan-js and recorded
[AlAdhan](https://aladhan.com/prayer-times-api) output; see
[Validation](docs/VALIDATION.md). AlAdhan is not used at runtime.

The city search uses [Open-Meteo geocoding](https://open-meteo.com/en/docs/geocoding-api);
the optional *Detect* button reads the connection's apparent city from
[wttr.in](https://wttr.in) and only fills the search box. Nothing is applied
until you pick a result.

## Accuracy

Prayer times are calculated offline from explicit latitude, longitude and an
IANA timezone; the computer's timezone is not assumed. The astronomy
algorithm is ported from adhan-js. The engine includes 24 methods, including
Custom, with the built-in minute adjustments and fixed intervals listed in
[Validation](docs/VALIDATION.md).

Validation covers eight official timetable fixtures (462 rows, all within
their published variance), a seeded adhan-js comparison (3,000 regular and
300 polar cases, exact to the second), and a recorded AlAdhan corpus of 60
snapshots across 40 cities: 1,723 days and 18,953 timing cells compared, every
residual within one minute after the documented method differences, 122
polar days where AlAdhan returns invalid output skipped, and 36 Umm al-Qura
Hijri dates matched exactly.

Calculated times are not mosque iqama schedules. Choose the method used by
the nearest authority, select the local Asr school, compare with a trusted
local calendar, then adjust Fajr, Sunrise, Dhuhr, Asr, Maghrib or Isha in the
panel. Imsak, Sunset and Midnight tuning and the high-latitude, midnight,
Shafaq, Hijri and Custom options remain available through configuration.
Defaults: Cairo, method 5 (Egyptian General Authority of Survey), Shafi Asr,
24-hour, English, Horizon, notifications off.

## License

[MIT](LICENSE) · [Third-party notices](THIRD_PARTY_NOTICES.md)
