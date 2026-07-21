const fs = require('fs');
const file = '/app/applet/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /import SpotifyChartView from '\.\/components\/SpotifyChartView';/g,
    `import SpotifyChartView from './components/SpotifyChartView';\nimport SpotifyVideoChartView from './components/SpotifyVideoChartView';`
);

content = content.replace(
    /case 'spotifyChart':\s*return <SpotifyChartView \/>;/g,
    `case 'spotifyChart':
                    return <SpotifyChartView />;
                case 'spotifyVideoChart':
                    return <SpotifyVideoChartView />;`
);

fs.writeFileSync(file, content);
