const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');
const regex = /        \}\n\n      return \{/g;
let match;
while ((match = regex.exec(content)) !== null) {
    const linesBefore = content.substring(0, match.index).split('\n').length;
    console.log("Match around line:", linesBefore);
}
