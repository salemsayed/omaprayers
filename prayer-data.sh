#!/bin/bash

# Fetch and normalize a two-month AlAdhan calendar for the QML widget.
# All comparisons use ISO-8601 instants; human-readable clocks remain in the
# configured location's timezone.

set -uo pipefail
umask 077

latitude=""
longitude=""
timezone=""
location_label=""
method="5"
school="0"
latitude_adjustment="3"
midnight_mode="0"
hijri_adjustment="0"
tune="0,0,0,0,0,0,0,0,0"
shafaq="general"
method_settings=""
refresh_hours="24"
force="false"

fail() {
  jq -cn --arg error "$*" '{schemaVersion: 1, ok: false, status: "error", error: $error}'
  exit 1
}

need_value() {
  (( $# >= 2 )) || fail "missing value for $1"
}

while (( $# > 0 )); do
  case "$1" in
    --latitude) need_value "$@"; latitude="$2"; shift 2 ;;
    --longitude) need_value "$@"; longitude="$2"; shift 2 ;;
    --timezone) need_value "$@"; timezone="$2"; shift 2 ;;
    --location-label) need_value "$@"; location_label="$2"; shift 2 ;;
    --method) need_value "$@"; method="$2"; shift 2 ;;
    --school) need_value "$@"; school="$2"; shift 2 ;;
    --latitude-adjustment) need_value "$@"; latitude_adjustment="$2"; shift 2 ;;
    --midnight-mode) need_value "$@"; midnight_mode="$2"; shift 2 ;;
    --hijri-adjustment) need_value "$@"; hijri_adjustment="$2"; shift 2 ;;
    --tune) need_value "$@"; tune="$2"; shift 2 ;;
    --shafaq) need_value "$@"; shafaq="$2"; shift 2 ;;
    --method-settings) need_value "$@"; method_settings="$2"; shift 2 ;;
    --refresh-hours) need_value "$@"; refresh_hours="$2"; shift 2 ;;
    --force) force="true"; shift ;;
    *) fail "unknown argument: $1" ;;
  esac
done

jq -en --arg value "$latitude" '
  ($value | tonumber?) as $number
  | $number != null and $number >= -90 and $number <= 90
' >/dev/null || fail "latitude must be between -90 and 90"

jq -en --arg value "$longitude" '
  ($value | tonumber?) as $number
  | $number != null and $number >= -180 and $number <= 180
' >/dev/null || fail "longitude must be between -180 and 180"

[[ $timezone =~ ^[A-Za-z0-9][A-Za-z0-9._+-]*(/[A-Za-z0-9._+-]+)*$ ]] \
  && [[ $timezone != *".."* ]] \
  && [[ -f "/usr/share/zoneinfo/$timezone" ]] \
  || fail "timezone must be a valid IANA timezone installed under /usr/share/zoneinfo"

if [[ ! $method =~ ^[0-9]+$ ]] || (( method < 0 || method > 99 )); then
  fail "method must be an integer from 0 to 99"
fi
[[ $school == "0" || $school == "1" ]] || fail "school must be 0 or 1"
[[ $latitude_adjustment =~ ^[123]$ ]] || fail "latitude adjustment must be 1, 2, or 3"
[[ $midnight_mode == "0" || $midnight_mode == "1" ]] || fail "midnight mode must be 0 or 1"
if [[ ! $hijri_adjustment =~ ^-?[0-9]+$ ]] \
    || (( hijri_adjustment < -2 || hijri_adjustment > 2 )); then
  fail "Hijri adjustment must be between -2 and 2"
fi
if [[ ! $refresh_hours =~ ^[0-9]+$ ]] || (( refresh_hours < 1 || refresh_hours > 168 )); then
  fail "refresh interval must be between 1 and 168 hours"
fi
[[ $shafaq == "general" || $shafaq == "ahmer" || $shafaq == "abyad" ]] \
  || fail "shafaq must be general, ahmer, or abyad"

jq -en --arg value "$tune" '
  ($value | split(",")) as $parts
  | ($parts | length) == 9
    and all($parts[]; test("^-?[0-9]+$") and ((tonumber) >= -60 and (tonumber) <= 60))
