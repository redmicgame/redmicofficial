const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const regex = /\/\/ Random event modifier[\s\S]*?let newPrice = coin\.currentPrice \* change \* eventMultiplier;\n\s*newPrice = Math\.max\(0\.000001, newPrice\);/gm;

const replacement = `// Random event modifier
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
          const artistPopularityMod = (artist.popularity - 50) / 100 * 0.15;
          const artistHypeMod = (artist.hype) / 1000 * 0.2;
          const fluctuation = (Math.random() - 0.5 + artistPopularityMod + artistHypeMod) * 0.2; 
          
          // Hype and trust modifiers
          const hypeMod = (coin.reputation.hype - 50) / 100 * 0.1;
          const trustMod = (coin.reputation.trust - 50) / 100 * 0.05;
          const utilityMod = (coin.reputation.utility) / 100 * 0.1;
          
          const change = 1 + fluctuation + hypeMod + trustMod + utilityMod;
          let newPrice = coin.isRugpulled ? coin.currentPrice * (0.5 + Math.random() * 0.4) : coin.currentPrice * change * eventMultiplier;
          newPrice = Math.max(0.000001, newPrice);`;

content = content.replace(regex, replacement);

const holdersRegex = /coin\.holders = Math\.max\(10, coin\.holders \+ Math\.floor\(\(Math\.random\(\) - 0\.4 \+ artistPopularityMod\) \* 200 \* \(coin\.reputation\.hype\/50\)\)\);/gm;

const holdersReplacement = `coin.holders = coin.isRugpulled 
            ? Math.max(0, coin.holders - Math.floor(Math.random() * 1000))
            : Math.max(10, coin.holders + Math.floor((Math.random() - 0.4 + artistPopularityMod) * 200 * (coin.reputation.hype/50)));`;

content = content.replace(holdersRegex, holdersReplacement);

fs.writeFileSync('context/GameContext.tsx', content);
console.log('patched rugpull loop');
