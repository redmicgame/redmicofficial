import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { AppleMusicPlaylist, Song } from '../types';
import { AppleMusicPlaylistCover } from './AppleMusicPlaylistDetailView';

const BANNER_COLOR_OPTIONS = [
    { label: 'Ice Blue (Default)', hex: '#93c5fd' },
    { label: 'Lavender', hex: '#c4b5fd' },
    { label: 'Soft Pink', hex: '#fda4af' },
    { label: 'Mint Green', hex: '#86efac' },
    { label: 'Warm Yellow', hex: '#fde047' },
    { label: 'Peach Orange', hex: '#fed7aa' },
    { label: 'Pure White', hex: '#ffffff' },
    { label: 'Silver Mist', hex: '#cbd5e1' },
    { label: 'Neon Cyan', hex: '#67e8f9' },
    { label: 'Electric Purple', hex: '#e879f9' },
];

const CURATOR_TAG_OPTIONS = [
    'Apple Music Pop',
    'Apple Music R&B',
    'Apple Music Hip-Hop',
    'Apple Music Rock',
    'Apple Music Country',
    'Apple Music Electronic',
    'Apple Music Indie',
    'Apple Music Latin',
    'Apple Music K-Pop',
    'Apple Music Alternative',
    'Apple Music Dance',
];

interface AppleMusicPlaylistModalProps {
    playlist?: AppleMusicPlaylist | null;
    onClose: () => void;
}

