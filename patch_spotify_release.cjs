const fs = require('fs');
const file = '/app/applet/components/SpotifyReleaseDetailView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /<p className="font-semibold truncate">\{song\.title\}<\/p>/g,
    `<p className="font-semibold truncate">{song.title.replace(/ \\(feat\\\. [^)]+\\)/g, '')}</p>`
);

fs.writeFileSync(file, content);
