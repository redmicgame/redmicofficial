const fs = require('fs');
let file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<h3 className="block text-sm font-medium text-zinc-300 mb-2">Select Studio<\/h3>/m;
const replacement = `<div className="mt-6 mb-6">
                                        <h3 className="block text-sm font-medium text-zinc-300 mb-2">Live Album Cover Art (Optional)</h3>
                                        <div className="flex justify-center">
                                            <label htmlFor="live-cover-art" className="cursor-pointer">
                                                <div className="w-48 h-48 rounded-lg bg-zinc-900 border-2 border-dashed border-zinc-600 flex items-center justify-center hover:border-red-500 transition-colors">
                                                    {coverArt ? (
                                                        <img src={coverArt} alt="Cover Art" className="w-full h-full rounded-lg object-cover" />
                                                    ) : (
                                                        <span className="text-zinc-500 text-sm text-center">Upload Cover Art<br/>(If not uploaded, uses original cover)</span>
                                                    )}
                                                </div>
                                            </label>
                                            <input id="live-cover-art" type="file" accept="image/*" className="hidden" onChange={handleCoverArtUpload} />
                                        </div>
                                    </div>
                                    <h3 className="block text-sm font-medium text-zinc-300 mb-2">Select Studio</h3>`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Patched UI for cover art in live album');
