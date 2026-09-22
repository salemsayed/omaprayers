# Nojumi desktop verification (2.5.0)

Test date: 2026-09-22, Africa/Cairo. Omarchy 4.0.4 desktop with Quickshell
and one 2560 × 1440 display. Runtime files were installed into the user's
plugin directory, the shell was restarted, and screenshots of the actual
running widget were inspected.

- Searching for `Nojumi` and selecting it through the real picker succeeds.
  The original formal-name-only search failed; the searchable name now
  includes Nojumi in English and نجومي in Arabic.
- Starting with Hanafi enabled and Standard midnight, selecting Nojumi
  preserves both saved settings while displaying standard Asr and
  sunset-to-Fajr midnight. Switching back to Egypt through the picker
  restores Hanafi Asr and Standard midnight without reconfiguring either.
- At 6th of October City on September 22, Nojumi displayed Asr 16:16,
  Maghrib 19:07 and Midnight 00:09. Returning to Egypt restored Hanafi Asr
  17:10 and Midnight 00:49.
- At Qom (34.64, 50.88, Asia/Tehran), Nojumi displayed Fajr 04:30,
  Dhuhr 11:59, Asr 15:26, Maghrib 18:21, Isha 19:13 and Midnight 23:17.
  Both regional branches matched the engine outputs. This checks UI/engine
  integration, not independent verification against an official timetable.
- Compact and Horizon, English and Arabic, and the estimated-Isha note
  were inspected. A 12-hour Horizon layout issue found during testing was
  corrected: Fajr remains visible and night labels wrap without overlap.
- The complete automated suite, actual Node/Quickshell parity, manifest
  validation, ShellCheck and whitespace checks passed. Six additional
  Nojumi regression cases cover engine conventions, regional angles,
  tuning, every existing method's school and midnight options, actual panel
  switching handlers, bilingual disclosure, and schedule metadata.
- A separate comparison against the 2.4.0 engine covered all 24 existing
  methods, four locations, four seasons, both schools and both midnight
  modes: all 1,536 outputs were identical.

Live Nojumi notification checks passed with the panel closed: one English
five-minute advance reminder and one Arabic prayer-time notification with
Accent lead Off. Real D-Bus delivery and deduplication keys were checked;
toast screenshots were inspected. Temporary Dhuhr tuning moved the event
boundaries; the clock, timer, engine and notification helper were unchanged.

The original widget settings and notification deduplication state were
restored exactly. No OmaPrayers runtime errors appeared in the final shell
log. The tested runtime remains installed.

Evidence is stored locally in `/tmp/omaprayers-2.5-device/`; screenshots of
this personal desktop are not committed. Physical multi-monitor behavior,
suspend/resume, and an independent Nojumi timetable corpus were not tested
in this release. Existing automated tests cover notification deduplication,
resume grace, retries and polar calculation paths. Isha remains an explicitly
labeled estimate because the source does not publish an Isha parameter.

---

# Accent lead desktop verification

Test date: 2026-09-22, Africa/Cairo. Current desktop: Omarchy 4.0.4-1,
Quickshell, one 2560 × 1440 display, user's installed notification service.

The working tree's runtime files matched the installed plugin byte for byte.
The shell was restarted before the successful run. Copying the changed files
and rescanning alone did not activate the new timing in the first attempt.
No diagnostic instrumentation remained in the qualified code.

Tests used temporary Dhuhr tuning offsets to put real event boundaries near
the current time. The system clock, model, timer interval, and notification
helper were unchanged. The panel was closed during delivery. D-Bus monitoring,
notification deduplication state, and inspected desktop screenshots provided
evidence of delivery. Settings were changed between cases in the running shell.

| Case | Result |
|---|---|
| Accent lead 20, legacy reminder value 10 | One English reminder; bar accent and toast showed 20 minutes |
| Accent lead 5, legacy reminder value 10 | One Arabic reminder; bar accent and toast showed 5 minutes |
| Accent lead 20, cross the legacy 10-minute boundary | No reminder |
| Accent lead Off, notifications enabled | One Arabic prayer-time notification |
| Notifications disabled, cross 20-minute advance boundary | No reminder |
| Notifications disabled, cross prayer-time boundary | No notification |

All six cases passed. The D-Bus trace contained exactly the three expected
prayer notifications, with no duplicates. English and Arabic toast screenshots
and the settings panel were visually inspected. The running shell's log had
no OmaPrayers runtime errors during the successful run.

The original widget settings and notification deduplication state were
restored and checked after the run. The normal location, English language,
and untuned Dhuhr countdown returned. The updated plugin remains installed.

The full automated suite, nine new notification-lead regression cases,
manifest validation, ShellCheck, and whitespace checks passed before this
live run. Live test evidence is stored locally in
`/tmp/omaprayers-desktop-test/` (results JSON, D-Bus trace, screenshots, and
restoration backups); desktop screenshots are not committed.

This run covers the changed notification timing on the current desktop.
Physical multi-monitor deduplication, suspend/resume, and delivery-service
failure recovery were not manually exercised. Existing automated checks
cover reminder grace boundaries, deduplication, and failed-delivery retries.
