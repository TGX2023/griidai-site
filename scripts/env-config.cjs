const fs = require('node:fs');
const path = require('node:path');

const PRICING_PATH = '/api/v1/public/pricing/embed';

function loadEnvFile(project) {
  const envFile = path.join(project, '.env');
  if (!fs.existsSync(envFile)) return;

  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '');
    }
    process.env[match[1]] = value;
  }
}

function validatePricingUrl(name, value) {
  if (!value) throw new Error(`Missing ${name}. Copy .env.example to .env or set it in the build environment.`);
  let url;
  try { url = new URL(value); } catch { throw new Error(`${name} must be an absolute HTTP(S) URL.`); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) {
    throw new Error(`${name} must be an absolute HTTP(S) URL without credentials or a fragment.`);
  }
  if (url.pathname !== PRICING_PATH || url.searchParams.get('mode') !== 'public') {
    throw new Error(`${name} must use ${PRICING_PATH}?mode=public.`);
  }
  return value;
}

function getPricingUrls(project) {
  loadEnvFile(project);
  return {
    production: validatePricingUrl('PRICING_EMBED_URL', process.env.PRICING_EMBED_URL),
    local: validatePricingUrl('PRICING_LOCAL_EMBED_URL', process.env.PRICING_LOCAL_EMBED_URL),
  };
}

function renderPricingHtml(html, urls) {
  const rendered = html
    .replaceAll('__PRICING_EMBED_URL__', urls.production.replace(/&/g, '&amp;').replace(/"/g, '&quot;'))
    .replaceAll('__PRICING_LOCAL_EMBED_URL__', urls.local.replace(/&/g, '&amp;').replace(/"/g, '&quot;'));
  if (rendered.includes('__PRICING_')) throw new Error('Unresolved pricing URL placeholder in pricing HTML.');
  return rendered;
}

module.exports = { getPricingUrls, renderPricingHtml };
