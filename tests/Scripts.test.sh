#!/bin/bash

set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
test_home=$(mktemp -d)
trap 'rm -rf -- "$test_home"' EXIT

export HOME="$test_home"

invalid_output="$test_home/invalid.json"
if "$root/prayer-data.sh" \
  --latitude 200 \
  --longitude 31.2357 \
  --timezone Africa/Cairo \
  --location-label Cairo >"$invalid_output"; then
  echo "invalid latitude unexpectedly passed" >&2
  exit 1
fi
jq -e '.ok == false and (.error | contains("latitude"))' "$invalid_output" >/dev/null

function omarchy-notification-send {
  [[ $1 != "FAIL" ]] || return 1
  printf '%s|%s' "$1" "${2:-}"
}
export -f omarchy-notification-send

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

echo "Script tests passed"
