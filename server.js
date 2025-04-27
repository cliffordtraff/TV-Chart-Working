// server.js
// Express server for TradingView symbol search proxy

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cache for symbol search results
const symbolCache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Proxy endpoint for TradingView symbol search
app.get('/api/symbol-search', async (req, res) => {
  const { text } = req.query;
  
  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }
  
  // Check cache first
  const cacheKey = text.toLowerCase();
  const cachedResult = symbolCache[cacheKey];
  
  if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_DURATION) {
    console.log(`[Proxy] Cache hit for: ${text}`);
    return res.json(cachedResult.data);
  }
  
  try {
    console.log(`[Proxy] Fetching from TradingView: ${text}`);
    
    // Build the TradingView URL
    const url = new URL('https://symbol-search.tradingview.com/symbol_search/');
    url.searchParams.set('text', text);
    url.searchParams.set('exchange', '');
    url.searchParams.set('type', '');
    url.searchParams.set('domain', 'production');
    
    // Make the request to TradingView
    const response = await axios.get(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.tradingview.com/'
      }
    });
    
    // Cache the result
    symbolCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    // Return the data
    res.json(response.data);
  } catch (error) {
    console.error(`[Proxy] Error fetching symbol data:`, error.message);
    
    // Return a more user-friendly error
    res.status(500).json({
      error: 'Failed to fetch symbol data',
      message: error.message
    });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'watchlist.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 