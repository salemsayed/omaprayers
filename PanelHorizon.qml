import QtQuick
import qs.Commons
import qs.Ui
import "Model.js" as Model

Column {
  id: horizonRoot

  property var host
  readonly property var firstSegment: host.daySegments.length > 0 ? host.daySegments[0] : null
  readonly property var longestSegment: {
    var longest = null
    for (var i = 0; i < host.daySegments.length; i++) {
      if (!longest || host.daySegments[i].length > longest.length)
        longest = host.daySegments[i]
    }
    return longest
  }
  readonly property real cycleMinutes: firstSegment
    ? firstSegment.start + host.dayFraction * 1440
    : 0
  readonly property var fajrTiming: Model.timing(host.todayDay, "Fajr")
  readonly property real nightNowFraction: {
    if (!firstSegment || host.nightBand === null) return -1
    if (cycleMinutes < host.nightBand.start || cycleMinutes > host.nightBand.end) return -1
    return Math.max(0, Math.min(1,
      (cycleMinutes - host.nightBand.start) / host.nightBand.span
    ))
  }

  width: parent ? parent.width : 0
  spacing: Style.space(9)

  // Fraction-based x positions do not inherit LayoutMirroring, so mirror them here.
  function place(fraction, itemWidth) {
    return host.isArabic ? width - fraction * width - itemWidth : fraction * width
  }

  function containsNow(segment) {
    return firstSegment !== null && cycleMinutes >= segment.start && cycleMinutes < segment.end
  }

  function isPast(segment) {
    return firstSegment !== null && segment.end <= cycleMinutes
  }

  function nightLabelText(name, includeClock) {
    var result = Model.label(name, host.language)
    if (!includeClock) return result
    var value = Model.timing(host.todayDay, name)
    return value ? result + " " + Model.formatClock(value.time, host.timeFormat) : result
  }

  Item {
    width: parent.width
    height: Math.max(heroLead.implicitHeight, countdownText.implicitHeight)

    Column {
      id: heroLead
      anchors.left: parent.left
      anchors.right: countdownText.left
      anchors.rightMargin: Style.space(12)
      anchors.verticalCenter: parent.verticalCenter
      spacing: Style.space(3)

      Text {
        width: parent.width
        text: {
          var label = host.isArabic ? "التالي" : "NEXT"
          if (host.nextPrayer && host.todayDay
              && host.nextPrayer.date !== host.todayDay.date)
            label += host.isArabic ? " غدًا" : " · TOMORROW"
          return label
        }
        color: host.faint
        font.family: host.nameFontFamily
        font.pixelSize: Style.font.caption
        font.letterSpacing: 1.5
        elide: Text.ElideRight
      }

      Row {
        width: parent.width
        spacing: Style.space(8)

        Text {
          id: heroPrayerName
          width: Math.min(implicitWidth,
            parent.width - heroClock.implicitWidth - parent.spacing)
          text: host.nextPrayer
            ? Model.label(host.nextPrayer.name, host.language)
            : (host.isArabic ? "مواقيت الصلاة" : "Prayer Times")
          color: host.foreground
          font.family: host.nameFontFamily
          font.pixelSize: Style.font.title
          font.bold: true
          elide: Text.ElideRight
        }

        Text {
          id: heroClock
          text: host.nextPrayer
            ? Model.formatClock(host.nextPrayer.time, host.timeFormat)
            : ""
          color: host.dim
          font.family: host.fontFamily
          font.pixelSize: Style.font.body
        }
      }
    }

    Text {
      id: countdownText
      anchors.right: parent.right
      anchors.verticalCenter: parent.verticalCenter
      text: host.nextPrayer
        ? Model.remaining(host.nextPrayer, host.nowTick, host.language)
        : ""
      color: Color.accent
      font.family: host.nameFontFamily
      font.pixelSize: Style.font.display
      font.bold: true
    }
  }

  Rectangle {
    id: dayStrip

    visible: host.daySegments.length > 0
    width: parent.width
    height: Style.space(38)
    radius: Style.cornerRadius
    color: Util.alpha(host.foreground, 0)
    border.width: 1
    border.color: Util.alpha(host.foreground, 0.15)
    clip: true

    Repeater {
      model: host.daySegments

      Rectangle {
        id: stripSegment

        required property var modelData
        readonly property bool isNight: modelData.name === "Maghrib"
          || modelData.name === "Isha"
        readonly property bool isCurrent: horizonRoot.containsNow(modelData)

        x: horizonRoot.place(
          (modelData.start - horizonRoot.firstSegment.start) / 1440, width
        )
        width: dayStrip.width * modelData.length / 1440
        height: dayStrip.height
        color: isCurrent
          ? Util.alpha(Color.accent, 0.16)
          : (isNight
            ? Util.alpha(host.foreground, 0.11)
            : Util.alpha(host.foreground, 0.06))

        Canvas {
          anchors.fill: parent
          visible: stripSegment.isNight

          property color hatchColor: Util.alpha(host.foreground, 0.14)
          property real step: Style.space(6)

          onPaint: {
            var ctx = getContext("2d")
            ctx.reset()
            ctx.strokeStyle = hatchColor
            ctx.lineWidth = 1
            for (var lineX = -height; lineX < width; lineX += step) {
              ctx.beginPath()
              ctx.moveTo(lineX, height)
              ctx.lineTo(lineX + height, 0)
              ctx.stroke()
            }
          }
          onWidthChanged: requestPaint()
          onHeightChanged: requestPaint()
          onHatchColorChanged: requestPaint()
        }

        Rectangle {
          anchors.left: parent.left
          width: 1
          height: parent.height
          color: Util.alpha(host.foreground, 0.16)
        }

        Text {
          visible: stripSegment.width > Style.space(host.isArabic ? 52 : 46)
          anchors.left: parent.left
          anchors.leftMargin: Style.space(5)
          anchors.verticalCenter: parent.verticalCenter
          width: parent.width - Style.space(10)
          text: {
            var value = Model.label(stripSegment.modelData.name, host.language)
            return host.isArabic ? value : value.toUpperCase()
          }
          color: stripSegment.isCurrent ? host.foreground : host.dim
          font.family: host.nameFontFamily
          font.pixelSize: Style.font.caption
          font.bold: stripSegment.isCurrent
          elide: Text.ElideRight
        }
      }
    }

    Rectangle {
      id: dayNeedle

      x: horizonRoot.place(host.dayFraction, width)
      width: Style.space(2)
      height: parent.height
      color: Color.accent

      Behavior on x {
        NumberAnimation { duration: 400 }
      }

      Rectangle {
        anchors.top: parent.top
        anchors.topMargin: -Style.space(3)
        anchors.horizontalCenter: parent.horizontalCenter
        width: Style.space(6)
        height: Style.space(6)
        color: Color.accent
        rotation: 45
      }
    }
  }

  Item {
    visible: host.daySegments.length > 0
    width: parent.width
    height: visible ? Math.max(scaleStart.implicitHeight, scaleTitle.implicitHeight) : 0

    Text {
      id: scaleStart
      anchors.left: parent.left
      anchors.verticalCenter: parent.verticalCenter
      text: horizonRoot.fajrTiming
        ? Model.formatClock(horizonRoot.fajrTiming.time, host.timeFormat)
        : ""
      color: host.faint
      font.family: host.fontFamily
      font.pixelSize: Style.font.caption
    }

    Text {
      id: scaleTitle
      anchors.centerIn: parent
      text: host.isArabic ? "طول النوافذ" : "WINDOW LENGTHS"
      color: host.faint
      font.family: host.nameFontFamily
      font.pixelSize: Style.font.caption
      font.letterSpacing: 1.1
    }

    Text {
      anchors.right: parent.right
      anchors.verticalCenter: parent.verticalCenter
      text: scaleStart.text
      color: host.faint
      font.family: host.fontFamily
      font.pixelSize: Style.font.caption
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
    visible: host.daySegments.length > 0
    width: parent.width
    height: Style.spacing.hairline
    color: Util.alpha(host.foreground, 0.16)
  }

  Column {
    id: dayTable

    visible: host.daySegments.length > 0
    width: parent.width
    spacing: 0

    Repeater {
      model: host.daySegments

      Item {
        id: tableRow

        required property var modelData
        readonly property bool isCurrent: horizonRoot.containsNow(modelData)
        readonly property bool isNext: host.nextPrayer !== null && host.todayDay !== null
          && host.nextPrayer.name === modelData.name
          && host.nextPrayer.date === host.todayDay.date
        readonly property bool past: horizonRoot.isPast(modelData)
        readonly property var imsakTiming: modelData.name === "Fajr"
          ? Model.timing(host.todayDay, "Imsak")
          : null
        readonly property color tone: isNext ? Color.accent
          : (isCurrent ? host.foreground : (past ? host.faint : host.foreground))

        width: dayTable.width
        height: Style.space(23)

        Item {
          id: tableNameSlot
          anchors.left: parent.left
          anchors.right: tableClock.left
          anchors.rightMargin: Style.space(8)
          anchors.top: parent.top
          anchors.bottom: parent.bottom

          Text {
            id: tableName
            anchors.left: parent.left
            anchors.verticalCenter: parent.verticalCenter
            width: Math.min(implicitWidth,
              parent.width - (imsakText.visible ? imsakText.implicitWidth + Style.space(5) : 0))
            text: Model.label(tableRow.modelData.name, host.language)
            color: tableRow.tone
            font.family: host.nameFontFamily
            font.pixelSize: Style.font.bodySmall
            font.bold: tableRow.isCurrent || tableRow.isNext
            elide: Text.ElideRight
          }

          Text {
            id: imsakText
            visible: tableRow.imsakTiming !== null
            anchors.left: tableName.right
            anchors.leftMargin: Style.space(5)
            anchors.baseline: tableName.baseline
            text: {
              if (!tableRow.imsakTiming) return ""
              var prefix = host.isArabic ? "إمساك" : "imsak"
              return prefix + " "
                + Model.formatClock(tableRow.imsakTiming.time, host.timeFormat)
            }
            color: host.faint
            font.family: host.nameFontFamily
            font.pixelSize: Style.font.caption
            elide: Text.ElideRight
          }
        }

        Text {
          id: tableClock
          anchors.right: windowSlot.left
          anchors.rightMargin: Style.space(9)
          anchors.verticalCenter: parent.verticalCenter
          width: Style.space(54)
          text: Model.formatClock(tableRow.modelData.value.time, host.timeFormat)
          color: tableRow.tone
          font.family: host.fontFamily
          font.pixelSize: Style.font.bodySmall
          font.bold: tableRow.isCurrent || tableRow.isNext
          horizontalAlignment: Text.AlignRight
        }

        Item {
          id: windowSlot
          anchors.right: tableDuration.left
          anchors.rightMargin: Style.space(9)
          anchors.verticalCenter: parent.verticalCenter
          width: tableRow.width * 0.22
          height: Style.space(3)

          Rectangle {
            anchors.fill: parent
            radius: 2
            color: Util.alpha(host.foreground, 0.13)

            Rectangle {
              width: horizonRoot.longestSegment
                ? parent.width * tableRow.modelData.length / horizonRoot.longestSegment.length
                : 0
              height: parent.height
              radius: 2
              color: tableRow.isCurrent
                ? Color.accent
                : Util.alpha(host.foreground, 0.42)
            }
          }
        }

        Text {
          id: tableDuration
          anchors.right: parent.right
          anchors.verticalCenter: parent.verticalCenter
          width: Style.space(58)
          text: Model.windowLabel(tableRow.modelData, host.language)
          color: host.faint
          font.family: host.nameFontFamily
          font.pixelSize: Style.font.caption
          horizontalAlignment: Text.AlignRight
          elide: Text.ElideNone
        }
      }
    }
  }

  Column {
    visible: host.daySegments.length > 0 && host.nightBand !== null
    width: parent.width
    spacing: Style.space(4)

    Rectangle {
      id: nightBand

      width: parent.width
      height: Style.space(15)
      radius: Style.cornerRadius
      color: Util.alpha(host.foreground, 0.06)
      border.width: 1
      border.color: Util.alpha(host.foreground, 0.15)
      clip: true

      Canvas {
        anchors.fill: parent

        property color hatchColor: Util.alpha(host.foreground, 0.14)
        property real step: Style.space(6)

        onPaint: {
          var ctx = getContext("2d")
          ctx.reset()
          ctx.strokeStyle = hatchColor
          ctx.lineWidth = 1
          for (var lineX = -height; lineX < width; lineX += step) {
            ctx.beginPath()
            ctx.moveTo(lineX, height)
            ctx.lineTo(lineX + height, 0)
            ctx.stroke()
          }
        }
        onWidthChanged: requestPaint()
        onHeightChanged: requestPaint()
        onHatchColorChanged: requestPaint()
      }

      Repeater {
        model: host.nightBand ? host.nightBand.marks : []

        Rectangle {
          required property var modelData

          x: horizonRoot.place(modelData.fraction, width)
          width: 1
          height: nightBand.height
          color: Util.alpha(host.foreground, 0.45)
        }
      }

      Rectangle {
        visible: horizonRoot.nightNowFraction >= 0
        x: horizonRoot.place(horizonRoot.nightNowFraction, width)
        width: Style.space(2)
        height: parent.height
        color: Color.accent
      }
    }

    Row {
      id: nightLabels

      readonly property real fillerWidth: Math.max(0, (width
        - maghribLabel.implicitWidth - firstThirdLabel.implicitWidth
        - lastThirdLabel.implicitWidth - fajrLabel.implicitWidth) / 3)

      width: parent.width
      spacing: 0

      Text {
        id: maghribLabel
        text: horizonRoot.nightLabelText("Maghrib", false)
        color: host.faint
        font.family: host.nameFontFamily
        font.pixelSize: Style.font.caption
      }

      Item { width: nightLabels.fillerWidth; height: 1 }

      Text {
        id: firstThirdLabel
        text: horizonRoot.nightLabelText("Firstthird", true)
        color: host.faint
        font.family: host.nameFontFamily
        font.pixelSize: Style.font.caption
      }

      Item { width: nightLabels.fillerWidth; height: 1 }

      Text {
        id: lastThirdLabel
        text: horizonRoot.nightLabelText("Lastthird", true)
        color: host.faint
        font.family: host.nameFontFamily
        font.pixelSize: Style.font.caption
      }

      Item { width: nightLabels.fillerWidth; height: 1 }

      Text {
        id: fajrLabel
        text: horizonRoot.nightLabelText("Fajr", false)
        color: host.faint
        font.family: host.nameFontFamily
        font.pixelSize: Style.font.caption
      }
    }
  }

  Rectangle {
    width: parent.width
    height: Style.spacing.hairline
    color: Util.alpha(host.foreground, 0.16)
  }

  Text {
    width: parent.width
    text: host.footerText
    color: host.faint
    font.family: host.fontFamily
    font.pixelSize: Style.font.caption
    wrapMode: Text.WordWrap
  }
}
