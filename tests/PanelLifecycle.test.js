const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const test = require("node:test")
const vm = require("node:vm")

const panel = readFileSync(path.join(__dirname, "..", "Panel.qml"), "utf8")
// Run the actual panel handlers. Strict mode gives a getter-only JS property
// the same assignment failure as a QML readonly property.
const handlers = ["setCenterHoverRevealSuppressed", "close"].map(name => {
  const match = panel.match(new RegExp(`  function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}`))
  assert.ok(match, `Panel.qml defines ${name}`)
  return match[0]
}).join("\n")

function exercise(bar, suppressed) {
  let hidden = false
  const root = { bar, controller: { hide() { hidden = true } } }
  const api = vm.runInNewContext(
    '"use strict";\n' + handlers + "\n({ setCenterHoverRevealSuppressed, close })",
    { root }
  )
  api.setCenterHoverRevealSuppressed(true)
  if (suppressed) assert.equal(suppressed(), true)
  api.close()
  assert.equal(hidden, true, "closing reaches the controller and releases input")
  if (suppressed) assert.equal(suppressed(), false)
}

test("panel dismisses with the readonly Omarchy bar API", () => {
  let value = false
  const bar = {
    get centerHoverRevealSuppressed() { return value },
    setCenterHoverRevealSuppressed(next) { value = next }
  }
  exercise(bar, () => value)
})

test("panel dismisses with the legacy writable bar property", () => {
  const bar = { centerHoverRevealSuppressed: false }
  exercise(bar, () => bar.centerHoverRevealSuppressed)
})

test("panel dismisses without a bar or hover-suppression API", () => {
  exercise(null)
  exercise({})
})
