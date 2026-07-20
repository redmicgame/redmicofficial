const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const regex = /const nextState = gameReducerInternal\(state, action\);/;
const replacement = `const nextState = gameReducerInternal(state, action);
  
  if (action.type === "PROGRESS_WEEK") {
    const isDailyMode = state.timeMode === "daily";
    let isWeeklyUpdate = true;
    if (isDailyMode) {
      if (state.date.day === 7) isWeeklyUpdate = true;
      else isWeeklyUpdate = false;
    }
    
    if (isWeeklyUpdate) {
      let newArtistsData = { ...nextState.artistsData };
      let modified = false;
      for (const artistId in newArtistsData) {
        const artist = newArtistsData[artistId];
        if (artist.cryptoCoin) {
          modified = true;
          const coin = { ...artist.cryptoCoin };
          
          // Random event modifier
          let eventMultiplier = 1;
          const r = Math.random();
          if (r < 0.05) eventMultiplier = 1.5; // Pump
          else if (r < 0.1) eventMultiplier = 0.5; // Crash
          else if (r < 0.15) eventMultiplier = 1.2; // Exchange listing
          else if (r < 0.2) eventMultiplier = 1.3; // Celeb endorsement
          else if (r < 0.25) eventMultiplier = 1.1; // Whale buy
          else if (r < 0.3) eventMultiplier = 0.9; // Whale sell
          else if (r < 0.35) eventMultiplier = 1.2; // Token burn
          else if (r < 0.4) eventMultiplier = 0.8; // Scam rumors
          else if (r < 0.45) eventMultiplier = 1.4; // Bull run
          else if (r < 0.5) eventMultiplier = 0.7; // Bear run
          
          // Baseline fluctuation
          const fluctuation = (Math.random() - 0.5) * 0.2; 
          
          // Hype and trust modifiers
          const hypeMod = (coin.reputation.hype - 50) / 100 * 0.1;
          const trustMod = (coin.reputation.trust - 50) / 100 * 0.05;
          const utilityMod = (coin.reputation.utility) / 100 * 0.1;
          
          const change = 1 + fluctuation + hypeMod + trustMod + utilityMod;
          let newPrice = coin.currentPrice * change * eventMultiplier;
          newPrice = Math.max(0.000001, newPrice);
          
          // Decay hype and trust
          coin.reputation.hype = Math.max(0, coin.reputation.hype - 2);
          
          coin.currentPrice = newPrice;
          coin.priceHistory = [...coin.priceHistory, newPrice].slice(-52);
          coin.marketCap = newPrice * coin.totalSupply;
          coin.tradingVolume = coin.marketCap * (Math.random() * 0.1);
          coin.holders = Math.max(10, coin.holders + Math.floor((Math.random() - 0.4) * 100 * (coin.reputation.hype/50)));
          
          newArtistsData[artistId] = { ...artist, cryptoCoin: coin };
        }
      }
      if (modified) {
        nextState.artistsData = newArtistsData;
      }
    }
  }`;

if (content.includes('const nextState = gameReducerInternal(state, action);') && !content.includes('if (artist.cryptoCoin) {')) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log('patched gameReducer crypto logic');
}
