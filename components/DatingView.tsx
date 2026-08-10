import React, { useState } from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { useGame } from '../context/GameContext';
import { Relationship, Artist, PrenupAgreement } from '../types';
import { formatMarriageDuration } from '../utils/relationshipUtils';

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
                                        <p className="text-zinc-400">Since {formatRelationshipDate(activeRelationship.startYear, activeRelationship.startWeek)}</p>
                                        {(activeRelationship.status === 'married' || activeRelationship.status === 'divorcing') && (
                                            <p className="text-xs text-yellow-400 font-semibold mt-0.5">
                                                Married for {formatMarriageDuration(
                                                    activeRelationship.marriedStartYear || activeRelationship.startYear,
                                                    activeRelationship.marriedStartWeek || activeRelationship.startWeek || 1,
                                                    gameState.date.year,
                                                    gameState.date.week
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <StatusBadge status={activeRelationship.status} isPublic={activeRelationship.isPublic} />
                            </div>

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
                                    <button 
                                        onClick={() => setShowPrenupModal(true)}
                                        className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-full font-bold text-sm shadow-md flex items-center gap-1.5 transition-all"
                                    >
                                        <span>📜</span> Get Married & Sign Prenup
                                    </button>
                                )}

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
                        <h2 className="text-xl font-bold mb-4 text-zinc-300">Past Relationships</h2>
                        <div className="space-y-4">
                            {pastRelationships.map(rel => (
                                <div key={rel.id} className="bg-zinc-800/50 p-4 rounded-lg flex items-center justify-between border border-zinc-700/50">
                                    <div className="flex gap-4 items-center">
                                        <label htmlFor={`image-upload-${rel.id}`} className="cursor-pointer group relative flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                                                {rel.image ? (
                                                    <img src={rel.image} alt={rel.partnerName} className="w-full h-full object-cover"/>
                                                ) : (
                                                    <span className="text-zinc-500 font-bold text-xl">{rel.partnerName.charAt(0)}</span>
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
                                            <h4 className="font-bold text-lg">{rel.partnerName}</h4>
                                            <p className="text-zinc-400 text-sm">Dated from {formatRelationshipDate(rel.startYear, rel.startWeek)} - {rel.endYear ? formatRelationshipDate(rel.endYear, rel.endWeek) : 'Present'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <StatusBadge status={rel.status} isPublic={rel.isPublic} />
                                        {!activeRelationship && (
                                            <button 
                                                onClick={() => dispatch({ type: 'GET_BACK_WITH_EX', payload: { relationshipId: rel.id } })}
                                                className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                                            >
                                                Get Back Together
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Kids section */}
                {activeArtistData.kids && activeArtistData.kids.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold mb-4">Children</h2>
                        <div className="space-y-4">
                            {activeArtistData.kids.map(kid => {
                                const ageInWeeks = (gameState.date.year * 52 + gameState.date.week) - (kid.birthDate.year * 52 + kid.birthDate.week);
                                const ageInYears = Math.floor(ageInWeeks / 52);
                                
                                return (
                                    <div key={kid.id} className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 space-y-4 shadow-xl">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-black text-pink-400">{kid.name}</h3>
                                                <p className="text-zinc-400">Age: {ageInYears}</p>
                                                {kid.parentName && <p className="text-zinc-400 text-sm">Co-parent: {kid.parentName}</p>}
                                            </div>
                                            {kid.isArtist && (
                                                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-semibold uppercase">
                                                    Music Artist
                                                </span>
                                            )}
                                        </div>
                                        {ageInYears >= 10 && !kid.isArtist && (
                                            <div className="pt-2">
                                                <button 
                                                    onClick={() => dispatch({ type: 'START_KID_CAREER', payload: { kidId: kid.id } })}
                                                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-full font-bold text-sm"
                                                >
                                                    Start Music Career
                                                </button>
                                            </div>
                                        )}
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
        </div>
    );
};

export default DatingView;
