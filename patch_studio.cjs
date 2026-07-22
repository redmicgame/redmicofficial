const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/StudioView.tsx', 'utf8');

const target = `                        <div>
                            <label htmlFor="song-title" className="block text-sm font-medium text-zinc-300">Song Title</label>
                            <input type="text" id="song-title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"/>
                        </div>`;

const replacement = target + `
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Genre</label>
                                <select value={genre} onChange={e => { setGenre(e.target.value); setSubgenre(SUBGENRES[0]); }} className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Subgenre</label>
                                <select value={subgenre} onChange={e => setSubgenre(e.target.value)} className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                                    {SUBGENRES.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Producers (comma separated)</label>
                            <input type="text" value={producers.join(', ')} onChange={e => setProducers(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3" placeholder="Max Martin, Jack Antonoff"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Songwriters (comma separated)</label>
                            <input type="text" value={songwriters.join(', ')} onChange={e => setSongwriters(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3" placeholder="Taylor Swift, Ryan Tedder"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Engineers (comma separated)</label>
                            <input type="text" value={engineers.join(', ')} onChange={e => setEngineers(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3" placeholder="Serban Ghenea, John Hanes"/>
                        </div>
                        <div>
                            <h3 className="block text-sm font-medium text-zinc-300 mb-2">Select Studio</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {STUDIOS.map((studio, index) => (
                                    <button key={studio.name} onClick={() => setStudioIndex(index)} className={\`p-4 rounded-lg text-left transition-all border-2 \${studioIndex === index ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'}\`}>
                                        <p className="font-bold text-white">{studio.name}</p>
                                        <p className="text-sm text-green-400">-\${formatNumber(studio.cost)}</p>
                                    </button>
                                ))}
                            </div>
                        </div>`;

// Check if we already replaced it so we don't duplicate
if (!content.includes('Engineers (comma separated)')) {
    content = content.replace(target, replacement);
    fs.writeFileSync('/app/applet/components/StudioView.tsx', content);
    console.log("Success");
} else {
    console.log("Already replaced");
}
