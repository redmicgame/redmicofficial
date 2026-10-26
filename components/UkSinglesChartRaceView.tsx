import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { getArtistImage } from '../constants';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PlayIcon from './icons/PlayIcon';
import DownloadIcon from './icons/DownloadIcon';

interface SongRaceData {
    id: string;
    title: string;
    artist: string;
    coverArt: string;
    color: string;
    points: Map<string, number>; // key: `${year}_${week}` -> rank
    firstWeekKey: string;
    lastWeekKey: string;
    peak: number;
}

interface WeekTimelineItem {
    key: string; // `${year}_${week}`
    year: number;
    week: number;
    label: string; // e.g. "JUL W1 - 2013"
}

interface SongAudioEntry {
    type: 'file' | 'spotify';
    url: string;
    name: string;
    spotifyTrackId?: string;
    spotifyUrl?: string;
    blob?: Blob;
}

const SONG_COLORS = [
    '#38bdf8', // Sky Blue
    '#ff2e93', // UK Chart Hot Pink
    '#f59e0b', // Amber / Gold
    '#10b981', // Emerald
    '#818cf8', // Indigo
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#ec4899', // Pink
    '#a855f7', // Purple
    '#14b8a6', // Teal
    '#84cc16', // Lime
];

function formatWeekLabel(year: number, week: number): string {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthIdx = Math.min(11, Math.max(0, Math.floor(((week - 1) / 52) * 12)));
    const weekInMonth = ((week - 1) % 4) + 1;
    const m = months[monthIdx];
    return `${m} W${weekInMonth} - ${year}`;
}

// IndexedDB Helper for persistent MP3 and Spotify storage for UK Singles
const DB_NAME = 'UkSinglesAudioDB';
const STORE_NAME = 'songAudio';

