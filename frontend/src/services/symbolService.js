// symbolService.js
// Service for resolving stock symbols to their full TradingView format

export class SymbolService {
    constructor() {
        // Initialize cache from localStorage or empty object
        this.symbolCache = JSON.parse(localStorage.getItem('symbolCache') || '{}');
        
        // Endpoint for TradingView symbol search
        this.searchEndpoint = 'https://symbol-search.tradingview.com/symbol_search/';
    }

    /**
     * Save the symbol cache to localStorage
     */
    saveCache() {
        localStorage.setItem('symbolCache', JSON.stringify(this.symbolCache));
    }

    /**
     * Clear the symbol cache
     */
    clearCache() {
        this.symbolCache = {};
        localStorage.removeItem('symbolCache');
    }

    /**
     * Get a symbol from cache
     * @param {string} rawTicker - The raw ticker symbol (e.g., 'AAPL')
     * @returns {string|null} - The cached full symbol or null if not found
     */
    getCached(rawTicker) {
        return this.symbolCache[rawTicker] || null;
    }

    /**
     * Resolve a raw ticker to its full TradingView symbol
     * @param {string} rawTicker - The raw ticker symbol (e.g., 'AAPL')
     * @returns {Promise<string>} - The full symbol (e.g., 'NASDAQ:AAPL')
     */
    async resolveSymbol(symbol) {
        try {
            // Check cache first
            if (this.symbolCache[symbol]) {
                console.log(`Using cached data for ${symbol}`);
                return this.symbolCache[symbol];
            }

            console.log(`Resolving symbol: ${symbol}`);
            
            // Build the search URL for TradingView
            const searchUrl = `${this.searchEndpoint}?query=${encodeURIComponent(symbol)}`;
            
            // Fetch the symbol data
            const response = await fetch(searchUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch symbol data: ${response.status} ${response.statusText}`);
            }
            
            // Parse the JSON response
            const data = await response.json();
            
            if (!data || data.length === 0) {
                throw new Error(`No data found for symbol: ${symbol}`);
            }
            
            // Get the first result
            const result = data[0];
            
            // Format the symbol with exchange prefix
            const fullSymbol = `${result.exchange}:${result.symbol}`;
            
            // Cache the result
            this.symbolCache[symbol] = fullSymbol;
            this.saveCache();
            
            return fullSymbol;
        } catch (error) {
            console.error(`Error resolving symbol ${symbol}:`, error);
            return {
                symbol: symbol,
                error: true,
                message: error.message
            };
        }
    }
} 