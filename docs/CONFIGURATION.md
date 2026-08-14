# Configuration

Omarchy Quattro stores widget settings directly on the widget's entry in
`~/.config/omarchy/shell.json`. There is no nested `config` object.

## Location and calculation

| Setting | Default | Meaning |
|---|---:|---|
| `locationLabel` | `Cairo` | Human-readable label only |
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
| `timeFormat` | `24-hour` | `24-hour`, `12-hour` |
| `language` | `English` | `English`, `Arabic` |
| `barDisplay` | `Name + countdown` | `Icon only`, `Name + countdown`, `Name + time`, `Countdown only` |
| `showSunrise` | `true` | Show sunrise as an informational row |
| `showNightMarkers` | `true` | Show Imsak, midnight, first third, and last third |
| `highlightBeforeMinutes` | `15` | Apply the Omarchy accent color as the next prayer approaches |

The plugin contains no fixed palette or font. It consumes the current Omarchy
bar colors, `Color.accent`, `Style.font.*`, `Style.spacing.*`, and
`Style.cornerRadius`; its panel bounds are also passed through Omarchy's scaled
spacing helpers. Aether-generated themes work through these same native tokens
and require no plugin-specific integration.

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
  "id": "salemsayed.prayer-times",
  "locationLabel": "Cairo",
  "latitude": "30.0444",
  "longitude": "31.2357",
  "timezone": "Africa/Cairo",
  "calculationMethod": 5,
  "hanafi": false,
  "timeFormat": "24-hour",
  "barDisplay": "Name + countdown",
  "notifications": true,
  "notifyBeforeMinutes": 10
}
```

Use the Omarchy settings UI or `omarchy bar set` when possible so the shell
reloads the canonical configuration safely.
