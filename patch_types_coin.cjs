const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');
content = content.replace(
    '  utilityEnabled: {',
    '  isRugpulled?: boolean;\n  utilityEnabled: {'
);
fs.writeFileSync('types.ts', content);
