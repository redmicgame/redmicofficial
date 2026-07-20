const fs = require('fs');

let gameContext = fs.readFileSync('context/GameContext.tsx', 'utf-8');

gameContext = gameContext.replace(
    /if \(gig\) \{\s*score = artistData\.popularity \+ \(gig\.basePay \/ 10000\);\s*coverArt = gig\.imageUrl;\s*\}/g,
    'if (role) { score = artistData.popularity + ((role.rating || 50) * 2); coverArt = role.coverUrl; }'
).replace(
    /if \(gig\) \{\s*score = artistData\.popularity \+ \(gig\.basePay \/ 5000\);\s*coverArt = gig\.imageUrl;\s*\}/g,
    'if (role) { score = artistData.popularity + ((role.rating || 50) * 3); coverArt = role.coverUrl; }'
).replace(
    /const gig = artistData\.actingRoles\.find\(g => g\.id === sub\.itemId\);/g,
    'const role = artistData.actingRoles.find(g => g.id === sub.itemId);'
);

fs.writeFileSync('context/GameContext.tsx', gameContext);
console.log('Fixed actingRoles score in GameContext');

