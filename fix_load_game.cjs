const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const target = `      const newState = {
        podcasts: mergedPodcasts,
        ...action.payload,`;

const replacement = `      const newState = {
        podcasts: mergedPodcasts,
        ...action.payload,
        spotifyGlobal: action.payload.spotifyGlobal || (action.payload as any).spotifyGlobal50 || [],
        spotifyPlaylists: mergedPlaylists,
        difficultyMode: action.payload.difficultyMode || "normal",
      };

      if (newState.npcs) {
        newState.npcs = newState.npcs.map(npc => {
           if (npc.coverArt && npc.coverArt.includes("ui-avatars.com")) {
               const newImage = NPC_ARTIST_IMAGES[npc.artist] || newState.npcImages?.[npc.artist];
               if (newImage) {
                   return { ...npc, coverArt: newImage };
               }
           }
           return npc;
        });
      }
      
      if (newState.npcAlbums) {
        newState.npcAlbums = newState.npcAlbums.map(album => {
           if (album.coverArt && album.coverArt.includes("ui-avatars.com")) {
               const newImage = NPC_ARTIST_IMAGES[album.artist] || newState.npcImages?.[album.artist];
               if (newImage) {
                   return { ...album, coverArt: newImage };
               }
           }
           return album;
        });
      }

      // We need to keep the rest of the object spreading intact.
      // Wait, let's just insert it after newState is initialized!`;

// Just find the block and inject it.
const injectionTarget = `      if (newState.artistsData) {
        for (const id in newState.artistsData) {`;

const injectionReplacement = `      if (newState.npcs) {
        newState.npcs = newState.npcs.map((npc: any) => {
           if (npc.coverArt && npc.coverArt.includes("ui-avatars.com")) {
               const newImage = NPC_ARTIST_IMAGES[npc.artist] || newState.npcImages?.[npc.artist];
               if (newImage) {
                   return { ...npc, coverArt: newImage };
               }
           }
           return npc;
        });
      }
      
      if (newState.npcAlbums) {
        newState.npcAlbums = newState.npcAlbums.map((album: any) => {
           if (album.coverArt && album.coverArt.includes("ui-avatars.com")) {
               const newImage = NPC_ARTIST_IMAGES[album.artist] || newState.npcImages?.[album.artist];
               if (newImage) {
                   return { ...album, coverArt: newImage };
               }
           }
           return album;
        });
      }

      if (newState.artistsData) {
        for (const id in newState.artistsData) {`;

content = content.replace(injectionTarget, injectionReplacement);

fs.writeFileSync('context/GameContext.tsx', content);
console.log('patched LOAD_GAME');
