const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');

if (!content.includes('LAUNCH_CRYPTO_COIN')) {
    const cryptoActions = `
  | { type: "LAUNCH_CRYPTO_COIN"; payload: { name: string; ticker: string; logo: string; launchPrice: number; totalSupply: number; cost: number } }
  | { type: "BUY_CRYPTO"; payload: { amount: number; cost: number } }
  | { type: "SELL_CRYPTO"; payload: { amount: number; revenue: number } }
  | { type: "BURN_CRYPTO"; payload: { amount: number } }
  | { type: "MARKET_CRYPTO"; payload: { cost: number; platform: "x" } }
  | { type: "TOGGLE_CRYPTO_UTILITY"; payload: { utility: "merch" | "tickets" | "fanClub" | "voting" } }`;
    content = content.replace('export type GameAction =', 'export type GameAction =' + cryptoActions);
    fs.writeFileSync('types.ts', content);
    console.log('patched types.ts for actions');
} else {
    console.log('already patched');
}
