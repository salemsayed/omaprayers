import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui
import "Model.js" as Model

BarWidget {
  id: root
  moduleName: "salemsayed.prayer-times"

  readonly property var schedule: panelLoader.item ? panelLoader.item.schedule : null
  readonly property date nowTick: panelLoader.item ? panelLoader.item.nowTick : new Date()
  readonly property var todayDay: Model.today(schedule)
  readonly property var nextPrayer: Model.nextPrayer(schedule, nowTick)
  readonly property int minutesToNext: Model.minutesUntil(nextPrayer, nowTick)
  readonly property string language: String(setting("language", "English"))
  readonly property bool isArabic: language === "Arabic"
  readonly property string arabicFont: String(setting("arabicFont", "Noto Naskh Arabic"))
  readonly property string timeFormat: String(setting("timeFormat", "24-hour"))
  readonly property string barDisplay: String(setting("barDisplay", "Strip + countdown"))
  readonly property bool showSunrise: Model.bool(setting("showSunrise", true))
  readonly property var daySegments: Model.daySegments(todayDay, showSunrise)
  readonly property real dayFraction: Model.fractionOfDay(todayDay, nowTick)
  readonly property int highlightBeforeMinutes: Math.max(0, Number(setting("highlightBeforeMinutes", 15)))
  readonly property bool stale: schedule && schedule.status === "stale"
  readonly property bool unavailable: !schedule || schedule.ok !== true
  readonly property string displayText: Model.barText(nextPrayer, nowTick, language, barDisplay, timeFormat)
  readonly property bool iconOnly: displayText === "\ueed3"
  readonly property string tooltipText: Model.tooltip(schedule, nextPrayer, nowTick, language, timeFormat)
  readonly property bool prayerSoon: isFinite(minutesToNext) && minutesToNext >= 0 && minutesToNext <= highlightBeforeMinutes
  readonly property bool stripModeActive: barDisplay === "Strip + countdown" && !root.vertical
  readonly property color chipForeground: prayerSoon
    ? Color.accent
    : (bar ? bar.barForeground : Color.foreground)

  readonly property bool opened: panelLoader.item ? panelLoader.item.opened === true : false
  readonly property bool popoutSwitchClosing: panelLoader.item ? panelLoader.item.popoutSwitchClosing === true : false
  readonly property real openPanelIndicatorWidth: button.labelWidth

  function injectPanel() {
    var target = panelLoader.item
    if (!target) return
    if ("bar" in target) target.bar = root.bar
    if ("settings" in target) target.settings = root.settings
    if ("anchorItem" in target) target.anchorItem = button
    if ("hostWidget" in target) target.hostWidget = root
  }

  function refresh(force) {
    if (panelLoader.item && panelLoader.item.refresh) panelLoader.item.refresh(force === true)
  }

  function open() {
    if (panelLoader.item && panelLoader.item.openFromHotkey) panelLoader.item.openFromHotkey()
  }

  function close() {
    if (panelLoader.item && panelLoader.item.close) panelLoader.item.close()
  }

  function togglePanel() {
    if (panelLoader.item && panelLoader.item.toggle) panelLoader.item.toggle()
  }

  function closeForPopoutSwitch() {
    if (panelLoader.item && panelLoader.item.closeForPopoutSwitch)
      panelLoader.item.closeForPopoutSwitch()
  }

  function statusText() {
    return panelLoader.item && panelLoader.item.statusText
      ? panelLoader.item.statusText()
      : "Prayer times are not loaded"
  }

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  onBarChanged: injectPanel()
  onSettingsChanged: injectPanel()

  Loader {
    id: panelLoader
    active: true
    source: Qt.resolvedUrl("Panel.qml")
    visible: false
    onLoaded: {
      root.injectPanel()
      Qt.callLater(root.injectPanel)
    }
  }

  IpcHandler {
    target: root.moduleName

    function open(): void { root.open() }
    function close(): void { root.close() }
    function show(): void { root.open() }
    function hide(): void { root.close() }
    function toggle(): void { root.togglePanel() }
    function refresh(): void { root.broadcast("refresh") }
    function status(): string { return root.statusText() }
  }

  WidgetButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: root.displayText
    fontSize: root.iconOnly ? Style.bar.iconFont : Style.font.bodySmall
    horizontalMargin: root.iconOnly ? 7.5 : 8.5
    labelVisible: !root.stripModeActive
    fixedWidth: root.stripModeActive ? stripRow.implicitWidth + Style.spaceReal(17) : -1
    fixedHeight: root.vertical
      ? Math.max(12, button.labelWidth + button.scaledVerticalPadding * 2)
      : -1
    textRotation: root.vertical ? 90 : 0
    tooltipText: root.tooltipText
    active: root.prayerSoon
    activeColor: Color.accent
    dimmed: root.stale || root.unavailable

    onPressed: function(buttonCode) {
      if (buttonCode === Qt.RightButton) root.refresh(true)
      else root.togglePanel()
    }

    Row {
      id: stripRow

      visible: root.stripModeActive
      anchors.centerIn: parent
      spacing: Style.space(5)

      Item {
        id: miniStrip

        width: Style.space(34)
        height: Style.space(8)

        // Fraction-based x positions do not inherit LayoutMirroring, so mirror them here.
        function place(fraction, itemWidth) {
          return root.isArabic
            ? width - fraction * width - itemWidth
            : fraction * width
        }

        Rectangle {
          anchors.fill: parent
          radius: height / 2
          color: Util.alpha(root.chipForeground, 0.13)
        }

        Repeater {
          model: root.daySegments

          Rectangle {
            required property var modelData

            x: miniStrip.place(
              (modelData.start - root.daySegments[0].start) / 1440, width
            )
            width: 1
            height: miniStrip.height
            color: Util.alpha(root.chipForeground, 0.42)
          }
        }

        Rectangle {
          visible: root.daySegments.length > 0
          x: miniStrip.place(root.dayFraction, width)
          width: Style.space(2)
          height: parent.height
          color: Color.accent
        }
      }

      Text {
        anchors.verticalCenter: parent.verticalCenter
        text: Model.remaining(root.nextPrayer, root.nowTick, root.language)
        color: root.chipForeground
        font.family: root.isArabic ? root.arabicFont : button.fontFamily
        font.pixelSize: Style.font.bodySmall
      }
    }
  }
}
