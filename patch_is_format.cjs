const fs = require('fs');
let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const isFormatCompatible = \(genre: string, format: string\) => \{\n\s*const g = genre\.toLowerCase\(\);\n\s*const f = format\.toLowerCase\(\);/g;
const replacement = `const isFormatCompatible = (genre: string, format: string) => {
        const g = (genre || "").toLowerCase();
        const f = (format || "").toLowerCase();`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Fixed isFormatCompatible in GameContext');
