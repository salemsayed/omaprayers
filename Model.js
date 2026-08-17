var PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]
var DAY_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"]
var NIGHT_ORDER = ["Imsak", "Midnight", "Firstthird", "Lastthird"]

var ARABIC_NAMES = {
  Fajr: "\u0627\u0644\u0641\u062c\u0631",
  Sunrise: "\u0627\u0644\u0634\u0631\u0648\u0642",
  Dhuhr: "\u0627\u0644\u0638\u0647\u0631",
  Asr: "\u0627\u0644\u0639\u0635\u0631",
  Maghrib: "\u0627\u0644\u0645\u063a\u0631\u0628",
  Isha: "\u0627\u0644\u0639\u0634\u0627\u0621",
  Imsak: "\u0627\u0644\u0625\u0645\u0633\u0627\u0643",
  Midnight: "\u0645\u0646\u062a\u0635\u0641 \u0627\u0644\u0644\u064a\u0644",
  Firstthird: "\u0627\u0644\u062b\u0644\u062b \u0627\u0644\u0623\u0648\u0644",
  Lastthird: "\u0627\u0644\u062b\u0644\u062b \u0627\u0644\u0623\u062e\u064a\u0631"
}

var ENGLISH_NAMES = {
  Fajr: "Fajr",
  Sunrise: "Sunrise",
  Dhuhr: "Dhuhr",
  Asr: "Asr",
  Maghrib: "Maghrib",
  Isha: "Isha",
  Imsak: "Imsak",
  Midnight: "Midnight",
  Firstthird: "First third",
  Lastthird: "Last third"
}

// Option rings for the settings the panel lets the user change in place. Each
// one mirrors the enum in manifest.json, and the order is the click order of
// the panel's cycle buttons.
var PANEL_STYLES = ["Horizon", "Compact"]
var TIME_FORMATS = ["24-hour", "12-hour"]
var LANGUAGES = ["English", "Arabic"]
var BAR_DISPLAYS = [
  "Strip + countdown", "Icon only", "Name + countdown", "Name + time",
  "Countdown only"
]

// English then Arabic for every string the display section paints. The panel
// is bilingual everywhere else, so its own controls follow `language` too
// rather than staying English inside an otherwise Arabic panel.
var UI_LABELS = {
  display: ["Display", "العرض"],
  layout: ["Layout", "التصميم"],
  clock: ["Clock", "الساعة"],
  names: ["Names", "الأسماء"],
  barLabel: ["Bar label", "شريط النظام"],
  sunrise: ["Sunrise row", "صف الشروق"],
  nightMarkers: ["Night markers", "علامات الليل"],
  notifications: ["Notifications", "التنبيهات"],
  accentLead: ["Accent lead", "التلوين المسبق"],
  minutes: ["min", "دقيقة"],
  off: ["Off", "معطل"],
  settingsTip: ["Display settings", "إعدادات العرض"],
  nextTip: ["Switch to", "تحويل إلى"]
}

// Short forms of the enum values. The bar-display names are abbreviated
// because they ride a 150px control rather than the manifest's settings form.
var OPTION_LABELS = {
  Horizon: ["Horizon", "أفق"],
  Compact: ["Compact", "مضغوط"],
  "24-hour": ["24h", "24h"],
  "12-hour": ["12h", "12h"],
  English: ["English", "إنجليزي"],
  Arabic: ["Arabic", "عربي"],
  "Strip + countdown": ["Strip", "شريط"],
  "Icon only": ["Icon", "أيقونة"],
  "Name + countdown": ["Name + left", "الاسم والمتبقي"],
  "Name + time": ["Name + time", "الاسم والوقت"],
  "Countdown only": ["Countdown", "المتبقي"]
}

function parseEnvelope(raw) {
  try {
    var value = JSON.parse(String(raw || "{}"))
    return value && typeof value === "object" && !(value instanceof Array) ? value : null
  } catch (e) {
    return null
  }
}

function text(value) {
  return value === undefined || value === null ? "" : String(value)
}

function latinDigits(value) {
  return text(value).replace(/[\u0660-\u0669\u06f0-\u06f9]/g, function(digit) {
    var code = digit.charCodeAt(0)
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660)
  })
}

function number(value, fallback) {
  var parsed = Number(value)
  return isFinite(parsed) ? parsed : fallback
}

