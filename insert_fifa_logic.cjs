const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const fifaLogic = `
         // --- FIFA WORLD CUP ALBUM RELEASE ---
         let updatedSoundtrackAlbums = [...state.soundtrackAlbums];
         let newFifaScheduled = state.fifaSingleScheduled;
         if (state.fifaSingleScheduled && newDate.week === 25 && newDate.year === state.fifaSingleScheduled.year) {
             const { title, coverArt, collabs } = state.fifaSingleScheduled;
             
             const playerTracks = [{
                isPlayerSong: true,
                songId: crypto.randomUUID(), 
                title: title,
                artist: (state.soloArtist?.name || state.group?.name || "Artist") + ", " + collabs.join(", ") + ", FIFA Sound",
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
             
             updatedSoundtrackAlbums.push({
                id: crypto.randomUUID(),
                title: \`Official FIFA World Cup \${newDate.year} Soundtrack\`,
                coverArt: coverArt,
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
    /      \/\/ Update podcast offers expiration\n      if \(isWeeklyUpdate\) \{/,
    fifaLogic + '\n      // Update podcast offers expiration\n      if (isWeeklyUpdate) {'
);

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Inserted FIFA release logic");
