import './styles/styles.css'
import { AlphaVantageService } from './services/alphaVantageService.js'
import { SymbolService } from './services/symbolService.js'
import { config } from './config/config.js'

console.log('[Watchlist] Starting up on:', window.location.href)

// Initialize services
const alphaVantageService = new AlphaVantageService(localStorage.getItem('alphaVantageApiKey') || config.alphaVantageApiKey)
const symbolService = new SymbolService()

// Track the currently highlighted row
let currentHighlightedRow = null
let updateTimer = null

// Function to show status messages
function showStatus(message, isError = false) {
    const statusEl = document.getElementById('status')
    statusEl.textContent = message
    statusEl.className = 'status ' + (isError ? 'error' : 'success')
    statusEl.style.display = 'block'
    setTimeout(() => {
        statusEl.style.display = 'none'
    }, 3000)
}

// Open or get reference to TradingView window
let tvWindow = null
let pendingSymbol = null

/**
 * Opens (or reuses) the TradingView window.
 * Returns an object: { win, isNew }
 *   win   – window reference
 *   isNew – true if we just opened the window in this call
 */
function openTradingView() {
    let isNew = false
    if (!tvWindow || tvWindow.closed) {
        tvWindow = window.open('https://www.tradingview.com/chart/', 'tvChartWindow')
        console.log('[Watchlist] Opened TradingView window')
        isNew = true
    }
    return { win: tvWindow, isNew }
}

// Send the symbol to TradingView, ensuring the page is fully loaded first
function sendSymbol(rawSymbol) {
    console.log('[Watchlist] Processing symbol:', rawSymbol)
    
    const { win: tvWin, isNew } = openTradingView()
    if (!tvWin) {
        showStatus('Could not open TradingView window', true)
        return
    }
    
    if (isNew) {
        // Window is still loading – defer sending the symbol
        pendingSymbol = rawSymbol
        // First-load handshake: wait for chart-ready event from inject.js
        window.addEventListener('message', function onChartReady(event) {
            if (
                event.source === tvWin &&
                event.data &&
                event.data.source === 'tv-symbol-loader-extension' &&
                event.data.type === 'chart-ready'
            ) {
                console.log('[Watchlist] Received chart-ready handshake, sending symbol:', pendingSymbol)
                tvWin.postMessage({ symbol: pendingSymbol }, '*')
                showStatus(`Symbol ${pendingSymbol} sent to TradingView`)
                pendingSymbol = null
                window.removeEventListener('message', onChartReady)
            }
        })
    } else {
        // Window already loaded, send immediately
        console.log('[Watchlist] Sending to TradingView:', rawSymbol)
        tvWin.postMessage({ symbol: rawSymbol }, '*')
        showStatus(`Symbol ${rawSymbol} sent to TradingView`)
    }
}

// Function to format dates as MM/DD/YY
function formatExDate(dateStr) {
    if (!dateStr || dateStr === 'N/A' || dateStr === 'None' || dateStr === null) return '—';  // Using em dash
    
    try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return '—'  // Invalid date
        
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        const year = date.getFullYear().toString().slice(2)
        
        return `${month}/${day}/${year}`
    } catch (e) {
        console.error("Error formatting date:", e)
        return '—'  // Using em dash
    }
}

// Function to format numbers
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '—';  // Using em dash
    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })
}

// Function to format large numbers (like volume)
function formatLargeNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '—';  // Using em dash
    
    if (num >= 1e12) {
        return (num / 1e12).toFixed(2) + 'T'
    } else if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B'
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M'
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K'
    } else {
        return num.toLocaleString()
    }
}

