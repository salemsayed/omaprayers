# OmaPrayers VM test report

Test dates: 2026-08-14 through 2026-08-15 (`Africa/Cairo`)

## Environment and isolation

- Source ISO: `omarchy-4.0.0.rc2.iso`
- ISO SHA-256: `ef97fc522cd82e5191d47f250e8c631e96f14ac177a1aa22e4c712e4eeb41122`
- The ISO's embedded `airootfs.sha512` matched its 5,948,874,752-byte root
  filesystem. No publisher signature or external checksum was available
  locally, so this establishes internal integrity, not source authenticity.
- Install harness: [`omacom-io/omarchy-iso`](https://github.com/omacom-io/omarchy-iso)
  at `7d3b01eae9772cfc73e2d70d9bb07a88e669666e`
- Direct QEMU/KVM boot with OVMF, 8 vCPUs, 6144 MiB RAM, and a throwaway
  QCOW2 overlay. No host block device or Omarchy physical partition was
  attached. SSH was forwarded only to `127.0.0.1:2222`.
- The installed system reported kernel `7.1.8-arch1-3`. The final qualification
  pass reported Omarchy package version `4.0.0rc2-1`.

The official Omarchy Quattro contributor guidance points graphical acceptance
work to the sibling ISO harness. That flow completed the installer and produced
the reusable base image used by the isolated overlay.

## Results

### Plugin contract and loading

- `omarchy plugin validate` passed.
- The final release tree also passed the validator from the official Quattro
  branch at `f0020448ca87329199de7cb12f2015ebc4a3e5e7`.
- A local Git source installed through the real
  `omarchy plugin add file://... --enable --yes` path.
- A Git snapshot of the exact 2.0.0 release candidate completed a clean
  remove/add/enable/move cycle under `io.github.salemsayed.omaprayers`. The
  installed manifest reported `OmaPrayers` and created only the new scoped
  state directory.
- Plugin discovery, right-bar placement, IPC `open`, and IPC `status` passed.
- A clean `omarchy-restart-shell` load produced no plugin QML warning, syntax
  error, loader error, or reference error. Live bar relocation can briefly
  overlap old and new widget instances and emit Quickshell's duplicate-handler
  warning; IPC remained functional and a clean restart cleared it.
- The first live load exposed a nullable QML binding in the tomorrow label.
  The binding and adjacent row guards were fixed and the clean-load check was
  repeated.

### Data and failure handling

- A forced online refresh returned `fresh`; the next request returned `cached`.
- The cache held 61 days across the current and following month.
- Every mandatory prayer timestamp was a complete ISO-8601 instant with the
  configured `+03:00` offset.
- A deliberately unreachable HTTPS proxy made a forced refresh return the
  matching cache as `stale`; restoring networking returned `fresh` again.
- An invalid latitude was rejected before networking.
- Cairo Shafi Asr was `16:37`; switching the persisted option to Hanafi fetched
  a separate matching schedule with Asr at `17:43`; switching back restored
  school `0`.
- Notification event boundaries passed the JavaScript tests. The notification
  helper emitted the first event once, suppressed a duplicate, did not commit
  a failed delivery, and allowed that event to be retried successfully.
- Generated provider fixtures additionally covered short calendars, malformed
  JSON, missing mandatory timings, a corrupt matching cache, single-component
  `UTC`, all setting boundary failures, and two simultaneous refreshers. Both
  refreshers completed while issuing exactly one two-month request pair.
- State directory and file modes were verified as `0700` and `0600`.

### Cairo authority spot check

For 2026-08-14, the plugin's method-5 schedule at the configured coordinates
was:

| Prayer | Plugin | Egyptian Survey Authority |
|---|---:|---:|
| Fajr | 04:47 | 04:47 |
| Dhuhr | 13:00 | 13:00 |
| Asr | 16:37 | 16:36 |
| Maghrib | 19:37 | 19:37 |
| Isha | 21:01 | 21:01 |

The official authority page also listed sunrise at `06:21`; the coordinate
calculation returned `06:22`. This one-minute variance is retained rather than
silently applying a Cairo-specific tune to every coordinate. The exposed
per-time tuning setting lets a user match a mosque or authority table exactly.

Sources: [Egyptian General Survey Authority prayer times](https://www.esa.gov.eg/praytimes.aspx),
[AlAdhan calculation methods](https://aladhan.com/calculation-methods).

### Presentation and Aether

- Both Horizon and Compact rendered without clipping in the 1280x800 desktop.
  English/12-hour and Arabic/12-hour views rendered. Arabic mode mirrors the
  full panel hierarchy with labels on the right and clocks on the left, while
  the English regression retains labels on the left and clocks on the right.
  The bar, tooltip, IPC status, panel status, and notification copy use Arabic
  countdown units when Arabic mode is selected.
- Compact Arabic was inspected at Omarchy text size 20 and remained within the
  shell's scaled panel bounds with its footer visible.
- At text size 20 the panel stayed clipped to its card, accepted an injected
  mouse-wheel scroll, and revealed the initially hidden footer without painting
  onto the desktop.
- The disposable VM clock was isolated after Isha. Tomorrow's Arabic Fajr name,
  separator, and 12-hour clock retained the intended order; network time was
  then restored and reported synchronized.
- A forced live refresh stored and displayed AlAdhan's Arabic Hijri month while
  retaining the English fallback for older caches.
- Tokyo Night and an Aether 4.28.0 generated light theme were inspected with
  both redesigned panel styles.
- Aether applied its normal Omarchy v4 `colors.toml`; the open widget updated
  through native `Color` and `Style` tokens without Aether-specific code or a
  plugin restart.
- The bar was moved across top, left, right, and bottom. The strip/countdown
  chip fell back to a rotated text label on both vertical edges, and the panel
  re-anchored fully on every edge.
- An invalid latitude cleared the prior schedule and rendered an explicit
  error panel. Restoring the value recovered the cached schedule.
- A real notification sent through `omarchy-notification-send` rendered in the
  native Omarchy notification surface.

Local visual artifacts are deliberately ignored with the rest of the
disposable VM state:

- `.vm/plugin-panel-tokyo-night.png`
- `.vm/plugin-panel-aether-light.png`
- `.vm/plugin-panel-aether-arabic.png`
- `.vm/plugin-panel-aether-arabic-opus-final4.png`
- `.vm/plugin-panel-aether-arabic-text20-top.png`
- `.vm/plugin-panel-aether-arabic-text20-scrolled.png`
- `.vm/plugin-panel-aether-arabic-tomorrow.png`
- `.vm/plugin-panel-aether-english-opus-final.png`
- `.vm/plugin-panel-final.png`
- `.vm/prod-panel-default.png`
- `.vm/prod-panel-vertical-compact.png`
- `.vm/prod-panel-invalid-config.png`
- `.vm/prod-notification.png`

## Remaining qualification

The following need the physical Omarchy session or a purpose-built simulated
clock and are not claimed by this VM run:

- multi-monitor geometry;
- suspend/resume notification delivery through the real notification UI;
- December 31 and month-end visual clock simulation;
- long-running API availability and comparison against the user's local mosque
  or chosen authority for their actual location.
