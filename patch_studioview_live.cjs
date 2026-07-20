const fs = require('fs');

let file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add mode 'liveAlbum'
content = content.replace(
    `const [mode, setMode] = useState<'single' | 'remixPack' | 'rerecord' | 'remaster' | 'autoWrite'>('single');`,
    `const [mode, setMode] = useState<'single' | 'remixPack' | 'rerecord' | 'remaster' | 'autoWrite' | 'liveAlbum'>('single');\n    const [liveAlbumTourId, setLiveAlbumTourId] = useState('');`
);

// 2. Add handleLiveAlbum function
const targetAddSample = `    const handleAddSample = (artistName: string, type: 'Sample' | 'Interpolation') => {`;
const replacementHandleLiveAlbum = `    const handleLiveAlbum = () => {
        setError('');
        if (!liveAlbumTourId) {
            setError('Please select a finished tour to record a live album from.');
            return;
        }

        const tour = activeArtistData?.tours.find(t => t.id === liveAlbumTourId);
        if (!tour) return;
        
        const liveSongs = [];
        for (const songId of tour.setlist) {
            const original = activeArtistData?.songs.find(s => s.id === songId);
            if (original) {
                liveSongs.push({
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
                });
            }
        }
        
        if (liveSongs.length === 0) {
            setError("No valid songs found in the tour setlist.");
            return;
        }

        for (const song of liveSongs) {
            dispatch({ type: 'RECORD_SONG', payload: { song, cost: 0 } }); // Live album recording is free as it's from the tour
        }
        dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
    };

    const handleAddSample = (artistName: string, type: 'Sample' | 'Interpolation') => {`;
content = content.replace(targetAddSample, replacementHandleLiveAlbum);

// 3. Add UI button in mode switcher
const targetAutoWriteButton = `                    <button
                        onClick={() => { setMode('autoWrite'); setError(''); }}
                        className={\`px-4 py-1 rounded-md text-sm font-semibold transition-colors shrink-0 \${mode === 'autoWrite' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}\`}
                    >
                        Auto-Write (Spotify)
                    </button>`;
const replacementLiveAlbumButton = `                    <button
                        onClick={() => { setMode('autoWrite'); setError(''); }}
                        className={\`px-4 py-1 rounded-md text-sm font-semibold transition-colors shrink-0 \${mode === 'autoWrite' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}\`}
                    >
                        Auto-Write (Spotify)
                    </button>
                    <button
                        onClick={() => { setMode('liveAlbum'); setError(''); }}
                        className={\`px-4 py-1 rounded-md text-sm font-semibold transition-colors shrink-0 \${mode === 'liveAlbum' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}\`}
                    >
                        Live Album
                    </button>`;
content = content.replace(targetAutoWriteButton, replacementLiveAlbumButton);

// 4. Add mode content
const targetModeContent = `            <div className="flex-1 p-4 space-y-6 overflow-y-auto">`;
const replacementModeContent = `            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                {mode === 'liveAlbum' && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-bold mb-2">Record Live Album</h2>
                            <p className="text-sm text-zinc-400 mb-4">Select a finished tour to convert its setlist into a collection of live songs in your vault.</p>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Select Tour</label>
                            <select 
                                value={liveAlbumTourId} 
                                onChange={(e) => setLiveAlbumTourId(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">-- Select a finished tour --</option>
                                {activeArtistData?.tours.filter(t => t.status === 'finished').map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        {error && <p className="text-red-500 text-sm font-bold bg-red-900/20 p-2 rounded">{error}</p>}
                    </div>
                )}`;
content = content.replace(targetModeContent, replacementModeContent);

// 5. Hide common fields when liveAlbum
const targetCommonFields = `                {mode !== 'autoWrite' && (`;
const replacementCommonFields = `                {mode !== 'autoWrite' && mode !== 'liveAlbum' && (`;
content = content.replace(targetCommonFields, replacementCommonFields);

// 6. Update action button
const targetActionButton = `            <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                <button
                    onClick={mode === 'remixPack' ? handleCreateRemixPack : mode === 'rerecord' ? handleReRecord : mode === 'remaster' ? handleRemaster : mode === 'autoWrite' ? handleAutoWrite : handleCreateSong}
                    disabled={isFetchingSpotify}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors p-4 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                >
                    {isFetchingSpotify ? 'Fetching...' : mode === 'remixPack' ? \`Record Remix Pack ($\${formatNumber(packTotalCost)})\` : mode === 'rerecord' ? \`Re-Record Song ($\${formatNumber(totalCost)})\` : mode === 'remaster' ? \`Remaster Song ($\${formatNumber(totalCost)})\` : mode === 'autoWrite' ? 'Import from Spotify' : \`Record Song ($\${formatNumber(totalCost)})\`}
                </button>
            </div>`;
const replacementActionButton = `            <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                <button
                    onClick={mode === 'liveAlbum' ? handleLiveAlbum : mode === 'remixPack' ? handleCreateRemixPack : mode === 'rerecord' ? handleReRecord : mode === 'remaster' ? handleRemaster : mode === 'autoWrite' ? handleAutoWrite : handleCreateSong}
                    disabled={isFetchingSpotify}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors p-4 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                >
                    {isFetchingSpotify ? 'Fetching...' : mode === 'liveAlbum' ? 'Record Live Setlist (Free)' : mode === 'remixPack' ? \`Record Remix Pack ($\${formatNumber(packTotalCost)})\` : mode === 'rerecord' ? \`Re-Record Song ($\${formatNumber(totalCost)})\` : mode === 'remaster' ? \`Remaster Song ($\${formatNumber(totalCost)})\` : mode === 'autoWrite' ? 'Import from Spotify' : \`Record Song ($\${formatNumber(totalCost)})\`}
                </button>
            </div>`;
content = content.replace(targetActionButton, replacementActionButton);

fs.writeFileSync(file, content);
console.log("Patched StudioView Live Album");
