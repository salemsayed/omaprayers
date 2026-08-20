import QtQuick
import Quickshell
// Run by tests/EngineQml.test.sh from a scratch directory that holds a copy of
// the real Engine.js: Quickshell confines a -p config's imports to its own dir.
import "Engine.js" as Engine
import "Model.js" as Model

ShellRoot {
  Timer {
    interval: 1
    running: true
    repeat: false

    onTriggered: {
      var cairoZone = {
        schemaVersion: 2,
        ok: true,
        timezone: "Africa/Cairo",
        days: [
          { date: "2026-08-19", start: 1787086800 },
          { date: "2026-08-20", start: 1787173200 },
          { date: "2026-08-21", start: 1787259600 },
          { date: "2026-08-22", start: 1787346000 },
          { date: "2026-08-23", start: 1787432400 }
        ],
        offsets: [{ at: 1787086800, offset: 10800, abbreviation: "EEST" }]
      }
      var tromsoZone = {
        schemaVersion: 2,
        ok: true,
        timezone: "Europe/Oslo",
        days: [
          { date: "2026-06-19", start: 1781820000 },
          { date: "2026-06-20", start: 1781906400 },
          { date: "2026-06-21", start: 1781992800 },
          { date: "2026-06-22", start: 1782079200 },
          { date: "2026-06-23", start: 1782165600 }
        ],
        offsets: [{ at: 1781820000, offset: 7200, abbreviation: "CEST" }]
      }
      var base = {
        school: 0,
        latitudeAdjustmentMethod: 3,
        midnightMode: 0,
        hijriAdjustment: 0,
        tune: "0,0,0,0,0,0,0,0,0",
        shafaq: "general",
        methodSettings: ""
      }
      var cairoConfig = {
        locationLabel: "Cairo",
        latitude: 30.0444,
        longitude: 31.2357,
        timezone: "Africa/Cairo",
        method: 5,
        school: base.school,
        latitudeAdjustmentMethod: base.latitudeAdjustmentMethod,
        midnightMode: base.midnightMode,
        hijriAdjustment: base.hijriAdjustment,
        tune: base.tune,
        shafaq: base.shafaq,
        methodSettings: base.methodSettings
      }
      var tromsoConfig = {
        locationLabel: "Tromsø",
        latitude: 69.6492,
        longitude: 18.9553,
        timezone: "Europe/Oslo",
        method: 3,
        school: base.school,
        latitudeAdjustmentMethod: base.latitudeAdjustmentMethod,
        midnightMode: base.midnightMode,
        hijriAdjustment: base.hijriAdjustment,
        tune: base.tune,
        shafaq: base.shafaq,
        methodSettings: base.methodSettings
      }
      var result = {
        cairo: Engine.buildSchedule(cairoConfig, cairoZone, 1787227200000),
        tromso: Engine.buildSchedule(tromsoConfig, tromsoZone, 1781956800000),
        model: {
          method: Model.methodShortName(5, ""),
          tune: Model.tuneSummary("0,2,0,0,0,0,0,-3,0", "English")
        }
      }
      console.log(JSON.stringify(result))
      Qt.quit()
    }
  }
}
