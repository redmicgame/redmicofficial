const fs = require('fs');
const file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /<select id="collaboration" onChange=\{handleAddCollaboration\} className="(.*?)">/g,
    '<select id="collaboration" value="" onChange={handleAddCollaboration} className="$1">'
);

content = content.replace(
    /\{potentialCollaborators\.map\(name => <option key=\{name\} value=\{name\}>\{name\}<\/option>\)\}/g,
    '{potentialCollaborators.filter(name => !collaborations.some(c => c.artistName === name)).map(name => <option key={name} value={name}>{name}</option>)}'
);

fs.writeFileSync(file, content);