// Function to create a watchlist row
function createWatchlistRow(symbol, price, change, changePercent, volume, sector, bid, ask, weekHigh52, weekLow52, marketCap, peRatio, exDividendDate, bidSize, askSize, eps, dividendYield, name) {
    const row = document.createElement('tr')
    row.dataset.symbol = symbol
    
    // Symbol cell
    const symbolCell = document.createElement('td')
    symbolCell.className = 'symbol'
    symbolCell.style.cursor = 'pointer' // Show clickable cursor for entire cell
    // Make symbol look and act like a link
    const symbolLink = document.createElement('a')
    symbolLink.href = '#'
    symbolLink.textContent = symbol.includes(':') ? symbol.split(':')[1] : symbol
    symbolLink.style.textDecoration = 'none'
    symbolLink.style.color = 'inherit'
    
    // Click handler function for both the link and the cell
    const handleSymbolClick = (e) => {
        e.preventDefault()
        const baseSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol
        
        // Remove highlight from previously highlighted row
        if (currentHighlightedRow && currentHighlightedRow !== row) {
            currentHighlightedRow.classList.remove('row-highlight')
        }
        
        // Highlight this row
        row.classList.add('row-highlight')
        currentHighlightedRow = row
        
        // Send symbol to TradingView
        sendSymbol(symbol)
    }
    
    // Add click handlers
    symbolLink.addEventListener('click', handleSymbolClick)
    symbolCell.addEventListener('click', handleSymbolClick)
    
    symbolCell.appendChild(symbolLink)
    row.appendChild(symbolCell)
    
    // News cell
    const newsCell = document.createElement('td')
    newsCell.className = 'news'
    const newsLink = document.createElement('a')
    newsLink.href = `https://www.google.com/search?q=${encodeURIComponent(symbol)}+stock+news&tbm=nws`
    newsLink.target = '_blank'
    newsLink.innerHTML = '📰'
    newsLink.title = `News for ${symbol}`
    newsCell.appendChild(newsLink)
    row.appendChild(newsCell)
    
    // Price cell
    const priceCell = document.createElement('td')
    priceCell.className = 'price'
    priceCell.textContent = formatNumber(price)
    row.appendChild(priceCell)
    
    // Change cell
    const changeCell = document.createElement('td')
    changeCell.className = 'change ' + (change >= 0 ? 'positive' : 'negative')
    changeCell.textContent = formatNumber(change)
    row.appendChild(changeCell)
    
    // Change % cell
    const changePercentCell = document.createElement('td')
    changePercentCell.className = 'change ' + (changePercent >= 0 ? 'positive' : 'negative')
    changePercentCell.textContent = formatNumber(changePercent) + '%'
    row.appendChild(changePercentCell)
    
    // Bid cell
    const bidCell = document.createElement('td')
    bidCell.textContent = formatNumber(bid)
    row.appendChild(bidCell)
    
    // Ask cell
    const askCell = document.createElement('td')
    askCell.textContent = formatNumber(ask)
    row.appendChild(askCell)
    
    // Bid Size cell
    const bidSizeCell = document.createElement('td')
    bidSizeCell.textContent = formatLargeNumber(bidSize)
    row.appendChild(bidSizeCell)
    
    // Ask Size cell
    const askSizeCell = document.createElement('td')
    askSizeCell.textContent = formatLargeNumber(askSize)
    row.appendChild(askSizeCell)
    
    // Volume cell
    const volumeCell = document.createElement('td')
    volumeCell.className = 'volume'
    volumeCell.textContent = formatLargeNumber(volume)
    row.appendChild(volumeCell)
    
    // Low cell
    const lowCell = document.createElement('td')
    lowCell.textContent = formatNumber(weekLow52)
    row.appendChild(lowCell)
    
    // High cell
    const highCell = document.createElement('td')
    highCell.textContent = formatNumber(weekHigh52)
    row.appendChild(highCell)
    
    // Market Cap cell
    const marketCapCell = document.createElement('td')
    marketCapCell.textContent = formatLargeNumber(marketCap)
    row.appendChild(marketCapCell)
    
    // P/E cell
    const peCell = document.createElement('td')
    peCell.textContent = formatNumber(peRatio, 1)
    row.appendChild(peCell)
    
    // Ex-Dividend Date cell
    const exDateCell = document.createElement('td')
    exDateCell.textContent = formatExDate(exDividendDate)
    row.appendChild(exDateCell)
    
    // EPS cell
    const epsCell = document.createElement('td')
    epsCell.textContent = formatNumber(eps, 2)
    row.appendChild(epsCell)
    
    // Dividend Yield cell
    const divYieldCell = document.createElement('td')
    divYieldCell.textContent = formatNumber(dividendYield, 2) + '%'
    row.appendChild(divYieldCell)
    
    // Name cell
    const nameCell = document.createElement('td')
    nameCell.className = 'name'
    nameCell.textContent = name || symbol
    row.appendChild(nameCell)
    
    return row
}

// Get symbols from config
const symbols = config.defaultSymbols

