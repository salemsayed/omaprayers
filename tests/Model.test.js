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
      Fajr: "04:45", Sunrise: "06:20", Dhuhr: "13:00",
      Asr: "16:35", Maghrib: "19:35", Isha: "21:00"
    }),
    day("2026-08-15", "+03:00", {
      Fajr: "04:46", Sunrise: "06:21", Dhuhr: "13:00",
      Asr: "16:34", Maghrib: "19:34", Isha: "20:59"
    })
  ]
}

{
  const now = new Date("2026-08-14T22:00:00+03:00")
  const next = Model.nextPrayer(schedule, now)
  assert.equal(next.name, "Fajr")
  assert.equal(next.date, "2026-08-15")
  assert.equal(next.time, "04:46")
}

{
  const sameInstantInUtc = new Date("2026-08-14T19:00:00Z")
  const next = Model.nextPrayer(schedule, sameInstantInUtc)
  assert.equal(next.iso, "2026-08-15T04:46:00+03:00")
}

{
  assert.equal(Model.formatClock("00:05", "12-hour"), "12:05 AM")
  assert.equal(Model.formatClock("13:07", "12-hour"), "1:07 PM")
  assert.equal(Model.formatClock("04:05", "24-hour"), "04:05")
}

{
  const prayerAt = new Date("2026-08-14T13:00:00+03:00").getTime()
  const crossed = Model.notificationEvents(schedule, prayerAt - 31_000, prayerAt + 1_000, 10, 10)
  assert.deepEqual(crossed.map(event => event.kind), ["at"])
}

{
  const expected = { ...schedule.config, latitude: "30.0444", longitude: "31.2357" }
  assert.equal(Model.sameConfig(schedule.config, expected), true)
  assert.equal(Model.sameConfig(schedule.config, { ...expected, method: 3 }), false)
}

console.log("Model tests passed")
