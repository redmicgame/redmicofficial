const fs = require('fs');
let content = fs.readFileSync('components/CryptoView.tsx', 'utf-8');

const regex = /<h2 className="text-xl font-bold mb-4">Trade & Manage<\/h2>/;
const replacement = `<h2 className="text-xl font-bold mb-4">Trade & Manage</h2>
                
                {coin.isRugpulled ? (
                    <div className="text-center text-zinc-500 py-4">Trading is permanently halted for this token.</div>
                ) : (
                    <>`;
content = content.replace(regex, replacement);

const regexEnd = /🚨 RUGPULL \(Cash out \{formatCurrency\(coin\.currentPrice \* coin\.playerOwnedCoins\)\}\)\n\s*<\/button>\n\s*\}\)\n\s*<\/div>/;
const replacementEnd = `🚨 RUGPULL (Cash out {formatCurrency(coin.currentPrice * coin.playerOwnedCoins)})
                    </button>
                    </>
                )}
                </div>`;
content = content.replace(regexEnd, replacementEnd);

// If the previous replace somehow resulted in a broken tag (like it did before where I replaced without matching properly):
// Wait, actually earlier `patch_hide_rugpulled.cjs` failed on the `regex` but matched the `regexEnd`, so it inserted a rogue `)}`.
