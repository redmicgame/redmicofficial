import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Song } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import DotsHorizontalIcon from './icons/DotsHorizontalIcon';

interface AppleMusicTopSongsDiscographyViewProps {
    onBack: () => void;
    onSelectRelease: (releaseId: string) => void;
}

const AppleMusicTopSongsDiscographyView: React.FC<AppleMusicTopSongsDiscographyViewProps> = ({
    onBack,
    onSelectRelease,
}) => {
    const { activeArtist, activeArtistData, gameState } = useGame();

    if (!activeArtist || !activeArtistData) return null;

    const { songs = [], releases = [] } = activeArtistData;
    const soundtrackAlbums = gameState?.soundtrackAlbums || [];
    const pageBgColor = activeArtistData.appleMusicBgColor || '#000000';

    // Helper to get project info
    const getProjectInfo = (song: Song) => {
        const release = releases.find(r => r.id === song.releaseId || r.songIds?.includes(song.id));
        const soundtrack = soundtrackAlbums.find(sa =>
            sa.songIds?.includes(song.id) ||
            (song.soundtrackTitle && sa.title.toLowerCase() === song.soundtrackTitle.toLowerCase())
        );

        let title = '';
        let coverArt = song.coverArt || release?.coverArt || activeArtist.image;
        let releaseId = release?.id;
        let suffix = '';

        if (soundtrack) {
            title = soundtrack.title;
            suffix = ' (Soundtrack)';
            if (soundtrack.coverArt) coverArt = soundtrack.coverArt;
        } else if (song.soundtrackTitle) {
            title = song.soundtrackTitle;
            suffix = ' (Soundtrack)';
        } else if (release) {
            title = release.title;
            if (release.type === 'EP') {
                suffix = ' - EP';
            } else if (release.type === 'Compilation') {
                suffix = ' (Compilation)';
            }
        }

        const artistPrefix = song.collaboration
            ? `${activeArtist.name} & ${song.collaboration.artistName}`
            : activeArtist.name;

        const subTitle = title ? `${artistPrefix} • ${title}${suffix}` : artistPrefix;

        return {
            title,
            subTitle,
            coverArt,
            releaseId,
        };
    };

    // Filter released songs
    const availableSongs = useMemo(() => {
        return songs.filter(s => s.isReleased && !s.isTakenDown && (s.isAvailableOnStreaming === true || s.isFeatureToNpc));
    }, [songs]);

    // Rank discography by weekly streams
    const rankedDiscography = useMemo(() => {
        const list = availableSongs.map(song => {
            const project = getProjectInfo(song);
            return {
                song,
                project,
                weeklyStreams: song.lastWeekStreams || 0,
                totalStreams: song.streams || 0,
            };
        });

        list.sort((a, b) => {
            if (b.weeklyStreams !== a.weeklyStreams) {
                return b.weeklyStreams - a.weeklyStreams;
            }
            return b.totalStreams - a.totalStreams;
        });

        return list;
    }, [availableSongs, releases, soundtrackAlbums, activeArtist.name, activeArtist.image]);

    return (
        <div style={{ backgroundColor: pageBgColor }} className="text-white min-h-full pb-32 transition-colors">
            {/* Top Navigation Header */}
            <header className="sticky top-0 bg-black/80 backdrop-blur-md z-20 px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-rose-500 hover:text-rose-400 font-semibold transition-colors text-base"
                >
                    <ChevronLeftIcon className="w-6 h-6 -ml-1 text-rose-500" />
                    <span className="truncate max-w-[200px]">{activeArtist.name}</span>
                </button>
                <h1 className="text-base font-bold text-white text-center">Top Songs</h1>
                <div className="w-12" /> {/* Spacer for balance */}
            </header>

            {/* Simplistic, clean tracklist */}
            <main className="max-w-3xl mx-auto px-2 sm:px-4 py-3">
                <div className="space-y-0.5">
                    {rankedDiscography.map(({ song, project }, idx) => {
                        const songTitle = song.title.replace(/\s*\(feat\..*\)/i, '');
                        const featText = !song.collaboration && song.features && song.features.length > 0
                            ? ` (feat. ${song.features.join(', ')})`
                            : '';

                        return (
                            <div
                                key={song.id}
                                onClick={() => {
                                    if (project.releaseId) {
                                        onSelectRelease(project.releaseId);
                                    }
                                }}
                                className="flex items-center gap-3.5 py-2.5 px-3 hover:bg-zinc-800/40 rounded-xl transition-colors group cursor-pointer"
                            >
                                {/* Rank Number */}
                                <span className="w-6 text-center text-sm font-semibold text-zinc-400 shrink-0">
                                    {idx + 1}
                                </span>

                                {/* Artwork */}
                                <img
                                    src={project.coverArt}
                                    className="w-12 h-12 rounded-lg object-cover shadow-sm shrink-0"
                                    alt={song.title}
                                />

                                {/* Title & Subtitle */}
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="font-bold text-white truncate text-base leading-snug">
                                            {songTitle}
                                            {featText && <span className="text-zinc-400 font-normal text-sm">{featText}</span>}
                                        </p>
                                        {song.explicit && (
                                            <span className="text-[10px] w-4 h-4 bg-zinc-300 text-black font-bold rounded-[2px] flex items-center justify-center shrink-0">
                                                E
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
                                        {project.subTitle}
                                    </p>
                                </div>

                                {/* Context Action */}
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                    }}
                                    className="flex-shrink-0 p-1 text-zinc-400 hover:text-white"
                                >
                                    <DotsHorizontalIcon className="w-5 h-5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default AppleMusicTopSongsDiscographyView;
