import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Song, OscarAward, FycBannerData } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ForYourConsiderationBanner from './ForYourConsiderationBanner';

type CategoryName = OscarAward['category'];

const SubmitForOscarsView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const { date } = gameState;

    const [songSelection, setSongSelection] = useState<string>('');
    const [leadingSelection, setLeadingSelection] = useState<string>('');
    const [supportingSelection, setSupportingSelection] = useState<string>('');
    const [voiceSelection, setVoiceSelection] = useState<string>('');
    const [showBannerPreview, setShowBannerPreview] = useState<boolean>(false);

    if (!activeArtistData || !activeArtist) return null;

    const eligibleSongs = useMemo(() => {
        const previousYearReleases = activeArtistData.releases.filter(r => r.releaseDate?.year === date.year - 1);
        const songIdsFromPreviousYear = new Set(previousYearReleases.flatMap(r => r.songIds || []));
        const previousYearReleaseIds = new Set(previousYearReleases.map(r => r.id));
        const prevYearSongs = activeArtistData.songs.filter(s => 
            s.soundtrackTitle && (
                (s.releaseId && previousYearReleaseIds.has(s.releaseId)) ||
                songIdsFromPreviousYear.has(s.id)
            )
        );
        if (prevYearSongs.length > 0) return prevYearSongs;
        return activeArtistData.songs.filter(s => s.soundtrackTitle);
    }, [activeArtistData.releases, activeArtistData.songs, date.year]);
    
    const eligibleActingRoles = useMemo(() => {
        const roles = activeArtistData.actingRoles || [];
        const lastYearRoles = roles.filter(r => 
            (r.year === date.year - 1 || !r.year) && 
            (r.status === 'Released' || r.status === 'Completed')
        );
        if (lastYearRoles.length > 0) return lastYearRoles;
        return roles.filter(r => r.status === 'Released' || r.status === 'Completed');
    }, [activeArtistData.actingRoles, date.year]);
    
    const eligibleLeading = useMemo(() => {
        const leading = eligibleActingRoles.filter(r => r.type !== 'Voice Acting' && r.roleType !== 'Supporting Role');
        return leading.length > 0 ? leading : eligibleActingRoles.filter(r => r.type !== 'Voice Acting');
    }, [eligibleActingRoles]);

    const eligibleSupporting = useMemo(() => {
        const supporting = eligibleActingRoles.filter(r => r.type !== 'Voice Acting' && r.roleType !== 'Leading Role');
        return supporting.length > 0 ? supporting : eligibleActingRoles.filter(r => r.type !== 'Voice Acting');
    }, [eligibleActingRoles]);

    const eligibleVoice = useMemo(() => {
        const voice = eligibleActingRoles.filter(r => r.type === 'Voice Acting');
        return voice.length > 0 ? voice : eligibleActingRoles;
    }, [eligibleActingRoles]);

    const handleSubmit = () => {
        const submissions: any[] = [];
        if (songSelection) {
            const song = activeArtistData.songs.find(s => s.id === songSelection);
            if (song) submissions.push({ artistId: activeArtist.id, category: 'Best Original Song' as CategoryName, itemId: song.id, itemName: song.title });
        }
        if (leadingSelection) {
            const role = (activeArtistData.actingRoles || []).find(r => r.id === leadingSelection);
            if (role) submissions.push({ artistId: activeArtist.id, category: 'Best Actor/Actress' as CategoryName, itemId: role.id, itemName: role.title });
        }
        if (supportingSelection) {
            const role = (activeArtistData.actingRoles || []).find(r => r.id === supportingSelection);
            if (role) submissions.push({ artistId: activeArtist.id, category: 'Best Supporting Actor/Actress' as CategoryName, itemId: role.id, itemName: role.title });
        }
        if (voiceSelection) {
            const role = (activeArtistData.actingRoles || []).find(r => r.id === voiceSelection);
            if (role) submissions.push({ artistId: activeArtist.id, category: 'Best Voice Actor/Actress' as CategoryName, itemId: role.id, itemName: role.title });
        }
        
        if (submissions.length === 0) return;
        
        const emailId = activeArtistData.inbox.find(e => e.offer?.type === 'oscarSubmission' && !e.offer.isSubmitted)?.id || '';
        dispatch({ type: 'SUBMIT_FOR_OSCARS', payload: { submissions, emailId } });
    };

    const hasAnySelection = !!songSelection || !!leadingSelection || !!supportingSelection || !!voiceSelection;

    const previewSubmissions = useMemo(() => {
        const subs: { category: string; itemName: string; itemId?: string }[] = [];
        if (songSelection) {
            const song = activeArtistData.songs.find(s => s.id === songSelection);
            if (song) subs.push({ category: 'Best Original Song', itemId: song.id, itemName: song.title });
        }
        if (leadingSelection) {
            const role = (activeArtistData.actingRoles || []).find(r => r.id === leadingSelection);
            if (role) subs.push({ category: 'Best Actor/Actress', itemId: role.id, itemName: role.title });
        }
        if (supportingSelection) {
            const role = (activeArtistData.actingRoles || []).find(r => r.id === supportingSelection);
            if (role) subs.push({ category: 'Best Supporting Actor/Actress', itemId: role.id, itemName: role.title });
        }
        if (voiceSelection) {
            const role = (activeArtistData.actingRoles || []).find(r => r.id === voiceSelection);
            if (role) subs.push({ category: 'Best Voice Actor/Actress', itemId: role.id, itemName: role.title });
        }
        return subs;
    }, [songSelection, leadingSelection, supportingSelection, voiceSelection, activeArtistData.songs, activeArtistData.actingRoles]);

    const mainProjectName = useMemo(() => {
        const role = previewSubmissions.find(s => s.category.includes('Actor') || s.category.includes('Actress'));
        if (role && role.itemName) return role.itemName;
        const song = previewSubmissions.find(s => s.category === 'Best Original Song');
        if (song && song.itemName) return song.itemName;
        return activeArtist.name;
    }, [previewSubmissions, activeArtist.name]);

    const fycPreviewData: FycBannerData = {
        id: 'preview',
        awardShow: 'OSCARS',
        awardShowTitle: 'FOR YOUR OSCAR® CONSIDERATION',
        artistId: activeArtist.id,
        artistName: activeArtist.name,
        artistImage: activeArtist.image || activeArtistData.artistImages?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=800&fit=crop',
        mainProjectName,
        submissions: previewSubmissions,
        date,
    };

    return (
         <div className="h-full w-full bg-zinc-900 flex flex-col">
            <header className="p-4 flex items-center justify-between sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10 border-b border-zinc-700/50">
                <div className="flex items-center gap-4">
                    <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'inbox'})} className="p-2 rounded-full hover:bg-white/10">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold">Oscar Submissions</h1>
                </div>
                {hasAnySelection && (
                    <button
                        onClick={() => setShowBannerPreview(true)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors flex items-center gap-1.5"
                    >
                        <span>✨</span> Preview FYC Banner
                    </button>
                )}
            </header>
            
            <main className="flex-grow p-4 space-y-6 overflow-y-auto">
                <div>
                    <label htmlFor="best-original-song" className="block text-lg font-bold text-[#d4af37]">Best Original Song</label>
                    <p className="text-sm text-zinc-400 mb-2">Only songs written for a film soundtrack are eligible.</p>
                    {eligibleSongs.length === 0 ? (
                        <div className="mt-1 text-sm text-zinc-500 bg-zinc-800 p-3 rounded-md">No eligible soundtrack songs from the previous year.</div>
                    ) : (
                        <select 
                            id="best-original-song"
                            value={songSelection}
                            onChange={e => setSongSelection(e.target.value)}
                            className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-[#d4af37] focus:border-[#d4af37] sm:text-sm h-12 px-3 text-white"
                        >
                            <option value="">-- Select a song --</option>
                            {eligibleSongs.map(opt => <option key={opt.id} value={opt.id}>{opt.title}</option>)}
                        </select>
                    )}
                </div>
                
                <div>
                    <label htmlFor="best-leading" className="block text-lg font-bold text-[#d4af37]">Best Actor/Actress</label>
                    <p className="text-sm text-zinc-400 mb-2">Submit your leading roles in Movies and TV Shows.</p>
                    {eligibleLeading.length === 0 ? (
                        <div className="mt-1 text-sm text-zinc-500 bg-zinc-800 p-3 rounded-md">No eligible leading roles from the previous year.</div>
                    ) : (
                        <select 
                            id="best-leading"
                            value={leadingSelection}
                            onChange={e => setLeadingSelection(e.target.value)}
                            className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-[#d4af37] focus:border-[#d4af37] sm:text-sm h-12 px-3 text-white"
                        >
                            <option value="">-- Select a leading role --</option>
                            {eligibleLeading.map(opt => <option key={opt.id} value={opt.id}>{opt.title} ({opt.type})</option>)}
                        </select>
                    )}
                </div>
                
                <div>
                    <label htmlFor="best-supporting" className="block text-lg font-bold text-[#d4af37]">Best Supporting Actor/Actress</label>
                    <p className="text-sm text-zinc-400 mb-2">Submit your supporting roles in Movies and TV Shows.</p>
                    {eligibleSupporting.length === 0 ? (
                        <div className="mt-1 text-sm text-zinc-500 bg-zinc-800 p-3 rounded-md">No eligible supporting roles from the previous year.</div>
                    ) : (
                        <select 
                            id="best-supporting"
                            value={supportingSelection}
                            onChange={e => setSupportingSelection(e.target.value)}
                            className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-[#d4af37] focus:border-[#d4af37] sm:text-sm h-12 px-3 text-white"
                        >
                            <option value="">-- Select a supporting role --</option>
                            {eligibleSupporting.map(opt => <option key={opt.id} value={opt.id}>{opt.title} ({opt.type})</option>)}
                        </select>
                    )}
                </div>
                <div>
                    <label htmlFor="best-voice" className="block text-lg font-bold text-[#d4af37]">Best Voice Actor/Actress</label>
                    <p className="text-sm text-zinc-400 mb-2">Submit your Voice Acting roles.</p>
                    {eligibleVoice.length === 0 ? (
                        <div className="mt-1 text-sm text-zinc-500 bg-zinc-800 p-3 rounded-md">No eligible voice acting roles from the previous year.</div>
                    ) : (
                        <select 
                            id="best-voice"
                            value={voiceSelection}
                            onChange={e => setVoiceSelection(e.target.value)}
                            className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-[#d4af37] focus:border-[#d4af37] sm:text-sm h-12 px-3 text-white"
                        >
                            <option value="">-- Select a voice acting role --</option>
                            {eligibleVoice.map(opt => <option key={opt.id} value={opt.id}>{opt.title} ({opt.type})</option>)}
                        </select>
                    )}
                </div>
            </main>

            <div className="p-4 border-t border-zinc-700/50 bg-zinc-950/40">
                <div className="flex gap-2">
                    {hasAnySelection && (
                        <button
                            type="button"
                            onClick={() => setShowBannerPreview(true)}
                            className="h-12 px-5 bg-zinc-800 hover:bg-zinc-700 text-[#d4af37] border border-[#d4af37]/30 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <span>✨</span> FYC Banner
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={!hasAnySelection}
                        className="flex-1 h-12 bg-[#d4af37] hover:bg-[#c4a132] text-black font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-[#d4af37]/20 disabled:bg-zinc-600 disabled:text-zinc-400"
                    >
                        Submit to The Academy
                    </button>
                </div>
                <p className="text-center text-xs text-zinc-400 mt-2.5 flex items-center justify-center gap-1.5">
                    <span className="text-amber-400 font-semibold">Pop Base</span> will post your official 'For Your Consideration' banner on X next week.
                </p>
            </div>

            {/* Banner Preview Modal */}
            {showBannerPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="relative max-w-xl w-full max-h-[92vh] overflow-y-auto rounded-3xl">
                        <div className="flex justify-between items-center mb-3 px-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">
                                Official For Your Consideration Banner Preview
                            </span>
                            <button
                                onClick={() => setShowBannerPreview(false)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 rounded-full text-xs font-semibold"
                            >
                                Close
                            </button>
                        </div>
                        <ForYourConsiderationBanner
                            bannerData={fycPreviewData}
                            isInteractive={false}
                        />
                        <p className="text-center text-xs text-zinc-400 mt-3">
                            This banner will be published by Pop Base on X one week after submission.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmitForOscarsView;
