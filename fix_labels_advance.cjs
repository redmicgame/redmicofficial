const fs = require('fs');
let content = fs.readFileSync('components/LabelsView.tsx', 'utf-8');

const rangeFunc = `const getLabelAdvanceRange = (label: Label) => {
    if (label.isDistributionOnly) return '$0 - $100k';
    
    let base = 300000;
    if (label.contractType === 'petty') base = 1000000;
    else if (label.id === 'umg' || label.id === 'sony') base = 2500000;
    else if (label.tier === 'Mid-high' || label.tier === 'Mid-Low' || label.tier === 'Top') base = 750000;
    
    const low = Math.floor(base * 0.5);
    const high = Math.floor(base * 1.5);
    return \`$\${formatNumber(low)} - $\${formatNumber(high)}\`;
};`;

content = content.replace(
    /const getLabelAdvance = \(label: Label\) => \{[\s\S]*?\};/m,
    rangeFunc
);

content = content.replace(
    /<p>Adv: <span className="font-bold text-green-400 font-mono">\$\{\w+\(getLabelAdvance\(label\)\)\}<\/span><\/p>/,
    '<p>Est. Adv: <span className="font-bold text-green-400 font-mono">{getLabelAdvanceRange(label)}</span></p>'
);

fs.writeFileSync('components/LabelsView.tsx', content);
console.log("Fixed labels advance display");
