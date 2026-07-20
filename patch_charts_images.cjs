const fs = require('fs');

const files = [
  'components/ChartsTab.tsx',
  'components/SpotifyChartView.tsx',
  'components/UKChartView.tsx',
  'components/CountryChartView.tsx',
  'components/ElectronicChartView.tsx',
  'components/AlbumSalesChartView.tsx',
  'components/ChartHistoryView.tsx',
  'components/ChartPredictionsView.tsx'
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

  // Replace coverArt prop with baseArtist check
  content = content.replace(/coverArt=\{song\.coverArt\}/g, 'coverArt={NPC_ARTIST_IMAGES[song.artist.split(",")[0].trim()] || song.coverArt}');
  content = content.replace(/coverArt=\{album\.coverArt\}/g, 'coverArt={NPC_ARTIST_IMAGES[(album.artistName || album.artist).split(",")[0].trim()] || album.coverArt}');
  content = content.replace(/coverArt=\{entry\.coverArt\}/g, 'coverArt={NPC_ARTIST_IMAGES[entry.artist.split(",")[0].trim()] || entry.coverArt}');
  
  fs.writeFileSync(file, content);
  console.log('Fixed coverArt in ' + file);
}
