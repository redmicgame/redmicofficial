const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const importTarget = `import MySpaceView from './components/MySpaceView';`;
const importReplacement = `import MySpaceView from './components/MySpaceView';
import CryptoView from './components/CryptoView';`;

const viewTarget = `return <MySpaceView />;`;
const viewReplacement = `return <MySpaceView />;
            case 'crypto':
                return <CryptoView />;`;

if (content.includes(importTarget)) {
    content = content.replace(importTarget, importReplacement);
    content = content.replace(viewTarget, viewReplacement);
    fs.writeFileSync('App.tsx', content);
    console.log('patched App.tsx');
}
