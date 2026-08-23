import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { Song, Release, ChartHistory } from '../types';

type BillboardCategory = 'hot100' | 'topAlbums' | 'hotPop' | 'hotRapRnb';

interface ChartItem {
    id: string;
    title: string;
    artist: string;
    coverArt?: string;
    debutDateStr: string;
    peakDateStr: string;
    peak: number;
    weeksAtPeak: number;
    weeksOnChart: number;
    chartRun?: number[];
    firstEntered?: { year: number; week: number };
}

function formatBillboardDate(entry?: { year: number; week: number } | null, fallbackYear: number = 2020): string {
    if (!entry) {
        const y = String(fallbackYear).slice(-2);
        return `1/15/${y}`;
    }
    const month = Math.min(12, Math.max(1, Math.floor(((entry.week - 1) / 52) * 12) + 1));
    const day = Math.min(28, Math.max(1, ((entry.week * 7) % 28) + 1));
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const yearStr = String(entry.year).slice(-2);
    return `${month}/${dayStr}/${yearStr}`;
}

const BillboardChartHistoryView: React.FC = () => {
    const { gameState, dispatch, activeArtistData, activeArtist } = useGame();
    const [selectedCategory, setSelectedCategory] = useState<BillboardCategory>('hot100');
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);

    if (!activeArtistData || !activeArtist) {
        return <div className="h-full w-full p-6 text-emerald-400 bg-zinc-950 overflow-y-auto">Loading Billboard History...</div>;
    }

    const { songs, releases } = activeArtistData;

    const { categoryTitle, items, stats } = useMemo(() => {
        let history: ChartHistory;
        let rawItems: (Song | Release)[];
        let title: string;

        switch (selectedCategory) {
            case 'topAlbums':
                history = gameState.albumChartHistory || {};
                rawItems = releases.filter(r => r.type !== 'Single');
                title = 'Billboard 200™';
                break;
            case 'hotPop':
                history = gameState.hotPopSongsHistory || {};
                rawItems = [...songs];
                title = 'Hot Pop Songs™';
                break;
            case 'hotRapRnb':
                history = gameState.hotRapRnbHistory || {};
                rawItems = [...songs];
                title = 'Hot Rap/R&B Songs™';
                break;
            case 'hot100':
            default:
                history = gameState.chartHistory || {};
                rawItems = [...songs];
                title = 'Billboard Hot 100™';
                break;
        }

        if (selectedCategory !== 'topAlbums') {
            Object.values(gameState.artistsData).forEach(data => {
                data.songs?.forEach(song => {
                    if (song.collaboration?.artistName === activeArtist.name) {
                        rawItems.push({ ...song, title: `${song.title} (with ${song.collaboration.artistName})` });
                    } else if (song.features && song.features.includes(activeArtist.name)) {
                        rawItems.push({ ...song, title: `${song.title} (with ${activeArtist.name})` });
                    }
                });
            });
        } else {
            Object.values(gameState.artistsData).forEach(data => {
                data.releases?.forEach(rel => {
                    if (rel.type !== 'Single' && !rawItems.some(r => r.id === rel.id)) {
                        if (rel.artistId === activeArtist.id) {
                            rawItems.push(rel);
                        }
                    }
                });
            });
        }

        const chartedItems: ChartItem[] = rawItems
            .filter(item => history[item.id])
            .map(item => {
                const stat = history[item.id];
                const chartRun = stat.chartRun || [];
                const peak = stat.peak || 100;
                
                // Calculate weeks at peak
                let weeksAtPeak = 1;
                if (chartRun.length > 0) {
                    weeksAtPeak = chartRun.filter(r => r === peak).length;
                } else if (stat.weeksAtNo1 && peak === 1) {
                    weeksAtPeak = stat.weeksAtNo1;
                }
                weeksAtPeak = Math.max(1, weeksAtPeak);

                // Calculate debut date
                const debut = stat.firstEntered || ('releaseDate' in item && item.releaseDate ? { year: item.releaseDate.year, week: item.releaseDate.week } : { year: gameState.date.year, week: gameState.date.week });
                const debutDateStr = formatBillboardDate(debut, gameState.date.year);

                // Calculate peak date
                let peakWeekObj = stat.peakDate;
                if (!peakWeekObj) {
                    let peakIdx = 0;
                    if (chartRun.length > 0) {
                        peakIdx = chartRun.findIndex(r => r === peak);
                        if (peakIdx === -1) peakIdx = 0;
                    }
                    const totalWeeksFromDebut = (debut.year * 52 + debut.week) + peakIdx;
                    peakWeekObj = {
                        year: Math.floor((totalWeeksFromDebut - 1) / 52),
                        week: ((totalWeeksFromDebut - 1) % 52) + 1
                    };
                }
                const peakDateStr = formatBillboardDate(peakWeekObj, debut.year);

                const displayTitle = item.title || ('name' in item ? (item as any).name : 'Untitled');

                return {
                    id: item.id,
                    title: displayTitle,
                    artist: activeArtist.name,
                    coverArt: 'coverArt' in item && item.coverArt ? item.coverArt : activeArtist.image,
                    debutDateStr,
                    peakDateStr,
                    peak,
                    weeksAtPeak,
                    weeksOnChart: stat.weeksOnChart || 1,
                    chartRun,
                    firstEntered: debut,
                };
            })
            .sort((a, b) => {
                if (a.peak !== b.peak) return a.peak - b.peak;
                return b.weeksOnChart - a.weeksOnChart;
            });

        const ones = chartedItems.filter(s => s.peak === 1).length;
        const top10s = chartedItems.filter(s => s.peak <= 10).length;
        const total = chartedItems.length;

        return {
            categoryTitle: title,
            items: chartedItems,
            stats: { ones, top10s, total }
        };
    }, [selectedCategory, gameState, songs, releases, activeArtist]);

    const isAlbumView = selectedCategory === 'topAlbums';

    return (
        <div className="h-full w-full bg-gradient-to-b from-[#0f241a] via-[#09150f] to-[#040805] text-white pb-32 overflow-y-auto">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-30 bg-[#09150f]/80 backdrop-blur-md px-4 py-3 border-b border-emerald-950/40 flex items-center justify-between">
                <button
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'misc' })}
                    className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 border border-emerald-900/30 transition-colors flex items-center gap-1 text-sm font-semibold"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <div className="text-center font-black tracking-widest text-xs uppercase text-emerald-400">
                    Billboard Chart History
                </div>
                <div className="w-9" />
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-4">
                {/* Artist Name in Huge Bold Neon Green Heading */}
                <h1 className="text-3xl sm:text-5xl font-black text-[#10F08B] tracking-tighter uppercase mb-4 text-center sm:text-left drop-shadow-[0_2px_12px_rgba(16,240,139,0.25)]">
                    {activeArtist.name}
                </h1>

                {/* Artist Portrait Card */}
                <div className="relative w-full aspect-square max-w-sm mx-auto mb-6 rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/20 bg-zinc-900">
                    <img
                        src={activeArtist.image}
                        alt={activeArtist.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Neon Green Billboard Banner */}
                <div className="w-full bg-[#10F08B] text-zinc-950 font-black text-lg sm:text-xl py-3 px-6 rounded-2xl text-center uppercase tracking-wider shadow-[0_4px_20px_rgba(16,240,139,0.3)] mb-4">
                    {categoryTitle}
                </div>

                {/* 3 Metric Summary Boxes */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-[#09120c] rounded-2xl border border-zinc-800/80 p-3 sm:p-4 text-center shadow-lg">
                        <div className="text-3xl sm:text-4xl font-black text-white leading-none">
                            {stats.ones}
                        </div>
                        <div className="w-8 h-[1px] bg-zinc-700 mx-auto my-2" />
                        <div className="text-[10px] sm:text-xs font-bold text-zinc-400 tracking-wider uppercase">
                            {isAlbumView ? 'NO. 1 ALBUMS' : 'NO. 1 HITS'}
                        </div>
                    </div>

                    <div className="bg-[#09120c] rounded-2xl border border-zinc-800/80 p-3 sm:p-4 text-center shadow-lg">
                        <div className="text-3xl sm:text-4xl font-black text-white leading-none">
                            {stats.total}
                        </div>
                        <div className="w-8 h-[1px] bg-zinc-700 mx-auto my-2" />
                        <div className="text-[10px] sm:text-xs font-bold text-zinc-400 tracking-wider uppercase">
                            {isAlbumView ? 'ALBUMS' : 'SONGS'}
                        </div>
                    </div>

                    <div className="bg-[#09120c] rounded-2xl border border-zinc-800/80 p-3 sm:p-4 text-center shadow-lg">
                        <div className="text-3xl sm:text-4xl font-black text-white leading-none">
                            {stats.top10s}
                        </div>
                        <div className="w-8 h-[1px] bg-zinc-700 mx-auto my-2" />
                        <div className="text-[10px] sm:text-xs font-bold text-zinc-400 tracking-wider uppercase">
                            {isAlbumView ? 'TOP 10 ALBUMS' : 'TOP 10 HITS'}
                        </div>
                    </div>
                </div>

                {/* Dropdown Selector */}
                <div className="relative mb-6">
                    <button
                        onClick={() => setIsDropdownOpen(prev => !prev)}
                        className="w-full bg-black border-2 border-[#10F08B] rounded-2xl px-5 py-3.5 flex items-center justify-between text-[#10F08B] font-bold text-base sm:text-lg shadow-md transition-all hover:bg-emerald-950/20"
                    >
                        <span>{categoryTitle}</span>
                        <ChevronDownIcon className={`w-6 h-6 text-[#10F08B] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#10F08B] rounded-2xl overflow-hidden shadow-2xl z-40 border border-[#10F08B] divide-y divide-emerald-800/30">
                            <button
                                onClick={() => { setSelectedCategory('hot100'); setIsDropdownOpen(false); }}
                                className={`w-full px-5 py-3.5 text-left font-black text-base sm:text-lg transition-colors ${selectedCategory === 'hot100' ? 'bg-zinc-950 text-[#10F08B]' : 'text-zinc-950 hover:bg-emerald-400'}`}
                            >
                                Billboard Hot 100™
                            </button>
                            <button
                                onClick={() => { setSelectedCategory('topAlbums'); setIsDropdownOpen(false); }}
                                className={`w-full px-5 py-3.5 text-left font-black text-base sm:text-lg transition-colors ${selectedCategory === 'topAlbums' ? 'bg-zinc-950 text-[#10F08B]' : 'text-zinc-950 hover:bg-emerald-400'}`}
                            >
                                Billboard 200™
                            </button>
                            <button
                                onClick={() => { setSelectedCategory('hotPop'); setIsDropdownOpen(false); }}
                                className={`w-full px-5 py-3.5 text-left font-black text-base sm:text-lg transition-colors ${selectedCategory === 'hotPop' ? 'bg-zinc-950 text-[#10F08B]' : 'text-zinc-950 hover:bg-emerald-400'}`}
                            >
                                Hot Pop Songs™
                            </button>
                            <button
                                onClick={() => { setSelectedCategory('hotRapRnb'); setIsDropdownOpen(false); }}
                                className={`w-full px-5 py-3.5 text-left font-black text-base sm:text-lg transition-colors ${selectedCategory === 'hotRapRnb' ? 'bg-zinc-950 text-[#10F08B]' : 'text-zinc-950 hover:bg-emerald-400'}`}
                            >
                                Hot Rap/R&B Songs™
                            </button>
                        </div>
                    )}
                </div>

                {/* Entry Cards List */}
                <div className="space-y-3">
                    {items.length > 0 ? (
                        items.map((item) => {
                            const isExpanded = expandedTrackId === item.id;
                            return (
                                <div
                                    key={item.id}
                                    className="bg-white text-zinc-950 rounded-2xl p-4 shadow-md border border-zinc-100 transition-all hover:shadow-lg"
                                >
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => setExpandedTrackId(isExpanded ? null : item.id)}
                                    >
                                        {/* Song/Album Title and Artist Header */}
                                        <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                                            {item.coverArt && (
                                                <img
                                                    src={item.coverArt}
                                                    alt={item.title}
                                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 shadow-sm border border-zinc-200"
                                                />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-base sm:text-lg font-black text-black tracking-tight leading-snug break-words">
                                                    {item.title}
                                                </h3>
                                                <p className="text-xs sm:text-sm font-semibold text-zinc-500 mt-0.5">
                                                    {item.artist}
                                                </p>
                                            </div>
                                        </div>

                                        {/* 4-Column Stats Grid */}
                                        <div className="grid grid-cols-4 gap-2 pt-3 items-center text-center">
                                            {/* Debut Date */}
                                            <div>
                                                <span className="block text-[9px] sm:text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">
                                                    DEBUT
                                                </span>
                                                <span className="font-bold text-xs sm:text-sm text-zinc-900 underline underline-offset-4 decoration-zinc-900">
                                                    {item.debutDateStr}
                                                </span>
                                            </div>

                                            {/* Peak Pos & Weeks at Peak Badge */}
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="block text-[9px] sm:text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">
                                                    PEAK
                                                </span>
                                                <span className="text-xl sm:text-2xl font-black text-black leading-none">
                                                    #{item.peak}
                                                </span>
                                                <span className="bg-[#10F08B] text-zinc-950 font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">
                                                    {item.weeksAtPeak} WKS
                                                </span>
                                            </div>

                                            {/* Peak Date */}
                                            <div>
                                                <span className="block text-[9px] sm:text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">
                                                    PEAK DATE
                                                </span>
                                                <span className="font-bold text-xs sm:text-sm text-zinc-900 underline underline-offset-4 decoration-zinc-900">
                                                    {item.peakDateStr}
                                                </span>
                                            </div>

                                            {/* Weeks on Chart */}
                                            <div>
                                                <span className="block text-[9px] sm:text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">
                                                    WEEKS
                                                </span>
                                                <span className="text-xl sm:text-2xl font-black text-black leading-none">
                                                    {item.weeksOnChart}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Chart Run Details */}
                                    {isExpanded && (
                                        <div className="mt-3 pt-3 border-t border-zinc-200 text-xs text-zinc-700 bg-zinc-50 -mx-4 -mb-4 p-4 rounded-b-2xl">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2 font-semibold">
                                                <div>
                                                    <span className="text-zinc-400 uppercase text-[10px] block font-bold">Debut</span>
                                                    <span>{item.firstEntered ? `Week ${item.firstEntered.week}, ${item.firstEntered.year}` : item.debutDateStr}</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-400 uppercase text-[10px] block font-bold">Peak Position</span>
                                                    <span className="font-bold text-black">#{item.peak} ({item.weeksAtPeak} weeks)</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-400 uppercase text-[10px] block font-bold">Total Weeks</span>
                                                    <span className="font-bold text-black">{item.weeksOnChart} weeks</span>
                                                </div>
                                            </div>
                                            {item.chartRun && item.chartRun.length > 0 && (
                                                <div>
                                                    <span className="text-zinc-400 uppercase text-[10px] block font-bold mb-1">Chart Run</span>
                                                    <div className="font-mono text-[11px] bg-white p-2 rounded-lg border border-zinc-200 overflow-x-auto whitespace-nowrap">
                                                        {item.chartRun.map((r, i) => (
                                                            <span key={i} className={r === item.peak ? 'text-emerald-600 font-bold' : ''}>
                                                                #{r}{i < item.chartRun!.length - 1 ? ' → ' : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-[#09120c] rounded-2xl border border-zinc-800 p-8 text-center text-zinc-400">
                            <p className="text-lg font-bold text-white mb-1">No Chart Entries Yet</p>
                            <p className="text-sm text-zinc-400">Release singles and albums to build your Billboard history!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillboardChartHistoryView;
