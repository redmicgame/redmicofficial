const fs = require('fs');
let content = fs.readFileSync('components/CryptoView.tsx', 'utf-8');

const oldCostTarget = `const [cost] = useState(10000);`;
const newCostTarget = `const cost = launchPrice * totalSupply;`;

const oldLogoTarget = `<input value={logo} onChange={e => setLogo(e.target.value)} className="w-full bg-zinc-800 p-3 rounded-lg border border-zinc-700 outline-none focus:border-amber-500" placeholder="https://..." />`;
const newLogoTarget = `
                            <input type="file" accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setLogo(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }} className="w-full bg-zinc-800 p-3 rounded-lg border border-zinc-700 outline-none focus:border-amber-500" />
                            {logo && <img src={logo} className="h-16 w-16 object-cover rounded-full mt-2" />}
`;

if (content.includes(oldCostTarget)) {
    content = content.replace(oldCostTarget, newCostTarget);
}
if (content.includes(oldLogoTarget)) {
    content = content.replace(oldLogoTarget, newLogoTarget);
}

fs.writeFileSync('components/CryptoView.tsx', content);
