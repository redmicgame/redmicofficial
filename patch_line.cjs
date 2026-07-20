const fs = require('fs');
let lines = fs.readFileSync('components/CryptoView.tsx', 'utf-8').split('\n');
lines[205] = "                            className={`p-3 rounded-lg text-sm font-semibold transition-colors ${coin.utilityEnabled[u.id as keyof typeof coin.utilityEnabled] ? 'bg-green-500/20 text-green-500 border border-green-500/50' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}";
fs.writeFileSync('components/CryptoView.tsx', lines.join('\n'));
