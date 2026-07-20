const fs = require('fs');

let content = fs.readFileSync('constants.ts', 'utf-8');

// evaluate the constants file? No, just simple regex or substring check.
// I will just find all names in NPC_ARTIST_NAMES and check if they exist in NPC_ARTIST_IMAGES after the file runs.
// Since it's typescript, let's just write a TS script and run it with tsx or just ts-node.
