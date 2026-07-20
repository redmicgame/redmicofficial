const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const target = `      if (postType === "push" && songId) {`;
const replacement = `      if (updatedData.cryptoCoin && postContent.includes("$" + updatedData.cryptoCoin.ticker)) {
          updatedData.cryptoCoin = {
              ...updatedData.cryptoCoin,
              reputation: {
                  ...updatedData.cryptoCoin.reputation,
                  hype: Math.min(100, updatedData.cryptoCoin.reputation.hype + 10)
              },
              currentPrice: updatedData.cryptoCoin.currentPrice * 1.05
          };
      }

      if (postType === "push" && songId) {`;

if (content.includes(target) && !content.includes('includes("$" + updatedData.cryptoCoin.ticker)')) {
    content = content.replace(target, replacement);
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log('patched x boost successfully');
}
