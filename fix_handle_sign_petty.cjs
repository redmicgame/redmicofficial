const fs = require('fs');
let content = fs.readFileSync('components/LabelsView.tsx', 'utf-8');

content = content.replace(
    /const newContract: Contract = createDefaultContract\(\{[\s\S]*?albumsReleased: 0\s*\}\);/m,
    `const newContract: Contract = createDefaultContract({
            labelId: label.id,
            artistId: activeArtist!.id,
            startDate: gameState.date,
            albumsReleased: 0,
            advance: 1000000,
            royaltyPercent: 10
        });`
);

fs.writeFileSync('components/LabelsView.tsx', content);
console.log("Fixed handleSignPetty advance");
