import React, { useState, useMemo, useRef } from 'react';
import { useGame } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PlusIcon from './icons/PlusIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import PlayIcon from './icons/PlayIcon';
import CameraIcon from './icons/CameraIcon';
import { Song, Release, ChartHistory } from '../types';

interface UkEntryItem {
    id: string;
    title: string;
    artist: string;
    coverArt: string;
    dayStr: string;
    monthStr: string;
    yearStr: string;
    peak: number;
    weeks: number;
    weeksAtNo1?: number;
    chartRun?: number[];
    firstEntered?: { year: number; week: number };
}

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function numberToWord(num: number): string {
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
    if (num >= 0 && num <= 20) return words[num];
    return String(num);
}

function formatUkDateParts(entry?: { year: number; week: number } | null, fallbackYear: number = 2020) {
    if (!entry) {
        return { day: '15', month: 'JAN', year: String(fallbackYear) };
    }
    const monthIdx = Math.min(11, Math.max(0, Math.floor(((entry.week - 1) / 52) * 12)));
    const day = Math.min(28, Math.max(1, ((entry.week * 7) % 28) + 1));
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    return {
        day: dayStr,
        month: MONTH_NAMES[monthIdx] || 'JAN',
        year: String(entry.year)
    };
}

const UkChartHistoryView: React.FC = () => {
    const { gameState, dispatch, activeArtistData, activeArtist, activeArtistId } = useGame();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSinglesOpen, setIsSinglesOpen] = useState<boolean>(true);
    const [isAlbumsOpen, setIsAlbumsOpen] = useState<boolean>(false);
    const [selectedDetailItem, setSelectedDetailItem] = useState<UkEntryItem | null>(null);

    if (!activeArtistData || !activeArtist) {
        return <div className="h-full w-full p-6 text-zinc-800 bg-[#FAF9F5] overflow-y-auto">Loading UK Chart History...</div>;
    }

    const { songs, releases } = activeArtistData;

    // Handle banner upload
    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl && activeArtistId) {
                dispatch({
                    type: 'UPDATE_ARTIST_DATA',
                    payload: {
                        artistId: activeArtistId,
                        data: { ukBannerImage: dataUrl }
                    }
                });
            }
        };
        reader.readAsDataURL(file);
    };

    // Calculate UK Singles stats and entries
    const singlesData = useMemo(() => {
        const history: ChartHistory = gameState.ukSinglesChartHistory || {};
        const rawSongs: Song[] = [...songs];

        Object.values(gameState.artistsData).forEach(data => {
            data.songs?.forEach(song => {
                if (song.collaboration?.artistName === activeArtist.name) {
                    rawSongs.push({ ...song, title: `${song.title} (with ${song.collaboration.artistName})` });
                } else if (song.features && song.features.includes(activeArtist.name)) {
                    rawSongs.push({ ...song, title: `${song.title} (with ${activeArtist.name})` });
                }
            });
        });

        const charted: UkEntryItem[] = rawSongs
            .filter(song => history[song.id])
            .map(song => {
                const stat = history[song.id];
                const debut = stat.firstEntered || (song.releaseDate ? { year: song.releaseDate.year, week: song.releaseDate.week } : { year: gameState.date.year, week: gameState.date.week });
                const dateParts = formatUkDateParts(debut, gameState.date.year);

                return {
                    id: song.id,
                    title: song.title,
                    artist: activeArtist.name,
                    coverArt: song.coverArt || activeArtist.image,
                    dayStr: dateParts.day,
                    monthStr: dateParts.month,
                    yearStr: dateParts.year,
                    peak: stat.peak || 100,
                    weeks: stat.weeksOnChart || 1,
                    weeksAtNo1: stat.weeksAtNo1 || (stat.peak === 1 ? 1 : 0),
                    chartRun: stat.chartRun,
                    firstEntered: debut
                };
            })
            .sort((a, b) => {
                if (a.peak !== b.peak) return a.peak - b.peak;
                return b.weeks - a.weeks;
            });

        const no1s = charted.filter(s => s.peak === 1).length;
        const top10s = charted.filter(s => s.peak <= 10).length;
        const top40s = charted.filter(s => s.peak <= 40).length;
        const top75s = charted.filter(s => s.peak <= 75).length;

        // Up to 3 top 10 singles for the "Who is/Who are" intro
        const top10SinglesList = charted
            .filter(s => s.peak <= 10)
            .slice(0, 3)
            .map(s => s.title);

        return {
            items: charted,
            stats: { no1s, top10s, top40s, top75s },
            top10SinglesList
        };
    }, [gameState.ukSinglesChartHistory, songs, gameState.artistsData, activeArtist, gameState.date]);

    // Calculate UK Albums stats and entries
    const albumsData = useMemo(() => {
        const history: ChartHistory = gameState.ukAlbumsChartHistory || {};
        const rawAlbums = releases.filter(r => r.type !== 'Single');

        const charted: UkEntryItem[] = rawAlbums
            .filter(album => history[album.id])
            .map(album => {
                const stat = history[album.id];
                const debut = stat.firstEntered || (album.releaseDate ? { year: album.releaseDate.year, week: album.releaseDate.week } : { year: gameState.date.year, week: gameState.date.week });
                const dateParts = formatUkDateParts(debut, gameState.date.year);

                return {
                    id: album.id,
                    title: album.title,
                    artist: activeArtist.name,
                    coverArt: album.coverArt || activeArtist.image,
                    dayStr: dateParts.day,
                    monthStr: dateParts.month,
                    yearStr: dateParts.year,
                    peak: stat.peak || 100,
                    weeks: stat.weeksOnChart || 1,
                    weeksAtNo1: stat.weeksAtNo1 || (stat.peak === 1 ? 1 : 0),
                    chartRun: stat.chartRun,
                    firstEntered: debut
                };
            })
            .sort((a, b) => {
                if (a.peak !== b.peak) return a.peak - b.peak;
                return b.weeks - a.weeks;
            });

        const no1s = charted.filter(a => a.peak === 1).length;
        const top10s = charted.filter(a => a.peak <= 10).length;
        const top40s = charted.filter(a => a.peak <= 40).length;
        const top75s = charted.filter(a => a.peak <= 75).length;

        return {
            items: charted,
            stats: { no1s, top10s, top40s, top75s }
        };
    }, [gameState.ukAlbumsChartHistory, releases, activeArtist, gameState.date]);

    const isGroup = Boolean(gameState.group || activeArtist.type === 'Group' || activeArtist.isGroup);
    const top10SinglesCount = singlesData.stats.top10s;
    const bannerUrl = activeArtistData.ukBannerImage || activeArtist.image;

    // Format song list string for "Who is/Who are" intro: "Song 1, Song 2 and Song 3"
    const top10sString = useMemo(() => {
        const list = singlesData.top10SinglesList;
        if (list.length === 0) return '';
        if (list.length === 1) return list[0];
        if (list.length === 2) return `${list[0]} and ${list[1]}`;
        return `${list[0]}, ${list[1]} and ${list[2]}`;
    }, [singlesData.top10SinglesList]);

    return (
        <div className="h-full w-full bg-[#FAF9F5] text-zinc-900 pb-36 font-sans overflow-y-auto">
            {/* Hidden Banner File Input */}
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
            />

            {/* Top Interactive Banner Header */}
            <div className="relative w-full h-64 sm:h-80 bg-zinc-950 overflow-hidden group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img
                    src={bannerUrl}
                    alt={activeArtist.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

                {/* Back Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'CHANGE_VIEW', payload: 'misc' });
                    }}
                    className="absolute top-4 left-4 z-20 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>Back</span>
                </button>

                {/* Tap to Upload Hint Badge */}
                <div className="absolute top-4 right-4 z-20 bg-black/60 text-white/90 text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 border border-white/20 hover:bg-black/80 transition-colors">
                    <CameraIcon className="w-3.5 h-3.5" />
                    <span>Tap banner to change photo</span>
                </div>

                {/* Centered Bold White Artist/Group Name */}
                <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                    <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-wider drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                        {activeArtist.name}
                    </h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-5 pt-8">
                {/* "Who is / Who are" Intro Section (SKIPPED if 0 top 10s) */}
                {top10SinglesCount > 0 && (
                    <section className="mb-10 animate-fade-in">
                        <h2 className="text-[#FF2E93] font-black text-2xl sm:text-3xl mb-3 tracking-tight">
                            {isGroup ? `Who are ${activeArtist.name}?` : `Who is ${activeArtist.name}?`}
                        </h2>
                        <p className="text-base sm:text-lg text-zinc-900 font-medium leading-relaxed">
                            {activeArtist.name} scored {numberToWord(top10SinglesCount)} UK Top 10 singles including {top10sString}.
                        </p>
                    </section>
                )}

                {/* {ARTIST NAME} SONGS Section */}
                <section className="mb-10">
                    <h2 className="text-[#0022EB] font-black text-2xl sm:text-3xl uppercase tracking-tight mb-4">
                        {activeArtist.name} SONGS
                    </h2>
                    <div className="grid grid-cols-2 bg-white border border-pink-200 divide-x divide-y divide-pink-200 shadow-sm">
                        {/* UK No1s */}
                        <div className="p-6 text-center">
                            <div className="text-4xl sm:text-5xl font-black text-[#FF2E93] leading-none">
                                {singlesData.stats.no1s}
                            </div>
                            <div className="text-sm font-bold text-zinc-800 mt-2">
                                UK No1s
                            </div>
                        </div>

                        {/* UK Top 10s */}
                        <div className="p-6 text-center">
                            <div className="text-4xl sm:text-5xl font-black text-[#FF2E93] leading-none">
                                {singlesData.stats.top10s}
                            </div>
                            <div className="text-sm font-bold text-zinc-800 mt-2">
                                UK Top 10s
                            </div>
                        </div>

                        {/* UK Top 40s */}
                        <div className="p-6 text-center">
                            <div className="text-4xl sm:text-5xl font-black text-[#FF2E93] leading-none">
                                {singlesData.stats.top40s}
                            </div>
                            <div className="text-sm font-bold text-zinc-800 mt-2">
                                UK Top 40s
                            </div>
                        </div>

                        {/* UK Top 75s */}
                        <div className="p-6 text-center">
                            <div className="text-4xl sm:text-5xl font-black text-[#FF2E93] leading-none">
                                {singlesData.stats.top75s}
                            </div>
                            <div className="text-sm font-bold text-zinc-800 mt-2">
                                UK Top 75s
                            </div>
                        </div>
                    </div>
                </section>

                {/* {ARTIST NAME} ALBUMS Section */}
                <section className="mb-10">
                    <h2 className="text-[#0022EB] font-black text-2xl sm:text-3xl uppercase tracking-tight mb-4">
                        {activeArtist.name} ALBUMS
                    </h2>
                    <div className="grid grid-cols-2 bg-white border border-pink-200 divide-x divide-y divide-pink-200 shadow-sm">
                        {/* UK No1s */}
                        <div className="p-6 text-center">
                            <div className="text-4xl sm:text-5xl font-black text-[#FF2E93] leading-none">
                                {albumsData.stats.no1s}
                            </div>
                            <div className="text-sm font-bold text-zinc-800 mt-2">
                                UK No1s
                            </div>
                        </div>

                        {/* UK Top 10s */}
                        <div className="p-6 text-center">
                            <div className="text-4xl sm:text-5xl font-black text-[#FF2E93] leading-none">
                                {albumsData.stats.top10s}
                            </div>
                            <div className="text-sm font-bold text-zinc-800 mt-2">
                                UK Top 10s
                            </div>
                        </div>

                        {/* UK Top 40s */}
                        <div className="p-6 text-center">
                            <div className="text-4xl sm:text-5xl font-black text-[#FF2E93] leading-none">
                                {albumsData.stats.top40s}
                            </div>
                            <div className="text-sm font-bold text-zinc-800 mt-2">
                                UK Top 40s
                            </div>
                        </div>

                        {/* UK Top 75s */}
                        <div className="p-6 text-center">
                            <div className="text-4xl sm:text-5xl font-black text-[#FF2E93] leading-none">
                                {albumsData.stats.top75s}
                            </div>
                            <div className="text-sm font-bold text-zinc-800 mt-2">
                                UK Top 75s
                            </div>
                        </div>
                    </div>
                </section>

                {/* {ARTIST NAME} HITS Section */}
                <section className="mb-10">
                    <h2 className="text-[#0022EB] font-black text-2xl sm:text-3xl uppercase tracking-tight mb-4">
                        {activeArtist.name} HITS
                    </h2>

                    <div className="space-y-4">
                        {/* Official Singles Chart Accordion Button */}
                        <div>
                            <button
                                onClick={() => setIsSinglesOpen(prev => !prev)}
                                className="w-full bg-[#0022EB] hover:bg-[#001bc4] text-white font-black text-lg sm:text-xl rounded-2xl px-5 py-4 flex items-center justify-between shadow-md transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Official Charts Logo Icon */}
                                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center p-1 shadow-sm">
                                        <svg viewBox="0 0 24 24" className="w-full h-full text-[#0022EB] fill-current">
                                            <path d="M12 2L4 10h5v12h6V10h5L12 2z" transform="rotate(45 12 12)" />
                                        </svg>
                                    </div>
                                    <span className="tracking-wide">Official Singles Chart</span>
                                </div>
                                <div className="text-3xl font-black leading-none">
                                    {isSinglesOpen ? '—' : '+'}
                                </div>
                            </button>

                            {/* Singles List Content */}
                            {isSinglesOpen && (
                                <div className="mt-3 bg-[#FAF9F5] pt-2 animate-fade-in">
                                    <div className="text-xs font-bold text-zinc-600 flex items-center gap-1.5 px-2 mb-3">
                                        <span>🗂</span>
                                        <span>view as cards</span>
                                    </div>

                                    {singlesData.items.length > 0 ? (
                                        <div className="divide-y divide-zinc-200 border-t border-zinc-200">
                                            {singlesData.items.map(item => (
                                                <div key={item.id} className="py-4 px-2 flex items-center justify-between hover:bg-zinc-100/60 transition-colors">
                                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                        {/* Date Column */}
                                                        <div className="text-center w-12 shrink-0">
                                                            <div className="text-2xl sm:text-3xl font-black text-zinc-950 leading-none">
                                                                {item.dayStr}
                                                            </div>
                                                            <div className="text-[11px] sm:text-xs font-black text-zinc-950 tracking-wider mt-0.5">
                                                                {item.monthStr}
                                                            </div>
                                                            <div className="text-xs sm:text-sm font-black text-zinc-950">
                                                                {item.yearStr}
                                                            </div>
                                                        </div>

                                                        {/* Thumbnail / Cover Art with Play Button Overlay */}
                                                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 shadow-sm bg-zinc-200">
                                                            <img
                                                                src={item.coverArt}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                                <div className="w-7 h-7 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center text-zinc-900 shadow-sm">
                                                                    <PlayIcon className="w-4 h-4 translate-x-0.5" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Song Info */}
                                                        <div className="min-w-0">
                                                            <h4 className="text-base sm:text-lg font-black text-zinc-950 uppercase tracking-tight truncate">
                                                                {item.title}
                                                            </h4>
                                                            <p className="text-xs sm:text-sm italic text-zinc-600 truncate">
                                                                {item.artist}
                                                            </p>
                                                            <p className="text-xs sm:text-sm font-medium text-zinc-900 mt-0.5">
                                                                Peak: <span className="text-[#0022EB] font-black">{item.peak}</span>, Weeks: <span className="text-[#FF2E93] font-black">{item.weeks}</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Info Icon Button */}
                                                    <button
                                                        onClick={() => setSelectedDetailItem(item)}
                                                        className="p-2 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0 ml-2"
                                                    >
                                                        <InformationCircleIcon className="w-7 h-7" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center bg-white border border-pink-100 rounded-xl">
                                            <p className="text-zinc-500 font-medium">No UK Official Singles chart entries recorded yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Official Albums Chart Accordion Button */}
                        <div>
                            <button
                                onClick={() => setIsAlbumsOpen(prev => !prev)}
                                className="w-full bg-[#0022EB] hover:bg-[#001bc4] text-white font-black text-lg sm:text-xl rounded-2xl px-5 py-4 flex items-center justify-between shadow-md transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center p-1 shadow-sm">
                                        <svg viewBox="0 0 24 24" className="w-full h-full text-[#0022EB] fill-current">
                                            <path d="M12 2L4 10h5v12h6V10h5L12 2z" transform="rotate(45 12 12)" />
                                        </svg>
                                    </div>
                                    <span className="tracking-wide">Official Albums Chart</span>
                                </div>
                                <div className="text-3xl font-black leading-none">
                                    {isAlbumsOpen ? '—' : '+'}
                                </div>
                            </button>

                            {/* Albums List Content */}
                            {isAlbumsOpen && (
                                <div className="mt-3 bg-[#FAF9F5] pt-2 animate-fade-in">
                                    <div className="text-xs font-bold text-zinc-600 flex items-center gap-1.5 px-2 mb-3">
                                        <span>🗂</span>
                                        <span>view as cards</span>
                                    </div>

                                    {albumsData.items.length > 0 ? (
                                        <div className="divide-y divide-zinc-200 border-t border-zinc-200">
                                            {albumsData.items.map(item => (
                                                <div key={item.id} className="py-4 px-2 flex items-center justify-between hover:bg-zinc-100/60 transition-colors">
                                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                        {/* Date Column */}
                                                        <div className="text-center w-12 shrink-0">
                                                            <div className="text-2xl sm:text-3xl font-black text-zinc-950 leading-none">
                                                                {item.dayStr}
                                                            </div>
                                                            <div className="text-[11px] sm:text-xs font-black text-zinc-950 tracking-wider mt-0.5">
                                                                {item.monthStr}
                                                            </div>
                                                            <div className="text-xs sm:text-sm font-black text-zinc-950">
                                                                {item.yearStr}
                                                            </div>
                                                        </div>

                                                        {/* Cover Art */}
                                                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 shadow-sm bg-zinc-200">
                                                            <img
                                                                src={item.coverArt}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                                <div className="w-7 h-7 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center text-zinc-900 shadow-sm">
                                                                    <PlayIcon className="w-4 h-4 translate-x-0.5" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Album Info */}
                                                        <div className="min-w-0">
                                                            <h4 className="text-base sm:text-lg font-black text-zinc-950 uppercase tracking-tight truncate">
                                                                {item.title}
                                                            </h4>
                                                            <p className="text-xs sm:text-sm italic text-zinc-600 truncate">
                                                                {item.artist}
                                                            </p>
                                                            <p className="text-xs sm:text-sm font-medium text-zinc-900 mt-0.5">
                                                                Peak: <span className="text-[#0022EB] font-black">{item.peak}</span>, Weeks: <span className="text-[#FF2E93] font-black">{item.weeks}</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Info Icon Button */}
                                                    <button
                                                        onClick={() => setSelectedDetailItem(item)}
                                                        className="p-2 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0 ml-2"
                                                    >
                                                        <InformationCircleIcon className="w-7 h-7" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center bg-white border border-pink-100 rounded-xl">
                                            <p className="text-zinc-500 font-medium">No UK Official Albums chart entries recorded yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* Detail Modal when Info icon is clicked */}
            {selectedDetailItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedDetailItem(null)}>
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-zinc-900" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-4">
                            <img src={selectedDetailItem.coverArt} alt={selectedDetailItem.title} className="w-16 h-16 rounded-xl object-cover shadow" />
                            <div>
                                <h3 className="text-xl font-black text-zinc-950 uppercase leading-tight">{selectedDetailItem.title}</h3>
                                <p className="text-sm italic text-zinc-600">{selectedDetailItem.artist}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                            <div>
                                <span className="text-xs text-zinc-500 font-bold uppercase block">Peak Position</span>
                                <span className="text-2xl font-black text-[#0022EB]">#{selectedDetailItem.peak}</span>
                            </div>
                            <div>
                                <span className="text-xs text-zinc-500 font-bold uppercase block">Weeks on Chart</span>
                                <span className="text-2xl font-black text-[#FF2E93]">{selectedDetailItem.weeks} wks</span>
                            </div>
                            <div>
                                <span className="text-xs text-zinc-500 font-bold uppercase block">First Entered</span>
                                <span className="text-sm font-bold text-zinc-800">{selectedDetailItem.dayStr} {selectedDetailItem.monthStr} {selectedDetailItem.yearStr}</span>
                            </div>
                            <div>
                                <span className="text-xs text-zinc-500 font-bold uppercase block">Weeks at #1</span>
                                <span className="text-sm font-bold text-zinc-800">{selectedDetailItem.weeksAtNo1 || 0}</span>
                            </div>
                        </div>

                        {selectedDetailItem.chartRun && selectedDetailItem.chartRun.length > 0 && (
                            <div className="mb-4">
                                <span className="text-xs font-bold uppercase text-zinc-500 block mb-1">Official Chart Run</span>
                                <div className="font-mono text-xs bg-zinc-100 p-2.5 rounded-xl max-h-32 overflow-y-auto leading-relaxed border border-zinc-200">
                                    {selectedDetailItem.chartRun.map((pos, idx) => (
                                        <span key={idx} className={pos === selectedDetailItem.peak ? 'text-[#0022EB] font-black' : 'text-zinc-700'}>
                                            #{pos}{idx < selectedDetailItem.chartRun!.length - 1 ? ' - ' : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setSelectedDetailItem(null)}
                            className="w-full py-3 bg-[#0022EB] text-white font-bold rounded-xl hover:bg-[#001bc4] transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UkChartHistoryView;
