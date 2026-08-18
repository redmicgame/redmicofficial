
import React, { useState } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { AlbumChartEntry } from '../types';
import SpotifyIcon from './icons/SpotifyIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import DownloadIcon from './icons/DownloadIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

const ChartRow: React.FC<{ entry: AlbumChartEntry; isDaily: boolean }> = ({ entry, isDaily }) => {
    const { rank, lastWeek, title, artist, coverArt, peak, weeksOnChart, weeklyActivity, dailyActivity } = entry;

    const displayActivity = isDaily
        ? (dailyActivity || Math.round((weeklyActivity || 0) / 7))
        : weeklyActivity;

    const renderMovement = () => {
        if (!lastWeek || lastWeek === rank) {
            return <ArrowRightIcon className="w-4 h-4 text-zinc-400" />;
        }
        if (rank < lastWeek) {
            return (
                <div className="flex items-center text-green-500">
                    <ArrowUpIcon className="w-4 h-4" />
                    <span className="text-xs font-semibold">{lastWeek - rank}</span>
                </div>
            );
        }
        return (
            <div className="flex items-center text-red-500">
                <ArrowDownIcon className="w-4 h-4" />
                <span className="text-xs font-semibold">{rank - lastWeek}</span>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-[auto_auto_1fr_auto] sm:grid-cols-[auto_auto_1fr_repeat(4,_minmax(0,_1fr))] items-center gap-2 sm:gap-4 py-2 text-sm">
            <div className="font-semibold text-zinc-400 w-6 text-center">{rank}</div>
            <div className="w-8 flex items-center justify-center">{renderMovement()}</div>
            <div className="flex items-center gap-3 min-w-0">
                <img src={coverArt} alt={title} className="w-10 h-10 rounded-sm object-cover flex-shrink-0" />
                <div className="min-w-0">
                    <p className="font-semibold truncate">{title}</p>
                    <p className="text-xs text-zinc-400 truncate">{artist}</p>
                </div>
            </div>
            <div className="hidden sm:block text-center text-zinc-400">{peak}</div>
            <div className="hidden sm:block text-center text-zinc-400">{lastWeek || '-'}</div>
            <div className="hidden sm:block text-center text-zinc-400">{weeksOnChart}</div>
            <div className="text-right text-zinc-300 font-medium">{formatNumber(displayActivity)}</div>
        </div>
    );
};

const SpotifyTopAlbumsView: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const { billboardTopAlbums = [], albumChartHistory = {}, date } = gameState;
    const [timeframe, setTimeframe] = useState<'weekly' | 'daily'>(gameState.timeMode === 'daily' ? 'daily' : 'weekly');

    const getWeekDate = (d: { week: number; year: number; day?: number }) => {
        const dayOffset = d.day !== undefined ? (d.day - 1) : 0;
        const dateObj = new Date(d.year, 0, (d.week - 1) * 7 + 1 + dayOffset);
        if (timeframe === 'daily') {
            return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
        return `Week of ${dateObj.toLocaleString('en-US', { month: 'short' })} ${dateObj.getDate()}`;
    };
    
    const longestAlbum = Object.entries(albumChartHistory).reduce((longest, [id, history]) => {
        if (!longest || history.weeksOnChart > longest.history.weeksOnChart) {
            const album = billboardTopAlbums.find(a => a.uniqueId === id) || gameState.npcAlbums?.find(a => a.uniqueId === id);
            if (album) return { album, history };
        }
        return longest;
    }, null as { album: { artist: string, title: string, coverArt: string }, history: any } | null);

    return (
        <div className="bg-[#121212] h-full overflow-y-auto text-white pb-24">
            <header className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <SpotifyIcon className="w-7 h-7" />
                    <h1 className="text-2xl font-bold">Charts</h1>
                </div>
                <button className="flex items-center gap-1 border border-zinc-600 rounded-full px-3 py-1 text-sm font-semibold">
                    Global <ChevronDownIcon className="w-4 h-4" />
                </button>
            </header>

            <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'spotifyChart' })} className="px-4 text-sm font-semibold text-zinc-400 flex items-center gap-1">
                <ChevronLeftIcon className="w-5 h-5" /> All Global Charts
            </button>
            
            {longestAlbum && (
                 <div className="p-4 mt-2">
                    <div className="bg-emerald-800 rounded-lg p-4 flex justify-between items-center">
                        <div className="w-2/3">
                            <p className="text-lg font-bold">“{longestAlbum.album.title}” by {longestAlbum.album.artist} has been on Top Albums Global the longest, at {longestAlbum.history.weeksOnChart} weeks straight.</p>
                             <p className="text-xs opacity-80 mt-1">Top Albums Global · {timeframe === 'daily' ? 'Daily Chart' : date.year}</p>
                        </div>
                        <img src={longestAlbum.album.coverArt} alt={longestAlbum.album.title} className="w-24 h-24 rounded-lg object-cover" />
                    </div>
                </div>
            )}
            
            <main className="p-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">{timeframe === 'daily' ? 'Daily' : 'Weekly'} Top Albums Global</h2>
                    <button className="w-10 h-10 rounded-full border border-zinc-600 flex items-center justify-center">
                        <DownloadIcon className="w-6 h-6 text-zinc-400" />
                    </button>
                </div>
                <p className="text-sm text-zinc-400">Your {timeframe === 'daily' ? 'daily' : 'weekly'} update of the most played albums right now.</p>
                
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {/* Timeframe Toggle */}
                    <div className="bg-zinc-800 p-1 rounded-full flex gap-1 border border-zinc-700">
                        <button 
                            onClick={() => setTimeframe('daily')}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${timeframe === 'daily' ? 'bg-emerald-500 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
                        >
                            Daily Streams
                        </button>
                        <button 
                            onClick={() => setTimeframe('weekly')}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${timeframe === 'weekly' ? 'bg-emerald-500 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
                        >
                            Weekly Streams
                        </button>
                    </div>
                    <button className="bg-zinc-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">{getWeekDate(date)}</button>
                </div>

                <div className="mt-4 border-b border-zinc-700 pb-2 text-xs text-zinc-500 font-semibold grid grid-cols-[auto_auto_1fr_auto] sm:grid-cols-[auto_auto_1fr_repeat(4,_minmax(0,_1fr))] gap-2 sm:gap-4 uppercase">
                    <div className="w-6 text-center">#</div>
                    <div className="w-8"></div>
                    <div>ALBUM</div>
                    <div className="hidden sm:block text-center">PEAK</div>
                    <div className="hidden sm:block text-center">PREV</div>
                    <div className="hidden sm:block text-center">STREAK</div>
                    <div className="text-right">{timeframe === 'daily' ? 'DAILY STREAMS' : 'WEEKLY STREAMS'}</div>
                </div>

                <div className="divide-y divide-zinc-800">
                    {billboardTopAlbums.map(entry => <ChartRow key={entry.uniqueId} entry={entry} isDaily={timeframe === 'daily'} />)}
                </div>
            </main>
        </div>
    );
};

export default SpotifyTopAlbumsView;