const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');

if (!content.includes('RUGPULL_CRYPTO')) {
    const regex = /\| \{ type: "TOGGLE_CRYPTO_UTILITY"; payload: \{ utility: "merch" \| "tickets" \| "fanClub" \| "voting" \} \}/;
    content = content.replace(regex, '| { type: "TOGGLE_CRYPTO_UTILITY"; payload: { utility: "merch" | "tickets" | "fanClub" | "voting" } }\n  | { type: "RUGPULL_CRYPTO" }');
    fs.writeFileSync('types.ts', content);
    console.log('patched types.ts with RUGPULL_CRYPTO');
}
