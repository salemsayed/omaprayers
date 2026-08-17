# Configuration

Omarchy Quattro stores widget settings directly on the widget's entry in
`~/.config/omarchy/shell.json`. There is no nested `config` object.

## Location and calculation

| Setting | Default | Meaning |
|---|---:|---|
| `locationLabel` | `Cairo` | Human-readable label only |
| `locationLabelAr` | empty | Label shown in Arabic mode when set; otherwise `locationLabel` is used |
| `latitude` | `30.0444` | Prayer-location latitude |
| `longitude` | `31.2357` | Prayer-location longitude |
| `timezone` | `Africa/Cairo` | Installed IANA timezone for that location |
| `calculationMethod` | `5` | AlAdhan calculation-method ID |
| `hanafi` | `false` | Use Hanafi Asr shadow length |
| `highLatitudeRule` | `Angle based` | `Middle of the night`, `One seventh`, or `Angle based` |
| `midnightMode` | `Standard` | `Standard` or `Jafari` |
| `shafaq` | `General` | `General`, `Red`, or `White`; relevant to method 15 |
| `hijriAdjustment` | `0` | API-side Hijri date adjustment from -2 to +2 days |
| `tune` | nine zeroes | Imsak,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Sunset,Isha,Midnight offsets |
| `customMethodSettings` | empty | Method 99 values: Fajr angle, Maghrib angle/minutes, Isha angle/minutes |

`locationLabel`, `latitude`, `longitude`, and `timezone` are settable from the
panel: press `C` (or `/`) with the panel open, or use the gear, and search for a
city. Candidates list their region and IANA timezone, and picking one writes all
four keys together — a search resolves the zone rather than leaving it to be
matched by hand, which is the mistake this section otherwise warns about. The
Detect button fills the search box from the connection's apparent city and waits
for confirmation; it never applies a location by itself.

Committing a location clears the cached calendar and fetches again, because these
keys are part of the cache fingerprint. `locationLabelAr` is cleared at the same
time, so set it afterwards if an Arabic label is wanted. The remaining
calculation settings below stay configuration-only.

Method 99 requires exactly three comma-separated custom values. Conversely,
custom values are rejected for every non-99 method so a setting cannot appear
active while being omitted from the provider request.

AlAdhan recommends choosing the calculation authority closest to the location.
Method 5 is the Egyptian General Authority of Survey. Current method details
are available from the [AlAdhan calculation-method documentation](https://aladhan.com/calculation-methods)
and its `/v1/methods` endpoint.

## Presentation

| Setting | Default | Values |
|---|---:|---|
| `panelStyle` | `Horizon` | `Horizon` draws the day to scale with window lengths; `Compact` is the ruled timetable card |
| `timeFormat` | `24-hour` | `24-hour`, `12-hour` |
| `language` | `English` | `English`, `Arabic` |
| `arabicFont` | `Noto Naskh Arabic` | Font family used for Arabic prayer names, dates, and countdown units |
| `barDisplay` | `Strip + countdown` | `Strip + countdown`, `Icon only`, `Name + countdown`, `Name + time`, `Countdown only` |
| `showSunrise` | `true` | Show sunrise as an informational row |
| `showNightMarkers` | `true` | Show Imsak, midnight, first third, and last third |
| `highlightBeforeMinutes` | `15` | Apply the Omarchy accent color as the next prayer approaches |

Every setting in this table except `arabicFont` is also settable from the panel:
the footer holds a layout switch, a bar-label switch, and a gear that unfolds
the display section, and the keys `D`, `S`, `B`, `T`, and `A` reach the same
values. A change is applied locally on the click and written back to the
widget's entry through the shell, so the panel and `shell.json` never disagree.

None of these keys take part in the cache's configuration key, which is why
they are safe to change from the panel: the schedule is repainted rather than
discarded. The location and calculation settings above do invalidate the cache
and trigger a fetch, so they stay configuration-only.

When the widget has no writable entry — it is installed but not placed on the
bar — a panel change still applies for the session and is simply not persisted.

The plugin contains no bundled palette or font files. It consumes the current
Omarchy bar colors, `Color.accent`, `Style.font.*`, `Style.spacing.*`, and
`Style.cornerRadius`; its panel bounds are also passed through Omarchy's scaled
spacing helpers. Aether-generated themes work through these same native tokens
and require no plugin-specific integration.

`Noto Naskh Arabic` must be installed when Arabic mode is used. Arch and
Omarchy ship it in the `noto-fonts` package. The bar's monospace font has no
Arabic glyphs, which is why `arabicFont` is configurable separately.

The `Strip + countdown` chip is used on horizontal bars. Left and right
vertical bars replace it with the rotated text label because the horizontal
mini strip does not fit their width.

## Fetching and notifications

| Setting | Default | Meaning |
|---|---:|---|
| `refreshHours` | `24` | Maximum cache age before an online refresh |
| `notifications` | `false` | Enable prayer-time notifications |
| `notifyBeforeMinutes` | `10` | Optional advance notification; 0 disables it |
| `notificationGraceMinutes` | `10` | Deliver a recently crossed event after resume, within this window |

The at-prayer notification is always included when notifications are enabled.
An advance notification is never emitted after the actual prayer time. A
failed desktop delivery receives two retries at five-second intervals; the
panel shows a warning if all three attempts fail.

## Direct shell.json example

```json
{
  "id": "io.github.salemsayed.omaprayers",
  "locationLabel": "Cairo",
  "locationLabelAr": "القاهرة",
  "latitude": "30.0444",
  "longitude": "31.2357",
  "timezone": "Africa/Cairo",
  "calculationMethod": 5,
  "hanafi": false,
  "panelStyle": "Horizon",
  "timeFormat": "24-hour",
  "arabicFont": "Noto Naskh Arabic",
  "barDisplay": "Strip + countdown",
  "notifications": true,
  "notifyBeforeMinutes": 10
}
```

Use the Omarchy settings UI or `omarchy bar set` when possible so the shell
reloads the canonical configuration safely.
