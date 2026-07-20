const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const target = `          // Payout to active artist for their podcasts
          if (activeData) {`;
const replacement = `          // Payout to active artist for their podcasts
          const activeData = finalState.artistsData[state.activeArtistId];
          if (activeData) {`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log("Patched GameContext.tsx");
} else {
    console.log("Could not find target in GameContext.tsx");
}
