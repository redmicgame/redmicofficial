
import React, { useState } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { MANAGERS } from '../constants';
import { Manager } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ConfirmationModal from './ConfirmationModal';

const ManagementView: React.FC = () => {
    const { gameState, dispatch, activeArtistData } = useGame();
    const [confirmHire, setConfirmHire] = useState<{manager: Manager, years: number} | null>(null);
    const [confirmFire, setConfirmFire] = useState(false);
    const [selectedYears, setSelectedYears] = useState<Record<string, number>>({});
    
    // Playlist Buying State
    const [isBuyingPlaylist, setIsBuyingPlaylist] = useState(false);
    const [selectedSongId, setSelectedSongId] = useState<string>('');
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
    const [selectedPosition, setSelectedPosition] = useState<number>(50); // 50 is bottom (entry), 1 is top

    if (!activeArtistData) return null;
    const { money, manager, songs } = activeArtistData;

    const currentManager = manager ? MANAGERS.find(m => m.id === manager.id) : null;

    const handleHire = () => {
        if (confirmHire) {
            dispatch({ type: 'HIRE_MANAGER', payload: { managerId: confirmHire.manager.id, contractYears: confirmHire.years } });
            setConfirmHire(null);
        }
    };

    const handleFire = () => {
        dispatch({ type: 'FIRE_MANAGER' });
        setConfirmFire(false);
    };

    const availablePlaylists = gameState.spotifyPlaylists || [];
    const selectedPlaylist = availablePlaylists.find(p => p.id === selectedPlaylistId);
    
    // Cost calculation
    let playlistCost = 0;
    if (selectedPlaylist) {
        const baseCost = selectedPlaylist.followers * 0.02; // 2 cents per follower base
        const positionMultiplier = selectedPosition === 50 ? 1 : (50 / selectedPosition) * 1.5;
        
        let managerDiscount = 0;
        if (currentManager) {
            // up to 50% discount based on manager cost (e.g. 2,000,000 cost -> 50% discount)
            managerDiscount = Math.min(0.5, currentManager.yearlyCost / 4000000); 
        }

        playlistCost = Math.floor(baseCost * positionMultiplier * (1 - managerDiscount));
    }

    const handleBuyPlaylist = () => {
        if (selectedSongId && selectedPlaylistId && money >= playlistCost) {
            dispatch({
                type: 'BUY_PLAYLIST_ENTRY',
                payload: {
                    songId: selectedSongId,
                    playlistId: selectedPlaylistId,
                    position: selectedPosition,
                    cost: playlistCost
                }
            });
            setIsBuyingPlaylist(false);
        }
    };

    return (
        <>
            {confirmHire && (
                <ConfirmationModal
                    isOpen={!!confirmHire}
                    onClose={() => setConfirmHire(null)}
                    onConfirm={handleHire}
                    title={`Hire ${confirmHire.manager.name}?`}
                    message={`This will deduct $${formatNumber(confirmHire.manager.yearlyCost * confirmHire.years)} for a ${confirmHire.years}-year contract. Are you sure?`}
                    confirmText="Confirm Hire"
                />
            )}
            {confirmFire && currentManager && (
                 <ConfirmationModal
                    isOpen={confirmFire}
                    onClose={() => setConfirmFire(false)}
                    onConfirm={handleFire}
                    title={`Fire ${currentManager.name}?`}
                    message={`Are you sure you want to fire your manager? Their contract will be terminated immediately. You will not be refunded for the remainder of the year.`}
                    confirmText="Fire Manager"
                />
            )}
            {isBuyingPlaylist && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full p-6 space-y-4">
                        <h2 className="text-xl font-bold">Buy Playlist Placement</h2>
                        <p className="text-sm text-zinc-400">Managers can secure playlist spots for your songs, but it's expensive.</p>
                        
                        <div>
                            <label className="block text-sm font-bold mb-1">Select Song</label>
                            <select 
                                value={selectedSongId} 
                                onChange={e => setSelectedSongId(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2"
                            >
                                <option value="">-- Choose a song --</option>
                                {songs.filter(s => s.isReleased).map(s => (
                                    <option key={s.id} value={s.id}>{s.title}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">Select Playlist</label>
                            <select 
                                value={selectedPlaylistId} 
                                onChange={e => setSelectedPlaylistId(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2"
                            >
                                <option value="">-- Choose a playlist --</option>
                                {availablePlaylists.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({formatNumber(p.followers)} followers)</option>
                                ))}
                            </select>
                        </div>

                        {selectedPlaylistId && (
                            <div>
                                <label className="block text-sm font-bold mb-1">Target Position (1 = Top, 50 = Bottom)</label>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="50" 
                                    value={selectedPosition}
                                    onChange={e => setSelectedPosition(Number(e.target.value))}
                                    className="w-full"
                                />
                                <div className="text-center font-bold mt-1">Position #{selectedPosition}</div>
                            </div>
                        )}

                        {selectedPlaylistId && (
                            <div className="bg-zinc-800 p-3 rounded text-center">
                                <div className="text-sm text-zinc-400">Total Cost</div>
                                <div className={`text-xl font-bold ${money >= playlistCost ? 'text-green-400' : 'text-red-500'}`}>
                                    ${formatNumber(playlistCost)}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setIsBuyingPlaylist(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 font-bold p-2 rounded-lg">Cancel</button>
                            <button 
                                onClick={handleBuyPlaylist}
                                disabled={!selectedSongId || !selectedPlaylistId || money < playlistCost}
                                className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 disabled:text-zinc-400 font-bold p-2 rounded-lg"
                            >
                                Purchase
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="h-screen w-full bg-zinc-900 overflow-y-auto">
                <header className="p-4 flex items-center gap-4 sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10 border-b border-zinc-700/50">
                    <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="p-2 rounded-full hover:bg-white/10">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold">Management</h1>
                </header>
                <main className="p-4 space-y-6">
                    {currentManager ? (
                        <div className="bg-zinc-800 p-4 rounded-lg">
                            <h2 className="text-xl font-bold">Your Manager</h2>
                            <div className="mt-4 text-center">
                                <h3 className="text-2xl font-bold">{currentManager.name}</h3>
                                <p className="text-sm italic text-zinc-300 mt-1">"{currentManager.bio}"</p>
                                <p className="text-zinc-400 mt-2">Contract ends: W{manager!.contractEndDate.week}, {manager!.contractEndDate.year}</p>
                                <button onClick={() => setConfirmFire(true)} className="mt-4 bg-red-600/20 text-red-400 font-bold px-4 py-2 rounded-md text-sm hover:bg-red-600/40">
                                    Fire Manager
                                </button>
                            </div>
                            <div className="mt-6 pt-4 border-t border-zinc-700">
                                <h3 className="font-bold mb-4">Manager Actions</h3>
                                <button
                                    onClick={() => dispatch({type: 'REQUEST_PROMO_INTERVIEW'})}
                                    disabled={activeArtistData.requestedPromoInterview}
                                    className="w-full bg-blue-600 font-bold p-2 text-sm rounded-lg hover:bg-blue-500 disabled:bg-zinc-600 disabled:text-zinc-400 mb-3"
                                >
                                    {activeArtistData.requestedPromoInterview ? 'Promo Interview Requested' : 'Ask manager to find promo interview/show'}
                                </button>
                                <button
                                    onClick={() => setIsBuyingPlaylist(true)}
                                    disabled={!currentManager}
                                    className="w-full bg-green-600 font-bold p-2 text-sm rounded-lg hover:bg-green-500 disabled:bg-zinc-600 disabled:text-zinc-400 mb-6"
                                >
                                    {currentManager ? 'Buy Playlist Placement' : 'Requires a Manager'}
                                </button>
                                {activeArtistData.requestedPromoInterview && (
                                    <p className="text-xs text-zinc-400 mt-2 text-center mb-6">Your manager is looking for opportunities. Check your inbox next week.</p>
                                )}

                                <h3 className="font-bold mb-3">Automation Settings</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg cursor-pointer hover:bg-zinc-700">
                                        <span className="text-sm font-medium">Auto-distribute free songs from ASCAP</span>
                                        <input type="checkbox" checked={!!manager!.autoDistributeAscap} onChange={() => dispatch({ type: 'TOGGLE_MANAGER_SETTING', payload: { setting: 'autoDistributeAscap' }})} className="w-5 h-5 accent-red-600" />
                                    </label>
                                    <label className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg cursor-pointer hover:bg-zinc-700">
                                        <span className="text-sm font-medium">Auto-submit best work to Awards</span>
                                        <input type="checkbox" checked={!!manager!.autoSubmitAwards} onChange={() => dispatch({ type: 'TOGGLE_MANAGER_SETTING', payload: { setting: 'autoSubmitAwards' }})} className="w-5 h-5 accent-red-600" />
                                    </label>
                                    <label className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg cursor-pointer hover:bg-zinc-700">
                                        <span className="text-sm font-medium">Auto-submit to Coachella</span>
                                        <input type="checkbox" checked={!!manager!.autoSubmitCoachella} onChange={() => dispatch({ type: 'TOGGLE_MANAGER_SETTING', payload: { setting: 'autoSubmitCoachella' }})} className="w-5 h-5 accent-red-600" />
                                    </label>
                                    <label className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg cursor-pointer hover:bg-zinc-700">
                                        <span className="text-sm font-medium">Auto-make official audio (Custom video)</span>
                                        <input type="checkbox" checked={!!manager!.autoMakeOfficialAudio} onChange={() => dispatch({ type: 'TOGGLE_MANAGER_SETTING', payload: { setting: 'autoMakeOfficialAudio' }})} className="w-5 h-5 accent-red-600" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div>
                            <h2 className="text-xl font-bold mb-3">Available Managers</h2>
                            <div className="space-y-4">
                                {MANAGERS.map(m => {
                                    const years = selectedYears[m.id] || 1;
                                    const totalCost = m.yearlyCost * years;
                                    const canAfford = money >= totalCost;
                                    return (
                                        <div key={m.id} className="bg-zinc-800 p-4 rounded-lg flex flex-col gap-3">
                                            <div>
                                                <h3 className="text-xl font-bold">{m.name}</h3>
                                                <p className="text-sm italic text-zinc-300 mb-1">"{m.bio}"</p>
                                                <p className={`font-bold text-lg ${money >= m.yearlyCost ? 'text-green-400' : 'text-red-500'}`}>${formatNumber(m.yearlyCost)}<span className="text-sm font-normal text-zinc-400">/year</span></p>
                                                <ul className="list-disc list-inside text-sm text-zinc-300 mt-2 space-y-1">
                                                    <li>+{m.popularityBoost} yearly popularity</li>
                                                    <li>Auto-books {m.autoGigsPerWeek} gig{m.autoGigsPerWeek > 1 ? 's' : ''} per week</li>
                                                    <li>Unlocks Tier {m.unlocksTier} gigs</li>
                                                </ul>
                                            </div>
                                            <div className="flex gap-2">
                                                <select
                                                    value={years}
                                                    onChange={e => setSelectedYears(prev => ({...prev, [m.id]: Number(e.target.value)}))}
                                                    className="bg-zinc-700 border border-zinc-600 rounded p-2 text-sm font-bold flex-1"
                                                >
                                                    <option value={1}>1 Year (${formatNumber(m.yearlyCost * 1)})</option>
                                                    <option value={3}>3 Years (${formatNumber(m.yearlyCost * 3)})</option>
                                                    <option value={5}>5 Years (${formatNumber(m.yearlyCost * 5)})</option>
                                                    <option value={10}>10 Years (${formatNumber(m.yearlyCost * 10)})</option>
                                                </select>
                                                <button onClick={() => setConfirmHire({manager: m, years})} disabled={!canAfford} className="bg-red-600 font-bold p-2 px-6 rounded-lg disabled:bg-zinc-600">
                                                    Hire
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default ManagementView;
