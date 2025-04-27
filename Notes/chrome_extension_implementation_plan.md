# Chrome Extension Implementation Plan for TradingView Symbol Loader

## Overview

This document outlines the detailed implementation plan for migrating our TradingView Symbol Loader from a mitmproxy-based approach to a Chrome extension. The goal is to create a more user-friendly, secure, and easily distributable solution that doesn't require proxy configuration or certificate installation.

## Why We're Making This Change

1. **User Experience**: Eliminate the need for users to configure proxy settings or install certificates
2. **Security**: Remove HTTPS interception which triggers browser security warnings
3. **Distribution**: Make it easier to share with team members and end users
4. **Reliability**: Improve iframe handling and chart detection
5. **Extensibility**: Create a foundation for adding more features in the future

## Implementation Steps

### 1. Create Extension Directory Structure

```plaintext
tv-symbol-extension/
├── manifest.json          # Extension configuration
├── background.js          # Background script for proxy functionality
├── content.js             # Content script to inject our code
├── inject.js              # Main chart control logic
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # Documentation
```

### 2. Create manifest.json

```json
{
  "manifest_version": 3,
  "name": "TradingView Symbol Loader",
  "version": "1.0.0",
  "description": "Loads symbols from watchlist into TradingView charts",
  "permissions": [
    "scripting",
    "tabs",
    "storage"
  ],
  "host_permissions": [
    "*://*.tradingview.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["*://*.tradingview.com/chart/*"],
      "js": ["content.js"],
      "all_frames": true,
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### 3. Create content.js

This script will be injected into TradingView pages and will handle injecting our main logic:

```javascript
// content.js
console.log('[TV Symbol Loader] Content script loaded on:', window.location.href);

// Function to inject our main script into the page
function injectScript() {
  // Create a script element
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.type = 'text/javascript';
  
  // Add it to the page
  (document.head || document.documentElement).appendChild(script);
  
  // Clean up after injection
  script.onload = function() {
    script.remove();
  };
  
  console.log('[TV Symbol Loader] Injected script into page');
}

// Listen for messages from our watchlist app
window.addEventListener('message', function(event) {
  // Only accept messages from our trusted origins
  const trustedOrigins = [
    'http://localhost:3000',
    'file://',
    // Add any other origins your watchlist might be served from
  ];
  
  if (!trustedOrigins.includes(event.origin)) {
    console.log('[TV Symbol Loader] Ignoring message from untrusted origin:', event.origin);
    return;
  }
  
  console.log('[TV Symbol Loader] Received message:', event.data);
  
  // Forward the message to our injected script
  window.postMessage({
    source: 'tv-symbol-loader-extension',
    data: event.data
  }, '*');
});

// Inject our script when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectScript);
} else {
  injectScript();
}
```

### 4. Create inject.js

This is the core logic that will control the TradingView chart:

```javascript
// inject.js
console.log('[TV Symbol Loader] Script loaded on:', window.location.href);

if (!window.__TV_SYMBOL_LOADER) {
  window.__TV_SYMBOL_LOADER = true;
  console.log('[TV Symbol Loader] Initializing...');

  function findChart(win = window) {
    console.log('[TV Symbol Loader] Searching for chart in window:', win.location?.href || 'unknown');
    // 1) look for a top‑level .chart() method
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
    // 2) recurse into frames
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

    console.log('[TV Symbol Loader] Setup complete - listening for postMessage events');
  })();
}
```

### 5. Create background.js (Optional)

This script can handle proxy functionality for symbol resolution:

```javascript
// background.js
console.log('[TV Symbol Loader] Background script loaded');

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'resolveSymbol') {
    // Handle symbol resolution
    // This could call TradingView's API or your own backend
    console.log('[TV Symbol Loader] Resolving symbol:', message.symbol);
    
    // Example: Fetch from TradingView's API
    fetch(`https://www.tradingview.com/api/v1/symbols?query=${message.symbol}`)
      .then(response => response.json())
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error('[TV Symbol Loader] Symbol resolution error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});
```

### 6. Create popup.html (Optional)

A simple popup UI for the extension:

```html
<!DOCTYPE html>
<html>
<head>
  <title>TradingView Symbol Loader</title>
  <style>
    body {
      width: 300px;
      padding: 10px;
      font-family: Arial, sans-serif;
    }
    h1 {
      font-size: 16px;
      margin-top: 0;
    }
    .status {
      margin: 10px 0;
      padding: 5px;
      border-radius: 4px;
    }
    .connected {
      background-color: #d4edda;
      color: #155724;
    }
    .disconnected {
      background-color: #f8d7da;
      color: #721c24;
    }
  </style>
</head>
<body>
  <h1>TradingView Symbol Loader</h1>
  <div id="status" class="status disconnected">Checking connection...</div>
  <p>This extension allows you to load symbols from your watchlist into TradingView charts.</p>
  <p>Open a TradingView chart and click on symbols in your watchlist to load them.</p>
  
  <script src="popup.js"></script>
</body>
</html>
```

### 7. Create popup.js (Optional)

```javascript
// popup.js
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're connected to a TradingView chart
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    const statusElement = document.getElementById('status');
    
    if (currentTab.url.includes('tradingview.com/chart')) {
      statusElement.textContent = 'Connected to TradingView chart';
      statusElement.className = 'status connected';
    } else {
      statusElement.textContent = 'Not connected to a TradingView chart';
      statusElement.className = 'status disconnected';
    }
  });
});
```

## How It Works

1. **Extension Installation**: User installs the Chrome extension from the Chrome Web Store or loads it as an unpacked extension.

2. **Content Script Injection**: When a user navigates to a TradingView chart page, the content script (`content.js`) is automatically injected.

3. **Main Script Injection**: The content script injects our main logic (`inject.js`) into the page.

4. **Chart Detection**: The injected script searches for the TradingView chart object and waits until it's available.

5. **Message Handling**: 
   - The watchlist app sends a postMessage with a symbol
   - The content script receives it and forwards it to the injected script
   - The injected script calls `chart.setSymbol()` to change the chart

6. **Symbol Resolution** (Optional):
   - If needed, the background script can handle symbol resolution
   - This could call TradingView's API or your own backend

## Testing Plan

1. **Local Development**:
   - Load the extension as an unpacked extension in Chrome
   - Navigate to a TradingView chart page
   - Open your watchlist app in another tab
   - Click on symbols and verify they load in the chart

2. **Edge Cases**:
   - Test with different TradingView chart layouts
   - Test with iframes
   - Test with different symbol formats

3. **Distribution**:
   - Package the extension for distribution
   - Test installation on a clean browser

## Deployment Steps

1. **Package the Extension**:
   - Create a ZIP file of the extension directory
   - Or use Chrome's "Pack Extension" feature

2. **Publish to Chrome Web Store** (Optional):
   - Create a developer account
   - Submit the extension for review
   - Wait for approval

3. **Share with Team**:
   - Share the packaged extension file
   - Provide installation instructions

## Conclusion

This implementation plan provides a detailed roadmap for migrating from mitmproxy to a Chrome extension. The key advantages are:

- No proxy configuration needed
- No certificate installation required
- Better security (no HTTPS interception)
- Easier distribution
- More reliable chart detection and control

By following this plan, we'll create a more user-friendly and robust solution for loading symbols from a watchlist into TradingView charts. 