const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const Engine = require('../Engine.js')
const Model = require('./qml-js-loader.js')(path.join(__dirname, '..', 'Model.js'), module)
const source = readFileSync(path.join(__dirname, '..', 'Panel.qml'), 'utf8')
const base = { method: 1000, latitude: 38.42207, longitude: -77.40832,
  timezone: 'America/New_York', school: 1, midnightMode: 0 }

test('Nojumi overrides effective conventions without mutating configuration', () => {
  const config = Object.freeze({ ...base })
  const actual = Engine.dayTimes(config, 2026, 9, 11, null)
  const expected = Engine.dayTimes({ ...base, method: 99, methodSettings: '18,3.75,15',
    school: 0, midnightMode: 1 }, 2026, 9, 11, null)
  for (const key of ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Midnight', 'Firstthird', 'Lastthird'])
    assert.equal(actual[key], expected[key], key)
  assert.equal(Engine.clock(actual.Midnight, -14400), '00:21')
  assert.equal(config.school, 1)
  assert.equal(config.midnightMode, 0)
  assert.equal(Engine.dayTimes({ ...base, school: undefined, hanafi: true }, 2026, 9, 11, null).Asr, actual.Asr)
})

test('Nojumi applies the Iran angle and tuning independently', () => {
  const iran = { ...base, latitude: 34.64, longitude: 50.88, timezone: 'Asia/Tehran' }
  const actual = Engine.dayTimes(iran, 2026, 9, 22, null)
  const expected = Engine.dayTimes({ ...iran, method: 99, methodSettings: '18,4.5,15',
    school: 0, midnightMode: 1 }, 2026, 9, 22, null)
  assert.equal(actual.Maghrib, expected.Maghrib)
  const tuned = Engine.dayTimes({ ...iran, tune: '0,1,0,0,2,3,0,4,5' }, 2026, 9, 22, null)
  for (const [key, minutes] of [['Fajr', 1], ['Asr', 2], ['Maghrib', 3], ['Isha', 4], ['Midnight', 5]])
    assert.equal(tuned[key], actual[key] + minutes * 60000, key)
})

test('every existing method retains both Asr schools and midnight choices', () => {
  for (const method of Engine.METHODS.filter(m => m.id !== 1000)) {
    assert.equal(Engine.hanafiSupported(method.id), true)
    const standard = Engine.dayTimes({ ...base, method: method.id, school: 0 }, 2026, 9, 11, null)
    const hanafi = Engine.dayTimes({ ...base, method: method.id }, 2026, 9, 11, null)
    const jafari = Engine.dayTimes({ ...base, method: method.id, midnightMode: 1 }, 2026, 9, 11, null)
    assert.ok(hanafi.Asr > standard.Asr, method.code)
    assert.ok(jafari.Midnight < hanafi.Midnight, method.code)
  }
})

test('actual panel bindings restore saved preferences after switching away from Nojumi', () => {
  for (const originalMethod of [0, 5, 7, 99]) {
    for (const hanafi of [false, true]) {
      for (const midnightMode of ['Standard', 'Jafari']) {
        const settings = { calculationMethod: originalMethod, hanafi, midnightMode }
        const writes = []
        const context = vm.createContext({ Model, Engine,
          setting: (key, fallback) => settings[key] ?? fallback,
          persistSettings(values) { writes.push(JSON.parse(JSON.stringify(values))); Object.assign(settings, values) }
        })
        for (const name of ['calculationMethod', 'hanafiSupported', 'hanafi', 'school', 'midnightMode']) {
          const match = source.match(new RegExp('  readonly property (?:int|bool) ' + name + ': ([\\s\\S]*?)(?=\\n  (?:readonly|//))'))
          assert.ok(match, name)
          Object.defineProperty(context, name, { get: () => vm.runInContext(match[1], context) })
        }
        const handler = source.match(/  function setCalculationMethod\([^)]*\) \{[\s\S]*?\n  \}/)
        vm.runInContext(handler[0], context)
        context.setCalculationMethod(1000)
        assert.equal(context.hanafiSupported, false)
        assert.equal(context.school, 0)
        assert.equal(context.midnightMode, 1)
        assert.equal(settings.hanafi, hanafi)
        assert.equal(settings.midnightMode, midnightMode)
        context.setCalculationMethod(originalMethod)
        assert.equal(context.hanafiSupported, true)
        assert.equal(context.school, hanafi ? 1 : 0)
        assert.equal(context.midnightMode, midnightMode === 'Jafari' ? 1 : 0)
        assert.deepEqual(writes, [{ calculationMethod: 1000 }, { calculationMethod: originalMethod }])
      }
    }
  }
})

test('Nojumi labels disclose estimated Isha in both languages', () => {
  assert.match(Model.methodOptions('English').find(m => m.value === '1000').description, /Isha 15° \(estimated\)/)
  const arabic = Model.methodOptions('Arabic').find(m => m.value === '1000').description
  assert.match(arabic, /تقديري/)
  assert.match(arabic, /إيران/)
  assert.doesNotMatch(arabic, /Iran|estimated/)
})

test('schedule metadata and timing use the same effective Nojumi preferences', () => {
  const zone = { schemaVersion: 2, ok: true, timezone: 'America/New_York',
    days: ['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14']
      .map(date => ({ date, start: Date.parse(date + 'T00:00:00-04:00') / 1000 })),
    offsets: [{ at: Date.parse('2026-09-10T00:00:00-04:00') / 1000, offset: -14400, abbreviation: 'EDT' }] }
  const schedule = Engine.buildSchedule(base, zone, Date.parse('2026-09-11T12:00:00-04:00'))
  assert.equal(schedule.ok, true)
  assert.equal(schedule.config.school, 0)
  assert.equal(schedule.config.midnightMode, 1)
  assert.equal(schedule.days.find(d => d.date === '2026-09-11').timings.Midnight.time, '00:21')
})
