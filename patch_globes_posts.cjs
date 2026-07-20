const fs = require('fs');

let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

// For nominations:
const nominationPostCode = `
        const majorCatsForPosts: GoldenGlobeAward["category"][] = ["Best Actor/Actress", "Best Movie", "Best Original Song"];
        
        for (const category of newNominations) {
            if (majorCatsForPosts.includes(category.name)) {
                let nomineesText = '';
                category.nominees.forEach(n => {
                    nomineesText += \`• \${n.artistName.toUpperCase()} | \${n.name.toUpperCase()}\\n\`;
                });
                const content = \`Congratulations to the 85th #GoldenGlobes nominees for \${category.name}:\\n\\n\${nomineesText}\`;
                
                Object.values(updatedArtistsData).forEach((d) =>
                  d.xPosts.unshift({
                    id: crypto.randomUUID(),
                    authorId: "golden_globes",
                    content,
                    likes: Math.floor(Math.random() * 4000) + 1500,
                    retweets: Math.floor(Math.random() * 1000) + 500,
                    views: Math.floor(Math.random() * 200000) + 100000,
                    date: newDate,
                  }),
                );
            }
        }
        
        for (const artistId in updatedArtistsData) {
`;
content = content.replace(
    'const majorCatsForPosts: GoldenGlobeAward["category"][] = ["Best Actor/Actress", "Best Movie", "Best Original Song"];\n        for (const artistId in updatedArtistsData) {',
    nominationPostCode
);

// For wins:
content = content.replace(
    /const content = \`Hollywood Foreign Press Association 🌍\\n\\nCongrats \$\{category\.name\} winner - '\$\{winner\.name\}' @\$\{winner\.artistName\.replace\(\/\\s\/g, ""\)\} #GoldenGlobes\`;/g,
    'const content = `Congratulations ${winner.artistName} for WINNING ${category.name} win! 🏆 #GoldenGlobes`;'
);

content = content.replace(/authorId: "popbase",\s*content,\s*image: winner\.coverArt/g, 'authorId: "golden_globes",\n                  content,\n                  image: winner.coverArt');

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Patched Golden Globes posts");
