const fs = require('fs');

let file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetModeContent = `<div className="p-4 space-y-6">
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

const replacementModeContent = `<div className="p-4 space-y-6">
                {mode === 'liveAlbum' && (
                    <div className="bg-zinc-800/50 border border-zinc-700 p-6 rounded-xl space-y-6">
                        <h2 className="text-lg font-bold mb-4">Record Live Album</h2>
                        <p className="text-sm text-zinc-400 mb-6">Select a finished tour to convert its setlist into a collection of live songs in your vault. Quality is based on the selected studio.</p>
                        
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Select Tour</label>
                            <select 
                                value={liveAlbumTourId} 
                                onChange={(e) => { setLiveAlbumTourId(e.target.value); setError(''); }}
                                className="w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"
                            >
                                <option value="">Select a finished tour</option>
                                {activeArtistData?.tours.filter(t => t.status === 'finished').map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.setlist.length} tracks)</option>
                                ))}
                            </select>
                        </div>

                        {liveAlbumTourId && (() => {
                            const selectedTour = activeArtistData?.tours.find(t => t.id === liveAlbumTourId);
                            if (!selectedTour) return null;
                            const trackCount = selectedTour.setlist.length;
                            const totalCost = trackCount * selectedStudio.cost;
                            return (
                                <>
                                    <div className="mt-6">
                                        <h3 className="block text-sm font-medium text-zinc-300 mb-2">Setlist Preview</h3>
                                        <div className="bg-zinc-900 rounded-lg max-h-40 overflow-y-auto p-3 text-sm text-zinc-400">
                                            {selectedTour.setlist.map((songId, i) => {
                                                const song = activeArtistData?.songs.find(s => s.id === songId);
                                                return <div key={i}>{i+1}. {song?.title || 'Unknown'} - Live</div>;
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <h3 className="block text-sm font-medium text-zinc-300 mb-2">Select Studio</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {STUDIOS.map((studio, index) => (
                                                <button key={studio.name} onClick={() => setStudioIndex(index)} className={\`p-4 rounded-lg text-left transition-all border-2 \${studioIndex === index ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'}\`}>
                                                    <p className="font-bold">{studio.name}</p>
                                                    <p className="text-sm text-green-400">-\${studio.cost.toLocaleString()} / track</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
                                    
                                    <div className="mt-8 pt-6 border-t border-zinc-700">
                                        <div className="flex justify-between items-center mb-4 text-zinc-300">
                                            <span>Studio Cost ({trackCount} tracks x \${formatNumber(selectedStudio.cost)})</span>
                                            <span>\${formatNumber(totalCost)}</span>
                                        </div>
                                        <button 
                                            onClick={handleLiveAlbum} 
                                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-red-600/20 disabled:bg-zinc-600 disabled:shadow-none mt-4" 
                                            disabled={money < totalCost}
                                        >
                                            Record Live Setlist (-\${formatNumber(totalCost)})
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}`;

content = content.replace(targetModeContent, replacementModeContent);
fs.writeFileSync(file, content);
console.log("Patched StudioView Live Album UI 2");
