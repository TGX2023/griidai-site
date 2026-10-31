# CMS-connected website — dev branch

The current website runs through **`cms-server.cjs`**, not the legacy static `server.cjs`. `npm start` already selects the correct server. The root `shared/` directory is required; its browser-safe rendering and validation helpers ship with the website. Strapi code is delivered separately on the **dashboard** branch under `dashboard/`.

## Environment

Copy `.env.example` to a private `.env` for local use. In production set the same variable names in the hosting service instead. No secret values are checked into Git.

| Variable | Set it to |
| --- | --- |
| `HOST` | `0.0.0.0` in a container, or a suitable local address |
| `PORT` | Port supplied by hosting; 3000 for local testing |
| `SITE_URL` | Final public website origin, e.g. `https://griidai.com` |
| `STRAPI_URL` | CMS origin reachable by the website **server**, without `/api` |
| `STRAPI_PUBLIC_URL` | Public HTTPS CMS origin used by browsers to load images and validate preview messages |
| `STRAPI_API_TOKEN` | Private custom read token with Blog find/findOne and Use Case find/findOne |
| `PREVIEW_SECRET` | Same strong value as on Strapi; server-side only |
| `PRICING_EMBED_URL` | Team's actual public pricing embed URL, including `?mode=public` |

There is no `PRICING_LOCAL_EMBED_URL` or hostname-based local pricing fallback. For a temporary local test, change the single `PRICING_EMBED_URL` value privately and restore it before deployment. The backend must allow the website's exact origin for the pricing iframe. The existing sandbox supports user-clicked top navigation and opening legal links in a new tab.

The website reads published CMS data on every page request. No rebuild is needed after a content Publish. Draft preview uses a signed expiring URL; changing a public query string cannot reveal drafts. If the CMS fails, content routes show a temporary error, while static pages remain available. Homepage selections have no stale fallback.

## Run and deploy

```sh
npm test
npm start
```

`deploy/Dockerfile` starts the CMS-connected Node server and includes `shared/`. Real environment values are injected at runtime. GitHub Pages/static-only hosting cannot execute this integration; the branch workflow validates code rather than publishing a stale static copy. Existing static build scripts are legacy previews only.

The dashboard branch contains a content-only seed and its import instructions. Importing generates destination document IDs and upload URLs; internal related-content references are remapped by the importer. Point this website at that CMS after import. Do not copy a developer `.env`, admin database or API keys.

Before production acceptance, test: published/draft/unpublish lifecycle, blogs and use-case details, tags and navigation, author details, source videos, live previews, homepage selections, sitemap and canonical URLs using final `SITE_URL`, pricing and its legal links. Review original static metadata separately as needed.
