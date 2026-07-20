const fs = require('fs');
let content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf-8');

content = content.replace(
    '          return {\n            ...song,\n            isReleased: true,\n            soundtrackTitle: albumTitle,\n            releaseId: newRelease.id,\n          };\n        }\n        return song;\n      });',
    '          return {\n            ...song,\n            isReleased: true,\n            isAvailableOnStreaming: true,\n            soundtrackTitle: albumTitle,\n            releaseId: newRelease.id,\n          };\n        }\n        return song;\n      });'
);

fs.writeFileSync('/app/applet/context/GameContext.tsx', content);
console.log("Fixed soundtrack streaming");
