const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

// Inside LOAD_GAME, add defaults:
content = content.replace('oscarSubmissions: action.payload.oscarSubmissions || [],', 'goldenGlobeSubmissions: action.payload.goldenGlobeSubmissions || [],\n        goldenGlobeCurrentYearNominations: action.payload.goldenGlobeCurrentYearNominations || null,\n        oscarSubmissions: action.payload.oscarSubmissions || [],');

content = content.replace('newState.artistsData[id].oscarHistory =', 'newState.artistsData[id].goldenGlobeHistory = newState.artistsData[id].goldenGlobeHistory || [];\n          newState.artistsData[id].oscarHistory =');

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Patched LOAD_GAME");
