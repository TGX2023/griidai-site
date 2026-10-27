#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "${DEPLOY_DIR}/.." && pwd)"

load_config() {
  local selection="${1:-prod}"
  local config_file
  local value

  case "${selection}" in
    prod)
      DEPLOY_ENV="prod"
      config_file="${DEPLOY_DIR}/config.env"
      if [[ ! -f "${config_file}" ]]; then
        config_file="${DEPLOY_DIR}/config.env.example"
      fi
      ;;
    dev)
      DEPLOY_ENV="dev"
      config_file="${DEPLOY_DIR}/config.dev.env"
      if [[ ! -f "${config_file}" ]]; then
        config_file="${DEPLOY_DIR}/config.dev.env.example"
      fi
      ;;
    *)
      DEPLOY_ENV="custom"
      config_file="${selection}"
      ;;
  esac

  if [[ ! -f "${config_file}" ]]; then
    echo "Config file not found: ${config_file}" >&2
    exit 1
  fi

  # shellcheck disable=SC1090
  source "${config_file}"

  : "${PROJECT_ID:?Set PROJECT_ID in ${config_file}}"
  : "${APP_NAME:?Set APP_NAME in ${config_file}}"
  : "${ENVIRONMENT:?Set ENVIRONMENT in ${config_file}}"
  : "${RESOURCE_PREFIX:?Set RESOURCE_PREFIX in ${config_file}}"
  : "${SITE_INSTANCE:?Set SITE_INSTANCE in ${config_file}}"
  : "${REGION:?Set REGION in ${config_file}}"
  : "${ARTIFACT_REPOSITORY:?Set ARTIFACT_REPOSITORY in ${config_file}}"
  : "${IMAGE_NAME:?Set IMAGE_NAME in ${config_file}}"
  : "${RUNTIME_SERVICE_ACCOUNT:?Set RUNTIME_SERVICE_ACCOUNT in ${config_file}}"
  : "${PRICING_EMBED_URL:?Set PRICING_EMBED_URL in ${config_file}}"
  : "${DOMAIN:?Set DOMAIN in ${config_file}}"
  WWW_DOMAIN="${WWW_DOMAIN:-}"
  export PRICING_EMBED_URL

  if [[ ! "${PROJECT_ID}" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]]; then
    echo "Invalid PROJECT_ID: ${PROJECT_ID}" >&2
    exit 1
  fi
  for value in "${APP_NAME}" "${ENVIRONMENT}" "${RESOURCE_PREFIX}" "${SITE_INSTANCE}" "${ARTIFACT_REPOSITORY}" "${IMAGE_NAME}" "${RUNTIME_SERVICE_ACCOUNT}"; do
    if [[ ! "${value}" =~ ^[a-z][a-z0-9-]{0,61}[a-z0-9]$ ]]; then
      echo "Invalid GCP resource name: ${value}" >&2
      exit 1
    fi
  done
  if [[ ! "${DOMAIN}" =~ ^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    echo "Invalid DNS domain: ${DOMAIN}" >&2
    exit 1
  fi
  if [[ -n "${WWW_DOMAIN}" && ! "${WWW_DOMAIN}" =~ ^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    echo "Invalid DNS domain: ${WWW_DOMAIN}" >&2
    exit 1
  fi

  DOMAIN_HOSTNAMES=("${DOMAIN}")
  if [[ -n "${WWW_DOMAIN}" ]]; then
    DOMAIN_HOSTNAMES+=("${WWW_DOMAIN}")
  fi
  CERTIFICATE_DOMAINS="$(IFS=,; printf '%s' "${DOMAIN_HOSTNAMES[*]}")"

  REGION="$(printf '%s' "${REGION}" | tr '[:upper:]' '[:lower:]')"
  APP_NAME="$(printf '%s' "${APP_NAME}" | tr '[:upper:]' '[:lower:]')"
  ENVIRONMENT="$(printf '%s' "${ENVIRONMENT}" | tr '[:upper:]' '[:lower:]')"
  RESOURCE_PREFIX="$(printf '%s' "${RESOURCE_PREFIX}" | tr '[:upper:]' '[:lower:]')"
  SITE_INSTANCE="$(printf '%s' "${SITE_INSTANCE}" | tr '[:upper:]' '[:lower:]')"
  if [[ "${RESOURCE_PREFIX}" != "${APP_NAME}-${ENVIRONMENT}" ]]; then
    echo "RESOURCE_PREFIX must be APP_NAME-ENVIRONMENT in ${config_file}." >&2
    exit 1
  fi
  if [[ "${SITE_INSTANCE}" != "${RESOURCE_PREFIX}-site" ]]; then
    echo "SITE_INSTANCE must be RESOURCE_PREFIX-site in ${config_file}." >&2
    exit 1
  fi
  ARTIFACT_REPOSITORY="$(printf '%s' "${ARTIFACT_REPOSITORY}" | tr '[:upper:]' '[:lower:]')"
  IMAGE_NAME="$(printf '%s' "${IMAGE_NAME}" | tr '[:upper:]' '[:lower:]')"
  RUNTIME_SERVICE_ACCOUNT="$(printf '%s' "${RUNTIME_SERVICE_ACCOUNT}" | tr '[:upper:]' '[:lower:]')"
  ROOT_AUTH_NAME="${RESOURCE_PREFIX}-root-dns-auth"
  WWW_AUTH_NAME="${RESOURCE_PREFIX}-www-dns-auth"
  CERTIFICATE_NAME="${RESOURCE_PREFIX}-cert"
  CERTIFICATE_MAP="${RESOURCE_PREFIX}-cert-map"
  ROOT_CERT_ENTRY="${RESOURCE_PREFIX}-root-entry"
  WWW_CERT_ENTRY="${RESOURCE_PREFIX}-www-entry"
  GLOBAL_IP_NAME="${RESOURCE_PREFIX}-ip"
  NEG_NAME="${RESOURCE_PREFIX}-neg"
  BACKEND_NAME="${RESOURCE_PREFIX}-backend"
  HTTPS_URL_MAP="${RESOURCE_PREFIX}-https-map"
  HTTPS_PROXY="${RESOURCE_PREFIX}-https-proxy"
  HTTPS_FORWARDING_RULE="${RESOURCE_PREFIX}-https-rule"
  HTTP_URL_MAP="${RESOURCE_PREFIX}-http-redirect-map"
  HTTP_PROXY="${RESOURCE_PREFIX}-http-redirect-proxy"
  HTTP_FORWARDING_RULE="${RESOURCE_PREFIX}-http-rule"
  RUNTIME_SERVICE_ACCOUNT_EMAIL="${RUNTIME_SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"
}

require_gcloud() {
  if ! command -v gcloud >/dev/null 2>&1; then
    echo "Google Cloud CLI (gcloud) is required. Install it and run 'gcloud auth login'." >&2
    exit 1
  fi
  local active_account
  active_account="$(gcloud auth list --filter='status:ACTIVE' --format='value(account)' 2>/dev/null || true)"
  if [[ -z "${active_account}" ]]; then
    echo "No active gcloud account. Run 'gcloud auth login' and retry." >&2
    exit 1
  fi
}

gcloud_project() {
  gcloud --project="${PROJECT_ID}" "$@"
}

ensure_exists() {
  local description="$1"
  shift
  if ! "$@" >/dev/null 2>&1; then
    return 1
  fi
  echo "Found ${description}."
  return 0
}
