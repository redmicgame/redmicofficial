const fs = require('fs');
let content = fs.readFileSync('utils/xContentGenerator.ts', 'utf-8');

content = content.replace('import { NPC_ARTIST_NAMES,', 'import {');
content = content.replace('import { LABELS } from "../constants";', 'import { LABELS, NPC_ARTIST_NAMES } from "../constants";');

fs.writeFileSync('utils/xContentGenerator.ts', content);
