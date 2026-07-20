const fs = require('fs');
let content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf-8');

content = content.replace(
    '          if (!effectivelyReleased && song.releaseDate && song.releaseDate.week === newDate.week && song.releaseDate.year === newDate.year) {\n            effectivelyReleased = true;\n          }',
    '          if (!effectivelyReleased && song.releaseDate && ((newDate.year > song.releaseDate.year) || (newDate.year === song.releaseDate.year && newDate.week >= song.releaseDate.week))) {\n            effectivelyReleased = true;\n          }'
);

fs.writeFileSync('/app/applet/context/GameContext.tsx', content);
console.log("Fixed past releases");
