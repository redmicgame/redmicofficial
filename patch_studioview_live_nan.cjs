const fs = require('fs');
let file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /song\.quality = Math\.min\(100, Math\.max\(1, song\.quality \+ Math\.floor\(qualityBonus \/ 2\)\)\);/g;
const replacement = `song.quality = Math.min(100, Math.max(1, (song.quality || 50) + Math.floor(qualityBonus / 2)));`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Patched live album NaN bug in StudioView');
