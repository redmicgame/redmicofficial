const fs = require('fs');
const content = fs.readFileSync('/app/applet/components/VevoView.tsx', 'utf8');

const target = `    const musicVideos = videos.filter(v => v.type === 'Music Video');
    const nonSpotifyVideos = musicVideos.filter(v => !v.isOnSpotify);`;

const replacement = `    const musicVideos = videos.filter(v => v.type === 'Music Video' && !v.isOnSpotify);
    const otherVideos = videos.filter(v => v.type !== 'Music Video' && !v.isOnSpotify);`;

let newContent = content.replace(target, replacement);

const target2 = `                <h3 className="text-lg font-bold mb-4">Eligible Music Videos</h3>
                {nonSpotifyVideos.length === 0 ? (
                    <p className="text-zinc-500 italic">No eligible music videos found. Create a Music Video in the YouTube app first.</p>
                ) : (
                    <div className="space-y-4">
                        {nonSpotifyVideos.map(video => (`;

const replacement2 = `                <h3 className="text-lg font-bold mb-4">Eligible Music Videos</h3>
                {musicVideos.length === 0 ? (
                    <p className="text-zinc-500 italic mb-8">No eligible music videos found. Create a Music Video in the YouTube app first.</p>
                ) : (
                    <div className="space-y-4 mb-8">
                        {musicVideos.map(video => (`;

newContent = newContent.replace(target2, replacement2);

const target3 = `                        ))}
                    </div>
                )}
            </div>
        </div>
    );`;

const replacement3 = `                        ))}
                    </div>
                )}
                
                <h3 className="text-lg font-bold mb-4 mt-8 pt-6 border-t border-zinc-800">Other Videos</h3>
                {otherVideos.length === 0 ? (
                    <p className="text-zinc-500 italic">No other eligible videos found.</p>
                ) : (
                    <div className="space-y-4">
                        {otherVideos.map(video => (
                            <div key={video.id} className="flex items-center gap-4 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                <img src={video.thumbnail} alt={video.title} className="w-24 h-16 object-cover rounded" />
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold truncate">{video.title}</p>
                                    <p className="text-xs text-zinc-400 mb-1">{video.type}</p>
                                    <p className="text-sm text-zinc-400">{formatNumber(video.views)} YouTube Views</p>
                                </div>
                                <button
                                    onClick={() => handleUploadToSpotify(video.id)}
                                    disabled={money < cost}
                                    className="bg-green-600 text-white font-bold py-2 px-4 rounded text-sm disabled:opacity-50 hover:bg-green-500 whitespace-nowrap"
                                >
                                    Distribute
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );`;

newContent = newContent.replace(target3, replacement3);
fs.writeFileSync('/app/applet/components/VevoView.tsx', newContent);
console.log("Updated VevoView.tsx");
