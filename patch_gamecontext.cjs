const fs = require('fs');
const file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(baseSong\.features && baseSong\.features\.length > 0\) \{[\s\S]*?\} else if \(baseSong\.isFeatureToNpc && baseSong\.npcArtistName\)/;

const replacement = `if (baseSong.features && baseSong.features.length > 0) {
          displayArtist = \`\${displayArtist}, \${baseSong.features.join(", ")}\`;
          displayTitle = displayTitle.replace(/ \\(feat\\\. [^)]+\\)/g, '');
        } else if (baseSong.collaboration) {
          displayArtist = \`\${displayArtist}, \${baseSong.collaboration.artistName}\`;
          displayTitle = displayTitle.replace(
            new RegExp(
              \`\\\\s*\\\\(feat\\\\.\\\\s*\${escapeRegExp(baseSong.collaboration.artistName)}\\\\)\`,
              "i",
            ),
            "",
          );
        } else if (baseSong.isFeatureToNpc && baseSong.npcArtistName)`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
