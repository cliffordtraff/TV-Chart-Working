# TradingView Remote-Control Integration: Debugging Notes

## Project Overview

This project aims to create a seamless symbol swap experience for TradingView charts driven by an external watchlist web application. The goal is to update the symbol displayed in an already-loaded TradingView chart without reloading the page, preserving all user customizations such as indicators, drawings, and timeframes.

## Current Implementation

### Architecture

- **Watchlist**: A simple HTML/JS application served at `http://localhost:3000`
- **TradingView**: The target application at `https://www.tradingview.com/chart/`
- **Communication Mechanism**: Cross-tab communication between the watchlist and TradingView
- **Injection Method**: Using mitmproxy to inject JavaScript into TradingView's webpage

### Components

1. **watchlist.html**: A simple web application with a list of stock symbols that can be clicked
2. **inject.js**: JavaScript code injected into TradingView to handle symbol changes
3. **mitmproxy**: Network proxy used to inject the JavaScript into TradingView

## Approaches Tried

### 1. BroadcastChannel API

**Implementation:**
- Used the `BroadcastChannel` API to create a channel named 'ticker_channel'
- Watchlist sends messages with symbol information
- TradingView listens for messages and updates the chart

**Code:**
```javascript
// In watchlist.html
const chan = new BroadcastChannel('ticker_channel');
chan.postMessage({ symbol: symbol });

// In inject.js
const chan = new BroadcastChannel('ticker_channel');
chan.onmessage = e => {
  const msg = e.data;
  if (msg.symbol) {
    chart.setSymbol(msg.symbol, null, true);
  }
};
```

**Result:** Failed. Messages were sent from the watchlist but not received by TradingView.

**Potential Issues:**
- Same-Origin Policy restrictions
- TradingView's Content Security Policy (CSP) blocking the BroadcastChannel
- Timing issues with code execution

### 2. localStorage with Storage Events

**Implementation:**
- Used localStorage to store symbol information
- Watchlist sets a value in localStorage and removes it to trigger the storage event
- TradingView listens for storage events and updates the chart

**Code:**
```javascript
// In watchlist.html
const message = { symbol: symbol, timestamp: Date.now() };
localStorage.setItem('tvSymbol', JSON.stringify(message));
localStorage.removeItem('tvSymbol');

// In inject.js
window.addEventListener('storage', (e) => {
  if (e.key !== 'tvSymbol') return;
  if (e.newValue === null) return;
  
  const msg = JSON.parse(e.newValue);
  if (msg.symbol) {
    chart.setSymbol(msg.symbol, null, true);
  }
});
```

**Result:** Failed. The watchlist sent messages, but TradingView did not receive them.

**Potential Issues:**
- The storage event only fires in other tabs/windows, not in the same tab
- TradingView's CSP might be blocking access to localStorage
- Cross-origin restrictions between localhost and tradingview.com

### 3. localStorage with Polling

**Implementation:**
- Used localStorage with unique message IDs
- Watchlist stores messages with IDs and sets a flag for pending messages
- TradingView polls for pending messages and processes them

**Code:**
```javascript
// In watchlist.html
const messageId = 'tv_symbol_' + Date.now();
const message = { id: messageId, symbol: symbol, timestamp: Date.now() };
localStorage.setItem(messageId, JSON.stringify(message));
localStorage.setItem('tv_symbol_pending', messageId);

// In inject.js
function processPendingSymbol() {
  const pendingId = localStorage.getItem('tv_symbol_pending');
  if (!pendingId) return;
  
  const messageStr = localStorage.getItem(pendingId);
  if (!messageStr) return;
  
  const message = JSON.parse(messageStr);
  if (message.symbol) {
    chart.setSymbol(message.symbol, null, true);
  }
  
  localStorage.removeItem(pendingId);
  localStorage.removeItem('tv_symbol_pending');
}

setInterval(processPendingSymbol, 500);
```

**Result:** Failed. The watchlist sent messages, but TradingView did not update the chart.

**Potential Issues:**
- Cross-origin restrictions preventing access to localStorage
- TradingView's CSP blocking access to localStorage
- The chart.setSymbol() function might not be working as expected

## Current Status

As of the latest testing:

1. The watchlist successfully sends messages when symbols are clicked
2. The TradingView page loads the injected script and finds the chart
3. The chart is not updating when messages are sent

## Debugging Information

### Watchlist Console Logs
```
[Watchlist] Starting up on: http://localhost:3000/
[Watchlist] Setup complete
[Watchlist] Clicked: NASDAQ:TSLA
[Watchlist] Sent message: {"symbol":"NASDAQ:TSLA","timestamp":1745188992809}
```

### TradingView Console Logs
```
[TV Remote] Script loaded on: https://www.tradingview.com/chart/4ZoqOLMe/
[TV Remote] Initializing...
[TV Remote] Starting initialization...
[TV Remote] Starting chart wait loop
[TV Remote] chart found on window.TradingViewApi
[TV Remote] Chart found: rt {_visibleBarsChanged: o, _crosshairMoved: o, _dataSourceHovered: o, _ranges: null, _panes: WeakMap, …}
[TV Remote] Setup complete - listening for symbol changes
```

## Potential Root Causes

1. **Cross-Origin Restrictions**: 
   - The watchlist is served from `http://localhost:3000`
   - TradingView is served from `https://www.tradingview.com`
   - Browsers enforce strict cross-origin restrictions that might prevent communication

2. **Content Security Policy (CSP)**:
   - TradingView likely has a strict CSP that blocks certain JavaScript APIs
   - This could prevent access to localStorage or BroadcastChannel

3. **Chart API Limitations**:
   - The `chart.setSymbol()` function might have limitations or requirements we're not meeting
   - It might need additional parameters or context to work properly

4. **Injection Timing**:
   - The script might be injected before the chart is fully initialized
   - The chart object might not be fully functional when we try to use it

5. **Sandbox Environment**:
   - TradingView might be running in a sandboxed environment that restricts certain operations
   - Our injected code might not have the necessary permissions

## Next Steps to Try

1. **Direct DOM Manipulation**:
   - Try to find the symbol input field in the TradingView UI and simulate user input
   - This might bypass some of the API limitations

2. **WebSocket Relay**:
   - Set up a local WebSocket server to relay messages between the watchlist and TradingView
   - This would bypass cross-origin restrictions

3. **Browser Extension**:
   - Create a browser extension that can inject code with higher privileges
   - This might bypass CSP restrictions

4. **iframe Communication**:
   - Try to find TradingView's internal iframes and communicate with them directly
   - The chart might be in a specific iframe that we need to target

5. **Network Request Analysis**:
   - Analyze the network requests made by TradingView when changing symbols
   - Try to replicate these requests directly

6. **TradingView API Documentation**:
   - Research if TradingView has an official API or documentation for the chart widget
   - This might provide insights into the correct way to change symbols

## Conclusion

The project is currently facing challenges with cross-tab communication between the watchlist and TradingView. Multiple approaches have been tried, but none have successfully updated the chart. The most likely issues are related to cross-origin restrictions, Content Security Policy limitations, or the chart API itself. Further investigation is needed to determine the exact cause and find a viable solution. 