const fs = require('fs');
let content = fs.readFileSync('constants.ts', 'utf-8');

// I'll write a quick script to find which NPC_ARTIST_NAMES don't have images in NPC_ARTIST_IMAGES
