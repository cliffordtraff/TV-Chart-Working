/*
This script is used to inject the TradingView symbol loader into the page

This script is designed to be injected into TradingView webpages to enable remote control of charts. It:
Searches for a TradingView chart object in the current window and frames
Sets up a listener for postMessage events containing symbol information
When a symbol message is received, it:
Fetches proper symbol data from TradingView's API
Changes the displayed chart to show the requested symbol
*/

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

  async function fetchSymbolData(symbol) {
    try {
      console.log('[TV Remote] Fetching symbol data for:', symbol);
      const response = await fetch(`https://symbol-search.tradingview.com/symbol_search/?text=${encodeURIComponent(symbol)}&exchange=&type=&domain=production`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('[TV Remote] Symbol data received:', data);
      return data;
    } catch (error) {
      console.error('[TV Remote] Error fetching symbol data:', error);
      return null;
    }
  }

  (async () => {
    console.log('[TV Remote] Starting initialization...');
    const chart = await waitForChart();
    console.log('[TV Remote] Chart found:', chart);

    // Listen for postMessage events
    window.addEventListener('message', async event => {
      console.log('[TV Remote] Received message:', event.data);
      
      const { symbol } = event.data || {};
      if (typeof symbol === 'string' && symbol) {
        try {
          // First try to fetch the symbol data
          const symbolData = await fetchSymbolData(symbol);
          
          // Use the fetched data if available, otherwise fall back to basic symbol
          const symbolToUse = symbolData && symbolData[0] ? 
            `${symbolData[0].exchange}:${symbolData[0].symbol}` : 
            symbol;
            
          console.log('[TV Remote] Setting symbol:', symbolToUse);
          const result = chart.setSymbol(symbolToUse, null, true);
          console.log('[TV Remote] setSymbol result:', result);
        } catch (err) {
          console.error('[TV Remote] setSymbol failed:', err);
        }
      }
    });

    console.log('[TV Remote] Setup complete - listening for postMessage events');
  })();
} 