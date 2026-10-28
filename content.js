(() => {
  'use strict';

  const ICONS = {
    search: 'M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z',
    home: 'M12 3 2 12h3v8h5v-6h4v6h5v-8h3z',
    subs: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm6 3v8l6-4z',
    plus: 'M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z',
    heart: 'M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z',
    history: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-1 3v6l5 3 1-1.7-4-2.3V7z',
    download: 'M11 3h2v9.2l3.3-3.3 1.4 1.4L12 16l-5.7-5.7 1.4-1.4L11 12.2V3zM5 19h14v2H5z',
    gear: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    sliders: 'M3 6h9v2H3zM12 4h3v6h-3zM15 6h6v2h-6zM3 11h4v2H3zM7 9h3v6H7zM10 11h11v2H10zM3 16h12v2H3zM15 14h3v6h-3zM18 16h3v2h-3z',
    play: 'M8 5v14l11-7z',
    pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
    back: 'M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z'
  };

  const RAIL = [
    { label: 'Search', icon: 'search', action: 'search' },
    { label: 'Home', icon: 'home', path: '/' },
    { label: 'Subscriptions', icon: 'subs', path: '/feed/subscriptions' },
    { label: 'My List', icon: 'plus', path: '/playlist?list=WL' },
    { label: 'Liked', icon: 'heart', path: '/playlist?list=LL' },
    { label: 'History', icon: 'history', path: '/feed/history' },
    { label: 'Downloads', icon: 'download', path: '/feed/downloads', bottom: true },
    { label: 'Settings', icon: 'gear', path: '/account', bottom: true },
    { label: 'CineTube', icon: 'sliders', action: 'options', bottom: true }
  ];

  const MAX_CARDS = 20;
  let cfg = ctNormalize({});
  const memCache = new Map();
  const feedById = new Map();
  const log = (...a) => console.info('[CineTube]', ...a);

  const isHome = () => location.pathname === '/';
  const root$ = document.documentElement;
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const svg = (d) => {
    const ns = 'http://www.w3.org/2000/svg';
    const s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill-rule', 'evenodd');
    s.append(p);
    return s;
  };

  let scrolled = false;
  window.addEventListener('scroll', () => {
    const now = window.scrollY > 10;
    if (now !== scrolled) { scrolled = now; root$.classList.toggle('ct-scrolled', now); }
  }, { passive: true });

  /* ================= side rail ================= */
  function go(path) {
    const orig = document.querySelector(`a.yt-simple-endpoint[href="${path}"]`);
    if (orig) orig.click(); else location.assign(path);
  }

  function focusSearch() {
    const input = document.querySelector('ytd-masthead input[name="search_query"], ytd-masthead input#search');
    if (input && input.offsetParent) { input.focus(); input.select?.(); return; }
    document.querySelector('ytd-masthead button[aria-label="Search"], ytd-masthead #search-icon-legacy')?.click();
    setTimeout(() => document.querySelector('ytd-masthead input')?.focus(), 150);
  }

  function isActive(path) {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    if (path.includes('?')) return (location.pathname + location.search).startsWith(path);
    return location.pathname.startsWith(path);
  }

  function markActive() {
    document.querySelectorAll('#ct-rail a').forEach((a) => {
      const on = isActive(a.dataset.path);
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function buildRail() {
    if (document.getElementById('ct-rail')) return;
    const nav = el('nav');
    nav.id = 'ct-rail';
    nav.setAttribute('aria-label', 'Main');
    const main = el('div', 'ct-rail-main');
    const bottom = el('div', 'ct-rail-bottom');
    RAIL.forEach((item) => {
      const a = el('a');
      a.href = item.path || '#';
      a.dataset.path = item.path || '';
      a.append(svg(ICONS[item.icon]), el('span', null, item.label));
      a.addEventListener('click', (e) => {
        if (e.button || e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        a.blur(); // otherwise the rail stays expanded because the link keeps focus
        if (item.action === 'search') focusSearch();
        else if (item.action === 'options') window.open(chrome.runtime.getURL('options.html'), '_blank');
        else go(item.path);
      });
      (item.bottom ? bottom : main).append(a);
    });
    nav.append(main, bottom);
    const edge = el('div');
    edge.id = 'ct-rail-edge';
    document.body.append(edge, nav);
    markActive();
  }

  /* ================= data ================= */
  const TTL = 10 * 60 * 1000;
  const ssGet = (key) => {
    try {
      const r = JSON.parse(sessionStorage.getItem('ct:' + key));
      if (r && Date.now() - r.t < TTL) return r.v;
    } catch (_) { /* ignore */ }
    return null;
  };
  const ssSet = (key, v) => {
    try { sessionStorage.setItem('ct:' + key, JSON.stringify({ t: Date.now(), v })); } catch (_) { /* quota */ }
  };

  let inflight = 0;
  const waiting = [];
  function limited(fn) {
    return new Promise((resolve, reject) => {
      const run = () => {
        inflight++;
        fn().then(resolve, reject).finally(() => { inflight--; waiting.shift()?.(); });
      };
      inflight < 2 ? run() : waiting.push(run);
    });
  }

  const txt = (n) => (n.textContent || '').trim();
  // text that is a view count / upload time rather than a channel name
  const AGE_RE = /(\d+\s?(?:seconds?|minutes?|hours?|days?|weeks?|months?|years?|mo|yrs?|[smhdwy])\s+ago)/i;
  const NUM_RE = /^[\d.,]+\s?[KMBkmb]?$/;
  const fmtViews = (t) => { const x = String(t).trim(); return NUM_RE.test(x) ? `${x} views` : x; };
  // item text (title removed) -> ["243K views", "2d ago"], for both the long and the short YouTube styles
  function parseMeta(rest) {
    const age = rest.match(AGE_RE) || rest.match(/((?:Streamed|Premiered)\s+\d+\s+\w+\s+ago)/i);
    let views = (rest.match(/(\d[\d.,]*\s?[KMBkmb]?\s+(?:views?|watching))/) || rest.match(/\b(No views)\b/) || [])[1];
    if (!views && age) { // short style: just "243K" sitting before the age (the views icon has no text)
      const m = rest.slice(0, age.index).match(/(?:^|[\s▷▶►•·])((?:\d{1,3}(?:[.,]\d{1,2})?[KMBkmb])|\d{1,3}(?:,\d{3})*)\s*$/);
      if (m) views = `${m[1]} views`;
    }
    return [views, age && age[1]].filter(Boolean);
  }
  const videoMeta = (v) => {
    const vt = v.shortViewCountText?.simpleText || v.viewCountText?.simpleText || (v.viewCountText?.runs || []).map((r) => r.text).join('');
    return [vt ? fmtViews(vt) : '', v.publishedTimeText?.simpleText].filter(Boolean).join(' • ');
  };
  const lockupMeta = (parts) => [...new Set(parts.filter((t) => VIEWS_RE.test(t) || NUM_RE.test(String(t).trim())).map(fmtViews))].join(' • ');
  const VIEWS_RE = /\b(views?|watching|waiting|premieres?|streamed)\b|\bago\b/i;

  function pickTitle(item) {
    const cands = [
      item.querySelector('#video-title'),
      item.querySelector('[class*="lockup-metadata-view-model"][class*="__title"]'),
      item.querySelector('h3 a'),
      item.querySelector('h3')
    ];
    for (const c of cands) {
      if (!c) continue;
      const t = (c.textContent || c.getAttribute('title') || c.getAttribute('aria-label') || '').trim();
      if (t) return t;
    }
    return '';
  }

  const AD_SEL = 'ytd-ad-slot-renderer, ytd-display-ad-renderer, ytd-in-feed-ad-layout-renderer, ytd-promoted-sparkles-web-renderer, ytd-banner-promo-renderer';

  function collectFeed() {
    const out = [];
    const seen = new Set();
    document.querySelectorAll('ytd-browse[page-subtype="home"] ytd-rich-item-renderer').forEach((item) => {
      if (item.querySelector(AD_SEL)) return;
      const a = item.querySelector('a[href^="/watch?v="]');
      if (!a) return;
      const m = a.getAttribute('href').match(/[?&]v=([\w-]{11})/);
      if (!m || seen.has(m[1])) return;
      const title = pickTitle(item);
      if (!title) return;
      seen.add(m[1]);

      // Read the item's visible text, not class names (YouTube renames those and uses several layouts)
      const raw = (item.textContent || '').replace(/\s+/g, ' ');
      const rest = raw.split(title).join(' '); // keep numbers inside the title from matching
      let metaParts = parseMeta(rest);

      const texts = [...item.querySelectorAll(
        '[class*="content-metadata-view-model"][class*="__metadata-text"], #metadata-line span, .inline-metadata-item')]
        .map(txt).filter(Boolean);
      if (!metaParts.length) metaParts = texts.filter((t) => VIEWS_RE.test(t) || NUM_RE.test(t)).map(fmtViews);

      let channel = [...item.querySelectorAll('ytd-channel-name a, ytd-channel-name, a[href^="/@"], a[href^="/channel/"], a[href^="/c/"]')]
        .map(txt).find(Boolean) || texts.find((t) => !VIEWS_RE.test(t)) || '';
      if (!channel) {
        const al = item.querySelector('a[aria-label]')?.getAttribute('aria-label') || '';
        const m2 = al.match(/ by (.+?)\s+[\d.,]+\s?[KMB]?\s+views?/i);
        if (m2) channel = m2[1];
      }
      const durM = rest.match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/);
      const v = {
        id: m[1],
        title,
        channel,
        dur: (item.querySelector('ytd-thumbnail-overlay-time-status-renderer #text, [class*="badge-shape"][class*="__text"]')?.textContent || '').trim()
          || (durM ? durM[1] : ''),
        meta: [...new Set(metaParts)].join(' • '),
        anchor: a
      };
      feedById.set(v.id, v);
      out.push(v);
    });
    return out;
  }

  function extractVideos(data, max = 24) {
    const out = [];
    const seen = new Set();
    const push = (v) => {
      if (!v.id || !v.title || seen.has(v.id) || out.length >= max) return;
      seen.add(v.id);
      out.push(v);
    };
    (function walk(o) {
      if (!o || typeof o !== 'object' || out.length >= max) return;
      const v = o.videoRenderer || o.gridVideoRenderer;
      if (v) {
        if (!v.navigationEndpoint?.reelWatchEndpoint) {
          push({
            id: v.videoId,
            title: v.title?.runs?.[0]?.text || v.title?.simpleText || '',
            channel: v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || '',
            dur: v.lengthText?.simpleText || '',
            moving: v.richThumbnail?.movingThumbnailRenderer?.movingThumbnailDetails?.thumbnails?.[0]?.url || '',
            meta: videoMeta(v)
          });
        }
        return;
      }
      const lk = o.lockupViewModel;
      if (lk) {
        if (lk.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
          const md = lk.metadata?.lockupMetadataViewModel;
          const rows = md?.metadata?.contentMetadataViewModel?.metadataRows || [];
          const parts = (r) => (r?.metadataParts || []).map((p) => p.text?.content).filter(Boolean);
          const dur = (JSON.stringify(lk.contentImage || {}).match(/"text":"(\d+:\d{2}(?::\d{2})?)"/) || [])[1] || '';
          push({ id: lk.contentId, title: md?.title?.content || '', channel: parts(rows[0])[0] || '', dur, meta: lockupMeta(rows.flatMap((r) => parts(r))) });
        }
        return;
      }
      for (const k in o) walk(o[k]);
    })(data);
    return out;
  }

  function extractChannels(data, max = 24) {
    const out = [];
    const seen = new Set();
    (function walk(o) {
      if (!o || typeof o !== 'object' || out.length >= max) return;
      const c = o.channelRenderer;
      if (c) {
        const id = c.channelId;
        const name = c.title?.simpleText || c.title?.runs?.[0]?.text || '';
        let avatar = c.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';
        if (avatar.startsWith('//')) avatar = 'https:' + avatar;
        avatar = avatar.replace(/=s\d+/, '=s176');
        const base = c.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl || (id ? `/channel/${id}` : '');
        if (id && name && avatar && base && !seen.has(id)) {
          seen.add(id);
          out.push({ id, name, avatar, href: `${base}/videos` });
        }
        return;
      }
      for (const k in o) walk(o[k]);
    })(data);
    return out;
  }

  async function fetchPage(url, key, extract = extractVideos) {
    if (memCache.has(key)) return memCache.get(key);
    const stored = ssGet(key);
    if (stored) { memCache.set(key, stored); return stored; }
    const out = await limited(async () => {
      const res = await fetch(url, { credentials: 'same-origin' });
      const html = await res.text();
      const m = html.match(/var ytInitialData = (\{.+?\});<\/script>/s);
      return m ? extract(JSON.parse(m[1])) : [];
    });
    if (out.length) { memCache.set(key, out); ssSet(key, out); }
    return out;
  }

  const fetchTopic = (q) => fetchPage(`/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D`, q);
  const fetchSubs = () => fetchPage('/feed/subscriptions', '__subs');
  const fetchMyChannels = () => fetchPage('/feed/channels', '__mych', extractChannels);
  async function fetchExploreChannels(qs) {
    const lists = await Promise.all(qs.slice(0, 2).map((q) =>
      fetchPage(`/results?search_query=${encodeURIComponent(q)}&sp=EgIQAg%253D%253D`, 'chq:' + q, extractChannels)));
    const seen = new Set();
    const out = [];
    for (let i = 0; i < 24; i++) {
      for (const l of lists) {
        const c = l[i];
        if (c && !seen.has(c.id)) { seen.add(c.id); out.push(c); }
      }
    }
    return out;
  }

  /* ================= UI pieces ================= */
  // Thumbnails come straight from YouTube's image server (i.ytimg.com), no third-party site needed.
  //   banner: hq720 (1280x720) -> maxresdefault -> mqdefault, whichever exists
  //   cards:  320px by default, 1280px on big / high-density screens (the browser picks from srcset)
  function makeImg(id, big) {
    const img = el('img');
    img.alt = '';
    img.decoding = 'async';
    img.loading = big === 'eager' ? 'eager' : 'lazy';
    const base = `https://i.ytimg.com/vi/${id}/`;
    if (big) {
      const chain = ['hq720.jpg', 'maxresdefault.jpg', 'mqdefault.jpg'];
      let k = 0;
      img.__load = () => { if (!img.getAttribute('src')) img.src = base + chain[k]; };
      img.__unload = () => { img.removeAttribute('src'); k = 0; };
      const next = () => {
        if (k < chain.length - 1) { k++; img.src = base + chain[k]; }
        else img.onerror = img.onload = null;
      };
      img.onerror = next;
      img.onload = () => { if (img.naturalWidth < 300) next(); };
      if (big === 'eager') img.__load();
    } else {
      img.srcset = `${base}mqdefault.jpg 320w, ${base}hq720.jpg 1280w`;
      img.sizes = '(min-width: 2300px) 17vw, (min-width: 1100px) 22vw, (min-width: 750px) 29vw, 45vw';
      img.src = `${base}mqdefault.jpg`;
      img.onerror = () => { img.onerror = null; img.removeAttribute('srcset'); img.src = `${base}mqdefault.jpg`; };
    }
    return img;
  }

  const link = (a, v) => {
    a.href = `/watch?v=${v.id}`;
    a.dataset.id = v.id;
  };

  const isNew = (m) => /\b\d+\s*(second|minute|hour)s?\s+ago/i.test(m || '') || /\b[1-6]\s*days?\s+ago/i.test(m || '');

  function card(v) {
    const a = el('a', 'ct-card');
    link(a, v);
    a.__v = v;
    const thumb = el('div', 'ct-thumb');
    thumb.append(makeImg(v.id));
    if (v.dur) thumb.append(el('span', 'ct-dur', v.dur));
    const cap = el('div', 'ct-cap');
    cap.append(el('strong', 'ct-title', v.title), el('span', 'ct-sub', v.channel));
    if (v.meta) {
      const m = el('span', 'ct-meta');
      if (isNew(v.meta)) m.append(el('b', 'ct-new', 'New'), document.createTextNode(' '));
      m.append(document.createTextNode(v.meta));
      cap.append(m);
    }
    a.append(thumb, cap);
    return a;
  }

  // the hover panel is built the first time a card is hovered/focused (keeps the DOM small)
  function ensureInfo(a) {
    if (a.__ready) return;
    a.__ready = true;
    const v = a.__v;
    const info = el('div', 'ct-info');
    const actions = el('div', 'ct-actions');
    const circle = el('span', 'ct-circle');
    circle.append(svg(ICONS.play));
    actions.append(circle);
    if (v.dur) actions.append(el('span', 'ct-pill', v.dur));
    info.append(actions, el('strong', null, v.title), el('span', null, v.channel));
    if (v.meta) {
      const m = el('span', 'ct-meta2');
      if (isNew(v.meta)) m.append(el('b', 'ct-new', 'New'), document.createTextNode(' '));
      m.append(document.createTextNode(v.meta));
      info.append(m);
    }
    a.querySelector('.ct-cap').append(info);
  }

  function makeRow(title, href, render = card) {
    const sec = el('section', 'ct-row');
    const track = el('div', 'ct-track');
    for (let i = 0; i < 8; i++) track.append(el('div', 'ct-skel'));
    const arrow = (dir) => {
      const b = el('button', 'ct-row-btn ' + (dir < 0 ? 'prev' : 'next'), dir < 0 ? '‹' : '›');
      b.setAttribute('aria-label', dir < 0 ? 'Scroll left' : 'Scroll right');
      b.onclick = () => track.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: 'smooth' });
      return b;
    };
    const head = el('h2');
    head.append(el('span', null, title));
    if (href) {
      const ex = el('a', 'ct-explore', 'Explore all ›');
      ex.href = href;
      head.append(ex);
    }
    const tw = el('div', 'ct-tw');
    tw.append(track, arrow(-1), arrow(1));
    sec.append(head, tw);
    const api = {
      el: sec,
      data: null,
      filled: false,
      fill(vids) {
        this.data = vids;
        this.filled = true;
        const frag = document.createDocumentFragment();
        vids.slice(0, MAX_CARDS).forEach((v) => frag.append(render(v)));
        track.textContent = '';
        track.append(frag);
      },
      empty() {
        if (!this.filled) return;
        this.filled = false;
        track.textContent = '';
        for (let i = 0; i < 8; i++) track.append(el('div', 'ct-skel'));
      },
      refill() { if (!this.filled && this.data) this.fill(this.data); }
    };
    sec.__row = api;
    return api;
  }

  /* ---------- billboard ---------- */
  function buildHero(wrap, vids) {
    wrap.textContent = '';
    if (!vids.length) { wrap.remove(); return; }
    const slides = [];
    const dots = [];
    let i = 0;

    const show = (n) => {
      i = (n + vids.length) % vids.length;
      slides.forEach((s, k) => {
        s.classList.toggle('active', k === i);
        const im = s.querySelector('img');
        if (k === i || k === (i + 1) % vids.length) im.__load?.();
        else if (im.getAttribute('src')) im.__unload?.();
      });
      dots.forEach((d) => d.classList.remove('active'));
      void wrap.offsetWidth;
      dots[i].classList.add('active');
    };

    const dotBox = el('div', 'ct-dots');
    vids.forEach((v, n) => {
      const s = el('div', 'ct-slide');
      const body = el('div', 'ct-body');
      const play = el('a', 'ct-play', 'Watch now');
      link(play, v);
      const more = el('a', 'ct-more', 'More like this');
      more.href = `/results?search_query=${encodeURIComponent(v.title)}`;
      const btns = el('div', 'ct-btns');
      btns.append(play, more);
      body.append(el('div', 'ct-over', v.channel), el('h2', null, v.title), btns);
      s.append(makeImg(v.id, n === 0 ? 'eager' : 'lazy'), body);
      slides.push(s);
      wrap.append(s);

      const d = el('button', 'ct-dot');
      d.setAttribute('aria-label', `Show pick ${n + 1}`);
      d.onclick = () => show(n);
      d.addEventListener('animationend', () => show(i + 1));
      dots.push(d);
      dotBox.append(d);
    });

    const pause = el('button', 'ct-pause');
    pause.setAttribute('aria-label', 'Pause slideshow');
    pause.append(svg(ICONS.pause));
    pause.onclick = () => {
      const on = wrap.classList.toggle('paused');
      pause.setAttribute('aria-label', on ? 'Play slideshow' : 'Pause slideshow');
      pause.replaceChildren(svg(on ? ICONS.play : ICONS.pause));
    };

    const ctrl = el('div', 'ct-ctrl');
    ctrl.append(pause, dotBox);
    wrap.append(ctrl);
    show(0);
  }

  /* ================= rows ================= */
  const rowObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      rowObserver.unobserve(e.target);
      e.target.__load?.();
    });
  }, { rootMargin: '400px 0px' });

  const recycleObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const r = e.target.__row;
      if (!r) return;
      if (e.isIntersecting) r.refill(); else r.empty();
    });
  }, { rootMargin: '3000px 0px' });

  // --- endless scrolling: after your topics, keep adding rows ("More from <channel>", then a built-in pool)
  const EXTRA_POOL = ['Football highlights', 'Movie reviews', 'Space and astronomy', 'Fitness workouts', 'Street food',
    'Anime', 'Coding tutorials', 'Live music', 'History explained', 'DIY and crafts', 'Cars', 'Personal finance',
    'Art and design', 'Travel guides', 'Short films', 'Language learning', 'Photography', 'Gaming walkthroughs',
    'Interviews', 'Science experiments'];
  const more = { used: new Set(), channels: [], ch: 0, ex: 0, added: 0 };
  let moreObs = null;

  function noteChannels(vids) {
    vids.forEach((v) => {
      const c = (v.channel || '').trim();
      if (c && !more.channels.includes(c) && more.channels.length < 12) more.channels.push(c);
    });
  }

  function nextExtra() {
    while (more.ch < more.channels.length) {
      const c = more.channels[more.ch++];
      const key = ('more from ' + c).toLowerCase();
      if (!more.used.has(key)) { more.used.add(key); return { label: `More from ${c}`, q: c }; }
    }
    while (more.ex < EXTRA_POOL.length) {
      const t = EXTRA_POOL[more.ex++];
      if (!more.used.has(t.toLowerCase())) { more.used.add(t.toLowerCase()); return { label: t, q: t }; }
    }
    return null;
  }

  function kickInfinite() {
    const s = document.getElementById('ct-more');
    if (s && moreObs) { moreObs.unobserve(s); moreObs.observe(s); }
  }

  function setupInfinite(wrap) {
    moreObs?.disconnect();
    moreObs = null;
    document.getElementById('ct-more')?.remove();
    if (!cfg.infiniteScroll) return;
    const sentinel = el('div');
    sentinel.id = 'ct-more';
    wrap.after(sentinel);
    moreObs = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      for (let i = 0; i < 2; i++) {
        const t = nextExtra();
        if (!t || more.added >= 30) { moreObs.disconnect(); sentinel.remove(); return; }
        more.added++;
        addRow(wrap, t.label, `/results?search_query=${encodeURIComponent(t.q)}`, () => fetchTopic(t.q));
      }
    }, { rootMargin: '900px 0px' });
    moreObs.observe(sentinel);
  }

  function addRow(wrap, label, href, load, opts = {}) {
    const row = makeRow(label, href);
    row.el.__load = async () => {
      let vids = [];
      try { vids = await load(); } catch (_) { /* leave empty */ }
      if (vids.length) { if (opts.note) noteChannels(vids); row.fill(vids); recycleObs.observe(row.el); }
      else { row.el.remove(); kickInfinite(); }
    };
    wrap.append(row.el);
    rowObserver.observe(row.el);
  }

  // round channel logos
  function chanCard(c) {
    const a = el('a', 'ct-chan');
    a.href = c.href;
    const ava = el('span', 'ct-ava');
    const img = el('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.src = c.avatar;
    ava.append(img);
    a.append(ava, el('span', 'ct-cname', c.name));
    return a;
  }

  function addChannelRow(wrap, label, href, load) {
    const row = makeRow(label, href, chanCard);
    row.el.classList.add('ct-chrow');
    row.el.__load = async () => {
      let list = [];
      try { list = await load(); } catch (_) { /* leave empty */ }
      if (list.length) { row.fill(list); recycleObs.observe(row.el); } else { row.el.remove(); kickInfinite(); }
    };
    wrap.append(row.el);
    rowObserver.observe(row.el);
  }

  function renderTopics(wrap) {
    wrap.textContent = '';
    more.used = new Set(cfg.topics.map((t) => t.toLowerCase()));
    more.channels = []; more.ch = 0; more.ex = 0; more.added = 0;
    if (cfg.channelRows) addChannelRow(wrap, 'Your channels', '/feed/channels', fetchMyChannels);
    addRow(wrap, 'From your subscriptions', '/feed/subscriptions', fetchSubs, { note: true });
    let exploreAdded = false;
    const explore = () => {
      if (exploreAdded || !cfg.channelRows) return;
      exploreAdded = true;
      addChannelRow(wrap, 'Explore channels', null, () => fetchExploreChannels(cfg.topics));
    };
    cfg.topics.forEach((q, i) => {
      addRow(wrap, q, `/results?search_query=${encodeURIComponent(q)}`, () => fetchTopic(q));
      if (i === 2) explore();
    });
    explore();
    setupInfinite(wrap);
  }

  /* ================= hover preview =================
     YouTube refuses its /embed player on youtube.com itself (error 152), so previews use the real
     watch page in hidden iframes ("slots"). A slot stays loaded; hovering a card tells it to switch to
     that card's video (no page load), the iframe is placed exactly over the card's thumbnail, and it fades
     in once the video is really playing. Two slots exist: while one shows the hovered card, the other
     PRELOADS the next card to the right, so moving along a row starts instantly.
     Inside the frames only the <video> is visible, and preview-main.js (page world, preview frames only)
     keeps them silent until we allow sound and drops the view/history pings. */
  const pv = { card: null, hoverTimer: null, extra: null };
  const slots = [0, 1].map((n) => ({ n, frame: null, ready: false, holds: null, prefetching: null, queue: [], idle: null }));
  let cur = null;   // the preview being shown / loading
  let raf = 0;
  const warmMs = () => (cfg.keepWarm ? 5 * 60 * 1000 : 45 * 1000);
  const adSeen = new Set(); // videos that start with an ad: previews skip them (ads are never skipped)

  const toSeconds = (d) => {
    const p = (d || '').split(':').map(Number);
    return p.length && !p.some(Number.isNaN) ? p.reduce((a, x) => a * 60 + x, 0) : 0;
  };
  const startFor = (v) => (cfg.skipIntro && toSeconds(v.dur) > 180 ? Math.floor(toSeconds(v.dur) * 0.2) : 0);

  const WATCH_CSS = `
    html,body{background:#000!important;overflow:hidden!important}
    body *{visibility:hidden!important}
    #movie_player,#movie_player *{visibility:visible!important}
    #movie_player{position:fixed!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;z-index:2147483647!important;background:#000!important}
    #movie_player .html5-video-container{width:100%!important;height:100%!important;left:0!important;top:0!important}
    #movie_player video{width:100%!important;height:100%!important;left:0!important;top:0!important;object-fit:cover!important}
    .ytp-chrome-top,.ytp-chrome-bottom,.ytp-gradient-top,.ytp-gradient-bottom,.ytp-watermark,.ytp-pause-overlay,.ytp-ce-element,
    .ytp-cards-teaser,.ytp-large-play-button,.ytp-spinner,.ytp-paid-content-overlay,.ytp-endscreen-content,.ytp-impression-link,
    .ytp-show-cards-title,.ytp-contextmenu,.ytp-popup,.ytp-ad-overlay-container,.ytp-iv-video-content,.ytp-player-content,
    .ytp-cued-thumbnail-overlay{display:none!important}`;

  // optional status text on the card (Settings > Show preview diagnostics)
  function diag(card, msg) {
    if (!cfg.diagnostics || !card) return;
    let b = card.querySelector('.ct-diag');
    if (!b) { b = el('span', 'ct-diag'); card.querySelector('.ct-thumb').append(b); }
    b.textContent = msg;
  }

  function slotPost(slot, msg) {
    try { slot.frame?.contentWindow?.postMessage({ ct: 'cmd', ...msg }, location.origin); } catch (_) { /* gone */ }
  }

  // commands wait in a queue until the player inside the iframe says it is ready
  function slotSend(slot, msg) {
    clearTimeout(slot.idle);
    slot.idle = setTimeout(() => { if (!cur || cur.slot !== slot) slotDestroy(slot); }, warmMs());
    if (slot.ready) { slotPost(slot, msg); return; }
    if (msg.cmd === 'start' || msg.cmd === 'preload') slot.queue = slot.queue.filter((q) => q.cmd !== 'start' && q.cmd !== 'preload');
    slot.queue.push(msg);
  }

  function slotPark(slot) {
    if (!slot.frame) return;
    const s = slot.frame.style;
    s.opacity = '0'; s.zIndex = '-1'; s.left = '0px'; s.top = '0px'; s.width = '320px'; s.height = '200px'; s.transform = 'none';
  }

  function slotDestroy(slot) {
    clearTimeout(slot.idle);
    slot.frame?.remove();
    Object.assign(slot, { frame: null, ready: false, holds: null, prefetching: null, queue: [] });
  }

  function pfDestroy() {
    cancelAnimationFrame(raf);
    cur = null;
    slots.forEach(slotDestroy);
  }

  function slotEnsure(slot, seedId) {
    if (slot.frame) return;
    const f = document.createElement('iframe');
    f.className = 'ct-pframe';
    f.setAttribute('allow', 'autoplay; encrypted-media');
    f.setAttribute('tabindex', '-1');
    f.setAttribute('aria-hidden', 'true');
    f.src = `${location.origin}/watch?v=${seedId}&ct_preview=1`;
    document.body.append(f);
    slot.frame = f; slot.ready = false; slot.holds = null; slot.queue = [];
    slotPark(slot);
    // hide everything but the video as early as possible
    let n = 0;
    const t = setInterval(() => {
      if (slot.frame !== f || ++n > 200) { clearInterval(t); return; }
      try {
        const d = f.contentDocument;
        if (d && d.head && d.location.pathname === '/watch') {
          const st = d.createElement('style');
          st.textContent = WATCH_CSS;
          d.head.append(st);
          clearInterval(t);
        }
      } catch (_) { /* not ready */ }
    }, 100);
  }

  // keep the (full-size, scaled) iframe exactly on top of the hovered card's thumbnail
  function pfPlace() {
    const c = cur;
    if (!c || !c.slot.frame) return;
    const th = c.card.querySelector('.ct-thumb');
    const r = th.getBoundingClientRect();
    const w = th.offsetWidth;
    if (w) {
      const s = c.slot.frame.style;
      s.left = r.left + 'px'; s.top = r.top + 'px';
      s.width = w + 'px'; s.height = th.offsetHeight + 'px';
      s.transform = `scale(${r.width / w})`;
      s.zIndex = '1500';
    }
    raf = requestAnimationFrame(pfPlace);
  }

  function releaseCurrent(reset) {
    const c = cur;
    if (!c) return;
    const slot = c.slot;
    cancelAnimationFrame(raf);
    slotPost(slot, { cmd: reset ? 'reset' : 'stop' });
    if (slot.frame) slot.frame.style.opacity = '0';
    setTimeout(() => { if (!cur || cur.slot !== slot) slotPark(slot); }, 300);
  }

  function failVideo(c, why) {
    log('video preview failed:', why, c.v.id);
    diag(c.card, 'failed: ' + why);
    clearTimeout(c.timer);
    clearInterval(c.tick);
    const wasAd = /\bad\b/.test(why);
    if (wasAd) adSeen.add(c.v.id);
    c.slot.holds = null;
    if (cur === c) { releaseCurrent(wasAd); cur = null; }
    c.card.classList.remove('previewing');
  }

  // preload the card to the right in the slot that isn't showing anything
  function prefetchNext(c) {
    if (!cfg.preloadNext) return;
    const nv = c.card.nextElementSibling?.__v;
    if (!nv || adSeen.has(nv.id)) return;
    const other = slots.find((s) => s !== c.slot);
    if (!other || other.holds === nv.id || other.prefetching === nv.id) return;
    if (cur && cur.slot === other) return;
    slotEnsure(other, nv.id);
    other.prefetching = nv.id;
    other.holds = null;
    slotSend(other, { cmd: 'preload', id: nv.id, start: startFor(nv) });
  }

  function onPreviewMessage(e) {
    const slot = slots.find((s) => s.frame && e.source === s.frame.contentWindow);
    if (!slot || !e.data || e.data.ct !== 'pv') return;
    const m = e.data;
    if (m.ev === 'ready') {
      slot.ready = true;
      log('preview player', slot.n, 'ready (api:', m.api, ')');
      slot.queue.splice(0).forEach((q) => slotPost(slot, q));
    } else if (m.ev === 'noapi') {
      if (cur && cur.slot === slot) failVideo(cur, 'player API unavailable');
    } else if (m.ev === 'error') {
      log('preview player error:', m.msg);
    } else if (m.ev === 'preloaded') {
      if (slot.prefetching === m.id) { slot.prefetching = null; slot.holds = m.id; log('preloaded', m.id); }
    } else if (m.ev === 'status') {
      const c = cur;
      if (c && c.slot === slot && m.id === c.v.id) {
        c.state = m.state;
        if (m.ad) { failVideo(c, 'an ad is playing'); return; }
        if (!c.revealed && (m.state === -1 || m.state === 2 || m.state === 5) && Date.now() - c.nudged > 400) {
          c.nudged = Date.now();
          slotPost(slot, { cmd: 'play' }); // stuck cued / paused: tell the player to play
        }
        if (m.state === 1 && !c.revealed) {
          c.revealed = true;
          clearTimeout(c.timer);
          clearInterval(c.tick);
          slot.holds = c.v.id;
          slot.frame.style.opacity = '1';
          c.card.classList.add('previewing');
          diag(c.card, `playing · started in ${((Date.now() - c.t0) / 1000).toFixed(1)}s`);
          if (cfg.sound) { c.unmuted = true; slotPost(slot, { cmd: 'unmute', volume: 40 }); }
          setTimeout(() => { if (cur === c) prefetchNext(c); }, 400);
        } else if (c.revealed && c.unmuted && !c.retried && m.state === 2) {
          c.retried = true; // the browser paused it when sound was switched on: carry on muted
          log('sound blocked, playing muted');
          diag(c.card, 'sound blocked (click the page once)');
          slotPost(slot, { cmd: 'remute' });
        }
      } else if (slot.prefetching && m.id === slot.prefetching && m.ad) {
        adSeen.add(m.id); // the preloaded video starts with an ad: drop it
        slot.prefetching = null;
        slot.holds = null;
        slotPost(slot, { cmd: 'reset' });
      }
    }
  }
  window.addEventListener('message', onPreviewMessage);

  // silent fallback ("Animated thumbnail" style): YouTube's moving thumbnail, or a 3-frame slideshow
  function framesPreview(card, v) {
    if (pv.card !== card || pv.extra) return;
    const box = el('div', 'ct-frames');
    if (v.moving) {
      box.classList.add('moving');
      const img = el('img');
      img.alt = '';
      img.src = v.moving;
      box.append(img);
    } else {
      ['mq1', 'mq2', 'mq3'].forEach((n, i) => {
        const img = el('img');
        img.alt = '';
        img.src = `https://i.ytimg.com/vi/${v.id}/${n}.jpg`;
        img.style.animationDelay = `${i * 1.5}s`;
        box.append(img);
      });
    }
    card.querySelector('.ct-thumb').append(box);
    pv.extra = box;
  }

  function stopPreview() {
    clearTimeout(pv.hoverTimer);
    const c = cur;
    if (c) {
      clearTimeout(c.timer);
      clearInterval(c.tick);
      c.card.classList.remove('previewing');
      c.card.querySelector('.ct-diag')?.remove();
      releaseCurrent(false);
      cur = null;
    }
    pv.extra?.remove();
    pv.extra = null;
    pv.card?.querySelector('.ct-diag')?.remove();
    pv.card = null;
  }

  // a slot that already holds this video is used first (instant); otherwise a free, ready slot
  function pickSlot(id) {
    const holder = slots.find((s) => s.frame && s.ready && s.holds === id);
    if (holder) return holder;
    const free = slots.filter((s) => !s.prefetching);
    free.sort((x, y) => (y.ready ? 1 : 0) - (x.ready ? 1 : 0));
    return free[0] || slots.find((s) => !(cur && cur.slot === s)) || slots[0];
  }

  function startPreview(card) {
    stopPreview();
    const v = card.__v;
    if (!v) return;
    pv.card = card;
    pv.hoverTimer = setTimeout(() => {
      if (pv.card !== card || !card.matches(':hover')) return;
      if (cfg.previewStyle === 'thumb') { framesPreview(card, v); return; }
      if (adSeen.has(v.id)) { diag(card, 'skipped: this video starts with an ad'); return; }

      const slot = pickSlot(v.id);
      const c = { card, v, slot, revealed: false, unmuted: false, retried: false, timer: null, tick: null, state: null, nudged: 0, t0: Date.now() };
      cur = c;
      if (slot.holds !== v.id) slot.holds = null;
      slot.prefetching = null;
      slotEnsure(slot, v.id);
      cancelAnimationFrame(raf);
      pfPlace();
      slotSend(slot, { cmd: 'start', id: v.id, start: startFor(v) });
      c.timer = setTimeout(() => { if (cur === c && !c.revealed) failVideo(c, 'timeout'); }, slot.ready ? 8000 : 25000);
      if (cfg.diagnostics) {
        c.tick = setInterval(() => {
          if (c.revealed || cur !== c) return;
          diag(card, `loading ${((Date.now() - c.t0) / 1000).toFixed(1)}s · player state ${c.state ?? '?'}`);
        }, 200);
      }
    }, cfg.previewDelay);
  }

  // load the first hidden player once the home page has settled, so the first hover is quicker
  function prewarm(seedId) {
    if (!cfg.keepWarm || !cfg.preview || cfg.previewStyle !== 'video' || slots[0].frame || !isHome() || !seedId) return;
    setTimeout(() => { if (isHome() && !slots[0].frame && cfg.preview) slotEnsure(slots[0], seedId); }, 2500);
  }

  document.addEventListener('pointerout', (e) => {
    const a = e.target.closest?.('#ct-home .ct-card');
    if (a && pv.card === a && !a.contains(e.relatedTarget)) stopPreview();
  }, { passive: true });
  document.addEventListener('scroll', (e) => {
    if (pv.card && (e.target === document || e.target.classList?.contains('ct-track'))) stopPreview();
  }, { capture: true, passive: true });
  let hiddenTimer = 0;
  document.addEventListener('visibilitychange', () => {
    clearTimeout(hiddenTimer);
    if (document.hidden) {
      stopPreview();
      hiddenTimer = setTimeout(() => { if (document.hidden) pfDestroy(); }, 10000); // free the players while the tab is in the background
    } else if (cfg.keepWarm && isHome()) {
      const first = document.querySelector('#ct-home .ct-card');
      if (first) prewarm(first.__v?.id);
    }
  });

  /* ================= home ================= */
  // items that were still rendering when the row was built get their channel / views / date filled in later
  function refreshFeedMeta() {
    collectFeed().forEach((nv) => {
      const card = document.querySelector(`#ct-home .ct-card[data-id="${nv.id}"]`);
      const old = card && card.__v;
      if (!old) return;
      const cap = card.querySelector('.ct-cap');
      let changed = false;
      if (!old.channel && nv.channel) {
        old.channel = nv.channel;
        const sub = card.querySelector('.ct-sub');
        if (sub) sub.textContent = nv.channel;
        changed = true;
      }
      if (!old.meta && nv.meta) {
        old.meta = nv.meta;
        const mm = el('span', 'ct-meta');
        if (isNew(nv.meta)) mm.append(el('b', 'ct-new', 'New'), document.createTextNode(' '));
        mm.append(document.createTextNode(nv.meta));
        cap.insertBefore(mm, cap.querySelector('.ct-info'));
        changed = true;
      }
      if (!old.dur && nv.dur) {
        old.dur = nv.dur;
        card.querySelector('.ct-thumb')?.append(el('span', 'ct-dur', nv.dur));
        changed = true;
      }
      if (changed) { card.__ready = false; card.querySelector('.ct-info')?.remove(); } // hover panel rebuilds with the new text
    });
  }

  function loadFeed(hero, feedRow) {
    let tries = 0;
    let last = 0;
    const t = setInterval(async () => {
      tries++;
      const items = collectFeed();
      const withMeta = items.filter((i) => i.meta).length;
      const good = items.length >= 4 && withMeta / items.length >= 0.7;
      const stable = items.length >= 4 && items.length === last && (good || tries >= 14);
      last = items.length;
      if (!stable && tries <= 30) return;
      clearInterval(t);

      let vids = items;
      if (vids.length < 4) {
        try { vids = vids.concat(await fetchTopic('trending videos today')); } catch (_) { /* ignore */ }
      }
      if (!vids.length) { hero.remove(); feedRow.el.remove(); return; }
      noteChannels(vids);
      prewarm(vids[0].id);
      if (cfg.hero) {
        buildHero(hero, vids.slice(0, 6));
        feedRow.fill(vids.length > 10 ? vids.slice(6) : vids);
      } else {
        hero.remove();
        feedRow.fill(vids);
      }
      setTimeout(refreshFeedMeta, 3000);
      setTimeout(refreshFeedMeta, 9000);
    }, 500);
  }

  function fitHero(hero) {
    const place = () => {
      if (!hero.isConnected) return;
      const mh = document.querySelector('ytd-masthead')?.getBoundingClientRect().bottom || 56;
      hero.style.marginTop = '0px';
      const docTop = hero.getBoundingClientRect().top + window.scrollY;
      hero.style.marginTop = Math.round(mh - docTop) + 'px';
    };
    requestAnimationFrame(place);
    setTimeout(place, 1200);
    let raf = 0;
    window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); });
  }

  function applyCardsPerRow() {
    const home = document.getElementById('ct-home');
    if (!home) return;
    if (cfg.cardsPerRow) home.style.setProperty('--n', String(cfg.cardsPerRow));
    else home.style.removeProperty('--n');
  }

  function buildHome(grid) {
    const root = el('div');
    root.id = 'ct-home';
    const hero = el('section');
    hero.id = 'ct-hero';
    const feedWrap = el('div');
    const topicsWrap = el('div');
    topicsWrap.id = 'ct-topics';
    root.append(hero, feedWrap, topicsWrap);
    grid.parentElement.insertBefore(root, grid);
    applyCardsPerRow();
    if (cfg.hero) fitHero(hero);

    const feedRow = makeRow('Recommended for you');
    feedWrap.append(feedRow.el);
    renderTopics(topicsWrap);
    loadFeed(hero, feedRow);
  }

  // one listener for every card/button instead of one per card
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('#ct-home a[data-id]');
    if (!a || e.button || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const v = feedById.get(a.dataset.id);
    if (v?.anchor?.isConnected) { e.preventDefault(); v.anchor.click(); }
  });
  document.addEventListener('pointerover', (e) => {
    const a = e.target.closest?.('#ct-home .ct-card');
    if (!a) return;
    ensureInfo(a);
    if (cfg.preview && e.pointerType !== 'touch' && pv.card !== a) startPreview(a);
  }, { passive: true });
  document.addEventListener('focusin', (e) => {
    const a = e.target.closest?.('#ct-home .ct-card');
    if (a) ensureInfo(a);
  });

  let homeTimer = null;
  function ensureHome() {
    clearInterval(homeTimer);
    if (!isHome() || document.getElementById('ct-home')?.isConnected) return;
    let tries = 0;
    homeTimer = setInterval(() => {
      tries++;
      const grid = document.querySelector('ytd-browse[page-subtype="home"] ytd-rich-grid-renderer');
      if (grid) { clearInterval(homeTimer); buildHome(grid); }
      else if (tries > 40) clearInterval(homeTimer);
    }, 500);
  }

  /* ================= minimal watch page ================= */
  let watchedId = null;
  const relayout = () => [0, 400, 1200, 2500].forEach((ms) => setTimeout(() => window.dispatchEvent(new Event('resize')), ms));

  function watchTitle() {
    return document.title.replace(/^\(\d+\)\s*/, '').replace(/\s*-\s*YouTube$/, '');
  }

  function ensureWatchBar() {
    let bar = document.getElementById('ct-watchbar');
    if (!bar) {
      bar = el('div');
      bar.id = 'ct-watchbar';
      const back = el('button', 'ct-back');
      back.setAttribute('aria-label', 'Back');
      back.append(svg(ICONS.back));
      back.onclick = () => (history.length > 1 ? history.back() : go('/'));
      bar.append(back, el('span', 'ct-wtitle'));
      document.body.append(bar);
    }
    bar.querySelector('.ct-wtitle').textContent = watchTitle();
  }

  document.addEventListener('fullscreenchange', () => {
    const bar = document.getElementById('ct-watchbar');
    if (!bar) return;
    const fs = document.fullscreenElement;
    (fs && fs !== root$ && fs !== document.body ? fs : document.body).append(bar);
  });

  function ensureTheater() {
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      const flexy = document.querySelector('ytd-watch-flexy');
      const btn = document.querySelector('.ytp-size-button');
      if (flexy && btn) {
        clearInterval(t);
        if (!flexy.hasAttribute('theater') && !flexy.hasAttribute('fullscreen')) btn.click();
        relayout();
      } else if (tries > 30) clearInterval(t);
    }, 300);
  }

  // Real full screen needs a recent click. A click on a card leaves ~5s of "user activation",
  // so this works when you came from a click and quietly gives up otherwise.
  function tryFullscreen() {
    if (!cfg.autoFullscreen || document.fullscreenElement) return;
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      const active = navigator.userActivation?.isActive;
      const btn = document.querySelector('.ytp-fullscreen-button');
      if (btn && active && document.querySelector('#movie_player video')) {
        clearInterval(t);
        btn.click();
      } else if (tries > 20 || (!active && tries > 2)) clearInterval(t);
    }, 400);
  }

  function syncWatch() {
    const isWatch = location.pathname === '/watch';
    const minimal = isWatch && cfg.watchLayout === 'minimal';
    const cinema = isWatch && cfg.watchLayout === 'cinema';
    root$.classList.toggle('ct-watch', minimal);
    root$.classList.toggle('ct-cinema', cinema);
    if (!minimal && !cinema) { root$.classList.remove('ct-ui'); watchedId = null; return; }
    if (minimal) ensureWatchBar();
    const id = new URLSearchParams(location.search).get('v');
    if (id !== watchedId) {
      watchedId = id;
      ensureTheater();
      relayout();
      tryFullscreen();
      if (minimal) setTimeout(ensureWatchBar, 800); // title can land after navigation finishes
    }
  }

  let uiTimer;
  let lastMove = 0;
  document.addEventListener('mousemove', () => {
    if (!root$.classList.contains('ct-watch')) return;
    const now = Date.now();
    if (now - lastMove < 120) return;
    lastMove = now;
    root$.classList.add('ct-ui');
    clearTimeout(uiTimer);
    uiTimer = setTimeout(() => root$.classList.remove('ct-ui'), 2800);
  }, { passive: true });

  /* ================= channels open on the Videos tab ================= */
  const CHAN_ANY = /^\/(@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)(\/|$)/;
  const CHAN_HOME = /^\/(@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)(\/featured)?\/?$/;
  let lastChanBase = null;

  function channelDefaultTab() {
    const base = (location.pathname.match(CHAN_ANY) || [])[1] || null;
    const prev = lastChanBase;
    lastChanBase = base;
    // only when arriving at a channel from elsewhere, so clicking its Home tab still works
    if (!cfg.channelVideosTab || !base || !CHAN_HOME.test(location.pathname) || prev === base) return;
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if ((location.pathname.match(CHAN_ANY) || [])[1] !== base) { clearInterval(t); return; }
      const tab = [...document.querySelectorAll('yt-tab-shape')]
        .find((x) => (x.getAttribute('tab-title') || x.textContent || '').trim() === 'Videos');
      if (tab) { clearInterval(t); (tab.querySelector('.yt-tab-shape-wiz__tab') || tab).click(); }
      else if (tries > 16) { clearInterval(t); location.replace(`/${base}/videos`); }
    }, 250);
  }

  function collapseGuide() {
    const app = document.querySelector('ytd-app');
    if (app && app.hasAttribute('guide-persistent-and-visible')) {
      document.querySelector('#guide-button button, #guide-button')?.click();
    }
  }

  // YouTube's settings pages have their own left menu, so our rail steps aside there
  const PLAIN = /^\/(account(_\w+)?|paid_memberships|reporthistory|premium_benefits)(\/|$)/;
  const syncPlain = () => root$.classList.toggle('ct-plain', PLAIN.test(location.pathname));

  /* ================= settings ================= */
  function applyCfg(changed) {
    syncPlain();
    root$.classList.toggle('ct-rail-hide', cfg.railAutoHide);
    root$.classList.toggle('ct-home', isHome());
    root$.classList.toggle('ct-keep-shorts', !cfg.hideShorts);
    root$.classList.toggle('ct-below', cfg.showBelow);
    root$.classList.toggle('ct-noend', cfg.hideEndCards);
    root$.classList.toggle('ct-nometa', !cfg.showMeta);
    root$.classList.toggle('ct-compact', cfg.compactGrids);
    applyCardsPerRow();
    syncWatch();
    if (!changed) return;
    if (['preview', 'previewStyle'].some((k) => changed.includes(k))) {
      stopPreview();
      if (!(cfg.preview && cfg.previewStyle === 'video')) pfDestroy();
      else { const first = document.querySelector('#ct-home .ct-card'); if (first) prewarm(first.__v?.id); }
    }
    if (changed.includes('hero')) { document.getElementById('ct-home')?.remove(); ensureHome(); }
    if (['topics', 'channelRows', 'infiniteScroll'].some((k) => changed.includes(k))) {
      const wrap = document.getElementById('ct-topics');
      if (wrap) renderTopics(wrap);
    }
  }

  /* ================= boot ================= */
  chrome.storage.sync.get(null, (st) => {
    cfg = ctNormalize(st);
    applyCfg();
    buildRail();
    ensureHome();
    channelDefaultTab();
    setTimeout(collapseGuide, 1200);
    ['https://i.ytimg.com', 'https://yt3.ggpht.com'].forEach((h) => {
      const l = document.createElement('link');
      l.rel = 'preconnect';
      l.href = h;
      document.head.append(l);
    });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    chrome.storage.sync.get(null, (st) => {
      cfg = ctNormalize(st);
      applyCfg(Object.keys(changes));
    });
  });

  const onNavigate = () => {
    root$.classList.toggle('ct-home', isHome());
    syncPlain();
    stopPreview();
    if (!isHome()) pfDestroy();
    else { const first = document.querySelector('#ct-home .ct-card'); if (first) prewarm(first.__v?.id); }
    buildRail();
    markActive();
    ensureHome();
    syncWatch();
    channelDefaultTab();
    setTimeout(collapseGuide, 600);
  };
  document.addEventListener('yt-navigate-finish', onNavigate);
  document.addEventListener('yt-page-data-updated', () => { if (root$.classList.contains('ct-watch')) ensureWatchBar(); });
})();
