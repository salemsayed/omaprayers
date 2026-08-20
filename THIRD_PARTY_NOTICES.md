# Third-party references

The runtime contains an algorithm port and a data table from MIT-licensed
projects. Tests also vendor an oracle bundle and timetable fixtures.

- [Omarchy Quattro](https://github.com/basecamp/omarchy/tree/quattro), MIT:
  plugin manifest, injected bar-widget properties, panel lifecycle, theme
  tokens, and plugin CLI contract.
- [Noctalia Mawaqit](https://github.com/noctalia-dev/community-plugins/tree/main/mawaqit),
  MIT: today/tomorrow schedule, calculation preferences, Hijri presentation,
  and prayer-specific panel concepts.
- [adhan-js](https://github.com/batoulapps/adhan-js), MIT: the astronomical
  calculation algorithm ported into `Engine.js`, and the adhan 4.4.4 bundle
  vendored under `tests/vendor/` as a test-only oracle.
- [Batoul Apps prayer-time fixtures](https://github.com/batoulapps/adhan-js/tree/main/Shared/Times),
  MIT via adhan-js: eight published timetable fixtures vendored under
  `tests/fixtures/batoulapps/`.
- [hijridate](https://github.com/dralshehri/hijridate), MIT: the Umm al-Qura
  month-start table transcribed into `Engine.js`.
- [Awqat Salaat](https://github.com/Khiro95/Awqat-Salaat), MIT: offline
  behavior, provider provenance, and explicit accuracy guidance.
- [Omarchy Quattro Prayer Times](https://github.com/husamemadH/omarchy-quattro-prayer-times),
  MIT: confirmation of the third-party bar-widget integration path.

[AlAdhan](https://aladhan.com/prayer-times-api) is a validation reference.
Recorded output is stored as test fixtures, and an optional live drift check
can query the API. OmaPrayers does not use AlAdhan at runtime.
