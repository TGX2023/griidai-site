#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"
load_config "${1:-}"
require_gcloud

STATE_FILE="${DEPLOY_DIR}/.last_build.${DEPLOY_ENV}.env"
if [[ ! -f "${STATE_FILE}" ]]; then
  echo "No ${DEPLOY_ENV} image reference found at ${STATE_FILE}. Run deploy/scripts/02_build_and_push_image.sh ${DEPLOY_ENV} first." >&2
  exit 1
fi
# shellcheck disable=SC1090
source "${STATE_FILE}"
: "${IMAGE_REF:?IMAGE_REF missing from ${STATE_FILE}}"
: "${SITE_URL:?Set the public website origin before deployment}"
: "${STRAPI_URL:?Set the Strapi origin reachable by the website server}"
: "${STRAPI_PUBLIC_URL:?Set the public HTTPS Strapi origin}"
: "${CMS_TOKEN_SECRET:?Set the Secret Manager name:version for the read token}"
: "${CMS_PREVIEW_SECRET:?Set the Secret Manager name:version for the shared preview secret}"
export SITE_URL STRAPI_URL STRAPI_PUBLIC_URL

PRICING_ENV_FILE="$(mktemp "${TMPDIR:-/tmp}/griidai-pricing-env.XXXXXX.yaml")"
trap 'rm -f "${PRICING_ENV_FILE}"' EXIT
node - "${PROJECT_ROOT}" "${PRICING_ENV_FILE}" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const projectRoot = process.argv[2];
const outputFile = process.argv[3];
const {getPricingUrls} = require(path.join(projectRoot, 'scripts/env-config.cjs'));
const urls = getPricingUrls(projectRoot);
const values = {PRICING_EMBED_URL: urls.production, SITE_URL: process.env.SITE_URL, STRAPI_URL: process.env.STRAPI_URL, STRAPI_PUBLIC_URL: process.env.STRAPI_PUBLIC_URL};
for (const key of ['SITE_URL', 'STRAPI_URL', 'STRAPI_PUBLIC_URL']) {
  const url = new URL(values[key]);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${key} must be a deployment HTTPS origin without credentials.`);
}
const contents = Object.entries(values).map(([key,value]) => `${key}: ${JSON.stringify(value)}`).join('\n') + '\n';
fs.writeFileSync(outputFile, contents, {mode: 0o600});
NODE

echo "Deploying ${IMAGE_REF} to ${PROJECT_ID}/${REGION}/${SITE_INSTANCE}."
gcloud_project run deploy "${SITE_INSTANCE}" \
  --image="${IMAGE_REF}" \
  --region="${REGION}" \
  --platform=managed \
  --port=8080 \
  --service-account="${RUNTIME_SERVICE_ACCOUNT_EMAIL}" \
  --cpu="${RUN_CPU:-1}" \
  --memory="${RUN_MEMORY:-512Mi}" \
  --concurrency="${RUN_CONCURRENCY:-80}" \
  --min-instances="${RUN_MIN_INSTANCES:-0}" \
  --max-instances="${RUN_MAX_INSTANCES:-4}" \
  --timeout="${RUN_TIMEOUT:-60s}" \
  --ingress="${RUN_INGRESS:-internal-and-cloud-load-balancing}" \
  --env-vars-file="${PRICING_ENV_FILE}" \
  --set-secrets="STRAPI_API_TOKEN=${CMS_TOKEN_SECRET},PREVIEW_SECRET=${CMS_PREVIEW_SECRET}" \
  --allow-unauthenticated \
  --quiet

gcloud_project run services describe "${SITE_INSTANCE}" \
  --region="${REGION}" \
  --format='yaml(status.latestReadyRevisionName,status.url,status.conditions)'
