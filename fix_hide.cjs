const fs = require('fs');
let content = fs.readFileSync('components/CryptoView.tsx', 'utf-8');

const rogue = `</button>
                )}
                </div>`;
const replacementRogue = `</button>
                    </>
                )}
                </div>`;
content = content.replace(rogue, replacementRogue);

const regex = /<h2 className="text-xl font-bold mb-4">Trade & Manage<\/h2>\n\s*<div className="grid grid-cols-2 gap-4 mb-4">/;
const replacement = `<h2 className="text-xl font-bold mb-4">Trade & Manage</h2>
                
                {coin.isRugpulled ? (
                    <div className="text-center text-red-500 font-bold py-4">Trading is permanently halted.</div>
                ) : (
                    <>
                <div className="grid grid-cols-2 gap-4 mb-4">`;

content = content.replace(regex, replacement);
fs.writeFileSync('components/CryptoView.tsx', content);
console.log('Fixed hiding');
