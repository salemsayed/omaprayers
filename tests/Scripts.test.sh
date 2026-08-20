#!/bin/bash

set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
test_root=$(mktemp -d)
trap 'rm -rf -- "$test_root"' EXIT
export XDG_STATE_HOME="$test_root/state"
state_dir="$XDG_STATE_HOME/omarchy/io.github.salemsayed.omaprayers"
mkdir -p "$state_dir"

epoch() {
  date -u -d "$1" +%s
}

invalid_count=0
assert_invalid() {
  local expected="$1"
  local output
  shift
  invalid_count=$((invalid_count + 1))
  output="$test_root/invalid-$invalid_count.json"
  if "$root/prayer-zone.sh" "$@" >"$output"; then
    echo "invalid zone configuration unexpectedly passed: $*" >&2
    exit 1
  fi
  jq -e --arg expected "$expected" '
    .schemaVersion == 2 and .ok == false and .status == "error"
    and (.error | contains($expected))
  ' "$output" >/dev/null
}

assert_invalid "timezone"
assert_invalid "missing value" --timezone
assert_invalid "timezone" --timezone ../etc/passwd
assert_invalid "timezone" --timezone Not/AZone
assert_invalid "timezone" --timezone "Africa/Cairo bad"
assert_invalid "days" --timezone UTC --days 2
assert_invalid "days" --timezone UTC --days 401
assert_invalid "days" --timezone UTC --days nope
assert_invalid "now" --timezone UTC --now -1
assert_invalid "now" --timezone UTC --now nope
assert_invalid "unknown argument" --timezone UTC --unknown value

touch "$state_dir/cache-old.json" "$state_dir/cache-second.json" \
  "$state_dir/current.json" "$state_dir/fetch.lock" "$state_dir/keep-me"

window_now=$(epoch "2026-01-02T12:00:00Z")
run_zone() {
  local name="$1"
  local timezone="$2"
  local output="$test_root/$name.json"
  "$root/prayer-zone.sh" --timezone "$timezone" --days 370 --now "$window_now" >"$output"
  jq -e --arg timezone "$timezone" --argjson now "$window_now" '
    .schemaVersion == 2 and .ok == true and .timezone == $timezone
    and .nowEpoch == $now and (.today | test("^[0-9]{4}-[0-9]{2}-[0-9]{2}$"))
    and (.tomorrow | test("^[0-9]{4}-[0-9]{2}-[0-9]{2}$"))
    and (.days | length) == 370
    and ([.days[].start] == ([.days[].start] | sort))
    and ([.offsets[].at] == ([.offsets[].at] | sort))
    and all(.offsets[]; (.offset | type) == "number" and (.abbreviation | type) == "string")
  ' "$output" >/dev/null
  printf '%s\n' "$output"
}

cairo=$(run_zone cairo Africa/Cairo)
jq -e \
  --argjson spring "$(epoch "2026-04-23T22:00:00Z")" \
  --argjson autumn "$(epoch "2026-10-29T21:00:00Z")" '
  any(.offsets[]; .at == $spring and .offset == 10800 and .abbreviation == "EEST")
  and any(.offsets[]; .at == $autumn and .offset == 7200 and .abbreviation == "EET")
' "$cairo" >/dev/null

london=$(run_zone london Europe/London)
jq -e \
  --argjson spring "$(epoch "2026-03-29T01:00:00Z")" \
  --argjson autumn "$(epoch "2026-10-25T01:00:00Z")" '
  any(.offsets[]; .at == $spring and .offset == 3600)
  and any(.offsets[]; .at == $autumn and .offset == 0)
' "$london" >/dev/null

new_york=$(run_zone new-york America/New_York)
jq -e \
  --argjson spring "$(epoch "2026-03-08T07:00:00Z")" \
  --argjson autumn "$(epoch "2026-11-01T06:00:00Z")" '
  any(.offsets[]; .at == $spring and .offset == -14400)
  and any(.offsets[]; .at == $autumn and .offset == -18000)
' "$new_york" >/dev/null

