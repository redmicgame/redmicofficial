const fs = require('fs');

const filesToPatch = [
    '/app/applet/components/YouTubeStoreView.tsx',
    '/app/applet/components/SubmitForAmasView.tsx',
    '/app/applet/components/SpotifyDiscographyView.tsx',
    '/app/applet/components/WikipediaView.tsx',
    '/app/applet/components/ReleaseView.tsx',
    '/app/applet/components/AppleMusicView.tsx',
    '/app/applet/components/CatalogView.tsx',
    '/app/applet/components/SubmitForGrammysView.tsx',
    '/app/applet/components/StudioView.tsx',
    '/app/applet/components/AchievementsView.tsx',
    '/app/applet/components/AlbumSalesChartView.tsx'
];

filesToPatch.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // specific hack for AppleMusicView: don't touch the isolated 'Compilation' filtering that we already fixed.
    if (file.includes('AppleMusicView.tsx')) {
        // Just target the one line:
        content = content.replace(
            /(r\.type === 'Album' \|\| r\.type === 'EP' \|\| r\.type === 'Album \(Deluxe\)' \|\| r\.type === 'Compilation')/,
            "$1 || r.type === 'Live Album'"
        );
        changed = true;
    } else if (file.includes('AppleMusicForArtistsView.tsx')) {
        // already did this
    } else if (file.includes('ReleaseView.tsx')) {
        // r.type === 'Compilation' is inside the songsInEPOrAlbum check
        content = content.replace(
            /r\.type === 'EP' \|\| r\.type === 'Album' \|\| r\.type === 'Album \(Deluxe\)' \|\| r\.type === 'Compilation'/,
            "r.type === 'EP' || r.type === 'Album' || r.type === 'Album (Deluxe)' || r.type === 'Compilation' || r.type === 'Live Album'"
        );
        changed = true;
    } else {
        if (content.includes("r.type === 'Compilation'") && !content.includes("r.type === 'Live Album'")) {
            content = content.replace(/r\.type === 'Compilation'/g, "r.type === 'Compilation' || r.type === 'Live Album'");
            changed = true;
        }
        if (content.includes("s.release.type === 'Compilation'") && !content.includes("s.release.type === 'Live Album'")) {
            content = content.replace(/s\.release\.type === 'Compilation'/g, "s.release.type === 'Compilation' || s.release.type === 'Live Album'");
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Patched ' + file);
    }
});
