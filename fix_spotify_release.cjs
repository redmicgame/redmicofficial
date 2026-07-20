const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/SpotifyReleaseDetailView.tsx', 'utf-8');

content = content.replace(
    '                                            activeArtist.name,\n                                            ...(releaseSongs[0].collaboration ? [releaseSongs[0].collaboration.artistName] : []),\n                                            ...(releaseSongs[0].isFeatureToNpc && releaseSongs[0].npcArtistName ? [releaseSongs[0].npcArtistName] : []),',
    '                                            activeArtist.name,\n                                            ...(releaseSongs[0].features || []),\n                                            ...(releaseSongs[0].collaboration ? [releaseSongs[0].collaboration.artistName] : []),\n                                            ...(releaseSongs[0].isFeatureToNpc && releaseSongs[0].npcArtistName ? [releaseSongs[0].npcArtistName] : []),'
);

content = content.replace(
    '                                    <p className="text-[11px] text-zinc-300 mt-0.5">Main Artist {(() => {\n                                        const c = releaseSongs[0].collaboration;\n                                        return c ? `+ ${1} more` : \'\';\n                                    })()}</p>',
    '                                    <p className="text-[11px] text-zinc-300 mt-0.5">Main Artist {(() => {\n                                        const featuresCount = (releaseSongs[0].features || []).length;\n                                        const cCount = releaseSongs[0].collaboration ? 1 : 0;\n                                        const total = featuresCount + cCount;\n                                        return total > 0 ? `+ ${total} more` : \'\';\n                                    })()}</p>'
);

content = content.replace(
    '                                                    <p className="text-sm text-zinc-400">{activeArtist.name}</p>',
    '                                                    <p className="text-sm text-zinc-400">{[activeArtist.name, ...(song.features || []), ...(song.collaboration ? [song.collaboration.artistName] : []), ...(song.isFeatureToNpc && song.npcArtistName ? [song.npcArtistName] : [])].join(" • ")}</p>'
);

fs.writeFileSync('/app/applet/components/SpotifyReleaseDetailView.tsx', content);
console.log("Fixed spotify release");
