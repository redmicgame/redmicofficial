const fs = require('fs');
const file = '/app/applet/components/CreateVideoView.tsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(line => line.includes('let songForTitle = selectedSong.title;'));
const endIndex = lines.findIndex((line, i) => i > startIndex && line.includes('const baseTitle = videoType ==='));

const replacementLines = [
'        let songForTitle = selectedSong.title;',
'        if (selectedSong.features && selectedSong.features.length > 0) {',
'            artistsForTitle = `${activeArtist.name}, ${selectedSong.features.join(", ")}`;',
'            songForTitle = songForTitle.replace(/ \\\\(feat\\\\. [^)]+\\\\)/g, "");',
'        } else if (selectedSong.collaboration) {',
'            artistsForTitle = `${activeArtist.name}, ${selectedSong.collaboration.artistName}`;',
'            songForTitle = songForTitle.replace(/ \\\\(feat\\\\. [^)]+\\\\)/g, "");',
'        }'
];

lines.splice(startIndex, endIndex - startIndex, ...replacementLines);
fs.writeFileSync(file, lines.join('\n'));
