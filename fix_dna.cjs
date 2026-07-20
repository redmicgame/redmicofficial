const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/SpotifySongDNAView.tsx', 'utf-8');

content = content.replace(
    '        ...(song.collaboration ? [song.collaboration.artistName] : []),',
    '        ...(song.features || []),\n        ...(song.collaboration ? [song.collaboration.artistName] : []),'
);

content = content.replace(
    '    if (song.collaboration) addRole(song.collaboration.artistName, "Featured Artist");',
    '    if (song.features) { song.features.forEach(f => addRole(f, "Featured Artist")); }\n    if (song.collaboration) addRole(song.collaboration.artistName, "Featured Artist");'
);

content = content.replace(
    '                            <span className="truncate">{new Date().getFullYear()} • {mainArtistName} {song.collaboration && `and ${song.collaboration.artistName}`}</span>',
    '                            <span className="truncate">{new Date().getFullYear()} • {[mainArtistName, ...(song.features || []), ...(song.collaboration ? [song.collaboration.artistName] : [])].join(", ")}</span>'
);

fs.writeFileSync('/app/applet/components/SpotifySongDNAView.tsx', content);
console.log("Fixed DNA view");
