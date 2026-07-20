const fs = require('fs');
let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const newSong: Song = \{/;
const replacement = `let safeQuality = action.payload.song.quality;
      if (typeof safeQuality !== 'number' || Number.isNaN(safeQuality)) safeQuality = 50;
      action.payload.song.quality = safeQuality;
      const newSong: Song = {`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Patched GameContext safe quality');
