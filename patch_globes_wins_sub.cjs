const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const targetStr = `              const content = \`Hollywood Foreign Press Association 🌍

Congrats \${category.name} winner - '\${winner.name}' @\${winner.artistName.replace(/\\s/g, "")} #GoldenGlobes\`;`;

const replaceStr = "              const content = `Congratulations ${winner.artistName} for WINNING ${category.name} win! 🏆 #GoldenGlobes`;";

if (content.includes('Hollywood Foreign Press Association 🌍')) {
    content = content.replace(targetStr, replaceStr);
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log("Patched WINNING");
}
