const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const test = require("node:test")

const source = readFileSync(path.join(__dirname, "..", "BarWidget.qml"), "utf8")
const modelSource = readFileSync(path.join(__dirname, "..", "Model.js"), "utf8")
const panelSource = readFileSync(path.join(__dirname, "..", "Panel.qml"), "utf8")
const locationSource = readFileSync(path.join(__dirname, "..", "PanelLocation.qml"), "utf8")
const manifest = JSON.parse(readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8"))
const changelog = readFileSync(path.join(__dirname, "..", "CHANGELOG.md"), "utf8")

test("IPC registration waits for a relocated bar slot to retire", () => {
  assert.match(source, /property bool ipcRegistrationReady: false/)
  assert.match(source, /id: ipcRegistrationTimer\s+interval: 100/)
  assert.match(source, /IpcHandler \{\s+enabled: root\.ipcRegistrationReady\s+target: root\.moduleName/)
})

test("location requests disclose their external recipients before use", () => {
  assert.match(modelSource, /detectPrivacy: \["Detect asks wttr\.in for an approximate city using your IP\./)
  assert.match(modelSource, /citySearchPrivacy: \["City search sends your text to Open-Meteo\./)
  assert.match(locationSource, /Model\.uiLabel\("detectPrivacy", locationRoot\.host\.language\)/)
  assert.match(locationSource, /Model\.uiLabel\("citySearchPrivacy", locationRoot\.host\.language\)/)
  assert.match(panelSource, /https:\/\/geocoding-api\.open-meteo\.com\/v1\/search/)
  assert.match(panelSource, /https:\/\/wttr\.in\/\?format=%l/)
})

test("release metadata stays synchronized", () => {
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/)
  assert.match(changelog, new RegExp(`^## ${manifest.version.replaceAll(".", "\\.")} - \\d{4}-\\d{2}-\\d{2}$`, "m"))
})
