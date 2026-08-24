import React, { useMemo, useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import BritAwardIcon from './icons/BritAwardIcon';
import CameraIcon from './icons/CameraIcon';

const BritsView: React.FC = () => {
    const { dispatch, activeArtist, activeArtistData } = useGame();
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!activeArtist || !activeArtistData) return null;

    const { britHistory, songs, releases, britBanner } = activeArtistData;
    const bannerUrl = britBanner || "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=400&fit=crop";

    const history = britHistory || [];

    const wins = useMemo(() => history.filter(g => g.isWinner).length, [history]);
    const nominations = useMemo(() => history.length, [history]);
    const risingStarWin = useMemo(() => history.some(g => g.category === 'BRITs Rising Star' && g.isWinner), [history]);

    const awardsByYear = useMemo(() => {
        const grouped: { [year: number]: typeof history } = {};
        for (const award of history) {
            if (!grouped[award.year]) {
                grouped[award.year] = [];
            }
            grouped[award.year].push(award);
        }
        return Object.entries(grouped).sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA));
    }, [history]);
    
    const [currentYearIndex, setCurrentYearIndex] = useState(0);

    const handleNextYear = () => {
        setCurrentYearIndex(prev => Math.max(0, prev - 1));
    };

    const handlePrevYear = () => {
        setCurrentYearIndex(prev => Math.min(awardsByYear.length - 1, prev + 1));
    };

    const getItemCoverArt = (itemId: string) => {
        const song = songs.find(s => s.id === itemId);
        if (song?.coverArt) return song.coverArt;
        const release = releases.find(r => r.id === itemId);
        if (release?.coverArt) return release.coverArt;
        return activeArtist.image;
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    dispatch({ type: 'UPDATE_BRIT_BANNER', payload: reader.result });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="h-full w-full bg-zinc-950 text-white flex flex-col overflow-hidden min-h-screen">
            {/* Hero / Banner */}
            <div 
                className="relative h-64 flex-shrink-0 cursor-pointer group bg-gradient-to-r from-blue-900 via-zinc-900 to-red-900 overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
            >
                <img 
                    src={bannerUrl} 
                    alt="BRIT Awards Banner" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/60" />
                
                <button 
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'CHANGE_VIEW', payload: 'game' }); }} 
                    className="absolute top-4 left-4 p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md z-10 transition-colors"
                >
                    <ArrowLeftIcon className="w-6 h-6 text-white" />
                </button>

                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                    <CameraIcon className="w-4 h-4 text-red-400" />
                    Change Banner
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleBannerUpload} 
                    accept="image/*" 
                    className="hidden" 
                />

                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-600/40 border border-red-500/50 rounded-2xl backdrop-blur-md shadow-lg shadow-red-950/40">
                            <BritAwardIcon className="w-8 h-8 text-red-400" />
                        </div>
                        <div>
                            <span className="text-xs uppercase tracking-widest font-black text-red-400 flex items-center gap-1">
                                🇬🇧 The BRIT Awards Official Archive
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-md">
                                {activeArtist.name}
                            </h1>
                        </div>
                    </div>
                    {risingStarWin && (
                        <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-400/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                            <span className="text-amber-400 text-sm font-black">★ BRITs Rising Star Recipient</span>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Main Content */}
            <main className="flex-grow p-4 md:p-6 max-w-4xl mx-auto w-full flex flex-col relative z-10 pb-20">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-zinc-900/60 border border-red-500/30 p-4 rounded-2xl text-center shadow-lg shadow-red-950/10 backdrop-blur-sm">
                        <p className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">
                            {wins}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mt-1">BRIT Wins</p>
                    </div>
                    <div className="bg-zinc-900/60 border border-blue-500/30 p-4 rounded-2xl text-center shadow-lg shadow-blue-950/10 backdrop-blur-sm">
                        <p className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-zinc-200">
                            {nominations}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mt-1">BRIT Nominations</p>
                    </div>
                </div>

                {/* History list */}
                <div className="flex-grow flex flex-col min-h-0 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 backdrop-blur-md">
                    {awardsByYear.length > 0 ? (
                        <>
                            <div className="border-b border-red-500/40 pb-3 mb-4 flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                                        <span>{parseInt(awardsByYear[currentYearIndex][0])} BRIT Awards</span>
                                        <span className="text-xs bg-red-600/30 border border-red-500/40 text-red-300 px-2 py-0.5 rounded-full font-bold">
                                            {awardsByYear[currentYearIndex][1].filter(a => a.isWinner).length} Won
                                        </span>
                                    </h2>
                                    <p className="text-xs text-zinc-400">Year {awardsByYear[currentYearIndex][0]} Ceremony Results</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handleNextYear} 
                                        disabled={currentYearIndex === 0} 
                                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors"
                                        title="Newer Year"
                                    >
                                        <ChevronLeftIcon className="w-5 h-5" />
                                    </button>
                                    <span className="text-xs text-zinc-400 font-mono font-medium px-1">
                                        {currentYearIndex + 1} / {awardsByYear.length}
                                    </span>
                                    <button 
                                        onClick={handlePrevYear} 
                                        disabled={currentYearIndex === awardsByYear.length - 1} 
                                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors"
                                        title="Older Year"
                                    >
                                        <ChevronRightIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="py-2 flex-grow space-y-3 overflow-y-auto pr-1">
                                {awardsByYear[currentYearIndex][1].map(award => {
                                    const isWin = award.isWinner;
                                    return (
                                        <div 
                                            key={award.itemId + award.category} 
                                            className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${
                                                isWin 
                                                    ? 'bg-gradient-to-r from-red-950/40 via-zinc-900/80 to-blue-950/40 border-red-500/50 shadow-md shadow-red-950/30' 
                                                    : 'bg-zinc-900/40 border-zinc-800/80'
                                            }`}
                                        >
                                            <img 
                                                src={getItemCoverArt(award.itemId)} 
                                                alt={award.itemName} 
                                                className="w-16 h-16 rounded-lg object-cover border border-zinc-700/50 shadow-sm shrink-0" 
                                            />
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                                        isWin 
                                                            ? 'bg-gradient-to-r from-amber-500 to-red-500 text-black font-black shadow-sm' 
                                                            : 'bg-zinc-800 text-zinc-400 font-bold'
                                                    }`}>
                                                        {isWin ? '🏆 WINNER' : 'NOMINEE'}
                                                    </span>
                                                    {award.category === 'BRITs Rising Star' && (
                                                        <span className="text-[11px] text-amber-300 font-semibold">
                                                            ★ Rising Star
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-zinc-100 truncate">{award.itemName}</p>
                                                <p className="text-xs text-zinc-400">{award.category}</p>
                                            </div>
                                            {isWin && (
                                                <div className="p-2 bg-red-600/20 border border-red-500/30 rounded-xl shrink-0">
                                                    <BritAwardIcon className="w-6 h-6 text-red-400" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-3">
                            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl">
                                <BritAwardIcon className="w-16 h-16 text-zinc-600" />
                            </div>
                            <p className="font-bold text-lg text-zinc-300">No BRIT Awards History Yet</p>
                            <p className="text-xs text-zinc-400 max-w-sm">
                                Submit your eligible releases during Week 10. Nominations are revealed in Week 13, and the grand ceremony takes place in Week 15!
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default BritsView;
