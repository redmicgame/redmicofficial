import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Release, Song, BritCategoryName } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import BritAwardIcon from './icons/BritAwardIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

const SubmitForBritsView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const { date } = gameState;
    const [selections, setSelections] = useState<{ [key in BritCategoryName]?: string }>({});

    if (!activeArtistData || !activeArtist) return null;

    const thisYearReleases = useMemo(() => {
        return activeArtistData.releases.filter(r => r.releaseDate.year === date.year);
    }, [activeArtistData.releases, date.year]);

    const eligibleAlbums = useMemo(() => {
        return thisYearReleases.filter(r => ['Album', 'EP', 'Album (Deluxe)', 'Compilation', 'Live Album'].includes(r.type));
    }, [thisYearReleases]);

    const eligibleSongs = useMemo(() => {
        const songIds = new Set(thisYearReleases.flatMap(r => r.songIds));
        return activeArtistData.songs.filter(s => songIds.has(s.id));
    }, [thisYearReleases, activeArtistData.songs]);

    // Rising Star: Can ONLY win once
    const isRisingStarEligible = useMemo(() => {
        return !activeArtistData.hasWonBritRisingStar;
    }, [activeArtistData.hasWonBritRisingStar]);

    // Best New Artist: Debut year check & hasn't submitted before
    const isNewArtistEligible = useMemo(() => {
        const firstReleaseYear = Math.min(...activeArtistData.releases.map(r => r.releaseDate.year), date.year);
        return !activeArtistData.hasSubmittedForBritNewArtist && firstReleaseYear === date.year;
    }, [activeArtistData.releases, activeArtistData.hasSubmittedForBritNewArtist, date.year]);

    const categories: BritCategoryName[] = [
        'Artist of the Year',
        'British Album of the Year',
        'Song of the Year',
        'BRITs Rising Star',
        'BRITs Best New Artist',
        'Best Pop Act',
        'Best Rap Act',
        'Best R&B Act',
        'Best Electronic Act',
    ];

    const handleSubmit = () => {
        const submissions = Object.entries(selections)
            .filter(([_, itemId]) => !!itemId)
            .map(([category, itemId]) => {
                const cat = category as BritCategoryName;
                let itemName = '';
                if (cat === 'Artist of the Year' || cat === 'BRITs Rising Star' || cat === 'BRITs Best New Artist' || cat.startsWith('Best ') && cat.endsWith(' Act')) {
                    // Could be artist name or selected song/album
                    const songMatch = eligibleSongs.find(s => s.id === itemId);
                    const albumMatch = eligibleAlbums.find(a => a.id === itemId);
                    if (songMatch) itemName = songMatch.title;
                    else if (albumMatch) itemName = albumMatch.title;
                    else itemName = activeArtist.name;
                } else if (cat === 'British Album of the Year') {
                    itemName = eligibleAlbums.find(a => a.id === itemId)?.title || activeArtist.name;
                } else {
                    itemName = eligibleSongs.find(s => s.id === itemId)?.title || activeArtist.name;
                }
                return { artistId: activeArtist.id, category: cat, itemId: itemId!, itemName };
            });

        const email = activeArtistData.inbox.find(e => e.offer?.type === 'britSubmission' && !e.offer.isSubmitted)
            || activeArtistData.inbox.find(e => e.offer?.type === 'britSubmission');
        const emailId = email ? email.id : 'brit_submission_fallback';
        dispatch({ type: 'SUBMIT_FOR_BRITS', payload: { submissions, emailId } });
    };

    return (
        <div className="h-full w-full bg-zinc-950 text-white flex flex-col min-h-screen">
            {/* Header */}
            <header className="p-4 flex items-center justify-between sticky top-0 bg-gradient-to-r from-blue-950 via-red-950 to-zinc-900 backdrop-blur-md z-20 border-b border-red-800/40">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'inbox' })} 
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-600/30 border border-red-500/40 rounded-lg">
                            <BritAwardIcon className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                                BRIT Awards Submissions
                                <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {date.year}
                                </span>
                            </h1>
                            <p className="text-xs text-zinc-400">Select your work for consideration by the BRITs voting academy</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={Object.keys(selections).length === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-red-900/30 transition-all text-sm"
                >
                    <CheckCircleIcon className="w-4 h-4" />
                    Submit Entry
                </button>
            </header>

            {/* Submission Form */}
            <main className="flex-grow p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6 overflow-y-auto pb-24">
                <div className="bg-gradient-to-br from-blue-900/20 via-zinc-900/60 to-red-900/20 border border-red-700/30 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                        <BritAwardIcon className="w-7 h-7 text-red-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-zinc-300 space-y-1">
                            <p className="font-semibold text-zinc-100">Official BRIT Awards Guidelines ({date.year})</p>
                            <p>All music released in {date.year} is eligible. Nominations will be revealed in Week 13, followed by the prestigious award ceremony in Week 15.</p>
                            <p className="text-amber-300/90 font-medium">★ BRITs Rising Star: Artists may only win once. Artists having breakout streaming momentum this year receive higher voting favorability.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {categories.map((cat) => {
                        let options: { id: string; title: string; subtitle?: string }[] = [];
                        let disabled = false;
                        let disabledText = '';

                        const isAlbumCategory = cat === 'British Album of the Year';
                        const isSongCategory = cat === 'Song of the Year';
                        const isArtistCategory = cat === 'Artist of the Year';
                        const isRisingStar = cat === 'BRITs Rising Star';
                        const isNewArtist = cat === 'BRITs Best New Artist';
                        const isPopAct = cat === 'Best Pop Act';
                        const isRapAct = cat === 'Best Rap Act';
                        const isRnbAct = cat === 'Best R&B Act';
                        const isElectronicAct = cat === 'Best Electronic Act';

                        if (isRisingStar) {
                            if (!isRisingStarEligible) {
                                disabled = true;
                                disabledText = 'Already won BRITs Rising Star previously (can only win once).';
                            } else {
                                options = [{ id: activeArtist.id, title: activeArtist.name, subtitle: 'Artist Profile' }];
                            }
                        } else if (isNewArtist) {
                            if (!isNewArtistEligible) {
                                disabled = true;
                                disabledText = 'Only eligible in your debut release year.';
                            } else {
                                options = [{ id: activeArtist.id, title: activeArtist.name, subtitle: 'Artist Profile' }];
                            }
                        } else if (isArtistCategory) {
                            options = [{ id: activeArtist.id, title: activeArtist.name, subtitle: 'Artist Profile' }];
                        } else if (isAlbumCategory) {
                            options = eligibleAlbums.map(a => ({
                                id: a.id,
                                title: a.title,
                                subtitle: `${a.type} • ${a.firstWeekStreams ? a.firstWeekStreams.toLocaleString() + ' streams' : 'Released in ' + date.year}`
                            }));
                            if (options.length === 0) {
                                disabled = true;
                                disabledText = `No eligible albums released in ${date.year}.`;
                            }
                        } else if (isSongCategory) {
                            options = eligibleSongs.map(s => ({
                                id: s.id,
                                title: s.title,
                                subtitle: `${s.genre} • ${s.streams.toLocaleString()} streams`
                            }));
                            if (options.length === 0) {
                                disabled = true;
                                disabledText = `No eligible songs released in ${date.year}.`;
                            }
                        } else if (isPopAct) {
                            // Genre filtered songs, albums or artist
                            const popSongs = eligibleSongs.filter(s => s.genre === 'Pop');
                            const popAlbums = eligibleAlbums.filter(a => {
                                const relSongs = a.songIds.map(id => activeArtistData.songs.find(s => s.id === id)).filter((s): s is Song => !!s);
                                return relSongs.some(s => s.genre === 'Pop');
                            });
                            options = [
                                { id: activeArtist.id, title: `${activeArtist.name} (Artist Act)`, subtitle: 'Pop Category' },
                                ...popSongs.map(s => ({ id: s.id, title: s.title, subtitle: `Pop Single • ${s.streams.toLocaleString()} streams` })),
                                ...popAlbums.map(a => ({ id: a.id, title: a.title, subtitle: `Pop Release` }))
                            ];
                        } else if (isRapAct) {
                            const rapSongs = eligibleSongs.filter(s => s.genre === 'Hip Hop' || s.genre === 'Rap' || s.genre === 'Trap');
                            const rapAlbums = eligibleAlbums.filter(a => {
                                const relSongs = a.songIds.map(id => activeArtistData.songs.find(s => s.id === id)).filter((s): s is Song => !!s);
                                return relSongs.some(s => s.genre === 'Hip Hop' || s.genre === 'Rap');
                            });
                            options = [
                                { id: activeArtist.id, title: `${activeArtist.name} (Artist Act)`, subtitle: 'Rap / Hip-Hop Category' },
                                ...rapSongs.map(s => ({ id: s.id, title: s.title, subtitle: `Rap Single • ${s.streams.toLocaleString()} streams` })),
                                ...rapAlbums.map(a => ({ id: a.id, title: a.title, subtitle: `Rap Release` }))
                            ];
                        } else if (isRnbAct) {
                            const rnbSongs = eligibleSongs.filter(s => s.genre === 'R&B' || s.genre === 'Soul');
                            const rnbAlbums = eligibleAlbums.filter(a => {
                                const relSongs = a.songIds.map(id => activeArtistData.songs.find(s => s.id === id)).filter((s): s is Song => !!s);
                                return relSongs.some(s => s.genre === 'R&B');
                            });
                            options = [
                                { id: activeArtist.id, title: `${activeArtist.name} (Artist Act)`, subtitle: 'R&B Category' },
                                ...rnbSongs.map(s => ({ id: s.id, title: s.title, subtitle: `R&B Single • ${s.streams.toLocaleString()} streams` })),
                                ...rnbAlbums.map(a => ({ id: a.id, title: a.title, subtitle: `R&B Release` }))
                            ];
                        } else if (isElectronicAct) {
                            const elecSongs = eligibleSongs.filter(s => s.genre === 'Dance/Electronic' || s.genre === 'Electronic' || s.genre === 'Dance' || s.genre === 'House');
                            const elecAlbums = eligibleAlbums.filter(a => {
                                const relSongs = a.songIds.map(id => activeArtistData.songs.find(s => s.id === id)).filter((s): s is Song => !!s);
                                return relSongs.some(s => s.genre === 'Dance/Electronic' || s.genre === 'Electronic');
                            });
                            options = [
                                { id: activeArtist.id, title: `${activeArtist.name} (Artist Act)`, subtitle: 'Electronic / Dance Category' },
                                ...elecSongs.map(s => ({ id: s.id, title: s.title, subtitle: `Electronic Single • ${s.streams.toLocaleString()} streams` })),
                                ...elecAlbums.map(a => ({ id: a.id, title: a.title, subtitle: `Electronic Release` }))
                            ];
                        }

                        const selectedValue = selections[cat] || '';

                        return (
                            <div 
                                key={cat} 
                                className={`p-4 rounded-xl border transition-all ${
                                    selectedValue 
                                        ? 'bg-zinc-900/90 border-red-500/50 shadow-md shadow-red-950/20' 
                                        : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor={cat} className="text-base font-bold text-zinc-100 flex items-center gap-2">
                                        <span>{cat}</span>
                                        {selectedValue && (
                                            <span className="text-xs bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-medium">
                                                Selected
                                            </span>
                                        )}
                                    </label>
                                    {isRisingStar && (
                                        <span className="text-[11px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded font-medium">
                                            Once-in-career
                                        </span>
                                    )}
                                </div>

                                {disabled ? (
                                    <div className="text-xs text-zinc-400 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 italic">
                                        {disabledText || 'No eligible material for this category.'}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            id={cat}
                                            value={selectedValue}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSelections(prev => {
                                                    const next = { ...prev };
                                                    if (val) next[cat] = val;
                                                    else delete next[cat];
                                                    return next;
                                                });
                                            }}
                                            className="w-full bg-zinc-950/80 border border-zinc-700 hover:border-zinc-500 focus:border-red-500 text-zinc-200 text-sm rounded-lg p-3 outline-none transition-colors cursor-pointer"
                                        >
                                            <option value="">-- Choose item to submit --</option>
                                            {options.map((opt) => (
                                                <option key={opt.id} value={opt.id}>
                                                    {opt.title} {opt.subtitle ? `(${opt.subtitle})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={Object.keys(selections).length === 0}
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 hover:from-red-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl shadow-red-900/30 transition-all text-base flex items-center justify-center gap-2"
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        Submit {Object.keys(selections).length} Nomination{Object.keys(selections).length === 1 ? '' : 's'} for BRITs
                    </button>
                </div>
            </main>
        </div>
    );
};

export default SubmitForBritsView;
