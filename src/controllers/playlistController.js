const { spotifyApi } = require('./authController'); // Import the configured Spotify API instance
const spotifyService = require('../services/spotifyService');
const sortUtils = require('../utils/sortUtils');

exports.getUserPlaylists = async (req, res) => {
  const accessToken = req.query.accessToken;

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token is required.' });
  }

  // Temporarily set the access token for this request
  const originalAccessToken = spotifyApi.getAccessToken();
  spotifyApi.setAccessToken(accessToken);

  try {
    console.log('Fetching user playlists with token:', accessToken.substring(0, 10) + '...');
    
    // Get user's playlists with edit permissions
    const playlists = await spotifyService.getUserPlaylists();
    
    console.log(`Found ${playlists.length} playlists for the user`);
    
    spotifyApi.setAccessToken(originalAccessToken); // Reset token
    res.status(200).json({ playlists });
    
  } catch (error) {
    spotifyApi.setAccessToken(originalAccessToken); // Reset token in case of error
    console.error('Error fetching user playlists:', error);
    
    // More detailed error logging
    if (error.statusCode) {
      console.error(`Status code: ${error.statusCode}, Error message: ${error.body?.error?.message || error.message}`);
      return res.status(error.statusCode).json({ 
        message: error.body?.error?.message || error.message,
        error: 'spotify_api_error'
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to fetch playlists.', 
      error: error.message || 'unknown_error' 
    });
  }
};

exports.reorderPlaylist = async (req, res) => {
  const { playlistId } = req.params;
  const { sortCriteria, sortOrder, accessToken } = req.body; // Assuming frontend sends accessToken in body

  if (!playlistId || !sortCriteria || !sortOrder) {
    return res.status(400).json({ message: 'Playlist ID, sort criteria, and sort order are required.' });
  }

  if (!accessToken) {
    // This is a simplified way to handle token. In a real app, you might use a middleware 
    // to verify the token from an Authorization header (Bearer token) or a secure cookie.
    return res.status(401).json({ message: 'Access token is required.' });
  }

  // Temporarily set the access token for this request
  // Ideally, the spotifyApi instance used by spotifyService should already be authenticated,
  // or spotifyService methods should accept an accessToken.
  const originalAccessToken = spotifyApi.getAccessToken();
  spotifyApi.setAccessToken(accessToken);

  try {
    console.log(`Reordering playlist ${playlistId} by ${sortCriteria} (${sortOrder})`);

    // 1. Get all tracks from the playlist
    const tracks = await spotifyService.getAllPlaylistTracks(playlistId);
    if (!tracks || tracks.length === 0) {
      spotifyApi.setAccessToken(originalAccessToken); // Reset token
      return res.status(404).json({ message: 'Playlist not found or is empty.' });
    }

    // 2. Sort the tracks
    // The sortUtils will need track details, potentially fetching more if needed (e.g., release dates)
    const sortedTracks = await sortUtils.sortTracks(tracks, sortCriteria, sortOrder, spotifyService);
    const sortedTrackUris = sortedTracks.map(item => item.track.uri);

    // 3. Reorder the playlist on Spotify
    // Spotify API replaces all tracks in the playlist with the new order.
    // For very long playlists, this might need to be done in batches if there's a limit per request.
    await spotifyService.reorderPlaylistItems(playlistId, sortedTrackUris);

    spotifyApi.setAccessToken(originalAccessToken); // Reset token
    res.status(200).json({ message: 'Playlist reordered successfully.', sortedTracksCount: sortedTrackUris.length });

  } catch (error) {
    spotifyApi.setAccessToken(originalAccessToken); // Reset token in case of error
    console.error('Error reordering playlist:', error.message);
    if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.body?.error?.message || error.message });
    }
    res.status(500).json({ message: 'Failed to reorder playlist.', error: error.message });
  }
};

// Placeholder for getPlaylistDetails if needed later
// exports.getPlaylistDetails = async (req, res) => { ... }; 