const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const test = require("node:test")

const source = readFileSync(path.join(__dirname, "..", "BarWidget.qml"), "utf8")
const modelSource = readFileSync(path.join(__dirname, "..", "Model.js"), "utf8")
const panelSource = readFileSync(path.join(__dirname, "..", "Panel.qml"), "utf8")
const locationSource = readFileSync(path.join(__dirname, "..", "PanelLocation.qml"), "utf8")
const displaySource = readFileSync(path.join(__dirname, "..", "PanelDisplay.qml"), "utf8")
const presentationSource = [
  "BarWidget.qml", "PanelCompact.qml", "PanelDisplay.qml", "PanelHorizon.qml", "PanelLocation.qml"
].map(name => readFileSync(path.join(__dirname, "..", name), "utf8")).join("\n")
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

test("every text surface renders network-derived values as literal plain text", () => {
  const textItems = presentationSource.match(/\bText\s*\{/g) || []
  const plainTextItems = presentationSource.match(
    /\bText\s*\{\s*textFormat:\s*Text\.PlainText\b/g
  ) || []
  const sectionHeaders = presentationSource.match(/\bPanelSectionHeader\s*\{/g) || []
  const plainSectionHeaders = presentationSource.match(
    /\bPanelSectionHeader\s*\{\s*textFormat:\s*Text\.PlainText\b/g
  ) || []
  assert.equal(textItems.length, 46)
  assert.equal(plainTextItems.length, textItems.length)
  assert.equal(sectionHeaders.length, 3)
  assert.equal(plainSectionHeaders.length, sectionHeaders.length)
  assert.match(modelSource, /return result\.replace\(\/<\/g, "‹"\)\.replace\(\/>\/g, "›"\)/)
  assert.match(displaySource, /value: Model\.valueInRing\(Model\.BAR_DISPLAYS, displayRoot\.host\.barDisplay\)/)
})

test("release metadata stays synchronized", () => {
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/)
  assert.match(changelog, new RegExp(`^## ${manifest.version.replaceAll(".", "\\.")} - \\d{4}-\\d{2}-\\d{2}$`, "m"))
})
