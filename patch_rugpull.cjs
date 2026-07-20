const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const regex = /case "TOGGLE_CRYPTO_UTILITY": \{/;
const replacement = `case "RUGPULL_CRYPTO": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      if (!activeData.cryptoCoin) return state;

      const activeArtist = state.soloArtist || state.group;
      const artistName = activeArtist?.name || "The artist";

      const cashOutValue = activeData.cryptoCoin.currentPrice * activeData.cryptoCoin.playerOwnedCoins;
      const rugAmount = (cashOutValue).toFixed(0);

      const tmzPost = {
        id: crypto.randomUUID(),
        authorId: "tmz",
        content: \`🚨 RUGPULL ALERT: \${artistName} just deleted their crypto project $\${activeData.cryptoCoin.ticker} after cashing out for \$\${Number(rugAmount).toLocaleString()}! Fans are furious and lost everything.\`,
        likes: Math.floor(Math.random() * 80000) + 20000,
        retweets: Math.floor(Math.random() * 30000) + 10000,
        views: Math.floor(Math.random() * 1500000) + 500000,
        date: state.date,
      };

      const updatedPosts = [tmzPost, ...(activeData.xPosts || [])];

      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            money: activeData.money + cashOutValue,
            publicImage: Math.max(0, activeData.publicImage - 40),
            popularity: Math.max(0, activeData.popularity - 15),
            hype: Math.max(0, activeData.hype - 300),
            cryptoCoin: undefined, // delete the coin
            xPosts: updatedPosts
          }
        }
      };
    }
    case "TOGGLE_CRYPTO_UTILITY": {`;

if (content.includes('case "TOGGLE_CRYPTO_UTILITY": {') && !content.includes('case "RUGPULL_CRYPTO":')) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log('patched context with RUGPULL_CRYPTO');
}
