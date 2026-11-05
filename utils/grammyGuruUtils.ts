import { GameDate, XPost, XUser, ArtistData, Song, Release, GrammyAward, NpcSong } from '../types';
import { getArtistImage } from '../constants';

export const GRAMMY_GURU_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><radialGradient id="guruBg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ff7e5f"/><stop offset="100%" stop-color="%23eb4d4b"/></radialGradient><radialGradient id="bulbGlow" cx="50%" cy="40%" r="50%"><stop offset="0%" stop-color="%23ffeaa7"/><stop offset="70%" stop-color="%23fdcb6e"/><stop offset="100%" stop-color="%23f39c12"/></radialGradient><linearGradient id="goldGrammy" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fff275"/><stop offset="50%" stop-color="%23f5cd2f"/><stop offset="100%" stop-color="%23d49200"/></linearGradient></defs><circle cx="60" cy="60" r="58" fill="url(%23guruBg)"/><circle cx="60" cy="50" r="32" fill="%23fff" opacity="0.15"/><path d="M42 46 C42 34 50 26 60 26 C70 26 78 34 78 46 C78 54 73 60 70 65 C68 68 67 72 67 75 L53 75 C53 72 52 68 50 65 C47 60 42 54 42 46 Z" fill="url(%23bulbGlow)" stroke="%23f39c12" stroke-width="1.5"/><rect x="54" y="76" width="12" height="3" rx="1.5" fill="%2357606f"/><rect x="55" y="80" width="10" height="3" rx="1.5" fill="%2357606f"/><rect x="56" y="84" width="8" height="2" rx="1" fill="%232f3542"/><path d="M60 40 L70 32 C72 30 74 34 72 38 L63 45 Z" fill="url(%23goldGrammy)"/><ellipse cx="71" cy="34" rx="3.5" ry="5.5" transform="rotate(-30 71 34)" fill="url(%23goldGrammy)"/><path d="M59 44 C57 45 55 48 55 52 L62 52 C62 49 61 46 59 44 Z" fill="url(%23goldGrammy)"/><rect x="54" y="53" width="10" height="5" rx="1" fill="url(%23goldGrammy)"/></svg>`;

export const theGrammyGuruUser: XUser = {
  id: "thegrammyguru",
  name: "The Grammy Guru",
  username: "TheGrammyGuru",
  avatar: GRAMMY_GURU_AVATAR,
  isVerified: true,
  bio: "Grammy predictions, eligibility screening, and official submissions coverage. Tracking the Recording Academy.",
  followersCount: 385000,
  followingCount: 142,
};

export const formatGrammyCategoryShort = (cat: string): string => {
  switch (cat) {
    case "Record of the Year":
      return "ROTY";
    case "Song of the Year":
      return "SOTY";
    case "Album of the Year":
      return "AOTY";
    case "Best Pop Song":
      return "Pop Solo Perf";
    case "Best Rap Song":
      return "Best Rap Song";
    case "Best R&B Song":
      return "Best R&B Song";
    case "Pop Album":
      return "Best Pop Vocal Album";
    case "Rap Album":
      return "Best Rap Album";
    case "R&B Album":
      return "Best Progressive R&B Album";
    case "Best New Artist":
      return "Best New Artist";
    default:
      return cat;
  }
};

export const getPronouns = (profile: any) => {
  const p = profile?.pronouns || profile?.gender;
  if (p === "he/him" || p === "male") return { subj: "he", poss: "his", obj: "him", Subj: "He" };
  if (p === "she/her" || p === "female") return { subj: "she", poss: "her", obj: "her", Subj: "She" };
  return { subj: "they", poss: "their", obj: "them", Subj: "They" };
};

