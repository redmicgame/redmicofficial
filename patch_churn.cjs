const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const churnTarget = `// NPC Churn Logic: Simulate new songs releasing
      let newNpcsList = [...state.npcs];`;

const churnReplacement = `// NPC Churn Logic: Simulate new songs releasing
      let newNpcsList = [...state.npcs];
      
      // Remove dead/inactive artists
      newNpcsList = newNpcsList.filter(npc => {
          if (!NPC_ERAS[npc.artist]) return true;
          return state.date.year <= NPC_ERAS[npc.artist].end;
      });`;

content = content.replace(churnTarget, churnReplacement);

const albumChurnTarget = `// NPC Album Churn Logic
      let newNpcAlbums = [...state.npcAlbums];`;

const albumChurnReplacement = `// NPC Album Churn Logic
      let newNpcAlbums = [...state.npcAlbums];
      
      // Remove dead/inactive artists' albums
      newNpcAlbums = newNpcAlbums.filter(album => {
          if (!NPC_ERAS[album.artistName]) return true;
          return state.date.year <= NPC_ERAS[album.artistName].end;
      });`;

content = content.replace(albumChurnTarget, albumChurnReplacement);

fs.writeFileSync('context/GameContext.tsx', content);
console.log('patched churn for dead artists');
