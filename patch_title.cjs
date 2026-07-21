const fs = require('fs');
const file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /\} else if \(currentCollaborations\.length === 1\) \{\s*songTitle = `\$\{songTitle\} \(feat\. \$\{currentCollaborations\[0\]\.artistName\}\)`;\s*\}/g,
    `} else if (currentCollaborations.length > 0) {
            songTitle = \`\${songTitle} (feat. \${currentCollaborations.map(c => c.artistName).join(', ')})\`;
        }`
);

fs.writeFileSync(file, content);
