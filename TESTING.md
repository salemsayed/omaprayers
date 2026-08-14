# Verification guide

The core checks below were run on 2026-08-14 in a disposable KVM installation
of the Omarchy 4.0.0 RC2 ISO. The guest used a QCOW2 overlay and had no host
block device attached. See [the VM report](docs/VM-TEST-REPORT.md) for the exact
coverage and qualification limits.

## 1. Source and manifest checks

```bash
cd ~/Coding/omarchy-prayer-times
omarchy plugin validate .
tests/run
/usr/lib/qt6/bin/qmllint -I ~/.cache/omarchy-shell-ref *.qml
shellcheck prayer-data.sh prayer-notify.sh tests/Scripts.test.sh tests/fake-curl.sh tests/run
```

`~/.cache/omarchy-shell-ref` is a local copy of the Omarchy shell's `qs`
modules plus Quickshell's QML directory, allowing the `qs.Commons` and `qs.Ui`
imports to resolve during linting. It is a developer convenience, not a
repository dependency.

`tests/run` covers 32 JavaScript model scenarios plus option validation,
generated provider fixtures, fresh/cached/stale behavior, corrupt caches,
malformed/short/incomplete responses, concurrent fetches, and notification
deduplication and retry safety. There is no CI runner; run `tests/run` locally
before publishing a change.

## 2. Install the local checkout

```bash
omarchy plugin add file://$HOME/Coding/omarchy-prayer-times --enable
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
