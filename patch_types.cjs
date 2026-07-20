const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');

const awardType = `
export interface GoldenGlobeAward {
  year: number;
  category: "Best Actor/Actress" | "Best Supporting Actor/Actress" | "Best Voice Acting" | "Best TV Show" | "Best Movie" | "Best Soundtrack" | "Best Original Song";
  itemId: string;
  itemName: string;
  artistName: string;
  isWinner: boolean;
}

export interface GoldenGlobeContender {
  id: string;
  name: string;
  artistName: string;
  isPlayer: boolean;
  score: number;
  coverArt?: string;
}

export interface GoldenGlobeCategory {
  name: GoldenGlobeAward["category"];
  nominees: GoldenGlobeContender[];
  winner?: GoldenGlobeContender;
}
`;

if (!content.includes('GoldenGlobeAward')) {
    content = content.replace('export interface GrammyContender', awardType + '\nexport interface GrammyContender');
}

// Add to ArtistData
if (!content.includes('goldenGlobeHistory')) {
    content = content.replace('oscarHistory: OscarAward[];', 'oscarHistory: OscarAward[];\n  goldenGlobeHistory: GoldenGlobeAward[];');
}

// Add to GameState
const stateType = `
  goldenGlobeSubmissions: {
    artistId: string;
    category: GoldenGlobeAward["category"];
    itemId: string;
    itemName: string;
  }[];
  goldenGlobeCurrentYearNominations: GoldenGlobeCategory[] | null;
`;

if (!content.includes('goldenGlobeSubmissions: {')) {
    content = content.replace('oscarSubmissions: {', stateType + '\n  oscarSubmissions: {');
}

fs.writeFileSync('types.ts', content);
console.log('Patched types.ts');
