const fs = require('fs');
let content = fs.readFileSync('components/ManageLabelView.tsx', 'utf-8');

if (!content.includes('NPC_ARTIST_IMAGES')) {
    content = content.replace('import {', 'import { NPC_ARTIST_IMAGES,');
}

content = content.replace(/src=\{npcProfile\?\.coverArt \|\| `https:\/\/ui-avatars\.com\/api\/\?name=\$\{encodeURIComponent\(npc\.name\)\}&background=random&color=fff&size=250`\}/g, 'src={npcProfile?.coverArt || NPC_ARTIST_IMAGES[npc.name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(npc.name)}&background=random&color=fff&size=250`}');

content = content.replace(/src=\{npc\.coverArt \|\| `https:\/\/ui-avatars\.com\/api\/\?name=\$\{encodeURIComponent\(npc\.artist\)\}&background=random&color=fff&size=250`\}/g, 'src={npc.coverArt || NPC_ARTIST_IMAGES[npc.artist] || `https://ui-avatars.com/api/?name=${encodeURIComponent(npc.artist)}&background=random&color=fff&size=250`}');

content = content.replace(/selectedNpcToSign\?\.coverArt \|\|\s*gameState\.npcs\.find\(n => n\.artist === selectedNpcToRenew\?\.name\)\?\.coverArt \|\|\s*`https:\/\/ui-avatars\.com\/api\/\?name=\$\{encodeURIComponent\(selectedNpcToSign\?\.artist \|\| selectedNpcToRenew\?\.name \|\| ''\)\}&background=random&color=fff&size=250`/g, "selectedNpcToSign?.coverArt || gameState.npcs.find(n => n.artist === selectedNpcToRenew?.name)?.coverArt || NPC_ARTIST_IMAGES[selectedNpcToSign?.artist || selectedNpcToRenew?.name || ''] || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedNpcToSign?.artist || selectedNpcToRenew?.name || '')}&background=random&color=fff&size=250`");

fs.writeFileSync('components/ManageLabelView.tsx', content);
console.log('Patched ManageLabelView.tsx');
