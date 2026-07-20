const fs = require('fs');

let file = '/app/applet/components/RedCarpetHistoryView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                if (post.image && post.content.includes('red carpet.')) {`;
const replacement = `                if (post.image && (post.content.includes('red carpet.') || post.content.includes('premiere in'))) {`;

content = content.replace(target, replacement);

const target2 = `                    else if (post.content.includes('#Oscars')) awardShow = 'Oscars';`;
const replacement2 = `                    else if (post.content.includes('#Oscars')) awardShow = 'Oscars';
                    else if (post.content.includes('premiere in')) {
                        const match = post.content.match(/stuns for '(.*?)' premiere/);
                        if (match && match[1]) awardShow = 'Premiere: ' + match[1];
                        else awardShow = 'Movie Premiere';
                    }`;
content = content.replace(target2, replacement2);

fs.writeFileSync(file, content);
console.log("Patched red carpet history 2");
