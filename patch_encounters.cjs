const fs = require('fs');
let content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf8');

const targetStr = `  const isMarried = artistData.relationships?.some(
    (r) => r.status === "married",
  );`;
const replacementStr = `  const isMarried = artistData.relationships?.some(
    (r) => r.status === "married",
  );
  const activePartner = artistData.relationships?.find(
    (r) => r.status === "dating" || r.status === "engaged" || r.status === "married"
  );`;

content = content.replace(targetStr, replacementStr);

const targetStr2 = `  if (isMarried) {
    encounters.push(`;
const replacementStr2 = `  if (activePartner) {
    encounters.push({
      id: "partner_asks_money",
      text: \`Your partner \${activePartner.partnerName} tells you they want to start a business and asks you for $1,000,000 to get it off the ground.\`,
      requiresImage: false,
      choices: [
        {
          label: "Give them $1,000,000",
          tweetTemplate: "{artist}'s partner just launched a new business! 💸",
          authorName: "Pop Base",
          isTMZ: false,
          publicImageEffect: 2,
          hypeEffect: 1,
          moneyEffect: -1000000
        },
        {
          label: "Refuse",
          tweetTemplate: "Sources say {artist} and their partner got into a huge fight over money.",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -3,
          hypeEffect: 5,
          moneyEffect: 0
        }
      ]
    });
  }

  if (isMarried) {
    encounters.push(`;

content = content.replace(targetStr2, replacementStr2);

fs.writeFileSync('/app/applet/context/GameContext.tsx', content);
console.log("Encounters Patched.");
