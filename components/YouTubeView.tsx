

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import type { Video } from '../types';
import { SUBSCRIBER_THRESHOLD_VERIFIED, VIEWS_THRESHOLD_VERIFIED, SUBSCRIBER_THRESHOLD_STORE, LABELS } from '../constants';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import DotsVerticalIcon from './icons/DotsVerticalIcon';
import GeniusIcon from './icons/GeniusIcon';
import CameraIcon from './icons/CameraIcon';
import HomeIcon from './icons/HomeIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import YouTubeIcon from './icons/YouTubeIcon';
import ShoppingBagIcon from './icons/ShoppingBagIcon';

import { formatPremiereDateShort } from '../utils/youtubePremierePosts';

const LiveBroadcastIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <circle cx="12" cy="12" r="2.2" />
        <path d="M7.76 16.24a6 6 0 0 1 0-8.48l1.06 1.06a4.5 4.5 0 0 0 0 6.36l-1.06 1.06zm8.48 0-1.06-1.06a4.5 4.5 0 0 0 0-6.36l1.06-1.06a6 6 0 0 1 0 8.48zM4.93 19.07a10 10 0 0 1 0-14.14l1.06 1.06a8.5 8.5 0 0 0 0 12.02l-1.06 1.06zm14.14 0-1.06-1.06a8.5 8.5 0 0 0 0-12.02l1.06-1.06a10 10 0 0 1 0 14.14z" />
    </svg>
);

const NotificationBellIcon: React.FC<{ active?: boolean; className?: string }> = ({ active = true, className = 'w-5 h-5' }) => (
    active ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.17V11a6 6 0 10-12 0v3.17a2 2 0 01-.6 1.43L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    )
);

const BellSlashMiniIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20 18.69L7.84 6.14 5.27 3.49 4 4.76l2.8 2.8v.01c-.52.99-.8 2.16-.8 3.42v5l-2 2v1h13.73l2 2L21 19.72l-1-1.03zM12 22c1.11 0 2-.89 2-2h-4c0 1.11.89 2 2 2zm6-7.32V11c0-3.08-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.15.03-.29.08-.42.12-.1.03-.2.07-.3.11h-.01c-.01 0-.01 0-.02.01-.23.09-.46.2-.68.31 0 0-.01 0-.01.01L18 14.68z" />
    </svg>
);

const formatTimeAgo = (releaseDate: { week: number, year: number }, currentDate: { week: number, year: number }): string => {
    const weeksAgo = (currentDate.year * 52 + currentDate.week) - (releaseDate.year * 52 + releaseDate.week);

    if (weeksAgo <= 0) return 'Just now';
    if (weeksAgo === 1) return `1 week ago`;
    if (weeksAgo < 4) return `${weeksAgo} weeks ago`;

    if (weeksAgo < 52) {
        const monthsAgo = Math.floor(weeksAgo / 4);
        if (monthsAgo === 1) return `1 month ago`;
        return `${monthsAgo} months ago`;
    }

    const yearsAgo = Math.floor(weeksAgo / 52);
    if (yearsAgo === 1) return `1 year ago`;
    return `${yearsAgo} years ago`;
};

