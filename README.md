# TradingView Remote-Control Integration

A seamless, in-place symbol swap experience for TradingView charts driven by an external watchlist web application. Instead of loading a new URL (which reloads the entire page and triggers a "Leave site?" prompt), this system dynamically updates the symbol displayed in an already-loaded TradingView chart, preserving all user customizations such as indicators, drawings, and timeframes.

## Features

- **Instant Symbol Updates**: Clicking a ticker in the watchlist swaps the chart symbol in under 20ms
- **No Full-Page Reload**: Avoids changing `window.location` or reloading the URL entirely
- **Bypass Browser Prompts**: Eliminates Chrome's `beforeunload` dialog ("Leave site? Changes you made may not be saved.")
- **Cross-Origin Communication**: Uses `postMessage` API for secure communication between windows

## Project Structure

```
project/
├── inject.py        # mitmproxy hook: strip CSP + inject inject.js into all TradingView HTML
├── inject.js        # Injected into TradingView frames: finds the chart instance & listens for postMessage events
├── watchlist.html   # Watchlist UI: renders ticker buttons, opens TV window, and sends postMessage(symbol) on click
└── server.js        # Simple Express server to serve the watchlist
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Install mitmproxy
brew install mitmproxy  # macOS
# or
pip install mitmproxy  # Python

# Install Node.js dependencies
npm install
```

### 2. Configure mitmproxy

1. Trust mitmproxy's CA:
   - Visit `http://mitm.it`
   - Download and install the certificate for your OS
   - For macOS: Add to Keychain and set to "Always Trust"

2. Configure your system proxy:
   - Set HTTP and HTTPS proxies to `127.0.0.1:8080`

### 3. Start the Services

```bash
# Start mitmproxy with the injection script
mitmproxy -s inject.py --listen-port 8080

# In another terminal, start the watchlist server
node server.js
```

### 4. Use the Watchlist

1. Open `http://localhost:3000` in your browser
2. Click on any symbol in the watchlist
3. The TradingView chart will open (if not already open) and update to the selected symbol

## How It Works

1. **mitmproxy** intercepts HTML responses from TradingView and injects our `inject.js` script
2. **inject.js** runs in the TradingView context, finds the chart instance, and listens for postMessage events
3. **watchlist.html** provides a UI for selecting symbols and sends them to TradingView via postMessage
4. When a symbol is clicked, the chart updates instantly without reloading

## Technical Details

- Uses the `postMessage` API for cross-origin communication
- Leverages TradingView's internal `chart.setSymbol()` method
- Bypasses Content Security Policy (CSP) restrictions via mitmproxy
- Preserves all chart customizations during symbol swaps

## License

This project is for personal use only. Do not redistribute or use for commercial purposes.

## Disclaimer

This is a personal-use tool and not affiliated with or endorsed by TradingView. Use at your own risk. 