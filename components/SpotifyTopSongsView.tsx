
import React, { useState, useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { ChartEntry } from '../types';
import { getArtistImage } from '../constants';
import SpotifyIcon from './icons/SpotifyIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import DownloadIcon from './icons/DownloadIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import { getSpotifySongDetails, SpotifySongDetails } from '../utils/spotifyCredits';

export const ChartRow: React.FC<{
    entry: ChartEntry;
    isDaily: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    gameState: any;
}> = ({ entry, isDaily, isExpanded, onToggle, gameState }) => {
    const { rank, lastWeek, title, artist, coverArt, peak, weeksOnChart, weeklyStreams, dailyStreams } = entry;

    const displayStreams = isDaily
        ? (dailyStreams || Math.round(weeklyStreams / 7))
        : weeklyStreams;

    const details: SpotifySongDetails = useMemo(() => {
        return getSpotifySongDetails(entry, gameState, isDaily);
    }, [entry, gameState, isDaily]);

    const renderMovement = () => {
        if (!lastWeek || lastWeek === rank) {
            return <div className="text-gray-400 font-semibold text-xs">-</div>;
        }
        if (rank < lastWeek) {
            return (
                <div className="flex items-center text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    <ArrowUpIcon className="w-3 h-3 text-emerald-600" />
                    <span className="text-[10px] font-bold">{lastWeek - rank}</span>
                </div>
            );
        }
        return (
            <div className="flex items-center text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">
                <ArrowDownIcon className="w-3 h-3 text-rose-500" />
                <span className="text-[10px] font-bold">{rank - lastWeek}</span>
            </div>
        );
    };

    return (
        <div className="border-b border-gray-100 transition-colors">
            {/* Clickable Row Header */}
            <div
                onClick={onToggle}
                className="grid grid-cols-[auto_auto_1fr_auto] sm:grid-cols-[auto_auto_1fr_repeat(4,_minmax(0,_1fr))_auto] items-center gap-2 sm:gap-4 py-3 px-2 sm:px-3 hover:bg-gray-50/80 cursor-pointer rounded-lg transition-colors text-sm select-none"
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
            >
                {/* Rank & New Badge */}
                <div className="font-bold text-gray-900 w-7 text-center">
                    {rank}
                    {(!lastWeek && weeksOnChart === 1) && (
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded-full font-semibold block sm:inline sm:ml-1">
                            New
                        </span>
                    )}
                </div>

                {/* Movement Badge */}
                <div className="w-11 flex items-center justify-center">
                    {renderMovement()}
                </div>

                {/* Cover & Title */}
                <div className="flex items-center gap-3 min-w-0">
                    <img 
                        src={getArtistImage(artist, coverArt)} 
                        alt={title} 
                        onError={(e) => {
                            const fallback = getArtistImage(artist);
                            if (e.currentTarget.src !== fallback) {
                                e.currentTarget.src = fallback;
                            }
                        }}
                        className="w-12 h-12 rounded object-cover flex-shrink-0 shadow-sm" 
                    />
                    <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate leading-snug">{title}</p>
                        <p className="text-xs text-gray-500 truncate">{artist}</p>
                    </div>
                </div>

                {/* Desktop Stat Columns */}
                <div className="hidden sm:block text-center text-gray-600 font-medium">{peak}</div>
                <div className="hidden sm:block text-center text-gray-600 font-medium">{lastWeek || '—'}</div>
                <div className="hidden sm:block text-center text-gray-600 font-medium">{weeksOnChart}</div>
                <div className="text-right text-gray-700 font-medium">{formatNumber(displayStreams)}</div>

                {/* Expand / Collapse Chevron */}
                <div className="pl-1 sm:pl-2 text-gray-400 hover:text-gray-700 flex items-center justify-center">
                    {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-800" />
                    ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Accordion Expanded Detailed View (Spotify Charts Official Design) */}
            {isExpanded && (
                <div className="bg-white px-4 sm:px-12 py-5 border-t border-gray-100 text-sm transition-all duration-200">
                    <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[170px_1fr] items-start gap-y-5 gap-x-4 max-w-2xl">
                        <div className="font-bold text-gray-900">Producers</div>
                        <div className="text-gray-700 leading-relaxed">
                            {details.producers.length > 0 ? details.producers.join(', ') : '—'}
                        </div>

                        <div className="font-bold text-gray-900">Songwriters</div>
                        <div className="text-gray-800 leading-relaxed">
                            {details.songwriters.length > 0 ? (
                                details.songwriters.map((writer, i) => (
                                    <span key={i}>
                                        <span className="underline decoration-gray-400 underline-offset-2 hover:text-black hover:decoration-black cursor-pointer transition-colors">
                                            {writer}
                                        </span>
                                        {i < details.songwriters.length - 1 ? ', ' : ''}
                                    </span>
                                ))
                            ) : (
                                '—'
                            )}
                        </div>

                        <div className="font-bold text-gray-900">Source</div>
                        <div className="text-gray-700 font-medium">{details.source}</div>

                        <div className="font-bold text-gray-900">Peak</div>
                        <div className="text-gray-700">{details.peak}</div>

                        <div className="font-bold text-gray-900">{isDaily ? 'Prev Day' : 'Prev Week'}</div>
                        <div className="text-gray-700">{details.lastRank ?? '—'}</div>

                        <div className="font-bold text-gray-900">Streak</div>
                        <div className="text-gray-700">{details.streak}</div>

                        <div className="font-bold text-gray-900">Streams</div>
                        <div className="text-gray-700 font-medium">{details.streams.toLocaleString()}</div>

                        <div className="font-bold text-gray-900">Release Date</div>
                        <div className="text-gray-700">{details.releaseDate}</div>

                        <div className="font-bold text-gray-900">First entry date</div>
                        <div className="text-gray-700">{details.firstEntryDate}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SpotifyTopSongsView: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const { spotifyGlobal = [], spotifyUS = [], spotifyCanada = [], spotifyUK = [], spotifyLatin = [], spotifyAsia = [], spotifyAfrica = [], date } = gameState as any;
    const [region, setRegion] = useState<'Global' | 'US' | 'Canada' | 'UK' | 'Latin America' | 'Asia' | 'Africa'>('Global');
    const [timeframe, setTimeframe] = useState<'weekly' | 'daily'>(gameState.timeMode === 'daily' ? 'daily' : 'weekly');
    const [expandedSongIds, setExpandedSongIds] = useState<Set<string>>(new Set());

    const toggleSongExpanded = (uniqueId: string) => {
        setExpandedSongIds(prev => {
            const next = new Set(prev);
            if (next.has(uniqueId)) {
                next.delete(uniqueId);
            } else {
                next.add(uniqueId);
            }
            return next;
        });
    };

    const getWeekDate = (d: { week: number; year: number; day?: number }) => {
        const dayOffset = d.day !== undefined ? (d.day - 1) : 0;
        const dateObj = new Date(d.year, 0, (d.week - 1) * 7 + 1 + dayOffset);
        if (timeframe === 'daily') {
            return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
        return `Week of ${dateObj.toLocaleString('en-US', { month: 'short' })} ${dateObj.getDate()}`;
    };

    const currentChart = useMemo(() => {
        let baseList: ChartEntry[] = [];
        switch(region) {
            case 'US': baseList = spotifyUS; break;
            case 'Canada': baseList = spotifyCanada; break;
            case 'UK': baseList = spotifyUK; break;
            case 'Latin America': baseList = spotifyLatin; break;
            case 'Asia': baseList = spotifyAsia; break;
            case 'Africa': baseList = spotifyAfrica; break;
            default: baseList = spotifyGlobal; break;
        }

        // Augment player songs with exact daily stream values from songs state if available
        return baseList.map(entry => {
            if (entry.isPlayerSong && gameState.artistsData) {
                for (const artistId in gameState.artistsData) {
                    const song = gameState.artistsData[artistId]?.songs?.find((s: any) => s.id === entry.songId || s.title === entry.title);
                    if (song) {
                        const daily = song.lastDayStreams || (song.actualLastWeekStreams ? Math.round(song.actualLastWeekStreams / 7) : Math.round((song.lastWeekStreams || entry.weeklyStreams) / 7));
                        return { ...entry, dailyStreams: daily };
                    }
                }
            }
            return {
                ...entry,
                dailyStreams: entry.dailyStreams || Math.round(entry.weeklyStreams / 7)
            };
        });
    }, [spotifyGlobal, spotifyUS, spotifyCanada, spotifyUK, spotifyLatin, spotifyAsia, spotifyAfrica, region, gameState.artistsData]);
    
    const highestNewEntry = currentChart.find((s: ChartEntry) => s.lastWeek === null && s.weeksOnChart === 1);

    return (
        <div className="bg-[#121212] h-full overflow-y-auto text-white pb-24">
            {/* Top Navigation Bar */}
            <header className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <SpotifyIcon className="w-7 h-7" />
                    <h1 className="text-2xl font-bold">Charts</h1>
                </div>
                
                {/* Region Selector Pill in Top Bar */}
                <div className="relative">
                    <select 
                        value={region}
                        onChange={(e) => setRegion(e.target.value as any)}
                        className="appearance-none bg-zinc-800 text-white border border-zinc-600 rounded-full pl-4 pr-8 py-1.5 text-sm font-semibold outline-none cursor-pointer hover:bg-zinc-700 transition-colors"
                    >
                        <option value="Global">Global</option>
                        <option value="US">US</option>
                        <option value="Canada">Canada</option>
                        <option value="UK">UK</option>
                        <option value="Latin America">Latin America</option>
                        <option value="Asia">Asia</option>
                        <option value="Africa">Africa</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-400">
                        <ChevronDownIcon className="w-4 h-4" />
                    </div>
                </div>
            </header>

            <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'spotifyChart' })} className="px-4 text-sm font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                <ChevronLeftIcon className="w-5 h-5" /> All Global Charts
            </button>

            {highestNewEntry && (
                <div className="p-4 mt-2">
                    <div className="bg-rose-800 rounded-lg p-4 flex justify-between items-center shadow-lg">
                        <div className="w-2/3">
                            <p className="text-lg font-bold leading-snug">“{highestNewEntry.title}” by {highestNewEntry.artist} is the highest new entry on Top Songs {region} at #{highestNewEntry.rank}.</p>
                            <p className="text-xs opacity-80 mt-1">Top Songs {region} · {timeframe === 'daily' ? 'Daily Chart' : `Week of ${date.week}`}</p>
                        </div>
                        <img src={highestNewEntry.coverArt} alt={highestNewEntry.title} className="w-24 h-24 rounded-lg object-cover shadow-md" />
                    </div>
                </div>
            )}
            
            {/* White Spotify Charts Main Container */}
            <main className="p-4 sm:p-6 bg-white text-black mt-2 rounded-t-3xl min-h-full">
                {/* Spotify Charts Dropdown Selector Box (as seen in screenshot) */}
                <div className="mb-4">
                    <div className="relative inline-block w-full max-w-[220px]">
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value as any)}
                            className="w-full appearance-none bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2.5 pr-9 text-base font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                            <option value="Global">Global</option>
                            <option value="US">US</option>
                            <option value="Canada">Canada</option>
                            <option value="UK">UK</option>
                            <option value="Latin America">Latin America</option>
                            <option value="Asia">Asia</option>
                            <option value="Africa">Africa</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600">
                            <ChevronDownIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="border-b border-gray-200 mt-4 mb-2" />
                </div>

                <div className="flex justify-between items-center">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                        {timeframe === 'daily' ? 'Daily' : 'Weekly'} Top Songs {region}
                    </h2>
                    <button 
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        title="Download Chart Data"
                    >
                        <DownloadIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    Your {timeframe === 'daily' ? 'daily' : 'weekly'} update of the most played tracks right now. Tap any position to inspect credits, songwriters, producers, and label source.
                </p>
                
                <div className="flex items-center gap-2 mt-5 flex-wrap">
                    {/* Timeframe Toggle Buttons */}
                    <div className="bg-gray-100 p-1 rounded-full flex gap-1 border border-gray-300">
                        <button 
                            onClick={() => setTimeframe('daily')}
                            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${timeframe === 'daily' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
                        >
                            Daily Streams
                        </button>
                        <button 
                            onClick={() => setTimeframe('weekly')}
                            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${timeframe === 'weekly' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
                        >
                            Weekly Streams
                        </button>
                    </div>
                    <span className="border border-gray-300 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium text-gray-700 bg-white">
                        {getWeekDate(date)}
                    </span>
                </div>

                {/* Table Header */}
                <div className="mt-8 border-b border-gray-200 pb-2 text-xs text-gray-500 font-bold grid grid-cols-[auto_auto_1fr_auto] sm:grid-cols-[auto_auto_1fr_repeat(4,_minmax(0,_1fr))_auto] gap-2 sm:gap-4 uppercase">
                    <div className="w-7 text-center">#</div>
                    <div className="w-11 text-center">Trend</div>
                    <div>Track</div>
                    <div className="hidden sm:flex text-center items-center gap-1 justify-center"><span className="border border-gray-300 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[8px]">?</span> Peak</div>
                    <div className="hidden sm:flex text-center items-center gap-1 justify-center">Prev</div>
                    <div className="hidden sm:flex text-center items-center gap-1 justify-center"><span className="border border-gray-300 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[8px]">?</span> Streak</div>
                    <div className="text-right flex items-center gap-1 justify-end"><span className="border border-gray-300 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[8px]">?</span> {timeframe === 'daily' ? 'Daily Streams' : 'Weekly Streams'}</div>
                    <div className="w-5"></div>
                </div>

                {/* Song Positions List */}
                <div className="divide-y divide-gray-100">
                    {currentChart.map(entry => (
                        <ChartRow 
                            key={entry.uniqueId} 
                            entry={entry} 
                            isDaily={timeframe === 'daily'}
                            isExpanded={expandedSongIds.has(entry.uniqueId)}
                            onToggle={() => toggleSongExpanded(entry.uniqueId)}
                            gameState={gameState}
                        />
                    ))}
                    {currentChart.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            <p className="font-bold text-lg text-gray-800">Chart is empty</p>
                            <p className="text-sm mt-1">Progress the week to generate new chart data.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SpotifyTopSongsView;