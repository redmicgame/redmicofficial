const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const regex = /case "BUY_CRYPTO": \{[\s\S]*?currentPrice: artistData\.cryptoCoin\.currentPrice \* 1\.01[\s\S]*?case "SELL_CRYPTO": \{/gm;
const replacement = `case "BUY_CRYPTO": {
      const { amount, cost } = action.payload;
      const artistData = state.artistsData[state.activeArtistId!];
      if (!artistData.cryptoCoin || artistData.money < cost) return state;
      
      const percentBought = amount / artistData.cryptoCoin.totalSupply;
      const priceIncreaseMultiplier = 1 + (percentBought * 5);

      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId!]: {
            ...artistData,
            money: artistData.money - cost,
            cryptoCoin: {
              ...artistData.cryptoCoin,
              playerOwnedCoins: artistData.cryptoCoin.playerOwnedCoins + amount,
              tradingVolume: artistData.cryptoCoin.tradingVolume + cost,
              currentPrice: artistData.cryptoCoin.currentPrice * priceIncreaseMultiplier
            }
          }
        }
      };
    }
    case "SELL_CRYPTO": {`;

content = content.replace(regex, replacement);

const regex2 = /case "SELL_CRYPTO": \{[\s\S]*?currentPrice: artistData\.cryptoCoin\.currentPrice \* 0\.95[\s\S]*?case "BURN_CRYPTO": \{/gm;
const replacement2 = `case "SELL_CRYPTO": {
      const { amount, revenue } = action.payload;
      const artistData = state.artistsData[state.activeArtistId!];
      if (!artistData.cryptoCoin || artistData.cryptoCoin.playerOwnedCoins < amount) return state;

      const percentSold = amount / artistData.cryptoCoin.totalSupply;
      const priceDecreaseMultiplier = 1 - (percentSold * 5);
      const newPrice = Math.max(0.000001, artistData.cryptoCoin.currentPrice * priceDecreaseMultiplier);

      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId!]: {
            ...artistData,
            money: artistData.money + revenue,
            cryptoCoin: {
              ...artistData.cryptoCoin,
              playerOwnedCoins: artistData.cryptoCoin.playerOwnedCoins - amount,
              tradingVolume: artistData.cryptoCoin.tradingVolume + revenue,
              currentPrice: newPrice
            }
          }
        }
      };
    }
    case "BURN_CRYPTO": {`;
content = content.replace(regex2, replacement2);

fs.writeFileSync('context/GameContext.tsx', content);
