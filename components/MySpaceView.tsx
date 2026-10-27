import React, { useState, useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { MYSPACE_MOODS, getInitialMySpaceFeed } from '../utils/myspaceFeed';
import { MySpaceFeedPost } from '../types';

const UsersIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
    </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
);

const HeartIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? "0" : "2"} className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
);

const ChatIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 0 1-.814 1.686.75.75 0 0 0 .44 1.223ZM8.25 10.875a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25ZM12 10.875a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25ZM15.75 10.875a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" clipRule="evenodd" />
    </svg>
);

const DiscIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeDasharray="3 3" fill="none" />
    </svg>
);

const MySpaceView: React.FC = () => {
    const { gameState, dispatch, activeArtist } = useGame();
    const [activeTab, setActiveTab] = useState<'feed' | 'profile'>('feed');
    const [feedFilter, setFeedFilter] = useState<'all' | 'charts' | 'fan' | 'industry'>('all');

    // Feed compose states
    const [feedText, setFeedText] = useState('');
    const [feedMood, setFeedMood] = useState(MYSPACE_MOODS[0]);
    const [feedSongId, setFeedSongId] = useState('');

    // Profile states
    const [bulletinText, setBulletinText] = useState('');
    const [blogText, setBlogText] = useState('');
    const [selectedSongId, setSelectedSongId] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

    const activeData = gameState.artistsData[activeArtist?.id || ''];
    const releasedSongs = activeData?.songs.filter(s => s.isReleased && !s.remixOfSongId) || [];
    const mySpaceData = activeData?.mySpaceData;
    
    const profileSong = mySpaceData?.profileSongId ? releasedSongs.find(s => s.id === mySpaceData.profileSongId) : null;

    const [editMood, setEditMood] = useState(mySpaceData?.mood || '');
    const [editGeneralInterests, setEditGeneralInterests] = useState(mySpaceData?.generalInterests || '');
    const [editMusicInterests, setEditMusicInterests] = useState(mySpaceData?.musicInterests || '');
    
    const potentialFriends = useMemo(() => [
        ...gameState.npcs.filter(n => n?.name).map(n => ({ id: n.id, name: n.name, image: n.image })),
        ...(activeData?.xUsers || []).filter(u => u?.name).map(u => ({ id: u.id, name: u.name, image: u.avatar }))
    ], [gameState.npcs, activeData?.xUsers]);

    const defaultTop8 = useMemo(() => gameState.npcs.filter(n => n?.name).slice(0, 8).map(n => ({ id: n.id, name: n.name, image: n.image })), [gameState.npcs]);
    const [editTop8Friends, setEditTop8Friends] = useState<{id: string; name: string; image: string}[]>(mySpaceData?.top8Friends || defaultTop8);
    const [friendSearch, setFriendSearch] = useState('');

    const top8FriendsList = mySpaceData?.top8Friends || defaultTop8;

    // Get feed posts (fallback to initial posts if none present)
    const feedPosts: MySpaceFeedPost[] = useMemo(() => {
        if (mySpaceData?.feedPosts && mySpaceData.feedPosts.length > 0) {
            return mySpaceData.feedPosts;
        }
        return getInitialMySpaceFeed(activeArtist?.name || 'Artist', gameState.date);
    }, [mySpaceData?.feedPosts, activeArtist?.name, gameState.date]);

    // Filtered feed posts
    const displayedPosts = useMemo(() => {
        if (feedFilter === 'all') return feedPosts;
        if (feedFilter === 'charts') return feedPosts.filter(p => p.category === 'charts');
        if (feedFilter === 'fan') return feedPosts.filter(p => p.category === 'fan' || p.category === 'friends');
        if (feedFilter === 'industry') return feedPosts.filter(p => p.category === 'industry');
        return feedPosts;
    }, [feedPosts, feedFilter]);

    // Player sales stats calculation
    const playerAlbumsOnChart = useMemo(() => {
        return (gameState.billboardTopAlbums || []).filter(a => a.isPlayerAlbum);
    }, [gameState.billboardTopAlbums]);

    const totalWeeklyPureAlbumSales = useMemo(() => {
        return playerAlbumsOnChart.reduce((sum, a) => sum + (a.weeklySales || a.weeklyPureSales || 0), 0);
    }, [playerAlbumsOnChart]);

    const totalWeeklyItunesAlbumSales = useMemo(() => {
        return playerAlbumsOnChart.reduce((sum, a) => sum + (a.itunesSales || 0), 0);
    }, [playerAlbumsOnChart]);

    const handlePostFeed = () => {
        if (!feedText.trim()) return;
        const nowPlayingSong = releasedSongs.find(s => s.id === feedSongId);
        dispatch({
            type: 'POST_ON_MYSPACE',
            payload: {
                type: 'feed_post',
                content: feedText.trim(),
                mood: feedMood,
                nowPlaying: nowPlayingSong ? { title: nowPlayingSong.title, artist: activeArtist?.name || 'Artist' } : undefined,
            }
        });
        setFeedText('');
    };

    const handleLikePost = (postId: string) => {
        dispatch({
            type: 'POST_ON_MYSPACE',
            payload: {
                type: 'like_feed_post',
                postId,
            }
        });
    };

    const handleAddComment = (postId: string) => {
        const comment = (commentInputs[postId] || '').trim();
        if (!comment) return;
        dispatch({
            type: 'POST_ON_MYSPACE',
            payload: {
                type: 'comment_feed_post',
                postId,
                content: comment,
            }
        });
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    };

    const toggleComments = (postId: string) => {
        setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const handlePostBulletin = () => {
        if (!bulletinText.trim()) return;
        dispatch({ type: 'POST_ON_MYSPACE', payload: { type: 'bulletin', content: bulletinText } });
        setBulletinText('');
    };

    const handlePostBlog = () => {
        if (!blogText.trim()) return;
        dispatch({ type: 'POST_ON_MYSPACE', payload: { type: 'blog', content: blogText } });
        setBlogText('');
    };

    const handleUpdateProfileSong = () => {
        if (!selectedSongId) return;
        dispatch({ type: 'POST_ON_MYSPACE', payload: { type: 'profile_song', songId: selectedSongId } });
        setSelectedSongId('');
    };

    const handleSaveProfile = () => {
        dispatch({
            type: 'UPDATE_MYSPACE_PROFILE',
            payload: {
                mood: editMood,
                generalInterests: editGeneralInterests,
                musicInterests: editMusicInterests,
                top8Friends: editTop8Friends
            }
        });
        setIsEditingProfile(false);
    };

    const toggleTop8Friend = (friend: {id: string; name: string; image: string}) => {
        if (editTop8Friends.find(f => f.id === friend.id)) {
            setEditTop8Friends(editTop8Friends.filter(f => f.id !== friend.id));
        } else {
            if (editTop8Friends.length < 8) {
                setEditTop8Friends([...editTop8Friends, friend]);
            }
        }
    };

    const filteredPotentialFriends = potentialFriends.filter(f => f?.name?.toLowerCase().includes((friendSearch || '').toLowerCase()));

    return (
        <div className="bg-[#e9e9e9] min-h-screen h-full overflow-y-auto text-black font-sans pb-24">
            {/* Retro 2000s Header */}
            <header className="bg-[#003399] p-2 flex justify-between items-center text-white border-b-2 border-[#ffcc00] shadow">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} 
                        className="px-2.5 py-1 bg-[#6699cc] text-xs font-bold rounded border border-blue-300 hover:bg-[#4d7ca6] transition shadow-sm"
                    >
                        &larr; Back
                    </button>
                    <div className="flex items-baseline gap-1.5">
                        <h1 className="font-extrabold tracking-tight text-xl text-white">MySpace.com</h1>
                        <span className="text-[10px] text-blue-200 hidden sm:inline">a place for friends & pure sales</span>
                    </div>
                </div>
                <div className="text-xs flex items-center gap-2">
                    <span className="text-zinc-300 hidden md:inline">Week {gameState.date.week}, {gameState.date.year}</span>
                    <span className="text-blue-300">|</span>
                    <a href="#feed" onClick={(e) => { e.preventDefault(); setActiveTab('feed'); }} className={`hover:underline font-bold ${activeTab === 'feed' ? 'text-[#ffcc00]' : 'text-white'}`}>Feed / Stream</a>
                    <span className="text-blue-300">|</span>
                    <a href="#profile" onClick={(e) => { e.preventDefault(); setActiveTab('profile'); }} className={`hover:underline font-bold ${activeTab === 'profile' ? 'text-[#ffcc00]' : 'text-white'}`}>My Profile</a>
                </div>
            </header>

            {/* Navigation Tabs Bar */}
            <div className="bg-[#d5e4f7] border-b border-[#003399] px-4 py-2 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('feed')}
                        className={`px-3 py-1 font-bold rounded-t border border-b-0 transition flex items-center gap-1.5 ${
                            activeTab === 'feed'
                                ? 'bg-white text-[#003399] border-[#003399] shadow-sm -mb-[9px] pb-2'
                                : 'bg-[#b8d4f6] text-[#003399] border-blue-300 hover:bg-white'
                        }`}
                    >
                        <span>📰</span> Friend Feed (Pure Sales & Era Stream)
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-3 py-1 font-bold rounded-t border border-b-0 transition flex items-center gap-1.5 ${
                            activeTab === 'profile'
                                ? 'bg-white text-[#003399] border-[#003399] shadow-sm -mb-[9px] pb-2'
                                : 'bg-[#b8d4f6] text-[#003399] border-blue-300 hover:bg-white'
                        }`}
                    >
                        <span>👤</span> My Profile Space
                    </button>
                </div>

                <div className="flex items-center gap-3 text-[#003399] font-medium text-[11px]">
                    <span className="hidden sm:inline">💿 Physical CDs & Digital Downloads Era</span>
                    <button 
                        onClick={() => setIsEditingProfile(true)} 
                        className="bg-white border border-blue-400 px-2 py-0.5 rounded text-[#003399] font-bold hover:bg-blue-50"
                    >
                        Edit Layout
                    </button>
                </div>
            </div>

            {/* ==================== TAB 1: SALES-CENTRIC FRIEND FEED ==================== */}
            {activeTab === 'feed' && (
                <main className="max-w-5xl mx-auto p-4 flex flex-col md:flex-row gap-6">
                    {/* Left Sidebar: Mini Profile & Era Sales Ticker */}
                    <aside className="w-full md:w-1/3 space-y-4">
                        {/* Mini Profile Card */}
                        <div className="bg-white border-2 border-[#003399] p-3 shadow-sm">
                            <div className="flex items-center gap-3">
                                <img 
                                    src={activeArtist?.image || 'https://picsum.photos/100'} 
                                    alt={activeArtist?.name} 
                                    className="w-16 h-16 object-cover border border-gray-400 shadow-sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base font-bold text-[#003399] truncate">{activeArtist?.name}</h2>
                                    <p className="text-[11px] text-gray-600">Online Now 🟢</p>
                                    <p className="text-[11px] font-semibold text-gray-700 mt-0.5">
                                        Mood: <span className="font-normal text-blue-800">{mySpaceData?.mood || '🎵 Rocking Out'}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Now Playing Widget on Profile */}
                            <div className="mt-3 bg-[#eef4fc] border border-[#6699cc] p-2 flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center shrink-0">
                                    <DiscIcon className="w-5 h-5 animate-spin" />
                                </div>
                                <div className="min-w-0 flex-1 text-xs">
                                    <p className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">Profile Song</p>
                                    <p className="font-bold text-[#003399] truncate">
                                        {profileSong ? profileSong.title : 'No profile song set'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Era Sales & Retail Snapshot */}
                        <div className="bg-white border border-[#003399] shadow-sm">
                            <h3 className="bg-[#003399] text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                                <span>📀 Billboard 200 Sales Tracker</span>
                                <span className="text-[10px] text-yellow-300 font-normal">SoundScan / Retail</span>
                            </h3>
                            <div className="p-3 text-xs space-y-2.5">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                                    <span className="text-gray-600">Total Pure Album Sales:</span>
                                    <span className="font-bold text-[#003399] text-sm">
                                        {totalWeeklyPureAlbumSales > 0 ? totalWeeklyPureAlbumSales.toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                                    <span className="text-gray-600">iTunes Digital Album Sales:</span>
                                    <span className="font-bold text-emerald-700">
                                        {totalWeeklyItunesAlbumSales > 0 ? totalWeeklyItunesAlbumSales.toLocaleString() : '0'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                                    <span className="text-gray-600">Retail CD / Physical Sales:</span>
                                    <span className="font-bold text-amber-800">
                                        {Math.max(0, totalWeeklyPureAlbumSales - totalWeeklyItunesAlbumSales).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-[10px] text-gray-500 pt-1 leading-relaxed bg-amber-50 border border-amber-200 p-2 rounded">
                                    💡 <strong>SoundScan Era Fact:</strong> In the 2000s, Billboard 200 is driven by pure physical CD sales at Best Buy & Target, plus iTunes digital downloads!
                                </div>
                            </div>
                        </div>

                        {/* Retro Era Links */}
                        <div className="bg-white border border-[#6699cc] p-3 text-xs space-y-1.5 shadow-sm">
                            <h4 className="font-bold text-[#003399] border-b pb-1">MySpace Era Hub</h4>
                            <p className="text-gray-700 flex items-center justify-between">
                                <span>Total Friends:</span>
                                <span className="font-bold text-red-600">{Math.floor((activeData?.popularity || 10) * 1250).toLocaleString()}</span>
                            </p>
                            <p className="text-gray-700 flex items-center justify-between">
                                <span>Profile Views:</span>
                                <span className="font-bold text-blue-900">{formatNumber(mySpaceData?.profileViews || 4820)}</span>
                            </p>
                            <button
                                onClick={() => setActiveTab('profile')}
                                className="w-full mt-2 text-center text-xs bg-[#eef4fc] border border-[#6699cc] text-[#003399] font-bold py-1 hover:bg-[#dbe7f7]"
                            >
                                View My Classic Profile & Top 8 &rarr;
                            </button>
                        </div>
                    </aside>

                    {/* Center Column: Feed Stream */}
                    <section className="w-full md:w-2/3 space-y-4">
                        {/* Compose Status Box */}
                        <div className="bg-white border-2 border-[#003399] p-3.5 shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2.5">
                                <h3 className="font-bold text-sm text-[#003399] flex items-center gap-1.5">
                                    <span>✏️</span> Post to Friend Stream
                                </h3>
                                <span className="text-[11px] text-gray-500">Share your album sales, music, or mood!</span>
                            </div>

                            <textarea
                                value={feedText}
                                onChange={(e) => setFeedText(e.target.value)}
                                rows={2}
                                maxLength={280}
                                placeholder="What's going on with your album, CD releases, or tour today?"
                                className="w-full text-xs p-2.5 border border-gray-300 rounded focus:border-[#003399] focus:outline-none resize-none font-sans"
                            />

                            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Mood Picker */}
                                    <div className="flex items-center gap-1">
                                        <label className="text-[11px] font-bold text-gray-600">Mood:</label>
                                        <select
                                            value={feedMood}
                                            onChange={(e) => setFeedMood(e.target.value)}
                                            className="text-[11px] p-1 border border-gray-300 rounded bg-white text-gray-800"
                                        >
                                            {MYSPACE_MOODS.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Now Playing Song Picker */}
                                    {releasedSongs.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <label className="text-[11px] font-bold text-gray-600">Playing:</label>
                                            <select
                                                value={feedSongId}
                                                onChange={(e) => setFeedSongId(e.target.value)}
                                                className="text-[11px] p-1 border border-gray-300 rounded bg-white text-gray-800 max-w-[140px] truncate"
                                            >
                                                <option value="">(None)</option>
                                                {releasedSongs.map(s => (
                                                    <option key={s.id} value={s.id}>{s.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handlePostFeed}
                                    disabled={!feedText.trim()}
                                    className="px-4 py-1.5 bg-[#003399] hover:bg-[#002266] text-white font-bold text-xs rounded shadow-sm disabled:opacity-50 transition"
                                >
                                    Post Update
                                </button>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1.5 border-b border-[#003399] pb-1 text-xs font-bold text-gray-700 flex-wrap">
                            <span className="text-[11px] text-gray-500 mr-1">Filter Stream:</span>
                            <button
                                onClick={() => setFeedFilter('all')}
                                className={`px-2.5 py-1 rounded-t border ${
                                    feedFilter === 'all'
                                        ? 'bg-[#003399] text-white border-[#003399]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                }`}
                            >
                                All Updates
                            </button>
                            <button
                                onClick={() => setFeedFilter('charts')}
                                className={`px-2.5 py-1 rounded-t border ${
                                    feedFilter === 'charts'
                                        ? 'bg-[#003399] text-white border-[#003399]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                }`}
                            >
                                📀 iTunes & Billboard Sales
                            </button>
                            <button
                                onClick={() => setFeedFilter('industry')}
                                className={`px-2.5 py-1 rounded-t border ${
                                    feedFilter === 'industry'
                                        ? 'bg-[#003399] text-white border-[#003399]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                }`}
                            >
                                📺 TRL, TMZ & Best Buy
                            </button>
                            <button
                                onClick={() => setFeedFilter('fan')}
                                className={`px-2.5 py-1 rounded-t border ${
                                    feedFilter === 'fan'
                                        ? 'bg-[#003399] text-white border-[#003399]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                }`}
                            >
                                👥 Fans, AIM & Ringtones
                            </button>
                        </div>

                        {/* Feed Posts List */}
                        <div className="space-y-3.5">
                            {displayedPosts.length === 0 ? (
                                <div className="bg-white border border-gray-300 p-8 text-center text-gray-500 text-sm">
                                    No updates in this filter category yet. Advance a week to see new sales & chart updates!
                                </div>
                            ) : (
                                displayedPosts.map((post) => {
                                    const isCommentsOpen = !!expandedComments[post.id];
                                    const replyText = commentInputs[post.id] || '';

                                    return (
                                        <article
                                            key={post.id}
                                            className={`bg-white border rounded shadow-sm overflow-hidden ${
                                                post.category === 'charts'
                                                    ? 'border-emerald-600'
                                                    : post.category === 'industry'
                                                    ? 'border-indigo-400'
                                                    : 'border-gray-300'
                                            }`}
                                        >
                                            {/* Post Header */}
                                            <div className="p-3 bg-gradient-to-r from-[#f7f9fd] to-white border-b border-gray-200 flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <img
                                                        src={post.authorAvatar}
                                                        alt={post.authorName}
                                                        className="w-10 h-10 object-cover border border-gray-400 shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-bold text-xs text-[#003399] hover:underline cursor-pointer">
                                                                {post.authorName}
                                                            </span>
                                                            {post.isVerified && (
                                                                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1 rounded border border-blue-200">
                                                                    Official
                                                                </span>
                                                            )}
                                                            {post.authorHandle && (
                                                                <span className="text-[11px] text-gray-500">
                                                                    @{post.authorHandle}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                                            <span>Week {post.date.week}, {post.date.year}</span>
                                                            {post.mood && (
                                                                <span className="text-gray-700 font-medium">
                                                                    • Mood: {post.mood}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Category badge */}
                                                {post.category && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                                        post.category === 'charts'
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                            : post.category === 'industry'
                                                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                                                    }`}>
                                                        {post.category === 'charts' ? 'Sales / Billboard' : post.category}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Post Body */}
                                            <div className="p-3.5 space-y-2.5">
                                                <p className="text-xs text-gray-900 leading-relaxed whitespace-pre-wrap font-sans">
                                                    {post.content}
                                                </p>

                                                {/* Now Playing Widget */}
                                                {post.nowPlaying && (
                                                    <div className="bg-[#eef4fc] border border-blue-200 p-2 flex items-center gap-2 text-xs text-blue-900 rounded">
                                                        <DiscIcon className="w-4 h-4 text-[#003399] shrink-0" />
                                                        <span className="font-semibold truncate">
                                                            ♫ Now Playing: <strong>{post.nowPlaying.title}</strong> by {post.nowPlaying.artist}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Attached Image / Cover Art */}
                                                {post.image && (
                                                    <div className="mt-2 rounded overflow-hidden max-h-72 border border-gray-200 bg-gray-50 flex items-center justify-center">
                                                        <img
                                                            src={post.image}
                                                            alt="Post media"
                                                            className="max-h-72 max-w-full object-contain"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Post Footer & Interactive Actions */}
                                            <div className="px-3.5 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-700">
                                                <div className="flex items-center gap-3">
                                                    {/* Give Props / Kudos Button */}
                                                    <button
                                                        onClick={() => handleLikePost(post.id)}
                                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition ${
                                                            post.hasLiked
                                                                ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                                                : 'hover:bg-gray-200 text-gray-700 border border-transparent'
                                                        }`}
                                                    >
                                                        <HeartIcon className="w-4 h-4" filled={post.hasLiked} />
                                                        <span>{post.hasLiked ? 'Props Given' : 'Give Props'} ({post.kudos})</span>
                                                    </button>

                                                    {/* Comment Toggle Button */}
                                                    <button
                                                        onClick={() => toggleComments(post.id)}
                                                        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-200 font-medium transition"
                                                    >
                                                        <ChatIcon className="w-4 h-4 text-blue-700" />
                                                        <span>Comments ({post.commentsCount || (post.comments?.length || 0)})</span>
                                                    </button>
                                                </div>

                                                <span className="text-[11px] text-gray-500 font-mono hidden sm:inline">
                                                    MySpace Stream
                                                </span>
                                            </div>

                                            {/* Expandable Comments Section */}
                                            {isCommentsOpen && (
                                                <div className="bg-[#f8fafd] border-t border-gray-200 p-3 space-y-2.5">
                                                    {/* Existing Comments */}
                                                    {post.comments && post.comments.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {post.comments.map((c) => (
                                                                <div key={c.id} className="bg-white border border-gray-200 p-2 rounded text-xs flex items-start gap-2">
                                                                    <img
                                                                        src={c.authorAvatar}
                                                                        alt={c.authorName}
                                                                        className="w-7 h-7 object-cover border border-gray-300 shrink-0"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="font-bold text-[#003399] truncate">{c.authorName}</span>
                                                                            <span className="text-[10px] text-gray-400">Week {c.date?.week}</span>
                                                                        </div>
                                                                        <p className="text-gray-800 mt-0.5 whitespace-pre-wrap">{c.content}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 italic">No comments yet. Leave the first comment!</p>
                                                    )}

                                                    {/* Leave a Comment Box */}
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <input
                                                            type="text"
                                                            value={replyText}
                                                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleAddComment(post.id);
                                                            }}
                                                            placeholder="Write a comment..."
                                                            className="flex-1 text-xs p-1.5 border border-gray-300 rounded bg-white focus:outline-none focus:border-[#003399]"
                                                        />
                                                        <button
                                                            onClick={() => handleAddComment(post.id)}
                                                            disabled={!replyText.trim()}
                                                            className="px-3 py-1.5 bg-[#003399] hover:bg-[#002266] text-white font-bold text-xs rounded disabled:opacity-50 transition"
                                                        >
                                                            Reply
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </article>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </main>
            )}

            {/* ==================== TAB 2: CLASSIC MYSPACE PROFILE ==================== */}
            {activeTab === 'profile' && (
                <main className="max-w-5xl mx-auto p-4 flex flex-col md:flex-row gap-6">
                    <aside className="w-full md:w-1/3">
                        <h2 className="text-xl font-bold mb-2">{activeArtist?.name}</h2>
                        <img src={activeArtist?.image} alt={activeArtist?.name} className="w-full max-w-[200px] border border-gray-400 mb-2" />
                        <p className="text-sm font-semibold">"{activeArtist?.name} is in your extended network"</p>
                        
                        {mySpaceData?.mood && <p className="text-xs font-bold mt-2">Mood: <span className="font-normal">{mySpaceData.mood}</span></p>}
                        <p className="text-xs font-bold mt-1">Profile Views: <span className="font-normal">{formatNumber(mySpaceData?.profileViews || 0)}</span></p>

                        <button onClick={() => setIsEditingProfile(true)} className="mt-2 text-xs bg-gray-200 border border-gray-400 px-2 py-1 hover:bg-gray-300">Edit Profile</button>
                        
                        <div className="bg-white border text-sm mt-4 p-2 shadow-sm flex items-center gap-4">
                             <div className="w-16 h-16 bg-gray-200 border border-gray-400 flex items-center justify-center">
                                 {profileSong ? <img src={profileSong.coverArt} className="w-full h-full object-cover" /> : <PlayIcon className="w-8 h-8 text-gray-400" />}
                             </div>
                             <div>
                                 <p className="font-bold text-[#003399]">{profileSong ? profileSong.title : 'No Profile Song'}</p>
                                 <p className="text-xs">{activeArtist?.name}</p>
                             </div>
                        </div>

                        <div className="bg-white border border-[#003399] mt-4 p-2">
                            <h3 className="bg-[#6699cc] text-white p-1 text-sm font-bold">Contacting {activeArtist?.name}</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs text-blue-800 mt-2">
                                <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-1 hover:underline"><UsersIcon className="w-3 h-3"/> Add to Friends</a>
                                <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-1 hover:underline"><UsersIcon className="w-3 h-3"/> Send Message</a>
                                <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-1 hover:underline"><UsersIcon className="w-3 h-3"/> Add to Group</a>
                                <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-1 hover:underline"><UsersIcon className="w-3 h-3"/> Block User</a>
                            </div>
                        </div>

                        <div className="bg-white border border-[#003399] mt-4">
                            <h3 className="bg-[#6699cc] text-white p-1 text-sm font-bold">Interests</h3>
                            <div className="p-2 text-xs">
                                <p className="font-bold text-[#6699cc]">General</p>
                                <p className="mb-2 whitespace-pre-wrap">{mySpaceData?.generalInterests || 'None specified.'}</p>
                                <p className="font-bold text-[#6699cc]">Music</p>
                                <p className="whitespace-pre-wrap">{mySpaceData?.musicInterests || 'None specified.'}</p>
                            </div>
                        </div>
                    </aside>

                    <section className="w-full md:w-2/3 space-y-6">
                        <div className="flex gap-4 p-4 bg-white border border-gray-300 shadow-sm items-start">
                            <div className="flex-1 space-y-4">
                                 <div>
                                    <label className="text-xs font-bold text-gray-700">Update Profile Song (Boosts Streams & Hype)</label>
                                    <div className="flex gap-2 mt-1">
                                        <select value={selectedSongId} onChange={e => setSelectedSongId(e.target.value)} className="text-sm p-1 border border-gray-400 flex-1">
                                            <option value="">Select a released song...</option>
                                            {releasedSongs.map(s => (
                                                <option key={s.id} value={s.id}>{s.title}</option>
                                            ))}
                                        </select>
                                        <button onClick={handleUpdateProfileSong} disabled={!selectedSongId} className="px-3 py-1 bg-[#003399] hover:bg-[#002266] text-white font-bold text-xs rounded disabled:opacity-50">Set</button>
                                    </div>
                                 </div>

                                 <div>
                                    <label className="text-xs font-bold text-gray-700">Post Bulletin (Quick hype boost)</label>
                                    <div className="flex gap-2 mt-1">
                                        <input type="text" value={bulletinText} onChange={e => setBulletinText(e.target.value)} maxLength={100} className="text-sm p-1 border border-gray-400 flex-1" placeholder="What are you doing right now?" />
                                        <button onClick={handlePostBulletin} disabled={!bulletinText.trim()} className="px-3 py-1 bg-[#003399] hover:bg-[#002266] text-white font-bold text-xs rounded disabled:opacity-50">Post</button>
                                    </div>
                                 </div>

                                 <div>
                                     <label className="text-xs font-bold text-gray-700">Write Blog (Bigger hype & popularity boost)</label>
                                     <textarea value={blogText} onChange={e => setBlogText(e.target.value)} rows={3} className="text-sm p-1 border border-gray-400 w-full mt-1 resize-none" placeholder="Write to your fans..."></textarea>
                                     <button onClick={handlePostBlog} disabled={!blogText.trim()} className="w-full mt-2 px-3 py-1 bg-[#003399] hover:bg-[#002266] text-white font-bold text-xs rounded disabled:opacity-50">Publish Blog</button>
                                 </div>
                            </div>
                        </div>

                        {gameState.date.year < 2012 && (
                            <div className="flex gap-4 p-4 bg-white border border-gray-300 shadow-sm items-start">
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-700">Push to iTunes</label>
                                        <p className="text-[10px] text-zinc-500 mb-1">Direct your MySpace friends to buy your song on iTunes. (Can only push once per week)</p>
                                        <div className="flex gap-2">
                                            <select value={selectedSongId} onChange={e => setSelectedSongId(e.target.value)} className="text-sm p-1 border border-gray-400 flex-1">
                                                <option value="">Select a released song...</option>
                                                {releasedSongs.map(s => (
                                                    <option key={s.id} value={s.id}>{s.title}</option>
                                                ))}
                                            </select>
                                            <button 
                                                onClick={() => {
                                                    if (!selectedSongId) return;
                                                    dispatch({ type: 'POST_ON_MYSPACE', payload: { type: 'push', songId: selectedSongId, content: `Buy ${releasedSongs.find(s=>s.id===selectedSongId)?.title || 'my new song'} on iTunes!` } });
                                                    setSelectedSongId('');
                                                }} 
                                                disabled={!selectedSongId || (activeData?.lastPushToItunesWeek === gameState.date.year * 52 + gameState.date.week)} 
                                                className="px-3 py-1 bg-[#003399] hover:bg-[#002266] text-white font-bold text-xs rounded disabled:opacity-50 tracking-wider">
                                                PUSH TO ITUNES
                                            </button>
                                        </div>
                                        {activeData?.lastPushToItunesWeek === gameState.date.year * 52 + gameState.date.week && (
                                            <p className="text-xs text-red-500 mt-1">You already pushed a song to iTunes this week.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white border border-[#003399]">
                            <h3 className="bg-[#ffcc99] text-[#cc6600] p-1 text-sm font-bold mb-2">MySpace Blog</h3>
                            <div className="p-4 space-y-4">
                                {mySpaceData?.blogPosts && mySpaceData.blogPosts.length > 0 ? (
                                    mySpaceData.blogPosts.map((post, idx) => (
                                        <div key={idx} className="mb-4 border-b border-gray-200 pb-2">
                                            <h4 className="font-bold text-base text-[#003399]">{post.title}</h4>
                                            <p className="text-[10px] text-gray-500 mb-2">Posted Week {post.week}, {post.year}</p>
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No blog posts yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-[#003399]">
                            <h3 className="bg-[#ffcc99] text-[#cc6600] p-1 text-sm font-bold mb-2">Recent Bulletins</h3>
                            <div className="p-4 space-y-2">
                                 {mySpaceData?.bulletins && mySpaceData.bulletins.length > 0 ? (
                                    mySpaceData.bulletins.map((bull, idx) => (
                                        <p key={idx} className="text-sm text-gray-800 border-b border-gray-100 pb-1">
                                            <span className="text-[#003399] font-bold mr-2">Week {bull.week}:</span>
                                            {bull.content}
                                        </p>
                                    ))
                                 ) : (
                                     <p className="text-sm text-gray-500">No bulletins posted.</p>
                                 )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-[#ff6600] text-lg font-bold mb-2">{activeArtist?.name}'s Friend Space</h3>
                            <p className="font-bold text-sm mb-2">{activeArtist?.name} has <span className="text-[#ff0000]">{Math.floor((activeData?.popularity || 10) * 1000).toLocaleString()}</span> friends.</p>
                            
                            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                                {top8FriendsList.map(friend => (
                                    <div key={friend.id} className="text-center">
                                        <h4 className="text-xs font-bold text-[#003399] truncate">{friend.name}</h4>
                                        <div className="bg-white shadow aspect-square mt-1 border border-gray-300 flex items-center justify-center p-1">
                                            <img src={friend.image} alt={friend.name} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>
            )}

            {/* Profile Editing Modal */}
            {isEditingProfile && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white max-w-2xl w-full p-4 border-2 border-[#003399] max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                            <h2 className="text-xl font-bold text-[#003399]">Edit Profile</h2>
                            <button onClick={() => setIsEditingProfile(false)} className="text-gray-500 hover:text-black">X</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold">Mood</label>
                                <input type="text" value={editMood} onChange={e => setEditMood(e.target.value)} className="w-full border border-gray-300 p-1 text-sm" placeholder="e.g. happy, excited, working..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold">General Interests</label>
                                <textarea value={editGeneralInterests} onChange={e => setEditGeneralInterests(e.target.value)} rows={3} className="w-full border border-gray-300 p-1 text-sm"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold">Music Interests</label>
                                <textarea value={editMusicInterests} onChange={e => setEditMusicInterests(e.target.value)} rows={3} className="w-full border border-gray-300 p-1 text-sm"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold">Select Top 8 Friends ({editTop8Friends.length}/8)</label>
                                <input type="text" placeholder="Search friends..." value={friendSearch} onChange={e => setFriendSearch(e.target.value)} className="w-full border border-gray-300 p-1 text-sm mb-2" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-300 p-2">
                                    {filteredPotentialFriends.map(friend => {
                                        const isSelected = editTop8Friends.some(f => f.id === friend.id);
                                        return (
                                            <div 
                                                key={friend.id} 
                                                onClick={() => toggleTop8Friend(friend)}
                                                className={`cursor-pointer border p-1 text-center text-xs flex flex-col items-center gap-1 ${isSelected ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-transparent hover:bg-gray-200'}`}
                                            >
                                                <img src={friend.image} className="w-10 h-10 object-cover border border-gray-400" />
                                                <span className="truncate w-full">{friend.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setIsEditingProfile(false)} className="px-4 py-1 border border-gray-400 bg-gray-200 text-sm hover:bg-gray-300">Cancel</button>
                            <button onClick={handleSaveProfile} className="px-4 py-1 bg-[#003399] text-white font-bold text-sm hover:bg-blue-800">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MySpaceView;
