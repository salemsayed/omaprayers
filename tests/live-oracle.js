#!/usr/bin/env node

"use strict"

const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

if (process.env.OMAPRAYERS_LIVE !== "1") {
  console.log("Live AlAdhan oracle skipped; set OMAPRAYERS_LIVE=1 to enable it")
  process.exit(0)
}

const fixtureRoot = path.join(__dirname, "fixtures", "aladhan")
const baseUrl = "https://api.aladhan.com"
const userAgent = "OmaPrayers-tests (+https://github.com/salemsayed/omaprayers)"
let lastRequestAt = 0
let requests = 0
const drift = []
const blockingDrift = []

function reportDrift(message, blocking) {
  drift.push(message)
  if (blocking) blockingDrift.push(message)
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function fetchRequest(request) {
  const elapsed = Date.now() - lastRequestAt
  if (elapsed < 250) await wait(250 - elapsed)
  const url = new URL(request.endpoint, baseUrl)
  for (const [name, value] of Object.entries(request.query)) url.searchParams.set(name, value)
  let finalError
  for (let attempt = 0; attempt < 3; attempt++) {
    lastRequestAt = Date.now()
    requests++
    try {
      const response = await fetch(url, { headers: { "User-Agent": userAgent } })
      const body = await response.text()
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 500)}`)
      const json = JSON.parse(body)
      if (json.code !== 200) throw new Error(`provider code ${json.code}: ${body.slice(0, 500)}`)
      return json
    } catch (error) {
      finalError = error
      if (attempt < 2) await wait(250)
    }
  }
  throw new Error(`${request.endpoint}: ${finalError.message}`)
}

function compactCalendar(response) {
  return response.data.map(row => ({
    date: {
      gregorian: { date: row.date.gregorian.date },
      hijri: { date: row.date.hijri.date }
    },
    timings: row.timings,
    meta: {
      offset: row.meta.offset,
      latitudeAdjustmentMethod: row.meta.latitudeAdjustmentMethod,
      timezone: row.meta.timezone
    }
  }))
}

function compactHijri(response) {
  return {
    gregorian: response.data.gregorian.date,
    hijri: {
      date: response.data.hijri.date,
      day: response.data.hijri.day,
      month: response.data.hijri.month.number,
      year: response.data.hijri.year
    }
  }
}

function compareCalendar(filename, stored, live) {
  if (stored.length !== live.length) {
    reportDrift(`${filename}: row count ${stored.length} -> ${live.length}`, true)
    return
  }
  for (let index = 0; index < stored.length; index++) {
    const before = stored[index]
    const after = live[index]
    const date = before.date.gregorian.date
    if (JSON.stringify(before.date) !== JSON.stringify(after.date))
      reportDrift(`${filename} row ${index}: date metadata changed`, true)
    if (JSON.stringify(before.meta) !== JSON.stringify(after.meta))
      reportDrift(`${filename} ${date}: meta changed`, true)
    const names = new Set([...Object.keys(before.timings), ...Object.keys(after.timings)])
    for (const name of names) {
      if (!(name in before.timings) || !(name in after.timings)) {
        reportDrift(`${filename} ${date} ${name}: timing structure changed`, true)
        continue
      }
      const beforeEpoch = Date.parse(before.timings[name])
      const afterEpoch = Date.parse(after.timings[name])
      if (!Number.isFinite(beforeEpoch) || !Number.isFinite(afterEpoch)) {
        if (before.timings[name] !== after.timings[name])
          reportDrift(`${filename} ${date} ${name}: ${before.timings[name]} -> ${after.timings[name]}`, true)
      } else if (beforeEpoch !== afterEpoch) {
        const minutes = (afterEpoch - beforeEpoch) / 60000
        reportDrift(`${filename} ${date} ${name}: Δ=${minutes}m`, Math.abs(minutes) > 1)
      } else if (before.timings[name] !== after.timings[name]) {
        reportDrift(`${filename} ${date} ${name}: ISO representation changed`, true)
      }
    }
  }
}

async function main() {
  const methods = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "methods.json"), "utf8"))
  const liveMethods = await fetchRequest(methods.request)
  if (JSON.stringify(methods.data) !== JSON.stringify(liveMethods.data))
    reportDrift("methods.json: method catalog changed", true)

  const calendarRoot = path.join(fixtureRoot, "calendar")
  const calendarFiles = fs.readdirSync(calendarRoot).filter(name => name.endsWith(".json")).sort()
  assert.equal(calendarFiles.length, 60, "calendar snapshot matrix size")
  for (const filename of calendarFiles) {
    const stored = JSON.parse(fs.readFileSync(path.join(calendarRoot, filename), "utf8"))
    const response = await fetchRequest(stored.request)
    compareCalendar(filename, stored.data, compactCalendar(response))
    console.log(`checked calendar/${filename}`)
  }

  const hijri = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "hijri", "gToH.json"), "utf8"))
  assert.equal(hijri.data.length, 36, "UAQ sample matrix size")
  for (const stored of hijri.data) {
    const response = await fetchRequest(stored.request)
    const live = compactHijri(response)
    if (JSON.stringify({ gregorian: stored.gregorian, hijri: stored.hijri }) !== JSON.stringify(live))
      reportDrift(`gToH ${stored.gregorian}: ${stored.hijri.date} -> ${live.hijri.date}`, true)
  }

  if (drift.length) {
    console.log(drift.slice(0, 200).join("\n"))
    if (drift.length > 200) console.log(`... ${drift.length - 200} more changes`)
  }
  if (blockingDrift.length) {
    throw new Error(`${blockingDrift.length} live AlAdhan changes exceeded one minute or changed structure`)
  }
  console.log(`Live AlAdhan oracle passed (${requests} requests; ${drift.length} reported changes within tolerance)`)
}

main().catch(error => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
