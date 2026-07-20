const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const target = `    default:`;
const replacement = `    case "LAUNCH_CRYPTO_COIN": {
      const { name, ticker, logo, launchPrice, totalSupply, cost } = action.payload;
      const artistData = state.artistsData[state.activeArtistId!];
      if (artistData.money < cost) return state;
      const newCoin = {
        id: "coin_" + Date.now(),
        name,
        ticker,
        logo,
        launchPrice,
        currentPrice: launchPrice,
        totalSupply,
        playerOwnedCoins: totalSupply * 0.9,
        marketCap: launchPrice * totalSupply,
        priceHistory: [launchPrice],
        holders: 100,
        tradingVolume: 0,
        reputation: { hype: 50, trust: 50, utility: 0 },
        utilityEnabled: { merch: false, tickets: false, fanClub: false, voting: false },
        launchedDate: { ...state.date }
      };
      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId!]: {
            ...artistData,
            money: artistData.money - cost,
            cryptoCoin: newCoin
          }
        }
      };
    }
    case "BUY_CRYPTO": {
      const { amount, cost } = action.payload;
      const artistData = state.artistsData[state.activeArtistId!];
      if (!artistData.cryptoCoin || artistData.money < cost) return state;
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
              currentPrice: artistData.cryptoCoin.currentPrice * 1.01
            }
          }
        }
      };
    }
    case "SELL_CRYPTO": {
      const { amount, revenue } = action.payload;
      const artistData = state.artistsData[state.activeArtistId!];
      if (!artistData.cryptoCoin || artistData.cryptoCoin.playerOwnedCoins < amount) return state;
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
              currentPrice: artistData.cryptoCoin.currentPrice * 0.95
            }
          }
        }
      };
    }
    case "BURN_CRYPTO": {
      const { amount } = action.payload;
      const artistData = state.artistsData[state.activeArtistId!];
      if (!artistData.cryptoCoin || artistData.cryptoCoin.playerOwnedCoins < amount) return state;
      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId!]: {
            ...artistData,
            cryptoCoin: {
              ...artistData.cryptoCoin,
              playerOwnedCoins: artistData.cryptoCoin.playerOwnedCoins - amount,
              totalSupply: artistData.cryptoCoin.totalSupply - amount,
              currentPrice: artistData.cryptoCoin.currentPrice * 1.1,
              reputation: {
                ...artistData.cryptoCoin.reputation,
                trust: Math.min(100, artistData.cryptoCoin.reputation.trust + 10)
              }
            }
          }
        }
      };
    }
    case "MARKET_CRYPTO": {
      const { cost, platform } = action.payload;
      const artistData = state.artistsData[state.activeArtistId!];
      if (!artistData.cryptoCoin || artistData.money < cost) return state;
      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId!]: {
            ...artistData,
            money: artistData.money - cost,
            cryptoCoin: {
              ...artistData.cryptoCoin,
              reputation: {
                ...artistData.cryptoCoin.reputation,
                hype: Math.min(100, artistData.cryptoCoin.reputation.hype + 15)
              }
            }
          }
        }
      };
    }
    case "TOGGLE_CRYPTO_UTILITY": {
      const { utility } = action.payload;
      const artistData = state.artistsData[state.activeArtistId!];
      if (!artistData.cryptoCoin) return state;
      const currentVal = artistData.cryptoCoin.utilityEnabled[utility];
      const utilityDiff = currentVal ? -25 : 25;
      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId!]: {
            ...artistData,
            cryptoCoin: {
              ...artistData.cryptoCoin,
              reputation: {
                ...artistData.cryptoCoin.reputation,
                utility: Math.max(0, Math.min(100, artistData.cryptoCoin.reputation.utility + utilityDiff))
              },
              utilityEnabled: {
                ...artistData.cryptoCoin.utilityEnabled,
                [utility]: !currentVal
              }
            }
          }
        }
      };
    }
    default:`;

if (content.includes(target) && !content.includes('case "LAUNCH_CRYPTO_COIN":')) {
    content = content.replace(target, replacement);
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log('patched context successfully');
} else {
    console.log('already patched or target not found');
}
