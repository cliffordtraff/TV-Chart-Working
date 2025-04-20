// inject.js

if (!window.__TV_REMOTE) {
  window.__TV_REMOTE = true;

  function findChart(win = window) {
    // 1) look for a top‑level .chart() method
    for (const key of Object.getOwnPropertyNames(win)) {
      try {
        const cand = win[key];
        if (cand && typeof cand.chart === 'function') {
          console.log(`[TV Remote] chart found on window.${key}`);
          return cand.chart();
        }
      } catch {}
    }
    // 2) recurse into frames
    for (let i = 0; i < win.frames.length; i++) {
      try {
        const ch = findChart(win.frames[i]);
        if (ch) return ch;
      } catch {}
    }
    return null;
  }

  function waitForChart() {
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
    console.log('[TV Remote] waiting for chart instance…');
    const chart = await waitForChart();
    console.log('[TV Remote] chart ready:', chart);

    const chan = new BroadcastChannel('ticker_channel');
    chan.onmessage = e => {
      const msg = e.data;
      if (!msg) return;
      if (msg.type === 'ping') return chan.postMessage({ type: 'pong' });
      if (msg.symbol) {
        try {
          chart.setSymbol(msg.symbol, null, true);
          console.log('[TV Remote] symbol →', msg.symbol);
        } catch (err) {
          console.error('[TV Remote] setSymbol failed', err);
        }
      }
    };

    console.log('[TV Remote] listening on ticker_channel');
  })();
}
