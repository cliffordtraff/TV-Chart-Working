// background.js
console.log('[TV Symbol Loader] Background script loaded');

// Cache for symbol lookups to reduce API calls
const symbolCache = new Map();

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'resolveSymbol') {
    // Handle symbol resolution
    console.log('[TV Symbol Loader] Resolving symbol:', message.symbol);
    
    // Check cache first
    if (symbolCache.has(message.symbol)) {
      console.log('[TV Symbol Loader] Using cached symbol data');
      sendResponse({ success: true, data: symbolCache.get(message.symbol) });
      return true;
    }
    
    // IMPROVED: Use the public autocomplete endpoint
    fetch(`https://symbol-search.tradingview.com/symbol_search/?text=${encodeURIComponent(message.symbol)}&exchange=&type=&domain=production`)
      .then(response => response.json())
      .then(data => {
        // Cache the results
        symbolCache.set(message.symbol, data);
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