function bool(value) {
  return value === true || value === 1 || text(value).toLowerCase() === "true"
}

function sameNumber(left, right) {
  return Math.abs(number(left, NaN) - number(right, NaN)) < 0.000001
}

function sameConfig(actual, expected) {
  if (!actual || !expected) return false
  return text(actual.locationLabel) === text(expected.locationLabel)
    && sameNumber(actual.latitude, expected.latitude)
    && sameNumber(actual.longitude, expected.longitude)
    && text(actual.timezone) === text(expected.timezone)
    && number(actual.method, -1) === number(expected.method, -2)
    && number(actual.school, -1) === number(expected.school, -2)
    && number(actual.latitudeAdjustmentMethod, -1) === number(expected.latitudeAdjustmentMethod, -2)
    && number(actual.midnightMode, -1) === number(expected.midnightMode, -2)
    && number(actual.hijriAdjustment, 0) === number(expected.hijriAdjustment, 0)
    && text(actual.tune) === text(expected.tune)
    && text(actual.shafaq) === text(expected.shafaq)
    && text(actual.methodSettings) === text(expected.methodSettings)
}

function label(name, language) {
  var names = text(language) === "Arabic" ? ARABIC_NAMES : ENGLISH_NAMES
  return names[name] || text(name)
}

function localized(table, key, language) {
  var pair = table[text(key)]
  if (!pair) return ""
  return text(language) === "Arabic" ? pair[1] : pair[0]
}

function uiLabel(key, language) {
  return localized(UI_LABELS, key, language)
}

// Falls back to the raw value so a hand-edited shell.json still names itself
// in the panel instead of rendering an empty control.
function optionLabel(value, language) {
  return localized(OPTION_LABELS, value, language) || text(value)
}

// Builds the { value, label } list a Dropdown or ButtonGroup wants, with the
// values kept as the canonical strings that go back into shell.json.
function optionModel(ring, language) {
  var out = []
  for (var i = 0; i < ring.length; i++)
    out.push({ value: ring[i], label: optionLabel(ring[i], language) })
  return out
}

// A value outside the ring lands on the first option rather than nowhere, so a
// typo in shell.json cannot strand a cycle button on a value it does not know.
function nextInRing(ring, current) {
  if (!(ring instanceof Array) || ring.length === 0) return ""
  var index = ring.indexOf(text(current))
  return index < 0 ? ring[0] : ring[(index + 1) % ring.length]
}

function dayForDate(schedule, dateKey) {
  var days = schedule && schedule.days instanceof Array ? schedule.days : []
  for (var i = 0; i < days.length; i++) {
    if (text(days[i].date) === text(dateKey)) return days[i]
  }
  return null
}

function today(schedule) {
  return dayForDate(schedule, schedule ? schedule.today : "")
}

function timing(day, name) {
  return day && day.timings && day.timings[name] ? day.timings[name] : null
}

function instant(value) {
  if (!value || !value.at) return null
  var parsed = new Date(value.at)
  return isNaN(parsed.getTime()) ? null : parsed
}

function scheduleEvents(schedule, names) {
  var days = schedule && schedule.days instanceof Array ? schedule.days : []
  var wanted = names || PRAYERS
  var result = []
  for (var d = 0; d < days.length; d++) {
    for (var p = 0; p < wanted.length; p++) {
      var value = timing(days[d], wanted[p])
      var at = instant(value)
      if (!at) continue
      result.push({
        name: wanted[p],
        date: days[d].date,
        at: at,
        iso: value.at,
        time: value.time || "",
        day: days[d]
      })
    }
  }
  result.sort(function(a, b) { return a.at.getTime() - b.at.getTime() })
  return result
}

function nextPrayer(schedule, now) {
  var epoch = now instanceof Date ? now.getTime() : Number(now)
  if (!isFinite(epoch)) epoch = Date.now()
  var events = scheduleEvents(schedule, PRAYERS)
  for (var i = 0; i < events.length; i++) {
    if (events[i].at.getTime() > epoch) return events[i]
  }
  return null
}

function currentPrayer(schedule, now) {
  var epoch = now instanceof Date ? now.getTime() : Number(now)
  if (!isFinite(epoch)) epoch = Date.now()
  var events = scheduleEvents(schedule, PRAYERS)
  var current = null
  for (var i = 0; i < events.length; i++) {
    if (events[i].at.getTime() > epoch) break
    current = events[i]
  }
  return current
}

