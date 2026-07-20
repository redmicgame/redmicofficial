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
  
  // Revert coverArt logic
  content = content.replace(/coverArt=\{NPC_ARTIST_IMAGES\[song\.artist\] \|\| song\.coverArt\}/g, 'coverArt={song.coverArt}');
  content = content.replace(/coverArt=\{NPC_ARTIST_IMAGES\[album\.artist\] \|\| album\.coverArt\}/g, 'coverArt={album.coverArt}');
  content = content.replace(/coverArt=\{NPC_ARTIST_IMAGES\[entry\.artist\] \|\| entry\.coverArt\}/g, 'coverArt={entry.coverArt}');
  content = content.replace(/coverArt=\{NPC_ARTIST_IMAGES\[album\.artistName \|\| album\.artist\] \|\| album\.coverArt\}/g, 'coverArt={album.coverArt}');
  
  // Remove import
  content = content.replace(/import \{ NPC_ARTIST_IMAGES \}.*\n/g, '');
  content = content.replace(/import \{ NPC_ARTIST_IMAGES, /g, 'import { ');
  
  fs.writeFileSync(file, content);
  console.log('Fixed ' + file);
}
