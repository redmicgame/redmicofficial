const fs = require('fs');
const file = '/app/applet/components/SpotifyView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /song\.collaboration\?\.artistName === activeArtistName/g,
    `(song.collaboration?.artistName === activeArtistName || (song.features && song.features.includes(activeArtistName)))`
);

fs.writeFileSync(file, content);
