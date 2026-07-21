const fs = require('fs');
let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const existingTrack = playlist\.tracks\.find\(t => t\.songId === c\.uniqueId\);\n\s*if \(existingTrack\) {\n\s*const weeksInPlaylist = \(newDate\.year - existingTrack\.addedDate\.year\) \* 52 \+ \(newDate\.week - existingTrack\.addedDate\.week\);/;
const replacement = `const existingTrack = playlist.tracks.find(t => t.songId === c.uniqueId);
             if (existingTrack && existingTrack.addedDate) {
                  const weeksInPlaylist = (newDate.year - existingTrack.addedDate.year) * 52 + (newDate.week - existingTrack.addedDate.week);`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Fixed playlists safely');
