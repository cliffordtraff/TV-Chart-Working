// inject.js
console.log('[TV Symbol Loader] Script loaded on:', window.location.href);

if (!window.__TV_SYMBOL_LOADER) {
  window.__TV_SYMBOL_LOADER = true;
  console.log('[TV Symbol Loader] Initializing...');

  function findChart(win = window) {
    console.log('[TV Symbol Loader] Searching for chart in window:', win.location?.href || 'unknown');
    
    // IMPROVED: Check for common TradingView chart objects
    const commonChartObjects = [
      'TradingViewApi',
      'tvWidget',
      'widget',
      'chart',
      'tvChart'
    ];
    
    // 1) Check for common chart objects first
    for (const objName of commonChartObjects) {
      try {
        if (win[objName] && typeof win[objName].chart === 'function') {
          console.log(`[TV Symbol Loader] chart found on window.${objName}`);
          return win[objName].chart();
        }
      } catch (err) {
        console.log(`[TV Symbol Loader] Error checking ${objName}:`, err);
      }
    }
    
    // 2) Look for a top‑level .chart() method
    for (const key of Object.getOwnPropertyNames(win)) {
      try {
        const cand = win[key];
        if (cand && typeof cand.chart === 'function') {
          console.log(`[TV Symbol Loader] chart found on window.${key}`);
          return cand.chart();
        }
      } catch (err) {
        console.log('[TV Symbol Loader] Error checking property:', key, err);
      }
    }
    
    // 3) Log available keys for debugging
    console.log('[TV Symbol Loader] Available window keys:', Object.getOwnPropertyNames(win));
    
    // 4) Recurse into frames
    for (let i = 0; i < win.frames.length; i++) {
      try {
        const ch = findChart(win.frames[i]);
        if (ch) return ch;
      } catch (err) {
        console.log('[TV Symbol Loader] Error checking frame:', i, err);
      }
    }
    
    return null;
  }

  function waitForChart() {
    console.log('[TV Symbol Loader] Starting chart wait loop');
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
    console.log('[TV Symbol Loader] Starting initialization...');
    const chart = await waitForChart();
    console.log('[TV Symbol Loader] Chart found:', chart);

    // Listen for postMessage events
    window.addEventListener('message', event => {
      // Check if this is a message from our extension
      if (event.data && event.data.source === 'tv-symbol-loader-extension') {
        const { symbol } = event.data.data || {};
        if (typeof symbol === 'string' && symbol) {
          try {
            console.log('[TV Symbol Loader] Attempting to set symbol:', symbol);
            const result = chart.setSymbol(symbol, null, true);
            console.log('[TV Symbol Loader] setSymbol result:', result);
          } catch (err) {
            console.error('[TV Symbol Loader] setSymbol failed:', err);
          }
        }
      }
    });

    // Handshake: notify opener that chart is ready to receive symbols
    if (window.opener) {
      console.log('[TV Symbol Loader] Chart-ready handshake sent to opener');
      window.opener.postMessage({
        source: 'tv-symbol-loader-extension',
        type: 'chart-ready'
      }, '*');
    }

    console.log('[TV Symbol Loader] Setup complete - listening for postMessage events');
  })();
} 