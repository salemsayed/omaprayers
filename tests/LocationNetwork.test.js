const assert = require("node:assert/strict")
const { spawn, spawnSync } = require("node:child_process")
const fs = require("node:fs")
const http = require("node:http")
const os = require("node:os")
const path = require("node:path")
const test = require("node:test")
const Model = require("./qml-js-loader.js")(path.join(__dirname, "..", "Model.js"), module)

const city = { name: "القاهرة", country: "Egypt", country_code: "EG", latitude: 30.0444, longitude: 31.2357, timezone: "Africa/Cairo" }
const geocode = JSON.stringify({ results: [city] })
const hasQs = spawnSync("qs", ["--version"], { stdio: "ignore" }).status === 0

function run(command, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), { env })
    const stdout = [], stderr = []
    child.stdout.on("data", chunk => stdout.push(chunk))
    child.stderr.on("data", chunk => stderr.push(chunk))
    child.on("error", reject)
    child.on("close", code => resolve({ code, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr).toString() }))
  })
}

function fixtureResponse(response, kind, body, limit) {
  if (kind === "normal") return response.end(body)
  if (kind === "http-error") {
    response.writeHead(503)
    return response.end(body)
  }
  const size = kind === "boundary" ? limit : limit * 2
  const padded = Buffer.concat([Buffer.from(body), Buffer.alloc(size - Buffer.byteLength(body), " ")])
  if (kind === "length") response.setHeader("Content-Length", padded.length)
  if (kind === "truncated") response.setHeader("Content-Length", Buffer.byteLength(body) + 64)
  if (kind === "headerless" || kind === "boundary") {
    response.useChunkedEncodingByDefault = false
    response.setHeader("Connection", "close")
  }
  if (kind === "truncated") {
    response.write(body)
    return setTimeout(() => response.destroy(), 20)
  }
  // A valid prefix arrives first. The remainder must not be accepted just
  // because that prefix could be parsed before the process exits.
  response.write(padded.subarray(0, Buffer.byteLength(body)))
  setTimeout(() => response.end(padded.subarray(Buffer.byteLength(body))), 20)
}

function qmlProbe(processName, command) {
  const panel = fs.readFileSync(path.join(__dirname, "..", "Panel.qml"), "utf8")
  const functions = ["applyLocationResults", "applyDetectedLocation"].map(name => {
    const match = panel.match(new RegExp(`  function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}`))
    assert.ok(match)
    return match[0]
  }).join("\n")
  const match = panel.match(new RegExp(`  Process \\{\\n    id: ${processName}Process\\n[\\s\\S]*?\\n  \\}`))
  assert.ok(match)
  // Exercise the shipping Process, collector and exit handler under QML.
  // Only the endpoint and a result-reporting hook differ from Panel.qml.
  const processBlock = match[0].replace(/\n    \}\n  \}$/, `
      console.log("LOCATION_RESULT " + JSON.stringify({
        code: exitCode, codeUnits: ${processName}Output.text.length,
        choices: root.locationChoices, status: root.locationStatus,
        detected: root.detected, detecting: root.detectingLocation
      }))
      Qt.quit()
    }
  }`)
  return `import QtQuick
import Quickshell
import Quickshell.Io
import "Model.js" as Model
ShellRoot {
  id: root
  property string language: "English"
  property var locationChoices: []
  property string locationStatus: ""
  property bool detectingLocation: ${processName === "detect"}
  property string detected: ""
  property string geocodePendingQuery: "Cairo"
  property string geocodeActiveQuery: "Cairo"
  signal locationDetected(string query)
  onLocationDetected: function(query) { root.detected = query }
  function startGeocode() { throw new Error("Unexpected second request") }
${functions}
${processBlock}
  Component.onCompleted: {
    ${processName}Process.command = ${JSON.stringify(command)}
    ${processName}Process.running = true
  }
  Timer { interval: 10000; running: true; onTriggered: Qt.exit(2) }
}`
}

test("location transfers and QML collectors stay bounded and discard failures", async t => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "omaprayers-network-"))
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }))
  // An inherited curlrc must not silently add another transfer or decompression.
  fs.writeFileSync(path.join(scratch, ".curlrc"), 'url = "http://127.0.0.1:1/unwanted"\ncompressed\n')
  for (const name of ["Model.js", "Engine.js"])
    fs.copyFileSync(path.join(__dirname, "..", name), path.join(scratch, name))
  const env = { ...process.env, CURL_HOME: scratch, QT_QPA_PLATFORM: "offscreen" }
  const server = http.createServer((request, response) => {
    const [processName, kind] = request.url.slice(1).split("/")
    fixtureResponse(response, kind, processName === "geocode" ? geocode : "Cairo, Egypt\n",
      processName === "geocode" ? Model.LOCATION_RESPONSE_LIMIT : Model.DETECT_RESPONSE_LIMIT)
  })
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  t.after(() => server.close())

  for (const processName of ["geocode", "detect"]) {
    const limit = processName === "geocode" ? Model.LOCATION_RESPONSE_LIMIT : Model.DETECT_RESPONSE_LIMIT
    for (const kind of ["normal", "boundary", "length", "chunked", "headerless", "truncated", "http-error"]) {
      await t.test(`${processName}: ${kind}`, async () => {
        const command = processName === "geocode" ? Model.geocodeCommand("القاهرة & London") : Model.detectLocationCommand()
        command[command.length - 1] = `http://127.0.0.1:${server.address().port}/${processName}/${kind}`
        const success = kind === "normal" || kind === "boundary"
        const expectedCode = success ? 0 : kind === "truncated" ? 18 : kind === "http-error" ? 22 : 63
        const result = await run(command, env)
        assert.equal(result.code, expectedCode, result.stderr)
        assert.ok(result.stdout.length <= limit, `${result.stdout.length} bytes exceed ${limit}`)
        if (success) {
          if (processName === "geocode") assert.equal(Model.parseLocationResults(result.stdout.toString())[0].name, city.name)
          else assert.equal(Model.detectedLocationQuery(result.stdout.toString()), "Cairo")
        }
        if (!hasQs) return
        const probe = path.join(scratch, "probe.qml")
        fs.writeFileSync(probe, qmlProbe(processName, command))
        const qml = await run(["qs", "-p", probe], env)
        assert.equal(qml.code, 0, qml.stdout.toString() + qml.stderr)
        const match = (qml.stdout.toString() + qml.stderr).match(/LOCATION_RESULT (\{[^\n]*\})/)
        assert.ok(match, qml.stdout.toString() + qml.stderr)
        const actual = JSON.parse(match[1])
        assert.equal(actual.code, expectedCode)
        assert.ok(actual.codeUnits <= limit)
        if (processName === "geocode") {
          assert.deepEqual(actual.choices, success ? Model.parseLocationResults(geocode) : [])
          assert.equal(actual.status, success ? "" : Model.uiLabel("searchFailed", "English"))
        } else {
          assert.equal(actual.detected, success ? "Cairo" : "")
          assert.equal(actual.detecting, false)
          assert.equal(actual.status, Model.uiLabel(success ? "detectHint" : "detectFailed", "English"))
        }
      })
    }
  }
  if (!hasQs) t.diagnostic("Quickshell not installed: real curl checks ran; QML collector probes skipped")
})
