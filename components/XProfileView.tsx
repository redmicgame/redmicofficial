import React from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { XPost, XUser } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UserVerifiedBadge from './icons/UserVerifiedBadge';
import MessageIcon from './icons/MessageIcon';
import CommentIcon from './icons/CommentIcon';
import RetweetIcon from './icons/RetweetIcon';
import HeartIcon from './icons/HeartIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import { ComposeXPostModal, Post } from './XView';
import { getDateFromGameWeek } from './CalendarDatePicker';

const resolveUser = (id: string, xUsersList: XUser[] = []): XUser => {
    let found = xUsersList.find(u => u.id === id);
    if (found) return found;
    if (id === 'popbase') {
        return {
            id: 'popbase',
            name: 'Pop Base',
            username: 'PopBase',
            avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSI4IiBmaWxsPSIjMTFEQUY1Ii8+PHBhdGggZD0iTTI0IDIwaDE2djI0SDI0VjIweiIgZmlsbD0iI0ZGRiIvPjwvc3ZnPg==',
            isVerified: true,
        };
    }
    if (id === 'tmz') {
        return {
            id: 'tmz',
            name: 'TMZ',
            username: 'TMZ',
            avatar: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=100&h=100&fit=crop',
            isVerified: true,
        };
    }
    if (id === 'chartdata') {
        return {
            id: 'chartdata',
            name: 'chart data',
            username: 'chartdata',
            avatar: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop',
            isVerified: true,
        };
    }
    return {
        id,
        name: 'User',
        username: id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user',
        avatar: 'https://i.imgur.com/3Y3j3jQ.png',
        isVerified: false,
    };
};

