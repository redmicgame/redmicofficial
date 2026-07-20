const fs = require('fs');

let file = '/app/applet/components/ReleaseView.tsx';
let content = fs.readFileSync(file, 'utf8');

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
                    </div>
                ) : releaseType === 'Album (Deluxe)' ? (`;

const replacementUI = `                {releaseType === 'Live Album' ? (
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

content = content.replace(targetUI, replacementUI);

fs.writeFileSync(file, content);
console.log("Patched ReleaseView Live Album UI");
