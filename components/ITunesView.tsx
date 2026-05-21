
import React, { useState, useMemo, useEffect } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { Artist, Group, Song, Release, ChartEntry, AlbumChartEntry, NpcSong, NpcAlbum, GameDate, ArtistData } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ListBulletIcon from './icons/ListBulletIcon';
import ArrowUpOnBoxIcon from './icons/ArrowUpOnBoxIcon';
import StarIcon from './icons/StarIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';

// --- TYPE DEFINITIONS ---
interface ITunesSong extends ChartEntry {
    price: string;
    duration: number;
    explicit: boolean;
    sales: number;
}

interface ITunesAlbum extends AlbumChartEntry {
    price: string;
    rating: number;
    reviewCount: number;
    isPreorder: boolean;
    songCount: number;
    releaseDate: GameDate;
    sales: number;
}

type ITunesViewMode = 'home' | 'charts' | 'songChart' | 'albumChart' | 'artist' | 'albumDetail';

const getPrice = (id: string, type: 'song' | 'album', trackCount = 0) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    if (type === 'song') {
        return (hash % 3 === 0) ? '$0.99' : '$1.29';
    } else {
        if (trackCount < 5) return '$7.99';
        if (trackCount < 9) return '$9.99';
        if (trackCount < 13) return '$10.99';
        return '$11.99';
    }
};

