const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const target = `          const fluctuation = (Math.random() - 0.5) * 0.2;`;
const replacement = `          const artistPopularityMod = (artist.popularity - 50) / 100 * 0.15;
          const artistHypeMod = (artist.hype) / 1000 * 0.2;
          const fluctuation = (Math.random() - 0.5 + artistPopularityMod + artistHypeMod) * 0.2;`;

const target2 = `          coin.holders = Math.max(10, coin.holders + Math.floor((Math.random() - 0.4) * 100 * (coin.reputation.hype/50)));`;
const replacement2 = `          coin.holders = Math.max(10, coin.holders + Math.floor((Math.random() - 0.4 + artistPopularityMod) * 200 * (coin.reputation.hype/50)));
          
          if (Math.random() < 0.6) {
              const cryptoFan = {
                  id: "crypto_fan_" + Math.random().toString(36).substring(7),
                  username: "cryptobro_" + Math.floor(Math.random() * 9999),
                  displayName: "Crypto Whale 🚀",
                  followersCount: Math.floor(Math.random() * 50000) + 1000,
                  isVerified: Math.random() > 0.8,
                  bio: "Web3 | Crypto | NFTs | Not financial advice",
                  isPlayer: false,
                  avatar: "https://images.unsplash.com/photo-1622630998477-20b41cd0e074?w=150&h=150&fit=crop&q=80",
                  joinedDate: { year: 2020, week: 1 },
              };
              if (!artist.xUsers.find(u => u.username === cryptoFan.username)) {
                  artist.xUsers.push(cryptoFan);
              }
              const phrases = [
                  \`Just bought more $\${coin.ticker}! We are going to the MOON 🚀🌕\`,
                  \`$\${coin.ticker} is looking incredibly bullish right now. Don't miss out.\`,
                  \`If you aren't holding $\${coin.ticker} you hate money. Simple as that.\`,
                  \`The chart on $\${coin.ticker} is insane. Big moves incoming.\`,
                  \`Just ape'd my life savings into $\${coin.ticker}. Let's goooo 📈\`
              ];
              const newCryptoPost = {
                  id: crypto.randomUUID(),
                  authorId: cryptoFan.id,
                  content: phrases[Math.floor(Math.random() * phrases.length)],
                  likes: Math.floor(Math.random() * 5000) + 50,
                  retweets: Math.floor(Math.random() * 1000) + 10,
                  views: Math.floor(Math.random() * 50000) + 1000,
                  date: nextState.date,
              };
              artist.xPosts.unshift(newCryptoPost);
          }`;

if (content.includes(target) && !content.includes('artistPopularityMod = ')) {
    content = content.replace(target, replacement);
    content = content.replace(target2, replacement2);
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log('patched crypto loop successfully');
}
