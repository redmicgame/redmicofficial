import re

with open('components/SpotifySnapshotView.tsx', 'r') as f:
    content = f.read()

# Modify imports to add useState
content = content.replace("import React from 'react';", "import React, { useState, useMemo } from 'react';\nimport ChevronLeftIcon from './icons/ChevronLeftIcon';\nimport ChevronRightIcon from './icons/ChevronRightIcon';")

old_start = """const SpotifySnapshotView: React.FC<{ release: Release; onBack: () => void; }> = ({ release, onBack }) => {
    const { gameState, activeArtist, activeArtistData } = useGame();"""

new_start = """const SpotifySnapshotView: React.FC<{ release: Release; onBack: () => void; }> = ({ release, onBack }) => {
    const { gameState, activeArtist, activeArtistData } = useGame();
    const [currentDiscIndex, setCurrentDiscIndex] = useState(0);"""

content = content.replace(old_start, new_start)

# Add discs logic
old_logic = """    const releaseSongs = release.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[];
    
    const totalStreams = releaseSongs.reduce((acc, song) => acc + (song.streams || 0), 0);"""

new_logic = """    const releaseSongs = release.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[];
    
    const discs = useMemo(() => {
        if (release.standardEditionId && activeArtistData?.releases) {
            const standard = activeArtistData.releases.find(r => r.id === release.standardEditionId);
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
    }, [release, releaseSongs, activeArtistData?.releases]);

    const activeSongs = discs[currentDiscIndex]?.songs || [];

    const totalStreams = activeSongs.reduce((acc, song) => acc + (song.streams || 0), 0);
    const totalWeeklyStreams = activeSongs.reduce((acc, song) => acc + (song.actualLastWeekStreams !== undefined ? song.actualLastWeekStreams : (song.lastWeekStreams || 0)), 0);
    const totalPrevWeeklyStreams = activeSongs.reduce((acc, song) => acc + (song.actualPrevWeekStreams !== undefined ? song.actualPrevWeekStreams : (song.prevWeekStreams || 0)), 0);
    let totalChangeDisplay = '-';
    if (totalPrevWeeklyStreams > 0) {
        const change = ((totalWeeklyStreams - totalPrevWeeklyStreams) / totalPrevWeeklyStreams) * 100;
        totalChangeDisplay = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    } else if (totalWeeklyStreams > 0) {
        totalChangeDisplay = '+NEW';
    }
"""

content = re.sub(r'    const releaseSongs = release\.songIds\.map.*?\+NEW\';\n    \}', new_logic, content, flags=re.DOTALL)

old_table = """                        <tbody>
                            {releaseSongs.map((song, index) => {"""

new_table = """                        <tbody>
                            {activeSongs.map((song, index) => {"""

content = content.replace(old_table, new_table)

old_scale = """<div className="w-full max-w-2xl bg-white shadow-2xl rounded-lg overflow-hidden" onClick={e => e.stopPropagation()} style={{ transform: `scale(${releaseSongs.length > 8 ? 8 / releaseSongs.length : 1})` }}>"""
new_scale = """<div className="w-full max-w-2xl bg-white shadow-2xl rounded-lg overflow-hidden relative" onClick={e => e.stopPropagation()} style={{ transform: `scale(${activeSongs.length > 8 ? 8 / activeSongs.length : 1})` }}>
                {discs.length > 1 && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 pointer-events-none z-50">
                        {currentDiscIndex > 0 ? (
                            <button onClick={(e) => { e.stopPropagation(); setCurrentDiscIndex(prev => prev - 1); }} className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-md pointer-events-auto hover:bg-white text-black transition-colors">
                                <ChevronLeftIcon className="w-6 h-6" />
                            </button>
                        ) : <div />}
                        {currentDiscIndex < discs.length - 1 ? (
                            <button onClick={(e) => { e.stopPropagation(); setCurrentDiscIndex(prev => prev + 1); }} className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-md pointer-events-auto hover:bg-white text-black transition-colors">
                                <ChevronRightIcon className="w-6 h-6" />
                            </button>
                        ) : <div />}
                    </div>
                )}
"""
content = content.replace(old_scale, new_scale)

old_title = """<h1 className="text-4xl font-black leading-tight tracking-tighter">{release.title}</h1>"""
new_title = """<h1 className="text-4xl font-black leading-tight tracking-tighter">{release.title} {discs.length > 1 ? `(${discs[currentDiscIndex].name})` : ''}</h1>"""
content = content.replace(old_title, new_title)

with open('components/SpotifySnapshotView.tsx', 'w') as f:
    f.write(content)
