const fs = require('fs');
let content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf8');

const target = `      // Add Player Videos
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
      }`;

const replacement = `      // Add Player Videos
      Object.values(updatedArtistsData).forEach(aData => {
        if (!aData || !aData.videos) return;
        const playerMusicVideos = aData.videos.filter(v => v.isOnSpotify && v.type === 'Music Video');
        playerMusicVideos.forEach(v => {
          const song = aData.songs.find(s => s.id === v.songId);
          const weeklyViews = v.spotifyDailyViews?.length ? v.spotifyDailyViews[v.spotifyDailyViews.length - 1] * 7 : 0;
          if (weeklyViews > 0) {
            allVideoContenders.push({
              title: v.title,
              artist: aData.name || "Unknown Artist",
              thumbnail: v.thumbnail,
              isPlayerVideo: true,
              videoId: v.id,
              uniqueId: v.id,
              weeklyViews: weeklyViews
            });
          }
        });
      });`;

content = content.replace(target, replacement);

fs.writeFileSync('/app/applet/context/GameContext.tsx', content);
console.log("Fixed activeData reference");
