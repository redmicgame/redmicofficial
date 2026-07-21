const fs = require('fs');
const file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-zinc-300">Features (Max 3)</label>
                                    {gameState.hasRedMicPro && collaborations.length < 3 && (
                                        <button onClick={() => { setIsCustomCollab(!isCustomCollab); }} className="text-xs text-blue-400 font-bold hover:underline">
                                            {isCustomCollab ? 'Choose Existing' : 'Custom Feature'}
                                        </button>
                                    )}
                                </div>
                                
                                {!isCustomCollab ? (
                                    <div className="space-y-3 mb-2">
                                        {[0, 1, 2].map(index => {
                                            const collab = collaborations[index];
                                            return (
                                                <div key={index} className="flex gap-2 items-center">
                                                    <select 
                                                        value={collab ? collab.artistName : ''}
                                                        onChange={e => {
                                                            const name = e.target.value;
                                                            const newCollabs = [...collaborations];
                                                            if (name) {
                                                                newCollabs[index] = { artistName: name, cost: getFeatureCost(name) };
                                                            } else {
                                                                newCollabs.splice(index, 1);
                                                            }
                                                            setCollaborations(newCollabs.filter(Boolean));
                                                        }} 
                                                        className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3 text-white"
                                                    >
                                                        <option value="">Feature \${index + 1}...</option>
                                                        {potentialCollaborators
                                                            .filter(name => !collaborations.some((c, i) => i !== index && c.artistName === name))
                                                            .map(name => <option key={name} value={name}>{name}</option>)}
                                                    </select>
                                                    {collab && (
                                                        <span className="text-yellow-400 text-sm whitespace-nowrap min-w-[60px] text-right">
                                                            \${formatNumber(collab.cost)}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
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
                                            placeholder="Cost" 
                                            value={customCollabCost || ''}
                                            onChange={e => setCustomCollabCost(Number(e.target.value))}
                                            className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 sm:text-sm h-10 px-3 text-white"
                                        />
                                        <button onClick={addCustomCollaboration} className="w-full bg-blue-600 text-white font-bold py-2 rounded text-sm hover:bg-blue-500">
                                            Add Custom Feature
                                        </button>
                                        <div className="space-y-2 mt-2">
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
                                    </div>
                                )}`;

content = content.replace(/<div className="flex justify-between items-center mb-1">[\s\S]*?<\/div>[\s]*<\/div>/, replacement);

fs.writeFileSync(file, content);
