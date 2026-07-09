const spotifyUrlInfo = require('spotify-url-info');
const spotify = spotifyUrlInfo(fetch);

spotify.getData('https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy')
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
