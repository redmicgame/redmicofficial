const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const match = /const newContract: Contract = createDefaultContract\(\{[\s\S]*?albumsReleased: 0,\s*\}\);/m;
if (match.test(content)) {
    content = content.replace(match, `const label = isCustom ? allCustomLabels.find((l) => l.id === labelId) : LABELS.find((l) => l.id === labelId);
      
      let advance = 0;
      if (label && !isCustom) {
        if (label.isDistributionOnly) advance = 0;
        else if (label.contractType === "petty") advance = 1000000;
        else if (label.id === "umg" || label.id === "sony") advance = 2500000;
        else if (label.tier === "Mid-high" || label.tier === "Mid-Low" || label.tier === "Top") advance = 750000;
        else if (label.tier === "Low") advance = 300000;
      }

      const newContract: Contract = createDefaultContract({
        labelId,
        isCustom,
        artistId,
        startDate: state.date,
        durationWeeks: 104, // 2 years
        albumQuota: 2, // A standard renewal deal
        albumsReleased: 0,
        advance,
        royaltyPercent: 20 // slightly better royalty for renewal
      });
      artistData.money += advance;`);
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log("Fixed RENEW_CONTRACT");
} else {
    console.log("Could not find RENEW_CONTRACT block");
}
