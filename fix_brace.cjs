const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

content = content.replace(
    /        \}\n      \}\n\n      return \{/g,
    `        }\n\n      return {`
);

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Fixed brace");
