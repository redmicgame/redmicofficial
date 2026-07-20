const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

content = content.replace(
    /        podcasts: newPodcasts,/,
    '        soundtrackAlbums: typeof updatedSoundtrackAlbums !== "undefined" ? updatedSoundtrackAlbums : state.soundtrackAlbums,\n        fifaSingleScheduled: typeof newFifaScheduled !== "undefined" ? newFifaScheduled : undefined,\n        podcasts: newPodcasts,'
);

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Fixed FIFA return object");
