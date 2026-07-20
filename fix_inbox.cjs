const fs = require('fs');

let content = fs.readFileSync('components/InboxView.tsx', 'utf-8');
content = content.replace(/            case 'goldenGlobeNominations':\n                buttonText = "Attend Ceremony";\n                buttonClass = "bg-amber-400 hover:bg-amber-500 text-black shadow-amber-400\/20";\n                acceptedText = "Attending Ceremony";\n                isAccepted = !!email\.offer\.isAttending;\n                break;/g, "");

const renderCase = `            case 'goldenGlobeNominations':
                buttonText = "Attend Ceremony";
                buttonClass = "bg-amber-400 hover:bg-amber-500 text-black shadow-amber-400/20";
                acceptedText = "Attending Ceremony";
                isAccepted = !!email.offer.isAttending;
                break;`;

content = content.replace("            case 'goldenGlobeSubmission':\n                buttonText = \"Submit For Golden Globes\";", renderCase + "\n            case 'goldenGlobeSubmission':\n                buttonText = \"Submit For Golden Globes\";");

fs.writeFileSync('components/InboxView.tsx', content);
console.log("Fixed InboxView.tsx");
