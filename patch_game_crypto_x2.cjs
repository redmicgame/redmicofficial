const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const target = `      let postContent = content;`;
const replacement = `      let postContent = content;
      if (postType === "market_crypto" && !postContent.trim() && activeData.cryptoCoin) {
          postContent = "Buy $" + activeData.cryptoCoin.ticker + " now!";
      }`;

if (content.includes(target) && !content.includes('Buy $" + activeData.cryptoCoin.ticker')) {
    content = content.replace(target, replacement);
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log('patched context successfully');
}
