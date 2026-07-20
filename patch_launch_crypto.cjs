const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const regex = /case "LAUNCH_CRYPTO_COIN": \{\n\s*const \{ name, ticker, logo, launchPrice, totalSupply, cost \} = action\.payload;\n\s*const artistData = state\.artistsData\[state\.activeArtistId!\];\n\s*if \(artistData\.money < cost\) return state;\n\s*const newCoin = \{\n\s*id: "coin_" \+ Date\.now\(\),\n\s*name,\n\s*ticker,\n\s*logo,\n\s*launchPrice,\n\s*currentPrice: launchPrice,\n\s*totalSupply,\n\s*playerOwnedCoins: totalSupply \* 0\.9,/gm;

const replacement = `case "LAUNCH_CRYPTO_COIN": {
      const { name, ticker, logo, launchPrice, totalSupply, cost, playerPercent } = action.payload;
      const artistData = state.artistsData[state.activeArtistId!];
      if (artistData.money < cost) return state;
      
      const playerOwnedCoins = totalSupply * ((playerPercent || 20) / 100);
      
      const newCoin = {
        id: "coin_" + Date.now(),
        name,
        ticker,
        logo,
        launchPrice,
        currentPrice: launchPrice,
        totalSupply,
        playerOwnedCoins,`;

content = content.replace(regex, replacement);

fs.writeFileSync('context/GameContext.tsx', content);
console.log('patched launch crypto');
