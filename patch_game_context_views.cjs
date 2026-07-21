const fs = require('fs');
const content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf8');

const target = `          totalWeeklyViews += weeklyViews;
          return {
            ...video,
            views: video.views + weeklyViews,
            ...firstWeekViewsData,
          };`;

const replacement = `          totalWeeklyViews += weeklyViews;
          
          let spotifyViewsData = {};
          if (video.isOnSpotify) {
            const spotifyWeeklyViews = Math.floor(weeklyViews * 0.8);
            const currentSpotifyDaily = video.spotifyDailyViews || [];
            const newSpotifyDailyViews = [
              ...currentSpotifyDaily.slice(-6),
              Math.floor(spotifyWeeklyViews / 7)
            ];
            
            spotifyViewsData = {
              spotifyViews: (video.spotifyViews || 0) + spotifyWeeklyViews,
              spotifyDailyViews: newSpotifyDailyViews
            };
          }
          
          return {
            ...video,
            views: video.views + weeklyViews,
            ...firstWeekViewsData,
            ...spotifyViewsData,
          };`;

const newContent = content.replace(target, replacement);
fs.writeFileSync('/app/applet/context/GameContext.tsx', newContent);
console.log("Updated GameContext.tsx views");
