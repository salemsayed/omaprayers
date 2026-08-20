# Third-party references

No third-party library code is bundled.

The implementation was informed by these open-source projects and contracts:

- [Omarchy Quattro](https://github.com/basecamp/omarchy/tree/quattro), MIT:
  plugin manifest, injected bar-widget properties, panel lifecycle, theme
  tokens, and plugin CLI contract.
- [Noctalia Mawaqit](https://github.com/noctalia-dev/community-plugins/tree/main/mawaqit),
  MIT: today/tomorrow schedule, calculation preferences, Hijri presentation,
  and prayer-specific panel concepts.
- [Adhan JS](https://github.com/batoulapps/adhan-js), MIT: absolute-time and
  timezone design, calculation-method vocabulary, and boundary-test ideas.
- [Awqat Salaat](https://github.com/Khiro95/Awqat-Salaat), MIT: offline calendar
  caching, provider provenance, and explicit accuracy guidance.
- [Omarchy Quattro Prayer Times](https://github.com/husamemadH/omarchy-quattro-prayer-times),
  MIT: confirmation of the third-party bar-widget integration path.

Prayer calendar data is requested at runtime from
[AlAdhan](https://aladhan.com/prayer-times-api).
