const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

// For Oscars
content = content.replace(
\`          const content = \\\`The Oscar for Best Original Song goes to... "\\\${winner.name}" by \\\${winner.artistName}! #Oscars\\\`;
          Object.values(updatedArtistsData).forEach((d) =>
            d.xPosts.unshift({
              id: crypto.randomUUID(),
              authorId: "golden_globes",
                  content,
                  image: winner.coverArt,\`,
\`          const content = \\\`The Oscar for Best Original Song goes to... "\\\${winner.name}" by \\\${winner.artistName}! #Oscars\\\`;
          Object.values(updatedArtistsData).forEach((d) =>
            d.xPosts.unshift({
              id: crypto.randomUUID(),
              authorId: "popbase",
              content,
              image: winner.coverArt,\`
);

// For Grammys
content = content.replace(
\`            const content = \\\`Recording Academy / GRAMMYS 🏆\\n\\nCongrats \\\${category.name} winner - '\\\${winner.name}' @\\\${winner.artistName.replace(/\\\\s/g, "")} #GRAMMYs\\\`;
            Object.values(updatedArtistsData).forEach((d) =>
              d.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: "golden_globes",
                  content,
                  image: winner.coverArt,\`,
\`            const content = \\\`Recording Academy / GRAMMYS 🏆\\n\\nCongrats \\\${category.name} winner - '\\\${winner.name}' @\\\${winner.artistName.replace(/\\\\s/g, "")} #GRAMMYs\\\`;
            Object.values(updatedArtistsData).forEach((d) =>
              d.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: "popbase",
                content,
                image: winner.coverArt,\`
);

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Fixed X posts");
