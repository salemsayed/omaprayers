# Omarchy Prayer Times

A compact prayer-times widget for the Omarchy Quattro shell. It shows the next
prayer in the bar and opens a native, theme-aware schedule panel.

This repository targets the official Omarchy `quattro` plugin contract:

- schema-version 1 manifest at the repository root;
- a `bar-widget` entry point extending Omarchy's `BarWidget`;
- settings stored inline in `shell.json`;
- native `Color`, `Style`, `WidgetButton`, `PanelHero`, and `KeyboardPanel`
  components;
- installation through `omarchy plugin add` and placement through
  `omarchy plugin enable` / `omarchy bar move`.

The implementation was grounded against
[`basecamp/omarchy` at `1fe471dc` on the `quattro` branch](https://github.com/basecamp/omarchy/blob/quattro/docs/omarchy-shell.md).

## Accuracy and resilience

- Uses explicit latitude, longitude, and IANA timezone settings. It never
  assumes that the computer timezone is the prayer-location timezone.
- Requests ISO-8601 timestamps from AlAdhan and uses those absolute instants
  for countdowns and notifications.
- Fetches and atomically caches the current and following month, covering
  tomorrow's Fajr and month/year boundaries.
- Retains a matching cache when offline and clearly marks it stale.
- Serializes refreshes across multiple monitors and applies bounded network
  retries.
- Supports calculation method, Shafi/Hanafi Asr, high-latitude rule, midnight
  mode, Shafaq, Hijri adjustment, custom method parameters, and all nine
  AlAdhan tuning offsets.
- Notifications use Omarchy's native notification helper and are deduplicated
  across monitors and shell reloads.

Prayer calculations are not mosque iqama schedules. Choose the method used by
the closest relevant authority, compare the result with a trusted local
calendar, and use the tuning fields when needed.

## Minimal runtime footprint

There are no bundled frameworks, fonts, audio files, daemons, or package
installers. Runtime dependencies are already part of Omarchy's base system:

- Quickshell and the Omarchy shell UI components;
- Bash, `curl`, `jq`, GNU `date`, `flock`, and coreutils;
- `omarchy-notification-send` when notifications are enabled.

The cache lives under:

```text
~/.local/state/omarchy/prayer-times/salemsayed.prayer-times/
```

## Defaults

The initial profile matches the current setup:

- Cairo (`30.0444`, `31.2357`)
- `Africa/Cairo`
- method 5, Egyptian General Authority of Survey
- standard/Shafi Asr
- angle-based high-latitude adjustment
- 24-hour display
- notifications disabled

All values can be changed from the widget settings generated from
`manifest.json`, or with `omarchy bar set`.

## Install later on Omarchy

Do not run these steps until the machine is booted into Omarchy Quattro.

For the local development checkout:

```bash
omarchy plugin validate ~/Coding/omarchy-prayer-times
omarchy plugin add file://$HOME/Coding/omarchy-prayer-times --enable
omarchy bar move salemsayed.prayer-times --section right --index 0
```

Once the repository is published, use its HTTPS Git URL instead of the local
`file://` URL.

The plugin declares `right` as its default section, so the explicit move is
optional.

## Configuration examples

Settings are inline on the bar entry, as required by Quattro. Examples:

```bash
omarchy bar set salemsayed.prayer-times barDisplay "Icon only"
omarchy bar set salemsayed.prayer-times timeFormat "12-hour"
omarchy bar set salemsayed.prayer-times notifications true --json
omarchy bar set salemsayed.prayer-times notifyBeforeMinutes 15 --json
omarchy bar set salemsayed.prayer-times hanafi true --json
```

Changing location should always update all three fields together:

```bash
omarchy bar set salemsayed.prayer-times locationLabel "Alexandria"
omarchy bar set salemsayed.prayer-times latitude "31.2001"
omarchy bar set salemsayed.prayer-times longitude "29.9187"
omarchy bar set salemsayed.prayer-times timezone "Africa/Cairo"
```

See [Configuration](docs/CONFIGURATION.md) for every option.

## Controls

- Left or middle click: toggle the schedule panel.
- Right click: force an online refresh.
- `R` while the panel is open: force refresh.
- `Esc`: close the panel.
- `Tab` / `Shift+Tab`: switch between adjacent Omarchy panels.

## Deferred verification

The code has intentionally not been executed or installed yet. The complete
Omarchy-side verification sequence is in [TESTING.md](TESTING.md) for use when
the machine is back on the Quattro partition.

## License

[MIT](LICENSE)
