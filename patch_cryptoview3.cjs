const fs = require('fs');
let content = fs.readFileSync('components/CryptoView.tsx', 'utf-8');

const targetHeader = `<div className="flex justify-between items-start mb-6">`;
const replacementHeader = `
            {coin.isRugpulled && (
                <div className="bg-red-900/40 text-red-500 border border-red-900/80 p-4 rounded-xl font-bold text-center mb-6 animate-pulse">
                    🚨 THIS PROJECT HAS BEEN RUGPULLED 🚨
                </div>
            )}
            <div className="flex justify-between items-start mb-6">`;

content = content.replace(targetHeader, replacementHeader);

fs.writeFileSync('components/CryptoView.tsx', content);
console.log('added rugpull banner');
