const fs = require('fs');
const file = '/app/applet/components/SongDNAProfileView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /if \(song\.collaboration && song\.collaboration\.artistName === contributorName\) return true;/g,
    `if (song.collaboration && song.collaboration.artistName === contributorName) return true;
            if (song.features && song.features.includes(contributorName)) return true;`
);

content = content.replace(
    /if \(song\.collaboration && song\.collaboration\.artistName === person\) return true;/g,
    `if (song.collaboration && song.collaboration.artistName === person) return true;
                if (song.features && song.features.includes(person)) return true;`
);

content = content.replace(
    /if \(song\.collaboration && song\.collaboration\.artistName\) uniqueCollabs\.add\(song\.collaboration\.artistName\);/g,
    `if (song.collaboration && song.collaboration.artistName) uniqueCollabs.add(song.collaboration.artistName);
                if (song.features) song.features.forEach(f => uniqueCollabs.add(f));`
);

content = content.replace(
    /if \(song\.collaboration && song\.collaboration\.artistName\) theirCollabs\.add\(song\.collaboration\.artistName\);/g,
    `if (song.collaboration && song.collaboration.artistName) theirCollabs.add(song.collaboration.artistName);
            if (song.features) song.features.forEach(f => theirCollabs.add(f));`
);

content = content.replace(
    /if \(song\.collaboration && song\.collaboration\.artistName === person\) roles\.push\("Featured Artist"\);/g,
    `if (song.collaboration && song.collaboration.artistName === person) roles.push("Featured Artist");
        if (song.features && song.features.includes(person)) roles.push("Featured Artist");`
);

fs.writeFileSync(file, content);
