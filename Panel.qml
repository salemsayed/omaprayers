import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui
import "Engine.js" as Engine
import "Model.js" as Model

Panel {
  id: root
  moduleName: "io.github.salemsayed.omaprayers"
  ipcTarget: "io.github.salemsayed.omaprayers"
  manageIpc: false

  property var anchorItem: null
  property var hostWidget: null
  readonly property var barIdentity: hostWidget || root

  property var schedule: null
  property var zone: null
  property string lastError: ""
  property date nowTick: new Date()
  property double previousTickEpoch: Date.now()
  property string zoneRequestedTimezone: ""
  property var notificationQueue: []
  property var activeNotification: null
  property int notificationRetryAttempt: 0
  property string notificationWarning: ""
  // Session-only: which of the display controls are unfolded, and whether a
  // dropdown popup currently owns the keyboard. Neither belongs in shell.json.
  property bool displaySettingsOpen: false
  property bool keysBlocked: false
  property var pendingMethodSuggestion: null

  // Location picker state. All session-only: nothing here is written until the
  // user picks a row, and then only through commitLocation.
  property var locationChoices: []
  property string locationStatus: ""
  property string geocodePendingQuery: ""
  property string geocodeActiveQuery: ""
  property bool detectingLocation: false
  readonly property bool searchingLocation: geocodeProcess.running

  readonly property string zoneScript: Model.filePath(Qt.resolvedUrl("prayer-zone.sh"))
  readonly property string notificationScript: Model.filePath(Qt.resolvedUrl("prayer-notify.sh"))

  readonly property string locationLabel: String(setting("locationLabel", "Cairo"))
  readonly property string locationLabelAr: String(setting("locationLabelAr", ""))
  readonly property string latitude: String(setting("latitude", "30.0444"))
  readonly property string longitude: String(setting("longitude", "31.2357"))
  readonly property string timezone: String(setting("timezone", "Africa/Cairo"))
  readonly property int calculationMethod: Math.round(Model.number(setting("calculationMethod", 5), 5))
  readonly property bool hanafi: Model.bool(setting("hanafi", false))
  readonly property int school: hanafi ? 1 : 0
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
  readonly property string barDisplay: String(setting("barDisplay", "Strip + countdown"))
  readonly property bool isArabic: language === "Arabic"
  readonly property bool showSunrise: Model.bool(setting("showSunrise", true))
  readonly property bool showNightMarkers: Model.bool(setting("showNightMarkers", true))
  readonly property int highlightBeforeMinutes: Math.max(0, Math.round(Model.number(setting("highlightBeforeMinutes", 15), 15)))
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
  readonly property string methodShort: Model.methodShortName(
    calculationMethod, todayDay ? todayDay.methodName : "", language
  )
  readonly property string hijriText: {
    var hijri = Model.hijriLabel(todayDay, language)
    if (!hijri) return ""
    return isArabic ? "\u2068" + hijri + "\u2069" : hijri
  }
  readonly property string footerText: methodShort + "  \u00b7  "
    + Model.schoolLabel(school, language) + "  \u00b7  " + timezone
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
  readonly property string statusMessage: {
    if (lastError !== "") return lastError
    if (todayDay && todayDay.approximate)
      return Model.uiLabel("approximate", language)
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
    root.keysBlocked = false
    var file = root.panelStyle === "Compact" ? "PanelCompact.qml" : "PanelHorizon.qml"
    layoutLoader.setSource(Qt.resolvedUrl(file), { "host": root })
  }

  // Applied locally first so the panel repaints on the click itself; the
  // shell.json write comes back through the bar as the same value. With no
  // writable entry — the widget is not in the layout — it stays a session-only
  // preference rather than doing nothing. The host widget holds its own copy
  // and pushes it back down whenever it changes, so it has to be moved in step
  // or the next write would go out from an outdated one.
  function persistSettings(values) {
    var entry = { id: root.moduleName }
    for (var existing in root.settings) if (existing !== "id") entry[existing] = root.settings[existing]
    for (var key in values) entry[key] = values[key]

    root.settings = entry
    if (root.hostWidget && "settings" in root.hostWidget) root.hostWidget.settings = entry
    if (root.bar && root.bar.shell && typeof root.bar.shell.updateEntryInline === "function")
      root.bar.shell.updateEntryInline(root.moduleName, entry)
  }

  function setSetting(key, value) {
    var values = {}
    values[key] = value
    persistSettings(values)
  }

  function cycleSetting(key, ring) {
    var next = Model.nextInRing(ring, root.setting(key, ring[0]))
    if (next !== "") setSetting(key, next)
  }

  function cyclePanelStyle() { cycleSetting("panelStyle", Model.PANEL_STYLES) }
  function cycleBarDisplay() { cycleSetting("barDisplay", Model.BAR_DISPLAYS) }
  function cycleTimeFormat() { cycleSetting("timeFormat", Model.TIME_FORMATS) }
  function cycleLanguage() { cycleSetting("language", Model.LANGUAGES) }

  function toggleDisplaySettings() {
    root.displaySettingsOpen = !root.displaySettingsOpen
    // Folding the section away takes the search field with it, so the key
    // catcher has to be handed its keys back or the panel would go deaf.
    if (!root.displaySettingsOpen) root.keysBlocked = false
  }

  // Debounced so a typed query issues one request per pause rather than per
  // keystroke. Only one curl runs at a time; if the query moved on while a
  // request was in flight, the latest one is fetched when it finishes.
  function searchLocation(query) {
    var trimmed = String(query || "").replace(/^\s+|\s+$/g, "")
    root.geocodePendingQuery = trimmed
    if (trimmed.length < 2) {
      root.locationChoices = []
      root.locationStatus = ""
      geocodeDebounce.stop()
      return
    }
    geocodeDebounce.restart()
  }

  function startGeocode() {
    if (geocodeProcess.running || root.geocodePendingQuery.length < 2) return
    root.geocodeActiveQuery = root.geocodePendingQuery
    root.locationStatus = ""
    geocodeProcess.command = ["curl", "-fsS", "--max-time", "6",
      "https://geocoding-api.open-meteo.com/v1/search?name="
        + encodeURIComponent(root.geocodeActiveQuery) + "&count=6&language=en&format=json"]
    geocodeProcess.running = true
  }

  function applyLocationResults(raw) {
    var choices = Model.parseLocationResults(raw)
    root.locationChoices = choices
    root.locationStatus = choices.length === 0
      ? Model.uiLabel("noMatches", root.language)
      : ""
  }

  // The detected place only seeds the search box. It is never committed on its
  // own: the address derived from a connection can be a long way from where the
  // user is, and a wrong location here means wrong prayer times.
  function detectLocation() {
    if (detectProcess.running) return
    root.detectingLocation = true
    root.locationStatus = ""
    detectProcess.running = true
  }

  function applyDetectedLocation(raw) {
    var query = Model.detectedLocationQuery(raw)
    root.detectingLocation = false
    if (query === "") {
      root.locationStatus = Model.uiLabel("detectFailed", root.language)
      return
    }
    root.locationStatus = Model.uiLabel("detectHint", root.language)
    root.locationDetected(query)
  }

  // Emitted so the picker can put the detected term in its field and run the
  // search; the panel does not own the text input.
  signal locationDetected(string query)

  // The key catcher owns Tab for switching panels, so the search field would
  // otherwise be mouse-only.
  signal locationSearchRequested()
  signal methodPickerRequested()

  function requestLocationSearch() {
    root.displaySettingsOpen = true
    root.locationSearchRequested()
  }

  function requestMethodPicker() {
    root.displaySettingsOpen = true
    root.methodPickerRequested()
  }

  function commitLocation(choice) {
    var values = Model.locationSettings(choice)
    if (!values) return
    root.pendingMethodSuggestion = null
    var suggestion = Model.suggestedMethod(choice.countryCode, root.calculationMethod)
    if (suggestion) {
      root.pendingMethodSuggestion = {
        id: suggestion.id,
        label: suggestion.label,
        country: String(choice.country || choice.region || choice.name || "")
      }
    }
    root.locationChoices = []
    root.locationStatus = ""
    root.geocodePendingQuery = ""
    persistSettings(values)
  }

  function applySuggestedMethod() {
    if (!root.pendingMethodSuggestion) return
    var method = root.pendingMethodSuggestion.id
    root.pendingMethodSuggestion = null
    root.setSetting("calculationMethod", method)
  }

  function dismissMethodSuggestion() {
    root.pendingMethodSuggestion = null
  }

  function applyZone(raw) {
    var value = Model.parseEnvelope(raw)
    if (!value) {
      lastError = "Timezone data was not valid JSON"
      return
    }
    if (value.ok !== true) {
      lastError = String(value.error || "Timezone data refresh failed")
      return
    }
    if (String(value.timezone || "") !== root.timezone) {
      Qt.callLater(function() { root.refresh(false) })
      return
    }
    root.zone = value
    root.lastError = ""
  }

  function recompute() {
    if (!root.zone || root.zone.ok !== true
        || String(root.zone.timezone || "") !== root.timezone) return
    var value = Engine.buildSchedule(root.expectedConfig, root.zone, Date.now())
    if (!value || value.ok !== true) {
      root.schedule = null
      root.lastError = String(value && value.error
        ? value.error
        : "Prayer schedule calculation failed")
      root.armZoneRefresh()
      return
    }
    if (!Model.sameConfig(value.config, root.expectedConfig)) return
    root.schedule = value
    root.lastError = ""
    root.armZoneRefresh()
  }

  function armZoneRefresh() {
    var now = Date.now()
    var delay = 86400000
    var nextMidnight = root.schedule
      ? new Date(root.schedule.nextRefreshAt || "").getTime()
      : NaN
    if (isFinite(nextMidnight) && nextMidnight > now)
      delay = Math.min(delay, nextMidnight - now)
    zoneRefresh.interval = Math.max(1000, Math.round(delay))
    zoneRefresh.restart()
  }

  function refresh(force) {
    if (zoneProcess.running) return
    root.zoneRequestedTimezone = root.timezone
    zoneProcess.command = [root.zoneScript, "--timezone", root.timezone]
    zoneProcess.running = true
    root.armZoneRefresh()
  }

  function open() {
    root.controller.show()
    if (!root.schedule) root.recompute()
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
    if (!schedule)
      return lastError || (isArabic ? "مواقيت الصلاة غير محملة" : "Prayer times are not loaded")
    var next = Model.nextPrayer(schedule, nowTick)
    var nextText = next
      ? Model.label(next.name, language) + (isArabic ? " بعد " : " in ")
        + Model.remaining(next, nowTick, language)
      : (isArabic ? "لا توجد صلاة قادمة" : "No upcoming prayer")
    return displayLocation + ": " + nextText + " ["
      + Model.statusLabel(schedule.status, language) + "]"
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

    if (!schedule) return
    var nextRefresh = new Date(schedule.nextRefreshAt || "").getTime()
    if (isFinite(nextRefresh) && currentEpoch >= nextRefresh) {
      root.recompute()
      root.refresh(false)
    }
  }

  onConfigKeyChanged: configRefresh.restart()

  onTimezoneChanged: {
    root.zone = null
    root.schedule = null
    root.lastError = ""
    Qt.callLater(function() { root.refresh(false) })
  }

  onZoneChanged: configRefresh.restart()

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

  Process {
    id: zoneProcess
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: root.applyZone(text)
    }
    onExited: function(exitCode) {
      if (exitCode !== 0 && root.lastError === "")
        root.lastError = "Timezone data command failed (exit " + exitCode + ")"
      root.armZoneRefresh()
      if (root.zoneRequestedTimezone !== root.timezone)
        Qt.callLater(function() { root.refresh(false) })
    }
  }

  Process {
    id: notificationProcess
    onExited: function(exitCode) { root.finishNotification(exitCode) }
  }

  Process {
    id: geocodeProcess
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: root.applyLocationResults(text)
    }
    onExited: function(exitCode) {
      if (exitCode !== 0) {
        root.locationChoices = []
        root.locationStatus = Model.uiLabel("searchFailed", root.language)
      }
      // The query moved on while this request was in flight.
      if (root.geocodePendingQuery !== root.geocodeActiveQuery)
        Qt.callLater(root.startGeocode)
    }
  }

  Process {
    id: detectProcess
    command: ["curl", "-fsS", "--max-time", "5", "https://wttr.in/?format=%l"]
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: root.applyDetectedLocation(text)
    }
    onExited: function(exitCode) {
      if (exitCode !== 0 && root.detectingLocation) {
        root.detectingLocation = false
        root.locationStatus = Model.uiLabel("detectFailed", root.language)
      }
    }
  }

  Timer {
    id: geocodeDebounce
    interval: 350
    onTriggered: root.startGeocode()
  }

  Timer {
    id: notificationRetry
    interval: 5000
    onTriggered: root.startNotification()
  }

  Timer {
    id: configRefresh
    interval: 250
    onTriggered: root.recompute()
  }

  Timer {
    id: zoneRefresh
    interval: 86400000
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
    contentHeight: panel.fittedContentHeight(layoutLoader.height, Style.space(800))

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      // A dropdown popup drives its own list with the same keys, so the panel
      // stops reading them while one is open.
      blocked: root.keysBlocked
      onCloseRequested: root.close()
      onTabRequested: function(direction) { root.switchPanel(direction) }
      // PanelKeyCatcher claims h, j, k, l and x before textKey is emitted, for
      // cursor movement and delete, so none of those can be a shortcut here.
      onTextKey: function(value) {
        var key = String(value).toLowerCase()
        if (key === "r") root.refresh(true)
        else if (key === "m") root.requestMethodPicker()
        else if (key === "d") root.toggleDisplaySettings()
        else if (key === "s") root.cyclePanelStyle()
        else if (key === "b") root.cycleBarDisplay()
        else if (key === "t") root.cycleTimeFormat()
        else if (key === "a") root.cycleLanguage()
        else if (key === "c" || key === "/") root.requestLocationSearch()
      }

      Flickable {
        id: panelScroll
        anchors.fill: parent
        contentWidth: width
        contentHeight: layoutLoader.height
        clip: true
        boundsBehavior: Flickable.StopAtBounds
        interactive: contentHeight > height

        // The settings fold sits below the schedule. On screens where the
        // panel hits its height cap it lands below the fold, scrollable but
        // invisible — so scroll it into view when it opens, when the search or
        // the method picker is invoked, and when search results arrive.
        function revealBottom() {
          if (contentHeight > height) contentY = contentHeight - height
        }

        Connections {
          target: root
          function onLocationChoicesChanged() {
            if (root.locationChoices.length > 0) Qt.callLater(panelScroll.revealBottom)
          }
          function onLocationSearchRequested() {
            Qt.callLater(panelScroll.revealBottom)
          }
          function onMethodPickerRequested() {
            revealTimer.restart()
          }
          function onDisplaySettingsOpenChanged() {
            if (root.displaySettingsOpen) revealTimer.restart()
          }
        }

        // The fold reports its height a frame after it becomes visible, so a
        // reveal on the same tick would measure the old content height.
        Timer {
          id: revealTimer
          interval: 80
          onTriggered: panelScroll.revealBottom()
        }

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
