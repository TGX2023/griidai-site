#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"
load_config "${1:-}"
require_gcloud

"${SCRIPT_DIR}/05_check_domain_readiness.sh" "${1:-}"
GLOBAL_IP="$(gcloud_project compute addresses describe "${GLOBAL_IP_NAME}" --global --format='value(address)')"

for hostname in "${DOMAIN_HOSTNAMES[@]}"; do
  for route in / /platform/ /about/ /solutions/ /spatial-analysis/ /pricing/; do
    status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
      --resolve "${hostname}:443:${GLOBAL_IP}" "https://${hostname}${route}")"
    if [[ "${status}" != "200" ]]; then
      echo "Pre-cutover check failed: https://${hostname}${route} returned HTTP ${status}." >&2
      exit 1
    fi
    echo "OK ${hostname}${route} ${status}"
  done

  status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
    --resolve "${hostname}:80:${GLOBAL_IP}" "http://${hostname}/")"
  if [[ "${status}" != "301" && "${status}" != "308" ]]; then
    echo "HTTP redirect check failed: http://${hostname}/ returned HTTP ${status}." >&2
    exit 1
  fi
  echo "OK ${hostname} HTTP redirects to HTTPS (${status})"
done

echo "Pre-cutover origin checks passed. DNS can be switched using the procedure in deploy/README.md."
