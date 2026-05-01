

import React, { useState, useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { GENRES, STUDIOS, NPC_ARTIST_NAMES } from '../constants';
import type { Song } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

const StudioView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData, group } = useGame();
    
    const [mode, setMode] = useState<'single' | 'remixPack'>('single');

    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState(GENRES[0]);
    const [studioIndex, setStudioIndex] = useState(0);
    const [isExplicit, setIsExplicit] = useState(false);
    const [isDeluxeTrack, setIsDeluxeTrack] = useState(false);
    const [coverArt, setCoverArt] = useState<string | null>(null);
    const [collaboration, setCollaboration] = useState<{ artistName: string; cost: number } | null>(null);
    const [isRemix, setIsRemix] = useState(false);
    const [remixOfSongId, setRemixOfSongId] = useState<string>('');
    const [error, setError] = useState('');

    // Auto Remix Pack Maker state
    const [remixPackTargetId, setRemixPackTargetId] = useState<string>('');
    const [selectedRemixTypes, setSelectedRemixTypes] = useState<Set<string>>(new Set());
    const [feature1, setFeature1] = useState<{ artistName: string; cost: number } | null>(null);
    const [feature2, setFeature2] = useState<{ artistName: string; cost: number } | null>(null);

    const REMIX_TYPES = [
        'Sped Up',
        'Slowed Down',
        'Instrumental',
        'Acapella',
        'Super Sped Up',
        'Slowed & Reverb',
        'Feature 1',
        'Feature 2'
    ];

    if (!activeArtistData || !activeArtist) return null;
    const { money, releases, songs } = activeArtistData;
    const { careerMode } = gameState;
    const selectedStudio = STUDIOS[studioIndex];

    const hasReleasedAlbum = useMemo(() => {
        return releases.some(r => r.type === 'Album' || r.type === 'Album (Deluxe)');
    }, [releases]);

    const potentialRemixTargets = useMemo(() => {
        return songs.filter(s => !s.remixOfSongId);
    }, [songs]);

    const handleRemixToggle = (checked: boolean) => {
        setIsRemix(checked);
        if (checked && potentialRemixTargets.length > 0) {
            setRemixOfSongId(potentialRemixTargets[0].id);
        } else {
            setRemixOfSongId('');
        }
    };

    const potentialCollaborators = useMemo(() => {
        const npcs = NPC_ARTIST_NAMES;
        let groupMembers: string[] = [];
        if (careerMode === 'group' && group) {
            groupMembers = group.members
                .filter(m => m.id !== activeArtist.id)
                .map(m => m.name);
        }
        return [...npcs, ...groupMembers].sort();
    }, [careerMode, group, activeArtist]);

    const handleCoverArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverArt(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCollaborationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const artistName = e.target.value;
        if (artistName) {
            const cost = Math.floor(Math.random() * (7000000 - 25000 + 1)) + 25000;
            setCollaboration({ artistName, cost });
        } else {
            setCollaboration(null);
        }
    };

    const handleFeature1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const artistName = e.target.value;
        if (artistName) {
            const cost = Math.floor(Math.random() * (7000000 - 25000 + 1)) + 25000;
            setFeature1({ artistName, cost });
        } else {
            setFeature1(null);
        }
    };

    const handleFeature2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const artistName = e.target.value;
        if (artistName) {
            const cost = Math.floor(Math.random() * (7000000 - 25000 + 1)) + 25000;
            setFeature2({ artistName, cost });
        } else {
            setFeature2(null);
        }
    };

    const toggleRemixType = (type: string) => {
        const newSet = new Set(selectedRemixTypes);
        if (newSet.has(type)) {
            newSet.delete(type);
            if (type === 'Feature 1') setFeature1(null);
            if (type === 'Feature 2') setFeature2(null);
        } else {
            newSet.add(type);
        }
        setSelectedRemixTypes(newSet);
    };

    const handleRecord = () => {
        setError('');
        if (!title.trim() || !coverArt) {
            setError('Song title and cover art are required.');
            return;
        }
        if (isRemix) {
            if (!remixOfSongId) {
                setError('You must select a song to remix.');
                return;
            }
            const existingRemixes = songs.filter(s => s.remixOfSongId === remixOfSongId).length;
            if (existingRemixes >= 8) {
                setError('You can only make up to 8 remixes of a single song.');
                return;
            }
        }
        const totalCost = selectedStudio.cost + (collaboration ? collaboration.cost : 0);
        if (money < totalCost) {
            setError("You don't have enough money for this session.");
            return;
        }
        
        const [min, max] = selectedStudio.qualityRange;
        const qualityBoost = collaboration ? Math.floor(Math.random() * 10) + 1 : 0;
        const quality = (Math.floor(Math.random() * (max - min + 1)) + min) + qualityBoost;
        const finalQuality = Math.min(100, quality);
        
        const songTitle = collaboration ? `${title.trim()} (feat. ${collaboration.artistName})` : title.trim();

        const newSong: Song = {
            id: crypto.randomUUID(),
            title: songTitle,
            genre,
            quality: finalQuality,
            coverArt,
            isReleased: false,
            streams: 0,
            lastWeekStreams: 0,
            prevWeekStreams: 0,
            duration: Math.floor(Math.random() * (240 - 120 + 1)) + 120, // 2 to 4 minutes
            explicit: isExplicit,
            artistId: activeArtist.id,
            isDeluxeTrack,
            removedStreams: 0,
            collaboration: collaboration ? { ...collaboration, qualityBoost } : undefined,
            remixOfSongId: isRemix ? remixOfSongId : undefined,
            dailyStreams: [],
        };

        dispatch({ type: 'RECORD_SONG', payload: { song: newSong, cost: totalCost } });
        dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
    };

    const handleCreateRemixPack = () => {
        setError('');
        if (!remixPackTargetId) {
            setError('You must select a target song.');
            return;
        }
        if (selectedRemixTypes.size === 0) {
            setError('You must select at least one remix type.');
            return;
        }
        if (selectedRemixTypes.has('Feature 1') && !feature1) {
            setError('Select an artist for Feature 1.');
            return;
        }
        if (selectedRemixTypes.has('Feature 2') && !feature2) {
            setError('Select an artist for Feature 2.');
            return;
        }

        const targetSong = songs.find(s => s.id === remixPackTargetId);
        if (!targetSong) return;

        const existingRemixes = songs.filter(s => s.remixOfSongId === remixPackTargetId).length;
        if (existingRemixes + selectedRemixTypes.size > 8) {
            setError(`You can only have up to 8 remixes for a single song. You currently have ${existingRemixes}.`);
            return;
        }

        let totalFeatureCost = 0;
        if (feature1) totalFeatureCost += feature1.cost;
        if (feature2) totalFeatureCost += feature2.cost;

        const packTotalCost = (selectedStudio.cost * selectedRemixTypes.size) + totalFeatureCost;
        if (money < packTotalCost) {
            setError("You don't have enough money for this remix pack.");
            return;
        }

        const [min, max] = selectedStudio.qualityRange;
        
        const newSongs: Song[] = [];

        Array.from(selectedRemixTypes).forEach(type => {
            let typeName = type;
            let currentFeature = null;

            if (type === 'Feature 1') {
                currentFeature = feature1;
                typeName = `feat. ${feature1!.artistName}`;
            } else if (type === 'Feature 2') {
                currentFeature = feature2;
                typeName = `feat. ${feature2!.artistName}`;
            }

            const qualityBoost = currentFeature ? Math.floor(Math.random() * 10) + 1 : 0;
            const quality = (Math.floor(Math.random() * (max - min + 1)) + min) + qualityBoost;
            const finalQuality = Math.min(100, quality);

            newSongs.push({
                ...targetSong,
                id: crypto.randomUUID(),
                title: `${targetSong.title} (${typeName})`,
                quality: finalQuality,
                isReleased: false,
                releaseId: undefined,
                streams: 0,
                lastWeekStreams: 0,
                prevWeekStreams: 0,
                dailyStreams: [],
                collaboration: currentFeature ? { ...currentFeature, qualityBoost } : undefined,
                remixOfSongId: targetSong.id,
                soundtrackTitle: undefined,
            });
        });

        dispatch({ type: 'CREATE_REMIX_PACK', payload: { songs: newSongs, cost: packTotalCost } });
        dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
    };

    const totalCost = selectedStudio.cost + (collaboration ? collaboration.cost : 0);
    
    let packFeatureCost = 0;
    if (selectedRemixTypes.has('Feature 1') && feature1) packFeatureCost += feature1.cost;
    if (selectedRemixTypes.has('Feature 2') && feature2) packFeatureCost += feature2.cost;
    const packTotalCost = (selectedStudio.cost * selectedRemixTypes.size) + packFeatureCost;

    return (
         <div className="h-screen w-full bg-zinc-900 overflow-y-auto">
            <header className="p-4 flex items-center gap-4 sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10 border-b border-zinc-700/50">
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="p-2 rounded-full hover:bg-white/10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold flex-1">Studio Session</h1>
                
                <div className="flex bg-zinc-800 rounded-lg p-1">
                    <button
                        onClick={() => { setMode('single'); setError(''); }}
                        className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${mode === 'single' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Single Track
                    </button>
                    <button
                        onClick={() => { setMode('remixPack'); setError(''); }}
                        className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${mode === 'remixPack' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Auto Remix Pack
                    </button>
                </div>
            </header>
            
            <div className="p-4 space-y-6">
                {mode === 'single' ? (
                    <>
                        <div className="flex justify-center">
                            <label htmlFor="cover-art" className="cursor-pointer">
                                <div className="w-48 h-48 rounded-lg bg-zinc-800 border-2 border-dashed border-zinc-600 flex items-center justify-center hover:border-red-500 transition-colors">
                                    {coverArt ? (
                                        <img src={coverArt} alt="Cover Art" className="w-full h-full rounded-lg object-cover" />
                                    ) : (
                                        <span className="text-zinc-400 text-sm text-center">Upload Cover Art</span>
                                    )}
                                </div>
                            </label>
                            <input id="cover-art" type="file" accept="image/*" className="hidden" onChange={handleCoverArtUpload} />
                        </div>
                        
                        <div>
                            <label htmlFor="song-title" className="block text-sm font-medium text-zinc-300">Song Title</label>
                            <input type="text" id="song-title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"/>
                        </div>

                         <div>
                            <label htmlFor="collaboration" className="block text-sm font-medium text-zinc-300">Collaboration (Optional)</label>
                            <select id="collaboration" onChange={handleCollaborationChange} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                                <option value="">None</option>
                                {potentialCollaborators.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                            {collaboration && (
                                <p className="text-sm text-yellow-400 mt-2">Feature Cost: ${formatNumber(collaboration.cost)}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="genre" className="block text-sm font-medium text-zinc-300">Genre</label>
                            <select id="genre" value={genre} onChange={e => setGenre(e.target.value)} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                                {GENRES.map(g => <option key={g}>{g}</option>)}
                            </select>
                        </div>
                        
                        <div className="flex items-center">
                            <input
                                id="explicit-checkbox"
                                type="checkbox"
                                checked={isExplicit}
                                onChange={(e) => setIsExplicit(e.target.checked)}
                                className="h-4 w-4 rounded border-zinc-500 bg-zinc-700 text-red-600 focus:ring-red-500"
                            />
                            <label htmlFor="explicit-checkbox" className="ml-2 block text-sm text-zinc-300">
                                Explicit Content <span className="text-xs text-zinc-400">(more hype on release)</span>
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="deluxe-checkbox"
                                type="checkbox"
                                checked={isDeluxeTrack}
                                onChange={(e) => setIsDeluxeTrack(e.target.checked)}
                                disabled={!hasReleasedAlbum}
                                className="h-4 w-4 rounded border-zinc-500 bg-zinc-700 text-red-600 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <label htmlFor="deluxe-checkbox" className="ml-2 block text-sm text-zinc-300">
                                Deluxe Track <span className="text-xs text-zinc-400">(for deluxe albums)</span>
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remix-checkbox"
                                type="checkbox"
                                checked={isRemix}
                                onChange={(e) => handleRemixToggle(e.target.checked)}
                                disabled={potentialRemixTargets.length === 0}
                                className="h-4 w-4 rounded border-zinc-500 bg-zinc-700 text-red-600 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <label htmlFor="remix-checkbox" className="ml-2 block text-sm text-zinc-300">
                                Manual Song Remix
                            </label>
                        </div>

                        {isRemix && (
                            <div>
                                <label htmlFor="remix-target" className="block text-sm font-medium text-zinc-300">Select Song to Remix</label>
                                <select id="remix-target" value={remixOfSongId} onChange={e => setRemixOfSongId(e.target.value)} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                                    <option value="">Select a song</option>
                                    {potentialRemixTargets.map(song => (
                                        <option key={song.id} value={song.id}>{song.title}</option>
                                    ))}
                                </select>
                                {remixOfSongId && (
                                   <p className="text-xs text-zinc-400 mt-1">
                                       Remixes: {songs.filter(s => s.remixOfSongId === remixOfSongId).length} / 8
                                   </p>
                                )}
                            </div>
                        )}

                        <div>
                            <h3 className="block text-sm font-medium text-zinc-300 mb-2">Select Studio</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {STUDIOS.map((studio, index) => (
                                    <button key={studio.name} onClick={() => setStudioIndex(index)} className={`p-4 rounded-lg text-left transition-all border-2 ${studioIndex === index ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'}`}>
                                        <p className="font-bold">{studio.name}</p>
                                        <p className="text-sm text-green-400">-${studio.cost.toLocaleString()}</p>
                                        <p className="text-xs text-zinc-400 mt-1">Est. Quality: ???</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        
                        <button onClick={handleRecord} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-red-600/20 disabled:bg-zinc-600 disabled:shadow-none" disabled={money < totalCost}>
                            Record Song (-${totalCost.toLocaleString()})
                        </button>
                    </>
                ) : (
                    <>
                        <div className="bg-zinc-800/50 border border-zinc-700 p-6 rounded-xl">
                            <h2 className="text-lg font-bold mb-4">Auto Remix Pack Maker</h2>
                            <p className="text-sm text-zinc-400 mb-6">Instantly generate a bundle of remixes for a track. Remixed songs share cover art and automatically link to the original track on charts.</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="pack-remix-target" className="block text-sm font-medium text-zinc-300">Original Song</label>
                                    <select id="pack-remix-target" value={remixPackTargetId} onChange={e => { setRemixPackTargetId(e.target.value); setSelectedRemixTypes(new Set()); setError(''); }} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                                        <option value="">Select a song</option>
                                        {potentialRemixTargets.map(song => (
                                            <option key={song.id} value={song.id}>{song.title}</option>
                                        ))}
                                    </select>
                                    {remixPackTargetId && (
                                       <p className="text-xs text-zinc-400 mt-2">
                                           Existing Remixes: {songs.filter(s => s.remixOfSongId === remixPackTargetId).length} / 8 allowable
                                       </p>
                                    )}
                                </div>

                                {remixPackTargetId && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-3">Select Remix Types <span className="text-zinc-500 text-xs font-normal ml-2">(${formatNumber(selectedStudio.cost)} studio time per track)</span></label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {REMIX_TYPES.map(type => {
                                                    const isSelected = selectedRemixTypes.has(type);
                                                    return (
                                                        <button 
                                                            key={type}
                                                            onClick={() => toggleRemixType(type)}
                                                            className={`p-3 rounded-lg border flex flex-col items-start transition-all ${isSelected ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'}`}
                                                        >
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-red-500 bg-red-500' : 'border-zinc-500'}`}>
                                                                    {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                                </div>
                                                                <span className="font-semibold text-sm">{type}</span>
                                                            </div>
                                                            <span className="text-xs text-zinc-500 text-left w-full pl-6">+1 track</span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {selectedRemixTypes.has('Feature 1') && (
                                            <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                                                <label htmlFor="feature1" className="block text-sm font-medium text-zinc-300">Feature 1 Artist</label>
                                                <select id="feature1" onChange={handleFeature1Change} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                                                    <option value="">None</option>
                                                    {potentialCollaborators.map(name => <option key={name} value={name}>{name}</option>)}
                                                </select>
                                                {feature1 && (
                                                    <p className="text-sm text-yellow-400 mt-2">Feature Cost: ${formatNumber(feature1.cost)}</p>
                                                )}
                                            </div>
                                        )}

                                        {selectedRemixTypes.has('Feature 2') && (
                                            <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                                                <label htmlFor="feature2" className="block text-sm font-medium text-zinc-300">Feature 2 Artist</label>
                                                <select id="feature2" onChange={handleFeature2Change} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                                                    <option value="">None</option>
                                                    {potentialCollaborators.map(name => <option key={name} value={name}>{name}</option>)}
                                                </select>
                                                {feature2 && (
                                                    <p className="text-sm text-yellow-400 mt-2">Feature Cost: ${formatNumber(feature2.cost)}</p>
                                                )}
                                            </div>
                                        )}
                                        
                                        <div>
                                            <h3 className="block text-sm font-medium text-zinc-300 mb-2">Select Studio (Affects all remixes in pack)</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {STUDIOS.map((studio, index) => (
                                                    <button key={studio.name} onClick={() => setStudioIndex(index)} className={`p-4 rounded-lg text-left transition-all border-2 ${studioIndex === index ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'}`}>
                                                        <p className="font-bold">{studio.name}</p>
                                                        <p className="text-sm text-green-400">-${studio.cost.toLocaleString()} / track</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                                
                                {remixPackTargetId && selectedRemixTypes.size > 0 && (
                                    <div className="mt-8 pt-6 border-t border-zinc-700">
                                        <div className="flex justify-between items-center mb-4 text-zinc-300">
                                            <span>Studio Cost ({selectedRemixTypes.size} tracks x ${formatNumber(selectedStudio.cost)})</span>
                                            <span>${formatNumber(selectedStudio.cost * selectedRemixTypes.size)}</span>
                                        </div>
                                        {packFeatureCost > 0 && (
                                            <div className="flex justify-between items-center mb-4 text-zinc-300">
                                                <span>Features Cost</span>
                                                <span>${formatNumber(packFeatureCost)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center mb-6 text-xl font-bold text-white">
                                            <span>Total Valid Cost</span>
                                            <span>${formatNumber(packTotalCost)}</span>
                                        </div>
                                        <button onClick={handleCreateRemixPack} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-red-600/20 disabled:bg-zinc-600 disabled:shadow-none" disabled={money < packTotalCost}>
                                            Generate Remix Pack (-${formatNumber(packTotalCost)})
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StudioView;
