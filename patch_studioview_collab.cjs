const fs = require('fs');
let content = fs.readFileSync('components/StudioView.tsx', 'utf-8');

const target = `const potentialCollaborators = useMemo(() => {
        const npcs = NPC_ARTIST_NAMES.slice().sort();`;

const replacement = `const potentialCollaborators = useMemo(() => {
        const currentYear = gameState.date.year;
        const npcs = NPC_ARTIST_NAMES.filter(name => {
            if (!NPC_ERAS[name]) return true;
            const era = NPC_ERAS[name];
            return currentYear >= era.start && currentYear <= era.end;
        }).sort();`;

content = content.replace(target, replacement);

if (!content.includes('NPC_ERAS')) {
    content = content.replace('NPC_ARTIST_NAMES', 'NPC_ARTIST_NAMES, NPC_ERAS');
}

fs.writeFileSync('components/StudioView.tsx', content);
console.log('patched potentialCollaborators');
