const fs = require('fs');

let file = '/app/applet/components/ManagerPodcastsView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    `{(activeArtistData.releases || []).filter(r => r.isReleased).map(r => (`,
    `{(activeArtistData.releases || []).map(r => (`
);

content = content.replace(
    `<img src={podcast.coverArt || ''} alt={podcast.name} className="w-16 h-16 rounded-md object-cover bg-zinc-900" />`,
    `<img src={podcast.coverArt || ''} alt={podcast.name} className="w-16 h-16 rounded-md object-cover bg-zinc-900" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(podcast.name) + '&background=18181b&color=fff&size=128'; }} />`
);

fs.writeFileSync(file, content);
console.log("Patched podcasts");
