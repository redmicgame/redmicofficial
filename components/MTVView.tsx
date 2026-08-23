import React, { useMemo, useState } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { 
    Tv, 
    Flame, 
    TrendingUp, 
    Sparkles, 
    Film, 
    Award, 
    Radio, 
    CheckCircle2, 
    Upload, 
    ExternalLink, 
    Clock, 
    Eye, 
    DollarSign,
    ThumbsUp,
    Play
} from 'lucide-react';

interface DirectorOption {
    id: string;
    name: string;
    style: string;
    cost: number;
    hypeBonus: number;
    description: string;
    budgetTier: string;
}

const DIRECTORS: DirectorOption[] = [
    {
        id: 'hype_williams',
        name: 'Hype Williams',
        style: 'Futuristic Fisheye & High-Gloss Extravaganza',
        cost: 120000,
        hypeBonus: 45,
        description: 'Iconic shiny suits, sweeping camera angles, explosive lighting, and multi-million dollar sets.',
        budgetTier: 'Blockbuster'
    },
    {
        id: 'spike_jonze',
        name: 'Spike Jonze',
        style: 'Artistic Concept & Kinetic Storytelling',
        cost: 75000,
        hypeBonus: 35,
        description: 'Ingenious conceptual premises, unforgettable choreography, and viral MTV culture moments.',
        budgetTier: 'Premium Creative'
    },
    {
        id: 'michel_gondry',
        name: 'Michel Gondry',
        style: 'Surreal Visual Illusions & Optical Tricks',
        cost: 45000,
        hypeBonus: 28,
        description: 'Mind-bending stop-motion, mirror tricks, and mesmerizing practical cinematic effects.',
        budgetTier: 'Visionary Indie'
    },
    {
        id: 'mtv_guerrilla',
        name: 'MTV Guerrilla Crew',
        style: 'Raw 90s Handheld & Rooftop Gig',
        cost: 15000,
        hypeBonus: 18,
        description: 'Gritty street aesthetic, fisheye lenses, neon-lit subway cars, and energetic live captures.',
        budgetTier: 'Gritty Underground'
    },
    {
        id: 'soundstage_basic',
        name: 'Studio Soundstage',
        style: 'Classic Performance with Laser Lights',
        cost: 5000,
        hypeBonus: 10,
        description: 'Clean stage performance with synchronized lighting and solid camera work.',
        budgetTier: 'Standard Promo'
    }
];

type RotationTier = 'heavy' | 'buzzworthy' | 'medium';

const MAX_TRL_REQUESTS = 80_000_000; // 80M absolute ceiling for top TRL requests

function calculateTrlRequests(options: {
    popularity: number;
    hype?: number;
    quality?: number;
    rotation: RotationTier;
    weeksSinceRelease: number;
    rawViews?: number;
    isMtv?: boolean;
    seedBonus?: number;
}): number {
    const pop = Math.min(100, Math.max(1, options.popularity || 20));
    const hype = Math.min(100, Math.max(0, options.hype ?? pop));
    const qual = Math.min(100, Math.max(0, options.quality ?? 75));
    
    // Balanced power score (0 - 100)
    const powerScore = (pop * 0.55) + (hype * 0.3) + (qual * 0.15);
    
    // Rotation multiplier
    const rotMult = options.rotation === 'heavy' ? 1.25 : options.rotation === 'buzzworthy' ? 1.08 : 0.9;
    
    // Recency curve (peaks in early weeks, gradually descends)
    const recencyMult = Math.max(0.25, 1 - (Math.max(0, options.weeksSinceRelease - 3) * 0.014));
    
    // Non-linear power ratio
    const ratio = Math.pow(powerScore / 100, 1.85);
    
    const mtvBonus = options.isMtv ? 1.08 : 1.0;
    
    // Damped views factor (logarithmic so billions/trillions don't blow up requests)
    const viewsFactor = options.rawViews && options.rawViews > 0 
        ? Math.min(1.12, 0.95 + Math.log10(Math.max(10, options.rawViews)) / 65) 
        : 1.0;
    
    const seed = Math.abs(options.seedBonus || 0) % 300_000;
    
    // Scale relative to 76M base so top 100-rating heavy rotation hits cap nicely at 80M
    let calculated = Math.floor(76_000_000 * ratio * rotMult * recencyMult * mtvBonus * viewsFactor) + seed;
    
    // Baseline minimum requests for any charting video
    calculated = Math.max(25_000, calculated);
    
    // Strictly capped at 80M max
    return Math.min(MAX_TRL_REQUESTS, calculated);
}

