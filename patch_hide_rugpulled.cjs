const fs = require('fs');
let content = fs.readFileSync('components/CryptoView.tsx', 'utf-8');

const regex = /<h2 className="text-xl font-bold mb-4">Trading<\/h2>/;
const replacement = `<h2 className="text-xl font-bold mb-4">Trading</h2>
                
                {coin.isRugpulled ? (
                    <div className="text-center text-zinc-500 py-4">Trading is halted for this token.</div>
                ) : (`;

content = content.replace(regex, replacement);

const regexEnd = /<button \n\s*onClick=\{\(\) => \{\n\s*if \(window\.confirm\("Are you sure you want to RUGPULL\? This will cash out your holdings, crash the coin, and severely damage your public image and hype!"\)\) \{\n\s*dispatch\(\{ type: 'RUGPULL_CRYPTO' \}\);\n\s*dispatch\(\{ type: 'CHANGE_VIEW', payload: 'game' \}\);\n\s*\}\n\s*\}\}\n\s*className="w-full bg-red-900\/40 text-red-500 border border-red-900\/80 font-bold p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-900\/60 transition-colors mt-4"\n\s*>\n\s*🚨 RUGPULL \(Cash out \{formatCurrency\(coin\.currentPrice \* coin\.playerOwnedCoins\)\}\)\n\s*<\/button>\n\s*<\/div>/;

const replacementEnd = `<button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to RUGPULL? This will cash out your holdings, crash the coin, and severely damage your public image and hype!")) {
                                dispatch({ type: 'RUGPULL_CRYPTO' });
                                dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
                            }
                        }}
                        className="w-full bg-red-900/40 text-red-500 border border-red-900/80 font-bold p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-900/60 transition-colors mt-4"
                    >
                        🚨 RUGPULL (Cash out {formatCurrency(coin.currentPrice * coin.playerOwnedCoins)})
                    </button>
                )}
                </div>`;

content = content.replace(regexEnd, replacementEnd);
fs.writeFileSync('components/CryptoView.tsx', content);
console.log('patched hide rugpulled');
