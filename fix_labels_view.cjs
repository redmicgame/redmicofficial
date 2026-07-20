const fs = require('fs');
let content = fs.readFileSync('components/LabelsView.tsx', 'utf-8');

content = content.replace(
    /const standardLabels = LABELS\.filter\(l => l\.contractType !== 'petty'\);/g,
    `const currentYear = gameState.date.year;
    const standardLabels = LABELS.filter(l => 
        l.contractType !== 'petty' && 
        !l.isDistributionOnly &&
        (!l.activeFromYear || currentYear >= l.activeFromYear) &&
        (!l.activeUntilYear || currentYear <= l.activeUntilYear)
    );`
);

content = content.replace(
    /const pettyLabels = LABELS\.filter\(l => l\.contractType === 'petty'\);/g,
    `const pettyLabels = LABELS.filter(l => 
        l.contractType === 'petty' && 
        !l.isDistributionOnly &&
        (!l.activeFromYear || currentYear >= l.activeFromYear) &&
        (!l.activeUntilYear || currentYear <= l.activeUntilYear)
    );`
);

fs.writeFileSync('components/LabelsView.tsx', content);
console.log("Updated LabelsView filters");