function minutesUntil(event, now) {
  if (!event || !event.at) return Infinity
  var epoch = now instanceof Date ? now.getTime() : Number(now)
  if (!isFinite(epoch)) epoch = Date.now()
  return Math.ceil((event.at.getTime() - epoch) / 60000)
}

function remaining(event, now, language) {
  var minutes = minutesUntil(event, now)
  if (!isFinite(minutes)) return ""
  if (minutes <= 0) return text(language) === "Arabic" ? "\u0627\u0644\u0622\u0646" : "now"
  return formatDuration(minutes, language)
}

function formatClock(clock, format) {
  var match = /^(\d{1,2}):(\d{2})/.exec(text(clock))
  if (!match) return text(clock)
  var hour = parseInt(match[1], 10)
  var minute = match[2]
  if (text(format) !== "12-hour") return (hour < 10 ? "0" : "") + hour + ":" + minute
  var suffix = hour >= 12 ? "PM" : "AM"
  var displayHour = hour % 12
  if (displayHour === 0) displayHour = 12
  return displayHour + ":" + minute + " " + suffix
}

function minutesOfDay(value) {
  var match = /^(\d{1,2}):(\d{2})/.exec(text(value && value.time))
  if (!match) return NaN
  var hour = parseInt(match[1], 10)
  var minute = parseInt(match[2], 10)
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return NaN
  return hour * 60 + minute
}

function formatDuration(minutes, language) {
  var value = Number(minutes)
  if (!isFinite(value) || value < 0) return ""
  value = Math.round(value)
  var hours = Math.floor(value / 60)
  var rest = value % 60
  var hourUnit = text(language) === "Arabic" ? " س" : "h"
  var minuteUnit = text(language) === "Arabic" ? " د" : "m"
  if (hours <= 0) return rest + minuteUnit
  if (rest === 0) return hours + hourUnit
  return hours + hourUnit + " " + rest + minuteUnit
}

function methodShortName(methodId, fallbackName) {
  var names = {
    0: "JAFARI", 1: "UISK", 2: "ISNA", 3: "MWL", 4: "UMQ", 5: "EGAS",
    7: "TEHRAN", 8: "GULF", 9: "KUWAIT", 10: "QATAR", 11: "MUIS",
    12: "UOIF", 13: "DIYANET", 14: "SAMR", 15: "MOONSIGHT", 16: "DUBAI",
    17: "JAKIM", 18: "TUNISIA", 19: "ALGERIA", 20: "KEMENAG",
    21: "MOROCCO", 22: "LISBOA", 23: "JORDAN", 99: "CUSTOM"
  }
  if (names[methodId] !== undefined) return names[methodId]
  var words = text(fallbackName).match(/[A-Za-z0-9]+/g) || []
  var acronym = ""
  for (var i = 0; i < words.length && acronym.length < 5; i++) {
    if (words[i].length >= 3) acronym += words[i].charAt(0).toUpperCase()
  }
  return acronym || "METHOD " + methodId
}

function tomorrowPrayerLabel(prayer, language, timeFormat) {
  if (!prayer) return ""
  if (text(language) === "Arabic")
    return "\u2067\u063a\u062f\u064b\u0627  " + label(prayer.name, language) + "  \u00b7  "
      + formatClock(prayer.time, timeFormat) + "\u2069"
  return "Tomorrow \u2068" + label(prayer.name, language) + "\u2069  \u00b7  "
    + formatClock(prayer.time, timeFormat)
}

function barText(next, now, language, mode, timeFormat) {
  var icon = "\ueed3"
  if (!next) return icon
  var prayer = label(next.name, language)
  if (mode === "Icon only") return icon
  if (mode === "Countdown only") return remaining(next, now, language)
  var value = mode === "Name + time"
    ? formatClock(next.time, timeFormat)
    : remaining(next, now, language)
  if (text(language) === "Arabic") return "\u2067" + prayer + " " + value + "\u2069"
  return prayer + " " + value
}

