const SpotifyWebApi = require('spotify-web-api-node');
const querystring = require('querystring');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// Scopes define the permissions the app is requesting
const scopes = [
  'ugc-image-upload',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-email',
  'user-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-modify-private',
  'user-library-modify',
  'user-library-read',
  'user-top-read',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-follow-read',
  'user-follow-modify',
];

exports.login = (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes, 'some-state-of-my-choice'));
};

exports.callback = async (req, res) => {
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  if (error) {
    console.error('Callback Error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login-failed?error=SpotifyCallbackError`); // Redirect to frontend with error
    return;
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];
    const expiresIn = data.body['expires_in'];

    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    const queryParams = querystring.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn
    });
    res.redirect(`${process.env.FRONTEND_URL}/auth-callback?${queryParams}`);

  } catch (err) {
    console.error('Error getting Tokens:', err);
    res.redirect(`${process.env.FRONTEND_URL}/login-failed?error=TokenError`);
  }
};

// (Optional) Function to refresh the access token
// async function refreshAccessToken() {
//   try {
//     const data = await spotifyApi.refreshAccessToken();
//     const newAccessToken = data.body['access_token'];
//     spotifyApi.setAccessToken(newAccessToken);
//     console.log('The access token has been refreshed!');

//     // If the refresh token also gets refreshed, update it as well
//     if (data.body['refresh_token']) {
//       spotifyApi.setRefreshToken(data.body['refresh_token']);
//     }
//     return newAccessToken;
//   } catch (error) {
//     console.error('Could not refresh access token', error);
//     throw error;
//   }
// }

// Export the configured spotifyApi instance so it can be used by other services/controllers
// This instance will have the tokens set after successful authentication.
module.exports.spotifyApi = spotifyApi; 