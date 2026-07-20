const fs = require('fs');
let content = fs.readFileSync('components/CryptoView.tsx', 'utf-8');

// I'll just clean up from 'Trade & Manage' all the way to the end and rewrite it properly.

const startIndex = content.indexOf('<h2 className="text-xl font-bold mb-4">Trade & Manage</h2>');
if (startIndex > -1) {
    let cleanTail = `<h2 className="text-xl font-bold mb-4">Trade & Manage</h2>
                {coin.isRugpulled ? (
                    <div className="text-center text-red-500 font-bold py-4 bg-red-900/20 rounded-lg">Trading is permanently halted.</div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">Buy Amount</label>
                                <input type="number" value={buyAmount} onChange={e => setBuyAmount(Number(e.target.value))} className="w-full bg-zinc-800 p-2 rounded-md outline-none focus:border-amber-500 border border-zinc-700 text-sm" />
                                <button 
                                    onClick={() => dispatch({ type: 'BUY_CRYPTO', payload: { amount: buyAmount, cost: buyAmount * currentPrice } })}
                                    disabled={money < buyAmount * currentPrice}
                                    className="w-full mt-2 bg-green-500 hover:bg-green-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold py-2 rounded-md text-sm"
                                >
                                    Buy ({formatCurrency(buyAmount * currentPrice)})
                                </button>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">Sell Amount</label>
                                <input type="number" value={sellAmount} onChange={e => setSellAmount(Number(e.target.value))} className="w-full bg-zinc-800 p-2 rounded-md outline-none focus:border-amber-500 border border-zinc-700 text-sm" />
                                <button 
                                    onClick={() => dispatch({ type: 'SELL_CRYPTO', payload: { amount: sellAmount, revenue: sellAmount * currentPrice } })}
                                    disabled={coin.playerOwnedCoins < sellAmount}
                                    className="w-full mt-2 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold py-2 rounded-md text-sm"
                                >
                                    Sell ({formatCurrency(sellAmount * currentPrice)})
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button 
                                onClick={() => dispatch({ type: 'BURN_CRYPTO', payload: { amount: Math.floor(coin.playerOwnedCoins * 0.1) } })}
                                disabled={coin.playerOwnedCoins <= 0}
                                className="w-full bg-orange-600/20 text-orange-500 border border-orange-600/50 font-bold p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-600/30 transition-colors"
                            >
                                Burn 10% Holdings
                            </button>
                            <button 
                                onClick={() => dispatch({ type: 'MARKET_CRYPTO', payload: { cost: 50000, platform: 'x' } })}
                                disabled={money < 50000}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold p-3 rounded-lg border border-zinc-700 transition-colors"
                            >
                                Market on X ({currency}50k)
                            </button>
                            <button 
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
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CryptoView;`;

    content = content.substring(0, startIndex) + cleanTail;
    fs.writeFileSync('components/CryptoView.tsx', content);
    console.log('Fixed syntax perfectly');
}
