/**
 * Sorts an array of Spotify playlist items based on specified criteria.
 * @param {Array<Object>} tracks Array of playlist item objects from Spotify API.
 *                      Each item is expected to have an `added_at` field and a `track` object.
 *                      The `track` object contains details like `name`, `artists`, `album`, `duration_ms`, `popularity`, `id`.
 * @param {string} criteria The sorting criteria. 
 *                        Expected values: 'date_added', 'release_date', 'name', 'artist_name', 'album_name', 'duration_ms', 'popularity'.
 * @param {string} order The sorting order: 'asc' (ascending) or 'desc' (descending).
 * @param {Object} spotifyService An instance of spotifyService to fetch additional details if needed (e.g., release dates).
 * @returns {Promise<Array<Object>>} A promise that resolves to the sorted array of playlist item objects.
 */
async function sortTracks(tracks, criteria, order, spotifyService) {
  if (!tracks || tracks.length === 0) {
    return [];
  }

  // Create a copy to avoid mutating the original array
  let sortedTracks = [...tracks];

  // Helper function to get track details if not already present
  const getFullTrackDetails = async (trackItems) => {
    const tracksWithoutAlbumReleaseDate = trackItems.filter(item => item.track && !item.track.album?.release_date);
    if (tracksWithoutAlbumReleaseDate.length > 0 && criteria === 'release_date') {
      const trackIdsToFetch = tracksWithoutAlbumReleaseDate.map(item => item.track.id).filter(id => id);
      if (trackIdsToFetch.length > 0) {
        const detailedTracks = await spotifyService.getTrackDetails(trackIdsToFetch);
        // Create a map for quick lookup
        const detailsMap = new Map(detailedTracks.map(dt => [dt.id, dt]));
        // Update original track items with detailed info
        trackItems.forEach(item => {
          if (item.track && detailsMap.has(item.track.id)) {
            const detail = detailsMap.get(item.track.id);
            // Merge album details, especially release_date
            if (detail.album) {
              item.track.album = { ...item.track.album, ...detail.album };
            }
          }
        });
      }
    }
    return trackItems;
  };

  // Fetch additional details if sorting by release_date and they are missing
  if (criteria === 'release_date') {
    sortedTracks = await getFullTrackDetails(sortedTracks);
  }

  sortedTracks.sort((a, b) => {
    let valA, valB;

    // Ensure track objects exist
    if (!a.track || !b.track) return 0;

    switch (criteria) {
      case 'date_added':
        valA = new Date(a.added_at);
        valB = new Date(b.added_at);
        break;
      case 'release_date':
        // Ensure album and release_date exist. Handle varying precision (YYYY, YYYY-MM, YYYY-MM-DD)
        valA = a.track.album && a.track.album.release_date ? new Date(a.track.album.release_date) : new Date(0); // Oldest if undefined
        valB = b.track.album && b.track.album.release_date ? new Date(b.track.album.release_date) : new Date(0);
        break;
      case 'name':
        valA = a.track.name?.toLowerCase() || '';
        valB = b.track.name?.toLowerCase() || '';
        break;
      case 'artist_name':
        valA = a.track.artists && a.track.artists.length > 0 ? a.track.artists[0].name?.toLowerCase() : '';
        valB = b.track.artists && b.track.artists.length > 0 ? b.track.artists[0].name?.toLowerCase() : '';
        break;
      case 'album_name':
        valA = a.track.album?.name?.toLowerCase() || '';
        valB = b.track.album?.name?.toLowerCase() || '';
        break;
      case 'duration_ms':
        valA = a.track.duration_ms || 0;
        valB = b.track.duration_ms || 0;
        break;
      case 'popularity':
        valA = a.track.popularity || 0;
        valB = b.track.popularity || 0;
        break;
      default:
        return 0; // No sorting if criteria is unknown
    }

    if (valA < valB) {
      return order === 'asc' ? -1 : 1;
    }
    if (valA > valB) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return sortedTracks;
}

module.exports = {
  sortTracks,
}; 