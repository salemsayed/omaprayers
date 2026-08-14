#!/bin/bash

set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
test_root=$(mktemp -d)
trap 'rm -rf -- "$test_root"' EXIT

fake_bin="$test_root/bin"
fixture_dir="$test_root/fixtures"
mkdir -p "$fake_bin" "$fixture_dir"
ln -s "$root/tests/fake-curl.sh" "$fake_bin/curl"
export FAKE_CALENDAR_DIR="$fixture_dir"
export FAKE_CURL_LOG="$test_root/curl.log"
export XDG_STATE_HOME="$test_root/state"

base_args=(
  --latitude 30.0444
  --longitude 31.2357
  --timezone Africa/Cairo
  --location-label Cairo
)

assert_invalid() {
  local expected="$1"
  shift
  local output="$test_root/invalid-$RANDOM.json"
  if "$root/prayer-data.sh" "${base_args[@]}" "$@" >"$output"; then
    echo "invalid configuration unexpectedly passed: $*" >&2
    exit 1
  fi
  jq -e --arg expected "$expected" \
    '.ok == false and (.error | contains($expected))' "$output" >/dev/null
}

assert_invalid "latitude" --latitude 200
assert_invalid "latitude" --latitude nope
assert_invalid "longitude" --longitude -181
assert_invalid "timezone" --timezone ../etc/passwd
assert_invalid "timezone" --timezone Not/AZone
assert_invalid "method" --method 100
assert_invalid "school" --school 2
assert_invalid "latitude adjustment" --latitude-adjustment 0
assert_invalid "midnight mode" --midnight-mode 2
assert_invalid "Hijri adjustment" --hijri-adjustment 3
assert_invalid "refresh interval" --refresh-hours 0
assert_invalid "shafaq" --shafaq blue
assert_invalid "nine comma-separated" --tune 0,0,0
assert_invalid "between -60 and 60" --tune 61,0,0,0,0,0,0,0,0
assert_invalid "custom method settings require" --method-settings 18,null,17
assert_invalid "method 99 requires" --method 99
assert_invalid "three comma-separated" --method 99 --method-settings 18,17
assert_invalid "unknown argument" --unknown value

missing_output="$test_root/missing.json"
if "$root/prayer-data.sh" --latitude >"$missing_output"; then
  echo "missing option value unexpectedly passed" >&2
  exit 1
fi
jq -e '.ok == false and (.error | contains("missing value"))' "$missing_output" >/dev/null

# Single-component IANA identifiers are valid too.
utc_output="$test_root/utc.json"
FAKE_CURL_MODE=fail PATH="$fake_bin:$PATH" "$root/prayer-data.sh" \
  --latitude 0 --longitude 0 --timezone UTC --location-label UTC >"$utc_output" || true
jq -e '.error | contains("no matching cache")' "$utc_output" >/dev/null

