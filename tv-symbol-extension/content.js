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
  // Check if the message has the expected structure
  const hasValidStructure = event.data && 
    (typeof event.data === 'object') && 
    (event.data.symbol || (event.data.data && event.data.data.symbol));

  // Check if this is a message from our extension
  const isFromExtension = event.data && event.data.source === 'tv-symbol-loader-extension';
  
  // Ignore messages that don't have valid structure and aren't from our extension
  if (!hasValidStructure && !isFromExtension) {
    console.log('[TV Symbol Loader] Ignoring invalid message:', event.data);
    return;
  }
  
  console.log('[TV Symbol Loader] Received message:', event.data);
  
  // Only forward messages that aren't already from our extension
  if (!isFromExtension) {
    // Forward the message to our injected script
    window.postMessage({
      source: 'tv-symbol-loader-extension',
      data: event.data
    }, '*');
  }
});

// Inject our script when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectScript);
} else {
  injectScript();
} 