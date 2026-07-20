const fs = require('fs');
let content = fs.readFileSync('components/SpotifyForCreatorsView.tsx', 'utf-8');

content = content.replace(
    '<div className="bg-[#f0f0f0] min-h-screen md:h-screen text-black font-sans flex flex-col md:flex-row">',
    '<div className="bg-[#f0f0f0] h-full w-full text-black font-sans flex flex-col md:flex-row">'
);

content = content.replace(
    '<div className="w-full md:w-64 bg-black text-white p-4 flex flex-col flex-shrink-0 h-auto md:h-screen">',
    '<div className="w-full md:w-64 bg-black text-white p-4 flex flex-col flex-shrink-0 h-auto md:h-full">'
);

content = content.replace(
    '<div className="flex-1 p-4 md:p-8 md:overflow-y-auto w-full max-w-[100vw]">',
    '<div className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-[100vw]">'
);

content = content.replace(
    "className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${selectedPodcast?.id === pod.id ? 'bg-zinc-800' : 'hover:bg-zinc-900'}`}",
    "className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors flex-shrink-0 whitespace-nowrap ${selectedPodcast?.id === pod.id ? 'bg-zinc-800' : 'hover:bg-zinc-900'}`}"
);

content = content.replace(
    '<button onClick={handleCreatePodcast} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">',
    '<button onClick={handleCreatePodcast} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors flex-shrink-0 whitespace-nowrap">'
);

fs.writeFileSync('components/SpotifyForCreatorsView.tsx', content);