function tooltip(schedule, next, now, language, timeFormat, locationOverride) {
  var arabic = text(language) === "Arabic"
  if (!next) return arabic ? "مواقيت الصلاة غير متاحة" : "Prayer times unavailable"
  var location = text(locationOverride)
  if (!location && schedule && schedule.config) location = text(schedule.config.locationLabel)
  var prefix = location ? location + " \u00b7 " : ""
  var stale = schedule && schedule.status === "stale"
    ? " \u00b7 " + (arabic ? statusLabel("stale", language) : "stale cache")
    : ""
  var prayerDay = dayForDate(schedule, next.date) || next.day
  var methodName = prayerDay ? text(prayerDay.methodName) : ""
  var method = methodName ? " \u00b7 " + methodName : ""
  return prefix + label(next.name, language) + (arabic ? " بعد " : " in ")
    + remaining(next, now, language)
    + " (" + formatClock(next.time, timeFormat) + ")" + stale + method
}

function dayRows(day, showSunrise) {
  var result = []
  for (var i = 0; i < DAY_ORDER.length; i++) {
    if (DAY_ORDER[i] === "Sunrise" && !showSunrise) continue
    var value = timing(day, DAY_ORDER[i])
    if (value) result.push({ name: DAY_ORDER[i], value: value })
  }
  return result
}

function daySegments(day, showSunrise) {
  if (!day) return []
  var boundaries = []
  for (var i = 0; i < DAY_ORDER.length; i++) {
    if (DAY_ORDER[i] === "Sunrise" && !showSunrise) continue
    var value = timing(day, DAY_ORDER[i])
    var minutes = minutesOfDay(value)
    if (!value || !isFinite(minutes)) return []
    while (boundaries.length && minutes <= boundaries[boundaries.length - 1].minutes)
      minutes += 1440
    if (boundaries.length && minutes >= boundaries[0].minutes + 1440) return []
    boundaries.push({ name: DAY_ORDER[i], value: value, minutes: minutes })
  }
  var result = []
  for (var b = 0; b < boundaries.length; b++) {
    var start = boundaries[b].minutes
    var end = b + 1 < boundaries.length
      ? boundaries[b + 1].minutes
      : boundaries[0].minutes + 1440
    result.push({
      name: boundaries[b].name,
      value: boundaries[b].value,
      start: start,
      end: end,
      length: end - start
    })
  }
  return result
}

function nightRows(day) {
  var result = []
  for (var i = 0; i < NIGHT_ORDER.length; i++) {
    var value = timing(day, NIGHT_ORDER[i])
    if (value) result.push({ name: NIGHT_ORDER[i], value: value })
  }
  return result
}

function nightMarkers(day) {
  if (!day) return null
  var start = minutesOfDay(timing(day, "Maghrib"))
  var fajr = minutesOfDay(timing(day, "Fajr"))
  if (!isFinite(start) || !isFinite(fajr)) return null
  var end = fajr + 1440
  var span = end - start
  if (span <= 0) return null
  var names = NIGHT_ORDER.slice(1)
  names.push("Isha")
  var marks = []
  for (var i = 0; i < names.length; i++) {
    var minutes = minutesOfDay(timing(day, names[i]))
    if (!isFinite(minutes)) continue
    if (minutes < start) minutes += 1440
    var fraction = Math.max(0, Math.min(1, (minutes - start) / span))
    marks.push({ name: names[i], minutes: minutes, fraction: fraction })
  }
  marks.sort(function(left, right) { return left.fraction - right.fraction })
  return { start: start, end: end, span: span, marks: marks }
}

function fractionOfDay(day, now) {
  var fajr = instant(timing(day, "Fajr"))
  if (!fajr) return 0
  var epoch = now instanceof Date ? now.getTime() : Number(now)
  if (!isFinite(epoch)) return 0
  var fraction = (epoch - fajr.getTime()) / 86400000
  if (fraction < 0) fraction += 1
  return Math.max(0, Math.min(1, fraction))
}

function windowLabel(segment, language) {
  return formatDuration(segment ? segment.length : NaN, language)
}

function hijriLabel(day, language) {
  if (!day || !day.hijri) return ""
  if (text(language) === "Arabic" && day.hijri.displayAr)
    return text(day.hijri.displayAr)
  if (day.hijri.display) return text(day.hijri.display)
  return [day.hijri.day, day.hijri.month, day.hijri.year].filter(function(value) {
    return text(value) !== ""
  }).join(" ")
}

