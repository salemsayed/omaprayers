# Architecture

## Omarchy shell layer

`manifest.json` declares OmaPrayers as one third-party `bar-widget` with the
permanent id `io.github.salemsayed.omaprayers`. `BarWidget.qml` extends the
official `BarWidget`, accepts the injected `bar`, `moduleName`, and `settings`
properties, and hosts the detail panel. The popup uses
the same ownership and popout-switch contract as the Quattro clock and weather
widgets.

`Panel.qml` owns settings, timezone data, the calculated schedule, IPC,
notifications, refresh scheduling, and the native Omarchy panel.
`PanelHorizon.qml` and `PanelCompact.qml` are pure presentation layouts.
`Panel.qml` selects them with
`Loader.setSource(url, { "host": root })`, which supplies the `host`
back-reference as an initial property before any layout binding evaluates.

All colors, typography, spacing, corner radii, bar orientation, and panel
placement come from the Omarchy shell. The Loader also passes inherited
`LayoutMirroring` into either presentation layout.

## Writing settings back

`PanelDisplay.qml` is the footer and settings fold both layouts end with. It
contains Location, Calculation and Display sections. Its controls use the
shell's `ButtonGroup`, `Dropdown`, `SearchableDropdown`, `NumberField`,
`ToggleSwitch`, and `PanelSlider`, so the settings surface uses the same theme
tokens as the rest of the panel.

`Panel.persistSettings()` is the single writer. It merges the new values into a
copy of the widget entry, assigns it to its own `settings` and to
`hostWidget.settings`, then calls the host shell's `updateEntryInline`, which
owns the `shell.json` write. The local assignment comes first so the panel
repaints on the click rather than on the file round-trip, and the host widget is
moved in step because it holds the copy that is pushed back down — a stale one
would be written straight back out on the next change. With no writable entry
the local half still applies, which makes an unplaced widget's controls a
session preference instead of a dead click. `BarWidget.qml` delegates its
middle-click to the panel rather than writing its own copy.

The display keys are exactly those absent from `Panel.configKey`, so changing
one does not recalculate the schedule. Calculation keys feed `configKey` and
rebuild the schedule after a 250 ms debounce. A timezone change discards the
old zone table and runs `prayer-zone.sh`; the other calculation settings reuse
the current table. Option rings, bilingual labels, tuning helpers, method
options and wrap-around cycles live in `Model.js` under test.

`PanelLocation.qml` commits only on an explicit pick.
`Model.locationSettings` returns the label, coordinates and timezone as one
object or `null`; a partial write could leave the timezone describing a
different place than the coordinates. `locationLabelAr` is cleared on commit
rather than carried over, since an Arabic label kept from the previous city
would name the wrong place. After a mapped country is picked,
`Model.suggestedMethod` may expose an Apply/Dismiss row. It never changes the
method on its own.

Geocoding runs through a debounced `curl`, one request in flight at a time, with
the newest query refetched when the previous finishes. `Model.parseLocationResults`
drops any candidate without a timezone instead of guessing one.

Two details of the host key handling shape the picker. `PanelKeyCatcher` uses
`Keys.priority: Keys.BeforeItem`, so it takes keys even from a focused
descendant; the search field therefore drives `keysBlocked`, which the catcher's
`blocked` property follows, and the panel restores it when the section folds
away. The catcher also claims `h`, `j`, `k`, `l`, and `x` before emitting
`textKey`, so shortcuts avoid those letters.

## Data layer

```text
BarWidget.qml ─┐
               ├─ Panel.qml ─ prayer-zone.sh --timezone Z ─▶ zone JSON
PanelDisplay   │      │
PanelLocation  │      └─ Engine.buildSchedule(config, zone, nowMs)
PanelHorizon   │                         ▲
PanelCompact ──┘                         └─ Engine.js + Model.js
```

`prayer-zone.sh` validates the IANA timezone and emits local day starts plus
the exact UTC-offset transitions for a 70-day window. It uses GNU `date`,
installed tzdata and `zdump`; it does not use the network. The first day is
yesterday in the target timezone, so the table covers today, tomorrow and at
least two months of forward calculation. The script also removes legacy
calendar cache and lock files left by releases before 2.3.0.

`Engine.js` is pure ES5 shared by QML and Node tests. Its public surface is the
method catalog, method parameter helpers, prayer/day calculations, Umm
al-Qura Hijri conversion, schedule construction, timezone helpers and solar
test helpers. The astronomy is a port of adhan-js and works in UTC epoch
milliseconds. It applies method angles and intervals, Asr school,
high-latitude and polar rules, rounding, Hijri-dependent Umm al-Qura Isha,
and per-time tuning. `buildSchedule()` emits the same today/tomorrow envelope
consumed by `Model.js` and the panel.

There is no prayer-calendar cache or prayer-time network request. The state
directory remains only for `prayer-notify.sh`, which stores notification
deduplication state. City search and Detect keep their separate `curl`
requests to Open-Meteo and wttr.in.

## Time model

`Engine.js` calculates UTC instants, then renders each instant with the offset
in force from the zone table. `Model.js` never constructs prayer timestamps
from a bare `HH:mm` value. Countdowns, next/current prayer selection, tomorrow
rollover, and notification crossings compare ISO-8601 instants. Clock strings
are presentation-only.

Proportional layout geometry comes from the unit-tested `Model.daySegments`
and `Model.nightMarkers` helpers. They unwrap boundaries that cross midnight,
preserve a 24-hour day cycle, and normalize night marks to fractions. Explicit
`x` coordinates are not affected by QML `LayoutMirroring`, so the Horizon
strip, night band, and bar mini strip mirror their fraction positions manually.

This keeps a location such as Cairo correct even if the computer is temporarily
running in another timezone. If polar sunrise or sunset is unavailable, the
engine tries the nearest valid latitude and then the nearest valid day; the
panel marks the result as approximate.

## Notifications

The 30-second tick compares the previous and current epoch, so a suspend or
delayed timer can still detect a crossed prayer. A configurable grace window
prevents hours-old notifications. `prayer-notify.sh` serializes notifications,
persists the last event key, and invokes `omarchy-notification-send` exactly
once across monitors. The key is committed only after successful desktop
delivery. The panel performs two bounded retries for transient failures and
then exposes a warning instead of retrying forever.

## Validation

The engine is checked against eight published timetable fixtures, seeded
adhan-js regular and polar fuzz cases, an independent solar calculation, and
recorded AlAdhan output. The recorded corpus spans all 24 method IDs, 40
locations, DST, high-latitude rules, Asr schools, tuning and Custom. Expected
provider differences are listed rather than hidden behind wider tolerances.
The live AlAdhan drift check is optional and has no runtime role. See
[Validation](VALIDATION.md).

## Deliberate omissions

- No audio or remote media downloads.
- No location that the user did not confirm. City search resolves candidates
  through Open-Meteo geocoding, but each one carries its region and IANA
  timezone and only becomes active when picked, so an ambiguous name is never
  silently resolved. The Detect button reads the connection's apparent city and
  fills the search box with it; it cannot commit, because that address is
  regularly wrong by enough to move prayer times.
- No background daemon or systemd unit.
- No mosque iqama schedules; calculation adjustments cover authority-specific
  minute differences.

These keep the trusted, unsandboxed plugin small and reviewable.
