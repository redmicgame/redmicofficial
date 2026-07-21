const fs = require('fs');
const file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

// State
content = content.replace(
    /const \[collaboration, setCollaboration\] = useState<\{[^}]+\} \| null>\(null\);/,
    `const [collaborations, setCollaborations] = useState<{ artistName: string; cost: number }[]>([]);`
);

// Total Cost
content = content.replace(
    /const totalCost = selectedStudio\.cost \+ \(collaboration \? collaboration\.cost : 0\) \+ getContributorCost\(\);/g,
    `const totalCost = selectedStudio.cost + collaborations.reduce((sum, c) => sum + c.cost, 0) + getContributorCost();`
);

// handleCollaborationChange
content = content.replace(
    /const handleCollaborationChange = \(e: React\.ChangeEvent<HTMLSelectElement>\) => {[\s\S]*?};/,
    `const handleAddCollaboration = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.value;
        if (!name || collaborations.length >= 3) return;
        const artist = potentialCollaboratorsData.find(a => a.name === name);
        if (artist) {
            setCollaborations([...collaborations, { artistName: name, cost: artist.cost }]);
        }
        e.target.value = '';
    };
    
    const removeCollaboration = (index: number) => {
        setCollaborations(collaborations.filter((_, i) => i !== index));
    };
    
    const [customCollabArtist, setCustomCollabArtist] = useState('');
    const [customCollabCost, setCustomCollabCost] = useState(0);
    
    const addCustomCollaboration = () => {
        if (!customCollabArtist || collaborations.length >= 3) return;
        setCollaborations([...collaborations, { artistName: customCollabArtist, cost: customCollabCost }]);
        setCustomCollabArtist('');
        setCustomCollabCost(0);
        setIsCustomCollab(false);
    };`
);

// Remove the old potentialCollaboratorsData reference
content = content.replace(
    /const potentialCollaborators = potentialCollaboratorsData\.map\(a => a\.name\);/,
    `const potentialCollaborators = potentialCollaboratorsData.map(a => a.name).filter(name => !collaborations.some(c => c.artistName === name));`
);

// Quality boost creation
content = content.replace(
    /const qualityBoost = collaboration \? Math\.floor\(Math\.random\(\) \* 10\) \+ 1 : 0;/g,
    `const qualityBoost = collaborations.reduce((sum) => sum + Math.floor(Math.random() * 10) + 1, 0);`
);
content = content.replace(
    /const qualityBoost = collaboration \? 15 : 0;/g,
    `const qualityBoost = collaborations.length * 15;`
);

// currentCollaboration logic
content = content.replace(
    /let currentCollaboration = collaboration;/,
    `let currentCollaborations = [...collaborations];`
);

content = content.replace(
    /if \(!currentCollaboration\) \{\s*currentCollaboration = \{ artistName: member\.name, cost: 0 \};\s*\} else \{\s*songTitle = \`\$\{songTitle\} \(feat\. \$\{currentCollaboration\.artistName\}\)\`;\s*\}/,
    `if (currentCollaborations.length === 0) {
                     currentCollaborations.push({ artistName: member.name, cost: 0 });
                } else if (currentCollaborations.length === 1) {
                     songTitle = \`\${songTitle} (feat. \${currentCollaborations[0].artistName})\`;
                } else {
                     // No (feat. ) for multiple features
                }`
);

content = content.replace(
    /\} else if \(currentCollaboration\) \{\s*songTitle = \`\$\{songTitle\} \(feat\. \$\{currentCollaboration\.artistName\}\)\`;\s*\}/,
    `} else if (currentCollaborations.length === 1) {
            songTitle = \`\${songTitle} (feat. \${currentCollaborations[0].artistName})\`;
        }`
);

// Song object population
content = content.replace(
    /collaboration: currentCollaboration \? \{ \.\.\.currentCollaboration, qualityBoost \} : undefined,/g,
    `features: currentCollaborations.map(c => c.artistName),`
);
content = content.replace(
    /collaboration: collaboration \? \{ \.\.\.collaboration, qualityBoost \} : undefined,/g,
    `features: collaborations.map(c => c.artistName),`
);
content = content.replace(
    /collaboration: currentFeature \? \{ \.\.\.currentFeature, qualityBoost \} : undefined,/g,
    `features: currentFeature ? [currentFeature.artistName] : [],`
);

fs.writeFileSync(file, content);
