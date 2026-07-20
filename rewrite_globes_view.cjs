const fs = require('fs');
let content = fs.readFileSync('components/GoldenGlobesView.tsx', 'utf-8');

content = content.replace(/OscarsView/g, 'GoldenGlobesView');
content = content.replace(/oscarHistory/g, 'goldenGlobeHistory');
content = content.replace(/oscarBanner/g, 'goldenGlobeBanner');
content = content.replace(/UPDATE_OSCAR_BANNER/g, 'UPDATE_GOLDEN_GLOBE_BANNER');
content = content.replace(/Academy Awards/g, 'Golden Globe Awards');
content = content.replace(/Academy of Motion Picture Arts and Sciences/g, 'Hollywood Foreign Press Association');
content = content.replace(/OscarAwardIcon/g, 'GrammyAwardIcon'); // reuse trophy icon

// Replace the Oscars background default image
content = content.replace(/https:\/\/i.imgur.com\/cRzR11T.jpg/g, 'https://images.unsplash.com/photo-1571597327376-74fcce5323be?q=80&w=1000&auto=format&fit=crop');

fs.writeFileSync('components/GoldenGlobesView.tsx', content);
console.log('Rewrote GoldenGlobesView');
