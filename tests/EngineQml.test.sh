#!/bin/bash

set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
if ! command -v qs >/dev/null 2>&1; then
  echo "Engine QML parity test skipped: qs is not installed"
  exit 0
fi

test_root=$(mktemp -d)
trap 'rm -rf -- "$test_root"' EXIT
qml_log="$test_root/qml.log"
qml_json="$test_root/qml.json"
node_json="$test_root/node.json"

# Quickshell confines a -p config's imports to its own directory, so the probe
# runs from a scratch copy that sits next to a copy of the real Engine.js.
probe_dir="$test_root/probe"
mkdir -p "$probe_dir"
cp "$root/Engine.js" "$root/Model.js" "$root/tests/EngineProbe.qml" "$probe_dir/"
if ! QT_QPA_PLATFORM=offscreen qs -p "$probe_dir/EngineProbe.qml" >"$qml_log" 2>&1; then
  cat "$qml_log" >&2
  exit 1
fi
# qs colours its log prefix when it likes the terminal; strip escapes first.
sed 's/\x1b\[[0-9;]*m//g' "$qml_log" \
  | sed -n 's/^.*DEBUG qml: \({"cairo":.*}\).*$/\1/p' | tail -n 1 >"$qml_json"
if ! jq -e '.cairo.ok == true and .tromso.ok == true' "$qml_json" >/dev/null 2>&1; then
  echo "Engine QML parity test did not find the probe JSON line" >&2
  cat "$qml_log" >&2
  exit 1
fi

node "$root/tests/engine-probe.js" >"$node_json"
diff -u "$node_json" "$qml_json"
echo "Engine QML parity test passed"
