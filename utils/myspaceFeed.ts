import { GameState, GameDate, MySpaceFeedPost, MySpaceFeedComment, ArtistData } from '../types';

export const MYSPACE_AVATARS = {
  tom: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  billboard: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiMwMDAwMDAiLz48dGV4dCB4PSIzMiIgeT0iNDQiIGZpbGw9IiMxMkZGODAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CQjwvdGV4dD48L3N2Zz4=',
  trl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiNGRjAwNjYiLz48dGV4dCB4PSIzMiIgeT0iNDMiIGZpbGw9IiNGRkZGRkYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UUkw8L3RleHQ+PC9zdmc+',
  itunes: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiMyQjNFREQiLz48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIxOCIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNMjggMjZ2MTJsMTAgLTZ6IiBmaWxsPSIjMkIzRUREIi8+PC9zdmc+',
  perez: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  bestbuy: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiMwMDM4QTgiLz48cGF0aCBkPSJNMTYgMThoMjhsOCAxNGwtOCAxNGgtMjh6IiBmaWxsPSIjRkZFMDAwIi8+PHRleHQgeD0iMzAiIHk9IjM3IiBmaWxsPSIjMDAwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjkwMCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QkJVRTwvdGV4dD48L3N2Zz4=',
  tmz: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiNGRjAwMDAiLz48dGV4dCB4PSIzMiIgeT0iNDQiIGZpbGw9IiNGRkZGRkYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UTVo8L3RleHQ+PC9zdmc+',
  mtv: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiMwMDAwMDAiLz48dGV4dCB4PSIzMiIgeT0iNDQiIGZpbGw9IiNGRkZFMDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5NVFY8L3RleHQ+PC9zdmc+',
  apple: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiM1NTU1NTUiLz48cGF0aCBkPSJNMjggMjRhOCA4IDAgMCAxIDggLThhOCA4IDAgMCAwIC04IDh6IiBmaWxsPSIjRkZGRkZGIi8+PHBhdGggZD0iTTMyIDIzYy01LjUgMCAtMTAgNC41IC0xMCAxMGMwIDkgOSA5IDExIDE2YzIgLTcgMTEgLTcgMTEgLTE2YzAgLTUuNSAtNC41IC0xMCAtMTIgLTEweiIgZmlsbD0iI0ZGRkZGRiIvPjwvc3ZnPg==',
  jamster: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiNGRjAwOTkiLz48dGV4dCB4PSIzMiIgeT0iNDMiIGZpbGw9IiNGRkZGRkYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5KQU1TVEVSPC90ZXh0Pjwvc3ZnPg==',
  fanGirl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  fanEmo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
  fanSkater: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
  fanPop: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80',
  fanRocker: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
};

export const MYSPACE_MOODS = [
  '🎵 Rocking Out',
  '💿 Buying CDs',
  '🖤 Emo',
  '✨ Blessed',
  '🔥 Hyped',
  '😎 Chill',
  '🎧 Listening to Music',
  '💤 Tired',
  '🎉 Partying',
  '💻 Coding My Layout',
  '👀 Gossiping',
];

export function getInitialMySpaceFeed(artistName: string, date: GameDate): MySpaceFeedPost[] {
  return [
    {
      id: 'init_tom',
      authorId: 'tom',
      authorName: 'Tom',
      authorHandle: 'tom',
      authorAvatar: MYSPACE_AVATARS.tom,
      isVerified: true,
      content: `Welcome to MySpace, ${artistName}! Thanks for joining my network. So hyped to follow your musical journey! Make sure to set your profile song, track your weekly CD sales & iTunes downloads, and code your custom HTML layout!`,
      kudos: 84210,
      commentsCount: 1420,
      repostsCount: 320,
      date: { year: date.year, week: date.week },
      category: 'friends',
      mood: '😎 Chill',
      comments: [
        {
          id: 'c_tom_1',
          authorName: 'Sarah_xoxo',
          authorAvatar: MYSPACE_AVATARS.fanGirl,
          content: `${artistName} is already #1 on my Top 8 friends!! <3`,
          date: { year: date.year, week: date.week },
        },
      ],
    },
    {
      id: 'init_billboard',
      authorId: 'billboard',
      authorName: 'Billboard Charts',
      authorHandle: 'billboard_charts',
      authorAvatar: MYSPACE_AVATARS.billboard,
      isVerified: true,
      content: `BILLBOARD 200 REPORT: Pure album sales continue to dominate music charts nationwide! Best Buy and Target reporting packed aisles as music fans rush to purchase physical CD releases!`,
      kudos: 15420,
      commentsCount: 382,
      repostsCount: 190,
      date: { year: date.year, week: date.week },
      category: 'charts',
    },
    {
      id: 'init_perez',
      authorId: 'perez',
      authorName: 'Perez Hilton',
      authorHandle: 'perezhilton',
      authorAvatar: MYSPACE_AVATARS.perez,
      isVerified: true,
      content: `HOLLYWOOD BUZZ: Perez is hearing HUGE things about ${artistName}! The paparazzi in Los Angeles and NYC are on high alert! Are you ready for their next era?!`,
      kudos: 12400,
      commentsCount: 410,
      repostsCount: 160,
      date: { year: date.year, week: date.week },
      category: 'industry',
      mood: '👀 Gossiping',
    },
    {
      id: 'init_trl',
      authorId: 'trl',
      authorName: 'MTV Total Request Live',
      authorHandle: 'trl_official',
      authorAvatar: MYSPACE_AVATARS.trl,
      isVerified: true,
      content: `TRL TIMES SQUARE ALERT: Stans of ${artistName} are outside MTV studios with hand-painted posterboards! Keep calling 1-800-DIAL-MTV to push them up the countdown!`,
      kudos: 19800,
      commentsCount: 540,
      repostsCount: 412,
      date: { year: date.year, week: date.week },
      category: 'industry',
      mood: '🔥 Hyped',
    },
  ];
}

