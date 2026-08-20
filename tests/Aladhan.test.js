#!/usr/bin/env node

"use strict"

process.env.TZ = "UTC"

const assert = require("node:assert/strict")
const { execFileSync } = require("node:child_process")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const Engine = require("../Engine.js")
const Adhan = require("./vendor/adhan.umd.min.js")

const root = path.join(__dirname, "..")
const fixtureRoot = path.join(__dirname, "fixtures", "aladhan")
const calendarRoot = path.join(fixtureRoot, "calendar")
const timingNames = [
  "Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Sunset", "Maghrib", "Isha",
  "Midnight", "Firstthird", "Lastthird"
]
const expectedDeltas = [
  {
    methods: [3, 2, 5, 1, 11, 17, 20], timing: "Dhuhr", minutes: 1,
    reason: "The engine keeps the official adhan method's +1 minute Dhuhr adjustment; AlAdhan omits it."
  },
  {
    methods: [16], timing: "Sunrise", minutes: -3,
    reason: "The Dubai official-timetable parameters set Sunrise -3; AlAdhan omits it."
  },
  {
    methods: [16], timing: "Asr", minutes: 3,
    reason: "The Dubai official-timetable parameters set Asr +3; AlAdhan omits it."
  },
  {
    methods: [15], timing: "Dhuhr", minutes: 5,
    reason: "The Moonsighting Committee timetable parameters set Dhuhr +5; AlAdhan omits it."
  },
  {
    methods: [15], timing: "Maghrib", minutes: 3,
    reason: "The Moonsighting Committee timetable parameters set Maghrib +3; AlAdhan omits it."
  },
  {
    methods: [16], timing: "Sunset", minutes: -3,
    reason: "AlAdhan applies Dubai's +3 Maghrib offset to Sunset too; the official parameters do not."
  },
  {
    methods: [13], timing: "Sunset", minutes: -7,
    reason: "AlAdhan applies Diyanet's +7 Maghrib offset to Sunset too; the official parameters do not."
  },
  {
    oracle: "Asr", reason: "AlAdhan's PrayTimes Asr astronomy differs from adhan; use the vendored adhan oracle delta."
  },
  {
    oracle: "night", reason: "Night fractions use adjusted dawns and real DST instants; use the vendored adhan solar delta."
  },
  {
    oracle: "high-latitude twilight",
    reason: "Above 55 degrees AlAdhan's caps differ, especially its method-15 seasonal-only convention; use adhan."
  }
]
const skipRules = [
  "Skip a day when AlAdhan collapses Sunrise and Sunset to one instant in polar day or night.",
  "Skip a day when AlAdhan's prayer instants remain non-monotonic after correcting its known after-midnight date stamp."
]
const wallClockRules = [
  "Compare after-midnight Sunset, Maghrib, and Isha by HH:mm because AlAdhan keeps the requested date.",
  "Compare after-midnight Firstthird by HH:mm where AlAdhan likewise keeps the requested date."
]
const adhanMethods = {
  1: "Karachi",
  2: "NorthAmerica",
  3: "MuslimWorldLeague",
  4: "UmmAlQura",
  5: "Egyptian",
  7: "Tehran",
  9: "Kuwait",
  10: "Qatar",
  11: "Singapore",
  13: "Turkey",
  15: "MoonsightingCommittee",
  16: "Dubai"
}

function dateText(apiDate) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(apiDate)
  assert.ok(match, `invalid AlAdhan Gregorian date ${apiDate}`)
  return `${match[3]}-${match[2]}-${match[1]}`
}

function endpointParts(endpoint) {
  const match = /^\/v1\/calendar\/(\d{4})\/(\d{1,2})$/.exec(endpoint)
  assert.ok(match, `invalid calendar endpoint ${endpoint}`)
  return { year: Number(match[1]), month: Number(match[2]) }
}

function configFromRequest(filename, request) {
  const query = request.query
  return {
    locationLabel: path.basename(filename, ".json"),
    latitude: Number(query.latitude),
    longitude: Number(query.longitude),
    timezone: query.timezonestring,
    method: Number(query.method),
    school: Number(query.school),
    latitudeAdjustmentMethod: Number(query.latitudeAdjustmentMethod),
    midnightMode: Number(query.midnightMode),
    hijriAdjustment: Number(query.adjustment),
    tune: query.tune,
    shafaq: query.shafaq,
    methodSettings: query.methodSettings || ""
  }
}

