#!/bin/bash

# Deduplicate notifications across monitors and shell reloads before handing
# them to Omarchy's native notification helper.

set -uo pipefail
umask 077

event_key="${1:-}"
title="${2:-Prayer time}"
body="${3:-}"

[[ -n $event_key ]] || exit 1

state_home="${XDG_STATE_HOME:-$HOME/.local/state}"
state_dir="$state_home/omarchy/io.github.salemsayed.omaprayers"
last_event_file="$state_dir/last-notification"
lock_file="$state_dir/notification.lock"
mkdir -p "$state_dir" || exit 1
chmod 700 "$state_dir" || exit 1

exec 9>"$lock_file"
flock -w 5 9 || exit 75

last_event=""
if [[ -f $last_event_file ]]; then
  IFS= read -r last_event <"$last_event_file" || true
fi
[[ $last_event == "$event_key" ]] && exit 0

if [[ -n $body ]]; then
  omarchy-notification-send "$title" "$body" || exit 1
else
  omarchy-notification-send "$title" || exit 1
fi

# Commit the deduplication key only after the notification helper succeeds. If
# the desktop notification service is temporarily unavailable, the next live
# widget instance can retry rather than silently losing this event.
stage=""
cleanup() {
  [[ -z $stage ]] || rm -f -- "$stage"
}
trap cleanup EXIT

stage=$(mktemp "$state_dir/.notification.XXXXXX") || exit 1
printf '%s\n' "$event_key" >"$stage" || exit 1
mv "$stage" "$last_event_file" || exit 1
stage=""
