# Handshake Solution for Reliable First-Load Symbol Delivery

## 1. Background

The TradingView Symbol Loader extension allows a user to click a symbol in a custom watchlist and have it load in a TradingView chart window (via `window.open` + `postMessage`). On first click, a race condition can cause the symbol message to arrive before the chart page's injected listener is ready, so TradingView falls back to a default symbol. While we tried fixed delays, those are inherently brittle.


## 2. Problem Overview

- **Race Condition**: The extension's injected script (`inject.js`) only registers its `window.addEventListener('message')` after the TradingView page has loaded and your content script has injected it.
- **Lost Message**: On the very first load, the watchlist page fires its `postMessage` as soon as the `onload` event fires, but the injected listener often isn't installed yet, so that first message is ignored.


## 3. Handshake Approach

Rather than guessing how long injection will take, we'll implement a simple two-way handshake between the watchlist opener and the TradingView chart window:

1. **Chart-ready Signal**: As soon as `inject.js` finds the TradingView chart object and installs its message listener, it sends a "chart-ready" signal back to the opener (the watchlist page) via `window.opener.postMessage`.
2. **Deferred Symbol Send**: The watchlist page, upon opening a new chart window, listens for that single "chart-ready" event. Only when it receives this handshake does it send the pending symbol.

This ensures the first symbol is never lost and removes any need for arbitrary timeouts.


## 4. Implementation Steps

### 4.1 Modifications in `inject.js`
1. After the `await waitForChart()` and immediately after registering the `window.addEventListener('message')` listener:
   - Post a message to the opener:
     ```js
     window.opener.postMessage({
       source: 'tv-symbol-loader-extension',
       type:   'chart-ready'
     }, '*')
     ```
   - This tells the watchlist window that its injected listener is live and ready for symbol commands.


### 4.2 Modifications in `sendSymbol(rawSymbol)` (frontend/src/main.js)
1. In the **new-window** branch (`isNew === true`):
   - Store `pendingSymbol = rawSymbol` as before.
   - **Before** sending any messages, attach a one-time `window.addEventListener('message')` handler:
     ```js
     function onChartReady(event) {
       if (
         event.source === tvWin &&
         event.data.source === 'tv-symbol-loader-extension' &&
         event.data.type   === 'chart-ready'
       ) {
         // Chart is now ready, send the symbol safely:
         tvWin.postMessage({ symbol: pendingSymbol }, '*')
         showStatus(`Symbol ${pendingSymbol} sent to TradingView`)
         pendingSymbol = null
         window.removeEventListener('message', onChartReady)
       }
     }
     window.addEventListener('message', onChartReady)
     ```
   - **Do not** send the symbol on `onload`—only send in `onChartReady`.

2. In the **reuse** branch (`else`): leave unchanged.  Immediately `postMessage` the symbol as before.


## 5. Pseudocode Summary

```js
// In inject.js (chart page):
await waitForChart()
window.addEventListener('message', handleIncoming)
// Immediately handshake back:
window.opener.postMessage({ source: 'tv-symbol-loader-extension', type: 'chart-ready' }, '*')

// In watchlist page (first-send branch):
pendingSymbol = rawSymbol
window.addEventListener('message', function onChartReady(e) {
  if (e.source === tvWin && e.data.source === 'tv-symbol-loader-extension' && e.data.type === 'chart-ready') {
    tvWin.postMessage({ symbol: pendingSymbol }, '*')
    showStatus(`Symbol ${pendingSymbol} sent to TradingView`)
    pendingSymbol = null
    window.removeEventListener('message', onChartReady)
  }
})
```


## 6. Testing & Verification

1. **Clear state**: Close any existing chart window.
2. **Cold start**: Click a symbol:
   - TradingView window opens.
   - `inject.js` logs "chart-ready" and you see it post back to opener.
   - Watchlist page receives handshake, then sends the correct symbol.
3. **Warm start**: With the window already open, click a second symbol:
   - It updates immediately, no handshake logic needed.
4. **Edge cases**: If for some reason the handshake never arrives in X seconds, you could fallback to a retry or show an error. But in practice, this two-way handshake is robust on any connection speed.


## 7. Advantages & Next Steps

- **Deterministic**: No guessing or fixed delays.  
- **Robust**: Works consistently regardless of network, CPU, or TradingView page changes.  
- **Extensible**: You can add a timeout fallback if desired or log failures.  

Once this handshake is in place, your first-click symbol handoff will be rock-solid, and you can remove any remaining delay hacks or complex timing logic. 