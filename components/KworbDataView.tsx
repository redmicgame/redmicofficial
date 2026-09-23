import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import ChevronLeftIcon from './icons/ChevronLeftIcon';

interface KworbSong {
    id: string;
    title: string;
    streams: number;
    weeklyStreams: number;
    isFeature: boolean;
    isSolo: boolean;
    isLead: boolean;
    albumTitle?: string;
}

interface KworbAlbum {
    id: string;
    title: string;
    streams: number;
    weeklyStreams: number;
    isDeluxeOrCompilation?: boolean;
}

/**
 * Computes the accurate weekly Spotify streams for a song based on:
 * 1. Official Spotify Global chart entry (if currently charting)
 * 2. Rolling 7-day sum from dailyStreams (Daily Mode or rolling window)
 * 3. Actual streams earned during the previous week (actualLastWeekStreams)
 * 4. Simulated weekly stream volume (lastWeekStreams)
 * 5. Last day streams scaled to 7 days
 * 6. Release week debut streams for brand new releases
 * 7. Decayed catalog streaming formula from GameContext
 */
export function computeSongWeeklyStreams(
    song: any,
    gameState: any,
    artistData: any
): number {
    if (!song) return 0;

    // If song was taken down or removed from streaming
    if (song.isTakenDown || song.isAvailableOnStreaming === false) {
        return 0;
    }

    const totalStreams = typeof song.streams === 'number' ? song.streams : 0;
    if (totalStreams === 0 && !song.isReleased) {
        return 0;
    }

    // 1. Check if the song has an entry on Spotify Global Chart
    const spotifyGlobal = gameState?.spotifyGlobal || [];
    const chartMatch = spotifyGlobal.find((e: any) => 
        (e.songId && e.songId === song.id) ||
        (e.uniqueId && e.uniqueId === song.id) ||
        (e.title && song.title && e.title.trim().toLowerCase() === song.title.trim().toLowerCase())
    );
    if (chartMatch && typeof chartMatch.weeklyStreams === 'number' && chartMatch.weeklyStreams > 0) {
        return totalStreams > 0 ? Math.min(chartMatch.weeklyStreams, totalStreams) : chartMatch.weeklyStreams;
    }

    // 2. Check rolling dailyStreams (Daily Mode or rolling 7-day window)
    if (Array.isArray(song.dailyStreams) && song.dailyStreams.length > 0) {
        const last7 = song.dailyStreams.slice(-7);
        if (last7.length >= 7) {
            const sum7 = last7.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
            if (sum7 > 0) {
                return totalStreams > 0 ? Math.min(sum7, totalStreams) : sum7;
            }
        } else if (last7.length > 0) {
            const sum = last7.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
            if (sum > 0) {
                const pace = Math.round((sum / last7.length) * 7);
                return totalStreams > 0 ? Math.min(pace, totalStreams) : pace;
            }
        }
    }

    // 3. Check actualLastWeekStreams (exact streaming units logged in last simulated week)
    if (typeof song.actualLastWeekStreams === 'number' && song.actualLastWeekStreams > 0) {
        return totalStreams > 0 ? Math.min(song.actualLastWeekStreams, totalStreams) : song.actualLastWeekStreams;
    }

    // 4. Check lastWeekStreams (simulated weekly stream volume from GameContext)
    if (typeof song.lastWeekStreams === 'number' && song.lastWeekStreams > 0) {
        return totalStreams > 0 ? Math.min(song.lastWeekStreams, totalStreams) : song.lastWeekStreams;
    }

    // 5. Check lastDayStreams (scale 1 day to 7 days)
    if (typeof song.lastDayStreams === 'number' && song.lastDayStreams > 0) {
        const projected = song.lastDayStreams * 7;
        return totalStreams > 0 ? Math.min(projected, totalStreams) : projected;
    }

    // 6. Check weeklyStreams property if present on the song object
    if (typeof song.weeklyStreams === 'number' && song.weeklyStreams > 0) {
        return totalStreams > 0 ? Math.min(song.weeklyStreams, totalStreams) : song.weeklyStreams;
    }

    // 7. Check firstWeekStreams (if in debut release period)
    if (typeof song.firstWeekStreams === 'number' && song.firstWeekStreams > 0) {
        return totalStreams > 0 ? Math.min(song.firstWeekStreams, totalStreams) : song.firstWeekStreams;
    }

    // 8. If the song is recently released (debut week / within 1-2 weeks of release date)
    const currentDate = gameState?.date || { year: 2026, week: 1 };
    const releaseDate = song.releaseDate;
    if (releaseDate && totalStreams > 0) {
        const ageInWeeks = (currentDate.year - releaseDate.year) * 52 + (currentDate.week - releaseDate.week);
        if (ageInWeeks <= 1) {
            return totalStreams;
        }
    }

    // 9. Catalog stream fallback using the official game formulas from GameContext.tsx
    if (song.isReleased && totalStreams > 0) {
        const pop = artistData?.popularity || 10;
        const hype = artistData?.hype || 0;
        const quality = song.quality || 50;
        const baseWeekly = Math.floor((quality ** 2) * 20 * (pop / 40 + 0.5) * (1 + hype / 200));
        // Catalog streams are a realistic percentage of total catalog volume
        const realisticWeekly = Math.min(baseWeekly, Math.floor(totalStreams * 0.25));
        return Math.max(100, Math.min(realisticWeekly, totalStreams));
    }

    return 0;
}

