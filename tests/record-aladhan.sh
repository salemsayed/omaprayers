#!/bin/bash

# Refresh the compact AlAdhan snapshots used by the offline oracle test.

set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
fixture_parent="$root/tests/fixtures"
fixture_dir="$fixture_parent/aladhan"
base_url="https://api.aladhan.com/v1"
user_agent="OmaPrayers-tests (+https://github.com/salemsayed/omaprayers)"
request_count=0

mkdir -p "$fixture_parent"
staging=$(mktemp -d "$fixture_parent/.aladhan.XXXXXX")
cleanup() {
  rm -rf -- "$staging"
}
trap cleanup EXIT
mkdir -p "$staging/calendar" "$staging/hijri"

fail_response() {
  local message="$1"
  local response_file="${2:-}"
  echo "record-aladhan: $message" >&2
  if [[ -n $response_file && -s $response_file ]]; then
    jq -c . "$response_file" >&2 2>/dev/null || head -c 1000 "$response_file" >&2
    echo >&2
  fi
  exit 1
}

fetch() {
  local endpoint="$1"
  local output="$2"
  shift 2
  local raw="$staging/response.json"
  local status
  local curl_args=(
    --silent --show-error --location --retry 2
    --user-agent "$user_agent"
    --output "$raw" --write-out '%{http_code}' --get "$base_url$endpoint"
  )
  local pair

  for pair in "$@"; do
    curl_args+=(--data-urlencode "$pair")
  done
  if (( request_count > 0 )); then
    sleep 0.25
  fi
  request_count=$((request_count + 1))
  status=$(curl "${curl_args[@]}") \
    || fail_response "request failed for $endpoint" "$raw"
  [[ $status == 200 ]] \
    || fail_response "HTTP $status for $endpoint" "$raw"
  jq -e '.code == 200' "$raw" >/dev/null \
    || fail_response "provider code was not 200 for $endpoint" "$raw"
  cp "$raw" "$output"
}

record_methods() {
  local raw="$staging/methods.raw.json"
  fetch "/methods" "$raw"
  jq -c '{request: {endpoint: "/v1/methods", query: {}}, data: .data}' \
    "$raw" >"$staging/methods.json"
  rm -f -- "$raw"
}

