# TradingView Symbol Loader Chrome Extension

A Chrome extension that allows you to load symbols from your watchlist into TradingView charts.

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "TradingView Symbol Loader"
3. Click "Add to Chrome"

### As an Unpacked Extension (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Install the extension
2. Open a TradingView chart in your browser
3. Open your watchlist application in another tab
4. Click on symbols in your watchlist to load them in the TradingView chart

## How It Works

The extension uses the following messaging structure:

```javascript
// From your watchlist app to the extension
window.postMessage({
  symbol: "AAPL"  // or any other TradingView symbol
}, "*");

// Or with additional data
window.postMessage({
  data: {
    symbol: "AAPL"
  }
}, "*");
```

## Troubleshooting

### Chart Not Detected
- Make sure you're on a TradingView chart page
- Try refreshing the page
- Check the console for error messages

### Symbols Not Loading
- Verify that your watchlist app is sending the correct message format
- Check that the symbol is valid for TradingView
- Look for error messages in the console

### Extension Not Working
- Ensure the extension is enabled
- Check that you have the necessary permissions
- Try reinstalling the extension

## Development

### Project Structure
- `manifest.json`: Extension configuration
- `content.js`: Injects the main script into TradingView pages
- `inject.js`: Contains the chart control logic
- `background.js`: Handles symbol resolution (optional)
- `popup.html/js`: Simple UI for the extension (optional)

### Building
No build step is required. Simply load the extension directory as an unpacked extension.

### Testing
1. Load the extension in developer mode
2. Open a TradingView chart
3. Test symbol loading from your watchlist app
4. Check the console for any errors

## License

[MIT License](LICENSE) 