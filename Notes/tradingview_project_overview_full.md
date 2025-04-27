# Project: TradingView Remote‑Control Integration

## Overview

This project aims to create a **seamless, in‑place symbol swap experience** for TradingView charts driven by an external watch‑list web application. Instead of loading a new URL (which reloads the entire page and triggers a “Leave site?” prompt), our system will dynamically update the symbol displayed in an already‑loaded TradingView chart (including inside its iframe), preserving all user customizations such as indicators, drawings, and timeframes.

---

## Goals & Objectives

1. **Instant Symbol Updates**  
   - Clicking a ticker in the watch-list triggers a `BroadcastChannel` message that swaps the chart symbol in under 20 ms.

2. **No Full‑Page Reload**  
   - Avoid changing `window.location` or reloading the URL entirely; maintain chart state.

3. **Bypass Browser Prompts**  
   - Eliminate Chrome’s `beforeunload` dialog (“Leave site? Changes you made may not be saved.”).

4. **Cross‑Browser Compatibility**  
   - Support Chrome, Edge, Brave, and other Chromium‑based browsers via Manifest V3.

5. **Personal‑Use Compliance**  
   - Target a private hack for individual workflow (non‑commercial, no redistribution).

---

## Background & Motivation

- **Pain Points**  
  - TradingView’s default URL‑based symbol changes reload the page (~1 s), wiping custom indicators and drawn objects.  
  - After modifying a chart (e.g. changing timeframe, adding indicators), navigating to a new symbol triggers the browser “Leave site?” confirmation.

- **Why Solve It**  
  - Active traders need a high‑speed workflow to scan dozens of tickers without distraction.  
  - A unified watch-list + chart integration can emulate TradingView’s Pro UX without subscription or heavy licensing.

---

## Previous Attempts (and Why They Failed)

| Approach                                     | Reason for Failure                                                                              |
|----------------------------------------------|------------------------------------------------------------------------------------------------|
| Tampermonkey + `localStorage` + synthetic keys | TradingView’s React checks `event.isTrusted === true` and ignores faked events.               |
| Tampermonkey inline `<script>` injection     | Blocked by TradingView’s strict Content‑Security‑Policy (CSP).                                   |
| Direct DOM manipulation                      | MobX internal state not updated; UI ignored programmatic `.value` changes.                      |
| Hooking internal widget via Tampermonkey     | Widget instance hidden inside a Webpack closure; sandbox prevented access.                      |

---

## Key Insight

TradingView’s own JS API exposes:
```js
chart.setSymbol(symbol, null, true);
```
- **Does not** change the URL or reload the page.  
- **Bypasses** the React router/navigation logic.  
- **Preserves** all chart settings.

**Challenges remaining**: bypassing CSP and sandbox barriers to call this API in the context where it lives (parent page or iframe).

---

## Proposed Solutions

### 1. Manifest V3 Chrome Extension
- **Inject** `inject.js` into the page’s MAIN world via `chrome.scripting.executeScript`.  
- **Locate** the chart instance (`window.tvWidget.chart()` or via dynamic scanning).  
- **Listen** on `BroadcastChannel('ticker_channel')` for `{ symbol }`.  
- **Call** `chart.setSymbol(symbol, null, true)`.

### 2. Local mitmproxy‑Based Network Injection
- **Proxy** all `tradingview.com` HTML through mitmproxy.  
- **Strip** CSP headers and **inject** `inject.js` inline into both parent and iframe HTML.  
- **Run** the same BroadcastChannel + `setSymbol` logic inside the iframe context.

### 3. Puppeteer (Fallback)
- **Automate** a headless or headful Chrome via Node.js.  
- **Navigate** once to the chart URL.  
- **Evaluate** `chart.setSymbol()` via `page.evaluate()` on demand.

---

## Detailed Architecture

```text
+----------------------+       BroadcastChannel      +-------------------------+
|  Watch‑List Web App  |  ------------------------> | TradingView Chart Tab   |
| (React/Vue/Plain JS) |       { symbol: 'AAPL' }   | (or iframe context)     |
+----------------------+                            +-------------------------+
                                                         |
                                                    inject.js
                                                         |
                                               chart.setSymbol(sym)
```

**Components**  
- **Watch‑List**: UI that sends `{ symbol }` messages.  
- **inject.js**: Micro‑script that locates the chart, opens the channel, and swaps symbols.  
- **Extension/Proxy**: Delivery mechanism to get `inject.js` into the correct context.

---

## Implementation Steps

### A. Extension Approach
1. Create these files in `tv-remote-symbol/`:
   - `manifest.json`
   - `background.js`
   - `inject.js`
2. Load unpacked in Chrome (`chrome://extensions`) → verify console logs.
3. Ensure **Site Access** for `*.tradingview.com` and `allFrames: true`.

### B. Proxy Approach
1. `brew install mitmproxy` on macOS.
2. In project folder, create `inject.js` and `inject.py` (proxy hook).
3. Trust mitmproxy’s CA via `http://mitm.it` → install in Keychain → Always Trust.
4. Run `mitmproxy -s inject.py --listen-port 8080`.
5. In **System Settings → Network → Proxies**, set HTTP/HTTPS to `127.0.0.1:8080`.
6. Browse to `https://www.tradingview.com/chart/`, open DevTools in the iframe, confirm injection logs.

### C. Testing
- In DevTools Console (any tab):  
  ```js
  const chan = new BroadcastChannel('ticker_channel');
  chan.postMessage({ symbol: 'MSFT' });
  ```
- Expect in TradingView iframe console:  
  ```
  [TV Remote] symbol → MSFT
  ```

---

## Risks & Mitigations

| Risk                                  | Mitigation                                                     |
|---------------------------------------|----------------------------------------------------------------|
| TradingView widget API changes        | Use dynamic scanning (`findChartInstance()`).                  |
| CSP becomes stricter                 | Proxy approach bypasses CSP at network level.                  |
| Browser updates break injection API   | Have a Puppeteer fallback or bookmarklet for quick testing.    |
| Personal‑use license violation        | Strictly private; do not distribute.                           |

---

## Next Steps

1. **Pick** delivery approach (Extension or Proxy).  
2. **Finalize** and document the code.  
3. **Implement** watch‑list UI integration & status ping/pong.  
4. **Enhance** with multi‑chart support and hot‑keys.  
5. **Plan** migration to a self‑hosted Charting Library if needed.

---

*Prepared on April 20, 2025 — Version 1.0*  