function fixedExpectedDelta(method, timing) {
  for (const row of expectedDeltas) {
    if (row.timing === timing && row.methods && row.methods.indexOf(method) !== -1) return row.minutes
  }
  return 0
}

function clockMinutes(iso) {
  const match = /T(\d{2}):(\d{2}):/.exec(iso)
  assert.ok(match, `invalid ISO timing ${iso}`)
  return Number(match[1]) * 60 + Number(match[2])
}

function circularMinuteDelta(leftIso, rightIso) {
  let delta = clockMinutes(leftIso) - clockMinutes(rightIso)
  while (delta > 720) delta -= 1440
  while (delta < -720) delta += 1440
  return delta
}

function afterMidnightWrongDate(row, timing) {
  if (["Sunset", "Maghrib", "Isha", "Firstthird"].indexOf(timing) === -1) return false
  return Date.parse(row.timings[timing]) < Date.parse(row.timings.Dhuhr)
}

function tuneValues(config) {
  const source = String(config.tune || "").split(",")
  return Array.from({ length: 9 }, (_, index) => Number(source[index]) || 0)
}

function roundedOracle(value, method) {
  const rounding = Engine.methodById(method).rounding
  if (rounding === "up") return Math.ceil(value / 60000) * 60000
  return Math.floor((value + 30000) / 60000) * 60000
}

function referenceRule(id) {
  if (id === 2) return Adhan.HighLatitudeRule.SeventhOfTheNight
  if (id === 3) return Adhan.HighLatitudeRule.TwilightAngle
  return Adhan.HighLatitudeRule.MiddleOfTheNight
}

function referenceTimes(config, date) {
  const methodName = adhanMethods[config.method]
  const parameters = methodName ? Adhan.CalculationMethod[methodName]() : Adhan.CalculationMethod.Other()
  parameters.rounding = Adhan.Rounding.None
  parameters.madhab = config.school === 1 ? Adhan.Madhab.Hanafi : Adhan.Madhab.Shafi
  parameters.highLatitudeRule = referenceRule(config.latitudeAdjustmentMethod)
  parameters.shafaq = config.shafaq
  parameters.polarCircleResolution = Adhan.PolarCircleResolution.AqrabBalad
  return new Adhan.PrayerTimes(
    new Adhan.Coordinates(config.latitude, config.longitude),
    new Date(Date.UTC(date.year, date.month - 1, date.day)),
    parameters
  )
}

function addUtcDays(date, amount) {
  const value = new Date(Date.UTC(date.year, date.month - 1, date.day + amount))
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() }
}

