const fs = require('fs');
const file = '/app/applet/components/SpotifyView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /<p className="font-semibold text-white truncate">\{song\.title\}<\/p>/g,
    `<p className="font-semibold text-white truncate">{song.title.replace(/ \\(feat\\\. [^)]+\\)/g, '')}</p>`
);

fs.writeFileSync(file, content);
