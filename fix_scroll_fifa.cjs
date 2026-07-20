const fs = require('fs');
let content = fs.readFileSync('components/CreateFifaWorldCupView.tsx', 'utf-8');

content = content.replace(
    '            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">',
    '            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 pb-24">'
);

fs.writeFileSync('components/CreateFifaWorldCupView.tsx', content);
console.log("Fixed fifa scroll");
