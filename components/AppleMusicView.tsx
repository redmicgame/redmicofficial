import React, { useState, useMemo, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { LABELS, getArtistImage } from '../constants';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import StarIcon from './icons/StarIcon';
import DotsHorizontalIcon from './icons/DotsHorizontalIcon';
import PlayRedCircleIcon from './icons/PlayRedCircleIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { Song, Release, Video, GameDate, Tour } from '../types';
import PlusIcon from './icons/PlusIcon';
import LosslessIcon from './icons/LosslessIcon';
import AppleMusicBrowseView from './AppleMusicBrowseView';

const formatDateApple = (gameDate: GameDate) => {
    const date = new Date(gameDate.year, 0, (gameDate.week - 1) * 7 + 1);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
};

const AppleMusicReleaseDetailView: React.FC<{ releaseId: string; onBack: () => void; onSelectRelease: (id: string) => void }> = ({ releaseId, onBack, onSelectRelease }) => {
    const { activeArtist, activeArtistData } = useGame();
    const [isReviewExpanded, setIsReviewExpanded] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const { releases, songs, videos, labelSubmissions } = activeArtistData!;
    const release = releases.find(r => r.id === releaseId) || labelSubmissions.find(s => s.release.id === releaseId)?.release;

    const isUpcoming = labelSubmissions.some(s => s.release.id === releaseId);

    const otherVersions = useMemo(() => {
        if (!release) return [];
        if (release.type === 'Album') {
            return releases.filter(r => r.standardEditionId === release.id);
        }
        if (release.type === 'Album (Deluxe)' && release.standardEditionId) {
            const standard = releases.find(r => r.id === release.standardEditionId);
            return standard ? [standard] : [];
        }
        return [];
    }, [release, releases]);
    
    const relatedVideos = useMemo(() => {
        if (!release) return [];
        const songIds = new Set(release.songIds);
        return videos.filter(v => songIds.has(v.songId));
    }, [release, videos]);

    if (!release || !activeArtist) {
        return (
            <div className="bg-black text-white h-full overflow-y-auto pb-24 p-4">
                <p>Release not found.</p>
                <button onClick={onBack} className="text-rose-400">Back</button>
            </div>
        );
    }
    
    const releaseSongs = release.songIds.map(id => songs.find(s => s.id === id)).filter((s): s is Song => !!s && s.isAvailableOnStreaming === true);
    const totalDuration = Math.round(releaseSongs.reduce((sum, s) => sum + s.duration, 0) / 60);

    const isSingle = release.type === 'Single';
    const singleSong = isSingle ? releaseSongs[0] : null;

    const artistDisplay = (isSingle && singleSong && (singleSong.collaboration || (singleSong.features && singleSong.features.length > 0)))
        ? [activeArtist.name, ...(singleSong.features || []), ...(singleSong.collaboration ? [singleSong.collaboration.artistName] : [])].join(" & ")
        : activeArtist.name;
    
    const releaseTitle = (isSingle && singleSong && singleSong.collaboration)
        ? release.title.replace(new RegExp(` \\(feat\\. ${singleSong.collaboration.artistName}\\)`), '')
        : release.title;

    let distroString = "";
    if (release.releasingLabel) {
        const customLabel = activeArtistData.customLabels?.find(l => l.id === release.releasingLabel!.id);
        if (customLabel) {
             if (customLabel.exclusiveLicenseId) {
                  const major = LABELS.find(l => l.id === customLabel.exclusiveLicenseId);
                  if (major) distroString = `Exclusive License to ${major.name}`;
             } else if (customLabel.dealWithMajorId) {
                  const major = LABELS.find(l => l.id === customLabel.dealWithMajorId);
                  if (major) distroString = `A ${major.name} Release`;
             }
        }
    }

    const pageBgColor = activeArtistData.appleMusicBgColor || '#000000';

    return (
        <>
            {isReviewExpanded && release.review && (
                <div className="fixed inset-0 bg-black/90 z-50 p-4 flex flex-col">
                    <div className="flex justify-between items-center pb-4">
                        <h2 className="font-bold text-lg">{releaseTitle}</h2>
                        <button onClick={() => setIsReviewExpanded(false)} className="font-bold text-rose-400">Done</button>
                    </div>
                    <div className="flex-grow overflow-y-auto text-zinc-300 leading-relaxed text-lg">
                        {release.review.text}
                    </div>
                </div>
            )}
            {isDescriptionExpanded && (
                <div className="fixed inset-0 bg-black/90 z-50 p-4 flex flex-col">
                    <div className="flex justify-between items-center pb-4">
                        <h2 className="font-bold text-lg">{releaseTitle}</h2>
                        <button onClick={() => setIsDescriptionExpanded(false)} className="font-bold text-rose-400">Done</button>
                    </div>
                    <div className="flex-grow overflow-y-auto text-zinc-300 leading-relaxed text-lg">
                        {release.wikipediaSummary}
                    </div>
                </div>
            )}

            <div style={{ backgroundColor: pageBgColor }} className="text-white h-full overflow-y-auto pb-24 transition-colors">
                {(release.isAppleMusicExpandedCover && !isSingle) ? (
                    <div className="relative w-full aspect-square md:aspect-[4/3] group">
                        <img src={release.coverArt} alt={releaseTitle} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
                        <header className="absolute top-0 left-0 right-0 z-10 p-4 mt-8 flex justify-between items-center bg-transparent">
                            <button onClick={onBack} className="bg-black/30 p-1.5 rounded-full backdrop-blur-md"><ChevronLeftIcon className="w-6 h-6 text-white drop-shadow-md" /></button>
                            <div className="flex items-center gap-3">
                                <button className="bg-black/30 p-1.5 rounded-full backdrop-blur-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </button>
                                <button className="bg-black/30 p-1.5 rounded-full backdrop-blur-md"><DotsHorizontalIcon className="w-5 h-5 text-white drop-shadow-md" /></button>
                            </div>
                        </header>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-center pb-6">
                            {distroString && <p className="text-xs font-bold uppercase tracking-widest text-[#d60017] mb-2">{distroString}</p>}
                            <h2 className="text-3xl font-black drop-shadow-lg tracking-tight px-2">{releaseTitle}</h2>
                            <p className="text-xl font-medium mt-1 drop-shadow-md">{artistDisplay}</p>
                            <p className="text-xs text-white/80 uppercase mt-2 flex items-center justify-center gap-2 drop-shadow-md font-medium">
                                <span>{releaseSongs[0]?.genre || 'Pop'}</span>
                                <span>•</span>
                                <span>{release.releaseDate.year}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <LosslessIcon className="w-4 h-4 fill-white" /> Lossless
                                </span>
                            </p>
                            
                            <div className="flex gap-4 mt-6 justify-center items-center px-4">
                                <button className="bg-zinc-800/80 backdrop-blur-md hover:bg-zinc-700 transition-colors rounded-full w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3l4 4m0 0l-4 4m4-4H4m12 14l4-4m0 0l-4-4m4 4H4" />
                                    </svg>
                                </button>
                                <button className="bg-white hover:bg-zinc-200 transition-colors rounded-full flex-1 max-w-[200px] py-3 flex items-center justify-center gap-2 shadow-lg">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black"><path d="M7 6v12l10-6z" /></svg>
                                    <span className="font-bold text-black text-lg pb-0.5">Play</span>
                                </button>
                                <button className="bg-zinc-800/80 backdrop-blur-md hover:bg-zinc-700 transition-colors rounded-full w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                    <PlusIcon className="w-6 h-6 text-zinc-300" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <header className="sticky top-0 bg-black/60 backdrop-blur-md z-10 p-4 pt-8 flex justify-between items-center">
                            <button onClick={onBack}><ChevronLeftIcon className="w-7 h-7" /></button>
                            <h1 className="font-bold text-center truncate px-2">{releaseTitle}</h1>
                            <div className="flex items-center gap-4">
                                <button><PlusIcon className="w-6 h-6" /></button>
                                <button><DotsHorizontalIcon className="w-6 h-6" /></button>
                            </div>
                        </header>
                        <section className="text-center p-4">
                            {distroString && <p className="text-[10px] font-bold uppercase tracking-widest text-[#d60017] mb-3">{distroString}</p>}
                            <img src={release.coverArt} className="w-56 h-56 rounded-xl object-cover mx-auto shadow-2xl" />
                            <h2 className="text-2xl font-bold mt-4">{releaseTitle}</h2>
                            <p className="text-xl text-rose-400 font-semibold">{artistDisplay}</p>
                            <p className="text-sm text-zinc-400 uppercase mt-1 flex items-center justify-center gap-2">
                                <span>{releaseSongs[0]?.genre || 'Pop'}</span>
                                <span>•</span>
                                <span>{release.releaseDate.year}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <LosslessIcon className="w-5 h-5" /> Lossless
                                </span>
                            </p>
                            <div className="flex gap-4 mt-6 justify-center items-center px-4">
                                <button className="bg-zinc-800/80 backdrop-blur-md hover:bg-zinc-700 transition-colors rounded-full w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3l4 4m0 0l-4 4m4-4H4m12 14l4-4m0 0l-4-4m4 4H4" />
                                    </svg>
                                </button>
                                <button className="bg-white hover:bg-zinc-200 transition-colors rounded-full flex-1 max-w-[200px] py-3 flex items-center justify-center gap-2 shadow-lg">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black"><path d="M7 6v12l10-6z" /></svg>
                                    <span className="font-bold text-black text-lg pb-0.5">Play</span>
                                </button>
                                <button className="bg-zinc-800/80 backdrop-blur-md hover:bg-zinc-700 transition-colors rounded-full w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                    <PlusIcon className="w-6 h-6 text-zinc-300" />
                                </button>
                            </div>
                        </section>
                    </>
                )}

                <main className="p-4 space-y-8">
                    {(release.review || release.wikipediaSummary) && (
                        <section className="bg-zinc-900/60 backdrop-blur-sm p-4 rounded-xl border border-zinc-800/50">
                            <p className="text-zinc-300 leading-snug line-clamp-3">
                                {release.review ? release.review.text : release.wikipediaSummary}
                                <button onClick={() => release.review ? setIsReviewExpanded(true) : setIsDescriptionExpanded(true)} className="font-bold text-white ml-1">MORE</button>
                            </p>
                            {release.review && <p className="text-zinc-400 text-sm mt-2">Pitchfork • {release.review.score.toFixed(1)}</p>}
                        </section>
                    )}

                    <section className="divide-y divide-zinc-800/60 border-t border-b border-zinc-800/60 py-1">
                        {releaseSongs.map((song, index) => {
                            const isRevealed = release.isTracklistRevealed || (isUpcoming && labelSubmissions.find(s => s.release.id === releaseId)?.singlesToRelease?.some(s => s.songId === song.id));
                            const songTitle = isUpcoming && !isRevealed ? `Track ${index + 1}` : song.title.replace(/\s*\(feat\..*\)/i, '');
                            const artistForSong = isUpcoming && !isRevealed ? null : (song.collaboration
                                ? `${activeArtist.name} & ${song.collaboration.artistName}`
                                : null);

                            return (
                                <div key={song.id} className="flex items-center gap-3 py-3 px-1">
                                    <span className="w-5 text-zinc-400 font-medium text-base shrink-0">{index + 1}</span>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="font-semibold truncate text-white text-base">{songTitle}</p>
                                            {song.explicit && <span className="text-[10px] w-4 h-4 bg-zinc-300 text-black font-bold rounded-[2px] flex items-center justify-center shrink-0">E</span>}
                                        </div>
                                        {artistForSong && (
                                            <p className="text-xs text-zinc-400 truncate mt-0.5">{artistForSong}</p>
                                        )}
                                    </div>
                                    <button className="flex-shrink-0 p-1"><DotsHorizontalIcon className="w-5 h-5 text-zinc-400" /></button>
                                </div>
                            );
                        })}
                    </section>
                    
                    <section className="text-xs text-zinc-400 space-y-1">
                        <p>&copy; Apple Digital Master</p>
                        <p>{formatDateApple(release.releaseDate)}</p>
                        <p>{releaseSongs.length} Songs, {totalDuration} Minutes</p>
                        <p>&copy; {release.releaseDate.year} {(() => {
                            if (release.rightsOwnerLabelId && release.rightsSoldPercent && release.rightsSoldPercent > 50) {
                                const ownerLabel = LABELS.find(l => l.id === release.rightsOwnerLabelId);
                                return ownerLabel?.name || 'Unknown Label';
                            }
                            return release.releasingLabel ? release.releasingLabel.name : "Independent";
                        })()}</p>
                    </section>
                    
                    {otherVersions.length > 0 && <HorizontalSection title="Other Versions" items={otherVersions} onSelect={onSelectRelease} />}
                    {relatedVideos.length > 0 && <HorizontalSection title="Music Videos" items={relatedVideos} onSelect={() => {}} artistName={activeArtist.name} />}

                </main>
            </div>
        </>
    );
};

const HorizontalSection: React.FC<{title: string, items: (Release | Video)[], onSelect: (id: string) => void, artistName?: string}> = ({title, items, onSelect, artistName}) => {
    const { activeArtistData } = useGame();
    const isVideos = title === 'Music Videos';

    return (
         <section>
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-2xl font-bold flex items-center gap-1">
                    <span>{title}</span>
                    <ChevronRightIcon className="w-5 h-5 text-zinc-400 inline" />
                </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {items.map(item => {
                    const containerWidth = isVideos ? 'w-64' : 'w-36 sm:w-40';
                    const imageClass = isVideos ? 'w-full aspect-video rounded-xl object-cover shadow-lg' : 'w-36 h-36 sm:w-40 sm:h-40 rounded-xl object-cover shadow-lg';
                    
                    let isExplicit = false;
                    if (isVideos && 'songId' in item && activeArtistData) {
                        const song = activeArtistData.songs.find(s => s.id === (item as Video).songId);
                        isExplicit = song?.explicit ?? false;
                    } else if ('songIds' in item && activeArtistData) {
                        isExplicit = (item as Release).songIds.some(id => activeArtistData.songs.find(s => s.id === id)?.explicit);
                    }
                    
                    return (
                        <button key={item.id} onClick={() => 'type' in item && onSelect(item.id)} className={`${containerWidth} flex-shrink-0 text-left group`}>
                            <div className="relative overflow-hidden rounded-xl">
                                <img src={'coverArt' in item ? item.coverArt : item.thumbnail} className={`${imageClass} group-hover:scale-105 transition-transform duration-300`} alt={item.title} />
                            </div>
                            <div className="font-semibold truncate mt-2 flex items-center gap-1.5">
                                <span className="truncate">{item.title}</span>
                                {isExplicit && <span className="text-[10px] w-4 h-4 bg-zinc-700/80 text-zinc-300 font-bold rounded-sm flex items-center justify-center shrink-0">E</span>}
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">{isVideos ? artistName : ('releaseDate' in item && item.releaseDate.year)}</p>
                        </button>
                    );
                })}
            </div>
        </section>
     )
}

const AppleMusicView: React.FC = () => {
    const { dispatch, activeArtist, activeArtistData, gameState } = useGame();
    const [tab, setTab] = useState<'artist' | 'browse'>('artist');
    const [view, setView] = useState<'artistProfile' | 'releaseDetail'>('artistProfile');
    const [browseView, setBrowseView] = useState<'home' | 'topPlaylists' | 'topSongs' | 'topAlbums' | 'bestNewSongs' | 'topPreAdds' | 'playlistDetail'>('home');
    const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
    const [selectedBrowsePlaylist, setSelectedBrowsePlaylist] = useState<string | null>(null);

    const concertsRef = useRef<HTMLDivElement>(null);

    if (!activeArtist || !activeArtistData) {
        return (
            <div className="bg-black text-white h-full overflow-y-auto flex items-center justify-center pb-24">
                <p>Loading Apple Music...</p>
            </div>
        );
    }

    const scrollToConcerts = () => {
        if (concertsRef.current) {
            concertsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };
    
    const handleSelectRelease = (id: string) => {
        setTab('artist');
        setSelectedReleaseId(id);
        setView('releaseDetail');
    };

    const handleBackToProfile = () => {
        setSelectedReleaseId(null);
        setView('artistProfile');
    };

    const pageBgColor = activeArtistData.appleMusicBgColor || '#000000';
    const profileFont = activeArtistData.appleMusicNameFont || 'ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif';
    const profileVideoUrl = activeArtistData.appleMusicProfileVideoUrl || '';

    // Active tours or tour concerts
    const activeTours = activeArtistData.tours ? activeArtistData.tours.filter((t: Tour) => t.status === 'active' || t.status === 'presale' || t.status === 'planning') : [];
    const isArtistOnTour = activeTours.length > 0;

    // Build concerts list
    const upcomingConcerts = useMemo(() => {
        const concertsList: { city: string; venueName: string; day: string; month: string; time: string }[] = [];
        if (activeTours.length > 0) {
            activeTours.forEach(tour => {
                tour.venues.slice(0, 4).forEach((v, idx) => {
                    concertsList.push({
                        city: v.city || 'Los Angeles, CA',
                        venueName: v.name || 'SoFi Stadium',
                        day: String(12 + idx * 3),
                        month: 'AUG',
                        time: 'Sat • 7:00 PM'
                    });
                });
            });
        } else if (isArtistOnTour) {
            concertsList.push(
                { city: 'London, United Kingdom', venueName: 'The O2', day: '15', month: 'AUG', time: 'Sat • 7:00 PM' },
                { city: 'Paris, France', venueName: 'Accor Arena', day: '18', month: 'AUG', time: 'Tue • 8:00 PM' },
                { city: 'New York, NY', venueName: 'Madison Square Garden', day: '24', month: 'AUG', time: 'Mon • 7:30 PM' }
            );
        }
        return concertsList;
    }, [activeTours, isArtistOnTour]);

    // Similar artists data mapped from actual NPC artists in game world
    const similarArtists = useMemo(() => {
        const artistMap = new Map<string, { id: string; name: string; image: string }>();
        
        if (gameState?.npcs) {
            gameState.npcs.forEach(npc => {
                if (!npc.artist || npc.artist === activeArtist.name || artistMap.has(npc.artist)) return;
                const image = getArtistImage(npc.artist, npc.coverArt);
                artistMap.set(npc.artist, {
                    id: npc.id || npc.artist,
                    name: npc.artist,
                    image
                });
            });
        }

        if (gameState?.npcAlbums) {
            gameState.npcAlbums.forEach(album => {
                if (!album.artist || album.artist === activeArtist.name || artistMap.has(album.artist)) return;
                const image = getArtistImage(album.artist, album.coverArt);
                artistMap.set(album.artist, {
                    id: album.id || album.artist,
                    name: album.artist,
                    image
                });
            });
        }

        return Array.from(artistMap.values()).slice(0, 10);
    }, [gameState, activeArtist.name]);

    // More To See / Watch More (Distributed Vevo & Other Non-Music-Video Clips)
    const watchMoreClips = useMemo(() => {
        const videos = activeArtistData.videos || [];
        const otherVideos = videos.filter(v => v.type !== 'Music Video');
        return otherVideos.map(v => ({
            id: v.id,
            title: v.title,
            type: v.type,
            thumbnail: v.thumbnail || activeArtist.image
        }));
    }, [activeArtistData.videos, activeArtist.image]);

    // Appears On tracks (ONLY songs where our artist is featured on someone else's song)
    const appearsOnTracks = useMemo(() => {
        const list: { id: string; title: string; coverArt: string; artistName: string }[] = [];
        
        // 1. Player songs that were created as features on NPC projects
        activeArtistData.songs.forEach(s => {
            if (s.isFeatureToNpc) {
                list.push({
                    id: s.id,
                    title: s.title,
                    coverArt: s.coverArt,
                    artistName: s.npcArtistName || s.primaryArtist || 'NPC Artist'
                });
            }
        });

        // 2. NPC tracks where active artist is a featured guest
        if (gameState?.npcs) {
            gameState.npcs.forEach(npc => {
                if (npc.features?.includes(activeArtist.name) || npc.collaboration?.artistName === activeArtist.name) {
                    list.push({
                        id: npc.id,
                        title: npc.title,
                        coverArt: npc.coverArt || getArtistImage(npc.artist),
                        artistName: npc.artist
                    });
                }
            });
        }

        return list;
    }, [activeArtistData.songs, gameState?.npcs, activeArtist.name]);

    const renderArtistView = () => {
        if (view === 'releaseDetail' && selectedReleaseId) {
            return <AppleMusicReleaseDetailView releaseId={selectedReleaseId} onBack={handleBackToProfile} onSelectRelease={handleSelectRelease} />;
        }

        const { songs, releases, videos } = activeArtistData;
        const isFeature = (r: Release) => r.type !== 'Live Album' && (r.isFeatureToNpc || r.songIds.some(id => songs.find(s => s.id === id)?.isFeatureToNpc));
        const availableReleases = releases.filter(r => !r.isTakenDown && !r.soundtrackInfo && !isFeature(r) && r.songIds.some(id => songs.find(s => s.id === id)?.isAvailableOnStreaming === true));

        const latestRelease = [...availableReleases]
            .filter(r => r.type === 'Album' || r.type === 'EP' || r.type === 'Album (Deluxe)' || r.type === 'Compilation' || r.type === 'Live Album')
            .sort((a, b) => (b.releaseDate.year * 52 + b.releaseDate.week) - (a.releaseDate.year * 52 + a.releaseDate.week))[0];

        const topSongs = [...songs]
            .filter(s => s.isReleased && s.isAvailableOnStreaming === true)
            .sort((a, b) => (b.lastWeekStreams || 0) - (a.lastWeekStreams || 0))
            .slice(0, 5);
        
        const albums = availableReleases.filter(r => r.type === 'Album' || r.type === 'Album (Deluxe)').sort((a,b) => b.releaseDate.year - a.releaseDate.year);
        const compilations = availableReleases.filter(r => r.type === 'Compilation').sort((a,b) => b.releaseDate.year - a.releaseDate.year);
        const liveAlbums = availableReleases.filter(r => r.type === 'Live Album').sort((a,b) => b.releaseDate.year - a.releaseDate.year);
        const musicVideos = videos.filter(v => v.type === 'Music Video').sort((a,b) => (b.releaseDate.year * 52 + b.releaseDate.week) - (a.releaseDate.year * 52 + a.releaseDate.week));
        const singlesAndEps = availableReleases.filter(r => r.type === 'Single' || r.type === 'EP').sort((a,b) => (b.releaseDate.year * 52 + b.releaseDate.week) - (a.releaseDate.year * 52 + a.releaseDate.week));
        
        // Up to 3 essential albums sorted newest at top
        const essentialAlbums = availableReleases
            .filter(r => r.isAppleMusicEssential)
            .sort((a,b) => (b.releaseDate.year * 52 + b.releaseDate.week) - (a.releaseDate.year * 52 + a.releaseDate.week))
            .slice(0, 3);

        return (
            <div className="pb-28">
                {/* HERO PROFILE HEADER */}
                <div className="relative h-[48vh] min-h-[380px] overflow-hidden">
                    {profileVideoUrl ? (
                        <video 
                            src={profileVideoUrl} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            className="absolute w-full h-full object-cover"
                        />
                    ) : (
                        <img src={activeArtist.image} className="absolute w-full h-full object-cover" alt={activeArtist.name} />
                    )}
                    
                    {/* Deep Gradient Fade into background color */}
                    <div 
                        className="absolute inset-0 bg-gradient-to-t via-black/40 to-black/30"
                        style={{
                            backgroundImage: `linear-gradient(to top, ${pageBgColor} 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.3) 100%)`
                        }} 
                    />
                    
                    <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 mt-8">
                        <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'game' })} className="bg-black/40 backdrop-blur-md p-1.5 rounded-full hover:bg-black/60 transition-colors">
                            <ChevronLeftIcon className="w-6 h-6 text-white" />
                        </button>
                        <div className="flex items-center gap-3">
                            <button className="bg-black/40 backdrop-blur-md p-2 rounded-full hover:bg-black/60 transition-colors">
                                <StarIcon className="w-5 h-5 text-white" />
                            </button>
                            <button className="bg-black/40 backdrop-blur-md p-2 rounded-full hover:bg-black/60 transition-colors">
                                <DotsHorizontalIcon className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </header>

                    {/* Artist Name & Controls Banner */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
                        {/* Upcoming Concerts Pill */}
                        {(isArtistOnTour || upcomingConcerts.length > 0) && (
                            <button 
                                onClick={scrollToConcerts}
                                className="inline-flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md hover:bg-zinc-800 text-white px-3.5 py-1.5 rounded-full text-xs font-bold border border-zinc-700/60 shadow-lg transition-transform active:scale-95"
                            >
                                <span className="text-base">🎟️</span>
                                <span>Upcoming Concerts</span>
                            </button>
                        )}

                        <div className="flex justify-between items-end gap-4">
                            <h1 style={{ fontFamily: profileFont }} className="text-5xl md:text-6xl font-black tracking-tight drop-shadow-2xl text-white">
                                {activeArtist.name}
                            </h1>

                            <div className="flex items-center gap-3 shrink-0">
                                <button className="w-11 h-11 bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-full flex items-center justify-center text-white hover:bg-zinc-800 font-serif font-bold text-lg">
                                    i
                                </button>
                                <button className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-105 transition-transform active:scale-95">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-black translate-x-0.5"><path d="M7 6v12l10-6z" /></svg>
                                </button>
                                <button className="w-11 h-11 bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-full flex items-center justify-center text-yellow-400 hover:bg-zinc-800">
                                    <StarIcon className="w-5 h-5 fill-yellow-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="p-4 space-y-9">
                    {/* LATEST RELEASE FLOAT BANNER */}
                    {latestRelease && (
                        <section className="-mt-3">
                            <button 
                                onClick={() => handleSelectRelease(latestRelease.id)} 
                                className="w-full text-left bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-4 shadow-xl hover:bg-zinc-800/80 transition-colors group"
                            >
                                <img src={latestRelease.coverArt} className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-md group-hover:scale-105 transition-transform" alt={latestRelease.title} />
                                <div className="flex-grow min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{formatDateApple(latestRelease.releaseDate)}</p>
                                    <h2 className="text-lg font-bold text-white truncate flex items-center gap-1.5 mt-0.5">
                                        <span className="truncate">{latestRelease.title}</span>
                                        {latestRelease.songIds.some(id => songs.find(s => s.id === id)?.explicit) && (
                                            <span className="text-[10px] w-4 h-4 bg-zinc-300 text-black font-bold rounded-[2px] flex items-center justify-center shrink-0">E</span>
                                        )}
                                    </h2>
                                    <p className="text-xs text-zinc-400 mt-0.5">{latestRelease.type} • {latestRelease.songIds.length} Songs</p>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-zinc-500 shrink-0" />
                            </button>
                        </section>
                    )}
                    
                    {/* TOP SONGS (NO Numbers, NO Card Wrapper) */}
                    {topSongs.length > 0 && (
                        <section>
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-2xl font-bold flex items-center gap-1">
                                    <span>Top Songs</span>
                                    <ChevronRightIcon className="w-5 h-5 text-zinc-400 inline" />
                                </h2>
                            </div>
                            <div className="divide-y divide-zinc-800/60 border-t border-b border-zinc-800/60">
                                {topSongs.map((song) => {
                                    const release = releases.find(r => r.id === song.releaseId);
                                    const songTitle = song.collaboration
                                        ? song.title.replace(new RegExp(` \\(feat\\. ${song.collaboration.artistName}\\)`), '')
                                        : song.title;
                                    
                                    let subTitle = '';
                                    if (release) {
                                        subTitle = release.type === 'Single' 
                                            ? `${release.title} - Single · ${release.releaseDate.year}`
                                            : `${release.title} · ${release.releaseDate.year}`;
                                    } else {
                                        subTitle = `${song.genre || 'Single'} · ${song.year || 2025}`;
                                    }

                                    return (
                                        <div key={song.id} className="flex items-center gap-3 py-2.5 px-1">
                                            <img src={song.coverArt} className="w-12 h-12 rounded-lg object-cover shadow shrink-0" alt={songTitle} />
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-bold text-white truncate text-base">{songTitle}</p>
                                                    {song.explicit && (
                                                        <span className="text-[10px] w-4 h-4 bg-zinc-300 text-black font-bold rounded-[2px] flex items-center justify-center shrink-0">E</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">{subTitle}</p>
                                            </div>
                                            <button className="flex-shrink-0 p-1"><DotsHorizontalIcon className="w-5 h-5 text-zinc-400" /></button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ESSENTIAL ALBUMS SECTION (Sorted newest at top) */}
                    {essentialAlbums.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-3">Essential Albums</h2>
                            <div className="space-y-4">
                                {essentialAlbums.map(ea => {
                                    const hasExplicit = ea.songIds.some(id => songs.find(s => s.id === id)?.explicit);
                                    return (
                                        <div 
                                            key={ea.id} 
                                            onClick={() => handleSelectRelease(ea.id)} 
                                            className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 flex gap-4 cursor-pointer hover:bg-zinc-800/50 transition-colors group shadow-lg"
                                        >
                                            <img src={ea.coverArt} className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-cover shrink-0 shadow-xl group-hover:scale-105 transition-transform" alt={ea.title} />
                                            <div className="flex-grow min-w-0 flex flex-col justify-center">
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-bold text-xl text-white truncate">{ea.title}</h3>
                                                    {hasExplicit && <span className="text-[10px] w-4 h-4 bg-zinc-300 text-black font-bold rounded-[2px] flex items-center justify-center shrink-0">E</span>}
                                                </div>
                                                <p className="text-zinc-300 text-sm mt-1.5 leading-snug line-clamp-3">
                                                    {ea.appleMusicEssentialReview || `${activeArtist.name}'s defining album, featuring standout singles and acclaimed production.`}
                                                </p>
                                            </div>
                                            <div className="flex items-center shrink-0 pl-1">
                                                <ChevronRightIcon className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ALBUMS */}
                    {albums.length > 0 && (
                        <HorizontalSection title="Albums" items={albums} onSelect={handleSelectRelease} />
                    )}

                    {/* MUSIC VIDEOS */}
                    {musicVideos.length > 0 && (
                        <HorizontalSection title="Music Videos" items={musicVideos} onSelect={() => {}} artistName={activeArtist.name} />
                    )}

                    {/* ALL UPCOMING CONCERTS SECTION */}
                    <section ref={concertsRef} className="scroll-mt-12">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-2xl font-bold flex items-center gap-1">
                                <span>All Upcoming Concerts</span>
                                <ChevronRightIcon className="w-5 h-5 text-zinc-400 inline" />
                            </h2>
                        </div>

                        {upcomingConcerts.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingConcerts.map((c, idx) => (
                                    <div key={idx} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 flex items-center gap-4 shadow-md hover:bg-zinc-800/60 transition-colors">
                                        {/* Date Badge Box */}
                                        <div className="w-14 h-14 bg-black/80 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center shrink-0 shadow-inner">
                                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">{c.month}</span>
                                            <span className="text-xl font-black text-white leading-none mt-0.5">{c.day}</span>
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <h3 className="font-bold text-base text-white truncate">{c.city}</h3>
                                            <p className="text-xs text-zinc-400 truncate mt-0.5">{c.venueName} • {c.time}</p>
                                        </div>
                                        <button className="bg-white text-black font-bold text-xs px-3.5 py-2 rounded-full shrink-0 hover:bg-zinc-200">
                                            Tickets
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-2xl text-center">
                                <p className="text-zinc-400 text-sm">No upcoming tour concerts scheduled at the moment.</p>
                            </div>
                        )}
                    </section>

                    {/* SINGLES & EPS */}
                    {singlesAndEps.length > 0 && (
                        <HorizontalSection title="Singles & EPs" items={singlesAndEps} onSelect={handleSelectRelease} />
                    )}

                    {/* LIVE ALBUMS */}
                    {liveAlbums.length > 0 && (
                        <HorizontalSection title="Live Albums" items={liveAlbums} onSelect={handleSelectRelease} />
                    )}

                    {/* COMPILATIONS */}
                    {compilations.length > 0 && (
                        <HorizontalSection title="Compilations" items={compilations} onSelect={handleSelectRelease} />
                    )}

                    {/* MORE TO SEE SECTION (Distributed Vevo & Other Non-Music-Video Clips) */}
                    {watchMoreClips.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-3">More To See</h2>
                            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                                {watchMoreClips.map(clip => (
                                    <div key={clip.id} className="w-64 shrink-0 group cursor-pointer">
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 shadow-lg">
                                            <img src={clip.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={clip.title} />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                <div className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center">
                                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white translate-x-0.5"><path d="M7 6v12l10-6z" /></svg>
                                                </div>
                                            </div>
                                            <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                                {clip.type}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-sm text-white truncate mt-2">{clip.title}</p>
                                        <p className="text-xs text-zinc-400 mt-0.5">Vevo • Apple Music Exclusive</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* SIMILAR ARTISTS SECTION (Real NPC Artists in World) */}
                    {similarArtists.length > 0 && (
                        <section>
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-2xl font-bold flex items-center gap-1">
                                    <span>Similar Artists</span>
                                    <ChevronRightIcon className="w-5 h-5 text-zinc-400 inline" />
                                </h2>
                            </div>
                            <div className="flex gap-5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                                {similarArtists.map(sa => (
                                    <div key={sa.id} className="w-28 shrink-0 text-center cursor-pointer group">
                                        <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg border-2 border-transparent group-hover:border-[#fa243c] transition-all">
                                            <img src={sa.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={sa.name} />
                                        </div>
                                        <p className="font-semibold text-xs text-white truncate mt-2">{sa.name}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* APPEARS ON SECTION (Only Songs Where Player Is Featured Guest) */}
                    {appearsOnTracks.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-3">Appears On</h2>
                            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                                {appearsOnTracks.map(track => (
                                    <div key={track.id} className="w-36 sm:w-40 shrink-0 text-left cursor-pointer group">
                                        <img src={track.coverArt} className="w-36 h-36 sm:w-40 sm:h-40 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform" alt={track.title} />
                                        <p className="font-semibold text-sm text-white truncate mt-2">{track.title}</p>
                                        <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artistName}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>
            </div>
        );
    };

    return (
        <div style={{ backgroundColor: pageBgColor }} className="text-white h-full pb-24 overflow-y-auto font-sans transition-colors">
            {tab === 'artist' ? renderArtistView() : <AppleMusicBrowseView 
                 browseView={browseView} 
                 setBrowseView={setBrowseView} 
                 selectedPlaylist={selectedBrowsePlaylist} 
                 setSelectedPlaylist={setSelectedBrowsePlaylist} 
                 onExit={() => dispatch({ type: 'CHANGE_VIEW', payload: 'game' })} 
            />}
            
            <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 pb-safe pt-2 px-6 flex justify-around items-center z-50 h-16 sm:pb-2">
                <button 
                    onClick={() => setTab('artist')}
                    className={`flex flex-col items-center gap-1 ${tab === 'artist' ? 'text-[#fa243c]' : 'text-zinc-500'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-medium">Artist</span>
                </button>
                <button 
                    onClick={() => { setTab('browse'); setBrowseView('home'); }}
                    className={`flex flex-col items-center gap-1 ${tab === 'browse' ? 'text-[#fa243c]' : 'text-zinc-500'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm4.5 7.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75zm3.75-1.5a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0V12zm2.25-3a.75.75 0 01.75.75v6.75a.75.75 0 01-1.5 0V9.75A.75.75 0 0113.5 9zm3.75-1.5a.75.75 0 00-1.5 0v9a.75.75 0 001.5 0v-9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-medium">Browse</span>
                </button>
            </div>
        </div>
    );
};

export default AppleMusicView;
