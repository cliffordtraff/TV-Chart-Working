// test-proxy.js
// Script to test the TradingView symbol search proxy

const axios = require('axios');

// Test symbols of different types
const testSymbols = [
  'AAPL',    // Stock
  'SPY',     // ETF
  'ES1!',    // Futures
  'SPX',     // Index
  'BTCUSD',  // Crypto
  'INVALID'  // Invalid symbol (for error testing)
];

// Function to test the proxy
async function testProxy() {
  console.log('Testing TradingView Symbol Search Proxy\n');
  
  for (const symbol of testSymbols) {
    try {
      console.log(`Testing symbol: ${symbol}`);
      
      // Call our proxy endpoint
      const response = await axios.get(`http://localhost:3000/api/symbol-search?text=${symbol}`);
      
      // Check if we got results
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        console.log(`✅ Success: Found ${response.data.length} matches`);
        console.log(`   First match: ${result.exchange}:${result.symbol}`);
        console.log(`   Description: ${result.description || 'N/A'}`);
      } else {
        console.log(`❌ No matches found for: ${symbol}`);
      }
      
      console.log('---');
    } catch (error) {
      console.log(`❌ Error testing ${symbol}:`);
      console.log(`   ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data)}`);
      }
      console.log('---');
    }
  }
  
  console.log('Test complete');
}

// Run the test
testProxy().catch(console.error); 