// --- DATA HOOK ---
const useItunesData = () => {
    const { gameState, allPlayerArtists } = useGame();
    const { billboardHot100, billboardTopAlbums, npcs, npcAlbums, artistsData } = gameState;

    const allSongs = useMemo<ITunesSong[]>(() => {
        let entries = [...billboardHot100];
        const billboardSongIds = new Set(billboardHot100.filter(e => e.isPlayerSong).map(e => e.songId));
        
        for (const artistId in artistsData) {
            const aData = artistsData[artistId];
            const artist = allPlayerArtists.find(a => a.id === artistId);
            aData.songs.filter(s => s.isReleased && !billboardSongIds.has(s.id)).forEach(song => {
                entries.push({
                    rank: 101,
                    lastWeek: null,
                    peak: 101,
                    weeksOnChart: 1,
                    title: song.title,
                    artist: artist?.name || 'Unknown',
                    coverArt: song.coverArt,
                    isPlayerSong: true,
                    songId: song.id,
                    uniqueId: song.id,
                    weeklyStreams: song.lastWeekStreams || 0,
                });
            });
        }

        return entries.map(entry => {
            let duration = 180 + Math.floor(Math.random() * 60);
            let explicit = false;
            let boost = 1;
            if (entry.isPlayerSong && entry.songId) {
                for (const artistId in artistsData) {
                    const song = artistsData[artistId].songs.find(s => s.id === entry.songId);
                    if (song) {
                        duration = song.duration;
                        explicit = song.explicit;
                        
                        const aData = artistsData[artistId];
                        const pushWeek = aData.lastPushToItunesWeek;
                        const currentWeek = gameState.date.year * 52 + gameState.date.week;
                        if (aData.lastPushedSongId === entry.songId && pushWeek && currentWeek - pushWeek <= 1) {
                            boost = 5 + Math.random() * 5; // massive boost
                        }
                        
                        break;
                    }
                }
            }
            const hash = entry.uniqueId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const divisor = 750 + (hash % 250);
            const sales = Math.floor((entry.weeklyStreams || 0) / divisor) * boost;

            return {
                ...entry,
                price: getPrice(entry.uniqueId, 'song'),
                duration,
                explicit,
                sales,
            };
        }).sort((a, b) => b.sales - a.sales).slice(0, 100).map((song, index) => {
            // Give a baseline to sales to ensure the 100th song has 1k - 1.5k sales
            const baselineSales = 1000 + Math.random() * 500 + ((100 - index) * 150);
            return {
                ...song,
                sales: Math.max(song.sales, Math.floor(baselineSales)),
                rank: index + 1
            };
        });
    }, [billboardHot100, artistsData, allPlayerArtists]);

    const allAlbums = useMemo<ITunesAlbum[]>(() => {
        let entries = [...billboardTopAlbums];
        const billboardAlbumIds = new Set(billboardTopAlbums.filter(e => e.isPlayerAlbum).map(e => e.albumId));

        for (const artistId in artistsData) {
            const aData = artistsData[artistId];
            const artist = allPlayerArtists.find(a => a.id === artistId);
            aData.releases.filter(r => r.isReleased && !billboardAlbumIds.has(r.id)).forEach(release => {
                let totalWeeklyActivity = 0;
                release.songIds.forEach(songId => {
                    const song = aData.songs.find(s => s.id === songId);
                    if (song) {
                        totalWeeklyActivity += (song.lastWeekStreams || 0);
                        const remixes = aData.songs.filter(s => s.isReleased && s.remixOfSongId === song.id);
                        remixes.forEach(r => totalWeeklyActivity += (r.lastWeekStreams || 0));
                    }
                });
                entries.push({
                    rank: 201,
                    lastWeek: null,
                    peak: 201,
                    weeksOnChart: 1,
                    title: release.title,
                    artist: artist?.name || 'Unknown',
                    coverArt: release.coverArt,
                    isPlayerAlbum: true,
                    albumId: release.id,
                    uniqueId: release.id,
                    weeklyActivity: Math.floor(totalWeeklyActivity / 1500),
                    weeklySales: 0
                });
            });
        }

        return entries.map(entry => {
            let rating = 0;
            let reviewCount = 0;
            let isPreorder = false;
            let songCount = 10;
            let releaseDate = gameState.date;
            
            if (entry.isPlayerAlbum && entry.albumId) {
                for (const artistId in artistsData) {
                    const artistData = artistsData[artistId];
                    const release = artistData.releases.find(r => r.id === entry.albumId);
                    if(release) {
                        const qualitySum = release.songIds.reduce((sum, songId) => {
                           const song = artistData.songs.find(s => s.id === songId);
                           return sum + (song?.quality || 0);
                        }, 0);
                        const avgQuality = qualitySum / (release.songIds.length || 1);
                        rating = (avgQuality / 100 * 4) + 1 + (Math.random() * 0.5 - 0.25);
                        reviewCount = Math.floor(entry.weeklyActivity * 20 * (Math.random() * 0.5 + 0.8));
                        songCount = release.songIds.length;
                        releaseDate = release.releaseDate;

                        const submission = artistData.labelSubmissions.find(s => s.release.id === entry.albumId && s.status === 'scheduled');
                        if (submission?.projectReleaseDate) {
                            isPreorder = (submission.projectReleaseDate.year * 52 + submission.projectReleaseDate.week) > (gameState.date.year * 52 + gameState.date.week);
                        }
                        break;
                    }
                }
            } else {
                rating = 3.5 + Math.random() * 1.5;
                reviewCount = Math.floor(entry.weeklyActivity * 10 * (Math.random() * 0.5 + 0.8));
            }

            const hash = entry.uniqueId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const divisor = 750 + (hash % 250);
            const sales = Math.floor((entry.weeklyActivity || entry.weeklySales * divisor || 100000) / divisor);

            return {
                ...entry,
                price: getPrice(entry.uniqueId, 'album', songCount),
                rating: Math.max(1, Math.min(5, rating)),
                reviewCount,
                isPreorder,
                songCount,
                releaseDate,
                sales,
            };
        }).sort((a, b) => b.sales - a.sales).slice(0, 100).map((album, index) => {
            const baselineSales = 800 + Math.random() * 400 + ((100 - index) * 120);
            return {
                ...album,
                sales: Math.max(album.sales, Math.floor(baselineSales)),
                rank: index + 1
            };
        });
    }, [billboardTopAlbums, artistsData, gameState.date, allPlayerArtists]);
    
    const findArtistByName = (name: string) => {
        const player = allPlayerArtists.find(a => a.name === name);
        if (player) return { ...player, isPlayer: true };
        return { id: `npc_${name}`, name, image: 'https://picsum.photos/100', isPlayer: false };
    };

    const getArtistDetails = (artistId: string, artistName: string) => {
         const player = allPlayerArtists.find(a => a.id === artistId);
         if (player) return { ...player, isPlayer: true };
         return { id: `npc_${artistName}`, name: artistName, image: 'https://picsum.photos/100', isPlayer: false };
    };

    const getArtistSongs = (artistName: string) => allSongs.filter(s => s.artist === artistName);
    const getArtistAlbums = (artistName: string) => allAlbums.filter(a => a.artist === artistName);

    const getAlbumDetails = (albumId: string) => {
        const album = allAlbums.find(a => a.albumId === albumId);
        if (!album) return null;

        let tracks: (ITunesSong & { isAvailable: boolean })[] = [];
        if (album.isPlayerAlbum) {
            for (const artistId in artistsData) {
                const artistData = artistsData[artistId];
                const release = artistData.releases.find(r => r.id === albumId);
                if (release) {
                    const submission = artistData.labelSubmissions.find(s => s.release.id === albumId);
                    const releasedSingles = new Set(submission?.singlesToRelease?.map(s => s.songId) || []);
                    tracks = release.songIds.map(songId => {
                        const song = artistData.songs.find(s => s.id === songId);
                        if (!song) return null;
                        const chartSongData = allSongs.find(s => s.songId === songId);
                        const itunesSongData = chartSongData || {
                            rank: 0,
                            lastWeek: null,
                            peak: 0,
                            weeksOnChart: 0,
                            title: song.title,
                            artist: album.artist,
                            coverArt: song.coverArt,
                            isPlayerSong: true,
                            songId: song.id,
                            uniqueId: song.id,
                            weeklyStreams: song.lastWeekStreams,
                            price: getPrice(song.id, 'song'),
                            duration: song.duration,
                            explicit: song.explicit
                        };
                        return {
                            ...itunesSongData,
                            title: song.title,
                            artist: album.artist,
                            coverArt: song.coverArt,
                            isAvailable: album.isPreorder ? (song.isPreReleaseSingle === true || releasedSingles.has(song.id)) : true,
                        };
                    }).filter((s): s is ITunesSong & { isAvailable: boolean } => !!s);
                    break;
                }
            }
        } else {
             const npcAlbum = npcAlbums.find(a => a.uniqueId === album.uniqueId);
             if(npcAlbum) {
                tracks = npcAlbum.songIds.map(id => {
                    const song = npcs.find(s => s.uniqueId === id);
                    if(!song) return null;
                    const chartData = allSongs.find(s => s.uniqueId === id);
                    const itunesSongData = chartData || {
                        rank: 0,
                        lastWeek: null,
                        peak: 0,
                        weeksOnChart: 0,
                        isPlayerSong: false,
                        songId: undefined,
                        uniqueId: song.uniqueId,
                        weeklyStreams: song.basePopularity * (Math.random() * 0.4 + 0.8),
                        price: getPrice(song.uniqueId, 'song'),
                        duration: 180 + Math.floor(Math.random() * 60),
                        explicit: Math.random() > 0.8,
                        title: song.title,
                        artist: song.artist,
                        coverArt: album.coverArt,
                    };

                    return {
                        ...itunesSongData,
                        title: song.title,
                        artist: song.artist,
                        coverArt: album.coverArt,
                        isAvailable: true,
                    };
                }).filter((s): s is ITunesSong & { isAvailable: boolean } => !!s);
             }
        }
        return { ...album, tracks };
    };

    return { allSongs, allAlbums, findArtistByName, getArtistDetails, getArtistSongs, getArtistAlbums, getAlbumDetails };
};