export const getBestContendingCategories = (artistData: ArtistData, artistName: string, thisYear: number): string => {
  const releases = artistData.releases.filter((r) => r.releaseDate?.year === thisYear && !r.isTakenDown);
  const songs = artistData.songs.filter((s) => {
    const r = releases.find((rel) => rel.songIds.includes(s.id));
    return (r || s.releaseDate?.year === thisYear) && !s.isTakenDown;
  });

  const categories: string[] = [];
  const topSong = [...songs].sort((a, b) => (b.streams || 0) - (a.streams || 0))[0];

  if (topSong) {
    const isCollab = !!(topSong.collaboration || (topSong.features && topSong.features.length > 0));
    if (topSong.genre === "Dance" || topSong.genre === "Electronic" || topSong.secondaryGenre === "Dance") {
      categories.push("Best Dance Pop Recording");
    } else if (isCollab) {
      categories.push("Best Pop Duo/Group Performance");
    } else if (topSong.genre === "Pop") {
      categories.push("Best Pop Solo Performance");
    } else if (topSong.genre === "Hip Hop" || topSong.genre === "Rap") {
      categories.push("Best Rap Song");
    } else if (topSong.genre === "R&B") {
      categories.push("Best R&B Performance");
    } else if (topSong.genre === "Country") {
      categories.push("Best Country Solo Performance");
    } else {
      categories.push("Best Pop Solo Performance");
    }

    if ((topSong.streams || 0) > 20000000) {
      categories.push("Record of the Year");
      categories.push("Song of the Year");
    }
  }

  const topAlbum = releases.find((r) => ["Album", "EP", "Album (Deluxe)"].includes(r.type));
  if (topAlbum) {
    const relSongs = topAlbum.songIds.map((id) => songs.find((s) => s.id === id)).filter(Boolean);
    const primaryGenre = relSongs[0]?.genre || "Pop";
    if (primaryGenre === "Dance" || primaryGenre === "Electronic") {
      categories.push("Best Dance/Electronic Album");
    } else if (primaryGenre === "Hip Hop" || primaryGenre === "Rap") {
      categories.push("Best Rap Album");
    } else if (primaryGenre === "R&B") {
      categories.push("Best Progressive R&B Album");
    } else {
      categories.push("Best Pop Vocal Album");
    }
    if ((topAlbum.firstWeekStreams || 0) > 20000000) {
      categories.push("Album of the Year");
    }
  }

  if (categories.length === 0) {
    categories.push("Best Pop Solo Performance", "Record of the Year");
  }

  const uniqueCats = Array.from(new Set(categories)).slice(0, 3);
  if (uniqueCats.length === 1) return uniqueCats[0];
  if (uniqueCats.length === 2) return `${uniqueCats[0]} and ${uniqueCats[1]}`;
  return `${uniqueCats[0]}, ${uniqueCats[1]}, and ${uniqueCats[2]}`;
};

export interface ContenderCardInfo {
  title: string;
  artist: string;
  cover: string;
}

