const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

content = content.replace(
    /import CreateSoundtrackView from '\.\/components\/CreateSoundtrackView';/,
    "import CreateSoundtrackView from './components/CreateSoundtrackView';\nimport CreateFifaWorldCupView from './components/CreateFifaWorldCupView';"
);

content = content.replace(
    /case 'createSoundtrack':\n                return <CreateSoundtrackView \/>;/,
    "case 'createSoundtrack':\n                return <CreateSoundtrackView />;\n            case 'createFifaWorldCup':\n                return <CreateFifaWorldCupView />;"
);

fs.writeFileSync('App.tsx', content);
console.log("Added CreateFifaWorldCupView to App.tsx");
