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

The website is static and does not read a server-side `.env` file. Change the
iframe URLs in:

```text
dist/pricing/index.html
```

The iframe has two explicit URL attributes:

```html
data-embed-url="https://api.griidai.com/api/v1/public/pricing/embed?mode=public"
data-local-embed-url="http://localhost:8001/api/v1/public/pricing/embed?mode=public"
```

- `data-embed-url` is the production backend base URL. Replace the hostname
  (or add a port after the hostname if the backend is intentionally served on a
  non-standard port). Keep the endpoint path and `mode=public` query string.
- `data-local-embed-url` is the developer's local backend address. The current
  local backend is `localhost:8001`; replace `localhost` with the reachable
  backend IP/host and `8001` with its actual port when those differ.
- `dist/pricing.js` selects the local URL only when the marketing site itself
  is opened on localhost/loopback. All other hosts use `data-embed-url`.

The website host currently runs locally at `http://localhost:3000`. This is
separate from the backend port `8001`. If either host or port changes, update
the corresponding URL above and allow the website's exact origin in the
backend configuration below. Do not put an API key or user session token in
these public URLs; this endpoint is public catalog data.

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

## Local and production behavior

| Marketing site | Backend URL used | Required allowed origin |
| --- | --- | --- |
| Local site at `http://localhost:3000` | `http://localhost:8001/api/v1/public/pricing/embed?mode=public` | `http://localhost:3000` |
| Local site at `http://localhost:4319` | Local backend URL configured in `data-local-embed-url` | `http://localhost:4319` |
| Production site at `https://www.griidai.com` | Production URL configured in `data-embed-url` | `https://www.griidai.com` |

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

The public pricing URL is separate from the website's local port. The marketing
site on `localhost:3000` can load a backend on `localhost:8001`; production uses
the production API host configured above.