export const generateGrammyGuruPredictionsPoster = (
  categoryName: string,
  ceremonyYear: number,
  contenders: ContenderCardInfo[]
): string => {
  const cardsCoords = [
    { x: 80, y: 220, w: 200, h: 200 },
    { x: 350, y: 220, w: 200, h: 200 },
    { x: 620, y: 220, w: 200, h: 200 },
    { x: 215, y: 530, w: 200, h: 200 },
    { x: 485, y: 530, w: 200, h: 200 },
  ];

  const escapeXml = (str: string) =>
    (str || "").replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });

  const cardsSvg = cardsCoords
    .map((coord, i) => {
      const c = contenders[i] || {
        title: "TBD",
        artist: "Contender",
        cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop",
      };

      const truncTitle = escapeXml(c.title.length > 18 ? c.title.slice(0, 16) + "..." : c.title).toUpperCase();
      const truncArtist = escapeXml(c.artist.length > 20 ? c.artist.slice(0, 18) + "..." : c.artist).toUpperCase();
      const coverUrl = escapeXml(c.cover);

      return `
      <g>
        <rect x="${coord.x - 3}" y="${coord.y - 3}" width="${coord.w + 6}" height="${coord.h + 6}" fill="none" stroke="#fde047" stroke-width="2.5" rx="4" />
        <image href="${coverUrl}" x="${coord.x}" y="${coord.y}" width="${coord.w}" height="${coord.h}" preserveAspectRatio="xMidYMid slice" />
        <text x="${coord.x + coord.w / 2}" y="${coord.y + coord.h + 26}" text-anchor="middle" font-family="'Cinzel', Georgia, 'Times New Roman', serif" font-size="14" font-weight="900" fill="#ffffff" letter-spacing="1">${truncTitle}</text>
        <text x="${coord.x + coord.w / 2}" y="${coord.y + coord.h + 46}" text-anchor="middle" font-family="'Cinzel', Georgia, 'Times New Roman', serif" font-size="12" font-weight="700" fill="#fde047" letter-spacing="2">${truncArtist}</text>
      </g>
      `;
    })
    .join("");

  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" width="900" height="900">
  <defs>
    <radialGradient id="luxBg" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#b91c1c" />
      <stop offset="45%" stop-color="#880815" />
      <stop offset="85%" stop-color="#4a040b" />
      <stop offset="100%" stop-color="#240205" />
    </radialGradient>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="900" height="900" fill="url(#luxBg)" />
  
  <!-- Subtle decorative gold curves in corners -->
  <path d="M 40 120 C 120 40 220 30 320 20" fill="none" stroke="#fde047" stroke-width="1.5" opacity="0.4" />
  <path d="M 860 120 C 780 40 680 30 580 20" fill="none" stroke="#fde047" stroke-width="1.5" opacity="0.4" />
  <path d="M 40 780 C 120 860 220 870 320 880" fill="none" stroke="#fde047" stroke-width="1.5" opacity="0.4" />
  <path d="M 860 780 C 780 860 680 870 580 880" fill="none" stroke="#fde047" stroke-width="1.5" opacity="0.4" />
  
  <!-- Header Text -->
  <text x="450" y="65" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-size="15" letter-spacing="4" fill="#fde047" font-weight="700">THE GRAMMY GURU'S</text>
  <line x1="260" y1="95" x2="330" y2="95" stroke="#fde047" stroke-width="1.5" opacity="0.7" />
  <text x="450" y="100" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-size="19" letter-spacing="6" fill="#ffffff" font-weight="bold">FINAL PREDICTIONS</text>
  <line x1="570" y1="95" x2="640" y2="95" stroke="#fde047" stroke-width="1.5" opacity="0.7" />
  <text x="450" y="148" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-size="34" letter-spacing="2" fill="#fff5cc" font-weight="900" filter="url(#goldGlow)">${escapeXml(categoryName.toUpperCase())}</text>
  <text x="450" y="180" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-size="13" letter-spacing="3" fill="#fde047" font-weight="600">AT THE ${ceremonyYear} GRAMMYs</text>

  <!-- Contender Cards -->
  ${cardsSvg}
