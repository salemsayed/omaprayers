const assert = require("node:assert/strict")
const path = require("node:path")
const requireQmlJs = require("./qml-js-loader.js")
const Model = requireQmlJs(path.join(__dirname, "..", "Model.js"), module)

function value(at, time) {
  return { at, time }
}

function day(date, offset, times) {
  const timings = {}
  for (const [name, clock] of Object.entries(times)) {
    timings[name] = value(`${date}T${clock}:00${offset}`, clock)
  }
  return {
    date,
    timings,
    hijri: { display: "1 Test 1448 AH", displayAr: "1 اختبار 1448 هـ" }
  }
}

const schedule = {
  ok: true,
  status: "local",
  today: "2026-08-14",
  tomorrow: "2026-08-15",
  config: {
    locationLabel: "Cairo",
    latitude: 30.0444,
    longitude: 31.2357,
    timezone: "Africa/Cairo",
    method: 5,
    school: 0,
    latitudeAdjustmentMethod: 3,
    midnightMode: 0,
    hijriAdjustment: 0,
    tune: "0,0,0,0,0,0,0,0,0",
    shafaq: "general",
    methodSettings: ""
  },
  days: [
    day("2026-08-14", "+03:00", {
      Imsak: "04:35", Fajr: "04:45", Sunrise: "06:20", Dhuhr: "13:00",
      Asr: "16:35", Maghrib: "19:35", Isha: "21:00", Midnight: "00:10",
      Firstthird: "22:46", Lastthird: "02:57"
    }),
    day("2026-08-15", "+03:00", {
      Imsak: "04:36", Fajr: "04:46", Sunrise: "06:21", Dhuhr: "13:00",
      Asr: "16:34", Maghrib: "19:34", Isha: "20:59", Midnight: "00:10",
      Firstthird: "22:45", Lastthird: "02:58"
    })
  ]
}

let count = 0
function test(name, run) {
  try {
    run()
    count++
  } catch (error) {
    error.message = `${name}: ${error.message}`
    throw error
  }
}

test("parseEnvelope accepts objects and rejects malformed or non-object JSON", () => {
  assert.deepEqual(Model.parseEnvelope('{"ok":true}'), { ok: true })
  assert.equal(Model.parseEnvelope("{"), null)
  assert.equal(Model.parseEnvelope("null"), null)
  assert.equal(Model.parseEnvelope("[]"), null)
})

test("Latin digit normalization covers Arabic and Persian forms", () => {
  assert.equal(Model.latinDigits("٠١٢٣٤٥٦٧٨٩"), "0123456789")
  assert.equal(Model.latinDigits("۰۱۲۳۴۵۶۷۸۹"), "0123456789")
  assert.equal(Model.latinDigits("الجمعة أغسطس"), "الجمعة أغسطس")
})

test("next prayer crosses into tomorrow", () => {
  const next = Model.nextPrayer(schedule, new Date("2026-08-14T22:00:00+03:00"))
  assert.equal(next.name, "Fajr")
  assert.equal(next.date, "2026-08-15")
  assert.equal(next.time, "04:46")
})

test("absolute timestamps ignore the computer timezone", () => {
  const next = Model.nextPrayer(schedule, new Date("2026-08-14T19:00:00Z"))
  assert.equal(next.iso, "2026-08-15T04:46:00+03:00")
})

test("exact prayer instant is current and the following prayer is next", () => {
  const now = new Date("2026-08-14T13:00:00+03:00")
  assert.equal(Model.currentPrayer(schedule, now).name, "Dhuhr")
  assert.equal(Model.nextPrayer(schedule, now).name, "Asr")
})

test("invalid or absent schedule has no events", () => {
  assert.equal(Model.nextPrayer(null, Date.now()), null)
  assert.equal(Model.currentPrayer({ days: [] }, Date.now()), null)
  assert.deepEqual(Model.scheduleEvents({ days: [{ timings: { Fajr: { at: "bad" } } }] }), [])
})

