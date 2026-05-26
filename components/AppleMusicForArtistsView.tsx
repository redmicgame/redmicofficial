import React, { useState, useMemo } from 'react';
import { useGame, formatNumber, getFutureDate } from '../context/GameContext';
import { Song, Release } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';

const AppleMusicForArtistsView: React.FC = () => {
    const { gameState, dispatch, activeArtist } = useGame();
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);

    const activeArtistData = activeArtist ? gameState.artistsData[activeArtist.id] : null;

    if (!activeArtist || !activeArtistData) return null;

    const songs = activeArtistData.songs.filter(s => s.isReleased && !s.remixOfSongId).sort((a, b) => b.streams - a.streams);
    
    // Found upcoming releases
    const upcomingReleases = activeArtistData.labelSubmissions.filter(s => s.status === 'scheduled');

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
            const newDate = getFutureDate(gameState.currentDate, weeks);
            dispatch({
                type: 'EDIT_SUBMISSION_DATE',
                payload: { submissionId, newDate }
            });
            alert(`Release date changed to ${newDate.year} Week ${newDate.week}`);
        }
    };

    if (selectedSong) {
        return <AppleMusicSongDetail song={selectedSong} onBack={handleBack} />;
    }

    return (
        <div className="bg-white text-black min-h-screen font-sans">
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between p-4">
                <button onClick={handleBack} className="text-[#fa243c] flex items-center font-semibold">
                    <ChevronLeftIcon className="w-5 h-5 -ml-2" /> Back
                </button>
                <h1 className="font-bold text-lg">Apple Music for Artists</h1>
                <div className="w-8"></div>
            </header>
            
            <div className="p-4">
                {upcomingReleases.length > 0 && (
                    <div className="mb-8">
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
    );
};

const AppleMusicSongDetail: React.FC<{ song: Song, onBack: () => void }> = ({ song, onBack }) => {
    const { activeArtist } = useGame();
    
    const stats = useMemo(() => {
        const plays = song.streams * (0.3 + Math.random() * 0.1); // Apple Music plays
        const purchases = plays * 0.005; // 0.5% conversion to purchase
        return {
            plays: Math.floor(plays),
            avgDaily: Math.floor(plays / ((song.weeksOut || 1) * 7 + 1)),
            shazams: Math.floor(plays * 0.03), // 3% shazam rate
            purchases: Math.floor(purchases),
            us: Math.floor(plays * 0.45),
            uk: Math.floor(plays * 0.15),
            japan: Math.floor(plays * 0.1),
            canada: Math.floor(plays * 0.08),
        };
    }, [song.streams, song.weeksOut]);

    return (
        <div className="bg-white text-black min-h-screen font-sans">
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
