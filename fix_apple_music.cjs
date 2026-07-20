const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/AppleMusicView.tsx', 'utf-8');

content = content.replace(
    '    const artistDisplay = (isSingle && singleSong && singleSong.collaboration)\n        ? `${activeArtist.name} & ${singleSong.collaboration.artistName}`\n        : activeArtist.name;',
    '    const artistDisplay = (isSingle && singleSong && (singleSong.collaboration || (singleSong.features && singleSong.features.length > 0)))\n        ? [activeArtist.name, ...(singleSong.features || []), ...(singleSong.collaboration ? [singleSong.collaboration.artistName] : [])].join(" & ")\n        : activeArtist.name;'
);

content = content.replace(
    '    const releaseTitle = (isSingle && singleSong && singleSong.collaboration)\n        ? release.title.replace(` (feat. ${singleSong.collaboration.artistName})`, \'\')\n        : release.title;',
    '    const releaseTitle = (isSingle && singleSong && singleSong.collaboration)\n        ? release.title.replace(new RegExp(` \\\\(feat\\\\. ${singleSong.collaboration.artistName}\\\\)`), \'\')\n        : release.title;'
);

content = content.replace(
    '                            const artistForSong = isUpcoming && !isRevealed ? null : (song.collaboration\n                                ? `${activeArtist.name} & ${song.collaboration.artistName}`\n                                : activeArtist.name);',
    '                            const artistForSong = isUpcoming && !isRevealed ? null : ((song.collaboration || (song.features && song.features.length > 0))\n                                ? [activeArtist.name, ...(song.features || []), ...(song.collaboration ? [song.collaboration.artistName] : [])].join(" & ")\n                                : activeArtist.name);'
);

content = content.replace(
    '                                    const songTitle = song.collaboration\n                                        ? song.title.replace(` (feat. ${song.collaboration.artistName})`, \'\')\n                                        : song.title;',
    '                                    const songTitle = song.collaboration\n                                        ? song.title.replace(new RegExp(` \\\\(feat\\\\. ${song.collaboration.artistName}\\\\)`), \'\')\n                                        : song.title;'
);

fs.writeFileSync('/app/applet/components/AppleMusicView.tsx', content);
console.log("Fixed Apple Music view");
