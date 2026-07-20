const fs = require('fs');

['components/OscarsView.tsx', 'components/GoldenGlobesView.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    
    // the regex will match the recursively broken function and replace it with a clean one
    content = content.replace(
        /const getItemName = \(award: any\) => \{\s*if \(getItemName\(award\) && getItemName\(award\) !== 'N\/A' && getItemName\(award\) !== 'Unknown'\) return getItemName\(award\);\s*const song = songs\.find\(s => s\.id === award\.itemId\);\s*if \(song\) return song\.title;\s*const release = releases\.find\(r => r\.id === award\.itemId\);\s*if \(release\) return release\.title;\s*const role = \(activeArtistData\.actingRoles \|\| \[\]\)\.find\(r => r\.id === award\.itemId\);\s*if \(role\) return role\.title;\s*return getItemName\(award\);\s*\};/,
        `const getItemName = (award: any) => {
        if (award.itemName && award.itemName !== 'N/A' && award.itemName !== 'Unknown') return award.itemName;
        const song = songs.find(s => s.id === award.itemId);
        if (song) return song.title;
        const release = releases.find(r => r.id === award.itemId);
        if (release) return release.title;
        const role = (activeArtistData.actingRoles || []).find(r => r.id === award.itemId);
        if (role) return role.title;
        return award.itemName || 'Unknown';
    };`
    );
    
    fs.writeFileSync(file, content);
    console.log("Fixed " + file);
});
