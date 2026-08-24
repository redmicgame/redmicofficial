import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Video } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import BritAwardIcon from './icons/BritAwardIcon';

const CreateBritPerformanceView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const { date, activeBritPerformanceOffer } = gameState;
    const { songs } = activeArtistData!;

    const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [error, setError] = useState('');

    const performableSongs = useMemo(() => {
        return songs.filter(s => s.isReleased);
    }, [songs]);

    if (!activeArtist || !activeBritPerformanceOffer) {
        return <div className="p-4">Error loading page.</div>;
    }

    const handleToggleSong = (songId: string) => {
        const newSelection = new Set(selectedSongIds);
        if (newSelection.has(songId)) {
            newSelection.delete(songId);
        } else if (newSelection.size < 2) {
            newSelection.add(songId);
        }
        setSelectedSongIds(newSelection);
    };

    const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setThumbnail(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handlePublish = () => {
        if (selectedSongIds.size === 0) {
            setError('Please select at least one song to perform.');
            return;
        }
        if (!thumbnail) {
            setError('Please upload a thumbnail for the performance.');
            return;
        }

        const songTitles = Array.from(selectedSongIds)
            .map(id => songs.find(s => s.id === id)?.title)
            .filter((title): title is string => !!title)
            .join(' / ');
        const videoTitle = `${activeArtist.name} - Live at The BRIT Awards (${songTitles})`;
        
        const description = `Watch ${activeArtist.name} perform "${songTitles}" live from The BRIT Awards ${date.year} in London.`;

        const newVideo: Video = {
            id: crypto.randomUUID(),
            songId: Array.from(selectedSongIds)[0],
            title: videoTitle,
            type: 'Live Performance',
            views: 0,
            thumbnail,
            releaseDate: { week: 15, year: date.year },
            artistId: activeArtist.id,
            description,
            mentionedNpcs: [],
        };

        dispatch({ type: 'CREATE_BRIT_PERFORMANCE', payload: { video: newVideo } });
    };

    return (
        <div className="h-full w-full bg-zinc-950 text-white flex flex-col min-h-screen">
            <header className="p-4 flex items-center gap-4 sticky top-0 bg-gradient-to-r from-blue-950 via-zinc-900 to-red-950 backdrop-blur-md z-10 border-b border-red-800/40">
                <button 
                    onClick={() => dispatch({ type: 'DECLINE_BRIT_PERFORMANCE', payload: { emailId: activeBritPerformanceOffer.emailId } })} 
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <BritAwardIcon className="w-6 h-6 text-red-400" />
                    <h1 className="text-xl font-bold">Plan BRIT Awards Live Performance</h1>
                </div>
            </header>

            <main className="flex-grow p-4 md:p-6 max-w-xl mx-auto w-full space-y-6 overflow-y-auto pb-24">
                <div className="bg-gradient-to-br from-red-950/60 via-zinc-900 to-blue-950/60 p-4 rounded-2xl border border-red-500/30">
                    <label htmlFor="thumbnail-upload" className="cursor-pointer w-full block">
                        <div className="w-full aspect-video rounded-xl bg-black/40 border-2 border-dashed border-zinc-600 hover:border-red-400 flex items-center justify-center transition-colors overflow-hidden">
                            {thumbnail ? (
                                <img src={thumbnail} alt="Performance Thumbnail" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="text-center text-zinc-400 p-4">
                                    <BritAwardIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
                                    <p className="text-sm font-semibold text-zinc-200">Upload Stage / Performance Still</p>
                                    <p className="text-xs text-zinc-500">16:9 Landscape recommended</p>
                                </div>
                            )}
                        </div>
                    </label>
                    <input id="thumbnail-upload" type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                </div>

                <div>
                    <h2 className="text-base font-bold text-zinc-200 mb-2">Select Songs ({selectedSongIds.size}/2)</h2>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {performableSongs.map(song => (
                            <button 
                                key={song.id} 
                                onClick={() => handleToggleSong(song.id)} 
                                className={`w-full p-2.5 rounded-xl flex items-center gap-3 border transition-all text-left ${
                                    selectedSongIds.has(song.id) 
                                        ? 'bg-red-600/20 border-red-500/50 shadow-sm' 
                                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                                }`}
                            >
                                <img src={song.coverArt} alt={song.title} className="w-11 h-11 rounded-lg object-cover border border-zinc-700/50 shrink-0" />
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-sm text-zinc-100 truncate">{song.title}</p>
                                    <p className="text-xs text-zinc-400">{song.genre} • {song.streams.toLocaleString()} streams</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            </main>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-md max-w-xl mx-auto w-full">
                <button 
                    onClick={handlePublish} 
                    className="w-full h-12 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-red-950/40 transition-all text-sm"
                >
                    Confirm & Publish BRITs Live Performance
                </button>
            </div>
        </div>
    );
};

export default CreateBritPerformanceView;
