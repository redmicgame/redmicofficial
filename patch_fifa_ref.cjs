const fs = require('fs');
let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /soundtrackAlbums: updatedSoundtrackAlbums \|\| state\.soundtrackAlbums,\n\s*fifaSingleScheduled: newFifaScheduled !== undefined \? newFifaScheduled : undefined,/;
const replacement = `soundtrackAlbums: state.soundtrackAlbums,
        fifaSingleScheduled: state.fifaSingleScheduled,`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Fixed early return references');
