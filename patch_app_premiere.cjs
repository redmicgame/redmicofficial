const fs = require('fs');
let file = '/app/applet/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const importTarget = `import OscarRedCarpetView from './components/OscarRedCarpetView';`;
const importReplacement = `import OscarRedCarpetView from './components/OscarRedCarpetView';
import MoviePremiereRedCarpetView from './components/MoviePremiereRedCarpetView';`;
content = content.replace(importTarget, importReplacement);

const switchTarget = `            case 'oscarRedCarpet':
                return <OscarRedCarpetView />;`;
const switchReplacement = `            case 'oscarRedCarpet':
                return <OscarRedCarpetView />;
            case 'moviePremiereRedCarpet':
                return <MoviePremiereRedCarpetView />;`;
content = content.replace(switchTarget, switchReplacement);

fs.writeFileSync(file, content);
console.log("Patched App.tsx for Movie Premiere View");
