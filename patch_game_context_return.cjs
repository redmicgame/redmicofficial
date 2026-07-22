const fs = require('fs');
let content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf8');

content = content.replace(/spotifyGlobal: newSpotifyGlobal,/g, 'spotifyGlobal: newSpotifyGlobal,\n          spotifyGlobalMusicVideos: newSpotifyGlobalMusicVideos,\n          videoChartHistory: newVideoChartHistory,');

fs.writeFileSync('/app/applet/context/GameContext.tsx', content);
console.log("Updated GameContext state return");
