const fs = require('fs');
let file = '/app/applet/components/SpotifyNowPlayingView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/song\.genre\.split/g, '(song.genre || "").split');
fs.writeFileSync(file, content);
console.log('Fixed genre in SpotifyNowPlayingView');
