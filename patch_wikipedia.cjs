const fs = require('fs');
let content = fs.readFileSync('components/WikipediaView.tsx', 'utf-8');

if (!content.includes('goldenGlobePlays')) {
    content = content.replace("const oscarPlays = activeArtistData?.oscarHistory || [];", "const oscarPlays = activeArtistData?.oscarHistory || [];\n                const goldenGlobePlays = activeArtistData?.goldenGlobeHistory || [];");
    content = content.replace("const relatedOscars = oscarPlays.filter(o => release.songIds.includes(o.itemId));", "const relatedOscars = oscarPlays.filter(o => release.songIds.includes(o.itemId));\n                const relatedGlobes = goldenGlobePlays.filter(g => g.itemId === release.id || release.songIds.includes(g.itemId));");
    content = content.replace("[...relatedGrammys, ...relatedAmas].forEach(award => {", "[...relatedGrammys, ...relatedAmas, ...relatedGlobes].forEach(award => {");
    
    // For artist Wikipedia:
    content = content.replace("const oscars = artistData.oscarHistory || [];", "const oscars = artistData.oscarHistory || [];\n                const globes = artistData.goldenGlobeHistory || [];");
    content = content.replace("const oscarWins = oscars.filter(g => g.isWinner).length;", "const oscarWins = oscars.filter(g => g.isWinner).length;\n                const globeWins = globes.filter(g => g.isWinner).length;");
    content = content.replace("- \${oscarWins} Academy Awards", "- \${oscarWins} Academy Awards\n- \${globeWins} Golden Globe Awards");

    fs.writeFileSync('components/WikipediaView.tsx', content);
    console.log("Patched WikipediaView");
}