make_fixture() {
  local year="$1"
  local month="$2"
  local next_month last_day days day_number iso_date gregorian_date
  next_month=$(date -d "$year-$month-01 +1 month" +%F)
  last_day=$(date -d "$next_month -1 day" +%d)
  days=$((10#$last_day))

  for day_number in $(seq 1 "$days"); do
    iso_date=$(printf '%04d-%02d-%02d' "$year" "$((10#$month))" "$day_number")
    gregorian_date=$(printf '%02d-%02d-%04d' "$day_number" "$((10#$month))" "$year")
    jq -cn \
      --arg iso "$iso_date" \
      --arg gregorian "$gregorian_date" '
      {
        timings: {
          Imsak: ($iso + "T04:37:00+03:00"),
          Fajr: ($iso + "T04:47:00+03:00"),
          Sunrise: ($iso + "T06:22:00+03:00"),
          Dhuhr: ($iso + "T13:00:00+03:00"),
          Asr: ($iso + "T16:37:00+03:00"),
          Sunset: ($iso + "T19:37:00+03:00"),
          Maghrib: ($iso + "T19:37:00+03:00"),
          Isha: ($iso + "T21:01:00+03:00"),
          Midnight: ($iso + "T00:12:00+03:00"),
          Firstthird: ($iso + "T22:46:00+03:00"),
          Lastthird: ($iso + "T02:57:00+03:00")
        },
        date: {
          readable: $iso,
          gregorian: { date: $gregorian, weekday: { en: "Friday" } },
          hijri: {
            day: "1", year: "1448",
            month: { en: "Safar", ar: "صَفَر" },
            weekday: { en: "Al Juma ah", ar: "الجمعة" }
          }
        },
        meta: { timezone: "Africa/Cairo", method: { name: "Egyptian General Authority of Survey" } }
      }'
  done | jq -s '{code: 200, status: "OK", data: .}' >"$fixture_dir/$year-$month.json"
}

today=$(TZ=Africa/Cairo date +%F)
current_year=${today%%-*}
month_day=${today#*-}
current_month=${month_day%%-*}
next_month_date=$(TZ=Africa/Cairo date -d "$current_year-$current_month-01 +1 month" +%F)
next_year=${next_month_date%%-*}
next_month_day=${next_month_date#*-}
next_month=${next_month_day%%-*}
make_fixture "$current_year" "$current_month"
make_fixture "$next_year" "$next_month"
truncate -s 0 "$FAKE_CURL_LOG"

fresh_output="$test_root/fresh.json"
PATH="$fake_bin:$PATH" "$root/prayer-data.sh" "${base_args[@]}" >"$fresh_output"
jq -e --arg today "$today" '
  .ok == true and .status == "fresh" and .today == $today
  and (.days | length) >= 59
  and all(.days[]; .timings.Fajr.at | test("[+]03:00$"))
  and all(.days[]; .hijri.displayAr == "1 صَفَر 1448 هـ")
' "$fresh_output" >/dev/null

state_dir="$XDG_STATE_HOME/omarchy/prayer-times/salemsayed.prayer-times"
[[ $(stat -c '%a' "$state_dir") == 700 ]]
[[ $(stat -c '%a' "$state_dir/current.json") == 600 ]]
[[ $(wc -l <"$FAKE_CURL_LOG") == 2 ]]

cached_output="$test_root/cached.json"
PATH="$fake_bin:$PATH" "$root/prayer-data.sh" "${base_args[@]}" >"$cached_output"
jq -e '.ok == true and .status == "cached" and .error == ""' "$cached_output" >/dev/null
[[ $(wc -l <"$FAKE_CURL_LOG") == 2 ]]

stale_output="$test_root/stale.json"
FAKE_CURL_MODE=fail PATH="$fake_bin:$PATH" \
  "$root/prayer-data.sh" "${base_args[@]}" --force >"$stale_output"
jq -e '.ok == true and .status == "stale" and (.error | contains("could not fetch"))' \
  "$stale_output" >/dev/null

# A corrupt cache is never served as usable stale data.
cache_file=$(find "$state_dir" -maxdepth 1 -name 'cache-*.json' -print -quit)
jq '.days[] |= if .date == .date then (.timings.Fajr.at = null) else . end' \
  "$cache_file" >"$test_root/corrupt-cache.json"
mv "$test_root/corrupt-cache.json" "$cache_file"
corrupt_output="$test_root/corrupt.json"
if FAKE_CURL_MODE=fail PATH="$fake_bin:$PATH" \
  "$root/prayer-data.sh" "${base_args[@]}" --force >"$corrupt_output"; then
  echo "corrupt cache unexpectedly served" >&2
  exit 1
fi
jq -e '.ok == false and (.error | contains("no matching cache"))' "$corrupt_output" >/dev/null

# Provider envelopes that are short, malformed, or missing mandatory times fail closed.
for mode in short invalid-json incomplete; do
  scenario_state="$test_root/provider-$mode"
  output="$test_root/provider-$mode.json"
  if XDG_STATE_HOME="$scenario_state" FAKE_CURL_MODE="$mode" PATH="$fake_bin:$PATH" \
    "$root/prayer-data.sh" "${base_args[@]}" >"$output"; then
    echo "provider mode $mode unexpectedly passed" >&2
    exit 1
  fi
  jq -e '.ok == false and (.error | type == "string" and length > 0)' "$output" >/dev/null
done

custom_output="$test_root/custom-method.json"
XDG_STATE_HOME="$test_root/custom-state" FAKE_CURL_LOG="$test_root/custom-curl.log" \
  PATH="$fake_bin:$PATH" "$root/prayer-data.sh" "${base_args[@]}" \
  --method 99 --method-settings 18,null,17 >"$custom_output"
jq -e '
  .ok == true and .status == "fresh"
  and .config.method == 99 and .config.methodSettings == "18,null,17"
' "$custom_output" >/dev/null

# Two monitor instances serialize refreshes and only one fetches both months.
concurrent_state="$test_root/concurrent-state"
concurrent_log="$test_root/concurrent-curl.log"
XDG_STATE_HOME="$concurrent_state" FAKE_CURL_LOG="$concurrent_log" FAKE_CURL_DELAY=0.2 \
  PATH="$fake_bin:$PATH" "$root/prayer-data.sh" "${base_args[@]}" >"$test_root/concurrent-1.json" &
first_pid=$!
XDG_STATE_HOME="$concurrent_state" FAKE_CURL_LOG="$concurrent_log" FAKE_CURL_DELAY=0.2 \
  PATH="$fake_bin:$PATH" "$root/prayer-data.sh" "${base_args[@]}" >"$test_root/concurrent-2.json" &
second_pid=$!
wait "$first_pid" "$second_pid"
[[ $(wc -l <"$concurrent_log") == 2 ]]
jq -s -e 'map(.status) | sort == ["cached", "fresh"]' \
  "$test_root/concurrent-1.json" "$test_root/concurrent-2.json" >/dev/null

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
