import fs from 'fs';

let code = fs.readFileSync('components/SpotifySnapshotView.tsx', 'utf8');

const target = `                {/* Banner Area */}
                <div 
                    className="w-full h-48 bg-zinc-800 relative cursor-pointer group flex items-center justify-center border-b-4 border-black"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                        backgroundImage: release.snapshotBanner ? \`url(\${release.snapshotBanner})\` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {!release.snapshotBanner && (
                        <span className="text-white/50 font-bold group-hover:text-white/80 transition-colors">Tap to upload banner image</span>
                    )}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleBannerUpload} className="hidden" />
                </div>`;

const repl = `                {/* Banner Area */}
                <div 
                    className="w-full h-48 bg-zinc-800 relative cursor-pointer group flex items-center justify-between px-8 border-b-4 border-black overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                        backgroundImage: release.snapshotBanner ? \`url(\${release.snapshotBanner})\` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="absolute inset-0 bg-black/40 z-0 group-hover:bg-black/50 transition-colors" />
                    
                    <div className="relative z-10 flex items-center gap-6">
                        <img src={release.coverArt} className="w-32 h-32 rounded-sm shadow-xl" alt="Cover" />
                    </div>
                    
                    <div className="relative z-10 flex-grow text-center pointer-events-none">
                         {!release.snapshotBanner ? (
                            <div className="flex flex-col items-center">
                                <h1 className="text-5xl font-black text-white uppercase tracking-tighter drop-shadow-lg">{release.title}</h1>
                                <span className="text-white/80 font-bold mt-2">Tap to upload custom banner</span>
                            </div>
                         ) : null}
                    </div>

                    <div className="relative z-10 font-bold text-white/50 italic pointer-events-none">
                         Charts by Red Mic
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleBannerUpload} className="hidden" />
                </div>`;

code = code.replace(target, repl);
fs.writeFileSync('components/SpotifySnapshotView.tsx', code);
