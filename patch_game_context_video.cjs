const fs = require('fs');

const file_path = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file_path, 'utf8');

// Wait, where should I put this check? During week advance!
const replaceStr = `          const updatedSoundtracks = [...artistData.offeredSoundtracks];`;
const insertStr = `          artistData.videos = artistData.videos.map(v => {
              if (v.isScheduled) {
                  if (newDate.year > v.releaseDate.year || (newDate.year === v.releaseDate.year && newDate.week >= v.releaseDate.week)) {
                      return { ...v, isScheduled: false };
                  }
              }
              return v;
          });
          
          const updatedSoundtracks = [...artistData.offeredSoundtracks];`;

content = content.replace(replaceStr, insertStr);

fs.writeFileSync(file_path, content);
console.log("Patched GameContext videos");
