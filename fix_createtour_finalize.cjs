const fs = require('fs');
let file = '/app/applet/components/CreateTourView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    `disabled={chosenVenueIds.size === 0 || !tourName || setlist.size < 10}`,
    ``
);
content = content.replace(
    `className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors p-4 rounded-lg font-bold text-lg"`,
    `className="w-full bg-blue-600 hover:bg-blue-500 transition-colors p-4 rounded-lg font-bold text-lg"`
);

fs.writeFileSync(file, content);
console.log("Fixed Finalize Tour button");
