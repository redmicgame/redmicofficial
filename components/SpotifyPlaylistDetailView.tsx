import React, { useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import TrianglePlayIcon from './icons/TrianglePlayIcon';
import HeartIcon from './icons/HeartIcon';

const SpotifyPlaylistDetailView: React.FC<{ playlistId: string; onBack: () => void }> = ({ playlistId, onBack }) => {
    const { gameState, activeArtist } = useGame();
    
    const playlist = useMemo(() => {
        return gameState.spotifyPlaylists?.find(p => p.id === playlistId);
    }, [gameState.spotifyPlaylists, playlistId]);

    if (!playlist) return null;

    const totalDuration = playlist.tracks.length * 3.5; // placeholder duration

    return (
        <div className="bg-[#121212] text-white min-h-screen pb-20">
            {/* Header */}
            <div className="flex bg-gradient-to-b from-zinc-700/50 to-[#121212] pt-12 pb-6 px-4 md:px-8">
                <button 
                    onClick={onBack} 
                    className="absolute top-4 left-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors z-10"
                    aria-label="Go back"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                
                <div className="flex flex-col md:flex-row gap-6 mt-8 md:mt-0 items-center md:items-end w-full">
                    <img 
                        src={playlist.coverArt} 
                        alt={playlist.name} 
                        className="w-48 h-48 md:w-60 md:h-60 shadow-2xl object-cover rounded-sm"
                    />
                    <div className="flex flex-col gap-2 w-full text-center md:text-left">
                        <span className="text-sm font-bold uppercase hidden md:block">Playlist</span>
                        <h1 className="text-4xl md:text-7xl font-black tracking-tighter" style={{ lineHeight: 1.1 }}>
                            {playlist.name}
                        </h1>
                        <p className="text-zinc-400 text-sm mt-2">{playlist.description}</p>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-zinc-300 mt-2 font-medium">
                            <span className="text-white hover:underline cursor-pointer font-bold">Spotify</span>
                            <span>•</span>
                            <span>{formatNumber(playlist.followers)} likes</span>
                            <span>•</span>
                            <span>{playlist.tracks.length} songs</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="px-4 md:px-8 py-4 flex items-center gap-6">
                <button className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 hover:scale-105 transition-all text-black shadow-lg">
                    <TrianglePlayIcon />
                </button>
                <button className="text-zinc-400 hover:text-white transition-colors">
                    <HeartIcon className="w-8 h-8" />
                </button>
                <button className="text-zinc-400 hover:text-white transition-colors text-2xl font-bold pb-2 tracking-widest leading-none">
                    ...
                </button>
            </div>

            {/* Tracks List */}
            <div className="px-4 md:px-8 mt-4">
                <div className="text-zinc-400 grid grid-cols-[16px_1fr_minmax(120px,1fr)] md:grid-cols-[16px_1fr_1fr] gap-4 px-4 py-2 border-b border-white/10 text-sm font-semibold uppercase tracking-wider items-center mb-4">
                    <div className="text-right">#</div>
                    <div>Title</div>
                    <div className="hidden md:block">Date added</div>
                </div>
                
                <div className="space-y-1">
                    {playlist.tracks.map((track, index) => {
                        const isPlayerTrack = track.artistName === activeArtist?.name;
                        
                        return (
                            <div key={`${track.songId}-${index}`} className="group grid grid-cols-[16px_1fr_minmax(120px,1fr)] md:grid-cols-[16px_1fr_1fr] gap-4 px-4 py-2 rounded-md hover:bg-white/10 text-sm items-center transition-colors cursor-pointer">
                                <div className="text-zinc-400 text-right w-4">{index + 1}</div>
                                <div className="min-w-0 pr-4 flex items-center gap-3">
                                    {track.coverArt && <img src={track.coverArt} className="w-10 h-10 object-cover rounded-sm flex-shrink-0" alt="" />}
                                    <div className="min-w-0">
                                        <div className={`font-medium truncate ${isPlayerTrack ? 'text-green-500' : 'text-white'}`}>
                                            {track.title}
                                        </div>
                                        <div className="text-zinc-400 text-sm truncate group-hover:text-white transition-colors">
                                            {track.artistName}
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block text-zinc-400 truncate">
                                    {track.addedDate.year} Wk {track.addedDate.week}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SpotifyPlaylistDetailView;
