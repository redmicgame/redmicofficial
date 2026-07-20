const fs = require('fs');

let typesFile = '/app/applet/types.ts';
let typesContent = fs.readFileSync(typesFile, 'utf8');
typesContent = typesContent.replace(
  `roleType?: 'Leading Role' | 'Supporting Role';`,
  `roleType?: 'Leading Role' | 'Supporting Role' | 'Extra';`
);
fs.writeFileSync(typesFile, typesContent);

let contextFile = '/app/applet/context/GameContext.tsx';
let contextContent = fs.readFileSync(contextFile, 'utf8');

const target1 = `      const roleType = Math.random() > 0.5 ? 'Leading Role' : 'Supporting Role';`;
const replacement1 = `      const randRole = Math.random();
      const roleType = randRole > 0.6 ? 'Leading Role' : (randRole > 0.2 ? 'Supporting Role' : 'Extra');`;

contextContent = contextContent.replace(target1, replacement1);

const target2 = `      const pay = Math.floor(Math.random() * 5000000) + 1000000 * (activeData.popularity / 50);`;
const replacement2 = `      let basePay = Math.floor(Math.random() * 5000000) + 1000000 * (activeData.popularity / 50);
      let pay = roleType === 'Extra' ? Math.floor(basePay * 0.05) : roleType === 'Supporting Role' ? Math.floor(basePay * 0.4) : basePay;`;
contextContent = contextContent.replace(target2, replacement2);

fs.writeFileSync(contextFile, contextContent);
console.log("Patched acting roles");