</svg>`;

  try {
    const base64 = btoa(unescape(encodeURIComponent(rawSvg)));
    return `data:image/svg+xml;base64,${base64}`;
  } catch (e) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
  }
};

export const processGrammyGuruWeeklyTweets = (args: {
  artistId: string;
  artistData: ArtistData;
  artistProfile: any;
  newDate: GameDate;
  grammySubmissions: any[];
  npcs: any[];
  npcAlbums: any[];
  grammyNominations?: any[] | null;
}): { postsToAdd: XPost[]; updatedArtistDataFields: Partial<ArtistData> } => {
  const { artistId, artistData, artistProfile, newDate, grammySubmissions, npcs, npcAlbums, grammyNominations } = args;
  const postsToAdd: XPost[] = [];
  const updatedArtistDataFields: Partial<ArtistData> = {};

  if (!artistProfile) return { postsToAdd, updatedArtistDataFields };
  if (newDate.week < 40 || newDate.week > 45) return { postsToAdd, updatedArtistDataFields };

  const ceremonyYear = newDate.year + 1;
  const artistName = artistProfile.name || artistData.name || "Artist";
  const pronouns = getPronouns(artistProfile);
  const userSubmissions = (grammySubmissions || []).filter((s: any) => s.artistId === artistId);
  const artistImage = (artistProfile as any)?.image || (artistProfile as any)?.imageUrl || artistData.avatarUrl || artistData.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=800&fit=crop";

  const thisYearReleases = (artistData.releases || []).filter((r) => r.releaseDate?.year === newDate.year && !r.isTakenDown);
  const thisYearSongs = (artistData.songs || []).filter((s) => {
    const r = thisYearReleases.find((rel) => rel.songIds.includes(s.id));
    return (r || s.releaseDate?.year === newDate.year) && !s.isTakenDown;
  });

  const topSong = [...thisYearSongs].sort((a, b) => (b.streams || 0) - (a.streams || 0))[0];
  const topAlbum = thisYearReleases.find((r) => ["Album", "EP", "Album (Deluxe)", "Compilation", "Live Album"].includes(r.type));

  const submissionWeek = artistData.grammySubmissionWeek || (userSubmissions.length > 0 ? 40 : null);
  const isWeekAfterSubmission = submissionWeek !== null && newDate.week === submissionWeek + 1;

  // --- TWEET 1: First tweet (User only, posted the week after you submit) ---
  // "how many years it’s been since your last nomination (must be at least over 3+ years) and what you are best contending for"
  if (
    isWeekAfterSubmission &&
    artistData.hasGrammyGuruLastNomTweetedYear !== newDate.year &&
    userSubmissions.length > 0
  ) {
    let yearsElapsed = 0;
    if (artistData.grammyHistory && artistData.grammyHistory.length > 0) {
      const pastNomYears = artistData.grammyHistory.map((h: any) => h.year).filter((y: number) => y < newDate.year);
      if (pastNomYears.length > 0) {
        yearsElapsed = newDate.year - Math.max(...pastNomYears);
      }
    }
    if (yearsElapsed === 0) {
      // Never nominated: count from debut year
      const firstYear = artistData.debutSingleDate?.year ||
        (artistData.releases.length > 0 ? Math.min(...artistData.releases.map((r) => r.releaseDate?.year || newDate.year)) : newDate.year);
      yearsElapsed = newDate.year - firstYear;
    }

    if (yearsElapsed >= 3) {
      const bestContending = getBestContendingCategories(artistData, artistName, newDate.year);
      const isPluralNom = yearsElapsed > 5;
      const content = `${artistName} is expected to earn ${pronouns.poss} first #GRAMMYs 🪩 ${isPluralNom ? "nominations" : "nomination"} in over ${yearsElapsed} years.\n\n${pronouns.Subj} is among the strongest contenders for ${bestContending} at the ${ceremonyYear} ceremony, and could pick up nominations in other categories.`;

      postsToAdd.push({
        id: crypto.randomUUID(),
        authorId: "thegrammyguru",
        content,
        image: artistImage,
        image2: topAlbum?.coverArt || topSong?.coverArt || (artistData.artistImages?.[1] || artistImage),
        likes: Math.floor(Math.random() * 9000) + 2500,
        retweets: Math.floor(Math.random() * 2000) + 400,
        views: Math.floor(Math.random() * 95000) + 30000,
        date: newDate,
      });

      updatedArtistDataFields.hasGrammyGuruLastNomTweetedYear = newDate.year;
    }
  }

  // --- TWEET 2: Second tweet (User only, posted week after you submit) ---
  // "says your artist name and all your submissions like the image."
  if (
    isWeekAfterSubmission &&
    artistData.hasGrammyGuruSubmissionsTweetedYear !== newDate.year &&
    userSubmissions.length > 0
  ) {
    const subMap = new Map<string, string[]>();
    userSubmissions.forEach((sub: any) => {
      const catShort = formatGrammyCategoryShort(sub.category);
      const itemName = sub.itemName || artistName;
      const arr = subMap.get(itemName) || [];
      if (!arr.includes(catShort)) arr.push(catShort);
      subMap.set(itemName, arr);
    });

    const lines: string[] = [];
    subMap.forEach((cats, itemName) => {
      if (itemName === artistName) {
        lines.push(cats.join(", "));
      } else {
        lines.push(`${itemName}: ${cats.join(", ")}`);
      }
    });

    const content = `${artistName}'s Official Submissions for the ${ceremonyYear} #GRAMMYs 🪩 (exclusive to The Grammy Guru):\n\n${lines.join("\n")}\n\nPlease credit us (@TheGrammyGuru) if you're posting our exclusive submissions on your account.`;

    // Find song cover for submitted items (or top song)
    const submittedSongItem = userSubmissions.find((sub: any) => {
      const s = artistData.songs.find((song) => song.id === sub.itemId);
      return !!s?.coverArt;
    });
    const submittedSong = submittedSongItem ? artistData.songs.find((s) => s.id === submittedSongItem.itemId) : null;
    const songCover = submittedSong?.coverArt || topSong?.coverArt || topAlbum?.coverArt || artistImage;

    postsToAdd.push({
      id: crypto.randomUUID(),
      authorId: "thegrammyguru",
      content,
      image: artistImage,
      image2: songCover,
      likes: Math.floor(Math.random() * 8000) + 2000,
      retweets: Math.floor(Math.random() * 1800) + 350,
      views: Math.floor(Math.random() * 85000) + 20000,
      date: newDate,
    });

    updatedArtistDataFields.hasGrammyGuruSubmissionsTweetedYear = newDate.year;
  }

  // --- TWEET 3: Third tweet (User only, posted week 44 if you submit) ---
  // "says your artist name and your expected to get your first nomination for “song name” and if it’s a feature it says with. It will say this smash hit (if over 100M streams or over 1M sales), otherwise it will say this mediocre single is forecasted and the categories it is for… dual image is artist and song cover."
  if (
    newDate.week === 44 &&
    artistData.hasGrammyGuruWeek44ForecastTweetedYear !== newDate.year &&
    userSubmissions.length > 0 &&
    (!artistData.grammyHistory || artistData.grammyHistory.length === 0)
  ) {
    const candidateSongs = userSubmissions
      .map((sub: any) => artistData.songs.find((s) => s.id === sub.itemId))
      .filter((s): s is Song => !!s);
    const forecastSong = (candidateSongs.length > 0 ? candidateSongs : thisYearSongs)
      .sort((a, b) => (b.streams || 0) - (a.streams || 0))[0];

    if (forecastSong) {
      let withFeatureText = "";
      if (forecastSong.collaboration?.artistName) {
        withFeatureText = ` with ${forecastSong.collaboration.artistName}`;
      } else if (forecastSong.features && forecastSong.features.length > 0) {
        withFeatureText = ` with ${forecastSong.features.join(", ")}`;
      }

      const isSmash = (forecastSong.streams || 0) >= 100000000 || (forecastSong.sales || 0) >= 1000000;
      const descriptor = isSmash ? "The smash hit" : "The mediocre single";

      let predictedCat = "Best Pop Solo Performance";
      if (forecastSong.collaboration || (forecastSong.features && forecastSong.features.length > 0)) {
        predictedCat = "Best Pop Duo/Group Performance";
      } else if (forecastSong.genre === "Dance" || forecastSong.genre === "Electronic") {
        predictedCat = "Best Dance Pop Recording";
      } else if (forecastSong.genre === "Hip Hop" || forecastSong.genre === "Rap") {
        predictedCat = "Best Rap Performance";
      } else if (forecastSong.genre === "R&B") {
        predictedCat = "Best R&B Performance";
      } else if (forecastSong.genre === "Country") {
        predictedCat = "Best Country Solo Performance";
      }

      const content = `${artistName} is expected to earn ${pronouns.poss} first-ever #GRAMMYs 🪩 nomination for "${forecastSong.title}"${withFeatureText}.\n\n${descriptor} is strongly forecasted for a nomination in ${predictedCat}, and could contend in more categories.`;

      postsToAdd.push({
        id: crypto.randomUUID(),
        authorId: "thegrammyguru",
        content,
        image: artistImage,
        image2: forecastSong.coverArt || artistImage,
        likes: Math.floor(Math.random() * 12000) + 3000,
        retweets: Math.floor(Math.random() * 3000) + 600,
        views: Math.floor(Math.random() * 140000) + 40000,
        date: newDate,
      });

      updatedArtistDataFields.hasGrammyGuruWeek44ForecastTweetedYear = newDate.year;
    }
  }

  // --- TWEET 4: Fourth tweet (User only + 50% chance of one other NPC) ---
  // "it’s posted when you get a first nomination (or few) without best new artist (only posted if you were never nominated, and weren’t eligible. Should only be posted once ever."
  if (
    newDate.week === 45 &&
    grammyNominations &&
    !artistData.hasGrammyGuruBnaRejectedTweeted &&
    (!artistData.grammyHistory || artistData.grammyHistory.length === 0)
  ) {
    const artistNoms = grammyNominations.flatMap((cat: any) =>
      (cat.nominees || []).filter((nom: any) => nom.isPlayer && (nom.artistName === artistName || nom.artistName?.includes(artistName)))
    );

    const hasBnaNom = grammyNominations.some(
      (cat: any) => cat.name === "Best New Artist" && (cat.nominees || []).some((nom: any) => nom.isPlayer && (nom.artistName === artistName || nom.artistName?.includes(artistName)))
    );

    const firstYear = artistData.debutSingleDate?.year ||
      (artistData.releases.length > 0 ? Math.min(...artistData.releases.map((r) => r.releaseDate?.year || newDate.year)) : newDate.year);
    const wasBnaIneligible = firstYear < newDate.year || !!artistData.hasSubmittedForBestNewArtist;

    if (artistNoms.length > 0 && !hasBnaNom && wasBnaIneligible) {
      const includeNpc = Math.random() < 0.50;
      const pool = ["Dominic Fike", "Megan Moroney", "Tate McRae", "Chappell Roan", "Noah Kahan", "Laufey", "Teddy Swims"];
      const npcChoice = pool[Math.floor(Math.random() * pool.length)];

      const subjectLine = includeNpc
        ? `The Recording Academy's Screening Committee rejected ${artistName} and ${npcChoice}'s submissions for Best New Artist at the ${ceremonyYear} #GRAMMYs 🪩 , according to HITSDD.`
        : `The Recording Academy's Screening Committee rejected ${artistName}'s submission for Best New Artist at the ${ceremonyYear} #GRAMMYs 🪩 , according to HITSDD.`;

      const content = `${subjectLine}\n\nThis continues Best New Artist's infamous history of subjective, ever-changing and inconsistent eligibility rules.`;

      const npcCover = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop";

      postsToAdd.push({
        id: crypto.randomUUID(),
        authorId: "thegrammyguru",
        content,
        image: artistImage,
        image2: includeNpc ? npcCover : (artistData.artistImages?.[1] || artistImage),
        likes: Math.floor(Math.random() * 25000) + 8000,
        retweets: Math.floor(Math.random() * 5000) + 1200,
        views: Math.floor(Math.random() * 350000) + 80000,
        date: newDate,
      });

      updatedArtistDataFields.hasGrammyGuruBnaRejectedTweeted = true;
    }
  }

  // --- TWEET 5: Fifth tweet (User only) ---
  // "fans may say your artist name during week 40-45 and Grammys guru will quote it with the amount of submissions you have. 75% chance if you have over one submissions. 100% chance if you have zero."
  if (
    newDate.week >= 40 &&
    newDate.week <= 45 &&
    artistData.hasGrammyGuruFanQuoteTweetedYear !== newDate.year
  ) {
    const subCount = userSubmissions.length;
    const shouldQuote = subCount === 0 ? true : Math.random() < 0.75;

    if (shouldQuote) {
      const fanId = "fan_guru_" + Math.random().toString(36).substring(7);
      const fanNames = ["ADRIAN ✰", "CAMERON 🪐", "JORDAN ✨", "KAI 🕊️", "TAYLOR 🪩", "ALEX 🎧"];
      const fanHandles = ["SweetBoyAdrian", "cameronsversion", "jordansrecords", "kaiontour", "taylorhits", "alexcharts"];
      const rIdx = Math.floor(Math.random() * fanNames.length);

      const fanUser: XUser = {
        id: fanId,
        name: fanNames[rIdx],
        username: fanHandles[rIdx],
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
        isVerified: false,
        bio: `music fan`,
        followersCount: Math.floor(Math.random() * 5000) + 400,
        followingCount: 150,
      };

      if (!artistData.xUsers.some((u) => u.id === fanId)) {
        artistData.xUsers.push(fanUser);
      }

      const fanPost: XPost = {
        id: crypto.randomUUID(),
        authorId: fanId,
        content: artistName,
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop",
        likes: Math.floor(Math.random() * 4000) + 1200,
        retweets: Math.floor(Math.random() * 800) + 200,
        views: Math.floor(Math.random() * 60000) + 15000,
        date: newDate,
      };

      const countStr = subCount === 0 ? "zero submissions" : subCount === 1 ? "1 submission" : `${subCount} submissions`;
      const guruQuotePost: XPost = {
        id: crypto.randomUUID(),
        authorId: "thegrammyguru",
        content: `${artistName} has ${countStr} for the ${ceremonyYear} #GRAMMYs 🪩 .`,
        quoteOf: fanPost,
        likes: Math.floor(Math.random() * 15000) + 4000,
        retweets: Math.floor(Math.random() * 3000) + 800,
        views: Math.floor(Math.random() * 220000) + 50000,
        date: newDate,
      };

      postsToAdd.push(fanPost);
      postsToAdd.push(guruQuotePost);

      updatedArtistDataFields.hasGrammyGuruFanQuoteTweetedYear = newDate.year;
    }
  }

  // --- TWEET 6: Sixth tweet (User only) ---
  // "if you have a single with a secondary genre and for example submit to best r&b song but the song is r&b and secondary trap. It’s possible it gets moved to the best rap song category if Grammy committee wants (so a tweet like this would be generated)"
  if (
    newDate.week >= 40 &&
    newDate.week <= 43 &&
    artistData.hasGrammyGuruGenreMoveTweetedYear !== newDate.year
  ) {
    const crossGenreSong = thisYearSongs.find((s) => s.secondaryGenre || s.subgenre) ||
      thisYearSongs.find((s) => ["R&B", "Pop", "Hip Hop", "Dance", "Country", "Rock"].includes(s.genre));

    if (crossGenreSong) {
      const primary = crossGenreSong.genre;
      const secondary = crossGenreSong.secondaryGenre || crossGenreSong.subgenre ||
        (primary === "R&B" ? "Trap" : primary === "Pop" ? "Dance" : primary === "Hip Hop" ? "Pop" : "Alternative");

      let catA = "Best Pop Solo Performance";
      let catB = "Best Dance Pop Recording";

      if (primary === "R&B" && (secondary === "Trap" || secondary === "Hip Hop")) {
        catA = "Best Progressive R&B Album";
        catB = "Best Rap Song";
      } else if (primary === "Pop" && (secondary === "Dance" || secondary === "Electronic")) {
        catA = "Best Pop Vocal Album";
        catB = "Best Dance Pop Recording";
      } else if (primary === "Hip Hop" && (secondary === "R&B" || secondary === "Melodic")) {
        catA = "Best Rap Song";
        catB = "Best Melodic Rap Performance";
      } else if (primary === "Country" && secondary === "Pop") {
        catA = "Best Country Solo Performance";
        catB = "Best Pop Solo Performance";
      }

      const lastName = artistName.split(" ").slice(-1)[0] || artistName;
      const isAlbum = topAlbum && topAlbum.songIds.includes(crossGenreSong.id);
      const itemTypeStr = isAlbum ? "album" : "single";
      const content = `'${crossGenreSong.title}' by ${artistName} will be eligible at the ${ceremonyYear} #GRAMMYs 🪩 . However, due to its genre-bending sound, it is uncertain if it will end up placed in ${catA} or ${catB}.\n\n${lastName} is allowed to submit the ${itemTypeStr} to any genre category ${pronouns.subj} pleases, but the Recording Academy's Screening Committee will be able to move it if they disagree with the ${itemTypeStr}'s genre placement.`;

      postsToAdd.push({
        id: crypto.randomUUID(),
        authorId: "thegrammyguru",
        content,
        image: crossGenreSong.coverArt || artistImage,
        image2: artistImage,
        likes: Math.floor(Math.random() * 9500) + 2000,
        retweets: Math.floor(Math.random() * 2200) + 400,
        views: Math.floor(Math.random() * 110000) + 30000,
        date: newDate,
      });

      updatedArtistDataFields.hasGrammyGuruGenreMoveTweetedYear = newDate.year;
    }
  }

  // --- TWEET 7: Seventh tweet (User + NPCs) ---
  // "Grammy Guru posts this on week 44 final predictions for each Grammy category. (And generates a special image with the npc and user their images with the song predicted to earn a nomination)"
  if (
    newDate.week === 44 &&
    artistData.hasGrammyGuruPredictionsTweetedYear !== newDate.year
  ) {
    let targetCat = "Best Pop Solo Performance";
    let playerTrack = topSong;

    if (topSong) {
      if (topSong.genre === "Dance" || topSong.genre === "Electronic" || topSong.secondaryGenre === "Dance") {
        targetCat = "Best Dance Pop Recording";
      } else if (topSong.collaboration || (topSong.features && topSong.features.length > 0)) {
        targetCat = "Best Pop Duo/Group Performance";
      } else if (topSong.genre === "Hip Hop" || topSong.genre === "Rap") {
        targetCat = "Best Rap Song";
      } else if (topSong.genre === "R&B") {
        targetCat = "Best R&B Performance";
      } else if (topSong.streams > 25000000) {
        targetCat = "Record of the Year";
      }
    }

    // Gather distinct in-game NPC songs matching category or top in-game songs
    const userArtistLower = artistName.toLowerCase();
    const seenArtists = new Set<string>();
    seenArtists.add(userArtistLower);

    // 1. Try category matching in-game NPC songs
    const categoryNpcSongs = (npcs || []).filter((s: any) => {
      if (!s?.title || !s?.artist) return false;
      const artistLower = s.artist.toLowerCase();
      if (seenArtists.has(artistLower)) return false;

      if (targetCat === "Best Pop Solo Performance") {
        return s.genre === "Pop";
      } else if (targetCat === "Best Dance Pop Recording") {
        return s.genre === "Dance" || s.genre === "Electronic" || s.genre === "Pop";
      } else if (targetCat === "Best Rap Song") {
        return s.genre === "Hip Hop" || s.genre === "Rap";
      } else if (targetCat === "Best R&B Performance" || targetCat === "Best R&B Song") {
        return s.genre === "R&B";
      }
      return true; // ROTY / SOTY
    });

    const chosenNpcSongs: any[] = [];
    const sortedCategorySongs = [...categoryNpcSongs].sort((a, b) => (b.basePopularity || 0) - (a.basePopularity || 0));

    for (const song of sortedCategorySongs) {
      const aLower = song.artist.toLowerCase();
      if (!seenArtists.has(aLower)) {
        seenArtists.add(aLower);
        chosenNpcSongs.push(song);
      }
      if (chosenNpcSongs.length >= 6) break;
    }

    // 2. If we need more to reach 6 distinct NPCs, pull from general in-game npcs list
    if (chosenNpcSongs.length < 6 && npcs) {
      const sortedAllNpcs = [...npcs].sort((a, b) => (b.basePopularity || 0) - (a.basePopularity || 0));
      for (const song of sortedAllNpcs) {
        if (!song?.title || !song?.artist) continue;
        const aLower = song.artist.toLowerCase();
        if (!seenArtists.has(aLower)) {
          seenArtists.add(aLower);
          chosenNpcSongs.push(song);
        }
        if (chosenNpcSongs.length >= 6) break;
      }
    }

    // Map to contender objects with in-game pictures/covers
    const inGameNpcContenders: ContenderCardInfo[] = chosenNpcSongs.map((song) => {
      const artistImg = getArtistImage(song.artist);
      const cover = song.coverArt || artistImg || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop";
      return {
        artist: song.artist,
        title: song.title,
        cover,
      };
    });

    const contenders: ContenderCardInfo[] = [];
    let alternateContender: { artist: string; title: string };

    if (playerTrack) {
      contenders.push({
        artist: artistName,
        title: playerTrack.title,
        cover: playerTrack.coverArt || artistImage,
      });
      contenders.push(...inGameNpcContenders.slice(0, 4));
      const altNpc = inGameNpcContenders[4] || inGameNpcContenders[0] || { artist: "NPC Artist", title: "Track" };
      alternateContender = { artist: altNpc.artist, title: altNpc.title };
    } else {
      contenders.push(...inGameNpcContenders.slice(0, 5));
      const altNpc = inGameNpcContenders[5] || inGameNpcContenders[0] || { artist: "NPC Artist", title: "Track" };
      alternateContender = { artist: altNpc.artist, title: altNpc.title };
    }

    const posterImage = generateGrammyGuruPredictionsPoster(targetCat, ceremonyYear, contenders);

    const bulletList = contenders.map((c) => `• ${c.artist} - "${c.title}"`).join("\n");
    const content = `The Grammy Guru's final predictions for ${targetCat} nominations at the ${ceremonyYear} #GRAMMYs 🪩 :\n\n${bulletList}\n\nAlternate: ${alternateContender.artist} - "${alternateContender.title}"`;

    postsToAdd.push({
      id: crypto.randomUUID(),
      authorId: "thegrammyguru",
      content,
      image: posterImage,
      likes: Math.floor(Math.random() * 22000) + 6000,
      retweets: Math.floor(Math.random() * 5000) + 1200,
      views: Math.floor(Math.random() * 300000) + 80000,
      date: newDate,
    });

    updatedArtistDataFields.hasGrammyGuruPredictionsTweetedYear = newDate.year;
  }

  return { postsToAdd, updatedArtistDataFields };
};

