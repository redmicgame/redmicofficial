const fs = require('fs');
let content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf-8');

content = content.replace(
    '      const collabs = state.activeFifaOffer?.collabs || [];\n      \n      // Schedule single for week 23\n      const songId = crypto.randomUUID();\n      const newSong = {\n        id: songId,\n        title: title,',
    '      const collabs = state.activeFifaOffer?.collabs || [];\n      const finalTitle = `${title} (FIFA World Cup ${state.date.year}™)`;\n      // Schedule single for week 23\n      const songId = crypto.randomUUID();\n      const newSong = {\n        id: songId,\n        title: finalTitle,'
);

content = content.replace(
    '      const newRelease = {\n        id: crypto.randomUUID(),\n        title: title,',
    '      const newRelease = {\n        id: crypto.randomUUID(),\n        title: finalTitle,'
);

content = content.replace(
    '        fifaSingleScheduled: { week: 23, year: state.date.year, title, coverArt, collabs },',
    '        fifaSingleScheduled: { week: 23, year: state.date.year, title: finalTitle, coverArt, collabs },'
);

fs.writeFileSync('/app/applet/context/GameContext.tsx', content);
console.log("Fixed fifa title");
