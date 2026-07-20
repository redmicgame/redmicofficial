const fs = require('fs');
let content = fs.readFileSync('components/XView.tsx', 'utf-8');

const endorseButtonTarget = `              {gameState.date.year % 4 === 0 && (
                <button
                  onClick={() => setPostType("endorse")}
                  className={\`py-2 text-xs font-semibold rounded-md \${postType === "endorse" ? "bg-blue-700 text-white" : "bg-zinc-800"}\`}
                >
                  Endorse
                </button>
              )}`;

const newButtons = `              {gameState.date.year % 4 === 0 && (
                <button
                  onClick={() => setPostType("endorse")}
                  className={\`py-2 text-xs font-semibold rounded-md \${postType === "endorse" ? "bg-blue-700 text-white" : "bg-zinc-800"}\`}
                >
                  Endorse
                </button>
              )}
              <button
                onClick={() => setPostType("market_crypto")}
                disabled={!activeArtistData.cryptoCoin}
                className={\`py-2 px-1 text-xs font-semibold rounded-md \${postType === "market_crypto" ? "bg-amber-500 text-white" : "bg-zinc-800"} disabled:opacity-50 disabled:cursor-not-allowed\`}
              >
                Market Coin
              </button>`;

if (content.includes(endorseButtonTarget)) {
    content = content.replace(endorseButtonTarget, newButtons);
    fs.writeFileSync('components/XView.tsx', content);
    console.log('patched xview');
} else {
    console.log('not found');
}
