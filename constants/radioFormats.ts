export interface RadioFormatDefinition {
  id: string;
  name: string;
  shortName: string;
  code: string;
  description: string;
  allowedGenres: string[];
  color: string;
  maxImpressions: number; // Cap in audience impressions
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
    maxImpressions: 55_000_000, // 55M cap
  },
  {
    id: 'ac',
    name: 'Adult Contemporary (AC)',
    shortName: 'Adult Contemporary',
    code: 'AC',
    description: 'Melodic, smooth listening hits appealing to adult and family audiences.',
    allowedGenres: ['Pop', 'Rock', 'R&B', 'Indie', 'Christmas'],
    color: '#0284c7', // Sky
    maxImpressions: 35_000_000, // 35M cap
  },
  {
    id: 'hot_ac',
    name: 'Hot Adult Contemporary (Hot AC)',
    shortName: 'Hot AC',
    code: 'HOT AC',
    description: 'Upbeat modern adult hits blending pop, acoustic rock, and electronic without heavy rap.',
    allowedGenres: ['Pop', 'Rock', 'Indie', 'Electronic', 'R&B', 'Christmas'],
    color: '#ea580c', // Orange
    maxImpressions: 45_000_000, // 45M cap
  },
  {
    id: 'country',
    name: 'Country',
    shortName: 'Country',
    code: 'COUNTRY',
    description: 'Modern and traditional country music, storytelling, and acoustic crossovers.',
    allowedGenres: ['Country', 'Christmas', 'Pop', 'Rock'],
    color: '#16a34a', // Green
    maxImpressions: 40_000_000, // 40M cap
  },
  {
    id: 'classic_hits',
    name: 'Classic Hits / Oldies',
    shortName: 'Classic Hits',
    code: 'CLASSIC HITS',
    description: 'Timeless pop, rock, and soul catalog favorites from past decades.',
    allowedGenres: ['Pop', 'Rock', 'R&B', 'Christmas'],
    color: '#d97706', // Amber
    maxImpressions: 30_000_000, // 30M cap
  },
  {
    id: 'classic_rock',
    name: 'Classic Rock',
    shortName: 'Classic Rock',
    code: 'CLASSIC ROCK',
    description: 'Iconic guitar-driven anthems, hard rock, and arena rock classics.',
    allowedGenres: ['Rock'],
    color: '#dc2626', // Red
    maxImpressions: 25_000_000, // 25M cap
  },
  {
    id: 'active_rock',
    name: 'Active Rock / Mainstream Rock',
    shortName: 'Active Rock',
    code: 'ACTIVE ROCK',
    description: 'Hard rock, heavy metal, post-grunge, and modern guitar bands.',
    allowedGenres: ['Rock'],
    color: '#991b1b', // Dark Red
    maxImpressions: 20_000_000, // 20M cap
  },
  {
    id: 'alt_rock',
    name: 'Alternative / Modern Rock',
    shortName: 'Alternative Rock',
    code: 'ALT',
    description: 'Modern alternative rock, indie guitar, and synth-driven alternative tracks.',
    allowedGenres: ['Rock', 'Indie', 'Electronic'],
    color: '#7c3aed', // Purple
    maxImpressions: 25_000_000, // 25M cap
  },
  {
    id: 'aaa',
    name: 'Adult Album Alternative (AAA / Triple-A)',
    shortName: 'AAA / Triple-A',
    code: 'AAA',
    description: 'Eclectic, singer-songwriter, indie folk, and deep progressive album cuts.',
    allowedGenres: ['Indie', 'Rock', 'Electronic', 'Pop'],
    color: '#059669', // Emerald
    maxImpressions: 15_000_000, // 15M cap
  },
  {
    id: 'urban',
    name: 'Urban Contemporary',
    shortName: 'Urban Contemporary',
    code: 'URBAN',
    description: 'Mainstream Hip Hop, Rap, R&B, and global urban contemporary sounds.',
    allowedGenres: ['Hip Hop', 'R&B', 'Reggae', 'Afrobeats', 'Latin'],
    color: '#c026d3', // Fuchsia
    maxImpressions: 30_000_000, // 30M cap (Rap/R&B specified by user)
  },
  {
    id: 'urban_ac',
    name: 'Urban Adult Contemporary (Urban AC)',
    shortName: 'Urban AC',
    code: 'URBAN AC',
    description: 'Smooth R&B, classic soul, neo-soul, and mellow grooves.',
    allowedGenres: ['R&B', 'Reggae', 'Hip Hop'],
    color: '#9333ea', // Violet
    maxImpressions: 22_000_000, // 22M cap
  },
  {
    id: 'rhythmic',
    name: 'Rhythmic Contemporary Hit Radio (Rhythmic CHR)',
    shortName: 'Rhythmic CHR',
    code: 'RHYTHMIC',
    description: 'Club, dance, melodic rap, rhythmic pop, and high-energy urban crossover.',
    allowedGenres: ['Hip Hop', 'R&B', 'Electronic', 'Pop', 'Latin', 'Afrobeats', 'Reggae'],
    color: '#db2777', // Pink
    maxImpressions: 35_000_000, // 35M cap
  },
  {
    id: 'adult_hits',
    name: 'Adult Hits',
    shortName: 'Adult Hits',
    code: 'ADULT HITS',
    description: 'Broad variety format spanning decades of rock, pop, indie, and country.',
    allowedGenres: ['Pop', 'Rock', 'R&B', 'Indie', 'Country'],
    color: '#4f46e5', // Indigo
    maxImpressions: 28_000_000, // 28M cap
  },
  {
    id: 'latin',
    name: 'Latin / Spanish Contemporary',
    shortName: 'Latin Contemporary',
    code: 'LATIN',
    description: 'Reggaeton, Latin pop, bachata, trap latino, and contemporary tropical hits.',
    allowedGenres: ['Latin', 'Pop', 'Reggae', 'Afrobeats'],
    color: '#e11d48', // Rose
    maxImpressions: 30_000_000, // 30M cap
  },
  {
    id: 'christmas',
    name: 'Holiday / Christmas (Seasonal Overlay)',
    shortName: 'Holiday / Christmas',
    code: 'HOLIDAY',
    description: 'Festive seasonal carols, holiday pop, and Christmas classics.',
    allowedGenres: ['Christmas', 'Pop', 'R&B', 'Rock', 'Country', 'Indie'],
    color: '#15803d', // Pine Green
    maxImpressions: 45_000_000, // 45M cap
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

export function getFormatMaxImpressions(formatId: string): number {
  const norm = normalizeRadioFormatId(formatId);
  const fmt = RADIO_FORMATS.find((f) => f.id === norm);
  return fmt ? fmt.maxImpressions : 35_000_000;
}

export function getFormatCompatibilityMultiplier(genre: string, formatId: string): number {
  const norm = normalizeRadioFormatId(formatId);
  const isAllowed = isGenreAllowedInFormat(genre, norm);
  const g = (genre || '').toLowerCase();

  if (norm === 'christmas') {
    if (g.includes('christmas') || g.includes('holiday')) return 1.25;
    return isAllowed ? 0.6 : 0.01;
  }

  // Check specific high affinity pairs
  if (norm === 'chr') {
    if (g.includes('pop') || g.includes('dance') || g.includes('electronic')) return 1.0;
    if (g.includes('hip hop') || g.includes('rap') || g.includes('r&b') || g.includes('k-pop') || g.includes('latin')) return 0.9;
    if (g.includes('rock')) return 0.75;
    return isAllowed ? 0.8 : 0.05;
  }

  if (norm === 'urban') {
    if (g.includes('hip hop') || g.includes('rap') || g.includes('trap')) return 1.0;
    if (g.includes('r&b') || g.includes('soul') || g.includes('afrobeat')) return 0.95;
    if (g.includes('reggae') || g.includes('latin')) return 0.8;
    return isAllowed ? 0.7 : 0.05;
  }

  if (norm === 'urban_ac') {
    if (g.includes('r&b') || g.includes('soul')) return 1.0;
    if (g.includes('hip hop') || g.includes('rap')) return 0.5;
    return isAllowed ? 0.65 : 0.05;
  }

  if (norm === 'country') {
    if (g.includes('country')) return 1.0;
    if (g.includes('folk') || g.includes('americana')) return 0.7;
    return isAllowed ? 0.5 : 0.02;
  }

  if (norm === 'ac' || norm === 'hot_ac') {
    if (g.includes('pop') || g.includes('indie')) return 1.0;
    if (g.includes('rock') || g.includes('r&b')) return 0.85;
    return isAllowed ? 0.7 : 0.05;
  }

  if (norm === 'alt_rock' || norm === 'active_rock' || norm === 'classic_rock' || norm === 'aaa') {
    if (g.includes('rock') || g.includes('metal') || g.includes('punk')) return 1.0;
    if (g.includes('indie') || g.includes('alt')) return 0.9;
    return isAllowed ? 0.65 : 0.05;
  }

  if (norm === 'latin') {
    if (g.includes('latin') || g.includes('reggaeton') || g.includes('bachata')) return 1.0;
    return isAllowed ? 0.6 : 0.05;
  }

  if (isAllowed) {
    return 0.85;
  }

  // Incompatible genre penalty
  return 0.05;
}

/**
 * Calculates uneven, realistic weight distribution when a song is sent to multiple formats.
 * Ensures the primary format and high-compatibility formats get higher shares than secondary/niche ones.
 */
export function calculateMultiFormatWeights(genre: string, formats: string[]): Record<string, number> {
  if (!formats || formats.length === 0) return {};
  if (formats.length === 1) return { [normalizeRadioFormatId(formats[0])]: 1.0 };

  const rawScores: Record<string, number> = {};
  let totalScore = 0;

  // Position priority weights for submitted order
  const orderWeights = [1.0, 0.65, 0.45, 0.32, 0.22];

  formats.forEach((fmtRaw, index) => {
    const fmt = normalizeRadioFormatId(fmtRaw);
    const orderBoost = orderWeights[Math.min(index, orderWeights.length - 1)];
    const compat = getFormatCompatibilityMultiplier(genre, fmt);
    const formatObj = getRadioFormatById(fmt);
    const capacityWeight = formatObj ? (formatObj.maxImpressions / 55_000_000) : 0.6;

    // Score combines submission priority, genre compatibility, and format capacity
    const score = Math.max(0.05, orderBoost * compat * (0.5 + 0.5 * capacityWeight));
    rawScores[fmt] = score;
    totalScore += score;
  });

  const normalizedWeights: Record<string, number> = {};
  for (const fmt of Object.keys(rawScores)) {
    normalizedWeights[fmt] = totalScore > 0 ? (rawScores[fmt] / totalScore) : (1 / formats.length);
  }

  return normalizedWeights;
}

