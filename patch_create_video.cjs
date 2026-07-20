const fs = require('fs');

const file_path = '/app/applet/components/CreateVideoView.tsx';
let content = fs.readFileSync(file_path, 'utf8');

// Add state
content = content.replace(
    "const [customTitle, setCustomTitle] = useState('');",
    "const [customTitle, setCustomTitle] = useState('');\n    const [isScheduled, setIsScheduled] = useState(false);\n    const [scheduledWeeks, setScheduledWeeks] = useState(1);"
);

// Add to newVideo
content = content.replace(
    "releaseDate: date,",
    "releaseDate: isScheduled ? { week: ((date.week + scheduledWeeks - 1) % 52) + 1, year: date.year + Math.floor((date.week + scheduledWeeks - 1) / 52) } : date,\n            isScheduled: isScheduled,"
);

// Add UI
const insertUI = `                        <div>
                            <label className="block text-sm font-medium text-zinc-300">Schedule Release</label>
                            <div className="mt-2 flex items-center space-x-4">
                                <label className="inline-flex items-center">
                                    <input type="checkbox" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} className="form-checkbox bg-zinc-800 border-zinc-700 text-red-500 rounded" />
                                    <span className="ml-2 text-sm text-zinc-300">Schedule for later</span>
                                </label>
                                {isScheduled && (
                                    <select value={scheduledWeeks} onChange={e => setScheduledWeeks(parseInt(e.target.value))} className="bg-zinc-800 border border-zinc-700 rounded p-1 text-sm">
                                        {[1,2,3,4,5,6,7,8,12,16].map(w => <option key={w} value={w}>In {w} week{w > 1 ? 's' : ''}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="thumbnail"`;

content = content.replace(
    `                        <div>
                            <label htmlFor="thumbnail"`,
    insertUI
);

fs.writeFileSync(file_path, content);
console.log("Patched CreateVideoView");
