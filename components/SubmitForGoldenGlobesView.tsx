
import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Song, GoldenGlobeAward } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

type CategoryName = GoldenGlobeAward['category'];

const SubmitForGoldenGlobesView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const { date } = gameState;

    const [selections, setSelections] = useState<Partial<Record<CategoryName, string>>>({});

    if (!activeArtistData || !activeArtist) return null;

    const previousYearAlbums = useMemo(() => {
        return activeArtistData.releases.filter(r => r.releaseDate.year === date.year - 1 && r.type === 'Album');
    }, [activeArtistData.releases, date.year]);

    const eligibleSoundtracks = previousYearAlbums.filter(r => r.isSoundtrack);

    const eligibleSongs = useMemo(() => {
        const previousYearReleases = activeArtistData.releases.filter(r => r.releaseDate.year === date.year - 1);
        const songIdsFromPreviousYear = new Set(previousYearReleases.flatMap(r => r.songIds));
        return activeArtistData.songs.filter(s => songIdsFromPreviousYear.has(s.id) && s.soundtrackTitle);
    }, [activeArtistData.releases, activeArtistData.songs, date.year]);
        
    const eligibleActingRoles = useMemo(() => {
        return (activeArtistData.actingRoles || []).filter(g => 
           (g.type === 'Movie' || g.type === 'TV Show') && g.status === 'Completed'
        ); // In this simplified model we'll assume gigs from recent time or just completed gigs.
    }, [activeArtistData.actingRoles]);
        
    const eligibleMovies = eligibleActingRoles.filter(r => r.type === 'Movie');
    const eligibleTVShows = eligibleActingRoles.filter(r => r.type === 'TV Show');

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
               itemName = eligibleSongs.find(s => s.id === itemId)?.title || 'Unknown';
           } else if (category === 'Best Soundtrack') {
               itemName = eligibleSoundtracks.find(s => s.id === itemId)?.title || 'Unknown';
           } else {
               itemName = eligibleActingRoles.find(r => r.id === itemId)?.title || 'Unknown';
           }
           submissions.push({ artistId: activeArtist.id, category, itemId, itemName });
        });
        
        const emailId = activeArtistData.inbox.find(e => e.offer?.type === 'goldenGlobeSubmission' && !e.offer.isSubmitted)?.id;
        if (emailId) {
            dispatch({ type: 'SUBMIT_FOR_GOLDEN_GLOBES', payload: { submissions, emailId } });
        }
    };

    const categories: { name: CategoryName; description: string; options: {id: string, name: string}[] }[] = [
        { name: 'Best Actor/Actress', description: 'Submit a Movie or TV Show performance.', options: eligibleActingRoles.map(r => ({id: r.id, name: r.title})) },
        { name: 'Best Supporting Actor/Actress', description: 'Submit a Movie or TV Show supporting performance.', options: eligibleActingRoles.map(r => ({id: r.id, name: r.title})) },
        { name: 'Best Voice Acting', description: 'Submit an animated Movie or TV Show performance.', options: eligibleActingRoles.map(r => ({id: r.id, name: r.title})) },
        { name: 'Best TV Show', description: 'Submit a TV Show you appeared in.', options: eligibleTVShows.map(r => ({id: r.id, name: r.title})) },
        { name: 'Best Movie', description: 'Submit a Movie you appeared in.', options: eligibleMovies.map(r => ({id: r.id, name: r.title})) },
        { name: 'Best Soundtrack', description: 'Submit a soundtrack album you released.', options: eligibleSoundtracks.map(r => ({id: r.id, name: r.title})) },
        { name: 'Best Original Song', description: 'Submit an original song from a soundtrack.', options: eligibleSongs.map(r => ({id: r.id, name: r.title})) },
    ];

    return (
        <div className="h-full w-full bg-zinc-900 text-white flex flex-col">
            <header className="p-4 flex items-center gap-4 bg-zinc-800 border-b border-zinc-700">
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="p-2 rounded-full hover:bg-white/10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-amber-400">Golden Globe Submissions</h1>
            </header>
            
            <main className="flex-grow overflow-y-auto p-4 space-y-6">
                <div className="bg-amber-400/10 border border-amber-400/30 p-4 rounded-xl text-amber-100">
                    <p className="font-bold text-amber-400 mb-1">Hollywood Foreign Press Association</p>
                    <p className="text-sm">Submit your eligible work for Golden Globe consideration. Only work from the previous year is eligible.</p>
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

                <div className="pt-4 pb-12 flex justify-center">
                    <button 
                        onClick={handleSubmit}
                        className="bg-amber-400 text-black px-12 py-3 rounded-full font-bold shadow-lg shadow-amber-400/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Submit For Consideration
                    </button>
                </div>
            </main>
        </div>
    );
};

export default SubmitForGoldenGlobesView;
