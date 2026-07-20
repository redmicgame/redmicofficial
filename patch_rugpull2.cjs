const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const regex = /case "RUGPULL_CRYPTO": \{[\s\S]*?cryptoCoin: undefined, \/\/ delete the coin[\s\S]*?xPosts: updatedPosts\n\s*\}\n\s*\}\n\s*\};\n\s*\}/gm;

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
        content: \`🚨 RUGPULL ALERT: \${artistName} just rugged their crypto project $\${activeData.cryptoCoin.ticker} after cashing out for \$\${Number(rugAmount).toLocaleString()}! The coin has completely collapsed.\`,
        likes: Math.floor(Math.random() * 80000) + 20000,
        retweets: Math.floor(Math.random() * 30000) + 10000,
        views: Math.floor(Math.random() * 1500000) + 500000,
        date: state.date,
      };

      const updatedPosts = [tmzPost, ...(activeData.xPosts || [])];
      
      const wasMainHolder = activeData.cryptoCoin.playerOwnedCoins >= activeData.cryptoCoin.totalSupply * 0.5;

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
            cryptoCoin: {
                ...activeData.cryptoCoin,
                isRugpulled: wasMainHolder,
                currentPrice: activeData.cryptoCoin.currentPrice * 0.0001,
                playerOwnedCoins: 0,
                tradingVolume: activeData.cryptoCoin.tradingVolume + cashOutValue,
                reputation: {
                    hype: 0,
                    trust: 0,
                    utility: 0
                }
            },
            xPosts: updatedPosts
          }
        }
      };
    }`;

content = content.replace(regex, replacement);
fs.writeFileSync('context/GameContext.tsx', content);
console.log('patched rugpull');
