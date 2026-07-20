const fs = require('fs');

let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `        const weeklySales = Math.floor(
          (album.salesPotential || 1000) * variance * eraSalesBoost,
        );`;
        
const replacement = `        const weeklySales = Math.floor(
          (album.salesPotential || 1000) * variance * eraSalesBoost * 0.55,
        );`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log("Patched NPC album sales");
