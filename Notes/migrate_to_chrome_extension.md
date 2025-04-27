# 🧠 Project Migration Plan: TradingView Symbol Loader — mitmproxy → Chrome Extension

## 🎯 Goal

We want to **transition this project** from using `mitmproxy` (network-level injection) to a **Chrome extension** that can:
- Listen to symbol clicks from our watchlist web app
- Inject JavaScript directly into `TradingView.com` pages
- Control the TradingView chart by calling `chart().setSymbol(...)`
- Fetch and resolve raw tickers (e.g. `"AAPL"`, `"SPX"`) using a proxy or background script
- Do all of this without modifying browser proxy settings or injecting network traffic

---

## 🚧 Problems with mitmproxy (Current Setup)

| Problem                              | Reason                                           |
|--------------------------------------|--------------------------------------------------|
| Requires manual proxy configuration | Users must set Wi-Fi settings or trust root cert |
| Harder to deploy to others           | mitmproxy is great for dev, but not for users    |
| Some iframe edge cases               | Injecting into the right frame is brittle        |
| Security warnings                    | HTTPS interception triggers browser warnings     |

---

## ✅ Why Move to Chrome Extension

| Feature                      | Benefit                                              |
|------------------------------|------------------------------------------------------|
| Runs in user's browser       | No proxy or system config needed                    |
| First-class JS context       | Runs in the same world as TradingView's scripts     |
| Can target specific frames   | Using `allFrames: true` and `world: "MAIN"`         |
| Can use `window.postMessage` | Works across different origins (unlike BroadcastChannel) |
| Safer injection              | CSP is bypassed when injected via extension         |

---

## 🏗️ Chrome Extension Structure

```plaintext
tv-symbol-extension/
├── manifest.json          # Declares permissions, matches, and scripts
├── background.js          # Optional (can handle fetch proxy if needed)
├── content.js             # Injects `inject.js` into page
├── inject.js              # Main chart logic (runs in page)
├── popup.html             # Optional UI
└── README.md              # Developer instructions
```

---

## 🧩 Key Features to Replicate from mitmproxy

| mitmproxy Feature              | Chrome Extension Equivalent                        |
|-------------------------------|----------------------------------------------------|
| Inject `inject.js` globally   | Use `chrome.scripting.executeScript()` in MV3      |
| Modify chart via API          | Call `chart().setSymbol()` in `inject.js`          |
| Listen for ticker messages    | Use `window.postMessage` (NOT BroadcastChannel)    |
| Load inject.js in iframe      | Use `allFrames: true` in manifest                  |
| Proxy autocomplete endpoint   | (Optionally) handle in background.js or server     |

---

## ❌ Why NOT BroadcastChannel

We previously attempted to use BroadcastChannel but encountered these issues:

1. **Same-origin restriction**: A BroadcastChannel named "ticker_channel" is only shared among browsing contexts whose origin (scheme + host + port) is exactly the same.

2. **Cross-origin incompatibility**: 
   - Your watch-list is served from localhost, file://, or a different domain than tradingview.com
   - TradingView's iframe is on https://www.tradingview.com
   - Result: those two contexts never see each other's broadcasts

3. **Solution**: We'll continue using `window.postMessage` which works across different origins when properly configured with the extension.

---

## 🚀 Transition Plan

1. **Copy your working `inject.js` from mitmproxy**  
   This becomes your core logic. We'll inject it into TradingView.com using the extension.

2. **Create `manifest.json`** (Manifest V3)  
   - Include permissions for `scripting`, `tabs`, `storage` (optional)
   - Match URL patterns like `*://www.tradingview.com/chart/*`
   - Set `content_scripts` with `allFrames: true` if needed

3. **Create `background.js`** (optional)  
   - You can do autocomplete lookups here instead of server
   - Relay results to `inject.js` via `chrome.runtime.sendMessage`

4. **Implement injection logic**  
   Use `chrome.scripting.executeScript()` to inject your `inject.js` into the **main JS world** (`world: "MAIN"`).

5. **Replace proxy-based symbol resolution**  
   Instead of fetching via mitmproxy, your frontend will now:
   - Call your own API server, or
   - Send a message to `background.js` to fetch from TradingView's endpoint

6. **Test chart responsiveness**  
   Make sure `chart().setSymbol()` still works as expected, and that you're targeting the correct iframe or tab.

---

## 🛡️ Advantages After Migration

- 💻 Native experience (no proxy needed)
- 📦 Easier to share with team/users
- 🔐 No cert installation or HTTPS interception
- 🧰 Can combine multiple chart-control features over time
- 🔄 Easily update via manifest and Chrome Dev Tools

---

## ✅ Next Steps

1. Create the MV3 boilerplate files (I can give them to you)
2. Move your `inject.js` logic into the extension
3. Replace `mitmproxy` as the injection layer
4. Test on `www.tradingview.com/chart/`
5. Extend support for autocomplete using a background script or server proxy
