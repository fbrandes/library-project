#!/usr/bin/env bash
set -euo pipefail

BASE_SHA="${1:-}"
HEAD_SHA="${2:-}"
shift 2 || true

if [[ -z "$BASE_SHA" || -z "$HEAD_SHA" ]]; then
  echo "usage: $0 BASE_SHA HEAD_SHA service-a service-b ..." >&2
  exit 1
fi

if [[ $# -eq 0 ]]; then
  echo "at least one service must be provided" >&2
  exit 1
fi

changed=()

for service in "$@"; do
  if git diff --name-only "$BASE_SHA" "$HEAD_SHA" -- "${service}/" | grep -q .; then
    changed+=("$service")
  fi
done

if [[ ${#changed[@]} -eq 0 ]]; then
  printf '%s\n' '{"has_changes":false,"matrix":{"include":[]}}'
  exit 0
fi

matrix='{"include":['
for i in "${!changed[@]}"; do
  [[ $i -gt 0 ]] && matrix+=','
  matrix+="{\"service\":\"${changed[$i]}\"}"
done
matrix+=']}'

printf '{"has_changes":true,"matrix":%s}\n' "$matrix"
