import type { ArtistData, ChartHistory, Email, GameDate, GameState, XPost, XUser } from '../types';

export const TWO_YEARS_IN_WEEKS = 104;
export const MAX_DAILY_STREAM_DAYS = 56;
export const MAX_NPC_POST_WINDOW = 80;
export const MAX_WEEKLY_EMPTY_ARCHIVE_WEEKS = 52;
export const MAX_CHAT_MESSAGES_PER_THREAD = 100;

export const toTotalWeeks = (d?: { year?: number; week?: number }): number => {
  if (!d) return 0;
  return (d.year || 1) * 52 + (d.week || 1);
};

// Fast structural deep-clone avoiding giant temporary UTF-16 JSON string allocations
export const fastClone = <T>(val: T): T => {
  if (val === null || typeof val !== 'object') {
    return val;
  }

  if (Array.isArray(val)) {
    const len = val.length;
    if (len === 0) return [] as unknown as T;
    const first = val[0];
    // Fast-path primitive arrays (dailyStreams, chartRun, numbers, strings)
    if (first === null || typeof first !== 'object') {
      return val.slice() as unknown as T;
    }
    const copy = new Array(len);
    for (let i = 0; i < len; i++) {
      copy[i] = fastClone(val[i]);
    }
    return copy as unknown as T;
  }

  if (val instanceof Date) {
    return new Date(val.getTime()) as unknown as T;
  }

  const out: Record<string, any> = {};
  for (const key in val) {
    if (Object.prototype.hasOwnProperty.call(val, key)) {
      const prop = (val as any)[key];
      out[key] = prop !== null && typeof prop === 'object' ? fastClone(prop) : prop;
    }
  }
  return out as T;
};

const hasCriticalUnresolvedOffer = (email: Email): boolean => {
  const offer: any = email.offer;
  if (!offer) return false;
  if (offer.type === 'billionsClub' && !offer.hasUploadedImage) return true;
  if ((offer.type === 'actingTrailerUpload' || offer.type === 'actingCoverUpload' || offer.type === 'giveBirth') && !offer.isAnswered) {
    return true;
  }
  return false;
};

/**
 * Deletes READ emails older than 2 in-game years (104 weeks).
 * Always preserves ALL unread emails and critical unresolved story uploads.
 */
export const pruneOldInboxEmails = (
  inbox: Email[] | undefined,
  currentDate: GameDate
): Email[] => {
  if (!inbox || inbox.length === 0) return [];
  const currentTotal = toTotalWeeks(currentDate);

  return inbox.filter((email) => {
    if (!email) return false;
    if (!email.isRead) return true;
    if (hasCriticalUnresolvedOffer(email)) return true;
    const emailTotal = toTotalWeeks(email.date || currentDate);
    return currentTotal - emailTotal <= TWO_YEARS_IN_WEEKS;
  });
};

/**
 * Compacts historical chart runs for inactive NPC entries across any ChartHistory dictionary
 * while keeping 100% of player items (all chartRun and metadata) intact forever.
 */
export const compactChartHistoryInPlace = (
  history: ChartHistory | undefined,
  activeIds: Set<string>,
  playerIds: Set<string>
): void => {
  if (!history) return;
  for (const uniqueId in history) {
    if (playerIds.has(uniqueId) || activeIds.has(uniqueId)) continue;
    const entry = history[uniqueId];
    if (!entry) continue;
    if (entry.chartRun && entry.chartRun.length > 8) {
      delete entry.chartRun;
    }
    if (entry.chartRunEntries && entry.chartRunEntries.length > 8) {
      delete entry.chartRunEntries;
    }
  }
};

export interface WeeklyChartArchiveRow {
  year: number;
  week: number;
  entries: any[];
}

/**
 * Preserves 100% of weekly archive snapshots where the player appeared on the chart.
 * Compacts old NPC-only weeks (>52 weeks old with 0 player entries).
 */
