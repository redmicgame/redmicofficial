const fs = require('fs');

let file = '/app/applet/components/CreateTourView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    `<button key={tierName} onClick={() => handleTierSelect(tierName as TourTier)} disabled={!isAvailable} className="bg-zinc-800 p-3 rounded-lg disabled:opacity-50 text-left hover:bg-zinc-700 transition-colors">`,
    `<button key={tierName} onClick={() => handleTierSelect(tierName as TourTier)} disabled={!isAvailable || !tourName.trim()} className="bg-zinc-800 p-3 rounded-lg disabled:opacity-50 text-left hover:bg-zinc-700 transition-colors">`
);

content = content.replace(
    `<button onClick={() => setStep(3)} className="w-full bg-red-600 hover:bg-red-500 transition-colors p-3 rounded-lg font-bold">Next: Support & Merch</button>`,
    `<button onClick={() => setStep(3)} disabled={chosenVenueIds.size === 0} className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-600 disabled:text-zinc-400 transition-colors p-3 rounded-lg font-bold">Next: Support & Merch</button>`
);

content = content.replace(
    `<button onClick={() => setStep(5)} className="w-full bg-red-600 hover:bg-red-500 transition-colors p-3 rounded-lg font-bold">Next: Presale</button>`,
    `<button onClick={() => setStep(5)} disabled={setlist.size < 10} className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-600 disabled:text-zinc-400 transition-colors p-3 rounded-lg font-bold">{setlist.size < 10 ? 'Select at least 10 songs' : 'Next: Presale'}</button>`
);

fs.writeFileSync(file, content);
console.log("Patched createtour buttons");