async function openAudioDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 2);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(STORE_NAME)) {
                req.result.createObjectStore(STORE_NAME, { keyPath: 'songId' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveAudioToDB(songId: string, entry: SongAudioEntry) {
    try {
        const db = await openAudioDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({
            songId,
            type: entry.type,
            name: entry.name,
            url: entry.url,
            spotifyTrackId: entry.spotifyTrackId,
            spotifyUrl: entry.spotifyUrl,
            blob: entry.blob,
        });
    } catch (e) {
        console.error('Failed to save audio to UK IndexedDB', e);
    }
}

async function loadAllAudioFromDB(): Promise<Record<string, SongAudioEntry>> {
    try {
        const db = await openAudioDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => {
                const results: Record<string, SongAudioEntry> = {};
                (req.result || []).forEach((item: any) => {
                    if (item.type === 'spotify') {
                        results[item.songId] = {
                            type: 'spotify',
                            url: item.url,
                            name: item.name || 'Spotify Track',
                            spotifyTrackId: item.spotifyTrackId,
                            spotifyUrl: item.spotifyUrl,
                        };
                    } else if (item.blob) {
                        results[item.songId] = {
                            type: 'file',
                            url: URL.createObjectURL(item.blob),
                            name: item.name || 'uploaded.mp3',
                            blob: item.blob,
                        };
                    } else if (item.url) {
                        results[item.songId] = {
                            type: 'file',
                            url: item.url,
                            name: item.name || 'Audio Track',
                        };
                    }
                });
                resolve(results);
            };
            req.onerror = () => resolve({});
        });
    } catch (e) {
        return {};
    }
}

async function deleteAudioFromDB(songId: string) {
    try {
        const db = await openAudioDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(songId);
    } catch (e) {
        console.error('Failed to delete audio from UK IndexedDB', e);
    }
}

const UkSinglesChartRaceView: React.FC = () => {
    const { gameState, dispatch, activeArtistData, activeArtist } = useGame();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const activePlayingSongIdRef = useRef<string | null>(null);

    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [speed, setSpeed] = useState<number>(1);
    const [currentProgress, setCurrentProgress] = useState<number>(0);
    const [skipInactivePeriods, setSkipInactivePeriods] = useState<boolean>(true);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordingProgress, setRecordingProgress] = useState<number>(0);
    const [audioMap, setAudioMap] = useState<Record<string, SongAudioEntry>>({});

    // Spotify link modal / input states
    const [activeSpotifyInputSongId, setActiveSpotifyInputSongId] = useState<string | null>(null);
    const [spotifyInputUrl, setSpotifyInputUrl] = useState<string>('');
    const [isFetchingSpotify, setIsFetchingSpotify] = useState<boolean>(false);
    const [spotifyInputError, setSpotifyInputError] = useState<string>('');

    const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
    const animFrameRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // Initialize audio element
    useEffect(() => {
        const audio = new Audio();
        audio.preload = 'auto';
        audioRef.current = audio;

        loadAllAudioFromDB().then((data) => {
            setAudioMap(data);
        });

        return () => {
            audio.pause();
            audio.src = '';
            audioRef.current = null;
        };
    }, []);

    const artistName = useMemo(() => {
        return activeArtist?.name || 'Artist';
    }, [activeArtist]);

    // Build timeline and songs dataset from actual player UK Singles chart history
    const { timeline, songsData } = useMemo(() => {
        const history = gameState.ukSinglesChartHistory || {};
        const playerSongs = activeArtistData?.songs || [];
        const chartedPlayerSongs: { song: any; hist: any }[] = [];

        // Check active artist's songs
        playerSongs.forEach((song) => {
            const hist = history[song.id] || history[song.uniqueId];
            if (hist && ((hist.chartRun && hist.chartRun.length > 0) || (hist.chartRunEntries && hist.chartRunEntries.length > 0))) {
                chartedPlayerSongs.push({ song, hist });
            }
        });

        // Also check collaborations / features in other artists' catalogs
        if (activeArtist?.name) {
            Object.values(gameState.artistsData || {}).forEach((data) => {
                (data.songs || []).forEach((song) => {
                    const isCollab = song.collaboration?.artistName === activeArtist.name ||
                        (song.features && song.features.includes(activeArtist.name));
                    if (isCollab && !chartedPlayerSongs.some(item => item.song.id === song.id)) {
                        const hist = history[song.id] || history[song.uniqueId];
                        if (hist && ((hist.chartRun && hist.chartRun.length > 0) || (hist.chartRunEntries && hist.chartRunEntries.length > 0))) {
                            chartedPlayerSongs.push({ song, hist });
                        }
                    }
                });
            });
        }

        if (chartedPlayerSongs.length === 0) {
            return { timeline: [], songsData: [] };
        }

        // Find min and max time across all charted songs
        let minTime = Infinity;
        let maxTime = -Infinity;

        const songs: SongRaceData[] = chartedPlayerSongs.map(({ song, hist }, idx) => {
            const points = new Map<string, number>();
            let firstYear = hist.firstEntered?.year || gameState.date.year;
            let firstWeek = hist.firstEntered?.week || gameState.date.week;

            if (hist.chartRunEntries && hist.chartRunEntries.length > 0) {
                hist.chartRunEntries.forEach((entry: { year: number; week: number; rank: number }) => {
                    points.set(`${entry.year}_${entry.week}`, entry.rank);
                    const t = entry.year * 52 + entry.week - 1;
                    if (t < minTime) minTime = t;
                    if (t > maxTime) maxTime = t;
                });
                firstYear = hist.chartRunEntries[0].year;
                firstWeek = hist.chartRunEntries[0].week;
            } else if (hist.chartRun && hist.chartRun.length > 0) {
                hist.chartRun.forEach((r: number, i: number) => {
                    const t = firstYear * 52 + firstWeek - 1 + i;
                    const y = Math.floor(t / 52);
                    const w = (t % 52) + 1;
                    points.set(`${y}_${w}`, r);
                    if (t < minTime) minTime = t;
                    if (t > maxTime) maxTime = t;
                });
            }

            const cover = getArtistImage(activeArtist?.name || '', song.coverArt);

            return {
                id: song.id,
                title: song.title,
                artist: activeArtist?.name || song.artist || 'Artist',
                coverArt: cover,
                color: SONG_COLORS[idx % SONG_COLORS.length],
                points,
                firstWeekKey: `${firstYear}_${firstWeek}`,
                lastWeekKey: '',
                peak: hist.peak || 1,
            };
        });

        // Determine lastWeekKey for each song
        songs.forEach(s => {
            let lastT = -Infinity;
            let lastKey = '';
            s.points.forEach((_, key) => {
                const [y, w] = key.split('_').map(Number);
                const t = y * 52 + w - 1;
                if (t > lastT) {
                    lastT = t;
                    lastKey = key;
                }
            });
            s.lastWeekKey = lastKey;
        });

        // Build continuous weekly timeline array from first chart entry to last chart entry
        const timelineArr: WeekTimelineItem[] = [];
        for (let t = minTime; t <= maxTime; t++) {
            const y = Math.floor(t / 52);
            const w = (t % 52) + 1;
            timelineArr.push({
                key: `${y}_${w}`,
                year: y,
                week: w,
                label: formatWeekLabel(y, w),
            });
        }

        return { timeline: timelineArr, songsData: songs };
    }, [gameState.ukSinglesChartHistory, gameState.artistsData, gameState.date, activeArtistData, activeArtist]);

    // Precalculate all week indices that have at least 1 charted song
    const chartedWeekIndices = useMemo(() => {
        const indices: number[] = [];
        timeline.forEach((item, idx) => {
            const hasSong = songsData.some(s => s.points.has(item.key));
            if (hasSong) {
                indices.push(idx);
            }
        });
        return indices;
    }, [timeline, songsData]);

    // Find the currently HIGHEST charting song in the active week
    const highestPositionSong = useMemo(() => {
        if (timeline.length === 0) return null;
        const clampedProgress = Math.min(timeline.length - 1, Math.max(0, currentProgress));
        const currentIdx = Math.floor(clampedProgress);
        const currentWeekItem = timeline[currentIdx];
        if (!currentWeekItem) return null;

        let bestRank = 101;
        let topSong: SongRaceData | null = null;

        songsData.forEach(song => {
            const rank = song.points.get(currentWeekItem.key);
            if (rank !== undefined && rank < bestRank) {
                bestRank = rank;
                topSong = song;
            }
        });

        return topSong;
    }, [timeline, currentProgress, songsData]);

    // Synchronize MP3 / Spotify audio playback with the highest charting song
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.muted = isMuted;

        if (!isPlaying || !highestPositionSong) {
            if (!audio.paused) {
                audio.pause();
            }
            activePlayingSongIdRef.current = null;
            return;
        }

        const songId = highestPositionSong.id;
        const songAudio = audioMap[songId];

        if (!songAudio || !songAudio.url) {
            if (!audio.paused) {
                audio.pause();
            }
            activePlayingSongIdRef.current = null;
            return;
        }

        if (activePlayingSongIdRef.current !== songId) {
            activePlayingSongIdRef.current = songId;
            audio.src = songAudio.url;
            audio.currentTime = 0;
            audio.play().catch(e => {
                console.log('UK Audio playback caught:', e);
            });
        } else {
            if (audio.paused) {
                audio.play().catch(e => {
                    console.log('UK Audio playback caught:', e);
                });
            }
        }
    }, [isPlaying, highestPositionSong, audioMap, isMuted]);

    // Upload MP3 handler
    const handleUploadAudio = async (songId: string, file: File) => {
        const url = URL.createObjectURL(file);
        const entry: SongAudioEntry = {
            type: 'file',
            url,
            name: file.name,
            blob: file,
        };
        setAudioMap(prev => ({
            ...prev,
            [songId]: entry,
        }));
        await saveAudioToDB(songId, entry);
    };

    // Attach Spotify Link handler
    const handleAttachSpotify = async (songId: string, url: string) => {
        if (!url.trim()) return;
        setIsFetchingSpotify(true);
        setSpotifyInputError('');

        try {
            const trimmedUrl = url.trim();
            const trackIdMatch = trimmedUrl.match(/track[/:]([a-zA-Z0-9]+)/) || trimmedUrl.match(/spotify:track:([a-zA-Z0-9]+)/);
            const trackId = trackIdMatch ? trackIdMatch[1] : (trimmedUrl.startsWith('http') ? '' : trimmedUrl);

            const res = await fetch(`/api/spotify/track?url=${encodeURIComponent(trimmedUrl)}`);
            let data: any = null;
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                data = await res.json();
            } else {
                throw new Error(`Spotify service unavailable (${res.status}). Please check the link.`);
            }

            if (!res.ok || data?.error) {
                throw new Error(data?.error || `Failed to fetch Spotify track (${res.status})`);
            }

            if (!data.previewUrl) {
                throw new Error('This track does not have an audio preview on Spotify.');
            }

            const displayName = data.title ? `${data.title}${data.artist ? ` - ${data.artist}` : ''}` : 'Spotify Track';
            const audioEntry: SongAudioEntry = {
                type: 'spotify',
                url: data.previewUrl,
                name: displayName,
                spotifyTrackId: data.id || trackId,
                spotifyUrl: data.spotifyUrl || trimmedUrl,
            };

            setAudioMap(prev => ({
                ...prev,
                [songId]: audioEntry,
            }));

            await saveAudioToDB(songId, audioEntry);
            setActiveSpotifyInputSongId(null);
            setSpotifyInputUrl('');
        } catch (e: any) {
            setSpotifyInputError(e.message || 'Failed to fetch Spotify track. Please check the URL.');
        } finally {
            setIsFetchingSpotify(false);
        }
    };

    // Remove audio handler
    const handleRemoveAudio = async (songId: string) => {
        const existing = audioMap[songId];
        if (existing && existing.type === 'file') {
            URL.revokeObjectURL(existing.url);
        }
        setAudioMap(prev => {
            const next = { ...prev };
            delete next[songId];
            return next;
        });

        if (activePlayingSongIdRef.current === songId && audioRef.current) {
            audioRef.current.pause();
            activePlayingSongIdRef.current = null;
        }

        await deleteAudioFromDB(songId);
    };

    // Preload cover images
    useEffect(() => {
        songsData.forEach(song => {
            if (song.coverArt && !imageCacheRef.current.has(song.coverArt)) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = song.coverArt;
                img.onload = () => {
                    imageCacheRef.current.set(song.coverArt, img);
                };
            }
        });
    }, [songsData]);

    // Reset progress when timeline changes
    useEffect(() => {
        setCurrentProgress(0);
        setIsPlaying(true);
    }, [timeline.length]);

    // Jump to next or previous chart entry
    const handleNextEntry = useCallback(() => {
        const currentIdx = Math.floor(currentProgress);
        const next = chartedWeekIndices.find(idx => idx > currentIdx);
        if (next !== undefined) {
            setCurrentProgress(next);
        }
    }, [currentProgress, chartedWeekIndices]);

    const handlePrevEntry = useCallback(() => {
        const currentIdx = Math.floor(currentProgress);
        const prevs = chartedWeekIndices.filter(idx => idx < currentIdx);
        if (prevs.length > 0) {
            setCurrentProgress(prevs[prevs.length - 1]);
        } else {
            setCurrentProgress(0);
        }
    }, [currentProgress, chartedWeekIndices]);

    // Draw the UK Singles chart race frame on canvas
    const drawFrame = useCallback((progress: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width; // 1080
        const H = canvas.height; // 1080

        // Clear canvas with dark royal navy / midnight background
        ctx.fillStyle = '#060918';
        ctx.fillRect(0, 0, W, H);

        if (timeline.length === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 32px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No UK Singles Chart History Yet', W / 2, H / 2 - 20);
            ctx.font = '400 20px sans-serif';
            ctx.fillStyle = '#9ca3af';
            ctx.fillText('Release singles and chart in the UK to watch your chart race.', W / 2, H / 2 + 25);
            return;
        }

        const clampedProgress = Math.min(timeline.length - 1, Math.max(0, progress));
        const currentIdx = Math.floor(clampedProgress);
        const subFraction = clampedProgress - currentIdx;
        const currentWeekItem = timeline[currentIdx] || timeline[0];

        // 1. Find the song with the HIGHEST position (lowest rank number) in current week
        let currentTopSong: SongRaceData | null = null;
        let bestRank = 101;

        songsData.forEach(song => {
            const rank = song.points.get(currentWeekItem.key);
            if (rank !== undefined && rank < bestRank) {
                bestRank = rank;
                currentTopSong = song;
            }
        });

        // 2. Draw background cover art if highest position song exists
        if (currentTopSong) {
            const coverUrl = (currentTopSong as SongRaceData).coverArt;
            const img = imageCacheRef.current.get(coverUrl);
            if (img && img.complete) {
                ctx.save();
                ctx.globalAlpha = 0.25;
                ctx.drawImage(img, 0, 0, W, H);
                ctx.restore();
            }

            // Dark vignette overlay with subtle blue/pink ambient tint
            const gradient = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, W * 0.75);
            gradient.addColorStop(0, 'rgba(6, 9, 24, 0.50)');
            gradient.addColorStop(1, 'rgba(6, 9, 24, 0.90)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, W, H);

            // Large faint title across bottom center
            ctx.save();
            let bgFontSize = 64;
            ctx.font = `900 ${bgFontSize}px sans-serif`;
            const bgTitle = (currentTopSong as SongRaceData).title.toUpperCase();
            while (ctx.measureText(bgTitle).width > W - 100 && bgFontSize > 22) {
                bgFontSize -= 4;
                ctx.font = `900 ${bgFontSize}px sans-serif`;
            }
            ctx.fillStyle = 'rgba(255, 46, 147, 0.12)';
            ctx.textAlign = 'center';
            ctx.fillText(bgTitle, W / 2, 940);
            ctx.restore();
        }

        // 3. Top Header: “Artist Name” OFFICIAL UK SINGLES CHART RACE
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        let artistFontSize = 46;
        ctx.font = `900 ${artistFontSize}px sans-serif`;
        const artistUpper = artistName.toUpperCase();
        while (ctx.measureText(artistUpper).width > W - 100 && artistFontSize > 24) {
            artistFontSize -= 3;
            ctx.font = `900 ${artistFontSize}px sans-serif`;
        }
        ctx.fillText(artistUpper, W / 2, 68);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 22px sans-serif';
        ctx.fillText('OFFICIAL UK SINGLES', W / 2, 104);

        ctx.fillStyle = '#ff2e93';
        ctx.font = '700 13px sans-serif';
        ctx.fillText('CHART RACE', W / 2, 126);
        ctx.restore();

        // 4. Bottom Footer: “★ OFFICIAL UK SINGLES CHART RACE ★”
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff2e93';
        ctx.font = '900 17px sans-serif';
        ctx.fillText('★ OFFICIAL UK SINGLES CHART RACE ★', W / 2, 1045);
        ctx.restore();

        // 5. Chart area geometry
        const chartLeft = 100;
        const chartRight = 1020;
        const chartWidth = chartRight - chartLeft; // 920
        const chartTop = 180;
        const chartBottom = 960;
        const chartHeight = chartBottom - chartTop; // 780

        // Y position formula for rank (1 at top, 100 at bottom)
        const getYForRank = (r: number) => {
            const clamped = Math.max(1, Math.min(100, r));
            return chartTop + ((clamped - 1) / 99) * chartHeight;
        };

        // Horizontal Grid Lines for ranks 10, 20, 30, 40, 50, 60, 70, 75, 100
        const gridRanks = [10, 20, 30, 40, 50, 60, 75, 100];
        ctx.lineWidth = 1;

        // Top line for #1
        ctx.strokeStyle = 'rgba(255, 46, 147, 0.4)';
        ctx.beginPath();
        ctx.moveTo(chartLeft, chartTop);
        ctx.lineTo(chartRight, chartTop);
        ctx.stroke();

        gridRanks.forEach(r => {
            const y = getYForRank(r);
            // Highlight Official Top 40 boundary
            if (r === 40) {
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
            } else {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            }
            ctx.beginPath();
            ctx.moveTo(chartLeft, y);
            ctx.lineTo(chartRight, y);
            ctx.stroke();

            // Y-axis labels
            ctx.fillStyle = r === 40 ? 'rgba(56, 189, 248, 0.9)' : 'rgba(255, 255, 255, 0.55)';
            ctx.font = '700 16px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(String(r), chartLeft - 15, y + 5);
        });

        // 6. Timeline scrolling window (5 weeks visible across screen)
        const visibleWeeksCount = 5;
        const windowStartFraction = Math.max(0, clampedProgress - (visibleWeeksCount - 1));
        const windowEndFraction = windowStartFraction + (visibleWeeksCount - 1);

        const getXForTimeFraction = (tFraction: number) => {
            const ratio = (tFraction - windowStartFraction) / (visibleWeeksCount - 1);
            return chartLeft + ratio * chartWidth;
        };

        const minVisibleWeekIdx = Math.max(0, Math.floor(windowStartFraction));
        const maxVisibleWeekIdx = Math.min(timeline.length - 1, Math.ceil(windowEndFraction) + 1);

        for (let i = minVisibleWeekIdx; i <= maxVisibleWeekIdx; i++) {
            const x = getXForTimeFraction(i);
            if (x < chartLeft - 50 || x > chartRight + 50) continue;

            // Vertical line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.beginPath();
            ctx.moveTo(x, chartTop - 10);
            ctx.lineTo(x, chartBottom);
            ctx.stroke();

            // Slanted week label at top
            const item = timeline[i];
            if (item) {
                ctx.save();
                ctx.translate(x, chartTop - 25);
                ctx.rotate((-35 * Math.PI) / 180);
                ctx.textAlign = 'left';
                ctx.font = '700 13px sans-serif';
                ctx.fillStyle = i === currentIdx ? '#ffffff' : 'rgba(255, 255, 255, 0.55)';
                ctx.fillText(item.label, 0, 0);
                ctx.restore();
            }
        }

        // 7. Trajectory Lines for all charted songs up to current progress
        songsData.forEach(song => {
            const pathPoints: { x: number; y: number; rank: number }[] = [];

            for (let i = minVisibleWeekIdx; i <= currentIdx; i++) {
                const item = timeline[i];
                if (!item) continue;
                const rank = song.points.get(item.key);
                if (rank !== undefined) {
                    pathPoints.push({
                        x: getXForTimeFraction(i),
                        y: getYForRank(rank),
                        rank,
                    });
                }
            }

            // Interpolate position between currentIdx and currentIdx + 1
            if (subFraction > 0.001) {
                const currentRank = song.points.get(currentWeekItem.key);
                const nextItem = timeline[currentIdx + 1];
                const nextRank = nextItem ? song.points.get(nextItem.key) : undefined;

                if (currentRank !== undefined && nextRank !== undefined) {
                    const interpolatedRank = currentRank + (nextRank - currentRank) * subFraction;
                    pathPoints.push({
                        x: getXForTimeFraction(clampedProgress),
                        y: getYForRank(interpolatedRank),
                        rank: Math.round(interpolatedRank),
                    });
                }
            }

            if (pathPoints.length < 1) return;

            // Draw connecting trajectory line
            if (pathPoints.length >= 2) {
                ctx.save();
                ctx.strokeStyle = song.color;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowColor = song.color;
                ctx.shadowBlur = 10;

                ctx.beginPath();
                ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
                for (let p = 1; p < pathPoints.length; p++) {
                    ctx.lineTo(pathPoints[p].x, pathPoints[p].y);
                }
                ctx.stroke();
                ctx.restore();
            }
        });

        // 8. Active Song Nodes (circular avatars with song cover art) and badges at their latest position
        const activeNodesThisWeek: { song: SongRaceData; x: number; y: number; rank: number }[] = [];

        songsData.forEach(song => {
            const currentRank = song.points.get(currentWeekItem.key);
            if (currentRank === undefined) return;

            let finalX = getXForTimeFraction(currentIdx);
            let finalY = getYForRank(currentRank);

            if (subFraction > 0.001) {
                const nextItem = timeline[currentIdx + 1];
                const nextRank = nextItem ? song.points.get(nextItem.key) : undefined;
                if (nextRank !== undefined) {
                    const interpRank = currentRank + (nextRank - currentRank) * subFraction;
                    finalX = getXForTimeFraction(clampedProgress);
                    finalY = getYForRank(interpRank);
                    activeNodesThisWeek.push({
                        song,
                        x: finalX,
                        y: finalY,
                        rank: Math.round(interpRank),
                    });
                    return;
                }
            }

            activeNodesThisWeek.push({
                song,
                x: finalX,
                y: finalY,
                rank: currentRank,
            });
        });

        activeNodesThisWeek.sort((a, b) => b.rank - a.rank);

        activeNodesThisWeek.forEach(({ song, x, y, rank }) => {
            const radius = 24;

            // Outer glowing ring
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
            ctx.fillStyle = song.color;
            ctx.shadowColor = song.color;
            ctx.shadowBlur = 14;
            ctx.fill();
            ctx.restore();

            // Circular cover art
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.clip();

            const img = imageCacheRef.current.get(song.coverArt);
            if (img && img.complete) {
                ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
            } else {
                ctx.fillStyle = song.color;
                ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
                ctx.fillStyle = '#ffffff';
                ctx.font = '700 14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(song.title.slice(0, 2).toUpperCase(), x, y + 5);
            }
            ctx.restore();

            // White circular border
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.restore();

            // Title and Rank callout label
            ctx.save();
            let labelFontSize = 14;
            ctx.font = `800 ${labelFontSize}px sans-serif`;

            let displayTitle = song.title;
            const maxTitleWidth = 190;
            if (ctx.measureText(displayTitle).width > maxTitleWidth) {
                while (displayTitle.length > 3 && ctx.measureText(displayTitle + '...').width > maxTitleWidth) {
                    displayTitle = displayTitle.slice(0, -1);
                }
                displayTitle = displayTitle + '...';
            }

            const labelText = `#${rank} ${displayTitle}`;
            const textMetrics = ctx.measureText(labelText);
            const badgeW = Math.min(270, textMetrics.width + 18);
            const badgeH = 26;

            let badgeX = x + radius + 8;
            if (badgeX + badgeW > chartRight + 20 || badgeX + badgeW > W - 15) {
                badgeX = x - radius - 8 - badgeW;
            }
            if (badgeX < 15) {
                badgeX = Math.max(15, Math.min(W - badgeW - 15, x - badgeW / 2));
            }

            let badgeY = y - badgeH / 2;
            if (badgeY < chartTop - 10) badgeY = chartTop - 10;
            if (badgeY > chartBottom - badgeH + 10) badgeY = chartBottom - badgeH + 10;

            // Dark pill background with border
            ctx.fillStyle = 'rgba(6, 9, 24, 0.92)';
            ctx.strokeStyle = song.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 13);
            ctx.fill();
            ctx.stroke();

            // Text (#1 gets UK pink/gold highlight)
            ctx.fillStyle = rank === 1 ? '#ff2e93' : rank <= 10 ? '#38bdf8' : '#ffffff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, badgeX + 9, badgeY + badgeH / 2);
            ctx.restore();
        });

    }, [timeline, songsData, artistName]);

    // Animation frame loop with automatic inactive gap skipping
    useEffect(() => {
        if (!isPlaying || timeline.length === 0) return;

        let frameId: number;

        const loop = (timestamp: number) => {
            if (lastTimestampRef.current !== null) {
                const deltaSec = (timestamp - lastTimestampRef.current) / 1000;
                const weeksPerSec = 1.2 * speed;
                let nextProgress = currentProgress + deltaSec * weeksPerSec;

                if (skipInactivePeriods && chartedWeekIndices.length > 0) {
                    const currentWeekIdx = Math.floor(nextProgress);
                    const currentWeekItem = timeline[currentWeekIdx];
                    const hasActiveSongs = currentWeekItem && songsData.some(s => s.points.has(currentWeekItem.key));

                    if (!hasActiveSongs && currentWeekIdx < timeline.length - 1) {
                        const nextCharted = chartedWeekIndices.find(idx => idx > currentWeekIdx);
                        if (nextCharted !== undefined) {
                            nextProgress = nextCharted;
                        }
                    }
                }

                if (nextProgress >= timeline.length - 1) {
                    setCurrentProgress(timeline.length - 1);
                    setIsPlaying(false);
                    if (isRecording && mediaRecorderRef.current) {
                        mediaRecorderRef.current.stop();
                    }
                } else {
                    setCurrentProgress(nextProgress);
                    if (isRecording) {
                        setRecordingProgress(Math.round((nextProgress / (timeline.length - 1)) * 100));
                    }
                }
            }

            lastTimestampRef.current = timestamp;
            if (isPlaying) {
                frameId = requestAnimationFrame(loop);
            }
        };

        frameId = requestAnimationFrame(loop);
        animFrameRef.current = frameId;

        return () => {
            cancelAnimationFrame(frameId);
            lastTimestampRef.current = null;
        };
    }, [isPlaying, currentProgress, speed, timeline.length, isRecording, skipInactivePeriods, chartedWeekIndices, timeline, songsData]);

    // Redraw whenever progress changes
    useEffect(() => {
        drawFrame(currentProgress);
    }, [currentProgress, drawFrame]);

    // Download Video using MediaRecorder
    const handleDownloadVideo = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || timeline.length === 0) return;

        setIsPlaying(false);
        setCurrentProgress(0);
        setIsRecording(true);
        setRecordingProgress(0);

        try {
            const canvasStream = canvas.captureStream(30);
            let recordStream = canvasStream;

            try {
                const audio = audioRef.current;
                if (audio && (audio as any).captureStream) {
                    const audioStream = (audio as any).captureStream();
                    if (audioStream.getAudioTracks().length > 0) {
                        recordStream = new MediaStream([
                            ...canvasStream.getVideoTracks(),
                            ...audioStream.getAudioTracks(),
                        ]);
                    }
                } else if (audio && (audio as any).mozCaptureStream) {
                    const audioStream = (audio as any).mozCaptureStream();
                    if (audioStream.getAudioTracks().length > 0) {
                        recordStream = new MediaStream([
                            ...canvasStream.getVideoTracks(),
                            ...audioStream.getAudioTracks(),
                        ]);
                    }
                }
            } catch (audioErr) {
                console.log('UK Audio capture for video fallback:', audioErr);
            }

            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
                ? 'video/webm;codecs=vp9,opus'
                : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                ? 'video/webm;codecs=vp9'
                : MediaRecorder.isTypeSupported('video/webm')
                ? 'video/webm'
                : 'video/mp4';

            const recorder = new MediaRecorder(recordStream, { mimeType, videoBitsPerSecond: 4000000 });
            mediaRecorderRef.current = recorder;
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                setIsRecording(false);
                setIsPlaying(false);
                const blob = new Blob(chunks, { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const cleanName = artistName.replace(/[^a-zA-Z0-9]/g, '_');
                a.download = `${cleanName}_UKSingles_Chart_Race.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            };

            recorder.start();
            setIsPlaying(true);
        } catch (err) {
            console.error('Failed to record video:', err);
            setIsRecording(false);
            handleDownloadSnapshot();
        }
    }, [timeline.length, artistName]);

    // Download PNG snapshot
    const handleDownloadSnapshot = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        const cleanName = artistName.replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `${cleanName}_UKSingles_Chart_Snapshot.png`;
        a.click();
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-[#040714] text-white flex flex-col items-center pb-32 select-none">
            {/* Top Sticky Navigation Bar */}
            <div className="w-full max-w-5xl px-4 py-3.5 flex items-center justify-between border-b border-indigo-950/80 bg-[#090d24]/90 sticky top-0 z-30 backdrop-blur-md">
                <button
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'ukChartHistory' })}
                    className="flex items-center gap-2 text-indigo-200 hover:text-white font-bold text-sm bg-indigo-950/70 hover:bg-indigo-900/80 px-4 py-2 rounded-xl transition-all border border-indigo-800/40"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>Back to UK Charts</span>
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-widest font-black text-pink-400 bg-pink-950/60 border border-pink-800/50 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <span>🇬🇧</span>
                        <span>UK Singles Chart Race</span>
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full max-w-5xl px-4 py-6 flex flex-col items-center gap-6">
                {/* Empty State Banner if no chart history */}
                {songsData.length === 0 && (
                    <div className="w-full max-w-[640px] bg-gradient-to-br from-[#090d24] to-[#040714] border border-indigo-900/60 rounded-3xl p-8 text-center shadow-2xl flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-pink-950/60 border border-pink-500/40 flex items-center justify-center text-3xl">
                            🎬
                        </div>
                        <h2 className="text-xl font-black text-white">No Official UK Singles Chart History Yet</h2>
                        <p className="text-sm text-indigo-300 max-w-md">
                            To create your animated Chart Race video, release and promote singles in the UK until they debut on the Official UK Singles Chart!
                        </p>
                        <button
                            onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'ukChartHistory' })}
                            className="bg-gradient-to-r from-[#0022EB] to-[#FF2E93] hover:brightness-110 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-lg"
                        >
                            Return to UK Chart History
                        </button>
                    </div>
                )}

                {/* Video / Canvas Card Container */}
                <div className="relative w-full max-w-[580px] sm:max-w-[640px] aspect-square rounded-3xl overflow-hidden border-2 border-indigo-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.8)] bg-[#060918] flex items-center justify-center">
                    <canvas
                        ref={canvasRef}
                        width={1080}
                        height={1080}
                        className="w-full h-full object-contain pointer-events-none"
                    />

                    {/* Recording indicator overlay */}
                    {isRecording && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-40 p-6 text-center">
                            <div className="w-16 h-16 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
                            <div className="text-xl font-black text-white">Rendering UK Chart Race Video...</div>
                            <div className="text-sm text-zinc-400">
                                Recording Official UK Singles Chart run at 30 FPS. Please wait while the video renders.
                            </div>
                            <div className="w-64 h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500 transition-all duration-200"
                                    style={{ width: `${recordingProgress}%` }}
                                />
                            </div>
                            <div className="font-mono text-xs text-pink-400 font-bold">{recordingProgress}% completed</div>
                        </div>
                    )}
                </div>

                {/* Playback Controls & Scrubber */}
                {songsData.length > 0 && (
                    <div className="w-full max-w-[640px] bg-[#0a0f2c]/90 border border-indigo-900/60 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
                        {/* Scrubber Timeline */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs font-semibold text-indigo-300">
                                <span>
                                    {timeline[Math.floor(currentProgress)]?.label || 'Start'}
                                </span>
                                <span className="text-pink-400 font-bold">
                                    Week {Math.floor(currentProgress) + 1} of {Math.max(1, timeline.length)}
                                </span>
                                <span>
                                    {timeline[timeline.length - 1]?.label || 'End'}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={Math.max(0, timeline.length - 1)}
                                step={0.05}
                                value={currentProgress}
                                onChange={(e) => {
                                    setIsPlaying(false);
                                    setCurrentProgress(parseFloat(e.target.value));
                                }}
                                className="w-full h-2 bg-indigo-950 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                        </div>

                        {/* Toggle: Skip long periods of no charting releases */}
                        <div className="flex items-center justify-between bg-black/40 border border-indigo-900/60 rounded-xl px-3.5 py-2.5">
                            <div className="flex items-center gap-2.5">
                                <span className="text-base">⚡</span>
                                <div>
                                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                        Skip Inactive Periods
                                        {skipInactivePeriods && (
                                            <span className="text-[10px] bg-pink-950 text-pink-300 border border-pink-800 px-1.5 py-0.2 rounded font-black">
                                                ACTIVE
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-indigo-300">
                                        Automatically jumps to next chart entry when no songs are charting
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSkipInactivePeriods(!skipInactivePeriods)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                                    skipInactivePeriods ? 'bg-pink-600' : 'bg-zinc-700'
                                }`}
                                title="Toggle auto-skipping long periods of no charting songs"
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        skipInactivePeriods ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Buttons Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2">
                                {/* Play / Pause Button */}
                                <button
                                    onClick={() => {
                                        if (currentProgress >= timeline.length - 1) {
                                            setCurrentProgress(0);
                                        }
                                        setIsPlaying(!isPlaying);
                                    }}
                                    className="bg-white hover:bg-zinc-200 text-black font-black px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 text-xs"
                                >
                                    <PlayIcon className="w-4 h-4 fill-current" />
                                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                                </button>

                                {/* Restart Button */}
                                <button
                                    onClick={() => {
                                        setCurrentProgress(0);
                                        setIsPlaying(true);
                                        if (audioRef.current) {
                                            audioRef.current.currentTime = 0;
                                        }
                                    }}
                                    className="bg-indigo-950 hover:bg-indigo-900 text-indigo-200 font-bold text-xs px-3 py-2 rounded-xl transition-all border border-indigo-800/50"
                                    title="Restart from beginning"
                                >
                                    Replay
                                </button>

                                {/* Prev / Next Entry Jump Buttons */}
                                <button
                                    onClick={handlePrevEntry}
                                    className="bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-bold text-xs px-2.5 py-2 rounded-xl transition-all border border-indigo-800/50"
                                    title="Go to previous chart entry"
                                >
                                    ⏮ Prev
                                </button>
                                <button
                                    onClick={handleNextEntry}
                                    className="bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-bold text-xs px-2.5 py-2 rounded-xl transition-all border border-indigo-800/50"
                                    title="Go to next chart entry"
                                >
                                    Next ⏭
                                </button>

                                {/* Mute / Unmute Button */}
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={`font-bold text-xs px-2.5 py-2 rounded-xl transition-all border ${
                                        isMuted
                                            ? 'bg-pink-950/60 text-pink-300 border-pink-800/60'
                                            : 'bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border-indigo-800/50'
                                    }`}
                                    title={isMuted ? 'Unmute audio' : 'Mute audio'}
                                >
                                    {isMuted ? '🔇 Muted' : '🔊 Sound'}
                                </button>

                                {/* Speed Toggle */}
                                <div className="flex items-center bg-indigo-950/80 rounded-xl p-0.5 border border-indigo-800/50">
                                    {[0.5, 1, 2, 4].map((spd) => (
                                        <button
                                            key={spd}
                                            onClick={() => setSpeed(spd)}
                                            className={`text-xs font-bold px-2 py-1 rounded-lg transition-all ${
                                                speed === spd
                                                    ? 'bg-pink-600 text-white shadow-sm'
                                                    : 'text-indigo-400 hover:text-white'
                                            }`}
                                        >
                                            {spd}x
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Download Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDownloadSnapshot}
                                    className="bg-indigo-950 hover:bg-indigo-900 text-indigo-200 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-indigo-800/50"
                                    title="Download current frame as PNG image"
                                >
                                    Snapshot
                                </button>

                                <button
                                    onClick={handleDownloadVideo}
                                    disabled={isRecording || timeline.length === 0}
                                    className="bg-gradient-to-r from-[#0022EB] via-indigo-600 to-[#FF2E93] hover:brightness-110 disabled:opacity-50 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-900/40 transition-all active:scale-95 border border-indigo-400/40"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    <span>Download Video</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Charting Songs in this Race & MP3 / Spotify Audio Options */}
                {songsData.length > 0 && (
                    <div className="w-full max-w-[640px] bg-[#090d24]/80 border border-indigo-900/60 rounded-2xl p-5 flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-900/60 pb-3 gap-1">
                            <div>
                                <span className="text-xs font-black uppercase tracking-wider text-white">
                                    Charting Songs in UK Race ({songsData.length})
                                </span>
                                <p className="text-[11px] text-indigo-300">
                                    Upload MP3 files or paste Spotify links to play the track while each song is charting at top position
                                </p>
                            </div>
                            <span className="text-[11px] text-pink-300 font-semibold bg-pink-950/60 border border-pink-800/40 px-2.5 py-0.5 rounded-full w-fit">
                                Plays highest charting song
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {songsData.map((s) => {
                                const audioInfo = audioMap[s.id];
                                const hasAudio = Boolean(audioInfo);
                                const isCurrentTop = highestPositionSong?.id === s.id;
                                const isCurrentlyPlaying = isCurrentTop && isPlaying && hasAudio && !isMuted;
                                const isInputtingSpotify = activeSpotifyInputSongId === s.id;

                                return (
                                    <div
                                        key={s.id}
                                        className={`flex flex-col gap-2.5 bg-black/40 border rounded-2xl p-3 transition-all ${
                                            isCurrentlyPlaying
                                                ? 'border-pink-500/80 shadow-[0_0_18px_rgba(255,46,147,0.25)] bg-pink-950/20'
                                                : isCurrentTop
                                                ? 'border-indigo-500/50 bg-indigo-950/20'
                                                : 'border-indigo-950/80'
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div
                                                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                                                    style={{ backgroundColor: s.color }}
                                                />
                                                <img
                                                    src={s.coverArt}
                                                    alt={s.title}
                                                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0 bg-indigo-950 border border-indigo-800/50 shadow-sm"
                                                    onError={(e) => {
                                                        e.currentTarget.src = getArtistImage(artistName);
                                                    }}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-xs truncate text-white" title={s.title}>
                                                            {s.title}
                                                        </p>
                                                        {isCurrentTop && (
                                                            <span className="text-[10px] bg-pink-500 text-white px-1.5 py-0.2 rounded font-black tracking-wide flex-shrink-0">
                                                                TOP POSITION
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-indigo-300 truncate mt-0.5">
                                                        UK Peak: <span className="text-pink-400 font-bold">#{s.peak}</span> • {s.points.size} weeks charted
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Beside it: Audio Options (Upload MP3 file or Paste Spotify link) */}
                                            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                                                <input
                                                    type="file"
                                                    id={`audio-upload-${s.id}`}
                                                    accept="audio/*,.mp3,.wav,.m4a,.ogg"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            handleUploadAudio(s.id, file);
                                                        }
                                                    }}
                                                />

                                                {hasAudio ? (
                                                    <div className="flex items-center gap-1.5 bg-indigo-950/70 border border-indigo-800/60 rounded-xl px-2.5 py-1">
                                                        <span className="text-xs">
                                                            {audioInfo.type === 'spotify' ? '🟢' : '🎵'}
                                                        </span>
                                                        <span
                                                            className="text-xs font-semibold text-indigo-200 max-w-[120px] truncate"
                                                            title={audioInfo.name}
                                                        >
                                                            {audioInfo.name}
                                                        </span>
                                                        <button
                                                            onClick={() => handleRemoveAudio(s.id)}
                                                            className="text-indigo-400 hover:text-rose-400 text-xs ml-1 font-bold p-0.5"
                                                            title="Remove audio"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        <label
                                                            htmlFor={`audio-upload-${s.id}`}
                                                            className="cursor-pointer bg-indigo-950 hover:bg-indigo-900 border border-indigo-800/60 text-indigo-200 hover:text-white font-bold text-xs px-2.5 py-1 rounded-xl transition-all flex items-center gap-1"
                                                            title="Upload MP3 for this song"
                                                        >
                                                            <span>📁 MP3</span>
                                                        </label>

                                                        <button
                                                            onClick={() => {
                                                                setActiveSpotifyInputSongId(
                                                                    activeSpotifyInputSongId === s.id ? null : s.id
                                                                );
                                                                setSpotifyInputUrl('');
                                                                setSpotifyInputError('');
                                                            }}
                                                            className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 hover:text-emerald-100 font-bold text-xs px-2.5 py-1 rounded-xl transition-all flex items-center gap-1"
                                                            title="Paste Spotify link for this song"
                                                        >
                                                            <span>🟢 Spotify</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Spotify URL Input Dropdown */}
                                        {isInputtingSpotify && !hasAudio && (
                                            <div className="flex flex-col gap-2 pt-2 border-t border-indigo-900/60 animate-fade-in">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Paste Spotify track link (e.g. https://open.spotify.com/track/...)"
                                                        value={spotifyInputUrl}
                                                        onChange={(e) => setSpotifyInputUrl(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleAttachSpotify(s.id, spotifyInputUrl);
                                                            }
                                                        }}
                                                        disabled={isFetchingSpotify}
                                                        className="flex-1 bg-black/60 border border-indigo-800/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-indigo-400/50 focus:outline-none focus:border-emerald-500"
                                                    />
                                                    <button
                                                        onClick={() => handleAttachSpotify(s.id, spotifyInputUrl)}
                                                        disabled={isFetchingSpotify || !spotifyInputUrl.trim()}
                                                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                                                    >
                                                        {isFetchingSpotify ? (
                                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <span>Attach</span>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActiveSpotifyInputSongId(null);
                                                            setSpotifyInputError('');
                                                        }}
                                                        className="text-xs text-indigo-400 hover:text-white px-1.5 py-1"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>

                                                {spotifyInputError && (
                                                    <p className="text-[11px] text-rose-400 font-medium">
                                                        {spotifyInputError}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UkSinglesChartRaceView;
