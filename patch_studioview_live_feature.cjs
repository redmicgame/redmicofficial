const fs = require('fs');
let file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /title: original\.title \+ " - Live",\n\s*coverArt: coverArt \|\| original\.coverArt,\n\s*isReleased: false,/g;
const replacement = `title: original.title + " - Live",
                    coverArt: coverArt || original.coverArt,
                    isReleased: false,
                    isFeatureToNpc: false,
                    npcArtistName: undefined,`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Patched live album feature bug in StudioView');
