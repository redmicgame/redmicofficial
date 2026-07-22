const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/StudioView.tsx', 'utf8');

const targetAutoWriteLogic = `                duration: track.duration ? Math.floor(track.duration / 1000) : (Math.floor(Math.random() * (240 - 120 + 1)) + 120),
                explicit: false,
                artistId: activeArtist.id,
                removedStreams: 0,
                dailyStreams: [],
                producers: [],
                songwriters: [],
                engineers: [],
                anr: [],
                features: [],
                samples: [],
                isExplicit: false,`;

const replacementAutoWriteLogic = `                duration: track.duration ? Math.floor(track.duration / 1000) : (Math.floor(Math.random() * (240 - 120 + 1)) + 120),
                explicit: isExplicit,
                artistId: activeArtist.id,
                removedStreams: 0,
                dailyStreams: [],
                producers: [],
                songwriters: [],
                engineers: [],
                anr: [],
                features: [],
                samples: [],`;

content = content.replace(targetAutoWriteLogic, replacementAutoWriteLogic);

const targetAutoWriteUI = `                                            <select value={subgenre} onChange={e => setSubgenre(e.target.value)} className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                                                {SUBGENRES.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                                            </select>
                                        </div>
                                    </div>`;

const replacementAutoWriteUI = `                                            <select value={subgenre} onChange={e => setSubgenre(e.target.value)} className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                                                {SUBGENRES.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 mb-2">
                                        <input type="checkbox" id="autowrite-explicit" checked={isExplicit} onChange={e => setIsExplicit(e.target.checked)} className="rounded border-zinc-600 text-red-600 focus:ring-red-500 bg-zinc-700 w-4 h-4"/>
                                        <label htmlFor="autowrite-explicit" className="text-sm font-medium text-zinc-300">Explicit Content</label>
                                    </div>`;

content = content.replace(targetAutoWriteUI, replacementAutoWriteUI);
fs.writeFileSync('/app/applet/components/StudioView.tsx', content);
console.log("Success");
