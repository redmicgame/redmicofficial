const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const regex = /const getRandomNpcName = \(excludedNames: string\[\] = \[\]\): string => \{[\s\S]*?return name;\n\};/g;

const replacement = `const getRandomNpcName = (excludedNames: string[] = [], currentYear?: number): string => {
  let name = "";
  let attempts = 0;
  const lowerExcluded = excludedNames.map((n) => n.toLowerCase());
  
  // Filter available artists by era if currentYear is provided
  let availableArtists = NPC_ARTIST_NAMES;
  if (currentYear) {
    // We can also use NPC_ERAS if available, or just fallback to some default mapping
    const eraArtists = Object.keys(NPC_ERAS).filter(artist => {
      const era = NPC_ERAS[artist];
      return currentYear >= era.start && currentYear <= era.end;
    });
    
    // Add existing ones from NPC_ARTIST_NAMES that might not be in NPC_ERAS
    const legacyArtists = NPC_ARTIST_NAMES.filter(a => !NPC_ERAS[a]);
    availableArtists = [...eraArtists, ...legacyArtists];
  }

  do {
    name = availableArtists[Math.floor(Math.random() * availableArtists.length)] || NPC_ARTIST_NAMES[0];
    attempts++;
  } while (lowerExcluded.includes(name.toLowerCase()) && attempts < 50);
  return name;
};`;

content = content.replace(regex, replacement);

const generateNpcsRegex = /const generateNpcs = \([\s\S]*?\): NpcSong\[\] => \{[\s\S]*?baseArtist = getRandomNpcName\(excludedNames\);/gm;

const generateNpcsReplacement = `const generateNpcs = (
  count: number,
  existingNpcs: NpcSong[] = [],
  npcImages?: Record<string, string>,
  excludedNames: string[] = [],
  currentYear?: number
): NpcSong[] => {
  const npcs: NpcSong[] = [];
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

content = content.replace(generateNpcsRegex, generateNpcsReplacement);

// Import NPC_ERAS at the top
if (!content.includes('NPC_ERAS')) {
    content = content.replace('NPC_ARTIST_NAMES', 'NPC_ARTIST_NAMES, NPC_ERAS');
}

fs.writeFileSync('context/GameContext.tsx', content);
console.log('Patched npc gen in game context');
