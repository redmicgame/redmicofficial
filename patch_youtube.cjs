const fs = require('fs');
const content = fs.readFileSync('components/YouTubeView.tsx', 'utf-8');
const patched = content
    .replace("const [filter, setFilter] = useState<'Popular' | 'Latest' | 'Oldest'>('Popular');", 
             "const [filter, setFilter] = useState<'Popular' | 'Latest' | 'Oldest'>('Popular');\n    const [channelTab, setChannelTab] = useState<'Videos' | 'Podcasts'>('Videos');")
    .replace("<div className=\"flex gap-4 px-4 overflow-x-auto\">\n                    <button className=\"py-3 text-sm font-semibold text-zinc-400\">Home</button>\n                    <button className=\"py-3 text-sm font-semibold border-b-2 border-white\">Videos</button>\n                    <button className=\"py-3 text-sm font-semibold text-zinc-400\">Shorts</button>\n                    <button className=\"py-3 text-sm font-semibold text-zinc-400\">Live</button>\n                    <button className=\"py-3 text-sm font-semibold text-zinc-400\">Releases</button>\n                </div>",
             `
                 <div className="flex gap-4 px-4 overflow-x-auto">
                    <button className="py-3 text-sm font-semibold text-zinc-400">Home</button>
                    <button onClick={() => setChannelTab('Videos')} className={\`py-3 text-sm font-semibold \${channelTab === 'Videos' ? 'border-b-2 border-white text-white' : 'text-zinc-400'}\`}>Videos</button>
                    <button className="py-3 text-sm font-semibold text-zinc-400">Shorts</button>
                    <button className="py-3 text-sm font-semibold text-zinc-400">Live</button>
                    <button className="py-3 text-sm font-semibold text-zinc-400">Releases</button>
                    {(gameState.podcasts || []).filter(p => p.host === channelData.name).length > 0 && (
                        <button onClick={() => setChannelTab('Podcasts')} className={\`py-3 text-sm font-semibold \${channelTab === 'Podcasts' ? 'border-b-2 border-white text-white' : 'text-zinc-400'}\`}>Podcasts</button>
                    )}
                </div>
             `)
    .replace("<main className=\"p-4 space-y-4\">",
             `<main className="p-4 space-y-4">
                {channelTab === 'Podcasts' ? (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">Podcasts</h3>
                        {(gameState.podcasts || []).filter(p => p.host === channelData.name).map(podcast => (
                            <div key={podcast.id} className="flex gap-3 bg-zinc-800/50 p-2 rounded-lg cursor-pointer hover:bg-zinc-800 transition" onClick={() => {
                                dispatch({ type: 'UPDATE_GAME_STATE', payload: { currentView: 'spotifyPodcasts' } });
                                // We also need to set selected podcast, maybe it's better to just open it via spotifyPodcasts?
                            }}>
                                <img src={podcast.coverArt || channelData.avatar} className="w-32 h-32 rounded-lg object-cover flex-shrink-0" />
                                <div className="flex flex-col py-1">
                                    <h4 className="font-bold text-xl leading-tight line-clamp-2">{podcast.name}</h4>
                                    <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{podcast.description}</p>
                                    <p className="text-xs text-zinc-500 mt-auto">{podcast.episodes.length} episodes</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                `)
    .replace("</main>", ")}</main>");
fs.writeFileSync('components/YouTubeView.tsx', patched);