export const compactWeeklyChartArchive = (
  archive: WeeklyChartArchiveRow[] | undefined,
  currentDate: GameDate
): WeeklyChartArchiveRow[] => {
  if (!archive || archive.length === 0) return [];
  const currentTotal = toTotalWeeks(currentDate);

  return archive.filter((row) => {
    if (!row) return false;
    if (row.entries && row.entries.length > 0) return true;
    return currentTotal - toTotalWeeks(row) <= MAX_WEEKLY_EMPTY_ARCHIVE_WEEKS;
  });
};

export const isUserXPost = (
  post: XPost,
  artistId: string,
  playerXId?: string
): boolean => {
  const anyPost = post as any;
  return (
    post.authorId === playerXId ||
    post.authorId === 'player' ||
    post.authorId === artistId ||
    anyPost.isPlayerPost === true ||
    post.isRepost === true ||
    anyPost.repostedByPlayer === true ||
    post.isPinned === true ||
    post.isHighlight === true ||
    (playerXId !== undefined && anyPost.replyToAuthorId === playerXId) ||
    (post.replyToId !== undefined && post.authorId === playerXId)
  );
};

export const compactArtistXPosts = (
  xPosts: XPost[] | undefined,
  xUsers: XUser[] | undefined,
  artistId: string,
  artistName?: string
): XPost[] => {
  if (!xPosts || xPosts.length === 0) return [];
  const playerHandle = artistName ? artistName.replace(/\s/g, '').toLowerCase() : '';
  const playerXId =
    xUsers?.find((u) => u.isPlayer)?.id ||
    xUsers?.find((u) => playerHandle && u.username?.toLowerCase() === playerHandle)?.id;

  let npcCount = 0;
  const result: XPost[] = [];
  for (let i = 0; i < xPosts.length; i++) {
    const post = xPosts[i];
    if (!post) continue;
    if (isUserXPost(post, artistId, playerXId)) {
      result.push(post);
      continue;
    }
    npcCount++;
    if (npcCount <= MAX_NPC_POST_WINDOW) {
      if (npcCount > 20 && post.comments && post.comments.length > 8) {
        result.push({ ...post, comments: post.comments.slice(0, 8) });
      } else {
        result.push(post);
      }
    }
  }
  return result;
};

/**
 * Self-healing compaction pass executed when loading an existing (possibly legacy heavy) save.
 */