export const KworbDataView: React.FC = () => {
    const { gameState, activeArtist, activeArtistData, allPlayerArtists, dispatch } = useGame();
    const [activeTab, setActiveTab] = useState<'songs' | 'albums'>('songs');
    const [selectedArtistId, setSelectedArtistId] = useState<string>(activeArtist?.id || '');
    const [sortMode, setSortMode] = useState<'weekly' | 'streams'>('weekly');

    // Compute formatted Last Updated date YYYY/MM/DD
    const formattedLastUpdated = useMemo(() => {
        const gameDate = gameState.date || { year: 2026, week: 38, day: 1 };
        const d = new Date(gameDate.year, 0, 1 + (gameDate.week - 1) * 7 + (gameDate.day ? gameDate.day - 1 : 0));
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
    }, [gameState.date]);

    // Active artist display name & data
    const { currentArtistName, currentArtistData } = useMemo(() => {
        const artist = allPlayerArtists.find(a => a.id === selectedArtistId) || activeArtist;
        const artId = artist?.id || activeArtist?.id || '';
        const data = (artId === activeArtist?.id ? activeArtistData : gameState.artistsData?.[artId]) || activeArtistData;
        return {
            currentArtistName: artist?.name || 'Your Artist',
            currentArtistData: data
        };
    }, [selectedArtistId, allPlayerArtists, activeArtist, activeArtistData, gameState.artistsData]);

    // Compute song list for current selected artist with accurate weekly streams
    const songsData = useMemo<KworbSong[]>(() => {
        const rawSongs = currentArtistData?.songs || [];
        const artistNameLower = currentArtistName.toLowerCase();

        const mapped: KworbSong[] = rawSongs.map(song => {
            const isNpcFeature = Boolean(song.isFeatureToNpc);
            const titleLower = (song.title || '').toLowerCase();
            const isCollabFeature = Boolean(
                song.collaboration && 
                (song.collaboration as any).isMainArtist === false
            );
            const isTitleFeature = titleLower.includes(`(with ${artistNameLower}`) ||
                                   titleLower.includes(`(feat. ${artistNameLower}`) ||
                                   titleLower.includes(`(ft. ${artistNameLower}`);

            const isFeature = isNpcFeature || isCollabFeature || isTitleFeature;
            const hasGuestArtists = Boolean(
                (song.features && song.features.length > 0) || 
                song.collaboration
            );

            const isLead = !isFeature;
            const isSolo = isLead && !hasGuestArtists;

            const streams = typeof song.streams === 'number' ? song.streams : 0;
            // Use accurate weekly stream calculation
            const weekly = computeSongWeeklyStreams(song, gameState, currentArtistData);

            const prefix = isFeature ? '* ' : '';
            return {
                id: song.id,
                title: prefix + song.title,
                streams,
                weeklyStreams: weekly,
                isFeature,
                isLead,
                isSolo,
                albumTitle: song.albumTitle,
            };
        });

        if (sortMode === 'weekly') {
            return mapped.sort((a, b) => b.weeklyStreams - a.weeklyStreams);
        }
        return mapped.sort((a, b) => b.streams - a.streams);
    }, [currentArtistData, currentArtistName, gameState, sortMode]);

    // Compute albums data for current selected artist with accurate weekly streams
    const albumsData = useMemo<KworbAlbum[]>(() => {
        const releases = currentArtistData?.releases || [];
        const songMap = new Map((currentArtistData?.songs || []).map(s => [s.id, s]));

        const mapped: KworbAlbum[] = releases
            .filter(r => r.type === 'Album' || r.type === 'EP' || r.type === 'Deluxe' || r.type === 'Mixtape' || (r.songIds && r.songIds.length > 1))
            .map(rel => {
                let totalAlbumStreams = 0;
                let totalAlbumWeekly = 0;

                rel.songIds?.forEach(sId => {
                    const song = songMap.get(sId);
                    if (song) {
                        totalAlbumStreams += song.streams || 0;
                        totalAlbumWeekly += computeSongWeeklyStreams(song, gameState, currentArtistData);
                    }
                });

                // Fallback for releases without individual track mappings (e.g. legacy saves or copies sold)
                if (totalAlbumStreams === 0 && rel.copiesSold) {
                    totalAlbumStreams = rel.copiesSold * 1500;
                    // Check if on Billboard Top Albums chart
                    const albumEntry = gameState?.billboardTopAlbums?.find((a: any) => 
                        (a.albumId && a.albumId === rel.id) ||
                        (a.title && rel.title && a.title.trim().toLowerCase() === rel.title.trim().toLowerCase())
                    );
                    if (albumEntry && albumEntry.weeklySES) {
                        totalAlbumWeekly = albumEntry.weeklySES * 1500;
                    } else if (albumEntry && albumEntry.weeklyActivity) {
                        totalAlbumWeekly = albumEntry.weeklyActivity * 1500;
                    } else {
                        totalAlbumWeekly = Math.min(totalAlbumStreams, Math.round(totalAlbumStreams * 0.05));
                    }
                }

                // Ensure weekly streams never exceed total streams
                if (totalAlbumStreams > 0 && totalAlbumWeekly > totalAlbumStreams) {
                    totalAlbumWeekly = totalAlbumStreams;
                }

                const isDeluxe = rel.title.toLowerCase().includes('deluxe') || 
                                 rel.title.toLowerCase().includes('edition') || 
                                 rel.title.toLowerCase().includes('anniversary') ||
                                 rel.type === 'Deluxe';

                const titleWithCaret = isDeluxe ? `^ ${rel.title}` : rel.title;

                return {
                    id: rel.id,
                    title: titleWithCaret,
                    streams: totalAlbumStreams,
                    weeklyStreams: totalAlbumWeekly,
                    isDeluxeOrCompilation: isDeluxe,
                };
            });

        if (sortMode === 'weekly') {
            return mapped.sort((a, b) => b.weeklyStreams - a.weeklyStreams);
        }
        return mapped.sort((a, b) => b.streams - a.streams);
    }, [currentArtistData, gameState, sortMode]);

    // Compute Summary Table metrics (Streams, Weekly, Tracks separated by Total, As lead, Solo, As feature (*))
    const summaryMetrics = useMemo(() => {
        let totalStreams = 0;
        let leadStreams = 0;
        let soloStreams = 0;
        let featureStreams = 0;

        let totalWeekly = 0;
        let leadWeekly = 0;
        let soloWeekly = 0;
        let featureWeekly = 0;

        let totalTracks = 0;
        let leadTracks = 0;
        let soloTracks = 0;
        let featureTracks = 0;

        songsData.forEach(song => {
            totalStreams += song.streams;
            totalWeekly += song.weeklyStreams;
            totalTracks += 1;

            if (song.isFeature) {
                featureStreams += song.streams;
                featureWeekly += song.weeklyStreams;
                featureTracks += 1;
            } else {
                leadStreams += song.streams;
                leadWeekly += song.weeklyStreams;
                leadTracks += 1;

                if (song.isSolo) {
                    soloStreams += song.streams;
                    soloWeekly += song.weeklyStreams;
                    soloTracks += 1;
                }
            }
        });

        return {
            streams: {
                total: totalStreams,
                asLead: leadStreams,
                solo: soloStreams,
                asFeature: featureStreams,
            },
            weekly: {
                total: totalWeekly,
                asLead: leadWeekly,
                solo: soloWeekly,
                asFeature: featureWeekly,
            },
            tracks: {
                total: totalTracks,
                asLead: leadTracks,
                solo: soloTracks,
                asFeature: featureTracks,
            }
        };
    }, [songsData]);

    return (
        <div className="bg-white h-full w-full overflow-y-auto overflow-x-hidden text-black font-sans pb-28 selection:bg-[#00247d] selection:text-white">
            {/* Top Toolbar / App Bar */}
            <div className="sticky top-0 z-20 bg-[#f2f4f8] border-b border-gray-300 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'game' })}
                        className="flex items-center gap-1 font-bold text-gray-700 hover:text-black transition-colors"
                    >
                        <ChevronLeftIcon className="w-4 h-4" /> Back to Game
                    </button>
                    <span className="text-gray-400">|</span>
                    <span className="font-extrabold tracking-wider text-[#00247d] text-sm">KWORB DATA</span>
                </div>

                {/* Artist Selector Switcher & Sort Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                    {allPlayerArtists.length > 1 && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-gray-600 font-semibold">Artist:</span>
                            <select
                                value={selectedArtistId || activeArtist?.id || ''}
                                onChange={(e) => setSelectedArtistId(e.target.value)}
                                className="bg-white border border-gray-300 rounded px-2.5 py-1 text-xs font-bold text-gray-900 shadow-sm cursor-pointer outline-none focus:border-[#00247d]"
                            >
                                {allPlayerArtists.map(art => (
                                    <option key={art.id} value={art.id}>
                                        {art.name} {art.id === activeArtist?.id ? '(Active)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center gap-1 border border-gray-300 bg-white rounded p-0.5">
                        <button
                            onClick={() => setSortMode('weekly')}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${sortMode === 'weekly' ? 'bg-[#00247d] text-white' : 'text-gray-600 hover:text-black'}`}
                            title="Sort by weekly streams"
                        >
                            Sort: Weekly
                        </button>
                        <button
                            onClick={() => setSortMode('streams')}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${sortMode === 'streams' ? 'bg-[#00247d] text-white' : 'text-gray-600 hover:text-black'}`}
                            title="Sort by all-time streams"
                        >
                            Sort: Total
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5">
                {/* Kworb Blue Header Navigation Tabs (Matches Screenshot 2) */}
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => setActiveTab('songs')}
                        className={`px-8 py-2.5 text-sm font-bold tracking-tight transition-colors ${
                            activeTab === 'songs'
                                ? 'bg-[#00247d] text-white shadow-sm'
                                : 'bg-[#001c5c] text-blue-200 hover:bg-[#00247d] hover:text-white'
                        }`}
                    >
                        Songs
                    </button>
                    <button
                        onClick={() => setActiveTab('albums')}
                        className={`px-8 py-2.5 text-sm font-bold tracking-tight transition-colors ${
                            activeTab === 'albums'
                                ? 'bg-[#00247d] text-white shadow-sm'
                                : 'bg-[#001c5c] text-blue-200 hover:bg-[#00247d] hover:text-white'
                        }`}
                    >
                        Albums
                    </button>
                </div>

                {/* Main Artist Page Heading */}
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-950 mt-5 font-['Arial',sans-serif]">
                    {currentArtistName} - Spotify Top {activeTab === 'songs' ? 'Songs |' : 'Albums'}
                </h1>

                {/* Last Updated Date */}
                <p className="text-sm font-medium text-gray-800 mt-2 mb-6">
                    Last updated: {formattedLastUpdated}
                </p>

                {/* Summary Table: Separating by Lead, Feature, Solo (Active on Songs Tab) */}
                {activeTab === 'songs' && (
                    <div className="overflow-x-auto mb-8 border border-gray-200 shadow-sm rounded-sm bg-white">
                        <table className="w-full text-right text-xs sm:text-sm border-collapse font-['Arial',sans-serif]">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/70">
                                    <th className="py-2.5 px-3 sm:px-4 text-left font-bold text-gray-900 w-24"></th>
                                    <th className="py-2.5 px-3 sm:px-4 font-bold text-gray-900">Total</th>
                                    <th className="py-2.5 px-3 sm:px-4 font-bold text-gray-900">As lead</th>
                                    <th className="py-2.5 px-3 sm:px-4 font-bold text-gray-900">Solo</th>
                                    <th className="py-2.5 px-3 sm:px-4 font-bold text-gray-900">As feature (*)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 tabular-nums">
                                <tr className="hover:bg-gray-50/50">
                                    <td className="py-2 px-3 sm:px-4 text-left font-bold text-gray-900">Streams</td>
                                    <td className="py-2 px-3 sm:px-4 text-gray-800 font-medium">{summaryMetrics.streams.total.toLocaleString()}</td>
                                    <td className="py-2 px-3 sm:px-4 text-gray-800">{summaryMetrics.streams.asLead.toLocaleString()}</td>
                                    <td className="py-2 px-3 sm:px-4 text-gray-800">{summaryMetrics.streams.solo.toLocaleString()}</td>
                                    <td className="py-2 px-3 sm:px-4 text-gray-800">{summaryMetrics.streams.asFeature.toLocaleString()}</td>
                                </tr>
                                <tr className="bg-[#f9fafb] hover:bg-gray-100/60">
                                    <td className="py-2 px-3 sm:px-4 text-left font-bold text-gray-900">Weekly</td>
                                    <td className="py-2 px-3 sm:px-4 text-gray-800 font-medium">{summaryMetrics.weekly.total.toLocaleString()}</td>
                                    <td className="py-2 px-3 sm:px-4 text-gray-800">{summaryMetrics.weekly.asLead.toLocaleString()}</td>
                                    <td className="py-2 px-3 sm:px-4 text-gray-800">{summaryMetrics.weekly.solo.toLocaleString()}</td>
                                    <td className="py-2 px-3 sm:px-4 text-gray-800">{summaryMetrics.weekly.asFeature.toLocaleString()}</td>
                                </tr>
                                <tr className="hover:bg-gray-50/50">
                                    <td className="py-2 px-3 sm:px-4 text-left font-bold text-gray-900">Tracks</td>
                                    <td className="py-2 px-3 sm:px-4 text-gray-800 font-medium">{summaryMetrics.tracks.total.toLocaleString()}</td>
                                    <td className="py-2 px-3 sm:px-4 text-gray-800">{summaryMetrics.tracks.asLead.toLocaleString()}</td>
                                    <td className="py-2 px-3 sm:px-4 text-gray-800">{summaryMetrics.tracks.solo.toLocaleString()}</td>
                                    <td className="py-2 px-3 sm:px-4 text-gray-800">{summaryMetrics.tracks.asFeature.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* SONGS VIEW TABLE */}
                {activeTab === 'songs' && (
                    <div className="overflow-x-auto border border-gray-200 rounded-sm shadow-sm">
                        <table className="w-full text-xs sm:text-sm border-collapse font-['Arial',sans-serif]">
                            <thead>
                                <tr className="border-b border-gray-300 bg-gray-50/80">
                                    <th className="py-2.5 px-3 text-center w-12 font-bold text-gray-900">#</th>
                                    <th className="py-2.5 px-3 text-left font-bold text-gray-900">Song Title</th>
                                    <th 
                                        onClick={() => setSortMode('streams')}
                                        className={`py-2.5 px-3 sm:px-5 text-right font-bold cursor-pointer hover:text-[#00247d] ${sortMode === 'streams' ? 'text-[#00247d] underline' : 'text-gray-900'}`}
                                    >
                                        Streams
                                    </th>
                                    <th 
                                        onClick={() => setSortMode('weekly')}
                                        className={`py-2.5 px-3 sm:px-5 text-right font-bold cursor-pointer hover:text-[#00247d] ${sortMode === 'weekly' ? 'text-[#00247d] underline' : 'text-gray-900'}`}
                                    >
                                        Weekly
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="tabular-nums">
                                {songsData.map((song, index) => (
                                    <tr 
                                        key={song.id} 
                                        className={`border-b border-gray-100 hover:bg-yellow-50/60 transition-colors ${index % 2 === 1 ? 'bg-[#f8f9fa]' : 'bg-white'}`}
                                    >
                                        <td className="py-2 px-3 text-center text-gray-600 font-medium">
                                            {index + 1}
                                        </td>
                                        <td className="py-2 px-3 text-left">
                                            <span 
                                                className="text-[#8b1a1a] font-normal hover:underline cursor-pointer"
                                                title={`Streams: ${song.streams.toLocaleString()} | Weekly: ${song.weeklyStreams.toLocaleString()}`}
                                            >
                                                {song.title}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 sm:px-5 text-right text-gray-800 font-normal">
                                            {song.streams.toLocaleString()}
                                        </td>
                                        <td className="py-2 px-3 sm:px-5 text-right text-gray-800 font-normal">
                                            {song.weeklyStreams.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {songsData.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-gray-500">
                                            No songs recorded yet for this artist. Record and release songs in the Studio to view your Spotify Kworb data!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ALBUMS VIEW TABLE */}
                {activeTab === 'albums' && (
                    <div className="overflow-x-auto border border-gray-200 rounded-sm shadow-sm">
                        <table className="w-full text-xs sm:text-sm border-collapse font-['Arial',sans-serif]">
                            <thead>
                                <tr className="border-b border-gray-300 bg-gray-50/80">
                                    <th className="py-2.5 px-3 text-center w-12 font-bold text-gray-900">#</th>
                                    <th className="py-2.5 px-3 text-left font-bold text-gray-900">Album Title</th>
                                    <th 
                                        onClick={() => setSortMode('streams')}
                                        className={`py-2.5 px-3 sm:px-5 text-right font-bold cursor-pointer hover:text-[#00247d] ${sortMode === 'streams' ? 'text-[#00247d] underline' : 'text-gray-900'}`}
                                    >
                                        Streams
                                    </th>
                                    <th 
                                        onClick={() => setSortMode('weekly')}
                                        className={`py-2.5 px-3 sm:px-5 text-right font-bold cursor-pointer hover:text-[#00247d] ${sortMode === 'weekly' ? 'text-[#00247d] underline' : 'text-gray-900'}`}
                                    >
                                        Weekly
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="tabular-nums">
                                {albumsData.map((album, index) => (
                                    <tr 
                                        key={album.id} 
                                        className={`border-b border-gray-100 hover:bg-yellow-50/60 transition-colors ${index % 2 === 1 ? 'bg-[#f8f9fa]' : 'bg-white'}`}
                                    >
                                        <td className="py-2 px-3 text-center text-gray-600 font-medium">
                                            {index + 1}
                                        </td>
                                        <td className="py-2 px-3 text-left">
                                            <span 
                                                className="text-[#8b1a1a] font-normal hover:underline cursor-pointer"
                                                title={`Total Streams: ${album.streams.toLocaleString()} | Weekly: ${album.weeklyStreams.toLocaleString()}`}
                                            >
                                                {album.title}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 sm:px-5 text-right text-gray-800 font-normal">
                                            {album.streams.toLocaleString()}
                                        </td>
                                        <td className="py-2 px-3 sm:px-5 text-right text-gray-800 font-normal">
                                            {album.weeklyStreams.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {albumsData.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-gray-500">
                                            No albums or EPs released yet for this artist. Release an album or mixtape to view your Spotify Kworb album rankings!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer notes matching Kworb.net */}
                <div className="mt-8 text-xs text-gray-500 space-y-1 pb-16">
                    <p>* Feature tracks are denoted with an asterisk.</p>
                    <p>^ Deluxe, Anniversary, or Compilation editions are marked with a caret symbol.</p>
                    <p>Data reflects Spotify streaming activity tabulated weekly.</p>
                </div>
            </div>
        </div>
    );
};
