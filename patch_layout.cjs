const fs = require('fs');
let content = fs.readFileSync('components/SpotifyForCreatorsView.tsx', 'utf-8');

content = content
    .replace('min-h-screen text-black font-sans flex flex-col md:flex-row', 'min-h-screen md:h-screen text-black font-sans flex flex-col md:flex-row')
    .replace('<div className="flex-1 p-8 overflow-y-auto">', '<div className="flex-1 p-4 md:p-8 md:overflow-y-auto w-full max-w-[100vw]">')
    .replace('w-full md:w-64 bg-black text-white p-4 flex flex-col flex-shrink-0 h-auto md:min-h-screen', 'w-full md:w-64 bg-black text-white p-4 flex flex-col flex-shrink-0 h-auto md:h-screen');

fs.writeFileSync('components/SpotifyForCreatorsView.tsx', content);
