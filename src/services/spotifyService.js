const { spotifyApi } = require('../controllers/authController'); // Get the configured spotifyApi instance

/**
 * Fetches all user's playlists, handling pagination.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of playlist objects.
 */
async function getUserPlaylists() {
  let playlists = [];
  let offset = 0;
  const limit = 50; // Spotify API limit for fetching playlists
  let response;

  try {
    // First, get the current user's profile to identify which playlists they own
    const userProfile = await spotifyApi.getMe();
    const userId = userProfile.body.id;
    console.log('Current user ID:', userId);

    do {
      response = await spotifyApi.getUserPlaylists({ offset, limit });
      if (response.body && response.body.items) {
        // Include all playlists returned by the API
        playlists = playlists.concat(response.body.items);
        offset += limit;
      }
    } while (response.body && response.body.next);

    // Filter playlists to only include those the user can modify
    // (they are either the owner or the playlist is collaborative)
    const editablePlaylists = playlists.filter(playlist => 
      playlist.owner.id === userId || playlist.collaborative
    );

    return editablePlaylists.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      images: playlist.images,
      tracks: playlist.tracks,
      external_urls: playlist.external_urls,
      uri: playlist.uri,
      owner: {
        id: playlist.owner.id,
        display_name: playlist.owner.display_name
      }
    }));
  } catch (error) {
    console.error('Error fetching user playlists:', error.message);
    throw error;
  }
}

/**
 * Fetches all tracks from a Spotify playlist, handling pagination.
 * @param {string} playlistId The ID of the playlist.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of playlist track objects.
 */
async function getAllPlaylistTracks(playlistId) {
  let tracks = [];
  let offset = 0;
  const limit = 100; // Spotify API limit for fetching playlist items
  let response;

  try {
    do {
      response = await spotifyApi.getPlaylistTracks(playlistId, { offset, limit });
      if (response.body && response.body.items) {
        tracks = tracks.concat(response.body.items.filter(item => item.track)); // Filter out null tracks (e.g., if a track was deleted)
        offset += limit;
      }
    } while (response.body && response.body.next);
    return tracks;
  } catch (error) {
    console.error('Error fetching playlist tracks:', error.message);
    if (error.statusCode === 401) {
        // Handle token expiration, possibly by trying to refresh it if a refresh token is available
        // For now, we just re-throw, assuming the controller handles it or a global error handler does.
        console.error('Access token might be expired or invalid.');
    }
    throw error;
  }
}

/**
 * Replaces all items in a playlist with a new set of tracks (URIs).
 * @param {string} playlistId The ID of the playlist.
 * @param {Array<string>} trackUris An array of track URIs to set for the playlist.
 * @returns {Promise<Object>} A promise that resolves to the Spotify API response.
 */
async function reorderPlaylistItems(playlistId, trackUris) {
  try {
    // Spotify API replaces all tracks. If the list of URIs is empty, it clears the playlist.
    // The API can handle up to 100 track URIs per request for replacePlaylistTracks.
    // For longer playlists, we might need to batch this, though `replacePlaylistItems` should handle it.
    // If `trackUris` is very long (e.g. > 100 and `replacePlaylistItems` isn't smart enough or there's another limit),
    // we might need to clear the playlist first and then add tracks in batches of 100.
    // However, `replacePlaylistItems` is generally preferred.

    if (trackUris.length === 0) {
        // To clear the playlist
        await spotifyApi.replaceTracksInPlaylist(playlistId, []);
        console.log(`Playlist ${playlistId} cleared.`);
        return { snapshot_id: 'playlist_cleared' }; // Mock response for cleared playlist
    }

    // Replace items in batches of 100 if necessary
    const batchSize = 100;
    let snapshotId;
    for (let i = 0; i < trackUris.length; i += batchSize) {
        const batch = trackUris.slice(i, i + batchSize);
        if (i === 0) {
            // First batch replaces all existing tracks
            const response = await spotifyApi.replaceTracksInPlaylist(playlistId, batch);
            snapshotId = response.body.snapshot_id;
            console.log(`Replaced tracks in playlist ${playlistId} with first batch, snapshot: ${snapshotId}`);
        } else {
            // Subsequent batches add to the playlist
            const response = await spotifyApi.addTracksToPlaylist(playlistId, batch);
            snapshotId = response.body.snapshot_id;
            console.log(`Added batch of tracks to playlist ${playlistId}, snapshot: ${snapshotId}`);
        }
    }
    return { snapshot_id: snapshotId }; // Return the last snapshot_id

  } catch (error) {
    console.error('Error reordering playlist items:', error.message);
    throw error;
  }
}

/**
 * Fetches detailed information for multiple tracks.
 * @param {Array<string>} trackIds An array of track IDs.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of track objects.
 */
async function getTrackDetails(trackIds) {
    if (!trackIds || trackIds.length === 0) {
        return [];
    }
    try {
        // Spotify API allows fetching details for up to 50 tracks at a time.
        const batchSize = 50;
        let allTrackDetails = [];
        for (let i = 0; i < trackIds.length; i += batchSize) {
            const batch = trackIds.slice(i, i + batchSize);
            const response = await spotifyApi.getTracks(batch);
            if (response.body && response.body.tracks) {
                allTrackDetails = allTrackDetails.concat(response.body.tracks.filter(t => t)); // Filter out nulls if any
            }
        }
        return allTrackDetails;
    } catch (error) {
        console.error('Error fetching track details:', error.message);
        throw error;
    }
}

module.exports = {
  getUserPlaylists,
  getAllPlaylistTracks,
  reorderPlaylistItems,
  getTrackDetails,
}; 