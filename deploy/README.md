# GriidAi website deployment

These scripts deploy the static marketing site in `dist/` as a public Node.js service on Cloud Run. They deploy the website only; they do not deploy the FastAPI service or other GriidAi platform services.

## Targets

| Target | GCP project | Website hostname |
| --- | --- | --- |
| `prod` | `griidai-prod` | `griidai.com` and `www.griidai.com` |
| `dev` | `griidai-dev` | `devsite.griidai.com` in the current local config |

Each target has its own deployment configuration. The scripts select files in this order:

- `prod`: use `deploy/config.env` when it exists; otherwise use `deploy/config.env.example`.
- `dev`: use `deploy/config.dev.env` when it exists; otherwise use `deploy/config.dev.env.example`.

The example configs contain these settings:

| Setting | Production | Dev |
| --- | --- | --- |
| `PROJECT_ID` | `griidai-prod` | `griidai-dev` |
| `REGION` | `us-east1` | `us-east1` |
| `APP_NAME` | `griidai` | `griidai` |
| `ENVIRONMENT` | `prod` | `dev` |
| `RESOURCE_PREFIX` | `griidai-prod` | `griidai-dev` |
| `SITE_INSTANCE` (Cloud Run service) | `griidai-prod-site` | `griidai-dev-site` |
| Artifact Registry repository / image | `griidai-site` | `griidai-site` |
| `RUNTIME_SERVICE_ACCOUNT` | `griidai-site-runtime` | `griidai-site-runtime` |
| `PRICING_EMBED_URL` | Production FastAPI pricing URL | Set in dev config; defaults to production URL |
| `DOMAIN` | `griidai.com` | `devsite.griidai.com` (example default: `dev-griidai.com`) |
| `WWW_DOMAIN` | `www.griidai.com` | empty (no `www` hostname) |

Both targets also use 0 minimum and 4 maximum instances, 1 CPU, 512 MiB memory, concurrency 80, a 60-second timeout, and `all` ingress. The optional load-balancer resource prefix is derived from `APP_NAME` and `ENVIRONMENT` (`griidai-prod` for prod and `griidai-dev` for dev).

The current `deploy/config.env` is the production config. To create a local dev override, copy `deploy/config.dev.env.example` to `deploy/config.dev.env` if that file does not already exist, then edit it. The scripts pass the selected `PROJECT_ID` directly to `gcloud`, so changing the active `gcloud` project does not change their target.

The service name is derived in each config as `RESOURCE_PREFIX="${APP_NAME}-${ENVIRONMENT}"` and `SITE_INSTANCE="${RESOURCE_PREFIX}-site"`. The optional load-balancer resource names use `RESOURCE_PREFIX`. The image reference is saved separately for each target in `.last_build.prod.env` or `.last_build.dev.env`. Always build and deploy with the same target argument.

## Requirements

- Bash, Node.js 18 or newer, `gcloud`, `git`, and `curl`.
- An authenticated Google account with permissions to enable APIs, create Artifact Registry and service accounts, submit Cloud Build jobs, deploy Cloud Run, and manage domain mappings in both projects.
- The selected deployment config file, containing `PRICING_EMBED_URL`. `.env` is not required for deployment.

The optional global load balancer scripts also require permissions to manage Compute Engine load-balancer resources and Certificate Manager resources.

## Authenticate and deploy

Run `gcloud auth login` once if there is no active gcloud CLI account. Confirm the account with `gcloud auth list`. These deploy scripts use the gcloud CLI credentials and pass `--project` explicitly. They do not use Application Default Credentials (ADC).

From the repository root, bootstrap, build, and deploy production:

```bash
# Run once only if there is no active gcloud CLI account.
gcloud auth login

bash deploy/scripts/01_bootstrap_gcp.sh prod
bash deploy/scripts/02_build_and_push_image.sh prod
bash deploy/scripts/03_deploy_cloud_run.sh prod
```

Bootstrap, build, and deploy dev:

```bash
bash deploy/scripts/01_bootstrap_gcp.sh dev
bash deploy/scripts/02_build_and_push_image.sh dev
bash deploy/scripts/03_deploy_cloud_run.sh dev
```

You do not need these commands for this deployment flow:

```bash
gcloud auth application-default login
gcloud config set project ...
gcloud auth application-default set-quota-project ...
```

ADC commands configure credentials for local applications that use Google client libraries. The `gcloud` CLI uses its own login credentials; `gcloud config set project` is optional because these scripts specify the project themselves. See Google's documentation on [gcloud CLI authentication](https://docs.cloud.google.com/sdk/docs/authenticate) and [Application Default Credentials](https://docs.cloud.google.com/docs/authentication/provide-credentials-adc).

### Pricing environment file

The selected deployment config is also the source of `PRICING_EMBED_URL`: `deploy/config.env` for prod, or `deploy/config.dev.env` for dev, with the matching `.example` file used when a local config is absent. The dev example defaults to the production FastAPI URL; change `PRICING_EMBED_URL` in `deploy/config.dev.env` if dev should use a separate FastAPI deployment. The deploy script injects only that URL into Cloud Run. It does not require, copy, or send the root `.env` file to GCP.

Run the build script again after updating website files in `dist/`. The image reference is saved separately as `deploy/.last_build.prod.env` or `deploy/.last_build.dev.env`; build and deploy with the same target argument.

Each deploy command prints the Cloud Run service URL and ready revision. Once deployed, add the desired domain mapping in the matching GCP project and copy the DNS records shown by Google to GoDaddy. The scripts do not create domain mappings or change DNS records.

## Optional global load balancer path

Scripts `04_setup_domain_edge.sh`, `05_check_domain_readiness.sh`, and `06_verify_before_dns_cutover.sh` configure and check a global external Application Load Balancer with Certificate Manager. This is separate from direct Cloud Run domain mapping. If using that path, pass the same `prod` or `dev` argument to each script. The selected profile's `DOMAIN` and `WWW_DOMAIN` values determine which hostnames it configures.

## Local preview

The local static site runs with `npm start` or:

```bash
python3 -m http.server 3000 --bind 127.0.0.1 --directory dist
```