// --- RENDER COMPONENTS ---
// Note: All sub-components are defined within this file to keep file changes minimal.

const ITunesHeader: React.FC<{
    viewStack: any[];
    onBack: () => void;
    currentTab: 'featured' | 'charts';
    onTabChange: (tab: 'featured' | 'charts') => void;
}> = ({ viewStack, onBack, currentTab, onTabChange }) => {
    const currentView = viewStack[viewStack.length - 1];
    const isRoot = viewStack.length === 1;

    return (
        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-md text-white">
            <div className="flex items-center h-12 px-4 border-b border-zinc-700">
                <div className="w-1/4">
                    {isRoot ? (
                         <button onClick={onBack} className="text-white flex items-center text-lg hover:opacity-80">
                            <ArrowLeftIcon className="w-5 h-5 -ml-1 mr-1" /> Exit
                        </button>
                    ) : (
                        <button onClick={onBack} className="text-[#0b84fe] flex items-center text-lg">
                            <ChevronLeftIcon className="w-6 h-5 -ml-2" /> Back
                        </button>
                    )}
                </div>
                <div className="w-1/2 text-center font-bold text-lg">{currentView.title}</div>
                <div className="w-1/4 flex justify-end">
                    {currentView.data?.artist && <button><ArrowUpOnBoxIcon className="w-6 h-6 text-[#0b84fe]"/></button>}
                    {isRoot && <button><ListBulletIcon className="w-6 h-6 text-[#0b84fe]"/></button>}
                </div>
            </div>
            {isRoot && (
                 <div className="p-2 flex justify-center">
                    <div className="bg-zinc-800 rounded-lg p-0.5 flex text-sm font-semibold">
                        <button onClick={() => onTabChange('featured')} className={`px-8 py-1 rounded-md transition-colors ${currentTab === 'featured' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>Featured</button>
                        <button onClick={() => onTabChange('charts')} className={`px-8 py-1 rounded-md transition-colors ${currentTab === 'charts' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>Charts</button>
                    </div>
                </div>
            )}
        </header>
    );
};

const Section: React.FC<{ title: string; onSeeAll: () => void; children: React.ReactNode }> = ({ title, onSeeAll, children }) => (
    <section className="py-2">
        <div className="flex justify-between items-center px-4 mb-2">
            <h2 className="text-2xl font-bold">{title}</h2>
            <button onClick={onSeeAll} className="text-lg text-[#0b84fe]">See All &gt;</button>
        </div>
        {children}
    </section>
);

const SongRow: React.FC<{ song: ITunesSong; onClick: () => void }> = ({ song, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-2 border-b border-zinc-800">
        <img src={song.coverArt} alt={song.title} className="w-16 h-16 rounded-md object-cover" />
        <div className="flex-grow text-left">
            <p className="font-semibold line-clamp-1">{song.title}</p>
            <p className="text-zinc-400 line-clamp-1">{song.artist}</p>
        </div>
        <div className="border border-[#0b84fe] rounded-full px-4 py-1 text-sm font-bold text-[#0b84fe]">
            {song.price}
        </div>
    </button>
);

const AlbumGridItem: React.FC<{ album: ITunesAlbum; onClick: () => void }> = ({ album, onClick }) => (
    <button onClick={onClick} className="flex-shrink-0 w-40 text-left">
        <img src={album.coverArt} alt={album.title} className="w-40 h-40 rounded-lg object-cover" />
        <p className="mt-1 font-semibold line-clamp-1">{album.title}</p>
        <p className="text-zinc-400 line-clamp-1">{album.artist}</p>
    </button>
);

const StarRating: React.FC<{ rating: number, count: number }> = ({ rating, count }) => {
    return (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => {
                const fill = i + 0.5 < rating ? 'fill-current' : 'fill-none';
                return <StarIcon key={i} className={`w-3 h-3 text-zinc-500 ${fill}`} />;
            })}
            <span className="text-xs text-zinc-500">({count})</span>
        </div>
    );
};

const ITunesHome: React.FC<{ data: { allSongs: ITunesSong[], allAlbums: ITunesAlbum[] }; navigateTo: Function }> = ({ data, navigateTo }) => {
    const featuredAlbums = data.allAlbums.slice(0, 5);
    const preorders = data.allAlbums.filter(a => a.isPreorder);
    const bestNewReleases = data.allAlbums.filter(a => !a.isPreorder).slice(5, 15);

    return (
        <div className="space-y-6 pb-6">
            {/* Carousel Banners */}
            <div className="flex overflow-x-auto gap-4 px-4 snap-x pb-2 pt-4 hide-scrollbar">
                {featuredAlbums.map(album => (
                    <button 
                        key={`banner-${album.uniqueId}`} 
                        onClick={() => navigateTo('albumDetail', { albumId: album.albumId, artistName: album.artist }, album.title)}
                        className="snap-center flex-shrink-0 w-80 md:w-96 text-left group"
                    >
                        <p className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">{album.isPreorder ? 'Pre-Order Now' : 'Featured Album'}</p>
                        <h3 className="text-xl sm:text-2xl font-normal line-clamp-1">{album.title}</h3>
                        <p className="text-xl sm:text-2xl text-zinc-400 font-normal line-clamp-1 mb-2">{album.artist}</p>
                        <div className="relative w-full aspect-[2/1] md:aspect-video rounded-xl overflow-hidden">
                            <img src={album.coverArt} alt={album.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                    </button>
                ))}
            </div>

            <Section title="Best New Releases" onSeeAll={() => navigateTo('albumChart', { albums: bestNewReleases, title: 'Best New Releases' }, 'Best New Releases')}>
                <div className="flex gap-4 px-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                    {bestNewReleases.slice(0, 10).map(album => <AlbumGridItem key={album.uniqueId} album={album} onClick={() => navigateTo('albumDetail', { albumId: album.albumId, artistName: album.artist }, album.title)} />)}
                </div>
            </Section>

            {preorders.length > 0 && (
                <Section title="Pre-Orders" onSeeAll={() => navigateTo('albumChart', { albums: preorders, title: 'Pre-Orders' }, 'Pre-Orders')}>
                    <div className="flex gap-4 px-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                        {preorders.slice(0, 10).map(album => <AlbumGridItem key={album.uniqueId} album={album} onClick={() => navigateTo('albumDetail', { albumId: album.albumId, artistName: album.artist }, album.title)} />)}
                    </div>
                </Section>
            )}

            <Section title="Top Songs" onSeeAll={() => navigateTo('songChart', { songs: data.allSongs, title: 'Top Songs' }, 'Top Songs')}>
                <div className="px-4">
                    {data.allSongs.slice(0, 5).map((song, i) => (
                        <button key={song.uniqueId} className="w-full flex items-center gap-3 py-2 border-b border-zinc-800">
                             <img src={song.coverArt} alt={song.title} className="w-14 h-14 rounded-md object-cover" />
                             <div className="flex-grow text-left">
                                 <p className="font-semibold line-clamp-1">{song.title}</p>
                                 <p className="text-zinc-400 line-clamp-1 text-sm">{song.artist}</p>
                             </div>
                             <div className="border border-[#0b84fe] rounded-full px-4 py-1 text-sm font-bold text-[#0b84fe] bg-[#0b84fe]/10">
                                 {song.price}
                             </div>
                        </button>
                    ))}
                </div>
            </Section>
        </div>
    );
};

const ITunesCharts: React.FC<{ data: { allSongs: ITunesSong[], allAlbums: ITunesAlbum[] }; navigateTo: Function }> = ({ data, navigateTo }) => (
    <div className="space-y-6 pt-4 pb-6">
        <Section title="Top Songs" onSeeAll={() => navigateTo('songChart', { songs: data.allSongs, title: 'Top Songs' }, 'Top Songs')}>
             <div className="px-4">
                {data.allSongs.slice(0, 20).map((song, i) => (
                    <button key={song.uniqueId} className="w-full flex items-center gap-3 py-3 border-b border-zinc-800/50">
                         <div className="text-xl font-bold w-6 text-zinc-400 text-center">{i + 1}</div>
                         <img src={song.coverArt} alt={song.title} className="w-14 h-14 rounded-md object-cover shadow-sm" />
                         <div className="flex-grow text-left">
                             <p className="font-semibold line-clamp-1">{song.title}</p>
                             <p className="text-zinc-400 line-clamp-1 text-sm">{song.artist}</p>
                         </div>
                         <div className="border border-[#0b84fe] rounded-full px-4 py-1 text-sm font-bold text-[#0b84fe] bg-[#0b84fe]/10">
                             {song.price}
                         </div>
                    </button>
                ))}
            </div>
        </Section>
        <Section title="Top Albums" onSeeAll={() => navigateTo('albumChart', { albums: data.allAlbums, title: 'Top Albums' }, 'Top Albums')}>
            <div className="flex gap-4 px-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
                {data.allAlbums.slice(0, 20).map((album, i) => (
                    <button key={album.uniqueId} onClick={() => navigateTo('albumDetail', { albumId: album.albumId, artistName: album.artist }, album.title)} className="flex-shrink-0 w-32 md:w-40 text-left snap-start">
                        <div className="relative">
                            <img src={album.coverArt} alt={album.title} className="w-full aspect-square rounded-lg object-cover shadow-md mb-2" />
                            <div className="absolute -bottom-2 -left-2 bg-black/80 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center font-bold text-white border border-zinc-700/50">{i + 1}</div>
                        </div>
                        <p className="font-semibold line-clamp-1 mt-2 text-sm">{album.title}</p>
                        <p className="text-zinc-400 line-clamp-1 text-xs">{album.artist}</p>
                    </button>
                ))}
            </div>
        </Section>
    </div>
);

const ITunesSongChart: React.FC<{ songs: ITunesSong[]; title: string }> = ({ songs, title }) => (
    <div className="px-4 pb-8 pt-2">
        {songs.map((song, i) => (
            <button key={song.uniqueId} className="w-full flex items-center gap-3 py-3 border-b border-zinc-800/50">
                <div className="text-xl font-bold w-8 text-zinc-400 text-center">{i + 1}</div>
                <img src={song.coverArt} alt={song.title} className="w-14 h-14 rounded-md object-cover shadow-sm" />
                <div className="flex-grow text-left">
                    <p className="font-semibold line-clamp-1">{song.title}</p>
                    <p className="text-zinc-400 line-clamp-1 text-sm">{song.artist}</p>
                    {/* Fake Sales Data string */}
                    <p className="text-zinc-600 text-[10px] mt-0.5">{formatNumber(song.sales)} unit sales</p>
                </div>
                <div className="border border-[#0b84fe] rounded-full px-4 py-1 text-sm font-bold text-[#0b84fe] bg-[#0b84fe]/10">
                    {song.price}
                </div>
            </button>
        ))}
    </div>
);

const ITunesAlbumChart: React.FC<{ albums: ITunesAlbum[]; title: string; navigateTo: Function }> = ({ albums, title, navigateTo }) => (
     <div className="px-4 pb-8 pt-2">
        {albums.map((album, i) => (
            <button key={album.uniqueId} onClick={() => navigateTo('albumDetail', { albumId: album.albumId, artistName: album.artist }, album.title)} className="w-full flex items-center gap-3 py-3 border-b border-zinc-800/50">
                <div className="text-xl font-bold w-8 text-zinc-400 text-center">{i + 1}</div>
                <img src={album.coverArt} alt={album.title} className="w-16 h-16 rounded-md object-cover shadow-sm" />
                <div className="flex-grow text-left">
                    <p className="font-semibold line-clamp-1">{album.title}</p>
                    <p className="text-zinc-400 line-clamp-1 text-sm">{album.artist}</p>
                    <StarRating rating={album.rating} count={album.reviewCount} />
                    <p className="text-zinc-600 text-[10px]">{formatNumber(album.sales)} unit sales</p>
                </div>
                <div className="border border-[#0b84fe] rounded-full px-4 py-1 text-sm font-bold text-[#0b84fe] bg-[#0b84fe]/10">
                    {album.price}
                </div>
            </button>
        ))}
    </div>
);

const ITunesArtistView: React.FC<{ artist: any, songs: ITunesSong[], albums: ITunesAlbum[], navigateTo: Function }> = ({ artist, songs, albums, navigateTo }) => (
    <div className="space-y-4">
        <Section title="Albums" onSeeAll={() => {}}>
            <div className="flex gap-4 px-4 overflow-x-auto pb-4">
                {albums.map(album => <AlbumGridItem key={album.uniqueId} album={album} onClick={() => navigateTo('albumDetail', { albumId: album.albumId, artistName: album.artist }, album.title)} />)}
            </div>
        </Section>
        <Section title="Songs" onSeeAll={() => {}}>
             <div className="px-4">
                {songs.slice(0, 5).map(song => <SongRow key={song.uniqueId} song={song} onClick={() => {}} />)}
            </div>
        </Section>
    </div>
);

const ITunesAlbumDetail: React.FC<{ albumData: any; navigateTo: Function }> = ({ albumData, navigateTo }) => {
    const { title, artist, coverArt, price, rating, reviewCount, songCount, releaseDate, isPreorder, tracks } = albumData;
    const releaseYear = new Date(releaseDate.year, 0, 1).getFullYear();
    const popularityMax = Math.max(...tracks.map((t: any) => t.weeklyStreams || 0), 1);

    return (
        <div className="px-4 pb-8">
            <div className="flex gap-4 mt-4">
                <img src={coverArt} alt={title} className="w-28 h-28 rounded-lg object-cover flex-shrink-0" />
                <div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={() => navigateTo('artist', { artistId: artist.id, artistName: artist.name }, artist.name)} className="text-lg text-red-400">{artist}</button>
                    <p className="text-sm text-zinc-400 uppercase">Pop • {releaseYear}</p>
                    <StarRating rating={rating} count={reviewCount} />
                    {isPreorder && <p className="text-xs font-bold text-red-400 bg-red-900/50 px-2 py-1 rounded-full mt-1 inline-block">PRE-ORDER</p>}
                </div>
            </div>
            <button className="w-full bg-[#0b84fe] text-white font-bold py-2 rounded-md mt-4">{isPreorder ? `PRE-ORDER ${price}` : price}</button>
            <div className="mt-4 border-b border-t border-zinc-800">
                <table className="w-full text-left text-zinc-400">
                    <thead>
                        <tr className="text-xs uppercase">
                            <th className="p-2 w-8 text-center">#</th>
                            <th className="p-2">Name</th>
                            <th className="p-2 w-24">Popularity</th>
                            <th className="p-2 w-20 text-right">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tracks.map((track: any, i: number) => (
                            <tr key={track.uniqueId || i} className="border-t border-zinc-800">
                                <td className="p-2 text-center">{i + 1}</td>
                                <td className="p-2 text-white font-semibold">{track.title}</td>
                                <td className="p-2"><div className="w-full h-1.5 bg-zinc-700 rounded-full"><div className="h-1.5 bg-zinc-400 rounded-full" style={{width: `${(track.weeklyStreams / popularityMax) * 100}%`}}></div></div></td>
                                <td className="p-2 text-right">
                                    {track.isAvailable ? <span className="text-[#0b84fe] font-bold">{track.price}</span> : <span className="text-xs">ALBUM ONLY</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-zinc-500 mt-4">{releaseYear} {artist}</p>
            <p className="text-xs text-zinc-500 mt-1">{songCount} Songs</p>
        </div>
    );
};

// --- MAIN VIEW COMPONENT ---
const ITunesView: React.FC = () => {
    const { dispatch } = useGame();
    const data = useItunesData();
    const [viewStack, setViewStack] = useState<{ mode: ITunesViewMode; data?: any; title?: string }[]>([{ mode: 'home', title: 'Music' }]);
    const [currentTab, setCurrentTab] = useState<'featured' | 'charts'>('featured');

    const currentView = viewStack[viewStack.length - 1];

    const navigateTo = (mode: ITunesViewMode, data?: any, title?: string) => {
        setViewStack(prev => [...prev, { mode, data, title }]);
    };

    const goBack = () => {
        if (viewStack.length > 1) {
            setViewStack(prev => prev.slice(0, -1));
        } else {
            dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
        }
    };
    
    const handleTabChange = (tab: 'featured' | 'charts') => {
        setCurrentTab(tab);
        if (viewStack.length === 1) {
            const mode = tab === 'featured' ? 'home' : 'charts';
            setViewStack([{ mode, title: 'Music' }]);
        }
    }

    const renderView = () => {
        switch (currentView.mode) {
            case 'home':
            case 'charts':
                const HomeOrCharts = currentView.mode === 'home' ? ITunesHome : ITunesCharts;
                return <HomeOrCharts data={data} navigateTo={navigateTo} />;
            case 'songChart':
                return <ITunesSongChart songs={currentView.data.songs} title={currentView.data.title} />;
            case 'albumChart':
                return <ITunesAlbumChart albums={currentView.data.albums} title={currentView.data.title} navigateTo={navigateTo} />;
            case 'artist':
                const artistSongs = data.getArtistSongs(currentView.data.artistName);
                const artistAlbums = data.getArtistAlbums(currentView.data.artistName);
                return <ITunesArtistView artist={currentView.data} songs={artistSongs} albums={artistAlbums} navigateTo={navigateTo} />;
            case 'albumDetail':
                const albumData = data.getAlbumDetails(currentView.data.albumId);
                if (!albumData) return <p className="p-4">Album not found.</p>;
                return <ITunesAlbumDetail albumData={albumData} navigateTo={navigateTo} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-black text-[#f1f1f1] min-h-screen font-sans">
            <ITunesHeader viewStack={viewStack} onBack={goBack} currentTab={currentTab} onTabChange={handleTabChange} />
            <div className="overflow-y-auto">
                {renderView()}
            </div>
        </div>
    );
};

export default ITunesView;
