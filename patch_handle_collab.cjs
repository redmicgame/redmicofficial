const fs = require('fs');
const file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const handleAddCollaboration = \(e: React\.ChangeEvent<HTMLSelectElement>\) => \{[\s\S]*?\};/;
const replacement = `const handleAddCollaboration = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.value;
        if (!name || collaborations.length >= 3) return;
        setCollaborations([...collaborations, { artistName: name, cost: getFeatureCost(name) }]);
        e.target.value = '';
    };`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