const VideoItem: React.FC<{
    video: Video;
    channel?: { name: string; avatar: string; isVerified?: boolean };
}> = ({ video, channel }) => {
    const { gameState, dispatch } = useGame();
    const { date } = gameState;

    const handleVideoClick = () => {
        dispatch({ type: 'SELECT_VIDEO', payload: video.id });
        dispatch({ type: 'CHANGE_VIEW', payload: 'youtubeVideoDetail' });
    };

    const handleToggleNotification = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch({
            type: 'TOGGLE_VIDEO_NOTIFICATION',
            payload: { videoId: video.id, artistId: video.artistId },
        });
    };

    const isUpcoming = Boolean(video.isScheduled);
    const isLive = Boolean(video.isLivePremiere && !video.isScheduled);
    const isNotifOn = video.notificationOn !== false;

    return (
        <div className="w-full text-left">
            <div
                role="button"
                tabIndex={0}
                onClick={handleVideoClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleVideoClick();
                    }
                }}
                className="w-full text-left cursor-pointer"
            >
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-zinc-800 relative">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    {isUpcoming && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                            <span className="bg-black/75 text-white p-1 rounded flex items-center justify-center">
                                {isNotifOn ? <NotificationBellIcon active className="w-3.5 h-3.5" /> : <BellSlashMiniIcon className="w-3.5 h-3.5" />}
                            </span>
                            <span className="bg-black/80 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded">
                                Upcoming
                            </span>
                        </div>
                    )}
                    {isLive && (
                        <div className="absolute bottom-2 right-2 bg-[#cc0000] text-white text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow">
                            <LiveBroadcastIcon className="w-3.5 h-3.5" />
                            <span>LIVE</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-3 mt-3 px-2">
                    {channel && (
                        isLive ? (
                            <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                                <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#ff0033] via-rose-500 to-pink-500">
                                    <img
                                        src={channel.avatar}
                                        alt={channel.name}
                                        className="w-9 h-9 rounded-full object-cover border-2 border-[#0f0f0f]"
                                    />
                                </div>
                                <span className="-mt-2 bg-[#cc0000] text-white text-[8px] font-extrabold px-1 rounded leading-tight tracking-wide border border-[#0f0f0f]">
                                    LIVE
                                </span>
                            </div>
                        ) : (
                            <img src={channel.avatar} alt={channel.name} className="w-9 h-9 rounded-full object-cover mt-1 flex-shrink-0" />
                        )
                    )}
                    <div className="flex-grow min-w-0">
                        <h4 className="font-semibold leading-tight line-clamp-2">{video.title}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1 flex-wrap">
                            <span>{channel?.name}</span>
                            {channel?.isVerified && (
                                <CheckCircleIcon className="w-3.5 h-3.5 text-zinc-400 inline-block flex-shrink-0" />
                            )}
                            {isUpcoming ? (
                                <span>
                                    · {formatNumber(video.waitingCount ?? 50)} waiting · Premieres {formatPremiereDateShort(video.releaseDate)}, 9:00 PM
                                </span>
                            ) : isLive ? (
                                <span>
                                    · <span className="text-zinc-300">▷{formatNumber(video.liveViewers ?? 0)} watching</span>
                                </span>
                            ) : (
                                <span>
                                    • {formatNumber(video.views)} views • {formatTimeAgo(video.releaseDate, date)}
                                </span>
                            )}
                        </p>
                    </div>
                    <DotsVerticalIcon className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                </div>
            </div>

            {isUpcoming && (
                <div className="px-2 mt-2.5">
                    <button
                        type="button"
                        onClick={handleToggleNotification}
                        className={`w-full py-2 px-4 rounded-full border text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                            isNotifOn
                                ? 'border-zinc-700 bg-transparent hover:bg-zinc-800/80 text-white'
                                : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                    >
                        <NotificationBellIcon active={isNotifOn} className="w-4 h-4" />
                        <span>{isNotifOn ? 'Notification on' : 'Notify me'}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

const YouTubeHome: React.FC = () => {
    const { gameState, allPlayerArtists } = useGame();
    const { artistsData, group, careerMode, date } = gameState;
    const [activeFilter, setActiveFilter] = useState('All');

    const channelsMap = useMemo(() => {
        const map = new Map<string, { name: string; avatar: string; isVerified?: boolean }>();
        allPlayerArtists.forEach(artist => {
            const aData = artistsData[artist.id];
            const isVer = Boolean(
                aData && (aData.youtubeSubscribers >= SUBSCRIBER_THRESHOLD_VERIFIED || aData.videos.some(v => v.views >= VIEWS_THRESHOLD_VERIFIED))
            );
            map.set(artist.id, { name: artist.name, avatar: artist.image, isVerified: isVer });
        });
        LABELS.forEach(label => {
            if (label.youtubeChannel) {
                map.set(label.id, { name: label.youtubeChannel.name, avatar: label.logo, isVerified: true });
            }
        });
        map.set('mtv', { name: 'MTV', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/MTV_Logo.svg/1200px-MTV_Logo.svg.png', isVerified: true });
        return map;
    }, [allPlayerArtists, artistsData]);

    const filters = useMemo(() => {
        const baseFilters = ['All', 'Music Videos', 'Live', 'Interviews', 'Genius', 'GRAMMYs'];
        if (careerMode === 'group' && group) {
            const memberFilters = [group.name, ...group.members.map(m => m.name)];
            return [...baseFilters, ...memberFilters];
        }
        return baseFilters;
    }, [careerMode, group]);
    
    const filteredVideos = useMemo(() => {
        let allVideos = Object.values(artistsData).flatMap(data => data.videos);
        allVideos = allVideos.filter(v => !((v.channelId === 'mtv' || v.isMtv) && date.year < 2008));
        const sortedByDate = [...allVideos].sort((a, b) => {
            const aLive = a.isLivePremiere && !a.isScheduled ? 2 : a.isScheduled ? 1 : 0;
            const bLive = b.isLivePremiere && !b.isScheduled ? 2 : b.isScheduled ? 1 : 0;
            if (aLive !== bLive) return bLive - aLive;
            return (b.releaseDate.year * 52 + b.releaseDate.week) - (a.releaseDate.year * 52 + a.releaseDate.week);
        });

        if (activeFilter === 'All') {
            return sortedByDate;
        }
        if (activeFilter === 'Music Videos') {
            return sortedByDate.filter(v => v.type === 'Music Video');
        }
        if (activeFilter === 'Live') {
            return sortedByDate.filter(v => v.isLivePremiere || v.type === 'Live Performance');
        }
        if (activeFilter === 'Interviews') {
            return sortedByDate.filter(v => v.type === 'Interview' || v.type === 'Genius Verified');
        }
        if (activeFilter === 'Genius') {
            return sortedByDate.filter(v => v.type === 'Genius Verified');
        }
        if (activeFilter === 'GRAMMYs') {
            return sortedByDate.filter(v => v.type === 'Live Performance' && v.title.toLowerCase().includes('grammys'));
        }

        const artistToFilter = allPlayerArtists.find(a => a.name === activeFilter);
        if (artistToFilter) {
            return sortedByDate.filter(v => v.artistId === artistToFilter.id && !v.isFeatureVideo);
        }
        
        return sortedByDate;
    }, [artistsData, activeFilter, allPlayerArtists, date.year]);

    return (
        <>
            <div className="sticky top-0 z-10">
                <header className="p-3 flex items-center justify-between bg-[#0f0f0f]/80 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <YouTubeIcon className="w-8 h-8 text-red-500" />
                        <h1 className="text-2xl font-bold tracking-tighter">YouTube</h1>
                    </div>
                </header>
                <div className="px-3 bg-[#0f0f0f] border-b border-white/10">
                    <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
                        {filters.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                                    activeFilter === filter
                                        ? 'bg-white text-black'
                                        : 'bg-zinc-800 hover:bg-zinc-700'
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="space-y-6 py-4">
                {filteredVideos.length > 0 ? (
                    filteredVideos.map(video => (
                        <VideoItem key={video.id} video={video} channel={channelsMap.get(video.channelId)} />
                    ))
                ) : (
                    <div className="text-center py-20 text-zinc-500">
                        <p>No videos found for this filter.</p>
                    </div>
                )}
            </div>
        </>
    );
};

const YouTubeChannelView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const { date, activeYoutubeChannel, activeArtistId, viewingPastLabelId } = gameState;
    const [filter, setFilter] = useState<'Popular' | 'Latest' | 'Oldest'>('Latest');
    const [channelTab, setChannelTab] = useState<'Videos' | 'Podcasts'>('Videos');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    if (!activeArtist || !activeArtistData) return null;
    const { youtubeSubscribers, videos, youtubeStoreUnlocked, contract } = activeArtistData;

    const isViewingPastLabel = !!viewingPastLabelId;

    const handleBack = () => {
        dispatch({ type: 'CHANGE_VIEW', payload: isViewingPastLabel ? 'labels' : 'game' });
    };

    const currentLabel = useMemo(() => contract ? LABELS.find(l => l.id === contract.labelId) : null, [contract]);
    const canSwitchToLabelChannel = currentLabel && currentLabel.youtubeChannel;
    const isLabelView = (activeYoutubeChannel === 'label' && canSwitchToLabelChannel) || isViewingPastLabel;

    const channelData = useMemo(() => {
        if (activeYoutubeChannel === 'mtv' || viewingPastLabelId === 'mtv') {
            return {
                name: 'MTV',
                handle: '@MTV',
                avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/MTV_Logo.svg/1200px-MTV_Logo.svg.png',
                banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
                subscribers: 15800000,
                isVerified: true,
                isPersonal: false,
                bio: 'The official YouTube channel for MTV. Music Television premieres, TRL classics, and music culture.',
            };
        }

        let labelToShow;
        if (isViewingPastLabel) {
            labelToShow = LABELS.find(l => l.id === viewingPastLabelId);
        } else if (activeYoutubeChannel === 'label' && canSwitchToLabelChannel) {
            labelToShow = currentLabel;
        }

        if (labelToShow && labelToShow.youtubeChannel) {
            return {
                name: labelToShow.youtubeChannel.name,
                handle: labelToShow.youtubeChannel.handle,
                avatar: labelToShow.logo,
                banner: labelToShow.youtubeChannel.banner,
                subscribers: labelToShow.youtubeChannel.subscribers,
                isVerified: true,
                isPersonal: false,
                bio: `Official YouTube for ${labelToShow.name}.`,
            }
        }
        
        return {
            name: activeArtist.name,
            handle: `@${activeArtist.name.replace(/\s/g, '').toLowerCase()}`,
            avatar: activeArtist.image,
            banner: activeArtistData.youtubeBanner || activeArtist.image,
            subscribers: youtubeSubscribers,
            isVerified: youtubeSubscribers >= SUBSCRIBER_THRESHOLD_VERIFIED || videos.some(v => v.views >= VIEWS_THRESHOLD_VERIFIED),
            isPersonal: true,
            bio: `Official YouTube channel for ${activeArtist.name}.`
        }
    }, [isViewingPastLabel, viewingPastLabelId, activeYoutubeChannel, canSwitchToLabelChannel, currentLabel, activeArtist, youtubeSubscribers, videos, activeArtistData.youtubeBanner]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && activeArtist && channelData.isPersonal) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const newImage = reader.result as string;
                dispatch({ type: 'UPDATE_ARTIST_IMAGE', payload: { artistId: activeArtist.id, newImage } });
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const triggerFileInput = () => {
        if (channelData.isPersonal) {
            fileInputRef.current?.click();
        }
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && channelData.isPersonal) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const newBanner = reader.result as string;
                dispatch({ type: 'UPDATE_YOUTUBE_BANNER', payload: { banner: newBanner } });
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const triggerBannerInput = () => {
        if (channelData.isPersonal) {
            bannerInputRef.current?.click();
        }
    };
    
    const isMtvView = activeYoutubeChannel === 'mtv' || viewingPastLabelId === 'mtv';
    const channelIdToShow = isViewingPastLabel ? viewingPastLabelId : (isMtvView ? 'mtv' : (isLabelView && contract ? contract.labelId : activeArtistId!));
    const displayedVideos = useMemo(() => {
         const filtered = videos.filter(v => {
            if (channelIdToShow === 'mtv') {
                return (v.channelId === 'mtv' || v.isMtv) && date.year >= 2008;
            }
            return v.channelId === channelIdToShow && !v.isFeatureVideo && !v.isMtv;
         });
         switch (filter) {
            case 'Popular':
                return filtered.sort((a, b) => b.views - a.views);
            case 'Latest':
                return filtered.sort((a, b) => (b.releaseDate.year * 52 + b.releaseDate.week) - (a.releaseDate.year * 52 + a.releaseDate.week));
            case 'Oldest':
                return filtered.sort((a, b) => (a.releaseDate.year * 52 + a.releaseDate.week) - (b.releaseDate.year * 52 + a.releaseDate.week));
        }
    }, [videos, filter, channelIdToShow, date.year]);

    const handleVideoClick = (videoId: string) => {
        dispatch({ type: 'SELECT_VIDEO', payload: videoId });
        dispatch({ type: 'CHANGE_VIEW', payload: 'youtubeVideoDetail' });
    };

    const handleVisitStore = () => {
        dispatch({ type: 'CHANGE_VIEW', payload: 'merchStore' });
    };

    return (
        <div className="bg-[#0f0f0f] text-white h-full overflow-y-auto pb-16">
            <header className="p-4 flex items-center gap-4 sticky top-0 bg-[#0f0f0f]/80 backdrop-blur-sm z-10 border-b border-white/10">
                <button onClick={handleBack} className="p-2 rounded-full hover:bg-white/10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">YouTube</h1>
            </header>

            <div className="relative group h-24 md:h-32 bg-zinc-700">
                <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} className="hidden" accept="image/*" />
                <button
                    onClick={triggerBannerInput}
                    disabled={!channelData.isPersonal}
                    className={`w-full h-full text-left relative block ${channelData.isPersonal ? 'cursor-pointer' : ''}`}
                    title={channelData.isPersonal ? "Click to change banner" : undefined}
                >
                    <img src={channelData.banner} alt="Banner" className="w-full h-full object-cover" />
                    {channelData.isPersonal && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium">
                            <CameraIcon className="w-6 h-6" />
                            <span>Change Banner</span>
                        </div>
                    )}
                </button>
            </div>
            
            <div className="px-4">
                <div className="flex items-end -mt-10">
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    <button onClick={triggerFileInput} className={`relative group ${channelData.isPersonal ? 'cursor-pointer' : ''}`}>
                        <img src={channelData.avatar} alt={channelData.name} className={`w-20 h-20 rounded-full border-4 border-[#0f0f0f] ${channelData.isPersonal ? 'object-cover' : 'object-contain bg-white p-1.5'}`} />
                        {channelData.isPersonal && (
                            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <CameraIcon className="w-8 h-8 text-white" />
                            </div>
                        )}
                    </button>
                </div>

                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold">{channelData.name}</h2>
                        {channelData.isVerified && <CheckCircleIcon className="w-5 h-5 text-zinc-400" />}
                    </div>
                    <div className="text-zinc-400 text-sm flex items-center gap-2">
                        <span>{channelData.handle}</span>
                        <span>•</span>
                        <span>{formatNumber(channelData.subscribers)} subscribers</span>
                        <span>•</span>
                        <span>{displayedVideos.length} videos</span>
                    </div>
                    <p className="text-zinc-400 text-sm mt-1">{channelData.bio}</p>
                </div>

                {((canSwitchToLabelChannel || (date.year >= 2008 && videos.some(v => v.isMtv || v.channelId === 'mtv'))) && !isViewingPastLabel) && (
                    <div className="mt-4 p-1 bg-zinc-800 rounded-full flex gap-1">
                        <button onClick={() => dispatch({type: 'SWITCH_YOUTUBE_CHANNEL', payload: 'artist'})} className={`flex-1 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-colors ${activeYoutubeChannel === 'artist' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}>Personal</button>
                        {canSwitchToLabelChannel && (
                            <button onClick={() => dispatch({type: 'SWITCH_YOUTUBE_CHANNEL', payload: 'label'})} className={`flex-1 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-colors ${activeYoutubeChannel === 'label' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}>Label</button>
                        )}
                        {date.year >= 2008 && videos.some(v => v.isMtv || v.channelId === 'mtv') && (
                            <button onClick={() => dispatch({type: 'SWITCH_YOUTUBE_CHANNEL', payload: 'mtv'})} className={`flex-1 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-colors ${activeYoutubeChannel === 'mtv' ? 'bg-red-600 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}>MTV</button>
                        )}
                    </div>
                )}

                <div className="mt-4 flex flex-col gap-2">
                    <button className="w-full bg-white text-black font-semibold py-2 rounded-full">Subscribe</button>
                    {channelData.isPersonal && (
                        <>
                        <button onClick={handleVisitStore} className="w-full font-semibold py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer transition-colors flex items-center justify-center gap-2">
                            <ShoppingBagIcon className="w-4 h-4" />
                            <span>Visit Official Store</span>
                        </button>
                         <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'youtubeStudio' })} className="w-full font-semibold py-2 rounded-full bg-zinc-800 hover:bg-zinc-700">
                            YouTube Studio
                        </button>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-4 border-y border-white/10">
                 
                 <div className="flex gap-4 px-4 overflow-x-auto">
                    <button className="py-3 text-sm font-semibold text-zinc-400">Home</button>
                    <button onClick={() => setChannelTab('Videos')} className={`py-3 text-sm font-semibold ${channelTab === 'Videos' ? 'border-b-2 border-white text-white' : 'text-zinc-400'}`}>Videos</button>
                    <button className="py-3 text-sm font-semibold text-zinc-400">Shorts</button>
                    <button className="py-3 text-sm font-semibold text-zinc-400">Live</button>
                    <button className="py-3 text-sm font-semibold text-zinc-400">Releases</button>
                    {(gameState.podcasts || []).filter(p => p.host === channelData.name).length > 0 && (
                        <button onClick={() => setChannelTab('Podcasts')} className={`py-3 text-sm font-semibold ${channelTab === 'Podcasts' ? 'border-b-2 border-white text-white' : 'text-zinc-400'}`}>Podcasts</button>
                    )}
                </div>
             
            </div>
            
            <main className="p-4 space-y-4">
                {channelTab === 'Podcasts' ? (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">Podcasts</h3>
                        {(gameState.podcasts || []).filter(p => p.host === channelData.name).map(podcast => (
                            <div key={podcast.id} className="flex gap-3 bg-zinc-800/50 p-2 rounded-lg cursor-pointer hover:bg-zinc-800 transition" onClick={() => {
                                dispatch({ type: 'UPDATE_GAME_STATE', payload: { currentView: 'spotifyPodcasts' } });
                                // We also need to set selected podcast, maybe it's better to just open it via spotifyPodcasts?
                            }}>
                                <img src={podcast.coverArt || channelData.avatar} className="w-32 h-32 rounded-lg object-cover flex-shrink-0" />
                                <div className="flex flex-col py-1">
                                    <h4 className="font-bold text-xl leading-tight line-clamp-2">{podcast.name}</h4>
                                    <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{podcast.description}</p>
                                    <p className="text-xs text-zinc-500 mt-auto">{podcast.episodes.length} episodes</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (<>
                
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">Videos</h3>
                    <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'createVideo'})} className="bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                        Create Video
                    </button>
                </div>
                <div className="flex gap-2">
                    {(['Latest', 'Popular', 'Oldest'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-sm rounded-lg ${filter === f ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
                            {f}
                        </button>
                    ))}
                </div>

                {displayedVideos.length > 0 ? (
                    <div className="space-y-4">
                        {displayedVideos.map(video => {
                            const isUpcoming = Boolean(video.isScheduled);
                            const isLive = Boolean(video.isLivePremiere && !video.isScheduled);
                            return (
                                <button key={video.id} onClick={() => handleVideoClick(video.id)} className="w-full text-left flex gap-3 group">
                                    <div className="w-1/3 aspect-video rounded-lg overflow-hidden relative group-hover:opacity-80 transition-opacity bg-zinc-800 flex-shrink-0">
                                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                        {isUpcoming && (
                                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                                Upcoming
                                            </span>
                                        )}
                                        {isLive && (
                                            <span className="absolute bottom-1 right-1 bg-[#cc0000] text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                <LiveBroadcastIcon className="w-3 h-3" />
                                                <span>LIVE</span>
                                            </span>
                                        )}
                                        {!isUpcoming && !isLive && video.type === 'Genius Verified' && (
                                            <div className="absolute bottom-1 right-1 bg-yellow-300 p-0.5 rounded-sm">
                                                <GeniusIcon className="w-4 h-4 text-black" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow w-2/3 min-w-0">
                                        <h4 className="font-semibold leading-tight line-clamp-2">{video.title}</h4>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            {isUpcoming
                                                ? `${formatNumber(video.waitingCount ?? 50)} waiting · Premieres ${formatPremiereDateShort(video.releaseDate)}, 9:00 PM`
                                                : isLive
                                                    ? `▷${formatNumber(video.liveViewers ?? 0)} watching`
                                                    : `${formatNumber(video.views)} views • ${formatTimeAgo(video.releaseDate, date)}`}
                                        </p>
                                    </div>
                                    <div className="self-start">
                                        <DotsVerticalIcon className="w-5 h-5 text-zinc-400"/>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-zinc-800 rounded-lg">
                        <p className="text-zinc-400">No videos yet.</p>
                        <p className="text-zinc-500 text-sm">Create your first video to build your channel!</p>
                    </div>
                )}
            </>)}</main>
        </div>
    );
};

const YouTubeBottomNav: React.FC<{ activeTab: 'home' | 'channels'; onTabChange: (tab: 'home' | 'channels') => void }> = ({ activeTab, onTabChange }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-zinc-800 flex justify-around items-center z-30">
            <button onClick={() => onTabChange('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-white' : 'text-zinc-400'}`}>
                <HomeIcon className="w-6 h-6" />
                <span className="text-xs">Home</span>
            </button>
            <button onClick={() => onTabChange('channels')} className={`flex flex-col items-center gap-1 ${activeTab === 'channels' ? 'text-white' : 'text-zinc-400'}`}>
                <UserGroupIcon className="w-6 h-6" />
                <span className="text-xs">Channels</span>
            </button>
        </nav>
    );
};

const YouTubeView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'home' | 'channels'>('home');

    return (
        <div className="bg-[#0f0f0f] text-white h-full overflow-y-auto">
            <div className="pb-16"> {/* Padding for bottom nav */}
                {activeTab === 'home' ? <YouTubeHome /> : <YouTubeChannelView />}
            </div>
            <YouTubeBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
};

export default YouTubeView;
