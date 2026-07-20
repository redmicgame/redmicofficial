const fs = require('fs');

let contextFile = '/app/applet/context/GameContext.tsx';
let contextContent = fs.readFileSync(contextFile, 'utf8');

const target1 = `      let basePay = Math.floor(Math.random() * 5000000) + 1000000 * (activeData.popularity / 50);
      let pay = roleType === 'Extra' ? Math.floor(basePay * 0.05) : roleType === 'Supporting Role' ? Math.floor(basePay * 0.4) : basePay;`;
const target2 = `      const randRole = Math.random();
      const roleType = randRole > 0.6 ? 'Leading Role' : (randRole > 0.2 ? 'Supporting Role' : 'Extra');`;

contextContent = contextContent.replace(target1, "");
contextContent = contextContent.replace(target2, target2 + "\n" + target1);

fs.writeFileSync(contextFile, contextContent);
console.log("Fixed roleType reference");
