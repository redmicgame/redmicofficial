const fs = require('fs');
let content = fs.readFileSync('components/CryptoView.tsx', 'utf-8');

const regex = /Market on X \(\{currency\}50k\)\n\s+<\/button>\n\s+<\/div>/;
const replacement = `Market on X ({currency}50k)
                    </button>
                    <button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to RUGPULL? This will delete the coin and severely damage your public image and hype!")) {
                                dispatch({ type: 'RUGPULL_CRYPTO' });
                                dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
                            }
                        }}
                        className="w-full bg-red-900/40 text-red-500 border border-red-900/80 font-bold p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-900/60 transition-colors mt-4"
                    >
                        🚨 RUGPULL (Cash out {formatCurrency(coin.currentPrice * coin.playerOwnedCoins)})
                    </button>
                </div>`;

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('components/CryptoView.tsx', content);
    console.log('patched CryptoView with Rugpull button');
} else {
    console.log('not found');
}