test("countdown rounds partial minutes upward", () => {
  const next = Model.nextPrayer(schedule, new Date("2026-08-14T12:58:30+03:00"))
  assert.equal(Model.minutesUntil(next, new Date("2026-08-14T12:58:30+03:00")), 2)
  assert.equal(Model.remaining(next, new Date("2026-08-14T11:58:30+03:00")), "1h 2m")
  assert.equal(Model.remaining({ at: new Date(0) }, new Date(0)), "now")
  assert.equal(Model.remaining(null, Date.now()), "")
})

test("clock formatting covers midnight, noon, and malformed input", () => {
  assert.equal(Model.formatClock("00:05", "12-hour"), "12:05 AM")
  assert.equal(Model.formatClock("12:00", "12-hour"), "12:00 PM")
  assert.equal(Model.formatClock("13:07", "12-hour"), "1:07 PM")
  assert.equal(Model.formatClock("04:05", "24-hour"), "04:05")
  assert.equal(Model.formatClock("unknown", "24-hour"), "unknown")
})

test("bar display modes are deterministic", () => {
  const now = new Date("2026-08-14T12:55:00+03:00")
  const next = Model.nextPrayer(schedule, now)
  assert.equal(Model.barText(next, now, "English", "Icon only", "24-hour"), "\ueed3")
  assert.equal(Model.barText(next, now, "English", "Countdown only", "24-hour"), "5m")
  assert.equal(Model.barText(next, now, "English", "Name + time", "12-hour"), "Dhuhr 1:00 PM")
  assert.equal(Model.barText(next, now, "English", "Name + countdown", "24-hour"), "Dhuhr 5m")
  for (const mode of ["Icon only", "Countdown only", "Name + time", "Name + countdown"])
    assert.equal(Model.barText(null, now, "English", mode, "24-hour"), "\ueed3")
})

test("tomorrow label isolates Arabic text from the LTR clock", () => {
  const text = Model.tomorrowPrayerLabel({ name: "Fajr", time: "04:46" }, "Arabic", "12-hour")
  assert.equal(text, "\u2067غدًا  الفجر  ·  4:46 AM\u2069")
})

test("Arabic labels and English fallback work", () => {
  assert.equal(Model.label("Fajr", "Arabic"), "الفجر")
  assert.equal(Model.label("Unknown", "Arabic"), "Unknown")
  const now = new Date("2026-08-14T12:55:00+03:00")
  const next = Model.nextPrayer(schedule, now)
  assert.equal(Model.barText(next, now, "Arabic", "Name + countdown", "24-hour"), "\u2067الظهر 5 د\u2069")
  assert.equal(Model.barText(next, now, "Arabic", "Name + time", "12-hour"), "\u2067الظهر 1:00 PM\u2069")
})

test("tooltip includes location and time and tolerates an absent method", () => {
  const now = new Date("2026-08-14T12:55:00+03:00")
  const next = Model.nextPrayer(schedule, now)
  assert.equal(Model.tooltip(schedule, next, now, "English", "24-hour"),
    "Cairo · Dhuhr in 5m (13:00)")
  assert.equal(Model.tooltip(null, null, now, "English", "24-hour"), "Prayer times unavailable")
})

