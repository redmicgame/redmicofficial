const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const generateNewHitsRegex = /const generateNewHits = \([\s\S]*?\): NpcSong\[\] => \{[\s\S]*?baseArtist = getRandomNpcName\(excludedNames\);/gm;

const generateNewHitsReplacement = `const generateNewHits = (
  count: number,
  existingNpcs: NpcSong[],
  npcImages?: Record<string, string>,
  excludedNames: string[] = [],
  currentYear?: number
): NpcSong[] => {
  const hits: NpcSong[] = [];
  const usedNames = new Set<string>(
    existingNpcs.map((npc) => \`\${npc.title}-\${npc.artist}\`),
  );

  for (let i = 0; i < count; i++) {
    let title = "";
    let artist = "";
    let combo = "";
    let attempts = 0;

    let baseArtist = "";
    do {
      baseArtist = getRandomNpcName(excludedNames, currentYear);`;

content = content.replace(generateNewHitsRegex, generateNewHitsReplacement);

// also inside generateNewHits we have: `collabArtist = getRandomNpcName(excludedNames);`
content = content.replace(
  /collabArtist = getRandomNpcName\(excludedNames\);/g,
  'collabArtist = getRandomNpcName(excludedNames, currentYear);'
);

// update callers of generateNpcs and generateNewHits
content = content.replace(
  /const npcs = generateNpcs\(600, \[\], undefined, \[\n\s*action\.payload\.artist\.name,\n\s*\]\);/g,
  'const npcs = generateNpcs(600, [], undefined, [action.payload.artist.name], action.payload.startYear);'
);

content = content.replace(
  /const npcs = generateNpcs\(600, \[\], undefined, \[\n\s*action\.payload\.group\.name,\n\s*\]\);/g,
  'const npcs = generateNpcs(600, [], undefined, [action.payload.group.name], action.payload.startYear);'
);

content = content.replace(
  /const newlyGeneratedNpcs = generateNewHits\(\n\s*CHURN_COUNT,\n\s*newNpcsList,\n\s*state\.npcImages,\n\s*allPlayerNamesForNpcs,\n\s*\);/g,
  'const newlyGeneratedNpcs = generateNewHits(CHURN_COUNT, newNpcsList, state.npcImages, allPlayerNamesForNpcs, state.date.year);'
);

fs.writeFileSync('context/GameContext.tsx', content);
console.log('patched generateNewHits');
