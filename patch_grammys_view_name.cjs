const fs = require('fs');
let content = fs.readFileSync('components/GrammysView.tsx', 'utf-8');

const nameLogic = `
    const getItemName = (award: { itemId: string, itemName: string, category: string }) => {
        if (award.itemName && award.itemName !== 'N/A' && award.itemName !== 'Unknown') return award.itemName;
        if (award.category === 'Best New Artist') return activeArtist.name;
        const song = songs.find(s => s.id === award.itemId);
        if (song) return song.title;
        const release = releases.find(r => r.id === award.itemId);
        if (release) return release.title;
        return award.itemName;
    };
`;

if (!content.includes('const getItemName =')) {
    content = content.replace('const getItemCoverArt =', nameLogic + '\n    const getItemCoverArt =');
    content = content.replace(/award\.itemName/g, 'getItemName(award)');
    // But be careful, we only want to replace {award.itemName} and alt={award.itemName}
    // We already replaced globally, let's fix the parameter to getItemName
    fs.writeFileSync('components/GrammysView.tsx', content);
    console.log("Patched GrammysView item name");
}
