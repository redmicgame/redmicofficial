const fs = require('fs');
const file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

const missingPart = `                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-zinc-700">
                                <div className="flex justify-between items-center mb-4 text-zinc-300">
                                    <span>Studio Cost</span>
                                    <span>\${formatNumber(selectedStudio.cost)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4 text-zinc-300">
                                    <span>Features Cost</span>
                                    <span>\${formatNumber(totalCost - selectedStudio.cost - getContributorCost())}</span>
                                </div>
                                {getContributorCost() > 0 && (
                                    <div className="flex justify-between items-center mb-4 text-zinc-300">
                                        <span>Band Members Cost</span>
                                        <span>\${formatNumber(getContributorCost())}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mb-6 text-xl font-bold text-white">
                                    <span>Total Valid Cost</span>
                                    <span>\${formatNumber(totalCost)}</span>
                                </div>

                                {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

                                <button 
                                    onClick={handleRecordSong} 
                                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-red-600/20 disabled:bg-zinc-600 disabled:shadow-none"
                                    disabled={money < totalCost || !title.trim()}
                                >
                                    Record Song (-\${formatNumber(totalCost)})
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {mode === 'remixPack' && (
                    <>
                        <div className="bg-zinc-800/50 border border-zinc-700 p-6 rounded-xl space-y-6">
                            <h2 className="text-lg font-bold mb-4">Create a Remix Pack</h2>
                            <p className="text-sm text-zinc-400 mb-6">Create alternative versions of an existing song to boost its streaming numbers and chart position. Remixes share streams with the original song.</p>
                            
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Select Song to Remix</label>
                                <select 
                                    value={remixPackTargetId || ''} 
                                    onChange={e => setRemixPackTargetId(e.target.value)} 
                                    className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"
                                >
                                    <option value="">Select a song...</option>
                                    {activeArtistData.songs.filter(s => s.type !== 'remix').map(song => (
                                        <option key={song.id} value={song.id}>{song.title}</option>
                                    ))}
                                </select>
                            </div>

                            {remixPackTargetId && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Select Remix Types to Include</label>
                                        <div className="space-y-2 bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                                            {['Sped Up', 'Slowed Down', 'Acapella', 'Instrumental', 'Feature 1', 'Feature 2'].map(type => (
                                                <label key={type} className="flex items-center gap-3 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedRemixTypes.has(type)}
                                                        onChange={() => toggleRemixType(type)}
                                                        className="rounded border-zinc-600 text-red-600 focus:ring-red-500 bg-zinc-700 w-5 h-5"
                                                    />
                                                    <span className="text-zinc-300 font-medium">{type}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
`;

// we find line 1004 which is exactly: "                        </div>"
// we can replace the end of my patched `isCustomCollab` block up to `selectedRemixTypes.has('Feature 1') && (`
const badSection = `                                        </div>
                                    </div>
                                )}
                        </div>

                                        {selectedRemixTypes.has('Feature 1') && (`;

content = content.replace(badSection, missingPart + "                                        {selectedRemixTypes.has('Feature 1') && (");
fs.writeFileSync(file, content);
