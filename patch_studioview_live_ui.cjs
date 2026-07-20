const fs = require('fs');

let file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetModeContent = '<div className="p-4 space-y-6">';
const replacementModeContent = '<div className="p-4 space-y-6">\n                {mode === \\\'liveAlbum\\\' && (\n                    <div className="space-y-4">\n                        <div>\n                            <h2 className="text-xl font-bold mb-2">Record Live Album</h2>\n                            <p className="text-sm text-zinc-400 mb-4">Select a finished tour to convert its setlist into a collection of live songs in your vault.</p>\n                            <label className="block text-sm font-medium text-zinc-300 mb-1">Select Tour</label>\n                            <select \n                                value={liveAlbumTourId} \n                                onChange={(e) => setLiveAlbumTourId(e.target.value)}\n                                className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-red-500 focus:border-red-500"\n                            >\n                                <option value="">-- Select a finished tour --</option>\n                                {activeArtistData?.tours.filter(t => t.status === \\\'finished\\\').map(t => (\n                                    <option key={t.id} value={t.id}>{t.name}</option>\n                                ))}\n                            </select>\n                        </div>\n                        {error && <p className="text-red-500 text-sm font-bold bg-red-900/20 p-2 rounded">{error}</p>}\n                    </div>\n                )}';
content = content.replace(targetModeContent, replacementModeContent.replace(/\\'/g, "'"));

content = content.replace(
    "{isFetchingSpotify ? 'Fetching...' : mode === 'remixPack' ? `Record Remix Pack ($${formatNumber(packTotalCost)})` : mode === 'rerecord' ? `Re-Record Song ($${formatNumber(totalCost)})` : mode === 'remaster' ? `Remaster Song ($${formatNumber(totalCost)})` : mode === 'autoWrite' ? 'Import from Spotify' : `Record Song ($${formatNumber(totalCost)})`}",
    "{isFetchingSpotify ? 'Fetching...' : mode === 'liveAlbum' ? 'Record Live Setlist (Free)' : mode === 'remixPack' ? `Record Remix Pack ($${formatNumber(packTotalCost)})` : mode === 'rerecord' ? `Re-Record Song ($${formatNumber(totalCost)})` : mode === 'remaster' ? `Remaster Song ($${formatNumber(totalCost)})` : mode === 'autoWrite' ? 'Import from Spotify' : `Record Song ($${formatNumber(totalCost)})`}"
);

content = content.replace(
    "onClick={mode === 'remixPack' ? handleCreateRemixPack : mode === 'rerecord' ? handleReRecord : mode === 'remaster' ? handleRemaster : mode === 'autoWrite' ? handleAutoWrite : handleCreateSong}",
    "onClick={mode === 'liveAlbum' ? handleLiveAlbum : mode === 'remixPack' ? handleCreateRemixPack : mode === 'rerecord' ? handleReRecord : mode === 'remaster' ? handleRemaster : mode === 'autoWrite' ? handleAutoWrite : handleCreateSong}"
);

content = content.replace(
    "{mode !== 'autoWrite' && (",
    "{mode !== 'autoWrite' && mode !== 'liveAlbum' && ("
);

fs.writeFileSync(file, content);
console.log("Patched StudioView Live Album UI");
