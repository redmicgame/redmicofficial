const fs = require('fs');
let content = fs.readFileSync('utils/xContentGenerator.ts', 'utf-8');

const targetRegex = /npcUser = \{\s*id: npcUserId,\s*name: randomArtist,\s*username: npcUsername,\s*avatar:\s*"data:image\/svg\+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzMzMyIvPjwvc3ZnPg==",/gm;

const replacement = `npcUser = {
          id: npcUserId,
          name: randomArtist,
          username: npcUsername,
          avatar: NPC_ARTIST_IMAGES[randomArtist] || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzMzMyIvPjwvc3ZnPg==",`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync('utils/xContentGenerator.ts', content);
console.log('Patched X user avatars');
