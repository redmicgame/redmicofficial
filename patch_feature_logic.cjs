const fs = require('fs');

const filesToPatch = [
    '/app/applet/components/SpotifyDiscographyView.tsx',
    '/app/applet/components/AppleMusicView.tsx',
    '/app/applet/components/SpotifyView.tsx'
];

filesToPatch.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes('const isFeature = release.isFeatureToNpc || !!featureSong;')) {
        content = content.replace(
            /const isFeature = release\.isFeatureToNpc \|\| \!\!featureSong;/,
            "const isFeature = release.type !== 'Live Album' && (release.isFeatureToNpc || !!featureSong);"
        );
        changed = true;
    }

    if (content.includes('const isFeature = (r: Release) => r.isFeatureToNpc || r.songIds.some(')) {
        content = content.replace(
            /const isFeature = \(r: Release\) => r\.isFeatureToNpc \|\| r\.songIds\.some/g,
            "const isFeature = (r: Release) => r.type !== 'Live Album' && (r.isFeatureToNpc || r.songIds.some"
        );
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Patched ' + file);
    }
});
