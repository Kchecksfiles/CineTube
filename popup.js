chrome.storage.sync.get(null, (st) => {
  const cfg = ctNormalize(st);
  document.querySelectorAll('[data-key]').forEach((ctl) => {
    const key = ctl.dataset.key;
    if (ctl.type === 'checkbox') {
      ctl.checked = !!cfg[key];
      ctl.onchange = () => chrome.storage.sync.set({ [key]: ctl.checked });
    } else {
      ctl.value = cfg[key];
      ctl.onchange = () => chrome.storage.sync.set({ [key]: ctl.value });
    }
  });
});
document.getElementById('all').onclick = () => { chrome.runtime.openOptionsPage(); window.close(); };
