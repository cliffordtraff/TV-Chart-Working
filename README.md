# TradingView Symbol Search Proxy

A server-side proxy for TradingView's symbol search API that enables seamless symbol resolution in external applications.

## Overview

This project provides a proxy server that allows external applications to access TradingView's symbol search functionality without running into CORS issues or other restrictions. It's designed to work with the TradingView Remote-Control Integration project, enabling users to click on ticker symbols in a watchlist and have them instantly load in a TradingView chart.

## Features

- **Server-side Proxy**: Bypasses CORS restrictions by proxying requests to TradingView's API
- **Caching**: Implements both server-side and client-side caching for improved performance
- **Error Handling**: Robust error handling with fallbacks for when the API is unavailable
- **Support for Multiple Asset Types**: Works with stocks, ETFs, futures, indices, and crypto

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```

## Usage

### API Endpoint

The proxy exposes a single endpoint:

```
GET /api/symbol-search?text=SYMBOL
```

Example:
```
GET /api/symbol-search?text=AAPL
```

Response:
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

### Integration with Watchlist

The `SymbolService` class in `public/symbolService.js` provides a simple interface for resolving symbols:

```javascript
const symbolService = new SymbolService();
const fullSymbol = await symbolService.resolveSymbol('AAPL');
console.log(fullSymbol); // "NASDAQ:AAPL"
```

### Testing

To test the proxy implementation:

```
node test-proxy.js
```

This will test the proxy with various symbol types and report the results.

## Architecture

The solution consists of three main components:

1. **Express Server**: Handles proxy requests and implements server-side caching
2. **SymbolService**: Client-side service for resolving symbols with local caching
3. **Watchlist UI**: User interface for displaying and interacting with symbols

## Error Handling

The implementation includes several layers of error handling:

1. **Server-side**: Catches and logs errors from TradingView's API
2. **Client-side**: Falls back to a default exchange (NASDAQ) if the proxy fails
3. **Caching**: Reduces dependency on the API by caching results

## License

This project is for personal use only. Do not distribute or use for commercial purposes.

## Acknowledgments

- TradingView for providing the symbol search API
- The mitmproxy project for inspiration on proxy implementations 