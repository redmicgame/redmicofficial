import React, { useState } from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { useGame } from '../context/GameContext';
import { Relationship, Artist, PrenupAgreement, Kid, RelationshipDrama } from '../types';
import { formatMarriageDuration, calculateRelationshipDurations, formatDurationFromWeeks } from '../utils/relationshipUtils';

const DatingView: React.FC = () => {
    const { gameState, dispatch, activeArtistData } = useGame();
    const [showNewRelationshipModal, setShowNewRelationshipModal] = useState(false);
    const [showDivorceConfirmModal, setShowDivorceConfirmModal] = useState(false);
    const [partnerType, setPartnerType] = useState<'npc' | 'custom'>('npc');
    const [selectedNpcId, setSelectedNpcId] = useState<string>('');
    const [customName, setCustomName] = useState('');

    const [relationshipToReveal, setRelationshipToReveal] = useState<string | null>(null);

    // Prenup state
    const [showPrenupModal, setShowPrenupModal] = useState(false);
    const [showViewPrenupModal, setShowViewPrenupModal] = useState(false);
    const [assetProtection, setAssetProtection] = useState<'full_player_protection' | 'standard_50_50' | 'partner_favored'>('full_player_protection');
    const [alimonyClause, setAlimonyClause] = useState<'waived' | 'capped_5k' | 'generous_25k'>('waived');
    const [infidelityPenalty, setInfidelityPenalty] = useState<number>(500000);

    // Divorce settlement form state
    const [custodyChoice, setCustodyChoice] = useState<'player' | 'joint' | 'partner'>('joint');
    const [alimonyPayor, setAlimonyPayor] = useState<'player' | 'partner' | 'none'>('none');
    const [alimonyAmount, setAlimonyAmount] = useState<number>(5000);
    const [childSupportPayor, setChildSupportPayor] = useState<'player' | 'partner' | 'none'>('none');
    const [childSupportAmount, setChildSupportAmount] = useState<number>(3000);

    // Rekindle & History state
    const [rekindleModalRel, setRekindleModalRel] = useState<Relationship | null>(null);
    const [expandedHistoryExIds, setExpandedHistoryExIds] = useState<Record<string, boolean>>({});

    // New Relationship features state
    const [showDateNightModal, setShowDateNightModal] = useState(false);
    const [showWeddingModal, setShowWeddingModal] = useState(false);
    const [weddingStyle, setWeddingStyle] = useState<'vegas' | 'backyard' | 'tuscany' | 'met_gala'>('tuscany');
    const [weddingWithPrenup, setWeddingWithPrenup] = useState(true);
    const [showCollabModal, setShowCollabModal] = useState(false);
    const [showAnniversaryModal, setShowAnniversaryModal] = useState(false);
    const [showDramaModal, setShowDramaModal] = useState(false);

    // New Children features state
    const [kidEduModal, setKidEduModal] = useState<Kid | null>(null);
    const [kidActivityModal, setKidActivityModal] = useState<Kid | null>(null);
    const [kidPartyModal, setKidPartyModal] = useState<Kid | null>(null);
    const [kidFinanceModal, setKidFinanceModal] = useState<Kid | null>(null);
    const [trustFundAmountInput, setTrustFundAmountInput] = useState<number>(25000);
    const [monthlyAllowanceInput, setMonthlyAllowanceInput] = useState<number>(500);
    const [kidSongModal, setKidSongModal] = useState<Kid | null>(null);
    const [songTitleInput, setSongTitleInput] = useState<string>('');
    const [coParentingModalRel, setCoParentingModalRel] = useState<Relationship | null>(null);

    if (!activeArtistData) return null;

    const activeArtist = gameState.soloArtist?.id === gameState.activeArtistId
        ? gameState.soloArtist
        : gameState.group?.id === gameState.activeArtistId
        ? gameState.group
        : (gameState.extraPlayableArtists || []).find(a => a.id === gameState.activeArtistId) || gameState.soloArtist || gameState.group;
    const artistName = activeArtist?.name || 'Artist';

    const relationships = activeArtistData.relationships || [];
    const activeRelationship = relationships.find(r => r.endYear === null);
    const pastRelationships = relationships.filter(r => r.endYear !== null).sort((a, b) => b.endYear! - a.endYear!);

    const sortedNpcs = [...gameState.npcs].sort((a, b) => a.artist.localeCompare(b.artist));

    const handleStartDating = () => {
        if (partnerType === 'npc') {
            const npc = sortedNpcs.find(n => n.uniqueId === selectedNpcId);
            if (npc) {
                dispatch({ type: 'START_DATING', payload: { partnerName: npc.artist, partnerType: 'npc' } });
            }
        } else {
            if (customName.trim()) {
                dispatch({ type: 'START_DATING', payload: { partnerName: customName.trim(), partnerType: 'custom' } });
            }
        }
        setShowNewRelationshipModal(false);
        setSelectedNpcId('');
        setCustomName('');
    };

    const handleReveal = (outlet: 'popbase' | 'tmz') => {
        if (relationshipToReveal) {
            dispatch({ type: 'REVEAL_RELATIONSHIP', payload: { relationshipId: relationshipToReveal, outlet } });
            setRelationshipToReveal(null);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, relationshipId: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const newImage = reader.result as string;
                dispatch({ type: 'UPDATE_RELATIONSHIP_IMAGE', payload: { relationshipId, image: newImage } });
            };
            reader.readAsDataURL(file);
        }
    };

    const formatRelationshipDate = (year: number, week?: number) => {
        if (week !== undefined) {
            const month = new Date(year, 0, (week - 1) * 7 + 1).toLocaleString('default', { month: 'long' });
            return `${month} ${year}`;
        }
        return `${year}`;
    };

    const StatusBadge = ({ status, isPublic }: { status: Relationship['status'], isPublic: boolean }) => {
        let color = 'bg-blue-500/20 text-blue-400';
        if (status === 'engaged') color = 'bg-purple-500/20 text-purple-400';
        if (status === 'married') color = 'bg-yellow-500/20 text-yellow-400';
        if (status === 'divorcing') color = 'bg-red-500/20 text-red-400';

        return (
            <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${color}`}>
                    {status}
                </span>
                {!isPublic && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase bg-zinc-700 text-zinc-300">
                        Secret
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="h-full w-full bg-zinc-900 flex flex-col text-white">
            <header className="p-4 flex items-center gap-4 flex-shrink-0 border-b border-zinc-800">
                <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'misc' })} className="p-2 rounded-full hover:bg-zinc-800">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">Dating History</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-8">
                {/* Active Relationship */}
                <section>
                    <h2 className="text-xl font-bold mb-4">Current Relationship</h2>
                    {activeRelationship ? (
                        <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 space-y-4 shadow-xl">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4 items-center">
                                    <label htmlFor={`image-upload-${activeRelationship.id}`} className="cursor-pointer group relative flex-shrink-0">
                                        <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                                            {activeRelationship.image ? (
                                                <img src={activeRelationship.image} alt={activeRelationship.partnerName} className="w-full h-full object-cover"/>
                                            ) : (
                                                <span className="text-zinc-500 font-bold text-2xl">{activeRelationship.partnerName.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                            <span className="text-white text-[10px] font-bold">Edit</span>
                                        </div>
                                        <input
                                            type="file"
                                            id={`image-upload-${activeRelationship.id}`}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, activeRelationship.id)}
                                        />
                                    </label>
                                    <div>
                                        <h3 className="text-2xl font-black text-red-500">{activeRelationship.partnerName}</h3>
                                        <p className="text-zinc-400">Current Era Since {formatRelationshipDate(activeRelationship.startYear, activeRelationship.startWeek)}</p>
                                        {(activeRelationship.status === 'married' || activeRelationship.status === 'divorcing') && (
                                            <p className="text-xs text-yellow-400 font-semibold mt-0.5">
                                                💍 Married for {formatMarriageDuration(
                                                    activeRelationship.marriedStartYear || activeRelationship.startYear,
                                                    activeRelationship.marriedStartWeek || activeRelationship.startWeek || 1,
                                                    gameState.date.year,
                                                    gameState.date.week
                                                )}
                                            </p>
                                        )}
                                        {(() => {
                                            const activeStats = calculateRelationshipDurations(activeRelationship, gameState.date.year, gameState.date.week, activeArtistData.kids || []);
                                            if (activeStats.timesTogether > 1 || activeStats.sharedKids.length > 0) {
                                                return (
                                                    <div className="mt-1 space-y-0.5 text-xs">
                                                        {activeStats.timesTogether > 1 && (
                                                            <p className="text-pink-300 font-medium">
                                                                🔄 Dating Era #{activeStats.timesTogether} • Cumulative: {activeStats.totalTogetherFormatted} together
                                                            </p>
                                                        )}
                                                        {activeStats.sharedKids.length > 0 && (
                                                            <p className="text-emerald-400 font-medium">
                                                                👶 {activeStats.sharedKids.length} shared child{activeStats.sharedKids.length === 1 ? '' : 'ren'} together ({activeStats.sharedKids.map(k => k.name).join(', ')})
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>
                                <StatusBadge status={activeRelationship.status} isPublic={activeRelationship.isPublic} />
                            </div>

                            {/* Relationship Vitals: Affection & Drama Meters */}
                            <div className="pt-3 border-t border-zinc-700/60 grid grid-cols-2 gap-3">
                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1">
                                        <span className="text-rose-400">❤️ Affection</span>
                                        <span className="text-zinc-300">{activeRelationship.affection ?? 85}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, activeRelationship.affection ?? 85))}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1">
                                        <span className="text-amber-400">⚡ Drama Level</span>
                                        <span className="text-zinc-300">{activeRelationship.dramaLevel ?? 10}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, activeRelationship.dramaLevel ?? 10))}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Active Tabloid Drama Banner */}
                            {activeRelationship.activeDrama && (
                                <div className="p-3 bg-red-950/80 border border-red-500/70 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-red-300 text-xs font-bold uppercase tracking-wider">
                                        <span className="animate-pulse">🚨</span> Tabloid Controversy: {activeRelationship.activeDrama.type.toUpperCase()}
                                    </div>
                                    <p className="text-sm font-medium text-red-100">{activeRelationship.activeDrama.headline}</p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <button
                                            onClick={() => dispatch({ type: 'HANDLE_RELATIONSHIP_DRAMA', payload: { relationshipId: activeRelationship.id, dramaAction: 'united_front' } })}
                                            className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm"
                                        >
                                            🤝 United Front (Red Carpet)
                                        </button>
                                        <button
                                            onClick={() => dispatch({ type: 'HANDLE_RELATIONSHIP_DRAMA', payload: { relationshipId: activeRelationship.id, dramaAction: 'deny' } })}
                                            className="bg-blue-700 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm"
                                        >
                                            📢 Public PR Denial
                                        </button>
                                        <button
                                            onClick={() => dispatch({ type: 'HANDLE_RELATIONSHIP_DRAMA', payload: { relationshipId: activeRelationship.id, dramaAction: 'ignore' } })}
                                            className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm"
                                        >
                                            🤐 Stay Silent
                                        </button>
                                        <button
                                            onClick={() => dispatch({ type: 'HANDLE_RELATIONSHIP_DRAMA', payload: { relationshipId: activeRelationship.id, dramaAction: 'split' } })}
                                            className="bg-red-800 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm"
                                        >
                                            💔 Break Up Under Media Pressure
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-700">
                                {!activeRelationship.isPublic && (
                                    <button 
                                        onClick={() => setRelationshipToReveal(activeRelationship.id)}
                                        className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm"
                                    >
                                        Reveal Relationship
                                    </button>
                                )}
                                
                                {activeRelationship.isPublic && activeRelationship.status === 'dating' && (
                                    <button 
                                        onClick={() => dispatch({ type: 'ADVANCE_RELATIONSHIP', payload: { relationshipId: activeRelationship.id, newStatus: 'engaged' } })}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-full font-bold text-sm"
                                    >
                                        Get Engaged
                                    </button>
                                )}
                                
                                {activeRelationship.isPublic && activeRelationship.status === 'engaged' && (
                                    <>
                                        <button 
                                            onClick={() => setShowWeddingModal(true)}
                                            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md flex items-center gap-1.5 transition-all"
                                        >
                                            <span>💍</span> Plan Wedding Extravaganza
                                        </button>
                                        <button 
                                            onClick={() => setShowPrenupModal(true)}
                                            className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-full font-bold text-sm shadow-md flex items-center gap-1.5 transition-all"
                                        >
                                            <span>📜</span> Get Married & Sign Prenup
                                        </button>
                                    </>
                                )}

                                {/* Date Night & Gifts Button */}
                                <button
                                    onClick={() => setShowDateNightModal(true)}
                                    className="bg-rose-600/80 hover:bg-rose-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-1.5 transition-all"
                                >
                                    <span>🍷</span> Date Night & Gifts
                                </button>

                                {/* Music Collaboration Button */}
                                <button
                                    onClick={() => setShowCollabModal(true)}
                                    className="bg-indigo-600/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-1.5 transition-all"
                                >
                                    <span>🎙️</span> Music Collab
                                </button>

                                {/* Anniversary Celebration Button */}
                                {(activeRelationship.status === 'married' || activeRelationship.status === 'dating' || activeRelationship.status === 'engaged') && (
                                    <button
                                        onClick={() => setShowAnniversaryModal(true)}
                                        className="bg-amber-600/80 hover:bg-amber-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-1.5 transition-all"
                                    >
                                        <span>🥂</span> Celebrate Anniversary
                                    </button>
                                )}

                                {/* Trigger Media Drama */}
                                <button
                                    onClick={() => dispatch({ type: 'TRIGGER_RANDOM_DRAMA', payload: { relationshipId: activeRelationship.id } })}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-3.5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all"
                                    title="Trigger a tabloid rumor or scandal"
                                >
                                    <span>⚡</span> Media Rumors
                                </button>

                                {activeRelationship.prenup && (
                                    <button
                                        onClick={() => setShowViewPrenupModal(true)}
                                        className="bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 border border-amber-600/50 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                        <span>📜</span> View Signed Prenup
                                    </button>
                                )}

                                {!activeArtistData.pregnancy && activeRelationship.status !== 'divorcing' && (
                                    <button 
                                        onClick={() => dispatch({ type: 'START_PREGNANCY', payload: { partnerName: activeRelationship.partnerName } })}
                                        className="bg-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-pink-400"
                                    >
                                        Try for Baby
                                    </button>
                                )}

                                 {activeArtistData.pregnancy && (
                                    <button 
                                        onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'pregnancyTracker' })}
                                        className="bg-rose-500 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-rose-400 flex items-center gap-1"
                                    >
                                        📱 Open Pregnancy Tracker App
                                    </button>
                                )}

                                {activeArtistData.pregnancy && !activeArtistData.pregnancy.revealed && (
                                    <button 
                                        onClick={() => dispatch({ type: 'REVEAL_PREGNANCY' })}
                                        className="bg-pink-600 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-pink-500"
                                    >
                                        Reveal Pregnancy
                                    </button>
                                )}

                                {activeRelationship.status === 'married' ? (
                                    <button 
                                        onClick={() => setShowDivorceConfirmModal(true)}
                                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm transition-colors shadow-lg shadow-red-950/40"
                                    >
                                        Filed For Divorce
                                    </button>
                                ) : activeRelationship.status !== 'divorcing' ? (
                                    <button 
                                        onClick={() => dispatch({ type: 'BREAK_UP', payload: { relationshipId: activeRelationship.id } })}
                                        className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-full font-bold text-sm"
                                    >
                                        Break Up
                                    </button>
                                ) : null}
                            </div>

                            {/* Court Legal Battle Section */}
                            {activeRelationship.status === 'divorcing' && (
                                <div className="mt-4 p-5 bg-gradient-to-br from-zinc-900 to-red-950/40 rounded-xl border border-red-900/60 space-y-5">
                                    <div className="flex justify-between items-center border-b border-red-900/40 pb-3">
                                        <div>
                                            <h4 className="text-xl font-black text-red-400 flex items-center gap-2">
                                                <span>⚖️</span> Legal Battle in Progress
                                            </h4>
                                            <p className="text-xs text-zinc-400">
                                                Duration: Week {activeRelationship.divorceCase?.weeksInBattle || 1} of 52 (1 Month – 1 Year Legal Battle)
                                            </p>
                                        </div>
                                        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-red-500/30">
                                            In Court
                                        </span>
                                    </div>

                                    {/* Current proposal status */}
                                    {activeRelationship.divorceCase?.currentProposal ? (
                                        <div className="bg-zinc-800/80 p-4 rounded-xl border border-zinc-700 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                                    {activeRelationship.divorceCase.currentProposal.proposedBy === 'player' ? 'Your Filed Terms' : `${activeRelationship.partnerName}'s Counter-Demand`}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                                    activeRelationship.divorceCase.currentProposal.status === 'declined' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                    {activeRelationship.divorceCase.currentProposal.status === 'declined' ? 'Declined by Judge' : 'Pending Judge Ruling'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 text-sm text-zinc-300 bg-zinc-900/60 p-3 rounded-lg">
                                                <div>
                                                    <span className="block text-xs text-zinc-500">Child Custody</span>
                                                    <span className="font-bold text-white">
                                                        {activeRelationship.divorceCase.currentProposal.custody === 'player' ? 'Full (You)' : activeRelationship.divorceCase.currentProposal.custody === 'partner' ? 'Full (Partner)' : 'Joint (50/50)'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs text-zinc-500">Alimony</span>
                                                    <span className="font-bold text-white">
                                                        {activeRelationship.divorceCase.currentProposal.alimonyPayor === 'none' || !activeRelationship.divorceCase.currentProposal.alimonyAmount
                                                            ? '$0'
                                                            : `${activeRelationship.divorceCase.currentProposal.alimonyPayor === 'player' ? 'You Pay' : 'Partner Pays'} $${activeRelationship.divorceCase.currentProposal.alimonyAmount.toLocaleString()}/mo`}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs text-zinc-500">Child Support</span>
                                                    <span className="font-bold text-white">
                                                        {activeRelationship.divorceCase.currentProposal.childSupportPayor === 'none' || !activeRelationship.divorceCase.currentProposal.childSupportAmount
                                                            ? '$0'
                                                            : `${activeRelationship.divorceCase.currentProposal.childSupportPayor === 'player' ? 'You Pay' : 'Partner Pays'} $${activeRelationship.divorceCase.currentProposal.childSupportAmount.toLocaleString()}/mo`}
                                                    </span>
                                                </div>
                                            </div>

                                            {activeRelationship.divorceCase.currentProposal.status === 'declined' && (
                                                <p className="text-red-400 text-xs italic bg-red-950/30 p-2 rounded border border-red-900/30">
                                                    ❌ {activeRelationship.divorceCase.currentProposal.declinedReason || 'Judge Marcus rejected these terms as unfair.'}
                                                </p>
                                            )}

                                            <div className="flex gap-2 pt-1">
                                                <button 
                                                    onClick={() => dispatch({ 
                                                        type: 'EVALUATE_DIVORCE_PROPOSAL', 
                                                        payload: { 
                                                            relationshipId: activeRelationship.id, 
                                                            proposalId: activeRelationship.divorceCase!.currentProposal!.id 
                                                        } 
                                                    })}
                                                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black py-2.5 rounded-lg font-bold text-sm shadow transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <span>👨‍⚖️</span> Request Judge Ruling Now (50% Chance)
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-zinc-400 text-sm italic">
                                            No active proposal submitted to the judge. Fill out your settlement terms below.
                                        </p>
                                    )}

                                    {/* Form to submit new proposal terms */}
                                    {(!activeRelationship.divorceCase?.currentProposal || activeRelationship.divorceCase.currentProposal.status === 'declined') && (
                                        <div className="bg-zinc-800/60 p-4 rounded-xl border border-zinc-700/60 space-y-4">
                                            <h5 className="font-bold text-white text-base flex items-center gap-2">
                                                <span>📜</span> File Settlement Proposal to Judge
                                            </h5>

                                            <div className="space-y-3 text-sm">
                                                {/* Custody */}
                                                {(activeArtistData.kids || []).some(k => k.parentName === activeRelationship.partnerName) && (
                                                    <div>
                                                        <label className="block text-zinc-400 text-xs font-bold uppercase mb-1">Custody Request</label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {[
                                                                { id: 'player', label: 'Full (You)' },
                                                                { id: 'joint', label: 'Joint (50/50)' },
                                                                { id: 'partner', label: `Full (${activeRelationship.partnerName})` }
                                                            ].map(opt => (
                                                                <button
                                                                    key={opt.id}
                                                                    type="button"
                                                                    onClick={() => setCustodyChoice(opt.id as any)}
                                                                    className={`py-2 px-2 rounded-lg font-bold text-xs border transition-all ${
                                                                        custodyChoice === opt.id ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                                                    }`}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Alimony */}
                                                <div>
                                                    <label className="block text-zinc-400 text-xs font-bold uppercase mb-1">Alimony (Monthly Spousal Support)</label>
                                                    <div className="flex gap-2 mb-2">
                                                        {[
                                                            { id: 'none', label: 'None ($0)' },
                                                            { id: 'player', label: 'You Pay' },
                                                            { id: 'partner', label: 'Partner Pays You' }
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.id}
                                                                type="button"
                                                                onClick={() => setAlimonyPayor(opt.id as any)}
                                                                className={`flex-1 py-1.5 rounded-lg font-bold text-xs border transition-all ${
                                                                    alimonyPayor === opt.id ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                                                }`}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {alimonyPayor !== 'none' && (
                                                        <select
                                                            value={alimonyAmount}
                                                            onChange={e => setAlimonyAmount(Number(e.target.value))}
                                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-xs font-bold"
                                                        >
                                                            <option value={2500}>$2,500 / month</option>
                                                            <option value={5000}>$5,000 / month</option>
                                                            <option value={10000}>$10,000 / month</option>
                                                            <option value={25000}>$25,000 / month</option>
                                                            <option value={50000}>$50,000 / month</option>
                                                        </select>
                                                    )}
                                                </div>

                                                {/* Child Support */}
                                                {(activeArtistData.kids || []).some(k => k.parentName === activeRelationship.partnerName) && (
                                                    <div>
                                                        <label className="block text-zinc-400 text-xs font-bold uppercase mb-1">Child Support (Monthly)</label>
                                                        <div className="flex gap-2 mb-2">
                                                            {[
                                                                { id: 'none', label: 'None ($0)' },
                                                                { id: 'player', label: 'You Pay' },
                                                                { id: 'partner', label: 'Partner Pays You' }
                                                            ].map(opt => (
                                                                <button
                                                                    key={opt.id}
                                                                    type="button"
                                                                    onClick={() => setChildSupportPayor(opt.id as any)}
                                                                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs border transition-all ${
                                                                        childSupportPayor === opt.id ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                                                    }`}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {childSupportPayor !== 'none' && (
                                                            <select
                                                                value={childSupportAmount}
                                                                onChange={e => setChildSupportAmount(Number(e.target.value))}
                                                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-xs font-bold"
                                                            >
                                                                <option value={1500}>$1,500 / month</option>
                                                                <option value={3000}>$3,000 / month</option>
                                                                <option value={5000}>$5,000 / month</option>
                                                                <option value={10000}>$10,000 / month</option>
                                                            </select>
                                                        )}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => dispatch({
                                                        type: 'SUBMIT_DIVORCE_PROPOSAL',
                                                        payload: {
                                                            relationshipId: activeRelationship.id,
                                                            proposedBy: 'player',
                                                            custody: custodyChoice,
                                                            alimonyPayor: alimonyPayor,
                                                            alimonyAmount: alimonyPayor === 'none' ? 0 : alimonyAmount,
                                                            childSupportPayor: childSupportPayor,
                                                            childSupportAmount: childSupportPayor === 'none' ? 0 : childSupportAmount
                                                        }
                                                    })}
                                                    className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <span>⚖️</span> File Request with Judge
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-zinc-800 border border-zinc-700 border-dashed p-8 rounded-xl text-center">
                            <p className="text-zinc-400 mb-4">You are currently single.</p>
                            <div className="flex justify-center gap-4">
                                <button 
                                    onClick={() => setShowNewRelationshipModal(true)}
                                    className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-lg"
                                >
                                    Start Dating
                                </button>
                                {!activeArtistData.pregnancy && (
                                    <button 
                                        onClick={() => dispatch({ type: 'START_PREGNANCY', payload: { partnerName: 'Single Parent' } })}
                                        className="bg-pink-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-pink-400"
                                    >
                                        Have a Baby
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* Past Relationships */}
                {pastRelationships.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-zinc-300 flex items-center justify-between">
                            <span>Past Relationships</span>
                            <span className="text-xs font-normal text-zinc-500">Historical Archives & Eras</span>
                        </h2>
                        <div className="space-y-4">
                            {pastRelationships.map(rel => {
                                const durations = calculateRelationshipDurations(rel, gameState.date.year, gameState.date.week, activeArtistData.kids || []);
                                const isExpanded = !!expandedHistoryExIds[rel.id];

                                return (
                                    <div key={rel.id} className="bg-zinc-800/70 p-4 sm:p-5 rounded-2xl border border-zinc-700/70 space-y-3.5 shadow-lg">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex gap-3.5 items-center">
                                                <label htmlFor={`image-upload-${rel.id}`} className="cursor-pointer group relative flex-shrink-0">
                                                    <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden border border-zinc-600">
                                                        {rel.image ? (
                                                            <img src={rel.image} alt={rel.partnerName} className="w-full h-full object-cover"/>
                                                        ) : (
                                                            <span className="text-zinc-400 font-black text-xl">{rel.partnerName.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                                        <span className="text-white text-[10px] font-bold">Edit</span>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        id={`image-upload-${rel.id}`}
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageUpload(e, rel.id)}
                                                    />
                                                </label>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-black text-lg text-white">{rel.partnerName}</h4>
                                                        <StatusBadge status={rel.status} isPublic={rel.isPublic} />
                                                    </div>
                                                    <p className="text-zinc-400 text-xs mt-0.5">
                                                        Latest era: {formatRelationshipDate(rel.startYear, rel.startWeek)} - {rel.endYear ? formatRelationshipDate(rel.endYear, rel.endWeek) : 'Present'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 items-center">
                                                {durations.sharedKids.length > 0 && (
                                                    <button
                                                        onClick={() => setCoParentingModalRel(rel)}
                                                        className="bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
                                                    >
                                                        <span>🤝</span> Co-Parenting ({rel.coParentingStatus || 'cordial'})
                                                    </button>
                                                )}
                                                {!activeRelationship && (
                                                    <button 
                                                        onClick={() => setRekindleModalRel(rel)}
                                                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                                                    >
                                                        <span>❤️</span> Get Back Together
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Comprehensive Relationship History Metrics */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-700/50 text-xs">
                                            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                                                <span className="text-zinc-500 block text-[10px] font-semibold uppercase">Total Time Together</span>
                                                <span className="font-black text-white text-xs sm:text-sm">{durations.totalTogetherFormatted}</span>
                                                <span className="text-[10px] text-zinc-400 block">{durations.timesTogether} era{durations.timesTogether === 1 ? '' : 's'}</span>
                                            </div>
                                            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                                                <span className="text-zinc-500 block text-[10px] font-semibold uppercase">Years Married</span>
                                                <span className="font-black text-yellow-400 text-xs sm:text-sm">{durations.totalMarriedFormatted || 'None'}</span>
                                                <span className="text-[10px] text-zinc-400 block">{durations.totalMarriedWeeks > 0 ? `${durations.totalMarriedWeeks} wks` : 'Never married'}</span>
                                            </div>
                                            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                                                <span className="text-zinc-500 block text-[10px] font-semibold uppercase">Years Engaged</span>
                                                <span className="font-black text-purple-400 text-xs sm:text-sm">{durations.totalEngagedFormatted || 'None'}</span>
                                                <span className="text-[10px] text-zinc-400 block">{durations.totalEngagedWeeks > 0 ? `${durations.totalEngagedWeeks} wks` : 'Never engaged'}</span>
                                            </div>
                                            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                                                <span className="text-zinc-500 block text-[10px] font-semibold uppercase">Shared Children</span>
                                                <span className="font-black text-pink-400 text-xs sm:text-sm">
                                                    {durations.sharedKids.length > 0 ? `${durations.sharedKids.length} Kid${durations.sharedKids.length === 1 ? '' : 's'}` : 'None'}
                                                </span>
                                                <span className="text-[10px] text-zinc-400 block truncate">
                                                    {durations.sharedKids.length > 0 ? durations.sharedKids.map(k => k.name).join(', ') : 'No shared kids'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Toggle Eras Breakdown button */}
                                        <div>
                                            <button
                                                onClick={() => setExpandedHistoryExIds(prev => ({ ...prev, [rel.id]: !prev[rel.id] }))}
                                                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
                                            >
                                                <span>{isExpanded ? '▼ Hide' : '▶ View'} Breakdown of Different Periods ({durations.allPeriods.length})</span>
                                            </button>

                                            {isExpanded && (
                                                <div className="mt-2 space-y-2 pt-2 border-t border-zinc-800">
                                                    {durations.allPeriods.map(period => (
                                                        <div key={period.periodNumber} className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 text-xs space-y-1">
                                                            <div className="flex justify-between items-center font-bold">
                                                                <span className="text-red-400">Dating Period #{period.periodNumber}</span>
                                                                <span className="text-zinc-300 font-mono">{period.durationFormatted}</span>
                                                            </div>
                                                            <p className="text-zinc-400 text-[11px]">
                                                                {period.startDateFormatted} — {period.endDateFormatted}
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                                                                <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-medium">
                                                                    Final status: {period.finalStatus}
                                                                </span>
                                                                {period.marriedFormatted && (
                                                                    <span className="bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded font-medium">
                                                                        💍 Married for: {period.marriedFormatted}
                                                                    </span>
                                                                )}
                                                                {period.engagedFormatted && (
                                                                    <span className="bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded font-medium">
                                                                        💎 Engaged for: {period.engagedFormatted}
                                                                    </span>
                                                                )}
                                                                {period.splitReason && (
                                                                    <span className="bg-red-950/80 text-red-300 px-2 py-0.5 rounded font-medium">
                                                                        Split reason: {period.splitReason}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Kids section */}
                {activeArtistData.kids && activeArtistData.kids.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                            <span>Children ({activeArtistData.kids.length})</span>
                            <span className="text-xs font-normal text-zinc-500">Family, Education & Talents</span>
                        </h2>
                        <div className="space-y-4">
                            {activeArtistData.kids.map(kid => {
                                const ageInWeeks = (gameState.date.year * 52 + gameState.date.week) - (kid.birthDate.year * 52 + kid.birthDate.week);
                                const ageInYears = Math.floor(ageInWeeks / 52);
                                const remMonths = Math.floor((ageInWeeks % 52) / 4);
                                
                                return (
                                    <div key={kid.id} className="bg-zinc-800 p-5 rounded-2xl border border-zinc-700 space-y-4 shadow-xl">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-2xl font-black text-pink-400">{kid.name}</h3>
                                                    {kid.personalityTrait && (
                                                        <span className="bg-pink-900/50 text-pink-200 border border-pink-700/50 px-2 py-0.5 rounded-full text-xs font-bold">
                                                            {kid.personalityTrait}
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${kid.privacySetting === 'spotlight' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                                                        {kid.privacySetting === 'spotlight' ? '📸 Spotlight Superstar' : '🛡️ Protected from Press'}
                                                    </span>
                                                    {kid.isArtist && (
                                                        <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full text-xs font-semibold uppercase">
                                                            Music Artist
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-zinc-400 text-sm mt-0.5">
                                                    Age: {ageInYears} yrs {remMonths > 0 ? `${remMonths} mos` : ''} • Born Wk {kid.birthDate.week}, {kid.birthDate.year}
                                                </p>
                                                {kid.parentName && (
                                                    <p className="text-zinc-400 text-xs">
                                                        Co-parent: <span className="text-zinc-200 font-semibold">{kid.parentName}</span>
                                                    </p>
                                                )}
                                                {kid.dedicatedSongTitle && (
                                                    <p className="text-xs text-rose-400 mt-1 font-semibold flex items-center gap-1">
                                                        <span>🎵</span> Dedicated Track: "{kid.dedicatedSongTitle}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Financial Overview */}
                                            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-700/60 text-xs min-w-[170px] space-y-1">
                                                <div className="flex justify-between text-zinc-400">
                                                    <span>Trust Fund:</span>
                                                    <span className="font-bold text-emerald-400">${(kid.trustFundAmount || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-zinc-400">
                                                    <span>Allowance:</span>
                                                    <span className="font-bold text-white">${(kid.monthlyAllowance || 0).toLocaleString()}/mo</span>
                                                </div>
                                                <div className="flex justify-between text-zinc-400">
                                                    <span>Schooling:</span>
                                                    <span className="font-bold text-cyan-300 capitalize">{kid.schooling || 'Public'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Talent Stats Progress Bars */}
                                        <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 space-y-2">
                                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Talents & Musical Aptitude</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                                                <div>
                                                    <div className="flex justify-between text-[11px] text-zinc-300 mb-0.5">
                                                        <span>🎤 Singing</span>
                                                        <span className="font-bold text-pink-400">{kid.talentStats?.singing || 50}</span>
                                                    </div>
                                                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-pink-500 rounded-full" style={{ width: `${kid.talentStats?.singing || 50}%` }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[11px] text-zinc-300 mb-0.5">
                                                        <span>🔥 Rapping</span>
                                                        <span className="font-bold text-amber-400">{kid.talentStats?.rapping || 45}</span>
                                                    </div>
                                                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${kid.talentStats?.rapping || 45}%` }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[11px] text-zinc-300 mb-0.5">
                                                        <span>✍️ Writing</span>
                                                        <span className="font-bold text-indigo-400">{kid.talentStats?.writing || 50}</span>
                                                    </div>
                                                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${kid.talentStats?.writing || 50}%` }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[11px] text-zinc-300 mb-0.5">
                                                        <span>🎹 Production</span>
                                                        <span className="font-bold text-purple-400">{kid.talentStats?.production || 45}</span>
                                                    </div>
                                                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${kid.talentStats?.production || 45}%` }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[11px] text-zinc-300 mb-0.5">
                                                        <span>✨ Charisma</span>
                                                        <span className="font-bold text-yellow-400">{kid.talentStats?.charisma || 55}</span>
                                                    </div>
                                                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${kid.talentStats?.charisma || 55}%` }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Extracurricular Activities badges */}
                                            {kid.activities && kid.activities.length > 0 && (
                                                <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                                                    <span className="text-[11px] text-zinc-500 font-semibold">Enrolled In:</span>
                                                    {kid.activities.map(act => (
                                                        <span key={act.id} className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                                                            {act.name} (+{act.statBoost} {act.boostSkill})
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons for Child */}
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-700/60">
                                            <button 
                                                onClick={() => setKidEduModal(kid)}
                                                className="bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/40 px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 transition-colors"
                                            >
                                                <span>🎓</span> Schooling
                                            </button>
                                            <button 
                                                onClick={() => setKidActivityModal(kid)}
                                                className="bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/40 px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 transition-colors"
                                            >
                                                <span>🎹</span> Extracurricular
                                            </button>
                                            <button 
                                                onClick={() => setKidPartyModal(kid)}
                                                className="bg-pink-900/60 hover:bg-pink-800 text-pink-200 border border-pink-700/40 px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 transition-colors"
                                            >
                                                <span>🎂</span> Birthday Party
                                            </button>
                                            <button 
                                                onClick={() => setKidFinanceModal(kid)}
                                                className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/40 px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 transition-colors"
                                            >
                                                <span>💰</span> Trust Fund & Allowance
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setKidSongModal(kid);
                                                    setSongTitleInput(`Song for ${kid.name}`);
                                                }}
                                                className="bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/40 px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 transition-colors"
                                            >
                                                <span>🎶</span> Dedicate Song
                                            </button>
                                            <button 
                                                onClick={() => dispatch({
                                                    type: 'SET_KID_PRIVACY',
                                                    payload: {
                                                        kidId: kid.id,
                                                        privacySetting: kid.privacySetting === 'spotlight' ? 'private' : 'spotlight'
                                                    }
                                                })}
                                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 transition-colors"
                                            >
                                                <span>🛡️</span> {kid.privacySetting === 'spotlight' ? 'Shield from Press' : 'Put in Spotlight'}
                                            </button>
                                            {ageInYears >= 10 && !kid.isArtist && (
                                                <button 
                                                    onClick={() => dispatch({ type: 'START_KID_CAREER', payload: { kidId: kid.id } })}
                                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-1.5 rounded-full font-black text-xs shadow-md transition-all flex items-center gap-1"
                                                >
                                                    <span>🎤</span> Launch Solo Music Career
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>

            {/* Modals */}
            {showNewRelationshipModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowNewRelationshipModal(false)}>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-black mb-6">Start Dating</h2>
                        
                        <div className="flex gap-2 mb-6">
                            <button 
                                className={`flex-1 py-2 rounded-lg font-bold ${partnerType === 'npc' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                                onClick={() => setPartnerType('npc')}
                            >
                                Fellow Artist
                            </button>
                            <button 
                                className={`flex-1 py-2 rounded-lg font-bold ${partnerType === 'custom' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                                onClick={() => setPartnerType('custom')}
                            >
                                Someone Else
                            </button>
                        </div>

                        {partnerType === 'npc' ? (
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-zinc-400 mb-2">Select Artist</label>
                                <select 
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white outline-none focus:border-red-500"
                                    value={selectedNpcId}
                                    onChange={e => setSelectedNpcId(e.target.value)}
                                >
                                    <option value="">-- Choose an artist --</option>
                                    {sortedNpcs.map(n => (
                                        <option key={n.uniqueId} value={n.uniqueId}>{n.artist}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-zinc-400 mb-2">Partner's Name</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white outline-none focus:border-red-500"
                                    placeholder="Enter name..."
                                    value={customName}
                                    onChange={e => setCustomName(e.target.value)}
                                    maxLength={40}
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowNewRelationshipModal(false)}
                                className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-bold hover:bg-zinc-700"
                            >
                                Cancel
                            </button>
                            <button 
                                disabled={partnerType === 'npc' ? !selectedNpcId : !customName.trim()}
                                onClick={handleStartDating}
                                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {relationshipToReveal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setRelationshipToReveal(null)}>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-black mb-2">Go Public</h2>
                        <p className="text-zinc-400 mb-6 font-medium">Which outlet do you want to break the news to?</p>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => handleReveal('popbase')}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-lg transition-colors"
                            >
                                Pop Base
                            </button>
                            <button 
                                onClick={() => handleReveal('tmz')}
                                className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold text-lg transition-colors"
                            >
                                TMZ
                            </button>
                            <button 
                                onClick={() => setRelationshipToReveal(null)}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition-colors mt-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showDivorceConfirmModal && activeRelationship && (
                <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowDivorceConfirmModal(false)}>
                    <div className="bg-zinc-900 border border-red-900/60 rounded-2xl w-full max-w-md p-6 shadow-2xl text-white" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <span className="text-3xl">⚖️</span>
                            <h2 className="text-2xl font-black">File For Divorce?</h2>
                        </div>
                        
                        <p className="text-zinc-200 mb-4 text-base">
                            Are you sure you want to file for divorce from <span className="font-bold text-red-400">{activeRelationship.partnerName}</span>?
                        </p>

                        {activeRelationship.prenup && (
                            <div className="bg-amber-950/40 border border-amber-600/40 p-3 rounded-xl text-amber-200 text-xs mb-4 space-y-1">
                                <p className="font-bold uppercase tracking-wide text-amber-400 flex items-center gap-1">
                                    <span>📜</span> Signed Prenuptial Agreement Active
                                </p>
                                <p>• Asset Division: {activeRelationship.prenup.assetProtection === 'full_player_protection' ? `100% ${artistName} Protection` : activeRelationship.prenup.assetProtection === 'partner_favored' ? '60% Partner Favored' : '50/50 Equal Division'}</p>
                                <p>• Alimony: {activeRelationship.prenup.alimonyClause === 'waived' ? 'Fully Waived ($0/mo)' : activeRelationship.prenup.alimonyClause === 'capped_5k' ? 'Capped at $5,000/mo' : '$25,000/mo'}</p>
                                {activeRelationship.prenup.infidelityPenalty > 0 && (
                                    <p>• Infidelity Penalty: ${activeRelationship.prenup.infidelityPenalty.toLocaleString()}</p>
                                )}
                            </div>
                        )}
                        
                        <div className="bg-zinc-800/90 p-4 rounded-xl border border-zinc-700/80 mb-6 text-xs text-zinc-300 space-y-2">
                            <p className="font-semibold text-white text-sm">What happens when you file:</p>
                            <p className="flex items-start gap-2">
                                <span>📰</span> <span><strong>TMZ Report:</strong> TMZ will immediately report that you filed for divorce after {formatMarriageDuration(
                                    activeRelationship.marriedStartYear || activeRelationship.startYear,
                                    activeRelationship.marriedStartWeek || activeRelationship.startWeek || 1,
                                    gameState.date.year,
                                    gameState.date.week
                                )} of marriage.</span>
                            </p>
                            <p className="flex items-start gap-2">
                                <span>⚖️</span> <span><strong>Legal Battle:</strong> You will enter a 1 month to 1 year legal battle for custody, alimony, and child support.</span>
                            </p>
                            <p className="flex items-start gap-2">
                                <span>👨‍⚖️</span> <span><strong>Judge Approval:</strong> A judge must review and approve settlement terms (50% chance per ruling).</span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowDivorceConfirmModal(false)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    dispatch({ type: 'FILE_FOR_DIVORCE', payload: { relationshipId: activeRelationship.id } });
                                    setShowDivorceConfirmModal(false);
                                }}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-colors text-sm shadow-lg shadow-red-900/30"
                            >
                                Yes, File For Divorce
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Prenuptial Agreement Contract Drafting Modal */}
            {showPrenupModal && activeRelationship && (
                <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md overflow-y-auto" onClick={() => setShowPrenupModal(false)}>
                    <div className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-amber-600/60 rounded-2xl w-full max-w-xl p-4 sm:p-6 shadow-2xl text-white my-auto max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
                        {/* Stamp Header */}
                        <div className="border-b-2 border-amber-600/40 pb-3 mb-4 text-center relative">
                            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/40 text-amber-400 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2">
                                <span>🏛️</span> FAMILY COURT & MATRIMONIAL LAW DIVISION
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-amber-200 uppercase tracking-tight">PRENUPTIAL AGREEMENT CONTRACT</h2>
                            <p className="text-[10px] sm:text-xs text-zinc-400 mt-1 uppercase tracking-wider font-semibold">
                                State of California • Official Legal Instrument • Binding Pre-Marital Covenant
                            </p>
                            <div className="mt-2.5 flex justify-center gap-4 text-xs text-amber-300/80 font-mono">
                                <span>SPOUSE A: <strong className="text-white">{artistName}</strong></span>
                                <span>SPOUSE B: <strong className="text-white">{activeRelationship.partnerName}</strong></span>
                            </div>
                        </div>

                        <p className="text-[11px] sm:text-xs text-zinc-300 italic mb-4 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                            "This premarital contract defines the legal separation of property, spousal support covenants, and financial liabilities prior to solemnization of marriage."
                        </p>

                        <div className="space-y-4 sm:space-y-5">
                            {/* Article I: Assets */}
                            <div className="bg-zinc-900/90 p-3 sm:p-4 rounded-xl border border-amber-900/40 space-y-2.5">
                                <h4 className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                    <span>ARTICLE I</span> Asset & Wealth Protection Clause
                                </h4>
                                <p className="text-[11px] sm:text-xs text-zinc-400">Determines division of individual net worth, album royalties, and assets upon marriage dissolution.</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {[
                                        {
                                            id: 'full_player_protection',
                                            title: `🛡️ ${artistName} Protection`,
                                            desc: `${artistName} keeps 100% of individual net worth & royalties.`
                                        },
                                        {
                                            id: 'standard_50_50',
                                            title: '⚖️ 50/50 Equal Split',
                                            desc: 'Marital assets split equally upon divorce.'
                                        },
                                        {
                                            id: 'partner_favored',
                                            title: '🎁 Partner Favored',
                                            desc: '60% of marital assets allocated to spouse.'
                                        }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setAssetProtection(opt.id as any)}
                                            className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                                assetProtection === opt.id
                                                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                                                    : 'bg-zinc-800/60 border-zinc-700/80 text-zinc-400 hover:bg-zinc-800'
                                            }`}
                                        >
                                            <span className="font-black text-xs text-amber-300 mb-0.5">{opt.title}</span>
                                            <span className="text-[10px] sm:text-[11px] leading-snug">{opt.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Article II: Alimony */}
                            <div className="bg-zinc-900/90 p-3 sm:p-4 rounded-xl border border-amber-900/40 space-y-2.5">
                                <h4 className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                    <span>ARTICLE II</span> Spousal Maintenance & Alimony Rights
                                </h4>
                                <p className="text-[11px] sm:text-xs text-zinc-400">Specifies monthly spousal support obligations upon divorce.</p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {[
                                        {
                                            id: 'waived',
                                            title: '🚫 Full Waiver',
                                            desc: '$0/mo spousal support allowed.'
                                        },
                                        {
                                            id: 'capped_5k',
                                            title: '🛡️ Capped Support',
                                            desc: 'Max $5,000/mo alimony cap.'
                                        },
                                        {
                                            id: 'generous_25k',
                                            title: '💎 Generous Provision',
                                            desc: '$25,000/mo spousal maintenance.'
                                        }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setAlimonyClause(opt.id as any)}
                                            className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                                alimonyClause === opt.id
                                                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                                                    : 'bg-zinc-800/60 border-zinc-700/80 text-zinc-400 hover:bg-zinc-800'
                                            }`}
                                        >
                                            <span className="font-black text-xs text-amber-300 mb-0.5">{opt.title}</span>
                                            <span className="text-[10px] sm:text-[11px] leading-snug">{opt.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Article III: Infidelity Clause */}
                            <div className="bg-zinc-900/90 p-3 sm:p-4 rounded-xl border border-amber-900/40 space-y-2.5">
                                <h4 className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                    <span>ARTICLE III</span> Infidelity Penalty Clause
                                </h4>
                                <p className="text-[11px] sm:text-xs text-zinc-400">Financial penalty if either spouse engages in marital breach.</p>

                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { amount: 0, label: 'None ($0)' },
                                        { amount: 500000, label: '$500,000 Penalty' },
                                        { amount: 1000000, label: '$1,000,000 Penalty' }
                                    ].map(opt => (
                                        <button
                                            key={opt.amount}
                                            type="button"
                                            onClick={() => setInfidelityPenalty(opt.amount)}
                                            className={`p-2 sm:p-2.5 rounded-xl border text-center font-bold text-[11px] sm:text-xs transition-all ${
                                                infidelityPenalty === opt.amount
                                                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                                                    : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Signatures & Execution */}
                            <div className="border-t border-zinc-800 pt-3 flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newPrenup: PrenupAgreement = {
                                            id: crypto.randomUUID(),
                                            partnerName: activeRelationship.partnerName,
                                            signedDate: gameState.date,
                                            assetProtection,
                                            alimonyClause,
                                            infidelityPenalty,
                                            status: 'signed'
                                        };
                                        dispatch({
                                            type: 'ADVANCE_RELATIONSHIP',
                                            payload: {
                                                relationshipId: activeRelationship.id,
                                                newStatus: 'married',
                                                prenup: newPrenup
                                            }
                                        });
                                        setShowPrenupModal(false);
                                    }}
                                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition-all"
                                >
                                    <span>✍️</span> Execute Prenup & Get Married
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => {
                                        dispatch({
                                            type: 'ADVANCE_RELATIONSHIP',
                                            payload: {
                                                relationshipId: activeRelationship.id,
                                                newStatus: 'married'
                                            }
                                        });
                                        setShowPrenupModal(false);
                                    }}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 px-3 rounded-xl font-bold text-xs transition-colors"
                                >
                                    💍 Marry Without Prenup
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => setShowPrenupModal(false)}
                                    className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-2.5 px-3 rounded-xl font-bold text-xs transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Executed Prenup Document Modal */}
            {showViewPrenupModal && activeRelationship && activeRelationship.prenup && (
                <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md overflow-y-auto" onClick={() => setShowViewPrenupModal(false)}>
                    <div className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-amber-600/70 rounded-2xl w-full max-w-md sm:max-w-lg p-4 sm:p-6 shadow-2xl text-white my-auto max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
                        <div className="text-center border-b border-amber-600/40 pb-3 mb-4">
                            <div className="text-2xl sm:text-3xl mb-1">📜</div>
                            <h2 className="text-xl sm:text-2xl font-black text-amber-300 uppercase tracking-tight">EXECUTED PRENUPTIAL COVENANT</h2>
                            <p className="text-[10px] sm:text-xs text-zinc-400 font-mono mt-1">
                                Executed on Year {activeRelationship.prenup.signedDate.year}, Week {activeRelationship.prenup.signedDate.week}
                            </p>
                        </div>

                        <div className="bg-zinc-900/90 border border-amber-900/40 rounded-xl p-3.5 sm:p-4 space-y-3 text-xs">
                            <div className="flex justify-between border-b border-zinc-800 pb-2">
                                <span className="text-zinc-400 font-bold uppercase">Spouses</span>
                                <span className="font-bold text-amber-200">{artistName} & {activeRelationship.partnerName}</span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-800 pb-2">
                                <span className="text-zinc-400 font-bold uppercase">Asset Protection</span>
                                <span className="font-bold text-white">
                                    {activeRelationship.prenup.assetProtection === 'full_player_protection' ? `100% ${artistName} Protection` : activeRelationship.prenup.assetProtection === 'partner_favored' ? '60% Partner Favored' : '50/50 Equal Division'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-800 pb-2">
                                <span className="text-zinc-400 font-bold uppercase">Alimony Clause</span>
                                <span className="font-bold text-white">
                                    {activeRelationship.prenup.alimonyClause === 'waived' ? 'Fully Waived ($0/mo)' : activeRelationship.prenup.alimonyClause === 'capped_5k' ? 'Capped at $5,000/mo' : '$25,000/mo Maintenance'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-800 pb-2">
                                <span className="text-zinc-400 font-bold uppercase">Infidelity Penalty</span>
                                <span className="font-bold text-white">
                                    {activeRelationship.prenup.infidelityPenalty > 0 ? `$${activeRelationship.prenup.infidelityPenalty.toLocaleString()}` : 'None'}
                                </span>
                            </div>

                            <div className="pt-2 flex justify-around text-center border-t border-zinc-800 font-serif italic text-amber-400/90 text-xs sm:text-sm">
                                <div>
                                    <p className="border-b border-amber-600/40 pb-1 mb-1 font-sans not-italic text-[10px] sm:text-xs text-zinc-400">Signed by Spouse A</p>
                                    <span>✍️ {artistName}</span>
                                </div>
                                <div>
                                    <p className="border-b border-amber-600/40 pb-1 mb-1 font-sans not-italic text-xs text-zinc-400">Signed by Spouse B</p>
                                    <span>✍️ {activeRelationship.partnerName}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowViewPrenupModal(false)}
                            className="w-full mt-4 sm:mt-5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 sm:py-3 rounded-xl transition-colors text-xs sm:text-sm"
                        >
                            Close Document
                        </button>
                    </div>
                </div>
            )}

            {/* Rekindle Romance with Ex Modal */}
            {rekindleModalRel && (() => {
                const durations = calculateRelationshipDurations(rekindleModalRel, gameState.date.year, gameState.date.week, activeArtistData.kids || []);
                return (
                    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md overflow-y-auto" onClick={() => setRekindleModalRel(null)}>
                        <div className="bg-zinc-900 border border-red-600/70 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl text-white space-y-4 my-auto max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-red-500">
                                    {rekindleModalRel.image ? (
                                        <img src={rekindleModalRel.image} alt={rekindleModalRel.partnerName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-black text-white">{rekindleModalRel.partnerName.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs uppercase tracking-wider text-red-400 font-bold">Rekindle Romance</span>
                                    <h3 className="text-2xl font-black text-white">{rekindleModalRel.partnerName}</h3>
                                    <p className="text-xs text-zinc-400">Entering Dating Era #{durations.timesTogether + 1} together</p>
                                </div>
                            </div>

                            <div className="bg-zinc-800/80 rounded-xl p-4 border border-zinc-700 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Cumulative Relationship History</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                                        <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Total Time Together</span>
                                        <span className="font-bold text-white text-sm">{durations.totalTogetherFormatted}</span>
                                    </div>
                                    <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                                        <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Previous Dating Eras</span>
                                        <span className="font-bold text-white text-sm">{durations.timesTogether} period{durations.timesTogether === 1 ? '' : 's'}</span>
                                    </div>
                                    <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                                        <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Years Married</span>
                                        <span className="font-bold text-yellow-400 text-sm">{durations.totalMarriedFormatted || 'Never married'}</span>
                                    </div>
                                    <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                                        <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Years Engaged</span>
                                        <span className="font-bold text-purple-400 text-sm">{durations.totalEngagedFormatted || 'Never engaged'}</span>
                                    </div>
                                </div>

                                {durations.sharedKids.length > 0 && (
                                    <div className="bg-pink-950/40 border border-pink-700/50 p-3 rounded-lg text-xs">
                                        <span className="font-bold text-pink-300 block mb-1">👶 Shared Children Together ({durations.sharedKids.length}):</span>
                                        <div className="flex flex-wrap gap-2">
                                            {durations.sharedKids.map(k => (
                                                <span key={k.id} className="bg-pink-900/60 text-pink-200 px-2 py-0.5 rounded-md font-semibold">
                                                    {k.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Detailed periods breakdown */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Breakdown of Previous Periods</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {durations.allPeriods.map((period) => (
                                        <div key={period.periodNumber} className="bg-zinc-800/60 border border-zinc-700/60 p-3 rounded-xl text-xs space-y-1">
                                            <div className="flex justify-between font-bold">
                                                <span className="text-red-400">Era #{period.periodNumber}</span>
                                                <span className="text-zinc-300 font-mono">{period.durationFormatted}</span>
                                            </div>
                                            <p className="text-zinc-400 text-[11px]">{period.startDateFormatted} — {period.endDateFormatted}</p>
                                            <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                                                <span className="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300">Status: {period.finalStatus}</span>
                                                {period.marriedFormatted && (
                                                    <span className="bg-yellow-900/60 text-yellow-300 px-1.5 py-0.5 rounded">💍 Married: {period.marriedFormatted}</span>
                                                )}
                                                {period.engagedFormatted && (
                                                    <span className="bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded">💎 Engaged: {period.engagedFormatted}</span>
                                                )}
                                                {period.splitReason && (
                                                    <span className="bg-red-950 text-red-300 px-1.5 py-0.5 rounded">Split: {period.splitReason}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setRekindleModalRel(null)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        dispatch({ type: 'GET_BACK_WITH_EX', payload: { relationshipId: rekindleModalRel.id } });
                                        setRekindleModalRel(null);
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-red-900/40 transition-colors"
                                >
                                    ❤️ Get Back Together
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Date Night & Gifts Modal */}
            {showDateNightModal && activeRelationship && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowDateNightModal(false)}>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <span>🍷</span> Date Night & Romance
                            </h3>
                            <span className="text-xs text-zinc-400">With {activeRelationship.partnerName}</span>
                        </div>

                        <p className="text-xs text-zinc-400">Spend quality time or shower your partner with gifts to increase affection and reduce drama.</p>

                        <div className="space-y-2.5">
                            {[
                                { id: 'dinner_date', name: 'Candlelit 5-Star Dinner', cost: 2500, boost: '+12% Affection, -8% Drama, +15 Hype', icon: '🍽️' },
                                { id: 'vacation', name: 'Luxury Amalfi Coast Getaway', cost: 50000, boost: '+25% Affection, -20% Drama, +40 Hype', icon: '✈️' },
                                { id: 'gift', name: 'Custom Diamond Cartier Jewelry', cost: 30000, boost: '+18% Affection, -5% Drama, +25 Hype', icon: '💎' },
                                { id: 'therapy', name: 'Celebrity Couples Counseling', cost: 1500, boost: '+15% Affection, -35% Drama', icon: '🛋️' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        dispatch({
                                            type: 'RELATIONSHIP_ACTION',
                                            payload: { relationshipId: activeRelationship.id, actionType: item.id as any }
                                        });
                                        setShowDateNightModal(false);
                                    }}
                                    className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 p-3 rounded-xl text-left flex items-center justify-between group transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{item.icon}</span>
                                        <div>
                                            <h4 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors">{item.name}</h4>
                                            <span className="text-[11px] text-emerald-400">{item.boost}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-zinc-300">${item.cost.toLocaleString()}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowDateNightModal(false)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Wedding Extravaganza Modal */}
            {showWeddingModal && activeRelationship && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowWeddingModal(false)}>
                    <div className="bg-zinc-900 border border-pink-500/70 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="text-center border-b border-zinc-800 pb-3">
                            <span className="text-3xl">💍</span>
                            <h3 className="text-2xl font-black text-white">Plan Wedding Extravaganza</h3>
                            <p className="text-xs text-zinc-400 mt-1">Marrying {activeRelationship.partnerName}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-400">Select Wedding Style</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'vegas', title: 'Vegas Chapel', cost: 5000, desc: 'Quick & cheeky (+20 Hype)' },
                                    { id: 'backyard', title: 'Garden Celebration', cost: 25000, desc: 'Intimate & sweet (+40 Hype)' },
                                    { id: 'tuscany', title: 'Lake Como Villa', cost: 300000, desc: 'A-list Italian destination (+80 Hype)' },
                                    { id: 'met_gala', title: 'Royal Extravaganza', cost: 1500000, desc: 'Global media frenzy (+150 Hype)' }
                                ].map(st => (
                                    <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => setWeddingStyle(st.id as any)}
                                        className={`p-3 rounded-xl border text-left transition-all ${
                                            weddingStyle === st.id ? 'bg-pink-600/30 border-pink-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750'
                                        }`}
                                    >
                                        <div className="font-bold text-sm text-pink-300">{st.title}</div>
                                        <div className="text-xs font-mono font-bold text-zinc-200">${st.cost.toLocaleString()}</div>
                                        <div className="text-[10px] text-zinc-400 mt-1">{st.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-white block">Pre-Signed Prenuptial Protection</span>
                                <span className="text-[11px] text-zinc-400">Safeguard 100% of your career earnings and royalties</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={weddingWithPrenup}
                                onChange={e => setWeddingWithPrenup(e.target.checked)}
                                className="w-5 h-5 rounded accent-pink-500"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowWeddingModal(false)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    dispatch({
                                        type: 'PLAN_WEDDING',
                                        payload: {
                                            relationshipId: activeRelationship.id,
                                            style: weddingStyle,
                                            withPrenup: weddingWithPrenup
                                        }
                                    });
                                    setShowWeddingModal(false);
                                }}
                                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-pink-900/40"
                            >
                                💒 Walk Down the Aisle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Partner Music Collab Modal */}
            {showCollabModal && activeRelationship && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowCollabModal(false)}>
                    <div className="bg-zinc-900 border border-indigo-500/70 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="border-b border-zinc-800 pb-3">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <span>🎙️</span> Collaborate with {activeRelationship.partnerName}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">Blend romance and your music empire.</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    dispatch({
                                        type: 'INVITE_PARTNER_COLLAB',
                                        payload: { relationshipId: activeRelationship.id, collabType: 'duet' }
                                    });
                                    setShowCollabModal(false);
                                }}
                                className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 p-4 rounded-xl text-left space-y-1 transition-all"
                            >
                                <span className="font-bold text-sm text-indigo-300 block">🎤 Record a Romantic Duet Single</span>
                                <p className="text-xs text-zinc-400">Record an unreleased track featuring your partner. Generates instant press buzz and +15 Affection.</p>
                            </button>

                            <button
                                onClick={() => {
                                    dispatch({
                                        type: 'INVITE_PARTNER_COLLAB',
                                        payload: { relationshipId: activeRelationship.id, collabType: 'music_video' }
                                    });
                                    setShowCollabModal(false);
                                }}
                                className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 p-4 rounded-xl text-left space-y-1 transition-all"
                            >
                                <span className="font-bold text-sm text-indigo-300 block">🎬 Cast Partner in Upcoming Music Video</span>
                                <p className="text-xs text-zinc-400">Put your partner in front of the lens. +25 Hype, +10 Affection, and viral TikTok trends.</p>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowCollabModal(false)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl text-xs"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Anniversary Celebration Modal */}
            {showAnniversaryModal && activeRelationship && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowAnniversaryModal(false)}>
                    <div className="bg-zinc-900 border border-amber-500/70 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="border-b border-zinc-800 pb-3">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <span>🥂</span> Celebrate Anniversary
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">Honoring your milestone with {activeRelationship.partnerName}</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    dispatch({
                                        type: 'CELEBRATE_ANNIVERSARY',
                                        payload: { relationshipId: activeRelationship.id, celebrationType: 'party' }
                                    });
                                    setShowAnniversaryModal(false);
                                }}
                                className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 p-3.5 rounded-xl text-left transition-all"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-amber-300">🎉 Star-Studded Anniversary Gala</span>
                                    <span className="text-xs font-mono font-bold text-zinc-300">$40,000</span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">+20 Affection, -15 Drama, +35 Hype across tabloids.</p>
                            </button>

                            <button
                                onClick={() => {
                                    dispatch({
                                        type: 'CELEBRATE_ANNIVERSARY',
                                        payload: { relationshipId: activeRelationship.id, celebrationType: 'tribute' }
                                    });
                                    setShowAnniversaryModal(false);
                                }}
                                className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 p-3.5 rounded-xl text-left transition-all"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-pink-300">📱 Heartfelt Social Tribute Post</span>
                                    <span className="text-xs font-mono font-bold text-emerald-400">FREE</span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">Break the internet with a viral anniversary photo dump. +12 Affection.</p>
                            </button>

                            <button
                                onClick={() => {
                                    dispatch({
                                        type: 'CELEBRATE_ANNIVERSARY',
                                        payload: { relationshipId: activeRelationship.id, celebrationType: 'song' }
                                    });
                                    setShowAnniversaryModal(false);
                                }}
                                className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 p-3.5 rounded-xl text-left transition-all"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-purple-300">🎵 Compose Love Ballad</span>
                                    <span className="text-xs font-mono font-bold text-emerald-400">FREE</span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">Channel your devotion into songwriting. +22 Affection, -20 Drama.</p>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowAnniversaryModal(false)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl text-xs"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Kid Schooling / Education Modal */}
            {kidEduModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setKidEduModal(null)}>
                    <div className="bg-zinc-900 border border-cyan-500/70 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="border-b border-zinc-800 pb-3">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <span>🎓</span> Schooling for {kidEduModal.name}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">Select an educational path to shape your child's future talents.</p>
                        </div>

                        <div className="space-y-2">
                            {[
                                { id: 'public', name: 'Public School', cost: 0, boost: 'Grounded upbringing (+Charisma)' },
                                { id: 'private', name: 'Elite Beverly Hills Prep', cost: 40000, boost: '+Writing & +Charisma' },
                                { id: 'swiss_boarding', name: 'Le Rosey Swiss Boarding', cost: 120000, boost: '+Writing & +Production' },
                                { id: 'arts_academy', name: 'Performing Arts Conservatory', cost: 60000, boost: '+Singing, +Rapping & +Stage Charisma' },
                                { id: 'homeschool', name: 'Private Celebrity Tutors', cost: 25000, boost: '+Writing & Creative Freedom' }
                            ].map(edu => (
                                <button
                                    key={edu.id}
                                    onClick={() => {
                                        dispatch({
                                            type: 'UPDATE_KID_EDUCATION',
                                            payload: { kidId: kidEduModal.id, schooling: edu.id as any }
                                        });
                                        setKidEduModal(null);
                                    }}
                                    className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 p-3 rounded-xl text-left transition-all"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-sm text-cyan-300">{edu.name}</span>
                                        <span className="text-xs font-mono font-bold text-zinc-200">
                                            {edu.cost === 0 ? 'FREE' : `$${edu.cost.toLocaleString()}/yr`}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-zinc-400 mt-0.5 block">{edu.boost}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setKidEduModal(null)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl text-xs"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Kid Extracurricular Activity Modal */}
            {kidActivityModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setKidActivityModal(null)}>
                    <div className="bg-zinc-900 border border-purple-500/70 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="border-b border-zinc-800 pb-3">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <span>🎹</span> Extracurricular Lessons for {kidActivityModal.name}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">Enroll in specialized training to develop core musical skills.</p>
                        </div>

                        <div className="space-y-2">
                            {[
                                { id: 'piano', name: 'Classical Piano & Ear Training', skill: 'production', icon: '🎹' },
                                { id: 'vocal', name: 'Master Vocal Coaching', skill: 'singing', icon: '🎤' },
                                { id: 'acting', name: 'Screen Acting & Stage Presence', skill: 'charisma', icon: '🎭' },
                                { id: 'tennis', name: 'Junior Athletic Academy', skill: 'charisma', icon: '🎾' },
                                { id: 'art', name: 'Fine Art & Creative Direction', skill: 'writing', icon: '🎨' }
                            ].map(act => (
                                <button
                                    key={act.id}
                                    onClick={() => {
                                        dispatch({
                                            type: 'ENROLL_KID_ACTIVITY',
                                            payload: { kidId: kidActivityModal.id, activityType: act.id as any }
                                        });
                                        setKidActivityModal(null);
                                    }}
                                    className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 p-3 rounded-xl text-left flex items-center justify-between transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-xl">{act.icon}</span>
                                        <div>
                                            <span className="font-bold text-sm text-purple-300 block">{act.name}</span>
                                            <span className="text-[11px] text-zinc-400">+12 {act.skill} stat boost</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-zinc-200">$5,000</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setKidActivityModal(null)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl text-xs"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Kid Birthday Party Modal */}
            {kidPartyModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setKidPartyModal(null)}>
                    <div className="bg-zinc-900 border border-pink-500/70 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="border-b border-zinc-800 pb-3">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <span>🎂</span> Celebrate {kidPartyModal.name}'s Birthday
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">Make their special day unforgettable.</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    dispatch({
                                        type: 'CELEBRATE_KID_BIRTHDAY',
                                        payload: { kidId: kidPartyModal.id, partyType: 'intimate' }
                                    });
                                    setKidPartyModal(null);
                                }}
                                className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 p-3.5 rounded-xl text-left transition-all"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-pink-300">🎈 Intimate Family & Friends Gathering</span>
                                    <span className="text-xs font-mono font-bold text-zinc-300">$1,500</span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">A sweet, wholesome home party with close family.</p>
                            </button>

                            <button
                                onClick={() => {
                                    dispatch({
                                        type: 'CELEBRATE_KID_BIRTHDAY',
                                        payload: { kidId: kidPartyModal.id, partyType: 'extravaganza' }
                                    });
                                    setKidPartyModal(null);
                                }}
                                className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 p-3.5 rounded-xl text-left transition-all"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-amber-300">🎪 Celebrity Extravaganza Carnival</span>
                                    <span className="text-xs font-mono font-bold text-zinc-300">$50,000</span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">Ferris wheel, petting zoo, celebrity guests, and viral TikTok coverage (+35 Hype).</p>
                            </button>
                        </div>

                        <button
                            onClick={() => setKidPartyModal(null)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl text-xs"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Kid Finance Modal (Trust Fund & Allowance) */}
            {kidFinanceModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setKidFinanceModal(null)}>
                    <div className="bg-zinc-900 border border-emerald-500/70 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="border-b border-zinc-800 pb-3">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <span>💰</span> Manage Finances for {kidFinanceModal.name}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">Set up generational wealth and recurring allowances.</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Deposit Into Trust Fund ($)</label>
                                <input
                                    type="number"
                                    value={trustFundAmountInput}
                                    onChange={e => setTrustFundAmountInput(Number(e.target.value))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono text-sm"
                                    min={0}
                                    step={5000}
                                />
                                <span className="text-[10px] text-zinc-500 mt-0.5 block">Current balance: ${(kidFinanceModal.trustFundAmount || 0).toLocaleString()}</span>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Monthly Allowance ($/mo)</label>
                                <input
                                    type="number"
                                    value={monthlyAllowanceInput}
                                    onChange={e => setMonthlyAllowanceInput(Number(e.target.value))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono text-sm"
                                    min={0}
                                    step={100}
                                />
                                <span className="text-[10px] text-zinc-500 mt-0.5 block">Current allowance: ${(kidFinanceModal.monthlyAllowance || 0).toLocaleString()}/mo</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setKidFinanceModal(null)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-750 text-white font-bold py-2.5 rounded-xl text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    dispatch({
                                        type: 'MANAGE_KID_FINANCES',
                                        payload: {
                                            kidId: kidFinanceModal.id,
                                            trustFundDeposit: trustFundAmountInput > 0 ? trustFundAmountInput : undefined,
                                            monthlyAllowance: monthlyAllowanceInput >= 0 ? monthlyAllowanceInput : undefined
                                        }
                                    });
                                    setKidFinanceModal(null);
                                }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-900/40"
                            >
                                Save Finances
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Kid Dedicate Song Modal */}
            {kidSongModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setKidSongModal(null)}>
                    <div className="bg-zinc-900 border border-rose-500/70 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="border-b border-zinc-800 pb-3">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <span>🎶</span> Dedicate Song to {kidSongModal.name}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">Compose and record an emotional ode to your child.</p>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Song Title</label>
                            <input
                                type="text"
                                value={songTitleInput}
                                onChange={e => setSongTitleInput(e.target.value)}
                                placeholder={`E.g., Little Star (${kidSongModal.name}'s Song)`}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white text-sm"
                            />
                        </div>

                        <div className="bg-zinc-800/80 p-3 rounded-xl text-xs text-zinc-400 space-y-1">
                            <p className="text-rose-300 font-bold">✨ Emotional Impact:</p>
                            <p>Creates an unreleased track in your studio, boosts your public reputation and media praise (+30 Hype).</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setKidSongModal(null)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-750 text-white font-bold py-2.5 rounded-xl text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (songTitleInput.trim()) {
                                        dispatch({
                                            type: 'DEDICATE_SONG_TO_KID',
                                            payload: { kidId: kidSongModal.id, songTitle: songTitleInput.trim() }
                                        });
                                        setKidSongModal(null);
                                    }
                                }}
                                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-rose-900/40"
                            >
                                Record Tribute Song
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Co-Parenting Action Modal */}
            {coParentingModalRel && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setCoParentingModalRel(null)}>
                    <div className="bg-zinc-900 border border-emerald-500/70 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="border-b border-zinc-800 pb-3">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <span>🤝</span> Co-Parenting with {coParentingModalRel.partnerName}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">Maintain harmony for the sake of your shared children.</p>
                        </div>

                        <div className="space-y-2.5">
                            <button
                                onClick={() => {
                                    dispatch({
                                        type: 'CO_PARENTING_ACTION',
                                        payload: { relationshipId: coParentingModalRel.id, actionType: 'peaceful_talk' }
                                    });
                                    setCoParentingModalRel(null);
                                }}
                                className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 p-3.5 rounded-xl text-left transition-all"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-emerald-300">☕ Peaceful Coffee & Check-In</span>
                                    <span className="text-xs font-mono font-bold text-emerald-400">FREE</span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">Talk through school schedules and co-parenting harmony.</p>
                            </button>

                            <button
                                onClick={() => {
                                    dispatch({
                                        type: 'CO_PARENTING_ACTION',
                                        payload: { relationshipId: coParentingModalRel.id, actionType: 'joint_event' }
                                    });
                                    setCoParentingModalRel(null);
                                }}
                                className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 p-3.5 rounded-xl text-left transition-all"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-yellow-300">🎪 Attend Child's Recital/Party Together</span>
                                    <span className="text-xs font-mono font-bold text-zinc-300">$5,000</span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">Show a united parental front. Tabloids report great co-parenting.</p>
                            </button>

                            <button
                                onClick={() => {
                                    dispatch({
                                        type: 'CO_PARENTING_ACTION',
                                        payload: { relationshipId: coParentingModalRel.id, actionType: 'gift' }
                                    });
                                    setCoParentingModalRel(null);
                                }}
                                className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 p-3.5 rounded-xl text-left transition-all"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-pink-300">🎁 Send Generous Support & Bonus Gift</span>
                                    <span className="text-xs font-mono font-bold text-zinc-300">$10,000</span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">Help with extra extracurricular expenses and smooth relations.</p>
                            </button>
                        </div>

                        <button
                            onClick={() => setCoParentingModalRel(null)}
                            className="w-full bg-zinc-800 hover:bg-zinc-750 text-white font-bold py-2.5 rounded-xl text-xs"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatingView;
