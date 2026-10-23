# Shared Pricing Page: Backend Integration and Deployment

This note describes the exact website and backend settings required for the
marketing pricing page to load the shared pricing presentation from FastAPI.

## Request flow

The marketing page embeds the backend-rendered HTML in an iframe. The public
endpoint is:

```text
GET https://api.griidai.com/api/v1/public/pricing/embed?mode=public
```

It must return the shared pricing HTML with HTTP `200`. The marketing site does
not own or duplicate the plan cards, prices, billing toggle, signup links,
subscription notice, add-ons, or pricing disclaimer.

## Where to change the backend host, IP, or port

Use a single website environment variable: `PRICING_EMBED_URL`.
The local server and static build resolve the HTML placeholder from this value.
The browser uses the configured URL regardless of the website hostname,
including localhost; it does not select a separate local backend address.

1. For development, run `npm run env:local` if `.env` is absent, then edit
   `PRICING_EMBED_URL` in `.env`. Restart the website server after changes.
2. For GitHub Pages, set `PRICING_EMBED_URL` under repository **Settings →
   Secrets and variables → Actions → Variables**. The workflow passes it to
   the build, overriding the tracked public `.env` default.
3. For another hosting service, set the same variable in its build environment.
   Rebuild and redeploy to change a static site's endpoint.
4. Change the host/IP and explicit port in that one URL if the backend address
   changes. Keep `/api/v1/public/pricing/embed?mode=public`.

No other website pricing URL variable is required. The build fails clearly if
this variable is missing or invalid. Only public URLs may be included in the
tracked `.env` and `.env.example`; do not add tokens or credentials.
The endpoint URL becomes visible in the final static HTML, as expected for a
public iframe address. Source HTML contains only the build placeholder.

## Backend code and configuration

In the backend repository, use the shared-pricing implementation described in
the backend architecture/specification:

- `app/api/v1/public_pricing.py` registers the public embed endpoint and loads
  catalog values from the tier settings and starter access policy.
- `app/templates/public_pricing_embed.html` renders the shared HTML, CSS,
  monthly/yearly toggle, public signup links, legal notice, add-ons and
  disclaimer.
- `GET /api/v1/public/pricing/embed?mode=public` must be included in the
  deployed FastAPI application and reachable at the production API host.

Set this environment variable in the backend hosting environment (not in the
public website repository):

```dotenv
PRICING_EMBED_ALLOWED_ORIGINS="https://www.griidai.com"
```

The value is a comma-separated list of exact origins: scheme plus hostname and
optional port, with no path and no trailing slash. Add every real embedding
origin that should work. For local development, for example:

```dotenv
PRICING_EMBED_ALLOWED_ORIGINS="https://www.griidai.com,http://localhost:3000"
```

If the local website runs on port `4319`, allow `http://localhost:4319` instead
of (or in addition to) `http://localhost:3000`. If production uses a different
website hostname, add that exact origin as well. Do not use `*`.

The backend must use this allowlist for the response's CSP `frame-ancestors`
and the embed's `postMessage` origin allowlist. Omit the global
`X-Frame-Options: DENY` header only for this embed endpoint; keep the existing
protection on other endpoints. Keep the public embed response free of
account-specific state and cache it for 60 seconds with a 300-second
`stale-while-revalidate` window. Do not expose secrets in this response.

## Website hostname and backend address

Every website hostname uses `PRICING_EMBED_URL`. The backend must allow the
website's exact origin, even when the website is served from localhost.

GitHub Pages previews have a different origin. Add their exact origin to the
allowlist only if the iframe should work there; `www.griidai.com` does not
authorize a GitHub Pages hostname.

## Release and verification checklist

1. Deploy the FastAPI code and confirm the public route exists on the intended
   API host. A `404` means the route is not available at that host/path; changing
   the marketing site's domain or port will not fix it.
2. Open the exact production URL directly and verify it returns HTTP `200` and
   the expected shared pricing HTML, rather than a `404` or an API JSON error.
3. Inspect the response `Content-Security-Policy` and confirm `frame-ancestors`
   includes the exact marketing origin.
4. Open the marketing `/pricing/` page and confirm the iframe loads the backend
   cards, monthly/yearly prices, signup links and legal copy. Test the resize on
   desktop and mobile and confirm no browser console frame or `postMessage`
   origin errors.
5. Change a catalog value in a safe backend test environment, request the embed
   again after the cache window, and verify the new value appears. Restore the
   original test value afterward.

Backend tests specified for this endpoint:

```bash
./.venv/bin/pytest tests/unit/api/test_public_pricing.py -q
```

The website port and backend address are independent. Changing the website
port does not change the configured pricing endpoint.
