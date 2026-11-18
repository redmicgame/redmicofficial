import type { GameDate, Song, Video, XPost, XUser } from '../types';

export const formatPremiereNumber = (num: number): string => {
  if (isNaN(num)) return '0';
  const n = Math.floor(num);
  if (n >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
};

export const getPremiereJsDate = (gameDate: GameDate): Date => {
  const dayOffset = (gameDate.day || 5) - 1;
  return new Date(gameDate.year, 0, (gameDate.week - 1) * 7 + 1 + dayOffset);
};

/**
 * Formats date like "4/16/26" for upcoming YouTube premiere labels & tweets.
 */
export const formatPremiereDateShort = (gameDate: GameDate): string => {
  const d = getPremiereJsDate(gameDate);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const yr = String(d.getFullYear()).slice(-2);
  return `${month}/${day}/${yr}`;
};

export const extractSongTitleForVideo = (video: Video, songs: Song[]): string => {
  const matchedSong = songs.find((s) => s.id === video.songId);
  if (matchedSong?.title) return matchedSong.title;

  // Fallback parse from "Artist - Song Title (Music Video)"
  const afterDash = video.title.includes(' - ')
    ? video.title.split(' - ').slice(1).join(' - ')
    : video.title;
  return afterDash.replace(/\s*\([^)]+\)\s*$/, '').trim() || video.title;
};

export function ensureYouTubePremiereXAccounts(
  xUsers: XUser[],
  artistName: string,
  artistImage: string,
  artistId: string,
): {
  updatedUsers: XUser[];
  chartsUserId: string;
  updateFanUserId: string;
} {
  const updatedUsers = [...xUsers];
  const cleanTag = artistName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'artist';

  // 1. Chart / Stats Fan Account (e.g. "Tate McRae Charts")
  let chartsUser = updatedUsers.find(
    (u) =>
      u.id === 'charts_fan_solo' ||
      u.id === 'charts_fan_group' ||
      u.id === `charts_${artistId}` ||
      u.id.startsWith('charts_'),
  );
  if (!chartsUser) {
    const chartsId = `charts_${artistId}`;
    chartsUser = {
      id: chartsId,
      name: `${artistName} Charts`,
      username: `${cleanTag}charts`,
      avatar: artistImage || 'https://i.imgur.com/3Y3j3jQ.png',
      isVerified: 'blue',
      isFanAccount: true,
      bio: `Fan account. Charts, streaming & YouTube stats for ${artistName}.`,
      followersCount: Math.floor(Math.random() * 40000) + 18000,
      followingCount: 1,
    };
    updatedUsers.push(chartsUser);
  } else {
    // Ensure it renders cleanly with Fan account badge & verified status if newly used
    const idx = updatedUsers.findIndex((u) => u.id === chartsUser!.id);
    if (idx !== -1 && (!chartsUser.isFanAccount || !chartsUser.isVerified)) {
      updatedUsers[idx] = {
        ...chartsUser,
        isFanAccount: true,
        isVerified: chartsUser.isVerified || 'blue',
      };
      chartsUser = updatedUsers[idx];
    }
  }

  // 2. Fan Update Account for premiere schedule announcements
  let updateFanUser = updatedUsers.find(
    (u) =>
      u.id === `addiction_fan_${artistId}` ||
      u.id === 'addiction_fan_solo' ||
      u.id === 'addiction_fan_group' ||
      u.id.startsWith('addiction_fan_') ||
      u.id === 'stats_fan_solo' ||
      u.id === 'stats_fan_group',
  );
  if (!updateFanUser) {
    const fanUpdateId = `addiction_fan_${artistId}`;
    updateFanUser = {
      id: fanUpdateId,
      name: `The ${artistName} Tour & Updates`,
      username: `${cleanTag}updates`,
      avatar: artistImage || 'https://i.imgur.com/3Y3j3jQ.png',
      isVerified: 'blue',
      isFanAccount: true,
      bio: `Fan account. News, premieres & updates for ${artistName}.`,
      followersCount: Math.floor(Math.random() * 120000) + 40000,
      followingCount: 1,
    };
    updatedUsers.push(updateFanUser);
  } else {
    const idx = updatedUsers.findIndex((u) => u.id === updateFanUser!.id);
    if (idx !== -1 && !updateFanUser.isFanAccount) {
      updatedUsers[idx] = {
        ...updateFanUser,
        isFanAccount: true,
      };
      updateFanUser = updatedUsers[idx];
    }
  }

  return {
    updatedUsers,
    chartsUserId: chartsUser.id,
    updateFanUserId: updateFanUser.id,
  };
}

