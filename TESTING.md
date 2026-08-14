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
shellcheck prayer-data.sh prayer-notify.sh tests/Scripts.test.sh tests/fake-curl.sh tests/run
```

`tests/run` covers 21 JavaScript model scenarios plus option validation,
generated provider fixtures, fresh/cached/stale behavior, corrupt caches,
malformed/short/incomplete responses, concurrent fetches, and notification
deduplication and retry safety. The GitHub Actions workflow runs the same suite
and ShellCheck on every push and pull request.

## 2. Install the local checkout

```bash
omarchy plugin add file://$HOME/Coding/omarchy-prayer-times --enable
omarchy bar move salemsayed.prayer-times --section right --index 0
omarchy plugin list
```

Confirm the plugin appears once and that `~/.config/omarchy/shell.json` has one
inline bar entry.

## 3. Shell loading and theme checks

```bash
omarchy-shell shell listPlugins | jq
omarchy-shell salemsayed.prayer-times status
journalctl --user -u omarchy-shell -n 200 --no-pager
```

Horizontal and vertical bars, Tokyo Night, an Aether-generated light theme,
English/Arabic labels, 12/24-hour clocks, compact rows, invalid-setting UI,
keyboard refresh, a post-Isha Arabic tomorrow line, and clipped scrolling at
Omarchy text size 20 are VM-qualified. Multi-monitor geometry and real
suspend/resume remain physical-session checks.

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
omarchy plugin disable salemsayed.prayer-times
omarchy plugin remove salemsayed.prayer-times
```

The cache is intentionally retained. Remove only this exact directory if a
full reset is desired:

```bash
rm -r -- "$HOME/.local/state/omarchy/prayer-times/salemsayed.prayer-times"
```
