import QtQuick
import qs.Commons
import qs.Ui
import "Model.js" as Model

// The panel footer and the display controls that fold out of it. Both layouts
// end with this element, so the settings read and behave identically in Horizon
// and Compact.
//
// Every control writes through host.persistSettings(), which lands the value in
// shell.json through the shell's updateEntryInline and applies it locally on the
// same click. None of these keys are part of host.configKey, so changing one
// repaints the panel without invalidating the cached calendar or provoking a
// fetch — which is why presentation is settable here and location and
// calculation are not.
Column {
  id: displayRoot

  property var host

  width: parent ? parent.width : 0
  spacing: Style.space(9)

  // Cycle buttons name their *next* value rather than their current one, so the
  // tooltip answers "what does clicking this do" instead of restating the panel.
  function nextTip(ring, current) {
    return Model.uiLabel("nextTip", host.language) + " "
      + Model.optionLabel(Model.nextInRing(ring, current), host.language)
  }

  // Footer affordance in the same idiom as the calendar panel's week-start
  // button: a glyph that swaps one setting, with a tooltip for what it means.
  component CycleButton: Rectangle {
    id: cycleButton

    required property string glyph
    required property string tip
    property bool held: false

    signal activated()

    width: Style.space(20)
    height: Style.space(20)
    radius: Style.cornerRadius
    color: cycleMouse.containsMouse || held
      ? Util.alpha(displayRoot.host.foreground, 0.13)
      : "transparent"

    Text {
      anchors.centerIn: parent
      text: cycleButton.glyph
      color: cycleMouse.containsMouse
        ? Style.hoverStateColor(displayRoot.host.foreground, Color.accent)
        : (cycleButton.held ? displayRoot.host.foreground : displayRoot.host.faint)
      font.family: displayRoot.host.fontFamily
      font.pixelSize: Style.font.caption
    }

    MouseArea {
      id: cycleMouse
      anchors.fill: parent
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: cycleButton.activated()
    }

    PanelToolTip {
      visible: cycleMouse.containsMouse
      text: cycleButton.tip
      fontFamily: displayRoot.host.fontFamily
    }
  }

  // Leading label for a settings row. Kept as its own element rather than a
  // whole row component: a component that wrapped both label and control would
  // need a default property alias, and that would swallow the label too.
  component RowLabel: Text {
    color: displayRoot.host.dim
    font.family: displayRoot.host.nameFontFamily
    font.pixelSize: Style.font.bodySmall
    elide: Text.ElideRight
  }

  component Choice: ButtonGroup {
    foreground: displayRoot.host.foreground
    background: "transparent"
    fontFamily: displayRoot.host.nameFontFamily
    fontSize: Style.font.caption
    // The panel owns its keyboard cursor, so the chips stay out of the Tab ring.
    focusable: false
  }

  component SettingSwitch: ToggleSwitch {
    foreground: displayRoot.host.foreground
    trackHeight: Style.space(18)
  }

  Item {
    width: parent.width
    height: Math.max(footerLabel.implicitHeight, footerButtons.implicitHeight)

    Text {
      id: footerLabel
      anchors.left: parent.left
      anchors.right: footerButtons.left
      anchors.rightMargin: Style.space(8)
      anchors.verticalCenter: parent.verticalCenter
      text: displayRoot.host.footerText
      color: displayRoot.host.faint
      font.family: displayRoot.host.fontFamily
      font.pixelSize: Style.font.caption
      wrapMode: Text.WordWrap
    }

    Row {
      id: footerButtons
      anchors.right: parent.right
      anchors.verticalCenter: parent.verticalCenter
      spacing: Style.space(2)

      CycleButton {
        glyph: "\uf0db"
        tip: displayRoot.nextTip(Model.PANEL_STYLES, displayRoot.host.panelStyle)
        onActivated: displayRoot.host.cyclePanelStyle()
      }

      CycleButton {
        glyph: "\uf0c9"
        tip: displayRoot.nextTip(Model.BAR_DISPLAYS, displayRoot.host.barDisplay)
        onActivated: displayRoot.host.cycleBarDisplay()
      }

      CycleButton {
        glyph: "\uf013"
        tip: Model.uiLabel("settingsTip", displayRoot.host.language)
        held: displayRoot.host.displaySettingsOpen
        onActivated: displayRoot.host.toggleDisplaySettings()
      }
    }
  }

  Column {
    id: displaySection

    visible: displayRoot.host.displaySettingsOpen
    width: parent.width
    spacing: Style.space(2)

    Rectangle {
      width: parent.width
      height: Style.spacing.hairline
      color: Util.alpha(displayRoot.host.foreground, 0.16)
    }

    // Location leads the fold because it is the setting a new install most
    // likely needs, and it is kept visually apart from the display rows below
    // because committing it refetches the calendar rather than just repainting.
    PanelSectionHeader {
      text: Model.uiLabel("location", displayRoot.host.language)
      foreground: displayRoot.host.foreground
      fontFamily: displayRoot.host.nameFontFamily
      bottomPadding: Style.space(3)
    }

    PanelLocation {
      host: displayRoot.host
    }

    Item { width: 1; height: Style.space(6) }

    PanelSectionHeader {
      text: Model.uiLabel("display", displayRoot.host.language)
      foreground: displayRoot.host.foreground
      fontFamily: displayRoot.host.nameFontFamily
      bottomPadding: Style.space(3)
    }

    Item {
      width: parent.width
      height: Math.max(Style.space(26), layoutChoice.height)

      RowLabel {
        anchors.left: parent.left
        anchors.right: layoutChoice.left
        anchors.rightMargin: Style.space(8)
        anchors.verticalCenter: parent.verticalCenter
        text: Model.uiLabel("layout", displayRoot.host.language)
      }

      Choice {
        id: layoutChoice
        anchors.right: parent.right
        anchors.verticalCenter: parent.verticalCenter
        options: Model.optionModel(Model.PANEL_STYLES, displayRoot.host.language)
        value: displayRoot.host.panelStyle
        onChanged: function(next) { displayRoot.host.setSetting("panelStyle", next) }
      }
    }

    Item {
      width: parent.width
      height: Math.max(Style.space(26), clockChoice.height)

      RowLabel {
        anchors.left: parent.left
        anchors.right: clockChoice.left
        anchors.rightMargin: Style.space(8)
        anchors.verticalCenter: parent.verticalCenter
        text: Model.uiLabel("clock", displayRoot.host.language)
      }

      Choice {
        id: clockChoice
        anchors.right: parent.right
        anchors.verticalCenter: parent.verticalCenter
        options: Model.optionModel(Model.TIME_FORMATS, displayRoot.host.language)
        value: displayRoot.host.timeFormat
        onChanged: function(next) { displayRoot.host.setSetting("timeFormat", next) }
      }
    }

    Item {
      width: parent.width
      height: Math.max(Style.space(26), namesChoice.height)

      RowLabel {
        anchors.left: parent.left
        anchors.right: namesChoice.left
        anchors.rightMargin: Style.space(8)
        anchors.verticalCenter: parent.verticalCenter
        text: Model.uiLabel("names", displayRoot.host.language)
      }

      Choice {
        id: namesChoice
        anchors.right: parent.right
        anchors.verticalCenter: parent.verticalCenter
        options: Model.optionModel(Model.LANGUAGES, displayRoot.host.language)
        value: displayRoot.host.language
        onChanged: function(next) { displayRoot.host.setSetting("language", next) }
      }
    }

    Item {
      width: parent.width
      height: Math.max(Style.space(30), barChoice.height)

      RowLabel {
        anchors.left: parent.left
        anchors.right: barChoice.left
        anchors.rightMargin: Style.space(8)
        anchors.verticalCenter: parent.verticalCenter
        text: Model.uiLabel("barLabel", displayRoot.host.language)
      }

      // Five options do not fit a chip row in this panel's width, so the bar
      // label is the one setting that keeps a dropdown. While its popup is up
      // it owns j/k and Enter, so the panel's key catcher stands down.
      Dropdown {
        id: barChoice
        anchors.right: parent.right
        anchors.verticalCenter: parent.verticalCenter
        width: Style.space(150)
        showLabel: false
        fontFamily: displayRoot.host.nameFontFamily
        options: Model.optionModel(Model.BAR_DISPLAYS, displayRoot.host.language)
        value: displayRoot.host.barDisplay
        onChanged: function(next) { displayRoot.host.setSetting("barDisplay", next) }
        onPopupOpenChanged: displayRoot.host.keysBlocked = popupOpen
      }
    }

    Item {
      width: parent.width
      height: Math.max(Style.space(26), sunriseSwitch.height)

      RowLabel {
        anchors.left: parent.left
        anchors.right: sunriseSwitch.left
        anchors.rightMargin: Style.space(8)
        anchors.verticalCenter: parent.verticalCenter
        text: Model.uiLabel("sunrise", displayRoot.host.language)
      }

      SettingSwitch {
        id: sunriseSwitch
        anchors.right: parent.right
        anchors.verticalCenter: parent.verticalCenter
        checked: displayRoot.host.showSunrise
        onToggled: displayRoot.host.setSetting("showSunrise", !displayRoot.host.showSunrise)
      }
    }

    Item {
      width: parent.width
      height: Math.max(Style.space(26), nightSwitch.height)

      RowLabel {
        anchors.left: parent.left
        anchors.right: nightSwitch.left
        anchors.rightMargin: Style.space(8)
        anchors.verticalCenter: parent.verticalCenter
        text: Model.uiLabel("nightMarkers", displayRoot.host.language)
      }

      SettingSwitch {
        id: nightSwitch
        anchors.right: parent.right
        anchors.verticalCenter: parent.verticalCenter
        checked: displayRoot.host.showNightMarkers
        onToggled: displayRoot.host.setSetting("showNightMarkers", !displayRoot.host.showNightMarkers)
      }
    }

    Item {
      width: parent.width
      height: Math.max(Style.space(26), notifySwitch.height)

      RowLabel {
        anchors.left: parent.left
        anchors.right: notifySwitch.left
        anchors.rightMargin: Style.space(8)
        anchors.verticalCenter: parent.verticalCenter
        text: Model.uiLabel("notifications", displayRoot.host.language)
      }

      SettingSwitch {
        id: notifySwitch
        anchors.right: parent.right
        anchors.verticalCenter: parent.verticalCenter
        checked: displayRoot.host.notificationsEnabled
        onToggled: displayRoot.host.setSetting("notifications", !displayRoot.host.notificationsEnabled)
      }
    }

    Item {
      width: parent.width
      height: Math.max(Style.space(26), accentRow.height)

      RowLabel {
        anchors.left: parent.left
        anchors.right: accentRow.left
        anchors.rightMargin: Style.space(8)
        anchors.verticalCenter: parent.verticalCenter
        text: Model.uiLabel("accentLead", displayRoot.host.language)
      }

      Row {
        id: accentRow
        anchors.right: parent.right
        anchors.verticalCenter: parent.verticalCenter
        spacing: Style.space(7)

        // The slider reports continuously while dragging; only the release is
        // persisted so one drag is a single shell.json write.
        PanelSlider {
          id: accentSlider
          anchors.verticalCenter: parent.verticalCenter
          bar: displayRoot.host.bar
          width: Style.space(96)
          minimum: 0
          maximum: 60
          step: 5
          integer: true
          value: displayRoot.host.highlightBeforeMinutes
          onReleased: function(next) {
            displayRoot.host.setSetting("highlightBeforeMinutes", Math.round(next))
          }
        }

        Text {
          anchors.verticalCenter: parent.verticalCenter
          width: Style.space(46)
          text: accentSlider.liveValue <= 0
            ? Model.uiLabel("off", displayRoot.host.language)
            : Math.round(accentSlider.liveValue) + " "
              + Model.uiLabel("minutes", displayRoot.host.language)
          color: displayRoot.host.faint
          font.family: displayRoot.host.nameFontFamily
          font.pixelSize: Style.font.caption
          elide: Text.ElideRight
        }
      }
    }
  }
}
