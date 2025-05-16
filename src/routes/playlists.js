const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
// const { isAuthenticated } = require('../middleware/authMiddleware'); // Placeholder for auth middleware

// Route to get user's playlists
router.get('/playlists', playlistController.getUserPlaylists);

// Route to reorder a playlist
// We'll need to protect this route to ensure the user is authenticated
router.post('/playlist/:playlistId/reorder', /* isAuthenticated, */ playlistController.reorderPlaylist);

// (Optional) Route to get playlist details
// router.get('/playlist/:playlistId', /* isAuthenticated, */ playlistController.getPlaylistDetails);

module.exports = router; 