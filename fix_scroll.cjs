const fs = require('fs');
let content = fs.readFileSync('components/CreateFifaWorldCupView.tsx', 'utf-8');

content = content.replace(
    /    return \(\n        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-\[#121212\] pb-24 text-white">/,
    '    return (\n        <div className="h-full w-full bg-[#121212] text-white flex flex-col">\n            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">'
);

content = content.replace(
    /            <\/div>\n        <\/div>\n    \);\n\};\n\nexport default CreateFifaWorldCupView;/,
    '            </div>\n            </div>\n        </div>\n    );\n};\n\nexport default CreateFifaWorldCupView;'
);

fs.writeFileSync('components/CreateFifaWorldCupView.tsx', content);
console.log("Fixed scroll");
