import {
  Artist,
  ArtistData,
  ChartEntry,
  ChartHistory,
  GameDate,
  GrammyCategory,
  RedditComment,
  RedditPost,
  Release,
  Song,
  Tour,
} from '../types';

// Authentic Reddit usernames tailored for popheads and music fandoms
const REDDIT_USERNAMES = [
  'pop_fanatic_24',
  'vinyl_grooves',
  'bridge_enjoyer',
  'synthwave_nocturne',
  'chart_watcher_99',
  'melodramatic_era',
  'bassline_junkie',
  'stan_twitter_refugee',
  'the_pop_critic',
  'acoustic_reverie',
  'pitchfork_skeptic',
  'espresso_depresso',
  'audiophile_dan',
  'starlight_driver',
  'chorus_collector',
  'pophead_veteran',
  'indie_spill_the_tea',
  'track_four_stan',
  'midnight_listener',
  'mastering_engineer_anon',
  'radio_spins_insider',
  'diamond_certified_era',
  'reverb_soaked_vocals',
  'front_row_barricade',
  'streaming_data_nerd',
  'pop_encyclopedia',
  'dream_pop_daze',
  'discography_ranker',
  'sub_bass_connoisseur',
  'melodic_escapism',
];

function getRandomUsername(): string {
  return REDDIT_USERNAMES[Math.floor(Math.random() * REDDIT_USERNAMES.length)];
}

function getRandomTimeAgo(): string {
  const hours = Math.floor(Math.random() * 18) + 1;
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
}

// Generate realistic user flairs
function getCommentUserFlair(artistProfile: Artist, songs: Song[], releases: Release[]): string {
  const options = [
    'verified pophead',
    'Main Pop Girl Stan',
    'Era Enthusiast',
    'Vinyl Collector',
    'Audio Engineer',
    'AOTY Campaigner',
    'Chart Watcher',
  ];
  if (releases.length > 0) {
    const randomRel = releases[Math.floor(Math.random() * releases.length)];
    options.push(`${randomRel.title} Era`, `Stream ${randomRel.title}`);
  }
  if (songs.length > 0) {
    const randomSong = songs[Math.floor(Math.random() * songs.length)];
    options.push(`Justice for "${randomSong.title}"`, `"${randomSong.title}" Defense Squad`);
  }
  return options[Math.floor(Math.random() * options.length)];
}

// Helper to construct a rich comment thread
function buildCommentThread(
  rootComments: { text: string; author?: string; flair?: string; replies?: { text: string; author?: string }[] }[],
  artistProfile: Artist,
  songs: Song[],
  releases: Release[],
  baseUpvotes: number
): RedditComment[] {
  return rootComments.map((rc) => {
    const rootAuthor = rc.author || getRandomUsername();
    const upvotes = Math.max(12, Math.floor(baseUpvotes * (0.1 + Math.random() * 0.25)));
    const replies: RedditComment[] = (rc.replies || []).map((reply) => ({
      id: crypto.randomUUID(),
      author: reply.author || getRandomUsername(),
      text: reply.text,
      upvotes: Math.max(5, Math.floor(upvotes * (0.2 + Math.random() * 0.5))),
      timeAgo: `${Math.floor(Math.random() * 45) + 5}m ago`,
      userFlair: getCommentUserFlair(artistProfile, songs, releases),
    }));

    return {
      id: crypto.randomUUID(),
      author: rootAuthor,
      text: rc.text,
      upvotes,
      timeAgo: `${Math.floor(Math.random() * 8) + 1}h ago`,
      userFlair: rc.flair || getCommentUserFlair(artistProfile, songs, releases),
      replies: replies.length > 0 ? replies : undefined,
    };
  });
}

export interface RedditGenParams {
  artistData: ArtistData;
  artistProfile: Artist;
  currentDate: GameDate;
  hot100?: ChartEntry[];
  billboard200?: ChartEntry[];
  spotifyGlobal?: ChartEntry[];
  chartHistory?: ChartHistory;
  grammyNominations?: GrammyCategory[] | null;
}

