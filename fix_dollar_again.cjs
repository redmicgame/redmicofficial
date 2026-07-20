const fs = require('fs');
let content = fs.readFileSync('components/LabelsView.tsx', 'utf-8');

content = content.replace(
    /return \`\\\$\{formatNumber\(low\)\} - \\\$\{formatNumber\(high\)\}\`;/,
    'return `$' + '${formatNumber(low)} - $' + '${formatNumber(high)}`;'
);

fs.writeFileSync('components/LabelsView.tsx', content);
console.log("Fixed dollar signs again");
