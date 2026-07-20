const fs = require('fs');

const files = [
  'components/CountryChartView.tsx',
  'components/AlbumSalesChartView.tsx',
  'components/ChartsTab.tsx',
  'components/ManageLabelView.tsx',
  'components/UKChartView.tsx',
  'components/ElectronicChartView.tsx',
  'components/ChartHistoryView.tsx',
  'components/SpotifyChartView.tsx',
  'components/ChartPredictionsView.tsx',
  'components/SpotifyNowPlayingView.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf-8');
  
  if (content.includes('import { NPC_ARTIST_IMAGES,')) {
      content = content.replace('import { NPC_ARTIST_IMAGES,', 'import {');
  } else if (content.includes('import { NPC_ARTIST_IMAGES } from "../context/GameContext";')) {
      content = content.replace('import { NPC_ARTIST_IMAGES } from "../context/GameContext";', '');
  }
  
  if (!content.includes('from "../constants"')) {
      content = 'import { NPC_ARTIST_IMAGES } from "../constants";\n' + content;
  }
  
  fs.writeFileSync(file, content);
  console.log('Fixed ' + file);
}