export function buildScheduledPremiereFanTweet({
  authorId,
  artistName,
  video,
  songs,
  postDate,
}: {
  authorId: string;
  artistName: string;
  video: Video;
  songs: Song[];
  postDate: GameDate;
}): XPost {
  const songTitle = extractSongTitleForVideo(video, songs);
  const videoTypeLower = video.type.toLowerCase();
  const premiereShortDate = formatPremiereDateShort(video.releaseDate);
  const artistDisplayLower = artistName.toLowerCase();
  const songLower = songTitle.toLowerCase();

  const content = `${artistDisplayLower} for '${songLower}' official ${videoTypeLower} premiere.\n\nit premieres ${premiereShortDate} at 9 pm PT/ midnight ET!`;

  return {
    id: crypto.randomUUID(),
    authorId,
    content,
    image: video.thumbnail,
    likes: Math.floor(Math.random() * 12000) + 1500,
    retweets: Math.floor(Math.random() * 3500) + 400,
    views: Math.floor(Math.random() * 250000) + 30000,
    date: postDate,
  };
}

export function buildPremiereLiveStatsTweets({
  chartsUserId,
  updateFanUserId,
  artistName,
  video,
  allVideos,
  songs,
  popularity,
  postDate,
}: {
  chartsUserId: string;
  updateFanUserId: string;
  artistName: string;
  video: Video;
  allVideos: Video[];
  songs: Song[];
  popularity: number;
  postDate: GameDate;
}): XPost[] {
  const currentViewers = video.premierePeakViewers ?? video.liveViewers ?? 0;
  const songTitle = extractSongTitleForVideo(video, songs);
  const videoTypeLower = video.type.toLowerCase();

  // Compare against previous premieres by this artist (excluding this video)
  const priorPremieres = allVideos
    .filter(
      (v) =>
        v.id !== video.id &&
        !v.isFeatureVideo &&
        !v.isScheduled &&
        (v.premierePeakViewers || 0) > 0,
    )
    .sort((a, b) => (b.premierePeakViewers || 0) - (a.premierePeakViewers || 0));

  let chartsContent: string;
  if (priorPremieres.length === 0) {
    chartsContent = `“${songTitle}” (${formatPremiereNumber(currentViewers)}) becomes ${artistName}’s biggest ${videoTypeLower} premiere ever on YouTube.`;
  } else {
    const prevBest = priorPremieres[0];
    const prevBestViewers = prevBest.premierePeakViewers || 0;
    const prevBestTitle = extractSongTitleForVideo(prevBest, songs);

    if (currentViewers >= prevBestViewers) {
      chartsContent = `“${songTitle}” (${formatPremiereNumber(currentViewers)}) becomes ${artistName}’s biggest ${videoTypeLower} premiere ever on YouTube, surpassing “${prevBestTitle}” (${formatPremiereNumber(prevBestViewers)}).`;
    } else {
      const higherCount = priorPremieres.filter(
        (v) => (v.premierePeakViewers || 0) > currentViewers,
      ).length;
      const rank = higherCount + 1;
      chartsContent = `“${songTitle}” (${formatPremiereNumber(currentViewers)}) debuts as ${artistName}’s #${rank} biggest ${videoTypeLower} premiere ever on YouTube, behind “${prevBestTitle}” (${formatPremiereNumber(prevBestViewers)}).`;
    }
  }

  const popScale = Math.max(0.2, (popularity || 20) / 100);
  const chartsPost: XPost = {
    id: crypto.randomUUID(),
    authorId: chartsUserId,
    content: chartsContent,
    image: video.thumbnail,
    likes: Math.floor((Math.random() * 18000 + 2500) * popScale),
    retweets: Math.floor((Math.random() * 5000 + 600) * popScale),
    views: Math.floor((Math.random() * 450000 + 45000) * popScale),
    date: postDate,
  };

  const fanReactionPost: XPost = {
    id: crypto.randomUUID(),
    authorId: updateFanUserId,
    content: `${formatPremiereNumber(currentViewers)} people watching the '${songTitle}' ${videoTypeLower} premiere right now 😭🔥`,
    likes: Math.floor((Math.random() * 6000 + 700) * popScale),
    retweets: Math.floor((Math.random() * 1600 + 180) * popScale),
    views: Math.floor((Math.random() * 140000 + 15000) * popScale),
    date: postDate,
  };

  return [chartsPost, fanReactionPost];
}
