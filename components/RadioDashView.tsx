import React, { useState } from 'react';
import { useGame, formatNumber } from '../context/GameContext';

const RadioDashView: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const [selectedTab, setSelectedTab] = useState<'manage' | 'charts'>('manage');
    const [selectedChart, setSelectedChart] = useState<'overall' | 'pop' | 'urban' | 'rhythmic' | 'country' | 'christmas'>('overall');

    const activeArtistData = gameState.activeArtistId ? gameState.artistsData[gameState.activeArtistId] : null;

    const getActiveLabel = () => {
        if (!activeArtistData?.contract) return null;
        return activeArtistData.contract.labelId;
    };

    const getMaxRadioSongs = (labelId: string | null) => {
        if (!labelId) return 0;
        if (labelId === 'island' || labelId === 'atlantic' || labelId === 'tde') return 1;
        if (labelId === 'rca' || labelId === 'columbia' || labelId === 'quality_control') return 2;
        if (labelId === 'umg' || labelId === 'republic' || labelId === 'interscope' || labelId === 'epic' || labelId === 'roc_nation') return 3;
        // Assume petty labels handle up to 5 songs? Wait, the user said "petty labels can do up to 5 songs at a time".
        // But what defines a petty label? In GameContext, it's contractType === 'petty' or tier === 'Low'.
        if (labelId.includes('custom_')) return 5; 
        return 3; // fallback for any other standard label
    };

    const labelId = getActiveLabel();
    const maxSongs = getMaxRadioSongs(labelId);
    
    // Check if player has distro deal? Independent exception is if they have distribution deal...
    // Let's assume custom_ labels are the only other option so they get 5. If NO label, then 0.

    const songsOnRadioCount = activeArtistData?.songs.filter(s => s.isOnRadio).length || 0;

    const handleWithdraw = (songId: string, format: string) => {
        dispatch({ type: 'WITHDRAW_FROM_RADIO', payload: { songId, format } });
    };

    const handleSubmit = (songId: string, format: string) => {
        if (songsOnRadioCount >= maxSongs) {
            alert(`Your label restricts you to ${maxSongs} concurrent song(s) on radio.`);
            return;
        }
        dispatch({ type: 'SUBMIT_TO_RADIO', payload: { songId, format } });
    };

    const renderManage = () => {
        if (!activeArtistData) return null;

        if (maxSongs === 0) {
            return (
                <div className="p-4 flex flex-col items-center text-center justify-center h-64 text-zinc-500">
                    <p className="font-bold text-xl mb-2 text-black">NO LABEL AFFILIATION</p>
                    <p>You must be signed to a label to submit songs for radio airplay.</p>
                </div>
            );
        }

        return (
            <div className="p-4 space-y-6">
                <div>
                    <h2 className="text-xl font-bold mb-2">My Airplay</h2>
                    <p className="text-sm text-zinc-500 mb-4">Capacity: {songsOnRadioCount} / {maxSongs} active campaigns</p>
                    {activeArtistData.songs.filter(s => s.isOnRadio).map(song => (
                        <div key={song.id} className="bg-white p-3 rounded-lg border border-black shadow mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={song.coverArt} className="w-12 h-12 object-cover border border-black" />
                                <div>
                                    <p className="font-bold text-sm truncate w-40">{song.title}</p>
                                    <p className="text-xs text-zinc-500 pt-1">
                                        Plays: {formatNumber(song.radioPlays || 0)} TW • Format: {song.radioFormat?.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => handleWithdraw(song.id, song.radioFormat || 'pop')} className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded uppercase">Withdraw</button>
                        </div>
                    ))}
                    {songsOnRadioCount === 0 && <p className="text-zinc-400 text-sm italic">No active radio campaigns.</p>}
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-4 pt-4 border-t border-zinc-200">Submit New Track</h2>
                    {activeArtistData.songs.filter(s => !s.isOnRadio && s.isReleased).map(song => (
                        <div key={song.id} className="bg-white p-3 rounded border border-zinc-300 mb-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center w-full gap-3">
                                <img src={song.coverArt} className="w-10 h-10 object-cover border border-zinc-200" />
                                <p className="font-bold text-sm truncate flex-1">{song.title}</p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button onClick={() => handleSubmit(song.id, 'pop')} className="bg-blue-600 flex-1 text-white text-[10px] sm:text-xs font-bold px-2 py-1.5 rounded uppercase whitespace-nowrap">Pop</button>
                                <button onClick={() => handleSubmit(song.id, 'urban')} className="bg-orange-500 flex-1 text-white text-[10px] sm:text-xs font-bold px-2 py-1.5 rounded uppercase whitespace-nowrap">Urban</button>
                                <button onClick={() => handleSubmit(song.id, 'rhythmic')} className="bg-purple-500 flex-1 text-white text-[10px] sm:text-xs font-bold px-2 py-1.5 rounded uppercase whitespace-nowrap">Rhythm</button>
                                <button onClick={() => handleSubmit(song.id, 'country')} className="bg-green-600 flex-1 text-white text-[10px] sm:text-xs font-bold px-2 py-1.5 rounded uppercase whitespace-nowrap">Country</button>
                                {(gameState.date.week > 40 || gameState.date.week < 2) && (
                                    <button onClick={() => handleSubmit(song.id, 'christmas')} className="bg-red-600 flex-1 text-white text-[10px] sm:text-xs font-bold px-2 py-1.5 rounded uppercase whitespace-nowrap">Holiday</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderCharts = () => {
        let title = "ALL RADIO";
        let chartData = gameState.radioOverallChart || [];
        if (selectedChart === 'pop') { title = "POP RADIO"; chartData = gameState.radioPopChart || []; }
        if (selectedChart === 'urban') { title = "URBAN AC & HIP HOP"; chartData = gameState.radioUrbanChart || []; }
        if (selectedChart === 'rhythmic') { title = "RHYTHMIC"; chartData = gameState.radioRhythmicChart || []; }
        if (selectedChart === 'country') { title = "COUNTRY"; chartData = gameState.radioCountryChart || []; }
        if (selectedChart === 'christmas') { title = "HOLIDAY / CHRISTMAS"; chartData = gameState.radioChristmasChart || []; }

        const isInChristmasSeason = gameState.date.week > 40 || gameState.date.week < 2;

        return (
            <div className="p-0">
                <div className="flex overflow-x-auto p-4 gap-2 border-b border-zinc-200 bg-white items-center hide-scrollbar">
                    {['overall', 'pop', 'urban', 'rhythmic', 'country', isInChristmasSeason ? 'christmas' : null].filter(Boolean).map(c => (
                        <button key={c} onClick={() => setSelectedChart(c as any)} 
                                className={`px-3 py-1.5 whitespace-nowrap rounded font-bold text-xs uppercase ${selectedChart === c ? 'bg-black text-white' : 'bg-transparent text-zinc-500 border border-zinc-300'}`}>
                            {c}
                        </button>
                    ))}
                </div>
                <div className="p-4 bg-[#f8f9fa] min-h-[50vh]">
                    <h2 className="font-black text-xl mb-4 italic tracking-tight uppercase flex items-center justify-between">
                        <span>{title}</span>
                        <span className="text-red-600 text-xs text-right pr-2">MEDIABASE</span>
                    </h2>
                    {chartData.map((entry, idx) => (
                        <div key={idx} className="flex bg-white border border-zinc-200 mb-2 p-2 items-center">
                            <div className="w-8 text-center font-black text-zinc-800">{idx + 1}</div>
                            <img src={entry.coverArt} className="w-12 h-12 object-cover border border-zinc-100 mx-3" />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{entry.title}</p>
                                <p className="text-xs text-zinc-500 truncate">{entry.artist}</p>
                            </div>
                            <div className="text-right text-xs">
                                <p className="font-mono font-bold text-zinc-800">{formatNumber(entry.radioPlays || 0)}</p>
                                <p className="text-[9px] text-zinc-400">PLAYS TW</p>
                            </div>
                        </div>
                    ))}
                    {chartData.length === 0 && <p className="text-center text-zinc-500 py-10">Chart currently building...</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen font-sans pb-24 text-black">
            <header className="bg-black text-white p-4 sticky top-0 z-10 flex items-center justify-between">
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="font-bold text-sm">&larr; BACK</button>
                <div className="font-black italic tracking-widest text-lg ml-auto mr-auto pl-4">HITS</div>
            </header>

            <div className="flex border-b-2 border-black sticky top-14 bg-white z-10">
                <button 
                    onClick={() => setSelectedTab('manage')} 
                    className={`flex-1 py-3 text-sm font-black uppercase tracking-wider ${selectedTab === 'manage' ? 'border-b-4 border-black text-black' : 'text-zinc-400 border-b-4 border-transparent'}`}
                >
                    Manage
                </button>
                <button 
                    onClick={() => setSelectedTab('charts')} 
                    className={`flex-1 py-3 text-sm font-black uppercase tracking-wider ${selectedTab === 'charts' ? 'border-b-4 border-black text-black' : 'text-zinc-400 border-b-4 border-transparent'}`}
                >
                    Building Charts
                </button>
            </div>

            {selectedTab === 'manage' ? renderManage() : renderCharts()}
        </div>
    );
};

export default RadioDashView;
