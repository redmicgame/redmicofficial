const fs = require('fs');
let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /isFeatureToNpc: true,\n\s*npcArtistName: npcArtistName,/;
const replacement = `isFeatureToNpc: true,
        isAvailableOnStreaming: true,
        npcArtistName: npcArtistName,`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Fixed NPC feature streaming availability');
