const fs = require('fs');

const files = [
  'components/ChartsTab.tsx',
  'components/SpotifyChartView.tsx',
  'components/UKChartView.tsx',
  'components/CountryChartView.tsx',
  'components/ElectronicChartView.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf-8');
  if (!content.includes('NPC_ARTIST_IMAGES')) {
     if (content.includes('import {')) {
        content = content.replace('import {', 'import { NPC_ARTIST_IMAGES,');
     } else {
        content = 'import { NPC_ARTIST_IMAGES } from "../constants";\n' + content;
     }
  }
  
  // ChartItemPreview takes coverArt
  // Replace <ChartItemPreview ... coverArt={song.coverArt} with coverArt={NPC_ARTIST_IMAGES[song.artist] || song.coverArt}
  content = content.replace(/coverArt=\{song\.coverArt\}/g, 'coverArt={NPC_ARTIST_IMAGES[song.artist] || song.coverArt}');
  content = content.replace(/coverArt=\{album\.coverArt\}/g, 'coverArt={NPC_ARTIST_IMAGES[album.artist] || album.coverArt}');
  
  fs.writeFileSync(file, content);
  console.log('Patched ' + file);
}
