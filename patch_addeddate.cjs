const fs = require('fs');
let content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf8');

content = content.replace(
    `              addedDate: existingTrack ? existingTrack.addedDate : newDate,`,
    `              addedDate: (existingTrack && existingTrack.addedDate) ? existingTrack.addedDate : newDate,`
);

content = content.replace(
    `                  addedDate: existingTrack ? existingTrack.addedDate : newDate,`,
    `                  addedDate: (existingTrack && existingTrack.addedDate) ? existingTrack.addedDate : newDate,`
);

fs.writeFileSync('/app/applet/context/GameContext.tsx', content);
console.log("Success");
