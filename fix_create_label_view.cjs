const fs = require('fs');
let content = fs.readFileSync('components/CreateLabelView.tsx', 'utf-8');

content = content.replace(
    /return LABELS\.filter\(label => careerStreams >= label\.streamRequirement\);/g,
    `const currentYear = gameState.date.year;
        return LABELS.filter(label => 
            careerStreams >= label.streamRequirement && 
            label.contractType !== 'petty' &&
            (!label.activeFromYear || currentYear >= label.activeFromYear) &&
            (!label.activeUntilYear || currentYear <= label.activeUntilYear)
        );`
);

fs.writeFileSync('components/CreateLabelView.tsx', content);
console.log("Updated CreateLabelView filters");
