# Testing

The [VM report](docs/VM-TEST-REPORT.md) is a historical pre-2.3.0 report. Use
the checks below for the current release.

## Automated

```bash
omarchy plugin validate .
tests/run
shellcheck prayer-zone.sh prayer-notify.sh tests/*.sh tests/run
```

`tests/run` covers:

- the ES5/QML-compatible engine, all 24 method IDs, official timetable
  fixtures, seeded adhan-js regular and polar fuzz, an independent solar
  check, calculation properties, tuning, Umm al-Qura Hijri and schedules;
- all 60 recorded AlAdhan calendar snapshots plus 36 UAQ Hijri rows;
- model timing, presentation, notifications, method options, suggestions,
  tuning helpers and city-result parsing;
- IPC relocation, timezone validation and DST transitions, legacy cache-file
  cleanup, notification deduplication and delivery retries;
- a Quickshell probe that imports and runs `Engine.js` through QML.

There is no CI; run the suite before publishing.

Optional QML lint (the shell's modules must be reachable as `qs`):

```bash
mkdir -p ~/.cache/omarchy-shell-ref
ln -sfn /usr/share/omarchy/shell ~/.cache/omarchy-shell-ref/qs
/usr/lib/qt6/bin/qmllint -I ~/.cache/omarchy-shell-ref -I /usr/lib/qt6/qml *.qml
```

Expected warnings: `unqualified` (inline components reading the outer id),
`missing-property` (nested `Style` tokens and the bare `bar` object),
`signal-handler-parameters` (`Process.onExited`), and `unused-imports`
(`qs.Ui`). Errors are the signal.

## Recorded and live AlAdhan checks

The stored snapshots are deterministic and run offline through `tests/run`.
To replace them after every provider response succeeds:

```bash
tests/record-aladhan.sh
tests/run
```

The recorder makes 97 rate-limited requests and writes only the fields the
tests use. Review every changed timing and update the documented expected
deltas; do not widen the ±1-minute residual tolerance to accept drift.

To compare the stored corpus with live AlAdhan output without changing it:

```bash
OMAPRAYERS_LIVE=1 node tests/live-oracle.js
```

The live oracle is intentionally outside `tests/run`. See
[Validation](docs/VALIDATION.md) for the matrix, skip rules and current
results.

## In the shell

```bash
omarchy plugin add file://$HOME/Documents/Coding/omarchy-prayer-times --enable
omarchy bar move io.github.salemsayed.omaprayers --section right --index 0
omarchy-shell io.github.salemsayed.omaprayers status
journalctl --user -u omarchy-shell -n 200 --no-pager
```

Check:

- Horizon and Compact; Arabic with Noto Naskh Arabic; the strip chip on a
  horizontal bar and the rotated label on a vertical one.
- After Isha, the next prayer is tomorrow's Fajr.
- 12/24-hour, invalid settings, local timezone refresh, scrolling at text size 20,
  a dark and a light (Aether) theme.
- City search: candidates show region and zone; picking one writes the four
  location keys together and never shows the old location's times under the
  new name. *Detect* applies nothing. `C` and `/` focus the search and suspend
  the single-letter keys while it has focus.
- Calculation controls: switching methods recomputes immediately; Hanafi
  moves Asr later; each tune change writes once; Reset keeps the config-only
  Imsak, Sunset and Midnight values; `M` opens the method picker.
- Pick a city in a mapped country. Its suggested method appears, never applies
  itself, and both Apply and dismiss clear the suggestion.
- Tromsø on a polar date shows the high-latitude approximation note.
- Display controls: each footer button, section control, and the `D`, `S`,
  `B`, `T`, `A` keys write only their key; one slider drag is one write; the
  section scrolls rather than clipping at the height cap.

## Data

Compare Cairo's times for today and tomorrow against a trusted local calendar.
Check method 5, Shafi/Hanafi, tuning offsets, Hijri adjustment and Arabic
labels. Use the live oracle above when an AlAdhan comparison is needed.

## Boundaries

- System timezone different from `Africa/Cairo`: countdowns stay on Cairo
  instants.
- Offline startup and `R`: prayer times calculate normally. City search and
  Detect report their network failure without disturbing the schedule.
- Cairo, London, New York and Lord Howe DST boundaries keep the right wall
  clock and countdown. Kiritimati and Honolulu cross the date line correctly.
- Suspend across a notification: one delivery inside the grace window, none
  outside it.
- Two simultaneous widgets do not duplicate a prayer notification. Repeat on
  physical dual monitors.

## Cleanup

```bash
omarchy plugin disable io.github.salemsayed.omaprayers
omarchy plugin remove io.github.salemsayed.omaprayers
rm -r -- "$HOME/.local/state/omarchy/io.github.salemsayed.omaprayers"   # optional
```
