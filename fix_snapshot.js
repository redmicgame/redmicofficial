import fs from 'fs';

let code = `import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Release, Song } from '../types';
import { FastAverageColor } from 'fast-average-color';

const SpotifySnapshotView: React.FC<{ release: Release; onBack: () => void; }> = ({ release, onBack }) => {
    const { gameState, activeArtist, activeArtistData, dispatch } = useGame();
    const { date } = gameState;
    const [dominantColor, setDominantColor] = useState('#1e3a8a'); // Default dark blue
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!release.coverArt) return;
        const fac = new FastAverageColor();
        fac.getColorAsync(release.coverArt, { algorithm: 'dominant' })
            .then(color => {
                setDominantColor(color.hex);
            })
            .catch(e => {
                console.error("Error getting color", e);
            });
    }, [release.coverArt]);

    if (!activeArtist || !activeArtistData) return null;
    const { songs } = activeArtistData;

    const releaseSongs = release.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[];
    
    // Group songs
    let standardSongs: Song[] = [];
    let deluxeSongs: Song[] = [];
    
    if (release.standardEditionId && activeArtistData?.releases) {
        const standard = activeArtistData.releases.find(r => r.id === release.standardEditionId);
        if (standard) {
            const standardSongIds = new Set(standard.songIds);
            standardSongs = releaseSongs.filter(s => standardSongIds.has(s.id));
            deluxeSongs = releaseSongs.filter(s => !standardSongIds.has(s.id));
        } else {
            standardSongs = releaseSongs;
        }
    } else {
        standardSongs = releaseSongs;
    }

    const hasDeluxe = deluxeSongs.length > 0;

    const getRowData = (song: Song) => {
        const weekStreams = song.actualLastWeekStreams !== undefined ? song.actualLastWeekStreams : (song.lastWeekStreams || 0);
        const prevStreams = song.actualPrevWeekStreams !== undefined ? song.actualPrevWeekStreams : (song.prevWeekStreams || 0);
        
        let changePercentDisplay = '-';
        let changeDisplay = '-';
        
        if (prevStreams > 0) {
            const change = ((weekStreams - prevStreams) / prevStreams) * 100;
            changePercentDisplay = \`\${change >= 0 ? '+' : ''}\${change.toFixed(2)}%\`;
            const rawChange = weekStreams - prevStreams;
            changeDisplay = \`\${rawChange >= 0 ? '+' : ''}\${rawChange.toLocaleString()}\`;
        } else if (weekStreams > 0) {
            changePercentDisplay = '+NEW';
            changeDisplay = \`+\${weekStreams.toLocaleString()}\`;
        }

        return { weekStreams, prevStreams, changePercentDisplay, changeDisplay, netWeekly: weekStreams };
    };

    const renderRows = (songsToRender: Song[]) => {
        return songsToRender.map((song, index) => {
            const data = getRowData(song);
            const isNegative = data.netWeekly < 0;
            const isChangeNegative = data.changePercentDisplay.startsWith('-');
            return (
                <tr key={song.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100/50'}>
                    <td className="p-2 font-bold text-black border border-gray-300 text-center">{song.title}</td>
                    <td className="text-center p-2 text-gray-700 border border-gray-300">{(song.streams || 0).toLocaleString()}</td>
                    <td className={\`text-center p-2 font-bold border border-gray-300 \${isNegative ? 'text-red-600' : 'text-gray-800'}\`}>
                        {isNegative ? '' : '+'}{data.netWeekly.toLocaleString()}
                    </td>
                    <td className={\`text-center p-2 font-semibold border border-gray-300 border-r-0 \${isChangeNegative ? 'text-red-600' : 'text-green-600'}\`}>
                        {data.changePercentDisplay}
                    </td>
                    <td className={\`text-center p-2 font-semibold border border-gray-300 border-l-0 \${isChangeNegative ? 'text-red-600' : 'text-green-600'}\`}>
                        {data.changeDisplay}
                    </td>
                </tr>
            );
        });
    };

    const renderSubtotal = (songsList: Song[], label: string, bgColor: string) => {
        const totalStreams = songsList.reduce((acc, song) => acc + (song.streams || 0), 0);
        const totalWeeklyStreams = songsList.reduce((acc, song) => {
            const w = song.actualLastWeekStreams !== undefined ? song.actualLastWeekStreams : (song.lastWeekStreams || 0);
            return acc + w;
        }, 0);
        const totalPrevWeeklyStreams = songsList.reduce((acc, song) => {
            const p = song.actualPrevWeekStreams !== undefined ? song.actualPrevWeekStreams : (song.prevWeekStreams || 0);
            return acc + p;
        }, 0);

        let changePercentDisplay = '-';
        let changeDisplay = '-';
        if (totalPrevWeeklyStreams > 0) {
            const change = ((totalWeeklyStreams - totalPrevWeeklyStreams) / totalPrevWeeklyStreams) * 100;
            changePercentDisplay = \`\${change >= 0 ? '+' : ''}\${change.toFixed(2)}%\`;
            const rawChange = totalWeeklyStreams - totalPrevWeeklyStreams;
            changeDisplay = \`\${rawChange >= 0 ? '+' : ''}\${rawChange.toLocaleString()}\`;
        } else if (totalWeeklyStreams > 0) {
            changePercentDisplay = '+NEW';
            changeDisplay = \`+\${totalWeeklyStreams.toLocaleString()}\`;
        }

        return (
            <tr className="font-bold text-white border-y border-gray-300" style={{ backgroundColor: bgColor }}>
                <td className="p-2 text-center border-r border-gray-300/30">{label}</td>
                <td className="text-center p-2 border-r border-gray-300/30">{totalStreams.toLocaleString()}</td>
                <td className={\`text-center p-2 border-r border-gray-300/30\`}>
                    {totalWeeklyStreams >= 0 ? '+' : ''}{totalWeeklyStreams.toLocaleString()}
                </td>
                <td className={\`text-center p-2 border-r-0\`}>
                    {changePercentDisplay}
                </td>
                <td className={\`text-center p-2 border-l-0\`}>
                    {changeDisplay}
                </td>
            </tr>
        );
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    dispatch({ type: 'UPDATE_SNAPSHOT_BANNER', payload: { releaseId: release.id, bannerUrl: event.target.result as string }});
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 p-4 flex items-center justify-center overflow-auto" onClick={onBack}>
            <div className="w-full max-w-4xl shadow-2xl rounded-lg overflow-hidden relative font-sans min-w-[700px] my-auto" onClick={e => e.stopPropagation()} style={{ transform: \`scale(\${releaseSongs.length > 15 ? 0.8 : 1})\`, transformOrigin: 'center center' }}>
                
                {/* Banner Area */}
                <div 
                    className="w-full h-48 bg-zinc-800 relative cursor-pointer group flex items-center justify-between px-8 border-b-4 border-black overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                        backgroundImage: release.snapshotBanner ? \`url(\${release.snapshotBanner})\` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="absolute inset-0 bg-black/40 z-0 group-hover:bg-black/50 transition-colors" />
                    
                    <div className="relative z-10 flex items-center gap-6">
                        <img src={release.coverArt} className="w-32 h-32 rounded-sm shadow-xl" alt="Cover" />
                    </div>
                    
                    <div className="relative z-10 flex-grow text-center pointer-events-none">
                         {!release.snapshotBanner ? (
                            <div className="flex flex-col items-center">
                                <h1 className="text-5xl font-black text-white uppercase tracking-tighter drop-shadow-lg">{release.title}</h1>
                                <span className="text-white/80 font-bold mt-2">Tap to upload custom banner</span>
                            </div>
                         ) : null}
                    </div>

                    <div className="relative z-10 font-bold text-white/50 italic pointer-events-none">
                         Charts by Red Mic
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleBannerUpload} className="hidden" />
                </div>

                {/* Date Row */}
                <div className="p-2 text-center text-white font-bold tracking-wide" style={{ backgroundColor: dominantColor }}>
                    Week {date.week}, {date.year}
                </div>

                {/* Table */}
                <div className="bg-white text-black">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-black text-white">
                            <tr>
                                <th className="text-center p-3 font-bold border border-gray-600">Song</th>
                                <th className="text-center p-3 font-bold border border-gray-600">Total Streams</th>
                                <th className="text-center p-3 font-bold border border-gray-600">Weekly Streams</th>
                                <th className="text-center p-3 font-bold border border-gray-600" colSpan={2}>Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderRows(standardSongs)}
                            {hasDeluxe && renderSubtotal(standardSongs, "Standard Album", dominantColor)}
                            {hasDeluxe && renderRows(deluxeSongs)}
                            {hasDeluxe && renderSubtotal(deluxeSongs, "Deluxe", dominantColor + 'cc')} {/* Slight transparency for deluxe */}
                        </tbody>
                        <tfoot>
                            {renderSubtotal(releaseSongs, "TOTAL", "#000000")}
                        </tfoot>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-3 flex justify-between items-center text-sm font-semibold text-gray-600 bg-white border-t border-gray-300">
                    <span className="flex items-center gap-2">
                        <img src={activeArtist.image} className="w-5 h-5 rounded-full" alt="Artist"/>
                        @Red Mic
                    </span>
                    {gameState.difficultyMode && (
                        <span className="text-xs uppercase opacity-50 tracking-wider">
                            {gameState.difficultyMode} MODE
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpotifySnapshotView;
`;

fs.writeFileSync('components/SpotifySnapshotView.tsx', code);
