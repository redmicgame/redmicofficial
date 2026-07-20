const fs = require('fs');

const file_path = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file_path, 'utf8');

const replaceStr = `        const updatedVideos = artistData.videos.map((video) => {
          const song = updatedSongs.find((s) => s.id === video.songId);
          if (!song) return video;`;
          
const insertStr = `        const updatedVideos = artistData.videos.map((video) => {
          if (video.isScheduled) return video;
          const song = updatedSongs.find((s) => s.id === video.songId);
          if (!song) return video;`;

content = content.replace(replaceStr, insertStr);

fs.writeFileSync(file_path, content);
console.log("Patched GameContext videos views calculation");
