#!/bin/bash

set -euo pipefail

url=""
while (( $# > 0 )); do
  case "$1" in
    https://*) url="$1"; shift ;;
    --retry|--retry-delay|--connect-timeout|--max-time|--data-urlencode) shift 2 ;;
    *) shift ;;
  esac
done

[[ -n $url ]]
year_month=${url##*/calendar/}
year=${year_month%%/*}
month=${year_month##*/}
fixture=$(printf '%s/%04d-%02d.json' "$FAKE_CALENDAR_DIR" "$((10#$year))" "$((10#$month))")
printf '%s\n' "$url" >>"$FAKE_CURL_LOG"

if [[ ${FAKE_CURL_DELAY:-0} != 0 ]]; then
  sleep "$FAKE_CURL_DELAY"
fi

case "${FAKE_CURL_MODE:-ok}" in
  ok) cat "$fixture" ;;
  fail) exit 22 ;;
  invalid-json) printf '%s\n' '{not-json' ;;
  short) jq '.data = .data[:2]' "$fixture" ;;
  incomplete) jq '(.data[].timings.Fajr) = ""' "$fixture" ;;
  *) exit 64 ;;
esac
