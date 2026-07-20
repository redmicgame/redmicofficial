const fs = require('fs');

let file = '/app/applet/components/AppleMusicView.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetAlbums = \`const albums = availableReleases.filter(r => r.type === 'Album' || r.type === 'Album (Deluxe)' || r.type === 'Compilation').sort((a,b) => b.releaseDate.year - a.releaseDate.year);\`;
const replacementAlbums = \`const albums = availableReleases.filter(r => r.type === 'Album' || r.type === 'Album (Deluxe)').sort((a,b) => b.releaseDate.year - a.releaseDate.year);
        const compilations = availableReleases.filter(r => r.type === 'Compilation').sort((a,b) => b.releaseDate.year - a.releaseDate.year);
        const liveAlbums = availableReleases.filter(r => r.type === 'Live Album').sort((a,b) => b.releaseDate.year - a.releaseDate.year);\`;

content = content.replace(targetAlbums, replacementAlbums);

const targetAlbumsRender = \`{albums.length > 0 && (
                        <HorizontalSection title="Albums" items={albums} onSelect={handleSelectRelease} />
                    )}\`;
const replacementAlbumsRender = \`{albums.length > 0 && (
                        <HorizontalSection title="Albums" items={albums} onSelect={handleSelectRelease} />
                    )}
                    {liveAlbums.length > 0 && (
                        <HorizontalSection title="Live Albums" items={liveAlbums} onSelect={handleSelectRelease} />
                    )}
                    {compilations.length > 0 && (
                        <HorizontalSection title="Compilations" items={compilations} onSelect={handleSelectRelease} />
                    )}\`;

content = content.replace(targetAlbumsRender, replacementAlbumsRender);

fs.writeFileSync(file, content);
console.log("Patched AppleMusicView");
