import { GameDate, Release, Song } from '../types';

export interface CertTierInfo {
  currentCert: string | null;
  nextCert: string;
  currentUnits: number;
  currentTierMin: number;
  nextTierTarget: number;
  unitsNeeded: number;
  progressPercent: number;
  isEligibleForNewCert: boolean;
  earnedCert: string | null;
}

export const getSongCertification = (
  streams: number,
): { level: string; multiplier: number } | null => {
  const DIAMOND = 1_200_000_000;
  const PLATINUM = 100_000_000;
  const GOLD = 60_000_000;

  if (streams >= DIAMOND)
    return { level: 'Diamond', multiplier: Math.floor(streams / DIAMOND) };
  if (streams >= PLATINUM)
    return { level: 'Platinum', multiplier: Math.floor(streams / PLATINUM) };
  if (streams >= GOLD) return { level: 'Gold', multiplier: 1 };
  return null;
};

export const getAlbumCertification = (
  units: number,
): { level: string; multiplier: number } | null => {
  const DIAMOND = 10_000_000;
  const PLATINUM = 1_000_000;
  const GOLD = 500_000;

  if (units >= DIAMOND)
    return { level: 'Diamond', multiplier: Math.floor(units / DIAMOND) };
  if (units >= PLATINUM)
    return { level: 'Platinum', multiplier: Math.floor(units / PLATINUM) };
  if (units >= GOLD) return { level: 'Gold', multiplier: 1 };
  return null;
};

export const formatCertification = (
  cert: { level: string; multiplier: number } | null,
): string | null => {
  if (!cert) return null;
  if (cert.multiplier > 1 && cert.level !== 'Gold') {
    return `${cert.multiplier}x ${cert.level}`;
  }
  return cert.level;
};

export const getSongCertInfo = (song: Song): CertTierInfo => {
  const streams = song.streams || 0;
  const lastCert = song.lastCertification || null;
  const GOLD = 60_000_000;
  const PLATINUM = 100_000_000;
  const DIAMOND = 1_200_000_000;

  const currentEarnedCertObj = getSongCertification(streams);
  const earnedCert = formatCertification(currentEarnedCertObj);

  let currentCert = lastCert || earnedCert;
  let nextCert = 'Gold';
  let currentTierMin = 0;
  let nextTierTarget = GOLD;

  if (streams < GOLD) {
    currentCert = null;
    nextCert = 'Gold';
    currentTierMin = 0;
    nextTierTarget = GOLD;
  } else if (streams < PLATINUM) {
    currentCert = 'Gold';
    nextCert = 'Platinum';
    currentTierMin = GOLD;
    nextTierTarget = PLATINUM;
  } else if (streams < DIAMOND) {
    const mult = Math.floor(streams / PLATINUM);
    currentCert = mult === 1 ? 'Platinum' : `${mult}x Platinum`;
    const nextMult = mult + 1;
    if (nextMult * PLATINUM >= DIAMOND) {
      nextCert = 'Diamond';
      nextTierTarget = DIAMOND;
    } else {
      nextCert = `${nextMult}x Platinum`;
      nextTierTarget = nextMult * PLATINUM;
    }
    currentTierMin = mult * PLATINUM;
  } else {
    const mult = Math.floor(streams / DIAMOND);
    currentCert = mult === 1 ? 'Diamond' : `${mult}x Diamond`;
    const nextMult = mult + 1;
    nextCert = `${nextMult}x Diamond`;
    currentTierMin = mult * DIAMOND;
    nextTierTarget = nextMult * DIAMOND;
  }

  const unitsNeeded = Math.max(0, nextTierTarget - streams);
  const span = Math.max(1, nextTierTarget - currentTierMin);
  const progressPercent = Math.min(100, Math.max(0, ((streams - currentTierMin) / span) * 100));
  const isEligibleForNewCert = Boolean(earnedCert && earnedCert !== lastCert);

  return {
    currentCert,
    nextCert,
    currentUnits: streams,
    currentTierMin,
    nextTierTarget,
    unitsNeeded,
    progressPercent,
    isEligibleForNewCert,
    earnedCert,
  };
};

export const calculateAlbumUnits = (release: Release, songs: Song[]): number => {
  const totalStreams = (release.songIds || []).reduce((sum, songId) => {
    const song = songs.find((s) => s.id === songId);
    return sum + (song?.streams || 0);
  }, 0);
  const rawSingleSales = (release.songIds || []).reduce((sum, songId) => {
    const song = songs.find((s) => s.id === songId);
    return sum + (song?.sales || 0);
  }, 0);
  const trackEquivalentAlbumSales = Math.floor(Math.max(0, rawSingleSales) * 0.1);
  const units = Math.floor(totalStreams / 1500) + trackEquivalentAlbumSales + (release.sales || 0);
  return units;
};

export const getAlbumCertInfo = (release: Release, songs: Song[]): CertTierInfo => {
  const units = calculateAlbumUnits(release, songs);
  const lastCert = release.lastCertification || null;
  const GOLD = 500_000;
  const PLATINUM = 1_000_000;
  const DIAMOND = 10_000_000;

  const currentEarnedCertObj = getAlbumCertification(units);
  const earnedCert = formatCertification(currentEarnedCertObj);

  let currentCert = lastCert || earnedCert;
  let nextCert = 'Gold';
  let currentTierMin = 0;
  let nextTierTarget = GOLD;

  if (units < GOLD) {
    currentCert = null;
    nextCert = 'Gold';
    currentTierMin = 0;
    nextTierTarget = GOLD;
  } else if (units < PLATINUM) {
    currentCert = 'Gold';
    nextCert = 'Platinum';
    currentTierMin = GOLD;
    nextTierTarget = PLATINUM;
  } else if (units < DIAMOND) {
    const mult = Math.floor(units / PLATINUM);
    currentCert = mult === 1 ? 'Platinum' : `${mult}x Platinum`;
    const nextMult = mult + 1;
    if (nextMult * PLATINUM >= DIAMOND) {
      nextCert = 'Diamond';
      nextTierTarget = DIAMOND;
    } else {
      nextCert = `${nextMult}x Platinum`;
      nextTierTarget = nextMult * PLATINUM;
    }
    currentTierMin = mult * PLATINUM;
  } else {
    const mult = Math.floor(units / DIAMOND);
    currentCert = mult === 1 ? 'Diamond' : `${mult}x Diamond`;
    const nextMult = mult + 1;
    nextCert = `${nextMult}x Diamond`;
    currentTierMin = mult * DIAMOND;
    nextTierTarget = nextMult * DIAMOND;
  }

  const unitsNeeded = Math.max(0, nextTierTarget - units);
  const span = Math.max(1, nextTierTarget - currentTierMin);
  const progressPercent = Math.min(100, Math.max(0, ((units - currentTierMin) / span) * 100));
  const isEligibleForNewCert = Boolean(earnedCert && earnedCert !== lastCert);

  return {
    currentCert,
    nextCert,
    currentUnits: units,
    currentTierMin,
    nextTierTarget,
    unitsNeeded,
    progressPercent,
    isEligibleForNewCert,
    earnedCert,
  };
};