export function generateWeeklyMySpaceFeedPosts(
  state: GameState,
  artistName: string,
  newBillboardTopAlbums: any[],
  newBillboardHot100: any[],
  date: GameDate,
  artistData?: ArtistData,
  currentItunesSongs?: any[],
  prevItunesMap?: Map<string, number>
): MySpaceFeedPost[] {
  const generatedPosts: MySpaceFeedPost[] = [];
  const randId = () => `ms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const aData = artistData || (state.activeArtistId ? state.artistsData[state.activeArtistId] : undefined);
  const artistPic = aData?.avatarUrl || (aData as any)?.avatar || aData?.image || '';

  const isItunesLaunched = date.year > 2003 || (date.year === 2003 && date.week >= 17);
  const isItunesLaunchMoment = date.year === 2003 && date.week >= 17 && date.week <= 20;

  // =========================================================================
  // 1. ITUNES LAUNCH MOMENT (APRIL 2003 / 2003 WEEKS 17-20)
  // =========================================================================
  if (isItunesLaunchMoment) {
    generatedPosts.push({
      id: randId(),
      authorId: 'apple',
      authorName: 'Apple Keynote',
      authorHandle: 'apple_keynote',
      authorAvatar: MYSPACE_AVATARS.apple,
      isVerified: true,
      content: `STEVE JOBS INTRODUCES THE ITUNES MUSIC STORE: "Rip. Mix. Burn." Today digital music changes forever! Songs cost just 99¢ with zero monthly subscription fees! Fans are already racing to purchase and sync ${artistName}'s tracks directly to their iPods!`,
      kudos: Math.floor(Math.random() * 35000) + 18000,
      commentsCount: Math.floor(Math.random() * 1200) + 400,
      repostsCount: Math.floor(Math.random() * 500) + 150,
      date,
      category: 'industry',
      mood: '🔥 Hyped',
    });

    generatedPosts.push({
      id: randId(),
      authorId: 'billboard',
      authorName: 'Billboard Charts',
      authorHandle: 'billboard_charts',
      authorAvatar: MYSPACE_AVATARS.billboard,
      isVerified: true,
      content: `DIGITAL REVOLUTION: Billboard announces that legal digital downloads purchased on Apple's newly launched iTunes Music Store will begin tracking toward official music sales charts! ${artistName}'s fanbase is leading the digital frontier!`,
      kudos: Math.floor(Math.random() * 25000) + 12000,
      commentsCount: Math.floor(Math.random() * 750) + 220,
      date,
      category: 'charts',
    });

    generatedPosts.push({
      id: randId(),
      authorId: 'fan_mac_head',
      authorName: 'xX_MacUser_03_Xx',
      authorHandle: 'mac_user_03',
      authorAvatar: MYSPACE_AVATARS.fanPop,
      content: `I just plugged my 10GB 3rd-Gen iPod with touch buttons into my Mac via FireWire and bought ${artistName}'s songs on the iTunes Store for 99 cents each! The download took 10 seconds! No more waiting for CDs to rip! The future is officially here!!`,
      kudos: Math.floor(Math.random() * 1200) + 320,
      commentsCount: Math.floor(Math.random() * 95) + 25,
      date,
      category: 'fan',
      mood: '🔥 Hyped',
    });
  }

  // =========================================================================
  // 2. WEEKLY ITUNES CHART MOVEMENTS FOR THE USER (INCREASE, DECREASE, #1, DEBUT)
  // =========================================================================
  if (isItunesLaunched && currentItunesSongs && currentItunesSongs.length > 0) {
    const itunesMap = prevItunesMap || new Map();
    const playerItunesSongs: { song: any; rank: number; prevRank: number | null }[] = [];

    currentItunesSongs.forEach((song: any, idx: number) => {
      if (song.isPlayerSong) {
        const rank = idx + 1;
        const prevRank = itunesMap.get(song.uniqueId) ?? null;
        playerItunesSongs.push({ song, rank, prevRank });
      }
    });

    playerItunesSongs.slice(0, 3).forEach(({ song, rank, prevRank }) => {
      const sales = song.itunesSales || 85000;

      if (rank === 1 && (prevRank === null || prevRank > 1)) {
        // Hit #1 on US iTunes
        generatedPosts.push({
          id: randId(),
          authorId: 'itunes',
          authorName: 'iTunes Music Store',
          authorHandle: 'itunes_charts',
          authorAvatar: MYSPACE_AVATARS.itunes,
          isVerified: true,
          content: `🚨 NUMBER ONE ON US ITUNES: '${song.title}' by ${artistName} has officially TAKEN OVER the #1 spot on the US iTunes Store! Over ${sales.toLocaleString()} digital downloads purchased this week alone! Digital listeners can't get enough!`,
          image: song.coverArt,
          kudos: Math.floor(Math.random() * 48000) + 24000,
          commentsCount: Math.floor(Math.random() * 1600) + 500,
          repostsCount: Math.floor(Math.random() * 600) + 200,
          date,
          category: 'charts',
        });

        generatedPosts.push({
          id: randId(),
          authorId: 'perez',
          authorName: 'Perez Hilton',
          authorHandle: 'perezhilton',
          authorAvatar: MYSPACE_AVATARS.perez,
          isVerified: true,
          content: `CHART TOPPER: Perez is bowing down! ${artistName} just booted all the competition out of the way to hit #1 on US iTunes with '${song.title}'! The download velocity is insane! Eat your heart out haters!`,
          image: song.coverArt,
          kudos: Math.floor(Math.random() * 28000) + 12000,
          commentsCount: Math.floor(Math.random() * 850) + 240,
          date,
          category: 'industry',
          mood: '👀 Gossiping',
        });
      } else if (prevRank !== null && rank < prevRank) {
        // Position INCREASED (Climbed Up)
        const jump = prevRank - rank;
        generatedPosts.push({
          id: randId(),
          authorId: 'itunes',
          authorName: 'iTunes Music Store',
          authorHandle: 'itunes_charts',
          authorAvatar: MYSPACE_AVATARS.itunes,
          isVerified: true,
          content: `ITUNES CLIMBER: Big surge for ${artistName}! '${song.title}' leaps +${jump} SPOTS this week, rocketing from #${prevRank} up to #${rank} on the US iTunes Top 100! Fans are gifting the track in bulk to their buddy list!`,
          image: song.coverArt,
          kudos: Math.floor(Math.random() * 26000) + 11000,
          commentsCount: Math.floor(Math.random() * 750) + 190,
          date,
          category: 'charts',
        });

        generatedPosts.push({
          id: randId(),
          authorId: 'fan_scene_jen',
          authorName: 'xX_SceneQueen_Jen_Xx',
          authorHandle: 'jen_scene',
          authorAvatar: MYSPACE_AVATARS.fanGirl,
          content: `WE MOVED UP +${jump} SPOTS ON ITUNES THIS WEEK!! '${song.title}' is up to #${rank}! MySpace stans please keep gifting it for 99¢ so we can push ${artistName} into the Top 3 next week!!`,
          kudos: Math.floor(Math.random() * 1100) + 280,
          commentsCount: Math.floor(Math.random() * 95) + 22,
          date,
          category: 'fan',
          mood: '🔥 Hyped',
          nowPlaying: { title: song.title, artist: artistName },
        });
      } else if (prevRank !== null && rank > prevRank) {
        // Position DECREASED (Slipped Down)
        const drop = rank - prevRank;
        generatedPosts.push({
          id: randId(),
          authorId: 'perez',
          authorName: 'Perez Hilton',
          authorHandle: 'perezhilton',
          authorAvatar: MYSPACE_AVATARS.perez,
          isVerified: true,
          content: `ITUNES CHART SLIP: Uh oh! '${song.title}' by ${artistName} slipped -${drop} spots to #${rank} on the iTunes Store this week (down from #${prevRank}) as rivals push hard. Can the stans rally another download push to reclaim the top spot?!`,
          image: song.coverArt,
          kudos: Math.floor(Math.random() * 19000) + 8500,
          commentsCount: Math.floor(Math.random() * 640) + 180,
          date,
          category: 'industry',
          mood: '👀 Gossiping',
        });

        generatedPosts.push({
          id: randId(),
          authorId: 'ashley_scene_queen',
          authorName: 'xX_Ashley_Rawr_Xx',
          authorHandle: 'ashley_rawr',
          authorAvatar: MYSPACE_AVATARS.fanEmo,
          content: `EMERGENCY MYSPACE BULLETIN: '${song.title}' by ${artistName} fell from #${prevRank} to #${rank} on iTunes! Go buy a copy with your allowance right now! Re-post this bulletin to all your friends or else ${artistName} will fall off the chart!!`,
          kudos: Math.floor(Math.random() * 950) + 240,
          commentsCount: Math.floor(Math.random() * 85) + 18,
          date,
          category: 'fan',
          mood: '🖤 Emo',
        });
      } else if (prevRank === null) {
        // iTunes Debut
        generatedPosts.push({
          id: randId(),
          authorId: 'itunes',
          authorName: 'iTunes Music Store',
          authorHandle: 'itunes_charts',
          authorAvatar: MYSPACE_AVATARS.itunes,
          isVerified: true,
          content: `ITUNES CHART DEBUT: ${artistName} enters the US iTunes Top 100 this week as '${song.title}' debuts at #${rank}! Early download velocity is explosive across all 50 states!`,
          image: song.coverArt,
          kudos: Math.floor(Math.random() * 24000) + 9500,
          commentsCount: Math.floor(Math.random() * 720) + 180,
          date,
          category: 'charts',
        });
      } else if (rank <= 5) {
        // Holding strong in Top 5
        generatedPosts.push({
          id: randId(),
          authorId: 'itunes',
          authorName: 'iTunes Music Store',
          authorHandle: 'itunes_charts',
          authorAvatar: MYSPACE_AVATARS.itunes,
          isVerified: true,
          content: `TOP 5 DIGITAL SMASH: '${song.title}' by ${artistName} holds strong at #${rank} on the US iTunes Store! Over ${sales.toLocaleString()} downloads counted toward Billboard this week!`,
          image: song.coverArt,
          kudos: Math.floor(Math.random() * 22000) + 8500,
          commentsCount: Math.floor(Math.random() * 580) + 160,
          date,
          category: 'charts',
        });
      }
    });
  }

  // User Digital Albums on iTunes
  const playerAlbumsOnBillboard = (newBillboardTopAlbums || []).filter((a) => a.isPlayerAlbum);
  if (isItunesLaunched && playerAlbumsOnBillboard.length > 0) {
    const topAlbum = playerAlbumsOnBillboard[0];
    if (topAlbum.itunesSales && topAlbum.itunesSales > 0) {
      generatedPosts.push({
        id: randId(),
        authorId: 'itunes',
        authorName: 'iTunes Music Store',
        authorHandle: 'itunes_charts',
        authorAvatar: MYSPACE_AVATARS.itunes,
        isVerified: true,
        content: `ITUNES ALBUMS CHART: ${artistName}'s '${topAlbum.title}' sold ${topAlbum.itunesSales.toLocaleString()} full digital albums on iTunes this week! Stans are syncing the entire tracklist in high-bitrate AAC to their 40GB iPod Classics!`,
        image: topAlbum.coverArt,
        kudos: Math.floor(Math.random() * 25000) + 10000,
        commentsCount: Math.floor(Math.random() * 680) + 190,
        date,
        category: 'charts',
      });
    }
  }

  // =========================================================================
  // 3. RED CARPET & AWARD SHOW APPEARANCES (USER ONLY)
  // =========================================================================
  let attendedRedCarpet = false;
  let redCarpetEventName = '';
  let redCarpetLookImg: string | undefined = undefined;

  // Check pastRedCarpetLooks
  const recentRedCarpetLook = (aData?.pastRedCarpetLooks || []).find((l: any) => {
    return l.year === date.year || !l.year;
  });
  if (recentRedCarpetLook) {
    attendedRedCarpet = true;
    redCarpetLookImg = recentRedCarpetLook.imageUrl || artistPic;
    redCarpetEventName = recentRedCarpetLook.awardShow ? `${recentRedCarpetLook.awardShow} Red Carpet` : 'VIP Red Carpet Gala';
  }

  // Check recent xPosts for red carpet attendance
  if (!attendedRedCarpet && aData?.xPosts) {
    const recentCarpetPost = aData.xPosts.find((p) => {
      const isRecent = p.date?.year === date.year && Math.abs(p.date?.week - date.week) <= 1;
      const hasCarpetKeyword = p.content && (
        p.content.toLowerCase().includes('red carpet') ||
        p.content.toLowerCase().includes('golden globes') ||
        p.content.toLowerCase().includes('goldenglobes') ||
        p.content.toLowerCase().includes('oscars') ||
        p.content.toLowerCase().includes('grammys') ||
        p.content.toLowerCase().includes('premiere') ||
        p.content.toLowerCase().includes('vma') ||
        p.content.toLowerCase().includes('nominee')
      );
      return isRecent && hasCarpetKeyword;
    });

    if (recentCarpetPost) {
      attendedRedCarpet = true;
      redCarpetLookImg = recentCarpetPost.image || recentCarpetPost.image2 || artistPic;
      if (recentCarpetPost.content.toLowerCase().includes('golden globe')) redCarpetEventName = 'Golden Globe Awards Red Carpet';
      else if (recentCarpetPost.content.toLowerCase().includes('oscar')) redCarpetEventName = 'Academy Awards (Oscars) Red Carpet';
      else if (recentCarpetPost.content.toLowerCase().includes('grammy')) redCarpetEventName = 'GRAMMY Awards Red Carpet';
      else if (recentCarpetPost.content.toLowerCase().includes('premiere')) redCarpetEventName = 'Hollywood Movie Premiere Red Carpet';
      else redCarpetEventName = 'Star-Studded Red Carpet';
    }
  }

  // Check recent paparazzi photos
  const recentPaparazzi = (aData?.paparazziPhotos || []).find((p: any) => {
    return (p.date?.year || p.year) === date.year && (p.date ? Math.abs(p.date.week - date.week) <= 1 : true);
  });
  if (!attendedRedCarpet && recentPaparazzi) {
    attendedRedCarpet = true;
    redCarpetEventName = (recentPaparazzi as any).location ? `${(recentPaparazzi as any).location} Red Carpet Gala` : 'VIP Red Carpet Premiere';
    redCarpetLookImg = recentPaparazzi.image || (recentPaparazzi as any).imageUrl || artistPic;
  }

  if (attendedRedCarpet) {
    // TMZ Red Carpet Post
    generatedPosts.push({
      id: randId(),
      authorId: 'tmz',
      authorName: 'TMZ',
      authorHandle: 'tmz',
      authorAvatar: MYSPACE_AVATARS.tmz,
      isVerified: true,
      content: `EXCLUSIVE RED CARPET: ${artistName} shut down the ${redCarpetEventName} this week! Paparazzi flashbulbs lit up the night as fans at the barricades screamed their name. Outfit rating: 10/10! Check out all the photo angles on our MySpace page!`,
      image: redCarpetLookImg || artistPic || undefined,
      kudos: Math.floor(Math.random() * 25000) + 12000,
      commentsCount: Math.floor(Math.random() * 800) + 240,
      repostsCount: Math.floor(Math.random() * 300) + 90,
      date,
      category: 'industry',
      mood: '👀 Gossiping',
    });

    // Perez Hilton Red Carpet Reaction
    generatedPosts.push({
      id: randId(),
      authorId: 'perez',
      authorName: 'Perez Hilton',
      authorHandle: 'perezhilton',
      authorAvatar: MYSPACE_AVATARS.perez,
      isVerified: true,
      content: `BEST DRESSED ALERT: Perez is officially OBSESSED with ${artistName} at the ${redCarpetEventName}! Total superstar energy! The haters are crying into their cereal. What did you think of the look?! Drop a comment below!`,
      image: redCarpetLookImg || artistPic || undefined,
      kudos: Math.floor(Math.random() * 18000) + 8000,
      commentsCount: Math.floor(Math.random() * 650) + 180,
      date,
      category: 'industry',
      mood: '👀 Gossiping',
    });
  }

  // =========================================================================
  // 4. NEW SINGLE RELEASES THIS WEEK (USER ONLY)
  // =========================================================================
  const newSinglesThisWeek = (aData?.songs || []).filter((s) => {
    return s.isReleased && s.releaseDate && s.releaseDate.year === date.year && s.releaseDate.week === date.week;
  });

  if (newSinglesThisWeek.length > 0) {
    const freshSingle = newSinglesThisWeek[0];

    generatedPosts.push({
      id: randId(),
      authorId: 'bestbuy',
      authorName: 'Best Buy Music Dept',
      authorHandle: 'bestbuy_music',
      authorAvatar: MYSPACE_AVATARS.bestbuy,
      isVerified: true,
      content: `NEW CD SINGLE TUESDAY: ${artistName}'s brand new single '${freshSingle.title}' has arrived in store racks nationwide! Grab the 2-track physical CD single with collectible cardboard slipcase for only $1.99! Also available on iTunes!`,
      image: freshSingle.coverArt,
      kudos: Math.floor(Math.random() * 14000) + 6000,
      commentsCount: Math.floor(Math.random() * 420) + 120,
      date,
      category: 'industry',
      mood: '💿 Buying CDs',
    });

    generatedPosts.push({
      id: randId(),
      authorId: 'trl',
      authorName: 'MTV Total Request Live',
      authorHandle: 'trl_official',
      authorAvatar: MYSPACE_AVATARS.trl,
      isVerified: true,
      content: `WORLD PREMIERE: Carson Daly just introduced ${artistName}'s brand new single '${freshSingle.title}' on TRL! The studio audience in Times Square went absolutely unhinged! Call 1-800-DIAL-MTV or vote online to push it up tomorrow's countdown!`,
      image: freshSingle.coverArt,
      kudos: Math.floor(Math.random() * 22000) + 9000,
      commentsCount: Math.floor(Math.random() * 680) + 180,
      date,
      category: 'industry',
      mood: '🔥 Hyped',
    });
  }

  // =========================================================================
  // 5. NEW ALBUM / EP DROPS THIS WEEK (USER ONLY)
  // =========================================================================
  const newAlbumsThisWeek = (aData?.releases || []).filter((r) => {
    return (r.type === 'Album' || r.type === 'EP') && r.releaseDate && r.releaseDate.year === date.year && r.releaseDate.week === date.week;
  });

  if (newAlbumsThisWeek.length > 0) {
    const freshAlbum = newAlbumsThisWeek[0];

    generatedPosts.push({
      id: randId(),
      authorId: 'bestbuy',
      authorName: 'Best Buy Music Dept',
      authorHandle: 'bestbuy_music',
      authorAvatar: MYSPACE_AVATARS.bestbuy,
      isVerified: true,
      content: `MIDNIGHT STORE OPENING SUCCESS: Hundreds of fans queued outside our doors at midnight for ${artistName}'s new album '${freshAlbum.title}'! Physical CD digipaks and booklet posters are moving fast! Get your copy today!`,
      image: freshAlbum.coverArt,
      kudos: Math.floor(Math.random() * 28000) + 14000,
      commentsCount: Math.floor(Math.random() * 950) + 320,
      date,
      category: 'industry',
      mood: '💿 Buying CDs',
    });

    generatedPosts.push({
      id: randId(),
      authorId: 'ashley_scene_queen',
      authorName: 'xX_Ashley_Rawr_Xx',
      authorHandle: 'ashley_rawr',
      authorAvatar: MYSPACE_AVATARS.fanEmo,
      content: `I skipped 3rd period to buy ${artistName}'s new album '${freshAlbum.title}' on CD at Target! Ripping it into iTunes at 320kbps right now so I can sync it to my iPod Mini. ${artistName} is permanently #1 on my Top 8 forever!!`,
      image: freshAlbum.coverArt,
      kudos: Math.floor(Math.random() * 1400) + 400,
      commentsCount: Math.floor(Math.random() * 110) + 30,
      date,
      category: 'fan',
      mood: '🖤 Emo',
      nowPlaying: { title: freshAlbum.title, artist: artistName },
    });
  }

  // =========================================================================
  // 6. BILLBOARD HOT 100 USER CHART ENTRIES, DEBUTS & #1s (USER ONLY)
  // =========================================================================
  const playerSongsOnHot100 = (newBillboardHot100 || []).filter((s) => s.isPlayerSong);

  if (playerSongsOnHot100.length > 0) {
    const topSongEntry = playerSongsOnHot100[0];
    const isDebut = topSongEntry.weeksOnChart === 1 || topSongEntry.lastWeek === null;
    const isNumberOne = topSongEntry.rank === 1;

    if (isNumberOne) {
      generatedPosts.push({
        id: randId(),
        authorId: 'billboard',
        authorName: 'Billboard Charts',
        authorHandle: 'billboard_charts',
        authorAvatar: MYSPACE_AVATARS.billboard,
        isVerified: true,
        content: `OFFICIAL: ${artistName}'s '${topSongEntry.title}' is the #1 SONG IN THE UNITED STATES on the Billboard Hot 100! Massive pure physical single sales at music retail plus skyrocketing iTunes downloads drive this historic victory!`,
        image: topSongEntry.coverArt,
        kudos: Math.floor(Math.random() * 45000) + 25000,
        commentsCount: Math.floor(Math.random() * 1800) + 600,
        date,
        category: 'charts',
      });
    } else if (isDebut) {
      generatedPosts.push({
        id: randId(),
        authorId: 'billboard',
        authorName: 'Billboard Charts',
        authorHandle: 'billboard_charts',
        authorAvatar: MYSPACE_AVATARS.billboard,
        isVerified: true,
        content: `BILLBOARD HOT 100 DEBUT: Congratulations to ${artistName}! '${topSongEntry.title}' officially makes a thunderous entrance on the Hot 100 this week at #${topSongEntry.rank}! SoundScan reports heavy CD single sales across the US!`,
        image: topSongEntry.coverArt,
        kudos: Math.floor(Math.random() * 22000) + 9000,
        commentsCount: Math.floor(Math.random() * 750) + 210,
        date,
        category: 'charts',
      });
    }
  }

  // =========================================================================
  // 7. BILLBOARD 200 PURE ALBUM SALES & ITUNES (USER ONLY)
  // =========================================================================
  if (playerAlbumsOnBillboard.length > 0) {
    const topAlbum = playerAlbumsOnBillboard[0];
    const totalSales = topAlbum.weeklySales || topAlbum.weeklyPureSales || 0;
    const itunesSales = topAlbum.itunesSales || 0;
    const physicalSales = Math.max(0, totalSales - itunesSales);

    generatedPosts.push({
      id: randId(),
      authorId: 'billboard',
      authorName: 'Billboard Charts',
      authorHandle: 'billboard_charts',
      authorAvatar: MYSPACE_AVATARS.billboard,
      isVerified: true,
      content: `BILLBOARD 200 SALES: ${artistName}'s '${topAlbum.title}' takes position #${topAlbum.rank} this week, selling an impressive ${totalSales.toLocaleString()} pure units! (${physicalSales.toLocaleString()} physical CDs/cassettes in stores${itunesSales > 0 ? ` + ${itunesSales.toLocaleString()} digital album downloads on iTunes` : ''}).`,
      image: topAlbum.coverArt,
      kudos: Math.floor(totalSales * 0.12) + 2500,
      commentsCount: Math.floor(totalSales * 0.015) + 120,
      date,
      category: 'charts',
    });
  }

  // =========================================================================
  // 8. POLYPHONIC & MASTER RINGTONES ERA (USER ONLY)
  // =========================================================================
  const userLeadSong = (aData?.songs || []).find((s) => s.isReleased);
  if (userLeadSong) {
    generatedPosts.push({
      id: randId(),
      authorId: 'jamster',
      authorName: 'Jamster / Jamba Ringtones',
      authorHandle: 'jamster_ringtones',
      authorAvatar: MYSPACE_AVATARS.jamster,
      isVerified: true,
      content: `MOBILE CHART SMASH: ${artistName}'s '${userLeadSong.title}' is the #1 MOST DOWNLOADED POLYPHONIC RINGTONE on Motorola RAZR and Nokia phones across Cingular, Sprint, and Verizon! Text '${userLeadSong.title.substring(0, 4).toUpperCase()}' to 55555 to get it for $2.99!`,
      kudos: Math.floor(Math.random() * 21000) + 8500,
      commentsCount: Math.floor(Math.random() * 540) + 160,
      date,
      category: 'industry',
      mood: '🎵 Rocking Out',
    });

    generatedPosts.push({
      id: randId(),
      authorId: 'sk8er_matt',
      authorName: 'Sk8er_Matt_04',
      authorHandle: 'sk8er_matt',
      authorAvatar: MYSPACE_AVATARS.fanSkater,
      content: `My Motorola RAZR went off in homeroom with the polyphonic ringtone for ${artistName}'s '${userLeadSong.title}' and everyone asked me what song that was! I told them to go download it on iTunes immediately!`,
      kudos: Math.floor(Math.random() * 850) + 220,
      commentsCount: Math.floor(Math.random() * 65) + 18,
      date,
      category: 'fan',
      mood: '😎 Chill',
      nowPlaying: { title: userLeadSong.title, artist: artistName },
    });
  }

  // =========================================================================
  // 9. LIMEWIRE / KAZAA ANTI-PIRACY PSA (USER ONLY)
  // =========================================================================
  if (userLeadSong && Math.random() < 0.75) {
    generatedPosts.push({
      id: randId(),
      authorId: 'fan_scene_kat',
      authorName: 'xX_Kat_DropDead_Xx',
      authorHandle: 'kat_scene',
      authorAvatar: MYSPACE_AVATARS.fanEmo,
      content: `PLEASE READ: If you're trying to download ${artistName}'s '${userLeadSong.title}' on LimeWire or Kazaa, STOP! Half of those MP3 files are infected with computer viruses that will wipe your hard drive! Support ${artistName} on iTunes for 99¢ or buy the real CD at Best Buy!`,
      kudos: Math.floor(Math.random() * 1300) + 380,
      commentsCount: Math.floor(Math.random() * 110) + 30,
      date,
      category: 'fan',
      mood: '🖤 Emo',
    });
  }

  // =========================================================================
  // 10. AIM (AOL INSTANT MESSENGER) AWAY MESSAGES & IPOD ERA (USER ONLY)
  // =========================================================================
  if (userLeadSong) {
    generatedPosts.push({
      id: randId(),
      authorId: 'fan_sarah_aim',
      authorName: 'Sarah_xoxo',
      authorHandle: 'sarah_aim',
      authorAvatar: MYSPACE_AVATARS.fanGirl,
      content: `My AIM Away Message right now: ~*~ "And every time I hear this track I think of you" - ${artistName} ('${userLeadSong.title}') ~*~ brb walking my dog and watching TRL! Don't IM me unless you want to talk about ${artistName}!`,
      kudos: Math.floor(Math.random() * 1050) + 290,
      commentsCount: Math.floor(Math.random() * 75) + 20,
      date,
      category: 'fan',
      mood: '✨ Blessed',
      nowPlaying: { title: userLeadSong.title, artist: artistName },
    });

    generatedPosts.push({
      id: randId(),
      authorId: 'fan_justin_ipod',
      authorName: 'Justin_iPod',
      authorHandle: 'justin_ipod',
      authorAvatar: MYSPACE_AVATARS.fanPop,
      content: `Just synced my 4GB silver iPod Mini with ${artistName}'s discography! Using the click wheel to scroll through '${userLeadSong.title}' on the school bus is pure bliss. Apple earbuds turned up to max volume!`,
      kudos: Math.floor(Math.random() * 950) + 260,
      commentsCount: Math.floor(Math.random() * 65) + 18,
      date,
      category: 'fan',
      mood: '🎧 Listening to Music',
    });
  }

  // =========================================================================
  // 11. CD RETAILER WARS (BEST BUY VS TARGET VS CIRCUIT CITY)
  // =========================================================================
  if (Math.random() < 0.65) {
    generatedPosts.push({
      id: randId(),
      authorId: 'fan_tower_records',
      authorName: 'TowerRecords_Fan',
      authorHandle: 'tower_fan',
      authorAvatar: MYSPACE_AVATARS.fanRocker,
      content: `Target had the exclusive bonus track, but Best Buy had the bonus backstage DVD for ${artistName}'s release! Obviously I spent my entire paycheck and bought both CD editions on release day. No regrets!`,
      kudos: Math.floor(Math.random() * 880) + 240,
      commentsCount: Math.floor(Math.random() * 70) + 19,
      date,
      category: 'fan',
      mood: '💿 Buying CDs',
    });
  }

  // =========================================================================
  // 12. TMZ PAPARAZZI & HOLLYWOOD GOSSIP (USER ONLY)
  // =========================================================================
  const relationships = aData?.relationships || [];
  const activeRel = relationships.find((r) => r.status === 'dating' || r.status === 'engaged' || r.status === 'married' || r.status === 'divorcing');

  if (activeRel && activeRel.status === 'divorcing') {
    generatedPosts.push({
      id: randId(),
      authorId: 'tmz',
      authorName: 'TMZ',
      authorHandle: 'tmz',
      authorAvatar: MYSPACE_AVATARS.tmz,
      isVerified: true,
      content: `LEGAL DRAMA: TMZ cameras caught ${artistName} walking out of court with high-powered attorneys in downtown LA amidst ongoing settlement talks with ${activeRel.partnerName}. Sources say ${artistName} is channeling the heartache straight into the studio!`,
      image: artistPic || undefined,
      kudos: Math.floor(Math.random() * 22000) + 10000,
      commentsCount: Math.floor(Math.random() * 740) + 220,
      date,
      category: 'industry',
      mood: '👀 Gossiping',
    });
  } else if (activeRel && (activeRel.status === 'engaged' || activeRel.status === 'married')) {
    generatedPosts.push({
      id: randId(),
      authorId: 'tmz',
      authorName: 'TMZ',
      authorHandle: 'tmz',
      authorAvatar: MYSPACE_AVATARS.tmz,
      isVerified: true,
      content: `POWER COUPLE SIGHTING: ${artistName} and ${activeRel.partnerName} were spotted holding hands leaving a celebrity hotspot in Beverly Hills! Fans on MySpace are flooding their page with heart emojis!`,
      image: artistPic || undefined,
      kudos: Math.floor(Math.random() * 19000) + 8500,
      commentsCount: Math.floor(Math.random() * 620) + 190,
      date,
      category: 'industry',
    });
  } else {
    generatedPosts.push({
      id: randId(),
      authorId: 'tmz',
      authorName: 'TMZ',
      authorHandle: 'tmz',
      authorAvatar: MYSPACE_AVATARS.tmz,
      isVerified: true,
      content: `SPOTTED IN LOS ANGELES: TMZ photogs swarmed ${artistName} leaving a recording studio at 3 AM flanked by security! Asked if new music is coming, they flashed a grin and gave a thumbs up before driving away in a black Escalade!`,
      image: artistPic || undefined,
      kudos: Math.floor(Math.random() * 20000) + 9000,
      commentsCount: Math.floor(Math.random() * 640) + 190,
      date,
      category: 'industry',
      mood: '👀 Gossiping',
    });
  }

  // =========================================================================
  // 13. TOM FROM MYSPACE SHOUTOUT (USER ONLY)
  // =========================================================================
  generatedPosts.push({
    id: randId(),
    authorId: 'tom',
    authorName: 'Tom',
    authorHandle: 'tom',
    authorAvatar: MYSPACE_AVATARS.tom,
    isVerified: true,
    content: `Hey everyone! Huge shoutout to my friend ${artistName}! Their music is blowing up across MySpace profiles, message boards, and the iTunes & Billboard charts this week. Leave them some love on their page!`,
    kudos: Math.floor(Math.random() * 38000) + 18000,
    commentsCount: Math.floor(Math.random() * 950) + 380,
    date,
    category: 'friends',
    mood: '😎 Chill',
  });

  return generatedPosts;
}
