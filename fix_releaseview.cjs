const fs = require('fs');
let file = '/app/applet/components/ReleaseView.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Restore the handleRelease logic to just handle the songs directly
const targetHandleReleaseStart = `        const liveSongs: Song[] = [];
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

const replacementHandleReleaseStart = `        if (releaseType === 'Album (Deluxe)') {`;
content = content.replace(targetHandleReleaseStart, replacementHandleReleaseStart);

// 2. Fix the newRelease songIds logic
const targetNewRelease = `            songIds: releaseType === 'Live Album' 
                ? liveSongs.map(s => s.id)
                : releaseType === 'Album (Deluxe)'
                    ? [...(releases.find(r => r.id === baseAlbumForDeluxe)?.songIds || []), ...Array.from(selectedSongIds)]
                    : Array.from(selectedSongIds),`;
const replacementNewRelease = `            songIds: releaseType === 'Album (Deluxe)'
                ? [...(releases.find(r => r.id === baseAlbumForDeluxe)?.songIds || []), ...Array.from(selectedSongIds)]
                : Array.from(selectedSongIds),`;
content = content.replace(targetNewRelease, replacementNewRelease);

// 3. Fix the RECORD_SONG dispatch logic
const targetDispatch = `        for (const song of liveSongs) {
            dispatch({ type: 'RECORD_SONG', payload: { song, cost: 0 } });
        }
        
        if (contract) {`;
const replacementDispatch = `        if (contract) {`;
content = content.replace(targetDispatch, replacementDispatch);

// 4. Fix cover art check
const targetCoverArtCheck = `            if (!coverArt && releaseType !== 'Live Album') {
                setError('Could not determine cover art. Select at least one song.'); return;
            }`;
const replacementCoverArtCheck = `            if (!coverArt) {
                setError('Could not determine cover art. Select at least one song.'); return;
            }`;
content = content.replace(targetCoverArtCheck, replacementCoverArtCheck);

// 5. Remove Live Album UI from render
const targetUI = `                {releaseType === 'Live Album' ? (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="live-tour" className="block text-sm font-medium text-zinc-300">Select Completed Tour</label>
                            <select
                                id="live-tour"
                                value={selectedLiveTourId}
                                onChange={(e) => setSelectedLiveTourId(e.target.value)}
                                className="mt-1 block w-full bg-zinc-800 border-zinc-700 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"
                            >
                                <option value="">Select a tour</option>
                                {activeArtistData.tours.filter(t => t.status === 'finished').map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Live Album Cover Art</label>
                            <label htmlFor="live-cover-art" className="cursor-pointer inline-block">
                                <div className="w-32 h-32 bg-zinc-800 border-2 border-dashed border-zinc-600 rounded-md flex items-center justify-center overflow-hidden hover:border-red-500 transition-colors">
                                    {deluxeCoverArt ? <img src={deluxeCoverArt} className="w-full h-full object-cover" /> : <span className="text-zinc-500 text-xs">Upload Cover</span>}
                                </div>
                            </label>
                            <input id="live-cover-art" type="file" accept="image/*" className="hidden" onChange={handleDeluxeCoverArtUpload} />
                        </div>
                    </div>
                ) : releaseType === 'Album (Deluxe)' ? (`;

const replacementUI = `                {releaseType === 'Album (Deluxe)' ? (`;
content = content.replace(targetUI, replacementUI);

fs.writeFileSync(file, content);
console.log("Fixed ReleaseView");
