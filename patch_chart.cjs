const fs = require('fs');
let file = '/app/applet/components/ChartPredictionsView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const g = genre\.toLowerCase\(\);/g, 'const g = (genre || "").toLowerCase();');
fs.writeFileSync(file, content);
console.log('Fixed genre in ChartPredictionsView');
