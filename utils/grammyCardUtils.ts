import { ArtistData, XUser } from '../types';

export const GRAMMYS_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <radialGradient id="gBg" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="100%" stop-color="#050507"/>
    </radialGradient>
    <linearGradient id="hornGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff3b0"/>
      <stop offset="35%" stop-color="#f6c744"/>
      <stop offset="70%" stop-color="#c98a1c"/>
      <stop offset="100%" stop-color="#7c4f0a"/>
    </linearGradient>
    <linearGradient id="hornInner" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="55%" stop-color="#b4690e"/>
      <stop offset="100%" stop-color="#451a03"/>
    </linearGradient>
    <linearGradient id="baseDark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3f3f46"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" fill="url(#gBg)"/>
  <!-- Pedestal -->
  <polygon points="36,97 84,97 88,105 32,105" fill="url(#baseDark)" stroke="#71717a" stroke-width="0.6"/>
  <rect x="38" y="83" width="44" height="14" rx="1.5" fill="url(#baseDark)" stroke="#52525b" stroke-width="0.6"/>
  <rect x="44" y="88" width="32" height="5" rx="0.8" fill="url(#hornGold)" opacity="0.9"/>
  <!-- Turntable deck -->
  <ellipse cx="60" cy="80" rx="20" ry="3.2" fill="url(#hornGold)"/>
  <rect x="40" y="77" width="40" height="4" rx="1" fill="url(#hornGold)"/>
  <!-- Support Arm -->
  <path d="M46 77 C43 68 44 60 52 57 L57 59 C52 62 51 69 53 77 Z" fill="url(#hornGold)"/>
  <circle cx="62" cy="74" r="3" fill="url(#hornGold)"/>
  <!-- Gramophone Horn -->
  <path d="M52 58 C54 51 60 44 64 38 C68 30 74 22 86 20 C88 26 89 35 84 44 C78 53 66 56 56 60 Z" fill="url(#hornGold)"/>
  <ellipse cx="81" cy="33" rx="8.5" ry="14" transform="rotate(24 81 33)" fill="url(#hornInner)" stroke="#fde68a" stroke-width="1"/>
  <ellipse cx="79" cy="33" rx="4.5" ry="8" transform="rotate(24 79 33)" fill="#451a03" opacity="0.65"/>
</svg>`)}`;

export const grammysXUser: XUser = {
  id: 'grammys',
  name: 'GRAMMYS',
  username: 'Grammys',
  avatar: GRAMMYS_AVATAR,
  isVerified: 'gold',
  bio: "The official X account of the Recording Academy / GRAMMY® Awards. Celebrating music's biggest night. 🏆 #GRAMMYs",
  followersCount: 8450000,
  followingCount: 412,
};

export interface GrammyWinnerCardData {
  category: string;
  artistName: string;
  itemName: string;
  artistImage?: string;
  coverArt?: string;
  year?: number;
}

export const encodeGrammyWinnerCard = (data: GrammyWinnerCardData): string => {
  return `grammyWinner:${JSON.stringify(data)}`;
};

export const getBestNewArtistSubmissionCount = (artistData?: Partial<ArtistData> | null): number => {
  if (!artistData) return 0;
  if (typeof artistData.bestNewArtistSubmissionCount === 'number') {
    return artistData.bestNewArtistSubmissionCount;
  }
  return artistData.hasSubmittedForBestNewArtist ? 1 : 0;
};

export const hasBeenNominatedForBestNewArtist = (artistData?: Partial<ArtistData> | null): boolean => {
  if (!artistData) return false;
  if (artistData.hasBeenNominatedForBestNewArtist) return true;
  return Boolean(
    artistData.grammyHistory?.some((award) => award.category === 'Best New Artist')
  );
};

export const isBestNewArtistEligible = (artistData?: Partial<ArtistData> | null): boolean => {
  if (!artistData) return false;
  if (hasBeenNominatedForBestNewArtist(artistData)) return false;
  return getBestNewArtistSubmissionCount(artistData) < 3;
};
