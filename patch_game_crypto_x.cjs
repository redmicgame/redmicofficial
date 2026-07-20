const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const target = `      if (postType === "endorse") {`;
const replacement = `      if (postType === "market_crypto" && updatedData.cryptoCoin) {
        if (updatedData.money >= 50000) {
            updatedData.money -= 50000;
            updatedData.cryptoCoin = {
                ...updatedData.cryptoCoin,
                reputation: {
                    ...updatedData.cryptoCoin.reputation,
                    hype: Math.min(100, updatedData.cryptoCoin.reputation.hype + 15)
                }
            };
        } else {
            // Not enough money
            return state;
        }
      }
      if (postType === "endorse") {`;

if (content.includes(target) && !content.includes('postType === "market_crypto" && updatedData.cryptoCoin')) {
    content = content.replace(target, replacement);
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log('patched context successfully');
}
