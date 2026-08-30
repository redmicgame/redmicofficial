import { GameDate, GameState, Artist } from '../types';

export interface CountdownItem {
    id: string;
    albumId: string;
    title: string;
    artist: string;
    coverArt: string;
    releaseDate: GameDate;
    preSaves: number;
    isExplicit: boolean;
    isPlayerAlbum: boolean;
}

export const getSpotifyTopCountdowns = (
    gameState: GameState,
    allPlayerArtists: Artist[]
): CountdownItem[] => {
    const countdowns: CountdownItem[] = [];

    // Player countdowns
    if (gameState.artistsData) {
        Object.entries(gameState.artistsData).forEach(([artistId, data]) => {
            if (data.labelSubmissions) {
                data.labelSubmissions.forEach(sub => {
                    if (sub.status === 'scheduled' && sub.hasCountdownPage && sub.projectReleaseDate) {
                        const artistProfile = allPlayerArtists.find(a => a.id === artistId);

                        let isExplicit = false;
                        if (sub.release && sub.release.songIds) {
                            sub.release.songIds.forEach(id => {
                                const song = data.songs.find(s => s.id === id);
                                if (song && song.explicit) isExplicit = true;
                            });
                        }

                        const preSaves = sub.preSaves || 0;

                        countdowns.push({
                            id: sub.release?.id || sub.id,
                            albumId: sub.release?.id || sub.id,
                            title: sub.release?.title || 'Untitled Album',
                            artist: artistProfile?.name || 'Unknown',
                            coverArt: sub.release?.coverArt || 'https://ui-avatars.com/api/?name=Unknown',
                            releaseDate: sub.projectReleaseDate,
                            preSaves: preSaves,
                            isExplicit,
                            isPlayerAlbum: true,
                        });
                    }
                });
            }
        });
    }

    // Add NPC countdowns
    const fakeNpcCountdowns = 10 - countdowns.length;
    if (fakeNpcCountdowns > 0 && gameState.npcAlbums) {
        const upcomingNpcs = gameState.npcAlbums.slice(0, fakeNpcCountdowns);
        upcomingNpcs.forEach((album, index) => {
            const w = (gameState.date.week + 1 + index) % 52 || 52;
            const y = gameState.date.year + (gameState.date.week + 1 + index > 52 ? 1 : 0);
            const releaseDate = { year: y, week: w };
            const albumSongs = (album.songIds || []).map(id => gameState.npcs?.find(s => s.uniqueId === id)).filter(Boolean);
            const avgPop = albumSongs.length > 0 
                ? albumSongs.reduce((sum, s) => sum + ((s as any)?.basePopularity || 0), 0) / albumSongs.length 
                : 50;

            let npcWeekly = 3000;
            if (avgPop < 10) npcWeekly = 3000;
            else if (avgPop < 20) npcWeekly = 5000;
            else if (avgPop < 50) npcWeekly = 10000;
            else if (avgPop < 75) npcWeekly = 25000;
            else npcWeekly = 50000;

            const simulatedWeeks = Math.max(1, 4 - index);
            // Deterministic preSaves calculation based on album ID so it doesn't jitter on re-renders
            const hash = (album.uniqueId || album.title || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const variance = 0.9 + ((hash % 30) / 100);
            const npcPreSaves = Math.round(npcWeekly * simulatedWeeks * variance);

            countdowns.push({
                id: `fake_${album.uniqueId}`,
                albumId: album.uniqueId,
                title: album.title,
                artist: album.artist,
                coverArt: album.coverArt || `https://ui-avatars.com/api/?name=${encodeURIComponent(album.artist)}`,
                releaseDate: releaseDate,
                preSaves: npcPreSaves,
                isExplicit: (hash % 2) === 0,
                isPlayerAlbum: false,
            });
        });
    }

    // Sort descending by preSaves, top 10
    return countdowns.sort((a, b) => b.preSaves - a.preSaves).slice(0, 10);
};
