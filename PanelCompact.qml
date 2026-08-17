import QtQuick
import qs.Commons
import qs.Ui
import "Model.js" as Model

Column {
  id: compactRoot

  property var host
  readonly property string leaderDots: "························································································································"

  width: parent ? parent.width : 0
  spacing: Style.space(10)

  Rectangle {
    width: parent.width
    height: Style.spacing.hairline * 2
    color: Util.alpha(host.foreground, 0.10)

    Rectangle {
      anchors.left: parent.left
      width: parent.width * host.dayFraction
      height: parent.height
      color: Color.accent
      opacity: 0.85

      Behavior on width {
        NumberAnimation { duration: 400 }
      }
    }
  }

  Item {
    width: parent.width
    height: Math.max(locationText.implicitHeight, shortDateText.implicitHeight)

    Text {
      id: locationText
      anchors.left: parent.left
      anchors.right: shortDateText.left
      anchors.rightMargin: Style.space(10)
      anchors.baseline: shortDateText.baseline
      text: host.isArabic ? host.displayLocation : host.displayLocation.toUpperCase()
      color: host.foreground
      font.family: host.nameFontFamily
      font.pixelSize: Style.font.bodySmall
      font.bold: true
      font.letterSpacing: 1.4
      elide: Text.ElideRight
    }

    Text {
      id: shortDateText
      anchors.right: parent.right
      anchors.verticalCenter: parent.verticalCenter
      text: {
        if (!host.todayDay || !host.todayDay.date) return ""
        var parts = String(host.todayDay.date).split("-")
        if (parts.length < 3) return ""
        var stamp = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        if (isNaN(stamp.getTime())) return ""
        var formatted = stamp.toLocaleDateString(
          Qt.locale(host.isArabic ? "ar_EG" : "en_US"), "ddd d MMM"
        )
        formatted = Model.latinDigits(formatted)
        return host.isArabic ? formatted : formatted.toUpperCase()
      }
      color: host.faint
      font.family: host.nameFontFamily
      font.pixelSize: Style.font.caption
    }
  }

  Text {
    visible: host.hijriText !== ""
    width: parent.width
    text: host.hijriText
    color: host.faint
    font.family: host.nameFontFamily
    font.pixelSize: Style.font.caption
    elide: Text.ElideRight
  }

  Item {
    width: parent.width
    height: Style.space(3)

    Rectangle {
      anchors.top: parent.top
      width: parent.width
      height: Style.spacing.hairline
      color: Util.alpha(host.foreground, 0.42)
    }

    Rectangle {
      anchors.bottom: parent.bottom
      width: parent.width
      height: Style.spacing.hairline
      color: Util.alpha(host.foreground, 0.16)
    }
  }

  Column {
    visible: host.prayerRows.length > 0
    width: parent.width
    spacing: 0

    Repeater {
      model: host.prayerRows

      Item {
        id: prayerRow

        required property var modelData
        readonly property bool isNext: host.nextPrayer !== null && host.todayDay !== null
          && host.nextPrayer.name === modelData.name
          && host.nextPrayer.date === host.todayDay.date
        readonly property bool isCurrent: !isNext && host.currentPrayer !== null && host.todayDay !== null
          && host.currentPrayer.name === modelData.name
          && host.currentPrayer.date === host.todayDay.date
        readonly property double prayerEpoch: new Date(modelData.value.at).getTime()
        readonly property bool isPast: !isNext && !isCurrent && isFinite(prayerEpoch)
          && prayerEpoch <= host.nowTick.getTime()
        readonly property color tone: isNext ? Color.accent
          : (isPast ? host.faint : host.foreground)

        width: parent.width
        height: Style.space(25)

        Item {
          id: prayerGutter
          anchors.left: parent.left
          anchors.top: parent.top
          anchors.bottom: parent.bottom
          width: Style.space(13)

          Rectangle {
            visible: prayerRow.isCurrent
            anchors.centerIn: parent
            width: Style.space(5)
            height: Style.space(5)
            color: host.foreground
          }

          Rectangle {
            visible: prayerRow.isNext
            anchors.centerIn: parent
            width: Style.space(2)
            height: Style.space(13)
            color: Color.accent
          }
        }

        Text {
          id: prayerName
          anchors.left: prayerGutter.right
          anchors.baseline: prayerTime.baseline
          width: Math.min(implicitWidth, prayerRow.width * 0.34)
          text: Model.label(prayerRow.modelData.name, host.language)
          color: prayerRow.tone
          font.family: host.nameFontFamily
          font.pixelSize: Style.font.body
          font.bold: prayerRow.isNext
          elide: Text.ElideRight
        }

        Item {
          anchors.left: prayerName.right
          anchors.leftMargin: Style.space(4)
          anchors.right: prayerTime.left
          anchors.rightMargin: Style.space(4)
          anchors.top: parent.top
          anchors.bottom: parent.bottom
          clip: true

          Text {
            anchors.verticalCenter: parent.verticalCenter
            anchors.verticalCenterOffset: Style.space(4)
            text: compactRoot.leaderDots
            color: prayerRow.isNext
              ? Util.alpha(Color.accent, 0.45)
              : Util.alpha(host.foreground, 0.34)
            font.family: host.fontFamily
            font.pixelSize: Style.font.caption
            wrapMode: Text.NoWrap
          }
        }

        Text {
          id: prayerTime
          anchors.right: countdownChip.visible ? countdownChip.left : parent.right
          anchors.rightMargin: countdownChip.visible ? Style.space(5) : 0
          anchors.verticalCenter: parent.verticalCenter
          text: Model.formatClock(prayerRow.modelData.value.time, host.timeFormat)
          color: prayerRow.tone
          font.family: host.fontFamily
          font.pixelSize: Style.font.body
          font.bold: prayerRow.isNext
        }

        Rectangle {
          id: countdownChip
          visible: prayerRow.isNext
          anchors.right: parent.right
          anchors.verticalCenter: parent.verticalCenter
          width: countdownText.implicitWidth + Style.space(8)
          height: Style.space(18)
          radius: Style.cornerRadius
          color: Util.alpha(Color.accent, 0.17)

          Text {
            id: countdownText
            anchors.centerIn: parent
            text: Model.remaining(host.nextPrayer, host.nowTick, host.language)
            color: Color.accent
            font.family: host.nameFontFamily
            font.pixelSize: Style.font.caption
            font.bold: true
          }
        }
      }
    }
  }

  Item {
    id: tomorrowRow

    visible: host.tomorrowPrayerText !== ""
    width: parent.width
    height: visible ? Style.space(25) : 0

    Item {
      id: tomorrowGutter
      anchors.left: parent.left
      anchors.top: parent.top
      anchors.bottom: parent.bottom
      width: Style.space(13)

      Rectangle {
        anchors.centerIn: parent
        width: Style.space(2)
        height: Style.space(13)
        color: Color.accent
      }
    }

    Text {
      id: tomorrowTag
      anchors.left: tomorrowGutter.right
      anchors.baseline: tomorrowTime.baseline
      text: host.isArabic ? "غدًا" : "TOMORROW"
      color: Color.accent
      font.family: host.nameFontFamily
      font.pixelSize: Style.font.caption
      font.bold: true
    }

    Text {
      id: tomorrowName
      anchors.left: tomorrowTag.right
      anchors.leftMargin: Style.space(6)
      anchors.baseline: tomorrowTime.baseline
      width: Math.min(implicitWidth, tomorrowRow.width * 0.25)
      text: host.nextPrayer ? Model.label(host.nextPrayer.name, host.language) : ""
      color: Color.accent
      font.family: host.nameFontFamily
      font.pixelSize: Style.font.bodySmall
      font.bold: true
      elide: Text.ElideRight
    }

    Item {
      anchors.left: tomorrowName.right
      anchors.leftMargin: Style.space(4)
      anchors.right: tomorrowTime.left
      anchors.rightMargin: Style.space(4)
      anchors.top: parent.top
      anchors.bottom: parent.bottom
      clip: true

      Text {
        anchors.verticalCenter: parent.verticalCenter
        anchors.verticalCenterOffset: Style.space(4)
        text: compactRoot.leaderDots
        color: Util.alpha(Color.accent, 0.45)
        font.family: host.fontFamily
        font.pixelSize: Style.font.caption
        wrapMode: Text.NoWrap
      }
    }

    Text {
      id: tomorrowTime
      anchors.right: tomorrowCountdown.left
      anchors.rightMargin: Style.space(5)
      anchors.verticalCenter: parent.verticalCenter
      text: host.nextPrayer ? Model.formatClock(host.nextPrayer.time, host.timeFormat) : ""
      color: Color.accent
      font.family: host.fontFamily
      font.pixelSize: Style.font.bodySmall
      font.bold: true
    }

    Rectangle {
      id: tomorrowCountdown
      anchors.right: parent.right
      anchors.verticalCenter: parent.verticalCenter
      width: tomorrowCountdownText.implicitWidth + Style.space(8)
      height: Style.space(18)
      radius: Style.cornerRadius
      color: Util.alpha(Color.accent, 0.17)

      Text {
        id: tomorrowCountdownText
        anchors.centerIn: parent
        text: host.nextPrayer
          ? Model.remaining(host.nextPrayer, host.nowTick, host.language)
          : ""
        color: Color.accent
        font.family: host.nameFontFamily
        font.pixelSize: Style.font.caption
        font.bold: true
      }
    }
  }

  Text {
    visible: host.statusMessage !== ""
    width: parent.width
    text: host.statusMessage
    color: host.lastError !== "" && !host.schedule ? host.urgent : host.faint
    font.family: host.fontFamily
    font.pixelSize: Style.font.bodySmall
    wrapMode: Text.WordWrap
  }

  Rectangle {
    visible: host.nightRows.length > 0
    width: parent.width
    height: Style.spacing.hairline
    color: Util.alpha(host.foreground, 0.16)
  }

  Grid {
    id: nightGrid

    visible: host.nightRows.length > 0
    width: parent.width
    columns: 2
    columnSpacing: Style.space(14)
    rowSpacing: Style.space(5)

    Repeater {
      model: host.nightRows

      Item {
        id: nightCell

        required property var modelData

        width: (nightGrid.width - nightGrid.columnSpacing) / 2
        height: Math.max(nightName.implicitHeight, nightTime.implicitHeight)

        Text {
          id: nightName
          anchors.left: parent.left
          anchors.right: nightTime.left
          anchors.rightMargin: Style.space(5)
          anchors.baseline: nightTime.baseline
          text: Model.label(nightCell.modelData.name, host.language)
          color: host.faint
          font.family: host.nameFontFamily
          font.pixelSize: Style.font.caption
          elide: Text.ElideRight
        }

        Text {
          id: nightTime
          anchors.right: parent.right
          anchors.verticalCenter: parent.verticalCenter
          text: Model.formatClock(nightCell.modelData.value.time, host.timeFormat)
          color: host.faint
          font.family: host.fontFamily
          font.pixelSize: Style.font.caption
        }
      }
    }
  }

  Rectangle {
    width: parent.width
    height: Style.spacing.hairline
    color: Util.alpha(host.foreground, 0.16)
  }

  PanelDisplay {
    host: compactRoot.host
  }
}
