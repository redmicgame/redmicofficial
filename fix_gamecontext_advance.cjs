const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

// Find the SIGN_CONTRACT block where advance is hardcoded
const blockMatch = /let advance = 0;\s*if \(label && !contract\.isCustom\) \{[\s\S]*?advance = 300000;\s*\}/m;
if (blockMatch.test(content)) {
    content = content.replace(blockMatch, 'const advance = contract.advance || 0;');
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log("Fixed GameContext.tsx");
} else {
    console.log("Could not find the block in GameContext.tsx");
}
