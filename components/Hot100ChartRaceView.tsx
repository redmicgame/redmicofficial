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
    '#f59e0b', // Amber / Gold
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#8b5cf6', // Violet
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#f97316', // Orange
    '#14b8a6', // Teal
    '#e11d48', // Rose
    '#a855f7', // Purple
    '#84cc16', // Lime
];

function formatWeekLabel(year: number, week: number): string {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthIdx = Math.min(11, Math.max(0, Math.floor(((week - 1) / 52) * 12)));
    const weekInMonth = ((week - 1) % 4) + 1;
    const m = months[monthIdx];
    return `${m} W${weekInMonth} - ${year}`;
}

// IndexedDB Helper for persistent MP3 and Spotify storage
const DB_NAME = 'Hot100AudioDB';
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
        console.error('Failed to save audio to IndexedDB', e);
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
        console.error('Failed to delete audio from IndexedDB', e);
    }
}

const Hot100ChartRaceView: React.FC = () => {
    const { gameState, dispatch, activeArtistData, activeArtist } = useGame();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const activePlayingSongIdRef = useRef<string | null>(null);

    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [speed, setSpeed] = useState<number>(1);
    const [currentProgress, setCurrentProgress] = useState<number>(0); // fractional index into timeline
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

        // Load stored MP3s and Spotify links from IndexedDB on startup
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

    // Build timeline and songs dataset from actual player chart history
    const { timeline, songsData } = useMemo(() => {
        const history = gameState.chartHistory || {};
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
    }, [gameState, activeArtistData, activeArtist]);

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

        // If not playing, or no song is currently charting, pause audio
        if (!isPlaying || !highestPositionSong) {
            if (!audio.paused) {
                audio.pause();
            }
            activePlayingSongIdRef.current = null;
            return;
        }

        const songId = highestPositionSong.id;
        const songAudio = audioMap[songId];

        // If the highest charting song has neither an MP3 nor a Spotify audio link, pause audio
        if (!songAudio || !songAudio.url) {
            if (!audio.paused) {
                audio.pause();
            }
            activePlayingSongIdRef.current = null;
            return;
        }

        // If song changed, switch to the new highest charting song's audio
        if (activePlayingSongIdRef.current !== songId) {
            activePlayingSongIdRef.current = songId;
            audio.src = songAudio.url;
            audio.currentTime = 0;
            audio.play().catch(e => {
                console.log('Audio playback caught:', e);
            });
        } else {
            // Same highest charting song, ensure audio is playing
            if (audio.paused) {
                audio.play().catch(e => {
                    console.log('Audio playback caught:', e);
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
            const res = await fetch(`/api/spotify/track?url=${encodeURIComponent(url.trim())}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (!data.previewUrl) {
                throw new Error('This track does not have an audio preview on Spotify.');
            }

            const displayName = data.title ? `${data.title} - ${data.artist}` : 'Spotify Track';
            const audioEntry: SongAudioEntry = {
                type: 'spotify',
                url: data.previewUrl,
                name: displayName,
                spotifyTrackId: data.id,
                spotifyUrl: data.spotifyUrl || url.trim(),
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

    // Remove audio handler (both MP3 and Spotify)
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

    // Quick jump to next or previous chart entry
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

    // Draw the chart race frame on canvas
    const drawFrame = useCallback((progress: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width; // 1080
        const H = canvas.height; // 1080

        // Clear canvas with dark elegant background
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, W, H);

        if (timeline.length === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 32px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No Billboard Hot 100 Chart History Yet', W / 2, H / 2 - 20);
            ctx.font = '400 20px sans-serif';
            ctx.fillStyle = '#9ca3af';
            ctx.fillText('Release singles and chart on the Hot 100 to watch your chart race.', W / 2, H / 2 + 25);
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
                ctx.globalAlpha = 0.28;
                // Draw background cover scaled to fill square
                ctx.drawImage(img, 0, 0, W, H);
                ctx.restore();
            }

            // Dark vignette overlay so text & grid lines pop
            const gradient = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, W * 0.75);
            gradient.addColorStop(0, 'rgba(10, 10, 15, 0.45)');
            gradient.addColorStop(1, 'rgba(10, 10, 15, 0.88)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, W, H);

            // Large faint title across bottom center (dynamically scaled so long titles fit)
            ctx.save();
            let bgFontSize = 64;
            ctx.font = `900 ${bgFontSize}px sans-serif`;
            const bgTitle = (currentTopSong as SongRaceData).title.toUpperCase();
            while (ctx.measureText(bgTitle).width > W - 100 && bgFontSize > 22) {
                bgFontSize -= 4;
                ctx.font = `900 ${bgFontSize}px sans-serif`;
            }
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.textAlign = 'center';
            ctx.fillText(bgTitle, W / 2, 940);
            ctx.restore();
        }

        // 3. Top Header: “Artist Name” Hot 100 chart race
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        let artistFontSize = 48;
        ctx.font = `900 ${artistFontSize}px sans-serif`;
        const artistUpper = artistName.toUpperCase();
        while (ctx.measureText(artistUpper).width > W - 100 && artistFontSize > 24) {
            artistFontSize -= 3;
            ctx.font = `900 ${artistFontSize}px sans-serif`;
        }
        ctx.fillText(artistUpper, W / 2, 70);

        ctx.fillStyle = '#f3f4f6';
        ctx.font = '800 22px sans-serif';
        ctx.fillText('HOT 100', W / 2, 105);

        ctx.fillStyle = '#fbbf24';
        ctx.font = '700 13px sans-serif';
        ctx.fillText('CHART RACE', W / 2, 126);
        ctx.restore();

        // 4. Bottom Footer: “RED MIC CHART RACE”
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fbbf24';
        ctx.font = '900 18px sans-serif';
        ctx.fillText('★ RED MIC CHART RACE ★', W / 2, 1045);
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

        // Horizontal Grid Lines for ranks 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
        const gridRanks = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        ctx.lineWidth = 1;

        // Top line for #1
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.beginPath();
        ctx.moveTo(chartLeft, chartTop);
        ctx.lineTo(chartRight, chartTop);
        ctx.stroke();

        gridRanks.forEach(r => {
            const y = getYForRank(r);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            ctx.moveTo(chartLeft, y);
            ctx.lineTo(chartRight, y);
            ctx.stroke();

            // Y-axis labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
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

        // Vertical timeline column lines and slanted labels
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

            // Interpolate position between currentIdx and currentIdx + 1 if available
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

            // Interpolate smoothly if moving to next week
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

        // Sort so highest ranked songs (lowest number) are drawn on top
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

            // Title and Rank callout label - beautifully fitted so names always fit
            ctx.save();
            let labelFontSize = 14;
            ctx.font = `800 ${labelFontSize}px sans-serif`;

            // Truncate title if exceedingly long so it never overflows badges
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

            // Position label: prefer to right of circle, flip to left if near edge
            let badgeX = x + radius + 8;
            if (badgeX + badgeW > chartRight + 20 || badgeX + badgeW > W - 15) {
                badgeX = x - radius - 8 - badgeW;
            }
            // Clamp within canvas bounds
            if (badgeX < 15) {
                badgeX = Math.max(15, Math.min(W - badgeW - 15, x - badgeW / 2));
            }

            let badgeY = y - badgeH / 2;
            if (badgeY < chartTop - 10) badgeY = chartTop - 10;
            if (badgeY > chartBottom - badgeH + 10) badgeY = chartBottom - badgeH + 10;

            // Dark pill background with border
            ctx.fillStyle = 'rgba(8, 8, 12, 0.90)';
            ctx.strokeStyle = song.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 13);
            ctx.fill();
            ctx.stroke();

            // Text
            ctx.fillStyle = rank === 1 ? '#fbbf24' : '#ffffff';
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
                // Base speed: 1.2 weeks per second at 1x
                const weeksPerSec = 1.2 * speed;
                let nextProgress = currentProgress + deltaSec * weeksPerSec;

                // Check for automatic skipping of long inactive periods
                if (skipInactivePeriods && chartedWeekIndices.length > 0) {
                    const currentWeekIdx = Math.floor(nextProgress);
                    const currentWeekItem = timeline[currentWeekIdx];
                    const hasActiveSongs = currentWeekItem && songsData.some(s => s.points.has(currentWeekItem.key));

                    // If no songs are charting this week, automatically skip ahead to the next charted entry
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

            // Attempt to capture audio stream from audio element if supported
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
                console.log('Audio capture for video fallback:', audioErr);
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
                a.download = `${cleanName}_Hot100_Chart_Race.webm`;
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
        a.download = `${cleanName}_Hot100_Chart_Snapshot.png`;
        a.click();
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-950 text-white flex flex-col items-center pb-32 select-none">
            {/* Top Sticky Navigation Bar */}
            <div className="w-full max-w-5xl px-4 py-3.5 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/80 sticky top-0 z-30 backdrop-blur-md">
                <button
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'billboardChartHistory' })}
                    className="flex items-center gap-2 text-zinc-300 hover:text-white font-bold text-sm bg-zinc-800/80 hover:bg-zinc-700/80 px-4 py-2 rounded-xl transition-all"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>Back to Billboard</span>
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-widest font-black text-rose-400 bg-rose-950/60 border border-rose-800/50 px-3 py-1 rounded-full">
                        Hot 100 Chart Race
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full max-w-5xl px-4 py-6 flex flex-col items-center gap-6">
                {/* Empty State Banner if no chart history */}
                {songsData.length === 0 && (
                    <div className="w-full max-w-[640px] bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-600/40 flex items-center justify-center text-3xl">
                            🎬
                        </div>
                        <h2 className="text-xl font-black text-white">No Billboard Hot 100 Chart History Yet</h2>
                        <p className="text-sm text-zinc-400 max-w-md">
                            To create your animated Chart Race video, release and promote singles until they debut on the Billboard Hot 100 chart!
                        </p>
                        <button
                            onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'billboardChartHistory' })}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors shadow-lg"
                        >
                            Return to Billboard Chart History
                        </button>
                    </div>
                )}

                {/* Video / Canvas Card Container */}
                <div className="relative w-full max-w-[580px] sm:max-w-[640px] aspect-square rounded-3xl overflow-hidden border-2 border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] bg-[#0a0a0c] flex items-center justify-center">
                    <canvas
                        ref={canvasRef}
                        width={1080}
                        height={1080}
                        className="w-full h-full object-contain pointer-events-none"
                    />

                    {/* Recording indicator overlay */}
                    {isRecording && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-40 p-6 text-center">
                            <div className="w-16 h-16 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
                            <div className="text-xl font-black text-white">Rendering Video File...</div>
                            <div className="text-sm text-zinc-400">
                                Recording chart race at 30 FPS. Please wait while the video renders.
                            </div>
                            <div className="w-64 h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                                <div
                                    className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-200"
                                    style={{ width: `${recordingProgress}%` }}
                                />
                            </div>
                            <div className="font-mono text-xs text-amber-400 font-bold">{recordingProgress}% completed</div>
                        </div>
                    )}
                </div>

                {/* Playback Controls & Scrubber */}
                {songsData.length > 0 && (
                    <div className="w-full max-w-[640px] bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
                        {/* Scrubber Timeline */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs font-semibold text-zinc-400">
                                <span>
                                    {timeline[Math.floor(currentProgress)]?.label || 'Start'}
                                </span>
                                <span className="text-amber-400 font-bold">
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
                                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                            />
                        </div>

                        {/* Toggle: Skip long periods of no charting releases */}
                        <div className="flex items-center justify-between bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-3.5 py-2.5">
                            <div className="flex items-center gap-2.5">
                                <span className="text-base">⚡</span>
                                <div>
                                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                        Skip Inactive Periods
                                        {skipInactivePeriods && (
                                            <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.2 rounded font-black">
                                                ACTIVE
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-zinc-400">
                                        Automatically jumps to next chart entry when no songs are charting
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSkipInactivePeriods(!skipInactivePeriods)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                                    skipInactivePeriods ? 'bg-rose-600' : 'bg-zinc-700'
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
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs px-3 py-2 rounded-xl transition-all"
                                    title="Restart from beginning"
                                >
                                    Replay
                                </button>

                                {/* Prev / Next Entry Jump Buttons */}
                                <button
                                    onClick={handlePrevEntry}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs px-2.5 py-2 rounded-xl transition-all"
                                    title="Go to previous chart entry"
                                >
                                    ⏮ Prev
                                </button>
                                <button
                                    onClick={handleNextEntry}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs px-2.5 py-2 rounded-xl transition-all"
                                    title="Go to next chart entry"
                                >
                                    Next ⏭
                                </button>

                                {/* Mute / Unmute Button */}
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={`font-bold text-xs px-2.5 py-2 rounded-xl transition-all border ${
                                        isMuted
                                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                                    }`}
                                    title={isMuted ? 'Unmute audio' : 'Mute audio'}
                                >
                                    {isMuted ? '🔇 Muted' : '🔊 Sound'}
                                </button>

                                {/* Speed Toggle */}
                                <div className="flex items-center bg-zinc-800 rounded-xl p-0.5 border border-zinc-700">
                                    {[0.5, 1, 2, 4].map((spd) => (
                                        <button
                                            key={spd}
                                            onClick={() => setSpeed(spd)}
                                            className={`text-xs font-bold px-2 py-1 rounded-lg transition-all ${
                                                speed === spd
                                                    ? 'bg-rose-600 text-white shadow-sm'
                                                    : 'text-zinc-400 hover:text-white'
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
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-zinc-700"
                                    title="Download current frame as PNG image"
                                >
                                    Snapshot
                                </button>

                                <button
                                    onClick={handleDownloadVideo}
                                    disabled={isRecording || timeline.length === 0}
                                    className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95 border border-rose-400/30"
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
                    <div className="w-full max-w-[640px] bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-1">
                            <div>
                                <span className="text-xs font-black uppercase tracking-wider text-white">
                                    Charting Songs in Race ({songsData.length})
                                </span>
                                <p className="text-[11px] text-zinc-400">
                                    Upload MP3 files or paste Spotify links to play the track while each song is charting at #1 position
                                </p>
                            </div>
                            <span className="text-[11px] text-amber-300 font-semibold bg-amber-950/60 border border-amber-800/40 px-2.5 py-0.5 rounded-full w-fit">
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
                                        className={`flex flex-col gap-2.5 bg-zinc-950/70 border rounded-2xl p-3 transition-all ${
                                            isCurrentlyPlaying
                                                ? 'border-rose-500/80 shadow-[0_0_18px_rgba(244,63,94,0.18)] bg-rose-950/20'
                                                : isCurrentTop
                                                ? 'border-amber-500/50 bg-amber-950/10'
                                                : 'border-zinc-800/70'
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
                                                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0 bg-zinc-800 border border-zinc-700/50 shadow-sm"
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
                                                            <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.2 rounded font-black tracking-wide flex-shrink-0">
                                                                TOP POSITION
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                                        Peak: <span className="text-amber-400 font-bold">#{s.peak}</span> • {s.points.size} weeks charted
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
                                                    <div className="flex items-center gap-1.5">
                                                        <div
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                                                isCurrentlyPlaying
                                                                    ? 'bg-rose-950 text-rose-200 border-rose-500 shadow-sm shadow-rose-500/20 animate-pulse'
                                                                    : audioInfo.type === 'spotify'
                                                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70'
                                                                    : 'bg-zinc-800 text-zinc-200 border-zinc-700'
                                                            }`}
                                                            title={audioInfo.name}
                                                        >
                                                            <span>
                                                                {isCurrentlyPlaying
                                                                    ? '🔊'
                                                                    : audioInfo.type === 'spotify'
                                                                    ? '🟢'
                                                                    : '🎵'}
                                                            </span>
                                                            <span className="max-w-[110px] sm:max-w-[140px] truncate">
                                                                {audioInfo.type === 'spotify'
                                                                    ? `Spotify: ${audioInfo.name}`
                                                                    : audioInfo.name}
                                                            </span>
                                                            {isCurrentlyPlaying && (
                                                                <span className="text-[10px] text-rose-300 font-black uppercase">
                                                                    Playing
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Replace button */}
                                                        <div className="relative group">
                                                            <button
                                                                onClick={() => {
                                                                    if (isInputtingSpotify) {
                                                                        setActiveSpotifyInputSongId(null);
                                                                    } else {
                                                                        setActiveSpotifyInputSongId(s.id);
                                                                        setSpotifyInputUrl(audioInfo.spotifyUrl || '');
                                                                        setSpotifyInputError('');
                                                                    }
                                                                }}
                                                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors border border-zinc-700"
                                                                title="Replace audio"
                                                            >
                                                                Replace
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => handleRemoveAudio(s.id)}
                                                            className="bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-300 px-2 py-1.5 rounded-xl text-xs transition-colors border border-zinc-700 hover:border-red-800"
                                                            title="Remove audio"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <label
                                                            htmlFor={`audio-upload-${s.id}`}
                                                            className="cursor-pointer bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                                                            title="Upload an MP3 audio file from your device"
                                                        >
                                                            <span>🎵</span>
                                                            <span>Upload MP3 file</span>
                                                        </label>

                                                        <button
                                                            onClick={() => {
                                                                if (isInputtingSpotify) {
                                                                    setActiveSpotifyInputSongId(null);
                                                                } else {
                                                                    setActiveSpotifyInputSongId(s.id);
                                                                    setSpotifyInputUrl('');
                                                                    setSpotifyInputError('');
                                                                }
                                                            }}
                                                            className="bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 hover:text-emerald-200 border border-emerald-700/60 hover:border-emerald-500 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                                                            title="Paste a Spotify song link"
                                                        >
                                                            <span>🟢</span>
                                                            <span>Spotify link</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Inline Spotify Link Input Box */}
                                        {isInputtingSpotify && (
                                            <div className="mt-1 bg-zinc-900 border border-emerald-500/50 rounded-xl p-3 flex flex-col gap-2">
                                                <div className="flex items-center justify-between text-xs text-zinc-300 font-bold">
                                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                                        <span>🟢</span> Paste Spotify Track Link for "{s.title}"
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setActiveSpotifyInputSongId(null);
                                                            setSpotifyInputUrl('');
                                                            setSpotifyInputError('');
                                                        }}
                                                        className="text-zinc-500 hover:text-white text-xs"
                                                    >
                                                        ✕ Cancel
                                                    </button>
                                                </div>

                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={spotifyInputUrl}
                                                        onChange={(e) => setSpotifyInputUrl(e.target.value)}
                                                        placeholder="https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT..."
                                                        className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleAttachSpotify(s.id, spotifyInputUrl);
                                                            }
                                                        }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleAttachSpotify(s.id, spotifyInputUrl)}
                                                        disabled={!spotifyInputUrl.trim() || isFetchingSpotify}
                                                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                                                    >
                                                        {isFetchingSpotify ? 'Fetching...' : 'Attach'}
                                                    </button>
                                                </div>

                                                {spotifyInputError ? (
                                                    <p className="text-[11px] text-red-400 font-medium">{spotifyInputError}</p>
                                                ) : (
                                                    <p className="text-[11px] text-zinc-400">
                                                        Paste any Spotify track URL (e.g. from Spotify's Share &gt; Copy Song Link). It will play during this song's charting weeks.
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

export default Hot100ChartRaceView;
