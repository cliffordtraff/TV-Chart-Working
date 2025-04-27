// config.js
// Alpha Vantage API configuration

const config = {
  // Replace with your Alpha Vantage API key
  alphaVantageApiKey: 'FKLI05WDQRW39EKR',
  
  // Default symbols to display in the watchlist
  defaultSymbols: [
    { symbol: 'SPY' },
    { symbol: 'DJI' },
    { symbol: 'AAPL' },
    { symbol: 'MSFT' },
    { symbol: 'GOOGL' },
    { symbol: 'AMZN' },
    { symbol: 'TSLA' },
    { symbol: 'META' },
    { symbol: 'NVDA' },
    { symbol: 'JPM' },
    { symbol: 'BTCUSD' },
    { symbol: 'ETHUSD' },
    { symbol: 'DIS' },
    { symbol: 'NFLX' },
    { symbol: 'PYPL' },
    { symbol: 'INTC' },
    { symbol: 'V' },
    { symbol: 'MA' },
    { symbol: 'BAC' },
    { symbol: 'WMT' },
    { symbol: 'PG' },
    { symbol: 'KO' },
    { symbol: 'USD' },
    { symbol: 'USDJPY' }
  ],
  
  // Refresh interval in milliseconds (5 minutes)
  refreshInterval: 5 * 60 * 1000
};

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} 