lord_howe=$(run_zone lord-howe Australia/Lord_Howe)
jq -e \
  --argjson autumn "$(epoch "2026-04-04T15:00:00Z")" \
  --argjson spring "$(epoch "2026-10-03T15:30:00Z")" '
  any(.offsets[]; .at == $autumn and .offset == 37800)
  and any(.offsets[]; .at == $spring and .offset == 39600)
' "$lord_howe" >/dev/null

kiritimati=$(run_zone kiritimati Pacific/Kiritimati)
jq -e '.offsets == [{at: .days[0].start, offset: 50400, abbreviation: "+14"}]' \
  "$kiritimati" >/dev/null

chatham=$(run_zone chatham Pacific/Chatham)
jq -e \
  --argjson autumn "$(epoch "2026-04-04T14:00:00Z")" \
  --argjson spring "$(epoch "2026-09-26T14:00:00Z")" '
  any(.offsets[]; .at == $autumn and .offset == 45900)
  and any(.offsets[]; .at == $spring and .offset == 49500)
' "$chatham" >/dev/null

st_johns=$(run_zone st-johns America/St_Johns)
jq -e \
  --argjson spring "$(epoch "2026-03-08T05:30:00Z")" \
  --argjson autumn "$(epoch "2026-11-01T04:30:00Z")" '
  any(.offsets[]; .at == $spring and .offset == -9000)
  and any(.offsets[]; .at == $autumn and .offset == -12600)
' "$st_johns" >/dev/null

utc=$(run_zone utc UTC)
jq -e '.offsets == [{at: .days[0].start, offset: 0, abbreviation: "UTC"}]' "$utc" >/dev/null

[[ $(stat -c '%a' "$state_dir") == 700 ]]
[[ -f $state_dir/keep-me ]]
[[ ! -e $state_dir/cache-old.json ]]
[[ ! -e $state_dir/cache-second.json ]]
[[ ! -e $state_dir/current.json ]]
[[ ! -e $state_dir/fetch.lock ]]

new_year_now=$(epoch "2026-12-31T23:30:00Z")
new_year_kiritimati="$test_root/new-year-kiritimati.json"
"$root/prayer-zone.sh" --timezone Pacific/Kiritimati --days 3 --now "$new_year_now" \
  >"$new_year_kiritimati"
jq -e --argjson now "$new_year_now" '
  .nowEpoch == $now and .today == "2027-01-01" and .tomorrow == "2027-01-02"
  and .days[0].date == "2026-12-31"
' "$new_year_kiritimati" >/dev/null

new_year_honolulu="$test_root/new-year-honolulu.json"
"$root/prayer-zone.sh" --timezone Pacific/Honolulu --days 3 --now "$new_year_now" \
  >"$new_year_honolulu"
jq -e --argjson now "$new_year_now" '
  .nowEpoch == $now and .today == "2026-12-31" and .tomorrow == "2027-01-01"
  and .days[0].date == "2026-12-30"
' "$new_year_honolulu" >/dev/null

function omarchy-notification-send {
  [[ $1 != "FAIL" ]] || return 1
  printf '%s|%s' "$1" "${2:-}"
}
export -f omarchy-notification-send

if "$root/prayer-notify.sh" "" "empty" "key" >/dev/null; then
  echo "empty notification key unexpectedly passed" >&2
  exit 1
fi

event_key="script-test-event"
first=$("$root/prayer-notify.sh" "$event_key" "Fajr in 10 minutes" "Scheduled for 04:47")
duplicate=$("$root/prayer-notify.sh" "$event_key" "duplicate" "must not appear")
[[ $first == "Fajr in 10 minutes|Scheduled for 04:47" ]]
[[ -z $duplicate ]]

retry_key="script-test-retry"
if "$root/prayer-notify.sh" "$retry_key" "FAIL" "body" >/dev/null; then
  echo "failed notification unexpectedly passed" >&2
  exit 1
fi
retry=$("$root/prayer-notify.sh" "$retry_key" "It is time for Fajr" "04:47")
[[ $retry == "It is time for Fajr|04:47" ]]
[[ $(<"$state_dir/last-notification") == "$retry_key" ]]
[[ $(stat -c '%a' "$state_dir/last-notification") == 600 ]]

echo "Script tests passed (validation, provider, cache, concurrency, notifications)"
