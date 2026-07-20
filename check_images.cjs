const fs = require('fs');

// We can compile constants.ts to JS and require it, or just use regex.
// Regex is easier.

let content = fs.readFileSync('constants.ts', 'utf-8');

const namesMatch = content.match(/export const NPC_ARTIST_NAMES = \[([\s\S]*?)\];/);
if (!namesMatch) {
  console.log('could not find NPC_ARTIST_NAMES');
  process.exit();
}
const names = namesMatch[1].split(',').map(s => s.trim().replace(/'/g, '').replace(/\n/g, '')).filter(Boolean);

const imagesMatch = content.match(/export const NPC_ARTIST_IMAGES: Record<string, string> = \{([\s\S]*?)\};/);
const imagesStr = imagesMatch ? imagesMatch[1] : '';

const missing = [];
for (const name of names) {
  if (name.startsWith('//')) continue;
  
  if (!imagesStr.includes(\`"\${name}":\`) && !content.includes(\`'\${name}':\`) && !content.includes(name)) {
      // wait, content might have it in the NPC_ERAS or the patch blocks
  }
}

// Since I just patched it with a generic fallback in StudioView:
// The fallback URL is UI-Avatars: \`https://ui-avatars.com/api/?name=\${encodeURIComponent(baseArtist)}&background=random&color=fff&size=250\`
// This handles any literally missing images. But I should check if the user wanted actual images. I think I added actual images for a lot of them.
