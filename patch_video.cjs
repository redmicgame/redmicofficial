const fs = require('fs');
const file = '/app/applet/components/CreateVideoView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(selectedSong\.collaboration\) \{[\s\S]*?\}/;
const replacement = `if (selectedSong.features && selectedSong.features.length > 0) {
            artistsForTitle = \`\${activeArtist.name}, \${selectedSong.features.join(", ")}\`;
            songForTitle = songForTitle.replace(/ \\(feat\\\. [^)]+\\)/g, '');
        } else if (selectedSong.collaboration) {
            artistsForTitle = \`\${activeArtist.name}, \${selectedSong.collaboration.artistName}\`;
            songForTitle = songForTitle.replace(/ \\(feat\\\. [^)]+\\)/g, '');
        }`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