export const AppleMusicPlaylistModal: React.FC<AppleMusicPlaylistModalProps> = ({ playlist, onClose }) => {
    const { activeArtist, activeArtistData, dispatch } = useGame();

    const isEditing = !!playlist;

    const [title, setTitle] = useState(
        playlist?.title || (activeArtist ? `${activeArtist.name}'s Tour Set List` : 'My Tour Set List')
    );
    const [playlistType, setPlaylistType] = useState<'setlist' | 'playlist'>(playlist?.type || 'setlist');
    const [badgeText, setBadgeText] = useState<string>(
        playlist?.badgeText !== undefined 
            ? playlist.badgeText 
            : (playlist?.type === 'playlist' ? 'Playlist' : 'Set List')
    );
    const [curatorText, setCuratorText] = useState(playlist?.curatorText || 'Apple Music Pop');
    const [bannerColor, setBannerColor] = useState(playlist?.bannerColor || '#93c5fd');
    const [selectedSongIds, setSelectedSongIds] = useState<string[]>(playlist?.songIds || []);
    const [songSearch, setSongSearch] = useState('');

    const availableSongs = useMemo(() => {
        if (!activeArtistData) return [];
        return activeArtistData.songs.filter(s => s.isReleased && !s.remixOfSongId);
    }, [activeArtistData]);

    const filteredAvailableSongs = useMemo(() => {
        if (!songSearch.trim()) return availableSongs;
        const q = songSearch.toLowerCase();
        return availableSongs.filter(s => s.title.toLowerCase().includes(q));
    }, [availableSongs, songSearch]);

    if (!activeArtist || !activeArtistData) return null;

    const artistImg = activeArtist.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';

    const handleToggleSong = (songId: string) => {
        if (selectedSongIds.includes(songId)) {
            setSelectedSongIds(selectedSongIds.filter(id => id !== songId));
        } else {
            setSelectedSongIds([...selectedSongIds, songId]);
        }
    };

    const handleMoveUp = (index: number) => {
        if (index <= 0) return;
        const copy = [...selectedSongIds];
        const temp = copy[index - 1];
        copy[index - 1] = copy[index];
        copy[index] = temp;
        setSelectedSongIds(copy);
    };

    const handleMoveDown = (index: number) => {
        if (index >= selectedSongIds.length - 1) return;
        const copy = [...selectedSongIds];
        const temp = copy[index + 1];
        copy[index + 1] = copy[index];
        copy[index] = temp;
        setSelectedSongIds(copy);
    };

    const handleRemoveTrack = (index: number) => {
        const copy = [...selectedSongIds];
        copy.splice(index, 1);
        setSelectedSongIds(copy);
    };

    const handleSave = () => {
        if (!title.trim()) {
            alert("Please enter a playlist title.");
            return;
        }

        if (isEditing && playlist) {
            dispatch({
                type: 'UPDATE_APPLE_MUSIC_PLAYLIST',
                payload: {
                    playlistId: playlist.id,
                    title: title.trim(),
                    playlistType,
                    badgeText: badgeText.trim() || (playlistType === 'setlist' ? 'Set List' : 'Playlist'),
                    curatorText,
                    bannerColor,
                    songIds: selectedSongIds,
                }
            });
        } else {
            dispatch({
                type: 'CREATE_APPLE_MUSIC_PLAYLIST',
                payload: {
                    title: title.trim(),
                    playlistType,
                    badgeText: badgeText.trim() || (playlistType === 'setlist' ? 'Set List' : 'Playlist'),
                    curatorText,
                    bannerColor,
                    songIds: selectedSongIds,
                }
            });
        }

        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/90 backdrop-blur-md">
                    <button 
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white font-semibold text-sm"
                    >
                        Cancel
                    </button>
                    <h2 className="text-base sm:text-lg font-bold">
                        {isEditing ? 'Edit Artist Playlist' : 'Create Artist Playlist'}
                    </h2>
                    <button 
                        onClick={handleSave}
                        className="bg-[#fa243c] hover:bg-[#d60017] text-white font-bold text-sm px-4 py-1.5 rounded-full transition-transform active:scale-95 shadow-md shadow-red-600/30"
                    >
                        {isEditing ? 'Save' : 'Create'}
                    </button>
                </header>

                {/* Body Content */}
                <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm">
                    {/* Live Cover Preview & Type Switcher */}
                    <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-center gap-5">
                        <AppleMusicPlaylistCover 
                            type={playlistType} 
                            badgeText={badgeText}
                            artistImage={artistImg} 
                            bannerColor={bannerColor}
                            className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl shrink-0" 
                        />
                        <div className="flex-1 w-full space-y-3">
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                                    Cover Header / Badge Name
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="text"
                                        value={badgeText}
                                        onChange={(e) => setBadgeText(e.target.value)}
                                        placeholder="e.g. Set List, Playlist, Tour, Live, Deluxe"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 text-white font-bold text-sm focus:outline-none focus:border-[#fa243c]"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    <span className="text-[11px] text-zinc-400 self-center mr-1">Quick presets:</span>
                                    {['Set List', 'Playlist', 'Tour', 'Live', 'Favorites', 'Essential'].map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => {
                                                setBadgeText(preset);
                                                if (preset === 'Set List' || preset === 'Tour' || preset === 'Live') {
                                                    setPlaylistType('setlist');
                                                } else {
                                                    setPlaylistType('playlist');
                                                }
                                            }}
                                            className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                                                badgeText.toLowerCase() === preset.toLowerCase()
                                                    ? 'bg-[#fa243c] border-[#fa243c] text-white'
                                                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                                            }`}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Banner Color Options */}
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                                    Top Banner Color
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {BANNER_COLOR_OPTIONS.map(c => (
                                        <button
                                            key={c.hex}
                                            type="button"
                                            onClick={() => setBannerColor(c.hex)}
                                            className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                                                bannerColor === c.hex ? 'border-white scale-110 ring-2 ring-[#fa243c]' : 'border-zinc-700 hover:scale-105'
                                            }`}
                                            style={{ backgroundColor: c.hex }}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Playlist Details Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                                Playlist Title
                            </label>
                            <input 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. KATSEYE's The BEAUTIFUL CHAOS Tour Set List"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white font-semibold focus:outline-none focus:border-[#fa243c]"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                                Apple Music Curator Tag / Subtitle
                            </label>
                            <div className="flex gap-2">
                                <select 
                                    value={curatorText}
                                    onChange={(e) => setCuratorText(e.target.value)}
                                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white flex-1 focus:outline-none focus:border-[#fa243c]"
                                >
                                    {CURATOR_TAG_OPTIONS.map(tag => (
                                        <option key={tag} value={tag}>{tag}</option>
                                    ))}
                                </select>
                                <input 
                                    type="text"
                                    value={curatorText}
                                    onChange={(e) => setCuratorText(e.target.value)}
                                    placeholder="Or custom curator tag"
                                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white flex-1 focus:outline-none focus:border-[#fa243c]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Selected Tracks & Ordering Section */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Playlist Tracklist & Positions ({selectedSongIds.length} Songs)
                                </h3>
                                <p className="text-xs text-zinc-400">Use the arrows to set exact track order and positions.</p>
                            </div>
                        </div>

                        {selectedSongIds.length > 0 ? (
                            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
                                {selectedSongIds.map((id, index) => {
                                    const song = availableSongs.find(s => s.id === id);
                                    if (!song) return null;
                                    return (
                                        <div key={`${id}_${index}`} className="flex items-center gap-3 p-2.5 hover:bg-zinc-900/60 transition-colors">
                                            <span className="w-6 text-center font-bold text-zinc-400 text-xs">
                                                {index + 1}
                                            </span>
                                            <img src={song.coverArt} alt={song.title} className="w-10 h-10 rounded-lg object-cover shadow-sm shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-white text-xs truncate">{song.title}</p>
                                                <p className="text-[11px] text-zinc-400 truncate">{song.genre || 'Pop'}</p>
                                            </div>
                                            {/* Reorder Buttons */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    disabled={index === 0}
                                                    onClick={() => handleMoveUp(index)}
                                                    className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg flex items-center justify-center text-xs text-white"
                                                    title="Move Up"
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={index === selectedSongIds.length - 1}
                                                    onClick={() => handleMoveDown(index)}
                                                    className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg flex items-center justify-center text-xs text-white"
                                                    title="Move Down"
                                                >
                                                    ▼
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTrack(index)}
                                                    className="w-7 h-7 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg flex items-center justify-center text-xs ml-1"
                                                    title="Remove Track"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-6 bg-zinc-950 border border-zinc-800/80 rounded-2xl text-center text-zinc-400">
                                <p className="text-xs">No songs added yet. Select songs below to include in this playlist.</p>
                            </div>
                        )}
                    </div>

                    {/* Pick from Discography */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Add Songs From Discography
                            </h3>
                            <span className="text-xs text-zinc-500">{availableSongs.length} Released Songs</span>
                        </div>

                        <input 
                            type="text"
                            value={songSearch}
                            onChange={(e) => setSongSearch(e.target.value)}
                            placeholder="Search songs to add..."
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#fa243c]"
                        />

                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                            {filteredAvailableSongs.map(song => {
                                const isSelected = selectedSongIds.includes(song.id);
                                return (
                                    <button
                                        key={song.id}
                                        type="button"
                                        onClick={() => handleToggleSong(song.id)}
                                        className={`w-full text-left p-2 rounded-xl flex items-center gap-3 border transition-all ${
                                            isSelected 
                                                ? 'bg-zinc-800/80 border-[#fa243c]' 
                                                : 'bg-zinc-950/60 border-zinc-800/60 hover:bg-zinc-800/40'
                                        }`}
                                    >
                                        <img src={song.coverArt} alt={song.title} className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-white text-xs truncate">{song.title}</p>
                                            <p className="text-[10px] text-zinc-400 truncate">{song.genre || 'Pop'}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                            isSelected ? 'bg-[#fa243c] text-white' : 'bg-zinc-800 text-zinc-400'
                                        }`}>
                                            {isSelected ? '✓ Added' : '+ Add'}
                                        </span>
                                    </button>
                                );
                            })}
                            {filteredAvailableSongs.length === 0 && (
                                <p className="text-center text-xs text-zinc-500 py-4">No matching songs found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppleMusicPlaylistModal;
