const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const match = /let advance = 0;\s*if \(label && artist\) \{[\s\S]*?advance = 300000;/m;
if (match.test(content)) {
    content = content.replace(match, `let advance = 0;
      if (label && artist) {
        if (label.isDistributionOnly) {
          advance = 0;
        } else if (label.contractType === "petty") {
          advance = 1000000;
        } else if (label.id === "umg" || label.id === "sony") {
          advance = 2500000;
        } else if (
          label.tier === "Mid-high" ||
          label.tier === "Mid-Low" ||
          label.tier === "Top"
        ) {
          advance = 750000;
        } else if (label.tier === "Low") {
          advance = 300000;
        }
        newContract.advance = advance;`);
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log("Fixed PRO_SIGN_LABEL");
} else {
    console.log("Could not find PRO_SIGN_LABEL block");
}
