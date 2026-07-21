const fs = require('fs');
const file = '/app/applet/components/CatalogView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /s\.artistId === activeArtist\.id \|\| s\.collaboration\?\.artistName === activeArtist\.name/g,
    `s.artistId === activeArtist.id || s.collaboration?.artistName === activeArtist.name || (s.features && s.features.includes(activeArtist.name))`
);

fs.writeFileSync(file, content);
