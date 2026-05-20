import * as fs from 'fs';
const images = fs.readFileSync('npc_images.json', 'utf8');
fs.appendFileSync('constants.ts', "\nexport const NPC_ARTIST_IMAGES: Record<string, string> = " + images + ";\n");
console.log("Appended");
