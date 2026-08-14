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

function parseEnvelope(raw) {
  try {
    var value = JSON.parse(String(raw || "{}"))
    return value && typeof value === "object" ? value : null
  } catch (e) {
    return null
  }
}

function text(value) {
  return value === undefined || value === null ? "" : String(value)
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

function remaining(event, now) {
  var minutes = minutesUntil(event, now)
  if (!isFinite(minutes)) return ""
  if (minutes <= 0) return "now"
  var hours = Math.floor(minutes / 60)
  var rest = minutes % 60
  if (hours <= 0) return rest + "m"
  return hours + "h " + rest + "m"
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

function barText(next, now, language, mode, timeFormat) {
  var icon = "\ueed3"
  if (!next) return icon
  var prayer = label(next.name, language)
  if (mode === "Icon only") return icon
  if (mode === "Countdown only") return remaining(next, now)
  if (mode === "Name + time") return prayer + " " + formatClock(next.time, timeFormat)
  return prayer + " " + remaining(next, now)
}

function tooltip(schedule, next, now, language, timeFormat) {
  if (!next) return "Prayer times unavailable"
  var location = schedule && schedule.config ? text(schedule.config.locationLabel) : ""
  var prefix = location ? location + " \u00b7 " : ""
  var stale = schedule && schedule.status === "stale" ? " \u00b7 stale cache" : ""
  return prefix + label(next.name, language) + " in " + remaining(next, now)
    + " (" + formatClock(next.time, timeFormat) + ")" + stale
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

function nightRows(day) {
  var result = []
  for (var i = 0; i < NIGHT_ORDER.length; i++) {
    var value = timing(day, NIGHT_ORDER[i])
    if (value) result.push({ name: NIGHT_ORDER[i], value: value })
  }
  return result
}

function hijriLabel(day) {
  if (!day || !day.hijri) return ""
  if (day.hijri.display) return text(day.hijri.display)
  return [day.hijri.day, day.hijri.month, day.hijri.year].filter(function(value) {
    return text(value) !== ""
  }).join(" ")
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
          time: events[i].time
        })
      }
    }
    if (previous < prayerAt && prayerAt <= current && current - prayerAt <= graceMs) {
      result.push({
        key: events[i].iso + "|at",
        name: events[i].name,
        kind: "at",
        minutes: 0,
        time: events[i].time
      })
    }
  }
  return result
}

function notificationText(event, language, timeFormat) {
  var prayer = label(event.name, language)
  if (event.kind === "before") {
    return {
      title: prayer + " in " + event.minutes + " minutes",
      body: "Scheduled for " + formatClock(event.time, timeFormat)
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
    parseEnvelope: parseEnvelope,
    sameConfig: sameConfig,
    label: label,
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
    barText: barText,
    tooltip: tooltip,
    dayRows: dayRows,
    nightRows: nightRows,
    hijriLabel: hijriLabel,
    notificationEvents: notificationEvents,
    notificationText: notificationText,
    filePath: filePath,
    bool: bool,
    number: number
  }
}
