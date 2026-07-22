const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/StudioView.tsx', 'utf8');

const targetComp = `const StudioView: React.FC = () => {`;
const replacementComp = `const MultiSelect = ({ options, selected, onChange, placeholder, max = 5 }: { options: string[], selected: string[], onChange: (val: string[]) => void, placeholder: string, max?: number }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div className="relative">
            <div 
                className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm sm:text-sm min-h-10 px-3 py-2 cursor-pointer text-zinc-300"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selected.length > 0 ? selected.join(', ') : placeholder}
            </div>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-zinc-800 border border-zinc-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {options.map(opt => (
                        <label key={opt} className="flex items-center px-3 py-2 hover:bg-zinc-700 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={selected.includes(opt)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        if (selected.length < max) onChange([...selected, opt]);
                                    } else {
                                        onChange(selected.filter(s => s !== opt));
                                    }
                                }}
                                className="mr-2 rounded border-zinc-600 text-red-600 focus:ring-red-500 bg-zinc-700"
                            />
                            {opt}
                        </label>
                    ))}
                </div>
            )}
        </div>
    )
}

const StudioView: React.FC = () => {`;

content = content.replace(targetComp, replacementComp);

const targetProducers = `                        <div>
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
                        </div>`;

const replacementProducers = `                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Producers (Max 3)</label>
                            <MultiSelect options={potentialProducers} selected={producers} onChange={setProducers} placeholder="Select Producers..." max={3} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Songwriters (Max 4)</label>
                            <MultiSelect options={potentialCollaborators} selected={songwriters} onChange={setSongwriters} placeholder="Select Songwriters..." max={4} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Engineers (Max 2)</label>
                            <MultiSelect options={potentialEngineers} selected={engineers} onChange={setEngineers} placeholder="Select Engineers..." max={2} />
                        </div>`;

content = content.replace(targetProducers, replacementProducers);

fs.writeFileSync('/app/applet/components/StudioView.tsx', content);
console.log("Success")
