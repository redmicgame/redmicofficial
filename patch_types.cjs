const fs = require('fs');
const file = '/app/applet/types.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /type:\s*\| "Music Video"/g,
    `type:
    | "Music Video"`
);

content = content.replace(
    /mentionedNpcs\?: string\[\];/g,
    `mentionedNpcs?: string[];
  isOnSpotify?: boolean;
  spotifyViews?: number;
  spotifyDailyViews?: number[];`
);

fs.writeFileSync(file, content);
