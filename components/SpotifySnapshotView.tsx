
import React, { useState, useMemo } from 'react';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { useGame } from '../context/GameContext';
import type { Release, Song } from '../types';

const SpotifySnapshotView: React.FC<{ release: Release; onBack: () => void; }> = ({ release, onBack }) => {
    const { gameState, activeArtist, activeArtistData } = useGame();
    const [currentDiscIndex, setCurrentDiscIndex] = useState(0);
    const { date } = gameState;

    if (!activeArtist || !activeArtistData) return null;
    const { songs } = activeArtistData;

    const releaseSongs = release.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[];
    
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

    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 p-4 flex items-center justify-center overflow-y-auto" onClick={onBack}>
            <div className="w-full max-w-2xl bg-white shadow-2xl rounded-lg overflow-hidden relative" onClick={e => e.stopPropagation()} style={{ transform: `scale(${activeSongs.length > 8 ? 8 / activeSongs.length : 1})` }}>
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

                {/* Red header */}
                <div className="bg-[#c83b37] p-6 text-white flex gap-6 items-center">
                    <img src={release.coverArt} className="w-36 h-36 rounded-lg shadow-lg flex-shrink-0" alt={release.title} />
                    <div className="flex flex-col justify-end">
                        <p className="font-semibold text-sm uppercase">{release.type.replace(" (Deluxe)", "")}</p>
                        <h1 className="text-4xl font-black leading-tight tracking-tighter">{release.title} {discs.length > 1 ? `(${discs[currentDiscIndex].name})` : ''}</h1>
                        <div className="flex items-center gap-2 mt-2">
                           <img src={activeArtist.image} className="w-6 h-6 rounded-full object-cover" alt={activeArtist.name}/>
                           <p className="text-sm font-semibold">{activeArtist.name} • Week {date.week}, {date.year}</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="text-black">
                    <table className="w-full text-sm">
                        <thead className="border-b-2 border-red-200">
                            <tr>
                                <th className="text-left p-2 font-semibold text-gray-500">Song</th>
                                <th className="text-right p-2 font-semibold text-gray-500">Total Streams</th>
                                <th className="text-right p-2 font-semibold text-gray-500">Weekly Streams</th>
                                <th className="text-right p-2 font-semibold text-gray-500">Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeSongs.map((song, index) => {
                                let changeDisplay = '-';
                                const weekStreams = song.actualLastWeekStreams !== undefined ? song.actualLastWeekStreams : (song.lastWeekStreams || 0);
                                const prevStreams = song.actualPrevWeekStreams !== undefined ? song.actualPrevWeekStreams : (song.prevWeekStreams || 0);
                                if (prevStreams > 0) {
                                    const change = ((weekStreams - prevStreams) / prevStreams) * 100;
                                    changeDisplay = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                                } else if (weekStreams > 0) {
                                    changeDisplay = '+NEW';
                                }

                                const netWeekly = weekStreams;
                                const isNegative = netWeekly < 0;

                                return (
                                    <tr key={song.id} className={index % 2 === 0 ? 'bg-white' : 'bg-red-50'}>
                                        <td className="p-2 font-bold text-black">{song.title}</td>
                                        <td className="text-right p-2 text-gray-700">{(song.streams || 0).toLocaleString()}</td>
                                        <td className={`text-right p-2 font-bold ${isNegative ? 'text-red-600' : 'text-gray-800'}`}>
                                            {isNegative ? '' : '+'}{netWeekly.toLocaleString()}
                                        </td>
                                        <td className={`text-right p-2 font-semibold ${changeDisplay.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                                            {changeDisplay}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-red-200 font-bold bg-gray-100">
                                <td className="p-2"></td>
                                <td className="text-right p-2 text-black">{totalStreams.toLocaleString()}</td>
                                <td className={`text-right p-2 ${totalWeeklyStreams < 0 ? 'text-red-600' : 'text-black'}`}>
                                    {totalWeeklyStreams >= 0 ? '+' : ''}{totalWeeklyStreams.toLocaleString()}
                                </td>
                                <td className={`text-right p-2 ${totalChangeDisplay.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                                    {totalChangeDisplay}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-3 flex justify-between items-center text-sm font-semibold text-gray-600 bg-white border-t border-gray-200">
                    <span>@Red Mic</span>
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
