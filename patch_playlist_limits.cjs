const fs = require('fs');
let content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf8');

const target = `        let playlistContenders = allContenders.filter((c) => {
             const existingTrack = playlist.tracks.find(t => t.songId === c.uniqueId);
             if (existingTrack && existingTrack.addedDate) {
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

const replacement = `        let playlistContenders = allContenders.filter((c) => {
             const existingTrack = playlist.tracks.find(t => t.songId === c.uniqueId);
             if (existingTrack && existingTrack.addedDate) {
                  const weeksInPlaylist = (newDate.year - existingTrack.addedDate.year) * 52 + (newDate.week - existingTrack.addedDate.week);
                  
                  const limits: Record<string, number> = {
                      "tth": 12,
                      "global50": Infinity,
                      "rapcaviar": 14,
                      "latin": 14,
                      "megahit": 16,
                      "rockclassics": 16,
                      "bailareggaeton": 16,
                      "singcar": 18,
                      "allout00s": 18,
                      "beastmode": 20,
                      "hiphopcentral": 20,
                      "throwback": 20,
                      "pophits": 22,
                      "hotcountry": 22,
                      "allout90s": 22,
                      "getturnt": 24,
                      "mint": 24,
                      "rnb": 24,
                      "workout": 24,
                      "chillhits": 24,
                      "moodbooster": 26,
                      "rockthis": 26,
                      "kpop": 26,
                      "christmas": 26,
                      "teenparty": 28,
                      "newmusicfriday": 28,
                      "danceparty": 28,
                      "bighit": 28,
                      "goodvibes": 28,
                      "justhits": 30,
                      "essentialindie": 30,
                      "poprising": 32,
                      "chilledrnb": 32,
                      "viralhits": 32,
                      "afrobeats": 34,
                      "countrycoffeehouse": 36,
                      "viral50": 36,
                      "indie": 36,
                      "coffeetable": 40,
                      "reggae": 40
                  };
                  
                  let maxWeeks = limits[playlist.id] !== undefined ? limits[playlist.id] : Infinity;
                  
                  if (weeksInPlaylist >= maxWeeks) return false;
             }
             return true;
        });`;

content = content.replace(target, replacement);
fs.writeFileSync('/app/applet/context/GameContext.tsx', content);
console.log("Success");
