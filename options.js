const SCHEMA = [
  { title: 'Home page', items: [
    { key: 'hero', type: 'switch', label: 'Billboard slideshow', desc: 'Large rotating banner with your top picks.' },
    { key: 'cardsPerRow', type: 'select', label: 'Videos per row', desc: 'Auto picks 3 to 5 depending on your screen width.',
      options: [[0, 'Auto'], [3, '3'], [4, '4'], [5, '5'], [6, '6']] },
    { key: 'showMeta', type: 'switch', label: 'Views and upload date under videos', desc: 'Shown as a small line under each title.' },
    { key: 'hideShorts', type: 'switch', label: 'Hide Shorts', desc: 'Removes Shorts shelves and the Shorts sidebar entry.' },
    { key: 'railAutoHide', type: 'switch', label: 'Auto-hide the left rail', desc: 'The rail slides away until you move the mouse to the left edge of the window.' },
    { key: 'channelRows', type: 'switch', label: 'Channel rows', desc: 'Round channel logos: the channels you follow, and new ones to explore.' },
    { key: 'infiniteScroll', type: 'switch', label: 'Endless scrolling', desc: 'Keeps adding rows as you scroll down the home page.' }
  ] },
  { title: 'Subscriptions and channels', items: [
    { key: 'compactGrids', type: 'switch', label: 'Compact video grid', desc: 'A tighter, cleaner grid on Subscriptions and channel pages.' },
    { key: 'channelVideosTab', type: 'switch', label: 'Open channels on the Videos tab', desc: 'Skips the channel Home tab. Clicking Home inside a channel still works.' }
  ] },
  { title: 'Hover preview', items: [
    { key: 'preview', type: 'switch', label: 'Play the video when you hover a card', desc: 'No buttons, no captions, just the video.' },
    { key: 'sound', type: 'switch', label: 'Play with sound', desc: 'Chrome only allows sound after you have clicked somewhere on the page.' },
    { key: 'previewStyle', type: 'select', label: 'Preview style', desc: 'Full video opens a hidden YouTube player while you hover and closes it 45 seconds after you stop. Animated thumbnail is silent and uses almost no memory.',
      options: [['video', 'Full video with sound'], ['thumb', 'Animated thumbnail (silent)']] },
    { key: 'previewDelay', type: 'select', label: 'Delay before it starts', desc: 'How long the mouse rests on a card first.',
      options: [[80, 'Instant (0.08s)'], [150, 'Fast (0.15s)'], [400, 'Normal (0.4s)'], [800, 'Slow (0.8s)']] },
    { key: 'skipIntro', type: 'switch', label: 'Skip the intro', desc: 'Starts videos longer than 3 minutes about 20% in.' },
    { key: 'keepWarm', type: 'switch', label: 'Keep the preview player ready', desc: 'Faster first hover, but the hidden player stays loaded (about the memory of an extra tab). Off by default.' },
    { key: 'preloadNext', type: 'switch', label: 'Preload the next video', desc: 'A second hidden player loads the card to the right so moving along a row starts instantly. Uses a lot more memory. Off by default.' },
    { key: 'diagnostics', type: 'switch', label: 'Show preview diagnostics', desc: 'Small status text on the card while a preview loads. Handy when reporting a problem.' }
  ] },
  { title: 'Watch page', items: [
    { key: 'watchLayout', type: 'select', label: 'Watch page layout', desc: 'Cinema: big player, scroll down for likes and comments. Minimal: only the video. Classic: YouTube as usual.',
      options: [['cinema', 'Cinema (scroll for likes and comments)'], ['minimal', 'Minimal (video only)'], ['classic', 'YouTube default']] },
    { key: 'autoFullscreen', type: 'switch', label: 'Go full screen automatically', desc: 'Works when you got there by clicking a video. The browser may refuse otherwise.' },
    { key: 'showBelow', type: 'switch', label: 'Minimal layout: show description and comments', desc: 'Only for the Minimal layout. Scroll down past the player to see them.' },
    { key: 'hideEndCards', type: 'switch', label: 'Hide end cards and pause suggestions', desc: 'Removes the pop-ups that cover the video.' }
  ] }
];

const $ = (s, r = document) => r.querySelector(s);
const status = $('#status');
let flashTimer;
const flash = (msg) => { status.textContent = msg; clearTimeout(flashTimer); flashTimer = setTimeout(() => (status.textContent = ''), 1500); };
const save = (key, value) => chrome.storage.sync.set({ [key]: value }, () => flash('Saved'));

function build(cfg) {
  const app = $('#app');
  app.textContent = '';
  SCHEMA.forEach((sec) => {
    const h = document.createElement('h2');
    h.textContent = sec.title;
    const group = document.createElement('div');
    group.className = 'group';
    sec.items.forEach((it) => {
      const row = document.createElement('label');
      row.className = 'row';
      const text = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = it.label;
      const small = document.createElement('small');
      small.textContent = it.desc;
      text.append(b, small);
      let ctl;
      if (it.type === 'switch') {
        ctl = document.createElement('span');
        ctl.className = 'sw';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = !!cfg[it.key];
        input.onchange = () => save(it.key, input.checked);
        ctl.append(input, document.createElement('span'));
      } else {
        ctl = document.createElement('select');
        it.options.forEach(([val, name]) => {
          const o = document.createElement('option');
          o.value = String(val);
          o.textContent = name;
          if (cfg[it.key] === val) o.selected = true;
          ctl.append(o);
        });
        ctl.onchange = () => save(it.key, typeof CT_DEFAULTS[it.key] === 'number' ? Number(ctl.value) : ctl.value);
      }
      row.append(text, ctl);
      group.append(row);
    });
    app.append(h, group);
  });

  const h = document.createElement('h2');
  h.textContent = 'Topic rows';
  const box = document.createElement('div');
  box.className = 'group topics';
  const hint = document.createElement('small');
  hint.textContent = 'One per line (up to 20). Each becomes a row on your home page, after "From your subscriptions".';
  const ta = document.createElement('textarea');
  ta.spellcheck = false;
  ta.value = cfg.topics.join('\n');
  let t;
  ta.oninput = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const topics = ta.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 20);
      save('topics', topics);
    }, 600);
  };
  box.append(hint, ta);
  app.append(h, box);
}

function load() { chrome.storage.sync.get(null, (st) => build(ctNormalize(st))); }
load();

$('#reset').onclick = () => {
  if (!confirm('Reset all CineTube settings to their defaults?')) return;
  chrome.storage.sync.clear(() => { load(); flash('Reset'); });
};