record_calendar() {
  local slug="$1"
  local year="$2"
  local month="$3"
  local latitude="$4"
  local longitude="$5"
  local timezone="$6"
  local method="$7"
  local school="${8:-0}"
  local latitude_rule="${9:-3}"
  local midnight_mode="${10:-0}"
  local adjustment="${11:-0}"
  local tune="${12:-0,0,0,0,0,0,0,0,0}"
  local shafaq="${13:-general}"
  local method_settings="${14:-}"
  local endpoint="/calendar/$year/$((10#$month))"
  local raw="$staging/calendar/$slug.raw.json"
  local output="$staging/calendar/$slug.json"
  local query
  local parameters=(
    "latitude=$latitude"
    "longitude=$longitude"
    "method=$method"
    "school=$school"
    "latitudeAdjustmentMethod=$latitude_rule"
    "midnightMode=$midnight_mode"
    "adjustment=$adjustment"
    "tune=$tune"
    "shafaq=$shafaq"
    "iso8601=true"
    "timezonestring=$timezone"
  )

  if [[ -n $method_settings ]]; then
    parameters+=("methodSettings=$method_settings")
  fi
  query=$(jq -cn \
    --arg latitude "$latitude" --arg longitude "$longitude" \
    --arg method "$method" --arg school "$school" \
    --arg latitudeAdjustmentMethod "$latitude_rule" \
    --arg midnightMode "$midnight_mode" --arg adjustment "$adjustment" \
    --arg tune "$tune" --arg shafaq "$shafaq" --arg iso8601 "true" \
    --arg timezonestring "$timezone" --arg methodSettings "$method_settings" '
    {
      latitude: $latitude,
      longitude: $longitude,
      method: $method,
      school: $school,
      latitudeAdjustmentMethod: $latitudeAdjustmentMethod,
      midnightMode: $midnightMode,
      adjustment: $adjustment,
      tune: $tune,
      shafaq: $shafaq,
      iso8601: $iso8601,
      timezonestring: $timezonestring
    } + (if $methodSettings == "" then {} else {methodSettings: $methodSettings} end)
  ')
  fetch "$endpoint" "$raw" "${parameters[@]}"
  jq -c --arg endpoint "/v1$endpoint" --argjson query "$query" '
    {
      request: {endpoint: $endpoint, query: $query},
      data: [
        .data[] | {
          date: {
            gregorian: {date: .date.gregorian.date},
            hijri: {date: .date.hijri.date}
          },
          timings: .timings,
          meta: {
            offset: .meta.offset,
            latitudeAdjustmentMethod: .meta.latitudeAdjustmentMethod,
            timezone: .meta.timezone
          }
        }
      ]
    }
  ' "$raw" >"$output"
  rm -f -- "$raw"
  echo "recorded calendar/$slug.json" >&2
}

record_hijri() {
  local dates=(
    20-08-2026 16-06-2026 18-02-2026 01-03-2025 07-07-2024 04-01-2030
    15-01-1930 30-06-1935 29-02-1940 02-09-1945 31-12-1950
    18-04-1955 01-07-1960 12-11-1965 21-03-1970 09-08-1975
    29-02-1980 05-10-1985 01-01-1990 17-05-1995 29-02-2000
    14-09-2005 01-12-2010 18-06-2015 29-02-2020 31-12-2023
    29-02-2028 10-07-2035 03-11-2040 20-01-2045 16-06-2050
    31-12-2055 29-02-2060 25-08-2065 12-04-2070 16-11-2077
  )
  local rows="$staging/hijri/rows.jsonl"
  local date_value endpoint raw
  : >"$rows"
  for date_value in "${dates[@]}"; do
    endpoint="/gToH/$date_value"
    raw="$staging/hijri/response.json"
    fetch "$endpoint" "$raw" "calendarMethod=UAQ"
    jq -c --arg endpoint "/v1$endpoint" '
      {
        request: {endpoint: $endpoint, query: {calendarMethod: "UAQ"}},
        gregorian: .data.gregorian.date,
        hijri: {
          date: .data.hijri.date,
          day: .data.hijri.day,
          month: .data.hijri.month.number,
          year: .data.hijri.year
        }
      }
    ' "$raw" >>"$rows"
  done
  jq -cs '{data: .}' "$rows" >"$staging/hijri/gToH.json"
  rm -f -- "$rows" "$staging/hijri/response.json"
  echo "recorded hijri/gToH.json" >&2
}

record_methods

# Unspecified matrix months use August 2026, a stable mid-year baseline.
record_calendar cairo-egypt-2026-04 2026 04 30.0444 31.2357 Africa/Cairo 5
record_calendar cairo-egypt-2026-10 2026 10 30.0444 31.2357 Africa/Cairo 5
record_calendar cairo-egypt-2026-12 2026 12 30.0444 31.2357 Africa/Cairo 5
record_calendar cairo-egypt-2027-01 2027 01 30.0444 31.2357 Africa/Cairo 5
record_calendar cairo-egypt-hanafi-2026-08 2026 08 30.0444 31.2357 Africa/Cairo 5 1
record_calendar cairo-egypt-tuned-2026-08 2026 08 30.0444 31.2357 Africa/Cairo 5 0 3 0 0 5,3,5,7,9,-1,0,8,-6
record_calendar cairo-custom-2026-08 2026 08 30.0444 31.2357 Africa/Cairo 99 0 3 0 0 0,0,0,0,0,0,0,0,0 general 18,null,17
record_calendar makkah-uaq-2026-02 2026 02 21.4225 39.8262 Asia/Riyadh 4
record_calendar makkah-uaq-2026-03 2026 03 21.4225 39.8262 Asia/Riyadh 4
record_calendar riyadh-uaq-2026-08 2026 08 24.7136 46.6753 Asia/Riyadh 4
record_calendar dubai-2026-08 2026 08 25.2048 55.2708 Asia/Dubai 16
record_calendar doha-qatar-2026-08 2026 08 25.2854 51.531 Asia/Riyadh 10
record_calendar kuwait-2026-08 2026 08 29.3759 47.9774 Asia/Kuwait 9
record_calendar manama-gulf-2026-08 2026 08 26.2235 50.5876 Asia/Bahrain 8
record_calendar amman-jordan-2026-08 2026 08 31.9539 35.9106 Asia/Amman 23
record_calendar istanbul-diyanet-2026-08 2026 08 41.0082 28.9784 Europe/Istanbul 13
record_calendar tunis-2026-08 2026 08 36.8065 10.1815 Africa/Tunis 18
record_calendar algiers-2026-08 2026 08 36.7538 3.0588 Africa/Algiers 19
record_calendar casablanca-morocco-2026-08 2026 08 33.5731 -7.5898 Africa/Casablanca 21
record_calendar lisbon-2026-08 2026 08 38.7223 -9.1393 Europe/Lisbon 22
record_calendar paris-uoif-2026-08 2026 08 48.8566 2.3522 Europe/Paris 12
record_calendar london-moonsighting-general-2026-08 2026 08 51.5074 -0.1278 Europe/London 15 0 3 0 0 0,0,0,0,0,0,0,0,0 general
record_calendar london-moonsighting-ahmer-2026-08 2026 08 51.5074 -0.1278 Europe/London 15 0 3 0 0 0,0,0,0,0,0,0,0,0 ahmer
record_calendar london-moonsighting-abyad-2026-08 2026 08 51.5074 -0.1278 Europe/London 15 0 3 0 0 0,0,0,0,0,0,0,0,0 abyad
record_calendar london-mwl-2026-08 2026 08 51.5074 -0.1278 Europe/London 3
record_calendar moscow-russia-2026-08 2026 08 55.7558 37.6173 Europe/Moscow 14
record_calendar karachi-2026-08 2026 08 24.8607 67.0011 Asia/Karachi 1
record_calendar delhi-karachi-hanafi-2026-08 2026 08 28.6139 77.209 Asia/Kolkata 1 1
record_calendar kuala-lumpur-jakim-2026-08 2026 08 3.139 101.6869 Asia/Kuala_Lumpur 17
record_calendar jakarta-kemenag-2026-08 2026 08 -6.2088 106.8456 Asia/Jakarta 20
record_calendar singapore-muis-2026-08 2026 08 1.3521 103.8198 Asia/Singapore 11
record_calendar tehran-2026-08 2026 08 35.6892 51.389 Asia/Tehran 7 0 3 1
record_calendar qum-jafari-2026-08 2026 08 34.6416 50.8746 Asia/Tehran 0
record_calendar new-york-isna-2026-03 2026 03 40.7128 -74.006 America/New_York 2
record_calendar new-york-isna-2026-11 2026 11 40.7128 -74.006 America/New_York 2
record_calendar los-angeles-isna-2026-08 2026 08 34.0522 -118.2437 America/Los_Angeles 2
record_calendar honolulu-isna-2026-08 2026 08 21.3069 -157.8583 Pacific/Honolulu 2
record_calendar sydney-mwl-2026-12 2026 12 -33.8688 151.2093 Australia/Sydney 3
record_calendar cape-town-mwl-2026-08 2026 08 -33.9249 18.4241 Africa/Johannesburg 3
record_calendar buenos-aires-mwl-2026-08 2026 08 -34.6037 -58.3816 America/Argentina/Buenos_Aires 3
record_calendar nairobi-mwl-2026-08 2026 08 -1.2921 36.8219 Africa/Nairobi 3
record_calendar quito-mwl-2026-08 2026 08 -0.1807 -78.4678 America/Guayaquil 3
record_calendar kiritimati-mwl-2026-01 2026 01 1.8721 -157.4278 Pacific/Kiritimati 3
record_calendar apia-mwl-2026-12 2026 12 -13.8507 -171.7514 Pacific/Apia 3
record_calendar urumqi-shanghai-mwl-2028-02 2028 02 43.8256 87.6168 Asia/Shanghai 3
record_calendar urumqi-local-mwl-2028-02 2028 02 43.8256 87.6168 Asia/Urumqi 3
record_calendar oslo-mwl-middle-2026-06 2026 06 59.9139 10.7522 Europe/Oslo 3 0 1
record_calendar oslo-mwl-seventh-2026-06 2026 06 59.9139 10.7522 Europe/Oslo 3 0 2
record_calendar oslo-mwl-angle-2026-06 2026 06 59.9139 10.7522 Europe/Oslo 3 0 3
record_calendar oslo-mwl-middle-2026-12 2026 12 59.9139 10.7522 Europe/Oslo 3 0 1
record_calendar oslo-mwl-seventh-2026-12 2026 12 59.9139 10.7522 Europe/Oslo 3 0 2
record_calendar oslo-mwl-angle-2026-12 2026 12 59.9139 10.7522 Europe/Oslo 3 0 3
record_calendar stockholm-mwl-2026-08 2026 08 59.3293 18.0686 Europe/Stockholm 3
record_calendar edinburgh-moonsighting-2026-08 2026 08 55.9533 -3.1883 Europe/London 15
record_calendar reykjavik-mwl-2026-06 2026 06 64.1466 -21.9426 Atlantic/Reykjavik 3
record_calendar tromso-mwl-2026-06 2026 06 69.6492 18.9553 Europe/Oslo 3
record_calendar tromso-moonsighting-2026-06 2026 06 69.6492 18.9553 Europe/Oslo 15
record_calendar tromso-mwl-2026-12 2026 12 69.6492 18.9553 Europe/Oslo 3
record_calendar tromso-moonsighting-2026-12 2026 12 69.6492 18.9553 Europe/Oslo 15
record_calendar anchorage-isna-2026-08 2026 08 61.2181 -149.9003 America/Anchorage 2

record_hijri

rm -f -- "$staging/response.json"
rm -rf -- "$fixture_dir"
mv "$staging" "$fixture_dir"
trap - EXIT
echo "recorded $request_count AlAdhan requests in $fixture_dir" >&2
