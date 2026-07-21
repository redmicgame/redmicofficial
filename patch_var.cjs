const fs = require('fs');
let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/let updatedSoundtrackAlbums = /g, 'var updatedSoundtrackAlbums = ');
content = content.replace(/let newFifaScheduled = /g, 'var newFifaScheduled = ');
fs.writeFileSync(file, content);
console.log('Fixed let to var');
