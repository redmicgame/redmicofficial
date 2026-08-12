import React, { useState, useMemo } from 'react';
import { useGame, formatNumber, getFutureDate } from '../context/GameContext';
import { Song, Release } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import { PLAYLIST_PITCH_COST } from '../constants';

const FONT_OPTIONS = [
    { label: 'Default (Apple Sans)', value: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { label: 'Serif / Editorial', value: '"Playfair Display", Georgia, serif' },
    { label: 'Monospace / Tech', value: '"SF Mono", "Fira Code", Menlo, monospace' },
    { label: 'Display / Bold', value: '"Impact", "Arial Black", sans-serif' },
    { label: 'Handwritten / Script', value: '"Pacifico", "Brush Script MT", cursive' },
    { label: 'Geometric / Pop', value: '"Outfit", "Plus Jakarta Sans", sans-serif' },
];

const PRESET_COLORS = [
    { label: 'Black (Default)', hex: '#000000' },
    { label: 'Burgundy / Chocolate', hex: '#3b1c14' },
    { label: 'Dark Slate', hex: '#111827' },
    { label: 'Midnight Indigo', hex: '#1e1b4b' },
    { label: 'Deep Emerald', hex: '#064e3b' },
    { label: 'Dark Maroon', hex: '#3f0708' },
    { label: 'Royal Purple', hex: '#2e1065' },
    { label: 'Deep Blue', hex: '#172554' },
];

const SAMPLE_VIDEOS = [
    { name: 'Abstract Lights Loop', url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-lights-in-motion-41553-large.mp4' },
    { name: 'Atmospheric Smoke Loop', url: 'https://assets.mixkit.co/videos/preview/mixkit-purple-and-blue-smoke-41549-large.mp4' },
    { name: 'Neon Glitch Loop', url: 'https://assets.mixkit.co/videos/preview/mixkit-laser-lights-at-a-concert-41551-large.mp4' },
];

const AppleMusicForArtistsView: React.FC = () => {
    const { gameState, dispatch, activeArtist } = useGame();
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [showPitchModal, setShowPitchModal] = useState<Song | null>(null);
    const [customVideoInput, setCustomVideoInput] = useState('');

    const activeArtistData = activeArtist ? gameState.artistsData[activeArtist.id] : null;

    if (!activeArtist || !activeArtistData) return null;

    const songs = activeArtistData.songs.filter(s => s.isReleased && !s.remixOfSongId).sort((a, b) => b.streams - a.streams);
    
    // Found upcoming releases
    const upcomingReleases = activeArtistData.labelSubmissions.filter(s => s.status === 'scheduled');
    const albums = activeArtistData.releases.filter(r => (r.type === 'Album' || r.type === 'Album (Deluxe)' || r.type === 'Compilation' || r.type === 'Live Album') && !r.isTakenDown);
    
    const currentEssentialAlbums = albums.filter(a => a.isAppleMusicEssential);

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

    const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            dispatch({
                type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS',
                payload: { profileVideoUrl: objectUrl }
            });
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
    const currentBgColor = activeArtistData.appleMusicBgColor || '#000000';
    const currentVideoUrl = activeArtistData.appleMusicProfileVideoUrl || '';

    return (
        <div className="bg-white text-black h-full overflow-y-auto font-sans pb-24">
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between p-4">
                <button onClick={handleBack} className="text-[#fa243c] flex items-center font-semibold">
                    <ChevronLeftIcon className="w-5 h-5 -ml-2" /> Back
                </button>
                <h1 className="font-bold text-lg">Apple Music for Artists</h1>
                <div className="w-8"></div>
            </header>
            
            <div className="p-4 space-y-8">
                {/* PROFILE CUSTOMIZATION SECTION */}
                <div className="bg-zinc-900 text-white p-5 rounded-2xl shadow-md space-y-6">
                    <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">Profile Customization</h2>
                            <p className="text-xs text-zinc-400">Customize your Apple Music profile aesthetic & video</p>
                        </div>
                        <span className="text-xs bg-[#fa243c] text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">New</span>
                    </div>

                    {/* 1. Profile Video Upload */}
                    <div className="space-y-3">
                        <label className="font-semibold text-sm block">1. Profile Video (Up to 10 sec)</label>
                        <p className="text-xs text-zinc-400">Replaces static artist image with a looping profile video on Apple Music.</p>
                        
                        {currentVideoUrl ? (
                            <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-w-sm">
                                <video src={currentVideoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => dispatch({ type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS', payload: { profileVideoUrl: '' } })}
                                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow"
                                >
                                    Remove Video
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex gap-2 items-center">
                                    <label className="cursor-pointer bg-[#fa243c] hover:bg-[#d60017] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors inline-block">
                                        Upload Video from Device
                                        <input type="file" accept="video/*" onChange={handleVideoFileUpload} className="hidden" />
                                    </label>
                                    <span className="text-xs text-zinc-400">or pick sample:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {SAMPLE_VIDEOS.map((sv, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => dispatch({ type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS', payload: { profileVideoUrl: sv.url } })}
                                            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-md border border-zinc-700"
                                        >
                                            📹 {sv.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <input 
                                        type="text" 
                                        placeholder="Or paste video URL (e.g. .mp4)" 
                                        value={customVideoInput}
                                        onChange={(e) => setCustomVideoInput(e.target.value)}
                                        className="bg-zinc-800 border border-zinc-700 text-xs px-3 py-2 rounded-lg flex-1 text-white focus:outline-none focus:border-[#fa243c]"
                                    />
                                    <button 
                                        onClick={() => {
                                            if (customVideoInput.trim()) {
                                                dispatch({ type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS', payload: { profileVideoUrl: customVideoInput.trim() } });
                                                setCustomVideoInput('');
                                            }
                                        }}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-2 rounded-lg font-semibold"
                                    >
                                        Set URL
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Artist Name Font */}
                    <div className="space-y-3">
                        <label className="font-semibold text-sm block">2. Artist Name Font</label>
                        <select 
                            value={currentFont}
                            onChange={(e) => dispatch({ type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS', payload: { nameFont: e.target.value } })}
                            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:border-[#fa243c]"
                        >
                            {FONT_OPTIONS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center">
                            <span className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Preview</span>
                            <span style={{ fontFamily: currentFont }} className="text-2xl font-bold tracking-tight">
                                {activeArtist.name}
                            </span>
                        </div>
                    </div>

                    {/* 3. Background Color Selection */}
                    <div className="space-y-3">
                        <label className="font-semibold text-sm block">3. Background Color</label>
                        <p className="text-xs text-zinc-400">Choose pure black or a custom accent background for your Apple Music profile page.</p>
                        
                        <div className="flex flex-wrap items-center gap-2">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c.hex}
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

                        <div className="flex items-center gap-3 pt-2">
                            <label className="text-xs text-zinc-400">Color Wheel / Custom Hex:</label>
                            <input 
                                type="color" 
                                value={currentBgColor}
                                onChange={(e) => dispatch({ type: 'UPDATE_APPLE_MUSIC_ARTIST_SETTINGS', payload: { bgColor: e.target.value } })}
                                className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                            />
                            <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300">{currentBgColor}</span>
                        </div>
                    </div>
                </div>

                {/* UPCOMING RELEASES */}
                {upcomingReleases.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Upcoming Releases</h2>
                        <div className="space-y-4">
                            {upcomingReleases.map(sub => (
                                <div key={sub.id} className="flex items-center justify-between bg-zinc-100 p-4 rounded-lg">
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
                
                {/* PITCH TO EDITORS */}
                <div>
                    <div className="bg-zinc-100 p-4 rounded-lg space-y-3">
                        <h2 className="font-bold">Pitch to Apple Music Editors</h2>
                        <p className="text-sm text-zinc-600">
                        Pitch a song from an upcoming or recent release for placement on Today's Hits, A-List Pop, and more.
                        </p>
                        {pitchableSongs.length > 0 ? (
                        <div className="space-y-2">
                            {pitchableSongs.map((song) => (
                            <button
                                key={song.id}
                                onClick={() => setShowPitchModal(song)}
                                className="w-full text-left flex items-center gap-3 p-2 bg-white rounded-md hover:bg-zinc-200"
                            >
                                <img
                                src={song.coverArt}
                                className="w-10 h-10 rounded shadow-sm object-cover"
                                alt=""
                                />
                                <div>
                                <p className="font-semibold">{song.title}</p>
                                <p className="text-xs text-zinc-500">
                                    Eligible for pitching
                                </p>
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

                {/* ESSENTIAL ALBUMS SECTION */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h2 className="text-2xl font-bold">Essential Albums</h2>
                            <p className="text-xs text-zinc-500">Select up to 3 albums to feature as Essential Albums on Apple Music profile.</p>
                        </div>
                        <span className="text-xs font-bold bg-zinc-200 text-zinc-800 px-3 py-1 rounded-full">
                            {currentEssentialAlbums.length} / 3 Picked
                        </span>
                    </div>

                    {albums.length === 0 && <p className="text-zinc-500 text-sm">No albums released yet.</p>}
                    <div className="space-y-4">
                        {albums.map(album => {
                            const isEssential = album.isAppleMusicEssential || false;
                            return (
                                <div key={album.id} className={`p-4 rounded-xl border transition-all ${isEssential ? 'bg-zinc-900 text-white border-zinc-800 shadow-md' : 'bg-zinc-100 text-black border-zinc-200'}`}>
                                    <div className="flex items-center gap-4">
                                        <img src={album.coverArt} alt={album.title} className="w-16 h-16 rounded-md object-cover shadow-sm shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold truncate text-lg">{album.title}</h3>
                                            <p className={`text-sm ${isEssential ? 'text-zinc-400' : 'text-zinc-500'}`}>{album.releaseDate.year} • {album.songIds.length} tracks</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-zinc-200/20 pt-3 mt-3 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold">Mark as Essential Album (Up to 3)</span>
                                            <input 
                                                type="checkbox" 
                                                checked={isEssential} 
                                                onChange={(e) => handleToggleEssential(album, e.target.checked)}
                                                className="w-5 h-5 accent-[#fa243c] cursor-pointer"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between mt-1">
                                            <span className={`text-xs ${isEssential ? 'text-zinc-400' : 'text-zinc-500'}`}>Expanded Cover View</span>
                                            <input 
                                                type="checkbox" 
                                                checked={album.isAppleMusicExpandedCover || false} 
                                                onChange={(e) => dispatch({ type: 'TOGGLE_APPLE_MUSIC_EXPANDED_COVER', payload: { releaseId: album.id, enabled: e.target.checked } })}
                                                className="w-4 h-4 accent-[#fa243c] cursor-pointer"
                                            />
                                        </div>

                                        {isEssential && (
                                            <div className="flex flex-col gap-1 mt-2">
                                                <label className="text-xs text-zinc-400 font-medium">Editorial / Review Snippet:</label>
                                                <textarea 
                                                    rows={2}
                                                    value={album.appleMusicEssentialReview || ''}
                                                    onChange={(e) => dispatch({ type: 'MARK_APPLE_MUSIC_ESSENTIAL', payload: { releaseId: album.id, isEssential: true, reviewText: e.target.value } })}
                                                    placeholder="Write an editorial review snippet..."
                                                    className="bg-zinc-800 text-white text-xs p-2 rounded-lg w-full border border-zinc-700 focus:outline-none focus:border-[#fa243c]"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* YOUR SONGS STATS */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Your Songs</h2>
                    <div className="space-y-4">
                        {songs.map(song => (
                            <div key={song.id} onClick={() => setSelectedSong(song)} className="flex items-center gap-4 cursor-pointer hover:bg-zinc-50 p-2 rounded-lg -mx-2">
                                <img src={song.coverArt} alt={song.title} className="w-16 h-16 rounded-md object-cover shadow-sm" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{song.title}</h3>
                                    <p className="text-zinc-500 text-sm">{formatNumber(song.streams)} Plays</p>
                                </div>
                                <ChevronLeftIcon className="w-5 h-5 text-zinc-400 rotate-180" />
                            </div>
                        ))}
                        {songs.length === 0 && <p className="text-zinc-500 text-sm">No released songs yet.</p>}
                    </div>
                </div>
            </div>

            {showPitchModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowPitchModal(null)}
                >
                    <div
                        className="bg-white rounded-lg w-full max-w-md p-6 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold">
                            Pitch "{showPitchModal.title}" to Apple Music?
                        </h2>
                        <p className="text-zinc-600 my-4">
                            This will cost{" "}
                            <span className="font-bold text-black">
                                ${formatNumber(PLAYLIST_PITCH_COST)}
                            </span>
                            . Success is not guaranteed, but a successful pitch can significantly boost streams.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowPitchModal(null)}
                                className="w-full bg-zinc-200 py-2 rounded-full font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handlePitchSong(showPitchModal.id)}
                                disabled={activeArtistData.money < PLAYLIST_PITCH_COST}
                                className="w-full bg-[#fa243c] text-white py-2 rounded-full font-semibold disabled:bg-zinc-400"
                            >
                                Confirm Pitch
                            </button>
                        </div>
                    </div>
                </div>
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
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md flex items-center justify-between p-4">
                <button onClick={onBack} className="text-[#fa243c] flex items-center text-lg">
                    <ChevronLeftIcon className="w-7 h-7 -ml-2" /> Back
                </button>
                <span className="text-[#fa243c] text-sm">Lifetime</span>
            </header>

            <div className="p-4 pt-2">
                <div className="flex items-center gap-4 mb-8">
                    <img src={song.coverArt} alt={song.title} className="w-28 h-28 rounded-md shadow-lg object-cover" />
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
        <span className="text-zinc-500">{value}</span>
    </div>
);

export default AppleMusicForArtistsView;
