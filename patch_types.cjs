const fs = require('fs');
let file = '/app/applet/types.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `  | { type: "DECLINE_ACTING_PREMIERE"; payload: { roleId: string } }`;
const replacement = `  | { type: "DECLINE_ACTING_PREMIERE"; payload: { roleId: string } }
  | { type: "ACCEPT_MOVIE_PREMIERE_RED_CARPET"; payload: { emailId: string, lookUrl: string, location?: string } }`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
