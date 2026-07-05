import re

with open('components/SpotifyReleaseDetailView.tsx', 'r') as f:
    content = f.read()

# Add discs memo
old_duration = """    const totalDuration = useMemo(() => {
        return releaseSongs.reduce((sum, song) => sum + song.duration, 0);
    }, [releaseSongs]);"""

new_duration = """    const totalDuration = useMemo(() => {
        return releaseSongs.reduce((sum, song) => sum + song.duration, 0);
    }, [releaseSongs]);

    const discs = useMemo(() => {
        if (!release) return [];
        if (release.standardEditionId) {
            const standard = releases.find(r => r.id === release.standardEditionId);
            if (standard) {
                const standardSongIds = new Set(standard.songIds);
                const disc1Songs = releaseSongs.filter(s => !standardSongIds.has(s.id));
                const disc2Songs = releaseSongs.filter(s => standardSongIds.has(s.id));
                return [
                    { name: 'Disc 1', songs: disc1Songs },
                    { name: 'Disc 2', songs: disc2Songs }
                ].filter(d => d.songs.length > 0);
            }
        }
        return [{ name: '', songs: releaseSongs }];
    }, [release, releaseSongs, releases]);"""

content = content.replace(old_duration, new_duration)

# Modify render
old_render = """                        <div className="mt-6 space-y-4">
                            {releaseSongs.map(song => (
                                <div key={song.id} className="flex items-center">
                                    <div className="flex-grow">
                                        <p className="font-semibold">{song.title}</p>
                                        <div className="flex items-center gap-2">
                                            {song.explicit && <span className="text-xs w-4 h-4 bg-zinc-600/80 text-zinc-300 font-bold rounded-sm flex items-center justify-center">E</span>}
                                            <p className="text-sm text-zinc-400">{activeArtist.name}</p>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setShowStatsModalForSong(song); }} className="p-2 -m-2">
                                     <DotsHorizontalIcon className="w-5 h-5 text-zinc-400" />
                                    </button>
                                </div>
                            ))}
                        </div>"""

new_render = """                        <div className="mt-6 space-y-8">
                            {discs.map((disc, index) => (
                                <div key={index} className="space-y-4">
                                    {disc.name && <h2 className="text-lg font-bold text-white mb-2">{disc.name}</h2>}
                                    {disc.songs.map(song => (
                                        <div key={song.id} className="flex items-center">
                                            <div className="flex-grow">
                                                <p className="font-semibold">{song.title}</p>
                                                <div className="flex items-center gap-2">
                                                    {song.explicit && <span className="text-xs w-4 h-4 bg-zinc-600/80 text-zinc-300 font-bold rounded-sm flex items-center justify-center">E</span>}
                                                    <p className="text-sm text-zinc-400">{activeArtist.name}</p>
                                                </div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); setShowStatsModalForSong(song); }} className="p-2 -m-2">
                                             <DotsHorizontalIcon className="w-5 h-5 text-zinc-400" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>"""

content = content.replace(old_render, new_render)

with open('components/SpotifyReleaseDetailView.tsx', 'w') as f:
    f.write(content)