const timeAgo = (postDate?: { week: number; year: number; day?: number }) => {
    if (!postDate) return '';
    const day = postDate.day || 1;
    const d = getDateFromGameWeek(postDate.year, postDate.week, day);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const XProfileView: React.FC = () => {
    const { gameState, dispatch, activeArtistData } = useGame();
    const [quotePostTarget, setQuotePostTarget] = React.useState<XPost | null>(null);
    const [showAbout, setShowAbout] = React.useState(false);
    const [showPremiumModal, setShowPremiumModal] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editName, setEditName] = React.useState('');
    const [editBio, setEditBio] = React.useState('');
    const [editHeader, setEditHeader] = React.useState('');
    const [editAvatar, setEditAvatar] = React.useState('');

    // Profile navigation state
    const [activeTab, setActiveTab] = React.useState<'feed' | 'replies' | 'reposts' | 'videos' | 'photos'>('feed');
    const [feedFilter, setFeedFilter] = React.useState<'all' | 'posts' | 'highlights'>('posts');
    const [feedSort, setFeedSort] = React.useState<'recent' | 'popular'>('recent');
    const [showDropdown, setShowDropdown] = React.useState(false);

    const { selectedXUserId } = gameState;
    const { xUsers, xPosts, xFollowingIds, xSuspensionStatus, selectedPlayerXUserId } = activeArtistData!;

    const user = xUsers.find(u => u.id === selectedXUserId);
    const playerUser = selectedPlayerXUserId ? xUsers.find(u => u.id === selectedPlayerXUserId) : xUsers.find(u => u.isPlayer);
    const isPlayerProfile = Boolean(user?.isPlayer || (playerUser && user?.id === playerUser.id));

    const targetUserIds = React.useMemo(() => {
        const ids = new Set<string>();
        if (selectedXUserId) ids.add(selectedXUserId);
        if (user?.id) ids.add(user.id);
        if (isPlayerProfile) {
            if (playerUser?.id) ids.add(playerUser.id);
            if (selectedPlayerXUserId) ids.add(selectedPlayerXUserId);
            if (gameState.activeArtistId) ids.add(gameState.activeArtistId);
            xUsers.filter(u => u.isPlayer).forEach(u => ids.add(u.id));
        }
        return ids;
    }, [selectedXUserId, user, playerUser, isPlayerProfile, selectedPlayerXUserId, gameState.activeArtistId, xUsers]);

    // All authored posts by user (excluding reposts and replies)
    const userAuthoredPosts = React.useMemo(() => {
        return xPosts.filter(p => targetUserIds.has(p.authorId) && !p.isRepost && !p.replyToId && !p.replyToPost);
    }, [xPosts, targetUserIds]);

    // All reply posts by user
    const userReplies = React.useMemo(() => {
        return xPosts.filter(p => targetUserIds.has(p.authorId) && (p.replyToId || p.replyToPost));
    }, [xPosts, targetUserIds]);

    // All reposts by user
    const userReposts = React.useMemo(() => {
        return xPosts.filter(p => p.isRepost && ((p.repostedBy && targetUserIds.has(p.repostedBy)) || targetUserIds.has(p.authorId)));
    }, [xPosts, targetUserIds]);

    // All videos/gifs posted by user
    const userVideos = React.useMemo(() => {
        return xPosts.filter(p => 
            targetUserIds.has(p.authorId) && 
            (p.video || p.content.toLowerCase().includes('.gif') || p.image?.includes('.gif'))
        );
    }, [xPosts, targetUserIds]);

    // All photos posted by user
    const userPhotos = React.useMemo(() => {
        return xPosts.filter(p => 
            targetUserIds.has(p.authorId) && 
            ((p.image && !p.image.startsWith('chart:') && !p.image.startsWith('snapshot:') && !p.image.startsWith('fyc:') && !p.image.includes('.gif')) ||
             (p.images && p.images.length > 0) ||
             p.image2)
        );
    }, [xPosts, targetUserIds]);

    // Total post count across all user items (no 20 limit!)
    const totalUserPostsCount = userAuthoredPosts.length + userReplies.length + userReposts.length;

    // Sort posts according to selected sort mode
    const sortPosts = (posts: XPost[]) => {
        return [...posts].sort((a, b) => {
            if (feedSort === 'popular') {
                const scoreA = (a.likes || 0) + (a.retweets || 0) * 2 + (a.views || 0) / 100;
                const scoreB = (b.likes || 0) + (b.retweets || 0) * 2 + (b.views || 0) / 100;
                return scoreB - scoreA;
            }
            // Most recent
            const dateA = (a.date?.year || 0) * 52 + (a.date?.week || 0);
            const dateB = (b.date?.year || 0) * 52 + (b.date?.week || 0);
            return dateB - dateA;
        });
    };

    // Compute feed items based on filter (All, Posts, Highlights)
    const feedItems = React.useMemo(() => {
        let pool: XPost[] = [];
        if (feedFilter === 'all') {
            pool = [...userAuthoredPosts, ...userReplies, ...userReposts];
        } else if (feedFilter === 'posts') {
            pool = userAuthoredPosts;
        } else if (feedFilter === 'highlights') {
            pool = userAuthoredPosts.filter(p => p.isHighlight);
        }
        return sortPosts(pool);
    }, [feedFilter, feedSort, userAuthoredPosts, userReplies, userReposts]);

    // Find pinned post if any
    const pinnedPost = React.useMemo(() => {
        if (feedFilter === 'highlights') {
            return feedItems.find(p => p.isPinned);
        }
        return userAuthoredPosts.find(p => p.isPinned);
    }, [userAuthoredPosts, feedItems, feedFilter]);

    const isFollowing = user ? xFollowingIds.includes(user.id) : false;

    const handleFollow = () => {
        if (!user) return;
        if (isFollowing) {
            dispatch({ type: 'UNFOLLOW_X_USER', payload: user.id });
        } else {
            dispatch({ type: 'FOLLOW_X_USER', payload: user.id });
        }
    };
    
    const handleEditProfile = () => {
        if (!user) return;
        setEditName(user.name);
        setEditBio(user.bio || '');
        setEditHeader(user.headerImage || '');
        setEditAvatar(user.avatar || '');
        setIsEditing(true);
    };

    const handleSaveProfile = () => {
        if (!user) return;
        dispatch({ type: 'EDIT_X_PROFILE', payload: { userId: user.id, name: editName, bio: editBio, headerImage: editHeader, avatar: editAvatar } });
        setIsEditing(false);
    };

    const handleMessage = () => {
        if (!user || !isFollowing) return;
        const chat = activeArtistData!.xChats.find(c => !c.isGroup && c.participants.includes(user.id));
        if (chat) {
            dispatch({ type: 'VIEW_X_CHAT', payload: chat.id });
        } else {
            alert("No direct message found with this user.");
        }
    };

    if (!user) {
        return <div className="p-4">User not found. <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'x' })}>Back</button></div>;
    }

    return (
        <div 
            onClick={() => setShowDropdown(false)}
            className="bg-black text-white h-full overflow-y-auto w-full pb-28 relative select-none"
        >
            <header className="sticky top-0 bg-black/80 backdrop-blur-md z-30 p-3 flex items-center gap-4 border-b border-zinc-900">
                <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'x' })} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="font-bold text-lg leading-tight flex items-center gap-1.5">
                        {user.name}
                        <UserVerifiedBadge isVerified={user.isVerified} className="w-4 h-4 flex-shrink-0" />
                    </h2>
                    <p className="text-xs text-zinc-500">{totalUserPostsCount} posts</p>
                </div>
            </header>
            
            {user.isPlayer && xSuspensionStatus?.isSuspended && xSuspensionStatus.accountId === user.id && (
                <div className="bg-zinc-800 p-3 text-center text-sm text-zinc-300">
                    <strong>Account suspended</strong>
                    <p className="text-xs">X suspends accounts which violate the X Rules.</p>
                </div>
            )}

            <div className="h-32 sm:h-40 bg-zinc-800 relative bg-cover bg-center" style={{ backgroundImage: user.headerImage ? `url(${user.headerImage})` : undefined }}>
            </div>
            <div className="p-3">
                <div className="flex justify-between items-start -mt-14">
                    <img src={user.avatar} alt={user.name} className="w-28 h-28 rounded-full object-cover border-4 border-black relative z-10 bg-zinc-900" />
                    <div className="flex items-center gap-2 pt-14">
                        {!user.isPlayer ? (
                             <>
                                {isFollowing && (
                                    <button onClick={handleMessage} className="border border-zinc-600 rounded-full p-2 hover:bg-zinc-800 transition-colors">
                                        <MessageIcon className="w-5 h-5"/>
                                    </button>
                                )}
                                <button 
                                    onClick={handleFollow}
                                    className={`font-bold px-4 py-1.5 rounded-full text-sm transition-colors ${isFollowing ? 'bg-transparent text-white border border-zinc-600' : 'bg-white text-black'}`}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                             </>
                        ) : (
                            <>
                                <button 
                                    onClick={handleEditProfile}
                                    className="border border-zinc-600 rounded-full px-4 py-1.5 font-bold text-sm hover:bg-zinc-800 transition-colors"
                                >
                                    Edit Profile
                                </button>
                                {!user.isVerified && (
                                    <button 
                                        onClick={() => setShowPremiumModal(true)}
                                        className="font-bold px-4 py-1.5 rounded-full text-sm text-black bg-white hover:bg-zinc-200 transition-colors"
                                    >
                                        Get Verified
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-3">
                    <div className="flex items-center gap-1">
                        <h1 className="text-xl font-bold">{user.name}</h1>
                        <UserVerifiedBadge isVerified={user.isVerified} className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <button onClick={() => setShowAbout(true)} className="text-zinc-500 hover:text-white transition-colors text-sm">@{user.username}</button>
                    {user.bio && <p className="mt-2 text-sm leading-relaxed">{user.bio}</p>}
                    <div className="flex gap-4 text-sm text-zinc-500 mt-2">
                        <p><span className="font-bold text-white">{formatNumber(user.followingCount)}</span> Following</p>
                        <p><span className="font-bold text-white">{formatNumber(user.followersCount)}</span> Followers</p>
                    </div>
                    {user.isPlayer && (
                        <div className="flex gap-2 mt-3">
                            <button 
                                onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'xAnalytics' })}
                                className="flex-1 flex items-center justify-center gap-2 border border-zinc-700 py-1.5 rounded-full text-sm font-bold hover:bg-zinc-900 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                                Analytics
                            </button>
                            <button 
                                onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'xCreatorStudio' })}
                                className="flex-1 flex items-center justify-center gap-2 border border-zinc-700 py-1.5 rounded-full text-sm font-bold hover:bg-zinc-900 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Monetization
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* TABS BAR (For artist's profile matching IMG_0961 - IMG_0968) */}
            <div className="border-b border-zinc-800 mt-2 relative">
                <div className="flex items-center justify-around text-sm font-bold">
                    {/* Tab 1: Posts / Highlights / All dropdown filter */}
                    <div className="relative flex-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (activeTab !== 'feed') {
                                    setActiveTab('feed');
                                } else {
                                    setShowDropdown(!showDropdown);
                                }
                            }}
                            className={`w-full py-3.5 flex items-center justify-center gap-1.5 relative transition-colors ${activeTab === 'feed' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            {feedFilter === 'highlights' ? (
                                <>
                                    <span className="text-sm">✨</span>
                                    <span>Highlights</span>
                                </>
                            ) : feedFilter === 'all' ? (
                                <>
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
                                    <span>All</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                                    <span>Posts</span>
                                </>
                            )}
                            <svg className={`w-3.5 h-3.5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
                            {activeTab === 'feed' && (
                                <div className="absolute bottom-0 left-4 right-4 h-1 bg-blue-500 rounded-full" />
                            )}
                        </button>

                        {/* Dropdown Popover matching IMG_0964 */}
                        {showDropdown && (
                            <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-2 top-14 w-60 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 text-white"
                            >
                                <button
                                    onClick={() => {
                                        setFeedFilter('all');
                                        setShowDropdown(false);
                                        setActiveTab('feed');
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-zinc-900 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4 fill-current text-zinc-400" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
                                        <span>All</span>
                                    </div>
                                    {feedFilter === 'all' && (
                                        <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setFeedFilter('posts');
                                        setShowDropdown(false);
                                        setActiveTab('feed');
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-zinc-900 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4 fill-current text-zinc-400" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                                        <span>Posts</span>
                                    </div>
                                    {feedFilter === 'posts' && (
                                        <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setFeedFilter('highlights');
                                        setShowDropdown(false);
                                        setActiveTab('feed');
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-zinc-900 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-zinc-400">✨</span>
                                        <span>Highlights</span>
                                    </div>
                                    {feedFilter === 'highlights' && (
                                        <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                    )}
                                </button>

                                <div className="border-t border-zinc-800 my-1.5" />

                                <div className="px-4 py-1 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                    Sort by
                                </div>

                                <button
                                    onClick={() => {
                                        setFeedSort('recent');
                                        setShowDropdown(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-zinc-900 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4 fill-none stroke-current text-zinc-400" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                        <span>Most recent</span>
                                    </div>
                                    {feedSort === 'recent' && (
                                        <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setFeedSort('popular');
                                        setShowDropdown(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-zinc-900 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <HeartIcon className="w-4 h-4 text-zinc-400" />
                                        <span>Popular</span>
                                    </div>
                                    {feedSort === 'popular' && (
                                        <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Tab 2: Replies (Speech bubble icon matching IMG_0961 & IMG_0965) */}
                    <button
                        onClick={() => {
                            setActiveTab('replies');
                            setShowDropdown(false);
                        }}
                        className={`flex-1 py-3.5 flex items-center justify-center relative transition-colors ${activeTab === 'replies' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Replies"
                    >
                        <CommentIcon className="w-5 h-5" />
                        {activeTab === 'replies' && (
                            <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-500 rounded-full" />
                        )}
                    </button>

                    {/* Tab 3: Reposts (Retweet icon matching IMG_0961 & IMG_0966) */}
                    <button
                        onClick={() => {
                            setActiveTab('reposts');
                            setShowDropdown(false);
                        }}
                        className={`flex-1 py-3.5 flex items-center justify-center relative transition-colors ${activeTab === 'reposts' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Reposts"
                    >
                        <RetweetIcon className="w-5 h-5" />
                        {activeTab === 'reposts' && (
                            <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-500 rounded-full" />
                        )}
                    </button>

                    {/* Tab 4: Videos (Play icon matching IMG_0961 & IMG_0967) */}
                    <button
                        onClick={() => {
                            setActiveTab('videos');
                            setShowDropdown(false);
                        }}
                        className={`flex-1 py-3.5 flex items-center justify-center relative transition-colors ${activeTab === 'videos' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Videos"
                    >
                        <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        {activeTab === 'videos' && (
                            <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-500 rounded-full" />
                        )}
                    </button>

                    {/* Tab 5: Photos (Photo icon matching IMG_0968) */}
                    <button
                        onClick={() => {
                            setActiveTab('photos');
                            setShowDropdown(false);
                        }}
                        className={`flex-1 py-3.5 flex items-center justify-center relative transition-colors ${activeTab === 'photos' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Photos"
                    >
                        <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        {activeTab === 'photos' && (
                            <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-500 rounded-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* TAB CONTENT */}
            <div>
                {/* 1. FEED TAB (All, Posts, Highlights) */}
                {activeTab === 'feed' && (
                    <div>
                        {/* Pinned post banner if one is pinned */}
                        {pinnedPost && (feedFilter === 'posts' || feedFilter === 'all' || (feedFilter === 'highlights' && pinnedPost.isHighlight)) && (
                            <div className="border-b border-zinc-800">
                                <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold pl-12 pt-3 pb-0.5">
                                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                                    <span>Pinned</span>
                                </div>
                                <Post 
                                    post={pinnedPost} 
                                    author={resolveUser(pinnedPost.authorId, xUsers)} 
                                    onQuote={setQuotePostTarget} 
                                />
                            </div>
                        )}

                        {/* Remaining posts (excluding pinned post so it's not rendered twice) */}
                        {feedItems
                            .filter(p => !pinnedPost || p.id !== pinnedPost.id)
                            .map(post => (
                                <Post 
                                    key={post.id} 
                                    post={post} 
                                    author={resolveUser(post.authorId, xUsers)} 
                                    onQuote={setQuotePostTarget} 
                                />
                            ))
                        }

                        {feedItems.length === 0 && !pinnedPost && (
                            <div className="p-8 text-center text-zinc-500 text-sm">
                                {feedFilter === 'highlights' 
                                    ? "No posts in your Highlights yet. Tap '···' on any post to add it to your highlights."
                                    : "No posts to display."
                                }
                            </div>
                        )}
                    </div>
                )}

                {/* 2. REPLIES TAB (Matching IMG_0965 thread layout) */}
                {activeTab === 'replies' && (
                    <div>
                        {userReplies.map(reply => {
                            const parentPost = reply.replyToPost || xPosts.find(p => p.id === reply.replyToId);
                            const parentAuthor = parentPost ? resolveUser(parentPost.authorId, xUsers) : null;

                            return (
                                <div key={reply.id} className="border-b border-zinc-700/70 p-3">
                                    {parentPost && parentAuthor ? (
                                        <>
                                            {/* Parent Tweet */}
                                            <div className="flex gap-3">
                                                <div className="flex flex-col items-center">
                                                    <img src={parentAuthor.avatar} alt={parentAuthor.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                    <div className="w-0.5 bg-zinc-700 flex-grow my-1 min-h-[32px]" />
                                                </div>
                                                <div className="w-full min-w-0 pb-2">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <span className="font-bold hover:underline truncate">{parentAuthor.name}</span>
                                                        <UserVerifiedBadge isVerified={parentAuthor.isVerified} className="w-4 h-4 flex-shrink-0" />
                                                        <span className="text-zinc-500 truncate">@{parentAuthor.username}</span>
                                                        <span className="text-zinc-500">·</span>
                                                        <span className="text-zinc-500">{timeAgo(parentPost.date)}</span>
                                                    </div>
                                                    <p className="text-white mt-1 whitespace-pre-wrap break-words text-sm">{parentPost.content}</p>
                                                    {parentPost.image && !parentPost.image.startsWith('chart:') && (
                                                        <img src={parentPost.image} alt="Tweet media" className="mt-2 rounded-xl max-h-56 object-cover border border-zinc-700" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Connected User Reply */}
                                            <div className="flex gap-3 pt-1">
                                                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                <div className="w-full min-w-0">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <span className="font-bold hover:underline truncate">{user.name}</span>
                                                        <UserVerifiedBadge isVerified={user.isVerified} className="w-4 h-4 flex-shrink-0" />
                                                        <span className="text-zinc-500 truncate">@{user.username}</span>
                                                        <span className="text-zinc-500">·</span>
                                                        <span className="text-zinc-500">{timeAgo(reply.date)}</span>
                                                    </div>
                                                    <div className="text-xs text-zinc-500 my-0.5">Replying to <span className="text-blue-400">@{parentAuthor.username}</span></div>
                                                    <p className="text-white whitespace-pre-wrap break-words text-sm mt-1">{reply.content}</p>
                                                    {reply.image && (
                                                        <img src={reply.image} alt="Reply media" className="mt-2 rounded-xl max-h-56 object-cover border border-zinc-700" />
                                                    )}
                                                    {/* Action bar */}
                                                    <div className="flex justify-between items-center mt-3 text-zinc-500 max-w-sm">
                                                        <div className="flex items-center gap-1">
                                                            <CommentIcon className="w-4 h-4" />
                                                            <span className="text-xs">{reply.comments?.length || 0}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <RetweetIcon className="w-4 h-4" />
                                                            <span className="text-xs">{formatNumber(reply.retweets || 0)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <HeartIcon className="w-4 h-4" />
                                                            <span className="text-xs">{formatNumber(reply.likes || 0)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <ChartBarIcon className="w-4 h-4" />
                                                            <span className="text-xs">{formatNumber(reply.views || 0)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <Post post={reply} author={user} onQuote={setQuotePostTarget} />
                                    )}
                                </div>
                            );
                        })}

                        {userReplies.length === 0 && (
                            <div className="p-8 text-center text-zinc-500 text-sm">
                                You haven't replied to any tweets yet.
                            </div>
                        )}
                    </div>
                )}

                {/* 3. REPOSTS TAB (Matching IMG_0966) */}
                {activeTab === 'reposts' && (
                    <div>
                        {userReposts.map(repost => {
                            const original = repost.originalPost || repost;
                            const originalAuthor = resolveUser(original.authorId, xUsers);

                            return (
                                <div key={repost.id} className="border-b border-zinc-800">
                                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold pl-12 pt-3 pb-0.5">
                                        <RetweetIcon className="w-3.5 h-3.5 text-zinc-500" />
                                        <span>{user.name} reposted</span>
                                    </div>
                                    <Post post={original} author={originalAuthor} onQuote={setQuotePostTarget} />
                                </div>
                            );
                        })}

                        {userReposts.length === 0 && (
                            <div className="p-8 text-center text-zinc-500 text-sm">
                                You haven't reposted any tweets yet. Tap the retweet icon on any post to repost it.
                            </div>
                        )}
                    </div>
                )}

                {/* 4. VIDEOS TAB (Matching IMG_0967) */}
                {activeTab === 'videos' && (
                    <div>
                        {userVideos.map(videoPost => (
                            <Post 
                                key={videoPost.id} 
                                post={videoPost} 
                                author={user} 
                                onQuote={setQuotePostTarget} 
                            />
                        ))}

                        {userVideos.length === 0 && (
                            <div className="p-8 text-center text-zinc-500 text-sm">
                                No video or GIF posts found.
                            </div>
                        )}
                    </div>
                )}

                {/* 5. PHOTOS TAB (Matching IMG_0968) */}
                {activeTab === 'photos' && (
                    <div>
                        {userPhotos.map(photoPost => (
                            <Post 
                                key={photoPost.id} 
                                post={photoPost} 
                                author={user} 
                                onQuote={setQuotePostTarget} 
                            />
                        ))}

                        {userPhotos.length === 0 && (
                            <div className="p-8 text-center text-zinc-500 text-sm">
                                No photo posts found.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {quotePostTarget && playerUser && (
                <ComposeXPostModal 
                    user={playerUser}
                    quotePost={quotePostTarget}
                    onClose={() => setQuotePostTarget(null)}
                    onPost={(payload) => {
                        dispatch({ type: 'POST_ON_X', payload });
                        setQuotePostTarget(null);
                    }}
                />
            )}

            {showAbout && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-center p-4 z-50">
                    <div className="bg-black border border-zinc-800 rounded-3xl w-full max-w-sm flex flex-col">
                        <header className="p-4 flex items-center gap-6 pb-2">
                            <button onClick={() => setShowAbout(false)}><ArrowLeftIcon className="w-5 h-5 text-white"/></button>
                            <h2 className="font-bold text-xl">About this account</h2>
                        </header>
                        <div className="flex flex-col items-center mt-6">
                            <img src={user.avatar} className="w-20 h-20 rounded-full object-cover filter grayscale bg-zinc-800" alt={user.name} />
                            <h3 className="font-bold text-lg mt-3 flex items-center gap-1">{user.name} <UserVerifiedBadge isVerified={user.isVerified} className="w-5 h-5" /></h3>
                            <p className="text-zinc-500">@{user.username}</p>
                            <p className="font-bold text-xl mt-3">𝕏.com</p>
                        </div>
                        <div className="mt-8 p-4 space-y-6">
                            <div className="flex items-center gap-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <div>
                                    <p className="font-bold text-white text-lg">Date joined</p>
                                    <p className="text-zinc-500">{['January', 'March', 'August', 'October', 'December'][(user.username.charCodeAt(0) || 0) % 5]} {(2008 + (user.id.charCodeAt(1) || 0) % 15)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <div className="flex-grow">
                                    <p className="font-bold text-white text-lg">Account based in</p>
                                    <p className="text-zinc-500">{user.country || ['United States', 'United Kingdom', 'Canada', 'Brazil', 'Philippines'][(user.id.charCodeAt(0) || 0) % 5]}</p>
                                </div>
                            </div>
                            {user.isVerified && (
                                <div className="flex items-center gap-4">
                                    <UserVerifiedBadge isVerified={user.isVerified} className="w-6 h-6" />
                                    <div>
                                        <p className="font-bold text-white text-lg">Verified</p>
                                        <p className="text-zinc-500">Since {user.verifiedSince || `August ${(2010 + (user.id.charCodeAt(0) || 0) % 13)}`}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-4 pb-6">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                                <div>
                                    <p className="font-bold text-white text-lg">Connected via</p>
                                    <p className="text-zinc-500">{['X for Android', 'X for iPhone', 'X Web App', 'United States App Store'][(user.username.length || 0) % 4]}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showPremiumModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 text-center">
                        <h2 className="text-2xl font-bold mb-2">Upgrade to Premium</h2>
                        <p className="text-zinc-400 mb-6">Choose your verification tier.</p>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={() => {
                                    if(activeArtistData && activeArtistData.money >= 25000) {
                                        dispatch({ type: 'BUY_X_VERIFICATION', payload: { accountId: user.id, tier: 'blue', cost: 25000 }});
                                        setShowPremiumModal(false);
                                    } else {
                                        alert('Not enough funds!');
                                    }
                                }}
                                className="w-full bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2] p-4 rounded-2xl flex flex-col items-center transition-colors"
                            >
                                <UserVerifiedBadge isVerified="blue" className="w-10 h-10 mb-2" />
                                <span className="font-bold text-lg text-[#1DA1F2]">Blue</span>
                                <span className="text-zinc-300 text-sm">$25K / month</span>
                            </button>
                            
                            <button 
                                onClick={() => {
                                    if(activeArtistData && activeArtistData.money >= 250000) {
                                        dispatch({ type: 'BUY_X_VERIFICATION', payload: { accountId: user.id, tier: 'gold', cost: 250000 }});
                                        setShowPremiumModal(false);
                                    } else {
                                        alert('Not enough funds!');
                                    }
                                }}
                                className="w-full bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400 p-4 rounded-2xl flex flex-col items-center transition-colors"
                            >
                                <UserVerifiedBadge isVerified="gold" className="w-10 h-10 mb-2" />
                                <span className="font-bold text-lg text-yellow-400">Gold</span>
                                <span className="text-zinc-300 text-sm">$250K / month</span>
                            </button>
                        </div>
                        
                        <button onClick={() => setShowPremiumModal(false)} className="mt-6 font-bold text-zinc-500 hover:text-white">Cancel</button>
                    </div>
                </div>
            )}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-black w-full max-w-md rounded-2xl overflow-hidden border border-zinc-800 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsEditing(false)} className="text-white hover:bg-zinc-800 p-2 rounded-full">
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </button>
                                <h2 className="text-xl font-bold">Edit profile</h2>
                            </div>
                            <button onClick={handleSaveProfile} className="bg-white text-black font-bold px-4 py-1.5 rounded-full text-sm">Save</button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 block">Name</label>
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-black border-b border-zinc-700 text-white p-2 focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 block">Bio</label>
                                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full bg-black border-b border-zinc-700 text-white p-2 focus:border-blue-500 outline-none resize-none h-20" maxLength={160} />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 block mb-2">Header Image (Optional)</label>
                                {editHeader && <img src={editHeader} className="w-full h-24 object-cover mb-2 rounded-md" alt="Header Preview" />}
                                <input type="file" accept="image/*" onChange={e => {
                                    if (e.target.files && e.target.files[0]) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setEditHeader(reader.result as string);
                                        reader.readAsDataURL(e.target.files[0]);
                                    }
                                }} className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700" />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 block mb-2">Avatar Image (Optional)</label>
                                {editAvatar && <img src={editAvatar} className="w-16 h-16 object-cover mb-2 rounded-full border border-zinc-700" alt="Avatar Preview" />}
                                <input type="file" accept="image/*" onChange={e => {
                                    if (e.target.files && e.target.files[0]) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setEditAvatar(reader.result as string);
                                        reader.readAsDataURL(e.target.files[0]);
                                    }
                                }} className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default XProfileView;