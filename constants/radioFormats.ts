export interface RadioFormatDefinition {
  id: string;
  name: string;
  shortName: string;
  code: string;
  description: string;
  allowedGenres: string[];
  color: string;
  seasonalOnly?: boolean;
}

export const RADIO_FORMATS: RadioFormatDefinition[] = [
  {
    id: 'chr',
    name: 'Contemporary Hit Radio (CHR) / Top 40 / Pop CHR',
    shortName: 'CHR / Top 40',
    code: 'CHR',
    description: 'Mainstream Top 40 playing high-energy pop, urban, and modern crossover hits.',
    allowedGenres: ['Pop', 'Hip Hop', 'R&B', 'Electronic', 'K-Pop', 'Latin', 'Afrobeats', 'Reggae', 'Rock'],
    color: '#2563eb', // Blue
  },
  {
    id: 'ac',
    name: 'Adult Contemporary (AC)',
    shortName: 'Adult Contemporary',
    code: 'AC',
    description: 'Melodic, smooth listening hits appealing to adult and family audiences.',
    allowedGenres: ['Pop', 'Rock', 'R&B', 'Indie', 'Christmas'],
    color: '#0284c7', // Sky
  },
  {
    id: 'hot_ac',
    name: 'Hot Adult Contemporary (Hot AC)',
    shortName: 'Hot AC',
    code: 'HOT AC',
    description: 'Upbeat modern adult hits blending pop, acoustic rock, and electronic without heavy rap.',
    allowedGenres: ['Pop', 'Rock', 'Indie', 'Electronic', 'R&B', 'Christmas'],
    color: '#ea580c', // Orange
  },
  {
    id: 'country',
    name: 'Country',
    shortName: 'Country',
    code: 'COUNTRY',
    description: 'Modern and traditional country music, storytelling, and acoustic crossovers.',
    allowedGenres: ['Country', 'Christmas', 'Pop', 'Rock'],
    color: '#16a34a', // Green
  },
  {
    id: 'classic_hits',
    name: 'Classic Hits / Oldies',
    shortName: 'Classic Hits',
    code: 'CLASSIC HITS',
    description: 'Timeless pop, rock, and soul catalog favorites from past decades.',
    allowedGenres: ['Pop', 'Rock', 'R&B', 'Christmas'],
    color: '#d97706', // Amber
  },
  {
    id: 'classic_rock',
    name: 'Classic Rock',
    shortName: 'Classic Rock',
    code: 'CLASSIC ROCK',
    description: 'Iconic guitar-driven anthems, hard rock, and arena rock classics.',
    allowedGenres: ['Rock'],
    color: '#dc2626', // Red
  },
  {
    id: 'active_rock',
    name: 'Active Rock / Mainstream Rock',
    shortName: 'Active Rock',
    code: 'ACTIVE ROCK',
    description: 'Hard rock, heavy metal, post-grunge, and modern guitar bands.',
    allowedGenres: ['Rock'],
    color: '#991b1b', // Dark Red
  },
  {
    id: 'alt_rock',
    name: 'Alternative / Modern Rock',
    shortName: 'Alternative Rock',
    code: 'ALT',
    description: 'Modern alternative rock, indie guitar, and synth-driven alternative tracks.',
    allowedGenres: ['Rock', 'Indie', 'Electronic'],
    color: '#7c3aed', // Purple
  },
  {
    id: 'aaa',
    name: 'Adult Album Alternative (AAA / Triple-A)',
    shortName: 'AAA / Triple-A',
    code: 'AAA',
    description: 'Eclectic, singer-songwriter, indie folk, and deep progressive album cuts.',
    allowedGenres: ['Indie', 'Rock', 'Electronic', 'Pop'],
    color: '#059669', // Emerald
  },
  {
    id: 'urban',
    name: 'Urban Contemporary',
    shortName: 'Urban Contemporary',
    code: 'URBAN',
    description: 'Mainstream Hip Hop, Rap, R&B, and global urban contemporary sounds.',
    allowedGenres: ['Hip Hop', 'R&B', 'Reggae', 'Afrobeats', 'Latin'],
    color: '#c026d3', // Fuchsia
  },
  {
    id: 'urban_ac',
    name: 'Urban Adult Contemporary (Urban AC)',
    shortName: 'Urban AC',
    code: 'URBAN AC',
    description: 'Smooth R&B, classic soul, neo-soul, and mellow grooves.',
    allowedGenres: ['R&B', 'Reggae', 'Hip Hop'],
    color: '#9333ea', // Violet
  },
  {
    id: 'rhythmic',
    name: 'Rhythmic Contemporary Hit Radio (Rhythmic CHR)',
    shortName: 'Rhythmic CHR',
    code: 'RHYTHMIC',
    description: 'Club, dance, melodic rap, rhythmic pop, and high-energy urban crossover.',
    allowedGenres: ['Hip Hop', 'R&B', 'Electronic', 'Pop', 'Latin', 'Afrobeats', 'Reggae'],
    color: '#db2777', // Pink
  },
  {
    id: 'adult_hits',
    name: 'Adult Hits',
    shortName: 'Adult Hits',
    code: 'ADULT HITS',
    description: 'Broad variety format spanning decades of rock, pop, indie, and country.',
    allowedGenres: ['Pop', 'Rock', 'R&B', 'Indie', 'Country'],
    color: '#4f46e5', // Indigo
  },
  {
    id: 'latin',
    name: 'Latin / Spanish Contemporary',
    shortName: 'Latin Contemporary',
    code: 'LATIN',
    description: 'Reggaeton, Latin pop, bachata, trap latino, and contemporary tropical hits.',
    allowedGenres: ['Latin', 'Pop', 'Reggae', 'Afrobeats'],
    color: '#e11d48', // Rose
  },
  {
    id: 'christmas',
    name: 'Holiday / Christmas (Seasonal Overlay)',
    shortName: 'Holiday / Christmas',
    code: 'HOLIDAY',
    description: 'Festive seasonal carols, holiday pop, and Christmas classics.',
    allowedGenres: ['Christmas', 'Pop', 'R&B', 'Rock', 'Country', 'Indie'],
    color: '#15803d', // Pine Green
    seasonalOnly: true,
  },
];

