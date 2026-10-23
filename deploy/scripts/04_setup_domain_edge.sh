#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"
load_config "${1:-}"
require_gcloud

gcloud_project run services describe "${SERVICE_NAME}" --region="${REGION}" >/dev/null

ensure_dns_authorization() {
  local name="$1"
  local domain="$2"
  if ! ensure_exists "DNS authorization ${name}" \
    gcloud_project certificate-manager dns-authorizations describe "${name}" --location=global; then
    gcloud_project certificate-manager dns-authorizations create "${name}" \
      --domain="${domain}" \
      --type=FIXED_RECORD \
      --location=global
  fi
}

ensure_dns_authorization "${ROOT_AUTH_NAME}" "${DOMAIN}"
DNS_AUTHORIZATIONS="${ROOT_AUTH_NAME}"
if [[ -n "${WWW_DOMAIN}" ]]; then
  ensure_dns_authorization "${WWW_AUTH_NAME}" "${WWW_DOMAIN}"
  DNS_AUTHORIZATIONS+=",${WWW_AUTH_NAME}"
fi

if ! ensure_exists "Certificate Manager certificate ${CERTIFICATE_NAME}" \
  gcloud_project certificate-manager certificates describe "${CERTIFICATE_NAME}" --location=global; then
  gcloud_project certificate-manager certificates create "${CERTIFICATE_NAME}" \
    --domains="${CERTIFICATE_DOMAINS}" \
    --dns-authorizations="${DNS_AUTHORIZATIONS}" \
    --location=global \
    --scope=default
fi

if ! ensure_exists "Certificate Manager map ${CERTIFICATE_MAP}" \
  gcloud_project certificate-manager maps describe "${CERTIFICATE_MAP}" --location=global; then
  gcloud_project certificate-manager maps create "${CERTIFICATE_MAP}" --location=global
fi

ensure_certificate_entry() {
  local entry_name="$1"
  local hostname="$2"
  if ! ensure_exists "certificate map entry ${entry_name}" \
    gcloud_project certificate-manager maps entries describe "${entry_name}" \
      --map="${CERTIFICATE_MAP}" --location=global; then
    gcloud_project certificate-manager maps entries create "${entry_name}" \
      --map="${CERTIFICATE_MAP}" \
      --certificates="${CERTIFICATE_NAME}" \
      --hostname="${hostname}" \
      --location=global
  fi
}
ensure_certificate_entry "${ROOT_CERT_ENTRY}" "${DOMAIN}"
if [[ -n "${WWW_DOMAIN}" ]]; then
  ensure_certificate_entry "${WWW_CERT_ENTRY}" "${WWW_DOMAIN}"
fi

if ! ensure_exists "global IPv4 address ${GLOBAL_IP_NAME}" \
  gcloud_project compute addresses describe "${GLOBAL_IP_NAME}" --global; then
  gcloud_project compute addresses create "${GLOBAL_IP_NAME}" \
    --global --ip-version=IPV4 --network-tier=PREMIUM
fi

if ! ensure_exists "serverless NEG ${NEG_NAME}" \
  gcloud_project compute network-endpoint-groups describe "${NEG_NAME}" --region="${REGION}"; then
  gcloud_project compute network-endpoint-groups create "${NEG_NAME}" \
    --region="${REGION}" \
    --network-endpoint-type=serverless \
    --cloud-run-service="${SERVICE_NAME}"
fi

NEG_URL="https://www.googleapis.com/compute/v1/projects/${PROJECT_ID}/regions/${REGION}/networkEndpointGroups/${NEG_NAME}"
if ! ensure_exists "global backend ${BACKEND_NAME}" \
  gcloud_project compute backend-services describe "${BACKEND_NAME}" --global; then
  gcloud_project compute backend-services create "${BACKEND_NAME}" \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --protocol=HTTP
fi
if ! gcloud_project compute backend-services describe "${BACKEND_NAME}" --global \
  --format='value(backends.group)' | grep -Fqx "${NEG_URL}"; then
  gcloud_project compute backend-services add-backend "${BACKEND_NAME}" \
    --global \
    --network-endpoint-group="${NEG_NAME}" \
    --network-endpoint-group-region="${REGION}"