' >/dev/null || fail "tune must contain nine comma-separated minute offsets between -60 and 60"

if [[ $method == "99" && -z $method_settings ]]; then
  fail "method 99 requires custom method settings"
fi
if [[ $method != "99" && -n $method_settings ]]; then
  fail "custom method settings require method 99"
fi
if [[ -n $method_settings ]]; then
  jq -en --arg value "$method_settings" '
    ($value | split(",")) as $parts
    | ($parts | length) == 3
      and all($parts[]; . == "" or . == "null" or (tonumber? != null))
  ' >/dev/null || fail "custom method settings must contain three comma-separated numbers or null values"
fi

state_home="${XDG_STATE_HOME:-$HOME/.local/state}"
state_dir="$state_home/omarchy/io.github.salemsayed.omaprayers"
current_file="$state_dir/current.json"
lock_file="$state_dir/fetch.lock"
mkdir -p "$state_dir" || fail "could not create prayer state directory"
chmod 700 "$state_dir" || fail "could not secure prayer state directory"

config_json=$(jq -cn \
  --arg locationLabel "${location_label:-Prayer location}" \
  --argjson latitude "$latitude" \
  --argjson longitude "$longitude" \
  --arg timezone "$timezone" \
  --argjson method "$method" \
  --argjson school "$school" \
  --argjson latitudeAdjustmentMethod "$latitude_adjustment" \
  --argjson midnightMode "$midnight_mode" \
  --argjson hijriAdjustment "$hijri_adjustment" \
  --arg tune "$tune" \
  --arg shafaq "$shafaq" \
  --arg methodSettings "$method_settings" \
  '{
    locationLabel: $locationLabel,
    latitude: $latitude,
    longitude: $longitude,
    timezone: $timezone,
    method: $method,
    school: $school,
    latitudeAdjustmentMethod: $latitudeAdjustmentMethod,
    midnightMode: $midnightMode,
    hijriAdjustment: $hijriAdjustment,
    tune: $tune,
    shafaq: $shafaq,
    methodSettings: $methodSettings
  }') || fail "could not build configuration"

fingerprint=$(printf '%s' "$config_json" | sha256sum | cut -d' ' -f1)
cache_file="$state_dir/cache-$fingerprint.json"

today=$(TZ="$timezone" date +%F) || fail "could not resolve date in $timezone"
tomorrow=$(TZ="$timezone" date -d "$today +1 day" +%F) || fail "could not resolve tomorrow"
next_refresh_at=$(TZ="$timezone" date -d "$tomorrow 00:00" --iso-8601=seconds) \
  || fail "could not resolve next midnight"
now_epoch=$(date +%s)