test("day and night rows honor visibility and missing values", () => {
  const currentDay = Model.today(schedule)
  assert.deepEqual(Model.dayRows(currentDay, false).map(row => row.name),
    ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"])
  assert.deepEqual(Model.nightRows(currentDay).map(row => row.name),
    ["Imsak", "Midnight", "Firstthird", "Lastthird"])
  assert.deepEqual(Model.dayRows(null, true), [])
})

test("Hijri label uses display then falls back to fields", () => {
  assert.equal(Model.hijriLabel(Model.today(schedule)), "1 Test 1448 AH")
  assert.equal(Model.hijriLabel(Model.today(schedule), "Arabic"), "1 اختبار 1448 هـ")
  assert.equal(Model.hijriLabel({ hijri: { display: "2 Safar 1448 AH" } }, "Arabic"), "2 Safar 1448 AH")
  assert.equal(Model.hijriLabel({ hijri: { day: "2", month: "Safar", year: "1448" } }), "2 Safar 1448")
  assert.equal(Model.hijriLabel(null), "")
})

test("schedule status labels are user-facing", () => {
  assert.equal(Model.statusLabel("local"), "calculated offline")
  assert.equal(Model.statusLabel("error"), "not loaded")
  assert.equal(Model.statusLabel("local", "Arabic"), "محسوبة دون اتصال")
  assert.equal(Model.statusLabel("error", "Arabic"), "غير محمل")
})

test("configuration comparison normalizes numeric strings but catches every option", () => {
  const expected = { ...schedule.config, latitude: "30.0444", longitude: "31.2357" }
  assert.equal(Model.sameConfig(schedule.config, expected), true)
  for (const [key, changed] of Object.entries({
    locationLabel: "Giza", latitude: 31, longitude: 30, timezone: "UTC", method: 3,
    school: 1, latitudeAdjustmentMethod: 2, midnightMode: 1, hijriAdjustment: 1,
    tune: "1,0,0,0,0,0,0,0,0", shafaq: "ahmer", methodSettings: "18,null,17"
  })) {
    assert.equal(Model.sameConfig(schedule.config, { ...expected, [key]: changed }), false, key)
  }
  assert.equal(Model.sameConfig(null, expected), false)
})

test("at-prayer notification fires only on a forward crossing", () => {
  const prayerAt = new Date("2026-08-14T13:00:00+03:00").getTime()
  const crossed = Model.notificationEvents(schedule, prayerAt - 31_000, prayerAt + 1_000, 10, 10)
  assert.deepEqual(crossed.map(event => event.kind), ["at"])
  assert.equal(crossed[0].triggerEpoch, prayerAt)
  assert.deepEqual(Model.notificationEvents(schedule, prayerAt, prayerAt + 1_000, 10, 10), [])
  assert.deepEqual(Model.notificationEvents(schedule, prayerAt + 1_000, prayerAt - 1_000, 10, 10), [])
})

test("before-prayer notification respects exact boundary and does not fire after prayer", () => {
  const prayerAt = new Date("2026-08-14T13:00:00+03:00").getTime()
  const reminderAt = prayerAt - 10 * 60_000
  const result = Model.notificationEvents(schedule, reminderAt - 1, reminderAt, 10, 10)
  assert.deepEqual(result.map(event => event.kind), ["before"])
  assert.equal(result[0].triggerEpoch, reminderAt)
  assert.deepEqual(Model.notificationEvents(schedule, reminderAt, reminderAt + 1, 10, 10), [])
  assert.deepEqual(Model.notificationEvents(schedule, reminderAt - 1, prayerAt, 10, 10)
    .map(event => event.kind), ["at"])
})

test("resume grace admits recent events and rejects old ones", () => {
  const prayerAt = new Date("2026-08-14T13:00:00+03:00").getTime()
  assert.deepEqual(Model.notificationEvents(schedule, prayerAt - 20 * 60_000, prayerAt + 9 * 60_000, 0, 10)
    .map(event => event.kind), ["at"])
  assert.deepEqual(Model.notificationEvents(schedule, prayerAt - 20 * 60_000, prayerAt + 10 * 60_000 + 1, 0, 10), [])
})

test("notification copy follows language and clock format", () => {
  assert.deepEqual(Model.notificationText({ name: "Fajr", kind: "before", minutes: 10, time: "04:45" }, "Arabic", "12-hour"), {
    title: "الفجر بعد 10 د",
    body: "الموعد 4:45 AM"
  })
  assert.deepEqual(Model.notificationText({ name: "Fajr", kind: "at", time: "04:45" }, "Arabic", "24-hour"), {
    title: "حان وقت الفجر",
    body: "04:45"
  })
  assert.deepEqual(Model.notificationText({ name: "Isha", kind: "at", time: "21:00" }, "English", "24-hour"), {
    title: "It is time for Isha",
    body: "21:00"
  })
})

test("file URLs decode spaces", () => {
  assert.equal(Model.filePath("file:///tmp/Plugin%20Data/data.sh"), "/tmp/Plugin Data/data.sh")
})

test("boolean and number coercion match settings storage", () => {
  assert.equal(Model.bool("TRUE"), true)
  assert.equal(Model.bool("false"), false)
  assert.equal(Model.number("12", 0), 12)
  assert.equal(Model.number("nope", 7), 7)
})

test("day segments cover a full day and wrap the final boundary", () => {
  const segments = Model.daySegments(Model.today(schedule), true)
  assert.equal(segments.reduce((total, segment) => total + segment.length, 0), 1440)
  assert.equal(segments.at(-1).name, "Isha")
  assert.equal(segments.at(-1).end, segments[0].start + 1440)
  assert.ok(segments.at(-1).end > 1440)
})

test("day segments without sunrise let Fajr absorb the sunrise gap", () => {
  const withSunrise = Model.daySegments(Model.today(schedule), true)
  const withoutSunrise = Model.daySegments(Model.today(schedule), false)
  assert.equal(withoutSunrise.length, withSunrise.length - 1)
  assert.equal(withoutSunrise[0].name, "Fajr")
  assert.equal(withoutSunrise[0].end, withSunrise[1].end)
  assert.equal(withoutSunrise[0].length,
    withSunrise[0].length + withSunrise[1].length)
  assert.deepEqual(Model.daySegments(null, true), [])
})

test("night markers are ordered within the night band and include Isha", () => {
  const band = Model.nightMarkers(Model.today(schedule))
  assert.ok(band)
  assert.equal(band.start, 19 * 60 + 35)
  assert.equal(band.end, 4 * 60 + 45 + 1440)
  assert.ok(band.marks.some(mark => mark.name === "Isha"))
  assert.equal(band.marks.some(mark => mark.name === "Imsak"), false)
  for (let index = 0; index < band.marks.length; index++) {
    assert.ok(band.marks[index].fraction >= 0 && band.marks[index].fraction <= 1)
    if (index > 0)
      assert.ok(band.marks[index - 1].fraction <= band.marks[index].fraction)
  }
})

test("method short names cover known ids and deterministic fallbacks", () => {
  assert.equal(Model.methodShortName(5, "Egyptian General Authority of Survey"), "Egypt")
  assert.equal(Model.methodShortName(42, "Egyptian General Authority of Survey"), "EGAS")
  assert.equal(Model.methodShortName(42, ""), "METHOD 42")
})

test("duration formatting covers minutes, hours, Arabic, and invalid input", () => {
  assert.equal(Model.formatDuration(45, "English"), "45m")
  assert.equal(Model.formatDuration(180, "English"), "3h")
  assert.equal(Model.formatDuration(95, "English"), "1h 35m")
  assert.equal(Model.formatDuration(95, "Arabic"), "1 س 35 د")
  assert.equal(Model.formatDuration(180, "Arabic"), "3 س")
  assert.equal(Model.formatDuration(-1, "English"), "")
})

test("day fraction starts at Fajr and remains bounded through the cycle", () => {
  const currentDay = Model.today(schedule)
  assert.equal(Model.fractionOfDay(currentDay, new Date("2026-08-14T04:45:00+03:00")), 0)
  assert.equal(Model.fractionOfDay(currentDay, new Date("2026-08-14T16:45:00+03:00")), 0.5)
  const beforeFajr = Model.fractionOfDay(currentDay, new Date("2026-08-14T03:45:00+03:00"))
  assert.ok(beforeFajr >= 0 && beforeFajr <= 1)
  assert.equal(Model.fractionOfDay(null, new Date()), 0)
})

test("timing minutes and window labels use the shared duration helpers", () => {
  assert.equal(Model.minutesOfDay({ time: "04:45 (+03)" }), 285)
  assert.ok(Number.isNaN(Model.minutesOfDay({ time: "24:00" })))
  assert.equal(Model.windowLabel({ length: 95 }, "English"), "1h 35m")
  assert.equal(Model.windowLabel({ length: 95 }, "Arabic"), "1 س 35 د")
})

test("day segments unwrap an Isha boundary after midnight", () => {
  const wrappedDay = day("2026-06-21", "+03:00", {
    Fajr: "02:00", Sunrise: "03:30", Dhuhr: "12:00", Asr: "17:00",
    Maghrib: "22:30", Isha: "01:00"
  })
  const segments = Model.daySegments(wrappedDay, true)
  assert.equal(segments.reduce((total, segment) => total + segment.length, 0), 1440)
  for (let index = 1; index < segments.length; index++)
    assert.ok(segments[index].start > segments[index - 1].start)
  assert.equal(segments.at(-1).end, segments[0].start + 1440)
})

test("remaining localizes Arabic units while two-argument calls stay unchanged", () => {
  const now = new Date("2026-08-14T12:00:00+03:00")
  assert.equal(Model.remaining({ at: new Date("2026-08-14T12:45:00+03:00") }, now, "Arabic"), "45 د")
  assert.equal(Model.remaining({ at: new Date("2026-08-14T13:02:00+03:00") }, now, "Arabic"), "1 س 2 د")
  assert.equal(Model.remaining({ at: new Date("2026-08-14T14:00:00+03:00") }, now, "Arabic"), "2 س")
  assert.equal(Model.remaining({ at: now }, now, "Arabic"), "الآن")
  assert.equal(Model.remaining({ at: new Date("2026-08-14T13:02:00+03:00") }, now), "1h 2m")
  assert.equal(Model.remaining({ at: new Date("2026-08-14T14:00:00+03:00") }, now), "2h")
})

test("tooltip appends the full calculation method from the prayer day", () => {
  const now = new Date("2026-08-14T12:55:00+03:00")
  const withMethod = {
    ...schedule,
    days: schedule.days.map(entry => entry.date === schedule.today
      ? { ...entry, methodName: "Egyptian General Authority of Survey" }
      : entry)
  }
  const next = Model.nextPrayer(withMethod, now)
  assert.equal(Model.tooltip(withMethod, next, now, "English", "24-hour"),
    "Cairo · Dhuhr in 5m (13:00) · Egyptian General Authority of Survey")
  assert.equal(Model.tooltip(withMethod, next, now, "Arabic", "24-hour", "القاهرة"),
    "القاهرة · الظهر بعد 5 د (13:00) · Egyptian General Authority of Survey")
})

test("method options follow catalog order and keep string values", () => {
  const options = Model.methodOptions("English")
  assert.deepEqual(options.map(option => option.value), [
    "3", "2", "5", "4", "1", "7", "0", "8", "9", "10", "11", "12",
    "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "99"
  ])
  assert.deepEqual(options.map(option => option.value), Model.METHODS.map(method => String(method.id)))
  assert.equal(options.find(option => option.value === "5").label,
    "Egyptian General Authority of Survey")
  assert.equal(options.find(option => option.value === "5").description,
    "Fajr 19.5° · Isha 17.5°")
})

test("method options localize labels and describe all custom values as angles", () => {
  const arabic = Model.methodOptions("Arabic")
  assert.equal(arabic.find(option => option.value === "17").label,
    "دائرة التقدم الإسلامي الماليزية")
  assert.equal(Model.methodOptions("English").find(option => option.value === "99").description,
    "Fajr 15° · Maghrib sunset · Isha 15°")
  assert.equal(Model.methodOptions("English", "18,null,17")
    .find(option => option.value === "99").description,
    "Fajr 18° · Maghrib sunset · Isha 17°")
  assert.equal(Model.methodOptions("English", "18,4,17")
    .find(option => option.value === "99").description,
    "Fajr 18° · Maghrib 4° · Isha 17°")
})

test("method labels and short names come from the shared engine catalog", () => {
  assert.equal(Model.methodLabel(13, "English"), "Diyanet İşleri Başkanlığı, Turkey")
  assert.equal(Model.methodLabel(13, "Arabic"), "رئاسة الشؤون الدينية التركية")
  assert.equal(Model.methodShortName(13, "fallback"), "Diyanet")
  assert.deepEqual([3, 2, 12, 13, 17, 20].map(id => Model.methodShortName(id, "", "Arabic")),
    ["الرابطة", "أمريكا الشمالية", "فرنسا", "تركيا", "ماليزيا", "إندونيسيا"])
  assert.equal(Model.methodLabel(42, "English"), "42")
})

test("country suggestions map catalog regions without repeating the selection", () => {
  assert.deepEqual(Model.suggestedMethod("EG", 3), {
    id: 5,
    label: "Egyptian General Authority of Survey"
  })
  assert.deepEqual(Model.suggestedMethod("us", 5), {
    id: 2,
    label: "Islamic Society of North America"
  })
  assert.equal(Model.suggestedMethod("GB", 5), null)
  assert.equal(Model.suggestedMethod("EG", "5"), null)
})

test("tune helpers normalize nine values and preserve config-only offsets", () => {
  assert.deepEqual(Model.tuneValues("7,2,3,4,5,6,-8,9,10"),
    [7, 2, 3, 4, 5, 6, -8, 9, 10])
  assert.deepEqual(Model.tuneValues("bad"), [0, 0, 0, 0, 0, 0, 0, 0, 0])
  assert.equal(Model.tuneText([7, 2, 3, 4, 5, 6, -8, 9, 10]),
    "7,2,3,4,5,6,-8,9,10")
  const edited = Model.tuneValues("7,2,3,4,5,6,-8,9,10")
  edited[1] = 12
  assert.equal(Model.tuneText(edited), "7,12,3,4,5,6,-8,9,10")
  assert.deepEqual(Model.TUNE_EDITABLE, ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"])
})

test("tune summaries omit zeros and localize every configured timing", () => {
  assert.equal(Model.tuneSummary("0,0,0,0,0,0,0,0,0", "English"), "")
  assert.equal(Model.tuneSummary("0,2,0,0,0,0,0,-3,0", "English"),
    "Fajr +2 · Isha −3")
  assert.equal(Model.tuneSummary("1,0,0,0,0,0,-2,0,3", "Arabic"),
    "الإمساك +1 · الغروب −2 · منتصف الليل +3")
})

test("school labels use the option catalog in both languages", () => {
  assert.equal(Model.schoolLabel(0, "English"), "Shafi")
  assert.equal(Model.schoolLabel(1, "Arabic"), "حنفي")
})

test("option rings cycle and wrap in the order the panel buttons follow", () => {
  assert.equal(Model.nextInRing(Model.PANEL_STYLES, "Horizon"), "Compact")
  assert.equal(Model.nextInRing(Model.PANEL_STYLES, "Compact"), "Horizon")
  assert.equal(Model.nextInRing(Model.TIME_FORMATS, "24-hour"), "12-hour")
  assert.equal(Model.nextInRing(Model.LANGUAGES, "Arabic"), "English")
  assert.equal(Model.nextInRing(Model.BAR_DISPLAYS, "Strip + countdown"), "Icon only")
  assert.equal(Model.nextInRing(Model.BAR_DISPLAYS, "Countdown only"), "Strip + countdown")
})

test("an unknown or empty current value cycles to the first option", () => {
  assert.equal(Model.nextInRing(Model.PANEL_STYLES, "Nonsense"), "Horizon")
  assert.equal(Model.nextInRing(Model.PANEL_STYLES, ""), "Horizon")
  assert.equal(Model.nextInRing(Model.PANEL_STYLES, undefined), "Horizon")
  assert.equal(Model.nextInRing([], "Horizon"), "")
  assert.equal(Model.nextInRing(null, "Horizon"), "")
})

test("every ring value carries a label in both languages", () => {
  const rings = [Model.PANEL_STYLES, Model.TIME_FORMATS, Model.LANGUAGES, Model.BAR_DISPLAYS]
  for (const ring of rings) {
    for (const value of ring) {
      assert.notEqual(Model.optionLabel(value, "English"), "")
      assert.notEqual(Model.optionLabel(value, "Arabic"), "")
    }
  }
  assert.equal(Model.optionLabel("Horizon", "Arabic"), "أفق")
  assert.equal(Model.optionLabel("Icon only", "English"), "Icon")
})

test("an unmapped option falls back to its raw value instead of an empty label", () => {
  assert.equal(Model.optionLabel("Handwritten", "English"), "Handwritten")
  assert.equal(Model.optionLabel("Handwritten", "Arabic"), "Handwritten")
})

test("optionModel pairs canonical values with localized labels", () => {
  assert.deepEqual(Model.optionModel(Model.PANEL_STYLES, "English"), [
    { value: "Horizon", label: "Horizon" },
    { value: "Compact", label: "Compact" }
  ])
  const arabic = Model.optionModel(Model.TIME_FORMATS, "Arabic")
  assert.deepEqual(arabic.map(entry => entry.value), Model.TIME_FORMATS)
})

test("display labels are translated and unknown keys stay empty", () => {
  assert.equal(Model.uiLabel("display", "English"), "Display")
  assert.equal(Model.uiLabel("display", "Arabic"), "العرض")
  assert.equal(Model.uiLabel("notifications", "Arabic"), "التنبيهات")
  assert.equal(Model.uiLabel("nothingHere", "English"), "")
})

test("geocoding results keep the timezone and country code that belong to each row", () => {
  // Springfield really does span two zones, which is why the zone cannot be
  // derived from the name or the coordinates.
  const raw = JSON.stringify({
    results: [
      { name: "Springfield", admin1: "Missouri", country: "United States", country_code: "US", latitude: 37.21, longitude: -93.29, timezone: "America/Chicago" },
      { name: "Springfield", admin1: "Massachusetts", country: "United States", country_code: "US", latitude: 42.10, longitude: -72.59, timezone: "America/New_York" }
    ]
  })
  const results = Model.parseLocationResults(raw)
  assert.equal(results.length, 2)
  assert.deepEqual(results[0], {
    name: "Springfield",
    region: "Missouri, United States",
    country: "United States",
    countryCode: "US",
    latitude: 37.21,
    longitude: -93.29,
    timezone: "America/Chicago"
  })
  assert.equal(results[1].timezone, "America/New_York")
  assert.equal(results[1].countryCode, "US")
})

test("geocoding rows without a usable zone or coordinates are dropped", () => {
  const raw = JSON.stringify({
    results: [
      { name: "No Zone", latitude: 1, longitude: 2 },
      { name: "Blank Zone", latitude: 1, longitude: 2, timezone: "" },
      { name: "No Coords", timezone: "Europe/London" },
      { name: "", latitude: 1, longitude: 2, timezone: "Europe/London" },
      { name: "Keeper", latitude: 51.5, longitude: -0.13, timezone: "Europe/London" }
    ]
  })
  const results = Model.parseLocationResults(raw)
  assert.equal(results.length, 1)
  assert.equal(results[0].name, "Keeper")
})

test("an empty or malformed geocoding response yields no choices", () => {
  assert.deepEqual(Model.parseLocationResults('{"generationtime_ms":0.53}'), [])
  assert.deepEqual(Model.parseLocationResults("{"), [])
  assert.deepEqual(Model.parseLocationResults(""), [])
  assert.deepEqual(Model.parseLocationResults('{"results":null}'), [])
})

test("a region omits missing parts rather than leaving stray separators", () => {
  const only = JSON.stringify({
    results: [{ name: "Nowhere", country: "Iceland", latitude: 64, longitude: -22, timezone: "Atlantic/Reykjavik" }]
  })
  assert.equal(Model.parseLocationResults(only)[0].region, "Iceland")
})

test("a detected location is reduced to a search term", () => {
  assert.equal(Model.detectedLocationQuery("Abū Kabīr, Sharqia, EG"), "Abū Kabīr")
  assert.equal(Model.detectedLocationQuery("6th+of+October+City, Giza, EG"), "6th of October City")
  assert.equal(Model.detectedLocationQuery("  Cairo  \n"), "Cairo")
  assert.equal(Model.detectedLocationQuery(""), "")
  assert.equal(Model.detectedLocationQuery(undefined), "")
})

test("committing a location writes all four keys and clears the Arabic label", () => {
  const choice = {
    name: "6th of October City",
    region: "Giza Governorate, Egypt",
    latitude: 29.94644,
    longitude: 30.91687,
    timezone: "Africa/Cairo"
  }
  assert.deepEqual(Model.locationSettings(choice), {
    locationLabel: "6th of October City",
    locationLabelAr: "",
    latitude: "29.94644",
    longitude: "30.91687",
    timezone: "Africa/Cairo"
  })
})

test("an incomplete choice commits nothing at all", () => {
  assert.equal(Model.locationSettings(null), null)
  assert.equal(Model.locationSettings({ name: "X", latitude: 1, longitude: 2 }), null)
  assert.equal(Model.locationSettings({ name: "X", latitude: 1, longitude: 2, timezone: "" }), null)
  assert.equal(Model.locationSettings({ name: "", latitude: 1, longitude: 2, timezone: "Europe/London" }), null)
  assert.equal(Model.locationSettings({ name: "X", latitude: NaN, longitude: 2, timezone: "Europe/London" }), null)
})

console.log(`Model tests passed (${count} scenarios)`)
