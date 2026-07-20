const fs = require('fs');
let file = '/app/applet/components/GameUI.tsx';
let content = fs.readFileSync(file, 'utf8');

const importTarget = `import OscarRedCarpetView from './OscarRedCarpetView';`;
const importReplacement = `import OscarRedCarpetView from './OscarRedCarpetView';
import MoviePremiereRedCarpetView from './MoviePremiereRedCarpetView';`;

content = content.replace(importTarget, importReplacement);

const switchTarget = `            case 'oscarRedCarpet':
                return <OscarRedCarpetView />;`;
const switchReplacement = `            case 'oscarRedCarpet':
                return <OscarRedCarpetView />;
            case 'moviePremiereRedCarpet':
                return <MoviePremiereRedCarpetView />;`;
                
content = content.replace(switchTarget, switchReplacement);

fs.writeFileSync(file, content);
console.log("Patched game UI for premiere");
