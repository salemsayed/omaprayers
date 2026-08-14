#!/bin/bash

# Deduplicate notifications across monitors and shell reloads before handing
# them to Omarchy's native notification helper.

set -uo pipefail
umask 077

event_key="${1:-}"
title="${2:-Prayer time}"
body="${3:-}"

[[ -n $event_key ]] || exit 1

state_dir="$HOME/.local/state/omarchy/prayer-times/salemsayed.prayer-times"
last_event_file="$state_dir/last-notification"
lock_file="$state_dir/notification.lock"
mkdir -p "$state_dir"

exec 9>"$lock_file"
flock -w 5 9 || exit 0

last_event=""
if [[ -f $last_event_file ]]; then
  IFS= read -r last_event <"$last_event_file" || true
fi
[[ $last_event == "$event_key" ]] && exit 0

stage=$(mktemp "$state_dir/.notification.XXXXXX") || exit 1
printf '%s\n' "$event_key" >"$stage" || exit 1
mv "$stage" "$last_event_file" || exit 1

if [[ -n $body ]]; then
  omarchy-notification-send "$title" "$body"
else
  omarchy-notification-send "$title"
fi
