# 🧠 TradingView Symbol Search Fix: Server‑Side Proxy with Autocomplete API

## 🔧 Problem Overview

Our goal was to enable users to click a ticker in our watchlist (e.g., `"AAPL"`, `"SPY"`, or `"ES1!"`) and have the chart load that symbol **instantly** without requiring users to know the full TradingView format (e.g., `"NASDAQ:AAPL"`).

To do this, we attempted to use TradingView’s **symbol autocomplete endpoint**:

```
https://symbol-search.tradingview.com/symbol_search/?text=AAPL&exchange=&type=&domain=production
```

### ❌ Problems We Encountered

Despite being a public endpoint, we faced consistent **403 Forbidden errors**. Here’s why:

1. **CORS Restrictions**
   - Browsers enforce Cross-Origin Resource Sharing (CORS) rules.
   - TradingView’s server does **not** return the `Access-Control-Allow-Origin` header.
   - So our frontend browser was **blocked from making fetch requests directly**.

2. **Anti-Scraping Filters**
   - TradingView likely checks for valid session cookies, user-agent headers, or referrers.
   - Requests coming directly from JavaScript (outside their site) may be flagged as unauthorized.

3. **Endpoint Isn’t Intended for Third-Party Use**
   - This autocomplete service exists to power TradingView’s internal UI — not public developer access.
   - It lacks documentation, authentication, or stable guarantees.

---

## ✅ Solution: Server‑Side Proxy

To fix these issues while respecting TradingView’s infrastructure, we’re implementing a **server-side proxy**.

### What is a Proxy?

A proxy is a small server that acts as a **middleman** between your frontend and the third-party API. It receives the request from your browser, forwards it to TradingView, and returns the result.

### Why Use It?

| Challenge             | Why Proxy Solves It              |
|----------------------|----------------------------------|
| CORS Error           | Browsers block direct API calls, but **servers aren’t subject to CORS** |
| Header/Cookie Issues | Server can send safe, generic headers |
| Future Caching       | You can cache popular tickers server-side |
| Simplicity           | Easy to debug and maintain        |

---

## 🧭 Implementation Overview

### Step 1: Set Up Your Proxy Endpoint

Create a lightweight route like:

```
GET /api/symbol-search?text=AAPL
```

This route will:
- Validate the query
- Forward the request to TradingView’s real endpoint
- Return the exact JSON response back to the browser

### Step 2: Update Your Frontend

Your frontend will:
1. Call your new proxy route with the raw ticker (e.g., `"AAPL"`)
2. Parse the JSON response
3. Extract the `exchange` and `symbol` from the first match
4. Combine them into `"exchange:symbol"` format
5. Send that string to the TradingView chart using `postMessage()` or `BroadcastChannel`

### Step 3: Integrate with Watchlist Clicks

Each symbol card or search box should trigger:
```js
const full = await resolveFullSymbol("AAPL"); // e.g. returns "NASDAQ:AAPL"
chart.postMessage({ symbol: full });
```

---

## 🧠 Bonus: Asset Class Support

This setup supports all TradingView asset types:

| Asset Type | Example Symbol | Response from API          |
|------------|----------------|-----------------------------|
| Stock      | AAPL           | NASDAQ:AAPL                |
| ETF        | SPY            | AMEX:SPY                   |
| Futures    | ES1!           | CME_MINI:ES1!              |
| Index      | SPX            | INDEX:SPX                  |
| Crypto     | BTCUSD         | BINANCE:BTCUSD             |

By keeping `exchange=` and `type=` empty in the query string, the endpoint returns all relevant results, which you can filter or prioritize as needed.

---

## 🛡 Why This Approach is Safe

- We **don’t need to inject scripts** into TradingView’s site
- We **don’t need to scrape the DOM**
- We **don’t use private APIs** or violate authentication rules
- We simply call a **public endpoint** from a **server we control**

This reduces risk of breakage, makes debugging easier, and gives us long-term maintainability.

---

## ✅ Summary

| Item                       | Value                                              |
|----------------------------|----------------------------------------------------|
| Problem                    | 403 errors and CORS blocks when accessing TradingView autocomplete API directly |
| Why                        | TradingView doesn't allow direct browser access to that endpoint |
| Solution                   | Route the request through a backend proxy         |
| Benefit                    | Bypasses CORS, allows caching, and is reliable    |
| Supported Instruments      | Stocks, ETFs, Futures, Crypto, Indices           |
| Ideal for production use?  | ✅ Yes, especially when hosted on a reliable backend |
| Already using mitmproxy?   | ✅ Yes — you can add this route to your inject.py |

With this fix, users will be able to click **any symbol** in your watchlist — stock, ETF, futures, crypto — and have the TradingView chart **instantly load the correct fully-qualified version** with no reloads, no errors, and no CORS drama.
