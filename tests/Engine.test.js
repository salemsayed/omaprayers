process.env.TZ = "UTC"

const assert = require("node:assert/strict")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const { execFileSync } = require("node:child_process")
const vm = require("node:vm")
const Engine = require("../Engine.js")
const requireQmlJs = require("./qml-js-loader.js")
const Model = requireQmlJs(path.join(__dirname, "..", "Model.js"), module)
const Adhan = require("./vendor/adhan.umd.min.js")

let count = 0
let fixtureRowsPassed = 0
let fuzzCasesPassed = 0
let polarFuzzCasesPassed = 0
let polarCasesPassed = 0
const fuzzSeed = 0x5eedc0de
const fuzzMax = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
const solarMax = { sunrise: 0, noon: 0, sunset: 0 }

function test(name, fn) {
  try {
    fn()
    count++
  } catch (error) {
    console.error(`FAIL: ${name}`)
    throw error
  }
}

function parts(dateText) {
  const values = dateText.split("-").map(Number)
  return { year: values[0], month: values[1], day: values[2] }
}

function utcParts(epoch) {
  const value = new Date(epoch)
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() }
}

function formatterFor(timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  })
}

function wallClockEpoch(dateText, timeText, timezone) {
  const date = parts(dateText)
  const match = /^(\d{1,2}):(\d{2})\s+([AP])M$/i.exec(timeText)
  assert.ok(match, `invalid fixture wall clock ${dateText} ${timeText}`)
  let hour = Number(match[1]) % 12
  if (match[3].toUpperCase() === "P") hour += 12
  const wanted = Date.UTC(date.year, date.month - 1, date.day, hour, Number(match[2]))
  const formatter = formatterFor(timezone)
  let guess = wanted
  for (let attempt = 0; attempt < 4; attempt++) {
    const fields = {}
    for (const field of formatter.formatToParts(new Date(guess))) {
      if (field.type !== "literal") fields[field.type] = Number(field.value)
    }
    const represented = Date.UTC(fields.year, fields.month - 1, fields.day, fields.hour, fields.minute, fields.second)
    const difference = wanted - represented
    guess += difference
    if (difference === 0) break
  }
  return guess
}

function config(method, latitude, longitude, school, rule, extra = {}) {
  return {
    method,
    latitude,
    longitude,
    school,
    latitudeAdjustmentMethod: rule,
    midnightMode: 0,
    tune: "0,0,0,0,0,0,0,0,0",
    shafaq: "general",
    methodSettings: "",
    ...extra
  }
}

function scheduleConfig(method, latitude, longitude, timezone, extra = {}) {
  return config(method, latitude, longitude, 0, 3, {
    locationLabel: timezone,
    timezone,
    hijriAdjustment: 0,
    ...extra
  })
}

function midnightStart(date, offset) {
  return Date.parse(`${date}T00:00:00Z`) / 1000 - offset
}

function handZone(timezone, days, offsets) {
  return { schemaVersion: 2, ok: true, timezone, nowEpoch: 0, days, offsets }
}

function zoneDay(zone, date) {
  return zone.days.find(day => day.date === date)
}

function assertDhuhrWindows(schedule, zone) {
  assert.equal(schedule.ok, true, schedule.error)
  for (const day of schedule.days) {
    const index = zone.days.findIndex(candidate => candidate.date === day.date)
    assert.ok(index >= 0 && index + 1 < zone.days.length, `${day.date} has no zone window`)
    const dhuhr = Date.parse(day.timings.Dhuhr.at) / 1000
    assert.ok(dhuhr >= zone.days[index].start && dhuhr < zone.days[index + 1].start,
      `${zone.timezone} ${day.date} Dhuhr is outside its local day`)
  }
}

function assertPrayerOrdering(day) {
  const at = name => Date.parse(day.timings[name].at)
  assert.ok(at("Fajr") < at("Dhuhr") && at("Dhuhr") < at("Asr")
    && at("Asr") < at("Maghrib") && at("Maghrib") <= at("Isha"), `${day.date} ordering`)
}

function within(actual, expected, maximum, message) {
  const delta = Math.abs(actual - expected)
  assert.ok(delta <= maximum, `${message}: Δ=${(delta / 1000).toFixed(3)}s, limit=${maximum / 1000}s`)
  return delta
}

function referenceMethod(name) {
  return Adhan.CalculationMethod[name]()
}

function referenceRule(id) {
  if (id === 2) return Adhan.HighLatitudeRule.SeventhOfTheNight
  if (id === 3) return Adhan.HighLatitudeRule.TwilightAngle
  return Adhan.HighLatitudeRule.MiddleOfTheNight
}

function referenceMadhab(id) {
  return id === 1 ? Adhan.Madhab.Hanafi : Adhan.Madhab.Shafi
}

function finiteReference(times) {
  return ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
    .every(name => Number.isFinite(times[name].getTime()))
}

