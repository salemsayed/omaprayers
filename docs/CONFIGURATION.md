# Configuration

Settings live on the widget's entry in `~/.config/omarchy/shell.json`. Use the
panel, the Omarchy settings UI, or `omarchy bar set`.

## Location and calculation

| Setting | Default | Panel | Meaning |
|---|---:|---|---|
| `locationLabel` | `Cairo` | City picker | Label shown in the panel |
| `locationLabelAr` | empty | Reset by city picker | Label in Arabic mode; falls back to `locationLabel` |
| `latitude` | `30.0444` | City picker | Prayer-location latitude |
| `longitude` | `31.2357` | City picker | Prayer-location longitude |
| `timezone` | `Africa/Cairo` | City picker | IANA timezone of that location |
| `calculationMethod` | `5` | Yes | Local calculation method; IDs are listed below |
| `hanafi` | `false` | Yes | `false` for Shafi Asr; `true` for Hanafi Asr |
| `highLatitudeRule` | `Angle based` | No | `Middle of the night`, `One seventh`, `Angle based` |
| `midnightMode` | `Standard` | No | `Standard` or `Jafari` |
| `shafaq` | `General` | No | `General`, `Red`, `White` for method 15 |
| `hijriAdjustment` | `0` | No | Hijri date offset, -2 to +2 days |
| `tune` | nine zeroes | Six values | Minute offsets: Imsak,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Sunset,Isha,Midnight |
| `customMethodSettings` | empty | No | Method 99: Fajr angle, Maghrib angle, Isha angle |

The panel's city search (`C` or `/`, or the gear) writes `locationLabel`,
`latitude`, `longitude` and `timezone` together, so the zone always matches
the place. *Detect* only fills the search box. Changing a location rebuilds
the schedule locally and resets `locationLabelAr`. A mapped country may show
a method suggestion; it is never applied automatically.

The method picker opens from the Calculation section or with `M`. The panel
also edits Shafi/Hanafi Asr and the Fajr, Sunrise, Dhuhr, Asr, Maghrib and
Isha tuning values. Imsak, Sunset and Midnight tuning are configuration-only.
Each panel tuning field accepts -60 to +60 minutes.

Method 99 reads three comma-separated angles from `customMethodSettings`:
Fajr, Maghrib and Isha. A blank or `null` component uses 15°, sunset and 15°,
respectively. Other methods ignore this setting.

### Calculation methods

The IDs are unchanged from earlier releases and remain compatible with the
AlAdhan method IDs. Calculation is local.

| ID | Method |
|---:|---|
| `0` | Shia Ithna-Ashari, Leva Institute, Qum |
| `1` | University of Islamic Sciences, Karachi |
| `2` | Islamic Society of North America |
| `3` | Muslim World League |
| `4` | Umm al-Qura University, Makkah |
| `5` | Egyptian General Authority of Survey |
| `7` | Institute of Geophysics, University of Tehran |
| `8` | Gulf Region |
| `9` | Kuwait |
| `10` | Qatar |
| `11` | Majlis Ugama Islam Singapura |
| `12` | Union des Organisations Islamiques de France |
| `13` | Diyanet İşleri Başkanlığı, Turkey |
| `14` | Spiritual Administration of Muslims of Russia |
| `15` | Moonsighting Committee Worldwide |
| `16` | Dubai |
| `17` | Jabatan Kemajuan Islam Malaysia |
| `18` | Tunisia |
| `19` | Algeria |
| `20` | Kementerian Agama, Indonesia |
| `21` | Morocco |
| `22` | Comunidade Islâmica de Lisboa |
| `23` | Ministry of Awqaf, Jordan |
| `99` | Custom |

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
gear, and the `D`, `S`, `B`, `T`, `A` keys). They repaint without recalculating
prayer times. A widget that is installed but not on the bar keeps panel
changes for the session only.

Colours, fonts, spacing and corner radius come from the current Omarchy theme.
Vertical bars replace the strip chip with a rotated text label.

## Notifications

| Setting | Default | Meaning |
|---|---:|---|
| `notifications` | `false` | Prayer-time notifications |
| `notifyBeforeMinutes` | `10` | Advance notification; 0 disables it |
| `notificationGraceMinutes` | `10` | Deliver an event missed during suspend if it is this recent |

The panel edits `notifications`. The advance and grace values are
configuration-only.

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
