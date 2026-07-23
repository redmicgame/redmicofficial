const fs = require('fs');
let content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf8');

const t1 = "text: \"Your spouse has filed for DIVORCE! They are demanding a massive settlement and it's all over the tabloids.\",";
const r1 = "text: `Your spouse ${activePartner?.partnerName || 'spouse'} has filed for DIVORCE! They are demanding a massive settlement and it's all over the tabloids.`,";

content = content.replace(t1, r1);

const t2 = "tweetTemplate: \"{artist} officially divorces! The settlement was MASSIVE 💔\",";
const r2 = "tweetTemplate: `#{artist} has filed for divorce from #${activePartner?.partnerName?.replace(/\\s/g, '') || 'spouse'}. The settlement was MASSIVE 💔`,";

content = content.replace(t2, r2);

const t3 = "text: \"Your ex is suing you for CHILD SUPPORT! They are demanding a hefty monthly payment.\",";
const r3 = "text: `Your ex is suing you for CHILD SUPPORT! They are demanding a hefty monthly payment.`,";
content = content.replace(t3, r3);

const t4 = "tweetTemplate: \"{artist} agrees to pay child support. A responsible parent! 🍼\",";
const r4 = "tweetTemplate: `#{artist} agrees to pay child support. A responsible parent! 🍼`,";
content = content.replace(t4, r4);

fs.writeFileSync('/app/applet/context/GameContext.tsx', content);
console.log("Divorce Patched.");
