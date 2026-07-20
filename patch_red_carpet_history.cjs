const fs = require('fs');

let file = '/app/applet/components/RedCarpetHistoryView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                    if (post.content.includes('#GRAMMYs')) awardShow = 'GRAMMYs';
                    else if (post.content.includes('#VMAs')) awardShow = 'VMAs';
                    else if (post.content.includes('#AMAs')) awardShow = 'AMAs';`;
const replacement = `                    if (post.content.includes('#GRAMMYs')) awardShow = 'GRAMMYs';
                    else if (post.content.includes('#VMAs')) awardShow = 'VMAs';
                    else if (post.content.includes('#AMAs')) awardShow = 'AMAs';
                    else if (post.content.includes('#GoldenGlobes')) awardShow = 'Golden Globes';
                    else if (post.content.includes('#Oscars')) awardShow = 'Oscars';`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log("Patched red carpet history");
