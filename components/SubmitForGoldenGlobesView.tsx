
import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Song, GoldenGlobeAward, FycBannerData } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ForYourConsiderationBanner from './ForYourConsiderationBanner';

type CategoryName = GoldenGlobeAward['category'];

const SubmitForGoldenGlobesView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const { date } = gameState;

    const [selections, setSelections] = useState<Partial<Record<CategoryName, string>>>({});
    const [showBannerPreview, setShowBannerPreview] = useState(false);

    if (!activeArtistData || !activeArtist) return null;

    const currentYearAlbums = useMemo(() => {
        return activeArtistData.releases.filter(r => r.releaseDate?.year === date.year && r.type === 'Album');
    }, [activeArtistData.releases, date.year]);

    const eligibleSoundtracks = useMemo(() => {
        const currentSoundtracks = currentYearAlbums.filter(r => r.isSoundtrack || r.soundtrackInfo);
        if (currentSoundtracks.length > 0) return currentSoundtracks;
        return activeArtistData.releases.filter(r => (r.isSoundtrack || r.soundtrackInfo) && r.type === 'Album');
    }, [currentYearAlbums, activeArtistData.releases]);

    const eligibleSongs = useMemo(() => {
        const currentYearReleases = activeArtistData.releases.filter(r => r.releaseDate?.year === date.year);
        const currentYearReleaseIds = new Set(currentYearReleases.map(r => r.id));
        const currentYearSongIds = new Set(currentYearReleases.flatMap(r => r.songIds || []));
        const currentSongs = activeArtistData.songs.filter(s => 
            s.soundtrackTitle && (
                (s.releaseId && currentYearReleaseIds.has(s.releaseId)) ||
                currentYearSongIds.has(s.id)
            )
        );
        if (currentSongs.length > 0) return currentSongs;
        return activeArtistData.songs.filter(s => s.soundtrackTitle);
    }, [activeArtistData.releases, activeArtistData.songs, date.year]);
        
    const eligibleActingRoles = useMemo(() => {
        const roles = activeArtistData.actingRoles || [];
        const currentYearRoles = roles.filter(g => 
           (g.year === date.year || !g.year) && (g.status === 'Released' || g.status === 'Completed')
        );
        if (currentYearRoles.length > 0) return currentYearRoles;
        return roles.filter(g => g.status === 'Released' || g.status === 'Completed');
    }, [activeArtistData.actingRoles, date.year]);
        
    const eligibleMovies = useMemo(() => {
        const movies = eligibleActingRoles.filter(r => r.type === 'Movie' || r.type === 'Tour Documentary');
        return movies.length > 0 ? movies : eligibleActingRoles;
    }, [eligibleActingRoles]);

    const eligibleTVShows = useMemo(() => {
        const tv = eligibleActingRoles.filter(r => r.type === 'TV Show');
        return tv.length > 0 ? tv : eligibleActingRoles;
    }, [eligibleActingRoles]);

    const eligibleLeading = useMemo(() => {
        const leading = eligibleActingRoles.filter(r => r.type !== 'Voice Acting' && r.roleType !== 'Supporting Role');
        return leading.length > 0 ? leading : eligibleActingRoles.filter(r => r.type !== 'Voice Acting');
    }, [eligibleActingRoles]);

    const eligibleSupporting = useMemo(() => {
        const supporting = eligibleActingRoles.filter(r => r.type !== 'Voice Acting' && r.roleType !== 'Leading Role');
        return supporting.length > 0 ? supporting : eligibleActingRoles.filter(r => r.type !== 'Voice Acting');
    }, [eligibleActingRoles]);

    const eligibleVoice = useMemo(() => {
        const voice = eligibleActingRoles.filter(r => r.type === 'Voice Acting');
        return voice.length > 0 ? voice : eligibleActingRoles;
    }, [eligibleActingRoles]);

    const handleSelect = (category: CategoryName, itemId: string) => {
        setSelections(prev => {
            const next = { ...prev };
            if (!itemId) delete next[category];
            else next[category] = itemId;
            return next;
        });
    };

    const handleSubmit = () => {
        const submissions: any[] = [];
        
        Object.entries(selections).forEach(([cat, itemId]) => {
           const category = cat as CategoryName;
           let itemName = 'Unknown';
           if (category === 'Best Original Song') {
               itemName = activeArtistData.songs.find(s => s.id === itemId)?.title || 'Unknown';
           } else if (category === 'Best Soundtrack') {
               itemName = activeArtistData.releases.find(r => r.id === itemId)?.title || 'Unknown';
           } else {
               itemName = (activeArtistData.actingRoles || []).find(r => r.id === itemId)?.title || 'Unknown';
           }
           submissions.push({ artistId: activeArtist.id, category, itemId, itemName });
        });
        
        if (submissions.length === 0) return;

        const emailId = activeArtistData.inbox.find(e => e.offer?.type === 'goldenGlobeSubmission' && !e.offer.isSubmitted)?.id || '';
        dispatch({ type: 'SUBMIT_FOR_GOLDEN_GLOBES', payload: { submissions, emailId } });
    };

    const categories: { name: CategoryName; description: string; options: {id: string, name: string}[] }[] = [
        { name: 'Best Actor/Actress', description: 'Submit a Movie or TV Show performance.', options: eligibleLeading.map(r => ({id: r.id, name: r.title})) },
        { name: 'Best Supporting Actor/Actress', description: 'Submit a Movie or TV Show supporting performance.', options: eligibleSupporting.map(r => ({id: r.id, name: r.title})) },
        { name: 'Best Voice Acting', description: 'Submit an animated Movie or TV Show performance.', options: eligibleVoice.map(r => ({id: r.id, name: r.title})) },
        { name: 'Best TV Show', description: 'Submit a TV Show you appeared in.', options: eligibleTVShows.map(r => ({id: r.id, name: r.title})) },
        { name: 'Best Movie', description: 'Submit a Movie you appeared in.', options: eligibleMovies.map(r => ({id: r.id, name: r.title})) },
        { name: 'Best Soundtrack', description: 'Submit a soundtrack album you released.', options: eligibleSoundtracks.map(r => ({id: r.id, name: r.title})) },
        { name: 'Best Original Song', description: 'Submit an original song from a soundtrack.', options: eligibleSongs.map(r => ({id: r.id, name: r.title})) },
    ];

    const previewSubmissions = useMemo(() => {
        const subs: { category: string; itemName: string; itemId?: string }[] = [];
        Object.entries(selections).forEach(([cat, itemId]) => {
            if (!itemId) return;
            const category = cat as CategoryName;
            let itemName = 'Unknown';
            if (category === 'Best Original Song') {
                itemName = activeArtistData.songs.find(s => s.id === itemId)?.title || 'Unknown';
            } else if (category === 'Best Soundtrack') {
                itemName = activeArtistData.releases.find(r => r.id === itemId)?.title || 'Unknown';
            } else {
                itemName = (activeArtistData.actingRoles || []).find(r => r.id === itemId)?.title || 'Unknown';
            }
            subs.push({ category, itemId, itemName });
        });
        return subs;
    }, [selections, activeArtistData.songs, activeArtistData.releases, activeArtistData.actingRoles]);

    const mainProjectName = useMemo(() => {
        const soundtrack = previewSubmissions.find(s => s.category === 'Best Soundtrack');
        if (soundtrack && soundtrack.itemName && soundtrack.itemName !== 'Unknown') return soundtrack.itemName;
        const role = previewSubmissions.find(s => s.category.includes('Movie') || s.category.includes('Show') || s.category.includes('Actor') || s.category.includes('Actress'));
        if (role && role.itemName && role.itemName !== 'Unknown') return role.itemName;
        return activeArtist.name;
    }, [previewSubmissions, activeArtist.name]);

    const fycPreviewData: FycBannerData = {
        id: 'preview',
        awardShow: 'Golden Globes',
        awardShowTitle: 'FOR YOUR GOLDEN GLOBES CONSIDERATION',
        artistId: activeArtist.id,
        artistName: activeArtist.name,
        artistImage: activeArtist.image || activeArtistData.artistImages?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=800&fit=crop',
        mainProjectName,
        submissions: previewSubmissions,
        date,
    };

    const hasAnySelection = Object.values(selections).some(v => !!v);

    return (
        <div className="h-full w-full bg-zinc-900 text-white flex flex-col">
            <header className="p-4 flex items-center justify-between bg-zinc-800 border-b border-zinc-700">
                <div className="flex items-center gap-4">
                    <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="p-2 rounded-full hover:bg-white/10">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-amber-400">Golden Globe Submissions</h1>
                </div>
                {hasAnySelection && (
                    <button
                        onClick={() => setShowBannerPreview(true)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors flex items-center gap-1.5"
                    >
                        <span>✨</span> Preview FYC Banner
                    </button>
                )}
            </header>
            
            <main className="flex-grow overflow-y-auto p-4 space-y-6">
                <div className="bg-amber-400/10 border border-amber-400/30 p-4 rounded-xl text-amber-100">
                    <p className="font-bold text-amber-400 mb-1">Hollywood Foreign Press Association</p>
                    <p className="text-sm">Submit your eligible film and television work from this year for Golden Globe consideration.</p>
                </div>

                <div className="space-y-6">
                    {categories.map(cat => (
                        <div key={cat.name} className="bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                            <h2 className="font-bold text-lg">{cat.name}</h2>
                            <p className="text-sm text-zinc-400 mb-4">{cat.description}</p>
                            
                            {cat.options.length > 0 ? (
                                <select 
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white outline-none focus:border-amber-400"
                                    value={selections[cat.name] || ''}
                                    onChange={(e) => handleSelect(cat.name, e.target.value)}
                                >
                                    <option value="">-- Do not submit --</option>
                                    {cat.options.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="text-sm text-zinc-500 italic p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                                    No eligible work found for this category.
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="pt-4 pb-12 flex flex-col items-center gap-3">
                    <div className="flex gap-2 w-full max-w-md justify-center">
                        {hasAnySelection && (
                            <button 
                                type="button"
                                onClick={() => setShowBannerPreview(true)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-400/30 px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2"
                            >
                                <span>✨</span> FYC Banner
                            </button>
                        )}
                        <button 
                            onClick={handleSubmit}
                            disabled={!hasAnySelection}
                            className="bg-amber-400 text-black px-10 py-3 rounded-full font-bold shadow-lg shadow-amber-400/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Submit For Consideration
                        </button>
                    </div>
                    <p className="text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                        <span className="text-amber-400 font-semibold">Pop Base</span> will post your official 'For Your Consideration' banner on X next week.
                    </p>
                </div>
            </main>

            {/* Banner Preview Modal */}
            {showBannerPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="relative max-w-xl w-full max-h-[92vh] overflow-y-auto rounded-3xl">
                        <div className="flex justify-between items-center mb-3 px-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                                Official For Your Consideration Banner Preview
                            </span>
                            <button
                                onClick={() => setShowBannerPreview(false)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 rounded-full text-xs font-semibold"
                            >
                                Close
                            </button>
                        </div>
                        <ForYourConsiderationBanner
                            bannerData={fycPreviewData}
                            isInteractive={false}
                        />
                        <p className="text-center text-xs text-zinc-400 mt-3">
                            This banner will be published by Pop Base on X one week after submission.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmitForGoldenGlobesView;
