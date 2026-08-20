# Configuration

Settings live on the widget's entry in `~/.config/omarchy/shell.json`. Use the
panel, the Omarchy settings UI, or `omarchy bar set`.

## Location and calculation

| Setting | Default | Meaning |
|---|---:|---|
| `locationLabel` | `Cairo` | Label shown in the panel |
| `locationLabelAr` | empty | Label in Arabic mode; falls back to `locationLabel` |
| `latitude` | `30.0444` | Prayer-location latitude |
| `longitude` | `31.2357` | Prayer-location longitude |
| `timezone` | `Africa/Cairo` | IANA timezone of that location |
| `calculationMethod` | `5` | AlAdhan calculation-method ID |
| `hanafi` | `false` | Hanafi Asr |
| `highLatitudeRule` | `Angle based` | `Middle of the night`, `One seventh`, `Angle based` |
| `midnightMode` | `Standard` | `Standard` or `Jafari` |
| `shafaq` | `General` | `General`, `Red`, `White` (method 15) |
| `hijriAdjustment` | `0` | Hijri date offset, -2 to +2 days |
| `tune` | nine zeroes | Minute offsets: Imsak,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Sunset,Isha,Midnight |
| `customMethodSettings` | empty | Method 99 only: Fajr angle, Maghrib angle/minutes, Isha angle/minutes |

The panel's city search (`C` or `/`, or the gear) writes `locationLabel`,
`latitude`, `longitude` and `timezone` together, so the zone always matches
the place. *Detect* only fills the search box. Changing a location clears the
cached calendar, fetches again, and resets `locationLabelAr`.

Method 99 needs exactly three custom values; other methods reject them. Pick
the authority nearest the location — see AlAdhan's
[calculation methods](https://aladhan.com/calculation-methods).

## Presentation

| Setting | Default | Values |
|---|---:|---|
| `panelStyle` | `Horizon` | `Horizon` (to-scale day) or `Compact` (timetable) |
| `timeFormat` | `24-hour` | `24-hour`, `12-hour` |
| `language` | `English` | `English`, `Arabic` |
| `arabicFont` | `Noto Naskh Arabic` | Font for Arabic text (the bar font has no Arabic glyphs) |
| `barDisplay` | `Strip + countdown` | `Strip + countdown`, `Icon only`, `Name + countdown`, `Name + time`, `Countdown only` |
| `showSunrise` | `true` | Show the sunrise row |
| `showNightMarkers` | `true` | Show Imsak, midnight, first and last third |
| `highlightBeforeMinutes` | `15` | Accent the next prayer this many minutes ahead |

All of these except `arabicFont` are also on the panel (footer buttons, the
gear, and the `D`, `S`, `B`, `T`, `A` keys). They repaint the schedule without
refetching. A widget that is installed but not on the bar keeps panel changes
for the session only.

Colours, fonts, spacing and corner radius come from the current Omarchy theme.
Vertical bars replace the strip chip with a rotated text label.

## Fetching and notifications

| Setting | Default | Meaning |
|---|---:|---|
| `refreshHours` | `24` | Maximum cache age before an online refresh |
| `notifications` | `false` | Prayer-time notifications |
| `notifyBeforeMinutes` | `10` | Advance notification; 0 disables it |
| `notificationGraceMinutes` | `10` | Deliver an event missed during suspend if it is this recent |

An advance notification is never sent after the prayer itself. A failed
delivery is retried twice; the panel warns if all attempts fail.

## Example entry

```json
{
  "id": "io.github.salemsayed.omaprayers",
  "locationLabel": "Cairo",
  "locationLabelAr": "القاهرة",
  "latitude": "30.0444",
  "longitude": "31.2357",
  "timezone": "Africa/Cairo",
  "calculationMethod": 5,
  "panelStyle": "Horizon",
  "timeFormat": "24-hour",
  "barDisplay": "Strip + countdown",
  "notifications": true,
  "notifyBeforeMinutes": 10
}
```