const MTVView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const { artistsData, npcs, date } = gameState;
    
    const [activeTab, setActiveTab] = useState<'countdown' | 'submit' | 'rotation' | 'myVideos'>('countdown');
    
    // Video Submission Form State
    const [selectedSongId, setSelectedSongId] = useState<string>('');
    const [selectedDirectorId, setSelectedDirectorId] = useState<string>(DIRECTORS[0].id);
    const [selectedRotation, setSelectedRotation] = useState<RotationTier>('buzzworthy');
    const [customTitle, setCustomTitle] = useState<string>('');
    const [customThumbnail, setCustomThumbnail] = useState<string>('');
    const [submissionSuccessModal, setSubmissionSuccessModal] = useState<boolean>(false);
    const [votedVideoIds, setVotedVideoIds] = useState<string[]>([]);
    const [voteBonusMap, setVoteBonusMap] = useState<Record<string, number>>({});
    const [voteFeedback, setVoteFeedback] = useState<string | null>(null);

    const isYouTubeEra = date.year >= 2008;

    // Available songs to shoot an MTV video for
    const eligibleSongs = useMemo(() => {
        if (!activeArtistData) return [];
        const existingVideoSongIds = new Set(activeArtistData.videos.map(v => v.songId));
        return activeArtistData.songs.filter(s => s && s.title);
    }, [activeArtistData]);

    const selectedDirector = useMemo(() => {
        return DIRECTORS.find(d => d.id === selectedDirectorId) || DIRECTORS[0];
    }, [selectedDirectorId]);

    const rotationCost = useMemo(() => {
        switch (selectedRotation) {
            case 'heavy': return 40000;
            case 'buzzworthy': return 15000;
            case 'medium': return 0;
        }
    }, [selectedRotation]);

    const totalShootCost = (selectedDirector?.cost || 0) + rotationCost;

    // Top 10 Total Request Live (TRL) Countdown
    const topVideos = useMemo(() => {
        let allMVs: any[] = [];
        
        // Player/Playable Videos
        for (const artistId in artistsData) {
            const data = artistsData[artistId];
            let artistName = "Artist";
            let artistImage = "";
            if (gameState.soloArtist?.id === artistId) {
                artistName = gameState.soloArtist.name;
                artistImage = gameState.soloArtist.image;
            } else if (gameState.group?.id === artistId) {
                artistName = gameState.group.name;
                artistImage = gameState.group.image;
            } else if (gameState.extraPlayableArtists) {
                const found = gameState.extraPlayableArtists.find(a => a.id === artistId);
                if (found) {
                    artistName = found.name;
                    artistImage = found.image;
                }
            }

            data.videos.forEach(v => {
                if (v.isMtv || v.type === 'Music Video' || v.type === 'Live Performance') {
                    const weeksSinceRelease = (gameState.date.year * 52 + gameState.date.week) - (v.releaseDate.year * 52 + v.releaseDate.week);
                    if (weeksSinceRelease <= 78) {
                        const targetSong = data.songs?.find(s => s.id === v.songId);
                        const seed = (v.id ? v.id.charCodeAt(0) * 4500 : 50000);
                        const baseCalculated = calculateTrlRequests({
                            popularity: data.popularity || 50,
                            hype: targetSong?.hype || data.hype || 50,
                            quality: targetSong?.quality || 75,
                            rotation: v.mtvRotation || 'heavy',
                            weeksSinceRelease: Math.max(0, weeksSinceRelease),
                            rawViews: (v.mtvViews || 0) + (v.views || 0),
                            isMtv: v.isMtv || false,
                            seedBonus: seed
                        });

                        const voteBonus = voteBonusMap[v.id] || 0;
                        const calcRequests = Math.min(MAX_TRL_REQUESTS, baseCalculated + voteBonus);
                        
                        allMVs.push({ 
                            ...v, 
                            artistName,
                            artistImage,
                            isPlayer: true,
                            requests: calcRequests,
                            rotation: v.mtvRotation || 'heavy',
                            weeksOnChart: Math.max(1, Math.min(50, weeksSinceRelease + 1))
                        });
                    }
                }
            });
        }
        
        // NPC Videos
        if (npcs) {
            npcs.forEach(npc => {
                const age = npc.releaseDate ? (gameState.date.year * 52 + gameState.date.week) - (npc.releaseDate.year * 52 + npc.releaseDate.week) : 0;
                if (age <= 78 && npc.basePopularity > 20) {
                    const rotation: RotationTier = npc.basePopularity > 75 ? 'heavy' : npc.basePopularity > 50 ? 'buzzworthy' : 'medium';
                    const seed = ((npc.title?.charCodeAt(0) || 1) * 3210);
                    const npcRequests = calculateTrlRequests({
                        popularity: npc.basePopularity,
                        hype: npc.basePopularity,
                        quality: 70 + ((npc.basePopularity * 7) % 25),
                        rotation,
                        weeksSinceRelease: Math.max(0, age),
                        rawViews: Math.min(100_000_000, npc.basePopularity * 350000),
                        isMtv: true,
                        seedBonus: seed
                    });

                    const voteBonus = voteBonusMap[npc.id || npc.uniqueId || `npc_${npc.title}`] || 0;
                    const finalRequests = Math.min(MAX_TRL_REQUESTS, npcRequests + voteBonus);

                    allMVs.push({
                        id: npc.uniqueId || `npc_${npc.title}`,
                        title: npc.title,
                        artistName: npc.artist,
                        thumbnail: npc.coverArt || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
                        isPlayer: false,
                        views: Math.min(150_000_000, npc.basePopularity * 250000),
                        requests: finalRequests,
                        rotation,
                        type: 'Music Video',
                        weeksOnChart: Math.max(1, Math.min(40, age + 1))
                    });
                }
            });
        }

        return allMVs
            .sort((a, b) => b.requests - a.requests)
            .slice(0, 10);
    }, [artistsData, npcs, gameState.date, gameState.soloArtist, gameState.group, gameState.extraPlayableArtists, voteBonusMap]);

    // Player's MTV Videos
    const myMtvVideos = useMemo(() => {
        if (!activeArtistData) return [];
        return activeArtistData.videos
            .filter(v => v.isMtv || v.channelId === 'mtv')
            .sort((a, b) => ((b.mtvViews || 0) + (b.views || 0)) - ((a.mtvViews || 0) + (a.views || 0)));
    }, [activeArtistData]);

    // Rotation breakdown videos
    const rotationSchedule = useMemo(() => {
        const heavy: any[] = [];
        const buzzworthy: any[] = [];
        const medium: any[] = [];

        topVideos.forEach(v => {
            if (v.rotation === 'heavy') heavy.push(v);
            else if (v.rotation === 'buzzworthy') buzzworthy.push(v);
            else medium.push(v);
        });

        return { heavy, buzzworthy, medium };
    }, [topVideos]);

    // Handle Vote for Video on TRL
    const handleVoteTRL = (videoId: string, title: string) => {
        if (votedVideoIds.includes(videoId)) {
            setVoteFeedback(`You have already voted for "${title}" this week!`);
            setTimeout(() => setVoteFeedback(null), 3000);
            return;
        }

        dispatch({ type: 'VOTE_TRL_VIDEO', payload: { videoId } });
        setVotedVideoIds(prev => [...prev, videoId]);
        setVoteBonusMap(prev => ({
            ...prev,
            [videoId]: (prev[videoId] || 0) + 180_000
        }));
        setVoteFeedback(`🎉 Your vote for "${title}" has been registered on TRL! Total requests updated.`);
        setTimeout(() => setVoteFeedback(null), 3500);
    };

    // Handle MTV Video Submission
    const handleSubmitMTV = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeArtist || !activeArtistData) return;

        const targetSong = activeArtistData.songs.find(s => s.id === selectedSongId);
        if (!targetSong) {
            alert("Please select a song for your MTV music video.");
            return;
        }

        if (activeArtistData.money < totalShootCost) {
            alert(`Insufficient funds. You need $${totalShootCost.toLocaleString()} but currently have $${activeArtistData.money.toLocaleString()}.`);
            return;
        }

        const videoTitle = customTitle.trim() || `${activeArtist.name} - ${targetSong.title} (Official Music Video)`;
        const thumb = customThumbnail.trim() || targetSong.coverArt || activeArtist.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80';

        const initialBroadcastImpressions = Math.floor(
            (activeArtistData.popularity * 2500) + 
            (selectedDirector.hypeBonus * 4000) + 
            (selectedRotation === 'heavy' ? 150000 : selectedRotation === 'buzzworthy' ? 75000 : 25000)
        );

        const initialWeekly = Math.floor(initialBroadcastImpressions * 0.4);

        const newVideo = {
            id: `v_mtv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            songId: targetSong.id,
            title: videoTitle,
            type: 'Music Video' as const,
            views: 0, // In MTV era (<2008), 0 on YouTube. In 2008+, MTV uploads to YouTube!
            mtvViews: initialBroadcastImpressions,
            mtvWeeklyViews: initialWeekly,
            mtvRotation: selectedRotation,
            trlPeak: Math.floor(Math.random() * 5) + 1,
            trlWeeks: 1,
            director: selectedDirector.name,
            budgetTier: selectedDirector.budgetTier,
            thumbnail: thumb,
            releaseDate: { ...date },
            artistId: activeArtist.id,
            channelId: 'mtv',
            isMtv: true,
            description: `Official MTV Music Video premiere for "${targetSong.title}" directed by ${selectedDirector.name}. Broadcast premiere on Total Request Live.`
        };

        dispatch({
            type: 'SUBMIT_MTV_VIDEO',
            payload: {
                video: newVideo,
                cost: totalShootCost,
                rotation: selectedRotation
            }
        });

        setSubmissionSuccessModal(true);
        setSelectedSongId('');
        setCustomTitle('');
        setCustomThumbnail('');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomThumbnail(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="h-full w-full bg-zinc-950 overflow-y-auto text-white flex flex-col font-sans">
            {/* MTV Header */}
            <header className="sticky top-0 bg-black/95 backdrop-blur-md z-30 border-b border-zinc-800 shadow-2xl">
                <div className="max-w-6xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} 
                                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
                                title="Back to Game"
                            >
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                            
                            {/* MTV Logo */}
                            <div className="flex items-center gap-2">
                                <div className="bg-yellow-400 text-black font-black px-2 py-0.5 text-2xl tracking-tighter italic border-2 border-black rotate-[-4deg] shadow-md">
                                    M<span className="text-red-600">T</span>V
                                </div>
                                <div>
                                    <h1 className="text-xl font-black italic tracking-tight leading-none text-white flex items-center gap-2">
                                        MUSIC TELEVISION
                                        <span className="text-[10px] font-mono not-italic bg-red-600/30 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded font-bold uppercase">
                                            TRL Studios NYC
                                        </span>
                                    </h1>
                                    <p className="text-[11px] text-zinc-400 font-medium">The Global Music Video & Pop-Culture Authority</p>
                                </div>
                            </div>
                        </div>

                        {/* Era Badge */}
                        <div className="text-right hidden sm:block">
                            <div className="text-xs font-bold text-yellow-400 flex items-center justify-end gap-1.5">
                                <Tv className="w-3.5 h-3.5" />
                                {isYouTubeEra ? 'MTV Digital YouTube Network (2008+)' : 'Exclusive MTV Cable Broadcast'}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono">
                                Year {date.year} • Week {date.week}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 border-t border-zinc-800/80 mt-3 pt-3 overflow-x-auto no-scrollbar">
                        <button 
                            onClick={() => setActiveTab('countdown')}
                            className={`px-4 py-2 font-bold text-xs md:text-sm tracking-wider uppercase rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeTab === 'countdown' 
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 font-black' 
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                        >
                            <Flame className="w-4 h-4 text-yellow-400" />
                            TRL Countdown
                        </button>

                        <button 
                            onClick={() => setActiveTab('submit')}
                            className={`px-4 py-2 font-bold text-xs md:text-sm tracking-wider uppercase rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeTab === 'submit' 
                                    ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 font-black' 
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                        >
                            <Film className="w-4 h-4 text-red-600" />
                            Submit Video to MTV
                        </button>

                        <button 
                            onClick={() => setActiveTab('rotation')}
                            className={`px-4 py-2 font-bold text-xs md:text-sm tracking-wider uppercase rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeTab === 'rotation' 
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 font-black' 
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                        >
                            <Radio className="w-4 h-4 text-yellow-400" />
                            On-Air Rotation
                        </button>

                        <button 
                            onClick={() => setActiveTab('myVideos')}
                            className={`px-4 py-2 font-bold text-xs md:text-sm tracking-wider uppercase rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeTab === 'myVideos' 
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 font-black' 
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                        >
                            <Award className="w-4 h-4 text-yellow-400" />
                            My MTV Premieres ({myMtvVideos.length})
                        </button>
                    </div>
                </div>
            </header>

            {/* Vote feedback toast */}
            {voteFeedback && (
                <div className="bg-yellow-400 text-black px-4 py-2 text-center text-sm font-bold shadow-md sticky top-[108px] z-20 transition-all">
                    {voteFeedback}
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-8 pb-24">
                
                {/* 2008-2009 Digital YouTube Era Alert Banner */}
                {isYouTubeEra && (
                    <div className="bg-gradient-to-r from-red-950/80 via-zinc-900 to-black border border-red-600/40 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-600/40">
                                <Tv className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-white flex items-center gap-2">
                                    MTV Official YouTube Channel Era Active!
                                    <span className="text-xs bg-yellow-400 text-black font-bold px-2 py-0.5 rounded">2008–2009 Integration</span>
                                </h3>
                                <p className="text-zinc-300 text-xs md:text-sm">
                                    MTV now uploads all music video premieres and classic TV catalog directly to MTV's official YouTube Channel (<span className="text-yellow-400 font-semibold">@MTV</span>), earning digital views and global streaming revenue!
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                dispatch({ type: 'SWITCH_YOUTUBE_CHANNEL', payload: 'mtv' });
                                dispatch({ type: 'CHANGE_VIEW', payload: 'youtube' });
                            }}
                            className="bg-white hover:bg-zinc-200 text-black font-black px-4 py-2.5 rounded-xl text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all shadow-md"
                        >
                            View MTV YouTube Channel
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* TAB 1: TRL COUNTDOWN */}
                {activeTab === 'countdown' && (
                    <div className="space-y-6">
                        {/* Hero Live Studio Banner */}
                        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-red-950 via-zinc-900 to-black border-2 border-red-600/30 p-6 md:p-8 shadow-2xl">
                            <div className="absolute right-0 top-0 bottom-0 opacity-10 text-[180px] font-black italic tracking-tighter text-red-600 pointer-events-none select-none flex items-center pr-4">
                                TRL
                            </div>
                            
                            <div className="relative z-10 max-w-2xl space-y-3">
                                <div className="inline-flex items-center gap-2 bg-red-600 text-white font-black px-3 py-1 text-xs uppercase tracking-widest rounded shadow-md">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                                    Broadcast Live from Times Square
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black italic tracking-tight text-white">
                                    TOTAL REQUEST LIVE
                                </h2>
                                <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
                                    The Top 10 most demanded music videos on television, voted by millions of fans worldwide. Vote for your favorite video to climb the countdown!
                                </p>
                                <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-zinc-400">
                                    <span className="flex items-center gap-1.5 text-yellow-400">
                                        <Tv className="w-4 h-4" /> Daily Live Show • 3:30 PM EST
                                    </span>
                                    <span className="flex items-center gap-1.5 text-zinc-300">
                                        <Flame className="w-4 h-4 text-red-500" /> Host: Carson Daly
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Top 10 List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xl font-black italic uppercase tracking-wider text-white flex items-center gap-2">
                                    <span className="text-red-500">TRL Top 10</span> This Week
                                </h3>
                                <span className="text-xs text-zinc-400 font-mono">Updated Weekly</span>
                            </div>

                            {topVideos.length === 0 ? (
                                <div className="p-12 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                                    <Tv className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                                    <p className="text-zinc-400 font-bold text-base">No music videos on rotation this week.</p>
                                    <p className="text-zinc-500 text-xs mt-1">Submit your music video to MTV to debut on the countdown!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {topVideos.map((video, index) => {
                                        const isTop3 = index < 3;
                                        const hasVoted = votedVideoIds.includes(video.id);

                                        return (
                                            <div 
                                                key={video.id || index}
                                                className={`flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl transition-all border ${
                                                    video.isPlayer 
                                                        ? 'bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border-red-500/50 shadow-lg shadow-red-950/30' 
                                                        : 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700'
                                                }`}
                                            >
                                                {/* Rank + Thumb + Details */}
                                                <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                                                    {/* Big Rank Number */}
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl flex-shrink-0 shadow-md ${
                                                        index === 0 
                                                            ? 'bg-yellow-400 text-black border-2 border-yellow-300' 
                                                            : index === 1 
                                                            ? 'bg-zinc-300 text-black' 
                                                            : index === 2 
                                                            ? 'bg-amber-600 text-white' 
                                                            : 'bg-zinc-800 text-zinc-300'
                                                    }`}>
                                                        #{index + 1}
                                                    </div>

                                                    {/* Video Thumbnail */}
                                                    <div className="relative w-28 md:w-36 aspect-video rounded-lg overflow-hidden flex-shrink-0 border border-zinc-800 bg-zinc-950">
                                                        <img 
                                                            src={video.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80'} 
                                                            alt={video.title} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                            <Play className="w-6 h-6 text-white drop-shadow" />
                                                        </div>
                                                        {video.rotation === 'heavy' && (
                                                            <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                                                Heavy
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Titles & Artist */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-black text-base md:text-lg text-white truncate">
                                                                {video.title}
                                                            </h4>
                                                            {video.isPlayer && (
                                                                <span className="bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.2 rounded uppercase">
                                                                    Your Song
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-red-500 font-bold text-xs md:text-sm uppercase tracking-wider truncate">
                                                            {video.artistName}
                                                        </p>
                                                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 font-mono">
                                                            <span>{video.weeksOnChart || 1} wks on TRL</span>
                                                            <span>•</span>
                                                            <span className="text-zinc-300 font-bold">{formatNumber(video.requests || 1000)} fan requests</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stats & Vote Button */}
                                                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800">
                                                    <div className="text-left md:text-right">
                                                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                                            {isYouTubeEra ? 'Total Reach' : 'TV Broadcast Views'}
                                                        </div>
                                                        <div className="font-black text-sm md:text-base text-yellow-400 font-mono">
                                                            {formatNumber((video.mtvViews || 0) + (video.views || 0))}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleVoteTRL(video.id, video.title)}
                                                        disabled={hasVoted}
                                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                                            hasVoted 
                                                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' 
                                                                : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 active:scale-95'
                                                        }`}
                                                    >
                                                        <ThumbsUp className="w-3.5 h-3.5" />
                                                        {hasVoted ? 'Voted' : 'Vote on TRL'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: SUBMIT VIDEO TO MTV (DEDICATED STUDIO SUBMISSION) */}
                {activeTab === 'submit' && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
                            <div>
                                <span className="bg-yellow-400 text-black font-black text-xs uppercase px-2.5 py-1 rounded tracking-wider inline-block mb-2">
                                    MTV Programming & Production Studio
                                </span>
                                <h2 className="text-2xl md:text-3xl font-black italic text-white">
                                    SHOOT & SUBMIT MUSIC VIDEO TO MTV
                                </h2>
                                <p className="text-zinc-400 text-sm mt-1">
                                    Commission high-end directors, choose your MTV broadcast rotation package, and submit directly to the MTV programming team for a nationwide TV broadcast premiere.
                                </p>
                            </div>

                            <form onSubmit={handleSubmitMTV} className="space-y-6">
                                {/* 1. Song Selection */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                                        1. Select Song to Shoot Video For <span className="text-red-500">*</span>
                                    </label>
                                    {eligibleSongs.length === 0 ? (
                                        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-400 text-center">
                                            No recorded songs available. Record a song first in the Studio!
                                        </div>
                                    ) : (
                                        <select 
                                            value={selectedSongId} 
                                            onChange={(e) => {
                                                setSelectedSongId(e.target.value);
                                                const song = eligibleSongs.find(s => s.id === e.target.value);
                                                if (song && activeArtist) {
                                                    setCustomTitle(`${activeArtist.name} - ${song.title} (Official Music Video)`);
                                                    if (song.coverArt) setCustomThumbnail(song.coverArt);
                                                }
                                            }}
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400"
                                            required
                                        >
                                            <option value="">-- Choose a song from your discography --</option>
                                            {eligibleSongs.map(song => (
                                                <option key={song.id} value={song.id}>
                                                    {song.title} (Quality: {song.quality}/100 • Hype: {song.hype || 0})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* 2. Director Selection */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                                        2. Select Music Video Director & Visual Style <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {DIRECTORS.map(director => {
                                            const isSelected = selectedDirectorId === director.id;
                                            return (
                                                <div 
                                                    key={director.id}
                                                    onClick={() => setSelectedDirectorId(director.id)}
                                                    className={`p-4 rounded-xl cursor-pointer border transition-all text-left space-y-2 ${
                                                        isSelected 
                                                            ? 'bg-red-950/50 border-red-500 shadow-lg shadow-red-950/40 ring-1 ring-red-500' 
                                                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-black text-sm text-white">{director.name}</h4>
                                                        <span className="text-xs font-black text-yellow-400 font-mono">
                                                            ${director.cost.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] font-bold text-red-400 uppercase tracking-wide">
                                                        {director.style}
                                                    </div>
                                                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                                                        {director.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 pt-1 text-[10px] text-zinc-500 font-mono">
                                                        <span>+{director.hypeBonus} Hype Boost</span>
                                                        <span>•</span>
                                                        <span className="text-zinc-300 font-bold">{director.budgetTier}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 3. MTV Rotation Package */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                                        3. MTV On-Air Rotation Package <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {/* Heavy */}
                                        <div 
                                            onClick={() => setSelectedRotation('heavy')}
                                            className={`p-4 rounded-xl cursor-pointer border transition-all text-left space-y-1.5 ${
                                                selectedRotation === 'heavy'
                                                    ? 'bg-yellow-400 text-black border-yellow-300 shadow-lg shadow-yellow-400/30'
                                                    : 'bg-zinc-950 text-white border-zinc-800 hover:border-zinc-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-black text-xs uppercase">Heavy Rotation</span>
                                                <span className={`text-xs font-mono font-bold ${selectedRotation === 'heavy' ? 'text-black' : 'text-yellow-400'}`}>+$40,000</span>
                                            </div>
                                            <p className={`text-[11px] ${selectedRotation === 'heavy' ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                                15+ TV plays/day • "Spankin' New" premiere banner • Prime TRL push.
                                            </p>
                                        </div>

                                        {/* Buzzworthy */}
                                        <div 
                                            onClick={() => setSelectedRotation('buzzworthy')}
                                            className={`p-4 rounded-xl cursor-pointer border transition-all text-left space-y-1.5 ${
                                                selectedRotation === 'buzzworthy'
                                                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30'
                                                    : 'bg-zinc-950 text-white border-zinc-800 hover:border-zinc-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-black text-xs uppercase">Buzzworthy</span>
                                                <span className="text-xs font-mono font-bold text-yellow-400">+$15,000</span>
                                            </div>
                                            <p className={`text-[11px] ${selectedRotation === 'buzzworthy' ? 'text-zinc-200' : 'text-zinc-400'}`}>
                                                8+ TV plays/day • Featured in Buzzworthy spotlight segments.
                                            </p>
                                        </div>

                                        {/* Medium */}
                                        <div 
                                            onClick={() => setSelectedRotation('medium')}
                                            className={`p-4 rounded-xl cursor-pointer border transition-all text-left space-y-1.5 ${
                                                selectedRotation === 'medium'
                                                    ? 'bg-zinc-700 text-white border-zinc-500'
                                                    : 'bg-zinc-950 text-white border-zinc-800 hover:border-zinc-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-black text-xs uppercase">Standard Airplay</span>
                                                <span className="text-xs font-mono font-bold text-zinc-400">Free</span>
                                            </div>
                                            <p className={`text-[11px] ${selectedRotation === 'medium' ? 'text-zinc-200' : 'text-zinc-400'}`}>
                                                Regular daytime and late-night MTV rotations.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Custom Video Title & Thumbnail */}
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                                            4. MTV Video Broadcast Title
                                        </label>
                                        <input 
                                            type="text" 
                                            value={customTitle} 
                                            onChange={(e) => setCustomTitle(e.target.value)}
                                            placeholder="e.g. Artist - Song Title (Official Music Video)"
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                                            Video Thumbnail & Broadcast Slate
                                        </label>
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            <div className="w-full sm:w-44 aspect-video rounded-xl bg-zinc-950 border border-zinc-700 overflow-hidden flex items-center justify-center relative">
                                                {customThumbnail ? (
                                                    <img src={customThumbnail} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-center p-2 text-zinc-600">
                                                        <Film className="w-6 h-6 mx-auto mb-1" />
                                                        <span className="text-[10px]">No Thumbnail</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 w-full space-y-2">
                                                <input 
                                                    type="text"
                                                    value={customThumbnail}
                                                    onChange={(e) => setCustomThumbnail(e.target.value)}
                                                    placeholder="Paste Image URL or select below..."
                                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                                                />
                                                <label className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-colors">
                                                    <Upload className="w-3.5 h-3.5" />
                                                    Upload Custom Image
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Cost & Submit Action */}
                                <div className="border-t border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <div className="text-xs text-zinc-400 font-bold uppercase">Total Production & Broadcast Budget</div>
                                        <div className="text-2xl md:text-3xl font-black text-yellow-400 font-mono">
                                            ${totalShootCost.toLocaleString()}
                                        </div>
                                        <div className="text-[11px] text-zinc-500 font-mono">
                                            Your Balance: ${(activeArtistData?.money || 0).toLocaleString()}
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={!selectedSongId || (activeArtistData?.money || 0) < totalShootCost}
                                        className={`w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all ${
                                            !selectedSongId || (activeArtistData?.money || 0) < totalShootCost
                                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                                                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 active:scale-95'
                                        }`}
                                    >
                                        <Film className="w-4 h-4" />
                                        Premiere Video on MTV
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* TAB 3: ON-AIR ROTATION SCHEDULE */}
                {activeTab === 'rotation' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <h3 className="text-xl font-black italic uppercase tracking-wider text-white flex items-center gap-2">
                                    <Radio className="w-5 h-5 text-red-500" />
                                    MTV Programming & Broadcast Rotation
                                </h3>
                                <p className="text-xs text-zinc-400">Current television broadcast line-up and power rotations across cable networks.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Heavy Rotation Card */}
                            <div className="bg-zinc-900 border border-yellow-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
                                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-yellow-400 animate-ping"></span>
                                        <h4 className="font-black text-base text-yellow-400 uppercase italic">Heavy Rotation</h4>
                                    </div>
                                    <span className="text-xs font-mono bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded font-bold">15+ Plays/Day</span>
                                </div>
                                <p className="text-xs text-zinc-400">The biggest blockbuster music videos dominating television airwaves and TRL.</p>
                                
                                <div className="space-y-2.5">
                                    {rotationSchedule.heavy.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-zinc-600">No videos in heavy rotation.</div>
                                    ) : (
                                        rotationSchedule.heavy.map((v, i) => (
                                            <div key={v.id || i} className="flex items-center gap-3 p-2 bg-zinc-950 rounded-xl border border-zinc-800/80">
                                                <img src={v.thumbnail} alt={v.title} className="w-14 aspect-video object-cover rounded-lg" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-xs text-white truncate">{v.title}</div>
                                                    <div className="text-[10px] text-red-400 uppercase font-semibold truncate">{v.artistName}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Buzzworthy Card */}
                            <div className="bg-zinc-900 border border-red-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
                                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-red-400" />
                                        <h4 className="font-black text-base text-red-500 uppercase italic">Buzzworthy</h4>
                                    </div>
                                    <span className="text-xs font-mono bg-red-600/20 text-red-300 px-2 py-0.5 rounded font-bold">8+ Plays/Day</span>
                                </div>
                                <p className="text-xs text-zinc-400">Breakthrough visionary artists and innovative music video concepts.</p>
                                
                                <div className="space-y-2.5">
                                    {rotationSchedule.buzzworthy.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-zinc-600">No videos in buzzworthy rotation.</div>
                                    ) : (
                                        rotationSchedule.buzzworthy.map((v, i) => (
                                            <div key={v.id || i} className="flex items-center gap-3 p-2 bg-zinc-950 rounded-xl border border-zinc-800/80">
                                                <img src={v.thumbnail} alt={v.title} className="w-14 aspect-video object-cover rounded-lg" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-xs text-white truncate">{v.title}</div>
                                                    <div className="text-[10px] text-red-400 uppercase font-semibold truncate">{v.artistName}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Medium & Late Night Card */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
                                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-zinc-400" />
                                        <h4 className="font-black text-base text-zinc-300 uppercase italic">MTV2 / Late Night</h4>
                                    </div>
                                    <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-bold">4+ Plays/Day</span>
                                </div>
                                <p className="text-xs text-zinc-400">Alternative, indie, and underground video airplay during late-night broadcasts.</p>
                                
                                <div className="space-y-2.5">
                                    {rotationSchedule.medium.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-zinc-600">No videos in standard rotation.</div>
                                    ) : (
                                        rotationSchedule.medium.map((v, i) => (
                                            <div key={v.id || i} className="flex items-center gap-3 p-2 bg-zinc-950 rounded-xl border border-zinc-800/80">
                                                <img src={v.thumbnail} alt={v.title} className="w-14 aspect-video object-cover rounded-lg" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-xs text-white truncate">{v.title}</div>
                                                    <div className="text-[10px] text-zinc-400 uppercase font-semibold truncate">{v.artistName}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: MY MTV PREMIERES & ARCHIVE */}
                {activeTab === 'myVideos' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <h3 className="text-xl font-black italic uppercase tracking-wider text-white flex items-center gap-2">
                                    <Award className="w-5 h-5 text-yellow-400" />
                                    My MTV Music Video Premieres
                                </h3>
                                <p className="text-xs text-zinc-400">
                                    Track cable television broadcast viewership, TRL countdown history, and YouTube migration status.
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveTab('submit')}
                                className="bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                            >
                                <Film className="w-3.5 h-3.5" />
                                Shoot New Video
                            </button>
                        </div>

                        {myMtvVideos.length === 0 ? (
                            <div className="p-16 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
                                <Tv className="w-16 h-16 text-zinc-700 mx-auto" />
                                <div className="space-y-1">
                                    <h4 className="font-black text-lg text-white">No MTV Music Videos Yet</h4>
                                    <p className="text-zinc-400 text-xs max-w-sm mx-auto">
                                        You haven't submitted any videos to MTV. Shoot a music video to premiere on Total Request Live and air nationwide!
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('submit')}
                                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all"
                                >
                                    Submit First Video to MTV
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {myMtvVideos.map(video => {
                                    return (
                                        <div 
                                            key={video.id}
                                            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
                                        >
                                            <div>
                                                {/* Thumbnail Header */}
                                                <div className="aspect-video relative bg-zinc-950">
                                                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 text-xs font-black">
                                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                        MTV PREMIERE
                                                    </div>
                                                    <div className="absolute bottom-3 right-3 bg-black/90 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-yellow-400 border border-yellow-400/20">
                                                        TRL Peak #{video.trlPeak || 1} • {video.trlWeeks || 1} wks
                                                    </div>
                                                </div>

                                                {/* Video Info */}
                                                <div className="p-5 space-y-3">
                                                    <div>
                                                        <h4 className="font-black text-lg text-white leading-tight">{video.title}</h4>
                                                        <p className="text-xs text-zinc-400 mt-1">
                                                            Directed by <span className="text-zinc-200 font-bold">{video.director || 'MTV Visionary'}</span> • {video.budgetTier || 'Music Video'}
                                                        </p>
                                                    </div>

                                                    {/* Broadcast Stats Grid */}
                                                    <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                                                        <div>
                                                            <div className="text-[10px] text-zinc-500 uppercase font-bold">TV Cable Impressions</div>
                                                            <div className="text-base font-black text-white font-mono">
                                                                {formatNumber(video.mtvViews || 0)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-zinc-500 uppercase font-bold">Rotation Status</div>
                                                            <div className="text-xs font-black text-yellow-400 uppercase">
                                                                {video.mtvRotation || 'Heavy'} Rotation
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* YouTube Migration Status Footer */}
                                            <div className="p-4 bg-zinc-950/60 border-t border-zinc-800 flex items-center justify-between text-xs">
                                                {isYouTubeEra ? (
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex items-center gap-1.5 text-green-400 font-bold">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Uploaded to MTV YouTube Channel
                                                        </div>
                                                        <span className="font-mono text-zinc-300 font-bold">
                                                            {formatNumber(video.views || 0)} YT Views
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                                                        <Tv className="w-3.5 h-3.5 text-red-500" />
                                                        Airing Exclusively on MTV Cable (Migrates to YouTube in 2008)
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Submission Success Modal */}
            {submissionSuccessModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border-2 border-yellow-400 rounded-3xl p-6 md:p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full bg-yellow-400 text-black flex items-center justify-center mx-auto shadow-lg shadow-yellow-400/40">
                            <Tv className="w-8 h-8" />
                        </div>
                        
                        <div className="space-y-2">
                            <span className="text-xs bg-red-600 text-white font-black px-2.5 py-0.5 rounded uppercase tracking-widest">
                                Official MTV Premiere Scheduled
                            </span>
                            <h3 className="text-2xl font-black italic text-white">
                                YOUR VIDEO IS AIRING ON MTV!
                            </h3>
                            <p className="text-zinc-300 text-xs md:text-sm leading-relaxed">
                                MTV's programming department has approved your music video. It has officially debuted on television rotation and the Total Request Live (TRL) countdown!
                            </p>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-left text-xs space-y-2 font-mono">
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Target Airplay:</span>
                                <span className="text-yellow-400 font-bold uppercase">{selectedRotation} Rotation</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Broadcast Network:</span>
                                <span className="text-white">MTV & MTV2 Cable</span>
                            </div>
                            {isYouTubeEra && (
                                <div className="flex justify-between text-red-400 font-bold">
                                    <span>YouTube Channel:</span>
                                    <span>Uploaded to @MTV</span>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => {
                                setSubmissionSuccessModal(false);
                                setActiveTab('countdown');
                            }}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3.5 rounded-xl uppercase tracking-wider text-xs md:text-sm shadow-xl transition-all"
                        >
                            View on TRL Countdown
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MTVView;
