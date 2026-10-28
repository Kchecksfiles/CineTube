/* Shared by the content script, the popup and the settings page. */
const CT_DEFAULTS = {
  topics: ['Music', 'Gaming', 'Movie trailers', 'Podcasts', 'Sports highlights', 'Tech reviews',
    'Documentaries', 'Stand-up comedy', 'Cooking', 'Science explained', 'Travel vlogs'],
  // Home page
  hero: true,            // billboard slideshow
  cardsPerRow: 0,        // 0 = auto
  showMeta: true,        // views + upload date under each card
  hideShorts: true,
  railAutoHide: false,   // hide the left rail until the mouse touches the left edge
  channelRows: true,     // circular channel rows ("Your channels", "Explore channels")
  infiniteScroll: true,  // keep adding topic rows as you scroll down
  compactGrids: true,    // tidy grid on Subscriptions and channel pages
  channelVideosTab: true,// open channels on their Videos tab
  // Hover preview
  preview: true,
  sound: true,
  previewStyle: 'video', // 'video' = real player with sound, 'thumb' = silent animated thumbnail
  previewDelay: 150,     // ms
  skipIntro: false,      // start longer videos ~20% in (a little slower to start)
  keepWarm: false,       // keep the hidden preview player loaded all the time (faster first hover, much more memory)
  preloadNext: false,    // a 2nd hidden player preloads the next card (instant along a row, even more memory)
  diagnostics: false,    // tiny status text on the card while a preview loads (for bug reports)
  // Watch page
  watchLayout: 'cinema', // 'cinema' = big player, scroll for likes + comments | 'minimal' = video only | 'classic' = YouTube default
  autoFullscreen: false, // try to go full screen right after clicking a video
  showBelow: false,      // minimal layout only: description / comments / related under the player
  hideEndCards: true
};

function ctNormalize(st) {
  const out = {};
  for (const k in CT_DEFAULTS) {
    const d = CT_DEFAULTS[k];
    const v = st && st[k];
    if (Array.isArray(d)) out[k] = Array.isArray(v) && v.length ? v : d.slice();
    else out[k] = typeof v === typeof d ? v : d;
  }
  return out;
}