// Alias map for legacy format IDs
export const FORMAT_ALIASES: Record<string, string> = {
  pop: 'chr',
  chr_pop: 'chr',
  top40: 'chr',
  alternative: 'alt_rock',
  alt: 'alt_rock',
  rock: 'active_rock',
  holiday: 'christmas',
  urban_contemporary: 'urban',
};

export function normalizeRadioFormatId(formatId: string): string {
  const lower = (formatId || '').toLowerCase().trim();
  return FORMAT_ALIASES[lower] || lower;
}

export function getRadioFormatById(formatId: string): RadioFormatDefinition | undefined {
  const norm = normalizeRadioFormatId(formatId);
  return RADIO_FORMATS.find((f) => f.id === norm);
}

export function isGenreAllowedInFormat(genre: string, formatId: string): boolean {
  const format = getRadioFormatById(formatId);
  if (!format) return false;

  const g = (genre || '').toLowerCase();
  return format.allowedGenres.some((allowed) => {
    const a = allowed.toLowerCase();
    if (a === 'hip hop') return g.includes('hip hop') || g.includes('rap') || g.includes('trap');
    if (a === 'electronic') return g.includes('electronic') || g.includes('dance') || g.includes('edm') || g.includes('house');
    if (a === 'k-pop') return g.includes('k-pop') || g.includes('kpop');
    if (a === 'christmas') return g.includes('christmas') || g.includes('holiday');
    if (a === 'rock') return g.includes('rock') || g.includes('metal') || g.includes('punk');
    if (a === 'indie') return g.includes('indie') || g.includes('folk') || g.includes('alt');
    if (a === 'r&b') return g.includes('r&b') || g.includes('soul');
    return g.includes(a);
  });
}

export function getFormatCompatibilityMultiplier(genre: string, formatId: string): number {
  const norm = normalizeRadioFormatId(formatId);
  const isAllowed = isGenreAllowedInFormat(genre, norm);

  if (norm === 'christmas') {
    const g = (genre || '').toLowerCase();
    if (g.includes('christmas') || g.includes('holiday')) return 1.2;
    return isAllowed ? 0.7 : 0.01;
  }

  if (isAllowed) {
    // Primary matches get full multiplier, crossovers get solid 0.85-1.0
    return 1.0;
  }

  // Incompatible genre penalty
  return 0.05;
}
