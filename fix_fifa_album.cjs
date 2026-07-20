const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const releaseLogic = `
      // --- FIFA WORLD CUP ALBUM RELEASE ---
      let newSoundtrackAlbums = [...state.soundtrackAlbums];
      let newFifaScheduled = state.fifaSingleScheduled;
      if (state.fifaSingleScheduled && newDate.week === 25 && newDate.year === state.fifaSingleScheduled.year) {
         const { title, coverArt, collabs } = state.fifaSingleScheduled;
         
         const playerArtist = allPlayerArtistsAndGroups.find(
            (a) => a.id === state.activeArtistId,
         );
         
         const playerTracks = [{
            isPlayerSong: true,
            songId: crypto.randomUUID(), // Just for soundtrack tracking
            title: title,
            artist: (playerArtist?.name || "Artist") + ", " + collabs.join(", ") + ", FIFA Sound",
            streams: 0,
            lastWeekStreams: 0,
            prevWeekStreams: 0,
            duration: 180 + Math.floor(Math.random() * 60),
            explicit: false
         }];
         
         const npcTracks = state.npcs
            .slice(0, 10)
            .map((npc) => ({
              isPlayerSong: false,
              songId: npc.uniqueId,
              title: [
                  "Goals", "Game Time", "Illuminate", "Victory", "Champion", 
                  "Rise Up", "The World is Yours", "We Are One", "Glory", "Unstoppable"
              ][Math.floor(Math.random() * 10)],
              artist: npc.artist + ", FIFA Sound",
              streams: 0,
              lastWeekStreams: 0,
              prevWeekStreams: 0,
              duration: 180 + Math.floor(Math.random() * 60),
              explicit: false,
            }));
            
         const allTracks = [...playerTracks, ...npcTracks].sort(
            () => Math.random() - 0.5,
         );
         
         newSoundtrackAlbums.push({
            id: crypto.randomUUID(),
            title: \`Official FIFA World Cup \${newDate.year} Soundtrack\`,
            coverArt: coverArt, // Usually they have their own, but we can use the single's cover art or a default
            releaseDate: newDate,
            tracks: allTracks,
            firstWeekStreams: 0,
            weeksOnChart: 0,
            peakPosition: 0,
         });
         
         newFifaScheduled = undefined;
      }
`;

content = content.replace(
    /let newSoundtrackAlbums = \[\.\.\.state\.soundtrackAlbums\];/,
    releaseLogic
);

// We need to also make sure newSoundtrackAlbums actually overrides soundtrackAlbums
content = content.replace(
    /soundtrackAlbums: newSoundtrackAlbums,/,
    'soundtrackAlbums: newSoundtrackAlbums,\n        fifaSingleScheduled: newFifaScheduled,'
);

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Added FIFA album release logic");
