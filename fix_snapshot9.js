import fs from 'fs';

let code = fs.readFileSync('components/SpotifySnapshotView.tsx', 'utf8');

const targetEstimate = `const estimatedHeight = 192 + 40 + 48 + 44 + (rowCount * 37);`;
const replEstimate = `const estimatedHeight = 192 + 40 + 60 + 60 + (rowCount * 45) + 64; // +64 for extra safe margin`;

code = code.replace(targetEstimate, replEstimate);

fs.writeFileSync('components/SpotifySnapshotView.tsx', code);
