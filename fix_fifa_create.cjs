const fs = require('fs');
let content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf-8');

content = content.replace(
    '        isPromoted: false,\n        isPerformance: false,\n        isCollab: true,\n        coverArt: coverArt\n      };',
    '        isPromoted: false,\n        isPerformance: false,\n        isCollab: true,\n        coverArt: coverArt,\n        isAvailableOnStreaming: true\n      };'
);

content = content.replace(
    '        wikipediaSummary: `"${title}" is the official single from the FIFA World Cup ${state.date.year} Soundtrack, performed by ${state.soloArtist?.name || state.group?.name} alongside ${collabs.join(", ")} and FIFA Sound. Released ahead of the tournament, it serves as an anthem for football fans globally.`,\n        certifications: [],\n      };',
    '        wikipediaSummary: `"${title}" is the official single from the FIFA World Cup ${state.date.year} Soundtrack, performed by ${state.soloArtist?.name || state.group?.name} alongside ${collabs.join(", ")} and FIFA Sound. Released ahead of the tournament, it serves as an anthem for football fans globally.`,\n        certifications: [],\n        isAvailableOnStreaming: true\n      };'
);

fs.writeFileSync('/app/applet/context/GameContext.tsx', content);
console.log("Fixed fifa create");
