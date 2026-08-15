import React, { useState, useMemo } from 'react';
import { useGame, formatNumber, getFutureDate } from '../context/GameContext';
import { Song, Release, AppleMusicPlaylist } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import PlusIcon from './icons/PlusIcon';
import { PLAYLIST_PITCH_COST } from '../constants';
import AppleMusicPlaylistModal from './AppleMusicPlaylistModal';
import { AppleMusicPlaylistCover } from './AppleMusicPlaylistDetailView';

const FONT_OPTIONS = [
    { label: 'Apple Sans / SF Pro (Default)', value: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { label: 'Editorial Serif / New York', value: '"Playfair Display", Georgia, "Times New Roman", serif' },
    { label: 'Classic Roman / Cinzel', value: '"Cinzel", "Baskerville", "Palatino Linotype", serif' },
    { label: 'Monospace Tech / Code', value: '"SF Mono", "Fira Code", Menlo, Monaco, monospace' },
    { label: 'Display Heavy / Impact', value: '"Impact", "Arial Black", "Trebuchet MS", sans-serif' },
    { label: 'Handwritten Script / Brush', value: '"Pacifico", "Caveat", "Brush Script MT", cursive' },
    { label: 'Geometric Pop / Jakarta', value: '"Outfit", "Plus Jakarta Sans", "Century Gothic", sans-serif' },
    { label: 'Neo-Grotesque Brutalist', value: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif' },
    { label: 'Gothic Blackletter / Old English', value: '"UnifrakturMaguntia", "Old English Text MT", serif' },
    { label: 'Y2K Futuristic / Cyber', value: '"Orbitron", "Syne", sans-serif' },
    { label: 'High Fashion Luxury / Didot', value: '"Didot", "Bodoni MT", "Playfair Display", serif' },
    { label: 'Retro 70s Disco / Groove', value: '"Righteous", "Cooper Black", cursive' },
    { label: 'Calligraphic Script / Elegance', value: '"Great Vibes", "Brush Script MT", cursive' },
    { label: 'Industrial Stencil / Bold', value: '"Stardos Stencil", "Impact", sans-serif' },
    { label: 'Vintage Typewriter / Mono', value: '"Courier New", Courier, monospace' },
    { label: 'Modern Clean Sans', value: '"Inter", -apple-system, sans-serif' },
];

const TEXT_STYLE_OPTIONS = [
    { label: 'Standard Solid', value: 'normal', className: '' },
    { label: 'Subtle Ambient Glow', value: 'glow', className: 'drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]' },
    { label: 'Neon Apple Red Glow', value: 'neon_red', className: 'drop-shadow-[0_0_15px_rgba(250,36,60,0.8)] text-white' },
    { label: 'Cyber Cyan Glow', value: 'neon_cyan', className: 'drop-shadow-[0_0_15px_rgba(56,189,248,0.8)] text-cyan-100' },
    { label: 'Luxury Letterspaced', value: 'spaced', className: 'tracking-[0.25em] uppercase' },
    { label: 'Dramatic Shadow', value: 'shadow', className: 'drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]' },
    { label: 'Italicized Flow', value: 'italic', className: 'italic' },
];

const PRESET_COLORS = [
    { label: 'Black (Default)', hex: '#000000' },
    { label: 'Burgundy / Chocolate', hex: '#3b1c14' },
    { label: 'Dark Slate Noir', hex: '#111827' },
    { label: 'Midnight Indigo', hex: '#1e1b4b' },
    { label: 'Deep Emerald', hex: '#064e3b' },
    { label: 'Dark Maroon', hex: '#3f0708' },
    { label: 'Royal Purple', hex: '#2e1065' },
    { label: 'Deep Sapphire Blue', hex: '#172554' },
    { label: 'Crimson Velvet', hex: '#4c0519' },
    { label: 'Oceanic Teal', hex: '#042f2e' },
    { label: 'Rich Amber Dusk', hex: '#451a03' },
    { label: 'Carbon Graphite', hex: '#18181b' },
];

const SAMPLE_PROFILE_VIDEOS = [
    { name: 'Abstract Lights Loop', url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-lights-in-motion-41553-large.mp4' },
    { name: 'Atmospheric Smoke Loop', url: 'https://assets.mixkit.co/videos/preview/mixkit-purple-and-blue-smoke-41549-large.mp4' },
    { name: 'Neon Glitch Waves', url: 'https://assets.mixkit.co/videos/preview/mixkit-laser-lights-at-a-concert-41551-large.mp4' },
    { name: 'Prism Color Reflection', url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-of-water-in-slow-motion-41555-large.mp4' },
];

const SAMPLE_ANIMATED_COVERS = [
    { name: 'Fluid Light Vortex', url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-lights-in-motion-41553-large.mp4' },
    { name: 'Neon Glow Pulse', url: 'https://assets.mixkit.co/videos/preview/mixkit-laser-lights-at-a-concert-41551-large.mp4' },
    { name: 'Ethereal Smoke Aurora', url: 'https://assets.mixkit.co/videos/preview/mixkit-purple-and-blue-smoke-41549-large.mp4' },
    { name: 'Cosmic Star Drift', url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-40453-large.mp4' },
];

const AppleMusicForArtistsView: React.FC = () => {
    const { gameState, dispatch, activeArtist } = useGame();
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [showPitchModal, setShowPitchModal] = useState<Song | null>(null);
    const [customVideoInput, setCustomVideoInput] = useState('');
    const [editingPlaylist, setEditingPlaylist] = useState<AppleMusicPlaylist | null | 'new'>(null);
    const [customCoverInputMap, setCustomCoverInputMap] = useState<Record<string, string>>({});

    const activeArtistData = activeArtist ? gameState.artistsData[activeArtist.id] : null;

    if (!activeArtist || !activeArtistData) return null;

    const songs = activeArtistData.songs.filter(s => s.isReleased && !s.remixOfSongId).sort((a, b) => b.streams - a.streams);
    
    // Found upcoming releases and albums
    const upcomingReleases = activeArtistData.labelSubmissions.filter(s => s.status === 'scheduled');
    const albums = activeArtistData.releases.filter(r => (r.type === 'Album' || r.type === 'Album (Deluxe)' || r.type === 'EP' || r.type === 'Compilation' || r.type === 'Live Album') && !r.isTakenDown);
    
    const currentEssentialAlbums = albums.filter(a => a.isAppleMusicEssential);
    const playlists = activeArtistData.appleMusicPlaylists || [];

    const handleBack = () => {
        if (selectedSong) {
            setSelectedSong(null);
        } else {
            dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
        }
    };

    const handleChangeDate = (submissionId: string) => {
        const weeks = parseInt(prompt("How many weeks from now do you want this to release? (e.g. 4)", "4") || "", 10);
        if (!isNaN(weeks) && weeks > 0) {
            const newDate = getFutureDate(gameState.date, weeks);
            dispatch({
                type: 'EDIT_SUBMISSION_DATE',
                payload: { submissionId, newDate }
            });
            alert(`Release date changed to ${newDate.year} Week ${newDate.week}`);
        }
    };

    const handlePitchSong = (songId: string) => {
        dispatch({ type: "PITCH_TO_APPLE_MUSIC_PLAYLIST", payload: { songId } });
        setShowPitchModal(null);
    };

    // Robust video upload using FileReader to avoid ephemeral blob URLs that break upon reopening
    const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                dispatch({
                    type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS',
                    payload: { profileVideoUrl: dataUrl }
                });
            };
            reader.readAsDataURL(file);
        }
    };

    // Robust Animated Album Cover upload
    const handleAnimatedAlbumCoverUpload = (releaseId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                dispatch({
                    type: 'SET_APPLE_MUSIC_ANIMATED_COVER',
                    payload: { releaseId, animatedCoverUrl: dataUrl }
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleToggleEssential = (album: Release, isChecked: boolean) => {
        if (isChecked) {
            if (currentEssentialAlbums.length >= 3) {
                alert("You can select up to 3 essential albums on Apple Music.");
                return;
            }
            const defaultReview = album.appleMusicEssentialReview || `${activeArtist.name}'s defining album, featuring groundbreaking production and hit singles.`;
            dispatch({
                type: 'MARK_APPLE_MUSIC_ESSENTIAL',
                payload: { releaseId: album.id, isEssential: true, reviewText: defaultReview }
            });
        } else {
            dispatch({
                type: 'MARK_APPLE_MUSIC_ESSENTIAL',
                payload: { releaseId: album.id, isEssential: false, reviewText: '' }
            });
        }
    };

    const pitchedSongIds = useMemo(
        () => new Set(activeArtistData.songs.filter(s => s.appleMusicPlaylistBoostWeeks && s.appleMusicPlaylistBoostWeeks > 0).map(s => s.id)),
        [activeArtistData.songs]
    );

    const pitchableSongs = useMemo(() => {
        return activeArtistData.songs.filter((s) => {
            const release = activeArtistData.releases.find((r) => r.id === s.releaseId);
            if (!release || pitchedSongIds.has(s.id)) return false;
            const weeksSinceRelease =
                gameState.date.year * 52 +
                gameState.date.week -
                (release.releaseDate.year * 52 + release.releaseDate.week);
            return weeksSinceRelease <= 4;
        });
    }, [activeArtistData.songs, activeArtistData.releases, gameState.date, pitchedSongIds]);

    if (selectedSong) {
        return <AppleMusicSongDetail song={selectedSong} onBack={handleBack} />;
    }

    const currentFont = activeArtistData.appleMusicNameFont || FONT_OPTIONS[0].value;
    const currentStyleKey = activeArtistData.appleMusicNameStyle || 'normal';
    const currentBgColor = activeArtistData.appleMusicBgColor || '#000000';
    const currentVideoUrl = activeArtistData.appleMusicProfileVideoUrl || '';

    const selectedStyleObj = TEXT_STYLE_OPTIONS.find(s => s.value === currentStyleKey) || TEXT_STYLE_OPTIONS[0];

    return (
        <div className="bg-white text-black h-full overflow-y-auto font-sans pb-28">
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between p-4">
                <button onClick={handleBack} className="text-[#fa243c] flex items-center font-semibold">
                    <ChevronLeftIcon className="w-5 h-5 -ml-2" /> Back
                </button>
                <h1 className="font-bold text-lg">Apple Music for Artists</h1>
                <div className="w-8"></div>
            </header>
            
            <div className="p-4 sm:p-6 space-y-8 max-w-4xl mx-auto">
                {/* 1. ARTIST PLAYLISTS & SET LISTS MANAGEMENT */}
                <div className="bg-zinc-900 text-white p-5 rounded-3xl shadow-lg space-y-6 border border-zinc-800">
                    <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold">Artist Playlists & Set Lists</h2>
                                <span className="text-[10px] bg-[#fa243c] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    Update
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Curate tour set lists and artist playlists showcased above Similar Artists on your Apple Music profile.
                            </p>
                        </div>
                        <button
                            onClick={() => setEditingPlaylist('new')}
                            className="bg-[#fa243c] hover:bg-[#d60017] text-white text-xs font-bold px-3.5 py-2 rounded-full flex items-center gap-1.5 shadow-md transition-transform active:scale-95 shrink-0"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Create Playlist</span>
                        </button>
                    </div>

                    {playlists.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {playlists.map(pl => (
                                <div key={pl.id} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl flex items-center gap-4 group">
                                    <AppleMusicPlaylistCover 
                                        type={pl.type} 
                                        artistImage={activeArtist.image || ''} 
                                        bannerColor={pl.bannerColor}
                                        className="w-20 h-20 rounded-xl shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                                pl.type === 'setlist' ? 'bg-amber-400/20 text-amber-300' : 'bg-blue-400/20 text-blue-300'
                                            }`}>
                                                {pl.type === 'setlist' ? 'Set List' : 'Playlist'}
                                            </span>
                                            <span className="text-[11px] text-zinc-400">{pl.songIds.length} tracks</span>
                                        </div>
                                        <h3 className="font-bold text-white text-sm truncate mt-1">{pl.title}</h3>
                                        <p className="text-xs text-zinc-400 truncate">{pl.curatorText || 'Apple Music Pop'}</p>
                                        
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => setEditingPlaylist(pl)}
                                                className="text-xs text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg font-semibold"
                                            >
                                                Edit Tracks
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Delete "${pl.title}"?`)) {
                                                        dispatch({ type: 'DELETE_APPLE_MUSIC_PLAYLIST', payload: { playlistId: pl.id } });
                                                    }
                                                }}
                                                className="text-xs text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/50 px-2 py-1 rounded-lg font-semibold"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-zinc-950/60 border border-zinc-800/80 p-6 rounded-2xl text-center space-y-3">
                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-xl">
                                🎵
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">No Artist Playlists Created Yet</h3>
                                <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                                    Create a tour Set List or custom Artist Playlist with your profile photo and ordered tracklist to display directly on Apple Music.
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingPlaylist('new')}
                                className="bg-[#fa243c] hover:bg-[#d60017] text-white text-xs font-bold px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-md"
                            >
                                <PlusIcon className="w-4 h-4" />
                                <span>Create Your First Set List / Playlist</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. PROFILE CUSTOMIZATION (FONTS, STYLES, BG & VIDEO) */}
                <div className="bg-zinc-900 text-white p-5 rounded-3xl shadow-lg space-y-6 border border-zinc-800">
                    <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">Profile Aesthetics & Video</h2>
                            <p className="text-xs text-zinc-400">Customize your Apple Music profile banner video, typography, and background color</p>
                        </div>
                    </div>

                    {/* Live Preview Box */}
                    <div 
                        style={{ backgroundColor: currentBgColor }} 
                        className="p-6 rounded-2xl border border-zinc-800 text-center relative overflow-hidden transition-colors"
                    >
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-2 font-bold">
                            Live Apple Music Profile Name Preview
                        </span>
                        <div className="py-4">
                            <span 
                                style={{ fontFamily: currentFont }} 
                                className={`text-4xl sm:text-5xl font-black tracking-tight text-white inline-block transition-all ${selectedStyleObj.className}`}
                            >
                                {activeArtist.name}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-400">
                            Font: <span className="text-white font-semibold">{FONT_OPTIONS.find(f => f.value === currentFont)?.label}</span> • Style: <span className="text-white font-semibold">{selectedStyleObj.label}</span>
                        </p>
                    </div>

                    {/* 1. Artist Name Font & Design */}
                    <div className="space-y-4">
                        <div>
                            <label className="font-semibold text-sm block mb-1.5">1. Artist Name Typography ({FONT_OPTIONS.length} Fonts)</label>
                            <select 
                                value={currentFont}
                                onChange={(e) => dispatch({ type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS', payload: { nameFont: e.target.value } })}
                                className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2.5 w-full focus:outline-none focus:border-[#fa243c]"
                            >
                                {FONT_OPTIONS.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="font-semibold text-sm block mb-1.5">2. Text Styling & Visual FX</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {TEXT_STYLE_OPTIONS.map(s => (
                                    <button
                                        key={s.value}
                                        type="button"
                                        onClick={() => dispatch({ type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS', payload: { nameStyle: s.value } })}
                                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                                            currentStyleKey === s.value
                                                ? 'bg-[#fa243c] border-transparent text-white shadow-lg'
                                                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 2. Profile Video Upload (FileReader fixed!) */}
                    <div className="space-y-3 border-t border-zinc-800 pt-4">
                        <label className="font-semibold text-sm block">3. Profile Video (Up to 10s Looping Video)</label>
                        <p className="text-xs text-zinc-400">Replaces the static artist header image with a seamless motion profile video on Apple Music.</p>
                        
                        {currentVideoUrl ? (
                            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-w-sm shadow-xl border border-zinc-800">
                                <video src={currentVideoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => dispatch({ type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS', payload: { profileVideoUrl: '' } })}
                                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg transition-transform active:scale-95"
                                >
                                    Remove Video
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2 items-center">
                                    <label className="cursor-pointer bg-[#fa243c] hover:bg-[#d60017] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-transform active:scale-95 inline-flex items-center gap-1.5 shadow-md">
                                        <span>📹</span>
                                        <span>Upload Video from Device</span>
                                        <input type="file" accept="video/*" onChange={handleVideoFileUpload} className="hidden" />
                                    </label>
                                    <span className="text-xs text-zinc-400">or pick sample motion loop:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {SAMPLE_PROFILE_VIDEOS.map((sv, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => dispatch({ type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS', payload: { profileVideoUrl: sv.url } })}
                                            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 font-medium"
                                        >
                                            ✨ {sv.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Or paste video URL (e.g. .mp4)" 
                                        value={customVideoInput}
                                        onChange={(e) => setCustomVideoInput(e.target.value)}
                                        className="bg-zinc-800 border border-zinc-700 text-xs px-3 py-2 rounded-xl flex-1 text-white focus:outline-none focus:border-[#fa243c]"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (customVideoInput.trim()) {
                                                dispatch({ type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS', payload: { profileVideoUrl: customVideoInput.trim() } });
                                                setCustomVideoInput('');
                                            }
                                        }}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-2 rounded-xl font-semibold"
                                    >
                                        Set URL
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Background Color Selection */}
                    <div className="space-y-3 border-t border-zinc-800 pt-4">
                        <label className="font-semibold text-sm block">4. Ambient Background Theme</label>
                        <p className="text-xs text-zinc-400">Choose deep black or a luxury accent tint for your Apple Music pages.</p>
                        
                        <div className="flex flex-wrap items-center gap-2">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c.hex}
                                    type="button"
                                    onClick={() => dispatch({ type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS', payload: { bgColor: c.hex } })}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                                        currentBgColor === c.hex ? 'border-white text-white bg-zinc-800 ring-2 ring-[#fa243c]' : 'border-zinc-700 text-zinc-300 bg-zinc-800/60 hover:bg-zinc-800'
                                    }`}
                                >
                                    <span className="w-3.5 h-3.5 rounded-full border border-zinc-500 inline-block shrink-0" style={{ backgroundColor: c.hex }} />
                                    <span>{c.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                            <label className="text-xs text-zinc-400 font-medium">Custom Color Picker / Hex:</label>
                            <input 
                                type="color" 
                                value={currentBgColor}
                                onChange={(e) => dispatch({ type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS', payload: { bgColor: e.target.value } })}
                                className="w-8 h-8 rounded-lg border-none cursor-pointer bg-transparent"
                            />
                            <span className="text-xs font-mono bg-zinc-800 px-2.5 py-1 rounded-lg text-zinc-300 border border-zinc-700">{currentBgColor}</span>
                        </div>
                    </div>
                </div>

                {/* 3. ANIMATED ALBUM COVERS & ESSENTIAL ALBUMS */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold">Albums & Animated Motion Artwork</h2>
                                <span className="text-xs bg-[#fa243c] text-white px-2 py-0.5 rounded-full font-bold uppercase">
                                    New
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Upload 10-second animated motion artwork videos for expanded album views and select Essential Albums.
                            </p>
                        </div>
                        <span className="text-xs font-bold bg-zinc-200 text-zinc-800 px-3 py-1 rounded-full shrink-0">
                            {currentEssentialAlbums.length} / 3 Essential
                        </span>
                    </div>

                    {albums.length === 0 && <p className="text-zinc-500 text-sm">No albums or EPs released yet.</p>}
                    <div className="space-y-4">
                        {albums.map(album => {
                            const isEssential = album.isAppleMusicEssential || false;
                            const isExpanded = album.isAppleMusicExpandedCover || false;
                            const animatedCoverUrl = album.appleMusicAnimatedCoverUrl || '';

                            return (
                                <div key={album.id} className="p-5 rounded-2xl border bg-zinc-900 text-white border-zinc-800 shadow-md space-y-4">
                                    <div className="flex items-center gap-4">
                                        {animatedCoverUrl ? (
                                            <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-lg border border-zinc-700 shrink-0">
                                                <video src={animatedCoverUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                                <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-bold px-1 rounded text-white">Motion</span>
                                            </div>
                                        ) : (
                                            <img src={album.coverArt} alt={album.title} className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover shadow-lg shrink-0 border border-zinc-800" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold truncate text-lg text-white">{album.title}</h3>
                                                <span className="text-[10px] bg-zinc-800 text-zinc-300 font-bold px-2 py-0.5 rounded">
                                                    {album.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 mt-0.5">{album.releaseDate.year} • {album.songIds.length} tracks</p>
                                        </div>
                                    </div>

                                    {/* Controls & Animated Cover Uploader */}
                                    <div className="border-t border-zinc-800 pt-3 space-y-3">
                                        {/* Toggles */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                                <div>
                                                    <span className="text-xs font-bold text-white block">Expanded Cover Hero View</span>
                                                    <span className="text-[10px] text-zinc-400">Large immersive hero header on Apple Music</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isExpanded} 
                                                    onChange={(e) => dispatch({ type: 'TOGGLE_APPLE_MUSIC_EXPANDED_COVER', payload: { releaseId: album.id, enabled: e.target.checked } })}
                                                    className="w-5 h-5 accent-[#fa243c] cursor-pointer"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                                <div>
                                                    <span className="text-xs font-bold text-white block">Mark as Essential Album</span>
                                                    <span className="text-[10px] text-zinc-400">Highlighted banner & Pitchfork snippet</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isEssential} 
                                                    onChange={(e) => handleToggleEssential(album, e.target.checked)}
                                                    className="w-5 h-5 accent-[#fa243c] cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        {/* Animated Album Cover Video (10-second max) */}
                                        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                                        <span>✦</span>
                                                        <span>Animated Album Cover Video (Up to 10s Loop)</span>
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400">
                                                        Plays automatically in expanded detailed view on Apple Music.
                                                    </span>
                                                </div>
                                            </div>

                                            {animatedCoverUrl ? (
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-28 aspect-square rounded-xl overflow-hidden bg-black shadow-md border border-zinc-700 shrink-0">
                                                        <video src={animatedCoverUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                                                            <span>✓</span>
                                                            <span>Animated motion cover active!</span>
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => dispatch({ type: 'SET_APPLE_MUSIC_ANIMATED_COVER', payload: { releaseId: album.id, animatedCoverUrl: '' } })}
                                                            className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition-transform active:scale-95 shadow"
                                                        >
                                                            Remove Animated Video
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        <label className="cursor-pointer bg-[#fa243c] hover:bg-[#d60017] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-transform active:scale-95 inline-flex items-center gap-1 shadow">
                                                            <span>📹</span>
                                                            <span>Upload 10s Video</span>
                                                            <input type="file" accept="video/*" onChange={(e) => handleAnimatedAlbumCoverUpload(album.id, e)} className="hidden" />
                                                        </label>
                                                        <span className="text-[11px] text-zinc-400">or sample:</span>
                                                        {SAMPLE_ANIMATED_COVERS.map((sc, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => dispatch({ type: 'SET_APPLE_MUSIC_ANIMATED_COVER', payload: { releaseId: album.id, animatedCoverUrl: sc.url } })}
                                                                className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-700"
                                                            >
                                                                {sc.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2 pt-1">
                                                        <input 
                                                            type="text"
                                                            placeholder="Or paste direct video URL (.mp4)"
                                                            value={customCoverInputMap[album.id] || ''}
                                                            onChange={(e) => setCustomCoverInputMap({ ...customCoverInputMap, [album.id]: e.target.value })}
                                                            className="bg-zinc-800 border border-zinc-700 text-[11px] px-2.5 py-1.5 rounded-lg flex-1 text-white focus:outline-none focus:border-[#fa243c]"
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                const val = (customCoverInputMap[album.id] || '').trim();
                                                                if (val) {
                                                                    dispatch({ type: 'SET_APPLE_MUSIC_ANIMATED_COVER', payload: { releaseId: album.id, animatedCoverUrl: val } });
                                                                    setCustomCoverInputMap({ ...customCoverInputMap, [album.id]: '' });
                                                                }
                                                            }}
                                                            className="bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] px-3 py-1.5 rounded-lg font-semibold"
                                                        >
                                                            Set Video
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {isEssential && (
                                            <div className="flex flex-col gap-1 mt-2">
                                                <label className="text-xs text-zinc-400 font-medium">Essential Review / Editorial Snippet:</label>
                                                <textarea 
                                                    rows={2}
                                                    value={album.appleMusicEssentialReview || ''}
                                                    onChange={(e) => dispatch({ type: 'MARK_APPLE_MUSIC_ESSENTIAL', payload: { releaseId: album.id, isEssential: true, reviewText: e.target.value } })}
                                                    placeholder="Write an editorial review snippet..."
                                                    className="bg-zinc-800 text-white text-xs p-2.5 rounded-xl w-full border border-zinc-700 focus:outline-none focus:border-[#fa243c]"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. UPCOMING RELEASES */}
                {upcomingReleases.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Upcoming Releases</h2>
                        <div className="space-y-4">
                            {upcomingReleases.map(sub => (
                                <div key={sub.id} className="flex items-center justify-between bg-zinc-100 p-4 rounded-xl">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg">{sub.release.title}</h3>
                                        <p className="text-sm text-zinc-500">Scheduled for Year {sub.projectReleaseDate?.year} Week {sub.projectReleaseDate?.week}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleChangeDate(sub.id)}
                                        className="bg-[#fa243c] text-white px-4 py-2 rounded-full text-sm font-bold"
                                    >
                                        Change Date
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* 5. PITCH TO APPLE MUSIC EDITORS */}
                <div>
                    <div className="bg-zinc-100 p-5 rounded-2xl space-y-3">
                        <h2 className="font-bold text-lg">Pitch to Apple Music Editors</h2>
                        <p className="text-sm text-zinc-600">
                            Pitch a song from an upcoming or recent release for placement on Today's Hits, A-List Pop, and more.
                        </p>
                        {pitchableSongs.length > 0 ? (
                            <div className="space-y-2">
                                {pitchableSongs.map((song) => (
                                    <button
                                        key={song.id}
                                        onClick={() => setShowPitchModal(song)}
                                        className="w-full text-left flex items-center gap-3 p-2.5 bg-white rounded-xl hover:bg-zinc-200 transition-colors shadow-sm"
                                    >
                                        <img
                                            src={song.coverArt}
                                            className="w-10 h-10 rounded-lg shadow-sm object-cover"
                                            alt=""
                                        />
                                        <div>
                                            <p className="font-semibold text-sm">{song.title}</p>
                                            <p className="text-xs text-zinc-500">Eligible for pitching</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-500">
                                No songs eligible for pitching right now.
                            </p>
                        )}
                    </div>
                </div>

                {/* 6. YOUR SONGS STATS */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Your Songs</h2>
                    <div className="space-y-3">
                        {songs.map(song => (
                            <div key={song.id} onClick={() => setSelectedSong(song)} className="flex items-center gap-4 cursor-pointer hover:bg-zinc-50 p-2.5 rounded-xl -mx-2 transition-colors">
                                <img src={song.coverArt} alt={song.title} className="w-14 h-14 rounded-lg object-cover shadow-sm" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm truncate">{song.title}</h3>
                                    <p className="text-zinc-500 text-xs mt-0.5">{formatNumber(song.streams)} Plays</p>
                                </div>
                                <ChevronLeftIcon className="w-5 h-5 text-zinc-400 rotate-180" />
                            </div>
                        ))}
                        {songs.length === 0 && <p className="text-zinc-500 text-sm">No released songs yet.</p>}
                    </div>
                </div>
            </div>

            {/* Pitch Modal */}
            {showPitchModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowPitchModal(null)}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-md p-6 text-center shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold">
                            Pitch "{showPitchModal.title}" to Apple Music?
                        </h2>
                        <p className="text-zinc-600 my-4 text-sm leading-relaxed">
                            This will cost{" "}
                            <span className="font-bold text-black">
                                ${formatNumber(PLAYLIST_PITCH_COST)}
                            </span>
                            . Placement boosts streams across Apple Music editorial playlists.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPitchModal(null)}
                                className="w-full bg-zinc-200 hover:bg-zinc-300 py-3 rounded-full font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handlePitchSong(showPitchModal.id)}
                                disabled={activeArtistData.money < PLAYLIST_PITCH_COST}
                                className="w-full bg-[#fa243c] hover:bg-[#d60017] text-white py-3 rounded-full font-bold text-sm disabled:bg-zinc-400"
                            >
                                Confirm Pitch
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Playlist Creator / Editor Modal */}
            {editingPlaylist && (
                <AppleMusicPlaylistModal
                    playlist={editingPlaylist === 'new' ? null : editingPlaylist}
                    onClose={() => setEditingPlaylist(null)}
                />
            )}
        </div>
    );
};

const AppleMusicSongDetail: React.FC<{ song: Song, onBack: () => void }> = ({ song, onBack }) => {
    const { activeArtist } = useGame();
    
    const stats = useMemo(() => {
        const plays = song.streams * (0.3 + Math.random() * 0.1);
        const purchases = plays * 0.005;
        return {
            plays: Math.floor(plays),
            avgDaily: Math.floor(plays / ((song.weeksOut || 1) * 7 + 1)),
            shazams: Math.floor(plays * 0.03),
            purchases: Math.floor(purchases),
            us: Math.floor(plays * 0.45),
            uk: Math.floor(plays * 0.15),
            japan: Math.floor(plays * 0.1),
            canada: Math.floor(plays * 0.08),
        };
    }, [song.streams, song.weeksOut]);

    return (
        <div className="bg-white text-black h-full overflow-y-auto font-sans pb-24">
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md flex items-center justify-between p-4 border-b border-zinc-200">
                <button onClick={onBack} className="text-[#fa243c] flex items-center text-lg font-semibold">
                    <ChevronLeftIcon className="w-7 h-7 -ml-2" /> Back
                </button>
                <span className="text-[#fa243c] text-sm font-semibold">Lifetime</span>
            </header>

            <div className="p-4 pt-2 max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <img src={song.coverArt} alt={song.title} className="w-28 h-28 rounded-2xl shadow-lg object-cover" />
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{song.title}</h2>
                        <p className="text-lg text-zinc-600">{activeArtist?.name}</p>
                    </div>
                </div>

                <div className="border-t border-zinc-200">
                    <StatRow label="Plays" value={formatNumber(stats.plays)} />
                    <StatRow label="Average Daily Listeners" value={formatNumber(stats.avgDaily)} />
                    <StatRow label="Shazams" value={formatNumber(stats.shazams)} />
                    <StatRow label="Song Purchases" value={formatNumber(stats.purchases)} />
                </div>

                <h3 className="text-xl font-bold mt-8 mb-2 px-1">Top Countries/Regions</h3>
                <div className="border-t border-zinc-200">
                    <StatRow label="United States" value={formatNumber(stats.us)} />
                    <StatRow label="Japan" value={formatNumber(stats.japan)} />
                    <StatRow label="United Kingdom" value={formatNumber(stats.uk)} />
                    <StatRow label="Canada" value={formatNumber(stats.canada)} />
                </div>
            </div>
        </div>
    );
};

const StatRow: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-4 border-b border-zinc-200 px-1">
        <span className="text-black font-medium">{label}</span>
        <span className="text-zinc-500 font-semibold">{value}</span>
    </div>
);

export default AppleMusicForArtistsView;
