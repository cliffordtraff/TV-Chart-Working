// server.js
// Express server for API endpoints

const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com' // TODO: Update with actual production domain
    : 'http://localhost:5173', // Vite's default development port
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// TODO: Add your API endpoints here

// Start the server
app.listen(PORT, () => {
  console.log(`Backend API server running on http://localhost:${PORT}`);
}); 