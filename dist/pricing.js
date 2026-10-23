(() => {
  'use strict';

  const frame = document.getElementById('shared-pricing-embed');
  if (!frame) return;

  // The backend owns all plan presentation, prices, links and billing copy.
  // Keep this URL absolute so Pages packaging cannot prefix the API path.
  const embedUrl = new URL(frame.dataset.embedUrl);
  const status = document.getElementById('pricing-embed-status');
  const message = document.getElementById('pricing-embed-message');
  const actions = document.getElementById('pricing-embed-actions');
  const retry = document.getElementById('pricing-embed-retry');
  let timeout;

  function showUnavailable() {
    frame.hidden = true;
    status.hidden = false;
    message.textContent = 'Pricing could not be loaded. Please try again or view pricing in the platform.';
    actions.hidden = false;
  }

  function showPricing() {
    window.clearTimeout(timeout);
    frame.hidden = false;
    status.hidden = true;
  }

  // Origin and source must both match; no account state or auth tokens are sent.
  window.addEventListener('message', (event) => {
    if (event.origin !== embedUrl.origin || event.source !== frame.contentWindow) return;
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'pricing:ready') {
      showPricing();
      return;
    }
    if (data.type !== 'pricing:resize' || !Number.isFinite(data.height)) return;
    frame.style.height = `${Math.max(420, Math.min(5000, Math.ceil(data.height)))}px`;
    showPricing();
  });

  function loadPricing() {
    window.clearTimeout(timeout);
    frame.hidden = true;
    status.hidden = false;
    actions.hidden = true;
    message.textContent = 'Loading plans and pricing…';
    frame.style.height = '420px';
    timeout = window.setTimeout(showUnavailable, 15000);
    const requestUrl = new URL(embedUrl);
    frame.src = requestUrl.toString();
  }

  frame.addEventListener('error', () => {
    window.clearTimeout(timeout);
    showUnavailable();
  });
  retry.addEventListener('click', loadPricing);
  loadPricing();
})();
