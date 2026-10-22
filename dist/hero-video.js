(() => {
  const stage = document.getElementById('hero-video-stage');
  const host = document.getElementById('hero-video-player');
  const playButton = document.getElementById('hero-video-play');
  if (!stage || !host || !playButton) return;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const slowConnection = connection && (connection.saveData || /^(slow-2g|2g|3g)$/.test(connection.effectiveType || '') || (connection.downlink > 0 && connection.downlink < 1.5) || connection.rtt > 500);
  let player, active = false, ready = false, timer, bufferingTimer, apiRequested = false, manual = false;
  const clearTimers = () => { clearTimeout(timer); clearTimeout(bufferingTimer); };
  function fallback(destroy = true) {
    clearTimers();
    stage.classList.remove('is-playing');
    playButton.hidden = false;
    if (destroy) {
      active = false; ready = false;
      if (player) { try { player.destroy(); } catch (_) {} player = undefined; }
      host.replaceChildren();
    }
  }
  function createPlayer() {
    if (!active || player || !window.YT || !window.YT.Player) return;
    const frame = document.createElement('iframe');
    frame.id = 'griidai-youtube-player';
    frame.title = 'GriidAi platform video';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = 'https://www.youtube.com/embed/0gjTXhTI1PQ?enablejsapi=1&autoplay=1&mute=0&playsinline=1&controls=1&rel=0&origin=' + encodeURIComponent(window.location.origin);
    frame.tabIndex = -1;
    host.appendChild(frame);
    player = new window.YT.Player(frame, {
      events: {
        onReady(event) {
          if (!active) return;
          ready = true;
          event.target.unMute();
          event.target.setVolume(75);
          event.target.playVideo();
        },
        onStateChange(event) {
          if (!active) return;
          if (event.data === 1) {
            clearTimers();
            stage.classList.add('is-playing');
            playButton.hidden = true;
            event.target.getIframe().tabIndex = 0;
          } else if (event.data === 3) {
            clearTimeout(bufferingTimer);
            bufferingTimer = setTimeout(() => fallback(), manual ? 15000 : 6000);
          } else {
            clearTimeout(bufferingTimer);
          }
        },
        onAutoplayBlocked() { if (active) fallback(false); },
        onError() { fallback(); }
      }
    });
  }
  function start(isManual = false) {
    manual = isManual;
    playButton.hidden = true;
    active = true;
    clearTimers();
    timer = setTimeout(() => fallback(), isManual ? 20000 : 7000);
    if (player && ready) {
      player.unMute(); player.setVolume(75); player.playVideo();
    } else if (window.YT && window.YT.Player) {
      createPlayer();
    } else if (!apiRequested) {
      apiRequested = true;
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => { apiRequested = false; fallback(); };
      window.onYouTubeIframeAPIReady = createPlayer;
      document.head.appendChild(script);
    }
  }
  playButton.addEventListener('click', () => start(true));
  if (slowConnection || navigator.onLine === false) fallback();
  else start();
})();
