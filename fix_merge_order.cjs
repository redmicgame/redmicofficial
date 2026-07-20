const fs = require('fs');
let content = fs.readFileSync('constants.ts', 'utf-8');

// Find the merge block
const mergeRegex = /\/\/ Merging Eras data into standard lists[\s\S]*?\}\);/;
const mergeMatch = content.match(mergeRegex);

if (mergeMatch) {
    const mergeBlock = mergeMatch[0];
    // Remove it from its current position
    content = content.replace(mergeRegex, '');
    // Append it to the very end
    content += '\n' + mergeBlock + '\n';
    fs.writeFileSync('constants.ts', content);
    console.log('Fixed merge order');
}
