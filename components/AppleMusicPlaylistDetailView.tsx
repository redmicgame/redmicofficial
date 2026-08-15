import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { AppleMusicPlaylist, Song } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import DotsHorizontalIcon from './icons/DotsHorizontalIcon';
import PlusIcon from './icons/PlusIcon';

export const AppleMusicPlaylistCover: React.FC<{
    type: 'setlist' | 'playlist';
    artistImage: string;
    bannerColor?: string;
    customCoverUrl?: string;
    className?: string;
}> = ({ type, artistImage, bannerColor = '#93c5fd', customCoverUrl, className = 'w-44 h-44' }) => {
    const displayLabel = type === 'setlist' ? 'Set List' : 'Playlist';
    const coverImage = customCoverUrl || artistImage;

    return (
        <div className={`relative overflow-hidden rounded-2xl shadow-2xl flex flex-col ${className} shrink-0 select-none`}>
            {/* Top Apple Music Header Band */}
            <div 
                style={{ backgroundColor: bannerColor }} 
                className="w-full px-3 py-2 flex items-center justify-between z-10 shrink-0 text-black shadow-sm"
            >
                <span className="font-black text-sm tracking-tight text-black font-sans leading-none">
                    {displayLabel}
                </span>
                <div className="flex items-center gap-0.5 text-black">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.58-11.28-20.73-14.93-33.45-3.66-12.72-5.49-24.87-5.49-36.44 0-14.35 3.6-26.31 10.79-35.88 7.2-9.57 16.29-14.47 27.27-14.7 4.8 0 10.12 1.25 15.98 3.76 5.86 2.5 9.74 3.84 11.64 4.02 1.48-.25 5.57-1.64 12.27-4.18 6.7-2.54 12.44-3.66 17.22-3.35 12.98.85 23.35 5.71 31.11 14.59-11.39 6.9-16.97 16.5-16.74 28.8.23 9.77 4.04 17.88 11.44 24.32 7.4 6.44 16.23 10.1 26.49 10.98-2.32 7.09-5.14 14.43-8.47 22.02zM119.22 33.64c0-7.3 2.65-14.28 7.95-20.93 5.3-6.65 11.93-11.25 19.89-13.8-1.06 7.4-4 14.44-8.82 21.12-4.82 6.68-11.5 11.21-20.04 13.61.34-2.28 1.02-4.78 1.02-7.5z" />
                    </svg>
                    <span className="font-bold text-xs tracking-tight text-black font-sans leading-none">Music</span>
                </div>
            </div>
            {/* Artist Profile Photo Cover */}
            <div className="flex-1 w-full relative overflow-hidden bg-zinc-900">
                <img 
                    src={coverImage} 
                    alt={displayLabel} 
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" 
                />
            </div>
        </div>
    );
};

