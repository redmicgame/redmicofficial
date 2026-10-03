import React, { useState, useRef, useEffect } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ImageIcon from './icons/ImageIcon';
import VideoIcon from './icons/VideoIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import DotsVerticalIcon from './icons/DotsVerticalIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import { InstagramPost, InstagramReel, InstagramChannelMessage } from '../types';
import { INSTAGRAM_CHANNEL_EMOJIS } from '../utils/instagramChannel';

const VerifiedBadge = () => (
    <svg aria-label="Verified" className="inline-block ml-1" fill="#0095F6" height="13" viewBox="0 0 40 40" width="13">
        <title>Verified</title>
        <path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fillRule="evenodd"></path>
    </svg>
);

const AnimatedReactionPill: React.FC<{
    reaction: import('../types').InstagramChannelReaction;
    sentAt?: number;
    durationMs?: number;
    isLiveGrowing?: boolean;
    onReact: () => void;
    onComplete?: () => void;
}> = ({ reaction, sentAt, durationMs, isLiveGrowing, onReact, onComplete }) => {
    const target = reaction.targetCount || reaction.count;
    const duration = durationMs || 1800000; // default 30 min (1,800,000 ms)
    const effectiveSentAt = sentAt || Date.now();

    const calculateCurrent = () => {
        if (!isLiveGrowing || target <= 1) return target;
        const elapsed = Math.max(0, Date.now() - effectiveSentAt);
        const progress = Math.min(1, elapsed / duration);
        if (progress >= 1) return target;

        // Steady linear reaction growth scaled across the duration (e.g. 30 min for 10k members) without extra effects
        return Math.max(1, Math.min(target, Math.floor(1 + (target - 1) * progress)));
    };

    const [displayCount, setDisplayCount] = useState<number>(calculateCurrent);

    useEffect(() => {
        if (!isLiveGrowing || target <= 1) {
            setDisplayCount(target);
            return;
        }

        const tick = () => {
            const current = calculateCurrent();
            setDisplayCount(current);
            if (current >= target) {
                if (onComplete) onComplete();
            }
        };

        tick();

        // Update interval: every 1 second so you see numbers move live smoothly and steadily
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [isLiveGrowing, target, effectiveSentAt, duration]);

    return (
        <button
            onClick={onReact}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                reaction.userReacted
                    ? 'bg-blue-600/30 border border-blue-500 text-blue-300 font-semibold'
                    : 'bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-zinc-300'
            }`}
            title={`${formatNumber(displayCount)} reactions`}
        >
            <span>{reaction.emoji}</span>
            <span className="text-[11px] font-medium">{formatNumber(displayCount)}</span>
        </button>
    );
};

interface InstagramChannelViewProps {
    onBack: () => void;
    onViewPost?: (post: InstagramPost) => void;
    onViewReel?: (reel: InstagramReel) => void;
}

export const InstagramChannelView: React.FC<InstagramChannelViewProps> = ({ onBack, onViewPost, onViewReel }) => {
    const { activeArtist, activeArtistData, dispatch } = useGame();
    const [inputText, setInputText] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
    const [selectedReel, setSelectedReel] = useState<InstagramReel | null>(null);

    // Modals
    const [isSelectingPost, setIsSelectingPost] = useState(false);
    const [isSelectingReel, setIsSelectingReel] = useState(false);
    const [isEditingChannel, setIsEditingChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [activeEmojiMenuMsgId, setActiveEmojiMenuMsgId] = useState<string | null>(null);
    const [activeMsgOptionsId, setActiveMsgOptionsId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    if (!activeArtist || !activeArtistData) return null;

    const channelName = activeArtistData.instagramCommunityName || 'Broadcast Channel';
    const followers = activeArtistData.instagramFollowers || 0;
    const popularity = activeArtistData.popularity || 0;
    const isVerified = followers >= 100000 || popularity >= 50 || !!activeArtistData.instagramVerified;
    const username = activeArtist.name.replace(/\s/g, '').toLowerCase();
    const members = activeArtistData.instagramCommunityMembers || Math.max(30, Math.floor(followers * 0.05) || 50);
    const messages = activeArtistData.instagramChannelMessages || [];
    const myPosts = activeArtistData.instagramPosts || [];
    const myReels = activeArtistData.instagramReels || [];
    const artistAvatar = activeArtist.image || activeArtistData.avatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=3470";

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedPhoto(reader.result as string);
                setSelectedPost(null);
                setSelectedReel(null);
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = () => {
        if (!inputText.trim() && !selectedPhoto && !selectedPost && !selectedReel) return;

        dispatch({
            type: 'SEND_INSTAGRAM_CHANNEL_MESSAGE',
            payload: {
                text: inputText.trim() || undefined,
                imageUrl: selectedPhoto || undefined,
                post: selectedPost || undefined,
                reel: selectedReel || undefined,
            },
        });

        setInputText('');
        setSelectedPhoto(null);
        setSelectedPost(null);
        setSelectedReel(null);
    };

    const handleReact = (messageId: string, emoji: string) => {
        dispatch({
            type: 'REACT_INSTAGRAM_CHANNEL_MESSAGE',
            payload: { messageId, emoji },
        });
        setActiveEmojiMenuMsgId(null);
    };

    const handleDeleteMessage = (messageId: string) => {
        dispatch({
            type: 'DELETE_INSTAGRAM_CHANNEL_MESSAGE',
            payload: { messageId },
        });
        setActiveMsgOptionsId(null);
    };

    const handleSaveChannelName = () => {
        if (!newChannelName.trim()) return;
        dispatch({
            type: 'EDIT_INSTAGRAM_COMMUNITY',
            payload: { name: newChannelName.trim() },
        });
        setIsEditingChannel(false);
    };

    return (
        <div className="h-full flex flex-col bg-black text-white relative font-sans max-w-[400px] border-x border-zinc-900 mx-auto select-none">
            {/* Header: Displays Instagram profile picture, username & channel name */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 h-14 bg-zinc-950/95 border-b border-zinc-800/80 backdrop-blur z-20 sticky top-0">
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <button
                        onClick={onBack}
                        className="text-white hover:text-zinc-300 transition-colors p-1 -ml-1 rounded-full hover:bg-zinc-800/60"
                        title="Back"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>

                    <div className="relative shrink-0">
                        <img
                            src={artistAvatar}
                            alt={activeArtist.name}
                            className="w-9 h-9 rounded-full object-cover border border-zinc-700 shadow-sm"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-[8px] border border-black">
                            💬
                        </div>
                    </div>

                    <div className="flex flex-col truncate">
                        <div className="flex items-center gap-1 leading-tight">
                            <span className="font-bold text-sm text-white truncate">{channelName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 leading-tight">
                            <span className="truncate">@{username}</span>
                            {isVerified && <VerifiedBadge />}
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400 font-medium shrink-0">{formatNumber(members)} members</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => setShowInfoModal(true)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
                        title="Channel Info"
                    >
                        <InformationCircleIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 hide-scrollbar">
                {/* Channel Top Banner */}
                <div className="pt-4 pb-2 flex flex-col items-center text-center px-4 border-b border-zinc-900/80">
                    <div className="relative mb-2">
                        <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400">
                            <img
                                src={artistAvatar}
                                alt={activeArtist.name}
                                className="w-full h-full rounded-full object-cover border-2 border-black"
                            />
                        </div>
                    </div>
                    <h2 className="text-base font-bold text-white flex items-center gap-1">
                        {channelName}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                        @{username} {isVerified && <VerifiedBadge />}
                    </p>
                    <div className="mt-2 bg-zinc-900/90 border border-zinc-800/80 rounded-full px-3 py-1 text-[11px] text-zinc-300 font-medium">
                        Broadcast Channel • {formatNumber(members)} members
                    </div>
                    <p className="text-[11px] text-zinc-500 max-w-xs mt-2 leading-relaxed">
                        Broadcast to your fans. Fans can't message back, but they react to your updates with emojis!
                    </p>
                </div>

                {/* Messages List */}
                {messages.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-xl mb-3 border border-zinc-800">
                            ✨
                        </div>
                        <p className="text-sm font-semibold text-zinc-300 mb-1">Your channel is live!</p>
                        <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                            Text your fans, send pictures, share your Instagram posts and reels. Fans will react with emojis!
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMenuOpen = activeEmojiMenuMsgId === msg.id;
                        const isOptionsOpen = activeMsgOptionsId === msg.id;

                        return (
                            <div key={msg.id} className="flex flex-col items-end group relative">
                                <div className="flex items-end gap-2 max-w-[90%]">
                                    <div className="relative flex flex-col items-end">
                                        {/* Message Bubble */}
                                        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/60 text-white rounded-2xl rounded-br-sm p-3 shadow-md space-y-2">
                                            {/* Shared Picture */}
                                            {msg.imageUrl && (
                                                <div
                                                    className="rounded-xl overflow-hidden cursor-pointer border border-zinc-700/60 max-h-64 bg-zinc-950"
                                                    onClick={() => setZoomedImage(msg.imageUrl || null)}
                                                >
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Broadcast attachment"
                                                        className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                                                    />
                                                </div>
                                            )}

                                            {/* Shared Instagram Post */}
                                            {msg.post && (
                                                <div
                                                    onClick={() => onViewPost ? onViewPost(msg.post!) : null}
                                                    className="bg-black rounded-xl border border-zinc-700/70 overflow-hidden cursor-pointer hover:border-zinc-500 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2 p-2 bg-zinc-900/90 border-b border-zinc-800">
                                                        <img
                                                            src={artistAvatar}
                                                            className="w-5 h-5 rounded-full object-cover border border-zinc-700"
                                                        />
                                                        <span className="text-xs font-semibold truncate flex items-center">
                                                            {username} {isVerified && <VerifiedBadge />}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-400 ml-auto bg-zinc-800 px-1.5 py-0.5 rounded font-medium">
                                                            POST
                                                        </span>
                                                    </div>
                                                    <div className="aspect-square w-full max-h-52 bg-zinc-950 overflow-hidden">
                                                        <img
                                                            src={msg.post.imageUrls?.[0] || ''}
                                                            alt="Instagram post thumbnail"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="p-2 space-y-1 bg-zinc-950">
                                                        {msg.post.caption && (
                                                            <p className="text-xs text-zinc-300 line-clamp-2">
                                                                <span className="font-semibold text-white mr-1.5">{username}</span>
                                                                {msg.post.caption}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-0.5">
                                                            <span>❤️ {formatNumber(msg.post.likes)}</span>
                                                            <span>💬 {formatNumber(msg.post.comments)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Shared Instagram Reel */}
                                            {msg.reel && (
                                                <div
                                                    onClick={() => onViewReel ? onViewReel(msg.reel!) : null}
                                                    className="bg-black rounded-xl border border-zinc-700/70 overflow-hidden cursor-pointer hover:border-zinc-500 transition-colors"
                                                >
                                                    <div className="relative aspect-[9/14] w-48 max-h-60 bg-zinc-950 overflow-hidden mx-auto">
                                                        <img
                                                            src={msg.reel.videoUrl}
                                                            alt="Reel thumbnail"
                                                            className="w-full h-full object-cover opacity-85"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center border border-white/20 shadow-lg">
                                                                <svg aria-label="Play" fill="currentColor" height="18" viewBox="0 0 24 24" width="18" className="text-white ml-0.5"><path d="M16.394 12.001 8.542 16.59V7.41l7.852 4.591ZM21.996 12A10.005 10.005 0 1 1 12 1.996 10.016 10.016 0 0 1 21.996 12Z"></path></svg>
                                                            </div>
                                                        </div>
                                                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-semibold text-white flex items-center gap-1">
                                                            <span>🎬 REEL</span>
                                                        </div>
                                                        <div className="absolute bottom-2 left-2 right-2 text-white">
                                                            <p className="text-[11px] font-medium line-clamp-1 drop-shadow">{msg.reel.caption}</p>
                                                            <p className="text-[10px] text-zinc-300 drop-shadow">▶ {formatNumber(msg.reel.views)} views</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Text Content */}
                                            {msg.text && (
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-normal">
                                                    {msg.text}
                                                </p>
                                            )}

                                            {/* Time & Options */}
                                            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/60 mt-1">
                                                <span>{msg.createdAt}</span>
                                                <button
                                                    onClick={() => setActiveMsgOptionsId(isOptionsOpen ? null : msg.id)}
                                                    className="opacity-70 hover:opacity-100 p-0.5 rounded hover:bg-zinc-800"
                                                    title="Options"
                                                >
                                                    <DotsVerticalIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Message Options Dropdown */}
                                        {isOptionsOpen && (
                                            <div className="absolute top-10 right-2 z-30 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 text-xs w-32">
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-zinc-800 flex items-center gap-2"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Reactions Row (Fan Emoji Reactions) */}
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 justify-end">
                                            {msg.reactions && msg.reactions.map((r) => (
                                                <AnimatedReactionPill
                                                    key={r.emoji}
                                                    reaction={r}
                                                    sentAt={msg.sentAt}
                                                    durationMs={msg.durationMs}
                                                    isLiveGrowing={msg.isLiveGrowing}
                                                    onReact={() => handleReact(msg.id, r.emoji)}
                                                    onComplete={() => dispatch({ type: 'FINISH_INSTAGRAM_CHANNEL_REACTION_GROWTH', payload: { messageId: msg.id } })}
                                                />
                                            ))}

                                            {/* Add Reaction Button */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setActiveEmojiMenuMsgId(isMenuOpen ? null : msg.id)}
                                                    className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition-colors"
                                                    title="React"
                                                >
                                                    +
                                                </button>

                                                {/* Emoji Picker Popup */}
                                                {isMenuOpen && (
                                                    <div className="absolute bottom-8 right-0 z-30 bg-zinc-900 border border-zinc-700/80 rounded-full shadow-2xl p-1.5 flex items-center gap-1 backdrop-blur-md">
                                                        {INSTAGRAM_CHANNEL_EMOJIS.map((emoji) => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => handleReact(msg.id, emoji)}
                                                                className="w-7 h-7 rounded-full hover:bg-zinc-800 flex items-center justify-center text-base hover:scale-125 transition-transform"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Bottom Composer Area */}
            <div className="flex-shrink-0 bg-zinc-950 border-t border-zinc-900 p-2.5 space-y-2">
                {/* Banner: Fans can't message back */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 font-medium py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Broadcasting to {formatNumber(members)} fans • Fans can only react</span>
                </div>

                {/* Pending Media Attachment Preview */}
                {(selectedPhoto || selectedPost || selectedReel) && (
                    <div className="relative inline-block bg-zinc-900 border border-zinc-800 rounded-xl p-2 max-w-full">
                        <button
                            onClick={() => {
                                setSelectedPhoto(null);
                                setSelectedPost(null);
                                setSelectedReel(null);
                            }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-zinc-800 border border-zinc-700 rounded-full text-white flex items-center justify-center text-xs hover:bg-zinc-700 shadow"
                        >
                            ✕
                        </button>

                        {selectedPhoto && (
                            <div className="flex items-center gap-2">
                                <img
                                    src={selectedPhoto}
                                    alt="Selected"
                                    className="w-14 h-14 rounded-lg object-cover border border-zinc-800"
                                />
                                <div className="text-xs text-zinc-300">
                                    <p className="font-semibold text-white">Photo attached</p>
                                    <p className="text-[10px] text-zinc-500">Ready to broadcast</p>
                                </div>
                            </div>
                        )}

                        {selectedPost && (
                            <div className="flex items-center gap-2">
                                <img
                                    src={selectedPost.imageUrls?.[0] || ''}
                                    alt="Post"
                                    className="w-14 h-14 rounded-lg object-cover border border-zinc-800"
                                />
                                <div className="text-xs text-zinc-300">
                                    <p className="font-semibold text-white">Instagram Post attached</p>
                                    <p className="text-[10px] text-zinc-400 line-clamp-1">{selectedPost.caption || 'No caption'}</p>
                                </div>
                            </div>
                        )}

                        {selectedReel && (
                            <div className="flex items-center gap-2">
                                <img
                                    src={selectedReel.videoUrl}
                                    alt="Reel"
                                    className="w-10 h-14 rounded-lg object-cover border border-zinc-800"
                                />
                                <div className="text-xs text-zinc-300">
                                    <p className="font-semibold text-white">Instagram Reel attached</p>
                                    <p className="text-[10px] text-zinc-400 line-clamp-1">{selectedReel.caption || 'No caption'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Input Controls */}
                <div className="flex items-center gap-1.5">
                    {/* Hidden File Input for Picture Upload */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    {/* Send Picture Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-2 rounded-full transition-colors ${
                            selectedPhoto ? 'bg-purple-600/30 text-purple-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                        title="Send picture"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>

                    {/* Share Post Button */}
                    <button
                        onClick={() => setIsSelectingPost(true)}
                        className={`p-2 rounded-full transition-colors ${
                            selectedPost ? 'bg-blue-600/30 text-blue-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                        title="Share Instagram Post"
                    >
                        <svg aria-label="Posts" fill="currentColor" height="20" viewBox="0 0 24 24" width="20"><rect fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" width="18" x="3" y="3"></rect><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="9.015" x2="9.015" y1="3" y2="21"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="14.985" x2="14.985" y1="3" y2="21"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21" x2="3" y1="9.015" y2="9.015"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21" x2="3" y1="14.985" y2="14.985"></line></svg>
                    </button>

                    {/* Share Reel Button */}
                    <button
                        onClick={() => setIsSelectingReel(true)}
                        className={`p-2 rounded-full transition-colors ${
                            selectedReel ? 'bg-pink-600/30 text-pink-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                        title="Share Instagram Reel"
                    >
                        <svg aria-label="Reels" fill="currentColor" height="20" viewBox="0 0 24 24" width="20"><line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="2.049" x2="21.95" y1="7.002" y2="7.002"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="9.725" x2="13.764" y1="17.018" y2="17.018"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="11.744" x2="11.744" y1="15" y2="19.036"></line><rect fill="none" height="20" rx="3.003" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" width="20" x="2" y="2"></rect></svg>
                    </button>

                    {/* Text Input */}
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Message your channel..."
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                    />

                    {/* Send Button */}
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() && !selectedPhoto && !selectedPost && !selectedReel}
                        className="w-9 h-9 rounded-full bg-[#0095F6] disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center font-bold transition-colors hover:bg-blue-500 shrink-0"
                        title="Send broadcast"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Modal: Select Instagram Post */}
            {isSelectingPost && (
                <div className="absolute inset-0 bg-black/85 z-40 flex flex-col p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <h3 className="font-bold text-sm text-white">Share a Post to Channel</h3>
                        <button
                            onClick={() => setIsSelectingPost(false)}
                            className="text-zinc-400 hover:text-white text-sm font-semibold px-2 py-1"
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pt-3 hide-scrollbar">
                        {myPosts.length === 0 ? (
                            <div className="py-16 text-center text-zinc-500 text-xs">
                                <p>You haven't posted any photos yet.</p>
                                <p className="mt-1">Create a post on your profile to share it here!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {myPosts.map((post) => (
                                    <div
                                        key={post.id}
                                        onClick={() => {
                                            setSelectedPost(post);
                                            setSelectedPhoto(null);
                                            setSelectedReel(null);
                                            setIsSelectingPost(false);
                                        }}
                                        className="aspect-square bg-zinc-900 rounded-lg overflow-hidden relative cursor-pointer border border-zinc-800 hover:border-blue-500 group transition-all"
                                    >
                                        <img
                                            src={post.imageUrls?.[0] || ''}
                                            alt={post.caption}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                                            Select
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Select Instagram Reel */}
            {isSelectingReel && (
                <div className="absolute inset-0 bg-black/85 z-40 flex flex-col p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <h3 className="font-bold text-sm text-white">Share a Reel to Channel</h3>
                        <button
                            onClick={() => setIsSelectingReel(false)}
                            className="text-zinc-400 hover:text-white text-sm font-semibold px-2 py-1"
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pt-3 hide-scrollbar">
                        {myReels.length === 0 ? (
                            <div className="py-16 text-center text-zinc-500 text-xs">
                                <p>You haven't posted any reels yet.</p>
                                <p className="mt-1">Create a reel on your profile to share it here!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {myReels.map((reel) => (
                                    <div
                                        key={reel.id}
                                        onClick={() => {
                                            setSelectedReel(reel);
                                            setSelectedPhoto(null);
                                            setSelectedPost(null);
                                            setIsSelectingReel(false);
                                        }}
                                        className="aspect-[9/16] bg-zinc-900 rounded-lg overflow-hidden relative cursor-pointer border border-zinc-800 hover:border-pink-500 group transition-all"
                                    >
                                        <img
                                            src={reel.videoUrl}
                                            alt={reel.caption}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute bottom-1 left-1 flex items-center gap-1 text-[10px] text-white font-semibold drop-shadow">
                                            ▶ {formatNumber(reel.views)}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                                            Select
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Fullscreen Photo Zoom */}
            {zoomedImage && (
                <div
                    className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4"
                    onClick={() => setZoomedImage(null)}
                >
                    <button
                        onClick={() => setZoomedImage(null)}
                        className="absolute top-4 right-4 text-white text-lg font-bold bg-zinc-800/80 w-8 h-8 rounded-full flex items-center justify-center"
                    >
                        ✕
                    </button>
                    <img
                        src={zoomedImage}
                        alt="Zoomed picture"
                        className="max-w-full max-h-[85%] rounded-xl object-contain shadow-2xl"
                    />
                </div>
            )}

            {/* Modal: Channel Info & Settings */}
            {showInfoModal && (
                <div className="absolute inset-0 bg-black/85 z-40 flex flex-col p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <h3 className="font-bold text-sm text-white">Channel Details</h3>
                        <button
                            onClick={() => setShowInfoModal(false)}
                            className="text-zinc-400 hover:text-white text-sm font-semibold"
                        >
                            Done
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4 space-y-4">
                        <div className="flex flex-col items-center text-center pb-4 border-b border-zinc-800">
                            <img
                                src={artistAvatar}
                                alt={activeArtist.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700 mb-2"
                            />
                            <h4 className="font-bold text-base text-white">{channelName}</h4>
                            <p className="text-xs text-zinc-400">@{username} {isVerified && <VerifiedBadge />}</p>
                            <span className="mt-2 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1 rounded-full">
                                {formatNumber(members)} members
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-xs space-y-1.5">
                                <span className="font-semibold text-white block">About Broadcast Channels</span>
                                <p className="text-zinc-400 leading-relaxed">
                                    Broadcast channels are a one-way messaging tool for creators to engage directly with their followers.
                                    Followers cannot send messages, but they can react with emojis and view all content you share.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setNewChannelName(channelName);
                                    setIsEditingChannel(true);
                                    setShowInfoModal(false);
                                }}
                                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors"
                            >
                                Edit Channel Name
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Edit Channel Name */}
            {isEditingChannel && (
                <div className="absolute inset-0 bg-black/90 z-50 flex flex-col p-5">
                    <h3 className="font-bold text-base text-white mb-2">Edit Channel Name</h3>
                    <p className="text-xs text-zinc-400 mb-4">Update the public name of your broadcast channel.</p>

                    <input
                        type="text"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="Channel Name"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white mb-6 focus:outline-none focus:border-blue-500"
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsEditingChannel(false)}
                            className="flex-1 py-2 font-semibold text-white bg-zinc-800 rounded-lg text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveChannelName}
                            disabled={!newChannelName.trim()}
                            className="flex-1 py-2 font-semibold text-white bg-[#0095F6] disabled:opacity-50 rounded-lg text-sm"
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstagramChannelView;
