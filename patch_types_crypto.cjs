const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');

if (!content.includes('export interface CryptoCoin')) {
    const cryptoType = `
export interface CryptoCoin {
  id: string;
  name: string;
  ticker: string;
  logo: string;
  launchPrice: number;
  currentPrice: number;
  totalSupply: number;
  playerOwnedCoins: number;
  marketCap: number;
  priceHistory: number[];
  holders: number;
  tradingVolume: number; // 24h
  reputation: {
    hype: number;
    trust: number;
    utility: number;
  };
  utilityEnabled: {
    merch: boolean;
    tickets: boolean;
    fanClub: boolean;
    voting: boolean;
  };
  launchedDate: GameDate;
}
`;
    content = content.replace('export interface ArtistData {', cryptoType + '\nexport interface ArtistData {\n  cryptoCoin?: CryptoCoin;');
    fs.writeFileSync('types.ts', content);
    console.log('patched types.ts');
} else {
    console.log('already patched');
}
