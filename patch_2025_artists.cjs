const fs = require('fs');
let content = fs.readFileSync('constants.ts', 'utf-8');

const targetArtists = ["Huda Mustafa", "Stunna Sandy", "Sunshine Benzi", "TRIM"];

targetArtists.forEach(artist => {
  // Find "Artist Name": { start: 2010...
  // Wait, let's just do a string replace if they exist in the file.
  // We can just append a patch before the merge block to override their start years.
});

const patchCode = `
Object.assign(NPC_ERAS, {
  "Huda Mustafa": { ...NPC_ERAS["Huda Mustafa"], start: 2025 },
  "Stunna Sandy": { ...NPC_ERAS["Stunna Sandy"], start: 2025 },
  "Sunshine Benzi": { ...NPC_ERAS["Sunshine Benzi"], start: 2025 },
  "TRIM": { ...NPC_ERAS["TRIM"], start: 2025 },
});
`;

if (!content.includes('start: 2025 }')) {
    const mergeRegex = /\/\/ Merging Eras data into standard lists[\s\S]*?\}\);/;
    const mergeMatch = content.match(mergeRegex);
    if (mergeMatch) {
        const mergeBlock = mergeMatch[0];
        content = content.replace(mergeRegex, '');
        content += '\n// Patching 2025 artists\n' + patchCode + '\n' + mergeBlock + '\n';
        fs.writeFileSync('constants.ts', content);
        console.log('Patched 2025 artists');
    }
}
