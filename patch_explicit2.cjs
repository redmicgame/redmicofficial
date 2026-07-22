const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/StudioView.tsx', 'utf8');

const target = `                                    <div>
                                        <label htmlFor="rerecord-title" className="block text-sm font-medium text-zinc-300">New Song Title</label>
                                        <input type="text" id="rerecord-title" value={reRecordTitle} onChange={e => setReRecordTitle(e.target.value)} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"/>
                                    </div>`;

const replacement = `                                    <div>
                                        <label htmlFor="rerecord-title" className="block text-sm font-medium text-zinc-300">New Song Title</label>
                                        <input type="text" id="rerecord-title" value={reRecordTitle} onChange={e => setReRecordTitle(e.target.value)} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"/>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="rerecord-explicit" checked={isExplicit} onChange={e => setIsExplicit(e.target.checked)} className="rounded border-zinc-600 text-red-600 focus:ring-red-500 bg-zinc-700 w-4 h-4"/>
                                        <label htmlFor="rerecord-explicit" className="text-sm font-medium text-zinc-300">Explicit Content</label>
                                    </div>`;

content = content.replace(target, replacement);
fs.writeFileSync('/app/applet/components/StudioView.tsx', content);
console.log("Success");
