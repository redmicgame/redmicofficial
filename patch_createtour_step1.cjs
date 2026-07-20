const fs = require('fs');

let file = '/app/applet/components/CreateTourView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    `<input type="text" value={tourName} onChange={e => setTourName(e.target.value)} placeholder="Tour Name" className="w-full bg-zinc-700 p-3 rounded-md focus:outline-none" />`,
    `<input type="text" value={tourName} onChange={e => setTourName(e.target.value)} placeholder="Tour Name (Required)" className="w-full bg-zinc-700 p-3 rounded-md focus:outline-none border border-transparent focus:border-red-500" />\n                        {!tourName.trim() && <p className="text-xs text-red-400 font-bold">Please enter a tour name to select a tier.</p>}`
);

fs.writeFileSync(file, content);
console.log("Patched createtour step1");
