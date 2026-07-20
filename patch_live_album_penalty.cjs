const fs = require('fs');
let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const release = artistData\.releases\.find\(\(r\) => r\.id === song\.releaseId\);\n\s*if \(release && release\.type === 'Live Album'\) \{\n\s*baseStreams \*= 0\.05; \/\/ -95% streams permanently\n\s*\}/;
const replacement = `const songRelease = artistData.releases.find((r) => r.id === song.releaseId);
            if (songRelease && songRelease.type === 'Live Album') {
                baseStreams *= 0.05; // -95% streams permanently
            }`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Fixed live album streams penalty declaration');
