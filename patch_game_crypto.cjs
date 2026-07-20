const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const regex = /      if \(updatedData\.cryptoCoin && postContent\.includes\("\\\$" \+ updatedData\.cryptoCoin\.ticker\)\) \{\n\s+updatedData\.cryptoCoin = \{\n\s+\.\.\.updatedData\.cryptoCoin,\n\s+reputation: \{\n\s+\.\.\.updatedData\.cryptoCoin\.reputation,\n\s+hype: Math\.min\(100, updatedData\.cryptoCoin\.reputation\.hype \+ 10\)\n\s+\},\n\s+currentPrice: updatedData\.cryptoCoin\.currentPrice \* 1\.05\n\s+\};\n\s+\}\n/gm;

content = content.replace(regex, '');

const regex2 = /let updatedData: ArtistData = \{\n\s+\.\.\.activeData,\n\s+xPosts: updatedPosts,\n\s+\};/gm;

const replacement2 = `let updatedData: ArtistData = {
        ...activeData,
        xPosts: updatedPosts,
      };

      if (updatedData.cryptoCoin && postContent.includes("$" + updatedData.cryptoCoin.ticker)) {
          updatedData.cryptoCoin = {
              ...updatedData.cryptoCoin,
              reputation: {
                  ...updatedData.cryptoCoin.reputation,
                  hype: Math.min(100, updatedData.cryptoCoin.reputation.hype + 10)
              },
              currentPrice: updatedData.cryptoCoin.currentPrice * 1.05
          };
      }`;

content = content.replace(regex2, replacement2);

fs.writeFileSync('context/GameContext.tsx', content);
