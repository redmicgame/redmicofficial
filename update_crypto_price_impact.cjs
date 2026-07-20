const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

content = content.replace(
    /const priceIncreaseMultiplier = 1 \+ \(percentBought \* 5\);/g,
    'const priceIncreaseMultiplier = 1 + (percentBought * 50);'
);

content = content.replace(
    /const priceDecreaseMultiplier = 1 - \(percentSold \* 5\);/g,
    'const priceDecreaseMultiplier = 1 - (percentSold * 50);'
);

fs.writeFileSync('context/GameContext.tsx', content);
console.log('Updated crypto price impact.');
