const fs = require('fs');
let content = fs.readFileSync('constants.ts', 'utf-8');

// I will just append a self-executing block or just modify the arrays programmatically if this was JS, but it's TS.
// So I will just append a script at the bottom that mutates the exports? No, they are const.
// But I can redefine them or just do regex replacements. Let's do regex replacements to just add the missing ones into the arrays, OR we just append a block at the very end of the file that modifies the objects, since it's TypeScript we can't mutate consts easily if they are arrays but we can push to them.
// Wait, `const NPC_ARTIST_NAMES` is an array. We can do `NPC_ARTIST_NAMES.push(...)`
// `NPC_ARTIST_IMAGES` is an object, we can do `NPC_ARTIST_IMAGES['...'] = ...`
// Since it's a TS file that gets bundled, mutating at the end of the file is perfectly fine.

const patchCode = `

// Merging Eras data into standard lists
Object.entries(NPC_ERAS).forEach(([name, data]) => {
  if (!NPC_ARTIST_NAMES.includes(name)) {
    NPC_ARTIST_NAMES.push(name);
  }
  if (!NPC_ARTIST_GENRES[name]) {
    NPC_ARTIST_GENRES[name] = data.genre;
  }
  if (!NPC_ARTIST_IMAGES[name] && data.image) {
    NPC_ARTIST_IMAGES[name] = data.image;
  }
});
`;

if (!content.includes('// Merging Eras data')) {
    content += patchCode;
    fs.writeFileSync('constants.ts', content);
    console.log('patched constants with merge code');
} else {
    console.log('already patched');
}
