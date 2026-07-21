const fs = require('fs');
let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /      \)\.map\(\(playlist\) => {\n        let playlistContenders = allContenders;/;
const replacement = `      ).map((playlist) => {
        let playlistContenders = allContenders.filter((c) => {
             const existingTrack = playlist.tracks.find(t => t.songId === c.uniqueId);
             if (existingTrack) {
                  const weeksInPlaylist = (newDate.year - existingTrack.addedDate.year) * 52 + (newDate.week - existingTrack.addedDate.week);
                  let maxWeeks = Infinity;
                  if (playlist.id === "newmusicfriday") maxWeeks = 1;
                  else if (playlist.id === "rapcaviar") maxWeeks = 10;
                  else if (playlist.id === "tth") maxWeeks = 10;
                  else if (playlist.id === "hiphopcentral") maxWeeks = 12;
                  else if (playlist.id === "rockclassics") maxWeeks = 10;
                  else if (playlist.id === "latin") maxWeeks = 10;
                  
                  if (weeksInPlaylist >= maxWeeks) return false;
             }
             return true;
        });`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Fixed playlists length');
