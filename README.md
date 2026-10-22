# GriidAi Website

A static marketing website for GriidAi, including platform, spatial analysis, solutions, team, pricing and the Data, Industries, Use Cases, Ecosystem and Enterprise hubs. Workflows are currently hidden. All site code and images are included. Running locally requires no dependency installation or build step.

[View the live website](https://abdelrahmanembaby-oss.github.io/moh_web/)

## Run on Windows

1. Install Node.js 18 or newer if it is not already installed.
2. Clone this repository or download and extract the complete project.
3. Open `START-WINDOWS.bat` inside the project folder.
4. Open [http://localhost:3000](http://localhost:3000) in your browser and keep the server window open.

## Run with Node.js

Open a terminal in the project folder and run:

```sh
npm start
```

Visit [http://localhost:3000](http://localhost:3000). Press `Ctrl+C` in the terminal to stop the server.

## Alternative: Python

If Python 3 is installed, run:

```sh
python -m http.server 3000 --bind 127.0.0.1 --directory dist
```

Then visit [http://localhost:3000](http://localhost:3000).

## Edit the website

- Homepage: `dist/index.html`
- Other pages: `dist/about/`, `dist/platform/`, `dist/solutions/`, `dist/agentic-geoai/`, `dist/spatial-analysis/`, `dist/pricing/`, and `dist/contact-sales.html`
- Styles and interactions: CSS and JavaScript files in `dist/`
- Images and fonts: `dist/assets/`

### Content hubs and shared navigation

The six content hubs use the existing site's colors, typography, header and footer. They are generated as complete HTML, with optional JavaScript for filters, inline details and inquiry handling. Their content remains readable without JavaScript. Industry sections use stable anchors. Each published use case has a dedicated detail page. Industries and Use Cases remain separate in page content; both stay available in the shared navigation.

- Editorial records: `scripts/hub-content.cjs`
- Shared templates, navigation and page copy: `scripts/build-hubs.cjs`
- Source-based FAQ copy: `scripts/hub-faqs.json`
- Hub styling and interactions: `dist/hubs.css`, `dist/hubs.js`
- Shared navigation: `dist/site-shell.css`, `dist/site-navigation.js`

After changing hub content or shared templates, run:

```sh
npm run build:content
```

The generator also updates navigation and footer links on retained pages. Edit records/templates rather than generated hub HTML. It preserves existing content anchors and the legacy Contact Sales route.

### Video-based use cases

The Use Cases hub contains exactly seven user-selected English videos: deforestation,
sea-level rise, future crop suitability, sports-facility site selection, combined
vector/raster analysis, rooftop solar and urban heat risk. Each video has one card
and one detail page. Other previous topics are retired and redirect to the hub.
The autoplay overview in the hub hero remains separate from these seven cards.

- Titles, descriptions, explanatory copy, source scope and video URLs:
  `scripts/use-cases-content.json`
- Directory and detail rendering: `scripts/render-use-cases.cjs` and
  `scripts/render-use-case-detail.cjs`
- Responsive source-video thumbnails: `dist/assets/use-cases/videos/`, with
  attribution in `sources.json`
- Optional thumbnail preparation: `node scripts/prepare-use-case-thumbnails.cjs`
  (requires Sharp in the development environment; running the site does not)

Copy is based on the public video titles and descriptions. It does not claim
full-video or transcript verification. Only source-supported analysis descriptions are presented; review guidance is
kept distinct from reported outcomes. Each detail page includes the source video and a
YouTube fallback link. Detail-page players load only after a visitor chooses
Play; the complete text and source link also work without JavaScript. The All
Use Cases hero instead embeds "From 200 clicks to 5 prompts. Zero friction"
on page load with muted autoplay, inline playback and player controls. Browsers
may still apply their own autoplay policies.

Retired generic and split-topic routes redirect to the nearest combined page,
with Hydrology returning to the hub. The generator owns those redirects, metadata,
sitemap entries and the featured use-case navigation. Add or edit records and run
`npm run build:content`; do not edit generated HTML directly.

Provider records were not supplied with the six October 2026 specifications. The Data directory therefore uses the specified empty state rather than fabricated integrations. Format notes are a handling reference; direction-specific compatibility and verification dates remain unclaimed until verified. Workflow records are labeled **Example**, with inputs, methods, validation and limitations, rather than asserted as production-ready one-click workflows.

The ecosystem inquiry at `/ecosystem/express-interest/` uses the existing Contact Sales Google Apps Script endpoint and its field contract. Paths, interests, participant type, message and permission context are included in `gisUsage`. No backend changes or separate CRM are introduced. Because the endpoint uses `no-cors`, the browser cannot confirm durable storage or email delivery; the UI states this and retains the answers. Validate the receiving Sheet/email handler with the service owner before claiming confirmed receipt. QA uses intercepted requests and does not submit live test inquiries.

Save your changes and refresh the browser. Use the local server rather than opening `index.html` directly, because internal links use paths relative to the website root.

YouTube videos and external links require an internet connection. Site images and code are stored locally. This repository contains the GriidAi marketing website; it does not contain the geospatial analysis application's source code.

## Shared pricing presentation

`dist/pricing/index.html` embeds the backend-rendered public catalog at
`https://api.griidai.com/api/v1/public/pricing/embed?mode=public`.
The backend owns the cards, prices, annual/monthly toggle, signup links, subscription
notice, add-ons and disclaimer. Do not duplicate them in this repository or restore
the former static pricing snapshot. The site's header, footer and Enterprise
navigation remain part of the marketing site.

`dist/pricing.js` validates both the message origin and the iframe window before
applying resize messages, bounded to 420–5000 CSS pixels. The iframe allows scripts,
its own origin, and top-level navigation following a user click. No authentication
token or account-specific pricing state is passed to it. Loading failures offer
a retry and a link to platform pricing instead of displaying stale prices.

When opened on localhost, 127.0.0.1 or IPv6 loopback, the pricing page instead
uses its explicit `data-local-embed-url`:
`http://localhost:8001/api/v1/public/pricing/embed?mode=public`.
This address comes from the local GriidAi backend project. Local iframe loads
include a cache-busting query parameter so reloading the page or selecting Try
again reads fresh backend output. This is load-time refresh, not live push.
The local API must be running a version that contains the shared-pricing route,
and its iframe allow list must include the exact website origin (normally
`http://localhost:3000`). Public deployments keep using the production URL;
no API keys or session tokens are needed for this public endpoint.

The backend public template fixes `mode=public` to a light theme. The platform
mode keeps its existing host-controlled theme. The corresponding backend template
change must travel with the backend deployment; marketing CSS cannot restyle
the cross-origin pricing document.

The backend team must deploy the public endpoint and include the embedding origin
in `PRICING_EMBED_ALLOWED_ORIGINS`. The primary deployment uses
`https://www.griidai.com`; GitHub Pages and localhost previews work only when their
exact origins are allowed separately. The production endpoint and its deployed
security headers must be verified after the backend deployment. Local integration
tests with intercepted responses do not verify that deployment.

## GitHub Pages deployment

The live website is hosted at [https://abdelrahmanembaby-oss.github.io/moh_web/](https://abdelrahmanembaby-oss.github.io/moh_web/).

Pushing to `main` automatically builds and deploys `dist/` through `.github/workflows/pages.yml`. The build adjusts internal links, images, fonts, sitemap URLs, and data requests for the repository path. Local files continue to work at [http://localhost:3000](http://localhost:3000).

To prepare the Pages artifact locally:

```sh
npm run build:pages
```

The generated `.deploy/` folder and local QA files are excluded from Git. Running or editing the project locally does not publish changes; deployment starts when changes are pushed to `main`.

The Contact Sales page uses the legacy `/contact-sales.html` path. The previous `/contact-sales/` path redirects to it and preserves query parameters and anchors. To restore `https://www.griidai.com/contact-sales.html`, deploy these static files to the existing hosting service for that domain; publishing to this GitHub Pages repository does not update that separate host.
