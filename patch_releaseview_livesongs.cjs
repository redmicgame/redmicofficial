const fs = require('fs');

let file = '/app/applet/components/ReleaseView.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetAvailableSongs = \`        if (releaseType === 'Compilation') {
            return songs.filter(s => s.isReleased && !s.isVaulted);
        }

        return songs.filter(s => (!s.isReleased || !songsInEPOrAlbum.has(s.id)) && !s.isVaulted);
    }, [songs, releases, releaseType]);\`;

const replacementAvailableSongs = \`        if (releaseType === 'Compilation') {
            return songs.filter(s => s.isReleased && !s.isVaulted);
        }
        
        if (releaseType === 'Live Album') {
            return songs.filter(s => s.title.endsWith(' - Live') && !s.isReleased && !s.isVaulted);
        }

        return songs.filter(s => (!s.isReleased || !songsInEPOrAlbum.has(s.id)) && !s.isVaulted && !s.title.endsWith(' - Live'));
    }, [songs, releases, releaseType]);\`;

content = content.replace(targetAvailableSongs, replacementAvailableSongs);

fs.writeFileSync(file, content);
console.log("Patched ReleaseView Live Songs");