fi

if ! ensure_exists "URL map ${HTTPS_URL_MAP}" \
  gcloud_project compute url-maps describe "${HTTPS_URL_MAP}" --global; then
  gcloud_project compute url-maps create "${HTTPS_URL_MAP}" \
    --global --default-service="${BACKEND_NAME}"
fi

if ! ensure_exists "HTTPS proxy ${HTTPS_PROXY}" \
  gcloud_project compute target-https-proxies describe "${HTTPS_PROXY}" --global; then
  gcloud_project compute target-https-proxies create "${HTTPS_PROXY}" \
    --global \
    --url-map="${HTTPS_URL_MAP}" \
    --certificate-map="${CERTIFICATE_MAP}"
else
  gcloud_project compute target-https-proxies update "${HTTPS_PROXY}" \
    --global \
    --url-map="${HTTPS_URL_MAP}" \
    --certificate-map="${CERTIFICATE_MAP}"
fi

if ! ensure_exists "HTTPS forwarding rule ${HTTPS_FORWARDING_RULE}" \
  gcloud_project compute forwarding-rules describe "${HTTPS_FORWARDING_RULE}" --global; then
  gcloud_project compute forwarding-rules create "${HTTPS_FORWARDING_RULE}" \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --network-tier=PREMIUM \
    --address="${GLOBAL_IP_NAME}" \
    --target-https-proxy="${HTTPS_PROXY}" \
    --ports=443
fi

if ! ensure_exists "HTTP redirect URL map ${HTTP_URL_MAP}" \
  gcloud_project compute url-maps describe "${HTTP_URL_MAP}" --global; then
  REDIRECT_MAP_FILE="$(mktemp "${TMPDIR:-/tmp}/griidai-http-map.XXXXXX")"
  trap 'rm -f "${REDIRECT_MAP_FILE}"' EXIT
  cat > "${REDIRECT_MAP_FILE}" <<EOF
kind: compute#urlMap
name: ${HTTP_URL_MAP}
defaultUrlRedirect:
  httpsRedirect: true
  redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
EOF
  gcloud_project compute url-maps import "${HTTP_URL_MAP}" \
    --global --source="${REDIRECT_MAP_FILE}" --quiet
fi

if ! ensure_exists "HTTP redirect proxy ${HTTP_PROXY}" \
  gcloud_project compute target-http-proxies describe "${HTTP_PROXY}" --global; then
  gcloud_project compute target-http-proxies create "${HTTP_PROXY}" \
    --global --url-map="${HTTP_URL_MAP}"
fi
if ! ensure_exists "HTTP forwarding rule ${HTTP_FORWARDING_RULE}" \
  gcloud_project compute forwarding-rules describe "${HTTP_FORWARDING_RULE}" --global; then
  gcloud_project compute forwarding-rules create "${HTTP_FORWARDING_RULE}" \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --network-tier=PREMIUM \
    --address="${GLOBAL_IP_NAME}" \
    --target-http-proxy="${HTTP_PROXY}" \
    --ports=80
fi

GLOBAL_IP="$(gcloud_project compute addresses describe "${GLOBAL_IP_NAME}" --global --format='value(address)')"
echo
echo "Google Certificate Manager DNS authorization records (add these in GoDaddy; do not change the current website A/CNAME records yet):"
gcloud_project certificate-manager dns-authorizations describe "${ROOT_AUTH_NAME}" --location=global --format='yaml(dnsResourceRecord)'
if [[ -n "${WWW_DOMAIN}" ]]; then
  gcloud_project certificate-manager dns-authorizations describe "${WWW_AUTH_NAME}" --location=global --format='yaml(dnsResourceRecord)'
fi
echo
echo "Global load-balancer IPv4 address: ${GLOBAL_IP}"
echo "The DNS authorizations and load balancer are prepared. Keep the GitHub Pages web records unchanged until the certificate is ACTIVE and the pre-cutover checks pass."
gcloud_project certificate-manager certificates describe "${CERTIFICATE_NAME}" \
  --location=global --format='yaml(managed.state,managed.authorizationAttemptInfo)'
