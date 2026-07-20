const fs = require('fs');

let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

// For wins:
content = content.replace(
    /const content = \`Hollywood Foreign Press Association 🌍\\n\\nCongrats \$\{category\.name\} winner - '\$\{winner\.name\}' @\$\{winner\.artistName\.replace\(\/\\s\/g, ""\)\} #GoldenGlobes\`;/g,
    'const content = `Congratulations ${winner.artistName} for WINNING ${category.name} win! 🏆 #GoldenGlobes`;'
);

content = content.replace(/authorId: "popbase",\s*content,\s*image: winner\.coverArt/g, 'authorId: "golden_globes",\\n                  content,\\n                  image: winner.coverArt');

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Patched Golden Globes wins");
