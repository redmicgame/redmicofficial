const fs = require('fs');

let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

// The first replacement
const firstPatch = `      if (newState.npcs) {
        newState.npcs = newState.npcs.map((npc: any) => {
           if (npc.coverArt && npc.coverArt.includes("ui-avatars.com")) {
               const baseArtist = npc.artist.split(',')[0].trim();
               const newImage = NPC_ARTIST_IMAGES[baseArtist] || newState.npcImages?.[baseArtist];
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
               const baseArtist = album.artist.split(',')[0].trim();
               const newImage = NPC_ARTIST_IMAGES[baseArtist] || newState.npcImages?.[baseArtist];
               if (newImage) {
                   return { ...album, coverArt: newImage };
               }
           }
           return album;
        });
      }`;

const firstTarget = /if \(newState\.npcs\) \{\s*newState\.npcs = newState\.npcs\.map\(\(npc: any\) => \{\s*if \(npc\.coverArt && npc\.coverArt\.includes\("ui-avatars\.com"\)\) \{\s*const newImage = NPC_ARTIST_IMAGES\[npc\.artist\] \|\| newState\.npcImages\?\.\[npc\.artist\];\s*if \(newImage\) \{\s*return \{ \.\.\.npc, coverArt: newImage \};\s*\}\s*\}\s*return npc;\s*\}\);\s*\}\s*if \(newState\.npcAlbums\) \{\s*newState\.npcAlbums = newState\.npcAlbums\.map\(\(album: any\) => \{\s*if \(album\.coverArt && album\.coverArt\.includes\("ui-avatars\.com"\)\) \{\s*const newImage = NPC_ARTIST_IMAGES\[album\.artist\] \|\| newState\.npcImages\?\.\[album\.artist\];\s*if \(newImage\) \{\s*return \{ \.\.\.album, coverArt: newImage \};\s*\}\s*\}\s*return album;\s*\}\);\s*\}/;

content = content.replace(firstTarget, firstPatch);

// Second replacement
const secondTarget = /if \(newState\.npcs\) \{\s*\/\/ track used names to avoid dupes across artists if needed, here just locally\s*const trackCounts: Record<string, number> = \{\};\s*newState\.npcs\.forEach\(\(npc\) => \{\s*const realDisco = REAL_WORLD_DISCOGRAPHIES\[npc\.artist\];\s*if \(realDisco && realDisco\.songs && realDisco\.songs\.length > 0\) \{\s*const artistSongsList = realDisco\.songs;\s*const count = trackCounts\[npc\.artist\] \|\| 0;\s*if \(count < artistSongsList\.length\) \{\s*if \(!artistSongsList\.includes\(npc\.title\)\) \{\s*npc\.title = artistSongsList\[count\];\s*\}\s*\}\s*trackCounts\[npc\.artist\] = count \+ 1;\s*\}\s*if \(NPC_ARTIST_IMAGES\[npc\.artist\]\) \{\s*npc\.coverArt = NPC_ARTIST_IMAGES\[npc\.artist\];\s*\}\s*\}\);\s*\}\s*if \(newState\.npcAlbums\) \{\s*newState\.npcAlbums\.forEach\(\(album\) => \{\s*if \(NPC_ARTIST_IMAGES\[album\.artist\]\) \{\s*album\.coverArt = NPC_ARTIST_IMAGES\[album\.artist\];\s*\}\s*\}\);\s*\}/;

const secondPatch = `      if (newState.npcs) {
        const trackCounts: Record<string, number> = {};
        newState.npcs.forEach((npc) => {
          const baseArtist = npc.artist.split(',')[0].trim();
          const realDisco = REAL_WORLD_DISCOGRAPHIES[baseArtist];
          if (realDisco && realDisco.songs && realDisco.songs.length > 0) {
            const artistSongsList = realDisco.songs;
            const count = trackCounts[baseArtist] || 0;
            if (count < artistSongsList.length) {
              if (!artistSongsList.includes(npc.title)) {
                npc.title = artistSongsList[count];
              }
            }
            trackCounts[baseArtist] = count + 1;
          }
          if (NPC_ARTIST_IMAGES[baseArtist]) {
            npc.coverArt = NPC_ARTIST_IMAGES[baseArtist];
          }
        });
      }
      if (newState.npcAlbums) {
        newState.npcAlbums.forEach((album) => {
          const baseArtist = album.artist.split(',')[0].trim();
          if (NPC_ARTIST_IMAGES[baseArtist]) {
            album.coverArt = NPC_ARTIST_IMAGES[baseArtist];
          }
        });
      }`;

content = content.replace(secondTarget, secondPatch);

fs.writeFileSync('context/GameContext.tsx', content);
console.log('patched LOAD_GAME artists logic');
