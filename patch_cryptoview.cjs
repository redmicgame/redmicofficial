const fs = require('fs');
let content = fs.readFileSync('components/CryptoView.tsx', 'utf-8');

// Replace the state defaults and cost calculation
content = content.replace(
    'const [launchPrice, setLaunchPrice] = useState(0.01);',
    'const [launchPrice, setLaunchPrice] = useState(0.0001);'
);
content = content.replace(
    'const [totalSupply, setTotalSupply] = useState(1000000);',
    'const [totalSupply, setTotalSupply] = useState(1000000000);\n    const [playerPercent, setPlayerPercent] = useState(20);'
);
content = content.replace(
    'const cost = launchPrice * totalSupply;',
    'const cost = 250000; // Fixed launch & liquidity cost'
);
content = content.replace(
    'payload: { name, ticker, logo, launchPrice, totalSupply, cost }',
    'payload: { name, ticker, logo, launchPrice, totalSupply, cost, playerPercent }'
);

// Add slider for player ownership
const uiTarget = `<div className="bg-zinc-800 p-4 rounded-lg mt-2 flex justify-between items-center">`;
const uiReplacement = `<div className="mt-4">
                            <label className="block text-sm font-semibold mb-1 text-zinc-400">Amount to Keep for Yourself: {playerPercent}%</label>
                            <input type="range" min="1" max="99" value={playerPercent} onChange={e => setPlayerPercent(Number(e.target.value))} className="w-full accent-amber-500" />
                            <div className="text-xs text-zinc-500 text-center mt-1">The rest goes to the public/liquidity pool.</div>
                        </div>
                        <div className="bg-zinc-800 p-4 rounded-lg mt-2 flex justify-between items-center">`;

content = content.replace(uiTarget, uiReplacement);

fs.writeFileSync('components/CryptoView.tsx', content);
console.log('patched cryptoview');
