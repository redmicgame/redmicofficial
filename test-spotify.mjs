import spotifyUrlInfo from 'spotify-url-info';
import fetch from 'node-fetch';
const spotify = spotifyUrlInfo(fetch);

spotify.getData('https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy')
  .then(data => console.log('success'))
  .catch(err => console.error(err));