// Function to update watchlist data
async function updateWatchlist() {
    const watchlistBody = document.getElementById('watchlistBody')
    watchlistBody.innerHTML = '<tr><td colspan="18" class="loading">Fetching data...</td></tr>'
    
    const fragment = document.createDocumentFragment()
    let hasError = false

    // Create batches of 5 symbols each to process in parallel
    const batchSize = 5
    const batches = []
    for (let i = 0; i < symbols.length; i += batchSize) {
        batches.push(symbols.slice(i, i + batchSize))
    }

    // Process each batch
    for (const batch of batches) {
        try {
            // Process symbols in this batch concurrently
            const batchResults = await Promise.all(batch.map(async ({ symbol }) => {
                try {
                    // Skip invalid symbols
                    if (!symbol || symbol.trim() === '') return null

                    // Handle special cases for crypto and forex
                    const isCrypto = symbol.endsWith('USD')
                    const isForex = symbol.length === 6 && !symbol.endsWith('USD')
                    
                    // Get quote data
                    const quote = await alphaVantageService.getQuote(symbol)
                    if (quote.error) {
                        return {
                            type: 'error',
                            symbol,
                            error: quote.error
                        }
                    }

                    // For crypto and forex, create simplified overview
                    if (isCrypto || isForex) {
                        return {
                            type: isCrypto ? 'crypto' : 'forex',
                            symbol,
                            quote,
                            overview: {
                                sector: isCrypto ? 'Cryptocurrency' : 'Forex',
                                name: isForex ? `${symbol.slice(0,3)}/${symbol.slice(3)}` : symbol,
                                marketCap: null,
                                peRatio: null,
                                exDividendDate: null,
                                eps: null,
                                dividendYield: null
                            }
                        }
                    }

                    // For stocks, get the overview data
                    const overview = await alphaVantageService.getCompanyOverview(symbol)
                    if (overview.error) {
                        console.error(`Error fetching overview for ${symbol}:`, overview.error)
                    }

                    return {
                        type: 'stock',
                        symbol,
                        quote,
                        overview: overview.error ? {
                            sector: 'Unknown',
                            name: symbol,
                            marketCap: null,
                            peRatio: null,
                            exDividendDate: null,
                            eps: null,
                            dividendYield: null
                        } : overview
                    }
                } catch (error) {
                    console.error(`Error processing ${symbol}:`, error)
                    return {
                        type: 'error',
                        symbol,
                        error
                    }
                }
            }))

            // Create rows for successful results
            for (const result of batchResults) {
                if (!result) continue

                if (result.type === 'error') {
                    hasError = true
                    const row = createWatchlistRow(
                        result.symbol,
                        null, null, null, null, null, null, null,
                        null, null, null, null, null, null, null,
                        null, null, 'Error loading data'
                    )
                    fragment.appendChild(row)
                } else {
                    // Create row with combined data (works for stocks, crypto, and forex)
                    const row = createWatchlistRow(
                        result.symbol,
                        result.quote.price,
                        result.quote.change,
                        result.quote.changePercent,
                        result.quote.volume,
                        result.overview.sector,
                        result.quote.bid,
                        result.quote.ask,
                        result.quote.weekHigh52,
                        result.quote.weekLow52,
                        result.overview.marketCap,
                        result.overview.peRatio,
                        result.overview.exDividendDate,
                        result.quote.bidSize,
                        result.quote.askSize,
                        result.overview.eps,
                        result.overview.dividendYield,
                        result.overview.name
                    )
                    fragment.appendChild(row)
                }
            }

            // Add a smaller delay between batches instead of between each symbol
            await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
            console.error('Error processing batch:', error)
            hasError = true
        }
    }
    
    watchlistBody.innerHTML = ''
    watchlistBody.appendChild(fragment)
    
    if (hasError) {
        showStatus('Some data failed to load. Check console for details.', true)
    }
}

// Function to save API key
function saveApiKey() {
    const apiKeyInput = document.getElementById('apiKeyInput')
    const apiKey = apiKeyInput.value.trim()
    
    if (apiKey) {
        localStorage.setItem('alphaVantageApiKey', apiKey)
        showStatus('API key saved successfully')
        
        // Update the service with the new API key
        alphaVantageService.apiKey = apiKey
        
        // Update the watchlist with the new API key
        updateWatchlist()
        
        // Hide the API key form
        document.getElementById('apiKeyForm').style.display = 'none'
    } else {
        showStatus('Please enter a valid API key', true)
    }
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if API key exists
    const apiKey = localStorage.getItem('alphaVantageApiKey') || config.alphaVantageApiKey
    if (!apiKey) {
        document.getElementById('apiKeyForm').style.display = 'block'
        showStatus('Please enter your Alpha Vantage API key', true)
    } else {
        document.getElementById('apiKeyForm').style.display = 'none'
        updateWatchlist()
        
        // Set up automatic refresh
        if (config.refreshInterval) {
            updateTimer = setInterval(updateWatchlist, config.refreshInterval)
        }
    }
    
    // Set up refresh button
    document.getElementById('refreshButton').addEventListener('click', () => {
        updateWatchlist()
        showStatus('Refreshing data...')
    })
    
    // Set up API key form
    document.getElementById('saveApiKeyButton').addEventListener('click', saveApiKey)
    
    // Allow pressing Enter to save API key
    document.getElementById('apiKeyInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveApiKey()
        }
    })
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (updateTimer) {
            clearInterval(updateTimer)
        }
    })
})
