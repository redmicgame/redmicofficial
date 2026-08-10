
import React, { useState, useMemo, useRef } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { VIEW_INCOME_MULTIPLIER } from '../constants';
import { Video } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import ThumbUpIcon from './icons/ThumbUpIcon';
import CommentIcon from './icons/CommentIcon';
import SearchIcon from './icons/SearchIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import XMarkIcon from './icons/XMarkIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

type StudioTab = 'Dashboard' | 'Videos' | 'Earn';

const YouTubeStudioView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const { date } = gameState;
    const [activeTab, setActiveTab] = useState<StudioTab>('Dashboard');

    // Search and filter state for Videos tab
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');

    // Video editing state
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editThumbnail, setEditThumbnail] = useState('');
    const [showSavedToast, setShowSavedToast] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    if (!activeArtist || !activeArtistData) return null;
    const { youtubeSubscribers, videos, lastFourWeeksViews, youtubePartnerProgram } = activeArtistData;

    const yppActive = Boolean(youtubePartnerProgram?.isActive);

    const last28DaysViews = useMemo(() => {
        return lastFourWeeksViews.reduce((sum, weeklyViews) => sum + weeklyViews, 0);
    }, [lastFourWeeksViews]);

    const last28DaysRevenue = useMemo(() => {
        return last28DaysViews * VIEW_INCOME_MULTIPLIER;
    }, [last28DaysViews]);
    
    const latestVideos = useMemo(() => {
        return [...videos]
            .filter(v => !v.isFeatureVideo)
            .sort((a, b) => (b.releaseDate.year * 52 + b.releaseDate.week) - (a.releaseDate.year * 52 + a.releaseDate.week))
            .slice(0, 5);
    }, [videos]);

    const allChannelVideos = useMemo(() => {
        return [...videos]
            .filter(v => !v.isFeatureVideo)
            .sort((a, b) => (b.releaseDate.year * 52 + b.releaseDate.week) - (a.releaseDate.year * 52 + a.releaseDate.week));
    }, [videos]);

    const filteredVideos = useMemo(() => {
        return allChannelVideos.filter(v => {
            const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'All' || v.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [allChannelVideos, searchQuery, typeFilter]);

    const videoTypes = useMemo(() => {
        const types = new Set(allChannelVideos.map(v => v.type));
        return ['All', ...Array.from(types)];
    }, [allChannelVideos]);

    const weeksAgo = (releaseDate: { week: number, year: number }): number => {
        return (date.year * 52 + date.week) - (releaseDate.year * 52 + releaseDate.week);
    }

    const publicViewsLast12Months = useMemo(() => {
        const limitYear = date.week > 52 ? date.year : date.year - 1;
        const limitWeek = date.week > 52 ? date.week - 52 : 52 - (52 - date.week);
        return [...videos].filter(v => !v.isFeatureVideo && ((v.releaseDate.year === date.year && v.releaseDate.week <= date.week) || (v.releaseDate.year === limitYear && v.releaseDate.week > limitWeek))).reduce((sum, v) => sum + v.views, 0);
    }, [videos, date]);

    const reqSubscribers = youtubeSubscribers >= 1000;
    const reqViews = publicViewsLast12Months >= 100000;
    const canJoinYPP = reqSubscribers && reqViews;

    const handleApplyYPP = () => {
        dispatch({ type: 'APPLY_YOUTUBE_PARTNER' });
    }

    const openEditModal = (video: Video) => {
        setEditingVideo(video);
        setEditTitle(video.title);
        setEditThumbnail(video.thumbnail);
        setShowSavedToast(false);
    };

    const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setEditThumbnail(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveVideo = () => {
        if (!editingVideo) return;
        const updatedTitle = editTitle.trim() || editingVideo.title;
        const updatedThumbnail = editThumbnail || editingVideo.thumbnail;

        dispatch({
            type: 'UPDATE_VIDEO',
            payload: {
                id: editingVideo.id,
                updates: {
                    title: updatedTitle,
                    thumbnail: updatedThumbnail,
                }
            }
        });

        // Update local modal state
        setEditingVideo(prev => prev ? { ...prev, title: updatedTitle, thumbnail: updatedThumbnail } : null);
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 2500);
    };

    return (
        <div className="bg-[#0f0f0f] text-white h-full overflow-y-auto pb-16">
             <header className="p-4 flex flex-col gap-2 sticky top-0 bg-[#0f0f0f]/95 backdrop-blur-sm z-10 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'youtube'})} className="p-2 rounded-full hover:bg-white/10">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold">Studio</h1>
                </div>
                <div className="flex gap-6 border-b border-white/20 mt-2">
                    <button 
                        onClick={() => setActiveTab('Dashboard')}
                        className={`pb-2 text-sm font-semibold border-b-2 ${activeTab === 'Dashboard' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}
                    >
                        Dashboard
                    </button>
                    <button 
                        onClick={() => setActiveTab('Videos')}
                        className={`pb-2 text-sm font-semibold border-b-2 ${activeTab === 'Videos' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}
                    >
                        Videos ({allChannelVideos.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('Earn')}
                        className={`pb-2 text-sm font-semibold border-b-2 ${activeTab === 'Earn' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}
                    >
                        Earn
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-6">
                {activeTab === 'Dashboard' && (
                    <>
                        <div className="flex items-center gap-4">
                            <img src={activeArtist.image} alt={activeArtist.name} className="w-16 h-16 rounded-full object-cover"/>
                            <div>
                                <h2 className="text-xl font-bold">{activeArtist.name}</h2>
                                <p className="text-sm text-zinc-400">{formatNumber(youtubeSubscribers)} Total subscribers</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold">Channel analytics</h3>
                                <p className="text-xs text-zinc-400">Last 28 days</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#282828] p-4 rounded-lg">
                                    <p className="text-sm text-zinc-400">Views</p>
                                    <p className="text-2xl font-bold">{formatNumber(last28DaysViews)}</p>
                                </div>
                                <div className="bg-[#282828] p-4 rounded-lg">
                                    <p className="text-sm text-zinc-400">Revenue</p>
                                    <p className="text-2xl font-bold">${formatNumber(last28DaysRevenue)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold">Latest published content</h3>
                            <div className="space-y-3">
                                {latestVideos.map(video => {
                                    const likes = Math.floor(video.views * 0.2);
                                    const comments = Math.floor(video.views / (Math.random() * 500 + 400));
                                    const weeksSinceRelease = weeksAgo(video.releaseDate);

                                    return (
                                        <div key={video.id} onClick={() => openEditModal(video)} className="bg-[#282828] p-3 rounded-lg space-y-2 cursor-pointer hover:bg-[#333] transition-colors">
                                            <div className="flex gap-3">
                                                <img src={video.thumbnail} alt={video.title} className="w-24 aspect-video rounded-md object-cover"/>
                                                <div className="flex-grow">
                                                    <p className="font-semibold line-clamp-2 text-sm">{video.title}</p>
                                                    <p className="text-xs text-zinc-400">First {weeksSinceRelease * 7} days</p>
                                                </div>
                                            </div>
                                            <div className="border-t border-white/10 pt-2 flex justify-around items-center text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <ChartBarIcon className="w-4 h-4 text-zinc-400" />
                                                    <span>{formatNumber(video.views)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <ThumbUpIcon className="w-4 h-4 text-zinc-400" />
                                                    <span>{formatNumber(likes)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <CommentIcon className="w-4 h-4 text-zinc-400" />
                                                    <span>{formatNumber(comments)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'Videos' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                            <div className="relative flex-grow">
                                <SearchIcon className="w-5 h-5 absolute left-3 top-2.5 text-zinc-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search videos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#282828] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-500"
                                />
                            </div>
                            
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {videoTypes.map(type => (
                                    <button 
                                        key={type}
                                        onClick={() => setTypeFilter(type)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${typeFilter === type ? 'bg-white text-black' : 'bg-[#282828] text-zinc-300 hover:bg-[#383838]'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredVideos.length === 0 ? (
                            <div className="bg-[#282828] p-8 rounded-xl text-center space-y-2">
                                <p className="text-lg font-bold text-zinc-300">No videos found</p>
                                <p className="text-xs text-zinc-500">Try adjusting your search or category filter.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredVideos.map(video => {
                                    const lastWeekViews = video.lastWeekViews || 0;
                                    const lastWeekMoney = yppActive ? lastWeekViews * VIEW_INCOME_MULTIPLIER : 0;

                                    return (
                                        <div 
                                            key={video.id} 
                                            onClick={() => openEditModal(video)}
                                            className="bg-[#282828] hover:bg-[#333] transition-colors p-3.5 rounded-xl flex flex-col sm:flex-row gap-4 items-start sm:items-center cursor-pointer border border-white/5"
                                        >
                                            <div className="relative w-full sm:w-36 aspect-video shrink-0 rounded-lg overflow-hidden bg-black/40">
                                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                                <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1.5 py-0.5 rounded text-white font-medium">
                                                    {video.type}
                                                </span>
                                            </div>

                                            <div className="flex-grow space-y-1.5 w-full">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h3 className="font-bold text-sm text-white line-clamp-2">{video.title}</h3>
                                                    <span className="text-xs text-red-400 font-semibold shrink-0 hover:underline">
                                                        Edit
                                                    </span>
                                                </div>

                                                <p className="text-xs text-zinc-400">
                                                    Released Y{video.releaseDate.year} W{video.releaseDate.week} ({weeksAgo(video.releaseDate)} weeks ago)
                                                </p>

                                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs">
                                                    <div>
                                                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Total Views</p>
                                                        <p className="font-bold text-zinc-100">{formatNumber(video.views)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Last Week Views</p>
                                                        <p className="font-bold text-sky-400">+{formatNumber(lastWeekViews)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Last Week Revenue</p>
                                                        {yppActive ? (
                                                            <p className="font-bold text-green-400">${formatNumber(lastWeekMoney)}</p>
                                                        ) : (
                                                            <p className="font-bold text-zinc-500">$0.00 <span className="text-[9px] font-normal text-zinc-500">(Not Monetized)</span></p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Earn' && (
                    <div className="space-y-6">
                        {yppActive ? (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-center mt-4">You're a YouTube Partner!</h2>
                                <p className="text-zinc-400 text-center">You are eligible to earn money from your videos.</p>
                                <div className="bg-[#282828] p-4 rounded-xl mt-6">
                                    <p className="text-zinc-400 text-sm">Lifetime YPP Earnings</p>
                                    <p className="text-3xl font-bold text-green-400 mt-1">${formatNumber(youtubePartnerProgram?.lifetimeEarnings || 0)}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="text-center space-y-2 mt-4">
                                    <h2 className="text-2xl font-bold">Grow with YouTube</h2>
                                    <p className="text-zinc-400 text-sm px-4">
                                        As a YouTube partner, you'll be eligible to earn money from your videos, get creator support, and more.
                                    </p>
                                </div>

                                <div className="bg-[#282828] p-5 rounded-xl space-y-6">
                                    <h3 className="font-bold">Eligibility requirements</h3>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <div>
                                                    <p className="text-sm font-semibold">{formatNumber(youtubeSubscribers)} subscribers</p>
                                                    <p className="text-xs text-zinc-400">1,000 required</p>
                                                </div>
                                                {reqSubscribers && <span className="text-[#3ea6ff] text-xs font-bold">Met</span>}
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                <div className="bg-[#3ea6ff] h-2 rounded-full" style={{ width: `${Math.min(100, (youtubeSubscribers / 1000) * 100)}%` }}></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <div>
                                                    <p className="text-sm font-semibold">{formatNumber(publicViewsLast12Months)} public views</p>
                                                    <p className="text-xs text-zinc-400">100K required (last 12 months)</p>
                                                </div>
                                                {reqViews && <span className="text-[#3ea6ff] text-xs font-bold">Met</span>}
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                <div className="bg-[#3ea6ff] h-2 rounded-full" style={{ width: `${Math.min(100, (publicViewsLast12Months / 100000) * 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleApplyYPP}
                                        disabled={!canJoinYPP}
                                        className={`w-full py-2.5 rounded-full font-bold text-sm ${canJoinYPP ? 'bg-white text-black hover:bg-zinc-200' : 'bg-white/10 text-white/50 cursor-not-allowed'}`}
                                    >
                                        Apply Now
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>

            {/* Video Details & Editing Modal */}
            {editingVideo && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-[#1f1f1f] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
                        
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span className="text-red-500 font-extrabold">Studio</span> Video Details
                            </h2>
                            <button 
                                onClick={() => setEditingVideo(null)}
                                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {showSavedToast && (
                            <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold animate-fade-in">
                                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                                <span>Video details updated successfully!</span>
                            </div>
                        )}

                        {/* Thumbnail Section */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                Video Thumbnail (Click to Upload)
                            </label>
                            
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/60 border-2 border-dashed border-zinc-700 hover:border-red-500 cursor-pointer group transition-all"
                            >
                                {editThumbnail ? (
                                    <img src={editThumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                                        <ArrowUpTrayIcon className="w-8 h-8 mb-2 text-zinc-400" />
                                        <p className="text-sm font-semibold">Upload New Thumbnail</p>
                                    </div>
                                )}
                                
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white font-semibold text-sm gap-1">
                                    <ArrowUpTrayIcon className="w-6 h-6" />
                                    <span>Change Thumbnail</span>
                                </div>
                            </div>

                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/*" 
                                onChange={handleThumbnailFileChange}
                                className="hidden" 
                            />
                        </div>

                        {/* Title Section */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                Video Title
                            </label>
                            <input 
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full bg-[#282828] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                                placeholder="Enter video title"
                            />
                        </div>

                        {/* Video Analytics Section */}
                        <div className="space-y-3 pt-2 border-t border-white/10">
                            <h3 className="text-sm font-bold text-zinc-200 flex items-center justify-between">
                                <span>Video Analytics</span>
                                <span className="text-xs font-normal text-zinc-400">{editingVideo.type}</span>
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#282828] p-3 rounded-xl border border-white/5 space-y-1">
                                    <p className="text-xs text-zinc-400">Total Views</p>
                                    <p className="text-lg font-bold text-white">{formatNumber(editingVideo.views)}</p>
                                </div>

                                <div className="bg-[#282828] p-3 rounded-xl border border-white/5 space-y-1">
                                    <p className="text-xs text-zinc-400">Last Week Views</p>
                                    <p className="text-lg font-bold text-sky-400">+{formatNumber(editingVideo.lastWeekViews || 0)}</p>
                                </div>

                                <div className="bg-[#282828] p-3 rounded-xl border border-white/5 space-y-1 col-span-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-zinc-400">Last Week Earnings</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${yppActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            {yppActive ? 'Monetized' : 'Monetization Off'}
                                        </span>
                                    </div>
                                    {yppActive ? (
                                        <p className="text-xl font-bold text-green-400">
                                            ${formatNumber((editingVideo.lastWeekViews || 0) * VIEW_INCOME_MULTIPLIER)}
                                        </p>
                                    ) : (
                                        <div>
                                            <p className="text-xl font-bold text-zinc-500">$0.00</p>
                                            <p className="text-[11px] text-zinc-400 mt-0.5">
                                                Join YouTube Partner Program (Earn tab) to monetize this video.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {editingVideo.firstWeekViews !== undefined && (
                                    <div className="bg-[#282828] p-3 rounded-xl border border-white/5 space-y-1 col-span-2">
                                        <p className="text-xs text-zinc-400">First Week Debut Views</p>
                                        <p className="text-md font-bold text-purple-400">{formatNumber(editingVideo.firstWeekViews)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-white/10">
                            <button 
                                onClick={() => setEditingVideo(null)}
                                className="w-1/2 py-2.5 rounded-full font-semibold text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                            >
                                Close
                            </button>
                            <button 
                                onClick={handleSaveVideo}
                                className="w-1/2 py-2.5 rounded-full font-bold text-sm bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg shadow-red-600/20"
                            >
                                Save Changes
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default YouTubeStudioView;
