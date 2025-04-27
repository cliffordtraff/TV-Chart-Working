# Testing Guide for TradingView Symbol Search Proxy

This guide provides detailed instructions for testing the TradingView Symbol Search Proxy implementation.

## Prerequisites

- Node.js and npm installed
- The project set up according to the README.md instructions

## 1. Basic Proxy Testing

The simplest way to test the proxy is to use the included test script:

```bash
node test-proxy.js
```

This script tests the proxy with various symbol types:
- Stocks (AAPL)
- ETFs (SPY)
- Futures (ES1!)
- Indices (SPX)
- Crypto (BTCUSD)
- Invalid symbols (for error handling)

Expected output:
```
Testing TradingView Symbol Search Proxy

Testing symbol: AAPL
✅ Success: Found 1 matches
   First match: NASDAQ:AAPL
   Description: Apple Inc.
---
Testing symbol: SPY
✅ Success: Found 1 matches
   First match: AMEX:SPY
   Description: SPDR S&P 500 ETF Trust
---
...
```

## 2. Manual API Testing

You can also test the API endpoint manually using curl:

```bash
curl "http://localhost:3000/api/symbol-search?text=AAPL"
```

Expected response:
```json
[
  {
    "symbol": "AAPL",
    "exchange": "NASDAQ",
    "description": "Apple Inc.",
    "type": "stock",
    "provider_id": "NASDAQ:AAPL"
  }
]
```

## 3. Browser Testing

1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. Open the browser's developer tools (F12 or right-click > Inspect)

4. In the Console tab, test the SymbolService:
   ```javascript
   const symbolService = new SymbolService();
   symbolService.resolveSymbol('AAPL').then(console.log);
   ```

   Expected output:
   ```
   [SymbolService] Resolving symbol: AAPL
   [SymbolService] Fetching from proxy: http://localhost:3000/api/symbol-search?text=AAPL
   [SymbolService] Resolved to: NASDAQ:AAPL
   NASDAQ:AAPL
   ```

5. Test caching by running the same command again:
   ```javascript
   symbolService.resolveSymbol('AAPL').then(console.log);
   ```

   Expected output:
   ```
   [SymbolService] Resolving symbol: AAPL
   [SymbolService] Cache hit: NASDAQ:AAPL
   NASDAQ:AAPL
   ```

## 4. Integration Testing with Watchlist

1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. Click on a symbol in the watchlist

4. Verify that:
   - The TradingView chart opens (if not already open)
   - The chart updates to display the selected symbol
   - The symbol is correctly resolved with the proper exchange prefix

## 5. Error Handling Testing

1. Test with an invalid symbol:
   ```javascript
   const symbolService = new SymbolService();
   symbolService.resolveSymbol('INVALID_SYMBOL_123').then(console.log);
   ```

   Expected output:
   ```
   [SymbolService] Resolving symbol: INVALID_SYMBOL_123
   [SymbolService] Fetching from proxy: http://localhost:3000/api/symbol-search?text=INVALID_SYMBOL_123
   [SymbolService] Error resolving symbol: Error: No matches found for symbol: INVALID_SYMBOL_123
   [SymbolService] Using fallback: NASDAQ:INVALID_SYMBOL_123
   NASDAQ:INVALID_SYMBOL_123
   ```

2. Test with the server offline:
   - Stop the server (Ctrl+C)
   - Try to resolve a symbol
   - Verify that the fallback mechanism works

## 6. Performance Testing

1. Test the response time for a cold request:
   ```javascript
   console.time('resolve');
   const symbolService = new SymbolService();
   symbolService.resolveSymbol('AAPL').then(() => console.timeEnd('resolve'));
   ```

   Expected output (first request):
   ```
   [SymbolService] Resolving symbol: AAPL
   [SymbolService] Fetching from proxy: http://localhost:3000/api/symbol-search?text=AAPL
   [SymbolService] Resolved to: NASDAQ:AAPL
   resolve: 150.123ms
   ```

2. Test the response time for a cached request:
   ```javascript
   console.time('resolve');
   symbolService.resolveSymbol('AAPL').then(() => console.timeEnd('resolve'));
   ```

   Expected output (subsequent request):
   ```
   [SymbolService] Resolving symbol: AAPL
   [SymbolService] Cache hit: NASDAQ:AAPL
   resolve: 0.456ms
   ```

## 7. Cross-Browser Testing

Test the implementation in different browsers:
- Chrome
- Firefox
- Safari
- Edge

Verify that the symbol resolution and chart updates work correctly in each browser.

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure the server is running
   - Check that the CORS middleware is properly configured
   - Verify that the request is going to the correct URL

2. **Proxy Errors**:
   - Check the server logs for errors
   - Verify that the TradingView API is accessible
   - Ensure the request headers are correctly set

3. **Chart Update Issues**:
   - Verify that the TradingView chart is properly initialized
   - Check that the postMessage communication is working
   - Ensure the symbol format is correct

### Debugging Tips

1. **Server Logs**:
   - Check the server console for error messages
   - Look for "[Proxy]" prefixed log messages

2. **Client Logs**:
   - Open the browser's developer tools
   - Check the Console tab for "[SymbolService]" prefixed log messages

3. **Network Requests**:
   - Use the Network tab in developer tools to inspect requests
   - Verify that requests to `/api/symbol-search` are successful

## Conclusion

If all tests pass, the TradingView Symbol Search Proxy is working correctly. The implementation should now be able to resolve symbols accurately and efficiently, with proper error handling and caching. 