cache_has_window() {
  [[ -f $cache_file ]] || return 1
  jq -e \
    --arg fingerprint "$fingerprint" \
    --arg today "$today" \
    --arg tomorrow "$tomorrow" '
      def mandatory_timings_are_valid:
        all([.timings.Fajr.at, .timings.Dhuhr.at, .timings.Asr.at,
             .timings.Maghrib.at, .timings.Isha.at][];
          type == "string"
          and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([+-][0-9]{2}:[0-9]{2}|Z)$"));
      .schemaVersion == 1
      and .ok == true
      and .configFingerprint == $fingerprint
      and (.days | type == "array")
      and any(.days[]; .date == $today)
      and any(.days[]; .date == $tomorrow)
      and all(.days[] | select(.date == $today or .date == $tomorrow);
        mandatory_timings_are_valid)
    ' "$cache_file" >/dev/null 2>&1
}

publish() {
  local source_file="$1"
  local output_file
  output_file=$(mktemp "$state_dir/.current.XXXXXX") || fail "could not create state file"
  cp "$source_file" "$output_file" || {
    rm -f -- "$output_file"
    fail "could not stage state file"
  }
  mv "$output_file" "$current_file" || {
    rm -f -- "$output_file"
    fail "could not publish state file"
  }
  cat "$current_file"
}

serve_cache() {
  local status="$1"
  local error_message="${2:-}"
  local served_file
  served_file=$(mktemp "$state_dir/.served.XXXXXX") || fail "could not create cache response"
  jq \
    --arg status "$status" \
    --arg error "$error_message" \
    --arg today "$today" \
    --arg tomorrow "$tomorrow" \
    --arg nextRefreshAt "$next_refresh_at" \
    --argjson servedAtEpoch "$now_epoch" '
      .ok = true
      | .status = $status
      | .error = $error
      | .today = $today
      | .tomorrow = $tomorrow
      | .nextRefreshAt = $nextRefreshAt
      | .servedAtEpoch = $servedAtEpoch
    ' "$cache_file" >"$served_file" || fail "cached schedule is invalid"
  publish "$served_file"
  rm -f -- "$served_file"
  exit 0
}

# One network worker serves every monitor. A waiter re-checks the cache after
# acquiring the lock, so duplicate widget instances do not duplicate requests.
exec 9>"$lock_file"
flock -w 45 9 || {
  if cache_has_window; then serve_cache "stale" "another refresh is still running"; fi
  fail "timed out waiting for prayer data refresh"
}

if cache_has_window && [[ $force != "true" ]]; then
  fetched_epoch=$(jq -r '.fetchedAtEpoch // 0' "$cache_file" 2>/dev/null)
  if [[ $fetched_epoch =~ ^[0-9]+$ ]] && (( now_epoch - fetched_epoch < refresh_hours * 3600 )); then
    serve_cache "cached" ""
  fi
fi

work_dir=$(mktemp -d "$state_dir/.fetch.XXXXXX") || fail "could not create fetch directory"
cleanup() {
  rm -rf -- "$work_dir"
}
trap cleanup EXIT

fetch_month() {
  local year="$1"
  local month="$2"
  local destination="$3"
  local url="https://api.aladhan.com/v1/calendar/$year/$month"
  local args=(
    curl -fsS --retry 2 --retry-all-errors --retry-delay 1
    --connect-timeout 5 --max-time 25 --get "$url"
    --data-urlencode "latitude=$latitude"
    --data-urlencode "longitude=$longitude"
    --data-urlencode "timezonestring=$timezone"
    --data-urlencode "method=$method"
    --data-urlencode "school=$school"
    --data-urlencode "latitudeAdjustmentMethod=$latitude_adjustment"
    --data-urlencode "midnightMode=$midnight_mode"
    --data-urlencode "adjustment=$hijri_adjustment"
    --data-urlencode "tune=$tune"
    --data-urlencode "shafaq=$shafaq"
    --data-urlencode "iso8601=true"
  )
  if [[ $method == "99" && -n $method_settings ]]; then
    args+=(--data-urlencode "methodSettings=$method_settings")
  fi
  "${args[@]}" >"$destination"
  jq -e '.code == 200 and (.data | type == "array") and (.data | length) >= 28' \
    "$destination" >/dev/null 2>&1
}

year=${today%%-*}
month_day=${today#*-}
month=${month_day%%-*}
next_month_date=$(TZ="$timezone" date -d "$year-$month-01 +1 month" +%F) \
  || fail "could not resolve next month"
next_year=${next_month_date%%-*}
next_month_day=${next_month_date#*-}
next_month=${next_month_day%%-*}

network_error=""
fetch_month "$year" "$month" "$work_dir/current-month.json" \
  || network_error="could not fetch the current prayer calendar"
if [[ -z $network_error ]]; then
  fetch_month "$next_year" "$next_month" "$work_dir/next-month.json" \
    || network_error="could not fetch the next prayer calendar"
fi

if [[ -n $network_error ]]; then
  if cache_has_window; then serve_cache "stale" "$network_error"; fi
  fail "$network_error and no matching cache is available"
fi

fetched_at=$(date --iso-8601=seconds)
normalized_file="$work_dir/normalized.json"

jq -s \
  --argjson config "$config_json" \
  --arg fingerprint "$fingerprint" \
  --arg today "$today" \
  --arg tomorrow "$tomorrow" \
  --arg nextRefreshAt "$next_refresh_at" \
  --arg fetchedAt "$fetched_at" \
  --argjson fetchedAtEpoch "$now_epoch" '
    def clean:
      tostring | sub(" \\([^)]*\\)$"; "");
    def clock($raw):
      if ($raw | test("T[0-9]{2}:[0-9]{2}"))
      then ($raw | capture("T(?<clock>[0-9]{2}:[0-9]{2})").clock)
      else ($raw[0:5])
      end;
    def timing($name):
      (.timings[$name] // "" | clean) as $raw
      | {
          at: (if ($raw | test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([+-][0-9]{2}:[0-9]{2}|Z)$")) then $raw else null end),
          time: clock($raw)
        };
    def date_key:
      (.date.gregorian.date | split("-")) as $parts
      | ($parts[2] + "-" + $parts[1] + "-" + $parts[0]);
    def normalized_day:
      {
        date: date_key,
        readableDate: (.date.readable // ""),
        weekday: (.date.gregorian.weekday.en // ""),
        timezone: (.meta.timezone // $config.timezone),
        methodName: (.meta.method.name // ""),
        hijri: {
          day: (.date.hijri.day // ""),
          month: (.date.hijri.month.en // ""),
          monthAr: (.date.hijri.month.ar // ""),
          year: (.date.hijri.year // ""),
          weekday: (.date.hijri.weekday.en // ""),
          weekdayAr: (.date.hijri.weekday.ar // ""),
          display: ((.date.hijri.day // "") + " " + (.date.hijri.month.en // "") + " " + (.date.hijri.year // "") + " AH"),
          displayAr: ((.date.hijri.day // "") + " " + (.date.hijri.month.ar // "") + " " + (.date.hijri.year // "") + " هـ")
        },
        timings: {
          Imsak: timing("Imsak"),
          Fajr: timing("Fajr"),
          Sunrise: timing("Sunrise"),
          Dhuhr: timing("Dhuhr"),
          Asr: timing("Asr"),
          Sunset: timing("Sunset"),
          Maghrib: timing("Maghrib"),
          Isha: timing("Isha"),
          Midnight: timing("Midnight"),
          Firstthird: timing("Firstthird"),
          Lastthird: timing("Lastthird")
        }
      };
    {
      schemaVersion: 1,
      ok: true,
      status: "fresh",
      error: "",
      provider: "AlAdhan",
      endpoint: "https://api.aladhan.com/v1/calendar",
      configFingerprint: $fingerprint,
      config: $config,
      today: $today,
      tomorrow: $tomorrow,
      nextRefreshAt: $nextRefreshAt,
      fetchedAt: $fetchedAt,
      fetchedAtEpoch: $fetchedAtEpoch,
      servedAtEpoch: $fetchedAtEpoch,
      days: ([.[].data[] | normalized_day] | unique_by(.date) | sort_by(.date))
    }
  ' "$work_dir/current-month.json" "$work_dir/next-month.json" >"$normalized_file" \
  || fail "could not normalize the prayer calendar"

jq -e \
  --arg today "$today" \
  --arg tomorrow "$tomorrow" '
    (.days | any(.date == $today))
    and (.days | any(.date == $tomorrow))
    and all(.days[];
      all([.timings.Fajr.at, .timings.Dhuhr.at, .timings.Asr.at, .timings.Maghrib.at, .timings.Isha.at][];
        type == "string" and length > 0))
  ' "$normalized_file" >/dev/null || {
    if cache_has_window; then serve_cache "stale" "provider returned incomplete ISO-8601 timings"; fi
    fail "provider returned incomplete ISO-8601 timings"
  }

cache_stage=$(mktemp "$state_dir/.cache.XXXXXX") || fail "could not stage prayer cache"
cp "$normalized_file" "$cache_stage" || {
  rm -f -- "$cache_stage"
  fail "could not copy prayer cache"
}
mv "$cache_stage" "$cache_file" || {
  rm -f -- "$cache_stage"
  fail "could not publish prayer cache"
}
publish "$cache_file"
