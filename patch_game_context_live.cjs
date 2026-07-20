const fs = require('fs');

const file_path = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file_path, 'utf8');

// Insert after RELEASE_PROJECT
const replaceStr = `    case "RELEASE_PROJECT": {`;
const insertStr = `    case "CREATE_LIVE_ALBUM": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      const { tourId, coverArt } = action.payload;
      const tour = activeData.tours.find(t => t.id === tourId);
      if (!tour) return state;

      const newSongs = [];
      const newSongIds = [];
      
      for (const originalSongId of tour.setlist) {
          const originalSong = activeData.songs.find(s => s.id === originalSongId);
          if (originalSong) {
              const liveSongId = crypto.randomUUID();
              newSongs.push({
                  ...originalSong,
                  id: liveSongId,
                  title: \`\${originalSong.title} (Live from \${tour.name})\`,
                  streams: 0,
                  lastWeekStreams: 0,
                  prevWeekStreams: 0,
                  isReleased: true,
                  releaseId: undefined,
                  sales: 0,
                  isAvailableOnStreaming: true,
                  coverArt: coverArt
              });
              newSongIds.push(liveSongId);
          }
      }

      const releaseId = crypto.randomUUID();
      const newRelease = {
          id: releaseId,
          title: \`\${tour.name} (Live)\`,
          type: "Album",
          coverArt: coverArt,
          songIds: newSongIds,
          releaseDate: state.date,
          artistId: state.activeArtistId,
          firstWeekStreams: 0,
          firstWeekSales: 0,
          weeksOnChart: 0,
          peakPosition: 0,
          isAvailableOnStreaming: true
      };

      for (const song of newSongs) {
          song.releaseId = releaseId;
      }

      return {
          ...state,
          artistsData: {
              ...state.artistsData,
              [state.activeArtistId]: {
                  ...activeData,
                  songs: [...activeData.songs, ...newSongs],
                  releases: [...activeData.releases, newRelease]
              }
          }
      };
    }
    case "RELEASE_PROJECT": {`;

content = content.replace(replaceStr, insertStr);

fs.writeFileSync(file_path, content);
console.log("Patched GameContext with CREATE_LIVE_ALBUM");
