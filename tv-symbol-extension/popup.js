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