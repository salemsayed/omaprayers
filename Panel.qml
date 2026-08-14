import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui
import "Model.js" as Model

Panel {
  id: root
  moduleName: "salemsayed.prayer-times"
  ipcTarget: "salemsayed.prayer-times"
  manageIpc: false

  property var anchorItem: null
  property var hostWidget: null
  readonly property var barIdentity: hostWidget || root

  property var schedule: null
  property string lastError: ""
  property date nowTick: new Date()
  property double previousTickEpoch: Date.now()
  property double lastRefreshAttemptEpoch: 0
  property bool refreshAfterCurrentFetch: false
  property bool forceAfterCurrentFetch: false
  property var notificationQueue: []
  property var activeNotification: null
  property int notificationRetryAttempt: 0
  property string notificationWarning: ""

  readonly property string dataScript: Model.filePath(Qt.resolvedUrl("prayer-data.sh"))
  readonly property string notificationScript: Model.filePath(Qt.resolvedUrl("prayer-notify.sh"))
  readonly property string stateHome: Quickshell.env("XDG_STATE_HOME") || Quickshell.env("HOME") + "/.local/state"
  readonly property string cachePath: stateHome + "/omarchy/prayer-times/salemsayed.prayer-times/current.json"

  readonly property string locationLabel: String(setting("locationLabel", "Cairo"))
  readonly property string locationLabelAr: String(setting("locationLabelAr", ""))
  readonly property string latitude: String(setting("latitude", "30.0444"))
  readonly property string longitude: String(setting("longitude", "31.2357"))
  readonly property string timezone: String(setting("timezone", "Africa/Cairo"))
  readonly property int calculationMethod: Math.round(Model.number(setting("calculationMethod", 5), 5))
  readonly property int school: Model.bool(setting("hanafi", false)) ? 1 : 0
  readonly property int latitudeAdjustmentMethod: latitudeRule(String(setting("highLatitudeRule", "Angle based")))
  readonly property int midnightMode: String(setting("midnightMode", "Standard")) === "Jafari" ? 1 : 0
  readonly property string shafaq: shafaqValue(String(setting("shafaq", "General")))
  readonly property int hijriAdjustment: Math.round(Model.number(setting("hijriAdjustment", 0), 0))
  readonly property string tune: String(setting("tune", "0,0,0,0,0,0,0,0,0"))
  readonly property string methodSettings: String(setting("customMethodSettings", ""))
  readonly property string panelStyle: String(setting("panelStyle", "Horizon"))
  readonly property string timeFormat: String(setting("timeFormat", "24-hour"))
  readonly property string language: String(setting("language", "English"))
  readonly property string arabicFont: String(setting("arabicFont", "Noto Naskh Arabic"))
  readonly property bool isArabic: language === "Arabic"
  readonly property bool showSunrise: Model.bool(setting("showSunrise", true))
  readonly property bool showNightMarkers: Model.bool(setting("showNightMarkers", true))
  readonly property int refreshHours: Math.max(1, Math.round(Model.number(setting("refreshHours", 24), 24)))
  readonly property bool notificationsEnabled: Model.bool(setting("notifications", false))
  readonly property int notifyBeforeMinutes: Math.max(0, Math.round(Model.number(setting("notifyBeforeMinutes", 10), 10)))
  readonly property int notificationGraceMinutes: Math.max(1, Math.round(Model.number(setting("notificationGraceMinutes", 10), 10)))

  readonly property var expectedConfig: ({
    locationLabel: locationLabel,
    latitude: latitude,
    longitude: longitude,
    timezone: timezone,
    method: calculationMethod,
    school: school,
    latitudeAdjustmentMethod: latitudeAdjustmentMethod,
    midnightMode: midnightMode,
    hijriAdjustment: hijriAdjustment,
    tune: tune,
    shafaq: shafaq,
    methodSettings: methodSettings
  })

  readonly property string configKey: [
    locationLabel, latitude, longitude, timezone, calculationMethod, school,
    latitudeAdjustmentMethod, midnightMode, hijriAdjustment, tune, shafaq,
    methodSettings
  ].join("|")

  readonly property var todayDay: Model.today(schedule)
  readonly property var nextPrayer: Model.nextPrayer(schedule, nowTick)
  readonly property var currentPrayer: Model.currentPrayer(schedule, nowTick)
  readonly property var prayerRows: Model.dayRows(todayDay, showSunrise)
  readonly property var nightRows: showNightMarkers ? Model.nightRows(todayDay) : []
  readonly property string displayLocation: isArabic && locationLabelAr !== "" ? locationLabelAr : locationLabel
  readonly property string nameFontFamily: isArabic ? arabicFont : fontFamily
  readonly property var daySegments: Model.daySegments(todayDay, showSunrise)
  readonly property var nightBand: showNightMarkers ? Model.nightMarkers(todayDay) : null
  readonly property real dayFraction: Model.fractionOfDay(todayDay, nowTick)
  readonly property string methodShort: Model.methodShortName(calculationMethod, todayDay ? todayDay.methodName : "")
  readonly property string hijriText: {
    var hijri = Model.hijriLabel(todayDay, language)
    if (!hijri) return ""
    return isArabic ? "\u2068" + hijri + "\u2069" : hijri
  }
  readonly property string footerText: methodShort + "  \u00b7  " + timezone + "  \u00b7  "
    + Model.statusLabel(schedule ? schedule.status : "")
  readonly property string tomorrowPrayerText: {
    var prayer = nextPrayer
    var day = todayDay
    if (!prayer || !day || prayer.date === day.date) return ""
    return Model.tomorrowPrayerLabel(prayer, language, timeFormat)
  }
  readonly property color foreground: bar ? bar.foreground : Color.foreground
  readonly property color urgent: bar ? bar.urgent : Color.urgent
  readonly property color dim: Util.alpha(foreground, 0.62)
  readonly property color faint: Util.alpha(foreground, 0.42)
  readonly property string fontFamily: bar ? bar.fontFamily : Style.font.family
  readonly property bool fetching: fetchProcess.running
  readonly property bool stale: schedule && schedule.status === "stale"
  readonly property string statusMessage: {
    if (lastError !== "") return lastError
    if (stale && schedule.error) return "Offline cache \u00b7 " + schedule.error
    if (fetching && !schedule) return "Loading prayer calendar..."
    if (notificationWarning !== "") return notificationWarning
    return ""
  }

  function latitudeRule(value) {
    if (value === "Middle of the night") return 1
    if (value === "One seventh") return 2
    return 3
  }

  function shafaqValue(value) {
    if (value === "Red") return "ahmer"
    if (value === "White") return "abyad"
    return "general"
  }

  function syncLayout() {
    var file = root.panelStyle === "Compact" ? "PanelCompact.qml" : "PanelHorizon.qml"
    layoutLoader.setSource(Qt.resolvedUrl(file), { "host": root })
  }

  function fetchCommand(force) {
    var command = [
      root.dataScript,
      "--latitude", root.latitude,
      "--longitude", root.longitude,
      "--timezone", root.timezone,
      "--location-label", root.locationLabel,
      "--method", String(root.calculationMethod),
      "--school", String(root.school),
      "--latitude-adjustment", String(root.latitudeAdjustmentMethod),
      "--midnight-mode", String(root.midnightMode),
      "--hijri-adjustment", String(root.hijriAdjustment),
      "--tune", root.tune,
      "--shafaq", root.shafaq,
      "--method-settings", root.methodSettings,
      "--refresh-hours", String(root.refreshHours)
    ]
    if (force === true) command.push("--force")
    return command
  }

  function refresh(force) {
    if (fetchProcess.running) {
      refreshAfterCurrentFetch = true
      if (force === true) forceAfterCurrentFetch = true
      return
    }
    lastRefreshAttemptEpoch = Date.now()
    fetchProcess.command = fetchCommand(force === true)
    fetchProcess.running = true
  }

  function applyEnvelope(raw) {
    var value = Model.parseEnvelope(raw)
    if (!value) {
      lastError = "Prayer data was not valid JSON"
      return
    }
    if (value.ok !== true) {
      lastError = String(value.error || "Prayer data refresh failed")
      return
    }
    if (!Model.sameConfig(value.config, expectedConfig)) return
    schedule = value
    lastError = value.status === "stale" ? "" : String(value.error || "")
  }

  function open() {
    root.controller.show()
    root.refresh(false)
    Qt.callLater(function() {
      if (root.opened) root.setCenterHoverRevealSuppressed(true)
    })
  }

  function openFromHotkey() {
    open()
  }

  function close() {
    setCenterHoverRevealSuppressed(false)
    root.controller.hide()
  }

  function toggle() {
    if (root.opened) root.close()
    else root.open()
  }

  function switchPanel(direction) {
    if (root.bar && typeof root.bar.switchPanelFrom === "function")
      return root.bar.switchPanelFrom(root.barIdentity, direction)
    return false
  }

  function setCenterHoverRevealSuppressed(value) {
    if (root.bar && "centerHoverRevealSuppressed" in root.bar)
      root.bar.centerHoverRevealSuppressed = value
  }

  function statusText() {
    if (!schedule) return lastError || "Prayer times are not loaded"
    var next = Model.nextPrayer(schedule, nowTick)
    var nextText = next
      ? Model.label(next.name, language) + " in " + Model.remaining(next, nowTick)
      : "No upcoming prayer in cache"
    return locationLabel + ": " + nextText + " [" + schedule.status + "]"
  }

  function queueNotifications(events) {
    if (!events || events.length === 0) return
    var nextQueue = notificationQueue.slice()
    for (var i = 0; i < events.length; i++) nextQueue.push(events[i])
    notificationQueue = nextQueue
    startNotification()
  }

  function startNotification() {
    if (notificationProcess.running || notificationQueue.length === 0) return
    var event = notificationQueue[0]
    activeNotification = event
    var message = Model.notificationText(event, language, timeFormat)
    notificationProcess.command = [notificationScript, event.key, message.title, message.body]
    notificationProcess.running = true
  }

  function finishNotification(exitCode) {
    if (exitCode === 0) {
      notificationWarning = ""
      notificationRetryAttempt = 0
      activeNotification = null
      if (notificationQueue.length > 0) notificationQueue = notificationQueue.slice(1)
      Qt.callLater(startNotification)
      return
    }

    if (notificationRetryAttempt < 2 && activeNotification) {
      notificationRetryAttempt++
      notificationRetry.restart()
      return
    }

    notificationWarning = "Prayer notification delivery failed"
    notificationRetryAttempt = 0
    activeNotification = null
    if (notificationQueue.length > 0) notificationQueue = notificationQueue.slice(1)
    Qt.callLater(startNotification)
  }

  function tick() {
    var currentEpoch = Date.now()
    var previousEpoch = previousTickEpoch
    previousTickEpoch = currentEpoch
    nowTick = new Date(currentEpoch)

    if (notificationsEnabled && schedule) {
      queueNotifications(Model.notificationEvents(
        schedule, previousEpoch, currentEpoch,
        notifyBeforeMinutes, notificationGraceMinutes
      ))
    }

    if (!schedule) {
      if (currentEpoch - lastRefreshAttemptEpoch >= 600000) refresh(false)
      return
    }
    var nextRefresh = new Date(schedule.nextRefreshAt || "").getTime()
    var ageDue = Number(schedule.fetchedAtEpoch || 0) + refreshHours * 3600000
    var due = (isFinite(nextRefresh) && currentEpoch >= nextRefresh) || currentEpoch >= ageDue
    if (due && currentEpoch - lastRefreshAttemptEpoch >= 600000) refresh(false)
  }

  onConfigKeyChanged: {
    schedule = null
    lastError = ""
    configRefresh.restart()
  }

  onNotificationsEnabledChanged: {
    previousTickEpoch = Date.now()
    if (!notificationsEnabled) {
      notificationQueue = []
      activeNotification = null
      notificationRetryAttempt = 0
      notificationWarning = ""
      notificationRetry.stop()
    }
  }

  onPanelStyleChanged: syncLayout()

  Component.onCompleted: {
    Qt.callLater(function() { root.refresh(false) })
    syncLayout()
  }

  FileView {
    id: cacheFile
    path: root.cachePath
    watchChanges: true
    printErrors: false
    onLoaded: root.applyEnvelope(text())
    onFileChanged: reload()
  }

  Process {
    id: fetchProcess
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: root.applyEnvelope(text)
    }
    onExited: function(exitCode) {
      if (exitCode !== 0 && root.lastError === "")
        root.lastError = "Prayer data command failed (exit " + exitCode + ")"
      if (root.refreshAfterCurrentFetch) {
        var force = root.forceAfterCurrentFetch
        root.refreshAfterCurrentFetch = false
        root.forceAfterCurrentFetch = false
        Qt.callLater(function() { root.refresh(force) })
      }
    }
  }

  Process {
    id: notificationProcess
    onExited: function(exitCode) { root.finishNotification(exitCode) }
  }

  Timer {
    id: notificationRetry
    interval: 5000
    onTriggered: root.startNotification()
  }

  Timer {
    id: configRefresh
    interval: 250
    onTriggered: root.refresh(false)
  }

  Timer {
    interval: 30000
    running: true
    repeat: true
    triggeredOnStart: true
    onTriggered: root.tick()
  }

  KeyboardPanel {
    id: panel
    anchorItem: root.anchorItem
    owner: root.barIdentity
    bar: root.bar
    open: root.opened
    centerOnBar: true
    focusTarget: keyCatcher
    contentWidth: panel.fittedContentWidth(Style.space(360))
    contentHeight: panel.fittedContentHeight(layoutLoader.height, Style.space(620))

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      onCloseRequested: root.close()
      onTabRequested: function(direction) { root.switchPanel(direction) }
      onTextKey: function(value) {
        if (value === "r" || value === "R") root.refresh(true)
      }

      Flickable {
        id: panelScroll
        anchors.fill: parent
        contentWidth: width
        contentHeight: layoutLoader.height
        clip: true
        boundsBehavior: Flickable.StopAtBounds
        interactive: contentHeight > height

        Loader {
          id: layoutLoader
          width: panelScroll.width
          height: item ? item.implicitHeight : 0
          LayoutMirroring.enabled: root.isArabic
          LayoutMirroring.childrenInherit: true
        }
      }
    }
  }
}
