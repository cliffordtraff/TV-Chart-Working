// inject.js
console.log('[TV Remote] Script loaded on:', window.location.href);

if (!window.__TV_REMOTE) {
  window.__TV_REMOTE = true;
  console.log('[TV Remote] Initializing...');

  function findChart(win = window) {
    console.log('[TV Remote] Searching for chart in window:', win.location?.href || 'unknown');
    // 1) look for a top‑level .chart() method
    for (const key of Object.getOwnPropertyNames(win)) {
      try {
        const cand = win[key];
        if (cand && typeof cand.chart === 'function') {
          console.log(`[TV Remote] chart found on window.${key}`);
          return cand.chart();
        }
      } catch (err) {
        console.log('[TV Remote] Error checking property:', key, err);
      }
    }
    // 2) recurse into frames
    for (let i = 0; i < win.frames.length; i++) {
      try {
        const ch = findChart(win.frames[i]);
        if (ch) return ch;
      } catch (err) {
        console.log('[TV Remote] Error checking frame:', i, err);
      }
    }
    return null;
  }

  function waitForChart() {
    console.log('[TV Remote] Starting chart wait loop');
    return new Promise(res => {
      const id = setInterval(() => {
        const chart = findChart();
        if (chart) {
          clearInterval(id);
          res(chart);
        }
      }, 200);
    });
  }

  (async () => {
    console.log('[TV Remote] Starting initialization...');
    const chart = await waitForChart();
    console.log('[TV Remote] Chart found:', chart);

    // Listen for postMessage events
    window.addEventListener('message', event => {
      // Only accept messages from trusted origins
      if (event.origin !== 'http://localhost:3000') {
        console.log('[TV Remote] Ignoring message from untrusted origin:', event.origin);
        return;
      }
      
      console.log('[TV Remote] Received message:', event.data);
      
      const { symbol } = event.data || {};
      if (typeof symbol === 'string' && symbol) {
        try {
          console.log('[TV Remote] Attempting to set symbol:', symbol);
          const result = chart.setSymbol(symbol, null, true);
          console.log('[TV Remote] setSymbol result:', result);
        } catch (err) {
          console.error('[TV Remote] setSymbol failed:', err);
        }
      }
    });

    console.log('[TV Remote] Setup complete - listening for postMessage events');
  })();
}
