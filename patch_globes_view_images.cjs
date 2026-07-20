const fs = require('fs');
let content = fs.readFileSync('components/GoldenGlobesView.tsx', 'utf-8');

if (!content.includes('const gig = gigs.find(g => g.id === itemId);')) {
    content = content.replace(
        "const { goldenGlobeHistory, songs, releases, goldenGlobeBanner } = activeArtistData;",
        "const { goldenGlobeHistory, songs, releases, gigs, goldenGlobeBanner } = activeArtistData;"
    );

    const coverArtLogic = `
    const getItemCoverArt = (itemId: string) => {
        const song = songs.find(s => s.id === itemId);
        if (song) return song.coverArt;
        const release = releases.find(r => r.id === itemId);
        if (release) return release.coverArt;
        const gig = gigs.find(g => g.id === itemId);
        if (gig) return gig.imageUrl;
        return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(itemId) + '&background=random&color=fff';
    };
`;

    content = content.replace(
        /const getItemCoverArt = \(itemId: string\) => \{[\s\S]*?\};/,
        coverArtLogic
    );

    fs.writeFileSync('components/GoldenGlobesView.tsx', content);
    console.log("Patched GoldenGlobesView image lookup");
}
