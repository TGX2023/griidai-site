# GriidAi website deployment

These scripts deploy the static marketing site in `dist/` as a public Node.js service on Cloud Run. They deploy the website only; they do not deploy the FastAPI service or other GriidAi platform services.

## Targets

| Target | GCP project | Website hostname |
| --- | --- | --- |
| `prod` | `griidai-prod` | `griidai.com` and `www.griidai.com` |
| `dev` | `griidai-dev` | `dev-griidai.com` |

Each target has its own deployment configuration. The scripts select files in this order:

- `prod`: use `deploy/config.env` when it exists; otherwise use `deploy/config.env.example`.
- `dev`: use `deploy/config.dev.env` when it exists; otherwise use `deploy/config.dev.env.example`.

The example configs contain these settings:

| Setting | Production | Dev |
| --- | --- | --- |
| `PROJECT_ID` | `griidai-prod` | `griidai-dev` |
| `REGION` | `us-east1` | `us-east1` |
| `SERVICE_NAME` | `griidai-site` | `griidai-site` |
| Artifact Registry repository / image | `griidai-site` | `griidai-site` |
| `RUNTIME_SERVICE_ACCOUNT` | `griidai-site-runtime` | `griidai-site-runtime` |
| `DOMAIN` | `griidai.com` | `dev-griidai.com` |
| `WWW_DOMAIN` | `www.griidai.com` | empty (no `www` hostname) |

Both targets also use 0 minimum and 4 maximum instances, 1 CPU, 512 MiB memory, concurrency 80, a 60-second timeout, and `all` ingress. The optional load-balancer resource prefix is `griidai-site` for prod and `griidai-site-dev` for dev.

The current `deploy/config.env` is the production config. To create a local dev override, copy `deploy/config.dev.env.example` to `deploy/config.dev.env` if that file does not already exist, then edit it. The scripts pass the selected `PROJECT_ID` directly to `gcloud`, so changing the active `gcloud` project does not change their target.

The image reference is saved separately for each target in `.last_build.prod.env` or `.last_build.dev.env`. Always build and deploy with the same target argument.

## Requirements

- Bash, Node.js 18 or newer, `gcloud`, `git`, and `curl`.
- An authenticated Google account with permissions to enable APIs, create Artifact Registry and service accounts, submit Cloud Build jobs, deploy Cloud Run, and manage domain mappings in both projects.
- A local root `.env` containing `PRICING_EMBED_URL` (create it with `npm run env:local` after cloning), or set that variable in the deployment shell. `.env` is ignored by Git and is not included in the image.

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

There are two different kinds of environment files:

- `deploy/config.dev.env` (or its example fallback) configures the dev GCP project and service. Production uses `deploy/config.env` (or its example fallback).
- The website's root `.env` contains `PRICING_EMBED_URL`. The deploy script reads this same root file for both environments and injects only that value into Cloud Run. It does not copy `.env` into the image or send other `.env` values to GCP.

For dev, the deployment settings come from whichever config file is selected by the rule above, and the pricing URLs come from the root `.env`. The dev website uses the same FastAPI pricing endpoint as production unless `PRICING_EMBED_URL` is overridden in the environment when running `03_deploy_cloud_run.sh dev`.

Run the build script again after updating website files in `dist/`. The image reference is saved separately as `deploy/.last_build.prod.env` or `deploy/.last_build.dev.env`; build and deploy with the same target argument.

Each deploy command prints the Cloud Run service URL and ready revision. Once deployed, add the desired domain mapping in the matching GCP project and copy the DNS records shown by Google to GoDaddy. The scripts do not create domain mappings or change DNS records.

## Optional global load balancer path

Scripts `04_setup_domain_edge.sh`, `05_check_domain_readiness.sh`, and `06_verify_before_dns_cutover.sh` configure and check a global external Application Load Balancer with Certificate Manager. This is separate from direct Cloud Run domain mapping. If using that path, pass the same `prod` or `dev` argument to each script. The dev profile configures only `dev-griidai.com`.

## Local preview

The local static site runs with `npm start` or:

```bash
python3 -m http.server 3000 --bind 127.0.0.1 --directory dist
```
