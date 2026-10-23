#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"
load_config "${1:-}"
require_gcloud

gcloud_project projects describe "${PROJECT_ID}" >/dev/null
echo "Preparing GCP project ${PROJECT_ID} in ${REGION}."

gcloud_project services enable \
  artifactregistry.googleapis.com \
  certificatemanager.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  run.googleapis.com \
  --quiet

if ! ensure_exists "Artifact Registry repository ${ARTIFACT_REPOSITORY}" \
  gcloud_project artifacts repositories describe "${ARTIFACT_REPOSITORY}" --location="${REGION}"; then
  gcloud_project artifacts repositories create "${ARTIFACT_REPOSITORY}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="GriidAi static website container images"
fi

if ! ensure_exists "runtime service account ${RUNTIME_SERVICE_ACCOUNT_EMAIL}" \
  gcloud_project iam service-accounts describe "${RUNTIME_SERVICE_ACCOUNT_EMAIL}"; then
  gcloud_project iam service-accounts create "${RUNTIME_SERVICE_ACCOUNT}" \
    --display-name="GriidAi website runtime" \
    --description="No project roles are needed for the public static website."
fi

BUILD_SERVICE_ACCOUNT="$(gcloud_project builds get-default-service-account \
  --region="${REGION}" --format='value(serviceAccountEmail)' 2>/dev/null || true)"
BUILD_SERVICE_ACCOUNT="${BUILD_SERVICE_ACCOUNT##*/}"
if [[ -n "${BUILD_SERVICE_ACCOUNT}" ]]; then
  gcloud_project artifacts repositories add-iam-policy-binding "${ARTIFACT_REPOSITORY}" \
    --location="${REGION}" \
    --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
    --role="roles/artifactregistry.writer" \
    --quiet >/dev/null
  echo "Granted repository-scoped Artifact Registry Writer to the Cloud Build account ${BUILD_SERVICE_ACCOUNT}."
else
  echo "Could not determine the Cloud Build service account. If image push fails, grant its identity roles/artifactregistry.writer in ${PROJECT_ID}." >&2
fi

ACTIVE_ACCOUNT="$(gcloud auth list --filter='status:ACTIVE' --format='value(account)')"
if [[ "${ACTIVE_ACCOUNT}" == principal://* || "${ACTIVE_ACCOUNT}" == principalSet://* ]]; then
  DEPLOYER_MEMBER="${ACTIVE_ACCOUNT}"
elif [[ "${ACTIVE_ACCOUNT}" == *".gserviceaccount.com" ]]; then
  DEPLOYER_MEMBER="serviceAccount:${ACTIVE_ACCOUNT}"
else
  DEPLOYER_MEMBER="user:${ACTIVE_ACCOUNT}"
fi
gcloud_project iam service-accounts add-iam-policy-binding "${RUNTIME_SERVICE_ACCOUNT_EMAIL}" \
  --member="${DEPLOYER_MEMBER}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet >/dev/null

echo "Bootstrap complete. The deployer still needs permission to submit Cloud Build jobs and deploy Cloud Run. The optional global load-balancer path also needs permission to manage Compute Engine and Certificate Manager resources."