function statusLabel(status, language) {
  if (text(language) === "Arabic") {
    if (status === "fresh") return "بيانات محدثة"
    if (status === "cached") return "بيانات محفوظة"
    if (status === "stale") return "نسخة محفوظة دون اتصال"
    return "غير محمل"
  }
  if (status === "fresh") return "online data"
  if (status === "cached") return "saved data"
  if (status === "stale") return "offline cache"
  return "not loaded"
}

function notificationEvents(schedule, previousEpoch, currentEpoch, beforeMinutes, graceMinutes) {
  var previous = Number(previousEpoch)
  var current = Number(currentEpoch)
  if (!isFinite(previous) || !isFinite(current) || current <= previous) return []
  var before = Math.max(0, Math.floor(number(beforeMinutes, 0)))
  var graceMs = Math.max(1, Math.floor(number(graceMinutes, 10))) * 60000
  var events = scheduleEvents(schedule, PRAYERS)
  var result = []

  for (var i = 0; i < events.length; i++) {
    var prayerAt = events[i].at.getTime()
    if (before > 0) {
      var reminderAt = prayerAt - before * 60000
      if (previous < reminderAt && reminderAt <= current
          && current - reminderAt <= graceMs && current < prayerAt) {
        result.push({
          key: events[i].iso + "|before-" + before,
          name: events[i].name,
          kind: "before",
          minutes: before,
          time: events[i].time,
          triggerEpoch: reminderAt
        })
      }
    }
    if (previous < prayerAt && prayerAt <= current && current - prayerAt <= graceMs) {
      result.push({
        key: events[i].iso + "|at",
        name: events[i].name,
        kind: "at",
        minutes: 0,
        time: events[i].time,
        triggerEpoch: prayerAt
      })
    }
  }
  return result
}

function notificationText(event, language, timeFormat) {
  var prayer = label(event.name, language)
  var arabic = text(language) === "Arabic"
  if (event.kind === "before") {
    if (arabic) {
      return {
        title: prayer + " بعد " + formatDuration(event.minutes, language),
        body: "الموعد " + formatClock(event.time, timeFormat)
      }
    }
    return {
      title: prayer + " in " + event.minutes + " minutes",
      body: "Scheduled for " + formatClock(event.time, timeFormat)
    }
  }
  if (arabic) {
    return {
      title: "حان وقت " + prayer,
      body: formatClock(event.time, timeFormat)
    }
  }
  return {
    title: "It is time for " + prayer,
    body: formatClock(event.time, timeFormat)
  }
}

function filePath(url) {
  var value = decodeURIComponent(text(url))
  return value.replace(/^file:\/\//, "")
}

if (typeof module !== "undefined") {
  module.exports = {
    PRAYERS: PRAYERS,
    DAY_ORDER: DAY_ORDER,
    NIGHT_ORDER: NIGHT_ORDER,
    PANEL_STYLES: PANEL_STYLES,
    TIME_FORMATS: TIME_FORMATS,
    LANGUAGES: LANGUAGES,
    BAR_DISPLAYS: BAR_DISPLAYS,
    parseEnvelope: parseEnvelope,
    latinDigits: latinDigits,
    sameConfig: sameConfig,
    label: label,
    uiLabel: uiLabel,
    optionLabel: optionLabel,
    optionModel: optionModel,
    nextInRing: nextInRing,
    dayForDate: dayForDate,
    today: today,
    timing: timing,
    instant: instant,
    scheduleEvents: scheduleEvents,
    nextPrayer: nextPrayer,
    currentPrayer: currentPrayer,
    minutesUntil: minutesUntil,
    remaining: remaining,
    formatClock: formatClock,
    minutesOfDay: minutesOfDay,
    formatDuration: formatDuration,
    methodShortName: methodShortName,
    tomorrowPrayerLabel: tomorrowPrayerLabel,
    barText: barText,
    tooltip: tooltip,
    dayRows: dayRows,
    daySegments: daySegments,
    nightRows: nightRows,
    nightMarkers: nightMarkers,
    fractionOfDay: fractionOfDay,
    windowLabel: windowLabel,
    hijriLabel: hijriLabel,
    statusLabel: statusLabel,
    notificationEvents: notificationEvents,
    notificationText: notificationText,
    filePath: filePath,
    bool: bool,
    number: number
  }
}