function createLcg(seed) {
  let state = seed >>> 0
  return function random() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function randomDate(random) {
  const start = Date.UTC(2020, 0, 1)
  const days = Math.floor((Date.UTC(2036, 0, 1) - start) / 86400000)
  return utcParts(start + Math.floor(random() * days) * 86400000)
}

function noaaSolar(year, month, day, latitude, longitude) {
  const radians = degrees => degrees * Math.PI / 180
  const degrees = value => value * 180 / Math.PI
  const normalize = value => ((value % 360) + 360) % 360
  const dayStart = Date.UTC(year, month - 1, day)
  const julian = dayStart / 86400000 + 2440587.5
  function position(minutes) {
    const century = (julian + minutes / 1440 - 2451545) / 36525
    const longitudeMean = normalize(280.46646 + century * (36000.76983 + 0.0003032 * century))
    const anomaly = 357.52911 + century * (35999.05029 - 0.0001537 * century)
    const eccentricity = 0.016708634 - century * (0.000042037 + 0.0000001267 * century)
    const center = Math.sin(radians(anomaly)) * (1.914602 - century * (0.004817 + 0.000014 * century))
      + Math.sin(radians(2 * anomaly)) * (0.019993 - 0.000101 * century)
      + Math.sin(radians(3 * anomaly)) * 0.000289
    const apparent = longitudeMean + center - 0.00569
      - 0.00478 * Math.sin(radians(125.04 - 1934.136 * century))
    const obliquity = 23 + (26 + (21.448 - century * (46.815 + century * (0.00059 - century * 0.001813))) / 60) / 60
      + 0.00256 * Math.cos(radians(125.04 - 1934.136 * century))
    const declination = degrees(Math.asin(Math.sin(radians(obliquity)) * Math.sin(radians(apparent))))
    const y = Math.tan(radians(obliquity / 2)) ** 2
    const equation = 4 * degrees(y * Math.sin(2 * radians(longitudeMean))
      - 2 * eccentricity * Math.sin(radians(anomaly))
      + 4 * eccentricity * y * Math.sin(radians(anomaly)) * Math.cos(2 * radians(longitudeMean))
      - 0.5 * y * y * Math.sin(4 * radians(longitudeMean))
      - 1.25 * eccentricity * eccentricity * Math.sin(2 * radians(anomaly)))
    return { declination, equation }
  }
  function event(kind) {
    let minutes = 720 - 4 * longitude
    for (let iteration = 0; iteration < 3; iteration++) {
      const solar = position(minutes)
      if (kind === "noon") {
        minutes = 720 - 4 * longitude - solar.equation
      } else {
        const cosine = Math.cos(radians(90.833)) / (Math.cos(radians(latitude))
          * Math.cos(radians(solar.declination))) - Math.tan(radians(latitude))
          * Math.tan(radians(solar.declination))
        if (cosine < -1 || cosine > 1) return NaN
        const hourAngle = degrees(Math.acos(cosine))
        minutes = 720 - 4 * (longitude + (kind === "sunrise" ? hourAngle : -hourAngle)) - solar.equation
      }
    }
    return dayStart + minutes * 60000
  }
  return { sunrise: event("sunrise"), noon: event("noon"), sunset: event("sunset") }
}

test("Engine.js stays within the shared ES5 and QML loading subset", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "Engine.js"), "utf8")
  const forbidden = [
    /\b(?:const|let|class|Intl)\b/,
    /=>/,
    /`/,
    /\.includes\s*\(/,
    /\.find\s*\(/,
    /Number\.isNaN/,
    /Object\.assign/,
    /\.get(?:FullYear|Month|Date|Day|Hours|Minutes|Seconds)\s*\(/,
    /^\s*[^/\s].*;\s*$/m
  ]
  for (const pattern of forbidden) assert.equal(pattern.test(source), false, String(pattern))
  const context = { Math, Date, JSON, Number, String, Boolean, isFinite, isNaN, module: { exports: {} } }
  vm.runInNewContext(source, context, { filename: "Engine.js" })
  assert.equal(context.module.exports.METHODS.length, 24)
})

test("method catalog order, lookup, regions, and custom components follow the contract", () => {
  assert.deepEqual(Engine.METHODS.map(method => method.id),
    [3, 2, 5, 4, 1, 7, 0, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 99])
  assert.equal(new Set(Engine.METHODS.map(method => method.id)).size, 24)
  assert.equal(Engine.methodById("5").code, "EGAS")
  assert.equal(Engine.methodById(6), null)
  assert.deepEqual(Engine.methodById(17).regions, ["MY", "BN"])
  assert.equal(Engine.methodById(5).name[1], "الهيئة المصرية العامة للمساحة")
  const custom = Engine.methodParameters({ method: 99, methodSettings: "18,null," })
  assert.equal(custom.fajrAngle, 18)
  assert.equal(custom.maghribAngle, 0)
  assert.equal(custom.ishaAngle, 15)
  assert.deepEqual(custom.adjustments, { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 })
})

test("official Batoul Apps timetable rows stay inside their published variance", () => {
  const fixtureDirectory = path.join(__dirname, "fixtures", "batoulapps")
  const methodIds = {
    UmmAlQura: 4,
    Qatar: 10,
    Kuwait: 9,
    Dubai: 16,
    MoonsightingCommittee: 15,
    Singapore: 11,
    Turkey: 13,
    Tehran: 7
  }
  const ruleIds = { MiddleOfTheNight: 1, SeventhOfTheNight: 2, TwilightAngle: 3 }
  const prayerNames = { fajr: "Fajr", sunrise: "Sunrise", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" }
  const filenames = fs.readdirSync(fixtureDirectory).filter(name => name.endsWith(".json")).sort()
  for (const filename of filenames) {
    const fixture = JSON.parse(fs.readFileSync(path.join(fixtureDirectory, filename), "utf8"))
    const method = methodIds[fixture.params.method]
    assert.notEqual(method, undefined, `${filename} method mapping`)
    const school = fixture.params.madhab === "Hanafi" ? 1 : 0
    const rule = ruleIds[fixture.params.highLatitudeRule] || 1
    const variance = fixture.variance || 0
    for (const row of fixture.times) {
      const date = parts(row.date)
      const calculated = Engine.dayTimes(config(method, fixture.params.latitude, fixture.params.longitude, school, rule),
        date.year, date.month, date.day, null)
      assert.ok(calculated, `${filename} ${row.date} returned no result`)
      for (const [fixtureName, engineName] of Object.entries(prayerNames)) {
        const expected = wallClockEpoch(row.date, row[fixtureName], fixture.params.timezone)
        within(calculated[engineName], expected, variance * 60000,
          `${filename} ${row.date} ${engineName}`)
      }
      fixtureRowsPassed++
    }
  }
  // The eight supplied files total 462 rows; the research note's 466 is an
  // arithmetic error (24 Ankara + 366 Singapore + six groups of 12).
  assert.equal(fixtureRowsPassed, 462)
})

test("seeded port-fidelity fuzz stays within one second of adhan 4.4.4", () => {
  const methods = [
    [3, "MuslimWorldLeague"], [5, "Egyptian"], [1, "Karachi"], [4, "UmmAlQura"],
    [16, "Dubai"], [15, "MoonsightingCommittee"], [2, "NorthAmerica"], [9, "Kuwait"],
    [10, "Qatar"], [11, "Singapore"], [7, "Tehran"], [13, "Turkey"]
  ]
  const names = Object.keys(fuzzMax)
  const random = createLcg(fuzzSeed)
  for (let index = 0; index < 3000; index++) {
    const date = randomDate(random)
    const latitude = -66 + random() * 132
    const longitude = -180 + random() * 360
    const selected = methods[Math.floor(random() * methods.length)]
    const school = random() < 0.5 ? 0 : 1
    const rule = 1 + Math.floor(random() * 3)
    const shafaq = ["general", "ahmer", "abyad"][Math.floor(random() * 3)]
    const referenceParameters = referenceMethod(selected[1])
    referenceParameters.rounding = Adhan.Rounding.None
    referenceParameters.madhab = referenceMadhab(school)
    referenceParameters.highLatitudeRule = referenceRule(rule)
    referenceParameters.shafaq = shafaq
    const reference = new Adhan.PrayerTimes(
      new Adhan.Coordinates(latitude, longitude),
      new Date(Date.UTC(date.year, date.month - 1, date.day)),
      referenceParameters
    )
    if (!finiteReference(reference)) {
      index--
      continue
    }
    const ours = Engine.prayerTimes(date.year, date.month, date.day, latitude, longitude,
      Engine.methodParameters({ method: selected[0] }), { school, latitudeAdjustmentMethod: rule, shafaq })
    assert.ok(ours, `fuzz case ${index} returned no result`)
    for (const name of names) {
      const delta = Math.abs(ours[name] - reference[name].getTime()) / 1000
      fuzzMax[name] = Math.max(fuzzMax[name], delta)
      assert.ok(delta <= 1, `seed=${fuzzSeed} case=${index} ${name} Δ=${delta}s`)
    }
    fuzzCasesPassed++
  }

  for (let index = 0; index < 300; index++) {
    const date = randomDate(random)
    const latitude = (random() < 0.5 ? -1 : 1) * (66 + random() * 14)
    const longitude = -180 + random() * 360
    const selected = methods[Math.floor(random() * methods.length)]
    const school = random() < 0.5 ? 0 : 1
    const rule = 1 + Math.floor(random() * 3)
    const referenceParameters = referenceMethod(selected[1])
    referenceParameters.rounding = Adhan.Rounding.None
    referenceParameters.madhab = referenceMadhab(school)
    referenceParameters.highLatitudeRule = referenceRule(rule)
    referenceParameters.polarCircleResolution = Adhan.PolarCircleResolution.AqrabBalad
    const reference = new Adhan.PrayerTimes(
      new Adhan.Coordinates(latitude, longitude),
      new Date(Date.UTC(date.year, date.month - 1, date.day)),
      referenceParameters
    )
    if (!finiteReference(reference)) continue
    const ours = Engine.prayerTimes(date.year, date.month, date.day, latitude, longitude,
      Engine.methodParameters({ method: selected[0] }), { school, latitudeAdjustmentMethod: rule, shafaq: "general" })
    assert.ok(ours, `polar fuzz case ${index} returned no result`)
    for (const name of names) {
      const delta = Math.abs(ours[name] - reference[name].getTime()) / 1000
      fuzzMax[name] = Math.max(fuzzMax[name], delta)
      assert.ok(delta <= 1, `seed=${fuzzSeed} polar=${index} ${name} Δ=${delta}s`)
    }
    polarFuzzCasesPassed++
    if (ours.resolution === "nearest-latitude") polarCasesPassed++
  }
  assert.equal(fuzzCasesPassed, 3000)
  assert.equal(polarFuzzCasesPassed, 300)
  assert.ok(polarCasesPassed > 0, "seeded polar set did not exercise nearest-latitude")
})

test("solar core agrees with an independent inline NOAA implementation", () => {
  const cities = [
    ["Cairo", 30.0444, 31.2357], ["Makkah", 21.4225, 39.8262], ["Dubai", 25.2048, 55.2708],
    ["Istanbul", 41.0082, 28.9784], ["Lisbon", 38.7223, -9.1393], ["London", 51.5074, -0.1278],
    ["Paris", 48.8566, 2.3522], ["Berlin", 52.52, 13.405], ["Moscow", 55.7558, 37.6173],
    ["Karachi", 24.8607, 67.0011], ["Delhi", 28.6139, 77.209], ["Singapore", 1.3521, 103.8198],
    ["Nairobi", -1.2921, 36.8219], ["Quito", -0.1807, -78.4678], ["New York", 40.7128, -74.006],
    ["Toronto", 43.6532, -79.3832], ["Los Angeles", 34.0522, -118.2437], ["Honolulu", 21.3069, -157.8583],
    ["Anchorage", 61.2181, -149.9003], ["Sydney", -33.8688, 151.2093], ["Auckland", -36.8509, 174.7645],
    ["Cape Town", -33.9249, 18.4241], ["Buenos Aires", -34.6037, -58.3816],
    ["Reykjavik", 64.1466, -21.9426], ["Edinburgh", 55.9533, -3.1883]
  ]
  const dates = [[2026, 3, 20], [2026, 6, 21], [2026, 9, 22], [2026, 12, 21],
    [2028, 2, 29], [2026, 12, 31], [2027, 1, 1], [2026, 8, 14]]
  let comparisons = 0
  for (const [city, latitude, longitude] of cities) {
    for (const [year, month, day] of dates) {
      const expected = noaaSolar(year, month, day, latitude, longitude)
      const actual = {
        sunrise: Engine.sunrise(year, month, day, latitude, longitude),
        noon: Engine.solarNoon(year, month, day, latitude, longitude),
        sunset: Engine.sunset(year, month, day, latitude, longitude)
      }
      const egypt = Engine.prayerTimes(year, month, day, latitude, longitude,
        Engine.methodParameters({ method: 5 }), { school: 0, latitudeAdjustmentMethod: 3, shafaq: "general" })
      const horizonLimit = Math.abs(latitude) > 60 ? 180000 : 120000
      if (Number.isFinite(expected.sunrise)) {
        solarMax.sunrise = Math.max(solarMax.sunrise,
          within(actual.sunrise, expected.sunrise, horizonLimit, `${city} ${year}-${month}-${day} sunrise`) / 1000)
      }
      solarMax.noon = Math.max(solarMax.noon,
        within(egypt.dhuhr,
          expected.noon + Engine.methodById(5).adjustments.dhuhr * 60000,
          60000, `${city} ${year}-${month}-${day} noon`) / 1000)
      if (Number.isFinite(expected.sunset)) {
        solarMax.sunset = Math.max(solarMax.sunset,
          within(actual.sunset, expected.sunset, horizonLimit, `${city} ${year}-${month}-${day} sunset`) / 1000)
      }
      comparisons++
    }
  }
  assert.equal(comparisons, 200)
})

test("prayer-time properties hold across cities, methods, schools, rules, and dates", () => {
  const cities = [
    ["Cairo", 30.0444, 31.2357], ["Makkah", 21.4225, 39.8262], ["Riyadh", 24.7136, 46.6753],
    ["Dubai", 25.2048, 55.2708], ["Doha", 25.2854, 51.531], ["Kuwait City", 29.3759, 47.9774],
    ["Amman", 31.9539, 35.9106], ["Istanbul", 41.0082, 28.9784], ["Tunis", 36.8065, 10.1815],
    ["Algiers", 36.7538, 3.0588], ["Casablanca", 33.5731, -7.5898], ["Lisbon", 38.7223, -9.1393],
    ["Paris", 48.8566, 2.3522], ["London", 51.5074, -0.1278], ["Berlin", 52.52, 13.405],
    ["Moscow", 55.7558, 37.6173], ["Kazan", 55.7961, 49.1064], ["Karachi", 24.8607, 67.0011],
    ["Delhi", 28.6139, 77.209], ["Dhaka", 23.8103, 90.4125], ["Kuala Lumpur", 3.139, 101.6869],
    ["Jakarta", -6.2088, 106.8456], ["Singapore", 1.3521, 103.8198], ["Nairobi", -1.2921, 36.8219],
    ["Quito", -0.1807, -78.4678], ["Lagos", 6.5244, 3.3792], ["New York", 40.7128, -74.006],
    ["Toronto", 43.6532, -79.3832], ["Los Angeles", 34.0522, -118.2437], ["Honolulu", 21.3069, -157.8583],
    ["Anchorage", 61.2181, -149.9003], ["Sydney", -33.8688, 151.2093], ["Auckland", -36.8509, 174.7645],
    ["Cape Town", -33.9249, 18.4241], ["Buenos Aires", -34.6037, -58.3816],
    ["Kiritimati", 1.8721, -157.4278], ["Apia", -13.8507, -171.7514], ["Urumqi", 43.8256, 87.6168],
    ["Oslo", 59.9139, 10.7522], ["Stockholm", 59.3293, 18.0686], ["Edinburgh", 55.9533, -3.1883],
    ["Reykjavik", 64.1466, -21.9426], ["Tromsø", 69.6492, 18.9553], ["Murmansk", 68.9585, 33.0827]
  ]
  const dates = [[2026, 3, 20], [2026, 6, 21], [2026, 9, 22], [2026, 12, 21],
    [2028, 2, 29], [2026, 12, 31], [2027, 1, 1], [2026, 8, 14]]
  let matrixCases = 0
  for (const [city, latitude, longitude] of cities) {
    for (const method of Engine.METHODS) {
      for (const rule of [1, 2, 3]) {
        for (const [year, month, day] of dates) {
          const shafi = Engine.dayTimes(config(method.id, latitude, longitude, 0, rule), year, month, day, { month: 8 })
          const hanafi = Engine.dayTimes(config(method.id, latitude, longitude, 1, rule), year, month, day, { month: 8 })
          const jafariNight = Engine.dayTimes(config(method.id, latitude, longitude, 0, rule, { midnightMode: 1 }),
            year, month, day, { month: 8 })
          assert.ok(shafi && hanafi && jafariNight, `${city} method ${method.id} rule ${rule} ${year}-${month}-${day}`)
          for (const times of [shafi, hanafi]) {
            if (times.resolution !== "none") continue
            assert.ok(times.Fajr < times.Sunrise && times.Sunrise < times.Dhuhr
              && times.Dhuhr < times.Asr && times.Asr < times.Maghrib && times.Maghrib <= times.Isha,
            `${city} method ${method.id} rule ${rule} ordering`)
            assert.equal(times.Imsak, times.Fajr - 10 * 60000)
            assert.ok(times.Sunset <= times.Maghrib)
            assert.ok(times.Firstthird < times.Midnight && times.Midnight < times.Lastthird)
          }
          if (shafi.resolution === "none" && hanafi.resolution === "none") assert.ok(hanafi.Asr > shafi.Asr)
          assert.ok(jafariNight.Midnight <= shafi.Midnight)
          if (method.id === 22) assert.equal(shafi.Isha, shafi.Maghrib + 77 * 60000)
          if (method.id === 23) assert.equal(shafi.Maghrib, shafi.Sunset + 5 * 60000)
          if (method.id === 4) {
            assert.equal(shafi.Isha, shafi.Maghrib + 90 * 60000)
            const ramadan = Engine.dayTimes(config(method.id, latitude, longitude, 0, rule),
              year, month, day, { month: 9 })
            assert.equal(ramadan.Isha, ramadan.Maghrib + 120 * 60000)
          }
          matrixCases += 2
        }
      }
    }
  }
  assert.equal(matrixCases, cities.length * Engine.METHODS.length * 3 * dates.length * 2)
})

test("tuning, shafaq, interval methods, and southern seasons are isolated", () => {
  const baseConfig = config(5, 30.0444, 31.2357, 0, 3)
  const base = Engine.dayTimes(baseConfig, 2026, 8, 20, { month: 3 })
  const tuneNames = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Sunset", "Isha", "Midnight"]
  for (let index = 0; index < tuneNames.length; index++) {
    const values = Array(9).fill(0)
    values[index] = 7
    const tuned = Engine.dayTimes({ ...baseConfig, tune: values.join(",") }, 2026, 8, 20, { month: 3 })
    for (const name of tuneNames) {
      assert.equal(tuned[name] - base[name], name === tuneNames[index] ? 7 * 60000 : 0,
        `tune index ${index} changed ${name}`)
    }
    assert.equal(tuned.Firstthird, base.Firstthird)
    assert.equal(tuned.Lastthird, base.Lastthird)
  }

  const moonConfig = config(15, 55.9533, -3.1883, 1, 1)
  const general = Engine.dayTimes({ ...moonConfig, shafaq: "general" }, 2026, 12, 15, { month: 7 })
  const ahmer = Engine.dayTimes({ ...moonConfig, shafaq: "ahmer" }, 2026, 12, 15, { month: 7 })
  const abyad = Engine.dayTimes({ ...moonConfig, shafaq: "abyad" }, 2026, 12, 15, { month: 7 })
  for (const name of ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Sunset", "Maghrib", "Midnight", "Firstthird", "Lastthird"])
    assert.equal(general[name], ahmer[name], `shafaq changed ${name}`)
  assert.ok(ahmer.Isha < general.Isha && general.Isha < abyad.Isha)
  const mwlGeneral = Engine.dayTimes(config(3, 51.5074, -0.1278, 0, 1, { shafaq: "general" }), 2026, 12, 21, null)
  const mwlAbyad = Engine.dayTimes(config(3, 51.5074, -0.1278, 0, 1, { shafaq: "abyad" }), 2026, 12, 21, null)
  assert.deepEqual(mwlGeneral, mwlAbyad)

  const sydneyJune = Engine.dayTimes(config(3, -33.8688, 151.2093, 0, 3), 2026, 6, 21, null)
  const sydneyDecember = Engine.dayTimes(config(3, -33.8688, 151.2093, 0, 3), 2026, 12, 21, null)
  assert.ok(sydneyDecember.Sunset - sydneyDecember.Sunrise > sydneyJune.Sunset - sydneyJune.Sunrise)
})

test("Umm al-Qura Hijri anchors, adjustments, full range, and fallback are continuous", () => {
  const anchors = [
    [2026, 8, 20, 1448, 3, 7, "Rabi' al-Awwal"],
    [2026, 6, 16, 1448, 1, 1, "Muharram"],
    [2026, 2, 18, 1447, 9, 1, "Ramadan"],
    [2025, 3, 1, 1446, 9, 1, "Ramadan"],
    [2024, 7, 7, 1446, 1, 1, "Muharram"],
    // The live UAQ API gives 29 Sha'ban, correcting the plan's Ramadan anchor.
    [2030, 1, 4, 1451, 8, 29, "Sha'ban"]
  ]
  for (const [year, month, day, hijriYear, hijriMonth, hijriDay, monthName] of anchors) {
    const actual = Engine.hijri(year, month, day, 0)
    assert.deepEqual([actual.year, actual.month, actual.day, actual.monthName[0]],
      [hijriYear, hijriMonth, hijriDay, monthName])
    assert.equal(actual.approximate, false)
  }
  const adjustedBack = Engine.hijri(2026, 6, 16, -1)
  const previousDate = Engine.hijri(2026, 6, 15, 0)
  const adjustedForward = Engine.hijri(2026, 6, 16, 1)
  const nextDate = Engine.hijri(2026, 6, 17, 0)
  assert.deepEqual([adjustedBack.year, adjustedBack.month, adjustedBack.day],
    [previousDate.year, previousDate.month, previousDate.day])
  assert.deepEqual([adjustedForward.year, adjustedForward.month, adjustedForward.day],
    [nextDate.year, nextDate.month, nextDate.day])
  assert.deepEqual(Engine.hijri(2026, 8, 20, 0).weekday, ["Thursday", "الخميس"])

  const first = Date.UTC(1924, 7, 1)
  const last = Date.UTC(2077, 10, 16)
  const monthLengthCounts = {}
  let previous = null
  let rangeDays = 0
  for (let epoch = first; epoch <= last; epoch += 86400000) {
    const date = utcParts(epoch)
    const current = Engine.hijri(date.year, date.month, date.day, 0)
    assert.equal(current.approximate, false)
    assert.ok(current.month >= 1 && current.month <= 12 && current.day >= 1 && current.day <= 31)
    if (previous) {
      if (current.year === previous.year && current.month === previous.month) {
        assert.equal(current.day, previous.day + 1)
      } else {
        const expectedMonth = previous.month === 12 ? 1 : previous.month + 1
        const expectedYear = previous.month === 12 ? previous.year + 1 : previous.year
        assert.deepEqual([current.year, current.month, current.day], [expectedYear, expectedMonth, 1])
        monthLengthCounts[previous.day] = (monthLengthCounts[previous.day] || 0) + 1
      }
    }
    previous = current
    rangeDays++
  }
  monthLengthCounts[previous.day] = (monthLengthCounts[previous.day] || 0) + 1
  assert.equal(rangeDays, (last - first) / 86400000 + 1)
  // Keep the source table's early historical anomalies, including the one
  // month-start correction required to match AlAdhan's UAQ conversion.
  assert.deepEqual(monthLengthCounts, { 28: 5, 29: 883, 30: 1004, 31: 4 })
  assert.deepEqual([previous.year, previous.month, previous.day], [1500, 12, 30])

  for (const date of [[1900, 1, 1], [2100, 1, 1]]) {
    const fallback = Engine.hijri(date[0], date[1], date[2], 0)
    assert.equal(fallback.approximate, true)
    assert.ok(fallback.month >= 1 && fallback.month <= 12 && fallback.day >= 1 && fallback.day <= 30)
  }

  const beforeRamadan = Engine.hijri(2026, 2, 17, 0)
  const ramadan = Engine.hijri(2026, 2, 18, 0)
  const makkah = config(4, 21.4225, 39.8262, 0, 3)
  const ordinaryTimes = Engine.dayTimes(makkah, 2026, 2, 17, beforeRamadan)
  const ramadanTimes = Engine.dayTimes(makkah, 2026, 2, 18, ramadan)
  assert.equal(ordinaryTimes.Isha - ordinaryTimes.Maghrib, 90 * 60000)
  assert.equal(ramadanTimes.Isha - ramadanTimes.Maghrib, 120 * 60000)
})

test("hand-built zone tables preserve offsets, local day windows, and date-line assignment", () => {
  const cairoSpring = Date.parse("2026-04-23T22:00:00Z") / 1000
  const cairoAutumn = Date.parse("2026-10-29T21:00:00Z") / 1000
  const cairoZone = handZone("Africa/Cairo", [
    { date: "2026-04-22", start: midnightStart("2026-04-22", 7200) },
    { date: "2026-04-23", start: midnightStart("2026-04-23", 7200) },
    { date: "2026-04-24", start: cairoSpring },
    { date: "2026-04-25", start: midnightStart("2026-04-25", 10800) },
    { date: "2026-04-26", start: midnightStart("2026-04-26", 10800) }
  ], [
    { at: midnightStart("2026-04-22", 7200), offset: 7200, abbreviation: "EET" },
    { at: cairoSpring - 1, offset: 7200, abbreviation: "EET" },
    { at: cairoSpring, offset: 10800, abbreviation: "EEST" },
    { at: cairoAutumn - 1, offset: 10800, abbreviation: "EEST" },
    { at: cairoAutumn, offset: 7200, abbreviation: "EET" }
  ])
  const cairoSchedule = Engine.buildSchedule(
    scheduleConfig(5, 30.0444, 31.2357, "Africa/Cairo"), cairoZone,
    Date.parse("2026-04-23T12:00:00Z")
  )
  assertDhuhrWindows(cairoSchedule, cairoZone)
  assert.equal(cairoSchedule.today, "2026-04-23")
  assert.equal(cairoSchedule.tomorrow, "2026-04-24")
  assert.equal(cairoSchedule.nextRefreshAt, "2026-04-24T01:00:00+03:00")
  assert.match(cairoSchedule.days.find(day => day.date === "2026-04-23").timings.Isha.at, /[+]02:00$/)
  assert.match(cairoSchedule.days.find(day => day.date === "2026-04-23").timings.Lastthird.at, /[+]03:00$/)
  assert.match(cairoSchedule.days.find(day => day.date === "2026-04-24").timings.Fajr.at, /[+]03:00$/)
  assert.equal(Engine.offsetAt(cairoZone, cairoSpring - 1), 7200)
  assert.equal(Engine.offsetAt(cairoZone, cairoSpring), 10800)
  assert.equal(Engine.offsetAt(cairoZone, cairoAutumn), 7200)

  const newYorkTransition = Date.parse("2026-03-08T07:00:00Z") / 1000
  const newYorkZone = handZone("America/New_York", [
    { date: "2026-03-07", start: midnightStart("2026-03-07", -18000) },
    { date: "2026-03-08", start: midnightStart("2026-03-08", -18000) },
    { date: "2026-03-09", start: midnightStart("2026-03-09", -14400) },
    { date: "2026-03-10", start: midnightStart("2026-03-10", -14400) },
    { date: "2026-03-11", start: midnightStart("2026-03-11", -14400) }
  ], [
    { at: midnightStart("2026-03-07", -18000), offset: -18000, abbreviation: "EST" },
    { at: newYorkTransition - 1, offset: -18000, abbreviation: "EST" },
    { at: newYorkTransition, offset: -14400, abbreviation: "EDT" }
  ])
  const newYorkSchedule = Engine.buildSchedule(
    scheduleConfig(2, 40.7128, -74.006, "America/New_York"), newYorkZone,
    Date.parse("2026-03-08T16:00:00Z")
  )
  assertDhuhrWindows(newYorkSchedule, newYorkZone)
  assert.equal(Engine.offsetAt(newYorkZone, newYorkTransition), -14400)

  const lordHoweTransition = Date.parse("2026-04-04T15:00:00Z") / 1000
  const lordHoweZone = handZone("Australia/Lord_Howe", [
    { date: "2026-04-03", start: midnightStart("2026-04-03", 39600) },
    { date: "2026-04-04", start: midnightStart("2026-04-04", 39600) },
    { date: "2026-04-05", start: midnightStart("2026-04-05", 39600) },
    { date: "2026-04-06", start: midnightStart("2026-04-06", 37800) },
    { date: "2026-04-07", start: midnightStart("2026-04-07", 37800) }
  ], [
    { at: midnightStart("2026-04-03", 39600), offset: 39600, abbreviation: "+11" },
    { at: lordHoweTransition - 1, offset: 39600, abbreviation: "+11" },
    { at: lordHoweTransition, offset: 37800, abbreviation: "+1030" }
  ])
  const lordHoweSchedule = Engine.buildSchedule(
    scheduleConfig(3, -31.55, 159.08, "Australia/Lord_Howe"), lordHoweZone,
    Date.parse("2026-04-04T12:00:00Z")
  )
  assertDhuhrWindows(lordHoweSchedule, lordHoweZone)
  assert.equal(Engine.offsetAt(lordHoweZone, lordHoweTransition), 37800)

  const chathamTransition = Date.parse("2026-04-04T14:00:00Z") / 1000
  const chathamZone = handZone("Pacific/Chatham", [
    { date: "2026-04-03", start: midnightStart("2026-04-03", 49500) },
    { date: "2026-04-04", start: midnightStart("2026-04-04", 49500) },
    { date: "2026-04-05", start: midnightStart("2026-04-05", 49500) },
    { date: "2026-04-06", start: midnightStart("2026-04-06", 45900) },
    { date: "2026-04-07", start: midnightStart("2026-04-07", 45900) }
  ], [
    { at: midnightStart("2026-04-03", 49500), offset: 49500, abbreviation: "+1345" },
    { at: chathamTransition - 1, offset: 49500, abbreviation: "+1345" },
    { at: chathamTransition, offset: 45900, abbreviation: "+1245" }
  ])
  const chathamSchedule = Engine.buildSchedule(
    scheduleConfig(3, -43.95, 176.56, "Pacific/Chatham"), chathamZone,
    Date.parse("2026-04-04T10:00:00Z")
  )
  assertDhuhrWindows(chathamSchedule, chathamZone)
  assert.equal(Engine.offsetAt(chathamZone, chathamTransition), 45900)

  const kiritimatiDays = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"]
    .map(date => ({ date, start: midnightStart(date, 50400) }))
  const kiritimatiZone = handZone("Pacific/Kiritimati", kiritimatiDays, [
    { at: kiritimatiDays[0].start, offset: 50400, abbreviation: "+14" }
  ])
  const kiritimatiConfig = scheduleConfig(3, 1.8721, -157.4278, "Pacific/Kiritimati")
  const beforeMidnight = Engine.buildSchedule(
    kiritimatiConfig, kiritimatiZone, Date.parse("2026-01-01T09:59:00Z")
  )
  const atMidnight = Engine.buildSchedule(
    kiritimatiConfig, kiritimatiZone, Date.parse("2026-01-01T10:00:00Z")
  )
  assertDhuhrWindows(beforeMidnight, kiritimatiZone)
  assert.equal(beforeMidnight.today, "2026-01-01")
  assert.equal(atMidnight.today, "2026-01-02")
  assert.equal(Engine.localDate(kiritimatiZone, Date.parse("2026-01-01T10:00:00Z")), "2026-01-02")

  const urumqiDates = ["2028-02-27", "2028-02-28", "2028-02-29", "2028-03-01", "2028-03-02"]
  const shanghaiDays = urumqiDates.map(date => ({ date, start: midnightStart(date, 28800) }))
  const urumqiDays = urumqiDates.map(date => ({ date, start: midnightStart(date, 21600) }))
  const shanghaiZone = handZone("Asia/Shanghai", shanghaiDays, [
    { at: shanghaiDays[0].start, offset: 28800, abbreviation: "CST" }
  ])
  const urumqiZone = handZone("Asia/Urumqi", urumqiDays, [
    { at: urumqiDays[0].start, offset: 21600, abbreviation: "+06" }
  ])
  const shanghaiSchedule = Engine.buildSchedule(
    scheduleConfig(3, 43.8256, 87.6168, "Asia/Shanghai"), shanghaiZone,
    Date.parse("2028-02-28T12:00:00Z")
  )
  const urumqiSchedule = Engine.buildSchedule(
    scheduleConfig(3, 43.8256, 87.6168, "Asia/Urumqi"), urumqiZone,
    Date.parse("2028-02-28T12:00:00Z")
  )
  assertDhuhrWindows(shanghaiSchedule, shanghaiZone)
  assertDhuhrWindows(urumqiSchedule, urumqiZone)
  for (const day of shanghaiSchedule.days) {
    const other = urumqiSchedule.days.find(candidate => candidate.date === day.date)
    for (const name of Object.keys(day.timings))
      assert.equal(Date.parse(day.timings[name].at), Date.parse(other.timings[name].at), `${day.date} ${name}`)
  }

  const makkahDates = ["2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19", "2026-02-20"]
  const makkahDays = makkahDates.map(date => ({ date, start: midnightStart(date, 10800) }))
  const makkahZone = handZone("Asia/Riyadh", makkahDays, [
    { at: makkahDays[0].start, offset: 10800, abbreviation: "+03" }
  ])
  const ordinarySchedule = Engine.buildSchedule(
    scheduleConfig(4, 21.4225, 39.8262, "Asia/Riyadh"), makkahZone,
    Date.parse("2026-02-17T12:00:00Z")
  )
  const adjustedSchedule = Engine.buildSchedule(
    scheduleConfig(4, 21.4225, 39.8262, "Asia/Riyadh", { hijriAdjustment: 1 }), makkahZone,
    Date.parse("2026-02-17T12:00:00Z")
  )
  const ordinaryDay = ordinarySchedule.days.find(day => day.date === "2026-02-17")
  const adjustedDay = adjustedSchedule.days.find(day => day.date === "2026-02-17")
  assert.equal(ordinaryDay.hijri.month, "Sha'ban")
  assert.equal(adjustedDay.hijri.month, "Ramadan")
  assert.equal(Date.parse(ordinaryDay.timings.Isha.at) - Date.parse(ordinaryDay.timings.Maghrib.at), 90 * 60000)
  assert.equal(Date.parse(adjustedDay.timings.Isha.at) - Date.parse(adjustedDay.timings.Maghrib.at), 120 * 60000)
})

test("Oslo's post-midnight Isha still advances nextPrayer to tomorrow's Fajr", () => {
  const dates = ["2026-06-19", "2026-06-20", "2026-06-21", "2026-06-22", "2026-06-23"]
  const days = dates.map(date => ({ date, start: midnightStart(date, 7200) }))
  const zone = handZone("Europe/Oslo", days, [
    { at: days[0].start, offset: 7200, abbreviation: "CEST" }
  ])
  const schedule = Engine.buildSchedule(
    scheduleConfig(3, 59.9139, 10.7522, "Europe/Oslo"), zone,
    Date.parse("2026-06-20T12:00:00Z")
  )
  assertDhuhrWindows(schedule, zone)
  const today = schedule.days.find(day => day.date === schedule.today)
  assert.match(today.timings.Isha.time, /^00:/)
  const next = Model.nextPrayer(schedule, Date.parse(today.timings.Isha.at) + 1)
  assert.equal(next.name, "Fajr")
  assert.equal(next.date, schedule.tomorrow)
})

test("real prayer-zone output builds Cairo and Kiritimati schedules offline", () => {
  const state = fs.mkdtempSync(path.join(os.tmpdir(), "omaprayers-engine-zone-"))
  const script = path.join(__dirname, "..", "prayer-zone.sh")
  const now = 1777000000
  const environment = { ...process.env, XDG_STATE_HOME: state }
  try {
    const cases = [
      ["Africa/Cairo", 30.0444, 31.2357, "+03:00"],
      ["Pacific/Kiritimati", 1.8721, -157.4278, "+14:00"]
    ]
    for (const [timezone, latitude, longitude, currentOffset] of cases) {
      const raw = execFileSync(script,
        ["--timezone", timezone, "--days", "5", "--now", String(now)],
        { encoding: "utf8", env: environment })
      const zone = JSON.parse(raw)
      if (timezone === "Africa/Cairo")
        assert.deepEqual([...new Set(zone.offsets.map(value => value.offset))].sort((left, right) => left - right),
          [7200, 10800])
      else
        assert.deepEqual(zone.offsets.map(value => value.offset), [50400])
      const schedule = Engine.buildSchedule(
        scheduleConfig(5, latitude, longitude, timezone), zone, now * 1000
      )
      assertDhuhrWindows(schedule, zone)
      assert.equal(schedule.today, zone.today)
      assert.equal(schedule.tomorrow, zone.tomorrow)
      assert.equal(schedule.days.length, zone.days.length - 1)
      for (const day of schedule.days) assertPrayerOrdering(day)
      const today = schedule.days.find(day => day.date === schedule.today)
      assert.match(today.timings.Dhuhr.at, new RegExp(`${currentOffset.replace("+", "[+]")}$`))
    }
  } finally {
    fs.rmSync(state, { recursive: true, force: true })
  }
})

test("UTC-only formatting and astronomy helpers are deterministic", () => {
  assert.equal(Engine.dayOfYear(2028, 2, 29), 60)
  assert.equal(Engine.dayOfYear(new Date("2028-02-29T23:00:00Z")), 60)
  assert.equal(Engine.julianDay(2000, 1, 1, 12), 2451545)
  assert.equal(Engine.clock(Date.UTC(2026, 3, 23, 22, 30), 10800), "01:30")
  assert.equal(Engine.isoWithOffset(Date.UTC(2026, 3, 23, 22, 30), 10800), "2026-04-24T01:30:00+03:00")
  assert.equal(Engine.isoWithOffset(Date.UTC(2026, 0, 1, 1, 2, 3), -12600), "2025-12-31T21:32:03-03:30")
  assert.equal(Engine.prayerTimes(2026, 2, 30, 0, 0, Engine.methodParameters({ method: 3 }), {}), null)
})

console.log(`Engine fuzz seed: ${fuzzSeed} (0x${fuzzSeed.toString(16)})`)
console.log(`Engine fuzz max |Δ| seconds: ${Object.entries(fuzzMax).map(([name, delta]) => `${name}=${delta.toFixed(0)}`).join(", ")}`)
console.log(`Engine solar max |Δ| seconds: sunrise=${solarMax.sunrise.toFixed(1)}, noon=${solarMax.noon.toFixed(1)}, sunset=${solarMax.sunset.toFixed(1)}`)
console.log(`Engine coverage: ${fixtureRowsPassed} fixture rows; ${fuzzCasesPassed} regular fuzz; ${polarFuzzCasesPassed} polar fuzz (${polarCasesPassed} nearest-latitude resolutions)`)
console.log(`Engine tests passed (${count} scenarios)`)
