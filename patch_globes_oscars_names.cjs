const fs = require('fs');

['components/OscarsView.tsx', 'components/GoldenGlobesView.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    
    if (!content.includes('const getItemName =')) {
        const replacement = `    const getItemName = (award: any) => {
        if (award.itemName && award.itemName !== 'N/A' && award.itemName !== 'Unknown') return award.itemName;
        const song = songs.find(s => s.id === award.itemId);
        if (song) return song.title;
        const release = releases.find(r => r.id === award.itemId);
        if (release) return release.title;
        const role = (activeArtistData.actingRoles || []).find(r => r.id === award.itemId);
        if (role) return role.title;
        return award.itemName;
    };
    
    const getItemCoverArt =`;
        
        content = content.replace('const getItemCoverArt =', replacement);
        content = content.replace(/award\.itemName/g, 'getItemName(award)');
        fs.writeFileSync(file, content);
        console.log("Patched " + file);
    }
});
