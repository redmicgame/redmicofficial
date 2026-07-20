const fs = require('fs');
let file_path = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file_path, 'utf8');

// 1. Patch salesPotential
content = content.replace(
    `const salesPotential = Math.floor(Math.random() * 136000) + 14000;`,
    `const salesPotential = Math.floor(Math.pow(Math.random(), 2.5) * 160000) + 3000;`
);

// 2. Patch streamActivity boost
content = content.replace(
    `streamActivity += 6000 + (Math.random() * 4000);`,
    `streamActivity += 4000 + (Math.random() * 2000);`
);

// 3. Let's fix the song churn as well, because pushing and splicing from the end is a bug.
// It should unshift and pop, or we can just sort by basePopularity so bad ones die.
// The song churn is:
const songChurnSearch = `      if (newNpcsList.length >= CHURN_COUNT) {
        newNpcsList.splice(newNpcsList.length - CHURN_COUNT, CHURN_COUNT);
      }`;
const songChurnReplace = `      if (newNpcsList.length > 2500) {
        newNpcsList.splice(2500, newNpcsList.length - 2500);
      }`;

content = content.replace(songChurnSearch, songChurnReplace);

const songPushSearch = `      // Add them back to the list
      newNpcsList.push(...newlyGeneratedNpcs);`;
const songPushReplace = `      // Add them back to the list
      newNpcsList.unshift(...newlyGeneratedNpcs);
      // Optional: simulate decay so old hits drop
      newNpcsList = newNpcsList.map(npc => ({...npc, basePopularity: Math.floor(npc.basePopularity * (0.97 + Math.random() * 0.02))}));
      newNpcsList.sort((a, b) => b.basePopularity - a.basePopularity);`;

content = content.replace(songPushSearch, songPushReplace);

// Let's also decay album salesPotential so they don't stay #1 forever
const albumChurnSearch = `      // Generate new albums using the newest songs`;
const albumChurnReplace = `      newNpcAlbums = newNpcAlbums.map(album => ({...album, salesPotential: Math.floor((album.salesPotential || 3000) * (0.94 + Math.random() * 0.04))}));
      newNpcAlbums.sort((a, b) => (b.salesPotential || 0) - (a.salesPotential || 0));
      
      // Generate new albums using the newest songs`;

content = content.replace(albumChurnSearch, albumChurnReplace);

fs.writeFileSync(file_path, content);
console.log("Patched album logic and chart churn");
