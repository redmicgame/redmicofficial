import React, { useMemo } from 'react';
import { useGame, formatNumber, formatDuration } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import type { Song, ChartEntry } from '../types';

export const ChartPredictionsView: React.FC = () => {
    const { gameState, dispatch, activeArtistData, allPlayerArtists } = useGame();
    
    // Simulate real-time prediction
    const predictions = useMemo(() => {
        const entries: ChartEntry[] = [];
        
        let allContenders: {
            title: string;
            artist: string;
            weeklyStreams: number;
            coverArt: string;
            isPlayerSong: boolean;
            uniqueId: string;
        }[] = [];

        // Players songs
        for (const artistId in gameState.artistsData) {
            const aData = gameState.artistsData[artistId];
            const artist = allPlayerArtists.find(a => a.id === artistId);
            aData.songs.filter(s => s.isReleased).forEach(song => {
                allContenders.push({
                    title: song.title,
                    artist: artist?.name || song.npcArtistName || 'Unknown',
                    weeklyStreams: song.lastWeekStreams || Math.floor(Math.random() * 100),
                    coverArt: song.coverArt,
                    isPlayerSong: true,
                    uniqueId: song.id,
                });
            });
        }

        // NPCs
        gameState.npcs.forEach(npc => {
            const decay = Math.pow(0.85, npc.weeksSincePeak || 0);
            const weeklyStreams = Math.floor(npc.basePopularity * decay * (Math.random() * 0.4 + 0.8));
            allContenders.push({
                title: npc.title,
                artist: npc.artist,
                weeklyStreams: weeklyStreams,
                coverArt: npc.coverArt,
                isPlayerSong: false,
                uniqueId: npc.uniqueId,
            });
        });

        // Formulate points
        const hot100Contenders = allContenders.map(song => {
            const hash = song.uniqueId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const divisor = 750 + (hash % 250);
            let boost = 1;

            if (song.isPlayerSong) {
                // Approximate iTunes versions etc
                for (const artistId in gameState.artistsData) {
                    const aData = gameState.artistsData[artistId];
                    const s = aData.songs.find(x => x.id === song.uniqueId);
                    if (s) {
                        const currentWeek = gameState.date.year * 52 + gameState.date.week;
                        const pushWeek = aData.lastPushToItunesWeek;
                        if (aData.lastPushedSongId === song.uniqueId && pushWeek && currentWeek - pushWeek <= 1) {
                            boost += 4;
                        }
                        
                        if (s.itunesPrice === '$0.69') boost *= 2.5;
                        else if (s.itunesPrice === '$0.99') boost *= 1.5;
                        else if (s.itunesPrice === '$1.29') boost *= 0.9;
                        
                        // Promotion
                        if (s.promoBoostWeeks > 0) boost *= 1.15;
                        if (s.playlistBoostWeeks > 0) boost *= 1.1;

                        if (s.itunesVersions) {
                            boost *= (1 + s.itunesVersions.length * 0.2); // heuristic proxy for prediction
                        }
                    }
                }
            }

            const sales = Math.floor(song.weeklyStreams / divisor) * boost;
            const streamPoints = song.weeklyStreams * 0.5;
            const salesPoints = sales * 150 * 0.2;
            const radioPoints = (song.weeklyStreams * 0.005) * 80 * 0.3; 
            const points = streamPoints + salesPoints + radioPoints;
            
            return {
                ...song,
                points: Math.floor(points),
                pointsDiff: Math.floor(points * (Math.random() * 0.1 - 0.05)), // small +/- var
            };
        });

        hot100Contenders.sort((a, b) => b.points - a.points);
        return hot100Contenders.slice(0, 60);
    }, [gameState.artistsData, gameState.npcs, allPlayerArtists]);

    if (!activeArtistData) return null;

    if (!activeArtistData.chartPredictionsSubscription) {
        return (
            <div className="h-screen w-full bg-zinc-900 text-white flex flex-col items-center justify-center p-8">
                <header className="absolute top-0 left-0 w-full p-4 flex items-center gap-4">
                    <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'catalog'})} className="p-2 rounded-full hover:bg-white/10">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold">Talk of the Charts</h1>
                </header>
                <div className="bg-fuchsia-900/30 p-8 rounded-xl border border-fuchsia-500/50 max-w-sm text-center">
                    <ChartBarIcon className="w-16 h-16 text-fuchsia-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2 text-fuchsia-200">Early Hot 100 Predictions</h2>
                    <p className="text-zinc-300 mb-6 text-sm">Subscribe to see early predictions of the Hot 100 top 60, updating dynamically based on current trajectory.</p>
                    <button 
                        onClick={() => dispatch({ type: 'SUBSCRIBE_CHART_PREDICTIONS', payload: { cost: 1000 } })}
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                        Subscribe for $1,000 / week
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-gradient-to-b from-[#d99aff] via-fuchsia-200 to-indigo-600 overflow-y-auto text-black">
            <header className="p-4 flex items-center gap-4 sticky top-0 bg-white/20 backdrop-blur-md z-10 border-b border-white/20">
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'catalog'})} className="p-2 rounded-full hover:bg-black/10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-black text-fuchsia-400 rounded-full w-6 h-6 flex items-center justify-center -rotate-90">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </div>
                    <h1 className="text-xl font-bold text-black tracking-tight">@talkofthecharts</h1>
                </div>
            </header>
            
            <div className="p-4 space-y-6 max-w-4xl mx-auto pb-20">
                <div className="text-center mt-2 mb-6">
                    <h2 className="text-3xl font-black tracking-tight drop-shadow-md">Early Hot 100 Predictions</h2>
                    <p className="text-base font-medium opacity-80 uppercase mt-1">Week {gameState.date.week}, {gameState.date.year} chart</p>
                </div>

                <div className="bg-white/95 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl border border-white/40">
                    <table className="w-full text-sm text-left font-medium p-2 block sm:table overflow-x-auto">
                        <thead className="text-xs uppercase tracking-wider text-black border-b-2 border-black">
                            <tr>
                                <th className="py-3 px-2 text-center w-8">Rank</th>
                                <th className="py-3 px-2 text-center w-10">+/-</th>
                                <th className="py-3 px-2 text-left">Song</th>
                                <th className="py-3 px-2 text-right">Points</th>
                                <th className="py-3 px-2 text-center">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {predictions.map((p, i) => {
                                const rank = i + 1;
                                const lastRank = gameState.billboardHot100.find(entry => entry.uniqueId === p.uniqueId)?.rank || null;
                                let diffStr: React.ReactNode = <span className="text-black font-bold">=</span>;
                                let diffColor = 'bg-transparent';
                                if (lastRank === null) {
                                    diffStr = <span className="text-cyan-500 font-bold">NEW</span>;
                                    diffColor = 'bg-cyan-50';
                                } else if (rank < lastRank) {
                                    diffStr = <span className="text-green-600 font-bold">+{lastRank - rank}</span>;
                                    diffColor = 'bg-green-100';
                                } else if (rank > lastRank) {
                                    diffStr = <span className="text-red-500 font-bold">-{rank - lastRank}</span>;
                                    diffColor = 'bg-red-100';
                                }

                                const percentChangeRowBgStr = (p.pointsDiff < -1000) ? 'bg-red-300' : (p.pointsDiff > 1000 ? 'bg-green-100' : 'bg-transparent');
                                const displayDiffNum = (p.pointsDiff / p.points * 100).toFixed(0);

                                return (
                                    <tr key={p.uniqueId} className={`border-b border-zinc-200/50 ${diffColor} bg-opacity-30`}>
                                        <td className="py-2 px-2 text-center font-bold">{rank}</td>
                                        <td className="py-2 px-2 text-center text-xs">{diffStr}</td>
                                        <td className="py-2 px-2">
                                            <div className="flex items-center gap-3">
                                                <img src={p.coverArt} className="w-10 h-10 object-cover shadow-sm grayscale-[0.2]" />
                                                <div className="flex flex-col">
                                                    <span className="font-extrabold text-black leading-tight truncate max-w-[140px] sm:max-w-[200px]">{p.title}</span>
                                                    <span className="text-xs text-zinc-600">{p.artist}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-right font-black">{formatNumber(Math.floor(p.points / 1500))}</td>
                                        <td className={`py-2 px-2 text-center text-xs w-12 font-bold ${percentChangeRowBgStr}`}>
                                            {displayDiffNum === '0' ? '--' : `${displayDiffNum}%`}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="p-4 text-center text-white bg-[#8651c6] font-bold tracking-widest uppercase text-xs">
                        Top 60 available to subscribers
                    </div>
                </div>
            </div>
        </div>
    );
};
