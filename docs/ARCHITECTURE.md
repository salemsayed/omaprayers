# Architecture

## Omarchy shell layer

`manifest.json` declares OmaPrayers as one third-party `bar-widget` with the
permanent id `io.github.salemsayed.omaprayers`. `BarWidget.qml` extends the
official `BarWidget`, accepts the injected `bar`, `moduleName`, and `settings`
properties, and hosts the detail panel. The popup uses
the same ownership and popout-switch contract as the Quattro clock and weather
widgets.

`Panel.qml` owns settings, data and cache state, IPC, notifications, refresh
scheduling, and the native Omarchy panel. `PanelHorizon.qml` and
`PanelCompact.qml` are pure presentation layouts. `Panel.qml` selects them with
`Loader.setSource(url, { "host": root })`, which supplies the `host`
back-reference as an initial property before any layout binding evaluates.

All colors, typography, spacing, corner radii, bar orientation, and panel
placement come from the Omarchy shell. The Loader also passes inherited
`LayoutMirroring` into either presentation layout.

## Writing settings back

`PanelDisplay.qml` is the footer and the display controls both layouts end with.
Its controls are the shell's own `ButtonGroup`, `Dropdown`, `ToggleSwitch`, and
`PanelSlider`, so the settings surface is themed by the same tokens as the rest
of the panel.

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

The display keys are exactly those absent from `Panel.configKey`, so changing one
cannot invalidate the cache or start a fetch. Option rings, their bilingual
labels, and the wrap-around cycle live in `Model.js` under test.

`PanelLocation.qml` is the exception, and it is deliberately the only one. Its
four keys *are* part of `configKey`, so a commit drops the schedule and refetches
— which is why it commits on an explicit pick rather than on a keystroke, and why
`Model.locationSettings` returns the four keys as one object or `null`. A partial
write would leave the timezone describing a different place than the
coordinates, and that is the one inconsistency the cache fingerprint cannot
catch, because the fingerprint would faithfully match the incoherent config.
`locationLabelAr` is cleared on commit rather than carried over, since an Arabic
label kept from the previous city would name the wrong place.

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

`prayer-data.sh` validates every option before making a request. It asks
AlAdhan's coordinate calendar endpoint for the current and following month
with `iso8601=true` and an explicit `timezonestring`.

The normalized cache stores:

- the exact calculation configuration and a SHA-256 fingerprint;
- provider timestamps as absolute ISO-8601 instants;
- separate `HH:mm` strings for display in the target timezone;
- Gregorian and Hijri dates;
- the API-reported method and timezone;
- cache freshness, fetch time, target-local today/tomorrow, and the next
  target-local midnight.

State uses `$XDG_STATE_HOME` when set and otherwise follows the documented
`~/.local/state` fallback. OmaPrayers keeps its files in
`omarchy/io.github.salemsayed.omaprayers`. The directory is forced to mode
`0700`; files are
created under a `077` umask. Writes use a same-directory temporary file followed
by `mv`, and failed publications clean up their staging files. A per-plugin
`flock` ensures multiple monitors share one network refresh. Stale data is
served only when its configuration fingerprint matches, it contains both the
target-local current day and tomorrow, and all mandatory timestamps for those
days are complete ISO-8601 instants.

## Time model

`Model.js` never constructs prayer timestamps from a bare `HH:mm` value.
Countdowns, next/current prayer selection, tomorrow rollover, and notification
crossings all compare ISO-8601 instants. Clock strings are presentation-only.

Proportional layout geometry comes from the unit-tested `Model.daySegments`
and `Model.nightMarkers` helpers. They unwrap boundaries that cross midnight,
preserve a 24-hour day cycle, and normalize night marks to fractions. Explicit
`x` coordinates are not affected by QML `LayoutMirroring`, so the Horizon
strip, night band, and bar mini strip mirror their fraction positions manually.

This keeps a location such as Cairo correct even if the computer is temporarily
running in another timezone.

## Notifications

The 30-second tick compares the previous and current epoch, so a suspend or
delayed timer can still detect a crossed prayer. A configurable grace window
prevents hours-old notifications. `prayer-notify.sh` serializes notifications,
persists the last event key, and invokes `omarchy-notification-send` exactly
once across monitors. The key is committed only after successful desktop
delivery. The panel performs two bounded retries for transient failures and
then exposes a warning instead of retrying forever.

## Deliberate omissions

- No audio or remote media downloads.
- No location that the user did not confirm. City search resolves candidates
  through Open-Meteo geocoding, but each one carries its region and IANA
  timezone and only becomes active when picked, so an ambiguous name is never
  silently resolved. The Detect button reads the connection's apparent city and
  fills the search box with it; it cannot commit, because that address is
  regularly wrong by enough to move prayer times.
- No background daemon or systemd unit.
- No local astronomical implementation to vendor and independently qualify.
- No mosque iqama schedules; calculation adjustments cover authority-specific
  minute differences.

These keep the trusted, unsandboxed plugin small and reviewable.
