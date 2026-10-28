/* Runs in the page's own JS world, ONLY inside CineTube's hidden preview players
   (a youtube.com/watch page opened with ?ct_preview=1 inside an iframe). Normal tabs are never touched.
   1. drops YouTube's content-playback pings (not ad pings), so previews don't count as views or watch history
   2. keeps every <video> muted until the extension allows sound
   3. lets the extension switch the already-loaded player to another video (no page reload),
      and preload a video: load it, let it buffer, hold it paused until it is needed */
(() => {
  if (window === window.top || !/[?&]ct_preview=1(&|$)/.test(location.search)) return;

  /* ---- 1. no stats pings ---- */
  const STATS = /\/api\/stats\/(playback|watchtime|delayplay|atr)\b|\/ptracking\b/;
  const bad = (u) => STATS.test(String((u && u.url) || u));
  // the hidden player only needs the video, so skip the page's comments / recommendations / guide requests
  const LIGHT = /\/youtubei\/v1\/(next|guide|notification\/\w+|get_survey)\b/;
  const realFetch = window.fetch;
  window.fetch = function (input) {
    const u = String((input && input.url) || input);
    if (bad(input)) return Promise.resolve(new Response('', { status: 204 }));
    if (LIGHT.test(u)) {
      return Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    return realFetch.apply(this, arguments);
  };

  // and remove the page parts nobody sees (comments, related, header, sidebar) to save memory
  const HEAVY = '#secondary,#below,#comments,#related,ytd-masthead,#masthead-container,tp-yt-app-drawer,ytd-mini-guide-renderer,' +
    'ytd-guide-renderer,#chat,ytd-live-chat-frame,ytd-merch-shelf-renderer,ytd-engagement-panel-section-list-renderer';
  let sweeps = 0;
  const sweep = setInterval(() => {
    try { document.querySelectorAll(HEAVY).forEach((n) => n.remove()); } catch (_) { /* ignore */ }
    if (++sweeps > 40) clearInterval(sweep);
  }, 500);
  const realOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__ctBlock = bad(url);
    return realOpen.apply(this, arguments);
  };
  const realSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    if (this.__ctBlock) { try { this.abort(); } catch (_) { /* ignore */ } return; }
    return realSend.apply(this, arguments);
  };
  const realBeacon = navigator.sendBeacon;
  navigator.sendBeacon = function (url) {
    if (bad(url)) return true;
    return realBeacon.apply(this, arguments);
  };

  /* ---- 2. silent until allowed ---- */
  let allowAudio = false;
  const nativePlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (!allowAudio) this.muted = true;
    return nativePlay.apply(this, arguments);
  };
  setInterval(() => {
    if (allowAudio) return;
    document.querySelectorAll('video').forEach((v) => { if (!v.muted) v.muted = true; });
  }, 40);

  /* ---- 3. bridge to the extension ---- */
  const post = (msg) => {
    try { window.parent.postMessage(Object.assign({ ct: 'pv' }, msg), location.origin); } catch (_) { /* ignore */ }
  };
  const player = () => document.getElementById('movie_player');
  const hasApi = (p) => !!p && typeof p.loadVideoById === 'function';
  let last = '';
  let preloadId = null;

  const quality = (p) => { try { p.setPlaybackQualityRange('small', 'medium'); } catch (_) { /* optional */ } };
  const currentId = (p) => { try { return p.getVideoData().video_id; } catch (_) { return ''; } };
  const stateOf = (p) => { try { return p.getPlayerState(); } catch (_) { return -1; } };

  const readyTimer = setInterval(() => {
    const p = player();
    if (!p || typeof p.getPlayerState !== 'function') return;
    clearInterval(readyTimer);
    try { p.mute(); p.stopVideo(); } catch (_) { /* ignore */ }
    post({ ev: 'ready', api: hasApi(p) });

    setInterval(() => {
      const q = player();
      if (!q) return;
      const id = currentId(q);
      const state = stateOf(q);
      let adState = 0;
      try { adState = typeof q.getAdState === 'function' ? q.getAdState() : 0; } catch (_) { /* ignore */ }
      const ad = q.classList.contains('ad-showing') || adState === 1;

      // a preloaded video: as soon as it plays, freeze it (it keeps buffering) and report it ready
      if (preloadId && id === preloadId && state === 1 && !ad) {
        const pid = preloadId;
        preloadId = null;
        try { q.pauseVideo(); } catch (_) { /* ignore */ }
        post({ ev: 'preloaded', id: pid });
      }

      const key = `${id}|${state}|${ad}`;
      if (key !== last) { last = key; post({ ev: 'status', id, state, ad }); }
    }, 100);
  }, 100);

  window.addEventListener('message', (e) => {
    if (e.source !== window.parent || e.origin !== location.origin) return;
    const m = e.data;
    if (!m || m.ct !== 'cmd') return;
    const p = player();
    if (!p) return;
    try {
      if (m.cmd === 'start') {
        // show this video now: reuse it if it is already loaded (preloaded / just watched), else load it
        last = '';
        preloadId = null;
        allowAudio = false;
        p.mute();
        const st = stateOf(p);
        const same = currentId(p) === m.id && (st === 1 || st === 2 || st === 3) && !p.classList.contains('ad-showing');
        if (same) {
          const t = typeof p.getCurrentTime === 'function' ? p.getCurrentTime() : 0;
          if ((m.start || 0) > 0 && Math.abs(t - m.start) > 3) p.seekTo(m.start, true);
          p.playVideo();
        } else if (hasApi(p)) {
          p.loadVideoById(m.id, m.start || 0);
          p.playVideo();
          quality(p);
        } else post({ ev: 'noapi' });
      } else if (m.cmd === 'preload') {
        allowAudio = false;
        p.mute();
        if (currentId(p) === m.id && stateOf(p) !== -1 && stateOf(p) !== 5) {
          post({ ev: 'preloaded', id: m.id });
        } else if (hasApi(p)) {
          last = '';
          preloadId = m.id;
          p.loadVideoById(m.id, m.start || 0);
          quality(p);
        }
      } else if (m.cmd === 'play') { // nudge: the player sometimes sits cued / paused after a load
        allowAudio = false;
        p.mute();
        p.playVideo();
      } else if (m.cmd === 'unmute') {
        allowAudio = true;
        p.unMute();
        p.setVolume(m.volume || 40);
      } else if (m.cmd === 'remute') {
        allowAudio = false;
        p.mute();
        p.playVideo();
      } else if (m.cmd === 'reset') { // clear a stuck ad / error state completely
        last = '';
        preloadId = null;
        allowAudio = false;
        p.mute();
        p.stopVideo();
      } else if (m.cmd === 'stop') {
        allowAudio = false;
        p.mute();
        p.pauseVideo();
      }
    } catch (err) { post({ ev: 'error', msg: String(err) }); }
  });
})();