export const AppleMusicPlaylistDetailView: React.FC<{
    playlistId: string;
    onBack: () => void;
    onEditPlaylist?: (playlist: AppleMusicPlaylist) => void;
}> = ({ playlistId, onBack, onEditPlaylist }) => {
    const { activeArtist, activeArtistData, dispatch } = useGame();
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const playlist = activeArtistData?.appleMusicPlaylists?.find(p => p.id === playlistId);

    const playlistSongs = useMemo(() => {
        if (!playlist || !activeArtistData) return [];
        return playlist.songIds
            .map(id => activeArtistData.songs.find(s => s.id === id))
            .filter((s): s is Song => !!s);
    }, [playlist, activeArtistData]);

    const totalDurationMinutes = useMemo(() => {
        const totalSec = playlistSongs.reduce((sum, s) => sum + (s.duration || 180), 0);
        return Math.round(totalSec / 60);
    }, [playlistSongs]);

    if (!playlist || !activeArtist || !activeArtistData) {
        return (
            <div className="bg-black text-white h-full p-4 flex flex-col items-center justify-center">
                <p className="text-zinc-400 mb-4">Playlist not found.</p>
                <button onClick={onBack} className="bg-white text-black font-bold px-4 py-2 rounded-full">
                    Go Back
                </button>
            </div>
        );
    }

    const artistImg = activeArtist.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';
    const pageBgColor = activeArtistData.appleMusicBgColor || '#0a192f';

    const handleDelete = () => {
        dispatch({
            type: 'DELETE_APPLE_MUSIC_PLAYLIST',
            payload: { playlistId: playlist.id }
        });
        setShowDeleteConfirm(false);
        setShowOptionsModal(false);
        onBack();
    };

    return (
        <div 
            style={{ 
                background: `linear-gradient(180deg, ${playlist.bannerColor ? `${playlist.bannerColor}33` : 'rgba(30, 58, 138, 0.4)'} 0%, ${pageBgColor} 40%, #000000 100%)` 
            }} 
            className="text-white min-h-full overflow-y-auto pb-28 font-sans transition-colors"
        >
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-20 bg-black/40 backdrop-blur-xl p-4 pt-8 flex justify-between items-center border-b border-white/5">
                <button 
                    onClick={onBack} 
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => alert("Playlist link copied to clipboard!")}
                        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => setShowOptionsModal(true)}
                        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors"
                    >
                        <DotsHorizontalIcon className="w-5 h-5 text-white" />
                    </button>
                </div>
            </header>

            {/* Main Header / Hero */}
            <section className="p-4 pt-2 text-center flex flex-col items-center">
                {/* Large Centered Cover (Matching Image 2) */}
                <div className="my-2 group relative">
                    <AppleMusicPlaylistCover 
                        type={playlist.type} 
                        artistImage={artistImg} 
                        bannerColor={playlist.bannerColor}
                        customCoverUrl={playlist.customCoverUrl}
                        className="w-60 h-60 sm:w-72 sm:h-72 shadow-2xl rounded-2xl" 
                    />
                </div>

                {/* Title & Subtitle */}
                <h1 className="text-2xl sm:text-3xl font-black mt-4 tracking-tight px-4 text-white leading-tight">
                    {playlist.title}
                </h1>
                <p className="text-sm sm:text-base font-semibold text-zinc-300 mt-1">
                    {playlist.curatorText || 'Apple Music Pop'}
                </p>

                {/* Actions Row */}
                <div className="flex gap-4 mt-6 justify-center items-center px-4 w-full max-w-sm">
                    <button 
                        onClick={() => alert("Shuffling playlist...")}
                        className="bg-zinc-800/80 backdrop-blur-md hover:bg-zinc-700 transition-colors rounded-full w-12 h-12 flex-shrink-0 flex items-center justify-center shadow-lg active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3l4 4m0 0l-4 4m4-4H4m12 14l4-4m0 0l-4-4m4 4H4" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => alert(`Playing ${playlist.title}...`)}
                        className="bg-white hover:bg-zinc-200 transition-transform active:scale-95 rounded-full flex-1 py-3 flex items-center justify-center gap-2 shadow-2xl"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black"><path d="M7 6v12l10-6z" /></svg>
                        <span className="font-extrabold text-black text-lg pb-0.5">Play</span>
                    </button>
                    <button 
                        onClick={() => alert("Added playlist to your Apple Music Library!")}
                        className="bg-zinc-800/80 backdrop-blur-md hover:bg-zinc-700 transition-colors rounded-full w-12 h-12 flex-shrink-0 flex items-center justify-center shadow-lg active:scale-95"
                    >
                        <PlusIcon className="w-6 h-6 text-zinc-300" />
                    </button>
                </div>
            </section>

            {/* Tracklist Section */}
            <main className="p-4 space-y-4 max-w-3xl mx-auto">
                <div className="border-t border-zinc-800/60 pt-2 divide-y divide-zinc-800/40">
                    {playlistSongs.map((song, index) => (
                        <div key={`${song.id}_${index}`} className="flex items-center gap-3 py-3 px-1 hover:bg-white/5 rounded-xl transition-colors group">
                            <span className="w-6 text-zinc-400 font-bold text-sm text-center shrink-0">
                                {index + 1}
                            </span>
                            <img 
                                src={song.coverArt} 
                                alt={song.title} 
                                className="w-12 h-12 rounded-lg object-cover shadow shrink-0" 
                            />
                            <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-white truncate text-base">{song.title}</p>
                                    {song.explicit && (
                                        <span className="text-[10px] w-4 h-4 bg-zinc-300 text-black font-bold rounded-[2px] flex items-center justify-center shrink-0">
                                            E
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
                                    {song.collaboration ? `${activeArtist.name} & ${song.collaboration.artistName}` : activeArtist.name}
                                </p>
                            </div>
                            <button className="p-2 text-zinc-400 hover:text-white transition-colors shrink-0">
                                <DotsHorizontalIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}

                    {playlistSongs.length === 0 && (
                        <div className="py-12 text-center text-zinc-400">
                            <p>No tracks added to this playlist yet.</p>
                            {onEditPlaylist && (
                                <button 
                                    onClick={() => onEditPlaylist(playlist)}
                                    className="mt-3 bg-[#fa243c] text-white text-xs font-bold px-4 py-2 rounded-full"
                                >
                                    Add Tracks
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer details */}
                <div className="pt-6 text-xs text-zinc-500 space-y-1">
                    <p>{playlistSongs.length} Songs, {totalDurationMinutes} Minutes</p>
                    <p>&copy; Apple Music • Curated Artist Playlist</p>
                </div>
            </main>

            {/* Options Menu Modal */}
            {showOptionsModal && (
                <div 
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                    onClick={() => setShowOptionsModal(false)}
                >
                    <div 
                        className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                            <AppleMusicPlaylistCover 
                                type={playlist.type} 
                                artistImage={artistImg} 
                                bannerColor={playlist.bannerColor}
                                customCoverUrl={playlist.customCoverUrl}
                                className="w-14 h-14 rounded-lg shadow" 
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white truncate">{playlist.title}</h3>
                                <p className="text-xs text-zinc-400">{playlist.type === 'setlist' ? 'Set List' : 'Artist Playlist'}</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {onEditPlaylist && (
                                <button 
                                    onClick={() => {
                                        setShowOptionsModal(false);
                                        onEditPlaylist(playlist);
                                    }}
                                    className="w-full text-left p-3 hover:bg-zinc-800 rounded-xl flex items-center gap-3 text-sm font-semibold"
                                >
                                    <span>✏️</span>
                                    <span>Edit Playlist & Track Order</span>
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    setShowOptionsModal(false);
                                    setShowDeleteConfirm(true);
                                }}
                                className="w-full text-left p-3 hover:bg-red-950/40 text-red-400 rounded-xl flex items-center gap-3 text-sm font-semibold"
                            >
                                <span>🗑️</span>
                                <span>Delete Playlist</span>
                            </button>
                        </div>

                        <button 
                            onClick={() => setShowOptionsModal(false)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-2xl font-bold text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <div 
                        className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                            🗑️
                        </div>
                        <h3 className="text-xl font-bold">Delete "{playlist.title}"?</h3>
                        <p className="text-zinc-400 text-xs leading-relaxed">
                            This will remove this playlist from your Apple Music profile and Apple Music for Artists. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDelete}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-red-600/30"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppleMusicPlaylistDetailView;
