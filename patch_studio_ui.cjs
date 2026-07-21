const fs = require('fs');
const file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

const uiRegex = /<div className="flex justify-between items-center mb-1">[\s\S]*?\{collaboration && !isCustomCollab && \([\s\S]*?Feature Cost: \$\{formatNumber\(collaboration\.cost\)\}<\/p>\s*\)\}/;

const newUI = `<div className="flex justify-between items-center mb-1">
                                <label htmlFor="collaboration" className="block text-sm font-medium text-zinc-300">Features (Max 3)</label>
                                {gameState.hasRedMicPro && collaborations.length < 3 && (
                                    <button onClick={() => { setIsCustomCollab(!isCustomCollab); }} className="text-xs text-blue-400 font-bold hover:underline">
                                        {isCustomCollab ? 'Choose Existing' : 'Custom Feature'}
                                    </button>
                                )}
                            </div>
                            
                            <div className="space-y-2 mb-2">
                                {collaborations.map((c, i) => (
                                    <div key={i} className="flex justify-between items-center bg-zinc-800 p-2 rounded text-sm text-white">
                                        <span>{c.artistName}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-yellow-400">\${formatNumber(c.cost)}</span>
                                            <button onClick={() => removeCollaboration(i)} className="text-red-400 hover:text-red-300 font-bold">X</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {collaborations.length < 3 && !isCustomCollab && (
                                <select id="collaboration" onChange={handleAddCollaboration} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                                    <option value="">Add a feature...</option>
                                    {potentialCollaborators.map(name => <option key={name} value={name}>{name}</option>)}
                                </select>
                            )}
                            {collaborations.length < 3 && isCustomCollab && (
                                <div className="space-y-2 mt-1">
                                    <input 
                                        type="text" 
                                        placeholder="Artist Name" 
                                        value={customCollabArtist}
                                        onChange={e => setCustomCollabArtist(e.target.value)}
                                        className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 sm:text-sm h-10 px-3 text-white"
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Cost ($)" 
                                        value={customCollabCost || ''}
                                        onChange={e => setCustomCollabCost(parseInt(e.target.value) || 0)}
                                        className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 sm:text-sm h-10 px-3 text-white"
                                    />
                                    <button onClick={addCustomCollaboration} className="w-full bg-blue-600 text-white font-bold py-2 rounded text-sm hover:bg-blue-500">
                                        Add Custom Feature
                                    </button>
                                </div>
                            )}`;

content = content.replace(uiRegex, newUI);
fs.writeFileSync(file, content);
