const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const oscarMatch = /The Oscar for Best Original Song goes to[\s\S]*?authorId: "golden_globes",\s*content,\s*image: winner\.coverArt,/;
const oscarReplace = 'The Oscar for Best Original Song goes to... "${winner.name}" by ${winner.artistName}! #Oscars`;\\n' +
'          Object.values(updatedArtistsData).forEach((d) =>\\n' +
'            d.xPosts.unshift({\\n' +
'              id: crypto.randomUUID(),\\n' +
'              authorId: "popbase",\\n' +
'              content,\\n' +
'              image: winner.coverArt,';

content = content.replace(oscarMatch, oscarReplace);

const grammyMatch = /Recording Academy \/ GRAMMYS[\s\S]*?authorId: "golden_globes",\s*content,\s*image: winner\.coverArt,/;
const grammyReplace = 'Recording Academy / GRAMMYS 🏆\\n\\nCongrats ${category.name} winner - \\\'${winner.name}\\\' @${winner.artistName.replace(/\\\\s/g, "")} #GRAMMYs`;\\n' +
'            Object.values(updatedArtistsData).forEach((d) =>\\n' +
'              d.xPosts.unshift({\\n' +
'                id: crypto.randomUUID(),\\n' +
'                authorId: "popbase",\\n' +
'                content,\\n' +
'                image: winner.coverArt,';

content = content.replace(grammyMatch, grammyReplace);

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Fixed X posts");
