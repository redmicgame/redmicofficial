const fs = require('fs');
const file = '/app/applet/components/SpotifyDiscographyView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /return song\?\.collaboration\?\.artistName === activeArtist\.name;/g,
    `return song?.collaboration?.artistName === activeArtist.name || (song?.features && song.features.includes(activeArtist.name));`
);

fs.writeFileSync(file, content);
