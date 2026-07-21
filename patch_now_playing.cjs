const fs = require('fs');
const file = '/app/applet/components/SpotifyNowPlayingView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(song\.collaboration\) \{[\s\S]*?\} else if \(song\.isFeatureToNpc && song\.npcArtistName\)/;
const replacement = `if (song.features && song.features.length > 0) {
        song.features.forEach(f => {
            const collabProfile = allPlayerArtists.find(a => a.name === f);
            if (collabProfile) {
                artistsToDisplay.push({ name: collabProfile.name, image: collabProfile.image });
            } else {
                artistsToDisplay.push({ name: f, image: NPC_ARTIST_IMAGES[f] || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(f)}&background=random\` });
            }
        });
    } else if (song.collaboration) {
        const collabProfile = allPlayerArtists.find(a => a.name === song.collaboration?.artistName);
        if (collabProfile) {
            artistsToDisplay.push({ name: collabProfile.name, image: collabProfile.image });
        } else {
            artistsToDisplay.push({ name: song.collaboration.artistName, image: NPC_ARTIST_IMAGES[song.collaboration.artistName] || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(song.collaboration.artistName)}&background=random\` });
        }
    } else if (song.isFeatureToNpc && song.npcArtistName)`;

content = content.replace(regex, replacement);

content = content.replace(
    /<h1 className="text-2xl font-bold mb-1 truncate">\{song\.title\}<\/h1>/g,
    `<h1 className="text-2xl font-bold mb-1 truncate">{song.title.replace(/ \\(feat\\\. [^)]+\\)/g, '')}</h1>`
);
content = content.replace(
    /<h2 className="text-xl font-bold truncate">\{song\.title\}<\/h2>/g,
    `<h2 className="text-xl font-bold truncate">{song.title.replace(/ \\(feat\\\. [^)]+\\)/g, '')}</h2>`
);

fs.writeFileSync(file, content);
