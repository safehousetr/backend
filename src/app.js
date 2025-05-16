// Main application file (app.js)
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config(); // To load environment variables from .env file

// Import route handlers
const authRoutes = require('./routes/auth');
const playlistRoutes = require('./routes/playlists');

const app = express();

// Middlewares
app.use(cors()); // Enable CORS for all routes
app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Mount route handlers
app.use('/auth', authRoutes);
app.use('/api', playlistRoutes);

// Basic error handler (can be improved)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});

module.exports = app; 