const fs = require('fs');
let content = fs.readFileSync('components/XView.tsx', 'utf-8');

const regex1 = /"normal" \| "fanWar" \| "push" \| "announce" \| "endorse"/g;
content = content.replace(regex1, '"normal" | "fanWar" | "push" | "announce" | "endorse" | "market_crypto"');

const regex2 = /postType === "push" \|\|\n\s+postType === "announce" \|\|\n\s+postType === "endorse"/;
content = content.replace(regex2, 'postType === "push" ||\n      postType === "announce" ||\n      postType === "endorse" ||\n      postType === "market_crypto"');

const endorseButtonTarget = `<button
                onClick={() => setPostType("endorse")}
                className={\`py-2 text-xs font-semibold rounded-md \${postType === "endorse" ? "bg-red-500 text-white" : "bg-zinc-800"} disabled:opacity-50 disabled:cursor-not-allowed\`}
              >
                Endorse
              </button>`;
const newButtons = `<button
                onClick={() => setPostType("endorse")}
                className={\`py-2 text-xs font-semibold rounded-md \${postType === "endorse" ? "bg-red-500 text-white" : "bg-zinc-800"} disabled:opacity-50 disabled:cursor-not-allowed\`}
              >
                Endorse
              </button>
              <button
                onClick={() => setPostType("market_crypto")}
                disabled={!activeArtistData.cryptoCoin}
                className={\`py-2 text-xs font-semibold rounded-md \${postType === "market_crypto" ? "bg-amber-500 text-white" : "bg-zinc-800"} disabled:opacity-50 disabled:cursor-not-allowed\`}
              >
                Market Coin ($50k)
              </button>`;

if (content.includes(endorseButtonTarget)) {
    content = content.replace(endorseButtonTarget, newButtons);
} else {
    // try searching for the button text
    const idx = content.indexOf('onClick={() => setPostType("endorse")}');
    if (idx > -1) {
        // we'll patch more carefully
        console.log('found endorse but not exact text');
    }
}

fs.writeFileSync('components/XView.tsx', content);
