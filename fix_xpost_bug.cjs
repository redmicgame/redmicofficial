const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const regexToRemove = /\s*if \(updatedData\.cryptoCoin && postContent\.includes\("\\\$" \+ updatedData\.cryptoCoin\.ticker\)\) \{\n\s*updatedData\.cryptoCoin = \{\n\s*\.\.\.updatedData\.cryptoCoin,\n\s*reputation: \{\n\s*\.\.\.updatedData\.cryptoCoin\.reputation,\n\s*hype: Math\.min\(100, updatedData\.cryptoCoin\.reputation\.hype \+ 10\)\n\s*\},\n\s*currentPrice: updatedData\.cryptoCoin\.currentPrice \* 1\.05\n\s*\};\n\s*\}/;

let occurrences = 0;
content = content.replace(regexToRemove, (match) => {
    occurrences++;
    if (occurrences === 1) {
        return ""; // Only remove the first one, which is around 13183
    }
    return match;
});

fs.writeFileSync('context/GameContext.tsx', content);
console.log('Fixed xpost bug! Occurrences removed: ' + (occurrences > 0 ? 1 : 0));
