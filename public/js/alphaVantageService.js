// alphaVantageService.js
// Service for interacting with the Alpha Vantage API

class AlphaVantageService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://www.alphavantage.co/query';
  }

  /**
   * Get the current price and change for a symbol
   * @param {string} symbol - The stock symbol (e.g., 'AAPL')
   * @returns {Promise} - Promise that resolves to the price data
   */
  async getQuote(symbol) {
    // Extract the actual symbol without exchange prefix
    const cleanSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
    
    try {
      const response = await fetch(
        `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if we have valid data
      if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
        const quote = data['Global Quote'];
        
        // For demo purposes, generate random values for fields not in the API
        const price = parseFloat(quote['05. price']);
        
        return {
          symbol: cleanSymbol,
          price: price,
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: parseInt(quote['06. volume']),
          latestTradingDay: quote['07. latest trading day'],
          // Added simulated fields
          bid: price * 0.999, // Slightly lower than price
          ask: price * 1.001, // Slightly higher than price
          bidSize: Math.floor(Math.random() * 1000) * 100,
          askSize: Math.floor(Math.random() * 1000) * 100,
          weekHigh52: price * 1.2, // 20% above current price
          weekLow52: price * 0.8, // 20% below current price
          marketCap: parseInt(quote['06. volume']) * price // Rough estimate
        };
      } else {
        throw new Error('No data available for this symbol');
      }
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      return {
        symbol: cleanSymbol,
        error: error.message
      };
    }
  }

  /**
   * Get company overview information
   * @param {string} symbol - The stock symbol (e.g., 'AAPL')
   * @returns {Promise} - Promise that resolves to the company overview
   */
  async getCompanyOverview(symbol) {
    // Extract the actual symbol without exchange prefix
    const cleanSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
    
    try {
      const response = await fetch(
        `${this.baseUrl}?function=OVERVIEW&symbol=${cleanSymbol}&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if we have valid data
      if (data.Symbol) {
        return {
          symbol: cleanSymbol,
          name: data.Name,
          description: data.Description,
          sector: data.Sector,
          industry: data.Industry,
          marketCap: parseFloat(data.MarketCapitalization),
          peRatio: parseFloat(data.PERatio),
          eps: parseFloat(data.EPS),
          dividendYield: parseFloat(data.DividendYield) * 100, // Convert to percentage
          exDividendDate: data.ExDividendDate,
          profitMargin: parseFloat(data.ProfitMargin),
          revenuePerShare: parseFloat(data.RevenuePerShareTTM),
          quarterlyEarningsGrowth: parseFloat(data.QuarterlyEarningsGrowthYOY),
          quarterlyRevenueGrowth: parseFloat(data.QuarterlyRevenueGrowthYOY)
        };
      } else {
        throw new Error('No data available for this symbol');
      }
    } catch (error) {
      console.error(`Error fetching company overview for ${symbol}:`, error);
      return {
        symbol: cleanSymbol,
        error: error.message
      };
    }
  }

  /**
   * Get intraday data for a symbol
   * @param {string} symbol - The stock symbol (e.g., 'AAPL')
   * @param {string} interval - The time interval (e.g., '5min', '15min', '30min', '60min')
   * @returns {Promise} - Promise that resolves to the intraday data
   */
  async getIntraday(symbol, interval = '5min') {
    // Extract the actual symbol without exchange prefix
    const cleanSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
    
    try {
      const response = await fetch(
        `${this.baseUrl}?function=TIME_SERIES_INTRADAY&symbol=${cleanSymbol}&interval=${interval}&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if we have valid data
      const timeSeriesKey = `Time Series (${interval})`;
      if (data[timeSeriesKey]) {
        // Get the most recent data point
        const timeSeries = data[timeSeriesKey];
        const latestTime = Object.keys(timeSeries)[0];
        const latestData = timeSeries[latestTime];
        
        return {
          symbol: cleanSymbol,
          interval: interval,
          timestamp: latestTime,
          open: parseFloat(latestData['1. open']),
          high: parseFloat(latestData['2. high']),
          low: parseFloat(latestData['3. low']),
          close: parseFloat(latestData['4. close']),
          volume: parseInt(latestData['5. volume'])
        };
      } else {
        throw new Error('No data available for this symbol');
      }
    } catch (error) {
      console.error(`Error fetching intraday data for ${symbol}:`, error);
      return {
        symbol: cleanSymbol,
        error: error.message
      };
    }
  }
}

// Make AlphaVantageService available globally when in browser environment
if (typeof window !== 'undefined') {
    window.AlphaVantageService = AlphaVantageService;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlphaVantageService;
} 