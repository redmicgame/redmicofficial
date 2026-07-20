const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

if (!content.includes('actingRoles: [],')) {
    content = content.replace('goldenGlobeHistory: [],', 'goldenGlobeHistory: [],\n  actingRoles: [],');
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log("Patched actingRoles in GameContext");
}
