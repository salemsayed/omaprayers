# Testing

The checks below were last run in a disposable Omarchy 4.0.0 RC2 VM; see
[the VM report](docs/VM-TEST-REPORT.md) for coverage and limits.

## Automated

```bash
omarchy plugin validate .
tests/run
shellcheck prayer-data.sh prayer-notify.sh tests/Scripts.test.sh tests/fake-curl.sh tests/run
```

`tests/run` covers the JavaScript model, option validation, provider
fixtures, fresh/cached/stale behaviour, corrupt caches, malformed responses,
concurrent fetches, and notification deduplication and retries. There is no
CI; run it before publishing.

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
- 12/24-hour, invalid settings, keyboard refresh, scrolling at text size 20,
  a dark and a light (Aether) theme.
- City search: candidates show region and zone; picking one writes the four
  location keys together, refetches, and never shows the old location's times
  under the new name. *Detect* applies nothing. `C` and `/` focus the search
  and suspend the single-letter keys while it has focus.
- Display controls: each footer button, section control, and the `D`, `S`,
  `B`, `T`, `A` keys write only their key; one slider drag is one write; the
  section scrolls rather than clipping at the height cap.

## Data

Compare Cairo's times for today and tomorrow against the cached AlAdhan
response, AlAdhan's Cairo page, and a trusted local calendar. Check method 5,
Shafi/Hanafi, tuning offsets, Hijri adjustment and Arabic labels.

## Boundaries

- System timezone different from `Africa/Cairo`: countdowns stay on Cairo
  instants.
- Offline refresh: the cache stays visible with a stale warning and no retry
  storm; changing coordinates offline never presents old times as new.
- Suspend across a notification: one delivery inside the grace window, none
  outside it.
- Two simultaneous widget refreshes make one pair of requests. Repeat on
  physical dual monitors.

## Cleanup

```bash
omarchy plugin disable io.github.salemsayed.omaprayers
omarchy plugin remove io.github.salemsayed.omaprayers
rm -r -- "$HOME/.local/state/omarchy/io.github.salemsayed.omaprayers"   # optional
```
