# Architecture

## Omarchy shell layer

`manifest.json` declares one third-party `bar-widget`. `BarWidget.qml` extends
the official `BarWidget`, accepts the injected `bar`, `moduleName`, and
`settings` properties, and hosts a lazily rendered detail panel. The popup uses
the same ownership and popout-switch contract as the Quattro clock and weather
widgets.

`Panel.qml` owns refresh scheduling, notification crossing detection, the
native Omarchy panel, and configuration projection. All colors, typography,
spacing, corner radii, bar orientation, and panel placement come from the
Omarchy shell.

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
`~/.local/state` fallback. The directory is forced to mode `0700`; files are
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
- No IP geolocation or ambiguous city-to-coordinate lookup.
- No background daemon or systemd unit.
- No local astronomical implementation to vendor and independently qualify.
- No mosque iqama schedules; calculation adjustments cover authority-specific
  minute differences.

These keep the trusted, unsandboxed plugin small and reviewable.
