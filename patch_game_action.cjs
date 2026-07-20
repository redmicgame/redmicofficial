const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');
content = content.replace(
    '| { type: "LAUNCH_CRYPTO_COIN"; payload: { name: string; ticker: string; logo: string; launchPrice: number; totalSupply: number; cost: number } }',
    '| { type: "LAUNCH_CRYPTO_COIN"; payload: { name: string; ticker: string; logo: string; launchPrice: number; totalSupply: number; cost: number; playerPercent?: number } }'
);
fs.writeFileSync('types.ts', content);
console.log('patched GameAction');
