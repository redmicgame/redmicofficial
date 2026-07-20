const fs = require('fs');
let content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf-8');

content = content.replace(
    '        if (baseSong.collaboration) {\n          displayArtist = `${displayArtist}, ${baseSong.collaboration.artistName}`;\n          displayTitle = displayTitle.replace(\n            new RegExp(\n              `\\\\s*\\\\(feat\\\\.\\\\s*${escapeRegExp(baseSong.collaboration.artistName)}\\\\)`,\n              "i",\n            ),\n            "",\n          );\n        } else if (baseSong.isFeatureToNpc && baseSong.npcArtistName) {\n          displayArtist = `${baseSong.npcArtistName}, ${artist?.name}`;\n          displayTitle = displayTitle.replace(\n            new RegExp(\n              `\\\\s*\\\\(feat\\\\.\\\\s*${escapeRegExp(artist?.name || "")}\\\\)`,\n              "i",\n            ),\n            "",\n          );\n        }',
    '        if (baseSong.features && baseSong.features.length > 0) {\n          displayArtist = `${displayArtist}, ${baseSong.features.join(", ")}`;\n        } else if (baseSong.collaboration) {\n          displayArtist = `${displayArtist}, ${baseSong.collaboration.artistName}`;\n          displayTitle = displayTitle.replace(\n            new RegExp(\n              `\\\\s*\\\\(feat\\\\.\\\\s*${escapeRegExp(baseSong.collaboration.artistName)}\\\\)`,\n              "i",\n            ),\n            "",\n          );\n        } else if (baseSong.isFeatureToNpc && baseSong.npcArtistName) {\n          displayArtist = `${baseSong.npcArtistName}, ${artist?.name}`;\n          displayTitle = displayTitle.replace(\n            new RegExp(\n              `\\\\s*\\\\(feat\\\\.\\\\s*${escapeRegExp(artist?.name || "")}\\\\)`,\n              "i",\n            ),\n            "",\n          );\n        }'
);

fs.writeFileSync('/app/applet/context/GameContext.tsx', content);
console.log("Fixed charts features rendering");
