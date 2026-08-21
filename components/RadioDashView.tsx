import React, { useState } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import {
    RADIO_FORMATS,
    getRadioFormatById,
    getFormatCompatibilityMultiplier,
    normalizeRadioFormatId,
    getFormatMaxImpressions,
} from '../constants/radioFormats';
import type { Song } from '../types';

const RadioDashView: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const [selectedTab, setSelectedTab] = useState<'manage' | 'charts'>('manage');
    const [metricMode, setMetricMode] = useState<'plays' | 'impressions'>('plays');
    const [selectedChart, setSelectedChart] = useState<string>('overall');
    const [promoSongId, setPromoSongId] = useState<string | null>(null);
    const [promoFormat, setPromoFormat] = useState<string>('chr');
    const [promoAmount, setPromoAmount] = useState<number>(10000);
    const [promoSource, setPromoSource] = useState<'personal' | 'label'>('personal');
    const [selectedRegion, setSelectedRegion] = useState<'US' | 'UK'>('US');

    // Multi-format submission modal / selection state
    const [submittingSongId, setSubmittingSongId] = useState<string | null>(null);
    const [selectedFormats, setSelectedFormats] = useState<string[]>(['chr']);

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
        if (labelId.includes('custom_')) return 5; 
        return 3; 
    };

    const labelId = getActiveLabel();
    const maxSongs = getMaxRadioSongs(labelId);

    const isSigned = !!activeArtistData?.contract;
    const isCustomLabel = !!activeArtistData?.contract?.isCustom;
    const creativeControl = activeArtistData?.contract?.creativeControl || 'Medium';
    const labelName = isCustomLabel
        ? (gameState.customLabels?.find(l => l.id === activeArtistData?.contract?.labelId)?.name || 'Custom Label')
        : (activeArtistData?.contract?.labelId ? activeArtistData.contract.labelId.toUpperCase() : 'Record Label');

    const isOfficialSingle = (song: Song): boolean => {
        if (song.singleType === 'lead' || song.singleType === 'standalone') return true;
        if (activeArtistData?.releases?.some(r => r.type === 'Single' && r.songIds.includes(song.id))) return true;
        if (activeArtistData?.labelSubmissions?.some(sub => sub.singlesToRelease?.some(s => s.songId === song.id))) return true;
        return false;
    };

    const getRadioEligibility = (song: Song): { eligible: boolean; badgeText: string; badgeColor: string; reason?: string } => {
        const isSingle = isOfficialSingle(song);
        if (isSingle) {
            return {
                eligible: true,
                badgeText: 'Official Single',
                badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
            };
        }

        // Song is a non-single (album cut / deep cut)
        if (!isSigned || isCustomLabel) {
            return {
                eligible: true,
                badgeText: 'Album Cut (Independent Control)',
                badgeColor: 'bg-zinc-100 text-zinc-700 border-zinc-300'
            };
        }

        if (creativeControl === 'Low') {
            return {
                eligible: false,
                badgeText: 'Album Cut (Label Blocked)',
                badgeColor: 'bg-red-100 text-red-800 border-red-300',
                reason: `${labelName} refuses to service "${song.title}" to radio. Under your Low Creative Control contract, the label strictly reserves radio campaigns for official singles.`
            };
        }

        if (creativeControl === 'Medium') {
            const hasViralMomentum = (song.streams || 0) >= 1000000;
            if (hasViralMomentum) {
                return {
                    eligible: true,
                    badgeText: 'Album Cut (1M+ Viral Approved)',
                    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                    reason: `${labelName} agreed to push "${song.title}" to radio thanks to overwhelming organic streaming demand (1M+ streams).`
                };
            } else {
                return {
                    eligible: false,
                    badgeText: 'Album Cut (Needs 1M Streams)',
                    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
                    reason: `${labelName} is unwilling to send non-singles to radio without proven organic traction. "${song.title}" needs at least 1,000,000 streams before the label will service it to radio.`
                };
            }
        }

        // High Creative Control
        return {
            eligible: true,
            badgeText: 'Album Cut (Artist Override)',
            badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
            reason: `Your High Creative Control contract gives you the leverage to send album tracks to radio despite label hesitation.`
        };
    };

    if (activeArtistData?.isBlacklistedByLabel) {
        return (
            <div className="flex flex-col h-full bg-zinc-900 text-white">
                <header className="flex items-center p-4 bg-zinc-800 shrink-0 gap-4">
                    <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="p-2 rounded-full hover:bg-white/10">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h1 className="text-2xl font-bold">Radio</h1>
                </header>
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Blacklisted by Label</h2>
                    <p className="text-zinc-400">Your label has blacklisted you and pulled all your music from radio rotation.</p>
                </div>
            </div>
        );
    }
    
    const songsOnRadioCount = activeArtistData?.songs.filter(s => s.isOnRadio || s.isOnUkRadio).length || 0;

    const handleWithdraw = (songId: string, format?: string, region: 'US' | 'UK' = 'US') => {
        dispatch({ type: 'WITHDRAW_FROM_RADIO', payload: { songId, format, region } });
    };

    const openSubmitModal = (song: Song) => {
        const eligibility = getRadioEligibility(song);
        if (!eligibility.eligible) {
            alert(eligibility.reason || "Your record label does not permit servicing this non-single track to radio.");
            return;
        }
        setSubmittingSongId(song.id);
        const existing = (song.radioFormats && song.radioFormats.length > 0)
            ? song.radioFormats.map(normalizeRadioFormatId)
            : (song.radioFormat ? [normalizeRadioFormatId(song.radioFormat)] : ['chr']);
        setSelectedFormats(existing);
    };

    const toggleFormatSelection = (formatId: string) => {
        if (selectedFormats.includes(formatId)) {
            if (selectedFormats.length === 1) {
                // Must keep at least 1
                return;
            }
            setSelectedFormats(selectedFormats.filter(f => f !== formatId));
        } else {
            if (selectedFormats.length >= 5) {
                alert("You can send a song to up to 5 radio formats maximum.");
                return;
            }
            setSelectedFormats([...selectedFormats, formatId]);
        }
    };

    const handleConfirmSubmit = (songId: string) => {
        if (selectedFormats.length === 0) {
            alert("Please select at least 1 radio format.");
            return;
        }
        if (selectedFormats.length > 5) {
            alert("You can select up to 5 radio formats max.");
            return;
        }

        const song = activeArtistData?.songs.find(s => s.id === songId);
        const isAlreadyOnRadio = selectedRegion === 'US' ? song?.isOnRadio : song?.isOnUkRadio;

        if (!isAlreadyOnRadio) {
            const onRadioCount = activeArtistData?.songs.filter(s => selectedRegion === 'US' ? s.isOnRadio : s.isOnUkRadio).length || 0;
            if (onRadioCount >= maxSongs) {
                alert(`Your label restricts you to ${maxSongs} concurrent song(s) on ${selectedRegion} radio.`);
                return;
            }
        }

        dispatch({ 
            type: 'SUBMIT_TO_RADIO', 
            payload: { 
                songId, 
                formats: selectedFormats,
                format: selectedFormats[0],
                region: selectedRegion 
            } 
        });

        setSubmittingSongId(null);
    };

    const handlePromote = (songId: string, formatId: string, region: 'US'|'UK' = 'US') => {
        const activePayolaCount = activeArtistData?.songs.filter(s => s.hasRadioPromo || s.hasUkRadioPromo).length || 0;
        if (gameState.difficultyMode === 'hard' && activePayolaCount >= 2) {
            alert('You can only have 2 songs active in payola on Hard mode.');
            return;
        }
        if (gameState.difficultyMode === 'extreme' && activePayolaCount >= 1) {
            alert('You can only have 1 song active in payola on Extreme mode.');
            return;
        }

        if (promoSource === 'personal' && (activeArtistData?.money || 0) < promoAmount) {
            alert("Not enough personal funds.");
            return;
        }
        if (promoSource === 'label' && (!activeArtistData?.contract || activeArtistData.contract.marketingBudget < promoAmount)) {
            alert("Not enough label marketing budget.");
            return;
        }
        const song = activeArtistData?.songs.find(s => s.id === songId);
        const normalizedTargetFmt = normalizeRadioFormatId(formatId || song?.radioFormats?.[0] || song?.radioFormat || 'chr');

        if (region === 'US' && song?.formatHasRadioPromo?.[normalizedTargetFmt]) {
            alert(`Payola is already active for ${normalizedTargetFmt.toUpperCase()} format this week.`);
            return;
        }

        dispatch({ type: 'PROMOTE_RADIO', payload: { songId, format: normalizedTargetFmt, amount: promoAmount, source: promoSource, region } });
        setPromoSongId(null);
        const fmtObj = getRadioFormatById(normalizedTargetFmt);
        alert(`Successfully invested $${formatNumber(promoAmount)} in ${fmtObj?.shortName || normalizedTargetFmt.toUpperCase()} radio promotion!`);
    };

    const formatMetricValue = (plays: number, impressions: number) => {
        if (metricMode === 'plays') {
            return `${formatNumber(Math.floor(plays))} plays`;
        } else {
            return `${formatNumber(Math.floor(impressions))} imp.`;
        }
    };

    const renderManage = () => {
        if (!activeArtistData) return null;

        const usRadioSongs = activeArtistData.songs.filter(s => s.isOnRadio).map(s => ({...s, _region: 'US' as 'US'|'UK', _key: s.id + '_us'}));
        const ukRadioSongs = activeArtistData.songs.filter(s => s.isOnUkRadio).map(s => ({...s, _region: 'UK' as 'US'|'UK', _key: s.id + '_uk'}));
        const activeRadioSongs = [...usRadioSongs, ...ukRadioSongs];

        if (maxSongs === 0) {
            return (
                <div className="p-4 flex flex-col items-center text-center justify-center h-64 text-zinc-500">
                    <p className="font-bold text-xl mb-2 text-black">NO LABEL AFFILIATION</p>
                    <p>You must be signed to a label to submit songs for radio airplay.</p>
                </div>
            );
        }

        const targetSubmittingSong = activeArtistData.songs.find(s => s.id === submittingSongId);

        return (
            <div className="p-4 space-y-6">
                {/* Modal for selecting up to 5 formats */}
                {targetSubmittingSong && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-zinc-300 animate-in fade-in zoom-in duration-150">
                            <div className="bg-black text-white p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-base">Select Radio Formats</h3>
                                    <p className="text-xs text-zinc-400">Choose up to 5 formats for &ldquo;{targetSubmittingSong.title}&rdquo; ({targetSubmittingSong.genre || 'Pop'})</p>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${selectedFormats.length > 5 ? 'bg-red-500 text-white' : selectedFormats.length > 0 ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
                                    {selectedFormats.length} / 5 Formats
                                </span>
                            </div>

                            <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-zinc-100">
                                <div className="text-xs text-zinc-600 mb-2 font-medium bg-zinc-50 p-2.5 rounded border border-zinc-200">
                                    💡 Total plays and audience across all active formats are aggregated on the national charts and Billboard Hot 100.
                                </div>
                                {RADIO_FORMATS.map(fmt => {
                                    const isSelected = selectedFormats.includes(fmt.id);
                                    const compat = getFormatCompatibilityMultiplier(targetSubmittingSong.genre || 'pop', fmt.id);
                                    let compatBadge = { text: 'High Compatibility', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
                                    if (compat <= 0.05) compatBadge = { text: 'Incompatible', color: 'bg-red-100 text-red-800 border-red-300' };
                                    else if (compat < 0.4) compatBadge = { text: 'Low Compatibility', color: 'bg-amber-100 text-amber-800 border-amber-300' };
                                    else if (compat < 0.8) compatBadge = { text: 'Moderate Compatibility', color: 'bg-blue-100 text-blue-800 border-blue-300' };

                                    return (
                                        <div 
                                            key={fmt.id}
                                            onClick={() => toggleFormatSelection(fmt.id)}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${isSelected ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white border-zinc-200 hover:border-zinc-300'}`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-sm text-zinc-900">{fmt.name}</span>
                                                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">{fmt.shortName}</span>
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${compatBadge.color}`}>
                                                        {compatBadge.text}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-500 mt-1">{fmt.description}</p>
                                                <p className="text-[11px] text-zinc-400 mt-0.5">Allowed genres: {fmt.allowedGenres.join(', ')}</p>
                                            </div>
                                            <div className="pt-0.5">
                                                <input 
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    className="w-5 h-5 rounded text-blue-600 accent-blue-600 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="bg-zinc-50 p-4 border-t border-zinc-200 flex gap-3">
                                <button
                                    onClick={() => setSubmittingSongId(null)}
                                    className="flex-1 py-2.5 rounded-lg border border-zinc-300 bg-white font-bold text-sm text-zinc-700 hover:bg-zinc-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleConfirmSubmit(targetSubmittingSong.id)}
                                    disabled={selectedFormats.length === 0 || selectedFormats.length > 5}
                                    className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 font-bold text-sm text-white shadow"
                                >
                                    Confirm ({selectedFormats.length} Formats)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top header stats + Metric toggle */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-2 border-b border-zinc-200">
                    <div>
                        <h2 className="text-xl font-bold">My Airplay</h2>
                        <p className="text-xs text-zinc-500">Capacity: {songsOnRadioCount} / {maxSongs} active campaigns</p>
                    </div>
                    {/* Metric Toggle (Plays vs Impressions) */}
                    <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 self-start sm:self-auto">
                        <button
                            onClick={() => setMetricMode('plays')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${metricMode === 'plays' ? 'bg-white shadow-sm text-black border border-zinc-300' : 'text-zinc-500 hover:text-black'}`}
                        >
                            Spins / Plays
                        </button>
                        <button
                            onClick={() => setMetricMode('impressions')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${metricMode === 'impressions' ? 'bg-white shadow-sm text-black border border-zinc-300' : 'text-zinc-500 hover:text-black'}`}
                        >
                            Audience / Impressions
                        </button>
                    </div>
                </div>

                <div>
                    {activeRadioSongs.map(song => {
                        const songPlays = song._region === 'US' ? (song.radioPlays || 0) : (song.ukRadioPlays || 0);
                        const songImpressions = song._region === 'US' ? (song.radioImpressions || songPlays * 4500) : (song.ukRadioImpressions || songPlays * 3000);
                        const activeFormats = (song.radioFormats && song.radioFormats.length > 0)
                            ? song.radioFormats.map(normalizeRadioFormatId)
                            : [normalizeRadioFormatId(song._region === 'US' ? (song.radioFormat || 'chr') : (song.ukRadioFormat || 'chr'))];

                        return (
                            <div key={song._key} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm mb-4 flex flex-col space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img src={song.coverArt} className="w-14 h-14 object-cover rounded-lg border border-zinc-200 shrink-0" alt={song.title} />
                                        <div className="min-w-0">
                                            <p className="font-bold text-base truncate">{song.title}</p>
                                            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                                                <span className="text-xs font-semibold text-zinc-900">
                                                    Total: {formatMetricValue(songPlays, songImpressions)} TW
                                                </span>
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 font-bold text-zinc-600">
                                                    {song._region} RADIO
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button 
                                            onClick={() => openSubmitModal(song)}
                                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-zinc-300">
                                            Edit Formats ({activeFormats.length}/5)
                                        </button>
                                        {(() => {
                                            const allFormatsPromoted = song._region === 'US' 
                                                ? activeFormats.length > 0 && activeFormats.every(f => song.formatHasRadioPromo?.[f])
                                                : Boolean(song.hasUkRadioPromo);

                                            return (
                                                <button 
                                                    onClick={() => {
                                                        if (promoSongId === song.id) {
                                                            setPromoSongId(null);
                                                        } else {
                                                            setPromoSongId(song.id);
                                                            const firstUnpromoted = activeFormats.find(f => !song.formatHasRadioPromo?.[f]) || activeFormats[0] || 'chr';
                                                            setPromoFormat(firstUnpromoted);
                                                        }
                                                    }} 
                                                    disabled={allFormatsPromoted}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 shadow-sm">
                                                    {allFormatsPromoted ? 'Promoted' : promoSongId === song.id ? 'Cancel' : 'Payola'}
                                                </button>
                                            );
                                        })()}
                                        <button 
                                            onClick={() => handleWithdraw(song.id, undefined, song._region)} 
                                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-sm">
                                            Withdraw
                                        </button>
                                    </div>
                                </div>

                                {/* Active Formats Breakdown Pills */}
                                <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                                    <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 flex justify-between">
                                        <span>Active Formats ({activeFormats.length} / 5 max)</span>
                                        <span>Spins / Impressions</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {activeFormats.map(fmtId => {
                                            const fmt = getRadioFormatById(fmtId);
                                            const fPlays = song.formatRadioPlays?.[fmtId] || (activeFormats.length === 1 ? songPlays : Math.floor(songPlays / activeFormats.length));
                                            const maxImp = getFormatMaxImpressions(fmtId);
                                            const fImpr = song.formatRadioImpressions?.[fmtId] || Math.min(maxImp, fPlays * 3000);
                                            const isPromoted = Boolean(song.formatHasRadioPromo?.[fmtId]);

                                            return (
                                                <div key={fmtId} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-zinc-200 text-xs">
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                                                        <span className="font-bold truncate">{fmt?.shortName || fmtId.toUpperCase()}</span>
                                                        <span className="text-[10px] text-zinc-400 truncate">({fmt?.name})</span>
                                                        {isPromoted && (
                                                            <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1 py-0.2 rounded font-bold">
                                                                Payola
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="font-mono font-semibold text-zinc-700 ml-2 shrink-0">
                                                        {metricMode === 'plays' ? `${formatNumber(fPlays)} spins` : `${formatNumber(fImpr)} aud.`}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Payola Drawer */}
                                {promoSongId === song.id && (
                                    <div className="mt-2 pt-3 border-t border-zinc-200 animate-in fade-in duration-150">
                                        <h4 className="font-bold text-sm mb-1 text-blue-800">Radio Promotion Campaign (Payola)</h4>
                                        {(gameState.difficultyMode === 'hard' && (activeArtistData?.songs.filter(s => s.hasRadioPromo || s.hasUkRadioPromo).length || 0) >= 2) || (gameState.difficultyMode === 'extreme' && (activeArtistData?.songs.filter(s => s.hasRadioPromo || s.hasUkRadioPromo).length || 0) >= 1) ? (
                                            <p className="text-sm text-red-600 font-bold mb-2">Payola limit reached for {gameState.difficultyMode === 'extreme' ? 'Extreme' : 'Hard'} Mode.</p>
                                        ) : (
                                            <>
                                                <p className="text-xs text-zinc-600 mb-3">Invest payola into a specific format to boost spins and audience impressions for this single.</p>

                                                {/* Format Selection for Payola */}
                                                {song._region === 'US' && activeFormats.length > 0 && (
                                                    <div className="mb-3">
                                                        <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                                                            Select Target Radio Format:
                                                        </label>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                                            {activeFormats.map((fId) => {
                                                                const fObj = getRadioFormatById(fId);
                                                                const isFmtPromoted = Boolean(song.formatHasRadioPromo?.[fId]);
                                                                const isSelected = promoFormat === fId;
                                                                const maxImp = getFormatMaxImpressions(fId);

                                                                return (
                                                                    <button
                                                                        key={fId}
                                                                        type="button"
                                                                        onClick={() => setPromoFormat(fId)}
                                                                        className={`p-2 rounded-lg text-left border transition-all ${
                                                                            isSelected
                                                                                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                                                                : isFmtPromoted
                                                                                ? 'bg-zinc-100 text-zinc-400 border-zinc-200'
                                                                                : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-50'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="font-bold text-xs">{fObj?.shortName || fId.toUpperCase()}</span>
                                                                            {isFmtPromoted && (
                                                                                <span className="text-[9px] bg-amber-500 text-white px-1 py-0.2 rounded font-semibold">Active</span>
                                                                            )}
                                                                        </div>
                                                                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-zinc-500'}`}>
                                                                            Cap: {formatNumber(maxImp)} imp
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mb-3">
                                                    <label className="text-xs font-bold text-zinc-700 flex justify-between">
                                                        <span>Investment: ${formatNumber(promoAmount)}</span>
                                                        <span className="text-blue-600">~+{formatNumber(Math.floor(promoAmount / 160))} spins</span>
                                                    </label>
                                                    <input 
                                                        type="range" 
                                                        min="1000" 
                                                        max="1000000" 
                                                        step="1000" 
                                                        value={promoAmount} 
                                                        onChange={(e) => setPromoAmount(parseInt(e.target.value))}
                                                        className="w-full accent-blue-600 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer mt-1.5" 
                                                    />
                                                </div>
                                                <div className="flex gap-2 mb-3">
                                                    <button 
                                                        onClick={() => setPromoSource('personal')} 
                                                        className={`flex-1 py-2 text-xs font-bold rounded-lg border ${promoSource === 'personal' ? 'bg-black text-white border-black' : 'bg-zinc-100 text-black border-zinc-200'}`}
                                                    >
                                                        Personal Funds<br/>
                                                        <span className="text-[10px] opacity-80">${formatNumber(activeArtistData.money)}</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => setPromoSource('label')} 
                                                        disabled={!activeArtistData.contract}
                                                        className={`flex-1 py-2 text-xs font-bold rounded-lg border disabled:opacity-50 ${promoSource === 'label' ? 'bg-black text-white border-black' : 'bg-zinc-100 text-black border-zinc-200'}`}
                                                    >
                                                        Label Budget<br/>
                                                        <span className="text-[10px] opacity-80">{activeArtistData.contract ? `$${formatNumber(activeArtistData.contract.marketingBudget)}` : 'N/A'}</span>
                                                    </button>
                                                </div>
                                                {song._region === 'US' && song.formatHasRadioPromo?.[promoFormat] ? (
                                                    <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold py-2 px-3 rounded-lg text-center">
                                                        Payola is already active on {getRadioFormatById(promoFormat)?.name || promoFormat.toUpperCase()} this week.
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handlePromote(song.id, promoFormat, song._region)} 
                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow text-xs uppercase tracking-wide transition-colors"
                                                    >
                                                        Confirm Payola for {getRadioFormatById(promoFormat)?.shortName || promoFormat.toUpperCase()}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {songsOnRadioCount === 0 && <p className="text-zinc-400 text-sm italic py-4 text-center">No active radio campaigns.</p>}
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4 pt-4 border-t border-zinc-200">
                        <div>
                            <h2 className="text-xl font-bold">Submit New Track</h2>
                            <p className="text-xs text-zinc-500">Send songs to up to 5 radio formats at once</p>
                        </div>
                        <select 
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value as 'US'|'UK')}
                            className="bg-zinc-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-700"
                        >
                            <option value="US">US Radio</option>
                            <option value="UK">UK Radio</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        {activeArtistData.songs.filter(s => !(selectedRegion === 'US' ? s.isOnRadio : s.isOnUkRadio) && s.isReleased && !s.remixOfSongId).map(song => {
                            const eligibility = getRadioEligibility(song);
                            return (
                                <div key={song.id} className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center w-full gap-3 min-w-0">
                                        <img src={song.coverArt} className="w-12 h-12 object-cover rounded-lg border border-zinc-200 shrink-0" alt={song.title} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-sm truncate">{song.title}</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${eligibility.badgeColor}`}>
                                                    {eligibility.badgeText}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 truncate mt-0.5">
                                                {song.genre || 'Pop'} • {formatNumber(song.streams)} streams
                                                {eligibility.reason && !eligibility.eligible && (
                                                    <span className="text-red-500 ml-1.5">• {eligibility.reason}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => openSubmitModal(song)}
                                        className={`w-full sm:w-auto text-xs font-bold px-4 py-2 rounded-lg shadow-sm whitespace-nowrap transition-colors ${
                                            eligibility.eligible
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-300'
                                        }`}
                                    >
                                        {eligibility.eligible ? 'Select Formats & Submit' : 'Label Restricted'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderCharts = () => {
        let chartData: any[] = [];
        let chartTitle = "ALL RADIO (MEDIABASE OVERALL)";
        let formatObj = RADIO_FORMATS.find(rf => rf.id === selectedChart);

        if (selectedChart === 'overall') {
            chartTitle = "ALL RADIO (OVERALL MEDIABASE)";
            chartData = gameState.radioOverallChart || [];
        } else if (formatObj) {
            chartTitle = `${formatObj.name.toUpperCase()} (${formatObj.shortName})`;
            chartData = gameState.radioFormatCharts?.[formatObj.id] ||
                (formatObj.id === 'chr' ? gameState.radioPopChart :
                 formatObj.id === 'urban' ? gameState.radioUrbanChart :
                 formatObj.id === 'rhythmic' ? gameState.radioRhythmicChart :
                 formatObj.id === 'country' ? gameState.radioCountryChart :
                 formatObj.id === 'christmas' ? gameState.radioChristmasChart : undefined) || [];
        } else {
            chartData = gameState.radioOverallChart || [];
        }

        const sortedChartData = [...chartData].sort((a, b) => {
            if (metricMode === 'impressions') {
                const aImp = a.radioImpressions || (a.radioPlays || 0) * 4500;
                const bImp = b.radioImpressions || (b.radioPlays || 0) * 4500;
                return bImp - aImp;
            } else {
                return (b.radioPlays || 0) - (a.radioPlays || 0);
            }
        });

        return (
            <div className="p-0">
                {/* Format selection horizontal pill bar */}
                <div className="border-b border-zinc-200 bg-white sticky top-[108px] z-10">
                    <div className="flex overflow-x-auto p-3 gap-2 hide-scrollbar items-center">
                        <button 
                            onClick={() => setSelectedChart('overall')} 
                            className={`px-3 py-1.5 whitespace-nowrap rounded-lg font-bold text-xs uppercase transition-all ${selectedChart === 'overall' ? 'bg-black text-white shadow' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        >
                            All Formats (Overall)
                        </button>
                        {RADIO_FORMATS.map(fmt => (
                            <button 
                                key={fmt.id} 
                                onClick={() => setSelectedChart(fmt.id)} 
                                className={`px-3 py-1.5 whitespace-nowrap rounded-lg font-bold text-xs uppercase transition-all ${selectedChart === fmt.id ? 'bg-black text-white shadow' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                            >
                                {fmt.shortName}
                            </button>
                        ))}
                    </div>

                    {/* Chart Sub-header: Metric toggle + Format description */}
                    <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="text-xs text-zinc-600 truncate">
                            {formatObj ? `${formatObj.description}` : 'Top songs compiled from aggregate airplay across all 15 formats.'}
                        </div>
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-200 self-start sm:self-auto shrink-0 shadow-sm">
                            <button
                                onClick={() => setMetricMode('plays')}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all ${metricMode === 'plays' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}
                            >
                                Plays (Spins)
                            </button>
                            <button
                                onClick={() => setMetricMode('impressions')}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all ${metricMode === 'impressions' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}
                            >
                                Impressions (Audience)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-[#f8f9fa] min-h-[60vh]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-black text-lg italic tracking-tight uppercase">
                            {chartTitle}
                        </h2>
                        <span className="text-red-600 text-xs font-bold tracking-wider">MEDIABASE AIRPLAY</span>
                    </div>

                    {sortedChartData.map((entry, idx) => {
                        const rank = idx + 1;
                        const plays = entry.radioPlays || 0;
                        const impressions = entry.radioImpressions || (plays * 4500);

                        return (
                            <div key={idx} className="flex bg-white border border-zinc-200 mb-2 p-2.5 rounded-lg shadow-sm items-center hover:border-zinc-300 transition-colors">
                                <div className="w-9 text-center font-black text-base text-zinc-900">{rank}</div>
                                <img src={entry.coverArt} className="w-12 h-12 object-cover rounded-md border border-zinc-100 mx-3 shrink-0" alt={entry.title} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate text-zinc-900">{entry.title}</p>
                                    <p className="text-xs text-zinc-500 truncate">{entry.artist}</p>
                                </div>
                                <div className="text-right text-xs shrink-0 pl-2">
                                    <p className="font-mono font-bold text-zinc-900">
                                        {metricMode === 'plays' ? formatNumber(Math.floor(plays)) : formatNumber(Math.floor(impressions))}
                                    </p>
                                    <p className="text-[9px] text-zinc-400 font-semibold uppercase">
                                        {metricMode === 'plays' ? 'SPINS TW' : 'AUDIENCE TW'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}

                    {sortedChartData.length === 0 && (
                        <div className="text-center text-zinc-500 py-16">
                            <p className="font-bold text-base mb-1">Chart building...</p>
                            <p className="text-xs">Songs submitted to this format will appear on next chart update.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white h-full overflow-y-auto font-sans pb-24 text-black">
            <header className="bg-black text-white p-4 sticky top-0 z-20 flex items-center justify-between shadow-md">
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="font-bold text-sm hover:text-zinc-300 flex items-center gap-1">
                    <span>&larr;</span> BACK
                </button>
                <div className="font-black italic tracking-widest text-lg ml-auto mr-auto pl-4">HITS RADIO</div>
                <div className="text-[10px] font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">Nielsen / Mediabase</div>
            </header>

            <div className="flex border-b-2 border-black sticky top-14 bg-white z-20 shadow-sm">
                <button 
                    onClick={() => setSelectedTab('manage')} 
                    className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition-colors ${selectedTab === 'manage' ? 'border-b-4 border-black text-black bg-zinc-50' : 'text-zinc-400 border-b-4 border-transparent hover:text-zinc-700'}`}
                >
                    Airplay Dashboard
                </button>
                <button 
                    onClick={() => setSelectedTab('charts')} 
                    className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition-colors ${selectedTab === 'charts' ? 'border-b-4 border-black text-black bg-zinc-50' : 'text-zinc-400 border-b-4 border-transparent hover:text-zinc-700'}`}
                >
                    Radio Charts (15 Formats)
                </button>
            </div>

            {selectedTab === 'manage' ? renderManage() : renderCharts()}
        </div>
    );
};

export default RadioDashView;
