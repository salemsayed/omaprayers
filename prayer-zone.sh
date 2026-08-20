#!/bin/bash

# Emit the local-day and UTC-offset window used by the offline prayer engine.

set -uo pipefail
umask 077

timezone=""
days="70"
now_epoch=""

fail() {
  jq -cn --arg error "$*" '{schemaVersion: 2, ok: false, status: "error", error: $error}'
  exit 1
}

need_value() {
  (( $# >= 2 )) || fail "missing value for $1"
}

while (( $# > 0 )); do
  case "$1" in
    --timezone) need_value "$@"; timezone="$2"; shift 2 ;;
    --days) need_value "$@"; days="$2"; shift 2 ;;
    --now) need_value "$@"; now_epoch="$2"; shift 2 ;;
    *) fail "unknown argument: $1" ;;
  esac
done

if ! [[ $timezone =~ ^[A-Za-z0-9][A-Za-z0-9._+-]*(/[A-Za-z0-9._+-]+)*$ ]] \
  || [[ $timezone == *".."* ]] \
  || [[ ! -f "/usr/share/zoneinfo/$timezone" ]]; then
  fail "timezone must be a valid IANA timezone installed under /usr/share/zoneinfo"
fi
if [[ ! $days =~ ^[0-9]+$ ]] || (( 10#$days < 3 || 10#$days > 400 )); then
  fail "days must be an integer from 3 to 400"
fi
if [[ -z $now_epoch ]]; then
  now_epoch=$(date +%s) || fail "could not read the current time"
fi
[[ $now_epoch =~ ^[0-9]+$ ]] || fail "now must be epoch seconds written as digits"
days=$((10#$days))
now_epoch=$((10#$now_epoch))

state_home="${XDG_STATE_HOME:-$HOME/.local/state}"
state_dir="$state_home/omarchy/io.github.salemsayed.omaprayers"
mkdir -p "$state_dir" || fail "could not create prayer state directory"
chmod 700 "$state_dir" || fail "could not secure prayer state directory"
rm -f -- "$state_dir"/cache-*.json "$state_dir/current.json" "$state_dir/fetch.lock" \
  || fail "could not remove legacy prayer cache files"

today=$(TZ="$timezone" date -d "@$now_epoch" +%F) || fail "could not resolve today in $timezone"

civil_shift() {
  local date_value="$1"
  local day_count="$2"
  local noon_epoch
  noon_epoch=$(date -u -d "$date_value 12:00 UTC" +%s) || return 1
  date -u -d "@$((noon_epoch + day_count * 86400))" +%F
}

tomorrow=$(civil_shift "$today" 1) || fail "could not resolve tomorrow"

day_start() {
  local date_value="$1"
  local hour_value start_value
  for hour_value in 00 01 02 03 04 05 06; do
    if start_value=$(TZ="$timezone" date -d "$date_value $hour_value:00" +%s 2>/dev/null); then
      printf '%s\n' "$start_value"
      return 0
    fi
  done
  return 1
}

work_dir=$(mktemp -d) || fail "could not create timezone work directory"
cleanup() {
  rm -rf -- "$work_dir"
}
trap cleanup EXIT
days_file="$work_dir/days.jsonl"
offsets_file="$work_dir/offsets.jsonl"
zdump_file="$work_dir/zdump.txt"
: >"$days_file"
: >"$offsets_file"

first_date=""
last_date=""
first_start=""
for (( day_index = -1; day_index < days - 1; day_index++ )); do
  date_value=$(civil_shift "$today" "$day_index") \
    || fail "could not resolve timezone day"
  start_value=$(day_start "$date_value") \
    || fail "could not resolve start of $date_value"
  jq -cn --arg date "$date_value" --argjson start "$start_value" \
    '{date: $date, start: $start}' >>"$days_file" || fail "could not build timezone days"
  [[ -n $first_date ]] || first_date="$date_value"
  [[ -n $first_start ]] || first_start="$start_value"
  last_date="$date_value"
done
window_end_date=$(civil_shift "$last_date" 1) \
  || fail "could not resolve the end date of the timezone window"
window_end=$(day_start "$window_end_date") \
  || fail "could not resolve the end of the timezone window"

offset_text=$(TZ="$timezone" date -d "@$first_start" +%z) \
  || fail "could not resolve initial UTC offset"
offset_sign=1
[[ ${offset_text:0:1} == "-" ]] && offset_sign=-1
offset_hours=$((10#${offset_text:1:2}))
offset_minutes=$((10#${offset_text:3:2}))
first_offset=$((offset_sign * (offset_hours * 3600 + offset_minutes * 60)))
first_abbreviation=$(TZ="$timezone" date -d "@$first_start" +%Z) \
  || fail "could not resolve initial timezone abbreviation"
jq -cn --argjson at "$first_start" --argjson offset "$first_offset" \
  --arg abbreviation "$first_abbreviation" \
  '{at: $at, offset: $offset, abbreviation: $abbreviation}' >>"$offsets_file" \
  || fail "could not build initial UTC offset"

first_year=${first_date%%-*}
last_year=${last_date%%-*}
zdump -v -c "$first_year,$((10#$last_year + 1))" "$timezone" >"$zdump_file" \
  || fail "could not inspect timezone transitions"
while IFS= read -r transition_line; do
  [[ $transition_line == *"gmtime failed"* ]] && continue
  [[ $transition_line == *"localtime failed"* ]] && continue
  [[ $transition_line == *"NULL"* ]] && continue
  read -r zone_name _ ut_month ut_day ut_clock ut_year ut_marker equals_marker \
    _ _ _ _ _ abbreviation _ gmtoff_field _ <<<"$transition_line"
  [[ $zone_name == "$timezone" && $ut_marker == "UT" && $equals_marker == "=" ]] || continue
  [[ $ut_year =~ ^[0-9]{4}$ && $gmtoff_field == gmtoff=* ]] || continue
  transition_at=$(date -u -d "$ut_month $ut_day $ut_clock $ut_year" +%s 2>/dev/null) || continue
  (( transition_at >= first_start && transition_at < window_end )) || continue
  transition_offset=${gmtoff_field#gmtoff=}
  [[ $transition_offset =~ ^-?[0-9]+$ ]] || continue
  jq -cn --argjson at "$transition_at" --argjson offset "$transition_offset" \
    --arg abbreviation "$abbreviation" \
    '{at: $at, offset: $offset, abbreviation: $abbreviation}' >>"$offsets_file" \
    || fail "could not build timezone transition"
done <"$zdump_file"

jq -cn --arg timezone "$timezone" --argjson nowEpoch "$now_epoch" \
  --arg today "$today" --arg tomorrow "$tomorrow" \
  --slurpfile days "$days_file" --slurpfile offsets "$offsets_file" '
  {
    schemaVersion: 2,
    ok: true,
    timezone: $timezone,
    nowEpoch: $nowEpoch,
    today: $today,
    tomorrow: $tomorrow,
    days: $days,
    offsets: ($offsets | sort_by(.at))
  }
' || fail "could not build timezone response"
