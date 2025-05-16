const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Redirects user to Spotify for login
router.get('/login', authController.login);

// Spotify redirects here after user login
router.get('/callback', authController.callback);

// (Optional) Endpoint to get current token or user info
// router.get('/me', authController.getMe);

// (Optional) Endpoint to logout
// router.get('/logout', authController.logout);

module.exports = router; 