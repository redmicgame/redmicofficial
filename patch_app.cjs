const fs = require('fs');
const file = '/app/applet/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /import YouTubeView from '\.\/components\/YouTubeView';/g,
    `import YouTubeView from './components/YouTubeView';\nimport VevoView from './components/VevoView';`
);

content = content.replace(
    /case 'youtube':\s*return <YouTubeView \/>;/g,
    `case 'youtube':
                    return <YouTubeView />;
                case 'vevo':
                    return <VevoView />;`
);

fs.writeFileSync(file, content);
