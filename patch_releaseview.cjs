const fs = require('fs');

let file = '/app/applet/components/ReleaseView.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add selectedLiveTourId state
content = content.replace(
    `const [deluxeCoverArt, setDeluxeCoverArt] = useState<string | null>(null);`,
    `const [deluxeCoverArt, setDeluxeCoverArt] = useState<string | null>(null);\n    const [selectedLiveTourId, setSelectedLiveTourId] = useState<string>('');`
);

// 2. Add 'Live Album' to the map array
content = content.replace(
    `(['Single', 'EP', 'Album', 'Album (Deluxe)', 'Compilation'] as ReleaseType[])`,
    `(['Single', 'EP', 'Album', 'Album (Deluxe)', 'Compilation', 'Live Album'] as ReleaseType[])`
);

// 3. Update handleRelease
const targetHandleReleaseStart = `        if (releaseType === 'Album (Deluxe)') {`;
const replacementHandleReleaseStart = `        const liveSongs: Song[] = [];
        if (releaseType === 'Live Album') {
            const liveTour = activeArtistData.tours.find(t => t.id === selectedLiveTourId);
            if (!liveTour) { setError("Please select a tour."); return; }
            if (!coverArt) { setError("A cover art is required for a live album."); return; }
            
            for (const songId of liveTour.setlist) {
                const original = songs.find(s => s.id === songId);
                if (original) {
                    const liveSong: Song = {
                        ...original,
                        id: crypto.randomUUID(),
                        title: original.title + " - Live",
                        isReleased: false,
                        releaseId: undefined,
                        releaseDate: undefined,
                        streams: 0,
                        sales: 0,
                        revenue: 0,
                        netRevenue: 0,
                        weeklyStreams: 0,
                        prevWeekStreams: 0,
                        lastWeekStreams: 0,
                        actualLastWeekStreams: 0,
                        dailyStreams: [],
                        isVaulted: false
                    };
                    liveSongs.push(liveSong);
                }
            }
            if (liveSongs.length === 0) { setError("Tour setlist is empty."); return; }
            finalReleaseType = 'Live Album';
        } else if (releaseType === 'Album (Deluxe)') {`;
content = content.replace(targetHandleReleaseStart, replacementHandleReleaseStart);

// 4. Update newRelease creation
const targetNewRelease = `            songIds: releaseType === 'Album (Deluxe)'
                ? [...(releases.find(r => r.id === baseAlbumForDeluxe)?.songIds || []), ...Array.from(selectedSongIds)]
                : Array.from(selectedSongIds),`;
const replacementNewRelease = `            songIds: releaseType === 'Live Album' 
                ? liveSongs.map(s => s.id)
                : releaseType === 'Album (Deluxe)'
                    ? [...(releases.find(r => r.id === baseAlbumForDeluxe)?.songIds || []), ...Array.from(selectedSongIds)]
                    : Array.from(selectedSongIds),`;
content = content.replace(targetNewRelease, replacementNewRelease);

// 5. Dispatch RECORD_SONG before submitting/releasing
const targetDispatch = `        if (contract) {`;
const replacementDispatch = `        for (const song of liveSongs) {
            dispatch({ type: 'RECORD_SONG', payload: { song, cost: 0 } });
        }
        
        if (contract) {`;
content = content.replace(targetDispatch, replacementDispatch);

// 6. Fix "Could not determine cover art" for Live Album
const targetCoverArtCheck = `            if (!coverArt) {
                setError('Could not determine cover art. Select at least one song.'); return;
            }`;
const replacementCoverArtCheck = `            if (!coverArt && releaseType !== 'Live Album') {
                setError('Could not determine cover art. Select at least one song.'); return;
            }`;
content = content.replace(targetCoverArtCheck, replacementCoverArtCheck);

fs.writeFileSync(file, content);
console.log("Patched ReleaseView for Live Album");
