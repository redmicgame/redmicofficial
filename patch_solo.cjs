const fs = require('fs');
const file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(isSoloMemberSong && soloMemberId && gameState\.group\) \{[\s\S]*?\} else if \(currentCollaborations\.length > 0\)/;
const replacement = `if (isSoloMemberSong && soloMemberId && gameState.group) {
            const member = gameState.group.members.find(m => m.id === soloMemberId);
            if (member) {
                songTitle = \`\${songTitle} (\${member.name} Solo)\`;
                if (currentCollaborations.length === 0) {
                     currentCollaborations.push({ artistName: member.name, cost: 0 });
                } else {
                     songTitle = \`\${songTitle} (feat. \${currentCollaborations.map(c => c.artistName).join(', ')})\`;
                }
            }
        } else if (currentCollaborations.length > 0)`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
