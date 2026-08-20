# Validation

The local engine is checked offline against published timetable fixtures,
adhan-js 4.4.4, an independent NOAA-style solar calculation, and compact
AlAdhan snapshots. The snapshot recorder and live drift check are the only
network tests.

## AlAdhan snapshots

The corpus contains 60 calendar snapshots and 1,845 dated rows. It covers all
24 supported method IDs across 40 locations:

Cairo, Makkah, Riyadh, Dubai, Doha, Kuwait City, Manama, Amman, Istanbul,
Tunis, Algiers, Casablanca, Lisbon, Paris, London, Moscow, Karachi, Delhi,
Kuala Lumpur, Jakarta, Singapore, Tehran, Qum, New York, Los Angeles,
Honolulu, Sydney, Cape Town, Buenos Aires, Nairobi, Quito, Kiritimati, Apia,
Urumqi, Oslo, Stockholm, Edinburgh, Reykjavik, Tromsø, and Anchorage.

The sampled months are 2026-01, 02, 03, 04, 06, 08, 10, 11, and 12,
2027-01, and leap-month 2028-02. The matrix includes Cairo DST boundaries,
New York DST boundaries, the Makkah Ramadan boundary, all three high-latitude
rules in Oslo summer and winter, all three method-15 shafaq choices, Shafi and
Hanafi Asr, tuning, a custom method, UTC-10 through UTC+14, and Urumqi under
two civil timezones.

`tests/Aladhan.test.js` compares `Engine.buildSchedule()` with every valid
snapshot cell. It invokes `prayer-zone.sh` for the snapshot timezone and does
not use the network. Results from the recorded corpus:

- 1,723 days compared and 122 AlAdhan-invalid days skipped.
- 18,953 timing cells compared.
- 36 AlAdhan `gToH` UAQ rows matched `Engine.hijri()` exactly.
- Maximum residual delta in minutes after the table below: Imsak 1, Fajr 1,
  Sunrise 1, Dhuhr 1, Asr 0, Sunset 1, Maghrib 1, Isha 1, Midnight 0,
  Firstthird 0, Lastthird 0.

The tolerance is always ±1 minute after the documented expected delta. It is
not widened by latitude, method, or timing. “Delta” means engine minus
AlAdhan. Oracle-derived rows calculate the expected delta independently with
the vendored adhan bundle; the residual still has the same ±1 minute limit.

| Scope | Timing | Expected delta | Reason |
|---|---|---:|---|
| MWL, ISNA, Egypt, Karachi, MUIS, JAKIM, Kemenag | Dhuhr | +1 min | The official adhan method parameters include Dhuhr +1; AlAdhan omits it. |
| Dubai | Sunrise | -3 min | The official Dubai parameters include Sunrise -3; AlAdhan omits it. |
| Dubai | Asr | +3 min | The official Dubai parameters include Asr +3; AlAdhan omits it. |
| Moonsighting | Dhuhr | +5 min | The official method parameters include Dhuhr +5; AlAdhan omits it. |
| Moonsighting | Maghrib | +3 min | The official method parameters include Maghrib +3; AlAdhan omits it. |
| Dubai | Sunset | -3 min | AlAdhan also applies its +3 Maghrib API offset to Sunset; the official parameters do not. |
| Diyanet | Sunset | -7 min | AlAdhan also applies its +7 Maghrib API offset to Sunset; the official parameters do not. |
| All methods | Asr | adhan oracle - AlAdhan | AlAdhan's PrayTimes astronomy differs from adhan, by -5 to +3 minutes in this matrix; official fixtures and the fuzz oracle support the engine result. |
| All methods | Midnight and thirds | adhan solar oracle - AlAdhan | The engine uses method-adjusted next dawns and elapsed instants across DST; AlAdhan applies offsets, rounding, and DST conventions differently. |
| Supported adhan methods at 55° or above | Imsak, Fajr, Isha | adhan oracle - AlAdhan | High-latitude caps differ; notably AlAdhan method 15 uses its seasonal table alone while adhan also applies the angle candidate. Edinburgh Fajr/Imsak differed by 14–41 minutes. |

AlAdhan sometimes gives an after-midnight event the requested Gregorian date
instead of the next date. Those values are compared by `HH:mm`, not instant:

