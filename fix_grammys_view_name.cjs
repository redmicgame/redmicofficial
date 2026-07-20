const fs = require('fs');
let content = fs.readFileSync('components/GrammysView.tsx', 'utf-8');

const replacement = `    const getItemName = (award: { itemId: string, itemName: string, category: string }) => {
        if (award.itemName && award.itemName !== 'N/A' && award.itemName !== 'Unknown') return award.itemName;
        if (award.category === 'Best New Artist') return activeArtist.name;
        const song = songs.find(s => s.id === award.itemId);
        if (song) return song.title;
        const release = releases.find(r => r.id === award.itemId);
        if (release) return release.title;
        return award.itemName;
    };`;

content = content.replace(/const getItemName = [\s\S]*?award\.itemName;\\n    \};/, replacement);

fs.writeFileSync('components/GrammysView.tsx', content);
console.log("Fixed GrammysView");
