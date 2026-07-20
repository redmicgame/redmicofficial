const fs = require('fs');
let file = '/app/applet/components/GameUI.tsx';
let content = fs.readFileSync(file, 'utf8');

const importTarget = `import OscarRedCarpetView from './OscarRedCarpetView';`;
const importReplacement = `import OscarRedCarpetView from './OscarRedCarpetView';
import GoldenGlobeRedCarpetView from './GoldenGlobeRedCarpetView';`;

content = content.replace(importTarget, importReplacement);

const switchTarget = `            case 'oscarRedCarpet':
                return <OscarRedCarpetView />;`;
const switchReplacement = `            case 'oscarRedCarpet':
                return <OscarRedCarpetView />;
            case 'goldenGlobeRedCarpet':
                return <GoldenGlobeRedCarpetView />;`;
                
content = content.replace(switchTarget, switchReplacement);

fs.writeFileSync(file, content);
console.log("Patched game UI for golden globes");