export function generateWeeklyRedditPosts(params: RedditGenParams): RedditPost[] {
  const {
    artistData,
    artistProfile,
    currentDate,
    hot100 = [],
    billboard200 = [],
    spotifyGlobal = [],
    chartHistory = {},
    grammyNominations = null,
  } = params;

  const artistName = artistProfile.name;
  const artistSubreddit = artistName.replace(/[^a-zA-Z0-9]/g, '');
  const posts: RedditPost[] = [];

  const releasedSongs = artistData.songs.filter((s) => s.isReleased);
  const releasedAlbums = artistData.releases.filter(
    (r) =>
      r.isReleased ||
      (r.releaseDate &&
        (r.releaseDate.year < currentDate.year ||
          (r.releaseDate.year === currentDate.year && r.releaseDate.week <= currentDate.week)))
  );

  // 1. Fresh Song Releases THIS WEEK
  const freshSongsThisWeek = releasedSongs.filter(
    (s) => s.releaseDate?.year === currentDate.year && s.releaseDate?.week === currentDate.week
  );

  for (const song of freshSongsThisWeek) {
    const featStr = song.features && song.features.length > 0 ? ` (feat. ${song.features.join(', ')})` : '';
    const genreStr = [song.genre, song.secondaryGenre].filter(Boolean).join(' / ') || 'Pop';
    const baseUpvotes = Math.floor(3500 + (artistData.popularity * 85) + Math.random() * 2000);

    const comments = buildCommentThread(
      [
        {
          text: `The bridge on this song is completely out of this world. When that transition hit at the end I genuinely gasped. Who produced this??`,
          replies: [
            { text: `The vocal layering on the final chorus is unbelievable with good headphones. Easily their cleanest vocal delivery to date.` },
            { text: `Instant playlist add. If their label plays their cards right, this is going to dominate radio for months.` },
          ],
        },
        {
          text: `I love that they went with a more ${genreStr} sound for this era instead of playing it safe. It feels authentic and daring.`,
          replies: [
            { text: `Exactly! People always complain when pop artists repeat themselves. This feels like real artistic evolution.` },
          ],
        },
        {
          text: `Already on my fifth listen. The bassline alone carries the entire track. Is this the lead single for a new album rollout??`,
          replies: [
            { text: `Has to be! If the full project sounds anything like this, we are about to be fed so well.` },
          ],
        },
      ],
      artistProfile,
      releasedSongs,
      releasedAlbums,
      baseUpvotes
    );

    posts.push({
      id: crypto.randomUUID(),
      author: getRandomUsername(),
      timeAgo: getRandomTimeAgo(),
      title: `[FRESH] ${artistName} - ${song.title}${featStr}`,
      content: `${artistName} just dropped their new single "${song.title}"! \n\nInitial genre tags: ${genreStr}.\nWhat are everyone's immediate thoughts on the production and vocals? Is this going straight into your heavy rotation?`,
      upvotes: baseUpvotes,
      commentCount: Math.floor(baseUpvotes * 0.12) + 40,
      image: song.coverArt || null,
      subreddit: 'popheads',
      flair: 'FRESH',
      userFlair: `Stream "${song.title}"`,
      comments,
    });
  }

  // 2. Fresh Album / EP Releases THIS WEEK
  const freshAlbumsThisWeek = releasedAlbums.filter(
    (r) => r.releaseDate?.year === currentDate.year && r.releaseDate?.week === currentDate.week
  );

  for (const album of freshAlbumsThisWeek) {
    const albumSongs = releasedSongs.filter((s) => album.songIds.includes(s.id));
    const standout1 = albumSongs[1]?.title || albumSongs[0]?.title || 'the title track';
    const standout2 = albumSongs[3]?.title || albumSongs[albumSongs.length - 1]?.title || 'the closing track';
    const baseUpvotes = Math.floor(7500 + (artistData.popularity * 150) + Math.random() * 4000);

    const comments = buildCommentThread(
      [
        {
          text: `"${standout1}" and "${standout2}" back-to-back is an insane run. There are virtually no skips on the entire project for me so far.`,
          replies: [
            { text: `Came here to comment this exact thing! The cohesion from front to back is remarkable. One of the strongest bodies of work this year.` },
            { text: `Pitchfork better give this at least an 8.0 BNM or we riot.` },
          ],
        },
        {
          text: `The emotional depth in the lyrics is on another level compared to their debut. You can really tell how much they poured into this era.`,
          replies: [
            { text: `The songwriting credits speak for themselves. You can feel the intention behind every verse.` },
          ],
        },
        {
          text: `Immediate vinyl purchase. That album packaging and artwork is gorgeous. Easily my album of the year contender!`,
          replies: [
            { text: `Same here, ordered the alternate cover variant immediately!` },
          ],
        },
      ],
      artistProfile,
      releasedSongs,
      releasedAlbums,
      baseUpvotes
    );

    posts.push({
      id: crypto.randomUUID(),
      author: getRandomUsername(),
      timeAgo: getRandomTimeAgo(),
      title: `[FRESH ALBUM] ${artistName} - ${album.title}`,
      content: `Official discussion megathread for ${artistName}'s new project "${album.title}"!\n\nTrack count: ${album.songIds.length} tracks\nType: ${album.type}\n\nWhat are your favorite non-singles? How does this rank in their discography so far? Drop your initial track rankings below!`,
      upvotes: baseUpvotes,
      commentCount: Math.floor(baseUpvotes * 0.18) + 120,
      image: album.coverArt || null,
      subreddit: 'popheads',
      flair: 'FRESH ALBUM',
      userFlair: `${album.title} Era`,
      comments,
    });
  }

  // 3. Billboard Hot 100 Milestones & Chart Debuts
  const playerHot100Hits = hot100.filter(
    (entry) =>
      entry.artist.toLowerCase().includes(artistName.toLowerCase()) ||
      entry.title.toLowerCase().includes(artistName.toLowerCase())
  );

  if (playerHot100Hits.length > 0) {
    const topEntry = playerHot100Hits[0];
    const topRank = topEntry.rank;
    const matchedSong = releasedSongs.find((s) => s.title.toLowerCase() === topEntry.title.toLowerCase());

    if (topRank === 1) {
      // Hot 100 #1 Hit
      const baseUpvotes = Math.floor(12000 + (artistData.popularity * 120) + Math.random() * 3000);
      const comments = buildCommentThread(
        [
          {
            text: `A NUMBER ONE HIT! POP EMERGENCY! 🚨 They worked so hard for this, the streaming numbers throughout the tracking week were completely undeniable.`,
            replies: [
              { text: `Seeing an artist with genuine organic momentum climb all the way to the top spot is so satisfying.` },
              { text: `The radio push finally kicked in just in time. Absolute monster smash!` },
            ],
          },
          {
            text: `Remember when people doubted if this song would catch on after week one? Never bet against good pop music.`,
            replies: [
              { text: `The longevity is going to be absurd. This song will be playing in every retail store and bar through next summer.` },
            ],
          },
        ],
        artistProfile,
        releasedSongs,
        releasedAlbums,
        baseUpvotes
      );

      posts.push({
        id: crypto.randomUUID(),
        author: getRandomUsername(),
        timeAgo: getRandomTimeAgo(),
        title: `[CHART UPDATE] "${topEntry.title}" by ${artistName} officially hits #1 on the Billboard Hot 100!`,
        content: `Billboard Hot 100 Chart Update:\n\n#1. ${artistName} - "${topEntry.title}"\n\nFuelled by massive weekly streaming and strong digital sales, "${topEntry.title}" captures the throne on the official Hot 100 songs chart!`,
        upvotes: baseUpvotes,
        commentCount: Math.floor(baseUpvotes * 0.15) + 80,
        image: matchedSong?.coverArt || null,
        subreddit: 'popheads',
        flair: 'CHART UPDATE',
        userFlair: 'Hot 100 #1 Stan',
        comments,
      });
    } else if (topRank <= 10) {
      // Hot 100 Top 10 Entry
      const baseUpvotes = Math.floor(4500 + (artistData.popularity * 60) + Math.random() * 1500);
      const comments = buildCommentThread(
        [
          {
            text: `Top 10 locked in! Looking at the tracking data, could this actually make a push for top 3 next week?`,
            replies: [
              { text: `If the radio adds keep coming in at this rate, absolutely. Spotify US is holding steady in the top 5 too.` },
            ],
          },
          {
            text: `Well deserved. It's been everywhere on TikTok and Instagram Reels for the past two weeks.`,
          },
        ],
        artistProfile,
        releasedSongs,
        releasedAlbums,
        baseUpvotes
      );

      posts.push({
        id: crypto.randomUUID(),
        author: getRandomUsername(),
        timeAgo: getRandomTimeAgo(),
        title: `[CHART UPDATE] "${topEntry.title}" by ${artistName} ascends to #${topRank} on the Billboard Hot 100`,
        content: `"${topEntry.title}" claims a spot in the Billboard Hot 100 Top 10 at #${topRank}! The song continues to gain traction across multiple platforms.`,
        upvotes: baseUpvotes,
        commentCount: Math.floor(baseUpvotes * 0.1) + 30,
        image: matchedSong?.coverArt || null,
        subreddit: 'popheads',
        flair: 'CHART UPDATE',
        userFlair: 'Chart Watcher',
        comments,
      });
    }
  }

  // 4. Billboard 200 Album Chart Updates
  const playerAlbumEntries = billboard200.filter((entry) =>
    entry.artist.toLowerCase().includes(artistName.toLowerCase())
  );
  if (playerAlbumEntries.length > 0) {
    const topAlbum = playerAlbumEntries[0];
    if (topAlbum.rank === 1) {
      const matchedAlbum = releasedAlbums.find((a) => a.title.toLowerCase() === topAlbum.title.toLowerCase());
      const baseUpvotes = Math.floor(8000 + (artistData.popularity * 90) + Math.random() * 2000);

      const comments = buildCommentThread(
        [
          {
            text: `Debuting at #1 on the Billboard 200 is huge! The vinyl and physical sales numbers did heavy lifting here alongside steady streaming.`,
            replies: [
              { text: `So happy to see an album era get this level of commercial payoff. It really proves the fanbase is invested.` },
            ],
          },
          {
            text: `A massive congratulations to ${artistName}! One of the cleanest album rollouts in recent memory.`,
          },
        ],
        artistProfile,
        releasedSongs,
        releasedAlbums,
        baseUpvotes
      );

      posts.push({
        id: crypto.randomUUID(),
        author: getRandomUsername(),
        timeAgo: getRandomTimeAgo(),
        title: `[CHART UPDATE] "${topAlbum.title}" by ${artistName} officially debuts at #1 on the Billboard 200!`,
        content: `Billboard 200 Official Update:\n\n#1. ${artistName} - "${topAlbum.title}"\n\nThe project takes the top spot in the country!`,
        upvotes: baseUpvotes,
        commentCount: Math.floor(baseUpvotes * 0.12) + 50,
        image: matchedAlbum?.coverArt || null,
        subreddit: 'popheads',
        flair: 'CHART UPDATE',
        userFlair: `${topAlbum.title} Fanatic`,
        comments,
      });
    }
  }

  // 5. Touring Discussions & Announcements
  const activeTours = (artistData.tours || []).filter(
    (t: Tour) => t.status === 'active' || t.status === 'presale' || t.status === 'planning'
  );

  if (activeTours.length > 0 && Math.random() < 0.6) {
    const tour = activeTours[0];
    const baseUpvotes = Math.floor(3000 + (artistData.popularity * 40) + Math.random() * 1000);
    const tourCategory = tour.venueCategory || 'Arenas';

    if (tour.status === 'active') {
      const randomSong = releasedSongs[Math.floor(Math.random() * releasedSongs.length)];
      const comments = buildCommentThread(
        [
          {
            text: `I was at the show last night and when they performed "${randomSong ? randomSong.title : 'their biggest hit'}" the entire arena lost their minds. Their live vocals are immaculate!`,
            replies: [
              { text: `Can confirm! The lighting rig and stage transitions are so high budget. Worth every penny.` },
              { text: `Did they do the acoustic B-stage set?? Dying to know what surprise song they played.` },
            ],
          },
          {
            text: `The merchandise line was insane though, definitely recommend arriving early if you want tour shirts.`,
          },
        ],
        artistProfile,
        releasedSongs,
        releasedAlbums,
        baseUpvotes
      );

      posts.push({
        id: crypto.randomUUID(),
        author: getRandomUsername(),
        timeAgo: getRandomTimeAgo(),
        title: `[TOUR] First impressions from ${artistName}'s "${tour.name}"! Setlist, visuals, and vocals breakdown`,
        content: `Just got back from seeing the ${tour.name}! \n\nStage Design: A-stage runway with elevated platforms and cinematic backdrops.\nVocals: 10/10 live, no heavy backing track crutches.\nEnergy: The crowd knew every single lyric.\n\nAnyone else going to upcoming dates on this leg?`,
        upvotes: baseUpvotes,
        commentCount: Math.floor(baseUpvotes * 0.14) + 45,
        image: tour.bannerImage || null,
        subreddit: artistSubreddit,
        flair: 'TOUR',
        userFlair: `${tour.name} Attendee`,
        comments,
      });
    } else {
      // Tour announced / presale
      const totalShowsCount = tour.venues ? tour.venues.length : 15;
      const comments = buildCommentThread(
        [
          {
            text: `Praying Ticketmaster's dynamic pricing doesn't charge my rent for nosebleeds. Good luck in the presale queue everyone! 🕯️`,
            replies: [
              { text: `Already setting five alarms for the artist presale code tomorrow morning lol.` },
            ],
          },
          {
            text: `Finally playing ${tourCategory}! This tour is going to sell out so fast.`,
          },
        ],
        artistProfile,
        releasedSongs,
        releasedAlbums,
        baseUpvotes
      );

      posts.push({
        id: crypto.randomUUID(),
        author: getRandomUsername(),
        timeAgo: getRandomTimeAgo(),
        title: `[NEWS] ${artistName} announces "${tour.name}" (${totalShowsCount} dates across ${tourCategory})`,
        content: `Dates and routing have officially dropped for ${artistName}'s upcoming tour "${tour.name}"!\n\nPresale starts this week. Who's planning on buying tickets?`,
        upvotes: baseUpvotes,
        commentCount: Math.floor(baseUpvotes * 0.16) + 60,
        image: tour.bannerImage || null,
        subreddit: 'popheads',
        flair: 'NEWS',
        userFlair: 'Tour Survivor',
        comments,
      });
    }
  }

  // 6. Grammy Awards Season (Weeks 44-52)
  if (currentDate.week >= 44 && currentDate.week <= 52 && grammyNominations && grammyNominations.length > 0) {
    const userNomCategories = grammyNominations.filter((cat) =>
      cat.nominees.some((nom) => nom.isPlayer || nom.artistName.toLowerCase().includes(artistName.toLowerCase()))
    );

    const userWinCategories = grammyNominations.filter(
      (cat) =>
        cat.winner &&
        (cat.winner.isPlayer || cat.winner.artistName.toLowerCase().includes(artistName.toLowerCase()))
    );

    if (userWinCategories.length > 0 && currentDate.week >= 50) {
      const topWin = userWinCategories[0];
      const baseUpvotes = Math.floor(10000 + (artistData.popularity * 100) + Math.random() * 2500);

      const comments = buildCommentThread(
        [
          {
            text: `GRAMMY WINNER ${artistName.toUpperCase()}! The acceptance speech had me tearing up, so well deserved after years of dedication.`,
            replies: [
              { text: `They truly earned this. The academy finally made the right call in ${topWin.name}.` },
              { text: `And the live performance earlier in the broadcast was easily the highlight of the entire telecast.` },
            ],
          },
        ],
        artistProfile,
        releasedSongs,
        releasedAlbums,
        baseUpvotes
      );

      posts.push({
        id: crypto.randomUUID(),
        author: getRandomUsername(),
        timeAgo: getRandomTimeAgo(),
        title: `[AWARDS] ${artistName} officially wins ${topWin.name} at the Grammy Awards!`,
        content: `Major congratulations to ${artistName} on their Grammy victory for ${topWin.name}! \n\nDrop your thoughts on the win and their telecast performance below!`,
        upvotes: baseUpvotes,
        commentCount: Math.floor(baseUpvotes * 0.15) + 75,
        image: artistData.artistImages?.[0] || null,
        subreddit: 'popheads',
        flair: 'AWARDS',
        userFlair: 'Grammy Winner Stan',
        comments,
      });
    } else if (userNomCategories.length > 0) {
      const topNom = userNomCategories[0];
      const baseUpvotes = Math.floor(6000 + (artistData.popularity * 70) + Math.random() * 1500);

      const comments = buildCommentThread(
        [
          {
            text: `Earning a nomination in ${topNom.name} is huge prestige! Looking at the other nominees, do we think they have a real shot at taking home the trophy?`,
            replies: [
              { text: `Competition is fierce, but the critical acclaim for this era makes them an extremely viable contender.` },
            ],
          },
        ],
        artistProfile,
        releasedSongs,
        releasedAlbums,
        baseUpvotes
      );

      posts.push({
        id: crypto.randomUUID(),
        author: getRandomUsername(),
        timeAgo: getRandomTimeAgo(),
        title: `[AWARDS] Grammy Nominations: ${artistName} scores ${userNomCategories.length} nomination(s) including ${topNom.name}!`,
        content: `The Recording Academy has officially announced the nominees for the upcoming Grammy ceremony! \n\n${artistName} picked up ${userNomCategories.length} nomination(s). Can they bring home the win?`,
        upvotes: baseUpvotes,
        commentCount: Math.floor(baseUpvotes * 0.12) + 40,
        image: artistData.artistImages?.[0] || null,
        subreddit: 'popheads',
        flair: 'AWARDS',
        userFlair: 'Grammy Campaigner',
        comments,
      });
    }
  }

  // 7. Discography Deep Dive & Fan Community Posts (Subreddit Engagement)
  // Ensure we always have engaging, realistic discussion even during quiet weeks
  if (posts.length < 3 && releasedSongs.length >= 2) {
    const topSong = [...releasedSongs].sort((a, b) => (b.streams || 0) - (a.streams || 0))[0];
    const nonSingle =
      releasedSongs.find((s) => s.id !== topSong.id && (s.quality || 50) >= 60) || releasedSongs[1];

    if (nonSingle && Math.random() < 0.65) {
      const baseUpvotes = Math.floor(1800 + (artistData.popularity * 35) + Math.random() * 800);
      const comments = buildCommentThread(
        [
          {
            text: `THANK YOU. I play "${nonSingle.title}" more than literally any other track in their catalog. The outro fadeout is pure magic.`,
            replies: [
              { text: `The fact that this was never pushed as an official radio single with a music video will always remain a mystery to me.` },
              { text: `If they performed this live with a full acoustic strings section I think I would ascend to heaven.` },
            ],
          },
          {
            text: `The bridge has some of the sharpest lyricism in their discography. Casual listeners are really missing out on this gem.`,
          },
        ],
        artistProfile,
        releasedSongs,
        releasedAlbums,
        baseUpvotes
      );

      posts.push({
        id: crypto.randomUUID(),
        author: getRandomUsername(),
        timeAgo: getRandomTimeAgo(),
        title: `[APPRECIATION] Can we appreciate how "${nonSingle.title}" is secretly one of ${artistName}'s all-time greatest songs?`,
        content: `I find myself returning to "${nonSingle.title}" constantly. \n\nThe vocal restraint, the subtle instrumentation, and the lyrical vulnerability are top tier. Where does this rank among your personal favorites?`,
        upvotes: baseUpvotes,
        commentCount: Math.floor(baseUpvotes * 0.12) + 25,
        image: nonSingle.coverArt || null,
        subreddit: artistSubreddit,
        flair: 'Discussion',
        userFlair: `Justice for "${nonSingle.title}"`,
        comments,
      });
    }

    if (releasedAlbums.length > 0 && Math.random() < 0.55) {
      const album = releasedAlbums[Math.floor(Math.random() * releasedAlbums.length)];
      const baseUpvotes = Math.floor(2200 + (artistData.popularity * 40) + Math.random() * 900);

      const comments = buildCommentThread(
        [
          {
            text: `My personal ranking:\n1. Title track\n2. Track 3\n3. The closing ballad\n\nCurious how everyone else orders the tracklist!`,
            replies: [
              { text: `Putting track 3 at #2 is based taste. That song deserves way more praise.` },
              { text: `Honestly the back half of "${album.title}" is so underrated, track 7 is easily my #1.` },
            ],
          },
          {
            text: `This era's aesthetic direction, promo interviews, and sonic cohesion were just flawless.`,
          },
        ],
        artistProfile,
        releasedSongs,
        releasedAlbums,
        baseUpvotes
      );

      posts.push({
        id: crypto.randomUUID(),
        author: getRandomUsername(),
        timeAgo: getRandomTimeAgo(),
        title: `[DISCUSSION] Now that it's settled in, how would you rank the tracklist of "${album.title}"?`,
        content: `It's been in heavy rotation for a while now. \n\nWhich tracks grew on you the most since release day, and which ones have stood the test of time as career highlights? Share your complete rankings!`,
        upvotes: baseUpvotes,
        commentCount: Math.floor(baseUpvotes * 0.14) + 35,
        image: album.coverArt || null,
        subreddit: artistSubreddit,
        flair: 'Discussion',
        userFlair: `${album.title} Defender`,
        comments,
      });
    }

    // Leaks or studio rumors if hype is high
    if (artistData.hype >= 65 && Math.random() < 0.45) {
      const baseUpvotes = Math.floor(2800 + (artistData.popularity * 45) + Math.random() * 1100);
      const comments = buildCommentThread(
        [
          {
            text: `If this unreleased track gets locked in the vault and never sees the light of day I will never forgive their label. The snippet sounds incredible.`,
            replies: [
              { text: `The synth bassline sounds like an absolute smash. Really hoping it makes the cut for the next project.` },
            ],
          },
          {
            text: `Spotted leaving a recording studio in NYC last week too... new music is definitely cooking behind the scenes.`,
          },
        ],
        artistProfile,
        releasedSongs,
        releasedAlbums,
        baseUpvotes
      );

      posts.push({
        id: crypto.randomUUID(),
        author: getRandomUsername(),
        timeAgo: getRandomTimeAgo(),
        title: `[RUMOR] Low quality snippet of unreleased ${artistName} track surfaces online — sounds like an 80s synth-pop banger`,
        content: `A 20-second low quality audio snippet allegedly from recent studio sessions was shared on Discord and Twitter today.\n\nThe snippet features energetic synths and signature soaring vocals. Have you heard it? Do you think it's intended for the next era?`,
        upvotes: baseUpvotes,
        commentCount: Math.floor(baseUpvotes * 0.18) + 40,
        image: artistData.artistImages?.[0] || null,
        subreddit: 'popheads',
        flair: 'RUMOR',
        userFlair: 'Studio Insider',
        comments,
      });
    }
  }

  // Return generated posts, picking 2 to 4 diverse posts
  return posts.slice(0, 4);
}
