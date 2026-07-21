const fs = require('fs');
const file = '/app/applet/components/SpotifyView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* About Section \*\/\}/;
const replacement = `
                {/* Music Videos Section */}
                {activeArtistData.videos?.filter(v => v.isOnSpotify && v.type === 'Music Video').length > 0 && (
                    <div className="space-y-4 pt-4">
                        <h2 className="text-2xl font-bold">Music videos</h2>
                        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar snap-x">
                            {activeArtistData.videos.filter(v => v.isOnSpotify && v.type === 'Music Video').map(video => (
                                <div key={video.id} className="min-w-[280px] w-[280px] sm:min-w-[320px] sm:w-[320px] snap-center group relative cursor-pointer flex-shrink-0 rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-[1.02]">
                                    <div className="aspect-video w-full bg-zinc-800 relative">
                                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                                        <div className="absolute bottom-2 right-2 bg-black/70 rounded p-1">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-[#181818] h-full">
                                        <p className="font-bold text-white truncate text-base mb-1 group-hover:underline">{video.title}</p>
                                        <p className="text-sm text-zinc-400 truncate">{activeArtist.name} • {formatNumber(video.spotifyViews || 0)} views</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Watch More Section */}
                {activeArtistData.videos?.filter(v => v.isOnSpotify && v.type !== 'Music Video').length > 0 && (
                    <div className="space-y-4 pt-4">
                        <h2 className="text-2xl font-bold">Watch more from {activeArtist.name}</h2>
                        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar snap-x">
                            {activeArtistData.videos.filter(v => v.isOnSpotify && v.type !== 'Music Video').map(video => (
                                <div key={video.id} className="min-w-[280px] w-[280px] sm:min-w-[320px] sm:w-[320px] snap-center group relative cursor-pointer flex-shrink-0 rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-[1.02]">
                                    <div className="aspect-video w-full bg-zinc-800 relative">
                                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                                        <div className="absolute bottom-2 right-2 bg-black/70 rounded p-1">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-[#181818] h-full">
                                        <p className="font-bold text-white truncate text-base mb-1 group-hover:underline">{video.title}</p>
                                        <p className="text-sm text-zinc-400 truncate">{activeArtist.name} • {formatNumber(video.spotifyViews || 0)} views</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* About Section */}`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
