const assert = require("node:assert/strict")
const Model = require("../Model.js")

function value(at, time) {
  return { at, time }
}

function day(date, offset, times) {
  const timings = {}
  for (const [name, clock] of Object.entries(times)) {
    timings[name] = value(`${date}T${clock}:00${offset}`, clock)
  }
  return { date, timings, hijri: { display: "1 Test 1448 AH" } }
}

const schedule = {
  ok: true,
  status: "cached",
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
})

test("Arabic labels and English fallback work", () => {
  assert.equal(Model.label("Fajr", "Arabic"), "الفجر")
  assert.equal(Model.label("Unknown", "Arabic"), "Unknown")
})

test("tooltip includes location, time, and stale state", () => {
  const now = new Date("2026-08-14T12:55:00+03:00")
  const next = Model.nextPrayer(schedule, now)
  assert.equal(Model.tooltip({ ...schedule, status: "stale" }, next, now, "English", "24-hour"),
    "Cairo · Dhuhr in 5m (13:00) · stale cache")
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
  assert.equal(Model.hijriLabel({ hijri: { day: "2", month: "Safar", year: "1448" } }), "2 Safar 1448")
  assert.equal(Model.hijriLabel(null), "")
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
    title: "الفجر in 10 minutes",
    body: "Scheduled for 4:45 AM"
  })
  assert.deepEqual(Model.notificationText({ name: "Isha", kind: "at", time: "21:00" }, "English", "24-hour"), {
    title: "It is time for Isha",
    body: "21:00"
  })
})

test("file URLs decode spaces", () => {
  assert.equal(Model.filePath("file:///tmp/Prayer%20Times/data.sh"), "/tmp/Prayer Times/data.sh")
})

test("boolean and number coercion match settings storage", () => {
  assert.equal(Model.bool("TRUE"), true)
  assert.equal(Model.bool("false"), false)
  assert.equal(Model.number("12", 0), 12)
  assert.equal(Model.number("nope", 7), 7)
})

console.log(`Model tests passed (${count} scenarios)`)
