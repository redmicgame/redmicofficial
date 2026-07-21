const fs = require('fs');
const file = '/app/applet/components/AppsTab.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /\{ name: 'YouTube', description: 'Watch and share videos', icon: <YouTubeIcon className="w-8 h-8"\/>, view: 'youtube', bgColor: '#FF0000' \},/g,
    `{ name: 'YouTube', description: 'Watch and share videos', icon: <YouTubeIcon className="w-8 h-8"/>, view: 'youtube', bgColor: '#FF0000' },
            { name: 'Vevo', description: 'Distribute your music videos', icon: <span className="font-black text-2xl italic">vevo</span>, view: 'vevo', bgColor: '#FF0000' },`
);

fs.writeFileSync(file, content);
