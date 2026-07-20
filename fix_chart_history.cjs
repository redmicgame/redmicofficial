const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/ChartHistoryView.tsx', 'utf-8');

content = content.replace(
    '                    if (song.collaboration?.artistName === activeArtist.name) {\n                        items.push({ ...song, title: `${song.title} (with ${song.collaboration.artistName})` });\n                    }',
    '                    if (song.collaboration?.artistName === activeArtist.name) {\n                        items.push({ ...song, title: `${song.title} (with ${song.collaboration.artistName})` });\n                    } else if (song.features && song.features.includes(activeArtist.name)) {\n                        items.push({ ...song, title: `${song.title} (with ${activeArtist.name})` });\n                    }'
);

fs.writeFileSync('/app/applet/components/ChartHistoryView.tsx', content);
console.log("Fixed chart history view");
