# PostMessage Integration Guide — Cross‑Origin TradingView Chart Control

This guide shows how to connect your **Watch‑List** page to an open TradingView chart tab using `window.postMessage()`.  
Follow these steps and use the provided files to enable **instant**, **in‑place** symbol swapping with no page reloads or browser prompts.

---

## Project Structure

```
project/
├── inject.py        # mitmproxy hook: strip CSP + inject inject.js into all TradingView HTML (parent & iframes)
├── inject.js        # Injected into TradingView frames: finds the chart instance & listens for postMessage events
└── watchlist.html   # Your Watch‑List UI: renders ticker buttons, opens TV window, and sends postMessage(symbol) on click
```

---

## 1. inject.py (mitmproxy script)

**Purpose:**  
Intercept every HTML response from `*.tradingview.com`, remove/relax its Content‑Security‑Policy header, and inject your `inject.js` into the `<head>`.

```python
# inject.py
from mitmproxy import http

INJECT_JS = open("inject.js", "r").read()

def response(flow: http.HTTPFlow) -> None:
    host = flow.request.pretty_host
    ctype = flow.response.headers.get("Content-Type", "")
    # Only modify HTML from tradingview.com
    if not host.endswith("tradingview.com") or "text/html" not in ctype:
        return

    # Remove strict CSP so inline scripts can run
    flow.response.headers.pop("content-security-policy", None)

    # Inject our script before </head>
    html = flow.response.get_text()
    if "</head>" in html:
        patched = html.replace(
            "</head>",
            f"<script>{INJECT_JS}</script></head>"
        )
        flow.response.set_text(patched)
```

---

## 2. inject.js

**Purpose:**  
Runs in every HTML context (parent + iframes) on TradingView pages. It must:

1. **Prevent double‑inject** by setting `window.__TV_REMOTE = true`.  
2. **Locate** the chart API by recursively scanning for an object whose top‑level `.chart()` method exists.  
3. **Wait** (poll) for that API to appear.  
4. **Listen** for `message` events and, on `{ symbol }`, call `chart.setSymbol(symbol, null, true)`.

```javascript
// inject.js

if (!window.__TV_REMOTE) {
  window.__TV_REMOTE = true;

  // Recursively find .chart() in this window or child frames
  function findChart(win = window) {
    for (const key of Object.getOwnPropertyNames(win)) {
      try {
        const cand = win[key];
        if (cand && typeof cand.chart === "function") {
          console.log(`[TV Remote] chart found on window.${key}`);
          return cand.chart();
        }
      } catch {}
    }
    for (let i = 0; i < win.frames.length; i++) {
      try {
        const chart = findChart(win.frames[i]);
        if (chart) return chart;
      } catch {}
    }
    return null;
  }

  // Poll until we find the chart instance
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
    console.log("[TV Remote] waiting for chart instance…");
    const chart = await waitForChart();
    console.log("[TV Remote] chart ready:", chart);

    // Handle postMessage events
    window.addEventListener("message", event => {
      if (event.origin !== "https://www.tradingview.com") return;
      const { symbol } = event.data || {};
      if (typeof symbol === "string" && symbol) {
        try {
          chart.setSymbol(symbol, null, true);
          console.log("[TV Remote] symbol →", symbol);
        } catch (err) {
          console.error("[TV Remote] setSymbol failed", err);
        }
      }
    });

    console.log("[TV Remote] listening for postMessage(symbol)");
  })();
}
```

---

## 3. watchlist.html

**Purpose:**  
Your front‑end page where users click tickers. It must:

1. **Render** ticker buttons.  
2. **Open/target** the TradingView chart window.  
3. **On click**, **prefix** the symbol if needed and call `postMessage({ symbol })` on the chart window.

```html
<!-- watchlist.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TradingView Watch List</title>
</head>
<body>
  <h1>TradingView Watch List</h1>
  <div id="watchlist"></div>

  <script>
    // Example tickers
    const symbols = ["AAPL", "MSFT", "GOOGL", "TSLA"];
    // Open or reuse TradingView chart window
    const tvWin = window.open(
      "https://www.tradingview.com/chart/",
      "tvChartWindow"
    );

    const container = document.getElementById("watchlist");
    symbols.forEach(sym => {
      const btn = document.createElement("button");
      btn.textContent = sym;
      btn.onclick = () => {
        const full = /^[A-Z]+:/.test(sym) ? sym : `NASDAQ:${sym}`;
        tvWin.postMessage({ symbol: full }, "https://www.tradingview.com");
        console.log("Sent symbol:", full);
      };
      container.appendChild(btn);
    });
  </script>
</body>
</html>
```

---

## 4. Putting It All Together

1. **Start mitmproxy**:
   ```bash
   mitmproxy -s inject.py --listen-port 8080
   ```
2. **Configure** macOS Proxy → HTTP & HTTPS → `127.0.0.1:8080`.  
3. **Browse** to `https://www.tradingview.com/chart/`.  
4. **Open** `watchlist.html` in another tab/window.  
5. **Click** a ticker → chart swaps instantly, no reload or prompt.

---

With these three files (`inject.py`, `inject.js`, `watchlist.html`), you have a complete postMessage‑based integration for instantly updating TradingView charts cross‑origin.  
