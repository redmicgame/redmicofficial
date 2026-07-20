const fs = require('fs');
let content = fs.readFileSync('utils/xContentGenerator.ts', 'utf-8');

if (!content.includes('NPC_ARTIST_NAMES')) {
  content = content.replace("import {", "import { NPC_ARTIST_NAMES,");
} else if (!content.includes('import { NPC_ARTIST_NAMES')) {
  content = content.replace("import {", "import { NPC_ARTIST_NAMES,");
}
fs.writeFileSync('utils/xContentGenerator.ts', content);
