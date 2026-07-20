const fs = require('fs');
let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const g = song\.genre\.toLowerCase\(\);/g, 'const g = (song.genre || "").toLowerCase();');
content = content.replace(/isFormatCompatible\(song\.genre,/g, 'isFormatCompatible(song.genre || "",');
fs.writeFileSync(file, content);
console.log('Fixed genre.toLowerCase() in GameContext');
