const fs = require('fs');
const file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace collaborations array with three explicit dropdowns
const replacement = `
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-zinc-300">Features (Max 3)</label>
                                </div>
                                
                                <div className="space-y-3 mb-2">
                                    {[0, 1, 2].map(index => {
                                        const collab = collaborations[index];
                                        return (
                                            <div key={index} className="flex gap-2 items-center">
                                                <select 
                                                    value={collab ? collab.artistName : ''}
                                                    onChange={e => {
                                                        const name = e.target.value;
                                                        const newCollabs = [...collaborations];
                                                        if (name) {
                                                            newCollabs[index] = { artistName: name, cost: getFeatureCost(name) };
                                                        } else {
                                                            newCollabs.splice(index, 1);
                                                        }
                                                        setCollaborations(newCollabs.filter(Boolean));
                                                    }} 
                                                    className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"
                                                >
                                                    <option value="">Feature \${index + 1}...</option>
                                                    {potentialCollaborators
                                                        .filter(name => !collaborations.some((c, i) => i !== index && c.artistName === name))
                                                        .map(name => <option key={name} value={name}>{name}</option>)}
                                                </select>
                                                {collab && (
                                                    <span className="text-yellow-400 text-sm whitespace-nowrap min-w-[60px] text-right">
                                                        \${formatNumber(collab.cost)}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
`;

content = content.replace(/<div className="flex justify-between items-center mb-1">[\s\S]*?\{collaborations\.length < 3 && isCustomCollab && \([\s\S]*?\}\)/, replacement);

fs.writeFileSync(file, content);
