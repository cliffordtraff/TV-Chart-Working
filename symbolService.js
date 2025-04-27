// symbolService.js
// Service for resolving stock symbols to their full TradingView format
/*
This script is used to resolve stock symbols to their full TradingView format
It uses TradingView's symbol search API to find the correct exchange
Falls back to "NASDAQ:TICKER" if the lookup fails
Provides methods for cache management (get, save, clear)
The main function is resolveSymbol() which takes a raw ticker symbol and returns a promise that resolves to the full exchange-qualified symbol format required by TradingView.
The service is designed to work in both browser environments (exposed as window.SymbolService) and Node.js (exposed via module.exports).
*/

class SymbolService {
    constructor() {
        // Initialize cache from localStorage or empty object
        this.symbolCache = JSON.parse(localStorage.getItem('symbolCache') || '{}');
        
        // Endpoint for TradingView symbol search
        this.searchEndpoint = 'https://symbol-search.tradingview.com/symbol_search/';
    }

    /**
     * Save the current cache to localStorage
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
    async resolveSymbol(rawTicker) {
        console.log('[SymbolService] Resolving symbol:', rawTicker);
        
        // Check cache first
        const cached = this.getCached(rawTicker);
        if (cached) {
            console.log('[SymbolService] Cache hit:', cached);
            return cached;
        }

        try {
            // Build the search URL
            const url = new URL(this.searchEndpoint);
            url.searchParams.set('text', rawTicker);
            url.searchParams.set('exchange', '');
            url.searchParams.set('type', '');
            url.searchParams.set('domain', 'production');

            // Fetch from TradingView
            console.log('[SymbolService] Fetching from TradingView:', url.toString());
            const response = await fetch(url.toString());
            
            if (!response.ok) {
                throw new Error(`Symbol lookup failed: ${response.status}`);
            }

            const results = await response.json();
            
            if (!results || results.length === 0) {
                throw new Error(`No matches found for symbol: ${rawTicker}`);
            }

            // Get the first (best) match
            const match = results[0];
            const fullSymbol = `${match.exchange}:${match.symbol}`;
            
            // Cache the result
            this.symbolCache[rawTicker] = fullSymbol;
            this.saveCache();
            
            console.log('[SymbolService] Resolved to:', fullSymbol);
            return fullSymbol;

        } catch (error) {
            console.error('[SymbolService] Error resolving symbol:', error);
            
            // Fallback: use NASDAQ as the default exchange
            const fallbackSymbol = `NASDAQ:${rawTicker}`;
            console.log('[SymbolService] Using fallback:', fallbackSymbol);
            return fallbackSymbol;
        }
    }
}

// Make SymbolService available globally when in browser environment
if (typeof window !== 'undefined') {
    window.SymbolService = SymbolService;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SymbolService;
} 