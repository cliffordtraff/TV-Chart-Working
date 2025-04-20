const express = require('express');
const path = require('path');
const app = express();

// Serve static files from current directory
app.use(express.static(__dirname));

// Route for the watchlist
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'watchlist.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT} to view your watchlist`);
}); 