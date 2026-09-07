export interface YouTubeViewsInput {
  subscribers: number;
  popularity: number;
  isFirstWeek: boolean;
  videoAgeWeeks?: number;
  payolaMultiplier?: number;
  genre?: string;
  subgenre?: string;
  artistGenre?: string;
  year: number;
  videoType?: string;
  songQuality?: number;
  songHype?: number;
  difficulty?: string;
  pitchforkBoost?: boolean;
  interviewBoost?: boolean;
  applyVariance?: boolean;
}

/**
 * Calculates YouTube views based on:
 * 1. Amount of subscribers
 * 2. Popularity
 * 3. First week boost
 * 4. Payola on the video
 * 5. Song genre (K-Pop songs have much higher first week views)
 * 6. Era (2020s & 2010s get more YouTube views usually)
 *
 * Benchmark:
 * - Non-K-Pop song with 75 popularity and 30M subscribers receives around 20M views first week.
 * - K-Pop song with 75 popularity and 30M subscribers receives around 83M views first week.
 */
export function calculateYouTubeViews({
  subscribers,
  popularity,
  isFirstWeek,
  videoAgeWeeks = 1,
  payolaMultiplier = 1.0,
  genre = 'Pop',
  subgenre = '',
  artistGenre = '',
  year = 2024,
  videoType = 'Music Video',
  songQuality = 70,
  songHype = 50,
  difficulty = 'normal',
  pitchforkBoost = false,
  interviewBoost = false,
  applyVariance = true,
}: YouTubeViewsInput): number {
  const safeSubscribers = Math.max(0, subscribers);
  const safePopularity = Math.max(1, Math.min(100, popularity));

  // 1. Amount of subscribers & Popularity Reach
  // Calibrated so that at S = 30M, P = 75:
  // subFactor = 30,000,000 * (0.75^0.75) * 0.68 = 16,440,920
  // popFactor = 0.75^3 * 8,440,000 = 3,560,625
  // sum = 20,001,545 (~20M)
  const subFactor = safeSubscribers * Math.pow(safePopularity / 100, 0.75) * 0.68;
  const popFactor = Math.pow(safePopularity / 100, 3) * 8440000;
  const baseFirstWeek = subFactor + popFactor;

  // 2. Song Genre (K-Pop songs have much higher first week views)
  const isKPop =
    (genre && /k-?pop/i.test(genre)) ||
    (subgenre && /k-?pop/i.test(subgenre)) ||
    (artistGenre && /k-?pop/i.test(artistGenre));

  // During the first week, K-Pop receives a 4.15x boost (83M / 20M = 4.15)
  const genreMultiplier = isFirstWeek && isKPop ? 4.15 : 1.0;

  // 3. First Week Boost & Video Age Decay
  let weekMultiplier = 1.0;
  if (!isFirstWeek) {
    const age = Math.max(2, videoAgeWeeks);
    if (age === 2) {
      weekMultiplier = isKPop ? 0.20 : 0.32;
    } else if (age === 3) {
      weekMultiplier = isKPop ? 0.12 : 0.20;
    } else if (age === 4) {
      weekMultiplier = isKPop ? 0.08 : 0.14;
    } else {
      weekMultiplier = Math.max(0.015, (isKPop ? 0.06 : 0.10) * Math.pow(0.92, age - 4));
    }
  }

  // 4. Payola on the video
  const payola = Math.max(1.0, payolaMultiplier);

  // 5. Era (2020s & 2010s get more YouTube views usually)
  let eraMultiplier = 1.0;
  if (year >= 2020) {
    eraMultiplier = 1.0; // 2020s modern streaming & YouTube peak
  } else if (year >= 2015) {
    eraMultiplier = 0.98; // Late 2010s explosion
  } else if (year >= 2010) {
    eraMultiplier = 0.88; // Early 2010s YouTube growth
  } else if (year >= 2008) {
    eraMultiplier = 0.25; // 2008-2009 Music videos beginning on YouTube
  } else if (year >= 2005) {
    eraMultiplier = 0.08; // 2005-2007 Early YouTube
  } else {
    eraMultiplier = 0.0; // Pre-2005: YouTube did not exist
  }

  // 6. Video Type Multiplier
  let typeMultiplier = 1.0;
  switch (videoType) {
    case 'Music Video':
    case 'Custom':
      typeMultiplier = 1.0;
      break;
    case 'Live Performance':
      typeMultiplier = 0.65;
      break;
    case 'Lyric Video':
      typeMultiplier = 0.40;
      break;
    case 'Visualizer':
      typeMultiplier = 0.25;
      break;
    case 'Genius Verified':
      typeMultiplier = 0.20;
      break;
    case 'Interview':
      typeMultiplier = 0.15;
      break;
    default:
      typeMultiplier = 1.0;
  }

  // Song quality & hype modifier (centered at 70 quality, 50 hype = 1.0)
  const quality = Math.max(10, Math.min(100, songQuality));
  const hype = Math.max(0, Math.min(100, songHype));
  const songStrength = (quality / 70) * 0.7 + (hype / 50) * 0.3;
  const qualityModifier = isFirstWeek
    ? Math.max(0.9, Math.min(1.1, 1.0 + (songStrength - 1) * 0.1))
    : Math.max(0.7, Math.min(1.4, songStrength));

  // Difficulty adjustment
  let diffMultiplier = 1.0;
  if (difficulty === 'easy') diffMultiplier = 1.15;
  else if (difficulty === 'hard') diffMultiplier = 0.85;
  else if (difficulty === 'extreme') diffMultiplier = 0.70;

  // Press boosts
  let pressMultiplier = 1.0;
  if (pitchforkBoost && (difficulty === 'easy' || difficulty === 'original')) {
    pressMultiplier *= 1.5;
  }
  if (interviewBoost) {
    pressMultiplier *= 1.4;
  }

  // Organic variance (±2%)
  const variance = applyVariance ? 0.98 + Math.random() * 0.04 : 1.0;

  const totalViews =
    baseFirstWeek *
    genreMultiplier *
    weekMultiplier *
    payola *
    eraMultiplier *
    typeMultiplier *
    qualityModifier *
    diffMultiplier *
    pressMultiplier *
    variance;

  return Math.max(0, Math.round(totalViews));
}
