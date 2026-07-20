const fs = require('fs');
let content = fs.readFileSync('components/ContractNegotiationModal.tsx', 'utf-8');

content = content.replace(
    /advance: label\.tier === 'Top' \? 2000000 : \(label\.tier === 'Low' \? 300000 : 750000\),/,
    `advance: label.isDistributionOnly ? 0 : (label.tier === 'Top' ? 2000000 : (label.tier === 'Low' ? 300000 : 750000)),`
);

fs.writeFileSync('components/ContractNegotiationModal.tsx', content);
console.log("Fixed modal advance default");
