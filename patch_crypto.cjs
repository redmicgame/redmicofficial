const fs = require('fs');
let content = fs.readFileSync('components/CryptoView.tsx', 'utf-8');

content = content.replace(/\\`p-3/g, '`p-3');
content = content.replace(/\\`\\}/g, '`}');
content = content.replace(/\\$\\{/g, '${');

fs.writeFileSync('components/CryptoView.tsx', content);
