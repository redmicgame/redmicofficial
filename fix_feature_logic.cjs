const fs = require('fs');

const filesToPatch = [
    '/app/applet/components/SpotifyDiscographyView.tsx',
    '/app/applet/components/AppleMusicView.tsx',
    '/app/applet/components/SpotifyView.tsx'
];

filesToPatch.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // We replaced `(r: Release) => r.isFeatureToNpc || r.songIds.some` with `(r: Release) => r.type !== 'Live Album' && (r.isFeatureToNpc || r.songIds.some`.
    // But we forgot the closing parenthesis at the end of the line!
    // The line looks like: const isFeature = (r: Release) => r.type !== 'Live Album' && (r.isFeatureToNpc || r.songIds.some(id => ... ?.isFeatureToNpc);
    // So let's find `)?.isFeatureToNpc);` and replace with `)?.isFeatureToNpc));` if there is a mismatched parenthesis.
    
    // Specifically, let's just use regex to add the missing parenthesis.
    if (content.includes("&& (r.isFeatureToNpc || r.songIds.some")) {
        // Find the line
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("&& (r.isFeatureToNpc || r.songIds.some") && !lines[i].includes("?.isFeatureToNpc));")) {
                lines[i] = lines[i].replace("?.isFeatureToNpc);", "?.isFeatureToNpc));");
                changed = true;
            }
        }
        if (changed) {
            content = lines.join('\n');
            fs.writeFileSync(file, content);
            console.log('Fixed ' + file);
        }
    }
});
