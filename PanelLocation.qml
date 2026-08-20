import QtQuick
import qs.Commons
import qs.Ui
import "Model.js" as Model

// The location picker inside the panel's settings fold.
//
// Changing location recomputes every instant, so nothing here writes on a
// keystroke. Picking a row commits label, coordinates, and timezone as one unit
// through host.commitLocation.
//
// The Detect button fills the field from the connection's apparent city and
// leaves it for the user to confirm. It never commits: the derived address can
// be a long way off, and a wrong location produces confidently wrong prayer
// times rather than a visible failure.
Column {
  id: locationRoot

  property var host

  width: parent ? parent.width : 0
  spacing: Style.space(5)

  function runSearch() {
    host.searchLocation(cityField.text)
  }

  // Focus is always deferred: both entry points can run in the same call that
  // unfolds the section, and an item that is not visible yet cannot take active
  // focus. Without the deferral the key catcher keeps the keys — it intercepts
  // with Keys.BeforeItem and only stands down once the field reports focus.
  function focusField() {
    Qt.callLater(function() {
      cityField.forceActiveFocus()
      cityField.selectAll()
    })
  }

  Connections {
    target: locationRoot.host
    // The detected term arrives here rather than being pushed into settings.
    function onLocationDetected(query) {
      cityField.text = query
      locationRoot.runSearch()
      locationRoot.focusField()
    }
    function onLocationSearchRequested() {
      locationRoot.focusField()
    }
  }

  Item {
    width: parent.width
    height: Math.max(currentLocation.implicitHeight, detectButton.height)

    Text {
      id: currentLocation
      anchors.left: parent.left
      anchors.right: detectButton.left
      anchors.rightMargin: Style.space(8)
      anchors.verticalCenter: parent.verticalCenter
      text: locationRoot.host.displayLocation + "  ·  " + locationRoot.host.timezone
      color: locationRoot.host.dim
      font.family: locationRoot.host.nameFontFamily
      font.pixelSize: Style.font.bodySmall
      elide: Text.ElideRight
    }

    Button {
      id: detectButton
      anchors.right: parent.right
      anchors.verticalCenter: parent.verticalCenter
      text: locationRoot.host.detectingLocation
        ? Model.uiLabel("searching", locationRoot.host.language)
        : Model.uiLabel("detect", locationRoot.host.language)
      enabled: !locationRoot.host.detectingLocation
      bordered: true
      foreground: locationRoot.host.foreground
      background: "transparent"
      fontFamily: locationRoot.host.nameFontFamily
      fontSize: Style.font.caption
      onClicked: locationRoot.host.detectLocation()
    }
  }

  Item {
    id: suggestionRow

    visible: locationRoot.host.pendingMethodSuggestion !== null
    width: parent.width
    height: visible ? Math.max(suggestionText.implicitHeight, suggestionButtons.implicitHeight) : 0

    Text {
      id: suggestionText
      anchors.left: parent.left
      anchors.right: suggestionButtons.left
      anchors.rightMargin: Style.space(6)
      anchors.verticalCenter: parent.verticalCenter
      text: {
        var suggestion = locationRoot.host.pendingMethodSuggestion
        if (!suggestion) return ""
        return Model.uiLabel("suggested", locationRoot.host.language) + " "
          + suggestion.country + ": "
          + Model.methodLabel(suggestion.id, locationRoot.host.language)
      }
      color: locationRoot.host.faint
      font.family: locationRoot.host.nameFontFamily
      font.pixelSize: Style.font.caption
      elide: Text.ElideRight
    }

    Row {
      id: suggestionButtons
      anchors.right: parent.right
      anchors.verticalCenter: parent.verticalCenter
      spacing: Style.space(3)

      Button {
        text: Model.uiLabel("apply", locationRoot.host.language)
        bordered: true
        foreground: locationRoot.host.foreground
        background: "transparent"
        fontFamily: locationRoot.host.nameFontFamily
        fontSize: Style.font.caption
        verticalPadding: Style.space(2)
        onClicked: locationRoot.host.applySuggestedMethod()
      }

      Button {
        text: "×"
        tooltipText: Model.uiLabel("dismiss", locationRoot.host.language)
        foreground: locationRoot.host.faint
        background: "transparent"
        fontFamily: locationRoot.host.fontFamily
        fontSize: Style.font.bodySmall
        horizontalPadding: Style.space(5)
        verticalPadding: Style.space(2)
        onClicked: locationRoot.host.dismissMethodSuggestion()
      }
    }
  }

  TextField {
    id: cityField

    width: parent.width
    placeholderText: Model.uiLabel("citySearch", locationRoot.host.language)
    foreground: locationRoot.host.foreground
    font.family: locationRoot.host.nameFontFamily
    font.pixelSize: Style.font.bodySmall

    // While the field owns the keys, the panel's own single-letter shortcuts
    // would otherwise eat every character typed into it.
    onActiveFocusChanged: locationRoot.host.keysBlocked = activeFocus
    onTextChanged: locationRoot.runSearch()

    Keys.onReturnPressed: function(event) {
      if (locationRoot.host.locationChoices.length > 0)
        locationRoot.host.commitLocation(locationRoot.host.locationChoices[0])
      event.accepted = true
    }
    Keys.onEscapePressed: function(event) {
      cityField.text = ""
      cityField.focus = false
      event.accepted = true
    }
  }

  Text {
    visible: text !== ""
    width: parent.width
    text: locationRoot.host.searchingLocation
      ? Model.uiLabel("searching", locationRoot.host.language)
      : locationRoot.host.locationStatus
    color: locationRoot.host.faint
    font.family: locationRoot.host.nameFontFamily
    font.pixelSize: Style.font.caption
    wrapMode: Text.WordWrap
  }

  Column {
    id: choiceList

    width: parent.width
    spacing: 0

    Repeater {
      model: locationRoot.host.locationChoices

      Rectangle {
        id: choiceRow

        required property var modelData

        width: choiceList.width
        height: Style.space(34)
        radius: Style.cornerRadius
        color: choiceMouse.containsMouse
          ? Util.alpha(locationRoot.host.foreground, 0.10)
          : "transparent"

        Text {
          id: choiceName
          anchors.left: parent.left
          anchors.leftMargin: Style.space(6)
          anchors.right: choiceZone.left
          anchors.rightMargin: Style.space(8)
          anchors.top: parent.top
          anchors.topMargin: Style.space(4)
          text: choiceRow.modelData.name
          color: locationRoot.host.foreground
          font.family: locationRoot.host.nameFontFamily
          font.pixelSize: Style.font.bodySmall
          elide: Text.ElideRight
        }

        Text {
          anchors.left: choiceName.left
          anchors.right: choiceName.right
          anchors.top: choiceName.bottom
          text: choiceRow.modelData.region
          color: locationRoot.host.faint
          font.family: locationRoot.host.nameFontFamily
          font.pixelSize: Style.font.caption
          elide: Text.ElideRight
        }

        // The zone is shown because it is the part the user cannot infer from
        // the name, and two same-named cities can sit in different zones.
        Text {
          id: choiceZone
          anchors.right: parent.right
          anchors.rightMargin: Style.space(6)
          anchors.verticalCenter: parent.verticalCenter
          text: choiceRow.modelData.timezone
          color: locationRoot.host.faint
          font.family: locationRoot.host.fontFamily
          font.pixelSize: Style.font.caption
        }

        MouseArea {
          id: choiceMouse
          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: locationRoot.host.commitLocation(choiceRow.modelData)
        }
      }
    }
  }
}
