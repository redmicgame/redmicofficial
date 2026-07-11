import fs from 'fs';
let code = fs.readFileSync('components/CreateTourView.tsx', 'utf8');

const target1 = `{npc.artist} (\\$\\{formatNumber(npc.basePopularity * 2000 * chosenVenuesList.length)}) total cost)`;
const repl1 = `{npc.artist} (\\$\\{formatNumber(Math.floor(npc.basePopularity / 50) * chosenVenuesList.length)} total cost)`;

code = code.replace(target1, repl1);

const target2 = `Cost: \\$\\{formatNumber(npc.basePopularity * 1000 * chosenVenuesList.length)}`;
const repl2 = `Cost: \\$\\{formatNumber(Math.floor(npc.basePopularity / 100) * chosenVenuesList.length)}`;

code = code.replace(target2, repl2);

fs.writeFileSync('components/CreateTourView.tsx', code);