export const compactGameStateOnLoad = (state: GameState): GameState => {
  if (!state || !state.artistsData) return state;

  const currentDate = state.date || { year: 2024, week: 1 };
  const allPlayerSongIds = new Set<string>();
  const allPlayerAlbumIds = new Set<string>();

  const collectArtistName = (id: string): string | undefined => {
    if (state.soloArtist?.id === id) return state.soloArtist.name;
    if (state.group?.id === id) return state.group.name;
    const member = state.group?.members?.find((m) => m.id === id);
    if (member) return member.name;
    const extra = state.extraPlayableArtists?.find((a) => a.id === id);
    if (extra) return extra.name;
    return undefined;
  };

  for (const aId in state.artistsData) {
    const aData: ArtistData = state.artistsData[aId];
    if (!aData) continue;

    // Collect player song/release IDs before chart compaction
    aData.songs?.forEach((s) => {
      if (s?.id) allPlayerSongIds.add(s.id);
    });
    aData.releases?.forEach((r) => {
      if (r?.id) allPlayerAlbumIds.add(r.id);
    });

    // 1. Prune read emails older than 2 in-game years
    if (aData.inbox && aData.inbox.length > 0) {
      aData.inbox = pruneOldInboxEmails(aData.inbox, currentDate);
    }

    // 2. Cap legacy dailyStreams arrays on songs
    if (aData.songs && aData.songs.length > 0) {
      for (let i = 0; i < aData.songs.length; i++) {
        const s = aData.songs[i];
        if (s?.dailyStreams && s.dailyStreams.length > MAX_DAILY_STREAM_DAYS) {
          s.dailyStreams = s.dailyStreams.slice(-MAX_DAILY_STREAM_DAYS);
        }
      }
    }

    // 3. Cap legacy spotifyDailyViews on videos
    if (aData.videos && aData.videos.length > 0) {
      for (let i = 0; i < aData.videos.length; i++) {
        const v = aData.videos[i];
        if (v?.spotifyDailyViews && v.spotifyDailyViews.length > MAX_DAILY_STREAM_DAYS) {
          v.spotifyDailyViews = v.spotifyDailyViews.slice(-MAX_DAILY_STREAM_DAYS);
        }
      }
    }

    // 4. Compact social posts (preserving 100% of player content)
    const artistName = collectArtistName(aId);
    if (aData.xPosts && aData.xPosts.length > MAX_NPC_POST_WINDOW) {
      aData.xPosts = compactArtistXPosts(aData.xPosts, aData.xUsers, aId, artistName);
    }

    // 5. Cap bloated DM threads
    if (aData.xChats && aData.xChats.length > 0) {
      for (let i = 0; i < aData.xChats.length; i++) {
        const chat = aData.xChats[i];
        if (chat?.messages && chat.messages.length > MAX_CHAT_MESSAGES_PER_THREAD) {
          chat.messages = chat.messages.slice(-MAX_CHAT_MESSAGES_PER_THREAD);
        }
      }
    }
  }

  // 6. Compact retired NPC chart runs across ALL chart histories (preserving all player runs)
  const activeHot100Ids = new Set((state.billboardHot100 || []).map((s) => s.uniqueId));
  const activeAlbumIds = new Set((state.billboardTopAlbums || []).map((a) => a.uniqueId));
  const activeUkSingleIds = new Set((state.ukSinglesChart || []).map((s) => s.uniqueId));
  const activeUkAlbumIds = new Set((state.ukAlbumsChart || []).map((a) => a.uniqueId));
  const activeVideoIds = new Set((state.spotifyGlobalMusicVideos || []).map((v) => v.uniqueId));
  const activePopIds = new Set((state.hotPopSongs || []).map((s) => s.uniqueId));
  const activeRapIds = new Set((state.hotRapRnb || []).map((s) => s.uniqueId));
  const activeElecIds = new Set((state.electronicChart || []).map((s) => s.uniqueId));
  const activeCountryIds = new Set((state.countryChart || []).map((s) => s.uniqueId));

  compactChartHistoryInPlace(state.chartHistory, activeHot100Ids, allPlayerSongIds);
  compactChartHistoryInPlace(state.albumChartHistory, activeAlbumIds, allPlayerAlbumIds);
  compactChartHistoryInPlace(state.ukSinglesChartHistory, activeUkSingleIds, allPlayerSongIds);
  compactChartHistoryInPlace(state.ukAlbumsChartHistory, activeUkAlbumIds, allPlayerAlbumIds);
  compactChartHistoryInPlace(state.videoChartHistory, activeVideoIds, allPlayerSongIds);
  compactChartHistoryInPlace(state.hotPopSongsHistory, activePopIds, allPlayerSongIds);
  compactChartHistoryInPlace(state.hotRapRnbHistory, activeRapIds, allPlayerSongIds);
  compactChartHistoryInPlace(state.electronicChartHistory, activeElecIds, allPlayerSongIds);
  compactChartHistoryInPlace(state.countryChartHistory, activeCountryIds, allPlayerSongIds);

  // 7. Compact weekly archives (keep 100% of player-charting weeks, drop old empty shells)
  if (state.billboardHot100WeeklyArchive) {
    state.billboardHot100WeeklyArchive = compactWeeklyChartArchive(
      state.billboardHot100WeeklyArchive,
      currentDate
    );
  }
  if (state.ukSinglesChartWeeklyArchive) {
    state.ukSinglesChartWeeklyArchive = compactWeeklyChartArchive(
      state.ukSinglesChartWeeklyArchive,
      currentDate
    );
  }

  return state;
};
