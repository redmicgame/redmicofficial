const fs = require('fs');
const content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf8');

const target = `      const newSpotifyAfrica = generateSpotifyChart("Africa", (state as any).spotifyAfrica || []);`;

const replacement = `      const newSpotifyAfrica = generateSpotifyChart("Africa", (state as any).spotifyAfrica || []);

      // --- SPOTIFY GLOBAL MUSIC VIDEOS ---
      let newSpotifyGlobalMusicVideos = [];
      let newVideoChartHistory = { ...state.videoChartHistory };
      
      const allVideoContenders = [];
      
      // Add Player Videos
      if (activeData) {
        const playerMusicVideos = activeData.videos.filter(v => v.isOnSpotify && v.type === 'Music Video');
        playerMusicVideos.forEach(v => {
          const song = activeData.songs.find(s => s.id === v.songId);
          const weeklyViews = v.spotifyDailyViews?.length ? v.spotifyDailyViews[v.spotifyDailyViews.length - 1] * 7 : 0;
          if (weeklyViews > 0) {
            allVideoContenders.push({
              title: v.title,
              artist: activeData.name || "Unknown Artist",
              thumbnail: v.thumbnail,
              isPlayerVideo: true,
              videoId: v.id,
              uniqueId: v.id,
              weeklyViews: weeklyViews
            });
          }
        });
      }
      
      // Add NPC Videos (simulate from Top 100 Global songs)
      const topGlobalSongs = [...allContenders].sort((a, b) => b.weeklyStreams - a.weeklyStreams).slice(0, 100);
      topGlobalSongs.forEach((song, index) => {
        if (!song.isPlayerSong) {
          // Fake some music video views based on their streams
          // Top #1 should be ~ 5M views. If #1 stream is ~ 40M, 40M * 0.125 = 5M
          // Let's use a non-linear scaling so #30 is ~300k
          
          let baseMultiplier = 0.125 * (Math.pow(0.92, index));
          const fakeViews = Math.floor(song.weeklyStreams * baseMultiplier);
          
          if (fakeViews > 5000) {
            allVideoContenders.push({
              title: song.title,
              artist: song.artist,
              thumbnail: song.coverArt, // reuse cover art as thumbnail
              isPlayerVideo: false,
              uniqueId: 'vid_' + song.uniqueId,
              weeklyViews: fakeViews
            });
          }
        }
      });
      
      allVideoContenders.sort((a, b) => b.weeklyViews - a.weeklyViews);
      const top50Videos = allVideoContenders.slice(0, 50);
      
      const prevVideoChartMap = new Map((state.spotifyGlobalMusicVideos || []).map(entry => [entry.uniqueId, entry.rank]));
      
      top50Videos.forEach((vid, index) => {
        const rank = index + 1;
        const lastWeekRank = prevVideoChartMap.get(vid.uniqueId) ?? null;
        
        const peak = newVideoChartHistory[vid.uniqueId]?.peak ?? rank;
        const weeksOnChart = newVideoChartHistory[vid.uniqueId]?.weeksOnChart ?? 1;
        
        newSpotifyGlobalMusicVideos.push({
          rank,
          lastWeek: lastWeekRank,
          peak: Math.min(peak, rank),
          weeksOnChart: lastWeekRank === null ? 1 : weeksOnChart + 1,
          title: vid.title,
          artist: vid.artist,
          thumbnail: vid.thumbnail,
          isPlayerVideo: vid.isPlayerVideo,
          videoId: vid.videoId,
          uniqueId: vid.uniqueId,
          weeklyViews: vid.weeklyViews,
        });
        
        newVideoChartHistory[vid.uniqueId] = {
          peak: Math.min(peak, rank),
          weeksOnChart: lastWeekRank === null ? 1 : weeksOnChart + 1,
          chartRun: [...(newVideoChartHistory[vid.uniqueId]?.chartRun || []), rank],
        };
      });
`;

const newContent = content.replace(target, replacement);
fs.writeFileSync('/app/applet/context/GameContext.tsx', newContent);
console.log("Updated GameContext for newSpotifyGlobalMusicVideos");
