#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"
load_config "${1:-}"
require_gcloud

gcloud_project artifacts repositories describe "${ARTIFACT_REPOSITORY}" --location="${REGION}" >/dev/null

SOURCE_SHA="$(git -C "${PROJECT_ROOT}" rev-parse --short=12 HEAD 2>/dev/null || printf 'local')"
IMAGE_TAG="$(date -u +%Y%m%d-%H%M%S)-${SOURCE_SHA}"
IMAGE_REF="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"
BUILD_CONTEXT="$(mktemp -d "${TMPDIR:-/tmp}/griidai-site-build.XXXXXX")"
trap 'rm -rf "${BUILD_CONTEXT}"' EXIT

mkdir -p "${BUILD_CONTEXT}/dist" "${BUILD_CONTEXT}/scripts"
cp "${DEPLOY_DIR}/Dockerfile" "${BUILD_CONTEXT}/Dockerfile"
cp "${PROJECT_ROOT}/server.cjs" "${BUILD_CONTEXT}/server.cjs"
cp "${PROJECT_ROOT}/scripts/env-config.cjs" "${BUILD_CONTEXT}/scripts/env-config.cjs"
cp -R "${PROJECT_ROOT}/dist/." "${BUILD_CONTEXT}/dist/"

echo "Building ${IMAGE_REF} with Cloud Build."
gcloud_project builds submit "${BUILD_CONTEXT}" \
  --region="${REGION}" \
  --tag="${IMAGE_REF}"

STATE_FILE="${DEPLOY_DIR}/.last_build.${DEPLOY_ENV}.env"
printf 'IMAGE_REF=%q\n' "${IMAGE_REF}" > "${STATE_FILE}"
echo "Image build complete: ${IMAGE_REF}"
echo "Saved image reference in ${STATE_FILE} for the ${DEPLOY_ENV} deploy script."
