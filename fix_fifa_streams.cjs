const fs = require('fs');
let content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf-8');

content = content.replace(
    '        const updatedSongs = artistData.songs.map((song) => {\n          if (song.isReleased && !song.isTakenDown) {\n            let baseStreams = song.quality ** 2 * 50;',
    '        const updatedSongs = artistData.songs.map((song) => {\n          let effectivelyReleased = song.isReleased;\n          if (!effectivelyReleased && song.releaseDate && song.releaseDate.week === newDate.week && song.releaseDate.year === newDate.year) {\n            effectivelyReleased = true;\n          }\n          if (effectivelyReleased && !song.isTakenDown) {\n            let baseStreams = song.quality ** 2 * 50;'
);

content = content.replace(
    '              netRevenue:\n                (song.netRevenue ||\n                  Math.floor((song.streams || 0) / 150) *\n                    STREAM_INCOME_MULTIPLIER *\n                    playerCut) + generatedNet,\n            };\n          }\n          if (song.isTakenDown) {\n            return {\n              ...song,\n              prevWeekStreams: song.lastWeekStreams || 0,\n              lastWeekStreams: 0,\n              lastWeekRegionalStreams: { "US": 0, "Canada": 0, "UK": 0, "Latin America": 0, "Asia": 0, "Africa": 0 },\n            };\n          }\n          return song;\n        });',
    '              netRevenue:\n                (song.netRevenue ||\n                  Math.floor((song.streams || 0) / 150) *\n                    STREAM_INCOME_MULTIPLIER *\n                    playerCut) + generatedNet,\n              isReleased: effectivelyReleased,\n            };\n          }\n          if (song.isTakenDown) {\n            return {\n              ...song,\n              prevWeekStreams: song.lastWeekStreams || 0,\n              lastWeekStreams: 0,\n              lastWeekRegionalStreams: { "US": 0, "Canada": 0, "UK": 0, "Latin America": 0, "Asia": 0, "Africa": 0 },\n              isReleased: effectivelyReleased,\n            };\n          }\n          return effectivelyReleased !== song.isReleased ? { ...song, isReleased: effectivelyReleased } : song;\n        });'
);

fs.writeFileSync('/app/applet/context/GameContext.tsx', content);
console.log("Fixed fifa streams");
