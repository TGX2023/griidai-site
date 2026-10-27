#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"
load_config "${1:-}"
require_gcloud

CERTIFICATE_STATE="$(gcloud_project certificate-manager certificates describe "${CERTIFICATE_NAME}" \
  --location=global --format='value(managed.state)')"
GLOBAL_IP="$(gcloud_project compute addresses describe "${GLOBAL_IP_NAME}" --global --format='value(address)')"
echo "Certificate state: ${CERTIFICATE_STATE:-unknown}"
echo "Load-balancer IP: ${GLOBAL_IP:-unknown}"
if [[ "${CERTIFICATE_STATE}" != "ACTIVE" ]]; then
  echo "Not ready to switch web traffic. Add/verify both Certificate Manager CNAME records in GoDaddy and wait for certificate state ACTIVE." >&2
  gcloud_project certificate-manager certificates describe "${CERTIFICATE_NAME}" \
    --location=global --format='yaml(managed.state,managed.authorizationAttemptInfo,managed.provisioningIssue)'
  exit 1
fi
echo "Certificate is active for ${CERTIFICATE_DOMAINS//,/ and }."