function oracleCivilDate(config, date, zone) {
  const dateString = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`
  const dayIndex = zone.days.findIndex(day => day.date === dateString)
  assert.ok(dayIndex >= 0 && dayIndex + 1 < zone.days.length, `oracle zone window ${dateString}`)
  const start = zone.days[dayIndex].start * 1000
  const end = zone.days[dayIndex + 1].start * 1000
  const tune = tuneValues(config)
  for (let difference = -1; difference <= 1; difference++) {
    const candidate = addUtcDays(date, difference)
    const reference = referenceTimes(config, candidate)
    const dhuhr = roundedOracle(reference.dhuhr.getTime() + tune[3] * 60000, config.method)
    if (dhuhr >= start && dhuhr < end) return candidate
  }
  assert.fail(`adhan oracle could not assign ${dateString}`)
}

function oracleTimings(config, localDate, zone) {
  const date = oracleCivilDate(config, localDate, zone)
  const current = referenceTimes(config, date)
  const next = referenceTimes(config, addUtcDays(date, 1))
  const tune = tuneValues(config)
  const sunset = current.sunset.getTime()
  const nightEnd = config.midnightMode === 1 ? next.fajr.getTime() : next.sunrise.getTime()
  const night = nightEnd - sunset
  return {
    Imsak: roundedOracle(current.fajr.getTime() - 10 * 60000 + tune[0] * 60000, config.method),
    Fajr: roundedOracle(current.fajr.getTime() + tune[1] * 60000, config.method),
    Asr: roundedOracle(current.asr.getTime() + tune[4] * 60000, config.method),
    Isha: roundedOracle(current.isha.getTime() + tune[7] * 60000, config.method),
    Midnight: roundedOracle(sunset + night / 2 + tune[8] * 60000, config.method),
    Firstthird: roundedOracle(sunset + night / 3, config.method),
    Lastthird: roundedOracle(sunset + night * 2 / 3, config.method)
  }
}

function deltaFromEpoch(epoch, aladhanIso, wallClock, zone) {
  if (!wallClock) return (epoch - Date.parse(aladhanIso)) / 60000
  const oracleIso = Engine.isoWithOffset(epoch, Engine.offsetAt(zone, epoch / 1000))
  return circularMinuteDelta(oracleIso, aladhanIso)
}

function expectedDelta(config, date, timing, row, zone, oracle) {
  const useOracle = timing === "Asr"
    || ["Midnight", "Firstthird", "Lastthird"].indexOf(timing) !== -1
    || (Math.abs(config.latitude) >= 55 && ["Imsak", "Fajr", "Isha"].indexOf(timing) !== -1
      && adhanMethods[config.method])
  if (useOracle && Number.isFinite(oracle[timing]))
    return deltaFromEpoch(oracle[timing], row.timings[timing], afterMidnightWrongDate(row, timing), zone)
  return fixedExpectedDelta(config.method, timing)
}

function invalidReason(row) {
  const sunrise = Date.parse(row.timings.Sunrise)
  const sunset = Date.parse(row.timings.Sunset)
  if (sunrise === sunset) return "collapsed Sunrise/Sunset"
  const names = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"]
  let previous = -Infinity
  for (const name of names) {
    let value = Date.parse(row.timings[name])
    if (afterMidnightWrongDate(row, name)) value += 86400000
    if (!Number.isFinite(value) || value <= previous) return `non-monotonic at ${name}`
    previous = value
  }
  return ""
}

function zoneForSnapshot(snapshot, stateDirectory) {
  const firstDhuhr = Date.parse(snapshot.data[0].timings.Dhuhr)
  assert.ok(Number.isFinite(firstDhuhr), `${snapshot.request.endpoint} has invalid first Dhuhr`)
  const raw = execFileSync(path.join(root, "prayer-zone.sh"), [
    "--timezone", snapshot.request.query.timezonestring,
    "--now", String(Math.floor(firstDhuhr / 1000)),
    "--days", "40"
  ], {
    encoding: "utf8",
    env: { ...process.env, XDG_STATE_HOME: stateDirectory }
  })
  return JSON.parse(raw)
}

function assertSnapshotRequest(filename, snapshot) {
  const query = snapshot.request && snapshot.request.query
  assert.ok(query, `${filename} is missing request.query`)
  endpointParts(snapshot.request.endpoint)
  const required = [
    "latitude", "longitude", "method", "school", "latitudeAdjustmentMethod",
    "midnightMode", "adjustment", "tune", "shafaq", "iso8601", "timezonestring"
  ]
  for (const name of required) assert.equal(typeof query[name], "string", `${filename} request.${name}`)
  assert.equal(query.iso8601, "true", `${filename} iso8601`)
  if (query.method === "99") assert.equal(typeof query.methodSettings, "string", `${filename} methodSettings`)
}

const methods = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "methods.json"), "utf8"))
assert.deepEqual(methods.request, { endpoint: "/v1/methods", query: {} })
assert.deepEqual(Object.values(methods.data).map(value => Number(value.id)).sort((a, b) => a - b),
  [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 99])

const maximumDelta = Object.fromEntries(timingNames.map(name => [name, 0]))
const skippedByReason = {}
const wrongDateByTiming = {}
const failureStats = {}
const failures = []
let daysCompared = 0
let daysSkipped = 0
let timingComparisons = 0
const stateDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "omaprayers-aladhan-"))

try {
  const filenames = fs.readdirSync(calendarRoot).filter(name => name.endsWith(".json")).sort()
  assert.equal(filenames.length, 60, "calendar snapshot matrix size")
  for (const filename of filenames) {
    const snapshot = JSON.parse(fs.readFileSync(path.join(calendarRoot, filename), "utf8"))
    assertSnapshotRequest(filename, snapshot)
    const expectedMonth = endpointParts(snapshot.request.endpoint)
    const config = configFromRequest(filename, snapshot.request)
    const zone = zoneForSnapshot(snapshot, stateDirectory)
    const schedule = Engine.buildSchedule(config, zone, Date.parse(snapshot.data[0].timings.Dhuhr))
    assert.equal(schedule.ok, true, `${filename}: ${schedule.error || "schedule failed"}`)
    const scheduleDays = new Map(schedule.days.map(day => [day.date, day]))
    for (const row of snapshot.data) {
      const date = dateText(row.date.gregorian.date)
      assert.equal(Number(date.slice(0, 4)), expectedMonth.year, `${filename} year`)
      assert.equal(Number(date.slice(5, 7)), expectedMonth.month, `${filename} month`)
      assert.equal(row.meta.timezone, config.timezone, `${filename} ${date} timezone`)
      const invalid = invalidReason(row)
      if (invalid) {
        daysSkipped++
        skippedByReason[invalid] = (skippedByReason[invalid] || 0) + 1
        continue
      }
      const actualDay = scheduleDays.get(date)
      assert.ok(actualDay, `${filename} ${date} missing from engine schedule`)
      const dateParts = { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)), day: Number(date.slice(8, 10)) }
      const oracle = oracleTimings(config, dateParts, zone)
      for (const timing of timingNames) {
        const engineIso = actualDay.timings[timing].at
        const aladhanIso = row.timings[timing]
        const expected = expectedDelta(config, dateParts, timing, row, zone, oracle)
        const rawDelta = afterMidnightWrongDate(row, timing)
          ? circularMinuteDelta(engineIso, aladhanIso)
          : (Date.parse(engineIso) - Date.parse(aladhanIso)) / 60000
        if (afterMidnightWrongDate(row, timing))
          wrongDateByTiming[timing] = (wrongDateByTiming[timing] || 0) + 1
        const delta = rawDelta - expected
        maximumDelta[timing] = Math.max(maximumDelta[timing], Math.abs(delta))
        timingComparisons++
        if (!Number.isFinite(delta) || Math.abs(delta) > 1) {
          const statKey = `${filename} ${timing} raw=${rawDelta} expected=${expected}`
          failureStats[statKey] = (failureStats[statKey] || 0) + 1
          failures.push(`${filename} ${date} ${timing}: engine=${engineIso} AlAdhan=${aladhanIso} `
            + `raw Δ=${rawDelta}m expected=${expected}m residual=${delta}m`)
        }
      }
      daysCompared++
    }
  }

  const hijriFixture = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "hijri", "gToH.json"), "utf8"))
  assert.equal(hijriFixture.data.length, 36, "UAQ sample matrix size")
  for (const row of hijriFixture.data) {
    assert.deepEqual(row.request.query, { calendarMethod: "UAQ" })
    const date = dateText(row.gregorian)
    const actual = Engine.hijri(Number(date.slice(0, 4)), Number(date.slice(5, 7)), Number(date.slice(8, 10)), 0)
    const engineHijri = [actual.day, actual.month, actual.year]
    const aladhanHijri = [Number(row.hijri.day), Number(row.hijri.month), Number(row.hijri.year)]
    if (engineHijri.join("-") !== aladhanHijri.join("-")) {
      failureStats["UAQ mismatch"] = (failureStats["UAQ mismatch"] || 0) + 1
      failures.push(`UAQ ${date}: engine=${engineHijri.join("/")} AlAdhan=${aladhanHijri.join("/")}`)
    }
  }
} finally {
  fs.rmSync(stateDirectory, { recursive: true, force: true })
}

console.log(`${daysCompared} days compared, ${daysSkipped} skipped (AlAdhan invalid), ${timingComparisons} timing comparisons`)
console.log(`max Δ per timing (minutes): ${timingNames.map(name => `${name}=${maximumDelta[name]}`).join(", ")}`)
console.log(`AlAdhan invalid: ${Object.entries(skippedByReason).map(([reason, count]) => `${reason}=${count}`).join(", ") || "none"}`)
console.log(`AlAdhan previous-date wall-clock comparisons: ${Object.entries(wrongDateByTiming).map(([name, count]) => `${name}=${count}`).join(", ") || "none"}`)
if (failures.length) {
  console.error(Object.entries(failureStats).sort().map(([key, count]) => `${key}: ${count}`).join("\n"))
  console.error("First disagreements:\n" + failures.slice(0, 20).join("\n"))
  assert.fail(`${failures.length} AlAdhan comparisons exceeded the fixed ±1 minute tolerance`)
}
console.log(`Expected-delta rows: ${expectedDeltas.length}; skip rules: ${skipRules.length}; wall-clock rules: ${wallClockRules.length}; UAQ rows: 36`)
console.log("AlAdhan snapshot tests passed")
