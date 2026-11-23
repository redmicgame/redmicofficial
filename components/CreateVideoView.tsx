

import React, { useState, useMemo, useEffect } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { storeUploadedImageInVault } from '../db/db';
import { VIDEO_COSTS, NPC_ARTIST_NAMES, LABELS } from '../constants';
import { calculateYouTubeViews, calculateYouTubeLikes, getYouTubeEngagementPerformance, calculatePremiereLiveViewers, calculatePremiereWaitingCount } from '../utils/youtubeViews';
import { formatPremiereDateShort } from '../utils/youtubePremierePosts';
import type { Video } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

const CreateVideoView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const { date, activeYoutubeChannel, activeArtistId } = gameState;

    const [songId, setSongId] = useState('');
    const [videoType, setVideoType] = useState<'Music Video' | 'Lyric Video' | 'Visualizer' | 'Custom'>('Visualizer');
    const [customTitle, setCustomTitle] = useState('');
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledWeeks, setScheduledWeeks] = useState(1);
    const [isInstantPremiere, setIsInstantPremiere] = useState(false);
    const [isScheduledPremiere, setIsScheduledPremiere] = useState(true);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    if (!activeArtistData || !activeArtist || !activeArtistId) return null;
    const { money, songs, videos, contract } = activeArtistData;

    const cost = VIDEO_COSTS[videoType as keyof typeof VIDEO_COSTS];

    const label = contract ? LABELS.find(l => l.id === contract.labelId) : null;
    const hasLabelChannel = label && label.youtubeChannel;
    const isLabelMode = activeYoutubeChannel === 'label' && hasLabelChannel;

    const availableVideoTypes = useMemo(() => {
        const allTypes = Object.keys(VIDEO_COSTS) as Array<keyof typeof VIDEO_COSTS>;
        if (isLabelMode) {
            return allTypes.filter(t => t !== 'Custom');
        }
        return allTypes;
    }, [isLabelMode]);
    
    useEffect(() => {
        // If user switches to label mode while 'Custom' is selected, reset it.
        if(isLabelMode && videoType === 'Custom') {
            setVideoType('Visualizer');
        }
    }, [isLabelMode, videoType]);

    const availableSongs = useMemo(() => {
        const songsWithVideosOfType = new Set(
            videos.filter(v => v.type === videoType).map(v => v.songId)
        );
        if (videoType === 'Custom') {
            return songs.filter(s => s.isReleased);
        }
        return songs.filter(s => s.isReleased && !songsWithVideosOfType.has(s.id));
    }, [songs, videos, videoType]);
    
    useEffect(() => {
        const selectedSong = songs.find(s => s.id === songId);
        if (selectedSong) {
            setThumbnail(selectedSong.coverArt);
             if (videoType === 'Custom') {
                setCustomTitle(`${selectedSong.title} (Official Video)`);
            }
        } else {
            setThumbnail(null);
            setCustomTitle('');
        }
    }, [songId, songs, videoType]);

    const selectedSong = useMemo(() => songs.find(s => s.id === songId), [songs, songId]);

    const estimatedFirstWeek = useMemo(() => {
        if (!selectedSong) return null;
        const songGenre = selectedSong.genre || activeArtistData.genre || activeArtist.genre || 'Pop';
        const songSubgenre = selectedSong.subgenre || '';
        return calculateYouTubeViews({
            subscribers: activeArtistData.youtubeSubscribers || 0,
            popularity: activeArtistData.popularity || 10,
            isFirstWeek: true,
            videoAgeWeeks: 1,
            genre: songGenre,
            subgenre: songSubgenre,
            artistGenre: activeArtistData.genre || activeArtist.genre || '',
            year: date.year,
            videoType: videoType,
            songQuality: selectedSong.quality || 70,
            songHype: selectedSong.hype || 50,
            difficulty: gameState.difficultyMode,
            applyVariance: false,
        });
    }, [selectedSong, activeArtistData, activeArtist, date.year, videoType, gameState.difficultyMode]);

    const scheduledReleaseDate = useMemo(() => {
        const rawWeek = date.week + scheduledWeeks;
        const week = ((rawWeek - 1) % 52) + 1;
        const year = date.year + Math.floor((rawWeek - 1) / 52);
        return { week, year, day: 5 };
    }, [date.week, date.year, scheduledWeeks]);

    const futureWeekOptions = useMemo(() => {
        return Array.from({ length: 26 }, (_, idx) => {
            const offset = idx + 1;
            const rawWeek = date.week + offset;
            const week = ((rawWeek - 1) % 52) + 1;
            const year = date.year + Math.floor((rawWeek - 1) / 52);
            const target = { week, year, day: 5 };
            return {
                offset,
                week,
                year,
                label: `In ${offset} ${offset === 1 ? 'Week' : 'Weeks'} — ${year} W${week} (${formatPremiereDateShort(target)})`,
            };
        });
    }, [date.week, date.year]);

    const estLivePremiereViewers = useMemo(() => {
        if (estimatedFirstWeek === null) return null;
        return calculatePremiereLiveViewers(estimatedFirstWeek, activeArtistData.popularity || 10);
    }, [estimatedFirstWeek, activeArtistData.popularity]);

    const isKPopSong = Boolean(selectedSong && (
        /k-?pop/i.test(selectedSong.genre || '') ||
        /k-?pop/i.test(selectedSong.subgenre || '') ||
        /k-?pop/i.test(activeArtistData.genre || '') ||
        /k-?pop/i.test(activeArtist.genre || '')
    ));

    const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            storeUploadedImageInVault(file, { maxWidth: 1280, maxHeight: 720 })
                .then(setThumbnail)
                .catch(() => {});
        }
    };
    
    const handleCreateVideo = () => {
        setError('');
        if (!songId) {
            setError('Please select a song.');
            return;
        }
        if (videoType === 'Custom' && !customTitle.trim()) {
            setError('A custom title is required for this video type.');
            return;
        }
        if (money < cost) {
            setError("You don't have enough money to create this video.");
            return;
        }
        
        const selectedSong = songs.find(s => s.id === songId);
        if (!selectedSong) {
             setError('Selected song not found.');
             return;
        }

        if (!thumbnail) {
            setError('A thumbnail is required for the video.');
            return;
        }
        
        let artistsForTitle = activeArtist.name;
        let songForTitle = selectedSong.title;
        if (selectedSong.features && selectedSong.features.length > 0) {
            artistsForTitle = `${activeArtist.name}, ${selectedSong.features.join(", ")}`;
            songForTitle = songForTitle.replace(/ \\(feat\\. [^)]+\\)/g, "");
        } else if (selectedSong.collaboration) {
            artistsForTitle = `${activeArtist.name}, ${selectedSong.collaboration.artistName}`;
            songForTitle = songForTitle.replace(/ \\(feat\\. [^)]+\\)/g, "");
        }
        const baseTitle = videoType === 'Custom' ? customTitle.trim() : `${songForTitle} (${videoType})`;
        const title = `${artistsForTitle} - ${baseTitle}`;
        
        const contract = activeArtistData.contract;
        const label = contract && !contract.isCustom ? LABELS.find(l => l.id === contract.labelId) : null;
        const hasLabelChannel = label && label.youtubeChannel;
        
        const channelId = activeYoutubeChannel === 'label' && hasLabelChannel
            ? contract!.labelId 
            : activeArtistId;

        const fullText = title + ' ' + description;
        const mentionedNpcs = NPC_ARTIST_NAMES.filter(name => 
            new RegExp(`\\b${name}\\b`, 'i').test(fullText)
        );

        const effectiveReleaseDate = isScheduled ? scheduledReleaseDate : date;
        const isPremiere = isScheduled ? isScheduledPremiere : isInstantPremiere;
        const computedLiveViewers =
            estLivePremiereViewers ??
            calculatePremiereLiveViewers(estimatedFirstWeek || 0, activeArtistData.popularity || 10);
        const waitingCount = isScheduled
            ? calculatePremiereWaitingCount(computedLiveViewers, activeArtistData.popularity || 10)
            : undefined;

        const newVideo: Video = {
            id: crypto.randomUUID(),
            songId: selectedSong.id,
            title,
            type: videoType,
            views: 0,
            likes: 0,
            thumbnail: thumbnail,
            releaseDate: effectiveReleaseDate,
            isScheduled: isScheduled,
            isPremiere: isPremiere,
            isLivePremiere: !isScheduled && isPremiere,
            liveViewers: !isScheduled && isPremiere ? computedLiveViewers : undefined,
            premierePeakViewers: !isScheduled && isPremiere ? computedLiveViewers : undefined,
            waitingCount,
            notificationOn: isScheduled ? true : undefined,
            artistId: activeArtist.id,
            channelId: channelId,
            description,
            mentionedNpcs,
        };

        dispatch({ type: 'CREATE_VIDEO', payload: { video: newVideo, cost } });
        dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
    };
    
    return (
        <div className="h-full w-full bg-zinc-900 overflow-y-auto">
            <header className="p-4 flex items-center gap-4 sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10 border-b border-zinc-700/50">
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="p-2 rounded-full hover:bg-white/10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">Create Video</h1>
            </header>
            <div className="p-4 space-y-6">
                <div className="flex justify-center">
                    <label htmlFor="thumbnail-upload" className="cursor-pointer w-full">
                        <div className="w-full aspect-video rounded-lg bg-zinc-800 border-2 border-dashed border-zinc-600 flex items-center justify-center hover:border-red-500 transition-colors">
                            {thumbnail ? (
                                <img src={thumbnail} alt="Video Thumbnail" className="w-full h-full rounded-lg object-cover" />
                            ) : (
                                <span className="text-zinc-400 text-sm text-center p-4">Select a song to see the default thumbnail, or click to upload a custom one.</span>
                            )}
                        </div>
                    </label>
                    <input id="thumbnail-upload" type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Video Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableVideoTypes.map(type => (
                            <button key={type} onClick={() => { setVideoType(type); setSongId(''); }} className={`p-3 rounded-lg text-left transition-all border-2 ${videoType === type ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'}`}>
                                <p className="font-bold">{type}</p>
                                <p className="text-sm text-green-400">-${VIDEO_COSTS[type].toLocaleString()}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {videoType === 'Custom' && (
                    <div>
                        <label htmlFor="custom-title" className="block text-sm font-medium text-zinc-300">Custom Title</label>
                        <input type="text" id="custom-title" value={customTitle} onChange={e => setCustomTitle(e.target.value)} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm h-10 px-3"/>
                    </div>
                )}

                <div>
                    <label htmlFor="song-select" className="block text-sm font-medium text-zinc-300">Select Song</label>
                    <select id="song-select" value={songId} onChange={e => setSongId(e.target.value)} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-12 px-3">
                        <option value="">-- Choose a song --</option>
                        {availableSongs.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                     {availableSongs.length === 0 && <p className="text-xs text-zinc-400 mt-2">No available songs for this video type. Release more music or choose a different video type.</p>}
                </div>

                 <div>
                    <label htmlFor="video-description" className="block text-sm font-medium text-zinc-300">Description</label>
                    <textarea
                        id="video-description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm p-3 focus:ring-red-500 focus:border-red-500"
                        placeholder="Tell viewers about your video..."
                    />
                </div>

                {/* Release Timing & Premiere Options */}
                <div className="bg-zinc-800/80 border border-zinc-700/80 rounded-xl p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-zinc-200 mb-2">Release Timing & Premiere</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setIsScheduled(false)}
                                className={`p-3 rounded-lg text-left border-2 transition-all ${!isScheduled ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-600'}`}
                            >
                                <p className="font-bold text-sm text-white">Release Now</p>
                                <p className="text-xs text-zinc-400">Publish immediately ({date.year} W{date.week})</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsScheduled(true)}
                                className={`p-3 rounded-lg text-left border-2 transition-all ${isScheduled ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-600'}`}
                            >
                                <p className="font-bold text-sm text-white">Schedule Video</p>
                                <p className="text-xs text-zinc-400">Pick a future week & build hype</p>
                            </button>
                        </div>
                    </div>

                    {isScheduled ? (
                        <div className="space-y-3 pt-2 border-t border-zinc-700/70">
                            <div>
                                <label htmlFor="schedule-week-select" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                                    Select Premiere Week
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setScheduledWeeks(w => Math.max(1, w - 1))}
                                        className="px-3 h-11 rounded-lg bg-zinc-700 hover:bg-zinc-600 font-bold text-white"
                                        aria-label="Decrease weeks"
                                    >
                                        -
                                    </button>
                                    <select
                                        id="schedule-week-select"
                                        value={scheduledWeeks}
                                        onChange={e => setScheduledWeeks(Number(e.target.value))}
                                        className="flex-1 bg-zinc-700 border-zinc-600 rounded-lg h-11 px-3 text-sm text-white focus:ring-red-500 focus:border-red-500"
                                    >
                                        {futureWeekOptions.map(opt => (
                                            <option key={opt.offset} value={opt.offset}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setScheduledWeeks(w => Math.min(52, w + 1))}
                                        className="px-3 h-11 rounded-lg bg-zinc-700 hover:bg-zinc-600 font-bold text-white"
                                        aria-label="Increase weeks"
                                    >
                                        +
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1.5">
                                    Scheduled for <span className="text-white font-semibold">{scheduledReleaseDate.year} Week {scheduledReleaseDate.week}</span> ({formatPremiereDateShort(scheduledReleaseDate)}, 9:00 PM)
                                </p>
                            </div>

                            <label className="flex items-center justify-between gap-3 bg-zinc-900/70 p-3 rounded-lg border border-zinc-700/60 cursor-pointer">
                                <div>
                                    <p className="text-sm font-semibold text-white">Launch as Live Premiere on Release</p>
                                    <p className="text-xs text-zinc-400">Shows Upcoming countdown now & goes LIVE when it drops</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isScheduledPremiere}
                                    onChange={e => setIsScheduledPremiere(e.target.checked)}
                                    className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                                />
                            </label>
                        </div>
                    ) : (
                        <label className="flex items-center justify-between gap-3 bg-zinc-900/70 p-3 rounded-lg border border-zinc-700/60 cursor-pointer">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-white">Set as Instant Premiere</p>
                                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-600 text-white">LIVE</span>
                                </div>
                                <p className="text-xs text-zinc-400">Premiere live immediately with real-time concurrent viewers instead of 0 views</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={isInstantPremiere}
                                onChange={e => setIsInstantPremiere(e.target.checked)}
                                className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                            />
                        </label>
                    )}
                </div>

                <div className="bg-zinc-800 p-4 rounded-lg space-y-3">
                    <h3 className="font-bold text-lg">Summary & Reach Projections</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="text-zinc-400">Video Type:</p><p className="font-medium text-white">{videoType}</p>
                        <p className="text-zinc-400">Song:</p><p className="font-medium text-white">{selectedSong?.title || 'N/A'}</p>
                        <p className="text-zinc-400">Song Genre:</p>
                        <p className="font-medium text-white flex items-center gap-1.5">
                            {selectedSong?.genre || activeArtist.genre || 'Pop'}
                            {isKPopSong && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    K-Pop Debut Boost 🔥
                                </span>
                            )}
                        </p>
                        <p className="text-zinc-400">Subscribers Reach:</p>
                        <p className="font-medium text-white">{formatNumber(activeArtistData.youtubeSubscribers || 0)} subscribers</p>
                        <p className="text-zinc-400">Artist Popularity:</p>
                        <p className="font-medium text-white">{activeArtistData.popularity}/100</p>
                        {estimatedFirstWeek !== null && (
                            <>
                                <p className="text-zinc-400 font-medium">Est. 1st Week Views:</p>
                                <p className="text-purple-400 font-bold text-base">
                                    ~{formatNumber(estimatedFirstWeek)} views
                                </p>
                                {(isScheduled ? isScheduledPremiere : isInstantPremiere) && estLivePremiereViewers !== null && (
                                    <>
                                        <p className="text-zinc-400 font-medium">Est. Live Watching Now:</p>
                                        <p className="text-red-400 font-bold text-base">
                                            ~{formatNumber(estLivePremiereViewers)} watching
                                        </p>
                                    </>
                                )}
                                {(() => {
                                    const hype = selectedSong?.hype ?? activeArtistData.hype ?? 50;
                                    const estLikes = calculateYouTubeLikes(estimatedFirstWeek, hype);
                                    const engagement = getYouTubeEngagementPerformance(hype);
                                    return (
                                        <>
                                            <p className="text-zinc-400 font-medium">Est. 1st Week Likes:</p>
                                            <p className="text-pink-400 font-bold text-base">
                                                ~{formatNumber(estLikes)} likes ({engagement.ratioPercent} • {engagement.tier.split(' ')[0]})
                                            </p>
                                        </>
                                    );
                                })()}
                            </>
                        )}
                        <p className="text-zinc-400">Cost:</p><p className="text-red-400 font-medium">-${cost.toLocaleString()}</p>
                        <p className="text-zinc-400">Your Money:</p><p className="text-green-400 font-medium">${money.toLocaleString()}</p>
                    </div>
                </div>


                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                
                <button onClick={handleCreateVideo} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-red-600/20 disabled:bg-zinc-600 disabled:shadow-none" disabled={money < cost || !songId}>
                    {isScheduled
                        ? (isScheduledPremiere ? `Schedule Premiere (${scheduledReleaseDate.year} W${scheduledReleaseDate.week})` : `Schedule Video (${scheduledReleaseDate.year} W${scheduledReleaseDate.week})`)
                        : isInstantPremiere
                            ? 'Launch Instant Premiere'
                            : 'Shoot Video'}
                </button>
            </div>
        </div>
    );
};

export default CreateVideoView;