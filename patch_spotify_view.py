import re

with open('components/SpotifyView.tsx', 'r') as f:
    content = f.read()

old_code = """const VerifiedModal: React.FC<{ isOpen: boolean; onClose: () => void; sinceYear: number; releasesCount: number; playlists: string[] }> = ({ isOpen, onClose, sinceYear, releasesCount, playlists }) => {"""

new_code = """const VerifiedModal: React.FC<{ isOpen: boolean; onClose: () => void; sinceYear: number; releasesCount: number; playlists: string[]; recentVenues: any[] }> = ({ isOpen, onClose, sinceYear, releasesCount, playlists, recentVenues }) => {"""

content = content.replace(old_code, new_code)

old_code_2 = """                    {playlists.length > 0 && (
                        <div className="flex gap-4">
                            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                                <SpotifyIcon className="w-5 h-5 text-zinc-400 grayscale opacity-80" />
                            </div>
                            <p className="text-sm text-zinc-300">Playlisted by Spotify's editors on {formatPlaylistsList(playlists)} in the past year.</p>
                        </div>
                    )}

                    <div className="flex gap-4">"""

new_code_2 = """                    {playlists.length > 0 && (
                        <div className="flex gap-4">
                            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                                <SpotifyIcon className="w-5 h-5 text-zinc-400 grayscale opacity-80" />
                            </div>
                            <p className="text-sm text-zinc-300">Playlisted by Spotify's editors on {formatPlaylistsList(playlists)} in the past year.</p>
                        </div>
                    )}
                    
                    {recentVenues.length > 0 && (
                        <div className="flex gap-4">
                            <svg className="w-6 h-6 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <p className="text-sm text-zinc-300">
                                Most recent concerts listed on Spotify were in 2026, and has played recently at {
                                   recentVenues.map(v => v.name).join(', ').replace(/, ([^,]*)$/, ' and $1')
                                }.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-4">"""

content = content.replace(old_code_2, new_code_2)

old_code_3 = """    const playlistsNames = useMemo(() => appearsOnPlaylists.map(p => p.name), [appearsOnPlaylists]);"""

new_code_3 = """    const playlistsNames = useMemo(() => appearsOnPlaylists.map(p => p.name), [appearsOnPlaylists]);
    const recentVenues = useMemo(() => {
        const pastVenues: any[] = [];
        const reversedTours = [...activeArtistData.tours].reverse();
        for (const tour of reversedTours) {
            const maxIdx = tour.status === 'finished' ? tour.venues.length : tour.currentVenueIndex;
            for (let i = maxIdx - 1; i >= 0; i--) {
                pastVenues.push(tour.venues[i]);
                if (pastVenues.length === 3) break;
            }
            if (pastVenues.length === 3) break;
        }
        return pastVenues;
    }, [activeArtistData.tours]);"""

content = content.replace(old_code_3, new_code_3)

old_code_4 = """            <VerifiedModal 
                isOpen={showVerifiedModal} 
                onClose={() => setShowVerifiedModal(false)}
                sinceYear={sinceYear}
                releasesCount={releases.length}
                playlists={playlistsNames}
            />"""

new_code_4 = """            <VerifiedModal 
                isOpen={showVerifiedModal} 
                onClose={() => setShowVerifiedModal(false)}
                sinceYear={sinceYear}
                releasesCount={releases.length}
                playlists={playlistsNames}
                recentVenues={recentVenues}
            />"""

content = content.replace(old_code_4, new_code_4)

with open('components/SpotifyView.tsx', 'w') as f:
    f.write(content)
