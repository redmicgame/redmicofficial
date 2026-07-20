const fs = require('fs');
let content = fs.readFileSync('components/SpotifyNowPlayingView.tsx', 'utf-8');

if (!content.includes('NPC_ARTIST_IMAGES')) {
    content = content.replace('import {', 'import { NPC_ARTIST_IMAGES,');
}

content = content.replace(/image: `https:\/\/ui-avatars\.com\/api\/\?name=\$\{encodeURIComponent\(song\.collaboration\.artistName\)\}&background=random`/g, 'image: NPC_ARTIST_IMAGES[song.collaboration.artistName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.collaboration.artistName)}&background=random`');
content = content.replace(/image: `https:\/\/ui-avatars\.com\/api\/\?name=\$\{encodeURIComponent\(song\.npcArtistName\)\}&background=random`/g, 'image: NPC_ARTIST_IMAGES[song.npcArtistName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.npcArtistName)}&background=random`');

fs.writeFileSync('components/SpotifyNowPlayingView.tsx', content);
console.log('Patched SpotifyNowPlayingView.tsx');
