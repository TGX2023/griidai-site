# GriidAi content dashboard

This branch delivers **Strapi only** under `dashboard/`. Existing website files at the repository root are inherited from `main`; they have not been updated here. The CMS-connected website is delivered separately on **dev**.

Included: Strapi 5.59.0 Community, use cases and blogs, rich editors, tags, related content, SEO controls, author photos, image crop, signed side-by-side previews, Marketing Editor / Marketing Publisher permissions, and the homepage feature selections (two blogs and two use cases).

## Local setup

Use Node 22 LTS **22.19 or newer**. From `dashboard/`:

```sh
npm ci --prefix cms
npm run setup
npm run seed
npm run dev
```

Open `http://localhost:1337/admin` and create your own first administrator. No existing accounts, passwords or API tokens are supplied. If port 1337 is occupied, set a free `PORT` and matching `STRAPI_PUBLIC_URL` in `cms/.env`. Never stop another service automatically.

`seed/` contains the content-only snapshot and referenced images. `npm run seed` imports into the configured database, retaining saved drafts and published versions. It does not overwrite previously imported documents on rerun. Stop the CMS while importing, back up an existing target database, and import into a fresh database when moving this snapshot. Do not restore the developer SQLite file. Known generated QA examples are omitted; real content and drafts are retained.

The seed is not run automatically on startup or deployment. Republishing and changes after this snapshot remain marketing tasks in the dashboard. Image files are checked by SHA-256 before import; new media is uploaded through the configured Strapi provider.

## Production handoff

1. Deploy `dashboard/cms` as a **Node service**, not a static website. Build context must include `dashboard/shared`.
2. Copy the names from `cms/.env.production.example` to the hosting environment and fill real values there. Generate separate strong secrets. Keep `APP_KEYS` and salts stable across restarts.
3. Provision PostgreSQL. The `pg` driver is included. Set the actual connection fields and verified TLS certificate settings. This handoff has been tested locally on SQLite, not against your production PostgreSQL.
4. Configure persistent image storage **before** importing. This code currently uses Strapi's local upload provider. A durable mounted volume works for a single-instance deployment. For a bucket, the team must install/configure its chosen Strapi provider with server-side credentials; setting a bucket name alone is not enough. Never use temporary container storage for production uploads.
5. Configure SMTP/provider if email invitations and password reset should be delivered. The current default development email provider is not production SMTP.
6. Run the explicit seed import against the intended database/provider, then `npm run build` and `npm start`. Create the first administrator and invite the team. Existing Marketing roles are bootstrapped; editor does not acquire publish/delete/settings rights.
7. Create a **custom Content API read token** with Blog `find/findOne` and Use Case `find/findOne`. Keep it on the website server as `STRAPI_API_TOKEN`; do not enable public draft access.
8. Set CMS `SITE_URL` to the final website origin, CMS `STRAPI_PUBLIC_URL` to its public HTTPS origin. Set the **same** `PREVIEW_SECRET` on the website server. The website dev-branch configuration is described in `docs/CMS-DEPLOYMENT.md` there. Both services must be deployed for previews and dynamic pages to work.

Container build (from repository root):

```sh
docker build -f dashboard/Dockerfile dashboard
```

Inject real runtime variables using your hosting secret manager. PostgreSQL, email and bucket services are not created by the Dockerfile. Cloud Run-like platforms supply `PORT`; Strapi reads it. The CMS is a separate service from the website.

## Checks

```sh
npm test
npm run build
```

Manual acceptance: editor saves/previews but cannot publish; publisher publishes/unpublishes; only administrators manage users/settings; drafts stay out of the website; image-only content omits video; valid previews use noindex/no-store; homepage capacity stays at two per content type. Check mobile and light/dark dashboard modes.

`shared/site-routes.json` supplies known product routes for the legacy, authenticated link-check endpoint without needing website source files. The Before publishing UI has been removed. Update this manifest if static website routes change.

Additional Arabic guides are in `docs/`. Some older lab documents mention the original `cms/website/shared` layout; this README defines the deployment layout for this branch.