- Sunset and Maghrib: Reykjavik 2026-06-15 through 06-28, 14 rows each.
- Isha: Anchorage 2026-08-01 through 08-15; Oslo middle and angle rules for
  all of 2026-06; Reykjavik for all of 2026-06. Total: 105 rows.
- Firstthird: Anchorage all of 2026-08; Lisbon 2026-08-01 through 08-11;
  all three Oslo rules for 2026-06; Paris all of 2026-08; Reykjavik all of
  2026-06; Urumqi on Asia/Shanghai all of 2028-02. Total: 222 rows.

The invalid-day rules are exact: skip a collapsed day where
`Sunrise == Sunset`, or a prayer sequence that remains non-monotonic after the
known date-stamp correction. All invalid rows were Tromsø:

- 2026-06, methods 3 and 15: all 30 days per method. Days 04, 09, 14, and 28
  were non-monotonic at Sunrise; the other 26 collapsed Sunrise and Sunset.
- 2026-12, methods 3 and 15: all 31 days per method. Days 02 and 07 were
  non-monotonic at Maghrib, day 09 at Dhuhr, and the other 28 collapsed.
- Totals: 108 collapsed, 8 non-monotonic at Sunrise, 4 at Maghrib, and 2 at
  Dhuhr. The engine's resolved polar results are checked separately by the
  adhan polar fuzz tests.

Triage also found one engine issue: AlAdhan UAQ places 1930-01-15 at
1348-08-14, one day earlier than the originally transcribed month start. The
1348-08 start was corrected by one day. The exhaustive 55,991-day continuity
test remains green.

## Built-in minute adjustments

These method parameters are applied before the user's nine `tune` values.
Angles are listed with the method names in the panel; this table records every
non-zero built-in minute adjustment or fixed interval. Methods not listed have
none. For every method, Imsak starts at Fajr -10 minutes before tuning.

| Method | Built-in minutes |
|---|---|
| MWL, ISNA, Egypt, Karachi, Singapore, Malaysia, Indonesia | Dhuhr +1 |
| Umm al-Qura | Isha 90 minutes after sunset; 120 during Ramadan |
| Gulf, Qatar | Isha 90 minutes after sunset |
| Diyanet | Sunrise -7, Dhuhr +5, Asr +4, Maghrib +7 |
| Moonsighting | Dhuhr +5, Maghrib +3 |
| Dubai | Sunrise -3, Dhuhr +3, Asr +3, Maghrib +3 |
| Morocco | Dhuhr +5, Maghrib +5 |
| Portugal | Dhuhr +5; Maghrib 3 and Isha 77 minutes after sunset |
| Jordan | Maghrib 5 minutes after sunset |

## Published timetables and astronomy

Eight MIT-licensed Batoul Apps fixtures are checked at their published
0–2-minute variances: Ankara 24 rows; Doha, Dubai, Kuwait City, London,
Makkah, and Tehran 12 each; Singapore 366. All 462 rows pass. The earlier
research total of 466 was an arithmetic error.

The deterministic adhan-js comparison uses seed `0x5eedc0de`: 3,000 regular
cases and 300 polar cases pass with a maximum unrounded delta of 0 seconds;
132 polar cases exercise nearest-latitude resolution. The independent solar
check covers 25 cities on eight dates (200 cases); maximum deltas are 2.8
seconds for sunrise, 2.5 seconds for noon, and 2.6 seconds for sunset.

## Re-recording and live drift

Requirements are `curl`, `jq`, Node, and installed tzdata. To replace the
stored corpus after every response succeeds:

```sh
tests/record-aladhan.sh
```

The recorder sends 97 requests at most four per second, retries twice, checks
both HTTP status and provider `code`, and stores only the fields used by the
test. The compact fixture directory is about 1.28 MB.

To check the provider without changing fixtures:

```sh
OMAPRAYERS_LIVE=1 node tests/live-oracle.js
```

The live oracle re-fetches the same requests and reports every change. It
fails when a timing moves by more than one minute or when metadata, Hijri,
the method catalog, or response structure changes. It is intentionally not
in `tests/run`. The post-record run on 2026-08-21 reported nine one-minute
Asr variations and no blocking drift.
