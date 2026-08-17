# Verification guide

The core checks below were run on 2026-08-14 in a disposable KVM installation
of the Omarchy 4.0.0 RC2 ISO. The guest used a QCOW2 overlay and had no host
block device attached. See [the VM report](docs/VM-TEST-REPORT.md) for the exact
coverage and qualification limits.

## 1. Source and manifest checks

```bash
cd ~/Documents/Coding/omarchy-prayer-times
omarchy plugin validate .
tests/run
/usr/lib/qt6/bin/qmllint -I ~/.cache/omarchy-shell-ref -I /usr/lib/qt6/qml *.qml
shellcheck prayer-data.sh prayer-notify.sh tests/Scripts.test.sh tests/fake-curl.sh tests/run
```

The `qs.Commons` and `qs.Ui` imports resolve during linting only if the shell's
modules are reachable under the module name `qs`, so the reference directory
holds an entry called `qs` and Quickshell's own QML directory is passed as a
second import path rather than copied in:

```bash
mkdir -p ~/.cache/omarchy-shell-ref
ln -sfn /usr/share/omarchy/shell ~/.cache/omarchy-shell-ref/qs
```

It is a developer convenience, not a repository dependency.

Errors are the signal, and there should be none. The run does report four
categories of warning, all of them expected: `unqualified`, from inline
components reading their file's outer id; `missing-property`, from the nested
`Style.font` and `Style.spacing` tokens and from `bar`, which the shell declares
as a bare `QtObject`; `signal-handler-parameters`, from the `Process.onExited`
handlers; and `unused-imports`, which misjudges `qs.Ui`.

`tests/run` covers 45 JavaScript model scenarios plus option validation,
generated provider fixtures, fresh/cached/stale behavior, corrupt caches,
malformed/short/incomplete responses, concurrent fetches, and notification
deduplication and retry safety. There is no CI runner; run `tests/run` locally
before publishing a change.

## 2. Install the local checkout

```bash
omarchy plugin add file://$HOME/Documents/Coding/omarchy-prayer-times --enable
omarchy bar move io.github.salemsayed.omaprayers --section right --index 0
omarchy plugin list
```

Confirm the plugin appears once and that `~/.config/omarchy/shell.json` has one
inline bar entry.

## 3. Shell loading and theme checks

```bash
omarchy-shell shell listPlugins | jq
omarchy-shell io.github.salemsayed.omaprayers status
journalctl --user -u omarchy-shell -n 200 --no-pager
```

The VM check list includes:

- both Horizon and Compact panel layouts;
- Arabic labels, localized countdowns, and Noto Naskh Arabic rendering;
- the strip chip on a horizontal bar and its rotated text-label fallback on a
  vertical bar;
- the post-Isha state where the next prayer is tomorrow's Fajr;
- 12/24-hour clocks, invalid-setting UI, keyboard refresh, and clipped
  scrolling at Omarchy text size 20;
- Tokyo Night and an Aether-generated light theme.

The location picker adds these checks:

- a city search lists candidates with their region and IANA timezone, and
  same-named cities in different zones stay distinguishable;
- picking one writes `locationLabel`, `latitude`, `longitude`, and `timezone`
  together, clears `locationLabelAr`, leaves every other key untouched, and
  refetches for the new location;
- the panel never shows the previous location's timings under the new name;
- `Detect` fills the search box and applies nothing on its own;
- a failed or empty search reports itself and leaves the current location alone;
- `C` and `/` reach the search field, and while it holds focus the panel's
  single-letter shortcuts stop firing;
- folding the section away returns the keys to the panel.

The display controls add these checks:

- each footer button and each control in the display section writes its key to
  the bar entry in `shell.json` and leaves every other key untouched;
- the `D`, `S`, `B`, `T`, and `A` keys match their equivalent controls;
- the section renders and mirrors correctly in Arabic, in both layouts;
- the bar-label dropdown's popup suspends the panel's own key handling while it
  is open;
- one slider drag produces one write, not one per step;
- a widget that is installed but not on the bar accepts a change for the session
  without a write;
- with the section open the panel reaches its height cap and scrolls rather than
  clipping the last row.

Multi-monitor geometry and real suspend/resume remain physical-session checks.

## 4. Data qualification

Compare Cairo's Fajr, Dhuhr, Asr, Maghrib, and Isha for today and tomorrow
against:

1. the AlAdhan response stored in the cache;
2. AlAdhan's Cairo calendar page;
3. a trusted local Egyptian authority or mosque calendar.

Confirm method 5, Shafi/Hanafi switching, all tuning offsets, 12/24-hour
display, Hijri adjustment, Arabic labels, and explicit timezone display.

## 5. Boundary and failure checks

- Set the system timezone different from `Africa/Cairo`; countdowns must remain
  tied to Cairo instants.
- Inspect after Isha; next prayer must use tomorrow's Fajr timestamp and time.
- Exercise December 31 visually with temporary clock isolation rather than
  changing the production clock; the normal two-month fixture suite verifies
  the same normalization path for the current month boundary.
- Disconnect networking, force refresh, and confirm the matching cache remains
  visible with a stale warning and no five-second retry storm.
- Change coordinates while offline and confirm old-location timings are not
  presented as the new location.
- Suspend across a notification, then verify one notification within the grace
  window and none outside it.
- The concurrency suite proves two simultaneous widget refreshes make only one
  pair of monthly requests. Repeat the notification check on physical dual
  monitors to qualify the compositor-specific path.

## 6. Cleanup / rollback

```bash
omarchy plugin disable io.github.salemsayed.omaprayers
omarchy plugin remove io.github.salemsayed.omaprayers
```

The cache is intentionally retained. Remove only this exact directory if a
full reset is desired:

```bash
rm -r -- "$HOME/.local/state/omarchy/io.github.salemsayed.omaprayers"
```
