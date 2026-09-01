import React, {
  createContext,
  useReducer,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { db, getActiveSaveId, separateMediaFromState, injectMediaIntoState } from "../db/db";
import { useFirebase } from "./FirebaseContext";

import type {
  GameState,
  GameAction,
  Email,
  NpcSong,
  ChartEntry,
  ChartHistory,
  ArtistData,
  Artist,
  Group,
  Song,
  LabelSubmission,
  Contract,
  Release,
  XUser,
  XPost,
  XTrend,
  XChat,
  CustomLabel,
  PopBaseOffer,
  NpcAlbum,
  AlbumChartEntry,
  RedMicProState,
  GrammyCategory,
  GrammyAward,
  GrammyContender,
  AmaCategory,
  AmaAward,
  AmaContender,
  AmaCategoryName,
  BritCategory,
  BritAward,
  BritContender,
  BritCategoryName,
  OscarCategory,
  OscarAward,
  OscarContender,
  OnlyFansProfile,
  OnlyFansPost,
  XSuspensionStatus,
  SoundtrackAlbum,
  SoundtrackTrack,
  Manager,
  SecurityTeam,
  Label,
  VoguePhotoshoot,
  FeatureOffer,
} from "../types";
import { formatMarriageDuration } from "../utils/relationshipUtils";
import {
  INITIAL_MONEY,
  STREAM_INCOME_MULTIPLIER,
  SUBSCRIBER_THRESHOLD_STORE,
  VIEW_INCOME_MULTIPLIER,
  NPC_ARTIST_NAMES, NPC_ERAS,
  NPC_ARTIST_GENRES,
  NPC_SONG_ADJECTIVES,
  NPC_SONG_NOUNS,
  NPC_ARTIST_IMAGES,
  getArtistImage,
  LABELS,
  PLAYLIST_PITCH_COST,
  PLAYLIST_PITCH_SUCCESS_RATE,
  PLAYLIST_BOOST_MULTIPLIER,
  PLAYLIST_BOOST_WEEKS,
  GENRES,
  MANAGERS,
  SECURITY_TEAMS,
  GIGS,
  TALENT_AGENCIES,
} from "../constants";
import {
  RADIO_FORMATS,
  getRadioFormatById,
  getFormatCompatibilityMultiplier,
  normalizeRadioFormatId,
  calculateMultiFormatWeights,
  getFormatMaxImpressions,
} from "../constants/radioFormats";
import { generateWeeklyXContent, formatChartDataHot100Post } from "../utils/xContentGenerator";
import { REAL_WORLD_DISCOGRAPHIES } from "../realWorldDiscographies";
import { ActiveEncounter, EncounterChoice } from "../types";
import { createDefaultContract } from "../utils/contractUtils";

function createGovernmentDivorceEmail(
  artistName: string,
  partnerName: string,
  relationshipId: string,
  settlement: {
    custody: "player" | "joint" | "partner";
    alimonyPayor: "player" | "partner" | "none";
    alimonyAmount: number;
    childSupportPayor: "player" | "partner" | "none";
    childSupportAmount: number;
  },
  hasKidsWithPartner: boolean,
  date: { week: number; year: number }
): Email {
  const custodyText = !hasKidsWithPartner
    ? "N/A (No Minor Children)"
    : settlement.custody === "player"
    ? `Full Custody awarded to ${artistName}`
    : settlement.custody === "partner"
    ? `Full Custody awarded to ${partnerName}`
    : "Joint Custody (50/50 Equal Division)";

  const alimonyText =
    settlement.alimonyPayor === "none" || !settlement.alimonyAmount
      ? "None ($0/month)"
      : settlement.alimonyPayor === "player"
      ? `$${settlement.alimonyAmount.toLocaleString()}/month paid by ${artistName} to ${partnerName}`
      : `$${settlement.alimonyAmount.toLocaleString()}/month paid by ${partnerName} to ${artistName}`;

  const childSupportText =
    settlement.childSupportPayor === "none" || !settlement.childSupportAmount
      ? "None ($0/month)"
      : settlement.childSupportPayor === "player"
      ? `$${settlement.childSupportAmount.toLocaleString()}/month paid by ${artistName} to ${partnerName}`
      : `$${settlement.childSupportAmount.toLocaleString()}/month paid by ${partnerName} to ${artistName}`;

  return {
    id: crypto.randomUUID(),
    sender: "Department of Family Law (Government)",
    senderIcon: "business",
    subject: `OFFICIAL NOTICE: Final Divorce Decree - ${artistName} & ${partnerName}`,
    body: `SUPERIOR COURT OF CALIFORNIA - FAMILY LAW DIVISION
OFFICIAL DECREE OF DISSOLUTION OF MARRIAGE

Case Reference: DIV-${relationshipId.slice(0, 8).toUpperCase()}
Petitioner / Spouse A: ${artistName}
Respondent / Spouse B: ${partnerName}

This official government notice certifies that the marriage between ${artistName} and ${partnerName} has been legally dissolved and finalized by court order.

FINAL JUDGMENT & SETTLEMENT TERMS:
â€¢ Child Custody: ${custodyText}
â€¢ Spousal Support (Alimony): ${alimonyText}
â€¢ Child Support: ${childSupportText}

This decree is final, legally binding, and registered in state domestic records.`,
    date: date,
    isRead: false,
  };
}

export const getPossibleEncounters = (
  artist: Artist | Group,
  artistData: ArtistData,
  year: number,
): ActiveEncounter[] => {
  const isGroup = artist.type === "group";
  const isMarried = artistData.relationships?.some(
    (r) => r.status === "married",
  );
  const activePartner = artistData.relationships?.find(
    (r) => r.status === "dating" || r.status === "engaged" || r.status === "married"
  );

  const encounters: ActiveEncounter[] = [

    {
      id: "lawsuit_copyright",
      text: "You are being sued by an underground artist who claims you stole their melody for your latest hit. They are demanding a massive payout.",
      requiresImage: false,
      choices: [
        {
          label: "Settle out of court ($2M)",
          tweetTemplate: "{artist} settles copyright lawsuit out of court for $2M. GUILTY much? â˜•",
          authorName: "Pop Crave",
          isTMZ: false,
          publicImageEffect: -2,
          hypeEffect: 1,
          moneyEffect: -2000000
        },
        {
          label: "Fight in court (50% chance to lose $5M)",
          tweetTemplate: "{artist} refuses to settle and goes to trial over copyright claim!",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: 3,
          hypeEffect: 5,
          // We will handle the money effect in the component or just make a safe assumption
          moneyEffect: Math.random() > 0.5 ? -5000000 : -100000
        }
      ]
    },
    {
      id: "lawsuit_fan_war",
      text: "A rival artist's fan is suing you because your fan base relentlessly bullied and doxxed them after a subtle shade tweet you made.",
      requiresImage: false,
      choices: [
        {
          label: "Pay their legal fees & apologize ($500k)",
          tweetTemplate: "{artist} apologizes for toxic fans and pays victim's legal fees. Respect.",
          authorName: "Pop Base",
          isTMZ: false,
          publicImageEffect: 5,
          hypeEffect: -2,
          moneyEffect: -500000
        },
        {
          label: "Countersue for defamation ($1M)",
          tweetTemplate: "{artist} is COUNTERSUING the fan who sued them! This is getting messy ðŸ˜­",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -8,
          hypeEffect: 10,
          moneyEffect: -1000000
        }
      ]
    },

    {
      id: "music_release",
      text: "A fan approaches you while you are out getting coffee and asks when you are releasing new music.",
      requiresImage: true,
      choices: [
        {
          label: 'Say "Soon"',
          tweetTemplate: '"{artist} said new music is coming soon! ðŸ˜­"',
          authorName: "Pop Crave",
          isTMZ: false,
          publicImageEffect: 2,
          hypeEffect: 5,
        },
        {
          label: "Ignore them",
          tweetTemplate:
            "{artist} completely ignored a fan asking about new music... ðŸ’€",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -5,
          hypeEffect: 2,
        },
        {
          label: "Yell at them",
          tweetTemplate:
            "{artist} yells at a fan asking for new music!! Disgusting behavior.",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -15,
          hypeEffect: 10,
        },
      ],
    },
    {
      id: "how_many_likes",
      text: 'A fan with a camera runs up to you: "How many likes for us to do a song together??"',
      requiresImage: true,
      choices: [
        {
          label: "50k likes",
          tweetTemplate:
            "asking {artist} how many likes to do a song ðŸ˜­ they said 50k!",
          authorName: "RandomFan",
          isTMZ: false,
          publicImageEffect: 3,
          hypeEffect: 2,
        },
        {
          label: "500k likes",
          tweetTemplate:
            "asking {artist} how many likes to do a song ðŸ˜­ they said 500k!",
          authorName: "RandomFan",
          isTMZ: false,
          publicImageEffect: 5,
          hypeEffect: 3,
        },
        {
          label: "1M likes",
          tweetTemplate:
            "asking {artist} how many likes to do a song ðŸ˜­ 1 MILLION?!",
          authorName: "RandomFan",
          isTMZ: false,
          publicImageEffect: 3,
          hypeEffect: 1,
        },
        {
          label: "Ignore",
          tweetTemplate:
            "{artist} walks right past a fan offering a collab... rude much?",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -5,
          hypeEffect: 2,
        },
        {
          label: "Yell at them",
          tweetTemplate: "{artist} goes off on a fan offering a collab. YIKES.",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -15,
          hypeEffect: 10,
        },
      ],
    },
    {
      id: "outfit_praise",
      text: "A fan points out your outfit and asks where you got it from.",
      requiresImage: true,
      choices: [
        {
          label: "Tell them",
          tweetTemplate:
            '"{artist} is so humble, they told me where their outfit is from! âœ¨"',
          authorName: "FashionFan",
          isTMZ: false,
          publicImageEffect: 5,
          hypeEffect: 2,
        },
        {
          label: '"It\'s custom"',
          tweetTemplate:
            '"{artist} says their outfit is custom. We love a fashion icon!"',
          authorName: "Pop Crave",
          isTMZ: false,
          publicImageEffect: 2,
          hypeEffect: 3,
        },
        {
          label: "Ignore",
          tweetTemplate:
            "{artist} completely ignores a fan complimenting their outfit ðŸ™„",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -3,
          hypeEffect: 1,
        },
      ],
    },
  ];


  if (activePartner) {
    encounters.push({
      id: "partner_asks_money",
      text: `Your partner ${activePartner.partnerName} tells you they want to start a business and asks you for $1,000,000 to get it off the ground.`,
      requiresImage: false,
      choices: [
        {
          label: "Give them $1,000,000",
          tweetTemplate: "{artist}'s partner just launched a new business! ðŸ’¸",
          authorName: "Pop Base",
          isTMZ: false,
          publicImageEffect: 2,
          hypeEffect: 1,
          moneyEffect: -1000000
        },
        {
          label: "Refuse",
          tweetTemplate: "Sources say {artist} and their partner got into a huge fight over money.",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -3,
          hypeEffect: 5,
          moneyEffect: 0
        }
      ]
    });
  }

  if (isMarried) {
    encounters.push(
      {
        id: "lawsuit_divorce",
        text: `Your spouse ${activePartner?.partnerName || 'spouse'} has filed for DIVORCE! They are demanding a massive settlement and it's all over the tabloids.`,
        requiresImage: false,
        choices: [
          {
            label: "Sign the papers ($5M)",
            tweetTemplate: `#{artist} has filed for divorce from #${activePartner?.partnerName?.replace(/\s/g, '') || 'spouse'}. The settlement was MASSIVE ðŸ’”`,
            authorName: "TMZ",
            isTMZ: true,
            publicImageEffect: -5,
            hypeEffect: 15,
            moneyEffect: -5000000
          },

          {
            label: "Fight for assets ($2M legal fees)",
            tweetTemplate: "{artist} is fighting their ex in court! The divorce is getting UGLY.",
            authorName: "TMZ",
            isTMZ: true,
            publicImageEffect: -10,
            hypeEffect: 20,
            moneyEffect: -2000000
          }
        ]
      },
      {
        id: "lawsuit_annulment",
        text: "Your spouse is filing for an ANNULMENT! They claim the marriage was a sham and want monthly compensation.",
        requiresImage: false,
        choices: [
          {
            label: "Grant annulment ($50k/month)",
            tweetTemplate: "{artist}'s marriage annulled! Rumor has it they are paying a monthly fee...",
            authorName: "Pop Crave",
            isTMZ: false,
            publicImageEffect: -2,
            hypeEffect: 5,
            moneyEffect: 0
          },
          {
            label: "Deny and drag it out ($1M)",
            tweetTemplate: "{artist} denies annulment request, forcing a messy public trial!",
            authorName: "TMZ",
            isTMZ: true,
            publicImageEffect: -8,
            hypeEffect: 12,
            moneyEffect: -1000000
          }
        ]
      }
    );
  }

  const hasExes = artistData.relationships?.some(r => r.status === "ex");
  if (hasExes) {
    encounters.push(
      {
        id: "lawsuit_child_support",
        text: `Your ex is suing you for CHILD SUPPORT! They are demanding a hefty monthly payment.`,
        requiresImage: false,
        choices: [
          {
            label: "Agree to pay ($25k/month)",
            tweetTemplate: `#{artist} agrees to pay child support. A responsible parent! ðŸ¼`,
            authorName: "Pop Base",
            isTMZ: false,
            publicImageEffect: 5,
            hypeEffect: 0,
            moneyEffect: 0
          },
          {
            label: "Fight the claim ($500k)",
            tweetTemplate: "{artist} is fighting their ex over child support... not a good look ðŸ˜¬",
            authorName: "TMZ",
            isTMZ: true,
            publicImageEffect: -15,
            hypeEffect: 5,
            moneyEffect: -500000
          }
        ]
      }
    );
  }

  if (isGroup) {
    encounters.push({
      id: "group_relationship",
      text: 'Paparazzi ambush you: "What is your relationship really like with the other group members?"',
      requiresImage: true,
      choices: [
        {
          label: '"They are my family"',
          tweetTemplate:
            '"{artist} says the group is like family! So sweet ðŸ¥º"',
          authorName: "Pop Crave",
          isTMZ: false,
          publicImageEffect: 5,
          hypeEffect: 2,
        },
        {
          label: '"We hate each other"',
          tweetTemplate:
            "{artist} ADMITS they hate their group members! The drama! ðŸ˜±",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -10,
          hypeEffect: 20,
        },
        {
          label: "Ignore",
          tweetTemplate: "{artist} stays silent on group drama rumors...",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -2,
          hypeEffect: 2,
        },
        {
          label: 'Yell "Leave us alone!"',
          tweetTemplate:
            "{artist} SNAPS at paparazzi asking about group members.",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -5,
          hypeEffect: 8,
        },
      ],
    });
  }

  if (isMarried) {
    encounters.push({
      id: "marriage",
      text: 'Paparazzi: "How is married life treating you?"',
      requiresImage: true,
      choices: [
        {
          label: '"Happily married!"',
          tweetTemplate:
            '"{artist} smiling and says they are happily married! â¤ï¸"',
          authorName: "Pop Crave",
          isTMZ: false,
          publicImageEffect: 5,
          hypeEffect: 2,
        },
        {
          label: "Ignore",
          tweetTemplate:
            "{artist} ignores questions about their marriage... trouble in paradise?",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -5,
          hypeEffect: 5,
        },
        {
          label: "Yell at them",
          tweetTemplate:
            "{artist} yells at paparazzi for asking about their marriage.",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -10,
          hypeEffect: 8,
        },
      ],
    });
  }

  return encounters;
};

export const formatNumber = (num: number): string => {
  if (isNaN(num)) return "0";
  const number = Math.floor(num);

  if (number >= 1e12) {
    return (number / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
  }
  if (number >= 1e9) {
    return (number / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (number >= 1e6) {
    return (number / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (number >= 1e3) {
    return (number / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return number.toLocaleString();
};

export const getFutureDate = (
  currentDate: GameDate,
  weeksOffset: number,
): GameDate => {
  let year = currentDate.year;
  let week = currentDate.week + weeksOffset;
  while (week > 52) {
    week -= 52;
    year++;
  }
  return { year, week, day: 1 };
};

const getSongCertification = (
  streams: number,
): { level: string; multiplier: number } | null => {
  const DIAMOND = 1_200_000_000;
  const PLATINUM = 100_000_000;
  const GOLD = 60_000_000;

  if (streams >= DIAMOND)
    return { level: "Diamond", multiplier: Math.floor(streams / DIAMOND) };
  if (streams >= PLATINUM)
    return { level: "Platinum", multiplier: Math.floor(streams / PLATINUM) };
  if (streams >= GOLD) return { level: "Gold", multiplier: 1 };
  return null;
};

const getAlbumCertification = (
  units: number,
): { level: string; multiplier: number } | null => {
  const DIAMOND = 10_000_000;
  const PLATINUM = 1_000_000;
  const GOLD = 500_000;

  if (units >= DIAMOND)
    return { level: "Diamond", multiplier: Math.floor(units / DIAMOND) };
  if (units >= PLATINUM)
    return { level: "Platinum", multiplier: Math.floor(units / PLATINUM) };
  if (units >= GOLD) return { level: "Gold", multiplier: 1 };
  return null;
};

const formatCertification = (
  cert: { level: string; multiplier: number } | null,
): string | null => {
  if (!cert) return null;
  if (cert.multiplier > 1 && cert.level !== "Gold") {
    return `${cert.multiplier}x ${cert.level}`;
  }
  return cert.level;
};

const formatMonthDay = (gameDate: GameDate, dayOffset: number = 0): string => {
  const date = new Date(gameDate.year, 0, 1);
  const baseDays = (gameDate.week - 1) * 7 + (gameDate.day ? gameDate.day - 1 : 0) + dayOffset;
  date.setDate(date.getDate() + baseDays);
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
  });
};

const getRandomNpcName = (excludedNames: (string | undefined)[] = [], currentYear?: number): string => {
  let name = "";
  let attempts = 0;
  const lowerExcluded = excludedNames.filter((n): n is string => !!n).map((n) => n.toLowerCase());
  
  // Filter available artists by era if currentYear is provided
  let availableArtists = NPC_ARTIST_NAMES;
  if (currentYear) {
    const eraArtists = Object.keys(NPC_ERAS).filter(artist => {
      const era = NPC_ERAS[artist];
      return era && currentYear >= era.start && currentYear <= era.end;
    });
    
    if (eraArtists.length > 0) {
      availableArtists = eraArtists;
    }
  }

  do {
    name = availableArtists[Math.floor(Math.random() * availableArtists.length)] || NPC_ARTIST_NAMES[0];
    attempts++;
  } while (lowerExcluded.includes(name.toLowerCase()) && attempts < 50);
  return name;
};

const generateNpcs = (
  count: number,
  existingNpcs: NpcSong[] = [],
  npcImages?: Record<string, string>,
  excludedNames: string[] = [],
  currentYear?: number
): NpcSong[] => {
  const npcs: NpcSong[] = [];
  const usedNames = new Set<string>(
    existingNpcs.map((npc) => `${npc.title}-${npc.artist}`),
  );

  for (let i = 0; i < count; i++) {
    let title = "";
    let artist = "";
    let combo = "";
    let attempts = 0;

    let baseArtist = "";
    do {
      baseArtist = getRandomNpcName(excludedNames, currentYear);
      let displayArtist = baseArtist;

      if (Math.random() < 0.05) {
        // 5% chance
        let collabArtist = baseArtist;
        while (collabArtist === baseArtist) {
          collabArtist = getRandomNpcName(excludedNames, currentYear);
        }
        displayArtist = `${baseArtist}, ${collabArtist}`;
      }

      artist = displayArtist;

      // Try to get a real song
      const realDisco = REAL_WORLD_DISCOGRAPHIES[baseArtist];
      if (realDisco && realDisco.songs.length > 0 && Math.random() < 0.8) {
        // 80% chance to pick a real song if available
        // Filter out songs already used by this artist
        const availableSongs = realDisco.songs.filter(
          (s) => !usedNames.has(`${s}-${artist}`),
        );
        if (availableSongs.length > 0) {
          title =
            availableSongs[Math.floor(Math.random() * availableSongs.length)];
        }
      }

      // Fallback to random generator if no real song found or randomly chosen
      if (!title) {
        const adj =
          NPC_SONG_ADJECTIVES[
            Math.floor(Math.random() * NPC_SONG_ADJECTIVES.length)
          ];
        const noun =
          NPC_SONG_NOUNS[Math.floor(Math.random() * NPC_SONG_NOUNS.length)];
        title = `${adj} ${noun}`;
      }

      combo = `${title}-${artist}`;
      attempts++;
    } while (usedNames.has(combo) && attempts < 10);

    // If we couldn't find a unique name in 10 attempts, just add a random suffix to force uniqueness
    if (usedNames.has(combo)) {
      title = `${title} (Remix)`;
      combo = `${title}-${artist}`;
    }

    usedNames.add(combo);

    const basePopularity = Math.floor(
      75_000_000 * Math.exp(-0.04 * (i + existingNpcs.length)),
    );

    npcs.push({
      uniqueId: `npc_${combo.replace(/[^a-zA-Z0-9]/g, "")}`,
      title,
      artist,
      genre:
        NPC_ARTIST_GENRES[baseArtist] ||
        GENRES[Math.floor(Math.random() * GENRES.length)],
      basePopularity,
      coverArt: getArtistImage(baseArtist, npcImages?.[baseArtist]),
    });
  }
  return npcs;
};

const generateNewHits = (
  count: number,
  existingNpcs: NpcSong[],
  npcImages?: Record<string, string>,
  excludedNames: string[] = [],
  currentYear?: number
): NpcSong[] => {
  const hits: NpcSong[] = [];
  const usedNames = new Set<string>(
    existingNpcs.map((npc) => `${npc.title}-${npc.artist}`),
  );

  for (let i = 0; i < count; i++) {
    let title = "";
    let artist = "";
    let combo = "";
    let attempts = 0;

    let baseArtist = "";
    do {
      baseArtist = getRandomNpcName(excludedNames, currentYear);
      let displayArtist = baseArtist;

      if (Math.random() < 0.05) {
        // 5% chance
        let collabArtist = baseArtist;
        while (collabArtist === baseArtist) {
          collabArtist = getRandomNpcName(excludedNames, currentYear);
        }
        displayArtist = `${baseArtist}, ${collabArtist}`;
      }

      artist = displayArtist;

      const realDisco = REAL_WORLD_DISCOGRAPHIES[baseArtist];
      if (realDisco && realDisco.songs.length > 0 && Math.random() < 0.8) {
        const availableSongs = realDisco.songs.filter(
          (s) => !usedNames.has(`${s}-${artist}`),
        );
        if (availableSongs.length > 0) {
          title =
            availableSongs[Math.floor(Math.random() * availableSongs.length)];
        }
      }

      if (!title) {
        const adj =
          NPC_SONG_ADJECTIVES[
            Math.floor(Math.random() * NPC_SONG_ADJECTIVES.length)
          ];
        const noun =
          NPC_SONG_NOUNS[Math.floor(Math.random() * NPC_SONG_NOUNS.length)];
        title = `${adj} ${noun}`;
      }

      combo = `${title}-${artist}`;
      attempts++;
    } while (usedNames.has(combo) && attempts < 10);

    if (usedNames.has(combo)) {
      title = `${title} (Remix)`;
      combo = `${title}-${artist}`;
    }
    usedNames.add(combo);

    const effectiveRank = Math.floor(Math.random() * 100);
    const basePopularity = Math.floor(
      75_000_000 * Math.exp(-0.04 * effectiveRank),
    );

    hits.push({
      uniqueId: `npc_${combo.replace(/[^a-zA-Z0-9]/g, "")}`,
      title,
      artist,
      genre:
        NPC_ARTIST_GENRES[baseArtist] ||
        GENRES[Math.floor(Math.random() * GENRES.length)],
      basePopularity,
      coverArt: getArtistImage(baseArtist, npcImages?.[baseArtist]),
    });
  }
  return hits;
};

const NPC_ALBUM_ADJECTIVES = [
  "Eternal",
  "Chromatic",
  "Digital",
  "Fever",
  "Concrete",
  "Neon",
  "Stardust",
  "Afterparty",
  "American",
  "Broken",
  "Suburban",
  "Melodrama",
];
const NPC_ALBUM_NOUNS = [
  "Summer",
  "Dream",
  "Jungle",
  "Heart",
  "Angel",
  "Sunset",
  "Romance",
  "Fantasy",
  "Youth",
  "Rebellion",
  "Mirage",
  "Odyssey",
];

export function getBillboard200NpcUnits(
  rank: number,
  isMegaLaunch: boolean = false,
  randomSeed: number = Math.random()
): number {
  let minUnits: number;
  let maxUnits: number;

  if (rank === 1) {
    if (isMegaLaunch) {
      minUnits = 400000;
      maxUnits = 1250000;
    } else {
      minUnits = 120000;
      maxUnits = 380000;
    }
  } else if (rank >= 2 && rank <= 5) {
    // #2-5: 50,000 - 100,000+
    const progress = (rank - 2) / 3;
    minUnits = Math.floor(75000 - progress * 25000);
    maxUnits = Math.floor(105000 - progress * 37000);
  } else if (rank >= 6 && rank <= 10) {
    // #6-10: 30,000 - 60,000
    const progress = (rank - 6) / 4;
    minUnits = Math.floor(45000 - progress * 15000);
    maxUnits = Math.floor(58000 - progress * 22000);
  } else if (rank >= 11 && rank <= 25) {
    // #11-25: 20,000 - 40,000
    const progress = (rank - 11) / 14;
    minUnits = Math.floor(28000 - progress * 8000);
    maxUnits = Math.floor(37000 - progress * 13000);
  } else if (rank >= 26 && rank <= 50) {
    // #26-50: 15,000 - 30,000
    const progress = (rank - 26) / 24;
    minUnits = Math.floor(19000 - progress * 4000);
    maxUnits = Math.floor(28000 - progress * 11000);
  } else if (rank >= 51 && rank <= 100) {
    // #51-100: 12,000 - 25,000
    const progress = (rank - 51) / 49;
    minUnits = Math.floor(14500 - progress * 2500);
    maxUnits = Math.floor(22000 - progress * 8500);
  } else if (rank >= 101 && rank <= 150) {
    // #101-150: 10,000 - 18,000
    const progress = (rank - 101) / 49;
    minUnits = Math.floor(11800 - progress * 1800);
    maxUnits = Math.floor(16500 - progress * 5300);
  } else {
    // #151-200: 8,000 - 15,000 (#200 often 8k)
    const progress = Math.min(1, (rank - 151) / 49);
    minUnits = Math.floor(9800 - progress * 1800);
    maxUnits = Math.floor(14000 - progress * 5500);
  }

  const generated = Math.floor(minUnits + randomSeed * (maxUnits - minUnits));
  return Math.max(8000, generated);
}

export function generateInitialBillboardTopAlbums(
  npcAlbums: NpcAlbum[],
  year: number
): AlbumChartEntry[] {
  const sorted = [...npcAlbums].sort(
    (a, b) => (b.salesPotential || 0) - (a.salesPotential || 0)
  );

  const top200 = sorted.slice(0, 200);
  let runningMaxUnits = Infinity;
  const eraConfig = getEraConfiguration(year);

  return top200.map((album, index) => {
    const rank = index + 1;
    const isMegaLaunch = rank === 1 && Math.random() < 0.2;
    let targetUnits = getBillboard200NpcUnits(rank, isMegaLaunch);

    if (targetUnits > runningMaxUnits) {
      targetUnits = Math.max(8000, Math.floor(runningMaxUnits - Math.random() * 50));
    }
    runningMaxUnits = targetUnits;

    const pureRatio = Math.min(
      0.55,
      Math.max(0.15, eraConfig.marketShare.physical + eraConfig.marketShare.digital)
    );
    let weeklySales = Math.floor(targetUnits * pureRatio * (0.85 + Math.random() * 0.3));
    if (weeklySales > targetUnits) weeklySales = Math.floor(targetUnits * 0.5);
    const weeklySES = targetUnits - weeklySales;

    return {
      rank,
      lastWeek: null,
      peak: rank,
      weeksOnChart: Math.floor(Math.random() * 20) + 1,
      title: album.title,
      artist: album.artist,
      label: album.label,
      coverArt: album.coverArt,
      isPlayerAlbum: false,
      albumId: album.uniqueId,
      uniqueId: album.uniqueId,
      weeklyActivity: targetUnits,
      weeklySales,
      weeklySES,
      weeklyPureSales: weeklySales,
    };
  });
}

const generateNpcAlbums = (
  count: number,
  allNpcSongs: NpcSong[],
  npcImages?: Record<string, string>,
): NpcAlbum[] => {
  const albums: NpcAlbum[] = [];
  const labels: Array<NpcAlbum["label"]> = ["UMG", "Republic", "RCA", "Island"];
  let songIndex = 0;

  for (let i = 0; i < count; i++) {
    const albumSongCount = Math.floor(Math.random() * 5) + 8; // 8-12 songs per album
    if (songIndex + albumSongCount > allNpcSongs.length) break;

    const albumSongs = allNpcSongs.slice(songIndex, songIndex + albumSongCount);
    songIndex += albumSongCount;

    if (albumSongs.length === 0) continue;

    const mainArtist = albumSongs[0].artist;
    let title = "";

    // Try to find a real album title
    const realDisco = REAL_WORLD_DISCOGRAPHIES[mainArtist];
    if (realDisco && realDisco.albums.length > 0 && Math.random() < 0.8) {
      title =
        realDisco.albums[Math.floor(Math.random() * realDisco.albums.length)];
    }

    // Fallback if no real title
    if (!title) {
      const adj =
        NPC_ALBUM_ADJECTIVES[
          Math.floor(Math.random() * NPC_ALBUM_ADJECTIVES.length)
        ];
      const noun =
        NPC_ALBUM_NOUNS[Math.floor(Math.random() * NPC_ALBUM_NOUNS.length)];
      title = `${adj} ${noun}`;
    }

    const uniqueId = `npcalbum_${title.replace(/[^a-zA-Z0-9]/g, "")}_${mainArtist.replace(/[^a-zA-Z0-9]/g, "")}`;
    if (albums.some((a) => a.uniqueId === uniqueId)) continue; // Avoid duplicate albums

    // Ensure top tier sales potential spanning from 8k to 350k+
    const salesPotential = Math.floor(Math.pow(Math.random(), 2.2) * 350000) + 8000;

    albums.push({
      uniqueId,
      title,
      artist: mainArtist,
      label: labels[Math.floor(Math.random() * labels.length)],
      coverArt: getArtistImage(mainArtist, npcImages?.[mainArtist]),
      songIds: albumSongs.map((s) => s.uniqueId),
      salesPotential,
    });
  }
  return albums;
};

const initialArtistData: ArtistData = {
  money: INITIAL_MONEY,
  hype: 0,
  peakHype: 0,
  publicImage: 80, // Start as Respected/Beloved
  popularity: 10,
  songs: [],
  releases: [],
  monthlyListeners: 0,
  lastFourWeeksStreams: [],
  lastFourWeeksViews: [],
  youtubeSubscribers: 0,
  tiktokFollowers: 0,
  tiktokVideos: [],
  instagramFollowers: 0,
  instagramPosts: [],
  videos: [],
  youtubeStoreUnlocked: false,
  merch: [],
  merchStoreBanner: null,
  inbox: [],
  streamsThisMonth: 0,
  viewsThisQuarter: 0,
  subsThisQuarter: 0,
  promotions: [],
  performedGigThisWeek: false,
  contract: null,
  contractHistory: [],
  labelSubmissions: [],
  customLabels: [],
  artistImages: [],
  artistVideoThumbnails: [],
  paparazziPhotos: [],
  tourPhotos: [],
  tours: [],
  manager: null,
  securityTeamId: null,
  xUsers: [],
  xPosts: [],
  xChats: [],
  xTrends: [],
  xFollowingIds: [],
  xSuspensionStatus: null,
  followers: 0,
  saves: 0,
  artistPick: null,
  listeningNow: 0,
  streamsHistory: [],
  firstChartEntry: null,
  hasEarnedFirstSoloHot100: false,
  hasEarnedFirstBillboard200No1: false,
  hasAimingFirstHot100Tweeted: false,
  hasEarnedFirstGrammyNomination: false,
  hasEarnedFirstHot100No1: false,
  debutSingleDate: undefined,
  autoCertifications: true,
  redMicPro: {
    unlocked: false,
    subscriptionType: null,
  },
  salesBoost: 0,
  isGoldTheme: false,
  amaHistory: [],
  hasSubmittedForAmaNewArtist: false,
  britHistory: [],
  hasWonBritRisingStar: false,
  hasSubmittedForBritNewArtist: false,
  hasSubmittedForBritRisingStar: false,
  grammyHistory: [],
  hasSubmittedForBestNewArtist: false,
  oscarHistory: [],
  goldenGlobeHistory: [],
  actingRoles: [],
  onlyfans: null,
  fanWarStatus: null,
  // Soundtracks
  soundtrackOfferCount: 0,
  offeredSoundtracks: [],
  weeksUntilNextSoundtrackOffer: Math.floor(Math.random() * 13) + 12, // 12-24 weeks
};

import { getEraConfiguration } from "../utils/eraUtils";

const DEFAULT_SPOTIFY_PLAYLISTS: SpotifyPlaylist[] = [
  {
    id: "tth",
    name: "Today's Top Hits",
    description: "Top hits right now.",
    followers: 34000000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "megahit",
    name: "Mega Hit Mix",
    description: "A mega mix of 75 favorites from the last few years!",
    followers: 11000000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1493225457124-a1a2a5fa51cc?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "global50",
    name: "Global Top 50",
    description: "The most played tracks in the world.",
    followers: 18000000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "rapcaviar",
    name: "RapCaviar",
    description: "New est hip hop.",
    followers: 15000000,
    type: "genre",
    genre: "Hip Hop/Rap",
    coverArt:
      "https://images.unsplash.com/photo-1544785349-c4a5301826fd?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "hiphopcentral",
    name: "Hip-Hop Central",
    description: "The center of Hip-Hop.",
    followers: 8000000,
    type: "genre",
    genre: "Hip Hop/Rap",
    coverArt:
      "https://images.unsplash.com/photo-1549497554-46328dbbd4f7?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "getturnt",
    name: "Get Turnt",
    description: "Mode: Turnt.",
    followers: 6500000,
    type: "genre",
    genre: "Hip Hop/Rap",
    coverArt:
      "https://images.unsplash.com/photo-1517230878791-229b4bb7db64?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "poprising",
    name: "Pop Rising",
    description: "The hits of tomorrow.",
    followers: 3000000,
    type: "genre",
    genre: "Pop",
    coverArt:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "pophits",
    name: "Soft Pop Hits",
    description: "Listen to easy songs from your favorite artists!",
    followers: 7000000,
    type: "genre",
    genre: "Pop",
    coverArt:
      "https://images.unsplash.com/photo-1518098042468-208169123863?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "teenparty",
    name: "Teen Party",
    description: "Turn it up.",
    followers: 4500000,
    type: "genre",
    genre: "Pop",
    coverArt:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "newmusicfriday",
    name: "New Music Friday",
    description: "New music.",
    followers: 4000000,
    type: "new",
    coverArt:
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "justhits",
    name: "Just Hits",
    description: "Current favorites and exciting new music.",
    followers: 3500000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1458560871784-56d23406c091?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "mint",
    name: "mint",
    description: "Electronic.",
    followers: 6000000,
    type: "genre",
    genre: "Dance/Electronic",
    coverArt:
      "https://images.unsplash.com/photo-1570535921867-0c7f711f185c?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "danceparty",
    name: "Dance Party",
    description: "Get ready to dance.",
    followers: 4000000,
    type: "genre",
    genre: "Dance/Electronic",
    coverArt:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "hotcountry",
    name: "Hot Country",
    description: "Country.",
    followers: 7000000,
    type: "genre",
    genre: "Country",
    coverArt:
      "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "countrycoffeehouse",
    name: "Country Coffeehouse",
    description: "A little acoustic country.",
    followers: 2000000,
    type: "genre",
    genre: "Country",
    coverArt:
      "https://images.unsplash.com/photo-1522881451255-f59ad836fdfb?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "rnb",
    name: "Are & Be",
    description: "R&B.",
    followers: 6000000,
    type: "genre",
    genre: "R&B",
    coverArt:
      "https://images.unsplash.com/photo-1619983081563-430f63602796?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "chilledrnb",
    name: "Chilled R&B",
    description: "Chill out with the best R&B.",
    followers: 3000000,
    type: "genre",
    genre: "R&B",
    coverArt:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "rockthis",
    name: "Rock This",
    description: "Rock.",
    followers: 5000000,
    type: "genre",
    genre: "Rock",
    coverArt:
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "rockclassics",
    name: "Rock Classics",
    description: "Rock legends.",
    followers: 11000000,
    type: "genre",
    genre: "Rock",
    coverArt:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "latin",
    name: "Viva Latino",
    description: "Today's top Latin hits.",
    followers: 14000000,
    type: "genre",
    genre: "Latin",
    coverArt:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "bailareggaeton",
    name: "Baila Reggaeton",
    description: "Reggaeton hits.",
    followers: 11000000,
    type: "genre",
    genre: "Latin",
    coverArt:
      "https://images.unsplash.com/photo-1533174000265-e8bb438b9bb2?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "kpop",
    name: "K-Pop ON!",
    description: "The best K-Pop songs.",
    followers: 5000000,
    type: "genre",
    genre: "K-Pop",
    coverArt:
      "https://images.unsplash.com/photo-1598363650965-0ae09efbd3da?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "viral50",
    name: "Viral 50 - Global",
    description: "Viral.",
    followers: 2000000,
    type: "viral",
    coverArt:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "viralhits",
    name: "Viral Hits",
    description: "Viral.",
    followers: 3000000,
    type: "viral",
    coverArt:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "bighit",
    name: "Big on the Internet",
    description: "Currently trending tracks across the internet.",
    followers: 4000000,
    type: "viral",
    coverArt:
      "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "chillhits",
    name: "Chill Hits",
    description: "Kick back to the best new and recent chill hits.",
    followers: 6000000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1499557404179-880945952db5?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "moodbooster",
    name: "Mood Booster",
    description: "Get happy.",
    followers: 5500000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "goodvibes",
    name: "Good Vibes",
    description: "Positive energy.",
    followers: 4000000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1490260400179-d656f04de423?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "singcar",
    name: "Songs to Sing in the Car",
    description: "Sing along and enjoy the drive.",
    followers: 10000000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "coffeetable",
    name: "Coffee Table Jazz",
    description: "Relaxing.",
    followers: 1500000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "beastmode",
    name: "Beast Mode",
    description: "Get your beast mode on!",
    followers: 9500000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "workout",
    name: "Workout",
    description: "Pop workout hits.",
    followers: 6000000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "christmas",
    name: "Christmas Hits",
    description: "The biggest Christmas songs of all time.",
    followers: 5000000,
    type: "genre",
    genre: "Christmas",
    coverArt:
      "https://images.unsplash.com/photo-1543589077-47d81606c1ec?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "indie",
    name: "Lorem",
    description: "Indie songs.",
    followers: 2000000,
    type: "genre",
    genre: "Indie",
    coverArt:
      "https://images.unsplash.com/photo-1482855549413-2a62884c7be6?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "essentialindie",
    name: "Essential Indie",
    description: "The best indie tracks.",
    followers: 3500000,
    type: "genre",
    genre: "Indie",
    coverArt:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "afrobeats",
    name: "African Heat",
    description: "Top Afrobeats.",
    followers: 2500000,
    type: "genre",
    genre: "Afrobeats",
    coverArt:
      "https://images.unsplash.com/photo-1601616858063-4f9e1e765507?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "reggae",
    name: "Dancehall Official",
    description: "Top Reggae.",
    followers: 1500000,
    type: "genre",
    genre: "Reggae",
    coverArt:
      "https://images.unsplash.com/photo-1520696989433-2ba37a90fdd2?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "throwback",
    name: "All Out 2010s",
    description: "The biggest hits of the 2010s.",
    followers: 8000000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "allout00s",
    name: "All Out 00s",
    description: "The biggest hits of the 2000s.",
    followers: 10000000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1493225457124-a1a2a5fa51cc?w=500&h=500&fit=crop",
    tracks: [],
  },
  {
    id: "allout90s",
    name: "All Out 90s",
    description: "The biggest hits of the 1990s.",
    followers: 7000000,
    type: "global",
    coverArt:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop",
    tracks: [],
  },
];

export const DEFAULT_PODCASTS: Podcast[] = [
  {
    id: "pod_joe_rogan",
    name: "The Joe Rogan Experience",
    host: "Joe Rogan",
    description: "The official podcast of comedian Joe Rogan.",
    topics: ["Comedy", "Society & Culture"],
    coverArt: "https://i.scdn.co/image/9af79fd06e34dea3cd27c4e1cd6ec7343ce20af4",
    followers: 950600,
    episodes: [],
    totalPlays: 5000000,
    imdbRating: 8.5,
    isNpc: true,
    requiredPopularity: 80
  },
  {
    id: "pod_shawn_ryan",
    name: "The Shawn Ryan Show",
    host: "Shawn Ryan Show",
    description: "Shawn Ryan Show",
    topics: ["Society & Culture", "True Crime"],
    coverArt: "https://i.scdn.co/image/ab6765630000ba8aa32a0d922de12470e9b986b2",
    followers: 400000,
    episodes: [],
    totalPlays: 2000000,
    imdbRating: 8.8,
    isNpc: true,
    requiredPopularity: 60
  },
  {
    id: "pod_call_her_daddy",
    name: "Call Her Daddy",
    host: "Alex Cooper",
    description: "Alex Cooper's Call Her Daddy.",
    topics: ["Comedy"],
    coverArt: "https://i.scdn.co/image/ab6765630000ba8aa23e3ecb90ba6e709e37fc53",
    followers: 125000,
    episodes: [],
    totalPlays: 1000000,
    imdbRating: 4.0,
    isNpc: true,
    requiredPopularity: 70
  }
];

const initialState: GameState = {
  offlineMode: true,
  difficultyMode: "normal",
  careerMode: null,
  soloArtist: null,
  group: null,
  activeArtistId: null,
  artistsData: {},
  spotifyPlaylists: DEFAULT_SPOTIFY_PLAYLISTS,
  podcasts: DEFAULT_PODCASTS,
  podcastCharts: DEFAULT_PODCASTS,
  date: { week: 1, year: 2024 },
  currentView: "game",
  activeTab: "Home",
  activeYoutubeChannel: "artist",
  npcs: [],
  npcAlbums: [],
  soundtrackAlbums: [],
  billboardHot100: [],
  billboardTopAlbums: [],
  albumChartHistory: {},
  chartHistory: {},
  videoChartHistory: {},
  spotifyGlobal: [],
  spotifyGlobalMusicVideos: [],
  ukSinglesChart: [],
  ukSinglesChartHistory: {},
  ukAlbumsChart: [],
  ukAlbumsChartHistory: {},
  spotifyUS: [],
  spotifyCanada: [],
  spotifyUK: [],
  spotifyLatin: [],
  spotifyAsia: [],
  spotifyAfrica: [],
  hotPopSongs: [],
  hotRapRnb: [],
  electronicChart: [],
  countryChart: [],
  radioOverallChart: [],
  radioFormatCharts: {},
  radioUrbanChart: [],
  radioPopChart: [],
  radioChrChart: [],
  radioAcChart: [],
  radioHotAcChart: [],
  radioCountryChart: [],
  radioClassicHitsChart: [],
  radioClassicRockChart: [],
  radioActiveRockChart: [],
  radioAltRockChart: [],
  radioAaaChart: [],
  radioUrbanAcChart: [],
  radioRhythmicChart: [],
  radioAdultHitsChart: [],
  radioLatinChart: [],
  radioChristmasChart: [],
  hotPopSongsHistory: {},
  hotRapRnbHistory: {},
  electronicChartHistory: {},
  countryChartHistory: {},
  spotifyNewEntries: 0,
  selectedVideoId: null,
  selectedReleaseId: null,
  selectedSoundtrackId: null,
  activeSubmissionId: null,
  activeGeniusOffer: null,
  activeOnTheRadarOffer: null,
  activeTrshdOffer: null,
  activeEventInvitation: null,
  activeFallonOffer: null,
  activeSoundtrackOffer: null,
  activeFeatureOffer: null,
  selectedXUserId: null,
  selectedXChatId: null,
  contractRenewalOffer: null,
  activeTourId: null,
  viewingPastLabelId: null,
  activeVogueOffer: null,
  amaSubmissions: [],
  amaCurrentYearNominations: null,
  activeAmaPerformanceOffer: null,
  activeAmaRedCarpetOffer: null,
  britSubmissions: [],
  britCurrentYearNominations: null,
  activeBritPerformanceOffer: null,
  activeBritRedCarpetOffer: null,
  grammySubmissions: [],
  grammyCurrentYearNominations: null,
  activeGrammyPerformanceOffer: null,
  activeGrammyRedCarpetOffer: null,
  goldenGlobeSubmissions: [],
  goldenGlobeCurrentYearNominations: null,
  oscarSubmissions: [],
  oscarCurrentYearNominations: null,
  activeOscarPerformanceOffer: null,
};

const GameContext = createContext<
  | {
      gameState: GameState;
      dispatch: React.Dispatch<GameAction>;
      activeArtist: Artist | Group | null;
      activeArtistData: ArtistData | null;
      allPlayerArtists: Array<Artist | Group>;
    }
  | undefined
>(undefined);

const calculateGenreChart = (
  allContenders: any[],
  genres: string[],
  previousChart: ChartEntry[],
  chartHistory: ChartHistory,
  currentDate: { year: number; week: number },
): { newChart: ChartEntry[]; newHistory: ChartHistory } => {
  const genreContenders = allContenders.filter((song) =>
    genres.includes(song.genre),
  );

  genreContenders.sort((a, b) => b.weeklyStreams - a.weeklyStreams);

  const eligibleGenreContenders = genreContenders.filter((song, index) => {
    const potentialRank = index + 1;
    const history = chartHistory[song.uniqueId];
    if (history && history.weeksOnChart >= 52 && potentialRank > 25)
      return false;
    if (history && history.weeksOnChart >= 20 && potentialRank > 50)
      return false;
    return true;
  });

  const top50 = eligibleGenreContenders.slice(0, 50);
  const newHistory: ChartHistory = { ...chartHistory };
  const newChart: ChartEntry[] = [];
  const prevChartMap = new Map(
    previousChart.map((entry) => [entry.uniqueId, entry]),
  );

  top50.forEach((song, index) => {
    const rank = index + 1;
    const history = newHistory[song.uniqueId];
    const prevChartEntry = prevChartMap.get(song.uniqueId);

    if (history) {
      history.weeksOnChart += 1;
      history.lastRank = rank;
      if (rank < history.peak) history.peak = rank;
      if (rank === 1) {
        history.weeksAtNo1 = (history.weeksAtNo1 || 0) + 1;
      }
      if (history.chartRun) {
        history.chartRun.push(rank);
      } else {
        history.chartRun = [rank];
      }
      if (!history.firstEntered) {
        history.firstEntered = {
          year: currentDate.year,
          week: currentDate.week,
        };
      }
    } else {
      newHistory[song.uniqueId] = {
        weeksOnChart: 1,
        peak: rank,
        lastRank: rank,
        weeksAtNo1: rank === 1 ? 1 : 0,
        chartRun: [rank],
        firstEntered: { year: currentDate.year, week: currentDate.week },
      };
    }

    newChart.push({
      rank: rank,
      lastWeek: prevChartEntry?.rank ?? null,
      peak: newHistory[song.uniqueId].peak,
      weeksOnChart: newHistory[song.uniqueId].weeksOnChart,
      title: song.title,
      artist: song.artist,
      coverArt: song.coverArt,
      isPlayerSong: song.isPlayerSong,
      songId: song.songId,
      uniqueId: song.uniqueId,
      weeklyStreams: song.weeklyStreams,
    });
  });

  return { newChart, newHistory };
};

const getHypeCap = (artistData: ArtistData): number => {
  if (artistData.redMicPro && artistData.redMicPro.unlocked) {
    if (artistData.redMicPro.hypeMode === "locked") {
      return 1000;
    }
  }
  return 100;
};

const gameReducerInternal = (
  state: GameState,
  action: GameAction,
): GameState => {
  const allPlayerArtistsAndGroups: (Artist | Group)[] = [
    ...(state.careerMode === "solo" && state.soloArtist
      ? [state.soloArtist]
      : state.group
        ? [state.group, ...state.group.members]
        : []),
    ...(state.extraPlayableArtists || []),
  ];
  const tmzUser: XUser = {
    id: "tmz",
    name: "TMZ",
    username: "TMZ",
    avatar:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSI4IiBmaWxsPSIjRkZGRkZGIi8+PHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNCIgZmlsbD0iI0QzMjYyNiIvPjxwYXRoIGQ9Ik0xNiAyMHYyNGg2VjMybDQtNGg0djIwbC0xMi0xMi0xMiAxMnoiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNMzYgMjB2MjRoNlYzMmw0LTRoNHYyMGwtMTItMTItMTIgMTJ6IiBmaWxsPSIjRkZGIi8+PC9zdmc+",
    isVerified: true,
    bio: "breaking news & celebrity gossip",
    followersCount: 19500000,
    followingCount: 150,
  };

  switch (action.type) {
    case "START_SOLO_GAME": {
      const { artist, startYear, timeMode } = action.payload;
      const isDaily = timeMode === "daily";
      const startDate = isDaily ? { day: 1, week: 1, year: startYear } : { week: 1, year: startYear };
      const welcomeEmail: Email = {
        id: crypto.randomUUID(),
        sender: "Red Mic",
        subject: `Welcome to the Music Industry, ${artist.name}!`,
        body: `Hey ${artist.name},

This is it, your first step into the world of music. We've given you $100,000 to start. Your fandom, The ${artist.fandomName}, are waiting. Spend your money wisely. Record hits, build your fanbase, and take over the charts. Good luck.

The Red Mic Team`,
        date: startDate,
        isRead: false,
        senderIcon: "default",
      };

      const initialSubs = Math.floor(Math.random() * 5000) + 1000;

      const playerXUser: XUser = {
        id: artist.id,
        name: artist.name,
        username: artist.name.replace(/\s/g, "").toLowerCase(),
        avatar: artist.image,
        isVerified: true,
        isPlayer: true,
        bio: `Official account. Leader of the ${artist.fandomName}.`,
        followersCount: Math.floor(initialSubs / 10),
        followingCount: 0,
      };
      const popBaseUser: XUser = {
        id: "popbase",
        name: "Pop Base",
        username: "PopBase",
        avatar:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzcyOGRmYSIvPjxwYXRoIGQ9Ik0zMiA0MC4yNTdMMjEuMjUgNDRsMy43NS0zLjc0M3ptMTQtOC41MTVMNDIgMjhsLTMuNzUgMy43NDN6IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTMwLjUgMzMuNUw0MCAyNGw0IDQgTDM0LjUgMzcuNSA1IDU3bDctN3oiIGZpbGw9IiNmZmYiLz48L3N2Zz4=",
        isVerified: true,
        bio: "all things pop culture",
        followersCount: 1800000,
        followingCount: 50,
      };
      const radioUpdaterUser: XUser = {
        id: "usradio",
        name: "U.S. Radio Updater",
        username: "USRadioUpdater",
        avatar:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzIyMiIvPjxwYXRoIGQ9Ik00MCAzMmwtMTAgNXYxMGgxMHptLTItNkgxNnY3aDIyem0tMTIgMEg4djEwaDE4eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==",
        isVerified: true,
        bio: "Radio stats.",
        followersCount: 540000,
        followingCount: 1,
      };
      const chartDataUser: XUser = {
        id: "chartdata",
        name: "chart data",
        username: "chartdata",
        avatar:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNjQgMzJBNzIgNzIgMCAwMS04IDMyQTcyIDcyIDAgMDE2NCAzMnoiIGZpbGw9IiMxZDFkMWQiLz48cGF0aCBkPSJNMCAzMkE3MiA3MiAwIDAwNzIgMzJBNzIgNzIgMCAwMDAtMzJ6IiBmaWxsPSIjZmZmIi8+PC9zdmc+",
        isVerified: true,
        bio: "facts & stats",
        followersCount: 2300000,
        followingCount: 1,
      };
      
      const goldenGlobesUser: XUser = {
        id: "golden_globes",
        name: "Golden Globes",
        username: "goldenglobes",
        avatar: "https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Golden_Globe_Awards_logo.svg/1200px-Golden_Globe_Awards_logo.svg.png",
        isVerified: true,
        bio: "#GoldenGlobes â€” LIVE Sunday, January 10, 2027 on @CBS and @paramountplus hosted by @NikkiGlaser! ðŸ“ Hollywood, California ðŸ”— goldenglobes.com",
        followersCount: 1900000,
        followingCount: 822,
      };

      const spotifySnapshotUser: XUser = {
        id: "spotifysnapshot",
        name: "Spotify Snapshot",
        username: "SnapshotSpotify",
        avatar:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzFkMWQxZCIvPjxwYXRoIGQ9Ik00Ni41MzIgNDYuNTMyQzQ2LjUzMiA0Ni41MzIgNDYuNTMy...IiBmaWxsPSIjMThEMzRFIi8+PC9zdmc+",
        isVerified: true,
        bio: "Real-time Spotify numbers for your favorite artists.",
        followersCount: 1100000,
        followingCount: 0,
      };
      const addictionUser: XUser = {
        id: `addiction_fan_solo`,
        name: `addiction to ${artist.name}`,
        username: `addiction${artist.name.replace(/\s/g, "").toLowerCase()}`,
        avatar: artist.image,
        isVerified: true,
        bio: `the very best of ${artist.name}`,
        followersCount: Math.floor(Math.random() * 300000) + 200000,
        followingCount: 1,
      };

      const chartsFanUser: XUser = {
        id: "charts_fan_solo",
        name: `${artist.name} Charts`,
        username: `${artist.name.replace(/\s/g, "").toLowerCase()}charts`,
        avatar:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzFEQTFGMiIvPjxyZWN0IHg9IjE2IiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iMTYiIGZpbGw9IndoaXRlIi8+PHJlY3QgeD0iMjgiIHk9IjI0IiB3aWR0aD0iOCIgaGVpZHRoPSIyNCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSI0MCIgeT0iMTYiIHdpZHRoPSI4IiBoZWlnaHQ9IjMyIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==",
        isVerified: false,
        bio: `stats & updates for ${artist.name}`,
        followersCount: Math.floor(Math.random() * 40000) + 15000,
        followingCount: 1,
      };

      const statsFanUser: XUser = {
        id: "stats_fan_solo",
        name: `${artist.name} Stats`,
        username: `${artist.name.replace(/\s/g, "").toLowerCase()}stats`,
        avatar: artist.image,
        isVerified: true,
        bio: `Parody account. Weekly stats & updates for ${artist.name}.`,
        followersCount: Math.floor(Math.random() * 80000) + 35000,
        followingCount: 1,
      };

      const fanAvatars = [
        "https://i.imgur.com/3Y3j3jQ.png",
        "https://i.imgur.com/O6G2e1E.png",
        "https://i.imgur.com/sW12a89.png",
        "https://i.imgur.com/pBw2r70.png",
        "https://i.imgur.com/c2802k5.png",
        "https://i.imgur.com/vHqX3ch.png",
        "https://i.imgur.com/0P6UOf3.jpeg",
        "https://i.imgur.com/6J7oO1b.jpeg",
        "https://i.imgur.com/M6XZ0vS.jpeg",
        "https://i.imgur.com/H1G58Qf.jpeg",
        "https://i.imgur.com/h5T9hZ8.jpeg",
        "https://i.imgur.com/G5qE6sR.jpeg",
      ];

      const fanUsers: XUser[] = Array.from({ length: 25 }, (_, i) => ({
        id: `fan${i + 1}`,
        name: `FanAccount_${i + 1}`,
        username: `stan_${artist.name.replace(/\s/g, "").toLowerCase()}_${i + 1}`,
        avatar: fanAvatars[i % fanAvatars.length],
        isVerified: false,
        bio: `part of the ${artist.fandomName}!`,
        followersCount: Math.floor(Math.random() * (1500 - 500 + 1)) + 500,
        followingCount: Math.floor(Math.random() * (500 - 50 + 1)) + 50,
      }));

      const haterUsers: XUser[] = Array.from({ length: 15 }, (_, i) => ({
        id: `hater_initial_${i + 1}`,
        name: `Anon${i + 1}`,
        username: `hater_anon_${i + 1}`,
        avatar:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iI2QzMjYyNiIvPjwvc3ZnPg==",
        isVerified: false,
        bio: "just speaking facts",
        followersCount: Math.floor(Math.random() * 200),
        followingCount: Math.floor(Math.random() * 20),
      }));

      const initialXUsers: XUser[] = [
        playerXUser,
        popBaseUser,
        radioUpdaterUser,
        chartDataUser,
        spotifySnapshotUser,
        tmzUser,
        addictionUser,
        chartsFanUser,
        statsFanUser,
        ...fanUsers,
        ...haterUsers,
      ];

      const initialXPosts: XPost[] = [
        {
          id: crypto.randomUUID(),
          authorId: "popbase",
          content: `Welcome to the industry, ${artist.name}! All eyes are on you.`,
          likes: 1200,
          retweets: 350,
          views: 25000,
          date: startDate,
        },
      ];

      const fanGroupChat: XChat = {
        id: "gc1",
        name: artist.fandomName,
        avatar: fanUsers[0].avatar,
        isGroup: true,
        participants: [playerXUser.id, ...fanUsers.map((f) => f.id)],
        messages: [
          {
            id: crypto.randomUUID(),
            senderId: "fan1",
            text: `OMG ${artist.pronouns === "they/them" ? "they are" : artist.pronouns === "she/her" ? "she is" : "he is"} in the chat!!`,
            date: startDate,
          },
          {
            id: crypto.randomUUID(),
            senderId: "fan2",
            text: "hiiii we love you!!",
            date: startDate,
          },
          {
            id: crypto.randomUUID(),
            senderId: "fan3",
            text: "Welcome!!! So excited for new music!",
            date: startDate,
          },
        ],
        isRead: true,
      };
      const dmWithFan: XChat = {
        id: "dm1",
        name: fanUsers[0].name,
        avatar: fanUsers[0].avatar,
        isGroup: false,
        participants: [playerXUser.id, "fan1"],
        messages: [
          {
            id: crypto.randomUUID(),
            senderId: "fan1",
            text: `Just wanted to say I'm so excited for your career!!`,
            date: startDate,
          },
        ],
        isRead: false,
      };

      const newArtistData: ArtistData = {
        ...initialArtistData,
        money: INITIAL_MONEY,
        hype: 10,
        popularity: 10,
        youtubeSubscribers: initialSubs,
        tiktokFollowers: initialSubs * 2,
        instagramFollowers: initialSubs * 3,
        inbox: [welcomeEmail],
        xUsers: initialXUsers,
        xPosts: initialXPosts,
        xChats: [fanGroupChat, dmWithFan],
        xTrends: [
          {
            id: crypto.randomUUID(),
            category: "Music Â· Trending",
            title: `${artist.name}`,
            postCount: 18400,
          },
          {
            id: crypto.randomUUID(),
            category: "Trending in United States",
            title: "#newartist",
            postCount: 98000,
          },
        ],
        xFollowingIds: [],
        followers: Math.floor(initialSubs / 5),
      };
      // Increase songs and albums for more realistic charts
      const npcs = generateNpcs(600, [], undefined, [action.payload.artist.name], action.payload.startYear);
      const npcAlbums = generateNpcAlbums(60, npcs);
      const billboardTopAlbums = generateInitialBillboardTopAlbums(npcAlbums, action.payload.startYear);

      return {
        ...initialState,
        timeMode: timeMode || "weekly",
        difficultyMode: action.payload.difficultyMode || "normal",
        careerMode: "solo",
        soloArtist: artist,
        activeArtistId: artist.id,
        artistsData: {
          [artist.id]: newArtistData,
        },
        date: startDate,
        npcs,
        npcAlbums,
        billboardTopAlbums,
      };
    }
    case "START_GROUP_GAME": {
      const { group, startYear, timeMode } = action.payload;
      const isDaily = timeMode === "daily";
      const startDate = isDaily ? { day: 1, week: 1, year: startYear } : { week: 1, year: startYear };

      const newArtistsData: { [artistId: string]: ArtistData } = {};

      const createWelcomeEmail = (name: string): Email => ({
        id: crypto.randomUUID(),
        sender: "Red Mic",
        subject: `Welcome to the Music Industry, ${name}!`,
        body: `Hey ${name},

This is it, your first step into the world of music. Your fandom, The ${group.fandomName}, is waiting. We've given you $100,000 to start. Spend it wisely. Record hits, build your fanbase, and take over the charts. Good luck.

The Red Mic Team`,
        date: startDate,
        isRead: false,
        senderIcon: "default",
      });

      // Social media setup for group
      const playerXUser: XUser = {
        id: group.id,
        name: group.name,
        username: group.name.replace(/\s/g, "").toLowerCase(),
        avatar: group.image,
        isVerified: true,
        isPlayer: true,
        bio: `Official account for ${group.name}`,
        followersCount: 0,
        followingCount: 0,
      };
      const popBaseUser: XUser = {
        id: "popbase",
        name: "Pop Base",
        username: "PopBase",
        avatar:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzcyOGRmYSIvPjxwYXRoIGQ9Ik0zMiA0MC4yNTdMMjEuMjUgNDRsMy43NS0zLjc0M3ptMTQtOC41MTVMNDIgMjhsLTMuNzUgMy43NDN6IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTMwLjUgMzMuNUw0MCAyNGw0IDQgTDM0LjUgMzcuNSA1IDU3bDctN3oiIGZpbGw9IiNmZmYiLz48L3N2Zz4=",
        isVerified: true,
        bio: "all things pop culture",
        followersCount: 1800000,
        followingCount: 50,
      };
      const radioUpdaterUser: XUser = {
        id: "usradio",
        name: "U.S. Radio Updater",
        username: "USRadioUpdater",
        avatar:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzIyMiIvPjxwYXRoIGQ9Ik00MCAzMmwtMTAgNXYxMGgxMHptLTItNkgxNnY3aDIyem0tMTIgMEg4djEwaDE4eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==",
        isVerified: true,
        bio: "Radio stats.",
        followersCount: 540000,
        followingCount: 1,
      };
      const chartDataUser: XUser = {
        id: "chartdata",
        name: "chart data",
        username: "chartdata",
        avatar:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNjQgMzJBNzIgNzIgMCAwMS04IDMyQTcyIDcyIDAgMDE2NCAzMnoiIGZpbGw9IiMxZDFkMWQiLz48cGF0aCBkPSJNMCAzMkE3MiA3MiAwIDAwNzIgMzJBNzIgNzIgMCAwMDAtMzJ6IiBmaWxsPSIjZmZmIi8+PC9zdmc+",
        isVerified: true,
        bio: "facts & stats",
        followersCount: 2300000,
        followingCount: 1,
      };
      
      const goldenGlobesUser: XUser = {
        id: "golden_globes",
        name: "Golden Globes",
        username: "goldenglobes",
        avatar: "https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Golden_Globe_Awards_logo.svg/1200px-Golden_Globe_Awards_logo.svg.png",
        isVerified: true,
        bio: "#GoldenGlobes â€” LIVE Sunday, January 10, 2027 on @CBS and @paramountplus hosted by @NikkiGlaser! ðŸ“ Hollywood, California ðŸ”— goldenglobes.com",
        followersCount: 1900000,
        followingCount: 822,
      };

      const spotifySnapshotUser: XUser = {
        id: "spotifysnapshot",
        name: "Spotify Snapshot",
        username: "SnapshotSpotify",
        avatar:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzFkMWQxZCIvPjxwYXRoIGQ9Ik00Ni41MzIgNDYuNTMyQzQ2LjUzMiA0Ni41MzIgNDYuNTMy...IiBmaWxsPSIjMThEMzRFIi8+PC9zdmc+",
        isVerified: true,
        bio: "Real-time Spotify numbers for your favorite artists.",
        followersCount: 1100000,
        followingCount: 0,
      };
      const addictionUser: XUser = {
        id: "addiction_fan_group",
        name: `addiction to ${group.name}`,
        username: `addiction${group.name.replace(/\s/g, "").toLowerCase()}`,
        avatar: group.image,
        isVerified: true,
        bio: `the very best of ${group.name}`,
        followersCount: Math.floor(Math.random() * 400000) + 300000,
        followingCount: 1,
      };
      const chartsFanUser: XUser = {
        id: "charts_fan_group",
        name: `${group.name} Charts`,
        username: `${group.name.replace(/\s/g, "").toLowerCase()}charts`,
        avatar:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzFEQTFGMiIvPjxyZWN0IHg9IjE2IiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iMTYiIGZpbGw9IndoaXRlIi8+PHJlY3QgeD0iMjgiIHk9IjI0IiB3aWR0aD0iOCIgaGVpZHRoPSIyNCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSI0MCIgeT0iMTYiIHdpZHRoPSI4IiBoZWlnaHQ9IjMyIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==",
        isVerified: false,
        bio: `stats & updates for ${group.name}`,
        followersCount: Math.floor(Math.random() * 50000) + 20000,
        followingCount: 1,
      };
      const statsFanUser: XUser = {
        id: "stats_fan_group",
        name: `${group.name} Stats`,
        username: `${group.name.replace(/\s/g, "").toLowerCase()}stats`,
        avatar: group.image,
        isVerified: true,
        bio: `Parody account. Weekly stats & updates for ${group.name}.`,
        followersCount: Math.floor(Math.random() * 100000) + 40000,
        followingCount: 1,
      };

      const fanAvatars = [
        "https://i.imgur.com/3Y3j3jQ.png",
        "https://i.imgur.com/O6G2e1E.png",
        "https://i.imgur.com/sW12a89.png",
        "https://i.imgur.com/pBw2r70.png",
        "https://i.imgur.com/c2802k5.png",
        "https://i.imgur.com/vHqX3ch.png",
        "https://i.imgur.com/0P6UOf3.jpeg",
        "https://i.imgur.com/6J7oO1b.jpeg",
        "https://i.imgur.com/M6XZ0vS.jpeg",
        "https://i.imgur.com/H1G58Qf.jpeg",
        "https://i.imgur.com/h5T9hZ8.jpeg",
        "https://i.imgur.com/G5qE6sR.jpeg",
      ];

      const fanUsers: XUser[] = Array.from({ length: 25 }, (_, i) => ({
        id: `fan${i + 1}`,
        name: `FanAccount_${i + 1}`,
        username: `stan_${group.name.replace(/\s/g, "").toLowerCase()}_${i + 1}`,
        avatar: fanAvatars[i % fanAvatars.length],
        isVerified: false,
        bio: `part of the ${group.fandomName}!`,
        followersCount: Math.floor(Math.random() * (1500 - 500 + 1)) + 500,
        followingCount: Math.floor(Math.random() * (500 - 50 + 1)) + 50,
      }));

      const haterUsers: XUser[] = Array.from({ length: 15 }, (_, i) => ({
        id: `hater_initial_${i + 1}`,
        name: `Anon${i + 1}`,
        username: `hater_anon_${i + 1}`,
        avatar:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iI2QzMjYyNiIvPjwvc3ZnPg==",
        isVerified: false,
        bio: "just speaking facts",
        followersCount: Math.floor(Math.random() * 200),
        followingCount: Math.floor(Math.random() * 20),
      }));

      const initialXUsers: XUser[] = [
        playerXUser,
        popBaseUser,
        radioUpdaterUser,
        chartDataUser,
        spotifySnapshotUser,
        tmzUser,
        addictionUser,
        chartsFanUser,
        statsFanUser,
        ...fanUsers,
        ...haterUsers,
      ];
      const initialXPosts: XPost[] = [
        {
          id: crypto.randomUUID(),
          authorId: "popbase",
          content: `The industry is buzzing about the debut of ${group.name}!`,
          likes: 2500,
          retweets: 800,
          views: 52000,
          date: startDate,
        },
      ];
      const initialTrends = [
        {
          id: crypto.randomUUID(),
          category: "Music Â· Trending",
          title: `${group.name}`,
          postCount: 25100,
        },
        {
          id: crypto.randomUUID(),
          category: "Trending in United States",
          title: "#newgroup",
          postCount: 150000,
        },
      ];

      // Group data
      newArtistsData[group.id] = {
        ...initialArtistData,
        hype: 15, // Start with a bit more hype
        popularity: 15,
        youtubeSubscribers: Math.floor(Math.random() * 8000) + 2000,
        tiktokFollowers: Math.floor(Math.random() * 16000) + 4000,
        instagramFollowers: Math.floor(Math.random() * 20000) + 5000,
        inbox: [createWelcomeEmail(group.name)],
        xUsers: initialXUsers,
        xPosts: initialXPosts,
        xTrends: initialTrends,
        xFollowingIds: [],
        followers: Math.floor(Math.random() * 4000) + 1000,
      };

      // Member data
      group.members.forEach((member) => {
        const memberXUser: XUser = {
          id: member.id,
          name: member.name,
          username: member.name.replace(/\s/g, "").toLowerCase(),
          avatar: member.image,
          isVerified: true,
          isPlayer: true,
          bio: `member of ${group.name}`,
          followersCount: 0,
          followingCount: 0,
        };

        const memberAddictionUser: XUser = {
          id: `addiction_fan_${member.id}`,
          name: `addiction to ${member.name}`,
          username: `addiction${member.name.replace(/\s/g, "").toLowerCase()}`,
          avatar: member.image,
          isVerified: false,
          bio: `the very best of ${member.name}`,
          followersCount: Math.floor(Math.random() * 50000) + 10000,
          followingCount: 1,
        };

        const memberChartsUser: XUser = {
          id: `charts_${member.id}`,
          name: `${member.name} Charts`,
          username: `${member.name.replace(/\s/g, "").toLowerCase()}charts`,
          avatar:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzFEQTFGMiIvPjxyZWN0IHg9IjE2IiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iMTYiIGZpbGw9IndoaXRlIi8+PHJlY3QgeD0iMjgiIHk9IjI0IiB3aWR0aD0iOCIgaGVpZHRoPSIyNCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSI0MCIgeT0iMTYiIHdpZHRoPSI4IiBoZWlnaHQ9IjMyIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==",
          isVerified: false,
          bio: `stats & updates for ${member.name}`,
          followersCount: Math.floor(Math.random() * 10000) + 2000,
          followingCount: 1,
        };

        newArtistsData[member.id] = {
          ...initialArtistData,
          money: 25000, // Members start with less personal cash
          hype: 5,
          popularity: 5,
          youtubeSubscribers: Math.floor(Math.random() * 2000) + 500,
          tiktokFollowers: Math.floor(Math.random() * 4000) + 1000,
          instagramFollowers: Math.floor(Math.random() * 5000) + 1000,
          inbox: [createWelcomeEmail(member.name)],
          xUsers: [
            memberXUser,
            popBaseUser,
            radioUpdaterUser,
            chartDataUser,
            spotifySnapshotUser,
            tmzUser,
            memberAddictionUser,
            memberChartsUser,
          ],
          xPosts: initialXPosts,
          xTrends: initialTrends,
          xFollowingIds: [],
          followers: Math.floor(Math.random() * 1000) + 200,
        };
      });

      // Increase songs and albums for more realistic charts
      const npcs = generateNpcs(600, [], undefined, [action.payload.group.name], action.payload.startYear);
      const npcAlbums = generateNpcAlbums(60, npcs);
      const billboardTopAlbums = generateInitialBillboardTopAlbums(npcAlbums, action.payload.startYear);

      return {
        ...initialState,
        timeMode: timeMode || "weekly",
        difficultyMode: action.payload.difficultyMode || "normal",
        careerMode: "group",
        group: group,
        activeArtistId: group.id,
        artistsData: newArtistsData,
        date: startDate,
        npcs,
        npcAlbums,
        billboardTopAlbums,
      };
    }
    case "CHANGE_VIEW":
      return {
        ...state,
        currentView: action.payload,
      };
    case "CHANGE_TAB":
      return {
        ...state,
        activeTab: action.payload,
      };
    case "SUBMIT_TO_RADIO": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      const songIndex = activeData.songs.findIndex(
        (s) => s.id === action.payload.songId,
      );
      if (songIndex === -1) return state;
      const updatedSongs = [...activeData.songs];
      const existingSong = updatedSongs[songIndex];
      
      const region = (action.payload as any).region || 'US';
      if (region === 'US') {
        const payloadFormats: string[] = (action.payload as any).formats || (action.payload.format ? [action.payload.format] : ['chr']);
        const sanitizedFormats = Array.from(new Set(payloadFormats.map(normalizeRadioFormatId))).slice(0, 5);
        
        const initialPlays: Record<string, number> = { ...(existingSong.formatRadioPlays || {}) };
        const initialImpr: Record<string, number> = { ...(existingSong.formatRadioImpressions || {}) };
        const initialWeeks: Record<string, number> = { ...(existingSong.formatWeeksOnRadio || {}) };
        sanitizedFormats.forEach((fmt) => {
          if (initialPlays[fmt] === undefined) initialPlays[fmt] = 0;
          if (initialImpr[fmt] === undefined) initialImpr[fmt] = 0;
          if (initialWeeks[fmt] === undefined) initialWeeks[fmt] = 0;
        });

        updatedSongs[songIndex] = {
          ...existingSong,
          isOnRadio: true,
          radioFormat: sanitizedFormats[0] || 'chr',
          radioFormats: sanitizedFormats,
          formatRadioPlays: initialPlays,
          formatRadioImpressions: initialImpr,
          formatWeeksOnRadio: initialWeeks,
          weeksOnRadio: existingSong.weeksOnRadio || 0,
          radioPlays: existingSong.radioPlays || 0,
          radioImpressions: existingSong.radioImpressions || 0,
        };
      } else if (region === 'UK') {
        updatedSongs[songIndex] = {
          ...existingSong,
          isOnUkRadio: true,
          ukRadioFormat: action.payload.format || 'pop',
          ukWeeksOnRadio: 0,
          ukRadioPlays: 0,
        };
      }
      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            songs: updatedSongs,
          },
        },
      };
    }
    case "UPDATE_RADIO_FORMATS": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      const songIndex = activeData.songs.findIndex(
        (s) => s.id === action.payload.songId,
      );
      if (songIndex === -1) return state;
      const updatedSongs = [...activeData.songs];
      const existingSong = updatedSongs[songIndex];
      
      const payloadFormats: string[] = action.payload.formats || [];
      const sanitizedFormats = Array.from(new Set(payloadFormats.map(normalizeRadioFormatId))).slice(0, 5);

      if (sanitizedFormats.length === 0) {
        updatedSongs[songIndex] = {
          ...existingSong,
          isOnRadio: false,
          radioFormats: [],
        };
      } else {
        const initialPlays: Record<string, number> = { ...(existingSong.formatRadioPlays || {}) };
        const initialImpr: Record<string, number> = { ...(existingSong.formatRadioImpressions || {}) };
        const initialWeeks: Record<string, number> = { ...(existingSong.formatWeeksOnRadio || {}) };
        sanitizedFormats.forEach((fmt) => {
          if (initialPlays[fmt] === undefined) initialPlays[fmt] = 0;
          if (initialImpr[fmt] === undefined) initialImpr[fmt] = 0;
          if (initialWeeks[fmt] === undefined) initialWeeks[fmt] = 0;
        });

        updatedSongs[songIndex] = {
          ...existingSong,
          isOnRadio: true,
          radioFormat: sanitizedFormats[0] || 'chr',
          radioFormats: sanitizedFormats,
          formatRadioPlays: initialPlays,
          formatRadioImpressions: initialImpr,
          formatWeeksOnRadio: initialWeeks,
        };
      }

      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            songs: updatedSongs,
          },
        },
      };
    }
    case "WITHDRAW_FROM_RADIO": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      const songIndex = activeData.songs.findIndex(
        (s) => s.id === action.payload.songId,
      );
      if (songIndex === -1) return state;
      const updatedSongs = [...activeData.songs];
      const existingSong = updatedSongs[songIndex];
      
      const region = (action.payload as any).region || 'US';
      if (region === 'UK') {
        updatedSongs[songIndex] = {
          ...existingSong,
          isOnUkRadio: false,
        };
      } else {
        const formatToRemove = action.payload.format ? normalizeRadioFormatId(action.payload.format) : null;
        if (formatToRemove && existingSong.radioFormats && existingSong.radioFormats.length > 1) {
          const remainingFormats = existingSong.radioFormats.filter(
            (f) => normalizeRadioFormatId(f) !== formatToRemove
          );
          updatedSongs[songIndex] = {
            ...existingSong,
            radioFormats: remainingFormats,
            radioFormat: remainingFormats[0] || 'chr',
          };
        } else {
          updatedSongs[songIndex] = {
            ...existingSong,
            isOnRadio: false,
            radioFormats: [],
          };
        }
      }
      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            songs: updatedSongs,
          },
        },
      };
    }
    case "PROMOTE_RADIO": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      const { songId, format, amount, source, region = 'US' } = action.payload as any;

      const songIndex = activeData.songs.findIndex((s) => s.id === songId);
      if (songIndex === -1) return state;
      const song = activeData.songs[songIndex];
      
      const targetFmt = format
        ? normalizeRadioFormatId(format)
        : (song.radioFormats && song.radioFormats.length > 0 ? normalizeRadioFormatId(song.radioFormats[0]) : (song.radioFormat ? normalizeRadioFormatId(song.radioFormat) : 'chr'));

      if (region === 'US') {
        if (song.formatHasRadioPromo?.[targetFmt]) return state;
      }
      if (region === 'UK' && song.hasUkRadioPromo) return state;

      let newMoney = activeData.money;
      let newContract = activeData.contract ? { ...activeData.contract } : null;

      if (source === "personal") {
        if (newMoney < amount) return state;
        newMoney -= amount;
      } else if (source === "label") {
        if (!newContract || newContract.marketingBudget < amount) return state;
        newContract.marketingBudget -= amount;
      }

      const updatedSongs = [...activeData.songs];

      // Tone down radio promo significantly
      const spinsGained = Math.floor(amount / 160) * (Math.random() * 0.4 + 0.6);
      const impressionsGained = spinsGained * 2200; // Realistic impressions per spin

      if (region === 'UK') {
          updatedSongs[songIndex] = {
            ...song,
            pendingUkRadioPromoSpins: (song.pendingUkRadioPromoSpins || 0) + spinsGained,
            hasUkRadioPromo: true,
          };
      } else {
          const pendingFmtMap = { ...(song.pendingFormatRadioPromoSpins || {}) };
          pendingFmtMap[targetFmt] = (pendingFmtMap[targetFmt] || 0) + spinsGained;

          const fmtPromoMap = { ...(song.formatHasRadioPromo || {}) };
          fmtPromoMap[targetFmt] = true;

          updatedSongs[songIndex] = {
            ...song,
            pendingRadioPromoSpins: (song.pendingRadioPromoSpins || 0) + spinsGained,
            hasRadioPromo: true,
            pendingFormatRadioPromoSpins: pendingFmtMap,
            formatHasRadioPromo: fmtPromoMap,
          };
      }

      // Add a prediction post if it's gaining radio traction
      const newXPosts = [...(activeData.xPosts || [])];
      
      const artistName = state.soloArtist?.name || state.group?.name || "Artist";
      const artistHandle = activeData.xUsers.find((u) => u.name === artistName)?.username || "artist";
      
      const totalRadio = (song.radioPlays || 0) + spinsGained;
      const mRadio = (totalRadio * 5000 / 1000000).toFixed(1);
      const mStreams = ((song.weeklyStreams || 0) / 1000000).toFixed(1);
      const eSales = Math.floor((song.weeklyStreams || 0) / 800) + 1500;
      
      let rankPredNum = 95;
      if ((song.weeklyStreams || 0) > 25000000) rankPredNum = Math.floor(Math.random() * 5) + 1; // 1-5
      else if ((song.weeklyStreams || 0) > 15000000) rankPredNum = Math.floor(Math.random() * 5) + 6; // 6-10
      else if ((song.weeklyStreams || 0) > 10000000) rankPredNum = Math.floor(Math.random() * 10) + 11; // 11-20
      else if ((song.weeklyStreams || 0) > 5000000) rankPredNum = Math.floor(Math.random() * 20) + 21; // 21-40
      else rankPredNum = Math.floor(Math.random() * 40) + 50; // 50-90

      let isReEntry = (song.lastWeekStreams || 0) === 0 && (song.streams || 0) > (song.weeklyStreams || 0);
      let isDebut = (song.lastWeekStreams || 0) === 0 && (song.streams || 0) <= (song.weeklyStreams || 0);

      let content = "";
      if (isReEntry) {
        let rankBucket = rankPredNum <= 10 ? 10 : rankPredNum <= 20 ? 20 : rankPredNum <= 30 ? 30 : rankPredNum <= 40 ? 40 : rankPredNum <= 50 ? 50 : 100;
        content = `"${song.title}" by ${artistName} is challenging to re-enter the top ${rankBucket} on the next Billboard Hot 100.`;
      } else {
        let actionWord = isDebut ? "debut" : "rise";
        if (!isDebut && (song.weeklyStreams || 0) < (song.lastWeekStreams || 0)) {
           actionWord = "drop";
        }
        content = `"${song.title}" by @${artistHandle} is predicted to ${actionWord} at #${rankPredNum} on the Hot 100 with ${mStreams}M streams, ${eSales.toLocaleString()} sales, and ${mRadio}M radio.`;
      }
      
      newXPosts.push({
        id: crypto.randomUUID(),
        authorId: "talkofthecharts",
        date: state.date,
        content: content,
        likes: Math.floor(Math.random() * 10000) + 1000,
        retweets: Math.floor(Math.random() * 2000) + 200,
        views: Math.floor(Math.random() * 200000) + 50000,
        image: song.coverArt,
      });

      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            money: newMoney,
            contract: newContract,
            songs: updatedSongs,
            xPosts: newXPosts,
          },
        },
      };
    }
    case "SWITCH_YOUTUBE_CHANNEL":
      return {
        ...state,
        activeYoutubeChannel: action.payload,
      };
    case "APPLY_YOUTUBE_PARTNER": {
      if (!state.activeArtistId) return state;
      const artistData = state.artistsData[state.activeArtistId];
      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...artistData,
            youtubePartnerProgram: {
              isActive: true,
              eligibleViewsThisQuarter: 0,
              lifetimeEarnings: 0,
            },
          },
        },
      };
    }
    case "SUBSCRIBE_CHART_PREDICTIONS": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      if (activeData.money < action.payload.cost) return state;
      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            money: activeData.money - action.payload.cost,
            chartPredictionsSubscription: true,
          },
        },
      };
    }
    case "UNLOCK_ALBUM_PREDICTIONS": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      if (activeData.money < action.payload.cost) return state;
      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            money: activeData.money - action.payload.cost,
            albumPredictionsUnlocked: true,
          },
        },
      };
    }
    case "RELEASE_ITUNES_VERSION": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      const songIndex = activeData.songs.findIndex(
        (s) => s.id === action.payload.songId,
      );
      if (songIndex === -1) return state;

      const song = activeData.songs[songIndex];
      const currentVersions = song.itunesVersions || [];
      if (currentVersions.length >= 10) return state; // Max 10 versions

      const newVersion = {
        id: `itunes_ver_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        title: action.payload.title,
        coverArt: action.payload.coverArt || song.coverArt,
        releaseDate: state.date,
        sales: 0,
        prevWeekSales: 0,
        price: action.payload.price ?? 1.29,
      };

      const updatedSongs = [...activeData.songs];
      updatedSongs[songIndex] = {
        ...song,
        itunesVersions: [...currentVersions, newVersion],
      };

      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            songs: updatedSongs,
          },
        },
      };
    }
    case "REMOVE_ITUNES_VERSION": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      const songIndex = activeData.songs.findIndex(
        (s) => s.id === action.payload.songId,
      );
      if (songIndex === -1) return state;

      const song = activeData.songs[songIndex];
      const updatedSongs = [...activeData.songs];
      updatedSongs[songIndex] = {
        ...song,
        itunesVersions: (song.itunesVersions || []).filter(
          (v) => v.id !== action.payload.versionId,
        ),
      };

      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            songs: updatedSongs,
          },
        },
      };
    }
    case "EDIT_ITUNES_VERSION": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      const songIndex = activeData.songs.findIndex(
        (s) => s.id === action.payload.songId,
      );
      if (songIndex === -1) return state;

      const song = activeData.songs[songIndex];
      const updatedSongs = [...activeData.songs];
      updatedSongs[songIndex] = {
        ...song,
        itunesVersions: (song.itunesVersions || []).map((v) =>
          v.id === action.payload.versionId
            ? { ...v, price: action.payload.price }
            : v,
        ),
      };

      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            songs: updatedSongs,
          },
        },
      };
    }
    case "CHANGE_STAGE_NAME": {
      if (!state.activeArtistId) return state;

      const { newName, cost, contractId } = action.payload;
      const activeArtistData = state.artistsData[state.activeArtistId];

      let draftArtistData = { ...activeArtistData };

      if (cost) {
        draftArtistData.money -= cost;
      }

      // If it's an independent change (no cost, no contractId)
      if (!cost && !contractId) {
        draftArtistData.independentNameChanges =
          (draftArtistData.independentNameChanges || 0) + 1;
      }

      let updatedSoloArtist = state.soloArtist;
      let updatedGroup = state.group;

      if (state.soloArtist && state.soloArtist.id === state.activeArtistId) {
        updatedSoloArtist = { ...state.soloArtist, name: newName };
      } else if (state.group && state.group.id === state.activeArtistId) {
        updatedGroup = { ...state.group, name: newName };
      }

      return {
        ...state,
        soloArtist: updatedSoloArtist,
        group: updatedGroup,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: draftArtistData,
        },
      };
    }
    case "CHANGE_ACTIVE_ARTIST":
      return {
        ...state,
        activeArtistId: action.payload,
      };
    case "TRANSFER_MONEY": {
      const { fromId, toId, amount } = action.payload;
      const newArtistsData = { ...state.artistsData };

      if (
        newArtistsData[fromId] &&
        newArtistsData[toId] &&
        newArtistsData[fromId].money >= amount
      ) {
        newArtistsData[fromId] = {
          ...newArtistsData[fromId],
          money: newArtistsData[fromId].money - amount,
        };
        newArtistsData[toId] = {
          ...newArtistsData[toId],
          money: newArtistsData[toId].money + amount,
        };
      }
      return {
        ...state,
        artistsData: newArtistsData,
      };
    }
    case "PROGRESS_WEEK": {
      const isDailyMode = state.timeMode === "daily";
      let autoGrammySubmissions: GameState["grammySubmissions"] = [];
      let autoAmaSubmissions: any[] = [];
      let autoBritSubmissions: GameState["britSubmissions"] = [];
      let newDay = state.date.day || (isDailyMode ? 1 : 7);
      let newWeek = state.date.week;
      let newYear = state.date.year;

      let isWeeklyUpdate = true;

      if (isDailyMode) {
        newDay++;
        if (newDay > 7) {
          newDay = 1;
          newWeek++;
          isWeeklyUpdate = true;
        } else {
          isWeeklyUpdate = false;
        }
      } else {
        newWeek++;
      }

      if (newWeek > 52) {
        newWeek = 1;
        newYear++;
      }

      const newDate = { ...(isDailyMode ? { day: newDay } : {}), week: newWeek, year: newYear };

      if (!isWeeklyUpdate) {
        const updatedArtistsData: { [id: string]: ArtistData } = JSON.parse(
          JSON.stringify(state.artistsData),
        );

        for (const artistId in updatedArtistsData) {
          const artistData = updatedArtistsData[artistId];
          const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === artistId);
          const playerCut = artistData.contract?.royaltyRate ? artistData.contract.royaltyRate / 100 : 1;

          if (!artistData.inbox) artistData.inbox = [];
          if (!artistData.xPosts) artistData.xPosts = [];
          if (!artistData.songs) artistData.songs = [];
          if (!artistData.releases) artistData.releases = [];
          if (!artistData.labelSubmissions) artistData.labelSubmissions = [];

          // 1. Process scheduled releases if they drop today (e.g. Day 1 / Friday)
          const isDateToday = (d?: GameDate) => {
            if (!d) return false;
            if (d.year !== newDate.year || d.week !== newDate.week) return false;
            return d.day === undefined || d.day === newDate.day;
          };

          artistData.releases = artistData.releases.map((release) => {
            if (!release.isReleased && isDateToday(release.releaseDate)) {
              // Also mark songs in this release as released
              artistData.songs = artistData.songs.map((s) =>
                release.songIds.includes(s.id) ? { ...s, isReleased: true } : s,
              );
              return { ...release, isReleased: true };
            }
            return release;
          });

          // Check scheduled singles and album projects from label submissions dropping today
          artistData.labelSubmissions.forEach((sub) => {
            if (sub.status === "scheduled") {
              // Pre-release singles
              sub.singlesToRelease?.forEach((single) => {
                if (isDateToday(single.releaseDate)) {
                  const song = artistData.songs.find((s) => s.id === single.songId);
                  if (song && !song.isReleased) {
                    artistData.songs = artistData.songs.map((s) =>
                      s.id === single.songId
                        ? {
                            ...s,
                            isReleased: true,
                            isPreReleaseSingle: true,
                            isInterlude: single.singleType === 'interlude',
                            singleType: single.singleType,
                            coverArt: sub.release?.coverArt || s.coverArt,
                          }
                        : s,
                    );
                    const existingRelease = artistData.releases.find((r) => r.songIds.includes(single.songId));
                    if (!existingRelease) {
                      artistData.releases.push({
                        id: crypto.randomUUID(),
                        title: song.title,
                        type: "Single",
                        coverArt: sub.release?.coverArt,
                        songIds: [song.id],
                        releaseDate: newDate,
                        artistId: song.artistId,
                      });
                    }
                  }
                }
              });

              // Project Album/EP release
              if (isDateToday(sub.projectReleaseDate)) {
                sub.status = "released";
                if (sub.release) {
                  sub.release.isReleased = true;
                  artistData.songs = artistData.songs.map((s) =>
                    sub.release.songIds.includes(s.id) ? { ...s, isReleased: true } : s,
                  );
                  const existingAlbum = artistData.releases.find((r) => r.id === sub.release.id);
                  if (existingAlbum) {
                    existingAlbum.isReleased = true;
                  } else {
                    artistData.releases.push({ ...sub.release, isReleased: true, releaseDate: newDate });
                  }
                }
              }
            }
          });

          // Check pending label submissions in daily mode (2-7 days review period)
          const currentContractLabel = artistData.contract
            ? LABELS.find((l) => l.id === artistData.contract!.labelId) ||
              artistData.customLabels?.find(
                (l) => l.id === artistData.contract!.labelId,
              )
            : null;

          if (currentContractLabel) {
            artistData.labelSubmissions = artistData.labelSubmissions.map((sub) => {
              if (sub.status === "pending") {
                const totalDaysSinceSubmission =
                  (newDate.year * 52 * 7 + newDate.week * 7 + (newDate.day || 1)) -
                  (sub.submittedDate.year * 52 * 7 + sub.submittedDate.week * 7 + (sub.submittedDate.day || 1));
                const daysNeeded = sub.reviewDaysNeeded ?? (Math.floor(Math.random() * 6) + 2); // 2-7 days
                if (totalDaysSinceSubmission >= daysNeeded) {
                  const avgQuality =
                    sub.release.songIds.reduce(
                      (sum, id) =>
                        sum +
                        (artistData.songs.find((s) => s.id === id)?.quality || 0),
                      0,
                    ) / sub.release.songIds.length;

                  let minQuality = currentContractLabel.minQuality ?? 0;
                  let feedback = `The average quality of ${avgQuality.toFixed(0)} didn't meet our standard of ${minQuality}. Back to the drawing board.`;

                  if (currentContractLabel.contractType === "petty" && avgQuality < 70) {
                    minQuality = 70;
                    feedback = `The average quality of ${avgQuality.toFixed(0)} is unacceptable. We require a minimum quality of 70 for all releases. Do better.`;
                  }

                  if (!artistData.inbox) artistData.inbox = [];
                  if (avgQuality >= minQuality) {
                    artistData.inbox.unshift({
                      id: crypto.randomUUID(),
                      sender: currentContractLabel.name,
                      subject: `Submission Approved: "${sub.release.title}"`,
                      body: `Great news!\n\nWe've approved your submission for "${sub.release.title}". Please head to the 'Labels' tab to select your pre-release singles and set a release date for the project. Get ready!\n\n- ${currentContractLabel.name}`,
                      date: newDate,
                      isRead: false,
                      senderIcon: "label",
                    });
                    return {
                      ...sub,
                      status: "awaiting_player_input",
                      decisionDate: newDate,
                    };
                  } else {
                    artistData.inbox.unshift({
                      id: crypto.randomUUID(),
                      sender: currentContractLabel.name,
                      subject: `Submission Update: "${sub.release.title}"`,
                      body: `Hi ${artistProfile?.name},\n\nAfter careful consideration, we've decided to pass on releasing "${sub.release.title}" at this time. ${feedback}\n\n- ${currentContractLabel.name}`,
                      date: newDate,
                      isRead: false,
                      senderIcon: "label",
                    });
                    return {
                      ...sub,
                      status: "rejected",
                      decisionDate: newDate,
                      feedback,
                    };
                  }
                }
              }
              return sub;
            });
          }

          // 2. Process daily streams for player songs
          artistData.songs = artistData.songs.map((song) => {
            let effectivelyReleased = song.isReleased;
            if (
              !effectivelyReleased &&
              song.releaseDate &&
              song.releaseDate.year === newDate.year &&
              song.releaseDate.week === newDate.week
            ) {
              effectivelyReleased = true;
            }

            if (effectivelyReleased && !song.isTakenDown) {
              const quality = song.quality || 50;
              const pop = artistData.popularity || 10;
              const hype = artistData.hype || 5;

              // Day of week factor: Friday/Saturday weekend spikes
              let dayFactor = 1.0;
              if (newDay === 1 || newDay === 2) dayFactor = 1.18;
              else if (newDay === 3) dayFactor = 0.96;
              else if (newDay === 4) dayFactor = 0.88;
              else if (newDay === 5) dayFactor = 0.94;
              else if (newDay === 6) dayFactor = 0.98;
              else if (newDay === 7) dayFactor = 1.02;

              const noise = 0.92 + Math.random() * 0.16;
              const baseWeeklyExpected = song.lastWeekStreams && song.lastWeekStreams > 0
                ? song.lastWeekStreams
                : Math.floor((quality ** 2) * 20 * (pop / 40 + 0.5) * (1 + hype / 200));

              let dayStreams = Math.floor((baseWeeklyExpected / 7) * dayFactor * noise);

              if (song.promotion) {
                dayStreams = Math.floor(dayStreams * (1 + (song.promotion.boost || 0.2)));
              }
              if (song.purchasedPlaylists && song.purchasedPlaylists.length > 0) {
                dayStreams = Math.floor(dayStreams * 1.3);
              }

              dayStreams = Math.max(25, dayStreams);

              const currentDaily = song.dailyStreams || [];
              const newDailyStreams = [...currentDaily.slice(-27), dayStreams];

              const grossIncome = Math.floor(dayStreams / 150) * STREAM_INCOME_MULTIPLIER;
              const netIncome = Math.floor(grossIncome * playerCut);

              artistData.money += netIncome;

              // Daily pure sales
              const baseSales = song.sales && song.sales > 0 ? Math.floor(song.sales / 60) : Math.floor(pop * 3);
              const dailySales = Math.max(0, Math.floor((baseSales / 7) * dayFactor * noise));
              const saleUnitCost = newDate.year < 2003 ? 12 : 1.29;
              const saleIncome = Math.floor(dailySales * saleUnitCost * playerCut);
              artistData.money += saleIncome;

              // Daily radio
              const dailyRadio = Math.max(0, Math.floor(((song.radioPlays || (pop * 10)) / 7) * noise));

              return {
                ...song,
                isReleased: effectivelyReleased,
                streams: (song.streams || 0) + dayStreams,
                dailyStreams: newDailyStreams,
                sales: (song.sales || 0) + dailySales,
                radioPlays: (song.radioPlays || 0) + dailyRadio,
                revenue: (song.revenue || 0) + grossIncome,
                netRevenue: (song.netRevenue || 0) + netIncome,
              };
            }

            return effectivelyReleased !== song.isReleased
              ? { ...song, isReleased: effectivelyReleased }
              : song;
          });

          // Daily Monthly Listeners Recalculation (Rolling 28-Day Window)
          const totalStreamsLast28Days = artistData.songs.reduce((sum, s) => {
            if (!s.isReleased || s.isTakenDown) return sum;
            const last28 = s.dailyStreams || [];
            if (last28.length === 0) return sum + (s.lastWeekStreams ? s.lastWeekStreams * 4 : 0);
            const sum28 = last28.reduce((a, b) => a + b, 0);
            return sum + (last28.length < 28 ? Math.floor(sum28 * (28 / last28.length)) : sum28);
          }, 0);
          const calculatedListeners = Math.floor(totalStreamsLast28Days * 0.1);
          const maxListeners = 148000000 + (artistId.charCodeAt(0) % 2000000);
          artistData.monthlyListeners = Math.min(calculatedListeners, maxListeners);
          artistData.peakMonthlyListeners = Math.max(
            artistData.monthlyListeners,
            artistData.peakMonthlyListeners || 0,
          );
          artistData.listeningNow = Math.floor(
            artistData.monthlyListeners * (Math.random() * 0.001),
          );

          // Daily Touring Logic
          if (artistData.tours && artistData.tours.length > 0) {
            artistData.tours = artistData.tours.map((tour) => {
              if (tour.status === "active") {
                if (tour.currentVenueIndex < tour.venues.length) {
                  const venueIdx = tour.currentVenueIndex;
                  const venue = tour.venues[venueIdx];
                  const newVenues = [...tour.venues];

                  let baseDemand = (artistData.popularity || 10) * 800 + (artistData.hype || 5) * 50;
                  let supportDemand = 0;
                  if (tour.openerId) {
                    const op = state.npcs?.find((n) => n.uniqueId === tour.openerId);
                    if (op) supportDemand += op.basePopularity / 2000;
                  }
                  if (tour.guestIds) {
                    tour.guestIds.forEach((gid) => {
                      const gu = state.npcs?.find((n) => n.uniqueId === gid);
                      if (gu) supportDemand += gu.basePopularity / 4000;
                    });
                  }
                  baseDemand += supportDemand;

                  const priceSensitivity = 1.2 - venue.ticketPrice / 200;
                  let demand = baseDemand * Math.max(0.1, priceSensitivity);
                  demand = demand * (0.8 + Math.random() * 0.4);
                  if (tour.isSetlistMissingHits) demand *= 0.5;

                  const newTicketsSold = Math.floor(
                    Math.min(venue.capacity - (venue.ticketsSold || 0), demand)
                  );
                  let actualTicketPrice = venue.ticketPrice;
                  if (tour.useDynamicPricing) {
                    actualTicketPrice = venue.ticketPrice * (Math.random() * 2 + 2);
                    artistData.publicImage = Math.max(0, (artistData.publicImage || 80) - 1);
                  }

                  let revenue = newTicketsSold * actualTicketPrice;
                  if (tour.useVipPackages) {
                    const vipTickets = Math.floor(newTicketsSold * 0.05);
                    revenue += vipTickets * (actualTicketPrice * 4);
                  }

                  let merchRevenue = 0;
                  if (tour.merchItems && tour.merchItems.length > 0) {
                    artistData.merch = (artistData.merch || []).map((item) => {
                      const isTourMerch = tour.merchItems?.find((m) => m.id === item.id);
                      if (isTourMerch && item.stock > 0) {
                        const safePrice = Math.max(0.01, item.price);
                        let buyerRate = (0.1 + Math.random() * 0.2) * Math.min(1, 20 / safePrice);
                        buyerRate = Math.min(buyerRate, 0.4);
                        let buyers = Math.floor(newTicketsSold * buyerRate);
                        buyers = Math.min(buyers, item.stock);
                        merchRevenue += buyers * item.price;
                        return {
                          ...item,
                          stock: item.stock - buyers,
                          unitsSold: (item.unitsSold || 0) + buyers,
                          _actualWeeklySales: (item._actualWeeklySales || 0) + buyers,
                        };
                      }
                      return item;
                    });
                    revenue += merchRevenue;
                  }

                  const updatedVenue = {
                    ...venue,
                    ticketsSold: (venue.ticketsSold || 0) + newTicketsSold,
                    revenue: (venue.revenue || 0) + revenue,
                    soldOut: (venue.ticketsSold || 0) + newTicketsSold >= venue.capacity,
                  };
                  newVenues[venueIdx] = updatedVenue;
                  artistData.money += revenue;

                  if (!artistData.regionalPopularity) {
                    artistData.regionalPopularity = {
                      US: artistData.popularity || 0,
                      Canada: 0,
                      UK: 0,
                      "Latin America": 0,
                      Asia: 0,
                      Africa: 0,
                    };
                  }
                  const vReg = venue.region || "North America";
                  let gameReg = "US";
                  if (vReg === "Europe") gameReg = "UK";
                  else if (vReg === "South America" || venue.city === "Mexico City") gameReg = "Latin America";
                  else if (vReg === "Asia" || vReg === "Middle East" || vReg === "Oceania") gameReg = "Asia";
                  else if (vReg === "Africa") gameReg = "Africa";
                  else if (venue.city === "Toronto" || venue.city === "Montreal" || venue.city === "Vancouver") gameReg = "Canada";

                  artistData.regionalPopularity[gameReg] = Math.min(
                    100,
                    (artistData.regionalPopularity[gameReg] || 0) + 1
                  );

                  if (updatedVenue.soldOut) {
                    artistData.hype = Math.min(getHypeCap(artistData), (artistData.hype || 0) + 5);
                    if (artistProfile) {
                      artistData.xPosts.unshift({
                        id: crypto.randomUUID(),
                        authorId: artistProfile.id,
                        content: `Sold out show in ${venue.city} tonight! Thank you all for coming out! â¤ï¸ #TourLife`,
                        likes: Math.floor(newTicketsSold * 0.5),
                        retweets: Math.floor(newTicketsSold * 0.1),
                        views: Math.floor(newTicketsSold * 10),
                        date: newDate,
                      });
                    }
                  }

                  // NPC Celebrity Tour Attendance Tweet (daily mode)
                  if ((artistData.popularity || 0) >= 50 && artistProfile) {
                    const attendanceChance = Math.min(1.0, (artistData.popularity || 0) / 100);
                    if (Math.random() < attendanceChance / 7) {
                      const npcName = getRandomNpcName([artistProfile.name], newDate.year);
                      const npcImg = getArtistImage(npcName);
                      const playerImg = artistProfile.imageUrl || (artistProfile as any).image || artistData.avatar || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80";
                      const showCity = venue.city || "London";

                      artistData.xPosts.unshift({
                        id: crypto.randomUUID(),
                        authorId: "popbase",
                        content: `${npcName} is attending ${artistProfile.name}â€™s show tonight in ${showCity}.`,
                        image: npcImg,
                        image2: playerImg,
                        likes: Math.floor(Math.random() * 60000) + 20000,
                        retweets: Math.floor(Math.random() * 12000) + 3000,
                        views: Math.floor(Math.random() * 800000) + 250000,
                        date: newDate,
                      });
                    }
                  }

                  const nextIndex = venueIdx + 1;
                  const isFinished = nextIndex >= tour.venues.length;
                  return {
                    ...tour,
                    venues: newVenues,
                    currentVenueIndex: nextIndex,
                    ticketsSold: (tour.ticketsSold || 0) + newTicketsSold,
                    totalRevenue: (tour.totalRevenue || 0) + revenue,
                    status: isFinished ? "finished" : "active",
                  };
                } else {
                  return { ...tour, status: "finished" };
                }
              }
              return tour;
            });
          }

          // 3. Process daily views for videos
          artistData.videos = artistData.videos.map((video) => {
            const isMtvPre2008 = video.isMtv && newDate.year < 2008;

            if (isMtvPre2008) {
              const baseRate = video.mtvWeeklyViews && video.mtvWeeklyViews > 0
                ? Math.floor(video.mtvWeeklyViews / 7)
                : Math.max(100, Math.floor((artistData.popularity * 450) / 7));
              const rotMult = video.mtvRotation === 'heavy' ? 2.5 : video.mtvRotation === 'buzzworthy' ? 1.8 : 1.2;
              const dayTvViews = Math.floor(baseRate * rotMult * (0.88 + Math.random() * 0.24));
              const tvIncome = Math.floor(dayTvViews * 0.002);
              artistData.money += tvIncome;

              return {
                ...video,
                mtvViews: (video.mtvViews || 0) + dayTvViews,
              };
            }

            const baseRate = video.lastWeekViews && video.lastWeekViews > 0
              ? Math.floor(video.lastWeekViews / 7)
              : Math.max(50, Math.floor((artistData.popularity * 300) / 7));
            const dayViews = Math.floor(baseRate * (0.88 + Math.random() * 0.24));
            const videoIncome = Math.floor(dayViews * VIEW_INCOME_MULTIPLIER);
            artistData.money += videoIncome;

            let spotifyViewsData = {};
            if (video.isOnSpotify) {
              const currentSpotifyDaily = video.spotifyDailyViews || [];
              const newSpotifyDaily = [...currentSpotifyDaily.slice(-6), Math.floor(dayViews * 0.8)];
              spotifyViewsData = {
                spotifyViews: (video.spotifyViews || 0) + Math.floor(dayViews * 0.8),
                spotifyDailyViews: newSpotifyDaily,
              };
            }

            return {
              ...video,
              views: video.views + dayViews,
              ...spotifyViewsData,
            };
          });

          // 4. Daily Social Growth
          artistData.youtubeSubscribers = (artistData.youtubeSubscribers || 0) + Math.floor(Math.random() * 8 + (artistData.popularity / 8));
          artistData.tiktokFollowers = (artistData.tiktokFollowers || 0) + Math.floor(Math.random() * 15 + (artistData.popularity / 5));
          artistData.instagramFollowers = (artistData.instagramFollowers || 0) + Math.floor(Math.random() * 12 + (artistData.popularity / 6));

          // 5. Daily fan posts
          if (Math.random() < 0.25) {
            const fanAccounts = artistData.xUsers?.filter((u) => !u.isPlayer && !u.isVerified) || [];
            const randomFan = fanAccounts[Math.floor(Math.random() * fanAccounts.length)];
            if (randomFan && artistProfile) {
              const releasedSongs = artistData.songs.filter((s) => s.isReleased && !s.isTakenDown);
              const randomSong = releasedSongs.length > 0 ? releasedSongs[Math.floor(Math.random() * releasedSongs.length)] : null;
              if (randomSong) {
                const dayMessages = [
                  `streaming "${randomSong.title}" all day today on repeat ðŸŽ§âœ¨`,
                  `"${randomSong.title}" by ${artistProfile.name} is on heavy rotation today!`,
                  `Day ${newDay} of the week and "${randomSong.title}" is still my favourite track ðŸ”¥`,
                  `Can we talk about how good "${randomSong.title}" is?? ${artistProfile.name} really didn't miss!`,
                ];
                artistData.xPosts.unshift({
                  id: crypto.randomUUID(),
                  authorId: randomFan.id,
                  content: dayMessages[Math.floor(Math.random() * dayMessages.length)],
                  likes: Math.floor(Math.random() * ((artistData.popularity || 20) * 40)) + 150,
                  retweets: Math.floor(Math.random() * ((artistData.popularity || 20) * 10)) + 30,
                  views: Math.floor(Math.random() * ((artistData.popularity || 20) * 800)) + 3000,
                  date: newDate,
                });
              }
            }
          }
          // 6. Daily Spotify Snapshot Posts on X
          const releasedSongs = artistData.songs.filter(s => s.isReleased && !s.isTakenDown);
          if (releasedSongs.length > 0 && artistProfile) {
            const topSongToday = [...releasedSongs].sort((a, b) => {
              const aDaily = a.dailyStreams?.[a.dailyStreams.length - 1] || 0;
              const bDaily = b.dailyStreams?.[b.dailyStreams.length - 1] || 0;
              return bDaily - aDaily;
            })[0];

            const topDailyStreams = topSongToday?.dailyStreams?.[topSongToday.dailyStreams.length - 1] || 0;
            if (topSongToday && topDailyStreams > 10000) {
              const prevDaily = topSongToday.dailyStreams && topSongToday.dailyStreams.length > 1
                ? topSongToday.dailyStreams[topSongToday.dailyStreams.length - 2]
                : Math.round(topDailyStreams * 0.95);
              const songDiff = topDailyStreams - prevDaily;
              const songPct = prevDaily > 0 ? (songDiff / prevDaily) * 100 : 0;
              const isBestDay = !topSongToday.peakDailyStreams || topDailyStreams > topSongToday.peakDailyStreams;
              
              if (isBestDay) {
                topSongToday.peakDailyStreams = topDailyStreams;
              }

              if (isBestDay || Math.random() < 0.4) {
                const jsonStr = JSON.stringify({
                  type: "song",
                  songName: topSongToday.title,
                  artistName: artistProfile.name,
                  coverArt: topSongToday.coverArt,
                  streams: topDailyStreams,
                  dailyStreams: topSongToday.dailyStreams,
                  totalStreams: topSongToday.streams,
                  changeVal: songDiff,
                  changePct: songPct,
                  isDaily: true,
                  tracks: [{
                    title: topSongToday.title,
                    dailyStreams: topDailyStreams,
                    weekly: topDailyStreams,
                    streams: topSongToday.streams,
                    totalStreams: topSongToday.streams,
                    changeVal: songDiff,
                    changePct: songPct,
                  }],
                  date: newDate,
                });

                artistData.xPosts.unshift({
                  id: crypto.randomUUID(),
                  authorId: "spotifysnapshot",
                  content: isBestDay
                    ? `ðŸ† "${topSongToday.title}" by ${artistProfile.name} has earned its BEST DAY EVER on Spotify with ${formatNumber(topDailyStreams)} streams!`
                    : `ðŸ“Š "${topSongToday.title}" by ${artistProfile.name} received ${formatNumber(topDailyStreams)} streams on Spotify yesterday (${songPct >= 0 ? '+' : ''}${songPct.toFixed(2)}%).`,
                  image: `snapshot:${jsonStr}`,
                  likes: Math.floor(Math.random() * 40000) + 10000,
                  retweets: Math.floor(Math.random() * 8000) + 2000,
                  views: Math.floor(Math.random() * 800000) + 200000,
                  date: newDate,
                });
              }
            }
          }
        }

        return {
          ...state,
          date: newDate,
          artistsData: updatedArtistsData,
        };
      }

      // NPC Churn Logic: Simulate new songs releasing
      let newNpcsList = [...state.npcs];
      
      // Remove dead/inactive artists
      newNpcsList = newNpcsList.filter(npc => {
          if (!NPC_ERAS[npc.artist]) return true;
          return newYear <= NPC_ERAS[npc.artist].end;
      });
      const CHURN_COUNT = 600;
      // Remove NPCs from the bottom of the list.
      if (newNpcsList.length > 2500) {
        newNpcsList.splice(2500, newNpcsList.length - 2500);
      }

      // Generate new NPCs, avoiding name collisions
      const allPlayerNamesForNpcs = [
        ...(state.allPlayerArtists?.map((a) => a.name) || []),
        state.soloArtist?.name,
        state.group?.name,
      ].filter((n): n is string => !!n);
      const newlyGeneratedNpcs = generateNewHits(CHURN_COUNT, newNpcsList, state.npcImages, allPlayerNamesForNpcs, state.date.year);

      // Add them back to the list
      newNpcsList.unshift(...newlyGeneratedNpcs);
      // Optional: simulate decay so old hits drop
      newNpcsList = newNpcsList.map(npc => ({...npc, basePopularity: Math.floor(npc.basePopularity * (0.97 + Math.random() * 0.02))}));
      newNpcsList.sort((a, b) => b.basePopularity - a.basePopularity);

      // NPC Album Churn Logic
      let newNpcAlbums = [...state.npcAlbums];
      
      // Remove dead/inactive artists' albums
      newNpcAlbums = newNpcAlbums.filter(album => {
          if (!NPC_ERAS[album.artist]) return true;
          return newYear <= NPC_ERAS[album.artist].end;
      });
      const ALBUM_CHURN_COUNT = 50;
      const MAX_ALBUMS = 500;
      if (newNpcAlbums.length > MAX_ALBUMS) {
        newNpcAlbums.splice(
          newNpcAlbums.length - ALBUM_CHURN_COUNT,
          ALBUM_CHURN_COUNT,
        );
      }
      newNpcAlbums = newNpcAlbums.map(album => ({...album, salesPotential: Math.floor((album.salesPotential || 3000) * (0.94 + Math.random() * 0.04))}));
      newNpcAlbums.sort((a, b) => (b.salesPotential || 0) - (a.salesPotential || 0));
      
      // Generate new albums using the newest songs
      const newestSongsForAlbums = newlyGeneratedNpcs.slice(
        0,
        ALBUM_CHURN_COUNT * 12,
      ); // Assuming max 12 songs per album
      const newlyGeneratedAlbums = generateNpcAlbums(
        ALBUM_CHURN_COUNT,
        newestSongsForAlbums,
        state.npcImages,
      );
      newNpcAlbums.unshift(...newlyGeneratedAlbums); // Add new albums to the top

      // --- NEW MUSIC FRIDAY TWEET LOGIC ---
      let popBaseNewMusicPost: XPost | null = null;
      try {
        const newMusicItems: {
          artist: string;
          title: string;
          type: "song" | "album";
        }[] = [];

        for (const artistId in state.artistsData) {
          const artistData = state.artistsData[artistId];
          const artistProfile = allPlayerArtistsAndGroups.find(
            (a) => a.id === artistId,
          );
          if (!artistProfile) continue;

          artistData.releases.forEach((release) => {
            if (
              !release.releasingLabel &&
              release.releaseDate?.week === newDate.week &&
              release.releaseDate?.year === newDate.year
            ) {
              newMusicItems.push({
                artist: artistProfile.name,
                title: release.title,
                type: release.type === "Single" ? "song" : "album",
              });
            }
          });

          artistData.labelSubmissions.forEach((sub) => {
            if (sub.status === "scheduled") {
              sub.singlesToRelease?.forEach((single) => {
                if (
                  single.releaseDate?.week === newDate.week &&
                  single.releaseDate?.year === newDate.year
                ) {
                  const song = artistData.songs.find(
                    (s) => s.id === single.songId,
                  );
                  if (song) {
                    newMusicItems.push({
                      artist: artistProfile.name,
                      title: song.title,
                      type: "song",
                    });
                  }
                }
              });
              if (
                sub.projectReleaseDate &&
                sub.projectReleaseDate.week === newDate.week &&
                sub.projectReleaseDate.year === newDate.year
              ) {
                newMusicItems.push({
                  artist: artistProfile.name,
                  title: sub.release.title,
                  type: "album",
                });
              }
            }
          });
        }

        newlyGeneratedAlbums.slice(0, 4).forEach((album) => {
          newMusicItems.push({
            artist: album.artist,
            title: album.title,
            type: "album",
          });
        });
        const npcAlbumSongIds = new Set(
          newlyGeneratedAlbums.slice(0, 4).flatMap((a) => a.songIds),
        );
        newlyGeneratedNpcs
          .filter((song) => !npcAlbumSongIds.has(song.uniqueId))
          .slice(0, 4)
          .forEach((song) => {
            newMusicItems.push({
              artist: song.artist,
              title: song.title,
              type: "song",
            });
          });

        if (newMusicItems.length > 0) {
          const shuffledItems = newMusicItems
            .sort(() => 0.5 - Math.random())
            .slice(0, 8);
          const content =
            "New music out tonight:\n\n" +
            shuffledItems
              .map((item) => {
                const emoji = item.type === "album" ? "ðŸ’¿" : "ðŸŽµ";
                return `â€¢ ${item.artist} â€” ${item.title} ${emoji}`;
              })
              .join("\n");

          popBaseNewMusicPost = {
            id: crypto.randomUUID(),
            authorId: "popbase",
            content: content,
            likes: Math.floor(Math.random() * 8000) + 4000,
            retweets: Math.floor(Math.random() * 1500) + 400,
            views: Math.floor(Math.random() * 200000) + 80000,
            date: newDate,
          };
        }
      } catch (e) {
        console.error("Error generating New Music Friday tweet:", e);
      }

      let contractRenewalForActivePlayer: GameState["contractRenewalOffer"] =
        null;
      const updatedArtistsData: { [id: string]: ArtistData } = JSON.parse(
        JSON.stringify(state.artistsData),
      );

      const allCustomLabels: CustomLabel[] = [];
      for (const artistId in updatedArtistsData) {
        allCustomLabels.push(...updatedArtistsData[artistId].customLabels);
      }

      const playerArtistIds = new Set(
        allPlayerArtistsAndGroups.map((a) => a.id),
      );

      let leakedSongThisWeek: Song | null = null;
      let leakEncounterThisWeek: ActiveEncounter | null = null;
      let tiktokEncounterThisWeek: ActiveEncounter | null = null;
      let tourDynamicPricingEncounter: ActiveEncounter | null = null;
      let tourArrestEncounter: ActiveEncounter | null = null;

      if (state.group) {
        const groupData = updatedArtistsData[state.group.id];
        if (groupData) {
          state.group.members.forEach((m) => {
            const mData = updatedArtistsData[m.id];
            if (mData) {
              mData.hype = groupData.hype;
              mData.popularity = Math.max(
                0,
                Math.floor(groupData.popularity * 0.75),
              );
            }
          });
        }
      }

      for (const artistId in updatedArtistsData) {
        const artistData = updatedArtistsData[artistId];
        let startingMoneyForWeek = artistData.money;
        
        // Deduct recurring expenses
        if (artistData.recurringExpenses) {
            let totalDeducted = 0;
            artistData.recurringExpenses.forEach(exp => {
                if (exp.type === 'weekly') {
                    totalDeducted += exp.cost;
                } else if (exp.type === 'monthly' && newDate.week % 4 === 0) {
                    totalDeducted += exp.cost;
                }
            });
            artistData.money -= totalDeducted;
            startingMoneyForWeek = artistData.money;
        }
        const currentAbsWeek = newDate.year * 52 + newDate.week;
        
        // Hiatus & fans asking for comeback logic
        const releases = artistData.releases || [];
        const recentRelease = releases.length > 0 ? releases[releases.length - 1] : null;
        if (recentRelease) {
            const recentReleaseAbs = recentRelease.releaseDate.year * 52 + recentRelease.releaseDate.week;
            const weeksSinceRelease = currentAbsWeek - recentReleaseAbs;
            
            if (weeksSinceRelease >= 52 && (weeksSinceRelease % 4 === 0)) {
                if (Math.random() < 0.25) {
                    const fanAccounts = artistData.xUsers.filter(u => !u.isPlayer && u.id.startsWith("fan_"));
                    const randomFan = fanAccounts[Math.floor(Math.random() * fanAccounts.length)];
                    const activeArtistInfo = allPlayerArtistsAndGroups.find(a => a.id === artistId);
                    if (randomFan && activeArtistInfo) {
                        const msgOptions = [
                           `Where is ${activeArtistInfo.name}?? It's been over a year since we got a new release ðŸ˜­`,
                           `I miss ${activeArtistInfo.name} so much, we need a comeback ASAP`,
                           `Is ${activeArtistInfo.name} officially on hiatus or did they retire? Give us something!`,
                           `waiting for a ${activeArtistInfo.name} comeback like ðŸ’€`,
                           `If ${activeArtistInfo.name} doesn't drop something soon I'm gonna lose it`
                        ];
                        const newPost = {
                           id: crypto.randomUUID(),
                           authorId: randomFan.id,
                           content: msgOptions[Math.floor(Math.random() * msgOptions.length)],
                           likes: Math.floor(Math.random() * ((artistData.popularity || 50) * 80)) + 500,
                           retweets: Math.floor(Math.random() * ((artistData.popularity || 50) * 20)) + 100,
                           views: Math.floor(Math.random() * ((artistData.popularity || 50) * 3000)) + 10000,
                           date: newDate
                        };
                        artistData.xPosts.unshift(newPost);
                    }
                }
            }
        }
        
        if (artistData.isHiatus && artistData.hiatusStartYear !== undefined && artistData.hiatusStartWeek !== undefined) {
             const hiatusStartAbs = artistData.hiatusStartYear * 52 + artistData.hiatusStartWeek;
             const hiatusWeeks = currentAbsWeek - hiatusStartAbs;
             if (hiatusWeeks > 104) { // More than 2 years
                 let anticipation = 50;
                 if (artistData.popularity > 85) anticipation = 100;
                 else if (artistData.popularity > 50) anticipation = 80;
                 artistData.comebackAnticipation = anticipation;
             }
        }

        // Group members hiatus progression & fan demands / boycott tweets
        if (state.group && state.group.members) {
          const groupName = state.group.name;
          const groupTag = groupName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

          state.group.members.forEach((member) => {
            const mData = artistData.id === member.id ? artistData : state.artistsData[member.id];
            if (mData && mData.isHiatus && mData.hiatusStartYear !== undefined && mData.hiatusStartWeek !== undefined) {
              const hiatusStartAbs = mData.hiatusStartYear * 52 + mData.hiatusStartWeek;
              const hiatusWeeks = currentAbsWeek - hiatusStartAbs;
              const memberTag = member.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

              // Hiatus gets longer (2-29 weeks): Fans demand comeback
              if (hiatusWeeks >= 2 && hiatusWeeks < 30) {
                if (Math.random() < 0.35) {
                  const comebackDemands = [
                    `It's been ${hiatusWeeks} weeks without ${member.name}... WE NEED A COMEBACK ðŸ˜­`,
                    `I miss ${member.name} so much in ${groupName}, please come back soon!`,
                    `When is ${member.name} returning from hiatus?? ${groupName} is not complete without them!`,
                    `Day ${hiatusWeeks * 7} of waiting for ${member.name} to return to ${groupName} ðŸ’”`,
                    `WE WANT ${member.name} BACK IN ${groupName}! #COMEBACK`,
                    `Please ${groupName} management, give us an update on ${member.name}'s return! ðŸ™`
                  ];
                  const chosenText = comebackDemands[Math.floor(Math.random() * comebackDemands.length)];
                  const fanUsers = artistData.xUsers?.filter(u => !u.isPlayer && !u.isVerified) || [];
                  const authorId = fanUsers.length > 0 ? fanUsers[Math.floor(Math.random() * fanUsers.length)].id : `fan_cb_${hiatusWeeks}`;

                  artistData.xPosts.unshift({
                    id: crypto.randomUUID(),
                    authorId,
                    content: chosenText,
                    likes: Math.floor(Math.random() * 40000) + 8000,
                    retweets: Math.floor(Math.random() * 10000) + 2000,
                    views: Math.floor(Math.random() * 500000) + 80000,
                    date: newDate,
                  });
                }
              }

              // After 30 weeks: Fans boycott
              if (hiatusWeeks >= 30) {
                if (Math.random() < 0.45) {
                  const boycottTweets = [
                    `It's been ${hiatusWeeks} weeks since ${member.name} went on hiatus! WE WILL NOT STAY SILENT! #BOYCOTT${groupTag} #FREE${memberTag} #BRING${memberTag}BACK`,
                    `No ${member.name} = NO SUPPORT! Bring ${member.name} back to ${groupName}! #BOYCOTT${groupTag} #FREE${memberTag} #BRING${memberTag}BACK`,
                    `${hiatusWeeks} WEEKS OF HIATUS IS UNACCEPTABLE. WE DEMAND ANSWERS! #BOYCOTT${groupTag} #FREE${memberTag} #BRING${memberTag}BACK`
                  ];
                  const chosenText = boycottTweets[Math.floor(Math.random() * boycottTweets.length)];
                  const fanUsers = artistData.xUsers?.filter(u => !u.isPlayer && !u.isVerified) || [];
                  const authorId = fanUsers.length > 0 ? fanUsers[Math.floor(Math.random() * fanUsers.length)].id : `fan_bc_${hiatusWeeks}`;

                  artistData.xPosts.unshift({
                    id: crypto.randomUUID(),
                    authorId,
                    content: chosenText,
                    likes: Math.floor(Math.random() * 80000) + 15000,
                    retweets: Math.floor(Math.random() * 25000) + 5000,
                    views: Math.floor(Math.random() * 900000) + 150000,
                    date: newDate,
                  });
                }
              }
            }
          });
        }

        let newEmails: Email[] = [];
        const artistProfileForEmail = allPlayerArtistsAndGroups.find(
          (a) => a.id === artistId,
        );

        // Prune X messages older than 24 weeks
        const currentAbsoluteWeek = newDate.year * 52 + newDate.week;
        artistData.xChats.forEach(chat => {
            chat.messages = chat.messages.filter(msg => {
                const msgAbsoluteWeek = msg.date.year * 52 + msg.date.week;
                return currentAbsoluteWeek - msgAbsoluteWeek <= 24;
            });
        });

        // --- KAI CENAT STREAM LOGIC ---
        if (artistData.twitchStreams) {
            artistData.twitchStreams.forEach((stream) => {
                // Announce stream
                if (stream.announceDate.year === newDate.year && stream.announceDate.week === newDate.week && !stream.hasAnnounced) {
                    stream.hasAnnounced = true;
                    const textOpts = [
                        `Tomorrow We Run It Back`,
                        `STREAMING WITH ${artistProfileForEmail?.name || "the goat"}!!!`,
                        `Join up next week with ${artistProfileForEmail?.name || "the goat"}`
                    ];
                    let text = artistData.hasStreamedWithKai ? textOpts[0] : (Math.random() > 0.5 ? textOpts[1] : textOpts[2]);
                    
                    const newPost = {
                        id: `kai_announce_${Date.now()}`,
                        senderId: "kai_cenat",
                        senderName: "Kai Cenat",
                        content: text,
                        date: newDate,
                        likes: Math.floor(Math.random() * 50000) + 20000,
                        reposts: Math.floor(Math.random() * 5000) + 1000,
                        replies: Math.floor(Math.random() * 2000) + 500,
                        image: stream.promoBanner
                    };
                    artistData.xFeed = [newPost, ...(artistData.xFeed || [])];
                }
                
                // Stream happens
                if (stream.scheduledDate.year === newDate.year && stream.scheduledDate.week === newDate.week && !stream.hasStreamed) {
                    stream.hasStreamed = true;
                    artistData.hasStreamedWithKai = true;
                    
                    // Add video
                    let viewers = 0;
                    if (artistData.popularity >= 100) {
                       viewers = Math.floor(Math.random() * (1300000 - 750000)) + 750000;
                    } else if (artistData.popularity >= 60) {
                       const ratio = (artistData.popularity - 60) / 40;
                       viewers = 12000 + ratio * (750000 - 12000) + Math.random() * 20000;
                    } else {
                       viewers = Math.floor(artistData.popularity * 200) + Math.random() * 5000;
                    }
                    
                    artistData.videos.unshift({
                        id: `live_stream_${Date.now()}`,
                        songId: stream.songId,
                        title: `Going To ${stream.location} With ${artistProfileForEmail?.name || "Artist"}`,
                        type: "Live Stream",
                        views: viewers, // Will represent viewers while live
                        thumbnail: stream.ytThumbnail,
                        releaseDate: newDate,
                        isLive: true,
                        liveViewers: viewers
                    });
                    
                    // Send feedback email
                    const resultRand = Math.random();
                    let feedback = "";
                    let subject = "";
                    if (resultRand < 0.33) {
                       feedback = "good";
                       subject = "Stream went crazy!";
                       artistData.popularity = Math.min(100, artistData.popularity + 5);
                       artistData.publicImage = Math.min(100, artistData.publicImage + 5);
                    } else if (resultRand < 0.66) {
                       feedback = "neutral";
                       subject = "Stream was aight";
                    } else {
                       feedback = "bad";
                       subject = "Bro that stream was rough";
                       artistData.publicImage = Math.max(0, artistData.publicImage - 15);
                       artistData.popularity = Math.max(0, artistData.popularity - 5);
                    }
                    
                    newEmails.push({
                        id: `kai_feedback_${Date.now()}`,
                        sender: "Kai Cenat",
                        senderIcon: "twitch",
                        subject,
                        body: `Yo, that stream was ${feedback === 'good' ? 'insane, we gotta do it again' : (feedback === 'neutral' ? 'coo, chat was kinda slow but we chilled' : 'kinda messy, chat was not feeling it tbh')}. Appreciate you coming out though.`,
                        date: newDate,
                        isRead: false
                    });
                }
            });
        }
        
        // Convert old live streams to regular videos
        artistData.videos.forEach(v => {
            if (v.type === "Live Stream" && v.isLive && (v.releaseDate.year !== newDate.year || v.releaseDate.week !== newDate.week)) {
                v.isLive = false;
                v.views = v.liveViewers || v.views; // Start accumulating regular views from here
            }
        });
        
        // Natural Invite
        if (artistData.popularity >= 50 && Math.random() < 0.05) {
            // Check if released a lead single recently
            const recentLeadSingle = artistData.songs.some(s => s.trait === "Lead Single" && s.isReleased && s.releaseDate && (newDate.year * 52 + newDate.week - (s.releaseDate.year * 52 + s.releaseDate.week)) <= 4);
            if (recentLeadSingle) {
                const newEmailId = `kai_invite_${Date.now()}`;
                if (!artistData.inbox.some(e => e.offer?.type === 'kaiStreamSetup' && !e.offer.isSubmitted)) {
                    newEmails.push({
                        id: newEmailId,
                        sender: "Kai Cenat",
                        senderIcon: "twitch",
                        subject: "Stream with me?",
                        body: "Yo! Love the new lead single. Wanna come on my stream? I'll cover your flight costs. Let's make it epic.",
                        date: newDate,
                        isRead: false,
                        offer: { type: "kaiStreamSetup", emailId: newEmailId }
                    });
                }
            }
        }

        // --- MANAGER AUTOMATIONS ---
        if (artistData.manager?.autoDistributeAscap || artistData.manager?.autoDistributeFreeSongsToAscap) {
          artistData.songs = artistData.songs.map((song) => {
            if (
              song.isReleased &&
              !song.isAvailableOnStreaming &&
              !song.isTakenDown
            ) {
              const cost = artistData.contract !== null ? 0 : 1500;
              if (artistData.money >= cost) {
                 artistData.money -= cost;
                 return { ...song, isAvailableOnStreaming: true };
              }
            }
            return song;
          });
        }

        if (artistData.manager?.autoMakeOfficialAudio) {
          const defaultThumbnail =
            artistData.artistVideoThumbnails.length > 0
              ? artistData.artistVideoThumbnails[0]
              : "";
          artistData.songs.forEach((song) => {
            if (song.isReleased && !song.isTakenDown) {
              const hasAudio = artistData.videos.some(
                (v) =>
                  v.songId === song.id &&
                  v.type === "Custom" &&
                  v.title.includes("Official Audio"),
              );
              if (!hasAudio) {
                const release = artistData.releases.find((r) =>
                  r.songIds.includes(song.id),
                );
                const thumbnail = release?.coverArt || defaultThumbnail;
                artistData.videos.push({
                  id: crypto.randomUUID(),
                  songId: song.id,
                  title: `${song.title} (Official Audio)`,
                  type: "Custom",
                  views: 0,
                  thumbnail: thumbnail,
                  releaseDate: newDate,
                  artistId: artistId,
                  channelId: artistId,
                });
              }
            }
          });
        }

        if (popBaseNewMusicPost) {
          artistData.xPosts.unshift(popBaseNewMusicPost);
        }

        // --- MYSPACE LOGIC ---
        if (artistData.mySpaceData) {
          artistData.mySpaceData.profileViews =
            (artistData.mySpaceData.profileViews || 0) +
            Math.floor(artistData.popularity * 10) +
            Math.floor(artistData.hype * 2);
        }

        // --- MANAGER LOGIC ---
        if (artistData.manager) {
          const manager = MANAGERS.find((m) => m.id === artistData.manager!.id);
          const contractEnded =
            newDate.year > artistData.manager.contractEndDate.year ||
            (newDate.year === artistData.manager.contractEndDate.year &&
              newDate.week >= artistData.manager.contractEndDate.week);

          if (contractEnded) {
            artistData.manager = null;
            if (manager) {
              artistData.popularity = Math.max(
                0,
                artistData.popularity - manager.popularityBoost,
              );
            }
            if (artistProfileForEmail) {
              newEmails.push({
                id: crypto.randomUUID(),
                sender: "Business Alert",
                senderIcon: "business",
                subject: "Manager Contract Expired",
                body: `Hi ${artistProfileForEmail.name},

Your yearly contract with ${manager?.name || "your manager"} has expired. You will need to hire a new one if you wish to continue using management services.

- Red Mic Business Team`,
                date: newDate,
                isRead: false,
              });
            }
          } else {
            // Auto-book gigs
            const gigsToBook = manager?.autoGigsPerWeek || 0;
            const availableGigs = GIGS.filter((g) =>
              g.isAvailable(artistData),
            ).sort((a, b) => b.cashRange[1] - a.cashRange[1]);
            let gigsBookedThisWeek = 0;
            let weeklyGigIncome = 0;
            let weeklyGigHype = 0;
            let bookedGigNames = [];

            for (const gig of availableGigs) {
              if (gigsBookedThisWeek < gigsToBook) {
                const cashEarned =
                  Math.floor(
                    Math.random() * (gig.cashRange[1] - gig.cashRange[0] + 1),
                  ) + gig.cashRange[0];
                weeklyGigIncome += cashEarned;
                weeklyGigHype += gig.hype;
                bookedGigNames.push(
                  `- ${gig.name}: $${formatNumber(cashEarned)}, +${gig.hype} hype`,
                );
                gigsBookedThisWeek++;
              }
            }
            if (gigsBookedThisWeek > 0) {
              artistData.money += weeklyGigIncome;
              artistData.hype = Math.min(
                getHypeCap(artistData),
                artistData.hype + weeklyGigHype,
              );
              let regionBoostText = "";
              if (artistData.manager?.autoGigRegion) {
                if (!artistData.regionalPopularity) {
                  artistData.regionalPopularity = {
                    "US": 0, "Canada": 0, "UK": 0, "Latin America": 0, "Asia": 0, "Africa": 0
                  };
                }
                let targetRegion = artistData.manager.autoGigRegion;
                if (targetRegion === "Random") {
                  const regions = ["US", "Canada", "UK", "Latin America", "Asia", "Africa"];
                  targetRegion = regions[Math.floor(Math.random() * regions.length)] as any;
                }
                if (targetRegion && targetRegion !== "Random") {
                    artistData.regionalPopularity[targetRegion] = Math.min(100, (artistData.regionalPopularity[targetRegion] || 0) + gigsBookedThisWeek);
                    regionBoostText = `
We focused bookings in ${targetRegion}, giving you a +${gigsBookedThisWeek} popularity boost there!`;
                }
              }
              artistData.popularity = Math.min(100, (artistData.popularity || 0) + gigsBookedThisWeek);

              if (artistProfileForEmail) {
                newEmails.push({
                  id: crypto.randomUUID(),
                  sender: manager?.name || "Your Manager",
                  senderIcon: "business",
                  subject: `Weekly Gig Report`,
                  body: `Hi ${artistProfileForEmail.name},

I've booked ${gigsBookedThisWeek} gig(s) for you this week, earning a total of $${formatNumber(weeklyGigIncome)} and +${weeklyGigHype} hype.${regionBoostText}

Details:
${bookedGigNames.join("\n")}

Keep up the great work!

Best,
${manager?.name}`,
                  date: newDate,
                  isRead: false,
                });
              }
            }
          }
        }

        // --- SECURITY LOGIC ---
        if (artistData.securityTeamId) {
          const team = SECURITY_TEAMS.find(
            (s) => s.id === artistData.securityTeamId,
          );
          if (team) {
            if (artistData.money < team.weeklyCost) {
              artistData.securityTeamId = null;
              if (artistProfileForEmail) {
                newEmails.push({
                  id: crypto.randomUUID(),
                  sender: "Business Alert",
                  senderIcon: "business",
                  subject: "Security Payment Failed",
                  body: `Hi ${artistProfileForEmail.name},

Your weekly payment of $${formatNumber(team.weeklyCost)} for ${team.name} failed due to insufficient funds. Your security contract has been terminated.

- Red Mic Business Team`,
                  date: newDate,
                  isRead: false,
                });
              }
            } else {
              artistData.money -= team.weeklyCost;
            }
          }
        }

        // --- PROMOTION PAYMENT LOGIC ---
        let totalWeeklyPromoCost = artistData.promotions.reduce(
          (sum, p) => sum + p.weeklyCost,
          0,
        );

        if (totalWeeklyPromoCost > 0) {
          let costToArtist = totalWeeklyPromoCost;
          let coveredByBudget = 0;

          if (
            artistData.contract &&
            artistData.contract.marketingBudget &&
            artistData.contract.marketingBudget > 0
          ) {
            const amountToCover = Math.min(
              artistData.contract.marketingBudget,
              costToArtist,
            );
            artistData.contract.marketingBudget -= amountToCover;
            coveredByBudget = amountToCover;
            costToArtist -= amountToCover;
          }

          if (costToArtist > 0 && artistData.money < costToArtist) {
            // Can't afford the remaining cost, cancel all promotions
            artistData.promotions = [];
            if (artistProfileForEmail) {
              newEmails.push({
                id: crypto.randomUUID(),
                sender: "Red Mic Promotions",
                subject: "Promotion Payment Failed",
                body: `Hi ${artistProfileForEmail.name},

Your weekly payment of $${formatNumber(totalWeeklyPromoCost)} for active promotions could not be processed due to insufficient funds.

All your active promotions have been cancelled.

- The Red Mic Team`,
                date: newDate,
                isRead: false,
                senderIcon: "default",
              });
            }
          } else {
            // Can afford, deduct cost and send invoice
            if (costToArtist > 0) {
              artistData.money -= costToArtist;
            }

            if (artistProfileForEmail) {
              let invoiceBody = `Hi ${artistProfileForEmail.name},

This is your invoice for this week's promotions.`;

              if (coveredByBudget > 0) {
                invoiceBody += `
Your label's marketing budget covered $${formatNumber(coveredByBudget)}.
`;
              }

              if (costToArtist > 0) {
                invoiceBody += `
A total of $${formatNumber(costToArtist)} has been deducted from your personal account.

Breakdown:
`;
              } else {
                invoiceBody += `
The entire cost was covered by your marketing budget.

Breakdown:
`;
              }

              artistData.promotions.forEach((p) => {
                const item =
                  p.itemType === "video"
                    ? artistData.videos.find((v) => v.id === p.itemId)
                    : artistData.songs.find((s) => s.id === p.itemId);
                invoiceBody += `â€¢ ${p.promoType} for "${item?.title || "Item"}": $${formatNumber(p.weeklyCost)}
`;
              });

              invoiceBody += `
Promotions will automatically renew next week. You can cancel them at any time in the 'Promote' menu.

- The Red Mic Team`;

              newEmails.push({
                id: crypto.randomUUID(),
                sender: "Red Mic Promotions",
                subject: `Weekly Promotion Invoice: $${formatNumber(totalWeeklyPromoCost)}`,
                body: invoiceBody,
                date: newDate,
                isRead: false,
                senderIcon: "default",
              });
            }
          }
        }

        // --- TOUR LOGIC ---
        artistData.tours = artistData.tours.map((tour) => {
          // Process Presale Queue
          if (
            tour.presaleCollectionQueue &&
            tour.presaleCollectionQueue.length > 0
          ) {
            let newlyCollected = 0;
            const newQueue: typeof tour.presaleCollectionQueue = [];
            tour.presaleCollectionQueue.forEach((item) => {
              if (item.weeksRemaining <= 1) {
                newlyCollected += item.amount;
              } else {
                newQueue.push({
                  weeksRemaining: item.weeksRemaining - 1,
                  amount: item.amount,
                });
              }
            });

            if (newlyCollected > 0) {
              artistData.money += newlyCollected;

              if (artistProfileForEmail) {
                newEmails.push({
                  id: crypto.randomUUID(),
                  sender: "Ticketmaster/Live Nation",
                  subject: `Presale Funds Disbursed ($${formatNumber(newlyCollected)})`,
                  body: `Hi ${artistProfileForEmail.name},

Your presale funds for ${tour.name} of $${formatNumber(newlyCollected)} have finished processing and were deposited into your account.

Thanks,
Live Nation`,
                  date: newDate,
                  isRead: false,
                  senderIcon: "default",
                });
              }
            }
          }

          if (tour.status === "active") {
            const showsToPerform = Math.min(
              isDailyMode ? 1 : (tour.showsPerWeek || 1),
              tour.venues.length - tour.currentVenueIndex
            );

            if (showsToPerform > 0) {
              const newVenues = [...tour.venues];
              let totalWeeklyTicketsSold = 0;
              let totalWeeklyRevenue = 0;
              let currentIdx = tour.currentVenueIndex;

              for (let showCount = 0; showCount < showsToPerform; showCount++) {
                const venueIdx = currentIdx + showCount;
                if (venueIdx >= tour.venues.length) break;
                const venue = tour.venues[venueIdx];

                // Calculate sales
                let baseDemand =
                  artistData.popularity * 800 + artistData.hype * 50;

                let supportDemand = 0;
                if (tour.openerId) {
                  const op = state.npcs?.find((n) => n.uniqueId === tour.openerId);
                  if (op) supportDemand += op.basePopularity / 2000;
                }
                if (tour.guestIds) {
                  tour.guestIds.forEach((gid) => {
                    const gu = state.npcs?.find((n) => n.uniqueId === gid);
                    if (gu) supportDemand += gu.basePopularity / 4000;
                  });
                }
                baseDemand += supportDemand;

                let priceSensitivity = 1.2 - venue.ticketPrice / 200;
                let demand = baseDemand * Math.max(0.1, priceSensitivity);
                demand = demand * (0.8 + Math.random() * 0.4);

                if (tour.isSetlistMissingHits) {
                  demand = demand * 0.5;
                }

                let newTicketsSold = Math.floor(
                  Math.min(venue.capacity - (venue.ticketsSold || 0), demand)
                );

                let actualTicketPrice = venue.ticketPrice;
                if (tour.useDynamicPricing) {
                  actualTicketPrice = venue.ticketPrice * (Math.random() * 2 + 2);
                  artistData.publicImage = Math.max(
                    0,
                    artistData.publicImage - 1
                  );

                  if (Math.random() < 0.05 && !tourDynamicPricingEncounter) {
                    tourDynamicPricingEncounter = {
                      id: `ticketmaster-${tour.id}-${newDate.year}-${newDate.week}`,
                      text: `BREAKING: The Department of Justice has opened an antitrust investigation into your tour's use of Dynamic Pricing after fans complained about paying $4,000 for nosebleeds. You are facing a massive PR disaster.`,
                      requiresImage: false,
                      choices: [
                        {
                          label:
                            "Apologize and refund the scalped fees (Huge PR win, lose money)",
                          publicImageEffect: 30,
                          hypeEffect: 10,
                          popularityEffect: 5,
                          moneyEffect: -(
                            newTicketsSold *
                            actualTicketPrice *
                            0.5
                          ),
                          tweetTemplate:
                            "{artist} apologizes for the crazy dynamic pricing and refunds fans. Huge respect!",
                          authorName: "Music Daily",
                          isTMZ: true,
                        },
                        {
                          label:
                            "Blame Ticketmaster and move on. (PR hit, keep the cash)",
                          publicImageEffect: -20,
                          hypeEffect: -5,
                          popularityEffect: -5,
                          moneyEffect: 0,
                          tweetTemplate:
                            "Fans furious as {artist} blames Ticketmaster for the ridiculous dynamic pricing...",
                          authorName: "TMZ",
                          isTMZ: true,
                        },
                      ],
                    };
                  }
                }

                if (
                  !tourArrestEncounter &&
                  (venue.region === "Middle East" ||
                    venue.region === "Asia" ||
                    venue.region === "Africa")
                ) {
                  if (Math.random() < 0.05) {
                    const bailAmount = Math.floor(
                      100000 + Math.random() * 900000
                    );
                    tourArrestEncounter = {
                      id: `arrest-${tour.id}-${newDate.year}-${newDate.week}`,
                      text: `BREAKING: You were arrested in ${venue.city} (${venue.region}) for allegedly breaking strict conduct/dress code policies! You are detained, and TMZ has already dropped the article. You can pay a heavy bond to get released or cancel the tour leg.`,
                      requiresImage: false,
                      choices: [
                        {
                          label: `Pay the bond ($${formatNumber(bailAmount)}) and continue the tour. (Money lost, PR mixed)`,
                          publicImageEffect: -10,
                          hypeEffect: 20,
                          popularityEffect: 0,
                          moneyEffect: -bailAmount,
                          tweetTemplate: `TMZ EXCLUSIVE: {artist} ARRESTED in ${venue.city}! Bail set at $${formatNumber(bailAmount)}... #Free{artist}`,
                          authorName: "TMZ",
                          isTMZ: true,
                        },
                        {
                          label:
                            "Refuse to pay, spend the night in jail, and CANCEL the rest of the tour. (Massive PR hit, huge hype drop)",
                          publicImageEffect: -30,
                          hypeEffect: -25,
                          popularityEffect: -10,
                          moneyEffect: 0,
                          tourAction: { action: "CANCEL", tourId: tour.id },
                          tweetTemplate: `TMZ EXCLUSIVE: {artist} stays in jail in ${venue.city} and cancels the remaining tour dates. Fans are furious.`,
                          authorName: "TMZ",
                          isTMZ: true,
                        },
                      ],
                    };
                  }
                }

                let revenue = newTicketsSold * actualTicketPrice;

                if (tour.useVipPackages) {
                  const vipTickets = Math.floor(newTicketsSold * 0.05);
                  revenue += vipTickets * (actualTicketPrice * 4);
                }

                let merchRevenue = 0;
                if (tour.merchItems && tour.merchItems.length > 0) {
                  artistData.merch = artistData.merch.map((item) => {
                    const isTourMerch = tour.merchItems?.find(
                      (m) => m.id === item.id
                    );
                    if (isTourMerch && item.stock > 0) {
                      const price = item.price;
                      const safePrice = Math.max(0.01, price);
                      let buyerRate =
                        (0.1 + Math.random() * 0.2) *
                        Math.min(1, 20 / safePrice);
                      buyerRate = Math.min(buyerRate, 0.4);
                      let buyers = Math.floor(newTicketsSold * buyerRate);
                      buyers = Math.min(buyers, item.stock);
                      const itemRev = buyers * price;
                      merchRevenue += itemRev;
                      return {
                        ...item,
                        stock: item.stock - buyers,
                        unitsSold: (item.unitsSold || 0) + buyers,
                        _actualWeeklySales:
                          (item._actualWeeklySales || 0) + buyers,
                      };
                    }
                    return item;
                  });
                  revenue += merchRevenue;
                }

                const updatedVenue = {
                  ...venue,
                  ticketsSold: (venue.ticketsSold || 0) + newTicketsSold,
                  revenue: (venue.revenue || 0) + revenue,
                  soldOut:
                    (venue.ticketsSold || 0) + newTicketsSold >= venue.capacity,
                };

                newVenues[venueIdx] = updatedVenue;
                totalWeeklyTicketsSold += newTicketsSold;
                totalWeeklyRevenue += revenue;

                artistData.money += revenue;

                if (!artistData.regionalPopularity) {
                  artistData.regionalPopularity = {
                    US: artistData.popularity || 0,
                    Canada: 0,
                    UK: 0,
                    "Latin America": 0,
                    Asia: 0,
                    Africa: 0,
                  };
                }
                const vReg = venue.region || "North America";
                let gameReg = "US";
                if (vReg === "Europe") gameReg = "UK";
                else if (
                  vReg === "South America" ||
                  venue.city === "Mexico City"
                )
                  gameReg = "Latin America";
                else if (
                  vReg === "Asia" ||
                  vReg === "Middle East" ||
                  vReg === "Oceania"
                )
                  gameReg = "Asia";
                else if (vReg === "Africa") gameReg = "Africa";
                else if (
                  venue.city === "Toronto" ||
                  venue.city === "Montreal" ||
                  venue.city === "Vancouver"
                )
                  gameReg = "Canada";

                artistData.regionalPopularity[gameReg] = Math.min(
                  100,
                  (artistData.regionalPopularity[gameReg] || 0) + 1
                );

                if (updatedVenue.soldOut) {
                  artistData.hype = Math.min(
                    getHypeCap(artistData),
                    artistData.hype + 5
                  );
                }

                if (artistProfileForEmail && updatedVenue.soldOut && showCount === 0) {
                  const postContent = `Sold out show in ${venue.city} tonight! Thank you all for coming out! â¤ï¸ #TourLife`;
                  artistData.xPosts.unshift({
                    id: crypto.randomUUID(),
                    authorId: artistProfileForEmail.id,
                    content: postContent,
                    likes: Math.floor(newTicketsSold * 0.5),
                    retweets: Math.floor(newTicketsSold * 0.1),
                    views: Math.floor(newTicketsSold * 10),
                    date: newDate,
                  });
                }
              }

              // NPC Celebrity Tour Attendance Tweet (weekly mode)
              if ((artistData.popularity || 0) >= 50 && artistProfileForEmail) {
                const attendanceChance = Math.min(1.0, (artistData.popularity || 0) / 100);
                if (Math.random() < attendanceChance) {
                  const currentVenue = tour.venues[currentIdx] || tour.venues[0];
                  const npcName = getRandomNpcName([artistProfileForEmail.name], newDate.year);
                  const npcImg = getArtistImage(npcName);
                  const playerImg = artistProfileForEmail.imageUrl || (artistProfileForEmail as any).image || artistData.avatar || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80";
                  const showCity = currentVenue?.city || "London";

                  artistData.xPosts.unshift({
                    id: crypto.randomUUID(),
                    authorId: "popbase",
                    content: `${npcName} is attending ${artistProfileForEmail.name}â€™s show tonight in ${showCity}.`,
                    image: npcImg,
                    image2: playerImg,
                    likes: Math.floor(Math.random() * 60000) + 20000,
                    retweets: Math.floor(Math.random() * 12000) + 3000,
                    views: Math.floor(Math.random() * 800000) + 250000,
                    date: newDate,
                  });
                }
              }

              const nextIndex = currentIdx + showsToPerform;
              const isFinished = nextIndex >= tour.venues.length;

              return {
                ...tour,
                venues: newVenues,
                currentVenueIndex: nextIndex,
                ticketsSold: tour.ticketsSold + totalWeeklyTicketsSold,
                totalRevenue: tour.totalRevenue + totalWeeklyRevenue,
                status: isFinished ? "finished" : "active",
              };
            } else {
              return { ...tour, status: "finished" };
            }
          }
          return tour;
        });

        // --- BRAND AMBASSADOR CONTRACT WEEKLY TICK ---
        if (artistData.activeBrandAmbassadorContract) {
          const contract = artistData.activeBrandAmbassadorContract;
          contract.remainingWeeks -= 1;
          artistData.money += contract.weeklyPayout;
          contract.totalEarned += contract.weeklyPayout;
          artistData.popularity = Math.min(100, (artistData.popularity || 0) + 1);
          artistData.hype = Math.min(getHypeCap(artistData), (artistData.hype || 0) + 2);

          if (contract.remainingWeeks <= 0) {
            if (artistProfileForEmail) {
              newEmails.push({
                id: crypto.randomUUID(),
                sender: contract.brandName,
                senderIcon: "default",
                subject: `Brand Ambassador Contract Completed - ${contract.brandName}`,
                body: `Congratulations ${artistProfileForEmail.name}! Your ${contract.durationWeeks}-week brand ambassador partnership with ${contract.brandName} has successfully concluded. Total earnings: $${formatNumber(contract.totalEarned)}. Thank you for representing our brand!`,
                date: newDate,
                isRead: false
              });
            }
            artistData.activeBrandAmbassadorContract = null;
          }
        }

        // --- SONG MEDIA SYNC LICENSES WEEKLY TICK ---
        if (artistData.activeSyncLicenses && artistData.activeSyncLicenses.length > 0) {
          artistData.activeSyncLicenses = artistData.activeSyncLicenses
            .map((sync) => ({ ...sync, remainingWeeks: sync.remainingWeeks - 1 }))
            .filter((sync) => sync.remainingWeeks > 0);
        }

        // --- SOUNDTRACK OFFER LOGIC ---
        if (artistData.weeksUntilNextSoundtrackOffer === undefined) {
          // Initialize for games started before this feature was added.
          artistData.weeksUntilNextSoundtrackOffer =
            Math.floor(Math.random() * 13) + 12;
        }

        artistData.weeksUntilNextSoundtrackOffer -= 1;

        if (artistData.weeksUntilNextSoundtrackOffer <= 0) {
          // Time for an offer, reset for next time.
          artistData.weeksUntilNextSoundtrackOffer =
            Math.floor(Math.random() * 13) + 12;

          if (
            artistData.offeredSoundtracks.length < 13 &&
            artistProfileForEmail
          ) {
            const allSoundtracks: Array<keyof typeof Object | string> = [
              "F1 The Album",
              "Wicked",
              "Breaking Bad",
              "Dune: Part Two",
              "Deadpool & Wolverine",
              "Barbie",
              "Spider-Man: Beyond the Spider-Verse",
              "James Bond",
              "The Hunger Games",
              "Pitch Perfect",
              "The Great Gatsby",
              "Mamma Mia",
              "Twilight",
            ];
            const availableSoundtracks = allSoundtracks.filter(
              (title) => !artistData.offeredSoundtracks.includes(title as any),
            );

            if (availableSoundtracks.length > 0) {
              const chosenSoundtrack = availableSoundtracks[
                Math.floor(Math.random() * availableSoundtracks.length)
              ] as
                | "F1 The Album"
                | "Wicked"
                | "Breaking Bad"
                | "Dune: Part Two"
                | "Deadpool & Wolverine"
                | "Barbie"
                | "Spider-Man: Beyond the Spider-Verse"
                | "James Bond"
                | "The Hunger Games"
                | "Pitch Perfect"
                | "The Great Gatsby"
                | "Mamma Mia"
                | "Twilight";

              const emailId = crypto.randomUUID();
              newEmails.push({
                id: emailId,
                sender: "Major Film Studio",
                senderIcon: "soundtrack",
                subject: `Opportunity: Contribute to "${chosenSoundtrack}" Soundtrack`,
                body: `Hi ${artistProfileForEmail.name},

We are currently curating the official soundtrack for the upcoming blockbuster "${chosenSoundtrack}" and would be honored to feature your music.

This is a major opportunity to reach a global audience. If you are interested in contributing 1-3 unreleased songs, please accept this offer.

Best regards,
Music Supervisor`,
                date: newDate,
                isRead: false,
                offer: {
                  type: "soundtrackOffer",
                  albumTitle: chosenSoundtrack,
                  isAccepted: false,
                  emailId: emailId,
                },
              });

              artistData.soundtrackOfferCount += 1;
              artistData.offeredSoundtracks.push(chosenSoundtrack);
            }
          }
        }

        
        // --- FIFA WORLD CUP LOGIC ---
        if (newDate.year % 4 === 2 && newDate.week === 20 && artistProfileForEmail) {
          const emailId = crypto.randomUUID();
          
          // Select 1 or 2 random npcs
          const allNpcs = state.npcs || [];
          const numCollabs = Math.random() > 0.5 ? 2 : 1;
          const collabs = [];
          for (let i = 0; i < numCollabs; i++) {
              const randomNpc = allNpcs[Math.floor(Math.random() * allNpcs.length)];
              if (randomNpc) collabs.push(randomNpc.artist);
          }
          
          newEmails.push({
            id: emailId,
            sender: "FIFA Sound",
            senderIcon: "soundtrack",
            subject: `Invitation: Official FIFA World Cup ${newDate.year} Soundtrack`,
            body: `Hello ${artistProfileForEmail.name},\n\nWe are thrilled to invite you to be a lead artist on a featured track for the upcoming Official FIFA World Cup ${newDate.year} Soundtrack!\n\nWe envision this as a powerful collaboration and would like to pair you with ${collabs.join(", ")}.\n\nIf you accept, you will need to provide the song title and cover art, and the single will drop on week 23, building hype before the full soundtrack release on week 25.\n\nPlease let us know if you accept.\n\nBest,\nFIFA Sound`,
            date: newDate,
            isRead: false,
            offer: {
              type: "fifaWorldCupOffer",
              emailId: emailId,
              isAccepted: false,
              collabs
            },
          });
        }

        // --- VOGUE OFFER LOGIC ---
        const totalWeeksElapsed = newDate.year * 52 + newDate.week;

        if (
          artistProfileForEmail &&
          totalWeeksElapsed > 10 &&
          totalWeeksElapsed % 20 === 0 &&
          artistData.lastVogueOfferYear !== newDate.year
        ) {
          const magazines: Array<"Vogue" | "Vogue Korea" | "Vogue Italy"> = [
            "Vogue",
            "Vogue Korea",
            "Vogue Italy",
          ];
          const chosenMagazine =
            magazines[Math.floor(Math.random() * magazines.length)];
          const emailId = crypto.randomUUID();

          newEmails.push({
            id: emailId,
            sender: chosenMagazine,
            senderIcon: "vogue",
            subject: `Invitation: Grace the Cover of ${chosenMagazine}`,
            body: `Dear ${artistProfileForEmail.name},

Your recent impact on the music and fashion worlds has not gone unnoticed. We at ${chosenMagazine} would be honored to feature you on our upcoming cover.

This opportunity includes a full photoshoot and an in-depth interview. Please let us know if you're interested in this prestigious feature.

Sincerely,
The Editors`,
            date: newDate,
            isRead: false,
            offer: {
              type: "vogueOffer",
              magazine: chosenMagazine,
              isAccepted: false,
              emailId: emailId,
            },
          });
          artistData.lastVogueOfferYear = newDate.year;
        }

        // --- EVENTS ---
        if (artistProfileForEmail && artistData.popularity > 20) {
          if (newDate.week === 17 && Math.random() < 0.5) {
            const emailId = crypto.randomUUID();
            newEmails.push({
              id: emailId,
              sender: "Anna Wintour",
              senderIcon: "event",
              subject: `Invitation: The Met Gala ${newDate.year}`,
              body: `Dear ${artistProfileForEmail.name},

We cordially invite you to attend The ${newDate.year} Met Gala.

Please RSVP by responding to this invitation.

Yours sincerely,
Anna Wintour`,
              date: newDate,
              isRead: false,
              offer: {
                type: "eventInvitation",
                eventName: "The Met Gala",
                eventType: "metGala",
                emailId,
              },
            });
          } else if (
            (newDate.week === 6 || newDate.week === 36) &&
            Math.random() < 0.5
          ) {
            const emailId = crypto.randomUUID();
            newEmails.push({
              id: emailId,
              sender: "NYFW Council",
              senderIcon: "event",
              subject: `Invitation: New York Fashion Week`,
              body: `Hi ${artistProfileForEmail.name},

You're invited to sit front row at New York Fashion Week.

Please let us know if you can attend.`,
              date: newDate,
              isRead: false,
              offer: {
                type: "eventInvitation",
                eventName: "New York Fashion Week",
                eventType: "nyfw",
                emailId,
              },
            });
          } else if (newDate.week === 5 && Math.random() < 0.3) {
            const emailId = crypto.randomUUID();
            const allPlayerNames = [
              ...(state.allPlayerArtists?.map((a) => a.name) || []),
              state.soloArtist?.name,
              state.group?.name,
            ].filter((n): n is string => !!n);
            const npcArtistName = getRandomNpcName(allPlayerNames);
            newEmails.push({
              id: emailId,
              sender: npcArtistName,
              senderIcon: "event",
              subject: `Invitation: Grammy After Party`,
              body: `Hey ${artistProfileForEmail.name},

I'm throwing a huge Grammy after party tonight. You should come thru.

- ${npcArtistName}`,
              date: newDate,
              isRead: false,
              offer: {
                type: "eventInvitation",
                eventName: "Grammy After Party",
                eventType: "afterParty",
                hostName: npcArtistName,
                emailId,
              },
            });
          } else if (newDate.week === 10 && Math.random() < 0.3) {
            const emailId = crypto.randomUUID();
            const allPlayerNames = [
              ...(state.allPlayerArtists?.map((a) => a.name) || []),
              state.soloArtist?.name,
              state.group?.name,
            ].filter((n): n is string => !!n);
            const npcArtistName = getRandomNpcName(allPlayerNames);
            newEmails.push({
              id: emailId,
              sender: npcArtistName,
              senderIcon: "event",
              subject: `Invitation: Oscar After Party`,
              body: `Hey ${artistProfileForEmail.name},

I'm throwing an Oscars after party this weekend. Grab a drink with us.

- ${npcArtistName}`,
              date: newDate,
              isRead: false,
              offer: {
                type: "eventInvitation",
                eventName: "Oscar After Party",
                eventType: "afterParty",
                hostName: npcArtistName,
                emailId,
              },
            });
          } else if (newDate.week === 46 && Math.random() < 0.3) {
            const emailId = crypto.randomUUID();
            const allPlayerNames = [
              ...(state.allPlayerArtists?.map((a) => a.name) || []),
              state.soloArtist?.name,
              state.group?.name,
            ].filter((n): n is string => !!n);
            const npcArtistName = getRandomNpcName(allPlayerNames);
            newEmails.push({
              id: emailId,
              sender: npcArtistName,
              senderIcon: "event",
              subject: `Invitation: AMA After Party`,
              body: `Hey ${artistProfileForEmail.name},

Hosting a post-AMA bash. Would love to see you there.

- ${npcArtistName}`,
              date: newDate,
              isRead: false,
              offer: {
                type: "eventInvitation",
                eventName: "AMA After Party",
                eventType: "afterParty",
                hostName: npcArtistName,
                emailId,
              },
            });
          }
        }

        // Soundtrack Premieres check
        if (artistProfileForEmail) {
          state.soundtrackAlbums.forEach((st) => {
            // if replacing the same week, we need player to be the artistId
            if (
              st.artistId === artistId &&
              st.releaseDate?.year === newDate.year &&
              st.releaseDate?.week === newDate.week &&
              !st.isReleased
            ) {
              const emailId = crypto.randomUUID();
              newEmails.push({
                id: emailId,
                sender: "Studio Exec",
                senderIcon: "event",
                subject: `Invitation: ${st.title} Red Carpet Premiere`,
                body: `Hi ${artistProfileForEmail?.name},

The red carpet premiere for ${st.title} is happening this week. Since you are on the soundtrack, we'd love for you to walk the red carpet.

Studio Exec`,
                date: newDate,
                isRead: false,
                offer: {
                  type: "eventInvitation",
                  eventName: `${st.title} Premiere`,
                  eventType: "soundtrackPremiere",
                  associatedSoundtrack: st.title,
                  emailId,
                },
              });
            }
          });
        }

        // --- FEATURE OFFER LOGIC ---
        if (artistData.weeksUntilNextFeatureOffer === undefined) {
          artistData.weeksUntilNextFeatureOffer =
            Math.floor(Math.random() * (8 - 2 + 1)) + 2; // 2-8 weeks
        }

        artistData.weeksUntilNextFeatureOffer -= 1;

        if (
          artistData.weeksUntilNextFeatureOffer <= 0 &&
          artistProfileForEmail
        ) {
          // Reset counter
          artistData.weeksUntilNextFeatureOffer =
            Math.floor(Math.random() * (8 - 2 + 1)) + 2;

          let npcArtistName = "";
          const allPlayerNames = [
            ...(state.allPlayerArtists?.map((a) => a.name) || []),
            state.soloArtist?.name,
            state.group?.name,
          ].filter((n): n is string => !!n);
          do {
            npcArtistName = getRandomNpcName(allPlayerNames);
          } while (npcArtistName === artistProfileForEmail.name);

          const npcGenre = NPC_ARTIST_GENRES[npcArtistName];
          const isEligibleForFeature =
            npcGenre === "Indie"
              ? artistData.popularity >= 5
              : artistData.popularity > 30;

          // Check conditions
          if (isEligibleForFeature && Math.random() < 0.5) {
            // 50% chance if eligible
            const emailId = crypto.randomUUID();
            let payout = Math.floor(
              50000 +
                artistData.popularity * 2000 * (Math.random() * 1.5 + 0.5),
            );
            if (npcGenre === "Indie") {
              payout = Math.floor(Math.random() * (25000 - 5000 + 1)) + 5000;
            }

            const songQuality = Math.floor(
              40 + artistData.popularity / 2.5 + Math.random() * 10,
            );

            let promotion: FeatureOffer["promotion"] | undefined = undefined;
            if (Math.random() < 0.2) {
              // 20% chance of promotion
              promotion = {
                name: "Payola Push", // Generic promo name
                durationWeeks: Math.floor(Math.random() * 3) + 2, // 2-4 weeks
              };
            }

            const offer: FeatureOffer = {
              type: "featureOffer",
              npcArtistName,
              payout,
              songQuality: Math.min(100, songQuality),
              promotion,
              isAccepted: false,
              emailId,
            };

            newEmails.push({
              id: emailId,
              sender: npcArtistName,
              senderIcon: "feature",
              subject: "Feature Request",
              body: `Hey ${artistProfileForEmail.name},

Big fan of your work. I have a track that I think you'd sound perfect on.

I can offer a payout of $${formatNumber(payout)} for your verse. The song quality is looking to be around ${Math.min(100, songQuality)}${promotion ? `, and we'll be running a ${promotion.name} for ${promotion.durationWeeks} weeks` : ""}.

Let me know if you're interested.

Best,
${npcArtistName}`,
              date: newDate,
              isRead: false,
              offer: offer,
            });
          }
        }

        let newHype: number;
        const hypeMode = artistData.redMicPro.hypeMode || "locked";
        const difficulty = state.difficultyMode || "normal";

        let hypeDecay = 2;
        if (difficulty === "easy") hypeDecay = 0;
        else if (difficulty === "hard") hypeDecay = 3;
        else if (difficulty === "extreme") hypeDecay = 5;

        if (artistData.redMicPro.unlocked && hypeMode === "locked") {
          newHype = 1000;
        } else {
          newHype = Math.max(0, Math.min(getHypeCap(artistData), artistData.hype - hypeDecay));
        }

        let newPopularity = artistData.popularity;
        const lastRelease = [...artistData.releases].sort((a, b) => {
          const aDate = a.releaseDate || { year: 0, week: 0 };
          const bDate = b.releaseDate || { year: 0, week: 0 };
          return bDate.year * 52 + bDate.week - (aDate.year * 52 + aDate.week);
        })[0];

        let popDecay = 0.25;
        if (difficulty === "easy") popDecay = 0;
        else if (difficulty === "hard") popDecay = 0.5;
        else if (difficulty === "extreme") popDecay = 1.0;

        if (lastRelease) {
          const weeksSinceLastRelease =
            newDate.year * 52 +
            newDate.week -
            ((lastRelease.releaseDate?.year || 0) * 52 +
              (lastRelease.releaseDate?.week || 0));
          if (weeksSinceLastRelease > 12) {
            // 3 months
            newPopularity = Math.max(0, newPopularity - popDecay);
          }
        } else if (newDate.year * 52 + newDate.week > 12) {
          // If no releases at all after 12 weeks
          newPopularity = Math.max(0, newPopularity - popDecay);
        }

        const popularityMultiplier = 1 + newPopularity / 100;
        const hypeMultiplier = 1 + newHype / 100;

        // --- SONG VIRAL RESURGENCE LOGIC ---
        if (newDate.year >= 2020 && Math.random() < 0.05) {
          // 5% chance per week per artist
          const eligibleOldSongs = artistData.songs.filter(
            (s) =>
              s.isReleased &&
              s.releaseDate &&
              newDate.year - (s.releaseDate?.year || newDate.year) >= 10 &&
              !s.remixOfSongId,
          );
          if (eligibleOldSongs.length > 0) {
            const viralSong =
              eligibleOldSongs[
                Math.floor(Math.random() * eligibleOldSongs.length)
              ];
            viralSong.streams += 150000000;
            viralSong.quality = Math.min(10, viralSong.quality + 2); // Boost quality as it re-enters algorithm
            tiktokEncounterThisWeek = {
              id: `tiktok-${viralSong.id}-${newDate.year}-${newDate.week}`,
              text: `CRAZY NEWS! Your decade+ old deep-cut "${viralSong.title}" just went completely viral on TikTok (Stranger Things style)!! You just got 150M streams overnight. Do you want to rush a new remix/video to capitalize on this, or let it ride naturally?`,
              requiresImage: false,
              choices: [
                {
                  label:
                    "Rush a Remix / Content! (Costs $50,000, Huge Hype boost)",
                  publicImageEffect: 10,
                  hypeEffect: 80,
                  popularityEffect: 20,
                  moneyEffect: -50000,
                },
                {
                  label:
                    "Let it ride naturally. (Free money, small hype boost)",
                  publicImageEffect: 0,
                  hypeEffect: 15,
                  popularityEffect: 5,
                  moneyEffect: 0,
                },
              ],
            };
          }
        }

        // --- SONG LEAK LOGIC ---
        artistData.songs.forEach((song) => {
          // Update already leaked songs
          if (song.leakInfo) {
            const weeklyIllegalStreams = Math.floor(
              song.quality * newHype * (Math.random() * 20 + 10),
            );
            song.leakInfo.illegalStreams += weeklyIllegalStreams;
            song.leakInfo.illegalDownloads += Math.floor(
              weeklyIllegalStreams / (Math.random() * 10 + 5),
            );
          }
          // Check for new leaks
          else if (!song.isReleased && !song.isVaulted) {
            let leakChance = newHype / 5000; // 2% chance at 100 hype, 20% at 1000 hype
            if (artistData.securityTeamId) {
              const team = SECURITY_TEAMS.find(
                (s) => s.id === artistData.securityTeamId,
              );
              if (team) {
                leakChance *= team.leakProtection;
              }
            }
            if (
              Math.random() < leakChance &&
              !leakedSongThisWeek &&
              !leakEncounterThisWeek
            ) {
              const illegalStreams = Math.floor(
                song.quality * newHype * (Math.random() * 50 + 20),
              );
              const illegalDownloads = Math.floor(
                illegalStreams / (Math.random() * 10 + 5),
              );
              song.leakInfo = { illegalStreams, illegalDownloads };
              leakedSongThisWeek = song;

              // In the piracy era (1999-2008), trigger a specific encounter
              if (newDate.year >= 1999 && newDate.year <= 2008) {
                leakEncounterThisWeek = {
                  id: `leak-${song.uniqueId}`,
                  text: `Your upcoming song "${song.title}" just leaked on LimeWire and Napster! It's spreading like wildfire. While this damages your physical single sales, your underground fame is skyrocketing, unlocking bigger local venues. Do you sue your fans to stop the bleeding, or let the piracy fuel your local legend?`,
                  requiresImage: false,
                  choices: [
                    {
                      label:
                        "Sue the fans! (Stop leak, huge PR hit, save money)",
                      publicImageEffect: -40,
                      hypeEffect: -10,
                      moneyEffect: 50000,
                      popularityEffect: -5,
                    },
                    {
                      label: "Let it happen (Fame boost, lose potential sales)",
                      publicImageEffect: 10,
                      hypeEffect: 30,
                      popularityEffect: 15,
                      moneyEffect: 0,
                    },
                  ],
                };
              } else {
                // For other eras, just an email notification
                let sender = "Music Insider";
                let senderIcon: Email["senderIcon"] = "default";
                if (artistData.contract) {
                  const label =
                    LABELS.find((l) => l.id === artistData.contract!.labelId) ||
                    allCustomLabels.find(
                      (l) => l.id === artistData.contract!.labelId,
                    );
                  if (label) {
                    sender = label.name;
                    senderIcon = "label";
                  }
                }

                const emailId = crypto.randomUUID();
                newEmails.push({
                  id: emailId,
                  sender: sender,
                  senderIcon: senderIcon,
                  subject: `URGENT: Your song "${song.title}" has leaked!`,
                  body: `Hi ${artistProfileForEmail?.name || "Artist"},

We've detected an unauthorized leak of your unreleased song "${song.title}". The track is spreading online via illegal streams and downloads.

This will likely impact your official release plans. We recommend releasing the song officially as soon as possible to mitigate the damage.

- ${sender}`,
                  date: newDate,
                  isRead: false,
                  offer: { type: "leak", songId: song.id },
                });
              }
            }
          }
        });

        // --- X SUSPENSION & APPEAL LOGIC ---
        if (!artistData.xSuspensionStatus?.isSuspended) {
          let suspensionChance = 0.005; // 0.5% random chance per week
          let suspensionReason: XSuspensionStatus["reason"] = "random";

          if (artistData.fanWarStatus) {
            suspensionChance += 0.15; // Add 15% chance if in a fan war
            suspensionReason = "fan_war_reports";
          }

          if (Math.random() < suspensionChance) {
            const playerAccounts = artistData.xUsers.filter((u) => u.isPlayer);
            const suspendedAccountId =
              artistData.selectedPlayerXUserId || playerAccounts[0]?.id;
            const account = artistData.xUsers.find(u => u.id === suspendedAccountId);
            if (!account || !account.isVerified) {
            artistData.xSuspensionStatus = {
              isSuspended: true,
              reason: suspensionReason,
              suspendedDate: newDate,
              accountId: suspendedAccountId,
            };
            artistData.hype = Math.max(0, artistData.hype - 50);
            artistData.popularity = Math.max(0, artistData.popularity - 10);

            const artistProfile = allPlayerArtistsAndGroups.find(
              (a) => a.id === artistId,
            );
            if (artistProfile) {
              const username = artistProfile.name
                .replace(/\s/g, "")
                .toLowerCase();
              artistData.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: "popbase",
                content: `X has permanently suspended ${artistProfile.name}'s account (@${username}) for violations of the X Rules.`,
                likes: Math.floor(Math.random() * 40000) + 15000,
                retweets: Math.floor(Math.random() * 9000) + 4000,
                views: Math.floor(Math.random() * 1200000) + 400000,
                date: newDate,
              });
              const fanAccount = artistData.xUsers.find((u) =>
                u.id.startsWith("addiction_fan"),
              );
              if (fanAccount) {
                artistData.xPosts.unshift({
                  id: crypto.randomUUID(),
                  authorId: fanAccount.id,
                  content: `NO WAY ${artistProfile.name} GOT SUSPENDED???? #Free${username}`,
                  likes: Math.floor(Math.random() * 50000) + 20000,
                  retweets: Math.floor(Math.random() * 15000) + 5000,
                  views: Math.floor(Math.random() * 1000000) + 300000,
                  date: newDate,
                });
              }
              newEmails.push({
                id: crypto.randomUUID(),
                sender: "X Support",
                senderIcon: "x",
                subject: "Your account has been suspended",
                body: `Hello,

Your account, @${username}, has been suspended for violating the X Rules.

After careful review, we determined your account broke the X Rules. Your account is permanently in read-only mode, which means you canâ€™t post, Repost, or Like content. You wonâ€™t be able to create new accounts.

If you think we got this wrong, you can submit an appeal.

Thanks,
X Support`,
                date: newDate,
                isRead: false,
                offer: { type: "xSuspension", isSuspended: true },
              });
            }
          }
            }
        } else if (
          artistData.xSuspensionStatus.isSuspended &&
          artistData.xSuspensionStatus.appealSentDate
        ) {
          const weeksSinceAppeal =
            newDate.year * 52 +
            newDate.week -
            (artistData.xSuspensionStatus.appealSentDate.year * 52 +
              artistData.xSuspensionStatus.appealSentDate.week);
          if (weeksSinceAppeal >= 1) {
            const reason = artistData.xSuspensionStatus.reason;
            const successChance = reason === "random" ? 0.9 : 0.1;
            const isSuccessful = Math.random() < successChance;
            const artistProfile = allPlayerArtistsAndGroups.find(
              (a) => a.id === artistId,
            );

            if (isSuccessful) {
              artistData.xSuspensionStatus = null;
              if (artistProfile) {
                const username = artistProfile.name
                  .replace(/\s/g, "")
                  .toLowerCase();
                artistData.xPosts.unshift({
                  id: crypto.randomUUID(),
                  authorId: "popbase",
                  content: `X has reinstated ${artistProfile.name}'s account (@${username}) following an appeal.`,
                  likes: Math.floor(Math.random() * 25000) + 10000,
                  retweets: Math.floor(Math.random() * 5000) + 2000,
                  views: Math.floor(Math.random() * 800000) + 300000,
                  date: newDate,
                });
                newEmails.push({
                  id: crypto.randomUUID(),
                  sender: "X Support",
                  senderIcon: "x",
                  subject: "Update on your appeal",
                  body: `Hello,

After a review of your appeal, we've determined that your account, @${username}, did not violate the X Rules. Your account has been reinstated and your suspension has been lifted.

We apologize for this error.

Thanks,
X Support`,
                  date: newDate,
                  isRead: false,
                  offer: { type: "xAppealResult", isSuccessful: true },
                });
              }
            } else {
              artistData.xSuspensionStatus.appealSentDate = undefined;
              if (artistProfile) {
                newEmails.push({
                  id: crypto.randomUUID(),
                  sender: "X Support",
                  senderIcon: "x",
                  subject: "Update on your appeal",
                  body: `Hello,

We've reviewed the appeal for your account, @${artistProfile.name.replace(/\s/g, "").toLowerCase()}.

Our review found that your account broke the X Rules. As a result, your account will remain suspended.

Thanks,
X Support`,
                  date: newDate,
                  isRead: false,
                  offer: { type: "xAppealResult", isSuccessful: false },
                });
              }
            }
          }
        }

        if (
          artistData.xSuspensionStatus?.isSuspended &&
          artistData.xSuspensionStatus.suspendedDate
        ) {
          const weeksSinceSuspension =
            newDate.year * 52 +
            newDate.week -
            (artistData.xSuspensionStatus.suspendedDate.year * 52 +
              artistData.xSuspensionStatus.suspendedDate.week);
          if (weeksSinceSuspension >= 4) {
            const targetAccountId = artistData.xSuspensionStatus.accountId;
            artistData.xUsers = artistData.xUsers.filter(
              (u) => u.id !== targetAccountId,
            );
            // @ts-ignore
            artistData.xSuspensionStatus = null;

            // Pick a new account if we deleted the current one
            if (artistData.selectedPlayerXUserId === targetAccountId) {
              artistData.selectedPlayerXUserId = artistData.xUsers.find(
                (u) => u.isPlayer,
              )?.id;
            }
          }
        }

        // --- CHEATING SCANDAL LOGIC ---
        const activeRelationship = (artistData.relationships || []).find(
          (r) => r.endYear === null,
        );
        if (
          activeRelationship &&
          activeRelationship.isPublic &&
          artistProfileForEmail
        ) {
          if (Math.random() < 0.005) {
            // 0.5%
            const emailId = crypto.randomUUID();
            newEmails.push({
              id: emailId,
              sender: "PR Team",
              senderIcon: "default",
              subject: "URGENT: Cheating Allegations",
              body: `Hi ${artistProfileForEmail.name},

TMZ just published an article alleging that ${activeRelationship.partnerName} was seen getting close with someone else. Social media is blowing up.

How do you want to handle this scandal?`,
              date: newDate,
              isRead: false,
              offer: {
                type: "cheatingScandal",
                relationshipId: activeRelationship.id,
              },
            });

            artistData.xPosts.unshift({
              id: crypto.randomUUID(),
              authorId: "tmz",
              content: `ðŸš¨ EXCLUSIVE: Sources claim they spotted ${activeRelationship.partnerName} acting VERY single despite dating ${artistProfileForEmail.name}. Trouble in paradise? ðŸ‘€â˜•ï¸`,
              likes: Math.floor(Math.random() * 500000) + 150000,
              retweets: Math.floor(Math.random() * 150000) + 40000,
              views: Math.floor(Math.random() * 12000000) + 4000000,
              date: newDate,
            });
          }
        }

        // --- PROMO INTERVIEW LOGIC ---
        if (artistData.requestedPromoInterview) {
          if (artistData.manager) {
            artistData.requestedPromoInterview = false; // Reset the flag
            const SHOW_OPTIONS: PromoInterviewSource[] = [
              "Call Her Daddy",
              "Apple Music",
              "Snack Wars",
              "Rolling Stone",
              "Etalk",
              "Therapuss",
              "KISS FM",
            ];
            const randomShow =
              SHOW_OPTIONS[Math.floor(Math.random() * SHOW_OPTIONS.length)];

            if (artistProfileForEmail) {
              newEmails.push({
                id: crypto.randomUUID(),
                sender:
                  artistData.manager.id === "manager-1"
                    ? "Scooter"
                    : artistData.manager.id === "manager-2"
                      ? "Kris"
                      : "Manager",
                senderIcon: "business",
                subject: "Promo Opportunity Secured!",
                body: `Hey ${artistProfileForEmail.name},

I reached out to my contacts and managed to get you a slot on ${randomShow}! This is a great opportunity to promote your music.

Please submit a thumbnail, pick some topics, and choose the song we are promoting. It'll get a nice streaming boost for the next 4 weeks.

Let me know!`,
                date: newDate,
                isRead: false,
                offer: {
                  type: "promoInterview",
                  source: randomShow,
                },
              });
            }
          } else {
            // User fired manager before week advanced
            artistData.requestedPromoInterview = false;
          }
        }

        // --- PREGNANCY LOGIC ---
        if (artistData.pregnancy) {
          const conceptionWeeks =
            artistData.pregnancy.conceptionDate.year * 52 +
            artistData.pregnancy.conceptionDate.week;
          const currentWeeks = newDate.year * 52 + newDate.week;
          if (currentWeeks - conceptionWeeks >= 39) {
            const hasReceivedBirthEmail =
              artistData.inbox.some(
                (e) => e.offer?.type === "giveBirth" && !e.offer.isAnswered,
              ) || newEmails.some((e) => e.offer?.type === "giveBirth");
            if (!hasReceivedBirthEmail && artistProfileForEmail) {
              newEmails.push({
                id: crypto.randomUUID(),
                sender: "Personal Update",
                senderIcon: "default",
                subject: "It's Time!",
                body: `Hi ${artistProfileForEmail.name},

The big day is here! You're ready to welcome your new baby into the world. It's time to name your child!`,
                date: newDate,
                isRead: false,
                offer: { type: "giveBirth" },
              });
            }
          }
        }

        let labelMultiplier = 1;
        let playerCut = 1.0;
        if (artistData.contract) {
          if (artistData.contract.isCustom) {
            const label = allCustomLabels.find(
              (l) => l.id === artistData.contract!.labelId,
            );
            if (label) {
              labelMultiplier = label.promotionMultiplier;
              if (label.exclusiveLicenseId) {
                const exclusiveLabel = LABELS.find(
                  (l) => l.id === label.exclusiveLicenseId,
                );
                if (exclusiveLabel) {
                  labelMultiplier = Math.max(
                    labelMultiplier,
                    exclusiveLabel.promotionMultiplier,
                  );
                }
              }
              playerCut = 1.0; // Custom label owners keep 100%
            }
          } else {
            const label = LABELS.find(
              (l) => l.id === artistData.contract!.labelId,
            );
            if (label) {
              labelMultiplier = artistData.isBlacklistedByLabel ? 1.0 : label.promotionMultiplier;
              if (label.contractType === "petty") playerCut = 0.1;
              else if (label.id === "umg") playerCut = 0.2;
              else if (
                label.tier === "Mid-high" ||
                label.tier === "Mid-Low" ||
                label.tier === "Top"
              )
                playerCut = 0.4;
              else if (label.tier === "Low") playerCut = 0.5;
            }
          }
        }

        let totalWeeklyStreams = 0;
        let artistStreamIncome = 0;
        const updatedSongs = artistData.songs.map((song) => {
          let effectivelyReleased = song.isReleased;
          if (!effectivelyReleased && song.releaseDate && ((newDate.year > song.releaseDate.year) || (newDate.year === song.releaseDate.year && newDate.week >= song.releaseDate.week))) {
            effectivelyReleased = true;
          }
          if (effectivelyReleased && !song.isTakenDown) {
            let baseStreams = song.quality ** 2 * 80;
            const difficulty = state.difficultyMode || "normal";
            let diffMultiplier = 1;
            if (difficulty === "easy") diffMultiplier = 2.0;
            else if (difficulty === "hard") diffMultiplier = 0.6;
            else if (difficulty === "extreme") diffMultiplier = 0.3;

            let careerStageMultiplier = 1;
            if (difficulty !== "easy" && artistData.careerStage) {
              const rDate =
                song.releaseDate ||
                artistData.releases.find((r) => r.id === song.releaseId)
                  ?.releaseDate;
              if (rDate) {
                const ageWeeks =
                  newDate.year * 52 +
                  newDate.week -
                  (rDate.year * 52 + rDate.week);
                if (ageWeeks <= 26) {
                  if (artistData.careerStage === "flop")
                    careerStageMultiplier = 0.2;
                  else if (artistData.careerStage === "smash")
                    careerStageMultiplier = 1.3;
                }
              }
            }
            baseStreams *= careerStageMultiplier;
            const songRelease = artistData.releases.find((r) => r.id === song.releaseId);
            if (songRelease && songRelease.type === 'Live Album') {
                baseStreams *= 0.05; // -95% streams permanently
            }

            // ---- Sound Trends & Era Multipliers ----
            let trendMultiplier = 1.0;
            const sub = song.subgenre;

            if (newDate.year <= 2002 && sub === "Teen Pop Boyband") {
              trendMultiplier = 3.0; // +200%
            } else if (
              newDate.year >= 2006 &&
              newDate.year <= 2012 &&
              sub === "Teen Pop Boyband"
            ) {
              trendMultiplier = 0.1; // flops
            }

            if (
              newDate.year >= 2006 &&
              newDate.year <= 2009 &&
              (sub === "Ringtone Rap" || sub === "Electro-Pop")
            ) {
              trendMultiplier = 2.5;
            }

            if (
              newDate.year >= 2010 &&
              newDate.year <= 2014 &&
              (sub === "EDM" || sub === "Festival")
            ) {
              trendMultiplier = 2.5;
            }

            if (newDate.year >= 2018) {
              if (sub === "Trap" || sub === "Alt-Pop") trendMultiplier = 1.8;
              if (song.duration < 150) trendMultiplier *= 1.5; // Short songs algorithmic boost
            }

            if (song.isInterlude) {
              baseStreams = baseStreams * 0.5;
            }
            let weeklyStreams = Math.floor(
              baseStreams *
                hypeMultiplier *
                labelMultiplier *
                popularityMultiplier *
                diffMultiplier *
                trendMultiplier *
                (Math.random() * 0.4 + 0.8),
            );

            // Tour Setlist Boost
            const isOnActiveTourSetlist =
              artistData.tours &&
              artistData.tours.some(
                (tour) =>
                  tour.status === "active" &&
                  tour.setlist &&
                  tour.setlist.includes(song.id),
              );
            if (isOnActiveTourSetlist) {
              weeklyStreams = Math.floor(weeklyStreams * 1.05); // +5% boost
            }

            // Coachella Setlist Boost (+10% boost next week after / during performance)
            const isCoachellaSetlistSong =
              artistData.coachella &&
              artistData.coachella.setlist &&
              artistData.coachella.setlist.includes(song.id) &&
              artistData.coachella.year === newDate.year &&
              (newDate.week === 15 || newDate.week === 16);
            if (isCoachellaSetlistSong) {
              weeklyStreams = Math.floor(weeklyStreams * 1.10); // +10% boost
            }

            // Kai Cenat Stream Boost
            if (artistData.twitchStreams) {
                for (const stream of artistData.twitchStreams) {
                    if (stream.hasStreamed && stream.songId === song.id) {
                        const ageInWeeks = (newDate.year - stream.scheduledDate.year) * 52 + (newDate.week - stream.scheduledDate.week);
                        if (ageInWeeks >= 0 && ageInWeeks < 2) {
                            weeklyStreams = Math.floor(weeklyStreams * 1.30); // 30% boost for 2 weeks
                        }
                    }
                }
            }

            // Decay logic
            let releaseDate = song.releaseDate;
            if (!releaseDate && song.releaseId) {
              const release = artistData.releases.find(
                (r) => r.id === song.releaseId,
              );
              if (release) releaseDate = release.releaseDate;
            }

            if (releaseDate) {
              let decayIntensity = 0.15;
              if (difficulty === "easy" || song.trait === "Smash Hit")
                decayIntensity = 0;
              else if (difficulty === "hard") decayIntensity = 0.25;
              else if (difficulty === "extreme") decayIntensity = 0.4;

              const ageInWeeks = Math.max(0, (newDate.year - (releaseDate?.year || newDate.year)) * 52 + (newDate.week - (releaseDate?.week || newDate.week)));

              if (decayIntensity > 0) {
                const maxAge = Math.min(ageInWeeks, 156);
                const decayFactor = 1 / (1 + decayIntensity * maxAge);
                weeklyStreams = Math.floor(weeklyStreams * decayFactor);
              }

              if (song.trait === "Slow Burner") {
                  let traitMult = 1.0;
                  if (ageInWeeks < 4) traitMult = 0.5;
                  else if (ageInWeeks < 8) traitMult = 1.0;
                  else if (ageInWeeks < 16) traitMult = 2.5;
                  else if (ageInWeeks < 24) traitMult = 1.5;
                  else traitMult = 0.8;
                  weeklyStreams = Math.floor(weeklyStreams * traitMult);
              }

              if (song.trait === "Flop") {
                  weeklyStreams = Math.floor(weeklyStreams * 0.65);
              }
            }

            // Christmas Genre Seasonal Logic
            if (song.genre === "Christmas") {
              const week = newDate.week;
              let christmasMultiplier = 1.0;

              if (week >= 50) {
                // Peak: Weeks 50-52
                christmasMultiplier = Math.random() * 5 + 15; // 15x to 20x
              } else if (week >= 45) {
                // Huge gains: Weeks 45-49
                christmasMultiplier = Math.random() * 5 + 8; // 8x to 13x
              } else if (week >= 41) {
                // Momentum: Weeks 41-44
                christmasMultiplier = Math.random() * 1.5 + 1.5; // 1.5x to 3x
              } else {
                // Off-season: Before week 41
                christmasMultiplier = Math.random() * 0.2 + 0.05; // 0.05x to 0.25x (significant reduction)
              }

              weeklyStreams = Math.floor(weeklyStreams * christmasMultiplier);
            }

            // Single Permanent Boost
            const isSingle = artistData.releases.some(
              (r) => r.type === "Single" && r.songIds.includes(song.id),
            );
            if (isSingle) {
              weeklyStreams = Math.floor(weeklyStreams * 1.1); // 10% boost
            }

            // Stream Milestone Permanent Boost (Original & Normal mode only)
            const currentDifficulty = state.difficultyMode || "normal";
            if (currentDifficulty === "normal" || currentDifficulty === "original") {
              const currentTotalStreams = song.streams || 0;
              if (currentTotalStreams >= 1_000_000_000) {
                weeklyStreams = Math.floor(weeklyStreams * 2.0); // 2x stream boost for 1B+ streams
              } else if (currentTotalStreams >= 100_000_000) {
                weeklyStreams = Math.floor(weeklyStreams * 1.3); // 1.3x stream boost for 100M+ streams
              }
            }

            if (song.pitchforkBoost && (state.difficultyMode === "easy" || state.difficultyMode === "original")) {
              weeklyStreams = Math.floor(
                weeklyStreams * (Math.random() * 2 + 2),
              );
            }
            if (song.interviewBoost) {
              weeklyStreams = Math.floor(
                weeklyStreams * (Math.random() * 2 + 2),
              );
            }

            let playlistStreams = 0;
            const spotifyPlaylists =
              state.spotifyPlaylists || DEFAULT_SPOTIFY_PLAYLISTS;
            spotifyPlaylists.forEach((playlist) => {
              const trackIndex = playlist.tracks.findIndex(
                (t) => t.songId === song.id,
              );
              if (trackIndex !== -1) {
                let percentage = 0.001;
                const position = trackIndex + 1;
                if (position === 1)
                  percentage = 0.0735 + Math.random() * 0.0441;
                else if (position === 2)
                  percentage = 0.0588 + Math.random() * 0.0353;
                else if (position === 3)
                  percentage = 0.0529 + Math.random() * 0.0294;
                else if (position === 4)
                  percentage = 0.0441 + Math.random() * 0.0294;
                else if (position === 5)
                  percentage = 0.0382 + Math.random() * 0.0265;
                else if (position === 6)
                  percentage = 0.0323 + Math.random() * 0.0235;
                else if (position === 7)
                  percentage = 0.0294 + Math.random() * 0.0206;
                else if (position === 8)
                  percentage = 0.0264 + Math.random() * 0.0177;
                else if (position === 9)
                  percentage = 0.0235 + Math.random() * 0.0147;
                else if (position === 10)
                  percentage = 0.0205 + Math.random() * 0.0147;
                else {
                  const baseMin = 0.0205;
                  const baseMax = 0.0352;
                  const decay = Math.pow(0.95, position - 10);
                  percentage =
                    (baseMin + Math.random() * (baseMax - baseMin)) * decay;
                }

                const pStreams = Math.floor(playlist.followers * percentage);
                playlistStreams += pStreams;

                if (!artistData.playlistPlacements)
                  artistData.playlistPlacements = [];
                let placement = artistData.playlistPlacements.find(
                  (p) => p.playlistId === playlist.id,
                );
                if (!placement) {
                  placement = {
                    playlistId: playlist.id,
                    playlistName: playlist.name,
                    coverArt: playlist.coverArt,
                    totalStreams: 0,
                    songStreams: {},
                  };
                  artistData.playlistPlacements.push(placement);
                }
                placement.totalStreams += pStreams;
                placement.songStreams[song.id] =
                  (placement.songStreams[song.id] || 0) + pStreams;
              }
            });
            weeklyStreams += playlistStreams;

            let newPlaylistBoostWeeks = song.playlistBoostWeeks;
            if (
              typeof song.playlistBoostWeeks === "number" &&
              song.playlistBoostWeeks > 0
            ) {
              newPlaylistBoostWeeks = song.playlistBoostWeeks - 1;
            }

            let newPurchasedPlaylists = song.purchasedPlaylists;
            if (newPurchasedPlaylists) {
              newPurchasedPlaylists = newPurchasedPlaylists
                .map((p) => ({ ...p, weeksRemaining: p.weeksRemaining - 1 }))
                .filter((p) => p.weeksRemaining > 0);
            }

            const songPromo = artistData.promotions.find(
              (p) => p.itemId === song.id && p.itemType === "song",
            );
            if (songPromo) {
              if (songPromo.region && songPromo.region !== "Global") {
                  // Handled later when splitting regional streams
              } else {
                  weeklyStreams = Math.floor(
                    weeklyStreams * songPromo.boostMultiplier,
                  );
              }
            }

            let newPromoBoostWeeks = song.promoBoostWeeks;
            if (
              typeof song.promoBoostWeeks === "number" &&
              song.promoBoostWeeks > 0
            ) {
              weeklyStreams = Math.floor(weeklyStreams * 1.1);
              newPromoBoostWeeks = song.promoBoostWeeks - 1;
            }

            // Active Song Media Sync License percentage boost
            const activeSync = artistData.activeSyncLicenses?.find(
              (s) => s.songId === song.id && s.remainingWeeks > 0
            );
            if (activeSync) {
              const boostPct = (activeSync.streamBoostPercent ?? 15) / 100;
              weeklyStreams = Math.floor(weeklyStreams * (1 + boostPct));
            }

            // Check for member hiatus 30+ weeks boycott streaming loss (-30%)
            let hasHiatusBoycott = false;
            if (state.group && state.group.members) {
              const currentAbs = newDate.year * 52 + newDate.week;
              hasHiatusBoycott = state.group.members.some((m) => {
                const mData = artistData.id === m.id ? artistData : state.artistsData[m.id];
                if (!mData || !mData.isHiatus || mData.hiatusStartYear === undefined || mData.hiatusStartWeek === undefined) return false;
                const startAbs = mData.hiatusStartYear * 52 + mData.hiatusStartWeek;
                return (currentAbs - startAbs) >= 30;
              });
            }
            if (hasHiatusBoycott) {
              weeklyStreams = Math.floor(weeklyStreams * 0.70); // -30% streaming loss
            }

            // Generate daily streams for the week
            const daily = new Array(7).fill(0);
            if (weeklyStreams > 0) {
              const weights = Array(7)
                .fill(0)
                .map(() => Math.random());
              const totalWeight = weights.reduce((s, w) => s + w, 0);
              if (totalWeight > 0) {
                const dailyStreamsUnadjusted = weights.map((w) =>
                  Math.floor((w / totalWeight) * weeklyStreams),
                );
                const sum = dailyStreamsUnadjusted.reduce((s, d) => s + d, 0);
                dailyStreamsUnadjusted[6] += weeklyStreams - sum; // Adjust last day to match total
                for (let i = 0; i < 7; i++)
                  daily[i] = dailyStreamsUnadjusted[i];
              } else {
                daily[0] = weeklyStreams;
              }
            }
            const newDailyStreams = [...(song.dailyStreams || []), ...daily];

            totalWeeklyStreams += weeklyStreams;

            const release = artistData.releases.find(
              (r) => r.id === song.releaseId,
            );
            let firstWeekStreamsData = {};
            if (
              release &&
              newDate.year * 52 +
                newDate.week -
                (release.releaseDate?.year * 52 + release.releaseDate?.week) ===
                1
            ) {
              firstWeekStreamsData = { firstWeekStreams: weeklyStreams };
            }

            // Era-based Revenue Calculation
            // Assume internal `weeklyStreams` represents STREAM EQUIVALENT UNITS
            // 150 streams = 1 track sale
            const eraConfig = getEraConfiguration(newDate.year);

            const physicalGrossPerUnit = 2.5 / 150; // physical single
            const digitalGrossPerUnit = 1.29 / 150; // digital download
            const streamingGrossPerUnit = 0.004; // stream

            const songReleaseYear = song.releaseDate?.year || 2000;
            const hasStreamingRights = song.isAvailableOnStreaming === true;
            const effectiveStreamingShare = hasStreamingRights
              ? eraConfig.marketShare.streaming
              : 0;

            const physicalGross =
              weeklyStreams *
              eraConfig.marketShare.physical *
              physicalGrossPerUnit;
            const digitalGross =
              weeklyStreams *
              eraConfig.marketShare.digital *
              digitalGrossPerUnit;
            const streamGross =
              weeklyStreams * effectiveStreamingShare * streamingGrossPerUnit;

            const generatedGross = physicalGross + digitalGross + streamGross;

            let myGross = song.isFeatureToNpc ? 0 : generatedGross;
            if (song.rightsSoldPercent && song.rightsSoldPercent > 0) {
              myGross -= generatedGross * (song.rightsSoldPercent / 100);
            }

            let generatedNet = myGross * playerCut;

            // Deduct producer/songwriter/engineer/anr cuts
            if (song.contributorCutsTotal && song.contributorCutsTotal > 0) {
              generatedNet =
                generatedNet * Math.max(0, 1 - song.contributorCutsTotal / 100);
            }

            let actualStreamsThisWeek = hasStreamingRights
              ? Math.floor(weeklyStreams * effectiveStreamingShare)
              : 0;
            const pureSalesThisWeek = Math.floor(
              (weeklyStreams * (1 - effectiveStreamingShare)) / 150,
            );

            let streamsToAdd = actualStreamsThisWeek;
            let salesToAdd = pureSalesThisWeek;
            let netIncomeToAdd = generatedNet;
            let grossRevenueToAdd = generatedGross;
            let finalDailyStreams = newDailyStreams;

            if (isDailyMode) {
              // On Day 1 in Daily Mode: add only 1 day of streams & income to avoid Monday spike
              const day1Streams = Math.max(25, Math.floor(weeklyStreams / 7));
              const day1ActualStreams = hasStreamingRights ? Math.floor(day1Streams * effectiveStreamingShare) : 0;
              const day1Sales = Math.floor(pureSalesThisWeek / 7);
              const day1Net = Math.floor(generatedNet / 7);
              const day1Gross = Math.floor(generatedGross / 7);

              streamsToAdd = day1ActualStreams;
              salesToAdd = day1Sales;
              netIncomeToAdd = day1Net;
              grossRevenueToAdd = day1Gross;

              finalDailyStreams = [...(song.dailyStreams || []).slice(-27), day1Streams];

              // Sum the actual past 7 days of daily streams for charts & billboard
              const last7Daily = finalDailyStreams.slice(-7);
              if (last7Daily.length > 0) {
                weeklyStreams = last7Daily.reduce((a, b) => a + b, 0);
                actualStreamsThisWeek = hasStreamingRights ? Math.floor(weeklyStreams * effectiveStreamingShare) : 0;
              }
            }

            artistStreamIncome += netIncomeToAdd;

            const regPop = artistData.regionalPopularity || {
              "US": artistData.popularity || 0,
              "Canada": 0,
              "UK": 0,
              "Latin America": 0,
              "Asia": 0,
              "Africa": 0
            };
            
            let wUS = (regPop["US"] || 0);
            let wCanada = (regPop["Canada"] || 0);
            let wUK = (regPop["UK"] || 0);
            let wLatin = (regPop["Latin America"] || 0);
            let wAsia = (regPop["Asia"] || 0);
            let wAfrica = (regPop["Africa"] || 0);
            
            const gLower = (song.genre || "").toLowerCase();
            if (gLower.includes("country")) wUS *= 2.5;
            if (gLower.includes("k-pop") || gLower.includes("kpop") || gLower.includes("j-pop")) wAsia *= 2.5;
            if (gLower.includes("reggae") || gLower.includes("afrobeat")) wAfrica *= 2.5;
            if (gLower.includes("latin") || gLower.includes("reggaeton")) wLatin *= 2.5;
            if (gLower.includes("electronic") || gLower.includes("dance") || gLower.includes("rock") || gLower.includes("indie")) wUK *= 2.0;
            
            if (songPromo && songPromo.region && songPromo.region !== "Global") {
                if (songPromo.region === "US") wUS *= songPromo.boostMultiplier;
                if (songPromo.region === "Canada") wCanada *= songPromo.boostMultiplier;
                if (songPromo.region === "UK") wUK *= songPromo.boostMultiplier;
                if (songPromo.region === "Latin America") wLatin *= songPromo.boostMultiplier;
                if (songPromo.region === "Asia") wAsia *= songPromo.boostMultiplier;
                if (songPromo.region === "Africa") wAfrica *= songPromo.boostMultiplier;
                
                weeklyStreams = Math.floor(weeklyStreams * (1 + (songPromo.boostMultiplier - 1) * 0.3)); // Overall weekly streams gets a slight boost since it's regional
            }
            
            let totalPop = wUS + wCanada + wUK + wLatin + wAsia + wAfrica;
            if (totalPop === 0) {
              totalPop = 1;
              wUS = 1;
            }
            const regStreams = {
              "US": Math.floor(weeklyStreams * (wUS / totalPop)),
              "Canada": Math.floor(weeklyStreams * (wCanada / totalPop)),
              "UK": Math.floor(weeklyStreams * (wUK / totalPop)),
              "Latin America": Math.floor(weeklyStreams * (wLatin / totalPop)),
              "Asia": Math.floor(weeklyStreams * (wAsia / totalPop)),
              "Africa": Math.floor(weeklyStreams * (wAfrica / totalPop)),
            };
            const currentSum = regStreams["US"] + regStreams["Canada"] + regStreams["UK"] + regStreams["Latin America"] + regStreams["Asia"] + regStreams["Africa"];
            if (currentSum < weeklyStreams) {
              regStreams["US"] += (weeklyStreams - currentSum);
            }
            
            const currentRegStreams = song.regionalStreams || { "US": 0, "Canada": 0, "UK": 0, "Latin America": 0, "Asia": 0, "Africa": 0 };
            const newRegionalStreams = {
              "US": (currentRegStreams["US"] || 0) + (isDailyMode ? Math.floor(regStreams["US"] / 7) : regStreams["US"]),
              "Canada": (currentRegStreams["Canada"] || 0) + (isDailyMode ? Math.floor(regStreams["Canada"] / 7) : regStreams["Canada"]),
              "UK": (currentRegStreams["UK"] || 0) + (isDailyMode ? Math.floor(regStreams["UK"] / 7) : regStreams["UK"]),
              "Latin America": (currentRegStreams["Latin America"] || 0) + (isDailyMode ? Math.floor(regStreams["Latin America"] / 7) : regStreams["Latin America"]),
              "Asia": (currentRegStreams["Asia"] || 0) + (isDailyMode ? Math.floor(regStreams["Asia"] / 7) : regStreams["Asia"]),
              "Africa": (currentRegStreams["Africa"] || 0) + (isDailyMode ? Math.floor(regStreams["Africa"] / 7) : regStreams["Africa"]),
            };

            return {
              ...song,
              streams: (song.streams || 0) + streamsToAdd,
              sales: (song.sales || 0) + salesToAdd,
              prevWeekStreams: song.lastWeekStreams || 0,
              lastWeekStreams: weeklyStreams,
              actualPrevWeekStreams: song.actualLastWeekStreams || 0,
              actualLastWeekStreams: actualStreamsThisWeek,
              regionalStreams: newRegionalStreams,
              lastWeekRegionalStreams: regStreams,
              ...firstWeekStreamsData,
              playlistBoostWeeks: newPlaylistBoostWeeks,
              purchasedPlaylists: newPurchasedPlaylists,
              promoBoostWeeks: newPromoBoostWeeks,
              dailyStreams: finalDailyStreams,
              revenue:
                (song.revenue ||
                  Math.floor((song.streams || 0) / 150) *
                    STREAM_INCOME_MULTIPLIER) + grossRevenueToAdd,
              netRevenue:
                (song.netRevenue ||
                  Math.floor((song.streams || 0) / 150) *
                    STREAM_INCOME_MULTIPLIER *
                    playerCut) + netIncomeToAdd,
              isReleased: effectivelyReleased,
            };
          }
          if (song.isTakenDown) {
            return {
              ...song,
              prevWeekStreams: song.lastWeekStreams || 0,
              lastWeekStreams: 0,
              lastWeekRegionalStreams: { "US": 0, "Canada": 0, "UK": 0, "Latin America": 0, "Asia": 0, "Africa": 0 },
              isReleased: effectivelyReleased,
            };
          }
          return effectivelyReleased !== song.isReleased ? { ...song, isReleased: effectivelyReleased } : song;
        });

        artistData.songs = updatedSongs;

        artistData.releases = artistData.releases.map((release) => {
          if (
            newDate.year * 52 +
              newDate.week -
              (release.releaseDate?.year * 52 + release.releaseDate?.week) ===
            1
          ) {
            const firstWeekProjectStreams = release.songIds.reduce(
              (sum, songId) => {
                const song = updatedSongs.find((s) => s.id === songId);
                return sum + (song?.lastWeekStreams || 0);
              },
              0,
            );
            return { ...release, firstWeekStreams: firstWeekProjectStreams };
          }
          return release;
        });

        const hasPro = Boolean(artistData.redMicPro && artistData.redMicPro.unlocked);
        let newCareerStage = artistData.careerStage || "neutral";

        if (hasPro && (artistData.eraLock || artistData.stuckOnEra)) {
          // If stuck on an era (Pro users only), retain exact current career stage
          newCareerStage = artistData.careerStage || "neutral";
        } else if (!hasPro) {
          // Non-pro users can NEVER enter smash era.
          // If a user without pro has smash era and they progress a week, take them all the way to flop era.
          if (artistData.careerStage === "smash") {
            newCareerStage = "flop";
          } else {
            // Non-pro users can only fluctuate between neutral and flop eras. Flop era lock is disabled for non-pro.
            if (state.difficultyMode !== "easy") {
              const newlyEvaluatedRelease = artistData.releases.find(
                (r) =>
                  r.isReleased &&
                  r.releaseDate &&
                  newDate.year * 52 +
                    newDate.week -
                    (r.releaseDate.year * 52 + r.releaseDate.week) ===
                  1,
              );
              if (newlyEvaluatedRelease) {
                let isFlop = false;
                const currentStreams = newlyEvaluatedRelease.firstWeekStreams || 0;
                const reviewScore = newlyEvaluatedRelease.review?.score ?? 7.0;

                if (newlyEvaluatedRelease.type === "Single") {
                  const pastSingles = artistData.releases
                    .filter(
                      (r) =>
                        r.type === "Single" &&
                        r.firstWeekStreams !== undefined &&
                        r.id !== newlyEvaluatedRelease.id,
                    )
                    .sort(
                      (a, b) =>
                        b.releaseDate!.year * 52 +
                        b.releaseDate!.week -
                        (a.releaseDate!.year * 52 + a.releaseDate!.week),
                    );
                  const priorSingle = pastSingles[0];
                  if (pastSingles.length >= 1 && priorSingle && currentStreams < (priorSingle.firstWeekStreams || 0) * 0.3 && reviewScore < 5.0) {
                    isFlop = true;
                  }
                } else {
                  const pastAlbums = artistData.releases
                    .filter(
                      (r) =>
                        (r.type === "Album" || r.type === "EP") &&
                        r.firstWeekStreams !== undefined &&
                        r.id !== newlyEvaluatedRelease.id,
                    )
                    .sort(
                      (a, b) =>
                        b.releaseDate!.year * 52 +
                        b.releaseDate!.week -
                        (a.releaseDate!.year * 52 + a.releaseDate!.week),
                    );
                  const priorAlbum = pastAlbums[0];
                  if (
                    priorAlbum &&
                    currentStreams < (priorAlbum.firstWeekStreams || 0) * 0.3 &&
                    reviewScore < 5.0
                  ) {
                    isFlop = true;
                  }
                }

                if (isFlop) {
                  newCareerStage = "flop";
                }
              }

              if (newCareerStage === "flop" && totalWeeklyStreams >= 4000000) {
                newCareerStage = "neutral";
              }
            }

            // Ensure non-pro can never end up in smash era
            if (newCareerStage === "smash") {
              newCareerStage = "neutral";
            }
          }
        } else {
          // Pro users with regular progression
          if (state.difficultyMode !== "easy") {
            const newlyEvaluatedRelease = artistData.releases.find(
              (r) =>
                r.isReleased &&
                r.releaseDate &&
                newDate.year * 52 +
                  newDate.week -
                  (r.releaseDate.year * 52 + r.releaseDate.week) ===
                1,
            );
            if (newlyEvaluatedRelease) {
              let isFlop = false;
              let isSmash = false;
              const currentStreams = newlyEvaluatedRelease.firstWeekStreams || 0;
              const reviewScore = newlyEvaluatedRelease.review?.score ?? 7.0;

              if (newlyEvaluatedRelease.type === "Single") {
                const pastSingles = artistData.releases
                  .filter(
                    (r) =>
                      r.type === "Single" &&
                      r.firstWeekStreams !== undefined &&
                      r.id !== newlyEvaluatedRelease.id,
                  )
                  .sort(
                    (a, b) =>
                      b.releaseDate!.year * 52 +
                      b.releaseDate!.week -
                      (a.releaseDate!.year * 52 + a.releaseDate!.week),
                  );
                const priorSingle = pastSingles[0];
                
                if (currentStreams >= 12000000 || reviewScore >= 8.5) {
                  isSmash = true;
                } else if (pastSingles.length >= 1) {
                  const lastThree = pastSingles.slice(0, 3);
                  const avg =
                    lastThree.reduce(
                      (sum, s) => sum + (s.firstWeekStreams || 0),
                      0,
                    ) / lastThree.length;
                  if (currentStreams >= avg * 1.35) {
                    isSmash = true;
                  } else if (priorSingle && currentStreams < (priorSingle.firstWeekStreams || 0) * 0.3 && reviewScore < 5.0) {
                    isFlop = true;
                  }
                }
              } else {
                const pastAlbums = artistData.releases
                  .filter(
                    (r) =>
                      (r.type === "Album" || r.type === "EP") &&
                      r.firstWeekStreams !== undefined &&
                      r.id !== newlyEvaluatedRelease.id,
                  )
                  .sort(
                    (a, b) =>
                      b.releaseDate!.year * 52 +
                      b.releaseDate!.week -
                      (a.releaseDate!.year * 52 + a.releaseDate!.week),
                  );
                const priorAlbum = pastAlbums[0];
                if (currentStreams >= 35000000 || reviewScore >= 8.5) {
                  isSmash = true;
                } else if (
                  priorAlbum &&
                  currentStreams >= (priorAlbum.firstWeekStreams || 0) * 1.2
                ) {
                  isSmash = true;
                } else if (
                  priorAlbum &&
                  currentStreams < (priorAlbum.firstWeekStreams || 0) * 0.3 &&
                  reviewScore < 5.0
                ) {
                  isFlop = true;
                }
              }

              if (isSmash) {
                if (newCareerStage === "flop") newCareerStage = "neutral";
                else if (newCareerStage === "neutral") newCareerStage = "smash";
              } else if (isFlop && !artistData.flopEraLock) {
                if (newCareerStage === "smash") newCareerStage = "neutral";
                else if (newCareerStage === "neutral") newCareerStage = "flop";
              }
            }

            // Check if artist has high performance milestones that maintain/elevate Smash Era
            if (totalWeeklyStreams >= 20000000 || (artistData.monthlyListeners || 0) >= 25000000) {
              newCareerStage = "smash";
            } else if (newCareerStage === "flop" && totalWeeklyStreams >= 4000000) {
              newCareerStage = "neutral"; // Lift out of flop era on solid recovery
            }
          }
        }

        const updatedLastFourWeeksStreams = [
          totalWeeklyStreams,
          ...artistData.lastFourWeeksStreams,
        ].slice(0, 4);
        const totalStreamsLastMonth = isDailyMode
          ? artistData.songs.reduce((sum, s) => {
              if (!s.isReleased || s.isTakenDown) return sum;
              const last28 = s.dailyStreams || [];
              if (last28.length === 0) return sum + (s.lastWeekStreams ? s.lastWeekStreams * 4 : 0);
              const sum28 = last28.reduce((a, b) => a + b, 0);
              return sum + (last28.length < 28 ? Math.floor(sum28 * (28 / last28.length)) : sum28);
            }, 0)
          : updatedLastFourWeeksStreams.reduce(
              (sum, streams) => sum + streams,
              0,
            );
        const calculatedListeners = Math.floor(totalStreamsLastMonth * 0.1);
        const maxListeners = 148000000 + (artistId.charCodeAt(0) % 2000000);
        artistData.monthlyListeners = Math.min(
          calculatedListeners,
          maxListeners,
        );
        artistData.careerStage = newCareerStage;
        artistData.peakMonthlyListeners = Math.max(
          artistData.monthlyListeners,
          artistData.peakMonthlyListeners || 0,
        );

        artistData.listeningNow = Math.floor(
          artistData.monthlyListeners * (Math.random() * 0.001),
        );
        artistData.saves = Math.floor(
          (artistData.saves || 0) +
            (totalWeeklyStreams / 1000) * (Math.random() * 0.5 + 0.5),
        );
        const newFollowers = Math.floor(totalWeeklyStreams / 50000);
        artistData.followers = (artistData.followers || 0) + newFollowers;

        const updatedStreamsHistory = [
          ...(artistData.streamsHistory || []),
          { date: newDate, streams: totalWeeklyStreams },
        ];
        if (updatedStreamsHistory.length > 52) {
          updatedStreamsHistory.shift();
        }
        artistData.streamsHistory = updatedStreamsHistory;

        let totalWeeklyViews = 0;
        const updatedVideos = artistData.videos.map((video) => {
          if (video.isScheduled) return video;
          const song = updatedSongs.find((s) => s.id === video.songId);
          if (!song) return video;

          const videoPromo = artistData.promotions.find(
            (p) => p.itemId === video.id && p.itemType === "video",
          );
          let weeklyViews;

          if (videoPromo && videoPromo.boostMultiplier === -1) {
            // Synergy Campaign
            weeklyViews = song.lastWeekStreams;
          } else {
            let videoTypeMultiplier = 1;
            switch (video.type) {
              case "Music Video":
                videoTypeMultiplier = 2;
                break;
              case "Lyric Video":
                videoTypeMultiplier = 1;
                break;
              case "Visualizer":
                videoTypeMultiplier = 0.5;
                break;
              case "Genius Verified":
                videoTypeMultiplier = 0.3;
                break;
              case "Live Performance":
                videoTypeMultiplier = 2.5;
                break;
              case "Interview":
                videoTypeMultiplier = 0.375;
                break;
            }
            const difficulty = state.difficultyMode || "normal";
            let diffMultiplier = 1;
            if (difficulty === "easy") diffMultiplier = 2.0;
            else if (difficulty === "hard") diffMultiplier = 0.6;
            else if (difficulty === "extreme") diffMultiplier = 0.3;

            weeklyViews = Math.floor(
              song.quality ** 2 *
                10 *
                videoTypeMultiplier *
                hypeMultiplier *
                popularityMultiplier *
                diffMultiplier *
                (Math.random() * 0.4 + 0.8),
            );
          }

          if (song.pitchforkBoost && (state.difficultyMode === "easy" || state.difficultyMode === "original")) {
            weeklyViews = Math.floor(weeklyViews * (Math.random() * 2 + 2));
          }
          if (song.interviewBoost) {
            weeklyViews = Math.floor(weeklyViews * (Math.random() * 2 + 2));
          }

          if (videoPromo && videoPromo.boostMultiplier !== -1) {
            weeklyViews = Math.floor(weeklyViews * videoPromo.boostMultiplier);
          }

          const isMtvPre2008 = video.isMtv && newDate.year < 2008;

          if (isMtvPre2008) {
            const rotMult = video.mtvRotation === 'heavy' ? 3.2 : video.mtvRotation === 'buzzworthy' ? 2.2 : 1.4;
            const mtvTvWeekly = Math.floor(weeklyViews * rotMult * 1.5);
            const updatedTrlWeeks = (video.trlWeeks || 0) + 1;
            
            // Boost song hype and sales from TV rotation
            song.hype = Math.min(100, (song.hype || 0) + (video.mtvRotation === 'heavy' ? 8 : 4));

            return {
              ...video,
              mtvWeeklyViews: mtvTvWeekly,
              mtvViews: (video.mtvViews || 0) + mtvTvWeekly,
              trlWeeks: updatedTrlWeeks,
            };
          }

          // In 2008-2009, if MTV video is uploaded to YouTube for the first time
          let initialArchiveBoost = 0;
          if (video.isMtv && newDate.year >= 2008 && video.views === 0 && (video.mtvViews || 0) > 0) {
            initialArchiveBoost = Math.floor((video.mtvViews || 100000) * 0.15);
          }

          let firstWeekViewsData = {};
          if (
            newDate.year * 52 +
              newDate.week -
              (video.releaseDate?.year * 52 + video.releaseDate?.week) ===
            1
          ) {
            firstWeekViewsData = { firstWeekViews: weeklyViews };
          }

          totalWeeklyViews += weeklyViews;
          
          let spotifyViewsData = {};
          if (video.isOnSpotify) {
            const spotifyWeeklyViews = Math.floor(weeklyViews * 0.8);
            const currentSpotifyDaily = video.spotifyDailyViews || [];
            const newSpotifyDailyViews = [
              ...currentSpotifyDaily.slice(-6),
              Math.floor(spotifyWeeklyViews / 7)
            ];
            
            spotifyViewsData = {
              spotifyViews: (video.spotifyViews || 0) + spotifyWeeklyViews,
              spotifyDailyViews: newSpotifyDailyViews
            };
          }
          
          return {
            ...video,
            views: video.views + weeklyViews + initialArchiveBoost,
            lastWeekViews: weeklyViews,
            ...firstWeekViewsData,
            ...spotifyViewsData,
          };
        });
        artistData.videos = updatedVideos;

        const updatedLastFourWeeksViews = [
          totalWeeklyViews,
          ...artistData.lastFourWeeksViews,
        ].slice(0, 4);

        const newSubscribersGained = Math.floor(
          (totalWeeklyViews /
            (450 - Math.min(350, artistData.youtubeSubscribers / 4000))) * 0.85,
        );
        const newYoutubeSubscribers =
          artistData.youtubeSubscribers + newSubscribersGained;

        const streamIncome = totalWeeklyStreams * STREAM_INCOME_MULTIPLIER;
        const viewIncome = totalWeeklyViews * VIEW_INCOME_MULTIPLIER;

        let merchIncome = 0;
        if (artistData.youtubeStoreUnlocked || newDate.year >= 2005) {
          artistData.merch = artistData.merch.map((item) => {
            let weeklySales = Math.floor(
              (Math.max(100, artistData.youtubeSubscribers || 1000) / 50000) *
                popularityMultiplier *
                (Math.random() * 5 + 1),
            );

            // Scale demand by price (higher price = lower demand)
            const recommendedPrice =
              item.type === "Vinyl" ? 39.98 : item.type === "CD" ? 12.98 : 2.99;
            const safePrice = Math.max(0.01, item.price);
            weeklySales = Math.floor(
              weeklySales * Math.pow(recommendedPrice / safePrice, 2.0),
            );

            if (item.type === "Ringtone") {
              // Ringtones demand scales massively based on hype
              let ringtoneSales = Math.floor(
                artistData.hype *
                  2000 *
                  popularityMultiplier *
                  (Math.random() * 5 + 1),
              );
              weeklySales = Math.floor(
                ringtoneSales * Math.pow(recommendedPrice / safePrice, 2.0),
              );
            }

            if (artistData.redMicPro.unlocked && artistData.salesBoost > 0) {
              weeklySales = Math.floor(
                weeklySales * (1 + artistData.salesBoost / 100),
              );
            }

            const ukPop = artistData.regionalPopularity?.["UK"] || 0;
            if (item.regionExclusive === 'UK') {
              weeklySales = Math.floor(weeklySales * (0.5 + (ukPop / 100) * 1.5));
            } else if (ukPop > 0) {
              weeklySales = Math.floor(
                weeklySales * (1 + (ukPop / 100) * 0.8),
              );
            }

            // Bonus tracks sell 25% better
            if (item.bonusSongTitles && item.bonusSongTitles.length > 0) {
              weeklySales = Math.floor(weeklySales * 1.25);
            }

            // Cap sales to available stock
            const actualSales = Math.min(weeklySales, item.stock);

            if (item.isPreorder) {
              const sub = artistData.labelSubmissions.find(
                (s) => s.release.id === item.releaseId,
              );
              if (sub) {
                sub.preorderSales = (sub.preorderSales || 0) + actualSales;
              }
            }

            merchIncome += actualSales * item.price;

            return {
              ...item,
              stock: item.stock - actualSales,
              unitsSold: (item.unitsSold || 0) + actualSales,
              _actualWeeklySales: actualSales,
            };
          });
        }

        // --- ONLYFANS INCOME ---
        let onlyfansIncome = 0;
        const ofProfile = artistData.onlyfans;
        if (ofProfile) {
          const ONLYFANS_CUT = 0.2;
          // 1. Calculate new subscribers
          const subPrice =
            ofProfile.subscriptionPrice > 0
              ? ofProfile.subscriptionPrice
              : 4.99;
          const subscriberPotential =
            (artistData.hype / (subPrice * 0.5)) * (Math.random() * 20 + 10);
          const newSubscribers = Math.floor(subscriberPotential);
          ofProfile.subscribers += newSubscribers;

          // 2. Calculate engagement and income from existing posts
          let tipsIncome = 0;
          ofProfile.posts = ofProfile.posts.map((post) => {
            const newLikes = Math.floor(
              ofProfile.subscribers *
                (artistData.hype / 2000) *
                (Math.random() * 0.05 + 0.01),
            );
            const newComments = Math.floor(
              newLikes / (Math.random() * 30 + 15),
            );
            const newTips = newLikes * (Math.random() * 0.02); // average tip per like

            tipsIncome += newTips;

            return {
              ...post,
              likes: post.likes + newLikes,
              comments: post.comments + newComments,
              tips: post.tips + newTips,
            };
          });

          // 3. Calculate income from new subscribers buying old posts
          let postPurchaseIncome = 0;
          const pricedPosts = ofProfile.posts.filter((p) => p.price > 0);
          if (newSubscribers > 0 && pricedPosts.length > 0) {
            for (let i = 0; i < newSubscribers; i++) {
              // Assume each new sub has a 25% chance to buy a random priced post
              if (Math.random() < 0.25) {
                postPurchaseIncome +=
                  pricedPosts[Math.floor(Math.random() * pricedPosts.length)]
                    .price;
              }
            }
          }

          // 4. Calculate total income
          const subscriptionIncome =
            ofProfile.subscribers * ofProfile.subscriptionPrice;
          const weeklyGross =
            subscriptionIncome + tipsIncome + postPurchaseIncome;
          const weeklyNet = weeklyGross * (1 - ONLYFANS_CUT);

          ofProfile.totalGross += weeklyGross;
          ofProfile.totalNet += weeklyNet;
          onlyfansIncome = weeklyNet;

          const yearMonth = `${newDate.year}-${String(Math.floor(newDate.week / 4)).padStart(2, "0")}`;
          if (!ofProfile.earningsByMonth[yearMonth]) {
            ofProfile.earningsByMonth[yearMonth] = { gross: 0, net: 0 };
          }
          ofProfile.earningsByMonth[yearMonth].gross += weeklyGross;
          ofProfile.earningsByMonth[yearMonth].net += weeklyNet;

          // 5. Generate new content requests
          if (ofProfile.subscribers > 50 && Math.random() < 0.15) {
            // 15% chance per week
            const emailId = crypto.randomUUID();
            const payout = Math.floor(Math.random() * 4501) + 500;
            const requestType = Math.random() > 0.5 ? "image" : "video";
            const senderUsername = `user${Math.floor(Math.random() * 90000) + 10000}`;
            newEmails.push({
              id: emailId,
              sender: "OnlyFans",
              senderIcon: "onlyfans",
              subject: "New Content Request from a Subscriber",
              body: `Hi ${artistProfileForEmail?.name},

A subscriber (@${senderUsername}) has sent a request for custom content.

Request Type: ${requestType}
Payout: $${payout.toLocaleString()}

Accepting this will instantly transfer the funds to your account. The content is assumed to be sent privately.

- The OnlyFans Team`,
              date: newDate,
              isRead: false,
              offer: {
                type: "onlyfansRequest",
                requestType,
                payout,
                isFulfilled: false,
                emailId,
                senderUsername,
              },
            });
          }
        }

        let finalStreamIncome = artistStreamIncome;

        let npcLabelIncome = 0;
        if (artistData.customLabels && artistData.customLabels.length > 0) {
          artistData.customLabels = artistData.customLabels.map((label) => {
            if (!label.signedNpcs || label.signedNpcs.length === 0)
              return label;
            const updatedSignedNpcs = label.signedNpcs.map((signedNpc) => {
              if (signedNpc.status !== "active") return signedNpc;

              const weeksPassed =
                newDate.year * 52 +
                newDate.week -
                (signedNpc.contract.startDate.year * 52 +
                  signedNpc.contract.startDate.week);
              let newStatus = signedNpc.status;

              if (weeksPassed >= signedNpc.contract.durationWeeks) {
                newStatus = "expired";
                newEmails.push({
                  id: crypto.randomUUID(),
                  sender: signedNpc.name,
                  senderIcon: "label",
                  subject: "Contract Expired! Renegotiate?",
                  body: `My contract with your label has officially expired. I'd love to stay, but we need to negotiate a new advance. Open the Manage Label view to see my demands.`,
                  date: newDate,
                  isRead: false,
                  offer: {
                    type: "npcContractRenewal",
                    npcName: signedNpc.name,
                    isAccepted: false,
                    emailId: "",
                  },
                });
              }

              const npcProfile = newNpcsList.find(
                (n) => n.artist === signedNpc.name,
              );
              if (npcProfile) {
                const weeklyStreams = Math.floor(
                  npcProfile.basePopularity * (Math.random() * 0.4 + 0.8),
                );
                const grossRevenue = weeklyStreams * 0.003;
                // Label keeps (100 - artist royaltyRate) % of revenue
                const labelCut =
                  grossRevenue * ((100 - signedNpc.contract.royaltyRate) / 100);
                npcLabelIncome += labelCut;
                return {
                  ...signedNpc,
                  revenueGenerated: signedNpc.revenueGenerated + grossRevenue,
                  status: newStatus,
                };
              }
              return { ...signedNpc, status: newStatus };
            });
            return { ...label, signedNpcs: updatedSignedNpcs };
          });
        }

        let xVerifiedMonthlyCost = 0;
        if (newDate.week % 4 === 0) {
          artistData.xUsers.forEach((u) => {
            if (u.isPlayer) {
              if (u.isVerified === "blue") xVerifiedMonthlyCost += 25000;
              if (u.isVerified === "gold") xVerifiedMonthlyCost += 250000;
            }
          });

          if (xVerifiedMonthlyCost > 0) {
            artistData.inbox.unshift({
              id: crypto.randomUUID(),
              sender: "X Accounts & Billing",
              subject: "X Premium Receipt",
              body: `Your X Premium subscription renewed this month.

Total charged: $${formatNumber(xVerifiedMonthlyCost)}

Thank you for trusting X.`,
              date: state.date,
              isRead: false,
            });
          }
        }

        const totalIncome =
          finalStreamIncome +
          viewIncome +
          merchIncome +
          onlyfansIncome +
          npcLabelIncome -
          xVerifiedMonthlyCost;

        const newStreamsThisMonth =
          artistData.streamsThisMonth + totalWeeklyStreams;
        const newViewsThisQuarter =
          artistData.viewsThisQuarter + totalWeeklyViews;
        const newSubsThisQuarter =
          artistData.subsThisQuarter + newSubscribersGained;

        // Stream removal logic (every 4 weeks)
        if (newDate.week % 4 === 0 && artistData.promotions.length > 0) {
          let totalRemovedStreams = 0;
          const newSongs = [...artistData.songs];

          const songPromotions = artistData.promotions.filter(
            (p) => p.itemType === "song",
          );

          for (const promo of songPromotions) {
            const songIndex = newSongs.findIndex((s) => s.id === promo.itemId);
            if (songIndex !== -1) {
              const song = newSongs[songIndex];

              if (song.isReleased && song.streams > 1000) {
                const getRemovalPercentage = (
                  boost: number,
                  quality?: string,
                ): number => {
                  let basePercentage = 0;
                  if (boost >= 30)
                    basePercentage = 0.8; // 80%
                  else if (boost >= 10)
                    basePercentage = 0.25 + Math.random() * 0.15; // 25-40%
                  else if (boost >= 4)
                    basePercentage = 0.1 + Math.random() * 0.1; // 10-20%
                  else if (boost >= 2.5)
                    basePercentage = 0.05 + Math.random() * 0.05; // 5-10%
                  else if (boost >= 1.5)
                    basePercentage = 0.01 + Math.random() * 0.04; // 1-5%
                  else basePercentage = 0.001 + Math.random() * 0.01; // fallback

                  let multiplier = 1;
                  if (quality === "high")
                    multiplier = 0.1; // 10% of base removal
                  else if (quality === "medium") multiplier = 0.4; // 40% of base removal

                  return basePercentage * multiplier;
                };

                const removalPercentage = getRemovalPercentage(
                  promo.boostMultiplier,
                  promo.promoQuality,
                );
                const streamsToRemove = Math.floor(
                  song.streams * removalPercentage,
                );

                if (streamsToRemove > 0) {
                  totalRemovedStreams += streamsToRemove;
                  newSongs[songIndex] = {
                    ...song,
                    streams: song.streams - streamsToRemove,
                    lastWeekStreams:
                      (song.lastWeekStreams || 0) - streamsToRemove,
                    removedStreams:
                      (song.removedStreams || 0) + streamsToRemove,
                  };
                }
              }
            }
          }
          artistData.songs = newSongs;

          if (totalRemovedStreams > 0) {
            if (artistProfileForEmail) {
              newEmails.push({
                id: crypto.randomUUID(),
                sender: "Spotify",
                subject: "Adjustment to your stream counts",
                body: `Hi ${artistProfileForEmail.name},

We're writing to let you know that we've made an adjustment to your stream counts. After a routine review, we identified and removed approximately ${formatNumber(totalRemovedStreams)} artificial streams from songs in your active promotional campaigns.

This is a standard process to ensure that our data is accurate and reflects genuine listener activity. For more information on artificial streams, please visit Spotify for Artists.

Thanks,
The Spotify Team`,
                date: newDate,
                isRead: false,
                senderIcon: "spotify",
              });
              artistData.streamsRemovedThisWeek = totalRemovedStreams;
            }
          }
        }

        const artistProfile =
          state.soloArtist ||
          state.group?.members.find((m) => m.id === artistId) ||
          state.group;

        if (newDate.week % 4 === 0) {
          let totalXMonetizationEarnings = 0;
          const playerUserId =
            artistData.selectedPlayerXUserId ||
            artistData.xUsers?.find((u) => u.isPlayer)?.id;
          if (playerUserId && artistData.xUsers) {
            artistData.xUsers = artistData.xUsers.map((u) => {
              if (u.id === playerUserId && u.xMonetization) {
                let earnings = 0;
                let updatedRevenueSharing = {
                  ...u.xMonetization.revenueSharing,
                };
                let updatedSubscriptions = { ...u.xMonetization.subscriptions };

                if (u.xMonetization.revenueSharing?.isActive) {
                  const fourWeeksAgoYear =
                    newDate.week > 4 ? newDate.year : newDate.year - 1;
                  const fourWeeksAgoWeek =
                    newDate.week > 4
                      ? newDate.week - 4
                      : 52 - (4 - newDate.week);

                  const eligiblePosts = (artistData.xPosts || []).filter(
                    (p) =>
                      p.authorId === playerUserId &&
                      ((p.date.year === newDate.year &&
                        p.date.week > fourWeeksAgoWeek &&
                        p.date.week <= newDate.week) ||
                        (p.date.year === fourWeeksAgoYear &&
                          p.date.week > fourWeeksAgoWeek)),
                  );

                  const totalViews = eligiblePosts.reduce(
                    (sum, p) => sum + (p.views || 0),
                    0,
                  );
                  updatedRevenueSharing.eligibleViewsThisMonth = totalViews;

                  if (totalViews > 0) {
                    const cpm = 0.00012 + Math.random() * 0.000055;
                    const rev = Math.floor(totalViews * cpm);
                    earnings += rev;
                    updatedRevenueSharing.lifetimeEarnings += rev;
                  }
                }

                if (u.xMonetization.subscriptions?.isActive) {
                  const baseSubscribers = Math.max(
                    0,
                    Math.floor(u.followersCount * 0.001),
                  ); // 0.1% of followers might subscribe
                  const newSubscribers = Math.floor(
                    baseSubscribers * (0.8 + Math.random() * 0.4),
                  );
                  updatedSubscriptions.subscribers = newSubscribers;
                  const rev = Math.floor(
                    newSubscribers * updatedSubscriptions.price,
                  );
                  earnings += rev;
                }

                totalXMonetizationEarnings += earnings;

                return {
                  ...u,
                  xMonetization: {
                    ...u.xMonetization,
                    subscriptions: updatedSubscriptions,
                    revenueSharing: updatedRevenueSharing,
                  },
                };
              }
              return u;
            });
          }

          if (
            totalXMonetizationEarnings > 0 &&
            artistId === state.activeArtistId
          ) {
            artistData.money += totalXMonetizationEarnings;
            newEmails.push({
              id: crypto.randomUUID(),
              sender: "X",
              subject: "Your Creator Earnings",
              body: `Hi ${artistProfile?.name},

Your X monetization earnings for the last month have been processed.

You earned $${totalXMonetizationEarnings.toLocaleString()} from revenue sharing and subscriptions.

Keep creating!
- X Team`,
              date: newDate,
              isRead: false,
              senderIcon: "x",
            });
          }
        }

        const eraConfTemp = getEraConfiguration(newDate.year);
        if (
          newDate.week % 4 === 0 &&
          newStreamsThisMonth > 0 &&
          artistProfile &&
          eraConfTemp.streamingActive
        ) {
          newEmails.push({
            id: crypto.randomUUID(),
            sender: "Spotify",
            subject: "Your Spotify Recap",
            body: `Congratulations ${artistProfile.name},

Here's your performance recap for the last month. Your tracks generated a total of ${newStreamsThisMonth.toLocaleString()} new streams!

Keep up the great work.
- The Spotify Team`,
            date: newDate,
            isRead: false,
            senderIcon: "spotify",
          });
        }

        if (
          newDate.week > 1 &&
          newDate.week % 13 === 0 &&
          (newViewsThisQuarter > 0 || newSubsThisQuarter > 0) &&
          artistProfile &&
          eraConfTemp.youtubeAvailable
        ) {
          let yppEarnings = 0;
          let extraText = "";

          if (artistData.youtubePartnerProgram?.isActive) {
            const ratePerView = Math.random() * (0.005 - 0.003) + 0.003;
            yppEarnings = Math.floor(newViewsThisQuarter * ratePerView);

            if (yppEarnings > 0 && artistId === state.activeArtistId) {
              artistData.money += yppEarnings;
              artistData.youtubePartnerProgram.lifetimeEarnings += yppEarnings;
            }
            extraText = `

As a YouTube Partner, you've earned $${yppEarnings.toLocaleString()} from your channel's viewership this quarter!`;
          }

          newEmails.push({
            id: crypto.randomUUID(),
            sender: "YouTube",
            subject: "Your Quarterly Channel Recap",
            body: `Dear ${artistProfile.name},

Let's check out your channel's growth over the last 3 months. You've gained ${newSubsThisQuarter.toLocaleString()} subscribers and your videos received ${newViewsThisQuarter.toLocaleString()} views.${extraText}

Keep creating!
- The YouTube Team`,
            date: newDate,
            isRead: false,
            senderIcon: "youtube",
          });
        }

        // --- CONTRACT & LABEL LOGIC ---
        if (artistData.contract) {
          const contract = artistData.contract;
          const label = LABELS.find((l) => l.id === contract.labelId);
          const weeksPassed =
            newDate.year * 52 +
            newDate.week -
            (contract.startDate.year * 52 + contract.startDate.week);

          if (contract.durationWeeks && weeksPassed >= contract.durationWeeks) {
            if (artistId === state.activeArtistId) {
              contractRenewalForActivePlayer = {
                labelId: contract.labelId,
                isCustom: contract.isCustom,
                artistId: artistId,
              };
            } else {
              artistData.contractHistory.push(contract);
              artistData.contract = null;
              if (label && artistProfile) {
                newEmails.push({
                  id: crypto.randomUUID(),
                  sender: label.name,
                  subject: "Contract Expired",
                  body: `Dear ${artistProfile.name},

Your contract with ${label.name} has officially ended. You are now an independent artist.

Sincerely,
${label.name}`,
                  date: newDate,
                  isRead: false,
                  senderIcon: "label",
                });
              }
            }
          }

          // Process pending submissions for approval/rejection
          artistData.labelSubmissions = artistData.labelSubmissions.map(
            (sub) => {
              if (sub.status === "pending" && label) {
                let isReadyForReview = false;
                if (isDailyMode) {
                  const totalDaysSinceSubmission =
                    (newDate.year * 52 * 7 + newDate.week * 7 + (newDate.day || 1)) -
                    (sub.submittedDate.year * 52 * 7 + sub.submittedDate.week * 7 + (sub.submittedDate.day || 1));
                  const daysNeeded = sub.reviewDaysNeeded ?? (Math.floor(Math.random() * 6) + 2); // 2-7 days
                  if (totalDaysSinceSubmission >= daysNeeded) {
                    isReadyForReview = true;
                  }
                } else {
                  const weeksSinceSubmission =
                    newDate.year * 52 +
                    newDate.week -
                    (sub.submittedDate.year * 52 + sub.submittedDate.week);
                  if (weeksSinceSubmission >= 2) {
                    isReadyForReview = true;
                  }
                }

                if (isReadyForReview) {
                  const avgQuality =
                    sub.release.songIds.reduce(
                      (sum, id) =>
                        sum +
                        (artistData.songs.find((s) => s.id === id)?.quality ||
                          0),
                      0,
                    ) / sub.release.songIds.length;

                  let minQuality = label.minQuality ?? 0;
                  let feedback = `The average quality of ${avgQuality.toFixed(0)} didn't meet our standard of ${minQuality}. Back to the drawing board.`;

                  if (label.contractType === "petty" && avgQuality < 70) {
                    minQuality = 70; // Hard override for petty labels
                    feedback = `The average quality of ${avgQuality.toFixed(0)} is unacceptable. We require a minimum quality of 70 for all releases. Do better.`;
                  }

                  if (avgQuality >= minQuality) {
                    newEmails.push({
                      id: crypto.randomUUID(),
                      sender: label.name,
                      subject: `Submission Approved: "${sub.release.title}"`,
                      body: `Great news!

We've approved your submission for "${sub.release.title}". Please head to the 'Labels' tab to select your pre-release singles and set a release date for the project. Get ready!

- ${label.name}`,
                      date: newDate,
                      isRead: false,
                      senderIcon: "label",
                    });
                    return {
                      ...sub,
                      status: "awaiting_player_input",
                      decisionDate: newDate,
                    };
                  } else {
                    newEmails.push({
                      id: crypto.randomUUID(),
                      sender: label.name,
                      subject: `Submission Update: "${sub.release.title}"`,
                      body: `Hi ${artistProfile?.name},

After careful consideration, we've decided to pass on releasing "${sub.release.title}" at this time. ${feedback}

- ${label.name}`,
                      date: newDate,
                      isRead: false,
                      senderIcon: "label",
                    });
                    return {
                      ...sub,
                      status: "rejected",
                      decisionDate: newDate,
                      feedback,
                    };
                  }
                }
              }
              return sub;
            },
          );

          // Process scheduled releases
          const scheduledSubmissions = [
            ...artistData.labelSubmissions.filter(
              (s) => s.status === "scheduled",
            ),
          ];
          let submissionsToRemove: string[] = [];
          let submissionsToUpdate: LabelSubmission[] = [];

          const contractLabel =
            LABELS.find((l) => l.id === artistData.contract!.labelId) ||
            artistData.customLabels.find(
              (l) => l.id === artistData.contract!.labelId,
            );
          let releasingLabelInfo: Release["releasingLabel"] = null;
          if (contractLabel) {
            releasingLabelInfo = { name: contractLabel.name };
            if (
              "dealWithMajorId" in contractLabel &&
              contractLabel.dealWithMajorId
            ) {
              const major = LABELS.find(
                (l) => l.id === contractLabel.dealWithMajorId,
              );
              if (major) {
                releasingLabelInfo.dealWithMajor = major.name;
              }
            }
            if (
              "exclusiveLicenseId" in contractLabel &&
              contractLabel.exclusiveLicenseId
            ) {
              const exclusive = LABELS.find(
                (l) => l.id === contractLabel.exclusiveLicenseId,
              );
              if (exclusive) {
                releasingLabelInfo.exclusiveLicenseTo = exclusive.name;
              }
            }
          }

          let rightsSoldPercent = 0;
          let rightsOwnerLabelId = undefined;
          if (artistData.contract) {
            rightsOwnerLabelId = artistData.contract.labelId;
            if (artistData.contract.mastersOwnership === "Label") {
              rightsSoldPercent = 100;
            } else if (artistData.contract.mastersOwnership === "Split") {
              rightsSoldPercent = 100 - artistData.contract.mastersSplitPercent;
            } else {
              rightsSoldPercent = 0;
              rightsOwnerLabelId = undefined;
            }
          }

          scheduledSubmissions.forEach((sub) => {
            let subModified = false;
            // Check for single releases
            const singlesReadyToRelease =
              sub.singlesToRelease?.filter(
                (single) =>
                  single.releaseDate?.week === newDate.week &&
                  single.releaseDate?.year === newDate.year,
              ) || [];

            if (singlesReadyToRelease.length > 0) {
              singlesReadyToRelease.forEach((single) => {
                const songToRelease = artistData.songs.find(
                  (s) => s.id === single.songId,
                );
                if (songToRelease) {
                  if (
                    songToRelease.controversialContributors &&
                    songToRelease.controversialContributors.length > 0
                  ) {
                    const badName = songToRelease.controversialContributors[0];
                    artistData.publicImage = Math.max(
                      0,
                      (artistData.publicImage || 80) - 20,
                    );

                    const controversialTmzPost: XPost = {
                      id: crypto.randomUUID(),
                      authorId: "tmz",
                      content: `${artistProfile?.name || "Artist"} has worked with controversial producer ${badName} on their new song "${songToRelease.title}". Are they desperate for a hit? Yikes. ðŸ˜¬`,
                      image:
                        artistData.paparazziPhotos.length > 0
                          ? artistData.paparazziPhotos[
                              Math.floor(
                                Math.random() *
                                  artistData.paparazziPhotos.length,
                              )
                            ].url
                          : undefined,
                      likes: Math.floor(Math.random() * 60000) + 20000,
                      retweets: Math.floor(Math.random() * 15000) + 5000,
                      views: Math.floor(Math.random() * 2000000) + 800000,
                      date: newDate,
                    };
                    const controversialFanPost1: XPost = {
                      id: crypto.randomUUID(),
                      authorId: `hater_${Math.floor(Math.random() * 1000)}`,
                      content: `Ew why is ${artistProfile?.name || "Artist"} working with ${badName}?? Cancelled.`,
                      likes: Math.floor(Math.random() * 5000) + 1000,
                      retweets: Math.floor(Math.random() * 1000) + 100,
                      views: Math.floor(Math.random() * 100000) + 10000,
                      date: newDate,
                    };
                    const controversialFanPost2: XPost = {
                      id: crypto.randomUUID(),
                      authorId: `hater_${Math.floor(Math.random() * 1000)}`,
                      content: `I'm actually shocked ${artistProfile?.name || "Artist"} would sink this low. The new song is tainted.`,
                      likes: Math.floor(Math.random() * 8000) + 2000,
                      retweets: Math.floor(Math.random() * 2000) + 200,
                      views: Math.floor(Math.random() * 150000) + 20000,
                      date: newDate,
                    };
                    artistData.xPosts = [
                      controversialTmzPost,
                      controversialFanPost1,
                      controversialFanPost2,
                      ...artistData.xPosts,
                    ];
                  }

                  const singleRelease: Release = {
                    id: crypto.randomUUID(),
                    title: songToRelease.title,
                    type: "Single",
                    coverArt: sub.release.coverArt, // Use album cover for pre-release single
                    songIds: [songToRelease.id],
                    releaseDate: newDate,
                    artistId: songToRelease.artistId,
                    releasingLabel: releasingLabelInfo,
                    rightsSoldPercent:
                      rightsSoldPercent > 0 ? rightsSoldPercent : undefined,
                    rightsOwnerLabelId: rightsOwnerLabelId,
                  };
                  artistData.releases.push(singleRelease);
                  artistData.songs = artistData.songs.map((s) =>
                    s.id === single.songId
                      ? {
                          ...s,
                          isReleased: true,
                          releaseId: singleRelease.id,
                          isPreReleaseSingle: true,
                          isInterlude: single.singleType === 'interlude',
                          singleType: single.singleType,
                          coverArt: sub.release.coverArt,
                          rightsSoldPercent:
                            rightsSoldPercent > 0
                              ? rightsSoldPercent
                              : undefined,
                          rightsOwnerLabelId: rightsOwnerLabelId,
                        }
                      : s,
                  );
                  artistData.hype = Math.min(
                    getHypeCap(artistData),
                    artistData.hype + 15,
                  );

                  if (!single.isAnnounced) {
                    const pronounPossessive =
                      artistProfile?.pronouns === "he/him"
                        ? "his"
                        : artistProfile?.pronouns === "she/her"
                          ? "her"
                          : "their";
                    const popBasePost: XPost = {
                      id: crypto.randomUUID(),
                      authorId: "popbase",
                      content: `${artistProfile?.name} has surprise released ${pronounPossessive} new Single "${songToRelease.title}".`,
                      image: singleRelease.coverArt,
                      likes: Math.floor(Math.random() * 80000) + 30000,
                      retweets: Math.floor(Math.random() * 20000) + 5000,
                      views: Math.floor(Math.random() * 1500000) + 500000,
                      date: newDate,
                    };
                    artistData.xPosts.unshift(popBasePost);

                    const tmzPost: XPost = {
                      id: crypto.randomUUID(),
                      authorId: "tmz",
                      content: `${artistProfile.name} just secret-dropped a new track. Desperation for streams or a genuine surprise? You be the judge. ðŸ“‰ðŸ¤­`,
                      image:
                        artistData.paparazziPhotos.length > 0
                          ? artistData.paparazziPhotos[
                              Math.floor(
                                Math.random() *
                                  artistData.paparazziPhotos.length,
                              )
                            ].url
                          : undefined,
                      likes: Math.floor(Math.random() * 40000) + 10000,
                      retweets: Math.floor(Math.random() * 8000) + 2000,
                      views: Math.floor(Math.random() * 900000) + 300000,
                      date: newDate,
                    };
                    artistData.xPosts.unshift(tmzPost);
                  }

                  // Genius offer for single
                  if (artistProfile && newDate.year >= 2020) {
                    const emailId = crypto.randomUUID();
                    newEmails.push({
                      id: emailId,
                      sender: "Genius",
                      subject: `Verified Interview for "${songToRelease.title}"?`,
                      body: `Hey ${artistProfile.name},

We're big fans of your new single "${songToRelease.title}" over at Genius. We'd love to have you for our 'Verified' series to break down the lyrics and meaning behind the track.

Let us know if you're interested.

Best,
The Genius Team`,
                      date: newDate,
                      isRead: false,
                      senderIcon: "genius",
                      offer: {
                        type: "geniusInterview",
                        songId: songToRelease.id,
                        isAccepted: false,
                        emailId: emailId,
                      },
                    });
                  }
                }
              });

              const releasedSingleIds = new Set(
                singlesReadyToRelease.map((s) => s.songId),
              );
              sub.singlesToRelease = sub.singlesToRelease?.filter(
                (s) => !releasedSingleIds.has(s.songId),
              );
              subModified = true;
            }

            // Check for main project release
            if (
              sub.projectReleaseDate &&
              sub.projectReleaseDate.week === newDate.week &&
              sub.projectReleaseDate.year === newDate.year
            ) {
              const release = sub.release;
              const vinylMerch = (artistData.merch || []).filter(
                (m) =>
                  (m.releaseId === release.id || m.releaseId === sub.id) &&
                  m.type === "Vinyl",
              );
              let vinylDelayed = false;
              let delayedVinylPreorders = 0;
              if (vinylMerch.length > 0 && Math.random() < 0.5) {
                vinylDelayed = true;
                delayedVinylPreorders = vinylMerch.reduce(
                  (sum, vm) => sum + (vm.unitsSold || 0),
                  0,
                );
                if (delayedVinylPreorders === 0 && sub.preorderSales) {
                  delayedVinylPreorders = Math.floor((sub.preorderSales || 0) * 0.7);
                }
                const delayPost = `Vinyl shipments for ${artistProfile?.name || "The artist"}'s new album '${release.title}' have reportedly been delayed by one week due to pressing plant delays.`;
                artistData.xPosts.unshift({
                  id: crypto.randomUUID(),
                  authorId: "popbase",
                  content: delayPost,
                  image: vinylMerch[0]?.image || release.coverArt,
                  likes: Math.floor(Math.random() * 45000) + 15000,
                  retweets: Math.floor(Math.random() * 10000) + 2500,
                  views: Math.floor(Math.random() * 600000) + 200000,
                  date: newDate,
                });
              }

              artistData.releases.push({
                ...release,
                releaseDate: newDate,
                releasingLabel: releasingLabelInfo,
                preorderSales: sub.preorderSales || 0,
                vinylDelayed: vinylDelayed,
                delayedVinylPreorders: delayedVinylPreorders,
                rightsSoldPercent:
                  rightsSoldPercent > 0 ? rightsSoldPercent : undefined,
                rightsOwnerLabelId: rightsOwnerLabelId,
              });

              artistData.merch = artistData.merch.map((m) =>
                m.releaseId === release.id ? { ...m, isPreorder: false } : m,
              );

              artistData.songs = artistData.songs.map((s) => {
                if (release.songIds.includes(s.id)) {
                  return {
                    ...s,
                    isReleased: true,
                    releaseId: release.type === "Compilation" ? s.releaseId : release.id,
                    coverArt:
                      release.type === "Single" ? release.coverArt : s.coverArt,
                    promoBoostWeeks:
                      release.type === "Single"
                        ? (s.promoBoostWeeks || 0) + 4
                        : s.promoBoostWeeks,
                    rightsSoldPercent:
                      rightsSoldPercent > 0 ? rightsSoldPercent : undefined,
                    rightsOwnerLabelId: rightsOwnerLabelId,
                  };
                }
                return s;
              });

              let hypeIncrease = 0;
              switch (release.type) {
                case "Single":
                  hypeIncrease = 15;
                  break;
                case "EP":
                  hypeIncrease = 25;
                  break;
                case "Album":
                  hypeIncrease = 40;
                  break;
              }
              artistData.hype = Math.min(
                getHypeCap(artistData),
                artistData.hype + hypeIncrease,
              );

              if (
                artistData.contract &&
                (release.type === "Album" || release.type === "EP")
              ) {
                artistData.contract.albumsReleased += 1;
              }

              if (!sub.isProjectAnnounced) {
                const pronounPossessive =
                  artistProfile?.pronouns === "he/him"
                    ? "his"
                    : artistProfile?.pronouns === "she/her"
                      ? "her"
                      : "their";
                const popBasePost: XPost = {
                  id: crypto.randomUUID(),
                  authorId: "popbase",
                  content: `${artistProfile?.name} has surprise released ${pronounPossessive} new ${release.type} "${release.title}".`,
                  image: release.coverArt,
                  likes: Math.floor(Math.random() * 80000) + 30000,
                  retweets: Math.floor(Math.random() * 20000) + 5000,
                  views: Math.floor(Math.random() * 1500000) + 500000,
                  date: newDate,
                };
                artistData.xPosts.unshift(popBasePost);

                const tmzPost: XPost = {
                  id: crypto.randomUUID(),
                  authorId: "tmz",
                  content: `${artistProfile.name} just secret-dropped another project. Desperation for streams or a genuine surprise? You be the judge. ðŸ“‰ðŸ¤­`,
                  image:
                    artistData.paparazziPhotos.length > 0
                      ? artistData.paparazziPhotos[
                          Math.floor(
                            Math.random() * artistData.paparazziPhotos.length,
                          )
                        ].url
                      : undefined,
                  likes: Math.floor(Math.random() * 40000) + 10000,
                  retweets: Math.floor(Math.random() * 8000) + 2000,
                  views: Math.floor(Math.random() * 900000) + 300000,
                  date: newDate,
                };
                artistData.xPosts.unshift(tmzPost);
              }

              // Fallon offer for EP/Album
              if (
                artistProfile &&
                (release.type === "EP" || release.type === "Album")
              ) {
                const emailId = crypto.randomUUID();
                const offerTypes: Array<"performance" | "interview" | "both"> =
                  ["performance", "interview", "both"];
                const selectedOfferType =
                  offerTypes[Math.floor(Math.random() * offerTypes.length)];

                let subject = "";
                let body = "";
                switch (selectedOfferType) {
                  case "performance":
                    subject = `Performance on The Tonight Show Starring Jimmy Fallon?`;
                    body = `Hey ${artistProfile.name},

Huge fans of the new ${release.type.toLowerCase()} "${release.title}"! We'd be thrilled to have you on the show to perform a song from it.

Let us know if you're interested.

Best,
The Tonight Show Team`;
                    break;
                  case "interview":
                    subject = `Interview on The Tonight Show Starring Jimmy Fallon?`;
                    body = `Hey ${artistProfile.name},

The new ${release.type.toLowerCase()} "${release.title}" is all anyone's talking about! Jimmy would love to have you on the show for an interview to discuss the project.

Let us know if you're interested.

Best,
The Tonight Show Team`;
                    break;
                  case "both":
                    subject = `Appearance on The Tonight Show Starring Jimmy Fallon?`;
                    body = `Hey ${artistProfile.name},

Congratulations on the new ${release.type.toLowerCase()} "${release.title}"! The whole office has it on repeat. Jimmy would love to have you on the show for an interview AND a performance.

Let us know if you're interested.

Best,
The Tonight Show Team`;
                    break;
                }

                newEmails.push({
                  id: emailId,
                  sender: "The Tonight Show",
                  subject,
                  body,
                  date: newDate,
                  isRead: false,
                  senderIcon: "fallon",
                  offer: {
                    type: "fallonOffer",
                    releaseId: release.id,
                    offerType: selectedOfferType,
                    isAccepted: false,
                    emailId: emailId,
                  },
                });
              }

              submissionsToRemove.push(sub.id);
              subModified = false;
            }

            if (subModified) {
              submissionsToUpdate.push(JSON.parse(JSON.stringify(sub)));
            }
          });

          if (submissionsToUpdate.length > 0) {
            artistData.labelSubmissions = artistData.labelSubmissions.map(
              (sub) =>
                submissionsToUpdate.find((updated) => updated.id === sub.id) ||
                sub,
            );
          }
          if (submissionsToRemove.length > 0) {
            artistData.labelSubmissions = artistData.labelSubmissions.filter(
              (sub) => !submissionsToRemove.includes(sub.id),
            );
          }
        }

        // --- POP BASE INTERVIEW/CLARIFICATION LOGIC ---
        if (Math.random() < 0.3) {
          // 30% chance for a PopBase email
          const emailId = crypto.randomUUID();
          let popBaseEmail: Email;

          const controversialPaparazzi = artistData.paparazziPhotos.find(
            (p) => p.category === "Scandal",
          );
          const recentLowScoreRelease = artistData.releases.find(
            (r) =>
              r.review &&
              r.review.score < 5 &&
              newDate.year * 52 +
                newDate.week -
                (r.releaseDate?.year * 52 + r.releaseDate?.week) <=
                4,
          );

          if (controversialPaparazzi && Math.random() < 0.5) {
            // 50% chance to be about scandal
            // Clarification email
            popBaseEmail = {
              id: emailId,
              sender: "Pop Base",
              senderIcon: "popbase",
              subject: `Clarification needed regarding recent photos`,
              body: `Hi ${artistProfileForEmail?.name},

We're reaching out about some recent photos that have been circulating. We'd like to give you an opportunity to address the situation directly.

Could you clarify what was happening in these photos?

Best,
Pop Base Team`,
              date: newDate,
              isRead: false,
              offer: {
                type: "popBaseClarification",
                emailId: emailId,
                isAnswered: false,
                originalPostContent: "recent photos",
                isControversial: true,
              },
            };
            newEmails.push(popBaseEmail);
            // Remove photo so it's not asked about again
            artistData.paparazziPhotos = artistData.paparazziPhotos.filter(
              (p) => p.id !== controversialPaparazzi.id,
            );
          } else if (recentLowScoreRelease && Math.random() < 0.5) {
            popBaseEmail = {
              id: emailId,
              sender: "Pop Base",
              senderIcon: "popbase",
              subject: `Regarding the reviews for "${recentLowScoreRelease.title}"`,
              body: `Hi ${artistProfileForEmail?.name},

The reviews for your latest project "${recentLowScoreRelease.title}" have been quite divisive. We'd like to get your thoughts on the reception.

How do you feel about the critical response to your new music?

Best,
Pop Base Team`,
              date: newDate,
              isRead: false,
              offer: {
                type: "popBaseClarification",
                emailId: emailId,
                isAnswered: false,
                originalPostContent: `the reviews for ${recentLowScoreRelease.title}`,
                isControversial: true,
              },
            };
            newEmails.push(popBaseEmail);
          } else {
            // General interview question
            const questions = [
              `What was the inspiration behind your latest project?`,
              `Fans are dying to know, are you planning a tour soon?`,
              `What's your songwriting process like?`,
              `Are there any artists you're hoping to collaborate with in the future?`,
              `Your style has evolved so much. What can we expect from your next era?`,
            ];
            const pickRandom = <T,>(arr: T[]): T =>
              arr[Math.floor(Math.random() * arr.length)];
            const question = pickRandom(questions);

            popBaseEmail = {
              id: emailId,
              sender: "Pop Base",
              senderIcon: "popbase",
              subject: `Quick Question for Pop Base`,
              body: `Hi ${artistProfileForEmail?.name},

Hope you're doing well! We have a quick question for a piece we're running:

${question}

Thanks!
Pop Base Team`,
              date: newDate,
              isRead: false,
              offer: {
                type: "popBaseInterview",
                emailId: emailId,
                isAnswered: false,
                question: question,
              },
            };
            newEmails.push(popBaseEmail);
          }
        }

        // --- GRAMMY SUBMISSION OFFER LOGIC ---
        // This logic sends the yearly email inviting the player to submit for the GRAMMYs.
        // It checks if an email for the current year has already been sent to avoid duplicates.
        const hasGrammyEmailThisYear = artistData.inbox.some(
          (e) =>
            e.offer?.type === "grammySubmission" &&
            e.date.year === newDate.year,
        );

        if (
          newDate.week === 40 &&
          artistProfileForEmail &&
          !hasGrammyEmailThisYear
        ) {
          const autoSubmit = !!artistData.manager?.autoSubmitAwards;
          const emailId = crypto.randomUUID();
          newEmails.push({
            id: emailId,
            sender: "Recording Academy",
            senderIcon: "grammys",
            subject: `Submit Your Music for the ${newDate.year + 1} GRAMMY Awards`,
            body: autoSubmit
              ? `Hi ${artistProfileForEmail.name},

The submission window for the ${newDate.year + 1} GRAMMY Awards is now open. Your manager has automatically selected your best work from this year and submitted it for consideration.

- The Recording Academy`
              : `Hi ${artistProfileForEmail.name},

The submission window for the ${newDate.year + 1} GRAMMY Awards is now open. Please submit your eligible releases from this year for consideration.

Submissions close in a few weeks.

- The Recording Academy`,
            date: newDate,
            isRead: autoSubmit,
            offer: {
              type: "grammySubmission",
              emailId: emailId,
              isSubmitted: autoSubmit,
            },
          });

          if (autoSubmit) {
            const thisYearReleases = artistData.releases.filter(
              (r) => r.releaseDate.year === newDate.year,
            );
            const eligibleAlbums = thisYearReleases.filter((r) =>
              ["Album", "EP", "Album (Deluxe)", "Compilation", "Live Album"].includes(r.type),
            );
            const songIds = new Set(thisYearReleases.flatMap((r) => r.songIds));
            const eligibleSongs = artistData.songs.filter((s) =>
              songIds.has(s.id),
            );

            const bestAlbum = [...eligibleAlbums].sort(
              (a, b) => (b.firstWeekStreams || 0) - (a.firstWeekStreams || 0),
            )[0];
            const bestSong = [...eligibleSongs].sort(
              (a, b) => (b.streams || 0) - (a.streams || 0),
            )[0];
            const bestPopSong = [...eligibleSongs]
              .filter((s) => s.genre === "Pop")
              .sort((a, b) => (b.streams || 0) - (a.streams || 0))[0];
            const bestRapSong = [...eligibleSongs]
              .filter((s) => s.genre === "Hip Hop")
              .sort((a, b) => (b.streams || 0) - (a.streams || 0))[0];
            const bestRnbSong = [...eligibleSongs]
              .filter((s) => s.genre === "R&B")
              .sort((a, b) => (b.streams || 0) - (a.streams || 0))[0];

            const bestPopAlbum = [...eligibleAlbums]
              .filter((a) => {
                const releaseSongs = a.songIds
                  .map((id) => artistData.songs.find((s) => s.id === id))
                  .filter((s) => !!s);
                if (releaseSongs.length === 0) return false;
                const genreCounts = releaseSongs.reduce(
                  (acc, song) => {
                    acc[song!.genre] = (acc[song!.genre] || 0) + 1;
                    return acc;
                  },
                  {} as { [genre: string]: number },
                );
                return (
                  Object.keys(genreCounts).reduce((a, b) =>
                    genreCounts[a] > genreCounts[b] ? a : b,
                  ) === "Pop"
                );
              })
              .sort(
                (a, b) => (b.firstWeekStreams || 0) - (a.firstWeekStreams || 0),
              )[0];

            const bestRapAlbum = [...eligibleAlbums]
              .filter((a) => {
                const releaseSongs = a.songIds
                  .map((id) => artistData.songs.find((s) => s.id === id))
                  .filter((s) => !!s);
                if (releaseSongs.length === 0) return false;
                const genreCounts = releaseSongs.reduce(
                  (acc, song) => {
                    acc[song!.genre] = (acc[song!.genre] || 0) + 1;
                    return acc;
                  },
                  {} as { [genre: string]: number },
                );
                return (
                  Object.keys(genreCounts).reduce((a, b) =>
                    genreCounts[a] > genreCounts[b] ? a : b,
                  ) === "Hip Hop"
                );
              })
              .sort(
                (a, b) => (b.firstWeekStreams || 0) - (a.firstWeekStreams || 0),
              )[0];

            const bestRnbAlbum = [...eligibleAlbums]
              .filter((a) => {
                const releaseSongs = a.songIds
                  .map((id) => artistData.songs.find((s) => s.id === id))
                  .filter((s) => !!s);
                if (releaseSongs.length === 0) return false;
                const genreCounts = releaseSongs.reduce(
                  (acc, song) => {
                    acc[song!.genre] = (acc[song!.genre] || 0) + 1;
                    return acc;
                  },
                  {} as { [genre: string]: number },
                );
                return (
                  Object.keys(genreCounts).reduce((a, b) =>
                    genreCounts[a] > genreCounts[b] ? a : b,
                  ) === "R&B"
                );
              })
              .sort(
                (a, b) => (b.firstWeekStreams || 0) - (a.firstWeekStreams || 0),
              )[0];

            const firstReleaseYear = Math.min(
              ...artistData.releases.map((r) => r.releaseDate.year),
              newDate.year,
            );
            const isBnaEligible =
              !artistData.hasSubmittedForBestNewArtist &&
              firstReleaseYear === newDate.year;

            const submissions: GameState["grammySubmissions"] = [];
            if (bestSong) {
              submissions.push({
                artistId: artistId,
                category: "Record of the Year",
                itemId: bestSong.id,
                itemName: bestSong.title,
              });
              submissions.push({
                artistId: artistId,
                category: "Song of the Year",
                itemId: bestSong.id,
                itemName: bestSong.title,
              });
            }
            if (bestAlbum) {
              submissions.push({
                artistId: artistId,
                category: "Album of the Year",
                itemId: bestAlbum.id,
                itemName: bestAlbum.title,
              });
            }
            if (isBnaEligible) {
              submissions.push({
                artistId: artistId,
                category: "Best New Artist",
                itemId: artistId,
                itemName: artistProfileForEmail.name,
              });
            }
            if (bestPopSong)
              submissions.push({
                artistId: artistId,
                category: "Best Pop Song",
                itemId: bestPopSong.id,
                itemName: bestPopSong.title,
              });
            if (bestRapSong)
              submissions.push({
                artistId: artistId,
                category: "Best Rap Song",
                itemId: bestRapSong.id,
                itemName: bestRapSong.title,
              });
            if (bestRnbSong)
              submissions.push({
                artistId: artistId,
                category: "Best R&B Song",
                itemId: bestRnbSong.id,
                itemName: bestRnbSong.title,
              });

            if (bestPopAlbum)
              submissions.push({
                artistId: artistId,
                category: "Pop Album",
                itemId: bestPopAlbum.id,
                itemName: bestPopAlbum.title,
              });
            if (bestRapAlbum)
              submissions.push({
                artistId: artistId,
                category: "Rap Album",
                itemId: bestRapAlbum.id,
                itemName: bestRapAlbum.title,
              });
            if (bestRnbAlbum)
              submissions.push({
                artistId: artistId,
                category: "R&B Album",
                itemId: bestRnbAlbum.id,
                itemName: bestRnbAlbum.title,
              });

            // I will add an autoGrammySubmissions array!
            autoGrammySubmissions.push(...submissions);
            artistData.hasSubmittedForBestNewArtist = isBnaEligible
              ? true
              : artistData.hasSubmittedForBestNewArtist;
          }
        }

        const hasAmaEmailThisYear = artistData.inbox.some(
          (e) =>
            e.offer?.type === "amaSubmission" && e.date.year === newDate.year,
        );

        if (
          newDate.week === 20 &&
          artistProfileForEmail &&
          !hasAmaEmailThisYear
        ) {
          const autoSubmit = !!artistData.manager?.autoSubmitAwards;
          const emailId = crypto.randomUUID();
          newEmails.push({
            id: emailId,
            sender: "American Music Awards",
            senderIcon: "amas",
            subject: `Submit Your Music for the ${newDate.year} American Music Awards`,
            body: autoSubmit
              ? `Hi ${artistProfileForEmail.name},

The submission window for the ${newDate.year} American Music Awards is now open. Your manager has automatically selected your best work from this year and submitted it for consideration.

- AMAs`
              : `Hi ${artistProfileForEmail.name},

The submission window for the ${newDate.year} American Music Awards is now open. Please submit your eligible releases from this year for consideration.

Submissions close in week 23.

- AMAs`,
            date: newDate,
            isRead: autoSubmit,
            offer: {
              type: "amaSubmission",
              emailId: emailId,
              isSubmitted: autoSubmit,
            },
          });

          if (autoSubmit) {
            const thisYearReleases = artistData.releases.filter(
              (r) => r.releaseDate.year === newDate.year,
            );
            const eligibleAlbums = thisYearReleases.filter((r) =>
              ["Album", "EP", "Album (Deluxe)", "Compilation", "Live Album"].includes(r.type),
            );
            const songIds = new Set(thisYearReleases.flatMap((r) => r.songIds));
            const eligibleSongs = artistData.songs.filter((s) =>
              songIds.has(s.id),
            );

            const bestAlbum = [...eligibleAlbums].sort(
              (a, b) => (b.firstWeekStreams || 0) - (a.firstWeekStreams || 0),
            )[0];
            const bestSong = [...eligibleSongs].sort(
              (a, b) => (b.streams || 0) - (a.streams || 0),
            )[0];

            const firstReleaseYear = Math.min(
              ...artistData.releases.map((r) => r.releaseDate.year),
              newDate.year,
            );
            const isNewArtistEligible =
              !artistData.hasSubmittedForAmaNewArtist &&
              firstReleaseYear === newDate.year;

            const submissions: any[] = [];
            submissions.push({
              artistId: artistId,
              category: "Artist of the Year",
              itemId: artistId,
              itemName: artistProfileForEmail.name,
            });

            if (isNewArtistEligible) {
              submissions.push({
                artistId: artistId,
                category: "New Artist of the Year",
                itemId: artistId,
                itemName: artistProfileForEmail.name,
              });
            }
            if (bestAlbum) {
              submissions.push({
                artistId: artistId,
                category: "Album of the Year",
                itemId: bestAlbum.id,
                itemName: bestAlbum.title,
              });
            }
            if (bestSong) {
              submissions.push({
                artistId: artistId,
                category: "Song of the Year",
                itemId: bestSong.id,
                itemName: bestSong.title,
              });
            }

            autoAmaSubmissions.push(...submissions);
            artistData.hasSubmittedForAmaNewArtist = isNewArtistEligible
              ? true
              : artistData.hasSubmittedForAmaNewArtist;
          }
        }

        // --- BRITs Submission Email (Week 10) ---
        const hasBritEmailThisYear = artistData.inbox.some(
          (e) =>
            e.offer?.type === "britSubmission" && e.date.year === newDate.year,
        );

        if (
          newDate.week === 10 &&
          artistProfileForEmail &&
          !hasBritEmailThisYear
        ) {
          const autoSubmit = !!artistData.manager?.autoSubmitAwards;
          const emailId = crypto.randomUUID();
          newEmails.push({
            id: emailId,
            sender: "The BRIT Awards",
            senderIcon: "brits",
            subject: `Submit Your Music for the ${newDate.year} BRIT Awards`,
            body: autoSubmit
              ? `Hi ${artistProfileForEmail.name},

The submission window for the ${newDate.year} BRIT Awards is now officially open. Your management team has automatically submitted your eligible recordings and artist entries for voting academy consideration.

- The BRIT Awards Committee`
              : `Hi ${artistProfileForEmail.name},

The official submission window for the ${newDate.year} BRIT Awards is now open. Submit your eligible releases from this year for consideration by the British Phonographic Industry academy.

Categories include Artist of the Year, British Album of the Year, Song of the Year, BRITs Rising Star, BRITs Best New Artist, Best Pop Act, Best Rap Act, Best R&B Act, and Best Electronic Act.

Nominations will be revealed in Week 13.

- The BRIT Awards Committee`,
            date: newDate,
            isRead: autoSubmit,
            offer: {
              type: "britSubmission",
              emailId: emailId,
              isSubmitted: autoSubmit,
            },
          });

          if (autoSubmit) {
            const thisYearReleases = artistData.releases.filter(
              (r) => r.releaseDate.year === newDate.year,
            );
            const eligibleAlbums = thisYearReleases.filter((r) =>
              ["Album", "EP", "Album (Deluxe)", "Compilation", "Live Album"].includes(r.type),
            );
            const songIds = new Set(thisYearReleases.flatMap((r) => r.songIds));
            const eligibleSongs = artistData.songs.filter((s) =>
              songIds.has(s.id),
            );

            const bestAlbum = [...eligibleAlbums].sort(
              (a, b) => (b.firstWeekStreams || 0) - (a.firstWeekStreams || 0),
            )[0];
            const bestSong = [...eligibleSongs].sort(
              (a, b) => (b.streams || 0) - (a.streams || 0),
            )[0];

            const firstReleaseYear = Math.min(
              ...artistData.releases.map((r) => r.releaseDate.year),
              newDate.year,
            );
            const isNewArtistEligible =
              !artistData.hasSubmittedForBritNewArtist &&
              firstReleaseYear === newDate.year;

            const isRisingStarEligible = !artistData.hasWonBritRisingStar;

            const submissions: any[] = [];
            submissions.push({
              artistId: artistId,
              category: "Artist of the Year",
              itemId: artistId,
              itemName: artistProfileForEmail.name,
            });

            if (isRisingStarEligible) {
              submissions.push({
                artistId: artistId,
                category: "BRITs Rising Star",
                itemId: artistId,
                itemName: artistProfileForEmail.name,
              });
            }

            if (isNewArtistEligible) {
              submissions.push({
                artistId: artistId,
                category: "BRITs Best New Artist",
                itemId: artistId,
                itemName: artistProfileForEmail.name,
              });
            }
            if (bestAlbum) {
              submissions.push({
                artistId: artistId,
                category: "British Album of the Year",
                itemId: bestAlbum.id,
                itemName: bestAlbum.title,
              });
            }
            if (bestSong) {
              submissions.push({
                artistId: artistId,
                category: "Song of the Year",
                itemId: bestSong.id,
                itemName: bestSong.title,
              });
            }

            // Genre Acts
            const popSong = eligibleSongs.find(s => s.genre === 'Pop');
            if (popSong) {
              submissions.push({
                artistId: artistId,
                category: "Best Pop Act",
                itemId: popSong.id,
                itemName: popSong.title,
              });
            }
            const rapSong = eligibleSongs.find(s => s.genre === 'Hip Hop' || s.genre === 'Rap');
            if (rapSong) {
              submissions.push({
                artistId: artistId,
                category: "Best Rap Act",
                itemId: rapSong.id,
                itemName: rapSong.title,
              });
            }
            const rnbSong = eligibleSongs.find(s => s.genre === 'R&B');
            if (rnbSong) {
              submissions.push({
                artistId: artistId,
                category: "Best R&B Act",
                itemId: rnbSong.id,
                itemName: rnbSong.title,
              });
            }
            const elecSong = eligibleSongs.find(s => s.genre === 'Dance/Electronic' || s.genre === 'Electronic' || s.genre === 'Dance');
            if (elecSong) {
              submissions.push({
                artistId: artistId,
                category: "Best Electronic Act",
                itemId: elecSong.id,
                itemName: elecSong.title,
              });
            }

            autoBritSubmissions.push(...submissions);
            artistData.hasSubmittedForBritNewArtist = isNewArtistEligible
              ? true
              : artistData.hasSubmittedForBritNewArtist;
          }
        }

        if (artistData.fanWarStatus) {
          artistData.fanWarStatus.weeksRemaining -= 1;
          if (artistData.fanWarStatus.weeksRemaining <= 0) {
            artistData.fanWarStatus = null;
          }
        }

        // --- CERTIFICATION POSTS ---
        if (artistProfile && artistData.autoCertifications !== false) {
          const newCertificationPosts: XPost[] = [];
          const albumsWithNewCerts = new Set<string>();

          // Song Certifications and Billions Club
          artistData.songs = artistData.songs.map((song) => {
            if (!song.isReleased) return song;

            const currentCert = getSongCertification(song.streams);
            const currentCertString = formatCertification(currentCert);

            if (
              currentCertString &&
              currentCertString !== song.lastCertification
            ) {
              if (song.releaseId) albumsWithNewCerts.add(song.releaseId);
              const country = Math.random() > 0.5 ? "UK" : "US";
              const postContent = `${artistProfile.name}'s "${song.title}" is now certified ${currentCertString} in the ${country}.`;

              newCertificationPosts.push({
                id: crypto.randomUUID(),
                authorId: "chartdata",
                content: postContent,
                image: song.coverArt,
                likes: Math.floor(Math.random() * 20000) + 8000,
                retweets: Math.floor(Math.random() * 5000) + 2000,
                views: Math.floor(Math.random() * 300000) + 100000,
                date: newDate,
              });

              const newCertRecords = [...(song.certifications || [])];
              newCertRecords.push({ level: currentCertString, date: newDate });
              song = {
                ...song,
                lastCertification: currentCertString,
                certifications: newCertRecords,
              };
            }

            if (song.streams >= 1000000000 && !song.hasBillionsClubEmail) {
              const emailId = crypto.randomUUID();
              newEmails.push({
                id: emailId,
                sender: "Spotify",
                senderIcon: "spotify",
                subject: `Welcome to the Billions Club: ${song.title}`,
                body: `Hi ${artistProfile.name},

Congratulations! "${song.title}" has officially surpassed 1 BILLION streams on Spotify.

We would like to invite you to perform at a special Spotify Billions Club concert. Please upload a high-quality image of yourself to be used for the official Billions Club plaque announcement and playlist cover.

- Spotify Team`,
                date: newDate,
                isRead: false,
                offer: {
                  type: "billionsClub",
                  emailId: emailId,
                  songId: song.id,
                  hasUploadedImage: false,
                },
              });
              song = { ...song, hasBillionsClubEmail: true };
            }

            return song;
          });

          // Album Certifications
          artistData.releases = artistData.releases.map((release) => {
            if (release.type === "Single") return release;

            const totalStreams = release.songIds.reduce((sum, songId) => {
              const song = artistData.songs.find((s) => s.id === songId);
              return sum + (song?.streams || 0);
            }, 0);
            const rawSingleSales = release.songIds.reduce((sum, songId) => {
              const song = artistData.songs.find((s) => s.id === songId);
              return sum + (song?.sales || 0);
            }, 0);
            const trackEquivalentAlbumSales = Math.floor(Math.max(0, rawSingleSales) * 0.1);
            const units = Math.floor(totalStreams / 1500) + trackEquivalentAlbumSales + (release.sales || 0);

            const currentCert = getAlbumCertification(units);
            const currentCertString = formatCertification(currentCert);

            if (
              currentCertString &&
              currentCertString !== release.lastCertification
            ) {
              const country = Math.random() > 0.5 ? "UK" : "US";
              const postContent = `${artistProfile.name}'s '${release.title}' is now certified ${currentCertString} in the ${country}.`;

              newCertificationPosts.push({
                id: crypto.randomUUID(),
                authorId: "chartdata",
                content: postContent,
                image: release.coverArt,
                likes: Math.floor(Math.random() * 30000) + 12000,
                retweets: Math.floor(Math.random() * 7000) + 3000,
                views: Math.floor(Math.random() * 450000) + 150000,
                date: newDate,
              });

              const newCertRecords = [...(release.certifications || [])];
              newCertRecords.push({ level: currentCertString, date: newDate });
              return {
                ...release,
                lastCertification: currentCertString,
                certifications: newCertRecords,
              };
            }
            return release;
          });

          if (newCertificationPosts.length > 0) {
            artistData.xPosts.unshift(...newCertificationPosts);

            // Pop Base tweet for new RIAA certifications showing the 8 most recent / top ones
            const certifiedItems: { title: string; cert: string; units: number }[] = [];

            // From songs
            artistData.songs.forEach((song) => {
              if (song.lastCertification) {
                certifiedItems.push({
                  title: song.title,
                  cert: song.lastCertification,
                  units: song.streams || 0,
                });
              }
            });

            // From releases (albums/EPs)
            artistData.releases.forEach((rel) => {
              if (rel.type !== "Single" && rel.lastCertification) {
                certifiedItems.push({
                  title: rel.title,
                  cert: rel.lastCertification,
                  units: (rel.sales || 0) * 1500,
                });
              }
            });

            if (certifiedItems.length > 0) {
              const getCertWeight = (certStr: string) => {
                if (certStr.includes("Diamond")) {
                  const match = certStr.match(/(\d+)x/);
                  return 10000000 * (match ? parseInt(match[1], 10) : 1);
                }
                if (certStr.includes("Platinum")) {
                  const match = certStr.match(/(\d+)x/);
                  return 1000000 * (match ? parseInt(match[1], 10) : 1);
                }
                if (certStr.includes("Gold")) return 500000;
                return 0;
              };

              certifiedItems.sort((a, b) => {
                const weightDiff = getCertWeight(b.cert) - getCertWeight(a.cert);
                if (weightDiff !== 0) return weightDiff;
                return b.units - a.units;
              });

              const top8 = certifiedItems.slice(0, 8);
              const listLines = top8.map((item) => `â€¢ ${item.title} - ${item.cert}`).join("\n");
              const popBaseCertContent = `${artistProfile.name}'s new RIAA certifications:\n\n${listLines}`;

              const popBaseImage = artistProfile.imageUrl || (artistProfile as any).image || artistData.avatar || newCertificationPosts[0]?.image;

              artistData.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: "popbase",
                content: popBaseCertContent,
                image: popBaseImage,
                likes: Math.floor(Math.random() * 55000) + 15000,
                retweets: Math.floor(Math.random() * 9000) + 2000,
                views: Math.floor(Math.random() * 500000) + 150000,
                date: newDate,
              });
            }
          }
          
          if (albumsWithNewCerts.size > 0) {
              albumsWithNewCerts.forEach(releaseId => {
                  const release = artistData.releases.find(r => r.id === releaseId);
                  if (release) {
                      const albumTracks = artistData.songs.filter(s => s.releaseId === releaseId).sort((a, b) => b.streams - a.streams);
                      const rawAlbumStreams = albumTracks.reduce((sum, s) => sum + s.streams, 0);
                      const rawAlbumSales = albumTracks.reduce((sum, s) => sum + (s.sales || 0), 0);
                      const albumEffectiveStreams = Math.max(0, rawAlbumStreams - (release.preReleaseStreams || 0));
                      const trackEquivalentAlbumSales = Math.floor(Math.max(0, rawAlbumSales - (release.preReleaseSales || 0)) * 0.1);
                      const albumEffectiveSales = trackEquivalentAlbumSales + (release.sales || 0);
                      const albumTotalUnits = Math.floor(albumEffectiveStreams / 1500) + albumEffectiveSales;
                      const albumCert = formatCertification(getAlbumCertification(albumTotalUnits));
                      const albumCertFormatted = albumCert ? `${albumCert} (${(albumTotalUnits).toLocaleString()})` : '';
                      
                      let text = `${artistProfile.name}'s "${release.title}" era in the US (eligible): ðŸ‡ºðŸ‡¸

`;
                      if (albumCertFormatted) text += `Album â€” ${albumCertFormatted}

`;
                      
                      albumTracks.forEach(t => {
                          const cert = formatCertification(getSongCertification(t.streams));
                          if (cert) {
                              text += `"${t.title}" â€” ${cert}
`;
                          }
                      });
                      
                      const totalStreamsMillion = Math.floor(albumTracks.reduce((sum, s) => sum + s.streams, 0) / 1000000);
                      text += `
Total â€” ${totalStreamsMillion} Million`;
                      
                      artistData.xPosts.unshift({
                          id: crypto.randomUUID(),
                          authorId: "popbase", // Or a fan account like ririoncharts, but we don't have dynamic handles yet. Let's just use popbase or chartdata
                          content: text,
                          likes: Math.floor(Math.random() * 50000) + 10000,
                          retweets: Math.floor(Math.random() * 10000) + 2000,
                          views: Math.floor(Math.random() * 1000000) + 200000,
                          date: newDate
                      });
                  }
              });
          }
        }

        if (artistProfile && artistData.autoCertifications === false) {
          artistData.songs = artistData.songs.map((song) => {
            if (!song.isReleased) return song;
            if (song.streams >= 1000000000 && !song.hasBillionsClubEmail) {
              const emailId = crypto.randomUUID();
              newEmails.push({
                id: emailId,
                sender: "Spotify",
                senderIcon: "spotify",
                subject: `Welcome to the Billions Club: ${song.title}`,
                body: `Hi ${artistProfile.name},

Congratulations! "${song.title}" has officially surpassed 1 BILLION streams on Spotify.

We would like to invite you to perform at a special Spotify Billions Club concert. Please upload a high-quality image of yourself to be used for the official Billions Club plaque announcement and playlist cover.

- Spotify Team`,
                date: newDate,
                isRead: false,
                offer: {
                  type: "billionsClub",
                  emailId: emailId,
                  songId: song.id,
                  hasUploadedImage: false,
                },
              });
              return { ...song, hasBillionsClubEmail: true };
            }
            return song;
          });
        }

        if (artistProfile) {
          const playerChartSongs = artistData.songs.map((s) => {
            const chartInfo = state.billboardHot100.find(
              (entry) => entry.songId === s.id,
            );
            return {
              ...s,
              chartRank: chartInfo?.rank,
              lastWeekRank: chartInfo?.lastWeek ?? null,
              peak: chartInfo?.peak ?? chartInfo?.rank,
              weeksOnChart: chartInfo?.weeksOnChart ?? 1,
            };
          });

          const {
            newPosts,
            newUsers,
            newTrends,
            newChats,
            newMessages,
            newComments,
            newKalshiChance,
          } = generateWeeklyXContent(
            artistData,
            { ...state, date: newDate },
            artistProfile.name,
            playerChartSongs,
            leakedSongThisWeek,
          );

          if (
            artistId === state.activeArtistId &&
            newKalshiChance !== undefined
          ) {
            state.kalshiAlbumChance = newKalshiChance;
          }

          const existingUsernames = new Set(
            artistData.xUsers.map((u) => u.username),
          );
          const uniqueNewUsers = newUsers.filter(
            (u) => !existingUsernames.has(u.username),
          );

          artistData.xUsers.push(...uniqueNewUsers);

          // Prepare recent images for fan avatar updates
          const validImages = (artistData.artistImages || []).map(img => typeof img === 'string' ? {url: img, year: 0} : img);
          const recentImages = [...validImages].sort((a, b) => (b.year || 0) - (a.year || 0));

          // Grow followers for X users
          const weeklyXPop = artistData.popularity / 100; // 0 to 1
          artistData.xUsers.forEach((u) => {
            let gain = Math.floor(Math.random() * 20) + 5;
            if (u.isPlayer) {
              gain =
                Math.floor(totalWeeklyStreams / 20000) +
                Math.floor(weeklyXPop * 5000);
            } else if (u.id.includes("fan")) {
              gain =
                Math.floor(gain * (1 + weeklyXPop * 50)) +
                Math.floor(totalWeeklyStreams / 500000);
            } else if (u.isVerified) {
              gain = Math.floor(Math.random() * 5000) + 2000;
            }

            u.followersCount = (u.followersCount || 0) + gain;

            // Slowly grow following count for some users
            if (!u.isVerified && !u.isPlayer && Math.random() > 0.5) {
              u.followingCount =
                (u.followingCount || 0) + Math.floor(Math.random() * 3);
            }

            // Randomly update fan avatars to recent images
            if (u.id.includes("fan") || (u.bio && (u.bio.includes("stan") || u.bio.includes("updates")))) {
               // 5% chance each week to update avatar if there are images available
               if (recentImages.length > 0 && Math.random() < 0.05) {
                   // heavily prefer recent years
                   const poolSize = Math.max(1, Math.ceil(recentImages.length * 0.3));
                   const pickedImg = recentImages[Math.floor(Math.random() * poolSize)];
                   if (pickedImg && pickedImg.url) {
                       u.avatar = pickedImg.url;
                   }
               }
            }
          });

          // Grow TikTok followers passively
          const tikTokPopMult = 1 + artistData.popularity / 100;
          const tiktokPassiveGain =
            Math.floor((totalWeeklyStreams / 15000) * tikTokPopMult) +
            Math.floor(Math.random() * 50);
          artistData.tiktokFollowers =
            (artistData.tiktokFollowers || 0) + tiktokPassiveGain;

          // Process active TikTok Promote campaigns
          if (artistData.tiktokPromotes && artistData.tiktokPromotes.length > 0) {
            artistData.tiktokPromotes.forEach(order => {
              if (order.status === 'active') {
                const daysToSimulate = Math.min(7, order.remainingDays);
                const fraction = daysToSimulate / Math.max(1, order.durationDays);

                const addViews = Math.floor(order.targetViews * fraction * 0.75);
                const addLikes = Math.floor(order.targetLikes * fraction * 0.75);
                const addComments = Math.floor(addLikes * 0.08);
                const addFollowers = Math.floor(order.targetFollowers * fraction * 0.75);
                const addProfileViews = Math.floor(order.targetProfileViews * fraction * 0.75);

                order.viewsGained += addViews;
                order.likesGained += addLikes;
                order.commentsGained += addComments;
                order.followersGained += addFollowers;
                order.profileViewsGained += addProfileViews;

                if (addFollowers > 0) {
                  artistData.tiktokFollowers = (artistData.tiktokFollowers || 0) + addFollowers;
                }

                if (order.videoId && artistData.tiktokVideos) {
                  const targetVid = artistData.tiktokVideos.find(v => v.id === order.videoId);
                  if (targetVid) {
                    targetVid.views += addViews;
                    targetVid.likes += addLikes;
                    targetVid.comments += addComments;
                  }
                }

                order.remainingDays -= daysToSimulate;
                if (order.remainingDays <= 0) {
                  order.remainingDays = 0;
                  order.status = 'completed';
                }
              }
            });
          }

          // Grow Instagram followers passively
          const instagramPassiveGain =
            Math.floor((totalWeeklyStreams / 8000) * tikTokPopMult) +
            Math.floor(Math.random() * 90);
          artistData.instagramFollowers =
            (artistData.instagramFollowers || 0) + instagramPassiveGain;

          // Sync group members' Instagram follower gain with group account
          if (
            state.group &&
            (artistId === state.group.id || state.group.members.some((m) => m.id === artistId))
          ) {
            state.group.members.forEach((m) => {
              if (updatedArtistsData[m.id] && m.id !== artistId) {
                updatedArtistsData[m.id].instagramFollowers =
                  (updatedArtistsData[m.id].instagramFollowers || 0) + instagramPassiveGain;
              }
            });
            if (artistId !== state.group.id && updatedArtistsData[state.group.id]) {
              updatedArtistsData[state.group.id].instagramFollowers =
                (updatedArtistsData[state.group.id].instagramFollowers || 0) + instagramPassiveGain;
            }
          }

          // Grow Spotify followers passively (boosted based on user request)
          const spotifyPassiveGain =
            Math.floor((totalWeeklyStreams / 2000) * tikTokPopMult) +
            Math.floor(Math.random() * 500);
          artistData.spotifyFollowers = 
            (artistData.spotifyFollowers || 0) + spotifyPassiveGain;

          artistData.xPosts.unshift(...newPosts);

          if (newComments && newComments.length > 0) {
            for (const { postId, comment } of newComments) {
              const pIndex = artistData.xPosts.findIndex(
                (p) => p.id === postId,
              );
              if (pIndex !== -1) {
                artistData.xPosts[pIndex] = {
                  ...artistData.xPosts[pIndex],
                  comments: [
                    ...(artistData.xPosts[pIndex].comments || []),
                    comment,
                  ],
                };
              }
            }
          }

          // Billions Club buzz
          const billionsClubSongs = artistData.songs.filter(
            (s) => s.hasBillionsClubPerformance,
          );
          if (billionsClubSongs.length > 0) {
            billionsClubSongs.forEach((song) => {
              // ~30% chance each week to get some buzz for about a month (we'll just use a small chance instead of strictly tracking a month, or we can check date diff but random chance is fine and keeps it alive longer)
              // The user requested "for a month", so we can check if it crossed 1B recently, but wait, `hasTweetedBillionStreams` is for when it FIRST crossed.
              // We can just add a 10% chance per week for any song with a billions club performance.
              if (Math.random() < 0.2) {
                const isHater = Math.random() > 0.7;
                const content = isHater
                  ? `spotify billions club is a joke now tbh. how did ${song.title} even get there? payola is real.`
                  : `still thinking about ${artistProfile.name}'s billions club performance for ${song.title} ðŸ˜`;

                const fanAccount = artistData.xUsers.find(
                  (u) =>
                    u.username.toLowerCase().includes("fan") ||
                    u.username.toLowerCase().includes("stan"),
                );
                const authorId = isHater ? "hater" : fanAccount?.id || "fan";

                if (
                  authorId === "hater" &&
                  !artistData.xUsers.some((u) => u.id === "hater")
                ) {
                  artistData.xUsers.push({
                    id: "hater",
                    username: "popmusiccritic",
                    displayName: "Pop Critic",
                    followersCount: 154,
                    followingCount: 300,
                  });
                }

                if (
                  authorId === "fan" &&
                  !artistData.xUsers.some((u) => u.id === "fan")
                ) {
                  artistData.xUsers.push({
                    id: "fan",
                    username: `${artistProfile.name.replace(/\s/g, "").toLowerCase()}fan`,
                    displayName: `${artistProfile.name} Updates`,
                    followersCount: 1540,
                    followingCount: 300,
                  });
                }

                artistData.xPosts.unshift({
                  id: crypto.randomUUID(),
                  authorId: authorId,
                  content: content,
                  likes: Math.floor(Math.random() * 5000) + 1000,
                  retweets: Math.floor(Math.random() * 500) + 100,
                  views: Math.floor(Math.random() * 10000) + 5000,
                  date: newDate,
                });
              }
            });
          }

          artistData.xTrends = newTrends;

          // Handle new chats and messages
          if (newChats.length > 0) {
            artistData.xChats.push(...newChats);
          }
          if (newMessages.length > 0) {
            newMessages.forEach(({ chatId, message }) => {
              const chat = artistData.xChats.find((c) => c.id === chatId);
              if (chat) {
                chat.messages.push(message);
                chat.isRead = false;
              }
            });
          }

          // Cap the number of posts to prevent performance degradation over time
          if (artistData.xPosts.length > 250) {
            artistData.xPosts = artistData.xPosts.slice(0, 250);
          }

          // --- REDDIT LOGIC ---
          if (!artistData.redditPosts) artistData.redditPosts = [];
          const numRedditPosts = Math.floor(Math.random() * 3) + 3; // 3-5 posts
          const newRedditPosts: RedditPost[] = [];

          const recentSongs = [...artistData.songs]
            .filter((s) => s.isReleased)
            .sort(
              (a, b) =>
                (b.releaseDate?.year || 0) * 52 +
                (b.releaseDate?.week || 0) -
                ((a.releaseDate?.year || 0) * 52 + (a.releaseDate?.week || 0)),
            );
          const topSong = [...artistData.songs]
            .filter((s) => s.isReleased)
            .sort(
              (a, b) =>
                (b.streams || 0) +
                (b.sales || 0) * 150 -
                ((a.streams || 0) + (a.sales || 0) * 150),
            )[0];
          const recentVideos = [...artistData.videos]
            .filter((v) => v.artistId === artistId)
            .sort(
              (a, b) =>
                (b.releaseDate?.year || 0) * 52 +
                (b.releaseDate?.week || 0) -
                ((a.releaseDate?.year || 0) * 52 + (a.releaseDate?.week || 0)),
            );

          const redditPostTemplates: {
            title: string;
            content: string;
            image?: string | null;
          }[] = [];

          // Milestone
          if (topSong) {
            const streams = topSong.streams || 0;
            let milestone = 0;
            if (streams >= 1000000000) milestone = 1000000000;
            else if (streams >= 500000000) milestone = 500000000;
            else if (streams >= 100000000) milestone = 100000000;
            else if (streams >= 10000000) milestone = 10000000;
            else if (streams >= 1000000) milestone = 1000000;
            else if (streams >= 100000) milestone = 100000;

            if (milestone > 0 && Math.random() > 0.3) {
              redditPostTemplates.push({
                title: `[Milestone] "${topSong.title}" has officially crossed ${Intl.NumberFormat("en-US", { notation: "compact" }).format(milestone)} streams on Spotify!`,
                content: `I remember when this first dropped, it's so crazy to see the growth. Congrats ${artistProfileForEmail?.name}!`,
                image: topSong.coverArt,
              });
            }
          }

          // Recent Song
          if (recentSongs.length > 0) {
            const song = recentSongs[0];
            const pronounPossessive =
              artistProfileForEmail?.pronouns === "he/him"
                ? "his"
                : artistProfileForEmail?.pronouns === "she/her"
                  ? "her"
                  : "their";
            redditPostTemplates.push({
              title: `Discussion: Thoughts on "${song.title}"?`,
              content: `Now that it's been out for a bit, how are we feeling about "${song.title}"? Honestly I think it's one of ${pronounPossessive} best tracks. The production is so crisp.`,
              image: song.coverArt,
            });
            if (Math.random() > 0.5 && recentSongs.length > 1) {
              redditPostTemplates.push({
                title: `Which one do you prefer: "${recentSongs[0].title}" or "${recentSongs[1].title}"?`,
                content: `Both are absolutely stellar but if you had to pick only one to listen to for the rest of your life... what would you choose?`,
              });
            }
          }

          // Recent Video
          if (recentVideos.length > 0 && Math.random() > 0.4) {
            const vid = recentVideos[0];
            redditPostTemplates.push({
              title: `The music video for "${vid.title}" is so underrated.`,
              content: `I was rewatching the MV today and the visuals are literally insane. Does anyone know who styled this?`,
              image: vid.thumbnail,
            });
          }

          // Generic templates
          const pronounPossessiveEmail =
            artistProfileForEmail?.pronouns === "he/him"
              ? "his"
              : artistProfileForEmail?.pronouns === "she/her"
                ? "her"
                : "their";
          redditPostTemplates.push(
            {
              title: `Unpopular opinion about ${artistProfileForEmail?.name}'s latest era`,
              content: `I might get downvoted for this but honestly I preferred ${pronounPossessiveEmail} earlier sound. Please don't hate me! ðŸ˜­`,
            },
            {
              title: `Manifesting a world tour soon ðŸ•¯ï¸`,
              content: `I've been saving up just in case! Does anyone have any rumors or theories on when dates might drop?`,
            },
            {
              title: `What do you think of the recent styling?`,
              content: `Been seeing some new paparazzi photos and I actually love the fits lately.`,
            },
          );

          for (let i = 0; i < numRedditPosts; i++) {
            const randomTemplate =
              redditPostTemplates[
                Math.floor(Math.random() * redditPostTemplates.length)
              ];

            let img = randomTemplate.image;
            if (
              !img &&
              Math.random() > 0.7 &&
              artistData.artistImages.length > 0
            ) {
              img =
                artistData.artistImages[
                  Math.floor(Math.random() * artistData.artistImages.length)
                ];
            } else if (!img && Math.random() > 0.6) {
              const stanGifs = [
                "https://media3.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Nm1iZjU3NGZxbGxmY3BrdXB3YTcxNGpsdnB2MXpqbW1wYmR5ejhwMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/PhmLpPVdZu69KCLp2m/giphy.gif",
                "https://media1.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Nm1iZjU3NGZxbGxmY3BrdXB3YTcxNGpsdnB2MXpqbW1wYmR5ejhwMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ehcOA2WtivMSBmZaH2/giphy.gif",
                "https://media4.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Nm1iZjU3NGZxbGxmY3BrdXB3YTcxNGpsdnB2MXpqbW1wYmR5ejhwMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/iH8zxeDtg7kftgGkjE/giphy.gif",
                "https://media2.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aDlvaTZzNzZ1cTI0aGg5a2dha282MzlmeDl5dGs0enZncHYycm1pdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/FZUEj5vJn1bMM9Xp6I/giphy.gif",
                "https://media0.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aDlvaTZzNzZ1cTI0aGg5a2dha282MzlmeDl5dGs0enZncHYycm1pdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YNOy0YQR8P45ejaiaE/giphy.gif",
                "https://media3.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aDlvaTZzNzZ1cTI0aGg5a2dha282MzlmeDl5dGs0enZncHYycm1pdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/anmCO7MaRD6QunWAYj/giphy.gif",
                "https://media3.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3MWUydWJhZ294aXB2bW41dHh2czFtOXo5MjRlbGpzYm42ZWRkNXluZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/6lGMLGCYMGWTm/giphy.gif",
                "https://media1.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3MWUydWJhZ294aXB2bW41dHh2czFtOXo5MjRlbGpzYm42ZWRkNXluZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YO4Of2Fl6LBbW/giphy.gif",
                "https://media1.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aTdoOTFndzd6Ym5oYnBmOHdyM3Frb2tpcTNiYnE3OWVxeWMwZDhxYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/FvpGW6mTAkHeSSbczy/giphy.gif",
                "https://media3.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3MmljbnJscm5rZXp2bDQxMHhlOHJsbXRsNGRxbWFjZDY3azVrZmE5ZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/TjGFDxbbZRYjv9vpTZ/giphy.gif",
                "https://media2.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Ymc1bG12Nm40aHdpZ2hpMXlmOWg3MWl4bTh2NmphNGoxZjNyYTlhdCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/cIMm3xWwxCF3xhuGpZ/giphy.gif",
                "https://media0.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3b2h2dGI2bDl2YnBlZWl5eTJvamQzaHFmbzBkZjFsZjV3YW55dm03byZlcD12MV9naWZzX3NlYXJjaCZjdD1n/XJoq16NyVYoqbZHVUe/giphy.gif",
                "https://media1.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bHZ1MmpveGpjNDNsdjZwMjl2Y3NzOTRscDlvZmxlZW43YnplYTBsYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/gKHJbTk10M7bahpUvR/giphy.gif",
                "https://media4.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Nm1iZjU3NGZxbGxmY3BrdXB3YTcxNGpsdnB2MXpqbW1wYmR5ejhwMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/fa1AV8UvZvfBFOIt7F/giphy.gif",
                "https://media3.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Zm96a3l6NTB4aWt3aDVsaGJ0OGg2bmk2ODB3enZxMXZ1dWRxdDVhbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ff5sfZPmr9OPV5dtNi/giphy.gif",
              ];
              img = stanGifs[Math.floor(Math.random() * stanGifs.length)];
            }

            const postUpvotes =
              Math.floor(Math.random() * (artistData.popularity * 10)) + 50;
            const postCommentCount = Math.floor(Math.random() * 500) + 10;

            const realisticComments: RedditComment[] = [];
            const commentPossibilities = [
              `Honestly I just hope they keep this energy going.`,
              `If they release on a Friday they'll easily grab the #1 spot, no contest.`,
              `I WILL DEFEND ${artistProfileForEmail?.name?.toUpperCase()} WITH MY LIFE.`,
              `Wait, is this real?? Omggg`,
              `I really want a tour announcement next!`,
              `Their growth has been insane to watch as a day 1 fan.`,
              `Does anyone have a link to the MV outtakes?`,
              `I disagree but I see your point. We all know they can do better.`,
              `The vocals on the last chorus are heavenly. ðŸ˜­`,
              `The charts don't lie. They're dominating.`,
              `Are we witnessing a new main pop girl/boy era?`,
              `They really need to drop a vinyl for this!!`,
              `This is literally my song of the year.`,
              `I showed this to my friends and they're obsessed now too.`,
              `This deserves everything, so proud.`,
            ];

            const numComments = Math.floor(Math.random() * 5) + 2;
            for (let j = 0; j < numComments; j++) {
              const hasReply = Math.random() > 0.6;
              realisticComments.push({
                id: crypto.randomUUID(),
                author: `u/fan_account_${Math.floor(Math.random() * 1000)}`,
                text: commentPossibilities[
                  Math.floor(Math.random() * commentPossibilities.length)
                ],
                upvotes: Math.floor(postUpvotes * (Math.random() * 0.2 + 0.05)),
                timeAgo: `${Math.floor(Math.random() * 12) + 1}h ago`,
                replies: hasReply
                  ? [
                      {
                        id: crypto.randomUUID(),
                        author: `u/reply_guy_${Math.floor(Math.random() * 1000)}`,
                        text:
                          Math.random() > 0.5
                            ? `Agreed 100%.`
                            : `Wait rlly? I never thought about it like that.`,
                        upvotes: Math.floor(Math.random() * 50),
                        timeAgo: `${Math.floor(Math.random() * 60) + 1}m ago`,
                      },
                    ]
                  : undefined,
              });
            }

            newRedditPosts.unshift({
              id: crypto.randomUUID(),
              author: `pop_fanatic_${Math.floor(Math.random() * 1000)}`,
              timeAgo: `${Math.floor(Math.random() * 24) + 1} hours ago`,
              title: randomTemplate.title,
              content: randomTemplate.content,
              upvotes: postUpvotes,
              commentCount: postCommentCount,
              image: img || null,
              comments: realisticComments,
            });
          }

          artistData.redditPosts = [
            ...newRedditPosts,
            ...artistData.redditPosts,
          ].slice(0, 50); // Keep max 50 posts
        }

        // --- YEAR-END ALBUM CHART TWEET LOGIC ---
        if (newDate.week === 50) {
          // 1. Gather User Albums from this year
          const userAlbums = artistData.releases
            .filter(
              (r) =>
                (r.type === "Album" ||
                  
                  r.type === "EP") &&
                r.releaseDate?.year === newDate.year,
            )
            .map((album) => {
              // Calculate total streams for the album
              const streams = album.songIds.reduce((sum, songId) => {
                const song = artistData.songs.find((s) => s.id === songId);
                return sum + (song?.streams || 0);
              }, 0);
              // Simple formula for units: streams / 1500.
              const units = Math.floor(streams / 1500);
              return {
                title: album.title,
                artist: artistProfile?.name || "Unknown",
                coverArt: album.coverArt,
                units: units,
              };
            });

          // 2. Gather NPC Albums from this year
          const npcAlbumsThisYear = newNpcAlbums
            .filter((a) => {
              // newNpcAlbums are added to the top, so we just filter by generated "age" implicitly or we need releaseDate on NPC albums.
              // Since we don't store releaseDate on NPC albums explicitly in the type yet, we'll approximate by using the current list
              // and assuming ones generated this session belong to "this year".
              // A better way: In generateNpcAlbums, we could tag them, but for now let's use a heuristic based on index or assume all current `newNpcAlbums` are recent.
              return true; // Simplified: Consider all active NPC albums as contenders
            })
            .map((album) => {
              // Simulate units for NPC albums.
              // We don't track release date perfectly for old ones, but let's assume a random "release week" for simulation.
              const randomReleaseWeek = Math.floor(Math.random() * 48) + 1;
              const weeksActive = Math.max(1, 50 - randomReleaseWeek);
              // Units = salesPotential * weeksActive * variance
              const variance = 0.8 + Math.random() * 0.4;
              const units = Math.floor(
                album.salesPotential * weeksActive * variance,
              );

              return {
                title: album.title,
                artist: album.artist,
                coverArt: album.coverArt,
                units: units,
              };
            });

          // 3. Combine and Sort
          const allAlbums = [...userAlbums, ...npcAlbumsThisYear];
          allAlbums.sort((a, b) => b.units - a.units);
          const top8 = allAlbums.slice(0, 8);

          // 4. Create Tweet Payload
          if (top8.length > 0) {
            const chartData = JSON.stringify({
              year: newDate.year,
              items: top8.map((a) => ({
                title: a.title,
                artist: a.artist,
                cover: a.coverArt,
                units: formatNumber(a.units),
              })),
            });

            artistData.xPosts.unshift({
              id: crypto.randomUUID(),
              authorId: "popbase",
              content: `Best Selling Albums of ${newDate.year} ðŸ‡ºðŸ‡¸`,
              image: `chart:${chartData}`, // Special prefix to trigger custom rendering
              likes: Math.floor(Math.random() * 50000) + 20000,
              retweets: Math.floor(Math.random() * 15000) + 5000,
              views: Math.floor(Math.random() * 2000000) + 500000,
              date: newDate,
            });
          }
        }

        artistData.popularity = Math.max(0, Math.min(100, newPopularity));
        let finalIncome = totalIncome;
        if (artistData.chartPredictionsSubscription) {
          finalIncome -= 1000;
        }
        if (
          artistData.redMicPro &&
          typeof artistData.redMicPro === "object" &&
          artistData.redMicPro.tier !== "free"
        ) {
          // Just in case red mic pro requires weekly fee, wait it's yearly. So no.
        }
        artistData.money = Math.floor(artistData.money + finalIncome);
        artistData.hype = newHype;
        artistData.peakHype = Math.max(artistData.peakHype || 0, newHype);
        artistData.lastFourWeeksStreams = updatedLastFourWeeksStreams;
        artistData.lastFourWeeksViews = updatedLastFourWeeksViews;
        artistData.youtubeSubscribers = newYoutubeSubscribers;
        artistData.youtubeStoreUnlocked =
          artistData.youtubeStoreUnlocked ||
          newYoutubeSubscribers >= SUBSCRIBER_THRESHOLD_STORE;
        artistData.streamsThisMonth =
          newDate.week % 4 === 0 ? 0 : newStreamsThisMonth;
        artistData.viewsThisQuarter =
          newDate.week % 13 === 0 ? 0 : newViewsThisQuarter;
        artistData.subsThisQuarter =
          newDate.week % 13 === 0 ? 0 : newSubsThisQuarter;
        artistData.performedGigThisWeek = false;

        if (artistData.filmingGig) {
          artistData.filmingGig.remainingWeeks -= 1;
          if (artistData.filmingGig.remainingWeeks <= 0) {
            const gig = artistData.filmingGig;
            const currentSkill = artistData.actingSkillLevel || 10;
            const rtScore = Math.min(99, Math.max(35, Math.floor(currentSkill * 0.5 + Math.random() * 40 + 20)));
            const metacritic = Math.min(100, Math.max(30, Math.floor(rtScore * 0.9 + Math.random() * 10 - 5)));
            const imdbRating = Math.min(10, Math.max(4, Math.floor(rtScore / 10 * 10) / 10));
            
            const baseBoxOffice = gig.type === 'Movie' ? (Math.floor(artistData.popularity * 3000000) + Math.floor(Math.random() * 100000000) + 20000000) : 0;
            const domBoxOffice = Math.floor(baseBoxOffice * 0.45);
            const wwBoxOffice = baseBoxOffice;

            const newRole: ActingRole = {
              id: gig.id,
              title: gig.title,
              type: gig.type,
              roleName: gig.roleName,
              roleType: gig.roleType,
              year: newDate.year,
              status: "Completed",
              rating: imdbRating,
              studio: (gig as any).studio || 'Warner Bros',
              genre: (gig as any).genre || 'Drama',
              rottenTomatoes: rtScore,
              metacritic: metacritic,
              imdbRating: imdbRating,
              boxOfficeDomestic: domBoxOffice,
              boxOfficeWorldwide: wwBoxOffice,
              soundtrackSongId: (gig as any).soundtrackSongId,
              trailerUrl: undefined,
            };

            artistData.actingRoles = [...(artistData.actingRoles || []), newRole];
            artistData.actingSkillLevel = Math.min(100, currentSkill + 4);
            artistData.filmingGig = null;

            // Soundtrack Compilation Release
            if ((gig as any).soundtrackSongId) {
              const soundtrackSong = artistData.songs.find(s => s.id === (gig as any).soundtrackSongId);
              if (soundtrackSong) {
                const ostTitle = `${gig.title} (Original Motion Picture Soundtrack)`;
                const ostCover = (gig as any).soundtrackCover || soundtrackSong.coverArt || artistProfileForEmail?.image || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800";
                
                const ostRelease = {
                  id: crypto.randomUUID(),
                  title: ostTitle,
                  type: "Album" as const,
                  coverArt: ostCover,
                  songIds: [soundtrackSong.id],
                  releaseDate: newDate,
                  artistId: artistId,
                };

                if (!artistData.releases) artistData.releases = [];
                artistData.releases.unshift(ostRelease);

                artistData.songs = artistData.songs.map(s => s.id === soundtrackSong.id ? {
                  ...s,
                  isReleased: true,
                  releaseId: ostRelease.id,
                  coverArt: ostCover,
                } : s);

                newEmails.push({
                  id: crypto.randomUUID(),
                  sender: "Hollywood Records",
                  subject: `ðŸŽµ SOUNDTRACK COMPILATION RELEASED: ${ostTitle}`,
                  body: `The official motion picture soundtrack for "${gig.title}" featuring your single "${soundtrackSong.title}" is now available worldwide on streaming services!`,
                  date: newDate,
                  isRead: false,
                  senderIcon: "music"
                });
              }
            }

            // Generate PopBase post
            const rtText = rtScore >= 75 ? `Certified Fresh at ${rtScore}% on Rotten Tomatoes ðŸ…` : `${rtScore}% on Rotten Tomatoes ðŸ`;
            const boxOfficeText = gig.type === 'Movie' ? `and grossed $${(wwBoxOffice / 1000000).toFixed(1)}M worldwide at the Box Office!` : 'and received massive streaming viewership!';
            const actName = artistProfileForEmail?.name || artistData.artistName || "The Lead Actor";

            artistData.xPosts = [
              {
                id: crypto.randomUUID(),
                authorId: "popbase",
                content: `"${gig.title}" starring ${actName} is officially out! It debuted with a ${rtText} ${boxOfficeText}`,
                image: artistProfileForEmail?.image,
                likes: Math.floor(Math.random() * 95000) + 35000,
                retweets: Math.floor(Math.random() * 25000) + 8000,
                views: Math.floor(Math.random() * 2500000) + 900000,
                date: newDate,
              },
              ...(artistData.xPosts || [])
            ];

            // TV Show Renewal / Cancellation / Fired system
            if (gig.type === 'TV Show') {
              if (currentSkill < 15) {
                // FIRED / RECAST
                newEmails.push({
                  id: crypto.randomUUID(),
                  sender: (gig as any).studio || 'Network Execs',
                  subject: `FIRED & RECAST: ${gig.title}`,
                  body: `Due to performance concerns on set (Acting Skill: ${currentSkill}/100), the network producers have decided to recast your role for future seasons. Take acting classes to improve your craft.`,
                  date: newDate,
                  isRead: false,
                  senderIcon: "manager"
                });

                artistData.xPosts.unshift({
                  id: crypto.randomUUID(),
                  authorId: "popbase",
                  content: `RUMOR: Industry insiders report ${actName} has been FIRED and recast in "${gig.title}" due to onset acting performance issues. ðŸš¨`,
                  image: artistProfileForEmail?.image,
                  likes: Math.floor(Math.random() * 120000) + 50000,
                  retweets: Math.floor(Math.random() * 35000) + 12000,
                  views: Math.floor(Math.random() * 3500000) + 1000000,
                  date: newDate,
                });
              } else if (rtScore >= 60) {
                // RENEWED!
                const currentPay = gig.pay || 2000000;
                const renewedPay = Math.floor(currentPay * 1.35);
                const nextSeasonTitle = gig.title.includes('Season') 
                  ? gig.title.replace(/Season \d+/, (m) => `Season ${parseInt(m.split(' ')[1]) + 1}`)
                  : `${gig.title}: Season 2`;

                const renewalOffer: ActingOffer = {
                  id: crypto.randomUUID(),
                  title: nextSeasonTitle,
                  type: 'TV Show',
                  roleName: gig.roleName,
                  roleType: gig.roleType,
                  pay: renewedPay,
                  durationWeeks: 8,
                  status: 'Pending',
                  studio: (gig as any).studio || 'HBO',
                  genre: (gig as any).genre || 'Drama'
                };

                artistData.activeActingOffer = renewalOffer;

                newEmails.push({
                  id: crypto.randomUUID(),
                  sender: (gig as any).studio || 'Network Execs',
                  subject: `RENEWED! ${nextSeasonTitle} Season Contract`,
                  body: `ðŸŽ‰ Fantastic news! Thanks to the glowing ${rtScore}% Rotten Tomatoes score, the network has officially renewed "${gig.title}"! We are offering you a renewed contract for ${nextSeasonTitle} at $${renewedPay.toLocaleString()}!`,
                  date: newDate,
                  isRead: false,
                  senderIcon: "manager"
                });

                artistData.xPosts.unshift({
                  id: crypto.randomUUID(),
                  authorId: "popbase",
                  content: `OFFICIAL: Following high ratings (${rtScore}% RT), "${gig.title}" starring ${actName} has been RENEWED for a new season! ðŸ“ºâœ¨`,
                  image: artistProfileForEmail?.image,
                  likes: Math.floor(Math.random() * 85000) + 30000,
                  retweets: Math.floor(Math.random() * 20000) + 6000,
                  views: Math.floor(Math.random() * 2000000) + 700000,
                  date: newDate,
                });
              } else {
                // CANCELLED
                newEmails.push({
                  id: crypto.randomUUID(),
                  sender: (gig as any).studio || 'Network Execs',
                  subject: `CANCELLED: ${gig.title}`,
                  body: `Regrettably, due to mixed reviews (${rtScore}% Rotten Tomatoes) and low viewership, the network has officially cancelled "${gig.title}".`,
                  date: newDate,
                  isRead: false,
                  senderIcon: "manager"
                });

                artistData.xPosts.unshift({
                  id: crypto.randomUUID(),
                  authorId: "popbase",
                  content: `CANCELLED: Network has officially cancelled "${gig.title}" starring ${actName} after 1 season following poor review scores (${rtScore}% RT). âŒ`,
                  image: artistProfileForEmail?.image,
                  likes: Math.floor(Math.random() * 70000) + 20000,
                  retweets: Math.floor(Math.random() * 15000) + 4000,
                  views: Math.floor(Math.random() * 1800000) + 500000,
                  date: newDate,
                });
              }
            }

            newEmails.push({
              id: crypto.randomUUID(),
              sender: "Production Team",
              subject: `Trailer Thumbnail Needed: ${gig.title}`,
              body: `We've finished post-production on "${gig.title}". We need you to select a trailer thumbnail image before the premiere!`,
              date: newDate,
              isRead: false,
              senderIcon: "imdb",
              offer: {
                type: "actingTrailerUpload",
                roleId: gig.id,
                roleTitle: gig.title
              }
            });
            newEmails.push({
              id: crypto.randomUUID(),
              sender: "Production Team",
              subject: `Cover Image Needed: ${gig.title}`,
              body: `We also need a cover image for "${gig.title}" for IMDb and promotional materials.`,
              date: newDate,
              isRead: false,
              senderIcon: "imdb",
              offer: {
                type: "actingCoverUpload",
                roleId: gig.id,
                roleTitle: gig.title
              }
            });
            artistData.popularity = Math.min(100, artistData.popularity + (gig.type === 'Movie' ? 3 : 1));
          }
        }

        artistData.inbox.push(...newEmails);

        const netEarned = artistData.money - startingMoneyForWeek;
        if (netEarned > 0) {
            artistData.yearlyIncome = (artistData.yearlyIncome || 0) + netEarned;
        }

        if (newDate.week === 50) {
            const taxRates = { Canada: 0.18, US: 0.15, UK: 0.21, Asia: 0.07, "Latin America": 0.09 };
            const loc = artistData.location || artistProfileForEmail?.country || "US";
            const rate = taxRates[loc as keyof typeof taxRates] || 0.15;
            const taxable = artistData.yearlyIncome || 0;
            const taxAmount = Math.floor(taxable * rate);
            
            if (taxAmount > 0) {
               artistData.money -= taxAmount;
               artistData.yearlyIncome = 0;
               artistData.inbox.push({
                   id: crypto.randomUUID(),
                   sender: "Government",
                   subject: "Annual Income Tax",
                   body: `Hello ${artistProfileForEmail?.name},

Based on your location in ${loc}, your annual income tax rate is ${rate * 100}%.

Your total taxable income this year was $${formatNumber(taxable)}.

We have deducted $${formatNumber(taxAmount)} from your account.

Regards,
The Government`,
                   date: newDate,
                   isRead: false,
                   senderIcon: "default"
               });
            } else {
               artistData.yearlyIncome = 0;
            }
        }
      }

      // --- ATTRIBUTE FEATURE STREAMS TO FEATURED ARTISTS ---
      const featureStreamsMap: Record<string, number> = {};
      for (const outId in updatedArtistsData) {
        updatedArtistsData[outId].songs.forEach((song) => {
          if (
            song.isReleased &&
            song.collaboration &&
            song.collaboration.artistName
          ) {
            const featArtist = allPlayerArtistsAndGroups.find(
              (a) => a.name === song.collaboration!.artistName,
            );
            if (featArtist && featArtist.id !== outId) {
              featureStreamsMap[featArtist.id] =
                (featureStreamsMap[featArtist.id] || 0) +
                (song.lastWeekStreams || 0);
            }
          }
        });
      }

      for (const featId in featureStreamsMap) {
        const fStreams = featureStreamsMap[featId];
        if (fStreams > 0 && updatedArtistsData[featId]) {
          const featData = updatedArtistsData[featId];
          if (featData.lastFourWeeksStreams.length > 0) {
            featData.lastFourWeeksStreams[0] += fStreams;
          } else {
            featData.lastFourWeeksStreams = [fStreams];
          }

          const totalStreamsLastMonth = featData.lastFourWeeksStreams.reduce(
            (sum, s) => sum + s,
            0,
          );
          const featCalculatedListeners = Math.floor(
            totalStreamsLastMonth * 0.1,
          );
          const featMaxListeners = 148000000 + (featId.charCodeAt(0) % 2000000);
          featData.monthlyListeners = Math.min(
            featCalculatedListeners,
            featMaxListeners,
          );
          featData.peakMonthlyListeners = Math.max(
            featData.monthlyListeners,
            featData.peakMonthlyListeners || 0,
          );
          featData.listeningNow = Math.floor(
            featData.monthlyListeners * (Math.random() * 0.001),
          );
          featData.saves = Math.floor(
            (featData.saves || 0) +
              (fStreams / 1000) * (Math.random() * 0.5 + 0.5),
          );
          featData.followers =
            (featData.followers || 0) + Math.floor(fStreams / 50000);

          if (featData.streamsHistory && featData.streamsHistory.length > 0) {
            featData.streamsHistory[
              featData.streamsHistory.length - 1
            ].streams += fStreams;
          }
          if (newDate.week % 4 !== 0) {
            featData.streamsThisMonth += fStreams;
          }
        }
      }

      // --- FEATURE SONG RELEASE LOGIC ---
      const newNpcsWithReleases = [...newNpcsList];
      for (const artistId in updatedArtistsData) {
        const artistData = updatedArtistsData[artistId];
        const activeArtist = allPlayerArtistsAndGroups.find(
          (a) => a.id === artistId,
        );

        artistData.songs = artistData.songs.map((song) => {
          if (
            song.isFeatureToNpc &&
            !song.isReleased &&
            song.releaseDate &&
            song.releaseDate?.week === newDate.week &&
            song.releaseDate?.year === newDate.year
          ) {
            const newReleaseId = crypto.randomUUID();

            artistData.releases.push({
              id: newReleaseId,
              title: song.title, // "Song Title (feat. Player)"
              type: "Single",
              releaseDate: newDate,
              songIds: [song.id],
              coverArt: song.coverArt,
              artistId,
              isFeatureToNpc: true,
              npcArtistName: song.npcArtistName,
            });

            if (activeArtist) {
              const releaseEmail: Email = {
                id: crypto.randomUUID(),
                sender: "Spotify",
                senderIcon: "spotify",
                subject: `New Release: "${song.title}"`,
                body: `Hi ${activeArtist.name},

Your collaboration with ${song.npcArtistName}, "${song.title}", has been released today!

It is now available on your Spotify profile.

- The Spotify Team`,
                date: newDate,
                isRead: false,
                offer: {
                  type: "featureRelease",
                  songTitle: song.title,
                  npcArtistName: song.npcArtistName || "Another Artist",
                },
              };
              artistData.inbox.push(releaseEmail);
            }
            return { ...song, isReleased: true, releaseId: newReleaseId };
          } else if (
            song.isFeatureToNpc &&
            song.isReleased &&
            song.releaseDate
          ) {
            const weeksSinceRelease =
              newDate.year * 52 +
              newDate.week -
              (song.releaseDate?.year * 52 + song.releaseDate?.week);

            if (weeksSinceRelease === 1) {
              // 75% chance to be offered a music video
              if (Math.random() < 0.75) {
                if (activeArtist) {
                  const offerEmail: Email = {
                    id: crypto.randomUUID(),
                    sender: song.npcArtistName || "Management",
                    senderIcon: "default",
                    subject: `Music Video: ${song.title}`,
                    body: `Hey ${activeArtist.name},

"${song.title}" is doing well! We are planning to shoot an official music video for it. Do you want to be part of the shoot and handle the thumbnail upload?

- ${song.npcArtistName}`,
                    date: newDate,
                    isRead: false,
                    offer: {
                      type: "featureVideoOffer",
                      songId: song.id,
                      npcArtistName: song.npcArtistName || "Another Artist",
                    },
                  };
                  artistData.inbox.push(offerEmail);
                }
              }
            }
          }
          return song;
        });
      }

      // --- CHART CALCULATION ---
      const allPlayerSongsFlat = Object.values(updatedArtistsData).flatMap(
        (d) => d.songs,
      );
      const allPlayerReleases = Object.values(updatedArtistsData).flatMap(
        (d) => d.releases,
      );

      const basePlayerSongs = allPlayerSongsFlat.filter(
        (song) => song.isReleased && !song.remixOfSongId,
      );

      const playerChartContenders = basePlayerSongs.map((baseSong) => {
        const artist = allPlayerArtistsAndGroups.find(
          (a) => a.id === baseSong.artistId,
        );

        let totalWeeklyStreams = baseSong.lastWeekStreams; let totalRegStreams = { ...(baseSong.lastWeekRegionalStreams || { "US": 0, "Canada": 0, "UK": 0, "Latin America": 0, "Asia": 0, "Africa": 0 }) };
        const remixes = allPlayerSongsFlat.filter(
          (s) => s.isReleased && s.remixOfSongId === baseSong.id,
        );
        remixes.forEach((remix) => {
          totalWeeklyStreams += remix.lastWeekStreams; const remixReg = remix.lastWeekRegionalStreams || { "US": 0, "Canada": 0, "UK": 0, "Latin America": 0, "Asia": 0, "Africa": 0 }; totalRegStreams["US"] = (totalRegStreams["US"] || 0) + (remixReg["US"] || 0); totalRegStreams["Canada"] = (totalRegStreams["Canada"] || 0) + (remixReg["Canada"] || 0); totalRegStreams["UK"] = (totalRegStreams["UK"] || 0) + (remixReg["UK"] || 0); totalRegStreams["Latin America"] = (totalRegStreams["Latin America"] || 0) + (remixReg["Latin America"] || 0); totalRegStreams["Asia"] = (totalRegStreams["Asia"] || 0) + (remixReg["Asia"] || 0); totalRegStreams["Africa"] = (totalRegStreams["Africa"] || 0) + (remixReg["Africa"] || 0);
        });

        let displayTitle = baseSong.title;
        let displayArtist = artist?.name || "Unknown";

        const escapeRegExp = (string: string) => {
          return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
        };

        if (baseSong.features && baseSong.features.length > 0) {
          displayArtist = `${displayArtist}, ${baseSong.features.join(", ")}`;
          displayTitle = displayTitle.replace(/ \(feat\. [^)]+\)/g, '');
        } else if (baseSong.collaboration) {
          displayArtist = `${displayArtist}, ${baseSong.collaboration.artistName}`;
          displayTitle = displayTitle.replace(
            new RegExp(
              `\\s*\\(feat\\.\\s*${escapeRegExp(baseSong.collaboration.artistName)}\\)`,
              "i",
            ),
            "",
          );
        } else if (baseSong.isFeatureToNpc && baseSong.npcArtistName) {
          displayArtist = `${baseSong.npcArtistName}, ${artist?.name}`;
          displayTitle = displayTitle.replace(
            new RegExp(
              `\\s*\\(feat\\.\\s*${escapeRegExp(artist?.name || "")}\\)`,
              "i",
            ),
            "",
          );
        }

        return {
          uniqueId: baseSong.id, regionalStreams: totalRegStreams,
          title: displayTitle,
          artist: displayArtist,
          weeklyStreams: totalWeeklyStreams,
          isPlayerSong: true,
          coverArt: baseSong.coverArt,
          songId: baseSong.id,
          genre: baseSong.genre,
          itunesPrice: baseSong.itunesPrice,
        };
      });

      const songTargetStreams: number[] = [];
      for (let i = 0; i < newNpcsWithReleases.length; i++) {
        let act = 0;
        if (i === 0) act = 40000000 + Math.random() * 15000000;       // 40m-55m
        else if (i === 1) act = 34000000 + Math.random() * 8000000;   // 34m-42m
        else if (i === 2) act = 30000000 + Math.random() * 6000000;   // 30m-36m
        else if (i === 3) act = 27000000 + Math.random() * 5000000;   // 27m-32m
        else if (i === 4) act = 25000000 + Math.random() * 3000000;   // 25m-28m
        else if (i === 5) act = 24000000 + Math.random() * 2000000;   // 24m-26m (rank 6)
        else if (i === 6) act = 23000000 + Math.random() * 1000000;   // 23m-24m
        else if (i === 7) act = 22000000 + Math.random() * 1000000;   // 22m-23m
        else if (i === 8) act = 21000000 + Math.random() * 1000000;   // 21m-22m
        else if (i === 9) act = 20000000 + Math.random() * 1000000;   // 20m-21m
        else if (i < 20) act = 16000000 + Math.random() * 3000000;    // 16m-19m
        else if (i < 40) act = 14000000 + Math.random() * 2000000;    // 14m-16m
        else if (i < 60) act = 12500000 + Math.random() * 1500000;    // 12.5m-14m
        else if (i < 80) act = 11000000 + Math.random() * 1500000;    // 11m-12.5m
        else if (i < 100) act = 10000000 + Math.random() * 1000000;   // 10m-11m (rank 100)
        else if (i < 150) act = 8000000 + Math.random() * 2000000;    // 8m-10m
        else if (i < 200) act = 6500000 + Math.random() * 1500000;    // 6.5m-8m
        else act = 3000000 + Math.random() * 3500000;                 // < 6.5m
        songTargetStreams.push(Math.floor(act));
      }
      songTargetStreams.sort((a, b) => b - a);

      const sortedNpcSongs = [...newNpcsWithReleases].sort((a, b) => b.basePopularity - a.basePopularity);
      const npcSongStreamMap = new Map<string, number>();
      sortedNpcSongs.forEach((song, index) => {
          npcSongStreamMap.set(song.uniqueId, songTargetStreams[index]);
      });

      const npcChartContenders = newNpcsWithReleases.map((npc) => {
        const weeklyStreams = npcSongStreamMap.get(npc.uniqueId) || 500000;
        let wUS = 40;
        let wCanada = 10;
        let wUK = 15;
        let wLatin = 15;
        let wAsia = 15;
        let wAfrica = 5;

        const gLower = (npc.genre || "").toLowerCase();
        if (gLower.includes("country")) wUS *= 2.5;
        if (gLower.includes("k-pop") || gLower.includes("kpop") || gLower.includes("j-pop")) wAsia *= 2.5;
        if (gLower.includes("reggae") || gLower.includes("afrobeat")) wAfrica *= 2.5;
        if (gLower.includes("latin") || gLower.includes("reggaeton")) wLatin *= 2.5;
        if (gLower.includes("electronic") || gLower.includes("dance") || gLower.includes("rock") || gLower.includes("indie")) wUK *= 2.0;

        let totalWeight = wUS + wCanada + wUK + wLatin + wAsia + wAfrica;
        if (totalWeight === 0) totalWeight = 1;

        const regStreams = {
            "US": Math.floor(weeklyStreams * (wUS / totalWeight)),
            "Canada": Math.floor(weeklyStreams * (wCanada / totalWeight)),
            "UK": Math.floor(weeklyStreams * (wUK / totalWeight)),
            "Latin America": Math.floor(weeklyStreams * (wLatin / totalWeight)),
            "Asia": Math.floor(weeklyStreams * (wAsia / totalWeight)),
            "Africa": Math.floor(weeklyStreams * (wAfrica / totalWeight)),
        };

        const currentSum = regStreams["US"] + regStreams["Canada"] + regStreams["UK"] + regStreams["Latin America"] + regStreams["Asia"] + regStreams["Africa"];
        if (currentSum < weeklyStreams) {
            regStreams["US"] += (weeklyStreams - currentSum);
        }

        return {
          uniqueId: npc.uniqueId,
          title: npc.title,
          artist: npc.artist,
          weeklyStreams,
          regionalStreams: regStreams,
          isPlayerSong: false,
          coverArt: getArtistImage(npc.artist, npc.coverArt),
          songId: undefined,
          genre: npc.genre,
        };
      });

      const allContendersRaw = [
        ...playerChartContenders,
        ...npcChartContenders,
      ];
      allContendersRaw.sort((a, b) => b.weeklyStreams - a.weeklyStreams);

      const isFormatCompatible = (genre: string, format: string) => {
        const g = (genre || "").toLowerCase();
        const f = (format || "").toLowerCase();
        if (f === "pop") {
          if (g.includes("hip hop") || g.includes("rap")) return 0.2;
          if (g.includes("country")) return 0.05;
          if (g.includes("r&b")) return 0.4;
          if (
            g.includes("k-pop") ||
            g.includes("kpop") ||
            g.includes("electronic") ||
            g.includes("dance")
          )
            return 1.0;
          return 1.0;
        }
        if (f === "urban") {
          if (g.includes("hip hop") || g.includes("r&b") || g.includes("rap"))
            return 1.0;
          return 0.05;
        }
        if (f === "rhythmic") {
          if (
            g.includes("hip hop") ||
            g.includes("r&b") ||
            g.includes("rap") ||
            g.includes("pop") ||
            g.includes("dance") ||
            g.includes("k-pop") ||
            g.includes("kpop") ||
            g.includes("electronic")
          )
            return 1.0;
          return 0.1;
        }
        if (f === "country") {
          if (g.includes("country")) return 1.0;
          return 0.05;
        }
        if (f === "christmas") {
          if (g.includes("holiday") || g.includes("christmas")) return 1.0;
          return 0.01;
        }
        return 1.0; // fallback
      };

      const allContenders = allContendersRaw.map((song, index) => {
        let rPlays = 0;
        let rImpressions = 0;
        let isOnRadio = false;
        let rFormat = "pop";
        let pIsOnUkRadio = false;
        let pUkRadioPlays = 0;
        let pUkRadioFormat = "pop";

        const maxPlaysForRank = Math.max(
          0,
          Math.floor(15000 * Math.pow(0.95, index)),
        );

        if (song.isPlayerSong && song.songId) {
          const artistId = Object.keys(updatedArtistsData).find((id) =>
            updatedArtistsData[id].songs.some((s) => s.id === song.songId),
          );
          if (artistId) {
            const s = updatedArtistsData[artistId].songs.find(
              (x) => x.id === song.songId,
            );
            if (s && (s.isOnRadio || s.isOnUkRadio)) {
              const qualityBoost =
                (s.quality || 50) +
                (updatedArtistsData[artistId].popularity || 0);
              let labelBoost = 1.0;
              const contract = updatedArtistsData[artistId].contract;
              if (contract) {
                if (contract.isCustom) {
                  const customLabel = allCustomLabels.find(
                    (l) => l.id === contract.labelId,
                  );
                  if (customLabel) {
                    // Default custom label boost
                    labelBoost = customLabel.promotionMultiplier;
                    if (customLabel.exclusiveLicenseId) {
                      const exclusiveLabel = LABELS.find(
                        (l) => l.id === customLabel.exclusiveLicenseId,
                      );
                      if (exclusiveLabel) {
                        labelBoost = Math.max(
                          labelBoost,
                          exclusiveLabel.promotionMultiplier,
                        );
                      }
                    }
                  }
                } else {
                  const majorLabel = LABELS.find(
                    (l) => l.id === contract.labelId,
                  );
                  if (majorLabel) {
                    labelBoost = updatedArtistsData[artistId].isBlacklistedByLabel ? 1.0 : majorLabel.promotionMultiplier;
                  } else {
                    // Fallback legacy calculation
                    const labelId = contract.labelId;
                    if (
                      labelId === "umg" ||
                      labelId === "republic" ||
                      labelId === "epic"
                    )
                      labelBoost = 1.5;
                    else if (
                      labelId === "rca" ||
                      labelId === "columbia" ||
                      labelId === "interscope" ||
                      labelId === "roc_nation"
                    )
                      labelBoost = 1.3;
                    else if (
                      labelId === "island" ||
                      labelId === "atlantic" ||
                      labelId === "quality_control"
                    )
                      labelBoost = 1.1;
                  }
                }
              }

              if (s.isOnRadio) {
                isOnRadio = true;
                let activeFormats = (s.radioFormats && s.radioFormats.length > 0)
                  ? s.radioFormats.map(normalizeRadioFormatId)
                  : [normalizeRadioFormatId(s.radioFormat || "chr")];
                activeFormats = Array.from(new Set(activeFormats)).slice(0, 5);

                const formatPlaysMap: Record<string, number> = { ...(s.formatRadioPlays || {}) };
                const formatImprMap: Record<string, number> = { ...(s.formatRadioImpressions || {}) };
                const formatWeeksMap: Record<string, number> = { ...(s.formatWeeksOnRadio || {}) };

                const radioEraBoost =
                  state.date.year < 2010
                    ? state.date.year < 2000
                      ? 5.0
                      : 3.0
                    : 1.0;
                const traitRadioBoost = s.trait === "Radio Hit" ? 2.5 : 1.0;

                const totalPromoSpins = s.pendingRadioPromoSpins || 0;
                s.pendingRadioPromoSpins = 0;
                const promoPerFmt = activeFormats.length > 0 ? Math.floor(totalPromoSpins / activeFormats.length) : 0;

                const survivingFormats: string[] = [];
                const formatWeights = calculateMultiFormatWeights(song.genre || s.genre || "", activeFormats);

                for (const fmt of activeFormats) {
                  const fmtWeeks = (formatWeeksMap[fmt] || 0) + 1;
                  formatWeeksMap[fmt] = fmtWeeks;

                  const formatMultiplier = getFormatCompatibilityMultiplier(song.genre || s.genre || "", fmt);
                  const previousFmtPlays = formatPlaysMap[fmt] || 0;
                  const fmtWeight = formatWeights[fmt] || (1 / activeFormats.length);
                  const maxFmtImpressions = getFormatMaxImpressions(fmt);

                  const baseGrowth = 160 * (qualityBoost / 50) * labelBoost * formatMultiplier * radioEraBoost * traitRadioBoost * (0.6 + 0.8 * fmtWeight);
                  let targetFmtPlays = previousFmtPlays === 0 ? baseGrowth : previousFmtPlays + baseGrowth;

                  if (fmtWeeks > 10) {
                    const decayFactor = (fmtWeeks - 10) * 800 * radioEraBoost;
                    targetFmtPlays -= decayFactor;
                  }

                  targetFmtPlays += ((song.weeklyStreams || 0) * fmtWeight) * 0.00025 * traitRadioBoost;

                  const maxFormatBasePlays = Math.floor(maxFmtImpressions / 3200) * (0.85 + Math.random() * 0.3);
                  const maxNaturalPlays = maxFormatBasePlays * formatMultiplier * radioEraBoost * traitRadioBoost;

                  if (updatedArtistsData[artistId]?.isBlacklistedByLabel) {
                    targetFmtPlays = 0;
                  }
                  if (targetFmtPlays > maxNaturalPlays) targetFmtPlays = maxNaturalPlays;

                  let dropLimit = -500;
                  if (previousFmtPlays > targetFmtPlays * 1.5) {
                    dropLimit = -Math.floor(previousFmtPlays * 0.1);
                  }

                  const promoForFmt = (s.pendingFormatRadioPromoSpins?.[fmt] || 0) + promoPerFmt;

                  let calculatedFmtPlays =
                    previousFmtPlays +
                    Math.max(
                      dropLimit,
                      Math.floor((targetFmtPlays - previousFmtPlays) * 0.2)
                    ) + promoForFmt;

                  if (calculatedFmtPlays < 0) calculatedFmtPlays = 0;

                  // Check removal reasons for this format
                  let fmtRemovedReason: string | null = null;
                  if (fmtWeeks >= 30) {
                    fmtRemovedReason = `it reached the maximum 30-week run`;
                  } else if (
                    fmt === "christmas" &&
                    newDate.week > 2 &&
                    newDate.week < 40
                  ) {
                    fmtRemovedReason = `the holiday season has ended`;
                  } else if (
                    fmtWeeks >= 2 &&
                    calculatedFmtPlays < 50 &&
                    formatMultiplier < 0.5
                  ) {
                    const fmtObj = getRadioFormatById(fmt);
                    fmtRemovedReason = `it was submitted to the wrong format (${fmtObj?.name || fmt.toUpperCase()}) and received very little airplay`;
                  } else if (fmtWeeks >= 6 && calculatedFmtPlays < 100) {
                    fmtRemovedReason = `it failed to gain traction`;
                  }

                  if (updatedArtistsData[artistId]?.isBlacklistedByLabel) {
                    fmtRemovedReason = "your label blacklisted you and pulled the song from all stations";
                  }

                  if (fmtRemovedReason) {
                    calculatedFmtPlays = 0;
                    const fmtObj = getRadioFormatById(fmt);
                    updatedArtistsData[artistId].inbox.push({
                      id: Math.random().toString(36).substr(2, 9),
                      sender: "Radio Department",
                      subject: `Radio Removed: ${song.title} (${fmtObj?.code || fmt.toUpperCase()})`,
                      body: `Your song "${song.title}" has been removed from ${fmtObj?.name || fmt.toUpperCase()} radio because ${fmtRemovedReason}.`,
                      date: newDate,
                      isRead: false,
                    });
                  } else {
                    survivingFormats.push(fmt);
                  }

                  formatPlaysMap[fmt] = calculatedFmtPlays;
                  const rawImpr = calculatedFmtPlays * (Math.floor(Math.random() * 1200) + 2200);
                  formatImprMap[fmt] = Math.min(maxFmtImpressions, rawImpr);
                }

                s.pendingFormatRadioPromoSpins = {};
                s.formatHasRadioPromo = {};
                s.hasRadioPromo = false;

                s.radioFormats = survivingFormats;
                s.radioFormat = survivingFormats[0] || "chr";
                s.formatRadioPlays = formatPlaysMap;
                s.formatRadioImpressions = formatImprMap;
                s.formatWeeksOnRadio = formatWeeksMap;

                if (survivingFormats.length === 0) {
                  isOnRadio = false;
                  s.isOnRadio = false;
                }

                const prevTotalPlays = s.radioPlays || 0;
                const currentTotalPlays = Object.keys(formatPlaysMap).reduce(
                  (sum, k) => (survivingFormats.includes(k) ? sum + (formatPlaysMap[k] || 0) : sum),
                  0
                );
                const currentTotalImpr = Object.keys(formatImprMap).reduce(
                  (sum, k) => (survivingFormats.includes(k) ? sum + (formatImprMap[k] || 0) : sum),
                  0
                );

                s.lastWeekRadioPlays = prevTotalPlays;
                s.radioPlays = currentTotalPlays;
                s.radioImpressions = currentTotalImpr;
                s.weeksOnRadio = Math.max(0, ...survivingFormats.map((f) => formatWeeksMap[f] || 0));

                rPlays = currentTotalPlays;
                rImpressions = currentTotalImpr;
                rFormat = s.radioFormat;
              }
            
            if (s.isOnUkRadio) {
              const rFormat = s.ukRadioFormat || "pop";
              const weeksOn = s.ukWeeksOnRadio || 0;
              s.ukWeeksOnRadio = weeksOn + 1;
              const formatMultiplier = isFormatCompatible(song.genre || "", rFormat);
              const radioEraBoost = state.date.year < 2010 ? (state.date.year < 2000 ? 5.0 : 3.0) : 1.0;
              const previousPlays = s.ukRadioPlays || 0;
              const traitRadioBoost = s.trait === "Radio Hit" ? 2.5 : 1.0;
              const baseGrowth = 160 * (qualityBoost / 50) * labelBoost * formatMultiplier * radioEraBoost * traitRadioBoost;
              let targetPlays = previousPlays === 0 ? baseGrowth : previousPlays + baseGrowth;
              targetPlays += (song.regionalStreams?.["UK"] || 0) * 0.0005 * traitRadioBoost; 
              const maxNaturalPlays = 20000 * formatMultiplier * radioEraBoost * traitRadioBoost;
              if (updatedArtistsData[artistId]?.isBlacklistedByLabel) targetPlays = 0;
              if (targetPlays > maxNaturalPlays) targetPlays = maxNaturalPlays;
              const pendingSpins = s.pendingUkRadioPromoSpins || 0;
              const spinIncrease = Math.min(pendingSpins, Math.floor(Math.random() * 1000) + 300);
              s.pendingUkRadioPromoSpins = pendingSpins - spinIncrease;
              let rPlays = Math.floor(targetPlays) + spinIncrease;
              if (weeksOn > 15 + Math.floor(qualityBoost / 2)) {
                  rPlays = Math.floor(rPlays * 0.85); 
              }
              if (rPlays < 0) rPlays = 0;
              if (rPlays < 50 && weeksOn > 4 && pendingSpins === 0) {
                  s.isOnUkRadio = false;
                  rPlays = 0;
              }
              s.ukRadioPlays = rPlays;
            }
              
              if (s.isOnUkRadio) {
                  pIsOnUkRadio = s.isOnUkRadio;
                  pUkRadioPlays = s.ukRadioPlays || 0;
                  pUkRadioFormat = s.ukRadioFormat || "pop";
              }
            } // Close if (s && (s.isOnRadio || s.isOnUkRadio))
          }
        } else {
          if (song.weeklyStreams > 1000000) {
            isOnRadio = true;
            const g = (song.genre || "").toLowerCase();
            const isHolidaySeason = newDate.week > 40 || newDate.week < 2;

            let possibleFormats: string[] = [];
            if (g.includes("holiday") || g.includes("christmas")) {
              if (isHolidaySeason) possibleFormats = ["christmas", "ac", "classic_hits"];
            } else if (g.includes("country")) {
              possibleFormats = ["country", "hot_ac", "adult_hits"];
            } else if (g.includes("hip hop") || g.includes("rap")) {
              possibleFormats = ["urban", "rhythmic", "chr"];
            } else if (g.includes("r&b")) {
              possibleFormats = ["urban_ac", "urban", "rhythmic", "ac"];
            } else if (g.includes("rock") || g.includes("metal")) {
              possibleFormats = ["alt_rock", "active_rock", "classic_rock", "aaa"];
            } else if (g.includes("indie") || g.includes("folk")) {
              possibleFormats = ["aaa", "alt_rock", "hot_ac", "ac"];
            } else if (g.includes("latin") || g.includes("reggaeton")) {
              possibleFormats = ["latin", "chr", "rhythmic"];
            } else if (g.includes("electronic") || g.includes("dance")) {
              possibleFormats = ["chr", "rhythmic", "alt_rock"];
            } else if (g.includes("k-pop") || g.includes("kpop") || g.includes("afrobeats") || g.includes("afrobeat")) {
              possibleFormats = ["chr", "rhythmic"];
            } else {
              possibleFormats = ["chr", "hot_ac", "ac", "adult_hits"];
            }

            if (possibleFormats.length === 0) possibleFormats = ["chr"];

            const countToPick = Math.min(
              possibleFormats.length,
              song.weeklyStreams > 15000000 ? 3 : song.weeklyStreams > 5000000 ? 2 : 1
            );
            const npcFormats = possibleFormats.slice(0, countToPick);

            const radioEraBoost =
              state.date.year < 2010
                ? state.date.year < 2000
                  ? 5.0
                  : 3.0
                : 1.0;

            let targetPlays = Math.floor(
              song.weeklyStreams * 0.0025 * radioEraBoost,
            );
            if (targetPlays > maxPlaysForRank) targetPlays = maxPlaysForRank;

            const npcWeights = calculateMultiFormatWeights(song.genre || "", npcFormats);
            const npcPlaysMap: Record<string, number> = {};
            const npcImprMap: Record<string, number> = {};
            let totalNpcPlays = 0;
            let totalNpcImpr = 0;

            npcFormats.forEach((fmt) => {
              const share = npcWeights[fmt] || (1 / npcFormats.length);
              const maxFmtImpressions = getFormatMaxImpressions(fmt);
              const fmtPlays = Math.floor(targetPlays * share);
              const rawImpr = fmtPlays * (Math.floor(Math.random() * 1200) + 2200);
              const fmtImpr = Math.min(maxFmtImpressions, rawImpr);

              npcPlaysMap[fmt] = fmtPlays;
              npcImprMap[fmt] = fmtImpr;
              totalNpcPlays += fmtPlays;
              totalNpcImpr += fmtImpr;
            });

            rPlays = totalNpcPlays;
            rImpressions = totalNpcImpr;
            rFormat = npcFormats[0] || "chr";

            (song as any).radioFormats = npcFormats;
            (song as any).formatRadioPlays = npcPlaysMap;
            (song as any).formatRadioImpressions = npcImprMap;
          }
        }

        let isOnUkRadio = false;
        let ukRadioPlays = 0;
        let ukRadioFormat = undefined;

        if (song.isPlayerSong) {
            // Already handled internally
        } else {
            if (isOnRadio) {
                isOnUkRadio = true;
                ukRadioPlays = Math.floor(rPlays * 0.15);
                ukRadioFormat = rFormat;
            }
        }

        const songAny = song as any;
        const matchingPlayerSong = song.isPlayerSong && song.songId && Object.values(updatedArtistsData).flatMap(a => a.songs).find(s => s.id === song.songId);

        return {
          ...song,
          isOnRadio,
          radioPlays: rPlays,
          radioImpressions: rImpressions,
          radioFormat: rFormat,
          radioFormats: matchingPlayerSong ? matchingPlayerSong.radioFormats : songAny.radioFormats || (isOnRadio ? [rFormat] : []),
          formatRadioPlays: matchingPlayerSong ? matchingPlayerSong.formatRadioPlays : songAny.formatRadioPlays || (isOnRadio ? { [rFormat]: rPlays } : {}),
          formatRadioImpressions: matchingPlayerSong ? matchingPlayerSong.formatRadioImpressions : songAny.formatRadioImpressions || (isOnRadio ? { [rFormat]: rImpressions } : {}),
          ...( !song.isPlayerSong ? { isOnUkRadio, ukRadioPlays, ukRadioFormat } : { isOnUkRadio: pIsOnUkRadio, ukRadioPlays: pUkRadioPlays, ukRadioFormat: pUkRadioFormat } ),
        };
      });

      const newChartHistory: ChartHistory = { ...state.chartHistory };

      const hot100Contenders = allContenders.map((song) => {
        const hash = song.uniqueId
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const divisor = 750 + (hash % 250);

        let boost = 1;
        let additionalItunesSales = 0;
        let foundArtistId: string | null = null;
        if (song.isPlayerSong && song.songId) {
          for (const aId in updatedArtistsData) {
            const aData = updatedArtistsData[aId];
            const s = aData.songs.find((x) => x.id === song.songId);
            if (s) {
              foundArtistId = aId;
              const pushWeek = aData.lastPushToItunesWeek;
              const currentWeek = newDate.year * 52 + newDate.week;
              if (
                aData.coachella &&
                aData.coachella.setlist &&
                aData.coachella.setlist.includes(s.id) &&
                aData.coachella.year === newDate.year &&
                (newDate.week === 15 || newDate.week === 16)
              ) {
                boost *= 1.10;
              }
              if (
                aData.lastPushedSongId === song.songId &&
                pushWeek &&
                currentWeek - pushWeek <= 1
              ) {
                boost = 5 + Math.random() * 5;
              }
              if (s.itunesPrice === "$0.69") {
                boost *= 2.5;
              } else if (s.itunesPrice === "$0.99") {
                boost *= 1.5;
              } else if (s.itunesPrice === "$1.29") {
                boost *= 0.9;
              }
              if (s.itunesVersions) {
                s.itunesVersions.forEach((iv) => {
                  const verBoost = boost * (Math.random() * 0.5 + 0.8);
                  let vSales = Math.floor(
                    (song.weeklyStreams / divisor) * verBoost * 0.8,
                  );
                  if (vSales === 0 && song.weeklyStreams > 1000)
                    vSales = Math.floor(Math.random() * 50) + 10;
                  iv.weeklySales = vSales;
                  iv.sales = (iv.sales || 0) + vSales;
                  additionalItunesSales += vSales;
                });
              }
              break;
            }
          }
        }
        let additionalPhysicalSales = 0;
        if (foundArtistId) {
          const ad = state.artistsData[foundArtistId];
          if (ad) {
            const songMerch = ad.merch.filter((m) => {
              if (m.releaseId) {
                const release = ad.releases.find((r) => r.id === m.releaseId);
                return (
                  release?.type === "Single" &&
                  release.songIds.includes(song.songId!)
                );
              }
              return false;
            });
            additionalPhysicalSales = songMerch.reduce(
              (sum, item) => sum + (item._actualWeeklySales || 0),
              0,
            );
          }
        }
        const sales =
          Math.floor(song.weeklyStreams / divisor) * boost +
          additionalItunesSales;

        const eraConfigTemp = getEraConfiguration(state.date.year);

        const songReleaseYear = song.releaseDate?.year || 2000;
        const hasStreamingRights = song.isAvailableOnStreaming === true;
        const effectiveStreamingShare = hasStreamingRights
          ? eraConfigTemp.marketShare.streaming
          : 0;

        // Billboard Hot 100 did NOT count streams until 2016
        const streamPoints =
          state.date.year >= 2016
            ? song.weeklyStreams * effectiveStreamingShare * 0.5
            : 0;
        const digitalPoints =
          sales * eraConfigTemp.marketShare.digital * 150 * 0.2;
        const physicalPoints =
          (sales * eraConfigTemp.marketShare.physical +
            additionalPhysicalSales) *
          150 *
          0.2;
        const radioPoints =
          (song.radioImpressions || 0) * eraConfigTemp.marketShare.radio * 0.25;

        const points =
          streamPoints + digitalPoints + physicalPoints + radioPoints;

        return {
          ...song,
          hot100Points: points,
          digitalSales: sales + additionalPhysicalSales,
          radioPlays: song.radioPlays,
          radioImpressions: song.radioImpressions,
        };
      });
      hot100Contenders.sort((a, b) => b.hot100Points - a.hot100Points);

      const eligibleBillboardContenders = hot100Contenders.filter(
        (song, index) => {
          const potentialRank = index + 1;
          const history = state.chartHistory[song.uniqueId];
          if (history && history.weeksOnChart >= 52 && potentialRank > 25)
            return false;
          if (history && history.weeksOnChart >= 20 && potentialRank > 50)
            return false;
          return true;
        },
      );

      const top100 = eligibleBillboardContenders.slice(0, 100);
      const newBillboardHot100: ChartEntry[] = [];
      const prevBillboardMap = new Map(
        state.billboardHot100.map((entry) => [entry.uniqueId, entry]),
      );

      top100.forEach((song, index) => {
        const rank = index + 1;
        const history = newChartHistory[song.uniqueId];
        const prevChartEntry = prevBillboardMap.get(song.uniqueId);

        if (history) {
          history.weeksOnChart += 1;
          history.lastRank = rank;
          if (rank < history.peak) history.peak = rank;
          if (rank === 1) {
            history.weeksAtNo1 = (history.weeksAtNo1 || 0) + 1;
          }
          if (history.chartRun) {
            history.chartRun.push(rank);
          } else {
            history.chartRun = [rank];
          }
          if (!history.firstEntered) {
            history.firstEntered = { year: newDate.year, week: newDate.week };
          }
        } else {
          newChartHistory[song.uniqueId] = {
            weeksOnChart: 1,
            peak: rank,
            lastRank: rank,
            weeksAtNo1: rank === 1 ? 1 : 0,
            chartRun: [rank],
            firstEntered: { year: newDate.year, week: newDate.week },
          };
        }

        newBillboardHot100.push({
          rank: rank,
          lastWeek: prevChartEntry?.rank ?? null,
          peak: newChartHistory[song.uniqueId].peak,
          weeksOnChart: newChartHistory[song.uniqueId].weeksOnChart,
          title: song.title,
          artist: song.artist,
          coverArt: song.coverArt,
          isPlayerSong: song.isPlayerSong,
          songId: song.songId,
          uniqueId: song.uniqueId,
          weeklyStreams: song.weeklyStreams,
          digitalSales: song.digitalSales,
          radioPlays: song.radioPlays,
          radioImpressions: song.radioImpressions,
        });
      });

      const artistsWithFirstChartEntry = new Set<string>();

      const newBubblingUnderHistory = { ...(state.bubblingUnderHistory || {}) };
      const newBillboardBubblingUnder25: ChartEntry[] = [];
      const prevBubblingMap = new Map(
        (state.billboardBubblingUnder25 || []).map((entry) => [
          entry.uniqueId,
          entry,
        ]),
      );

      let bubblingCount = 0;
      for (
        let i = 100;
        i < eligibleBillboardContenders.length && bubblingCount < 25;
        i++
      ) {
        const song = eligibleBillboardContenders[i];
        if (newChartHistory[song.uniqueId]) continue; // Has chart history from Hot 100 before

        const weeksBubbling = (newBubblingUnderHistory[song.uniqueId] || 0) + 1;
        if (weeksBubbling > 10) continue; // max stay 10 weeks

        newBubblingUnderHistory[song.uniqueId] = weeksBubbling;
        const prevEntry = prevBubblingMap.get(song.uniqueId);
        const rank = bubblingCount + 1;

        newBillboardBubblingUnder25.push({
          rank: rank,
          lastWeek: prevEntry?.rank ?? null,
          peak: rank, // peak isn't really tracked, we'll just put current rank
          weeksOnChart: weeksBubbling,
          title: song.title,
          artist: song.artist,
          coverArt: song.coverArt,
          isPlayerSong: song.isPlayerSong,
          songId: song.songId,
          uniqueId: song.uniqueId,
          weeklyStreams: song.weeklyStreams,
          digitalSales: song.digitalSales,
          radioPlays: song.radioPlays,
          radioImpressions: song.radioImpressions,
        });
        bubblingCount++;
      }

      for (const entry of newBillboardHot100) {
        if (entry.isPlayerSong && entry.songId) {
          const song = allPlayerSongsFlat.find((s) => s.id === entry.songId);
          if (
            song &&
            playerArtistIds.has(song.artistId) &&
            !artistsWithFirstChartEntry.has(song.artistId)
          ) {
            const artistData = updatedArtistsData[song.artistId];
            if (artistData && !artistData.firstChartEntry) {
              if (entry.weeksOnChart === 1) {
                artistData.firstChartEntry = {
                  songTitle: entry.title,
                  rank: entry.rank,
                  date: newDate,
                };
                artistsWithFirstChartEntry.add(song.artistId);
              }
            }
          }
        }
      }

      const spotifyLocalTop = allContenders.slice(0, 100);
      let newEntriesCount = 0;
      const eraConfigTmpSp = getEraConfiguration(state.date.year);
      const streamMultiplier = Math.max(
        0,
        eraConfigTmpSp.marketShare.streaming,
      );

      const generateSpotifyChart = (region: "Global" | "US" | "Canada" | "UK" | "Latin America" | "Asia" | "Africa", prevChart: ChartEntry[]) => {
          const sorted = [...allContenders].sort((a, b) => {
              const aStreams = region === "Global" ? a.weeklyStreams : (a.regionalStreams?.[region] || 0);
              const bStreams = region === "Global" ? b.weeklyStreams : (b.regionalStreams?.[region] || 0);
              return bStreams - aStreams;
          }).slice(0, 100);

          const pMap = new Map((prevChart || []).map((entry) => [entry.uniqueId, entry.rank]));
          const chart: ChartEntry[] = [];
          
          sorted.forEach((song, index) => {
            const rank = index + 1;
            const lastWeekRank = pMap.get(song.uniqueId) ?? null;
            if (region === "Global" && lastWeekRank === null) newEntriesCount++;
            
            const rawStreams = region === "Global" ? song.weeklyStreams : (song.regionalStreams?.[region] || 0);
            const actualStreams = Math.floor(rawStreams * streamMultiplier);
            
            chart.push({
              rank: rank,
              lastWeek: lastWeekRank,
              peak: newChartHistory[song.uniqueId]?.peak ?? rank,
              weeksOnChart: newChartHistory[song.uniqueId]?.weeksOnChart ?? 1,
              title: song.title,
              artist: song.artist,
              coverArt: song.coverArt,
              isPlayerSong: song.isPlayerSong,
              songId: song.songId,
              uniqueId: song.uniqueId,
              weeklyStreams: actualStreams,
              regionalStreams: song.regionalStreams,
            });
          });
          return chart;
      };

      const newSpotifyGlobal = generateSpotifyChart("Global", state.spotifyGlobal);
      const newSpotifyUS = generateSpotifyChart("US", (state as any).spotifyUS || []);
      const newSpotifyCanada = generateSpotifyChart("Canada", (state as any).spotifyCanada || []);
      const newSpotifyUK = generateSpotifyChart("UK", (state as any).spotifyUK || []);
      const newSpotifyLatin = generateSpotifyChart("Latin America", (state as any).spotifyLatin || []);
      const newSpotifyAsia = generateSpotifyChart("Asia", (state as any).spotifyAsia || []);
      const newSpotifyAfrica = generateSpotifyChart("Africa", (state as any).spotifyAfrica || []);

      // --- SPOTIFY GLOBAL MUSIC VIDEOS ---
      let newSpotifyGlobalMusicVideos = [];
      let newVideoChartHistory = { ...state.videoChartHistory };
      
      const allVideoContenders = [];
      
      // Add Player Videos
      Object.entries(updatedArtistsData).forEach(([artistId, aData]) => {
        if (!aData || !aData.videos) return;
        const playerArtist = allPlayerArtistsAndGroups.find(a => a.id === artistId);
        const artistName = playerArtist ? playerArtist.name : "Unknown Artist";
        
        const playerMusicVideos = aData.videos.filter(v => v.isOnSpotify && v.type === 'Music Video');
        playerMusicVideos.forEach(v => {
          const song = aData.songs.find(s => s.id === v.songId);
          const weeklyViews = v.spotifyDailyViews?.length ? v.spotifyDailyViews[v.spotifyDailyViews.length - 1] * 7 : 0;
          if (weeklyViews > 0) {
            allVideoContenders.push({
              title: song ? song.title : v.title.replace(' (Music Video)', ''),
              artist: artistName,
              thumbnail: v.thumbnail,
              isPlayerVideo: true,
              videoId: v.id,
              uniqueId: v.id,
              weeklyViews: weeklyViews
            });
          }
        });
      });
      
      // Add NPC Videos (simulate from Top 100 Global songs)
      const topGlobalSongs = [...allContenders].sort((a, b) => b.weeklyStreams - a.weeklyStreams).slice(0, 100);
      topGlobalSongs.forEach((song, index) => {
        if (!song.isPlayerSong) {
          // Fake some music video views based on their streams
          // Top #1 should be ~ 5M views. If #1 stream is ~ 40M, 40M * 0.125 = 5M
          // Let's use a non-linear scaling so #30 is ~300k
          
          let baseMultiplier = 0.125 * (Math.pow(0.92, index));
          const fakeViews = Math.floor(song.weeklyStreams * baseMultiplier);
          
          if (fakeViews > 5000) {
            allVideoContenders.push({
              title: song.title,
              artist: song.artist,
              thumbnail: song.coverArt, // reuse cover art as thumbnail
              isPlayerVideo: false,
              uniqueId: 'vid_' + song.uniqueId,
              weeklyViews: fakeViews
            });
          }
        }
      });
      
      allVideoContenders.sort((a, b) => b.weeklyViews - a.weeklyViews);
      const top50Videos = allVideoContenders.slice(0, 50);
      
      const prevVideoChartMap = new Map((state.spotifyGlobalMusicVideos || []).map(entry => [entry.uniqueId, entry.rank]));
      
      top50Videos.forEach((vid, index) => {
        const rank = index + 1;
        const lastWeekRank = prevVideoChartMap.get(vid.uniqueId) ?? null;
        
        const peak = newVideoChartHistory[vid.uniqueId]?.peak ?? rank;
        const weeksOnChart = newVideoChartHistory[vid.uniqueId]?.weeksOnChart ?? 1;
        
        newSpotifyGlobalMusicVideos.push({
          rank,
          lastWeek: lastWeekRank,
          peak: Math.min(peak, rank),
          weeksOnChart: lastWeekRank === null ? 1 : weeksOnChart + 1,
          title: vid.title,
          artist: vid.artist,
          thumbnail: vid.thumbnail,
          isPlayerVideo: vid.isPlayerVideo,
          videoId: vid.videoId,
          uniqueId: vid.uniqueId,
          weeklyViews: vid.weeklyViews,
        });
        
        newVideoChartHistory[vid.uniqueId] = {
          peak: Math.min(peak, rank),
          weeksOnChart: lastWeekRank === null ? 1 : weeksOnChart + 1,
          chartRun: [...(newVideoChartHistory[vid.uniqueId]?.chartRun || []), rank],
        };
      });


      // --- UK OFFICIAL SINGLES CHART ---
      let newUkSinglesChart: ChartEntry[] = state.ukSinglesChart || [];
      let newUkSinglesChartHistory: ChartHistory = state.ukSinglesChartHistory || {};
      
        const sortedUkContenders = [...allContenders].map(song => {
            const aUkStreams = song.regionalStreams?.["UK"] || 0;
            const aUkRadio = song.ukRadioPlays || 0;
            const points = (aUkStreams * 0.5) + (aUkRadio * 2000 * 0.5);
            return { ...song, _ukPoints: points };
        }).sort((a, b) => b._ukPoints - a._ukPoints);
        
        const eligibleUkContenders = sortedUkContenders.filter((song, index) => {
            const potentialRank = index + 1;
            const history = newUkSinglesChartHistory[song.uniqueId];
            if (history && history.weeksOnChart >= 52 && potentialRank > 25) return false;
            if (history && history.weeksOnChart >= 20 && potentialRank > 50) return false;
            return true;
        });

        const top50 = eligibleUkContenders.slice(0, 50);
        newUkSinglesChart = [];
        const prevUkMap = new Map((state.ukSinglesChart || []).map(entry => [entry.uniqueId, entry]));
        newUkSinglesChartHistory = { ...state.ukSinglesChartHistory };

        top50.forEach((song, index) => {
            const rank = index + 1;
            const history = newUkSinglesChartHistory[song.uniqueId];
            const prevChartEntry = prevUkMap.get(song.uniqueId);

            if (history) {
              history.weeksOnChart += 1;
              history.lastRank = rank;
              if (rank < history.peak) history.peak = rank;
              if (rank === 1) history.weeksAtNo1 = (history.weeksAtNo1 || 0) + 1;
              if (history.chartRun) history.chartRun.push(rank);
              else history.chartRun = [rank];
            } else {
              newUkSinglesChartHistory[song.uniqueId] = {
                weeksOnChart: 1,
                peak: rank,
                lastRank: rank,
                weeksAtNo1: rank === 1 ? 1 : 0,
                chartRun: [rank],
                firstEntered: { year: newDate.year, week: newDate.week },
              };
            }

            newUkSinglesChart.push({
              rank: rank,
              lastWeek: prevChartEntry?.rank ?? null,
              peak: newUkSinglesChartHistory[song.uniqueId].peak,
              weeksOnChart: newUkSinglesChartHistory[song.uniqueId].weeksOnChart,
              title: song.title,
              artist: song.artist,
              coverArt: song.coverArt,
              isPlayerSong: song.isPlayerSong,
              songId: song.songId,
              uniqueId: song.uniqueId,
              weeklyStreams: song.regionalStreams?.["UK"] || 0,
              radioPlays: song.ukRadioPlays || 0,
            });
        });

      // --- GENRE CHART CALCULATION ---
      const { newChart: newHotPopSongs, newHistory: newHotPopSongsHistory } =
        calculateGenreChart(
          allContenders,
          ["Pop"],
          state.hotPopSongs,
          state.hotPopSongsHistory,
          newDate,
        );
      const { newChart: newHotRapRnb, newHistory: newHotRapRnbHistory } =
        calculateGenreChart(
          allContenders,
          ["Hip Hop", "R&B"],
          state.hotRapRnb,
          state.hotRapRnbHistory,
          newDate,
        );
      const {
        newChart: newElectronicChart,
        newHistory: newElectronicChartHistory,
      } = calculateGenreChart(
        allContenders,
        ["Electronic"],
        state.electronicChart,
        state.electronicChartHistory,
        newDate,
      );
      const { newChart: newCountryChart, newHistory: newCountryChartHistory } =
        calculateGenreChart(
          allContenders,
          ["Country"],
          state.countryChart,
          state.countryChartHistory,
          newDate,
        );

      // --- RADIO CHART CALCULATION ---
      const radioEligible = allContenders.filter(
        (c) => (c.radioPlays || 0) > 0,
      );
      radioEligible.sort((a, b) => (b.radioPlays || 0) - (a.radioPlays || 0));

      const radioOverallChart = radioEligible.slice(0, 50).map((c, i) => ({
        ...c,
        rank: i + 1,
        lastWeek:
          state.radioOverallChart?.find((x) => x.uniqueId === c.uniqueId)
            ?.rank || null,
      }));

      const radioFormatCharts: Record<string, ChartEntry[]> = {};
      RADIO_FORMATS.forEach((rf) => {
        const formatCandidates = radioEligible
          .filter((c) => {
            const fmts = (c.radioFormats && c.radioFormats.length > 0)
              ? c.radioFormats.map(normalizeRadioFormatId)
              : [normalizeRadioFormatId(c.radioFormat || "")];
            return fmts.includes(rf.id);
          })
          .map((c) => {
            const fPlays = c.formatRadioPlays?.[rf.id] || (normalizeRadioFormatId(c.radioFormat || "") === rf.id ? c.radioPlays : 0) || 0;
            const fImpr = c.formatRadioImpressions?.[rf.id] || (fPlays * (Math.floor(Math.random() * 1200) + 2000));
            return {
              ...c,
              radioPlays: fPlays,
              radioImpressions: fImpr,
              radioFormat: rf.id,
            };
          })
          .filter((c) => (c.radioPlays || 0) > 0);

        formatCandidates.sort((a, b) => (b.radioPlays || 0) - (a.radioPlays || 0));

        const prevChart = state.radioFormatCharts?.[rf.id] ||
          (rf.id === 'chr' ? state.radioPopChart :
           rf.id === 'urban' ? state.radioUrbanChart :
           rf.id === 'rhythmic' ? state.radioRhythmicChart :
           rf.id === 'country' ? state.radioCountryChart :
           rf.id === 'christmas' ? state.radioChristmasChart : undefined) || [];

        radioFormatCharts[rf.id] = formatCandidates.slice(0, 40).map((c, i) => ({
          ...c,
          rank: i + 1,
          lastWeek: prevChart.find((x) => x.uniqueId === c.uniqueId)?.rank || null,
        }));
      });

      const radioChrChart = radioFormatCharts["chr"] || [];
      const radioPopChart = radioChrChart;
      const radioAcChart = radioFormatCharts["ac"] || [];
      const radioHotAcChart = radioFormatCharts["hot_ac"] || [];
      const radioCountryChart = radioFormatCharts["country"] || [];
      const radioClassicHitsChart = radioFormatCharts["classic_hits"] || [];
      const radioClassicRockChart = radioFormatCharts["classic_rock"] || [];
      const radioActiveRockChart = radioFormatCharts["active_rock"] || [];
      const radioAltRockChart = radioFormatCharts["alt_rock"] || [];
      const radioAaaChart = radioFormatCharts["aaa"] || [];
      const radioUrbanChart = radioFormatCharts["urban"] || [];
      const radioUrbanAcChart = radioFormatCharts["urban_ac"] || [];
      const radioRhythmicChart = radioFormatCharts["rhythmic"] || [];
      const radioAdultHitsChart = radioFormatCharts["adult_hits"] || [];
      const radioLatinChart = radioFormatCharts["latin"] || [];
      const radioChristmasChart = radioFormatCharts["christmas"] || [];

      // --- RADIO UPDATER POSTS ---
      const newRadioPosts: XPost[] = [];
      const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      };

      const checkRadioNews = (chart: ChartEntry[], formatKey: string, formatName: string) => {
        if (!chart || chart.length === 0) return;

        chart.forEach((entry) => {
          const isPlayerSong = Boolean(entry.isPlayerSong);
          // Only post updates for the user / player's songs, NOT for NPCs
          if (!isPlayerSong) return;

          const rank = entry.rank;
          const lastWeek = entry.lastWeek;

          let matchingSong: Song | undefined;
          if (entry.songId) {
            for (const aId in updatedArtistsData) {
              const found = updatedArtistsData[aId].songs.find((s) => s.id === entry.songId);
              if (found) {
                matchingSong = found;
                break;
              }
            }
          }

          let consecutiveWeeks = 1;
          if (rank === 1) {
            if (lastWeek === 1) {
              const prevConsecutive = matchingSong?.formatConsecutiveWeeksAtNo1?.[formatKey] || 1;
              consecutiveWeeks = prevConsecutive + 1;
            } else {
              consecutiveWeeks = 1;
            }
            if (matchingSong) {
              matchingSong.formatConsecutiveWeeksAtNo1 = {
                ...(matchingSong.formatConsecutiveWeeksAtNo1 || {}),
                [formatKey]: consecutiveWeeks,
              };
            }
          } else if (matchingSong) {
            if (matchingSong.formatConsecutiveWeeksAtNo1?.[formatKey]) {
              matchingSong.formatConsecutiveWeeksAtNo1[formatKey] = 0;
            }
          }

          // 1. Reaching #1
          if (rank === 1 && lastWeek !== 1) {
            newRadioPosts.push({
              id: crypto.randomUUID(),
              authorId: "usradio",
              date: newDate,
              image: entry.coverArt,
              content: `"${entry.title}" by ${entry.artist} ${lastWeek === null ? "debuts" : "rises"} to #1 on the ${formatName} radio chart${lastWeek ? ` (+${lastWeek - 1})` : ""} with ${Math.floor(entry.radioPlays || 0).toLocaleString()} plays!`,
              likes: Math.floor(Math.random() * 25000) + 8000,
              retweets: Math.floor(Math.random() * 6000) + 2000,
              views: Math.floor(Math.random() * 400000) + 100000,
            });
          }
          // 2. Consecutive weeks at #1
          else if (rank === 1 && lastWeek === 1) {
            newRadioPosts.push({
              id: crypto.randomUUID(),
              authorId: "usradio",
              date: newDate,
              image: entry.coverArt,
              content: `"${entry.title}" by ${entry.artist} spends a ${getOrdinal(consecutiveWeeks)} consecutive week at #1 on the ${formatName} radio chart with ${Math.floor(entry.radioPlays || 0).toLocaleString()} plays!`,
              likes: Math.floor(Math.random() * 25000) + 8000,
              retweets: Math.floor(Math.random() * 6000) + 2000,
              views: Math.floor(Math.random() * 400000) + 100000,
            });
          }
          // 3. Enters Top 5
          else if (rank <= 5 && rank > 1 && (lastWeek === null || lastWeek > 5)) {
            newRadioPosts.push({
              id: crypto.randomUUID(),
              authorId: "usradio",
              date: newDate,
              image: entry.coverArt,
              content: `"${entry.title}" by ${entry.artist} enters the Top 5 on the ${formatName} radio chart at #${rank}${lastWeek ? ` (+${lastWeek - rank})` : " (NEW)"} with ${Math.floor(entry.radioPlays || 0).toLocaleString()} plays!`,
              likes: Math.floor(Math.random() * 18000) + 5000,
              retweets: Math.floor(Math.random() * 4000) + 1000,
              views: Math.floor(Math.random() * 250000) + 50000,
            });
          }
          // 4. Enters Top 10
          else if (rank <= 10 && rank > 5 && (lastWeek === null || lastWeek > 10)) {
            newRadioPosts.push({
              id: crypto.randomUUID(),
              authorId: "usradio",
              date: newDate,
              image: entry.coverArt,
              content: `"${entry.title}" by ${entry.artist} enters the Top 10 on the ${formatName} radio chart at #${rank}${lastWeek ? ` (+${lastWeek - rank})` : " (NEW)"} with ${Math.floor(entry.radioPlays || 0).toLocaleString()} plays!`,
              likes: Math.floor(Math.random() * 14000) + 4000,
              retweets: Math.floor(Math.random() * 3000) + 800,
              views: Math.floor(Math.random() * 200000) + 40000,
            });
          }
        });
      };
      checkRadioNews(radioOverallChart, "overall", "US Overall");
      RADIO_FORMATS.forEach((rf) => {
        if (rf.seasonalOnly && (newDate.week < 40 && newDate.week > 2)) return;
        if (radioFormatCharts[rf.id]) {
          checkRadioNews(radioFormatCharts[rf.id], rf.id, `US ${rf.shortName}`);
        }
      });

      if (newRadioPosts.length > 0) {
        for (const artistId in updatedArtistsData) {
          updatedArtistsData[artistId].xPosts.unshift(...newRadioPosts);
        }
      }

      // --- ALBUM CHART CALCULATION ---
      const releaseRawStreams = new Map<string, number>();
      allPlayerReleases
        .filter(
          (r) =>
            r.type === "EP" ||
            r.type === "Album" ||
            
            r.type === "Compilation" || r.type === "Live Album",

        )
        .forEach((release) => {
          const artistData = updatedArtistsData[release.artistId];
          let rawStreams = 0;
          release.songIds.forEach((songId) => {
            const song = artistData.songs.find((s) => s.id === songId);
            if (song) {
              rawStreams += song.lastWeekStreams || 0;
              const remixes = artistData.songs.filter(
                (s) => s.isReleased && s.remixOfSongId === song.id,
              );
              remixes.forEach((remix) => {
                rawStreams += remix.lastWeekStreams || 0;
              });
            }
          });
          releaseRawStreams.set(release.id, rawStreams);
        });

      const deluxeMap = new Map<string, Release>();
      allPlayerReleases.forEach((p) => {
        if (p.standardEditionId) {
          deluxeMap.set(p.standardEditionId, p);
        }
      });

      const playerAlbumContenders = allPlayerReleases
        .filter(
          (r) =>
            (r.type === "EP" ||
              r.type === "Album" ||
              
              r.type === "Compilation") &&
            !r.soundtrackInfo,
        )
        .filter((r) => !(r.standardEditionId))
        .filter((r) => {
          if (!r.releaseDate) return true;
          const weeksSinceRelease =
            newDate.year * 52 +
            newDate.week -
            (r.releaseDate.year * 52 + r.releaseDate.week);
          return weeksSinceRelease >= 1;
        })
        .map((release) => {
          const artist = allPlayerArtistsAndGroups.find(
            (a) => a.id === release.artistId,
          );
          const artistData = updatedArtistsData[release.artistId];
          const deluxeVersion = deluxeMap.get(release.id);
          const songsToCount = deluxeVersion
            ? deluxeVersion.songIds
            : release.songIds;

          const totalWeeklyStreams = songsToCount.reduce((sum, songId) => {
            const song = artistData.songs.find((s) => s.id === songId);
            let songStreams = song?.lastWeekStreams || 0;

            // Add streams from remixes of this song
            if (song) {
              const remixes = artistData.songs.filter(
                (s) => s.isReleased && s.remixOfSongId === song.id,
              );
              remixes.forEach((remix) => {
                songStreams += remix.lastWeekStreams;
              });
            }

            // Check if this song is on a "larger" release
            const otherReleases = allPlayerReleases.filter(
              (r) =>
                r.artistId === release.artistId &&
                (r.type === "EP" ||
                  r.type === "Album" ||
                  
                  r.type === "Compilation") &&
                r.songIds.includes(songId),
            );
            const thisRaw = releaseRawStreams.get(release.id) || 0;
            const getTypePriority = (type: string) => type === 'Compilation' ? 2 : 1;
            const bestRelease = otherReleases.reduce(
              (best, r) => {
                const raw = releaseRawStreams.get(r.id) || 0;
                const rPriority = getTypePriority(r.type);
                const bestPriority = getTypePriority(best.type);
                if (rPriority > bestPriority) return { id: r.id, raw, type: r.type };
                if (rPriority < bestPriority) return best;
                if (raw > best.raw) return { id: r.id, raw, type: r.type };
                return best;
              },
              { id: release.id, raw: thisRaw, type: release.type },
            );

            if (
              bestRelease.id !== release.id &&
              (!deluxeVersion || bestRelease.id !== deluxeVersion.id)
            ) {
              return sum; // Streams are credited to the larger release
            }

            return sum + songStreams;
          }, 0);

          const eraConfigTmp2 = getEraConfiguration(state.date.year);

          // Add digital album sales based on era. totalWeeklyStreams represents "reach".
          // For albums, 1 digital sale = 1500 stream equivalents in popularity terms usually.
          const digitalAlbumSales = Math.floor(
            (totalWeeklyStreams / 1500) *
              eraConfigTmp2.marketShare.digital *
              1.1,
          ); // Lowered album sales
          // Physical sales from general reach (aside from player-made merch)
          const generalPhysicalSales = Math.floor(
            (totalWeeklyStreams / 1500) * eraConfigTmp2.marketShare.physical,
          );

          const actualStreamEquivalents = Math.floor(
            (totalWeeklyStreams / 1500) *
              Math.max(0, eraConfigTmp2.marketShare.streaming),
          );

          const albumMerch = artistData.merch.filter(
            (m) =>
              m.releaseId === release.id ||
              (deluxeVersion && m.releaseId === deluxeVersion.id),
          );
          let totalWeeklySales = albumMerch.reduce((sum, item) => {
            if (item.regionExclusive === 'UK') return sum;
            return sum + (item._actualWeeklySales || 0);
          }, 0);

          totalWeeklySales += digitalAlbumSales + generalPhysicalSales;

          // Inject accumulated preorder sales on the first charting week (respecting vinyl delay)
          const relDate = release.releaseDate || {
            year: state.date.year,
            week: state.date.week,
          };
          const weeksSinceRel =
            newDate.year * 52 +
            newDate.week -
            (relDate.year * 52 + relDate.week);

          if (weeksSinceRel === 1) {
            if (release.vinylDelayed) {
              const nonVinylPreorders = Math.max(
                0,
                (release.preorderSales || 0) -
                  (release.delayedVinylPreorders || (release.preorderSales || 0)),
              );
              totalWeeklySales += nonVinylPreorders;
            } else {
              totalWeeklySales += release.preorderSales || 0;
            }
          } else if (weeksSinceRel === 2 && release.vinylDelayed) {
            const delayedPreorders =
              release.delayedVinylPreorders || (release.preorderSales || 0);
            totalWeeklySales += delayedPreorders;
          }
          if (deluxeVersion && deluxeVersion.releaseDate) {
            if (
              newDate.year * 52 +
                newDate.week -
                (deluxeVersion.releaseDate.year * 52 +
                  deluxeVersion.releaseDate.week) ===
              1
            ) {
              totalWeeklySales += deluxeVersion.preorderSales || 0;
            }
          }
          
          if (
            newDate.year * 52 +
              newDate.week -
              (relDate.year * 52 + relDate.week) ===
            1
          ) {
            release.firstWeekSales = totalWeeklySales;
          }

          // Realistic Sales Cap per week
          if (totalWeeklySales > 3800000) {
            totalWeeklySales = 3800000 + Math.floor(Math.random() * 200000);
          }

          let weeklySES = actualStreamEquivalents;
          if (weeklySES > 4000000) {
            weeklySES = 4000000 + Math.floor(Math.random() * 200000);
          }

          let weeklyActivity = weeklySES + totalWeeklySales;
          if (weeklyActivity > 4500000) {
            weeklyActivity = Math.floor(4500000 + Math.random() * 500000);
          }
          
          release.sales = (release.sales || 0) + totalWeeklySales;

          const labelName = release.releasingLabel
            ? release.releasingLabel.name
            : "Independent";

          return {
            uniqueId: release.id,
            title: deluxeVersion ? deluxeVersion.title : release.title,
            artist: artist?.name || "Unknown",
            label: labelName,
            coverArt: deluxeVersion ? deluxeVersion.coverArt : release.coverArt,
            isPlayerAlbum: true,
            albumId: release.id,
            weeklyActivity,
            weeklySales: totalWeeklySales,
            weeklySES,
            weeklyPureSales: totalWeeklySales,
          };
        });

      const sortedNpcAlbums = [...newNpcAlbums].sort(
        (a, b) => (b.salesPotential || 0) - (a.salesPotential || 0)
      );

      let runningMaxUnitsNpc = Infinity;
      const eraConfigTmp3 = getEraConfiguration(state.date.year);

      const npcAlbumContenders = sortedNpcAlbums.map((album, index) => {
        const npcRankTier = index + 1;
        const isMegaLaunch = npcRankTier === 1 && Math.random() < 0.15;
        let targetUnits = getBillboard200NpcUnits(npcRankTier, isMegaLaunch);

        if (targetUnits > runningMaxUnitsNpc) {
          targetUnits = Math.max(
            8000,
            Math.floor(runningMaxUnitsNpc - Math.random() * 50)
          );
        }
        runningMaxUnitsNpc = targetUnits;

        const pureRatio = Math.min(
          0.55,
          Math.max(
            0.15,
            eraConfigTmp3.marketShare.physical +
              eraConfigTmp3.marketShare.digital
          )
        );
        let weeklySales = Math.floor(
          targetUnits * pureRatio * (0.85 + Math.random() * 0.3)
        );
        if (weeklySales > targetUnits)
          weeklySales = Math.floor(targetUnits * 0.5);
        const weeklySES = Math.max(0, targetUnits - weeklySales);

        return {
          uniqueId: album.uniqueId,
          title: album.title,
          artist: album.artist,
          label: album.label,
          coverArt: album.coverArt,
          isPlayerAlbum: false,
          albumId: album.uniqueId,
          weeklyActivity: targetUnits,
          weeklySales,
          weeklySES,
          weeklyPureSales: weeklySales,
        };
      });

      const allAlbumContenders = [
        ...playerAlbumContenders,
        ...npcAlbumContenders,
      ];
      allAlbumContenders.sort((a, b) => b.weeklyActivity - a.weeklyActivity);

      const top200Albums = allAlbumContenders.slice(0, 200);
      const newAlbumChartHistory: ChartHistory = { ...state.albumChartHistory };
      const newBillboardTopAlbums: AlbumChartEntry[] = [];
      const prevBillboardAlbumsMap = new Map(
        state.billboardTopAlbums.map((entry) => [entry.uniqueId, entry]),
      );

      top200Albums.forEach((album, index) => {
        const rank = index + 1;
        const history = newAlbumChartHistory[album.uniqueId];
        const prevChartEntry = prevBillboardAlbumsMap.get(album.uniqueId);

        const finalActivity = album.weeklyActivity;
        const finalSales = album.weeklySales;
        const finalSES = album.weeklySES;

        if (history) {
          history.weeksOnChart += 1;
          history.lastRank = rank;
          if (rank < history.peak) history.peak = rank;
          if (rank === 1) {
            history.weeksAtNo1 = (history.weeksAtNo1 || 0) + 1;
          }
          if (history.chartRun) {
            history.chartRun.push(rank);
          } else {
            history.chartRun = [rank];
          }
          if (!history.firstEntered) {
            history.firstEntered = { year: newDate.year, week: newDate.week };
          }
        } else {
          newAlbumChartHistory[album.uniqueId] = {
            weeksOnChart: 1,
            peak: rank,
            lastRank: rank,
            weeksAtNo1: rank === 1 ? 1 : 0,
            chartRun: [rank],
            firstEntered: { year: newDate.year, week: newDate.week },
          };
        }

        newBillboardTopAlbums.push({
          rank,
          lastWeek: prevChartEntry?.rank ?? null,
          peak: newAlbumChartHistory[album.uniqueId].peak,
          weeksOnChart: newAlbumChartHistory[album.uniqueId].weeksOnChart,
          title: album.title,
          artist: album.artist,
          label: album.label,
          coverArt: album.coverArt,
          isPlayerAlbum: album.isPlayerAlbum,
          albumId: album.albumId,
          uniqueId: album.uniqueId,
          weeklyActivity: finalActivity,
          weeklySales: finalSales,
          weeklySES: finalSES,
          weeklyPureSales: finalSales,
        });
      });

      // --- UK OFFICIAL ALBUMS CHART (TOP 100) ---
      const UK_NATIVE_ARTISTS = new Set([
        'Ed Sheeran', 'Adele', 'Dua Lipa', 'Harry Styles', 'Coldplay', 'Arctic Monkeys', 'Dave', 'Central Cee',
        'Charli xcx', 'Stormzy', 'Sienna Spiro', 'Olivia Dean', 'Lewis Capaldi', 'Sam Smith', 'Oasis',
        'PinkPantheress', 'Gorillaz', 'Florence + The Machine', 'The Beatles', 'Queen', 'Radiohead',
        'Little Mix', 'One Direction', 'Calvin Harris', 'Elton John', 'David Bowie', 'Amy Winehouse',
        'George Michael', 'The Rolling Stones', 'Fleetwood Mac', 'The 1975', 'Rita Ora', 'Ellie Goulding',
        'Jess Glynne', 'Jorja Smith', 'Raye', 'Headie One', 'J Hus', 'Fred again..', 'MNEK',
        'Bring Me The Horizon', 'Biffy Clyro', 'Muse', 'Kasabian', 'Blur', 'Robbie Williams', 'Take That',
        'Westlife', 'Spice Girls', 'Sam Fender', 'Slowthai', 'Skepta'
      ]);
      const UK_POPULAR_MEGASTARS = new Set([
        'Taylor Swift', 'Drake', 'BeyoncÃ©', 'Rihanna', 'Ariana Grande', 'Olivia Rodrigo', 'Billie Eilish',
        'Sabrina Carpenter', 'The Weeknd', 'Post Malone', 'Katy Perry', 'Justin Bieber', 'Michael Jackson',
        'Eminem', 'Lana Del Rey', 'Kendrick Lamar', 'Travis Scott', 'Lady Gaga', 'SZA', 'Chappell Roan'
      ]);

      const ukPlayerAlbumContenders = allPlayerReleases
        .filter(
          (r) =>
            (r.type === "Album" || r.type === "EP" || r.type === "Compilation") &&
            !r.soundtrackInfo &&
            !r.standardEditionId,
        )
        .filter((r) => {
          if (!r.releaseDate) return true;
          const weeksSinceRelease =
            newDate.year * 52 +
            newDate.week -
            (r.releaseDate.year * 52 + r.releaseDate.week);
          return weeksSinceRelease >= 1;
        })
        .map((release) => {
          const artistData = updatedArtistsData[release.artistId];
          const artistObj = allPlayerArtistsAndGroups.find(
            (a) => a.id === release.artistId,
          );
          const deluxeVersion = deluxeMap.get(release.id);
          const songsToCount = deluxeVersion
            ? deluxeVersion.songIds
            : release.songIds;

          const totalUkWeeklyStreams = songsToCount.reduce((sum, songId) => {
            const song = artistData?.songs?.find((s) => s.id === songId);
            let regUk = song?.lastWeekRegionalStreams?.["UK"] || song?.regionalStreams?.["UK"] || 0;

            if (song) {
              const remixes = artistData?.songs?.filter(
                (s) => s.isReleased && s.remixOfSongId === song.id,
              ) || [];
              remixes.forEach((remix) => {
                regUk += remix.lastWeekRegionalStreams?.["UK"] || remix.regionalStreams?.["UK"] || 0;
              });
            }

            return sum + regUk;
          }, 0);

          const ukSES = Math.floor(totalUkWeeklyStreams / 1000);

          const ukPop = artistData?.regionalPopularity?.["UK"] || 0;
          const regMap = artistData?.regionalPopularity || { US: artistData?.popularity || 0, UK: 0 };
          const regSum = Object.values(regMap).reduce((a: number, b: number) => a + b, 0) || 100;
          const ukShare = Math.max(0.04, ukPop / Math.max(1, regSum));

          const albumMerch = (artistData?.merch || []).filter(
            (m) => m.releaseId === release.id || (deluxeVersion && m.releaseId === deluxeVersion.id),
          );
          const ukMerchSales = albumMerch.reduce((sum, item) => {
            if (item.regionExclusive === 'US') return sum;
            const sales = item._actualWeeklySales || 0;
            if (item.regionExclusive === 'UK') return sum + sales;
            return sum + Math.floor(sales * ukShare * (1 + ukPop / 30));
          }, 0);
          const ukDigitalPhysicalSales = Math.floor(
            (totalUkWeeklyStreams / 1000) * 0.2 * (1 + ukPop / 25),
          );

          const ukPureSales = ukMerchSales + ukDigitalPhysicalSales;
          const ukWeeklyActivity = ukPureSales + ukSES;

          const labelName = release.releasingLabel ? release.releasingLabel.name : "Independent";

          return {
            uniqueId: release.id,
            title: deluxeVersion ? deluxeVersion.title : release.title,
            artist: artistObj?.name || artistData?.name || "Unknown",
            label: labelName,
            coverArt: deluxeVersion ? deluxeVersion.coverArt : release.coverArt,
            isPlayerAlbum: true,
            albumId: release.id,
            weeklyActivity: ukWeeklyActivity,
            weeklySales: ukPureSales,
            weeklySES: ukSES,
            weeklyPureSales: ukPureSales,
          };
        });

      const ukNpcAlbumContenders = newNpcAlbums.map((album) => {
        const isUkNative = UK_NATIVE_ARTISTS.has(album.artist);
        const isUkMegastar = UK_POPULAR_MEGASTARS.has(album.artist);

        let ukMultiplier = 0.35 + (Math.random() * 0.2);
        if (isUkNative) {
          ukMultiplier = 2.8 + (Math.random() * 1.5);
        } else if (isUkMegastar) {
          ukMultiplier = 1.8 + (Math.random() * 0.8);
        } else if (album.genre && ["Britpop", "Indie", "Electronic", "Dance", "Rock", "Grime", "UK Drill"].includes(album.genre)) {
          ukMultiplier = 1.4 + (Math.random() * 0.6);
        }

        const albumSongs = album.songIds
          .map((id) => newNpcsWithReleases.find((s) => s.uniqueId === id))
          .filter(Boolean);

        const totalWeeklyStreams = albumSongs.reduce((sum, song) => {
          if (!song) return sum;
          return sum + Math.floor(song.basePopularity * (Math.random() * 0.4 + 0.8));
        }, 0);

        const ukSES = Math.floor((totalWeeklyStreams / 1200) * ukMultiplier * 0.7);
        const ukPureSales = Math.floor((album.salesPotential || 1000) * ukMultiplier * 0.45 * (0.85 + Math.random() * 0.3));
        const ukWeeklyActivity = ukPureSales + ukSES;

        return {
          uniqueId: album.uniqueId,
          title: album.title,
          artist: album.artist,
          label: album.label,
          coverArt: album.coverArt,
          isPlayerAlbum: false,
          albumId: album.uniqueId,
          weeklyActivity: ukWeeklyActivity,
          weeklySales: ukPureSales,
          weeklySES: ukSES,
          weeklyPureSales: ukPureSales,
        };
      });

      const allUkAlbumContenders = [
        ...ukPlayerAlbumContenders,
        ...ukNpcAlbumContenders,
      ].sort((a, b) => b.weeklyActivity - a.weeklyActivity);

      const top100UkAlbums = allUkAlbumContenders.slice(0, 100);
      const newUkAlbumsChartHistory: ChartHistory = { ...(state.ukAlbumsChartHistory || {}) };
      const newUkAlbumsChart: AlbumChartEntry[] = [];
      const prevUkAlbumsMap = new Map((state.ukAlbumsChart || []).map((entry) => [entry.uniqueId, entry]));

      top100UkAlbums.forEach((album, index) => {
        const rank = index + 1;
        const history = newUkAlbumsChartHistory[album.uniqueId];
        const prevChartEntry = prevUkAlbumsMap.get(album.uniqueId);

        if (history) {
          history.weeksOnChart += 1;
          history.lastRank = rank;
          if (rank < history.peak) history.peak = rank;
          if (rank === 1) {
            history.weeksAtNo1 = (history.weeksAtNo1 || 0) + 1;
          }
          if (history.chartRun) {
            history.chartRun.push(rank);
          } else {
            history.chartRun = [rank];
          }
        } else {
          newUkAlbumsChartHistory[album.uniqueId] = {
            weeksOnChart: 1,
            peak: rank,
            lastRank: rank,
            weeksAtNo1: rank === 1 ? 1 : 0,
            chartRun: [rank],
            firstEntered: { year: newDate.year, week: newDate.week },
          };
        }

        newUkAlbumsChart.push({
          rank,
          lastWeek: prevChartEntry?.rank ?? null,
          peak: newUkAlbumsChartHistory[album.uniqueId].peak,
          weeksOnChart: newUkAlbumsChartHistory[album.uniqueId].weeksOnChart,
          title: album.title,
          artist: album.artist,
          label: album.label,
          coverArt: album.coverArt,
          isPlayerAlbum: album.isPlayerAlbum,
          albumId: album.albumId,
          uniqueId: album.uniqueId,
          weeklyActivity: album.weeklyActivity,
          weeklySales: album.weeklySales,
          weeklySES: album.weeklySES,
          weeklyPureSales: album.weeklyPureSales,
        });
      });

      // --- NPC Pop Base #1 Debut Posts ---
      let finalState: GameState = { ...state };
      const npcPopBasePosts: XPost[] = [];

      // --- US ITUNES CHARTDATA POSTS ---
      const currentItunesSongs = [...allContenders].map((song) => {
        const hash = song.uniqueId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const divisor = 750 + (hash % 250);
        let boost = 1;
        if (song.isPlayerSong && song.songId) {
          const aData = updatedArtistsData[state.activeArtistId];
          if (aData && aData.lastPushedSongId === song.songId && aData.lastPushToItunesWeek) {
            const currentWeek = newDate.year * 52 + newDate.week;
            if (currentWeek - aData.lastPushToItunesWeek <= 1) {
              boost = 5 + Math.random() * 5;
            }
          }
        }
        const sales = (song as any).isItunesVersion
          ? (song as any).itunesSales
          : Math.floor((song.weeklyStreams || 0) / divisor) * boost;
        return { ...song, itunesSales: sales };
      }).sort((a, b) => b.itunesSales - a.itunesSales).slice(0, 100);

      const prevItunesMap = new Map((state.prevItunesChart || []).map((e) => [e.uniqueId, e.rank]));
      const activeDataForBeef = updatedArtistsData[state.activeArtistId];
      const isPlayerInBeef = activeDataForBeef?.fanWarStatus && activeDataForBeef.fanWarStatus.weeksRemaining > 0;

      currentItunesSongs.forEach((song, idx) => {
        if (!song.isPlayerSong) return;
        const rank = idx + 1;
        const lastWeekRank = prevItunesMap.get(song.uniqueId) ?? null;

        const isSongArtistInBeef = isPlayerInBeef;
        const beefSuffix = isSongArtistInBeef
          ? `, following beef with ${activeDataForBeef.fanWarStatus!.targetArtistName}.`
          : `.`;

        if (rank === 1 && (lastWeekRank === null || lastWeekRank > 1)) {
          npcPopBasePosts.push({
            id: crypto.randomUUID(),
            authorId: "chartdata",
            content: `${song.artist}'s "${song.title}" has reached #1 on US iTunes${beefSuffix}`,
            image: song.coverArt,
            likes: Math.floor(Math.random() * 60000) + 20000,
            retweets: Math.floor(Math.random() * 20000) + 5000,
            views: Math.floor(Math.random() * 500000) + 100000,
            date: newDate,
          });
        } else if (rank > 1 && rank <= 5 && (lastWeekRank === null || lastWeekRank > 5)) {
          npcPopBasePosts.push({
            id: crypto.randomUUID(),
            authorId: "chartdata",
            content: `${song.artist}'s "${song.title}" has entered the top 5 on US iTunes${beefSuffix}`,
            image: song.coverArt,
            likes: Math.floor(Math.random() * 30000) + 10000,
            retweets: Math.floor(Math.random() * 8000) + 2000,
            views: Math.floor(Math.random() * 300000) + 50000,
            date: newDate,
          });
        }
      });
      finalState.prevItunesChart = currentItunesSongs.map((s, i) => ({ uniqueId: s.uniqueId, rank: i + 1 }));

      // --- GLOBAL SPOTIFY REPLACES AT #1 ---
      const newSpotifyNo1 = newSpotifyGlobal[0];
      const prevSpotifyNo1 = state.spotifyGlobal && state.spotifyGlobal[0] ? state.spotifyGlobal[0] : null;

      if (
        newSpotifyNo1 &&
        prevSpotifyNo1 &&
        newSpotifyNo1.isPlayerSong &&
        newSpotifyNo1.uniqueId !== prevSpotifyNo1.uniqueId &&
        newSpotifyNo1.artist === prevSpotifyNo1.artist
      ) {
        let pronoun = "herself";
        const artistProfile = state.soloArtist || state.group?.members.find((m) => m.id === state.activeArtistId);
        if (artistProfile && (artistProfile as any).pronouns) {
          const p = (artistProfile as any).pronouns;
          if (p === "he/him") pronoun = "himself";
          else if (p === "they/them") pronoun = "themselves";
        }

        npcPopBasePosts.push({
          id: crypto.randomUUID(),
          authorId: "chartdata",
          content: `${newSpotifyNo1.artist} replaces ${pronoun} at #1 on the global Spotify chart.\n\n"${newSpotifyNo1.title}" replaces "${prevSpotifyNo1.title}".`,
          image: newSpotifyNo1.coverArt,
          image2: prevSpotifyNo1.coverArt,
          likes: Math.floor(Math.random() * 80000) + 30000,
          retweets: Math.floor(Math.random() * 20000) + 5000,
          views: Math.floor(Math.random() * 1000000) + 300000,
          date: newDate,
        });
      }

      // --- GLOBAL SPOTIFY NEW PEAK ---
      const activeArtistProfile = state.soloArtist || state.group?.members.find((m) => m.id === state.activeArtistId) || state.group;
      const artistPic = activeArtistProfile?.image || (activeArtistProfile as any)?.imageUrl || "";

      newSpotifyGlobal.forEach((song) => {
        if (!song.isPlayerSong) return;
        const prevPeak = state.chartHistory?.[song.uniqueId]?.peak ?? 999;
        if (song.rank < prevPeak) {
          const rawStreams = song.weeklyStreams || 0;
          let streamText = "";
          if (rawStreams >= 1000000) {
            const mVal = (rawStreams / 1000000).toLocaleString("en-US", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 3,
            });
            streamText = `${mVal} million`;
          } else {
            streamText = `${(rawStreams / 1000).toFixed(1)} thousand`;
          }

          npcPopBasePosts.push({
            id: crypto.randomUUID(),
            authorId: "chartdata",
            content: `${song.artist}'s "${song.title}" reaches a new peak of #${song.rank} on the global Spotify chart with ${streamText} streams.`,
            image: song.coverArt,
            image2: artistPic || undefined,
            likes: Math.floor(Math.random() * 40000) + 10000,
            retweets: Math.floor(Math.random() * 12000) + 2000,
            views: Math.floor(Math.random() * 400000) + 80000,
            date: newDate,
          });
        }
      });
      const hot100One = newBillboardHot100[0];
      const topAlbumsOne = newBillboardTopAlbums[0];

      // First #1 Album on Billboard 200 (Dual image: profile picture then album cover) - User Only
      if (topAlbumsOne && topAlbumsOne.isPlayerAlbum && topAlbumsOne.albumId) {
        const playerArtist =
          allPlayerArtistsAndGroups.find((a) => a.name === topAlbumsOne.artist) ||
          allPlayerArtistsAndGroups.find((a) => {
            const aData = updatedArtistsData[a.id];
            return aData?.releases?.some((r) => r.id === topAlbumsOne.albumId);
          });
        if (playerArtist && updatedArtistsData[playerArtist.id]) {
          const aData = updatedArtistsData[playerArtist.id];
          if (!aData.hasEarnedFirstBillboard200No1) {
            aData.hasEarnedFirstBillboard200No1 = true;
            const pronounPossessive =
              (playerArtist as any)?.pronouns === "he/him"
                ? "his"
                : (playerArtist as any)?.pronouns === "she/her"
                ? "her"
                : "their";
            const no1AlbumContent = `${topAlbumsOne.artist} officially earns ${pronounPossessive} first ever #1 album on the Billboard 200 with \x27${topAlbumsOne.title}\x27.`;
            const artistPic =
              (playerArtist as any)?.image ||
              (playerArtist as any)?.imageUrl ||
              aData.avatar ||
              topAlbumsOne.coverArt;

            aData.xPosts.unshift({
              id: crypto.randomUUID(),
              authorId: "chartdata",
              content: no1AlbumContent,
              image: artistPic,
              image2: topAlbumsOne.coverArt,
              likes: Math.floor(Math.random() * 80000) + 30000,
              retweets: Math.floor(Math.random() * 20000) + 5000,
              views: Math.floor(Math.random() * 1500000) + 500000,
              date: newDate,
            });
          }
        }
      }

      // Biggest Sales Week Record (Billboard 200)
      const currentBiggestSales =
        finalState.biggestSalesWeekByYear?.[newDate.year];
      if (topAlbumsOne && topAlbumsOne.weeklyActivity) {
        const isDebut =
          newAlbumChartHistory[topAlbumsOne.uniqueId]?.weeksOnChart === 1;
        if (
          !currentBiggestSales ||
          topAlbumsOne.weeklyActivity > currentBiggestSales.sales
        ) {
          if (currentBiggestSales && isDebut) {
            const surpassingText =
              currentBiggestSales.artist === topAlbumsOne.artist
                ? `surpassing their own '${currentBiggestSales.album}'`
                : `surpassing ${currentBiggestSales.artist}'s '${currentBiggestSales.album}'`;

            npcPopBasePosts.push({
              id: crypto.randomUUID(),
              authorId: "chartdata",
              content: `${topAlbumsOne.artist}'s '${topAlbumsOne.title}' earns the biggest sales week for an album on the Billboard 200 in ${newDate.year}, ${surpassingText}.`,
              image: topAlbumsOne.coverArt,
              image2: currentBiggestSales.coverArt,
              likes: Math.floor(Math.random() * 80000) + 30000,
              retweets: Math.floor(Math.random() * 20000) + 5000,
              views: Math.floor(Math.random() * 1500000) + 500000,
              date: newDate,
            });
          }
          if (!finalState.biggestSalesWeekByYear)
            finalState.biggestSalesWeekByYear = {};
          finalState.biggestSalesWeekByYear[newDate.year] = {
            artist: topAlbumsOne.artist,
            album: topAlbumsOne.title,
            sales: topAlbumsOne.weeklyActivity,
            coverArt: topAlbumsOne.coverArt,
          };
        }
      }

      // Most #1 Debuts Record (Hot 100)
      if (
        hot100One &&
        hot100One.lastWeek === null &&
        newChartHistory[hot100One.uniqueId]?.weeksOnChart === 1
      ) {
        // Determine if it's player or NPC
        let debutCount = 0;
        let artistImage = "";
        if (hot100One.isPlayerSong && hot100One.songId) {
          const song = allPlayerSongsFlat.find(
            (s) => s.id === hot100One.songId,
          );
          if (song) {
            const artistData = updatedArtistsData[song.artistId];
            artistData.numberOneDebuts = (artistData.numberOneDebuts || 0) + 1;
            debutCount = artistData.numberOneDebuts;
            artistImage =
              allPlayerArtistsAndGroups.find((a) => a.id === song.artistId)
                ?.imageUrl || hot100One.coverArt;
          }
        } else {
          if (!finalState.npcNumberOneDebuts)
            finalState.npcNumberOneDebuts = {};
          finalState.npcNumberOneDebuts[hot100One.artist] =
            (finalState.npcNumberOneDebuts[hot100One.artist] || 0) + 1;
          debutCount = finalState.npcNumberOneDebuts[hot100One.artist];
          artistImage =
            state.npcImages?.[hot100One.artist] || hot100One.coverArt;
        }

        const currentMostDebuts = finalState.mostNumberOneDebutsRecord;
        if (!currentMostDebuts || debutCount > currentMostDebuts.count) {
          if (currentMostDebuts) {
            const surpassingText =
              currentMostDebuts.artist === hot100One.artist
                ? `breaking their own record`
                : `surpassing ${currentMostDebuts.artist} (${currentMostDebuts.count})`;

            npcPopBasePosts.push({
              id: crypto.randomUUID(),
              authorId: "chartdata",
              content: `${hot100One.artist} now has the most #1 debuts for an artist in Hot 100 history, ${surpassingText}.`,
              image: artistImage,
              image2: currentMostDebuts.image,
              likes: Math.floor(Math.random() * 80000) + 30000,
              retweets: Math.floor(Math.random() * 20000) + 5000,
              views: Math.floor(Math.random() * 1500000) + 500000,
              date: newDate,
            });
          }
          finalState.mostNumberOneDebutsRecord = {
            artist: hot100One.artist,
            count: debutCount,
            image: artistImage,
          };
        }
      }

      if (hot100One) {
        let handle = "";
        if (hot100One.isPlayerSong && hot100One.songId) {
          const song = allPlayerSongsFlat.find((s) => s.id === hot100One.songId);
          if (song) {
            const aData = updatedArtistsData[song.artistId];
            handle = aData?.xUsers.find((u) => u.isPlayer)?.username || "";
            const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === song.artistId);
            const songArtistName = hot100One.artist || artistProfile?.name || "Artist";

            // User first ever #1 song on Hot 100
            if (!aData.hasEarnedFirstHot100No1) {
              aData.hasEarnedFirstHot100No1 = true;
              const isDebut =
                hot100One.lastWeek === null &&
                newChartHistory[hot100One.uniqueId]?.weeksOnChart === 1;
              const pronounPossessive =
                (artistProfile as any)?.pronouns === "he/him"
                  ? "his"
                  : (artistProfile as any)?.pronouns === "she/her"
                  ? "her"
                  : "their";
              const artistPic =
                (artistProfile as any)?.image ||
                (artistProfile as any)?.imageUrl ||
                aData.avatar ||
                hot100One.coverArt;

              // 1. First #1 hit tweet with song title (IMG_8480)
              const hitContent = `${songArtistName} earns ${pronounPossessive} first ever #1 hit on the Hot 100 with "${hot100One.title}".`;
              aData.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: "chartdata",
                content: hitContent,
                image: artistPic,
                likes: Math.floor(Math.random() * 85000) + 30000,
                retweets: Math.floor(Math.random() * 22000) + 5000,
                views: Math.floor(Math.random() * 1600000) + 500000,
                date: newDate,
              });

              // 2. Count time elapsed since debut single (IMG_8481)
              let debutDate = aData.debutSingleDate;
              if (!debutDate) {
                const singleReleases = (aData.releases || []).filter(
                  (r) => r.type === "Single" && r.releaseDate,
                );
                if (singleReleases.length > 0) {
                  const sorted = [...singleReleases].sort((a, b) => {
                    const aW = (a.releaseDate?.year || 0) * 52 + (a.releaseDate?.week || 0);
                    const bW = (b.releaseDate?.year || 0) * 52 + (b.releaseDate?.week || 0);
                    return aW - bW;
                  });
                  if (sorted[0].releaseDate) debutDate = sorted[0].releaseDate;
                }
                if (!debutDate) {
                  const releasedSongs = (aData.songs || []).filter(
                    (s) => s.isReleased && s.releaseDate,
                  );
                  if (releasedSongs.length > 0) {
                    const sorted = [...releasedSongs].sort((a, b) => {
                      const aW = (a.releaseDate?.year || 0) * 52 + (a.releaseDate?.week || 0);
                      const bW = (b.releaseDate?.year || 0) * 52 + (b.releaseDate?.week || 0);
                      return aW - bW;
                    });
                    if (sorted[0].releaseDate) debutDate = sorted[0].releaseDate;
                  }
                }
                if (!debutDate && song.releaseDate) {
                  debutDate = song.releaseDate;
                }
              }
              const defaultDebut = debutDate || { week: 1, year: newDate.year };
              const diffWeeks = Math.max(
                1,
                (newDate.year - defaultDebut.year) * 52 + (newDate.week - defaultDebut.week),
              );
              let elapsedStr = "";
              if (diffWeeks >= 52) {
                const yrs = Math.floor(diffWeeks / 52);
                elapsedStr = `${yrs} ${yrs === 1 ? "year" : "years"}`;
              } else if (diffWeeks >= 4) {
                const mos = Math.max(1, Math.floor(diffWeeks / 4.33));
                elapsedStr = `${mos} ${mos === 1 ? "month" : "months"}`;
              } else {
                elapsedStr = `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"}`;
              }

              const elapsedContent = `${songArtistName} earns ${pronounPossessive} first ever ${isDebut ? "#1 debut" : "#1 hit"} on the Hot 100, ${elapsedStr} after ${pronounPossessive} debut single.`;
              aData.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: "chartdata",
                content: elapsedContent,
                image: artistPic,
                likes: Math.floor(Math.random() * 95000) + 35000,
                retweets: Math.floor(Math.random() * 25000) + 6000,
                views: Math.floor(Math.random() * 1800000) + 600000,
                date: newDate,
              });
            }
          }
        }
        if (!handle) {
          handle = hot100One.artist.toLowerCase().replace(/[^a-z0-9]/g, "");
        }

        const hot100PostContent = formatChartDataHot100Post({
          rank: hot100One.rank,
          lastWeekRank: hot100One.lastWeek,
          peak: hot100One.peak,
          weeksOnChart: hot100One.weeksOnChart,
          title: hot100One.title,
          artist: hot100One.artist,
          handle: handle,
        });

        npcPopBasePosts.push({
          id: crypto.randomUUID(),
          authorId: "chartdata",
          content: hot100PostContent,
          image: hot100One.coverArt,
          likes: Math.floor(Math.random() * 80000) + 30000,
          retweets: Math.floor(Math.random() * 20000) + 5000,
          views: Math.floor(Math.random() * 1500000) + 500000,
          date: newDate,
        });
      }

      // Generate chartdata posts for player songs in newBillboardHot100 and check for first solo entry (User Only)
      newBillboardHot100.forEach((entry) => {
        if (entry.isPlayerSong && entry.songId) {
          const song = allPlayerSongsFlat.find((s) => s.id === entry.songId);
          if (song && updatedArtistsData[song.artistId]) {
            const aData = updatedArtistsData[song.artistId];
            const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === song.artistId);
            const songArtistName = entry.artist || (artistProfile?.name) || "Artist";
            const playerHandle = aData.xUsers.find((u) => u.isPlayer)?.username || "";

            // Helper to determine if a song is solo (no features/collaborations)
            const isSolo =
              (!song.features || song.features.length === 0) &&
              !song.collaboration &&
              !song.isFeatureToNpc &&
              !(song as any).customFeatures?.length &&
              !entry.artist.toLowerCase().includes("feat") &&
              !entry.artist.toLowerCase().includes("ft.") &&
              !entry.artist.toLowerCase().includes(" & ") &&
              !entry.artist.toLowerCase().includes(" with ");

            // First solo Hot 100 entry for the user (IMG_8476)
            if (isSolo && !aData.hasEarnedFirstSoloHot100) {
              aData.hasEarnedFirstSoloHot100 = true;
              const pronounPossessive =
                (artistProfile as any)?.pronouns === "he/him"
                  ? "his"
                  : (artistProfile as any)?.pronouns === "she/her"
                  ? "her"
                  : "their";
              const cleanHandle = playerHandle.replace(/^@/, "").trim();
              const mention = cleanHandle ? `.@${cleanHandle}` : songArtistName;
              const soloPostContent = `${mention} earns ${pronounPossessive} first ever solo entry on the Hot 100 this week with "${entry.title}".`;
              const artistPic =
                (artistProfile as any)?.image ||
                (artistProfile as any)?.imageUrl ||
                aData.avatar ||
                entry.coverArt;

              aData.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: "chartdata",
                content: soloPostContent,
                image: artistPic,
                likes: Math.floor(Math.random() * 40000) + 15000,
                retweets: Math.floor(Math.random() * 10000) + 3000,
                views: Math.floor(Math.random() * 600000) + 150000,
                date: newDate,
              });
            }

            if (entry.rank > 1) {
              const handle = playerHandle || songArtistName.toLowerCase().replace(/[^a-z0-9]/g, "");
              const chartDataPost = formatChartDataHot100Post({
                rank: entry.rank,
                lastWeekRank: entry.lastWeek,
                peak: entry.peak,
                weeksOnChart: entry.weeksOnChart,
                title: entry.title,
                artist: songArtistName,
                handle: handle,
              });

              // Prevent duplicate chartdata post if already added this exact date
              const alreadyPosted = aData.xPosts.some((p) => p.authorId === "chartdata" && p.content === chartDataPost);
              if (!alreadyPosted) {
                aData.xPosts.unshift({
                  id: crypto.randomUUID(),
                  authorId: "chartdata",
                  content: chartDataPost,
                  image: entry.coverArt,
                  likes: Math.floor(Math.random() * 25000) + 8000,
                  retweets: Math.floor(Math.random() * 6000) + 1500,
                  views: Math.floor(Math.random() * 300000) + 80000,
                  date: newDate,
                });
              }
            }
          }
        }
      });

      if (hot100One && hot100One.lastWeek === null && !hot100One.isPlayerSong) {
        npcPopBasePosts.push({
          id: crypto.randomUUID(),
          authorId: "popbase",
          content: `"${hot100One.title}" by ${hot100One.artist} debuts at #1 on the Billboard Hot 100.`,
          image: hot100One.coverArt,
          likes: Math.floor(Math.random() * 80000) + 30000,
          retweets: Math.floor(Math.random() * 20000) + 5000,
          views: Math.floor(Math.random() * 1500000) + 500000,
          date: newDate,
        });
      }

      if (
        topAlbumsOne &&
        topAlbumsOne.lastWeek === null &&
        !topAlbumsOne.isPlayerAlbum
      ) {
        const units = formatNumber(Math.floor(topAlbumsOne.weeklyActivity));
        // If it's a huge number like 1.2M, formatNumber returns "1.2M". If it's 300000, it might return "300000".
        // Wait, formatNumber has T and B and M and K.
        let unitStr = units;
        if (
          topAlbumsOne.weeklyActivity >= 1000 &&
          topAlbumsOne.weeklyActivity < 1000000
        ) {
          unitStr =
            (topAlbumsOne.weeklyActivity / 1000)
              .toFixed(1)
              .replace(/\.0$/, "") + "K";
        }

        npcPopBasePosts.push({
          id: crypto.randomUUID(),
          authorId: "popbase",
          content: `${topAlbumsOne.title} debuts #1 on the Billboard 200 with ${unitStr} units.`,
          image: topAlbumsOne.coverArt,
          likes: Math.floor(Math.random() * 80000) + 30000,
          retweets: Math.floor(Math.random() * 20000) + 5000,
          views: Math.floor(Math.random() * 1500000) + 500000,
          date: newDate,
        });
      }

      if (npcPopBasePosts.length > 0) {
        Object.values(updatedArtistsData).forEach((d) => {
          d.xPosts.unshift(...npcPopBasePosts);
          if (d.xPosts.length > 250) {
            d.xPosts = d.xPosts.slice(0, 250);
          }
        });
      }

      // --- AWARDS LOGIC ---

      
      // --- GOLDEN GLOBES LOGIC ---
      let newGoldenGlobeNominations: GameState["goldenGlobeCurrentYearNominations"] = state.goldenGlobeCurrentYearNominations;

      // Week 17: Determine Nominations
      if (newDate.week === 17 && (state.goldenGlobeSubmissions?.length || 0) > 0) {
        const newNominations: GoldenGlobeCategory[] = [];
        const categories: GoldenGlobeAward["category"][] = [
          "Best Actor/Actress",
          "Best Supporting Actor/Actress",
          "Best Voice Acting",
          "Best TV Show",
          "Best Movie",
          "Best Soundtrack",
          "Best Original Song"
        ];

        for (const categoryName of categories) {
          const contenders: GoldenGlobeContender[] = [];

          const playerSubmissions = (state.goldenGlobeSubmissions || []).filter(s => s.category === categoryName);
          for (const sub of playerSubmissions) {
            const artistData = updatedArtistsData[sub.artistId];
            const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === sub.artistId);
            if (!artistData || !artistProfile) continue;

            let score = 0;
            let coverArt: string | undefined = undefined;

            if (["Best Actor/Actress", "Best Supporting Actor/Actress", "Best Voice Acting"].includes(categoryName)) {
                const role = (artistData.actingRoles || []).find(g => g.id === sub.itemId);
                if (role) { score = artistData.popularity + ((role.rating || 50) * 2); coverArt = role.coverUrl; }
            } else if (["Best TV Show", "Best Movie"].includes(categoryName)) {
                const role = (artistData.actingRoles || []).find(g => g.id === sub.itemId);
                if (role) { score = artistData.popularity + ((role.rating || 50) * 3); coverArt = role.coverUrl; }
            } else if (categoryName === "Best Soundtrack") {
                 const release = artistData.releases.find(r => r.id === sub.itemId);
                 if (release) {
                     score = (release.firstWeekStreams || 0) / 100000 + artistData.popularity;
                     coverArt = release.coverArt;
                 }
            } else if (categoryName === "Best Original Song") {
                 const song = artistData.songs.find(s => s.id === sub.itemId);
                 if (song) {
                     score = song.quality * 2 + (song.firstWeekStreams || 0) / 25000;
                     coverArt = song.coverArt;
                 }
            }

            contenders.push({
                id: sub.itemId,
                name: sub.itemName,
                artistName: artistProfile.name,
                isPlayer: true,
                score,
                coverArt
            });
          }

          // Add some NPC contenders
          for (let i = 0; i < 4; i++) {
             const npcName = getRandomNpcName(state.npcs.map((n) => n.artist), newDate.year);
             contenders.push({
                 id: "npc-" + Math.random(),
                 name: categoryName.includes("Song") || categoryName.includes("Soundtrack") ? "NPC Project" : "NPC Film/Show",
                 artistName: npcName,
                 isPlayer: false,
                 score: Math.random() * 100 + 50,
                 coverArt: `https://ui-avatars.com/api/?name=${encodeURIComponent(npcName)}&background=random&color=fff&size=250`
             });
          }

          const topNominees = contenders.sort((a, b) => b.score - a.score).slice(0, 5);
          newNominations.push({
             name: categoryName,
             nominees: topNominees
          });
        }
        
        newGoldenGlobeNominations = newNominations;
        finalState.goldenGlobeCurrentYearNominations = newNominations;

        
        const majorCatsForPosts: GoldenGlobeAward["category"][] = ["Best Actor/Actress", "Best Movie", "Best Original Song"];
        
        for (const category of newNominations) {
            if (majorCatsForPosts.includes(category.name)) {
                let nomineesText = '';
                category.nominees.forEach(n => {
                    nomineesText += `â€¢ ${n.artistName.toUpperCase()} | ${n.name.toUpperCase()}
`;
                });
                const content = `Congratulations to the 85th #GoldenGlobes nominees for ${category.name}:

${nomineesText}`;
                
                Object.values(updatedArtistsData).forEach((d) =>
                  d.xPosts.unshift({
                    id: crypto.randomUUID(),
                    authorId: "golden_globes",
                    content,
                    likes: Math.floor(Math.random() * 4000) + 1500,
                    retweets: Math.floor(Math.random() * 1000) + 500,
                    views: Math.floor(Math.random() * 200000) + 100000,
                    date: newDate,
                  }),
                );
            }
        }
        
        for (const artistId in updatedArtistsData) {

          const artistData = updatedArtistsData[artistId];
          const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === artistId);
          let gotNominated = false;
          const nominatedCategories: string[] = [];

          for (const category of newNominations) {
            const isNominated = category.nominees.some(
              (n) => n.isPlayer && n.artistName === artistProfile?.name,
            );
            if (isNominated) {
              gotNominated = true;
              nominatedCategories.push(category.name);
            }
          }

          if (gotNominated) {
             artistData.hype = Math.min(100, artistData.hype + 5);
             const emailId = crypto.randomUUID();
             artistData.inbox.unshift({
               id: emailId,
               sender: "Hollywood Foreign Press Association",
               subject: "Congratulations! You're a Golden Globe Nominee!",
               body: `Congratulations! You have been nominated for ${nominatedCategories.length} Golden Globe${nominatedCategories.length > 1 ? 's' : ''}! We invite you to attend the ceremony in week 20.`,
               date: newDate,
               isRead: false,
               offer: {
                 type: "goldenGlobeNominations",
                 emailId,
               },
             });
             artistData.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: artistProfile!.id,
                content: `Honored to be nominated for ${nominatedCategories.length} Golden Globe${nominatedCategories.length > 1 ? 's' : ''}! Thank you HFPA! ðŸ¥‚ðŸŒ`,
                likes: Math.floor(Math.random() * 500000) + 100000,
                retweets: Math.floor(Math.random() * 50000) + 10000,
                views: Math.floor(Math.random() * 5000000) + 1000000,
                date: newDate,
             });
             
             // Also invite to red carpet
             const carpetEmailId = crypto.randomUUID();
             artistData.inbox.unshift({
                id: carpetEmailId,
                sender: "Hollywood Foreign Press Association",
                subject: "Invitation: Golden Globes Red Carpet",
                body: `Dear ${artistProfile.name},

Congratulations on your nomination. We would be honored to have you attend the ${newDate.year} Golden Globes and walk the red carpet.

Please accept this invitation by sharing your look for the evening.

Sincerely,
HFPA`,
                date: newDate,
                isRead: false,
                offer: { type: "goldenGlobeRedCarpet", emailId: carpetEmailId },
             });
          }
        }
      }

      // Week 18: Additional Golden Globes Red Carpet invitations for notable artists / actors
      if (newDate.week === 18) {
        for (const artistId in updatedArtistsData) {
          const artistData = updatedArtistsData[artistId];
          const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === artistId);
          if (!artistProfile) continue;
          const hasReceivedCarpetInvite = artistData.inbox.some(
            (e) => e.offer?.type === "goldenGlobeRedCarpet" && (e.date?.year === newDate.year || (e.date as any) === newDate.year)
          );
          if (!hasReceivedCarpetInvite && (artistData.popularity >= 35 || (artistData.actingRoles && artistData.actingRoles.length > 0) || artistData.hype >= 30)) {
            const carpetEmailId = crypto.randomUUID();
            artistData.inbox.push({
              id: carpetEmailId,
              sender: "Hollywood Foreign Press Association",
              subject: "Invitation: Golden Globes Red Carpet",
              body: `Dear ${artistProfile.name},

We cordially invite you to attend the ${newDate.year} Golden Globe Awards and walk the red carpet.

Please accept this invitation by sharing your look for the evening.

Sincerely,
HFPA`,
              date: newDate,
              isRead: false,
              offer: { type: "goldenGlobeRedCarpet", emailId: carpetEmailId },
            });
          }
        }
      }

      // Week 20: Golden Globes Ceremony
      if (newDate.week === 20 && state.goldenGlobeCurrentYearNominations) {
        for (const category of state.goldenGlobeCurrentYearNominations) {
           const winner = category.nominees.sort((a, b) => b.score - a.score)[0];
           category.winner = winner;

           if (winner.isPlayer) {
              const content = `Congratulations ${winner.artistName} for WINNING ${category.name} win! ðŸ† #GoldenGlobes`;
              Object.values(updatedArtistsData).forEach((d) =>
                d.xPosts.unshift({
                  id: crypto.randomUUID(),
                  authorId: "golden_globes",
                  content,
                  image: winner.coverArt,
                  likes: Math.floor(Math.random() * 40000) + 15000,
                  retweets: Math.floor(Math.random() * 10000) + 5000,
                  views: Math.floor(Math.random() * 2000000) + 1000000,
                  date: newDate,
                }),
              );
           }
        }

        for (const artistId in updatedArtistsData) {
            const artistData = updatedArtistsData[artistId];
            const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === artistId);
            
            for (const category of state.goldenGlobeCurrentYearNominations) {
               const nomination = category.nominees.find(n => n.isPlayer && n.artistName === artistProfile?.name);
               if (nomination) {
                   const isWinner = category.winner?.id === nomination.id && category.winner?.artistName === nomination.artistName;
                   if (isWinner) {
                       artistData.popularity = Math.min(100, artistData.popularity + 5);
                   }
                   artistData.goldenGlobeHistory.push({
                      year: newDate.year,
                      category: category.name,
                      itemId: nomination.id,
                      itemName: nomination.name,
                      artistName: artistProfile?.name || "Unknown",
                      isWinner
                   });
               }
            }
        }
        finalState.goldenGlobeSubmissions = [];
        finalState.goldenGlobeCurrentYearNominations = null;
      }

      // --- OSCARS LOGIC ---
      let newOscarNominations: GameState["oscarCurrentYearNominations"] =
        state.oscarCurrentYearNominations;

      // --- Spotify Snapshot Posts ---
      const snapshotCandidates: {
        artistId: string;
        post: XPost;
        streams: number;
      }[] = [];

      for (const artistId in updatedArtistsData) {
        const artistData = updatedArtistsData[artistId];
        const artistProfile = allPlayerArtistsAndGroups.find(
          (a) => a.id === artistId,
        );

        const isDailyMode = state.timeMode === "daily";

        // For songs
        artistData.songs.forEach((song) => {
          const streamCount = isDailyMode
            ? (song.lastDayStreams || (song.actualLastWeekStreams ? Math.round(song.actualLastWeekStreams / 7) : Math.round(song.lastWeekStreams / 7)))
            : song.lastWeekStreams;
          const minStreamThreshold = isDailyMode ? 15000 : 100000;
          const peakStreams = isDailyMode ? (song.peakDailyStreams || 0) : (song.peakWeeklyStreams || 0);

          const isEligible =
            song.isReleased &&
            streamCount >= minStreamThreshold &&
            !song.remixOfSongId;
          if (
            isEligible &&
            streamCount > peakStreams
          ) {
            // Generate daily streams mockup
            const dailyStreams = [];
            const actualSongStreams = isDailyMode ? streamCount : (song.actualLastWeekStreams || 0);
            if (actualSongStreams === 0) return; // Hide snapshots for taken-down or un-streamable songs
            let remain = actualSongStreams;
            for (let i = 0; i < 6; i++) {
              const val = Math.floor(
                (actualSongStreams / 7) * (0.8 + Math.random() * 0.4),
              );
              dailyStreams.push(val);
              remain -= val;
            }
            dailyStreams.push(Math.max(0, remain));

            const songPrev = isDailyMode ? (song.prevDayStreams || 0) : (song.prevWeekStreams || 0);
            const songDiff = actualSongStreams - songPrev;
            const songPct = songPrev > 0 ? (songDiff / songPrev) * 100 : 0;

            const jsonStr = JSON.stringify({
              type: "song",
              songName: song.title,
              artistName: artistProfile?.name || "Unknown",
              coverArt: song.coverArt,
              streams: actualSongStreams,
              totalStreams: song.streams,
              dailyStreams: dailyStreams,
              changeVal: songDiff,
              changePct: songPct,
              isDaily: isDailyMode,
              tracks: [{
                title: song.title,
                dailyStreams: actualSongStreams,
                weekly: actualSongStreams,
                streams: song.streams,
                totalStreams: song.streams,
                changeVal: songDiff,
                changePct: songPct,
              }],
              date: newDate,
            });

            snapshotCandidates.push({
              artistId,
              streams: actualSongStreams,
              post: {
                id: crypto.randomUUID(),
                authorId: "spotifysnapshot",
                content: isDailyMode
                  ? `ðŸ† "${song.title}" by ${artistProfile?.name} has earned its BEST DAY EVER on Spotify!`
                  : `ðŸ† "${song.title}" by ${artistProfile?.name} has earned its BEST WEEK EVER on Spotify!`,
                image: `snapshot:${jsonStr}`,
                likes: Math.floor(Math.random() * 50000) + 10000,
                retweets: Math.floor(Math.random() * 10000) + 2000,
                views: Math.floor(Math.random() * 1000000) + 200000,
                date: newDate,
              },
            });

            if (isDailyMode) {
              song.peakDailyStreams = streamCount;
            } else {
              song.peakWeeklyStreams = song.lastWeekStreams;
            }
          }
        });

        // For albums
        artistData.releases
          .filter(
            (r) =>
              r.type === "Album" ||
              r.type === "EP" ||
              
              r.type === "Compilation" || r.type === "Live Album",

          )
          .forEach((release) => {
            const albumSongs = release.songIds
              .map((id) => artistData.songs.find((s) => s.id === id))
              .filter((s): s is Song => !!s);
            const albumStreams = isDailyMode
              ? albumSongs.reduce((sum, s) => sum + (s.lastDayStreams || (s.actualLastWeekStreams ? Math.round(s.actualLastWeekStreams / 7) : Math.round(s.lastWeekStreams / 7))), 0)
              : albumSongs.reduce((sum, s) => sum + s.lastWeekStreams, 0);
            const actualAlbumStreams = isDailyMode
              ? albumStreams
              : albumSongs.reduce((sum, s) => sum + (s.actualLastWeekStreams || 0), 0);
            const minAlbumThreshold = isDailyMode ? 70000 : 500000;
            const peakAlbumStreams = isDailyMode ? (release.peakDailyStreams || 0) : (release.peakWeeklyStreams || 0);

            if (
              release.isReleased &&
              albumStreams >= minAlbumThreshold &&
              albumStreams > peakAlbumStreams
            ) {
              if (actualAlbumStreams === 0) return; // Hide snapshots for taken-down albums

              const tracks = albumSongs.map((s) => {
                const sPrev = isDailyMode ? (s.prevDayStreams || 0) : (s.prevWeekStreams || 0);
                const sCurr = isDailyMode ? (s.lastDayStreams || (s.actualLastWeekStreams ? Math.round(s.actualLastWeekStreams / 7) : Math.round(s.lastWeekStreams / 7))) : (s.actualLastWeekStreams || s.lastWeekStreams || 0);
                const diff = sCurr - sPrev;
                let pct = 0;
                if (sPrev > 0) pct = (diff / sPrev) * 100;
                return {
                  title: s.title,
                  totalStreams: s.streams,
                  streams: s.streams,
                  dailyStreams: sCurr,
                  weekly: sCurr,
                  changeVal: diff,
                  changePct: pct,
                };
              });

              const jsonStr = JSON.stringify({
                type: "album",
                albumName: release.title,
                artistName: artistProfile?.name || "Unknown",
                coverArt: release.coverArt,
                streams: actualAlbumStreams,
                totalStreams: albumSongs.reduce((sum, s) => sum + s.streams, 0),
                tracks: tracks,
                isDaily: isDailyMode,
                date: newDate,
              });

              snapshotCandidates.push({
                artistId,
                streams: actualAlbumStreams,
                post: {
                  id: crypto.randomUUID(),
                  authorId: "spotifysnapshot",
                  content: isDailyMode
                    ? `ðŸ† "${release.title}" by ${artistProfile?.name} has earned its BEST DAY EVER on Spotify!`
                    : `ðŸ† "${release.title}" by ${artistProfile?.name} has earned its BEST WEEK EVER on Spotify!`,
                  image: `snapshot:${jsonStr}`,
                  likes: Math.floor(Math.random() * 80000) + 20000,
                  retweets: Math.floor(Math.random() * 15000) + 3000,
                  views: Math.floor(Math.random() * 1500000) + 300000,
                  date: newDate,
                },
              });

              if (isDailyMode) {
                release.peakDailyStreams = albumStreams;
              } else {
                release.peakWeeklyStreams = albumStreams;
              }
            }
          });

        artistData.labelSubmissions.forEach((sub) => {
          if (
            sub.status === "scheduled" &&
            sub.release?.type !== "Single"
          ) {
            // Until the album countdown is launched it should be 0
            if (!sub.hasCountdownPage) {
              sub.preSaves = 0;
              return;
            }

            const oldPreSaves = sub.preSaves || 0;
            const popularity = artistData.popularity || 0;

            // Popularity tiers:
            // â€¢ under 10 popularity 3k pre saves a week
            // â€¢ under 20 popularity 5k pre saves a week
            // â€¢ under 50 popularity 10k pre saves a week
            // â€¢ under 75 popularity 25k pre saves a week
            // â€¢ under 100 popularity 50k pre saves a week
            let baseWeeklyPreSaves = 3000;
            if (popularity < 10) {
              baseWeeklyPreSaves = 3000;
            } else if (popularity < 20) {
              baseWeeklyPreSaves = 5000;
            } else if (popularity < 50) {
              baseWeeklyPreSaves = 10000;
            } else if (popularity < 75) {
              baseWeeklyPreSaves = 25000;
            } else {
              baseWeeklyPreSaves = 50000;
            }

            // Hype can also increase it by a small %
            const hype = Math.max(0, Math.min(100, artistData.hype || 0));
            const hypeMultiplier = 1 + (hype * 0.003); // e.g. up to +30% at 100 hype
            const randomizedGain = Math.round(baseWeeklyPreSaves * hypeMultiplier * (0.95 + Math.random() * 0.1));
            const weeklyPreSavesGain = isDailyMode ? Math.max(1, Math.round(randomizedGain / 7)) : randomizedGain;

            sub.preSaves = oldPreSaves + weeklyPreSavesGain;

            const preSaves = sub.preSaves;
            const milestones = [10000, 25000, 50000, 100000, 250000, 500000, 1000000, 3000000, 5000000, 10000000];
            
            let reachedMilestone = 0;
            for (const m of milestones) {
                if (oldPreSaves < m && preSaves >= m) {
                    reachedMilestone = m;
                }
            }

            if (reachedMilestone > 0) {
              snapshotCandidates.push({
                artistId,
                streams: preSaves * 10,
                post: {
                  id: crypto.randomUUID(),
                  authorId: "popcore",
                  content: `"${sub.release.title}" by ${artistProfile?.name} has officially surpassed ${formatNumber(reachedMilestone)} pre-saves on Spotify.`,
                  image: sub.release.coverArt,
                  likes: Math.floor(Math.random() * 50000) + 10000,
                  retweets: Math.floor(Math.random() * 10000) + 1000,
                  views: Math.floor(Math.random() * 1000000) + 500000,
                  date: newDate,
                },
              });
            }

            if (sub.singlesToRelease && sub.singlesToRelease.length > 0) {
              const preReleaseSongs = sub.singlesToRelease
                .map((s) => artistData.songs.find((xs) => xs.id === s.songId))
                .filter((s): s is Song => !!s && s.isReleased);
              if (preReleaseSongs.length > 0) {
                const topPreRelease = [...preReleaseSongs].sort(
                  (a, b) => b.lastWeekStreams - a.lastWeekStreams,
                )[0];
                if (topPreRelease && (topPreRelease.lastWeekStreams > 100000 || (isDailyMode && (topPreRelease.dailyStreams?.[topPreRelease.dailyStreams.length - 1] || 0) > 15000))) {
                  const preDaily = topPreRelease.dailyStreams?.[topPreRelease.dailyStreams.length - 1] || Math.round((topPreRelease.lastWeekStreams || 0) / 7);
                  const displayPreStreams = isDailyMode ? preDaily : topPreRelease.lastWeekStreams;

                  const jsonStr = JSON.stringify({
                    type: "prerelease_streams",
                    albumName: sub.release.title,
                    songName: topPreRelease.title,
                    artistName: artistProfile?.name || "Unknown",
                    coverArt: topPreRelease.coverArt,
                    streams: displayPreStreams,
                    dailyStreams: preDaily,
                    totalStreams: topPreRelease.streams,
                    isDaily: isDailyMode,
                    tracks: preReleaseSongs.map((s) => ({
                      title: s.title,
                      streams: s.streams,
                      dailyStreams: s.dailyStreams?.[s.dailyStreams.length - 1] || Math.round((s.lastWeekStreams || 0) / 7),
                      weekly: s.lastWeekStreams,
                    })),
                    date: newDate,
                  });

                  snapshotCandidates.push({
                    artistId,
                    streams: displayPreStreams,
                    post: {
                      id: crypto.randomUUID(),
                      authorId: "spotifysnapshot",
                      content: isDailyMode
                        ? `"${topPreRelease.title}" by ${artistProfile?.name} received ${formatNumber(displayPreStreams)} streams on Spotify yesterday.\n\nIt was the #1 most streamed pre-release on Spotify.`
                        : `"${topPreRelease.title}" by ${artistProfile?.name} received ${formatNumber(displayPreStreams)} streams on Spotify this week.\n\nIt was the #1 most streamed pre-release on Spotify.`,
                      image: `snapshot:${jsonStr}`,
                      likes: Math.floor(Math.random() * 50000) + 10000,
                      retweets: Math.floor(Math.random() * 10000) + 2000,
                      views: Math.floor(Math.random() * 1000000) + 200000,
                      date: newDate,
                    },
                  });
                }
              }
            }
          }
        });

        // Custom Artist Spotify Data account
        const spotifyDataId = `${artistProfile?.name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "artist"}spotifydata`;
        if (
          artistProfile &&
          !artistData.xUsers.some((u) => u.id === spotifyDataId)
        ) {
          artistData.xUsers.push({
            id: spotifyDataId,
            name: `${artistProfile.name} Spotify Data`,
            username: `${artistProfile.name.replace(/\s+/g, "")}Spotify`,
            followers: Math.floor(Math.random() * 50000) + 10000,
            avatar: artistProfile.imageUrl || "https://via.placeholder.com/150",
            bio: `Tracking all Spotify data and charts for ${artistProfile.name}.`,
            isVerified: "blue",
          });
        }

        if (artistData.releases.length > 0) {
          const topRelease = [...artistData.releases]
            .filter((r) => r.isReleased && r.type.includes("Album"))
            .sort((a, b) => {
              const aStreams = a.songIds.reduce(
                (sum, id) =>
                  sum +
                  (artistData.songs.find((s) => s.id === id)?.lastWeekStreams ||
                    0),
                0,
              );
              const bStreams = b.songIds.reduce(
                (sum, id) =>
                  sum +
                  (artistData.songs.find((s) => s.id === id)?.lastWeekStreams ||
                    0),
                0,
              );
              return bStreams - aStreams;
            })[0];

          if (topRelease) {
            const topReleaseSongs = topRelease.songIds
              .map((id) => artistData.songs.find((s) => s.id === id))
              .filter((s): s is Song => !!s);
            const weeklyStreams = topReleaseSongs.reduce(
              (sum, s) => sum + s.lastWeekStreams,
              0,
            );
            const dailyReleaseStreams = topReleaseSongs.reduce(
              (sum, s) => sum + (s.dailyStreams?.[s.dailyStreams.length - 1] || Math.round((s.lastWeekStreams || 0) / 7)),
              0,
            );
            const displayAlbumStreams = isDailyMode ? dailyReleaseStreams : weeklyStreams;

            if (weeklyStreams > 100000 || (isDailyMode && dailyReleaseStreams > 15000)) {
              const prevWeeklyStreams = topReleaseSongs.reduce((sum, s) => sum + (s.prevWeekStreams || 0), 0);
              const prevDailyStreams = topReleaseSongs.reduce((sum, s) => {
                const prevD = s.dailyStreams && s.dailyStreams.length > 1
                  ? s.dailyStreams[s.dailyStreams.length - 2]
                  : Math.round((s.dailyStreams?.[s.dailyStreams.length - 1] || Math.round(s.lastWeekStreams / 7)) * 0.95);
                return sum + prevD;
              }, 0);

              const comparePrev = isDailyMode ? prevDailyStreams : prevWeeklyStreams;
              let percentChangeStr = "";
              if (comparePrev > 0) {
                 const pct = ((displayAlbumStreams - comparePrev) / comparePrev) * 100;
                 percentChangeStr = ` [${pct > 0 ? '+' : ''}${pct.toFixed(2)}%]`;
              }
              
              let biggestGainerSong: Song | null = null;
              let biggestGainerPct = -Infinity;
              topReleaseSongs.forEach(s => {
                 const sDaily = s.dailyStreams?.[s.dailyStreams.length - 1] || Math.round((s.lastWeekStreams || 0) / 7);
                 const sPrev = isDailyMode
                   ? (s.dailyStreams && s.dailyStreams.length > 1 ? s.dailyStreams[s.dailyStreams.length - 2] : Math.round(sDaily * 0.95))
                   : (s.prevWeekStreams || 0);
                 const sCurr = isDailyMode ? sDaily : (s.lastWeekStreams || 0);
                 if (sPrev > 0) {
                    const sPct = ((sCurr - sPrev) / sPrev) * 100;
                    if (sPct > biggestGainerPct) {
                       biggestGainerPct = sPct;
                       biggestGainerSong = s;
                    }
                 }
              });
              let gainerText = "";
              if (biggestGainerSong && biggestGainerPct > -Infinity) {
                  const gainerCurr = isDailyMode
                    ? (biggestGainerSong.dailyStreams?.[biggestGainerSong.dailyStreams.length - 1] || Math.round((biggestGainerSong.lastWeekStreams || 0) / 7))
                    : biggestGainerSong.lastWeekStreams;
                  gainerText = `\n\nâ€”"${biggestGainerSong.title}" was the biggest gainer, ${biggestGainerPct > 0 ? 'up' : 'down'} ${Math.abs(biggestGainerPct).toFixed(2)}% with ${formatNumber(gainerCurr)} streams!`;
              }
              
              const jsonStr = JSON.stringify({
                type: isDailyMode ? "album" : "album_weekly",
                albumName: topRelease.title,
                artistName: artistProfile?.name || "Unknown",
                coverArt: topRelease.coverArt,
                streams: displayAlbumStreams,
                dailyStreams: isDailyMode ? displayAlbumStreams : undefined,
                weeklyStreams: !isDailyMode ? displayAlbumStreams : undefined,
                isDaily: isDailyMode,
                totalStreams: topReleaseSongs.reduce(
                  (sum, s) => sum + s.streams,
                  0,
                ),
                tracks: topReleaseSongs.map((s) => {
                  const sDaily = s.dailyStreams?.[s.dailyStreams.length - 1] || Math.round((s.lastWeekStreams || 0) / 7);
                  const sPrev = isDailyMode
                    ? (s.dailyStreams && s.dailyStreams.length > 1 ? s.dailyStreams[s.dailyStreams.length - 2] : Math.round(sDaily * 0.95))
                    : (s.prevWeekStreams || 0);
                  const sCurr = isDailyMode ? sDaily : (s.lastWeekStreams || 0);
                  const diff = sCurr - sPrev;
                  let pct = 0;
                  if (sPrev > 0) pct = (diff / sPrev) * 100;
                  return {
                    title: s.title,
                    streams: s.streams,
                    weekly: s.lastWeekStreams,
                    dailyStreams: sDaily,
                    changeVal: diff,
                    changePct: pct
                  };
                }),
                date: newDate,
              });
              snapshotCandidates.push({
                artistId,
                streams: displayAlbumStreams,
                post: {
                  id: crypto.randomUUID(),
                  authorId: "spotifysnapshot",
                  content: isDailyMode
                    ? `"${topRelease.title}" by ${artistProfile?.name} received ${formatNumber(displayAlbumStreams)} streams on Spotify yesterday${percentChangeStr}.${gainerText}`
                    : `"${topRelease.title}" by ${artistProfile?.name} received ${formatNumber(displayAlbumStreams)} streams on Spotify this week${percentChangeStr}.${gainerText}`,
                  image: `snapshot:${jsonStr}`,
                  likes: Math.floor(Math.random() * 20000) + 5000,
                  retweets: Math.floor(Math.random() * 5000) + 1000,
                  views: Math.floor(Math.random() * 500000) + 100000,
                  date: newDate,
                },
              });
            }
          }

          // Popular tracks crossover
          const popularTracks = [...artistData.songs]
            .filter((s) => s.isReleased)
            .sort((a, b) => b.lastWeekStreams - a.lastWeekStreams)
            .slice(0, 10);
          if (
            popularTracks.length >= 2 &&
            (popularTracks[0].lastWeekStreams > 100000 || isDailyMode)
          ) {
            const track1Daily = popularTracks[0].dailyStreams?.[popularTracks[0].dailyStreams.length - 1] || Math.round((popularTracks[0].lastWeekStreams || 0) / 7);
            const track2Daily = popularTracks[1].dailyStreams?.[popularTracks[1].dailyStreams.length - 1] || Math.round((popularTracks[1].lastWeekStreams || 0) / 7);
            const displayPop1 = isDailyMode ? track1Daily : popularTracks[0].lastWeekStreams;
            const displayPop2 = isDailyMode ? track2Daily : popularTracks[1].lastWeekStreams;

            const jsonStr = JSON.stringify({
              type: "popular_tracks",
              artistName: artistProfile?.name || "Unknown",
              isDaily: isDailyMode,
              tracks: popularTracks.map((s) => ({
                title: s.title,
                coverArt: s.coverArt,
                weekly: s.lastWeekStreams,
                dailyStreams: s.dailyStreams?.[s.dailyStreams.length - 1] || Math.round((s.lastWeekStreams || 0) / 7),
                streams: s.streams,
              })),
              date: newDate,
            });
            snapshotCandidates.push({
              artistId,
              streams: displayPop1,
              post: {
                id: crypto.randomUUID(),
                authorId: spotifyDataId,
                content: `'${popularTracks[0].title}' is the #1 most popular song by ${artistProfile?.name} on Spotify.

${isDailyMode ? 'Daily' : 'Weekly'} streams:
#1. ${popularTracks[0].title} - ${formatNumber(displayPop1)}
#2. ${popularTracks[1].title} - ${formatNumber(displayPop2)}`,
                image: `snapshot:${jsonStr}`,
                likes: Math.floor(Math.random() * 15000) + 3000,
                retweets: Math.floor(Math.random() * 3000) + 500,
                views: Math.floor(Math.random() * 300000) + 60000,
                date: newDate,
              },
            });
          }
        }
      }

      
      // SPOTIFY SNAPSHOT: TOP ALBUMS
      if (isDailyMode || newDate.week % 2 === 0) {
          const streamingAlbums = [...allAlbumContenders].sort((a, b) => (b.weeklyStreams || 0) - (a.weeklyStreams || 0));
          const top15Streaming = streamingAlbums.slice(0, 15);
          
          if (top15Streaming.length > 0 && top15Streaming[0].weeklyStreams > 0) {
              const top15Data = top15Streaming.map((a, i) => {
                  const dailyAStreams = Math.round((a.weeklyStreams || 0) / 7);
                  return {
                      rank: i + 1,
                      albumName: a.title,
                      artistName: a.artist,
                      coverArt: a.coverArt,
                      weeklyStreams: isDailyMode ? dailyAStreams : (a.weeklyStreams || 0),
                      dailyStreams: dailyAStreams,
                      // mock a change pct for now since we don't have historical streaming data
                      changePct: (Math.random() * 20) - 10,
                      previousRank: (i + 1) + Math.floor(Math.random() * 3) - 1,
                  };
              });
              
              const jsonStr = JSON.stringify({
                  type: isDailyMode ? "daily_top_albums" : "weekly_top_albums",
                  date: newDate,
                  topAlbums: top15Data,
                  isDaily: isDailyMode,
              });
              
              // We want to add this post to the player's feed, but who's the active artist?
              // Let's add it to the active artist's feed so the player sees it.
              const activePlayerId = state.activeArtistId;
              if (activePlayerId && updatedArtistsData[activePlayerId]) {
                  updatedArtistsData[activePlayerId].xPosts.unshift({
                      id: crypto.randomUUID(),
                      authorId: "spotifysnapshot",
                      content: isDailyMode
                        ? `Top 15 Most Streamed Albums of the Day on Spotify! ðŸ“Š\n\n#1. ${top15Data[0].albumName}\n#2. ${top15Data[1]?.albumName}\n#3. ${top15Data[2]?.albumName}`
                        : `Top 15 Most Streamed Albums of the Week on Spotify! ðŸ“Š\n\n#1. ${top15Data[0].albumName}\n#2. ${top15Data[1]?.albumName}\n#3. ${top15Data[2]?.albumName}`,
                      image: `snapshot:${jsonStr}`,
                      likes: Math.floor(Math.random() * 100000) + 20000,
                      retweets: Math.floor(Math.random() * 20000) + 5000,
                      views: Math.floor(Math.random() * 2000000) + 500000,
                      date: newDate,
                  });
              }
          }
      }
      
      // Add top 2 Snapshot posts per artist
      const artistSnapshots: Record<string, any[]> = {};
      snapshotCandidates.forEach((candidate) => {
         if (!artistSnapshots[candidate.artistId]) {
            artistSnapshots[candidate.artistId] = [];
         }
         artistSnapshots[candidate.artistId].push(candidate);
      });

      for (const artistId in artistSnapshots) {
         artistSnapshots[artistId].sort(
           (a, b) =>
             (b.streams || 0) +
             (b.sales || 0) * 150 -
             ((a.streams || 0) + (a.sales || 0) * 150),
         );
         artistSnapshots[artistId].slice(0, 2).forEach((candidate) => {
           if (updatedArtistsData[candidate.artistId]) {
             updatedArtistsData[candidate.artistId].xPosts.unshift(candidate.post);
           }
         });
      }

      // Week 1: Oscar Submission Email & Pop Crave Logic
      if (newDate.week === 1) {
        // 50% chance to create Pop Crave account each year if it doesn't exist
        for (const artistId in updatedArtistsData) {
          const artistData = updatedArtistsData[artistId];
          if (!artistData.xUsers.some(u => u.id === "popcore")) {
            artistData.xUsers.push({
              id: "popcore",
              name: "Pop Core",
              username: "TheePopCore",
              avatar: "https://ui-avatars.com/api/?name=Pop+Core&background=E8115B&color=fff",
              isVerified: true,
              bio: "The pulse of pop culture. Charts, trends, and records.",
              followersCount: 2300000,
              followingCount: 15,
            });
          }
          if (
            !artistData.xUsers.some((u) => u.id === "popcrave") &&
            Math.random() < 0.5
          ) {
            artistData.xUsers.push({
              id: "popcrave",
              name: "Pop Crave",
              username: "PopCrave",
              avatar:
                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSI4IiBmaWxsPSIjMkIzRUREIi8+PHBhdGggZD0iTTI0IDIwaDE2djI0SDI0VjIweiIgZmlsbD0iI0ZGRiIvPjwvc3ZnPg==",
              isVerified: true,
              bio: "Trending news and celebrity gossip.",
              followersCount: 1550000,
              followingCount: 0,
            });
          }
        }

        for (const artistId in updatedArtistsData) {
          const artistData = updatedArtistsData[artistId];
          const artistProfile = allPlayerArtistsAndGroups.find(
            (a) => a.id === artistId,
          );
          const hasOscarEmailThisYear = artistData.inbox.some(
            (e) =>
              e.offer?.type === "oscarSubmission" &&
              e.date.year === newDate.year,
          );

          if (artistProfile && !hasOscarEmailThisYear) {
            const eligibleSongs = artistData.songs.filter((s) => {
              const release = artistData.releases.find(
                (r) => r.id === s.releaseId,
              );
              return (
                s.soundtrackTitle &&
                release &&
                release.releaseDate?.year === newDate.year - 1
              );
            });
            const eligibleRoles = (artistData.actingRoles || []).filter(
              (r) =>
                (r.year === newDate.year - 1 || !r.year) &&
                (r.status === "Released" || r.status === "Completed")
            );

            if (eligibleSongs.length > 0 || eligibleRoles.length > 0 || (artistData.actingRoles && artistData.actingRoles.length > 0)) {
              const emailId = crypto.randomUUID();
              artistData.inbox.push({
                id: emailId,
                sender: "The Academy",
                senderIcon: "oscars",
                subject: `Submit for the ${newDate.year} Academy Awards`,
                body: `Hi ${artistProfile.name},

The submission window for the ${newDate.year} Academy Awards is open. Please submit your eligible soundtrack releases and acting roles from last year.

- The Academy of Motion Picture Arts and Sciences`,
                date: newDate,
                isRead: false,
                offer: { type: "oscarSubmission", emailId, isSubmitted: false },
              });
            }
          }
        }
      }

      // Week 5: Determine Oscar Nominations
      if (newDate.week === 5 && (state.oscarSubmissions?.length || 0) > 0) {
        const categories: OscarCategory["name"][] = ["Best Original Song", "Best Actor/Actress", "Best Supporting Actor/Actress", "Best Voice Actor/Actress"];
        const newNominations: OscarCategory[] = [];

        for (const categoryName of categories) {
            const contenders: OscarContender[] = [];
            const playerSubmissions = (state.oscarSubmissions || []).filter(s => s.category === categoryName);
            
            for (const sub of playerSubmissions) {
              const artistData = updatedArtistsData[sub.artistId];
              const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === sub.artistId);
              if (!artistData || !artistProfile) continue;

              let score = 0;
              let coverArt: string | undefined = undefined;

              if (categoryName === "Best Original Song") {
                  const song = artistData.songs.find(s => s.id === sub.itemId);
                  if (song) {
                      score = (song.quality * 50) + (song.streams / 1000000) + 500;
                      coverArt = song.coverArt;
                  }
              } else {
                  const role = (artistData.actingRoles || []).find(r => r.id === sub.itemId);
                  if (role) {
                      score = artistData.popularity + ((role.rating || 50) * 3) + 300;
                      coverArt = role.coverUrl;
                  }
              }

              contenders.push({
                  id: sub.itemId,
                  name: sub.itemName,
                  artistName: artistProfile.name,
                  isPlayer: true,
                  score,
                  coverArt
              });
            }

            // NPC contenders
            if (categoryName === "Best Original Song") {
                const npcSongsForOscars = [...newNpcsList].sort((a, b) => b.basePopularity - a.basePopularity).slice(0, 10);
                npcSongsForOscars.forEach((song) => {
                  contenders.push({
                    id: song.uniqueId,
                    name: song.title,
                    artistName: song.artist,
                    isPlayer: false,
                    score: (song.basePopularity / 1000000) * 8 + (Math.random() * 200),
                    coverArt: song.coverArt || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.artist)}&background=random&color=fff&size=250`,
                  });
                });
            } else {
                for (let i = 0; i < 6; i++) {
                     const npcName = getRandomNpcName(state.npcs.map(n => n.artist), newDate.year);
                     contenders.push({
                         id: "npc-" + Math.random(),
                         name: "NPC Film",
                         artistName: npcName,
                         isPlayer: false,
                         score: Math.random() * 200 + 100,
                         coverArt: `https://ui-avatars.com/api/?name=${encodeURIComponent(npcName)}&background=random&color=fff&size=250`
                     });
                }
            }

            contenders.sort((a, b) => b.score - a.score);
            const nominees = contenders.slice(0, 5);
            if (nominees.length > 0) {
                newNominations.push({ name: categoryName, nominees });
            }
        }

        newOscarNominations = newNominations;
        finalState.oscarCurrentYearNominations = newNominations;

        for (const category of newNominations) {
            let postContent = `The nominees for ${category.name} at the ${newDate.year} #Oscars have been announced:
`;
            postContent += category.nominees.map((n) => `â€¢ ${n.artistName} - "${n.name}"`).join("\n");

            Object.values(updatedArtistsData).forEach((d) =>
              d.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: "popbase",
                content: postContent,
                likes: Math.floor(Math.random() * 50000) + 10000,
                retweets: Math.floor(Math.random() * 10000) + 5000,
                views: Math.floor(Math.random() * 1000000) + 500000,
                date: newDate,
              }),
            );
        }

        // Notify players
        for (const artistId in updatedArtistsData) {
            const artistData = updatedArtistsData[artistId];
            const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === artistId);
            
            let gotNominated = false;
            const nominatedCategories: string[] = [];
            for (const category of newNominations) {
                if (category.nominees.some(n => n.isPlayer && n.artistName === artistProfile?.name)) {
                    gotNominated = true;
                    nominatedCategories.push(category.name);
                }
            }

            if (gotNominated) {
                artistData.popularity = Math.min(100, artistData.popularity + 5);
                const hasPerformanceOffer = nominatedCategories.includes("Best Original Song") && Math.random() < 0.5;

                let body = `Dear ${artistProfile?.name},

Congratulations! The Academy is pleased to announce your nomination for ${nominatedCategories.join(", ")}.`;
                if (hasPerformanceOffer) {
                    body += `

Additionally, we would be honored to have you perform at the ceremony. Please respond to accept.`;
                }
                body += `

Sincerely,
The Academy`;

                const emailId = crypto.randomUUID();
                artistData.inbox.push({
                    id: emailId,
                    sender: "The Academy",
                    senderIcon: "oscars",
                    subject: "Congratulations! You're an Oscar Nominee!",
                    body,
                    date: newDate,
                    isRead: false,
                    offer: {
                        type: "oscarNominations",
                        emailId,
                        hasPerformanceOffer,
                    },
                });

                // Also invite to Oscars red carpet
                const oscarCarpetEmailId = crypto.randomUUID();
                artistData.inbox.push({
                    id: oscarCarpetEmailId,
                    sender: "The Academy",
                    senderIcon: "oscars",
                    subject: "Invitation: Oscars Red Carpet",
                    body: `Dear ${artistProfile?.name || 'Artist'},

Congratulations on your nomination. We cordially invite you to walk the red carpet at the ${newDate.year} Academy Awards.

Please accept this invitation by sharing your red carpet look for the evening.

Sincerely,
The Academy of Motion Picture Arts and Sciences`,
                    date: newDate,
                    isRead: false,
                    offer: {
                        type: "oscarRedCarpet",
                        emailId: oscarCarpetEmailId,
                    },
                });
            }
        }
      }

      // Week 8: Additional Oscars Red Carpet invitations for notable artists / actors
      if (newDate.week === 8) {
        for (const artistId in updatedArtistsData) {
          const artistData = updatedArtistsData[artistId];
          const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === artistId);
          if (!artistProfile) continue;
          const hasReceivedCarpetInvite = artistData.inbox.some(
            (e) => e.offer?.type === "oscarRedCarpet" && (e.date?.year === newDate.year || (e.date as any) === newDate.year)
          );
          if (!hasReceivedCarpetInvite && (artistData.popularity >= 35 || (artistData.actingRoles && artistData.actingRoles.length > 0) || artistData.hype >= 30)) {
            const oscarCarpetEmailId = crypto.randomUUID();
            artistData.inbox.push({
              id: oscarCarpetEmailId,
              sender: "The Academy",
              senderIcon: "oscars",
              subject: "Invitation: Oscars Red Carpet",
              body: `Dear ${artistProfile.name},

The Academy cordially invites you to attend the ${newDate.year} Academy Awards ceremony and walk the official red carpet.

Please share your red carpet look for the evening.

Sincerely,
The Academy of Motion Picture Arts and Sciences`,
              date: newDate,
              isRead: false,
              offer: {
                type: "oscarRedCarpet",
                emailId: oscarCarpetEmailId,
              },
            });
          }
        }
      }

      // Week 10: Oscar Ceremony
      if (newDate.week === 10 && state.oscarCurrentYearNominations) {
        for (const category of state.oscarCurrentYearNominations) {
          if (category.winner) {
            const winner = category.winner;
            const content = `The Oscar for ${category.name} goes to... "${winner.name}" by ${winner.artistName}! #Oscars`;
            Object.values(updatedArtistsData).forEach((d) =>
              d.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: "popbase",
                content,
                image: winner.coverArt,
                likes: Math.floor(Math.random() * 100000) + 50000,
                retweets: Math.floor(Math.random() * 20000) + 10000,
                views: Math.floor(Math.random() * 5000000) + 2000000,
                date: newDate,
              }),
            );
          }

          for (const artistId in updatedArtistsData) {
            const artistData = updatedArtistsData[artistId];
            const artistProfile = allPlayerArtistsAndGroups.find(
              (a) => a.id === artistId,
            );
            const nomination = category.nominees.find(
              (n) => n.isPlayer && n.artistName === artistProfile?.name,
            );
            if (nomination) {
              const isWinner = category.winner?.id === nomination.id;
              if (isWinner)
                artistData.popularity = Math.min(100, artistData.popularity + 10);
              artistData.oscarHistory.push({
                year: newDate.year,
                category: category.name as any,
                itemId: nomination.id,
                itemName: nomination.name,
                artistName: nomination.artistName,
                isWinner,
              });
            }
          }
        }
        finalState.oscarSubmissions = [];
        finalState.oscarCurrentYearNominations = null;
      }

      // --- COACHELLA LOGIC ---

      // Week 10: Coachella Invitations
      if (newDate.week === 10) {
        for (const artistId in updatedArtistsData) {
          const artistData = updatedArtistsData[artistId];
          const artistProfile = allPlayerArtistsAndGroups.find(
            (a) => a.id === artistId,
          );

          if (
            artistProfile &&
            (artistData.contract || artistData.monthlyListeners >= 10000000)
          ) {
            const autoSubmit = !!artistData.manager?.autoSubmitCoachella;
            artistData.coachella = {
              year: newDate.year,
              status: autoSubmit ? "submitted" : "invited",
            };
            const emailId = crypto.randomUUID();
            artistData.inbox.push({
              id: emailId,
              sender: "Coachella Booking",
              senderIcon: "coachella",
              subject: `Coachella ${newDate.year} Lineup Submissioxœì½ÛnI² ø®¯p±uJ™UTŠd«Õ¬fñP%±‹9$U—Q	Rdf­ÌˆìˆHQ,5ƒ}ØÅ.°8˜™Åàì`,ØàÌóîûþIÿÀö'¬™¹{„_Ì##©[uwew‰™~57·››™§Å‹åkÂúô³áÅ†ˆfev<ëO’Òy-Ä–xñ07ÞDy™åaž&ã¸—F“ørùÚµïbå±H³s1Íãi”'é™(G±'i<›ŠÓ,§Ÿ7Þ¤ñù½¨Œ{q”_Š,Œâñ8ßFãq|!ÍŠd ¢t(¶ó²÷ã¢L^Eãžø!›åb¥ÑYœ‹QTÐX'Q™ â…(hÔe<²`çI4.¨çHÓ¬Yj©wíÚá8Ž
toˆ“QRø?ü‚òg³(Ò2ŽEv*¦ãhOâ´\ý¾Íã?Ì``Ôö K‹dç0’,…Fos:‰£É’’waÒCA*03‘Î&ý8/–Åy,Î³Ùxý½ŒE™‰$}•”1Æ_Îª.þ#ìNÄ}™Gq44ÑÛ-‘žÆù†xã-Vy1…v—º÷,¸äV"žDÉxoè¿HŠcšM¸´\v¿2~_^s¿]^S_nßßÅñK±º¶!dãaœŠã¬ê¦( |…*šœŠŽÆ™s¬³¹¹	õºÆ¬ô„=¬açÞÖ_Ì¦Þá6=* ¨kÊ¬oÅ&Så©nñÙW^UØÏ»ãä,éã£lÐ@§n®JØòÍ'ŸþMo§gåH|-Vºâ´(²ôÌ­JÏàßIÜþ¾ø}–Ë<¼<IÊqÜõšÉcÂm·%ýX6–cc¹ÑØ^zšu­õÄ•p§ÜõO‚F!@d_LË¬;h˜Mž<Ù»×±Å1¨$íg¯{³´%§eÇGìÐ1ˆ´Eœq?,=Ì€¸žgÙPÜÏò89KÅa…Ø.ŠlÐîd6‰ßÇƒê‡PR<úv0¹Ú’- Qyxÿp[’sñW[Ò ÕŽ&‡³é ›àK«Çíó(=¡h’"^D÷b|ÔwBd²„e|•`³@ó—bÛHwjÊs
¬ˆy$;á9£éÐljð1ãh @—­¹
q©éï1Ài€ðøùÓ‹ÅBmàŒ‡ãè"ÎUýítø ÏfÓ¢wš¤ÃŽ§v2ì¤!ÍHwcB élk«	c;VhÇÜ2½¢ŒÊYAÝ.U’Í’Ù±ƒ3ã¸²àÌPÙq¾$þ(–&Éþ˜=}Ë`ßáËÍêëW^cÓvIyœü„`[ñßcEØn@6 cRþ(€âÅ ÈxhEÆ˜ç4›ÎÆ Ø”âëMñëŸôéù›sqi9BçEå¨w:Î²¼C_%ÑìtÅ§¢³¶"?â–X_§o@é?Óßín.N áhœÀzãüïzè0òÏë~Åq¯­7[¢KÓÈGºªº¶®ÇIßØaòœ/£ñÐv½Y¡Ç§´–N¢‹1P—ãs`s]\º_déàÿýoÜ;d1HàÒ!÷ö`‚y2x)ö£IÄÉ|Kw£¡¸;KÓîåQ2ŠÒ4ò^=saZÃœÝÂØkº¸PòAÔˆRnu%Eu½V¼a·FZwÜlÕNóñàGÍÎâÇ !`Ž³4ËQòOK:ˆá&µ¬éE×nâD<ÊúÈŽñ©ÓJµYÌ¦pç:ÌÊ!ÌÔš8*óV­È}äï‡Ù¤šQ{Ž °å«ù5¬õ©´¨iâ›|-jÒ$å åd¿bvœ•'ñë’ày¸ûx÷¨…@i¼»ÈÚ­<ÜÝ¾·¿'Z¹µ¶BnkMkl4öhïÞ­“=lëÎ­ÕEšªÚhìøÑöþ>´u¼p":ŸßZ¯Ûóà‚b/Ôal[®q å	èøCTÈ±*êæ/QF.G‘ü5Š^Å¢ƒ \´&ËNã$1vKCœs	×Aƒ—Å¢t‹{q	be±qíÏÿôŠc˜ÚTÐS¼”Oq±é±^uùüp^ÜxCÍ•ÉÆÐ©q±{yjU0Ô’É–x-HÜ$eÜxS£âåé’ÎÒ¥67ÈiJÑ¾ˆË1@æ?ÎÎ{J^èçR<’õ#PEbuå`	2x‚)H4q4)H-("T;£Ó2ÎeóÓ<×mËÄÝ,{‰ã%…³Äksž.7#O‘kPã”çkg>Àž±e²Ðƒ¥>Ví@¦¬G
ëÉÁìLkŠ_LkŽ/‚Šø†ã¿eakÐ¼’‘ˆUÕZÛ‡*åhQAûJ®óVî¯j®¬I¢¶FõÀ,ÞÚÈ´nê&™øDœ€ê2Ú'h¨=™îý-èÍüÞÇýµ=îÏ&‚ŒgZãúßŸÖ(û&CÏí²ñfˆ",¦Nâ¾¡Ñ˜É­ùÔà¯Ë’3.k®¶\QŠg@ŒãÙ0.:r5ˆ-VI{ö€ZéøBn0‰+õô%ÖÐ¶Á…W8ˆ¨ƒ&Ù¡&Ç@ßM¶æ¨å,x]õ§²Eâ0¨oBXÇIÄ)âÓg]iñs ÑÍ¥„q&¶ÕC:!In»—%4*ªâü‚¹P4â¯{#ÙÇºÔ.v“¡kÈWÕ`*¬—Mž<èÎ>ØŽ˜ì€0ã~žMÂ’‹BØ·Ó˜¶Ç´e±µœã¹R*¢~‘g%Zy2›LG×LL¿«F²WÌÁHY>$‰AÙƒ±%XÎdDcÁ?Âñö°m ™b¥–CoE‰–èe `ã”ÍÁ¬(¡‰Œ GüG;å²4^¢¥¹Ã¢ýÙ»Pè‚„}F3Í3§}NA…™‘0×Ã\ê0í.ÉaÀr@¹×4âï8w}N¤ ðI5}šÅ˜¤+š
¨[Ì¢H¦üFôz=µ¾Å’ÔÜ·1£†6gHETØ°vW
ÅšgxX¾áuž½Möæ\F¸„ÈÏ3W‹6¿_…5©Ý ®Mf<NÕô)ŽQa’¥ñ…ølsž¾:×6@Øx\"e^btÆ¹&UC‘tFk¶œBi–{„4À¹})¾ÙÐÑèaè…D­ýµòKàt/˜ñ8m*Æˆ
	•É	¯34ü„ŽŠZr‚hVŽ²|
/M³i6†·¹€Þ—qŠÔœWpaæz
—
ªGC’	
ÈÞö3	¥†åÌsBVí	Tãìjøi°|5À7±áç«XU†uwêH|‹¦A¬’YÍn_à·<.IpolCÚp•åÎmáUŸÏ©.­Öº¿‰½ì²ë .¨mËócŠ:»V:^‘Ò!•u-.r2¡–„L«\ƒEKë¿¦ÍÎoŒ:§£cÜ,ŽcK7¥qóR2Ç´ôØ0Þ;;žé¿µT½|±®íVV:Ë«½à‡¶é†1a¯Àh6é§À¿6B»`«÷tåvT–ÓbãöíDî CÓqTŒ`&·§£¬Ìn­®¯~±¾ÿû|õËÕ[¿Ž¾ør¸ú›ÁðÎêo¶Î7ï¬¬x”Fq}’e5Õ+7wWï4nŸ–ûOøq‚0ÐÂÓgþÎ$ñâ^ñh€'ñ˜ˆoXœîÏ†g1P_o˜Eã¤Éø7Î«Ë0Ó ¥§#ë<yEd–fƒÃ­[·Äö£íBì<ØÛÁŸê
  ‰íIôOüéd ø vZ†â§KÑ$Ú™å9 öØ8F©¥g†FL:îË~å?Ö>ß@khŒ5Æ¡	£´aÔ¨:ð¬kŸ›:wÕ¿é1ç½Ï»LKRèÖ jZ:Ëò‹§ÏpÁŒEPöŽªDÛ$ÉJÆº-Iú…>\(("Ü,\[zŸ‹ye¤®|}LZKè­T0%•º½‚	Áv9Ì¦j8Mp<ïq@×“é­‡óú¨
5ô£Ë4ôuôÉÝæ~¨@Cø¾¡ý}Àš´¹U¤¡Y¢¡—l–– ›6öSjèI—i‚X6x9dT¢	fX ¡‹{È[nï¢êžg)`¦×Ý3ƒVÍ±Í‘­È5¥=ŒsµMõOocK2y§y|?—±é¥‘ÎÆhóÁ?n…¤ 8èí¥Hµõ‹!4æ—’pðË9ª©-Ê0©m½@ï<Ûô¨ª×	j8&ÏæÞ–º¦ˆn‹ë> Ê|fA íÄ<J÷>çEHÜõz”6ÈìR(d¸*$–ñ^×XnÒæEvXÎÍ™\ `kc¢UŸºÐ	4 øÓ¼Û7DŸiŸ¶l€(:Ó„|Þ²E¬™fô›¶ÓzÌÍ·lÂ%Ù6·i¯8s‚3¥#"S˜Ûäe¸SjÖ96*ºÒyPáŒæà¤ú‡ÁOŠY_yÖÛ#á:æAkZc>ãôÝ·9'óOÊÌîl5„;ë0ªÅuk(]â“I:cÝOYðiLŠoA²|JvëýÐùŠ¶€[6…ÊKœ€#ïJÇq@Ð&¾òíy}ãÈTëþˆD5c]%ê4ÇÊÍ *êmiq[\\ÒŽŸKë·áxè’OÆÛPŒwQüÌ|>Þ›wÃ¸=éLÄêVÐÊT[Ñ[ðä¸Ô u|ßÓþ$·Å*ã¬¹0Œ9Ä¤ê,B*‰‘÷1­=áX—CR´aï|2l1N	³D–ed‹ºïà@Àlvco8þPzñlòx:¨Df$Ï«ë.»˜³ÁQ·ž¨HáŒ¦WŒ“AÜYYö;úT¬»ÆÞpi¯$Ð÷Ýh0êtèqÓÏüE6—ùE:<¿ñFž>ÊÇ¾ûL]E­¸Qš=S«-ËÍÒä³˜[qsÍeÙ’³â‡]ÙÖƒÚºg¿BTh$’Q2¥U~}‹ï’r¤N÷>ü2K‚ò®V™ÈOÛE6
7­1k·ÄTôÃ­°÷ÈFšPÅq\úì×ÜÙ«Ö›DÓN%¹HPù#³¸G:uó>¾Ô›½ZêË_ë«íùªÕyÈÐ´þ-36zc³, NIF.xüÑñd³‰¿†S‘å%@vYô	¦ýžäÑ·`%é›ÕˆbhI) Ñl¨^@—è
V4¢Odj-¿z)Á-$ÿS	Õ‘ûü<IS4÷è÷OWœ“…°×_õÕ3¯‹MgÔu 3Eããf[:S3‡ý­9ùñ]6ÁÅê¥w:ŽÊGHo ¨CøÛÓëÚuÊJ¥ñŠÂß^½íŒQZÇ‘~üš7F‘ë°×JÑòÜGî£n!äÑdr!qšA¡z0‚ÊC\+:²Å…—šªè<)àßý o‰½Gžßùâ×¿ql1¶Ò×ÃðÙ(Oã!u(û«GÝè†Ò\5 +´ÿl–fHž.ú9³È£ì¢»ÕSu+”Û£dÂ;^/’‚w°n×v‡¼º—o6ÄR9Š?ú¨"„ß¡{×¦Å5†¬bû©qÞ†­Ö¿MŸÑ
 Šd´%sz®D€¬À$o¼ñÖáRR+btŒûÕƒ£íG~À‚jØ—½|ßª“d°ÀBÒ9µk˜œ[áI>æê˜§ã¯àßÜ±:,â©³€×¦á­SmKÆ®òØñÖˆÑåÈ§†¨_bþaù¯ÍÃr†ó·òV¡#{}bï·ÑâÌ­òWùœõW™Ià+¦ÖOÞÚ¡bè`¯¸Âéª?€fƒ	³7?Ÿ7ÚÔ*×gÃ[B;?Ûàù­Xé­Û•Íè¥{è¹Êm¸ˆTÂxip×…ŠgšJGJô"RÜØå=j3Pê“íIœ'è>+,dÐÿÆµkÎž÷SIÛškòæ¢Ú&ëÊnÒ`4àÕµŠU×vgìg®9@ùÙ¦ºñF÷®än‰%¢k•¹ärÉ©‹€*ß„»¶®öQu|m{8Lp†è`e¤„éÇb„‘˜r©(Æ=€°2\žAœÇ“,½¨Ò.äq1ÍRªSb>éÐ‹M),ë0 C¦vFŽóž·|õèŽžÐízˆ¼àPù#Z‰%›C¡@ffJTù3¼óC6»™“kyåÇ×}_Ÿ÷ý¤ýª"K9XZ® ÃR&êˆY0@ª(ŸÆåîûX9·õ¸„{&@ÚMG°}ä`Øe›—
—?~=HTL§…p_Ò&Â=: Nä¶„m‡ÄòfAcè‘OË]¤0€‹lVŽ1„‹¢`«S”Î>‚UZÖÙäÏ
t
Ôz¿)+E%*ÉX«!Š‘L_%#²ì%er¢=û^‘óH¯vš>
¼u4ÜÚ:-¨Â±£Èž*ÅÆ·­­£5Çó,Wq¡ìt‘ìcÐž4ð‚ò¨ÏUiŽ¾jQÝ2â/úçÿ±âø…ÁÇSÝ7o¼‘ßk†vSücõ°Vb{yL9Ã:·,nŸ-‹¥¥î¥øÃhëõ^Eãð\Æ’P3þ!Ãº‡ïGÎyÅWRöUæ/´ ºú6³é}Ùpð–ç[‹KÌÒ)k¢ú6¿ÞÅö·L™ÚÄQoF-£²Gô©´%µ°$Í=±OŒ3r€Iñ"@þ±	Ò–; ºqãwZ«ûàNlÕËðÃèfá¦`ƒù…}[vX×ƒß¥*Â?'?ë†0³ºhèØ Mø›^aQõð!°±@óÏ‚Âü¹Að8º´Xz’¢€Â…âk<XìL¹þ0ÛÞ?æB´5“N™®7üÝ£½“ã;ü]À°?|Þµvˆö<âW-x^±°Oü*ãChtŠw
\Å+á5Ç-¾_!¿x³ÊÕã±…¤‰·r~—p>J
”¬a…Ù×w1‘jí‡ïÁ—äô>àÞEÁ7è\Î¾1Ÿ!Ïgº5Ì‚bO¾Ÿ Çì‘kÅ„äÇúœØÍÇY™ÙK<«•×]ƒ{³Hì'Ós<Œrt//Æ1j©KÛÃxã—c €“Ÿ.ðë½è=Úaå0ˆ8vÜ¼Q•ŠÎ¢$íõ¨`4~’¶P«; åŒñýÎ÷øë„ê"šˆãIRŽìÖv‡âxÇ <QÕl<Ä3\>@¸<ÊÒ—ñ5|˜¤/£•³¸°UÌ¥ýøTºh‡	>'¯’ö£ly?)1í8™üD³LŠÁ8+fy,»gâ0Ê_Ç-]ÔíM1ÏG¶Lƒ“ºfü®3µÕ+i„·×žã‘ì7çm1vT®÷¯ß³ã¹–änÅÍÊOÎÛÒ\#°Uwá6Ü}Ïµ;ö(ßˆIØ‰DÍu5í`ë¦ýæºŠºpukúÒØ„C†òÒu™Ê;qÓåeù_ütß»Ÿn½ã|QøÐææÀóf²sÉ¿@æ¡.ZµÓ›¥8=©Ã¢ÅŒáœD—¥HŸšúÔkQfe4F:¡}o}7TFŸ¨Ž÷5þÁ¡[|¶.¼ªgƒ¸Ó‰ƒe!Û‚¯ ˜tŠÊG•œ—á?ßIµ:%z˜•ÇZ.#~:ÚÈÜáérÈ´ÀŒÔ{ k¾wªRã1=´]’®#n}’Ç`$FÉšA1˜v@¼•MXÐë8P¸”w³”R3€1{+ýµ¶“ˆ-±¾"6à§?ðÊYÛ«~»6ö„ÔK3î¦Ñ¶Ó[ÇöXÃÝÊ¿Xí~~…€{€A×‡~ÔO0PÀ5.“é8h!UëCã/³ w’¸uÄ•ýÇ+Ž·¸ë8Š5…o¼º‚_ù_0Àüh€Ï5ºÕeU¤8¹CeXˆ®®ûö‘bhÕýHAN³ñ8;GCÅ@¼c<ir9þ1	'(áËz¥éÍ]f†;?Àè+”à\^ønAÕz†·ã;ÿz3]ð·BÇ¹Ð¯Qòˆõ9îðP[†½þ%‡ÀÐ6Gîm¼N#wDíYï)j\¸ÎÚ‡×ù% GŽù¿F¿üµÅc4¤pˆ^S4ÿEÊ€I×C1Çßžâa*[«¢ið«Wîã wöRKŠŒ©lV  è(ÒmKÜ³¤ª¥€·øBëç/².97ú‚VnnÓõJ¿0ŠÞ,Äq9&™4¦±5Kÿå:i­B2®…ßx¬_"¬Ä{ØÂ¿ìDg'"üÙˆ“R'éÙ8£Z÷coÃ°ñ
¨¶2MhÀF¾mœÑt.²Yzç·++ ’vÝíý§díªÜÖxàž[¸gxÞRŠ»³œü—îïàŸÇPc;Œ’W±*ƒú³Qîêã‚_0gß~ß“ž‡°ÄKŽ‘Ô”á
¾[D’Sˆ—¢äL”kÞæ4dœž‡å6&Ôr|‡æ
ta¼‘§	¼å¤ñj›Îåø4û¨¬>Os–Ouò÷µnDÖÞfÝäI¿nyT¯Û¼£Rï¨qûwâ$1UÙÏ`ÑÛUe•Ç$’X¤±·£_–‘_¶æe¤CµÀ2¦ýj—å¿ô´Xz@K¥Í¸3Ž3qœÕ&›ˆ‡qZŒ¢sü}ó:ŽªMé.™lÿ—%ó–¨qÉ¬³L~å0|µtsìÃý» “MÉ#àUœO²4#¾‰Ø'qé.¡îè—5ôÖ,°†žl$cñò¶{ßB|þ²Û:ðÿ
«P·Ø¼sW¡¹¡váþ!…äJ+òKœÿ[Çù;~ƒíýÃ>‚M‘þx¹@FÎ2ê²	é²bÄWÑ˜/­ø^`)
öU3oáÝ?Ç³¿•Wÿ\þ:Ë=jæìBñ‹6AAuBäŸ§XÈÅ}?ƒ¡¥×Å_þô?ý+ü÷a …øÁÒÙ•óÃ¾¬âmý“õv¡º/½úóÃ¾X¯Ã¸ÄðÁÓJÑu0,ÏxAµÊ,`‚ÿ43& Y'×Âßp(ßåßpŠE}ø~±Õ_âñZ›bÍný­ƒ¯‡xú¨tÂ¯í›$]‚¤¶ÔiAÓþž"±L¯ŠíM¸êûÇt/¥Ë•ÎRŠÉFÏ$
¨ÌfeQF2Ø’™€h‘õ2­ˆä®xÃ Þn„p›·‡ÚÑ£:›î¥ÈRy;†Îª(ÐTôó,Ð¬8‚Lî`dÝ8jöTÅ~Ãº&Ð¤{sfÏ‡ÔµÀôIžÎã3Ä¥åÓ57Í1ò³(M~Â!îèÉþl.ß”&Hc¸Í¡Ä(X5Ä¿†ƒ[q÷¢Žÿ@wdê@Ü¾-Z¾m˜8š¡«Èi‰¸Ô0gøøyÄ’¿Ë¥·ÂÈÝ-`À¥#÷_÷
¡åx	2hs2¾P¤aØUnmýŒ 'ö¬x)šø) ½ŠF×±çÃl0C% ŠGcˆü½k×È_ZÝ‘gŒ¨á)<¦cpÌÅ(;Ô×Ðéàstï1ôÃ¢ãµ¬&:èHtxUDåQü*†1«z«WëÐô°~×:6½]ï?8ÝÝ*¨-áý…%EŒ	…¨ÿùŸþ··R¯u5­§Ùƒþ;ŠW¯\Ý(IÓUãÕ×t‚'æJ¥6Šçç¿Ä«„xõ¶$á—€uc9`ýËVÑ®£åÛAykÞiÕ¹ÅAÒ†˜:„nbH/’'àê‡é7„í#â³qûæ‹yûFÙ_"÷ßqä¾pÝo6|7Äîï<9>9x$¶¿Û>º'Ž|çÅñ“ã8u"/y&yå„Xm1Øž¶×Ã­Þ²rÛf¯¨ª£éìÅ9Æc£“Ð"ÓÇ0Ã¨?Ž['¸i¶\¿ùìk/ØWË9ÞÜ(åT2hŠä…øaq]Gr&qm„‚G|Îmil‹¡y@nºä¹GËX´–¢u-QqS¸7Ñaì&O‹DÕ8Ò	+²l«…AG2»ù X‰É#±Nß‰®»ÌÞ~Ô}ºâ°ž™g×AEšjQ¡"3HK	<Ó´E·R=”D¡z,o÷Ú„u¢ÎB™dÛƒÙˆ÷ Hç2ÞÃt>Ò»˜÷Jbƒ8ò±½‰05ŸîÞì2‹µ Õáßýµ/ ¸No3êºT=d}éW`°Í,Åùi°žJiÛx`U7¿×´?”xý»º–¹ÔkÅÅ:dñU	ðy0±€2YYÂxÄË¶U¬Ì³éè‚£¨	ò©<þ‹‡œ;­2ý€¡Â¨T›®Â½”!túQuâ[TÅÅQÌ1"ùˆi!%+ÈÔBwŽ·€PPKodVªÌAôžó>èájwu
w@oÆ{7X¾\eTà›©ÇsÝá¢5íÐI€|°Gw†söCc)X	aþþejWTØ#;7CÕ¼Oß´Kn’RÒä–9Yd˜¬nLÅ8n™’ªgHævxd]‘cZ|þA&ß@—³<oê°­‚˜ñµ¦ÑF³¸©4‹›Ë—îÏ–UIƒ›Oº¦Ÿ!GJõäÝË•Æ¢¶<ôàLµš'ÇÎ*ä³Æi“	ž9Ú	çÓc±¡_¸Wi.dBOQ²YÉ²Å„Â¾AíxPåt]ìŒâ<žÁs GÉ `€£~†ÇµxËÔÚ2á¡Ë4QÕ¤ªPéNä™Bh:¹7ºì}`þ7‡ý9xâ}æ¼XÎ6W*­Hó^¢%@˜ÄnŠ¼x®†”ÝßôÊ Èh±`u§˜ D[VazÄÜÒ3ØJ³2»E+JiL*JßõGJÔ"ù)Æ)±LÓô«P|Wåã¹ÔëÚ2kûë\÷ÞSÐW*µ•}“UÜª ìôj««´Ì!ìêÙcl©œùûœ"ºªOÐ7£Ö+q¿VW“èµ¾TYŽOŒM:5kqÛø…¯\è52ð»Ñ=&„~¶¡yö@ÆÜ%•øMBQ [‚y‡ls¼»¨œE	hÁŸõÉ6eû§c9Iÿ6„ü˜9†»ôî{¹lZá¿Ò¸©«ÅÝy©£×~Ž©£ÂšÇE\z›kž¸äZõÚ¨û¦½“;­GK°¼›(˜ÇÕ½ŽÊÎä*¯áiËµ©¸—Íõ‹u3›«ºÁ‹OçêñÔ/ÖeÎ.£W2[š#èL^–BÈçg•ýÏÉÐZ“4]åé’&cKÏü$­Gñ /²ºböÕ9©[Ûå]Å.‰WC¯>¹Ë¼¢L8 û1%adc~EçqË¬Ÿ5 çeüTëæåü4*!¦÷«£`N†¤MÇì=™óÏÍªrÿ¹ÅœÔŸ~†Àâ<)#ûfxï ‡ðn8DÇ¹
zw›ùæÎ)hú+¦ïzçôý0™Š‡ï¡ÿ
Yæôßußö>¹ì,X¼ûj/^üo?½ç¯´oÓ½OäÜ!¼-vù4xƒ)æ‘bW™&s98—6ÄÎäQ}÷Ý$ˆ­ü’ö]å‡¥‹‹`ìg™3‚ÁÇè
\}÷k¶É,ûW˜ôÑîDoÞ-À{C6ë,]våúÖóhÈ¶…ÙÄ³uþZX´gÈô±_‹ë×‹€O9Ü†(Kù©d
Ð/€¹oŠë‘äÎG±£Hè RezÅ‚; ¨—àäÀTF]¶2îJ´«òúÀ”{J™|¨+š:î#)<ƒšÄ÷âGÙ4 f¨Ì%c£Ï›K¼¯ôxJ½éólÓ*õ}ï|ýáŽQ…Û$ú}–Ë\Ž›–ó‡Ïî\ê0^³ÖÓèà‚ù ÿLl‰Hl@á…FŠx`ŽpØB©xO0ß¶¤®+7ãWôêìß¨”›¾+¡üpH×)fÆ¾n:uç2ehlÓ–ÜY<p4cŒúSJõ8?c¤TñC8#©¶Ašô£ÀÒ5&jÄ¿.Í^{¶·—`ÞPíB¤Ÿ7«‰ŸŒ’ârñé'³ˆs(÷BÜ„á'º
çÃÇlEMtçèÿ¢Öe~
of8[ŽªÓD¦fŸœx–;.9“ûSy²ð×¨çážuvT]gì‹Õs3þºkxû¶äuµ
ÍbÍ‡HÿK—©<À¶¬9ŒOû8’ÕD¬ÜÁŠ$Ð³ = kž¹k,µÐD	æÑ9{~®ux²< ,îŽ£ÁKÌVï^ìGýxÌBÍÍ®¾Ò[¥c‹Ý× I<¾£ê n€‡@)ãÈÁOf~>dNæ×´EÖ×àÁzÈy¸
Ä-I gÖ–«¼˜o¯§Ìq©c­D¿ï+u,¸øi'•è[em±3»šøò­t¡A-ÍËT®ídyvó2©6â£óQjAŸ“³Ú	ÿÐÑ|ù¿žž–þ±ß•
4žýÏ„-±M…¥ÍV²úÛËéÍ2:+f_A6^Þ±L^	ßÌ ZJã‹Ha9Ü	¼]ö6éœƒr×_Û»›eÐn\|Ø@!¦¥V;Í\®æÑ)¶zxXi´//’aë³@(0»šYåg47ÿkÒ*vÚ&¶Åç¥â®¸ïã"ª4X{E´”Ú•·pkÛ–Eˆe²¹`C9é,eçzeçm37rÉŠþ. ¨¾ZÐ@öÛ"ÚÜœÍi‹|Í&šÍËÝË¨!gsjTkÄ±°”_Éçü#[èÅ¨,§ÅÆíÛ³äVô
„e€Þ ›ÜŽ¦Éí-Äæ7q:È†ñ“£½l2ÍÒ8-;Æ”»—ŸôA¸>Ë£7¥ÇÀ'ƒlœå›§§§ŸÉOñ&¨ŒZKÄ·×ñ©‹½à¸8ŽKŸš²a²I† ­ãjVž)×~ð,ˆËÌ–i™2°=
·ÊóWÌ†,ÍiÁ]ÆW˜¼M®°ì¿d|ëlžwJ»|M~(M‘ô´â~–“›ÕÎsÜ5ÞÎ$ììáyªÔ
½šÁ÷ø×skq“Zé>¨´TgWæk>u–++Æ×s±4>UŽ p¤}Z¯÷®³ÝäÁ›•w£Ú&x´ée×ˆJÆOõ¦Kñ+é$UpŽ’~61ÝëgÌØ]šI$YÎD%õª'*Ë‹O?Å'4ÀO?}
ŒúñÂ£¾¿Ï’´³ôcºäæ)R¹Ð|è‰Ø¬·¸¨7Ø°Må3M›ªØxNjÔÂ7±…gb 3Ã}¸@²5Î»p±T!\ó½Wë•\‚ÊF×Ä E5ÆN4!×(Ä#®˜BD4FI»ž«(÷Øãù»ÎmÂwù^h:fåÓ¬HÕ'Ÿ´Ì¯ÙäûK¶ÍÞºÏÄ®–Ló„ÂoPš@‡“íA4Œ'¸AÚ±\“R’ÕÛí?|Ø€d‡’þÝdÓ¤ŸKî,Û&Òuzm{8Ldâ¹ñÅ²87bŽ²4Ëå‘ÀÙ0u*L%¥èð *¯e ³RrËLÙÝh‘ƒxZ
XÎa<£+5Ö§äp=oéêÑ,¡Ú5•|™çc%´ô†Öœ×PÊþM™ÃI-âëü•lNÃwŸÀÏÃx•ÐïÌU~˜ÀŒ ðG¼S._~`Öüg’Ûòc™ßR‹ÿu^Ë+¤³ü.F$Š_tK;×m §%mf$½7›îš$@g«Ä(Ê¯ªÂhOàE•¿’$u57~21l~E:ÉÌ
aÈHÅ`<7e¥¨DSÖê_ˆbåUöK+}¥OÞý°qþÃ¤±\_ÓŠ½›ÈRdCOÖ×êpÍ&;CëÌ•myÿ¹+}yâv>$é,‚¹+o‰ëÔ•ôæÇ¹y+ëÄ••"þ·š°’Ó¬†³”ùºêï"šnõçMg¼ü;SþxÝûm(Æ»Hmié€?¿D—
¤f&À!u^Å¿Ö™Ì!íœ;8­¶$ê|ì¼Žms:ò-þüò9ú!;ÁŒŽóŽ&r:nß»'vnˆÝGÛ{ûÇâä@ì=¾{ð½ÕEÑCLè0ŽŠrYD§x¨KIãì,T& mzªþ•¨ë•i+CYï#'Õv
;Ÿ¾vÝN»ñP)L“£¿~ô¨N§I`rxoûdWC¿ºiÙr¦aS	hí.ì2M
u/ûõ˜´Û?ÌJ »i‰^¼ÒhRU—ïø˜°˜‘âŠŽÓ“G +`“/Ì}ÐyW`¿ÓÝª‚®ðy`“ÎµoÊ‰Ò©?Ï“lª¾¯0Uyž«ãåø¯Ç=ry¹ò\ÉYSÓö	TËFÃù­i:ôµR•vúTP1I»Ã?¾À;^¢iu»‹qW
^ÅB7ºT¸:@\-z×Ü{NæÏ«á¢™kŸ~Z÷ õ‘~ú©k²Üf¨å}¼Ö?¦tzú:@9]_^¢ÝOþ$·ßôÇ1ƒÀ´[.VhÖkM3¶Úþ¸®GïÞc ¨BèC"ŠÙ 3^×_T=‰£‰‹<6	~«£ÂÊLTõØ`ù¡|ŒßÉ=à’ã#ÜãÏ»µþYæªa|ÍÆ®Õ©ÁŸ£<¦x»ÜE#I
:ý6eGèÉVîæÑÞ“t6Ëå€».¬à×U4Uc!r®FftõìÁ8ëGã¿:¶år¬ qs·ô›ò¼ÉÝ&åG++‚­QBBY ï$ÿ%¹7ÉÒ(e= AvŸ±³iA„Ú’ J£D§|L^å²ÍžäM*n§{)tìÖœÓ™š@}ÇS?	gP·çYþ)’µaŠF’ìnçÑ%gOHŽþð©Ã˜Cüo¼å_:7íz:N%•+ à®Æ@'JŒP5/í…[d§{»÷·ŸìŸ<?><8Ù»ÿÃóÃýíö÷ŽOŽU]å9UuÜ­z¿n8Äûä_îé"§L]±×·KÈÜ5Xª/¸¿u%+4HVý»òCp»I íAáµAåùÛmP±©S¼×0$ ]Ô ¨šZ‰”0L™oKE5eR‰ºË¯üaÚ9´ô¢á0"JòQ~Êl{¿ØKõºâÊ[‡Ó·BÊœóèÁC1€–Í>\	_³QÚÁŽ“I‚&Ui(ÿ­Œ‹YVa1xÄ#ÄRYŽ–6ÄêZ(~éŒèñú
”Z—Ê£é z•`f±úE°
gis‘I|’1w®èî²ÁËÁ8*ŠdP4—ìÃ®îtvÅe–6—Å’9æÆUvI6+WVŠæb}L]9É†1[ciTl”LGÙt€,&7-GyvŽžàÍÅ¦Ùt„èA¡ðr²r€JùEs99Ùß¬Ìi$7Üè¸hk+›Ì+‘§ýæÈ1a@Í…#5†“eÃ~–@å°`3²¡ŒÒ\ê% ¾¹Ä`”Ã~ŸDs*ã8C¢¥	#Ðºãô4O†–]¢îÜ¢É~r&w^C™3€Ú«¤ÍÅ~?+JµŸ‡qsÇ§e°'qsY oN—5“+Züx(1©¡Ü«6œáj¸×è4Ï`+Ëb½ÊÍ4ÀSãx”Í
œÌ*·T÷N4µ¡o”Æ~±Ã¯¢i¦
’R¦ÈeKfƒ¢Ã$z**
’ë<­Øt2|FASuŽ¡-¶Ì†Ø/MÊ‹–ý"wyð×›ÕPB9E„/8!—í„†êÓZëd8?Ù˜eSFÕv)ÝèËP–(–kIëlô’Ùd…7ÿa£g &£$rØÿÀ}ØˆjKe„»}1mêtq®›Zc/Œ5ÊíôÒºÛ»cÐ\ò,MK¾jþtÉx½,–vï=Â?iÛ>3bð­ê—àŽâ»Dô‹·îÓày­ãÃ+¬áð>¦1|z…Öv*èÏ¾zõÖóÿæ‹ÅòñF½OB«×ž||…ööˆ®{íÉÇWho»âQ^›õ«·Ç*ÉA|\Ï[·¢¬&y¼´ãÚ§Íg®d„T¥ÑXÕ+³ýì<Îw¢"îtëmŽMÈëâ…j¤žËû!¼×vUVÀÐ5o•õâ~&+m¶ñ="ƒ#‡?Tiu(½k”¬†3×•¹ÎÙÃ±Òö¨n5¥ï©úáü®ëV1¢ún&\jÎqû¶x2(zª:ÃÚÐÈN"¡$Iä€ç›_™þƒ×žµª\¹í™6õ¸Ÿq–Šû„Ó¢ƒÿ¬¢7vR¨Gè™*iÍÝÂ,²ø‘N½ÕjzØ0]¦ÍÅE7U¨eG¦bG£D„w\À&ÖsÁª\Š0ga‡
# ®x|¸Cã,66T‘Nð(¤!õx:xŸÑ_<ˆÓ8Ç­ŠiÔöK§’TÀ_;õ…!©úð :2Œû³ò;•$U¡÷?°!²TÙB­( çF£1iôä¤™Òt`[ÝÅg^4¥Í¢‹/†C¶Qâ|²@
ê¥Kˆ«Áà,ùç¦oI•ï¢)¡=Yöq[f}§t9”³h|ìfTÓ£µh3³ÙøÎçöÍHêÂ
C!ë·=½R4B©i.\ákáj¹œŠ¨’m
m’~÷à þ}ôdÿdïpo÷ˆ0ëar6Â“*ô?ÀÀ˜¤6Ÿû9É|šb]<EüO¡^œFcÊ9A)Ò™ŸÈµ©Ÿœ[µ$²Ól<F)'©<[ÙL°NNázÉÑ”á²)«À#ÂäB9l]cbÌD¶ìgÿ1r©0½WÃVÛ¡»#š¬îc‚Ñ¦Øß¾»»Ìî˜:&LÛ^VlÇ[=j•ÏKÂZp*T§ÝI¥°Oã²ô56”Ÿ÷$‰z„áérV…Àã'Jvs)"+ {¦XwÐª^ÖzLþÀyÿÌ_Õåk½^óQÃÎ]k&Ÿ›.Â*\¥„X1O­Õ]dNë±Ñcr}sÙ±£ýÑó5ÃP8[r¬<65ºk`:-Ê†6‚­Ø>¤ƒ@Òí€%Lžå-ÿVk7„ã†Àf´Yš)VïÝFýÎ0­ãhå¹†¬8Á'Lø¼Nî4#L³"‘QR´òèéïJ©m,r¸z%BîÖ&±|;«ï°ÿ·§Óñlü˜	
ç•L¢gR“SnÙ´‹Ã´zá!{;×º>¾Ü“÷ÛGlÁœWª>[«»œ3Æá:^3ÎùVèdüîU@­ŽÞC2[þÍyM„ä¢)McZ	{õt´i-¸$»G&–bèÒ×~²7VtªN`_åÚqOí¢ópd)m‡ÅÜy‹ÂŽXÉÎzMü\ïª½áké¿pR“^”’^¸;G…uyÆ‚üÜ	XÜZ!Ô£,¦ÄÂŒªËl:>F
¬A¤Eœ— 2ö"
Ì:p”SlÔ“ž\Ë5f÷4=^¼Ê§Nä†­’vc£èVuÁ³ã /AÅÚZ-Ãèª:á,o&Ûc(_E3žªý`¾9‹çTÅÃpø19^W†©Ñ×¼(|%(ç!aÕÝ2à‰±dÌº¶— ‰YªÎÍ=í<¿¹¬[_\.›@C`ÉK€«z¦ª	ªša±Q÷B§u¬·!¶ó<ºèæÙÄwLêÖ`5¦YÛbÄÅ¦ìâ©d”Ï–jmŒtŸ(½PX§Uqž ÿä&haÒP¤šm±ÓÔ±ž^íbUðÕ>Lñk+mþ°Êàê³ë†|Ð9OÙñSLˆ:I^œ{æ /Ý›ÕqåsŠ0s	.e‡ÏKø¦¼õÚ¿Rt@5>ÃübxXokZrrêýÃ„\òžâX½ú‰Qoñ¹zC†ßNß¼÷ƒJ…¢q¬‹PÊ$q‹+Ø‰Üæð"m¯²oäñfÂ+U5hL	E¼@Ûåsø¿öè,roµµáïÆø?ò2žŽ[(bÔ%¦ãržh¬µ«RïˆÍaMÐŸ¡fiîŒ·šÔBê‰JŠ„¦€~ˆÍHƒÍq†¡Û»¦Y-:WL1Êæœ¬ÆuRfêS®håŒF÷a4ù‰_#÷LôðõOÜsä›7¾l…Å°Ïö
J63T¢dn§èd—/4‹ª¶oÊæ%ÆÅ O¦ø/tÌ¥]©GA0•÷•ÚwËˆ™¤táv¥ÍxTÈoÛ0·HmÀd&_’@»_™;‘2†Í¹¹üz*~¡ÂHUŠE}ë…¢J
J®êïiªî”ƒÁä´3Â´5 µ%±ÝazzJ£@Új£­sDÆ_éÂœüêí¶Z0«¿õ¦Òš%Z>@T;Æ÷³\¶¨Ô›Æ’
²@álB'ŒÕ²Ö#™E]gÿf…¾"»Á„Í²ÅïÎúý1àÓTIÖÖízÎK«ó•Š¬—•™lÏUŒ«ÝgõØ¬D±<f/;ÆÄtÛˆ[zÛ}Ê€Z†™p–O‚E¡WÇ·É0Î
¿–ñÒlà>ñ†÷­û”éóÉ±ÙÉ“c¦ÈN”FÃÈ,&Ÿp­}cµöS„<ÌRô€)¸]$V§ø›+vš'» =1‹Î^æ€¨JÀ ²O¬GáÂ&<ŸpoìªÅÌnŒ'Á¢v'þ³b“ì XÚÐÜVéå}Š“!OÞË'9(¡|½ÃlÊ¿Øåü‹íÿèBè•r¼”Ñ()7@W¾ÐˆÎ6¼—/£ˆA@ÍèhtQŽ&Iàíöp6.Ã"äB]:z¯GÓcéè(ó°þí;Š¦Gi_’¿Ì"qåSZ£ì®ýÌ"—ÆâIrXMc„&n?ô³ãuªXFoVÛe_…æbq ÿ9CuC2ŒSv'¿S]³t:ÈîuN!ƒaUwÔE
¼D9]NEî9Ïë§Éi$iÕñ`
ÆC]‰yeƒÅ]dF¹fÆª/ci¿Mâótõ·êRjmÜrò²Üûáñö£½qòèßŠ£Ýýí“½ƒÇÇ÷Å'âÁÁñ1|9<8>1†¼M–•«$Xiµ*bÓ¨8õ×#æ¾d]Àé:)îÇ“Hv­&NË
yÂ^ŒâÛ£8_bš ø®ýƒö	™Æ2q}‘#“&CñûY2¸ èSâCc9Š/dnÕ<V™
FÉ´°¦é[-ë÷”€Øì¤(ö³ú®¬9ÊGå„¤ý6Ùv•=0—iGÛg
*C¤²gègë¼€‘€î5dÞL¢vôpÉVô•ôîJCij7~}¥&ã×lk/“aÝý èZ«¤_kšƒíã]\|7ó’S×vVÔòèC»éº÷ô·ðô×Ìñ•Ý»TË€ˆD@©Æãè9væÌõÒbó•Ól7ñëç ¦/S|ã[%“³4)ãçÞxÃª±÷
Cƒé#yb†%ó'HªÐm¬ü|šÇgi”–W)® ³Ôíá:^P}ÞúM½»#qškìZí Wè%cU{Úp‘í ûÌƒ2zü”“ŸvªäžKK^nep8¸C]æO#«m`¹¦‘kÁŒ?Öx_Üx5TrÑ“YìbGIì¥e†¶µ$ç©xc.Ýt(äð­‡õ&ñío˜4½bÖ—qÛ•å/»®e^X¾uÖFkšä~n‚…µã[Aã/ú—»ßïì?9ÞûvwVþá›ö}ãMüº‡¨iœÓuJÀ³ÙÙ¨”ñsˆe"Í‘Å%ÔðÊ,;#ü¥ñ	áåíøu+˜Y”æ#Áì¿ýß „W!òLf»¢Fz×[ÃÄéÅ‰©SÝV™n[°"¢MàËÉy³&M0ôeËè€ð<*D?~ŠÓñ… A¢ãM–a46pÓ¬$kw˜xž—M¡5ñ+Ú„Á>6Hü‰†€	=jYèœg“8] 8.»úÐ Q®j ~ÆÃo¤GÄ^É/Qþ{‰ÀàUùVøuUlä—V7Ï³ÓÀ:9 ?TK±,v5ÔÄ]€šIˆ`…ŒŽè2Z"½{þÒËó®G·à <¤iÃúë±5b:‡L~:ÌØ¶ºÁ¶ù´ÕÇH«ã`Ò¶ÖcÀn–]àÂ§ÕÐÕ”ôY,—öZSS¥Ôæ¯€ª>©žèÃº9)ýÊI‰^/«/²[èÃ%Ö—•9d÷ñ=RÆ÷ìíÑÃ~ÿÝîî7û?ˆ{{ßíìŠÃ£ƒG»ÇÇ{Å'bwû›c£ª¬ù³µ—„Ï¶±˜¼½1‚óARólPËÉa1ž°B«=qžeHyî%¯²ä£ýø,Â˜/«¸r=²T‰l0~|+ŸÄ(‘c“óƒñð0ù‰sÅ¥»+ä”¨Mé³æ¶ë!ºQ§§RZÈ	`R©ðKºûYÞ¥î4ˆñŠQ*ŽgÓ)úO_ÿç8ë“Ø£Û÷¾Þ¿^wê!ŒÔêN©¬,ºµ%îÀúQÞ¦ôk–ÉÉE>R5ƒ©Îý”Ùê/¾Cy5#b ÿè1LvúŒ·,é«ëuq\Fè†îËùÓ¿ûwþ?þËÿ÷ÿü3{Aë‹cuH‘‰Él0ãìEqù=gêšèpLˆÕ— ÿËŸþ÷þóþ¯|û³)Ö’ö¾Óô¾A6ƒeÈgcýÜëêº€ÙÓ@ð=²¿üéßÿG¾ôÕ˜ÄÃ$’)¤q£	ÑŸD4Fyí|„4‚4«4z•œ¡gÍKPüù?ÿ//¼žªZÔd3¶º G5˜)4ú¼¨ò|	{žF,¾`[¬Ø®‡yM¤W¸’#¹>æ³ë5Í?°ÅVŒúÕÈ—|m/iÔã`™Ãš¾Ì2eL†Ÿ<íb,,âàTmÆižM³vìŽfÂ„WRx¬^1ÄÊ$ŽêhäP7„ªáµÅÔ žÿ~6<‹YDYo¡rÍž¹fCû…ZÞ¦ÛÏ(Ì„»lá²¾¢Ïü€bÎVCM‘ê‚µ!ŽlC³Ç
8!i]¬¡/ÆIQ`Ùv@ôÕ¯â¨ ¿ÃAÃœó@<Ç31 =êò¸<þÃ,.*EŒ´u‚ú¨b¼€ÔÍäâôB°	(žPr+ \H	@Å°âx/R+\6aÏ¦ÀyµGò$9›YmáÉ”{æqlü°»Š_¦…4–VêJE4_üù?ýG`bçàIu‹À†°VpÁ*ÆÒN«
?431–²Od.õÍ	Èé9-‘ß"—…‘V4÷Î\Ýh>Ù½S_5´Î\¥È¿¶½QkG¹O‹§×ƒ”!RÔã}PÝvûM¨25Â„0ÀàpÌ$ŒÃè©_Œ'x3Úat‘åª¼ù¨±Òö½ìZòY`ã€`5T’ƒÙ¡÷|~u«kÿÅ;¢kæò/@×Ìjt­¹=C}|r·Æ©.O¾ÜU¾’yÕ¢³äâc«jc©¯T}ëdÐ]aüðjõòéu•-±ãžwUÖŽ—ÝV–E®c[àq‰ä¦è â<ÕÖ¦,Ö|!,¢²Þ8£l*Æ‡à§†¨„cèµZzö-—nÁõÄ—:ùt)‚Éx"s-z»¿É’kàNãŽa¢i]xÄ)ªºKü5äç’±b0Oš2‚`[VŸwƒuY± …¬œé¡`9û—¡ÊÇëk°0–Ð£±ü:ú¤ô¯c1iÜ•FÜzIw°Zeü¹êÂ¶ã?øy«ÕýÙËÁ÷ïïíìmïûÇØC“ž&ƒoÍÖ²ïP`Àé»—lç
“íÿRºå¯ÑÄÏ|ñöËÚî¿ºJ?­\Þ6
…Ê¤:G_/aF8âÏ|QÐùhqw *ŠI¤6,/«ÀŒkCï†)‘´Þ¼ÐìúÕ+Û¹Þ$èôÑÖüQ©ó].­VØ ý[y¿°WÃ7n|Ñ&÷h/‡ÊäSàí„e!"éGç·*ûP™IcJÈD#[Ø‘ê2åmˆNÅþ(–~ŸaÖyü¦J/uåezêÍrýb¹â&AS¨Ý#:HqChô“â*4c[ýnkŒ2îSÜÕËò†\¥Ëþ¬©ÿ/Â¼OÉÖŸÅnp.ºë-ñt•fE†Tsnó&%6Ä
C^¬~õ†h«/Àq´UäîÅ†PœQi¶"°ÖrK³Õ¸ÙP²Ò)]laâë²õ*T;úM³”»J: Î²+ÌÕ®¨·m­€3^7kÇZ0èÓZ<¹Ú!HH4™c cœ|ÐL'	)ÚéjRjØZ†ñÍp*!&AÏªKòVÔÆ<åÏa?¼43_–ù\ËwÞæXäKCºÚ¹ÈºsøUFü“Žš[‡¹æ×›À6üoUPbÖGÑku„-Žbô#Š[_+lR3Ð7È.‚g‰(qÏãØ·ø©³:*t<ÏÂVQ!Í›Ä'žµ©¢©BHüdhÐÛ² ^oˆ]R²úY[’öF„lÔÂ4«íJ´9ö3Òxš%gÜ—øü>¤–V´Åmh-,h­ìgMÖ3ö|)ˆ|‘°Í· qªÙ»4Ž,lYÀÂuUë–4€„hÓ\Kgå@¹ë·Iê
¤+˜ÞÖx$!×b¢|õF$ö0ìç+ŸÕ†£my£½X½E·˜žDËþÉ*1x”×$‹×R˜äñä=ôVG©-MÛÎ•¥´UËæŠ‚ÚÚÔôyØÔÔBTó6™Â&¦Ö¦Öæ¥ÖÆ¥ö¦%?G‘;ûàÜC3oÛ¹ÓµÓ1ÉöÄ~½4}6·QØ )c•®ºûn˜Î¯×µ3ŒÍœk˜ï»Ù\À’¢¼ÂŒÛ'Ž™+ê–´¤-«lðÆ€¾ŠØlnL^%¢®m.ÉÝRu¶£®cvî(QÏ»zÄhà–1t¼Ö#”ržq]oò\r\hlÀ&x¶¢nƒå€žJ\-gå½À-Ÿ+D‡Pº×q™ËƒjLï®í‰æ‰Ö–Xº?EGzxwÑÃWÆ¦ºüîk*»ô;TíDg}åöúJ×²¬¤¤,s@öiè–xqãÆ|c¿ h²A4Ž¥—f÷òö${]ßXièOŠ	æô}ÉèÒ;§ß`Ç¸øVÞú¯ä×¿{OXîì<y´ûøäxCÜ‹K¼Zd§\H£fÔQEÍ02Ö_bÈR4½_;Zû¾ñ¦F†KñG¡DX:~ª_X’ÕS0DÚü<ŽÕx_õ8ìËòI[	¥òŽý"ÜÒ|å7­d”pö®O£šx»$ŒÅlÈ™:²iÆÔuëˆõÅÉ`ò`÷ñîÑö¾8ùnw÷ï.a	
R+sÓœa.ãd äN°ºñ™òš§~R\>VGæcM ðõ4›ö¿œRÖcZ…üÀ÷Ù8Ê“ò‚2:~ÅÏ]Ÿé†è2{•zàI¡î±—Ä~êXÏ.Çõ§’jÕC—_9iüN9ì "óÐ,b—¹ÀêV?áb¯t‡ÄN™fŠq<›vÝ6)ÌtŸm!Îá-–GNc
(á#D=¸¬1”ƒyF™Ê1jñÉ-ñM<E)–5ñ£“&¢L&1rÂ—Ä‹‡YåøÂ×~éœ#›Äï¡–y·—ÅÅML\ZŒãxªB›±³`ë$;è­Ã9zÀÎ‚5Á¶"@y1ÁæSœ'¸35ìµ%ãu"ô‹F%çðH”q4"jaO]lSÏcúƒ,’“@ðî`3÷²˜.ÈÃ` ªAÌG§xþã-T«` ‡:dóÏº³¹§Û9©¶€£TÖÇ,ˆ©_oª’³¡íúÛ -·ôtù`RÆ /<%Kã×”`Ã§Ò³šn^"Ÿg}\Å›€éýóëù5XÀ¢¼ >¼ú
/$ìeµŽ°¸f°m³ìå–øËŸþåmœƒl6Êdë˜ j‚–p`Ÿ€"ÅxÇµ”ê<Põ%(†ÙŒÙG2$®ˆa1†[[­G…Iáð#ÜhÂF ´)ˆ¯œ“ùûþ6FþýSxÆñ˜ß;¸ÊrÈ0Í!ùàB#%AYŸ¾Ï&“8¯®Oé„ÌŠ¥—*O0³Išo‰íâ¥˜'q:ìý,v›è¨_ñ	ÐŸZïÁucÞy›=¸G0Ã0OÀ&‚"PT¯‡VæÆ³ƒ¼œñßCÆa8ð³|Ñþ\]’ñãŠ”AZQJ`ªÁžîÚ¸÷øÓ‘F`ÀÒCsäõ÷#¡´x‹ÃÔ1Ð¢œFŒ˜)o)ñ´Æü¢†H°ÉïFbˆÌÀk	Æž…±î~»{ôÃÉC˜Sp¯—°ëOÎâe06åPc.yÜ‘ÈG˜F‘tUe†oà“˜Y~P“£²~)ƒ2QPd*¾ÿÞ¬¿ŸÉälÒSou-âñi£à°÷@wt0ÎÓSŠ~.Í˜áAO¢3h„PGêÏ ¶Ä ÎeB(ŒuÃÐßAºÀ%Séõ$eNoÒ¥³“øãÑÖÂgv„ž…yIÙ8;KÕî[ê³ 8£´ÚÒÉˆ–Œm¼DI‰x_kW‘R|0†ªqìz?7}¾æct6¿I€×Û`j™#ÉïNö!/lÄG|ÑY”¤ABxòèß24°?»(ÔÖº±fÐ×(-ð/›»1Ð
 áUXby·8£ôÝ"`#yÝlgu°²™D¸£Î2dÒç#¤(™!§dûÐ‹Ó_D@Àé›j”j!«p[ƒœUËA™
Éã=J<ÏäÃ[ä
¡âhKØ!JX!¢ªï(Êà‰´„Çn°l{ˆâ,YEDG—íœ¿šD7Ô™R¿ý¹H^ÅâÛ½CrµSÙ‚¶oÑ- afyxé1éÁYžLœ<%ác0—³<®ó"ôc)$ÆQÊZŒjÂ
Vä’¶`¡4)Ú?æÛþD’Y¡ë[ß@û¶“¨Í4­§ÂÐ£Ç_\™7YÌ©³ÐRv¬R&aÙ³”4ÑxÈ@#`ÒÃs6²V'©H#èFžAÙ“¯Û‚õ¥¦Ew;clÌÍPPnkyËÊ2>P„-z°ç®-u67lIgè6óýÈ~ú\¾uI@Õ |kËÔ?fïs“$(ÕÇ\»á§+Ïª;£1dkBï|LªÝ§l/·ÄjÛ‘¶ì´"É„^¡&ýÇ\X•½íAœ6go[,w[}V¥¿
Ö©ÛŒ](KóÝ¨a(6ÿ`‹4i£ÕU)Õmµ:ÜRÍ­©ÖVƒ­Í?àRMÉÓ²y9èærqé¡4ojýƒ·5¤uk8'R…‰
g3Ø9ˆh»©r§Ä_õA½aR`¾‘ê½u°QN¦ ¬›ÙLãz"¦¥î]€ “óÓ‘½§¡:á†”¼,³—U	¼1ŒsÞÝpø˜¡àñ{Û<3ŒªµÆnMÿ £œqkÝ-ì]Ü`Ö»Þ0Þ@1Ý]'¡Jø‡›úP“ÚtFÏÛþ¡§ÜP·Ä%÷S‚ÁÜSQkg»9
¹Á˜$Å»]ÔjMÁqÚr9«?óDò6Ò:¤+½Ï?7{fï@¯Rž×(±)Îb¼iÎyîz°Eì-ÇÞÐÜaïÂ†ãÉzYß›6ŽGÂý¶93C›lñîà|Ïôg!vÀ³ƒÜÛÏäÑdrqŒ‘QEa(n.ŒéŸ¹U+J¯×ë4—1Ëvv0u™j–—Î¶'ÑB£¬òÍCwÊÇm¡Å ïÂnZhÔ}»Bó°ÝÂÁq;Ã`n8œfÃAûú8™Ì¤ÏŠz‡Êì=õ^ß2liª_É±TíÛ5å=báêê}Õ†UÉ«ÆOˆFØÛ×šñ‹2ªª¶¹Ûp%™ ×½xšÙ0v”£*Å%­îÐF¿Eeˆ…nÏ©`¤MÝU%ÈåÁ<žò7øR¯ã!P&]©.4]rLI±)8ªbÐ‘å{šÒÚiõ´«ýd;¦£¬_Ÿ²Væ‘F‚Õ¦ëÿR/K=R¹!½ÌhK±º`ey—ð¢Éù3do]JAøùÊ­;+ÿ€v‚º–ò ¹®2ÝÎÑÑ*þ¡ÇÓì¼³Ò»³\-”å½x]p#iscDKÒOÛ®¢:&/ý,cnºU·”L{gXh/®ÑÎ§€…«°^6Q˜õÕg«Ì'Ó	¢WoeEæš¼±Nþb¨ÊÍÙ#0¼#ºû¥'¶ÖJÞ‹D˜ã@Z9!Çµ»K’’Ïª!„jäx¯Ö,Þ;’¾ËZ0‚^¨„·øÎÏ:³<ºIh,rt=œâN§˜M–a($ÕÂwŠžË²X™×æóSûDœåÙy9bH'Œ¤¾™Ù`œ¿;ÚÆ»ª9Ë3ÛÝi`ÎO­’©‰¦öÿV“pö£Ý!K(VÖ]?<ù± òÙfÕÓ¸Í1B
ÖlTÂ†%6®°Â¤±¸ÂÆ]Ûæ$Ýy¹N¸ìÁîˆJT@	ibÎ@¹›Cãøö;‘/’âñtÀ#ïß °Œá;Lj+|Û6Ý	!Te<}žNÏo¼!¶ž3ê^Â/«ËpF.ü”I9ÆÈJ… âÆ›|…Wx46eßã¾M‡©ª” [n<¥SmÍòH6Ôèj/}ã›2ÄžæÔG‘ô9m*"ÞXjtó†Ã.¿F‘&P¿eBÌåRøiÞñúSïü§u…j­—%ê=[dxÍnøÂÈ’¡P@Œü¬WdyÙéDË¢OÜ«oÈl·DTÿêöŠq¼Ž’ó4PÌæ ]ì¤5ÁôT—G´ÊäÛ’L›•©­¶·[™·ïù&«º«É@À%jÊcœ´ëSI¸ÈÛ­7¢Ó	È;úÒØq&{ß¢]ˆš[¡ŒÙl*ú,‹\í‘ìK9ËÓä¨ æùn4u‚jÐ´&*ºlXgÒ@aôš’¥ÁlÇ*GJOã¢óEôÍ€ÿ#ñ‚}.Óå‘Ã¾Šó()—Ujp)¾ámUÑ8£á… Î4@M}
Røo8Œeþ^oN×ÛÊïyá}³P^_‘t¤&h=ß„šá¤m&	L©nŸº¢KX‘L¦cÌrO»cƒ„DCY®€`ƒÉ¢;
U,tÊÜŸ"?ŠvHÑÔÀ]=žl3SýÀª4~8½XM‰F.åmCÒzè‘1§:à º,)æ¤vö!tõa²^À$5UXÇíý}q²÷h×]K¬)ýW±+„—ØZaÀÍB·Ü3Ì=3¬3êlìþÞýmñÝÁÑþ=±óäFq÷É#¼
zwûx×ˆ¢‚Ï+X:%½;wa+~Á_”mR]lÅT¼[_ˆ-6Ã—eUé&µP9ïÎ[\ü5ë*ÜŠŽQxè`µDæ7Rp[ú¿ÇQ¿—-'@ðgš–Ñ¼'0¤¿«’Bž˜à]î¡Ðeô{Øœ~ûj¸’Båœ¼·’n,ÄÄ( H–ZB)=uðÒ	¤&‘êà3õŽÐŽÐˆ	-J î^*FCçqC™)l…yejwõÎŠ6±Å^¿~üz
bNB÷ÊŒÇæÒõ=áÖ‰jÑ%8ñ{¯£ZœZ]ñÏ>ä•X)*N@ùÄ&öÐhÙT
 ­Þ,Mþ0‹yw…:¼×¨K2èWúbÅI2¡¸¹½ñx6I­¤_ß&èÚw_AàœLa–,U-% u>™biôùûŽ¼%îýÍrê	èãv‹ƒ”0VM?(gÓ)žÉ.1m7æ‹X³7ýè­PRë||nÆèv8Ý«ß¯=ÌæÒ§0˜Ãp\j²†ÚAéèÒ€j(õÂkµChmüêsÎ¨ÜÙ¿\+”2©µ‘ÖåTÔˆb¦„Ÿ;3tLµ®Þõ ]\3–šÅxeÚ)×ÔàG~¿Èi’ÏG9)I¥¤òt6Ž^ª`¿€'ùÚ¿1€si4ã½åÑ–Ö1XµOÀ×$7ãæœ†áU÷²t9z†v“ƒ>ÞeÓ‹Ó2O0¸×we„úD5´Ã¤ŒÈý¢à4 ˜ÊQ<ÁëÝ2:¤*GQ*Ö$¼}fhØˆ—v_i5ésEô¬7œ+š«2"¹ «~~Rã(tèòí=Ã‘ÚP£ +…nPN1XÞKž8b²”PÉÁºuçŒ Xõïá½ß±Wd£Þu'Ú<²aÚ&¼×Ò ³á™xê‚=Ã˜²Á8žferzBÊ¾Ž‡uñ~2÷³(>ÌÊÕ•*}×~Æ¾;ë÷ñ¾Ä' ‡|mÝ®å¼4ª›/Ê[idUæÓëI6ÕØcöW=®«Ã¹ÙÃŽñÀ *VÛqËn»O=à> €²ò‰Ir­¢0Ì¡…_Ëxi6ð
ŸxƒûÖ}êîÉ±ÙÅ“c¯ÀN”FÃÈ,$Ÿø-}cµôW`£hÍ2ôÀ+¶]$VwøÛ/tš'»=©Î^*7iÅ¡äëQ¨¨	¿'Ü³¢D%³ãI  Ýÿ¢®–GÃ$;xEñ<N‹ôê~–O"&Ð«'y?J¹:‡Ù”{¼3Ê¹ÇÛî)ìtþÅº{åì+”s&¥óõQ6xÉƒî„½—ÁWQÄ=&ððs8]”£IÂ¾Û’^†¦@è€-¬ì$rk²VU;¹ÏÖ¿­BGÑô(íë"òW] ÄÊÞ–«FLÅvíg©3H’:vÅŒ‘™ØúÐ{ÌŒÓ©`=ŽÚ¬´Ë¾âç`Qmÿ¹G7CóR6”]Éï;v2STåéõcø‚áP:$Ä*b0—Çú—. Î~¤ 4Àƒ×%™ÝýùÎ“ã“ƒGÏ÷m?Ø=^Ú¨d!ÊÄ{TFPz©e-æ,¥Xì…“ÅŠ2,E˜¢he.Œ8™B¾çGœE7¾€3,åM›`¬Ý
šåQ¸-HßÁº‘^ Ú·Þ\zJ @–ö¦ édÑ0$È£Ì>ÚÝ98º÷üøàñƒ³®ª	<¢pÔâ4”Ã8Èø¼ê ª.ppžÆù~ÔÇ{¬
g³U¾é¦ZÄ6ÄÔéå[Ûûœ+t=†©IÌ*&ó RãÎ}¾Ü,A­»0œþÛ÷t<'e»žðð4Ü.5¤Ê{cš×ºulØnµ…—ºˆNã3‹Æè/—¦FxŠ¸ëýA¾5W]é;f]Tun¦³I?Îoâ†zL_ñ 5zÜ1
‚†mw¹^Í¥¡sDôº–½PÈ#û'þkyzx;˜Ú¬÷9¬ÚÂÎ”+Ö?ÁG†‘,«‡‡ˆ	† _<ÂÃ;4‘§(o.Ë†µo¬—’t%ã‹Ê:óÔ0FzK½Ñˆ@¸Å<guJK6˜g‹r"JÍñ ìéI–ÆÀuì§'jCÅ\â¦bO²ÎS«ÕžÊó¥–ù™7ÂÁªxÔÅ/øûÎÁ£»{wŸí>Úûþã²v•$Öžl+t6ào}û½Å>*ã	†ãn²ËeùÀ›MÕÎ„T]u
é5©cì¾»&å¹n¾s!dM0'Éë¸ð;$ûYµhUßTþàTÃÃ8Â%íU;¥kÁfMú¸ïÔövkõ:’ÍìË}ûÌ TìÐ>4;RçÐ×ãÒ*áÃPMxOûÊˆã¸ümAÉw¿îÔ³Wð®¼Q:ôÀq&pÁóÙ¦¬×S§(NZH\uaúÉuWUrNbÕ] VÕ#š@uÊªšöà‹À¯j¤õ3»’Œ#—ªqÄ{µzÑpèU`¤z	ÉÛ#VN9PUÒdõÞÙømöÕõÎâ;«ëo-téõY›¾ÆJ7Cƒl1F:P-”$çƒ åqÀËø"±‡ê<Z5±ºKGæú;«eµ
¿­JøÔ®â.BeÏÍfœb7èDBƒæ›:[Æn°òï$<¨ÑÚl@¡»]±ÞT×Ùfõz™-\ú˜^û@}åã¾%ç˜¹+jÎ¦Xh\ïä*¹›pœ’ÈZ˜½3Š/±N‚.bÓYŽy'#µíT_Fêú¤ÇYzDe€bôäÑ~!ïL² Ø>axŽR›ÈC	o:Å®WÔœøsMÊ%=Q»%ZJ³¢{ÝmÅ«éäù+ƒÖ$ex¥ÌK¯¼Å’Oë¤Ì5iZ ô¸kKM³"ÎÉ%¦‹µF!fªü6·,nŸQ^ÊZç˜“»Ó%uAV\²; þúý!]°ó½—cîáµ‘ ú|ó2ïŒ¬o®ÁtÿxãžÎ¥ÚL*U¯ÂÁÝC™³É"µýxÍPk.Åé8›Nã!æßûÐc}*CñV¾Él0²ò¶¼”†É<Ñ*ÆºQ·®:?íÅª{Í±{†¦”>C«¸t°qšMïÂâ¾‹Å«T3+wãƒp2/–&ˆäUªÅ_PÓ—n¼1÷{|.—d®WkqéÄ³·ÐrÝ	ÜüÓj¹ªkƒÖ]¯úê¢õ+®×‚*­ÒMMyÂœ¬ä.©‹ÈŒ' Üx²\m÷e»[•å™?ö¿e÷hÙ¤ë>?ÜÞùæã«»ÊzPH+]Íy´ˆHº¥ít‡Àkg<ú@Ö"ÃUëgc£‘%è¿R;r~~rðäè¹¾fûè‡Á˜×Ç–Gñ‰’m(¯¬.œ°Ë¹f|Öh>Á8ÚlìÞËÔÂN{ÎÝxƒ}Hö´!Ð»ó^6˜áu9Q~a9É©Op‚FËÛ2‡±<¦‹—Žãñ©õî‚n_«)¾—"¥ºÊMk˜VuòÉ{’7|Ä—/¬qP®ï1Ïsu½KAã˜`YÖ	°¡ø5,6¼F`;ú†LÃ._XYïPvÎ0¡©ŽÛ,Ï“Al,¯Õ¨Ôr’Þ%ï×±<øZ>é²ª®…Ça7-n'7ìe³Bh?ã§Ý1aÕ^è°P¦†¥$^ˆ–54XÇàá'­ð$I;èÅdáûJ+]ã=oë<CM-9÷£xã:†sa¼¿÷íîsŠüøøì”¨Ž´  {×]™è]•ÊUfl^bfÏú¥úcxš:º4¦æEÂ‡×—áÍmLÂ,Ç îòQ9»¢I\ÏÔ¶Š»;DõC'•µŸ!â®ó¦†MøúYØFfÇÞ#Ã¨;æJÔü‚QRDgãG)$Îd(üÝ´Î¿6V†ï¬Œ®ìqœ1ji÷ô³ý
ä?Œs8Hå’p çiîRÐ2£‰º^-«¨wx¬OÔ$›qÊÈ."9–/VT-Í&$Nt9‚Ül|æt½WÖ³³7}ò}?ÚË|£ÑŠ„Ÿ9~ùõkÜõõ›Ç“F‚¦¯CÑÀ&(¤Þ˜Ë^}ÿÛVpÌOmpêëËÆ&pS,ÆÙw¶wîîïoÿÌx<&«GG?ª² ¯>i<A¶fþrðNqM´ñéÊšøü^ @Ú˜ÝãVÆÃM¶Ø\zÇo')8Ã÷w^A0(\RÝ,,.
¨k[aÚé‰T„Ï¨M‹÷§?J¦}™öNFñxýØ½q;Y7o2ãptÛ@êë¾4ÿ·›ê¾°RÑÉ6ðâ®CEôaxƒröyebFã¡9ž&™§QÚi’s«f8/´g0ç ¯©ð<¦Yx1Ä–%WKóÅ­Ê”îöÜVœñù6îñÌ¦Ö,	yvnõž®<Ã÷gq¹]?7U.ÊÒáŽ‘®6R xSó&Š]³Èw—Áªf+ `É¡Ö‡\nÜ¶±-:Tž=¦c+»=?¾Û¡›~ER•ÞŸ„Ì[= yŽUHÈ+o	fÇ‚ìî˜g._|åw´£WtS¼ÍâV£qòg@úTÛÖñž—9kÌµæd[PƒBg3†¹–Òùrg£ÔÙ s%Î ¼Ùno›{Ë“A-;ö^ÚÏðŒÛÜ¬	=“)RešPÿ >ÖœQ	"íœ8¼±Ä‘âRY!5îÑ;W(œ§(RÔ˜Ek­Miðh’[Ç’ ü¼×CÉÇsÛžšÙP¥~SB(ºedéÆgw].©åMBMÄ¼äH]ÌØpó1W«ƒÈ/>è)æšs›¸{Šb1÷<ÐÛ<!…êŠªÔbJ”Ã»‘BlX4Ä.ÀŸÃ:"²ÎÅl7°5xuÝ‘-Þ˜	8	eünwçä£FCEt6cÕ×B½sB£¢ò‚2Ra{¥P;“¡VéŒä¬^¹êHÑöG†º[¶3Ÿ™ÊnTå|´ÁÖ.„r¨œ‹Ákä÷?'jBw¥#ÕÆÑS2oáØW¦7ã¥…(×ÙãþLÝh„2ºŠvÜÑ÷PSÑ9TrIKþ¶üÂÖÙWC× #‹¬£F™ÉŽ=¬¶pƒôa/äJ­ÔÏâ³<fg™
hw«Á›"NË«ë¦BW<~å4²{ØÔÀÚü¤ðÛÐÆ+Á6,¨`´%Êk€Ñô—5¾¸Ok™ÚÑŠ–MlîX­&1î4ÿâ £W;~ÝQÀU†NÏÔ®Tî…[Mþ…Ý&Íwð²U4³æ4ÏÒl†w'á•ã([]UÑBbÿ(¾=J&fö¤-x˜æ“æ&
l#ÎíLØŠûÄGþ\õòûÌÕâ)Þ cî©J8½ñÆƒä¥¼Ãô»#/QzõßH!¶çË¦^Qÿ<âoØÙ®œüô./°œ¿À”>±ˆ•·ðŽ÷)-o®¨+ï­%?H¼rI_«
È©ƒ–.{âžòtÅËlM_Wºåý,Ngx´F°-Le†7“¢ŸåïgÃ³¸'þò§ÿð?ÿåOÿå¿{HbìSŒ¦QýôSr8ÊÊÌLáîì»p§VIü4,÷Ü®]„g½Y>vö;sâ9½¿x×ß;†ÿî"Øý›9:XrK‡ÿyxåÛù‹&û¾I70ÎëKÉ’OW%Å9(¼3 ïö¬BšSA&GšT$¨DW1ò…Ð\šGOþ­~4T,¯¹M˜ž}jm¢è¬?NújJ©RE¯ÝtsÞáz'ÐðÙ;+˜ˆnÍ©ÒµÎªcsÈ'a"§ ß.û\àU=ùÚy–¿jGnûÖØ€¡ºW<+°_âEÊÒ&ƒ4pxZa¸ˆ÷(ù"”¹püû#1JJ m¸¥‘ ýË¿zIó—®a“ŸÅÈ›ü»>PÂ½#®õãŽ}ñã'ðÄOå§Á'd>üÒŠUpë·¢–«ë¬0 ?ó‰æZ/qg…DˆvÊ“üžÙK÷#ºtõn¦£¯t€yýÿ   ÿÿì½]SI¶(úî_‘Öx˜Æ2à¦ÛM› ÛÚˆ-	Œ7Rj\RiªJ`šQÄy8`ß¸ûÆy˜Øû¾Ýýî_šŸpr­Ì¬ÊÏRI€ÁWt´QU~çúÎ•k9îX²<ä(W¿ ýKQª" ÜžAÌËQls“lCb‹bÍ–»cÞg™eŸófßåÕC¾Ñ=^»o{ÜX À ò$éGÝ(@ªÛ={"û#‹ÓFUôqÎ()}™zmr®}·33ìûÚŠã¶¼Àï$03í»iU}n¶qQÛöÔ¡L¡5½í¦ZæƒÆëŸ<!í‘w1¤lïûÇ ó„ê¡—ôÉÉøôT/»›§ õƒ0ù‚1D–ïà¤‘è`Må2p½™É©Gum–
³ 0]ÃL¥¤Ö¶J¥ÒÁâ&3Oýòœnïš‘Š»¥³Ã³—þ0'eüE3ŽÝ]0YiSß•Ä‡xTäaŸ©'cìVŠž¯ý88(J6 w(@3Š$šè²i`ÝIÔ»¤Õ_QaFAæåÞøTÎ9	ÎØ‚G§ä™Q†×[' dpBÅF[%´…¥ç¸y}þK[ÀqACbÌtžRJ¡1Œô¢”ÂHxÝwyà{xóÄïS… ¿²›yìBü„|F°Ï´9ÐH>M‰Íƒ[>`#¾{
2Æj0$.ÛQ&œŠZCG³íktáP¸rfßBÇáiv’Îªe»j‹Ï™ãVoÚ ©u»þ¯Q9B\s(œŽ¨i¾°ÒÈG9DÚßòz­žN«ýja‡MAàU0"¯(!`°”h¨j*Wt!b®Bòª]	+ßÓ’"¯T”S(éä€NïÇu‘ŸËB(F¡—Ò9„ò¥´¼&yuÐ¦ÂÖ§b“øžäN%<˜g,+k¦thzÃO¡T
­±€¢ WJo®r1({êS%ÊQ2£p~bF´Æð<àJ—Fƒ,.ðœÄ½‹lŽÒ¤ß’>qÑûdüÛoÄ‹!Úñ4’'h•]€zl\@åè/¨š¤ã^1õp¨oûiìS²tbŠ719J¬DŽ ªPŽ)ç£âÈÇ*‘ˆ-òXÅ/+5›‡žM¡hô*£XÑŽ‡…Ñ¹íù¦Ñ¬RTË¤[nÐœÄLÂmOâúD®ÛEŽþSP%“¾5H†%œÌJÈ²Au#Èª&Pínçé˜òN ²\ƒñSXxLÕ£\9?ýk˜
LèF°˜`ò!dæ¡wÉ˜¼'ƒ>¢	›ñW<H•W‡Zÿ¬Ü}zÜ™/ÞØþ¶¦/°æÖð\¹ ;5Í½|Ó¸÷‡•íÐ6©ŽV‹cïòO	nèH%ÈD$øu¥ýÊ/šZ¥Ô‘×Gª¬¼ÆVò7ôa	ßõ¦žtÎH¤Ae^ÉK‰“YÓÂh”»éd*’| _ sµ×âÄÜšæòŽ'Õòz¨VÉ¼O…ñFŒét¢!I$í>•¸Û©#ïü—`0¸$/¼0Œ†›Ç*´ñ‘ZWÀä„Ž‘r{ãlJSxÞøñf<fŠ06)j³ó‚)ãÞó¥€”t`©ÀËuA:«r¡,2emT±9ø9w!×ëne:7¶ì(¸„!øàDC,>!²ï$§ù™­ÈÐåMá2S¶6P°$Ýq’`!~úø™¶Iswj£ oE¶)LÆ^
™ð‚ex£ˆ¾èCdtQõñØ„²_ÚMìÓ™¥Õkl[mGeó·¼c’"Z ¤Iâ™LòsLëXa|çåW°{òïÙ¤§ü¡ˆ§7ÊH¬’	—IXq›Pb^gÉG¨K'Ú0ÙæfZ,Áè²‹üU’Vr9eâ¼–nœ+j²¦\'ÃÕ`ØÇ=?Yäò˜|LµÉŒá6“é©^¸t¹Ð³FCVð Ð®‡ZW]È˜¤(E¦Êë¾
 ~wÜÅ³Í=,O ‰þ[P2ÿ)\¾LÁ¬;Žc˜ÖN0¥Tæ×š»ðñìHšÃŸ.a/â$[ê<·¬e;ÿgÕòÛsïÿÍ{ü[íñŸWÿô"Ç-,@ä¸CJr9uS…¢S0qG¡ãÆ¢ávûé01ÒVñ&ÕÐLãX\D;c8ÏqUä„EÆŸ™=^¼gGÖ’?©`ºxüà™’¡7¢44­|È!tŒaÀ±3öÛvëÁ²¹yÜÙ‘À–ç{vú.hGFi,¾i]3sÕ÷rÁTÍGó±×ëè!{Dß=º‚5˜+•Õ
8¨¤LIX`kAY/ãUè~ ’S)t‘G^ä—d§‹â=÷™ûtÐÓ#—Ø}ŸEªw€ ìÛÞ a„(ÓÇß ò¤ï€\@hÍì\ßZéŒRÌ~þ’@aJ— Í³µ+N™¬Ø,«¬|Åã•ð=Îú³UeÄh_¬á¬TË0ÙÊãùå9yjœCeNBÑe7JÓ=?I0Y‡y|HÈñVóÝv³Ó!W¶HqL•¢:ySÛïP¹Q¶2²	ÙªmÿúüŽ·ðèJè	ùÝ‹V½.ê²7[­ÆþKùÔ&ÿøûÿþw‹uæx§Iö›Òî´êµ=6¶ÃýNcWÐ„¸sØÚo“N“ðþQ¾Þ¨lj	¿}§+Œx§)zI2a×ÿ@GÕFzâCe*³Ò›Im«ÝÜ=ìÔwßÁ\«7>äýHÃsòçz«ÉWµM^´š{ä°}ÍÅÒ:Ö“üêP(Qž„ü a¡;2:xA+so'*5ñ—ï)GHÀlló÷ZùT^2i· `“c}ÜÄ"C¹ú”Nšû\Ø¾e®°8–ï3x8­Ú< Ø´Êx¿?Š§ëöV¦ûBü¨úÀØó:DÀc†Ý)i“çàCUâËb
øŠ*Œ]ªŒ‚Ž*ÂÂåH~Ñ‡"	s†
>ÿãïÿñŸVZŽÔ‚r$éøô}¢qª5»¹IðPçÔ§¢²=¹ˆÁÊDÛýo~_x—8ì³ñeB¼ØÏ¯1ç×à½ª2¦Éáª73 Ÿÿ²õó¦ïƒÚè£}ˆÚY×,N;å×oøÑ÷(¿²@Çÿ5•R({õNÜ.ø^öBœŸL¬¸[Á3L|Ÿ¹Lýp«TÂ~’aÚîõ½à|u«v	—ß,võ£vCW[Ò3?}ElS¥)ïÙt)Ô.ô~§\lÓ\Ã5Û»‚¬MßŠ[ÏÌR§ÍÉ~3™ßœÁš&ŠN‰lo’n0à?ø~“ogç¨UÝ¨¿‘.
‹˜NytHè@‘Â:Á DŠ©YA§æå7†ù"â=Ð¬’ã¢0  œlEÌ‰>«iÉGäº	ßò›×¶ì„ št#Ê.¨æò¬º.«.úJéþ£µíìŽ¥”NïâÇª¢YÛY3H€µ%Ó&„…çÒÉ©.0ÿËý ]C1ÂNñ÷¶ˆSÜÙ‰Ä.	U_»­Ð;ckõmuCEÝ¼CLÃa±€Â£XAGp¤H™öG¬Æ,¡
Õ…G5YÂSÇçVI±WD~³ÕR	ˆü/¦ˆüÝ5o9¡UwÂEÍm „;[2‘˜Ð$v"T†âÄ‰‰myZŸÓƒÖçÃž•Ö[Ã9hÍ[\ï¥¥PßY0» ÷’„‡|ÝØ©7ïC|@LEÎø‡•k” Ôâà›rÜÇDè3œÞqwßO-í‚cîô–V§·ô:H -Ào~\ÔûÖ½ -÷Z¸sç0©Ë9Ïb¯ÉJìõ2û\~åó
w%Q®}¸µ×èíu^ßK´£ä5JÙýåäÒA|7+ÿ·¿‘ð½ˆâ´¹ v¢Á1V…¬°}ß;¿\ Ôýé:ÐsñZj‡~[ƒoyÈŠ,>€)é˜í~_Ð,´j0VxÂš$‰cd'™?Eœ5„P¢FZ4§É—hIIÛùXAž³¯†v&äçK#.óKÖÀQ·#M¼nRY¢ÓÚ½g„Í¡ÚÐ¹†÷&ñÏMÄ?W¿,ÎŸk ž¿fV$Úžø‘G÷ÒlFEX}þ¥aµ@De
ÏiÜZ›ˆÁÖ±Wom¿º{øR`†
ƒ·ÅÉ³yê‘
£IKµiÔ”>nÈ§íe[ÌÛÄjÊ­Áìü­ÌacP.‰bŠFõ¦ÇeRÃ1}–hLR|Z³j "LÀö²_?k1°¦ø8aÅ“h8N0Ýø4¢7‚í½tpPhô1­¯lÝbÅäƒ=Øì>J{"Hpl_ˆ)Ûü¡bÿŒB>s.àÀ‹ú§n8ÆpVbzú{p¢XxF'^ÂÑñ£+[±	9¦À·° w‹‹µ UÉºzÀ0ÁÌqåÑU:©/UÿQÒ´°LdùÜf»G©ó&eÈÝØ;÷ñœð÷ÑGFß»£ˆ”8xÉ/ÃËƒ’K8ˆ,$d!óœeÑXÐå–oÐÄÏÖž¯µÍùöœ
pæO}’NŸ­6»PÃ«:u•.ÔB²€›6Y†P
b§&êEzWKÂ8ãëÚ†„jÒÝMKð­R§MY8_—;f—òŸjµKÜÈæÁUt°$‰‚¸°C=dù¹Qn|ž	!6cLwy/éA òÛ;Ö·^’øiê/,Ý/’õb;ñ†í®ëÃÝKí,…ñ~/Èb¡äÎqö©BevœýÉq2|­àÎ7ƒ²_„ìïÖè-iFyÀZµ?îö-ß.#¨¸ŽQÙQk~LZ.ÀsI¢UowšÛ¿Þ5‚«V{°**…Ä…b§0å&“·uÝCÕðDf yl£îÇZÿ @­Uó”š¤šgvY3ƒÚ`•·cà:<Ø#„­£ƒVc»þ•A˜W£8€‹ÛZ|‹Ç_Ý ´ê{Í×õ»'._ÂRÈ¯_èæ`h	`âEeW2¯o!åÈÛÞ¯´_5;G[µýýzëÛ.Nõ³‰õ@UT©ÞÖ]qWe¶¨ˆ7µ*'øú0™{ÁÌyêümw§ãh;bß¾óã×ËVmoïÝ·õ/^ÿ³Ø.o`í-ÐÜÝ©ï½ÜmnÕ¯½÷bKn¼¶ÂQØó‡`¹.ˆ›KÜlo×Zß@œ‚x”t½ø¦©Ë»æaçðàú+_ûËhœŽ]€Ïí›°Sß­w ¥íîQ}¯ÖØmÛ Ç_óyL{µÖ¯Gý­æÛ£V½¶óm‹×X÷åg/x@µÂ¸(Iá«î®!`˜é 'Kó(Ú¯õ£æ›ý£vsÿå·mtl#÷²z{±<Ú>%•ƒ9~i…ÑTf¼ÓA€ïOÒñ>úÃèbhO)ŠÙk:#§YÒ[/$åz·déiy…ÕVJ–†±îx—e:ŸZLwÔGÇƒë«ô[‡ hlÿzç¦Åó`ÖÉ?é 
ÆIû”&!Q“Œ[1`Ikõ^c¿Û´kY¼Y-Å÷`µ6sCÅ,„ÃH'Ë…pB:%mª¡P=ØÅJ6/¨¼†×íà@Ñ™ ¦ßÔ¸çô·`Ëg-Ïg^ø q‡»ÍÚÎQ§yÄâ*4¾lB÷µÒ¢Ï€Da
þ¶€°Eµ½v§Þúâùì7ðn›†ÿ.TY’)'UþNi×ÑCÿŽ­‘ÔäíEl6t8…x+á§”t!àÔj:S»9™G`ú2Qø+ÇáëŠ³®¸ormiš˜ZÞÔ‚~“pÕ?Ý–ýFçp¿Þ¾{¯š{M^>£˜™Ž‡~r`uï=ø@ò¶€¢Ó|ùr·~T;8 ÿß;l7¶êojû;õ£íæëoG?×ðÛ¸96Âý:(•Boö×?<JDzÛàl@Ž?RÖ›™š—½ß]ï( SÛoìQÚòdÈ}/˜Ú0€KÌa0ãinxðØM!8ív}¿Ó¨íÞ½“§%ÒSÇÿ”êÕ¶™„Ý¡ž¾
è3„,Œld†>²c"SJ
1ó{®,Ÿ#xSù¶!"6ÁªcÉJÅˆ	ç¸rœ-€U¸Vh§èoÃ«­ªgVlá Íêt:òàöFÕY>?ºŠyn–Œîò°A%=È¥ƒwJ]Q¨Â4lÔ’¸Ä³I Wƒ(¼R?»´0:[˜T—Šò0=•©)šòˆÕr“kˆ§
[iuíÎå6ÆþËoN.ÌÎ!lël;
#‹'
{oàž£˜B"ŒÖ]ÃµªhBºË?Lë>+çè_tP4€6äØ³Ž ¿”+X0,à¿íŒ—ümlv¤~Ÿ6 ½¸cXZ¯sà“%ãßÁníÝ.ÅÀ»çË 	…tE¸)˜rñN¹6—½ÁèèÑX$«Ãèbqi"Rb‹jÕ4jcÎˆÅ§?,U“ñ	Ë ±¸¶L~T’c#%5vßJ…0|ƒ¾u|tjö”¯wæw°¸‹ñ/yáî8öÒ(¶—¾aX"\ÂÂ~D£¹KðCsP†ü¶ò»Ÿžv×O{ò’48ÅFõs^Ç4Êó÷ìê™ÔKìƒðY£ó¼Ê)&\"1 6Ë*÷‰..Ý3ZLÏ ÞéFÓ³Ño÷à•>c	æñƒ³pÞûƒùÿ|›lÌ˜Éæ#§l>rè‡‚þØeõbzd„ÅR<ìªˆjâ­“«‰õÈÉÒƒLEmM£¼3v—aK_%H÷Œ½É4Üì¯,õŸu†9Å·Í±¯˜už2“°Nu&3cç‚ã˜½NãQÎ~Ê*F£PŒ„3ø7ò|OÉ3¿oÉ)ôÈqµR¢ÆóØé3ç{p´\:I65=€¶Ë’)V ³ùàÜ²°Ú_œ«ÉhNÕŸãHWb.%]´Äÿæ*®·ú¹Š·;µVçè ÕÜkvÍý»'SW<x9£ý²²÷šŠ¸]²©aZÎðrÛðvÉJ˜`óOËy±yÈíÚþv}÷~lú½ÞHy3¬áŠÝ0E´õõ,CóíîÖ·;Fx[±®ùzf)‚_³¨°º]Ð¸)Ã4ßÊ=§wpPo½h¶öŽ^6îÈ–7á,Ï‚³m/é4§J‡ÚWû‚e±‡ùÅ%¸oea(+	¹SÅjl£†dFÁåˆ6»[Ûªï¶yDPva/RFÖLÈü“´¬&øV5!`¦Lêº=†A¯V•àÿY­l
,]òÈOÓËÊ’R}¥º*WÏBñ…"_2ÖÎŒzkÖz
„<ÿ¹³fö‚Þã~pÖ¯è!Umw£‹©å:Ñ¨"PÅu¸ßL3o:Õ'ª$EÈ!KüõÇ¼x^pžL,<1êk<Þ¬œy¿r(§‹~'V@-~;qÌ54îYÑË„3gîÙ2õÏC–‹hØ«ZC,.!•¥u	ZðfVÖM±»rçªîá˜¢ceÛz=¯b•++‡¿:>ìzTk&µ]WåZ8?ŠzÚ7Ó<óÞÐšÎxê˜ìc/þI—mÊ2IÀ¨Th0îÇ§Q<ð{/ƒ3H{	jŒ©¡••=/÷¶›ûVmûŽŒ[jaÈø*:îR¡Mú…Ñ©›'¡2JõÜÇTÙÍæè¤…KÕÓÐK÷@î!¦MÖ†û*—¦÷|Þ	²AmêÓ))dlÌ*D¨k‰«ÓC–ž­zRö^BTtÃf¤Å-Ï:ðønIÆ"µ§Þ¹7ÄÀ´yþ
`zÆãla©´Åº5%,ÆxàÞŠÉ„Ë¯l²o¡€€^*ü	>ë+À×a¼$rÛg6¡¢.4–$ýÚpõ˜w‘°¦4	0Ÿ¢*ªZU*Y*Ej½·’~«¨ÍÀ½<õmßƒÔÜ§A7 °tI’àú¥Ý(î‘žï…˜›—<ºb¢V«’v4Ž!Þoâ]’ ] w«Á8LƒÇÌ×
êUµÔ¹<`o¾ Uïœ®žf>›…WÂ«óö’	Zy^µv‰Ä¬yþæu33kÏsçdÜYR¿Û“9!0È„yìÄ?h0‘l…^÷#óýÞÖ%S«‰Ñ‰WFÃ¹–Ö÷wn‡W^Y7È¬h5òc2–ÍÔÔlerbÝÄÎäŠø¥—‡†b«öišªNðáüPD=wäLL[E„EœËñÈ´á=ÇöŒë©0wgæ$Oú'æ¬ôËâ’µeqÀà8šaÇâLEs*Ò˜V³4ä¸©<õ,MNUuÏË°)óíeM=ÍW6üðBÖ3¹–lº¨¬ªD°äúA†+éY–IÕXLš{ÚR¨±Í4K²š{Ië¤º0ãêì“…zŽ™Zså”¹L¡Ë†ô9yÒÄ¥[uâÒr³àQóJ‰?ìÁ…—mßt¨L…4©"£ÌN¿¶ü3/îA‚ûwT0 ;þˆN`ûZ…“¨GyÉñ«€1„Ï‰Ë¼ñÎ}0îRá"¡’È%4×Í‘Ó8p¼fc&µ´&…¼³Ø÷TÈY¦²Ò•è”<zt*•—î!KÐ"¼_bRÏ‰ïiË½1H}¬aìÌëv!úxõÁƒã˜v¢˜âÝwÌ7(ÒCÖ="tß£ƒÇ†c‹vqzF—4>0OÂ
WÁYRù*˜¦´àJ°TàJú0œé‰©†lp§c\Øï<Š¡ücU4;./”äáÃ†[(¯(A¼£“…›,!xÂ« ¦K¡à½*Å,Z˜/ËCë/ÛqÀ,>˜½ná8%	àE/iáfPå÷¶!¢
²ë;Q
¤I†ýr|¹y€®äú”õÒ¼PÜ‡#ô_ÎNG—^˜^¶ðl£Þ[TÒkIR¤Ü?yB^PÍý£1E¢E­O˜ *xI2fˆKÿr²C"¸€¬T•æ(–Ô±ïó^>è^¸LûÚužz~QªY•¾ò\ÚR	w1…¼ò&|½¸8D®4Ì%¾¾Š@§6õËs5ï]˜–?ôÏ¢4 “ÚYn¬Éz|¯´ðAKFç**£ Ä˜Jý¶˜
7ÉQ[e}VµD†•>ÊÐ£q7ª›B^m·R'¡o&e³£ˆ+Ë’˜|º—†]ÚÈPà¾N0øÜŽý—,b nš	Õÿ4ò‡ÌyÇŸ{—'f†FÈÐ®"'·œ4=×OîeÜÌŒUJcŸË°'-ËânèkÔU,§Êè4¾ñ…°4~j\íE«¹÷OÌ×JÚ£s¾tÓðè4V¾5y‹e²ÞF,ç G£‘ß«P¾ËGV”¼–ÖÍÈƒd¸¾â^›øJP\ã’¶´Fç³Ö·Ûæþ\ˆ¹K/&Û^·Ç'ƒ IÀMHµ_àNJ_%7MÌQJ²Ê®äÎ<Z	W&[rÀ/­­¡±ƒ·¶
@ÉËþ ›¾Â–=™ç¸ ®s;Ò×ä6g.ÿ{å»VÙ@›g‡úÕ‚óå_6³í„[û•gÐ–pÑ¼˜"}tùìàì9†„Þ°¢—;ÊÑÁñqÞÐ‚+¢ŒŽkŸV¢QàˆûùÎîóc^²°¨ä¯îñÊèW&úY:êIVáM4ùÁ~Ô?‘£qïöàLr¢;Éãà³w~ö¯<ªãsé ›ËCÙêOaÚ1;ck°˜¢fç”õ†&«IYáª~G 3¦OÕx°LµJËõÆaºõÑ»Îh'ä;fÆß”#c®(Å'Ë`3x"ÏÑ6šiÝUsµ ‹¶c.G«§E`nO#fÑ7]9”‰Ïr.&:eAÐãTí\?Ð0AV«»'ç¥Ô=²ôRÍ2ïî]ÐÂm—X…I”´œj5Ìe™Þ¯Î=Œx4Ìö$ÂvßÖ\'æ†æ}2i”6=»ˆ6oÛ*›µŒ±«·@ä_R*8Ý<Tt{;0hqA¶­¨|Êd9–&›à¨LÄáÑ¸´äÂS	®Hô|9òåQdÕr"’E¿ÏS}WjàsR¡CZ£Z­®­«·5îùi©‰Á´¤i]f^(ô}áþhŸŠÓ¿J;]Ì…1Æü’(ŒWÎ÷Ôsöõ7«Î¶ã˜D*d«í¢Pg™pÅ‹Ÿfjm|àœŸdneêS’AœQ…ÎM6«dÇêªI%;W—Í)?kÍÖºpY;ö†	æ
t–ÏZ˜Ð×ÌúEôðKÞ¾Òð1öÃÍÄ°Ác¾{uÎéÞ6\ú¾ Ú(ï-ØøfÈµ.´@›Uþ5ax‘ôý'}?Ì¨ÐaÄ~’`yRåg³íh´’®3‰üì®h"W½ËíäzNÈ£+y^ýxx“{«]aHzþÉODŸ%‰¨daw5ÓÚô$ñe¼Íž)‰×çð7[¬õK$~__‘«Ïär&ïoæ]Ha£œ¦‹ÒVË¢—N7aK¦A Y€ä·òªðµXX<íû—OèÿXÎ«ú;„É6­»dÐm‰è‚q¤’ƒèû³~á (ÂäƒÐéAËïõ‚ÔEbé«N$¥ˆŸ#F§B§³á8ÊÇÜÞk•ÕÙQžšW‡µ§çÓAlàN7¼IZöñêâ`0ûrIëH,ƒxŸ5÷Á¤"ÂžÃ½ƒ4s*ÖWjÉå¥†ÒC2?]hL”œÄpKz#[ü's@[D‰½v^ÒRÙ…O/(y’ž–¾%úž°ÞüØk eBn¥¿“ø”Kh?õ†X–<7j¿_ù K©¬NŸ5vÖZÅ¥ã4ÞÙÜš»9­=ƒL™²IÄ·)gDt•Ž¼nwµb+—ó£Æi7Iýív£Sß!/š-ÊŠÐ–ÌÕ„Ô:uÒyÕh“ÝfóW¨µUÛÙÙ!ÿøûü÷?þþÿ¿Ç¶Ž8c[f+2%pö”âKn7jöLgNOUÞdk¤ØýHs¸cÏ-Â B=@Á €Ë7„NùcB	 éö}o„[Êƒ.%Bä‚¶Dqh4òÁ[>èŠ{!ñü„r’4è&›Ôœø)í™þCÎ¢ˆ¶ãw½1•Sè‡þwœƒX8ŒèZ©rrÄvÖó›rVsÈ™pVs?úîìK©6FrzîbTØî-@<Wøƒ‚€®‹SYT’~m…BÌza4ôEC†YàáÙ.\g«¡ÝøÐdiéÖ‡7Šn‰~ƒ˜²²n„^O®ÄrNHEéJ!”Êa>8ÍÄî5„\WøfOY`ÍÇ27¸J¿4ñ€I–(#HÀJÍ¤Êíh Ž­‰biÇå>uB-B¹)2˜Zfså„G}òéð/,“4øµ³ˆ¾[íÓŸà-4÷^¢+xÚS¶”ŽÁÕÃ‡ä„Rö¼žxÝi½ñè<J*¾__ÑoF–ê„!7SF¶¦Ž¬CG0™È<U&oèWÉ6`BJ.¼ ­ÊCzº¶byQ6b’ß@ŸJEnqSº}Šê^JYV\°3Çoú—¸ü¹Ú:Ö„d·(I ÙˆÁÃãômóXZŠTóïTâõN5øÑv‰ÂHHQ.rÊœ‹zô¤4Â”ÀÈÕ]û¾ä®ÝÚvPÿôSŠüËŒ€$g#›¤AÁo.étØe:Š;*4^gÙ»^2öÂ)+¿‹²Owœúl-ŠÂ ç@üs•x`8Ûè1Œ<ÄµÕiK/“@‰s{g%÷.0îöŒŒ»¡0îvÎ¸ÛÆ­ªûNÖ]’m‹Å¯ÔÆi´õ|Œ7i°íl;*ÃèÂRc¿Ñª·_‘Úþ~óp»¾Wßï|pÍkÂè"çêÞÙdÉ`â9hrù ÛfÀ4ešN›ÕÞÈNtÇIB(Iòýe3…‰;dÖ.CÒm¸±±¡!®P¿+–‡Ýâ2ÌŒÚ91‹†KÔ‹Ú°}È2‚XÌrTT8`7cÈÀ†Â Ø¿ƒË† Y¤KÙ™…™\ƒM·³½9;•ó<˜®×’iNšÍ¥Úº¢­wo£éøKtƒeÓ¥ˆöâØ»DgVJçüa7n‚Á`œÂA	·óXuY-_ÊZ¿àqXÀpæ²lÚnN3ŠÁ#Æ¦µ§‹»ú,§ÙË`'ðâSHéMšzÝ>cù¼ß˜?Œ.tµÏj^ÃáÞæ¸ë2NO)Rh€Ë·^2ÂMiÐbFË›QìrÓbfºët§Yî¦5µVºCK¥ô`Ü·òº0‚VIŸõç±óá<¦Ûúà¹{<7bóƒçFì~ðLÓ‰á±˜qàù°Rl„ç~Ûqöel‚ð\Û.ÏMØá¹û <× 0ÃVXŽa:M‡³òÛ¹,‰ð|Ì(²*òµ»Ë"Î©œuž›°0Âs3VFxnÈÒOYÀ×ÞX$'»åpºõ·eÅ»UÊàÏ=5L–Úç3NÂcì•d¤œ•^}†}»/¶Ë²ã½ûeÑÆÞú}n{fiÐ¹3›¦};
N&½³Ù…ÝÜ9°1“õž’Pxf>¼œj	…§„5”»e‹(ßÀ¬¢Óögf#)<×4”²YÜ¼±÷Ÿ{[Þ¤­Åš½Q·38¬«Ò\‹,¬ðèç²âßÙ¾Ï{i4kL°KdW-dŒ5>±Ýr…½Ò¦¦Áñ‰áÝ&®V'”¯öÆ¡ß3°ˆ;"v"î¶¼‘]7Ó
Ún¬šïµÚ3XMd[?Ö,ˆ ò‚rí"¼†HSÃ‰O¤»º¦×ÿv7´øjn•1‹È¨jÆ?64~2í:¨ý§ŠìáÕÝ9YûíNíe«¶wtÐ¼«¤_J§Q‚ «Ñ*ô§ÞYì^dßYÀ]¹.Uu^xàË/n@¢‹‚pèËdµºÎè¸ÚD_ÏRbxc´v½ú	è§P{¥º–9®¸’J»)î!?øit0QIŠR»|–`7ËÇ¥Jï‚Þ£ ùü;©ô»Jßds†¡äW'ºökÚ]œ7­¬Óÿk¬í1¼ÎXÞåãÐ¹!Ü1[¥+™7ùÒÛ’æÃÞÍ%o©©Æà°+Õ•uÚ"ýg•¶K»ú{Lø=¸Œc5|8æm† ãÚÆTñù÷ašt5û"a7‚"f|Wö>/ˆƒ•êñ…Èß¸¬C`“_z˜hÐ²ˆO¸­DwÛÇ;¾ˆsdå9©d^×j×«Š¯6É—så6õVP¾ÌÎm%Ÿ ùºÖüa¥úàWÂèÐþâ „Aa¿¥:â°ò(§¿â°íÚ&·75|æ´qÛgÃ/Ñ¶uøúß@¤lš.ÿ‚”f»pë$2+oß‹ýdÁ ã@@ß2Dö†—êáïtõªØxkÚk÷QŠ
‚ªË¨ÑNdõÃ.Úgda³J¥p©øt«+»Ð”…Ð–ê–²´~ï°´–=´²ß¤*K‰Î
½8¶…¦	×˜ £j¹hàŒO•K˜f%Gìª¡Æ™9ˆä×O|½h;”‹LyCZ2Lú¡‹ßI{É2†lý6$öþ¾¸æ(Ùˆ$ºDKIÙ²,‘„âŒQ¬‡)Ò†tgq°T‚b
Ù^Žõg#–Q\÷º}Ñ¨®óYvúý Úò@ä(›Æ*àÂ²^£r•6|¡,›æ³Kh]rïn¶ÇÒ\Ðb"[÷ö¡¹·téœÈ#
}P×ozycí«¨ÕÒ®¥–\M­‘9×Õ5j–”YÄ}™=-K÷Ç?9h„¢Àš³›EGkwš­wwŸ÷’RË6ZœIÙø{>1ÛÉNK‰Æ¥÷ïîì¼HÏù®˜›áð²&8•O©CO«~·Àî\Ï_]¹¦¢ÿTQôs-l.¨¥Ã‘µ¡¦¯_CMg-C+ÏÊ¨éç| v5ëé¬Íb=Ý¢ïŸó¡X”ôU¦£¯s}uôÕuTÒ±ÚÍÙ u¿åCRŒÁÏÙèÐ9äµÑ!ñae'}3º¿w\ ¾EO2‡¡?Bômg…öóÜVôz÷Gh‡-æDþtÓP,øMhÿ&´ÚÿI…öùeoÛ+Ž´š/»×dy/$Ô’›cÃ·‚Èà|'Aä(½?ÅCúò&DÙíæÞÞá~£seè+Ø8Ä©˜»Y´µ6™÷W,…‹%åÆh.?Ì¾Ï/š»»Í7Ò>ïl_Wcaå7#þ¡@¿™/d>Ë¦.‹ÊVƒk;Õ Á­"KVzIMâiinCË&j¡µºàã”,Š¸óúBéÂ´<X¸®e¶¹,4ë»x”Ï•fõG]Y¾<ûR×
Ée”ERÏÞ–×ýX?çzHÙ‘«ïÒ…¤§Ñ5y+"g©}Ë¶$èá}‚<£2%ÞƒBG‹F¨>Ñ¬ñáƒ:Pž½ [Lœ@Jyh.¨î¤s©rkÆ ÐlÜ@)NWÁ)ç5Ï9g9é¼öYgÉÓÎÛ9ï¼Oö®b½ô
¶¥g)ÏÜÆàÌÚšµ@›,ó.6ÞOÓQ²ñä	s9GÏQè%ý*UÚŸààãÕõÕÕ~\ýñÙÚ?þô¸ûÓ½§½µ½ÕÞ÷›Þ8ž³{8ÒçÝ8ýá¯ÏŸ­üáâùÓï\‘ÆœQ@6Î3?åËý.æI¨´
ÜúÜ³A{PÊî§Sn·¸NH!M @HòèŠq‚7À«%3Â¨WVø¡)›ªñamCì–ü©Ä-Àìäô™~7d¶£ÓÕ5­zÙÄÇù,µ¾û:ÊDÚN™¼—wíÙW‰Ê™„ÞZO.#ÕÖ-Ï‰ÃÞùyj­e÷Ô6
4¼i'àâÚð+0ãÌ>××agBÉAï­æxwãÂ¾Í†U$üîç§‰ Ñø4S?^DÇã!`ô¼w¡ Î3»ÍÚÎÑvmÿu­}]P™ËÂë‚›Ò–_Ý©¤dÉZª¦iÐÀœÅÒ<óÊ{Ò:Î¾¢\àŠ|eô‚
ö†ç^òÎJœJˆò¯¨˜BÁÜt[ìó
#Ê`xJ(
}‚elùy›A¿U£G‡ÚîÖáÞW…q5^Ú®,:<Šã1`AìÀ‚<i¸Œ Y¢öëA¾žÆDœ°ßú‰årorfV={Ì´HÎ:—ÇJ‡%03Ç¶òØ™×™C%ç?rä]ú:±—[y;_;Í_ïïU„4ø˜Fïñ=¹‰éÞ	kEÞ	J[…î	¥n»'{'ðfž<!u‚Ší;¾ç-Ã=h/¼ð.YêIÚ÷¤»¼eÐ3;¬WÎq¥Ê«eñM`®	«Kê×¯®üžtû¸Tpò<ˆ½uquïñë{l K«­ÿ	¬èÏd‚æZ>i@‹?2oÞºú"~‚¤¦»„$ßQÌÍ	¹Õ¾Éþ¨ÛfaÇN½0ñåg<ÃñA4Ú¦KÎPŠI3´
g¶VF! 3qš¼	Òþb…ŠêGÍh%2Õ8þ¹­¥g*B¼ýØ…^×ç/Ó5°_f]02ÉÄ)·BWuÎ²ÆÃà¯cŸŸÚc¿ßâM™‘ÌíàEÙõØŸµâöÐW Ÿ?>'k¾âJÆT˜&-™.}[y¶ˆBWMc/HYŠNð±CQúUVôuÉÿÔ1x²§û1qÇ"›¿Q¹kKrK®¦¬>K$]„Í%‰Ù|–rž‘ÉžFÜ’§;,±÷yA¶QfRHE{"” Ž'C/0¥²/ó;Au1ô`¯–^ç”Õjù¥±´€=¬‹N2Ôd^Øž…Šq¤×£í¥tV·›Õzæ2'|å üU4ðé`M«‚©KÍyZ^	9Š‘RÁ®Í,/ï¢ÈVùß™O™únY¾‘ö”|À™ñÒ4íM9–Ê7ÀFó89‘(§eG@ªiÆp³SèÈ"üÉ“amJ™WàêÒ¢Z‰MRÁ¦YÒlÝ°ô—<ÜPŽq²ÃáÇat1”ÕÁâmQ\Š›ÎR¥,ò{ž¶JYá	ùK1Ö€X i“&œ
R–å{z°«r‘Ú\±ÑJ‡hsDœ)FÕ¬	©ä ï%%sb¢Ï½ðUq¹·#Bl(ôÈ~+^Tµ“å‘rÏNÆ"ßN¹ Í7þZÞùHîv¾ª4QÒÕåà°µýªÖê.8˜í5ï63|—çZÎÆyá²úÂQlÓ6ÎðòB.xñ™Ÿb¬Šü%j;®9ÒÞ6^šÉI#Æ,è^¶/'‘ÜWgÁÐ·y­žŸ¤Á €©å'ã0Mö‚aÑWï“ôµ7¦¬ƒòÃPÅjâ!Cà ú<¿/UÑØŒ
Ýj¼ó36MP±Ì‚˜eì ã¯é÷¹y%\w!@ò§ìh
Êp•å<WYÎ…¬ÀÛXâ±dTØ †5'ËÎìs%¹A©_/ð  U|qJAãÑiLùÌ’Òo J¶`çhï+FRÓ¬ˆ°v ´²ÈOˆªõIZý|Sþ¨µ¾¤f;•®TŸ.9zqò^‘sÍÛ«6›?2S€£ïm«r¢­¸	ùH7ŸBFúnrÆmà¬Jenàˆ}8ºÖFÚÆòÔ¢›5ãž›×ÎA„:f¨tÄ²ûúG®vÐ],.Mè/E8¨¦•©´øô‡%E”°_kËä‡¥‰$æ •uÙã Ób„ë…àUR¸òœoHC•Åœ:,àŸx_´ ß‡‘•>|ÑÉ5?‰èlæz_ŽúVgÕJ¼­TônXø2™®mÊ¿„æ

'F’›²àNŒúIËÂƒïlh¿q…·k¤lühÃú=‹´îlìª[©:4T64§iÖF¡]»¾m”Û6ñï²ý‘„µFy¥u }Í„kÎqÚIŠ×–ôæv™¦`!À%š®Þ $:Hb©†WÌ¡Ê«²QDçÊu°.u 7ª¨CáòÇ¼`ìCÊJ¦–DÃë*2þBê¶u½Cœq:·à¶eR’YtvzÐD–Q?àkÄmåTúÅ~BáÓ´$p‘Ær8#;²Ý nrº®·¥üfv•1	'ª®unñ$;¯žóCgŠîy5äQ”\x,«çÕÌ0ù‰Ð’a—5µJå¬×åÔe;íZ’{Ë>}AÝP|—m¸@ÿØ ÚðÚ ¾ZEj¬J¶‚LŽà/
…W”¼Æupî±ÕØÝm4÷ÛGÛ»‡[G½ÚËkëœWhIš·gwû­Š•\÷ŽiYyNS‰ÑWG–eˆ´:Lóõ]ÖšÀB¶Ú¶€JZ¸²å!ñŠ}Àuu«àÜÅé!o¥º6t`YâŸu•Cmcxi.X¼b$7\»
â{1"`™eï£ÓS?ÞÌó-UN‚0„(ŠÛáøD;ñ±Fõ¤-©È„Ín0¶ÔÑ2ø+Ž æèt˜2‹-‡äH§Ü8ÌFƒ­gt4_kyÍ,&Ø©æWÊßPé¨´GQœ^VôO.Ü:¯$æçñ	Dú¤ºÉ»h“-¾ V”PÀüëØ' ÛÑ°ëÇ)ÙñS:DR>N¢¥†Ç¯=60¼üàÁŸ®ã¹O{êB¦­Ó1ä1ˆý®OÁ¢G.¡W&ÎC$Ca˜çÔáŒØpà8\øûðÁˆòÞåÃ†äÀ‹ƒ„\@´ò!ñN(C j>†eì¬Ê§Þ¢Âg#ù1zßÓvªšä}‚çú‰ïSˆï£ËI‚hQ¤1õ½AõÁƒ_}DN¨àò|GéD£¸—Ð÷	ßÒ¡¥%tÛxƒ¤å{½v¾l‚ä/‹Fd;†õecäH9{“Ö0áÿïÁMGº©“eÁ“þ,€§Úü»0	¸œ™-xÜèžR  T“ª¥g> HëçYÚ6CXw–÷B,¥
 úþË‡ÎjÊO¹-³Ål§j„µé'kî“ÄH qC;ªâLÛPŽÖIá.¹Ñ˜âg<òL:°J¸¤!Ná‚HÊ02¹¡Íý!ÛÜõ96WDÿaÆÍ•¢ç=›}ss]9<¥ETŠè~T°§G¥R_vOÛŽ€5Ù@:å¥ôpKâ½yÇŒG¢ÊÉ¬º•,üÀÙ‰Úö;H³ )mË
 BN% §nX¹ÕA)1·)/.M m‰œjÇ¾LÒƒ<:ôvã(I(ð¯n	˜}X £°‹þBÂõ%Ú[ê ´}rØ@ÜèìýEÓnyüÒ¾0”QÐ
—"ÃŒè>Ó ÞAJ'æ1O:¯•‰ÇÍýdá –›öò%Ç%ôzZbà¥éÂœF†m ŒB‰èÐa€¹¡@¨nõ²i™Û	 ï2J7QÒ~Œúž]ób§¨êL‰Õ}b¦ãÚ’Údm{»~Ð9zYßo¶š/^Ô[×W#…ö(‡ÛQå>§²Ceã`Ì’’ÆÝ‚¾$5*R0Á2*~]Åæ‹4åo×™ð«(êþKÜ¹¦XvL]†™?_jû>ÝžcUc¿So½nÔß”Á,¦ÜK¤Ac3´~CM9	í®!×°XN¤Y>´8âåœ¥
fY¦`'¶"Æ+S
ª}i¸q.\iTŽÀ^/³Ï³1Ã³æÌO_á±äH²W.ÙœmV×§zÈXQ­(¿ÕÞÓñIqŠ‹Úþv}×Å£J¥‡„¦h@œi6÷;¯ê­ÚN­õq–aœÑ°Ó÷[^Ï‹qŒ3g–³0È¯+Î¥z6«kpÌ¦ºespÍ¼I9-Á;%ä:¨·^4[{@æâ Ú$¾b.ªÍôšœ”%R}<F;¨Âh¦Z/:­|ã³·Æg×VJóYAo†×°¶Òüv¦¡•å¹VûÕÎ7v[†Ý¦qÒï}ã´y+÷šÓv²ÝšƒÉbåÙø+C¤ë²Ö|Ô_1WÍ'ù¡~õUÆÃ›á¥v–UÞ^r@e9è‹Úînsÿ¦Xh„óvuäëd¨§^FÃ{ÂQyh‹ NÒvê Èó¬r¶lä=ªHƒÞÜãÎ«a+³¡–‘YÌÏöÐMpv]J¿àh[iðK k×`ñ/røÙ˜†:p×mHëê˜Î÷9ú¿nìÔ›s±|i…þgœé_ÂÏ@tBÝmP»¾ ;«veüêè±†ù €µÁÏŒ<q~v—ÛióÃWp¸Q1c›_¼Ð£ƒÀ7î]Çn¸¿‘ñ°çŸò»ù8ºüšˆâŸÈ¿e(¿KDdb!nuÛ®×Ïç™á#ÜT‚¬NtšÛ“7¤hMé\/8s}Õ÷iAñ.X ÷—	ƒKÂ¡úàÁ/íö7JÕÿIÒè…»Ï^?{ºÝ=6)»êW_6û™béÈaÒüã%%Œ˜æÅr°“—‡AŠ£a4îG
=hAb4DÅº*/›°	õý'ý`PQè&¼V_m6’@+”å*U°DoVÚ÷/[û¼ÉôInbAr3“°¼e“ÌØóìÄÑï)¾—ªÇþ¹ï…‰¢>)%®Œ}œo˜êÈ¡Vó	ýß ¹7ŒP™€¯S/bÁ™XÀú¾±0 Ÿ.IÒõbæ›y
þ—„Ž<)‚PÊGNÆ)iP€F÷Ú
ø}òVª¤±Ðc/@?‚W+J(ã!žxx‰%¡íaÑlzùCò×O¸õàZ«¯
°ÿ‰â{ Ž£@ò<Ú7Åµà¬Ÿ’atA¥µt!a“ê€1´œ1 /üHÇsBg‡Î@ßƒû8äÄïS¬tì‚xáÉx ä…ãà&#1ì:Ih`¼0úb ŽZtØ”.y!¹ˆâä¼F”îaå}qÚ‡QP‰è,”AK1ÿJÊGWà½/ð1ÒŠò K&-œÈ¬C€Iô²,à·[„ü»ŠeœQþ6ÝÁë©+#p9¯%G-¹òt/¯gN'¯)1­ÅŸ’ˆÃ}2gx¾#öÈ0˜\çäÈšyÃ–œYGªjÊÃI”ö+rR-W½u¨"ë¼šYbffˆWGgò‚21]Rk¬+šu*‰î Ù°lqõ@^…c—¯ù»{vcó¶Õ©†fW­\Š•Kšr’)z¢g§Åa²(mBQ¯ëÙPvvŽj­N£Ý¹™+W×QzD+÷(Î²¢‘T1¨dq²˜=¸ 8›ãïØL³˜¼ô½X¦1Uxa*$÷ZÍ—WÓPØäËÙ
Îs™O‚§Òùg…§×JÌ °ìù]e¡K[ÛE˜7Z°oÈ²VE,¸ú~^Ð<¨ÔZµ?ÿ¹qtðªÙ¹SèÔÁê R¸ØŒ.R€<LóRr”Žî5üŒ¼‘{¿ýà*L…­¸fÔ•‚g˜Ù©ïÖ•ü~Ívç.¡æ^ïb–Í‚_°fÒ“Ñ‹d#T†~AÅD¤eÕA?ÂeUöðþW™¼ëdã_ÆòTÆS³‹Œ1»õ/þuì |ºÆòptw.UÜëýSã<L¶†{Ç| ˆšoí»'"”Ì¼}ízç¨vppÔlí\ÿ|ö«Ý¸ØïíÝƒ8Òëè¬/+¨3=o4ÂÔ”ò“9±ð¾èŠ÷z3U]Ë¥Òrì ËÞ/M¢S‚¿ ä;²‚XKðÊDH7>ÏìÈ:7½/šÛ°»†®3UÓÌ©­´ßçü<KÚïsëžB¤¤ wÃû}Ô¡{½å†zâÖE2‘åÙ›Ú¯Ú~ûM½Eµƒ-Íû¯‡õv§ÑÜ¿Á IÞ0¹ðãÏàÔ0
½K?>LÐÄ+Ÿ‘û¡ßMýÞ~¤XðJÒ½OðÑ<#&dqŒ§Äc9¾|Qóò>äYÁ7\}åÍ'¬-¨Q>µB%®¹Í·‹uâc'¾æÆ¥E`Š¸¿n²CpÀòn2ºäï 4šêìòyÜÐ m³Ü)<e¨ž>eFW4ãkº¢1ïÍ¹¦ˆJž¢8dO:º²Pqz0Ú;~t•Ã?—ôz½ØÇPðd˜â^O„6:óâ>ºbÝ‹(ŸùißdãÁƒÊ£+†Í“J~D™;i8†n÷Õ(5ìh˜é¯cˆ71ãEÃ5,”Î¦Yù]©7‰FL^`ú9é÷Êiå²uÓOIŸñºOç„ñ}ÙÀ/*I_+tï”Ìmgðx!%Â«+”:®6éòq+80•ŠR1·[¶¼%<·g<Ä£äQsÿhï]û VîâÃ­e¨Ú)CR–ÙKUý}~®rÙy]Ñ¯´€ƒüƒ$\i»%•’(=p‰“0:[ýa™œŒC:–`ˆ?¥K)  ¯¤GyžRê*y–Õõü½¥ƒ®é(B´µ¨fãÕ¼£ˆa)(T‰=…Çâ¡ë£R^¨…&Ë:Jºf üPMÂ ë/B–Á•%“KKË½+tg;òÔº#«×ßNS÷#e…*ûþÙ¢µ0~^E_á{»kbžŽ][/Þ´œ¸vOD•oTÅ%F«¡¤…ríöºu·%¬ÔfÇ;oóT°ö>óÚOžZ¯Gwtx™Åƒðh,$4”–%ˆiNÀÒ‚Î”%Zñeµ;
óÞÙÅ2L‰A("oý,µ£¼dd7xßfú·››žÀƒáß,ï‹Ò~É³´ÖõBÕhEøƒ¥45ŠM´7JÂ0eÁg¡LÄ­ûY‚‰H‹zIz@ÛëDt<ô“7—o_À®®áò(è_Ø6»žVJr'u§Ð8tÝ_‚/(ó‚¥ÈCµŠ ó}¨‘Ìp*ýS¨_)ŽeçW_F&,I6ÚÐ6ðV¥[¤Å<£pAê+)íðwõž'wÕáÁ\	âr0¤®zÑØ½©«î§t;ˆ"fÌ¬DK.,Ç¢i€·?»Ûg1—C4,ø /•ëË¨fô«—(Ã`œÝYG U2ç­|/è=FÏ^Ä?ì•íZ®aô+}ü2Tð’t§lf:®æ¾½)Ø¿2+¶´˜%Ø`6“SsHFÁ,Í6dpÞ.—]‘‰ž“ü½q˜£0À•\…d®VÆ€ysÕ6,YÇ³Ù«Ã³&H†	Ò¿‡ÖÑ|g—†‘áýQ‰T«Ùæ‹R;[1³q¬¬-±„»k˜¡]äÜUDµí§Q³´½Ê’ÀcÚh–ý}µuôë­Bád×D–Ñ‹ÝáejŽœGã¯ã(õ›§p^äPÛT»|)‡÷#CèŠ	Ï/þè§GÌˆ‹RôC©…j0A.\óma…·£`Xtq…ÌGÊòªÕ4è~„­'¸-õÐ¼TÀo…ÔXm¼œ¦ (ûsv¿êÌÁQL›Œþ9óR½'ŸÝ,Ae­ç{¡z\#ÆÖk+[í«Á°Ž{~‚«}/é§Þ™ZfÉÌ¯žÙ@Õe‚zÝ
¿÷Æ&šÓ_´i1KòùÛK?Ð…¤¦IÂ¹Â2õìîîðvhV¦µ)>*o7È1›(×wÑÀ0ŸéK¶;º·qz"‘üÀ–ÚÝz	MŽVnªh™Øóñ—q"¢¥rwuA°6Ä¦ƒ½rð™øŠÏ~Öoþå æáŽ$¿*®»dñoÔ˜°w…Î!ËBe$	­˜S^Ë½ÒÚÏ:gm¨Ðz'~ØÎ>N·K)ƒ±™£ä,«a¡˜?)+G©l*b!‹a—baýÛ)ˆyaq'Í3?;êáMU{-ø¤WãéZòî*Iå³!+ÖNè¨¢ÓK©G*±B5¾£ sÁ9¶JÕ¥¨ò†[ùˆL’l÷H””µƒ¤y²<µëÉ±›PK³|= fTè
¤ 0Sw†½K:QK\46…h	‚9æä”ZUR–,«‹˜ËÈÞWÁÍ hƒäFªqÑ¾íŒQ}SÚËGÛ.èsb[ák±ºl¶»ƒGÇ®ŒqéÃ4Ð·ÒfðQ U2®=‘²u€UhøŠ 3<ÛcÙÔxJã8‰œ™sa«¥6”éXG$k>`\:C¿ÐÅü°I¡èU ia—P4Ã²¤€K6hRûu„ùc›ï1YÜ€?>ºÒZû•}–ÉÂÒ„\aH…_JaÌÝ`D‡ÏÒ‚I´£7öAòè³	üw¦ûÁ>¹/Â—º
?õ2¼-«Ð>s³áØ+‚.`D	ü&EÝIB=,²ÇÖIU_Ixy¬‚<ÆÒÇ
ÊéÔòÓýKž­H>"Ú‰Fél+–L-ð”p4Yw¦‚Ç-U–—­ì6¾K
/•7<ø%YaÈ,ì¥Ê½—€‡V£
OsX”åÐqîS.ä
QGGÙZE© þÈ_5tÙT>–×Â*™![àÙ(jÌµE´gÿ’Eoyàxï\*G„»X*#°ÎµVÊ¨'_‘Ëé1|²ø7I-ž²6Ê7÷:é%¦–GÀ1·âÅ¶DÎÌ±{½^Ò¾Oc·Ü6îTäbºÖ£æ	ãÝXÙåŸ½8˜§.ñ<ÏeÜäL˜~cy”%Sx‚ReB@á€èCT¼YHH?¢‚µ5$]Í1F&!4ìÈOO#LhöàìÑjœã!p{„:”³ |ð4HI·À@!±XxY%ÿøûüÿøû¿ÿO+óÓö¥Ày>k,Hì®÷Þ‚‹Äj¶”xÛÔ‘Ù¼d£{þ|¨ŽãÐBr²# Y¹~æUº:'×ž¥zü2Lÿ§Eæ¸QžÏñQå÷TžßîûÝ û¢lMD"dJ¡ÀÔÅDOBEjW*ÖÅ—ON¢Ën”R4g¦òhÈbSq‘ª.¢” „Y(^Ê{ˆ>ŒØ¾Ðó¬9Nó
šî€:­©ä¯U±C’GXùÀ¡s·ÐÚ	w™Ùñ#o
;bf¥kÐ?œå;(ŠYU*ÈŽB¯ë/>yÿoÞãßjÿ¼òø§OÎ¨±°¤æ@T›„õ=õ(u‰B›Ñ²¨†Ñœb™úoŠe$ÕÌtâÜõ±1H€óƒ/<Y€Ÿ¯}ðÚ÷ñ’ÂÃ÷Œ¤KJ©tû”ÓõàOvœ½QB‰CåCn'‡3»%¦ÐÅÞÒ’[‡%võ1Šë^·¿¸8X2­õ™"ê<¿DýÒªCÂçMç:š+9¸·‹húm)c?¦l.@+é}DÕ4ÚÆäØhD­„LÊ–†…wžh¿yUº_µ8ö.«§1¥¬@˜Ú~ºÈ?.©$plà‹e*¯|šJ°~!¨ÀN2¶Šü£m¸¿óHâÞ`-†4Kõ‚°€ ð_¤(£#·wÇ)µ}>Ù,% ]˜>ÎútUgÆh _¼á¬TÐhÖZ×/Ï)‡µ›t(KÜRyðj¼ô–%rõ?QÒGø1]òÐÒ?»gÍìQÑn"~Ìâ9Þj¾Ûnv:¤óªÑ&­ún½Ö®?$oêäMm¿f$i´œ·[µí_’ßñ]	2!¿{Ñª×E]öf«ÕØ)¿‚ÚT¦üßÿ~l—¸Žwšd¿Ù!íN«^Ûcã;Üï4vÕAMè ;‡­ý6é4	Êâ×™kPÌ˜^BÄ;¥D“ö-mòÝ!'°>Ú?`Ž¬ôæCRÛj7w;õÝw0ßê­{?ÒÇñœü¹ÞjòÕm“­æ9l_sÑlB²‰kD‡N‰â%©½“\¨gt"‚fçšÕ$øË÷‹”x‚h”Ûý½Vþœº¼DPNÓÚÎ‹ì¨§KWŸR:gþˆé¹¾g
(¬˜£Ì	ÌWM!Ê¥3Ïnµ­»[š®…ü¸¢è@Î–Šô‘üÑY´û­¶2à^ ¨ 7œ,;É.ê'Ó‰î«è‚tik—Ñ8S[$‚rÑ‡`ðÂR>IÁp/Óª“ÿ§ç¨ü¥‚T%éøôy3sËmon’N1êO‘‹Œhãÿ]@P.¼KœÀÙø’©l™å­®Ix'	Ü‡äpxâ‡îAürÚÕ¹ºzÓ÷iã´¦6è‡äÜ;¨´o´n€!~ô=Ê¯@XÁöËR'e¿Ñ&s}>mÊŒ!Ï®MšVœf‘ü™Nš¾_íüðY)S¡R¤Ö˜è¾	6PpŸ+Zm7TG´´¢vk#žü:ÕJæêŸºAÊì2ÿ
®9”6øCŠ¤vƒÅ4AŸ{­Zˆêñ…OFTãòYTõ4€Õè@Ú÷ßNÇŽ£>\E9‹zV“êÂ£+n¸Çt0	l4ÓÆ~E²¸
¢÷ð¡Ù…ÕVËžS¸×O[èÂÇ30s%Þ¹G§Œ˜í]x#&~Öè,Ögáž¦gÚ½2Ù$=Ò~Uû•Êwæº®)8æÓqÿeZDƒø½ª;f<-žï,âsõ‡<ä{4ôµ~>…j__ú éXˆPPcÞÚnc´ÝIº§©Pé-ÄªøÛßÊµhà.ëÂ‚èªqÅU@2·ØŠ¼—-/ÜSÖ c%JcÅÉ/N «¹@jòpùU osŸÊ`Ce9Q~:“÷k}æ(;›¥2–%Q³Ôt¦µ^`Á‡ç&øÕtNµ>UˆžÆ¤&:²²¾¡ÆOKä#ÙÍúy‰Ddy`¦Ã' ¦œ ÷û•ìqžaF}Çí•¸ó¸æíèÀ„o:{Y}ùc4N1ÀŒ+°°¡j^Ó†ÈÚÝ?¼¤7µ!)s¨%Æ=wfp;ˆƒ®¿ájY.Ð^]Y·&7Š.Ø»’·I‡„å;—`‹ã(k•„¤’yÉŸå
·~†ÍŸ¾ýóÀuA`Ý<ÕäQÉ1Ý!îG)åþÑøŒ
`°´ÊwÛ.™x°M âDCd©‚-‡
uVdÑÌ¦­±¹‘ÛÖ€QÝrŠ•ý¼"^š›·°bÎ´l]©³ÅR5ÄÅúU‰…[*ö¨q	®¯ü^D«ôüAÔ½´Bþrðh|]Oñ‰F‡k|10w¨<ª†nÐwÅ9Ò_ÈSír…ÑìÚ:Þy
aŒ1¡ª¾¦—: ¢O²˜‹4òi=¬®Ë{c]1©’¸µ5ð>É–Â€e©æc½ó»ðÀ/á=3[#ÝsÆå7žÝ Õ
	æ¥zt¥î\€TƒÙá?‚.ê0­|W'`]ë°G¨Ä~ô€Íƒ>Ê­UÄ;î©jÛu$¼ëÉv×sÐpËsfŠ¤©®óch)96ï«oš—úb¼[{‹œÒš½Krá\`þ:0Ôò}ÄTIî”!Äb9L¤P°ƒÖdï‡ÃèÔûüýÿù_šž~=uèºªÐuÕ ëy4™ªÏDE ’'s—?¹Swù€…£¤$¬æ¾w~IN¼îG*ðô	ø1°\ˆ´_~Búg¿ ˆ++f÷÷IN…ñvÁ¥Fg¡gw
B·é'mºŒÔýI‡+™Âu÷¼îî–`ìU5¡ê:FI+LBw‚´ÏÍ¥÷Q»ðB²Ašúº)ïÎ“öÂsó/%Ñ8¦Óâ†S´FšÖ×“¨wIk½òÃ¿%h_~ðàOï¨b,â°J\ý"‡RZO  i$íÚ÷eüpDÀ]ñ,øI-9RàSd	ù8Œ.`kiƒp®ÅcŒè’H_yZB2Së’–ï¡%ŒŠ»êG3œr‰S…ÝOâÖ¬Ò%Tö‚ÛØº†u£q°lK°ÔÈWã§ôïã¬»æÀŠ¶St¦RÉ8«ZË@q#» •B×‘D.b’Úï—AÉƒ”/Nðž=ùž•2Å¼;VeIœXï¥U?Ø}wÔi½½ó´Kâb6ËB´l„ÊÈumñÓ•6†þÐ3ä³où_ó]À7nÜk—ìËÜŠç,vEÚe´Úmxã<«b	.²9ŽðôMÖÈÞ:Vø.['ž¸5,Þñd6ËÒÊ~pðZ# 84”áÆÒ—S©È¶ó(‡\íún}»CQ«¶½Ý<Ü¿vÝ‹Õ*‰ÏêRZ£)™ùsº]PlU2\r•[uLÕpÔ>hv/Þ½®·/Ûµ›HÞpz¦yÖg›¨ÉÕ2¥_<¯O‚4öâKÒÇ½Ð¿O»ïž´™®-Tv–`®|]¯íµû/wëGVmû×#Ä›æ›;ÝI…NK=¦„û`¡[Ç'²Mßº‚ÑJ1@lš*¥À<"ƒ¡¡ÂVÓvù•]S;÷½Ðïuà²[£gÏþ¸(U¯ê5ÐªM‰¥‹U¨1ŒhßËâºÐ†<Í"æB+É¼Emõ^¢‹%¸šwiv÷A›3*Î´XÍ–9Zh8¼ÏÒ!Æ¡!)V³¯hç§EDå{ë¤ÙÕAÒÓlq46©2Cyeµ &ª±@êŠN "êdi:N[†;ß0§ÎWèRÅt
h’–’"¬FelÒ÷Ÿ+L?»þÈ³A"˜Ð—v0øBuÜØÍ¨PmÖ//º¤|Z^gÖwÆ¢Ò±Y•Çþ{ëÔ†ØJjÄÊv§-îpV">ÅRv>§µd9ÖÓJ¨Ç{9¯É§ ÊO ÙouVàhÆÌÚP°É¢üÀ‚èÒt^* 5BÕeFN_äÌøS,.6×V‚p	û¹vO‹l®›ä8ƒ=4è)&Á…„]!†a’ú)›Âdüãïÿ×ÿÿàAsœ·Iù¤š»•oÌÝÅÆƒÇJ0R#Ê°hWÁ“M†Ð©¸a»LJ_ÆàS‹vü»GW˜Î'àž™NŽUï¨ò?àLV–þ#á¸`ÎwªÉhPÞoÃîQêtJu1ŸíªýúŒIœòS©™“8É”I‰Z˜}øðe8lNH2ßBw#
’ëüägézBlÆ}ó’‚aÚ/ÙzÎ!
ì6k;¹æx÷‰tï¯LYZDóL/ºæÌ_ë8°H]ß”½[Qö¶ß½½¯v.æ­ù'3IRœm¯ú”h‚ó3At[aì@…Ì¨XNXë¢rnÐÒ…À×r¡œó¢í`Øõó¦øØ©eP©C"ÍRç‰Mg`ðâ˜¸ò–ÔØ’$äd+C*²H¼>;é­¼ñÃn4ÀðƒoÁw`Pá1/ÈOváö_nÌ$ãn×O’Ó1ÁÒVþ   ÿÿì}]sÛH¶Øûü
˜ñŽÅ™–<£Y/½^EQ2ïP$—¤<3qT4DBV À@Ûªòª<¦*¹IUR[u+·’‡›÷[ù9û²?!}Nwý¤¨Oµ;þ<}úôéóB÷ÈKÕ­5Âqé`¤Ê½“À£®zÿ #ØöfNé¢\ùê+èÒZ`ßsBZ}üø3h€í¸Œ–ž^Œ ÚW‡Ö±B`ÂºœVÀa1ä#œB5Š1t3œÅÁôäÔ|cX½¯¾œÚþê ÑÃ)œEhó“hO‘­2*ˆ/î«@w_UÚŸr	ÜñR*f±m¢Ê&£ù#ßqüVC@ã÷Ã%HdPëæå“5Š-|ñ©,®'úû¾ã37àSw$Æ-vE†Rèf²%U)h&W.FG0·‹*²‰àeÓ?ämí!0póLNgÞ[w‚J-žg¶hFœ^g¿3hûöfÆ¹-4ås’($Yè¹©åÐ&—øccŒ9qƒÿœ…h¦æ‡P$ëöxLX– ðUÚKH¶M•!0)‡
¥!ÊÖÆº-‹iÃÔ»ãyZn–œv7*4=Ëf9CpÛÏO¼ˆ·;f–nQˆÓ-`”žuðž”ÒlêÒ„‹ÐžšsQ„³V•æ[d“œ‹i5 f †¶\}(MSƒÐêÊë¹‰žFUKœØ±ëÀ•­JK¿Eh´wnø‚9°É#í ç$ÀÜMhHŠÇ!
,­£sk AÃi;<{¸e‚áyûÉh~cÅ¯‚’rª87L+iÈ‘W¯d>]+ìè¦‰–*É‰!ê0 M™É­»ØÀH«O7‹\ ùdF2ZE,ü.éæPuüÍ(6—õÈ®šNý‘ˆ.
*gsWÙKŽÕ{È±¹Ã±Õ’™D|`’Ï°Ø•ù»Zn'	…òÊÚ2˜CµÜ	Ù¯„“ß²˜,'Òn¬)r±`4p‹…ÀÊ%^¦E€z‹ñÖ} ÀuÓ6|-OÜ@+CÞ‰L>…›ºD”bi.g¬ŠþŽôaÍÔOweG1ñƒJÎ¨BÀ€bv‡iyÅá«àÎÜi´_ÒÎüÃ+K=u`gîCè”ýÙ±’û‚›ó]º `—/=]¶ãQŽXW;2™ñ@Ÿ-}†H€T³ 4YîMœi‹îƒ‰˜÷NíÀl`ö^ãÀYb§½m6~¯ž_º8¨øp2Œ¹„ñÖu>V­Ò§nTLµßlPÒpêojƒ¥ÆR?µãÆÅwœØv=ópv;­VtÐoôn‘öçÓ.?ošã(õ¹•g]¾ÅFî™»@œ˜~‰_×•E^FêtÐ¾5+|—–%Õ3†>k`HGè³ñ ‘;*/±ˆ}*)Øoôû+°@ø0ôŒšÐÐ˜s¥}Ë­ºéðr¤ÞøŽŠÉ``Å,¼æ²:v³&¾'3cëóWÉÇÃ\*Ô1¨Qo7#(«°—@·Z·6à?ûýn£Ý¿1» ¡ÇºæôgÑÔñÁú¡³ˆ÷…Ê_åÀr+AZÛë“Ã9Ï(¬Žbž£Œí•Šy‰«&÷;78ˆÁ,AÇÑ,§E15W	¶ª“®fÁN‘g¡tÊKÐQ–¾Ö¶[Äòí~½×ì‚ýKÿ¶ÜÃ(Ë©$lÏ»dX
çËIÅK„"+Õ§¹Øel¾•Ü×–5ŸöÉ]1vÉ°*RM"pD¦mnDQ&Ûvx¦NxiR|k(Lƒé©…á­^8±~	£ª¥Å}Ô"€“•?sú§vˆžæÊÄ_Wä ¡É›­! <Žçž¸Gž—‹‚íƒU‹a| 3>v ~oÃA^`ò¶^ÐºévËs.¾…ÕEŒ`Vû 1ì¿©Aò†’õå’,mŸKß—ÜæŒª½;Ì¤a†I‚µ8í½1ÒJXó(æëŠÚj¹hÚåhZ¿1Özƒf0ì6ë?<ˆ'2ÀMÛíº£³lÉ_qK¤æ þbµt[µŸoÚÉ7Ãê›mH[ïôÄ]?Ímp¡ZkŠêþ¦Ê~L§rÅÎdÂåÑ8ø=ÏÀh;"ÌRU¬Á©ÃrX(DK0`FËiã 5<±}fÿKþ;šAêU&ÝåHGÍªí¼­µëáÆ¸L!}fj&³fZG£ txŠ0e®âOÙÖHuõ,ŽTå¤xY€…Ž*Õt™¶;d…pý|ßÒÔ]£uÙvÉ,½
C¡dÃÖº]Âîô›õ/tóÞöÛÓ©çìCÌÄîÃ>¸¡} ÜBã§z‹àÿÛÆ°Õ¬7Úý5»ÕË5"ÇY0ië˜¬Ñ?ÐMãbìzÛE¨-­ÒG7]MÆé©Ì2}œOxš~pZäjáGŽ!ª“^ÄÔ”š_	,•>—Q¾0ªúAÐÙ¶jÛÖå50èÐ¡é"TV`ò¤AÐwOü«UÆ@ªîÐ!%Ð×!$ÅÐ)øè;¡Ô¾©³2U‹ÿ%I±=ŠUú‡dãFuDõòf³q)¶<NAÝi|²ÅÝèr1_Ïñü˜xµ@Å´÷´ºô¬†çQák¦æ1)¹r¦@Xˆ,[cÒrñ”Åúº¶a9³Ý¢†»—3Ýw—2ßŠô|D j®*%kT‰ˆJ„çfkªÌñ5{]áE©3á©óìÔ”$®têFúûª¹™ÚqB½<mÉü"îÃ%@ý–¼)| %A3’€ÐbºIxÃs‰©©½ÈV‹ç s²Tzü™nil¡T±¶Iqrüp¢Š”ª–‡–;¶Y·öí?šp,ÉÊÉ‘ˆöÙêÓ6Éicnî¥ÚZöd={æ0i¤<w2]ÿ©Ìjð"[ƒËÇ©;¥i™ÆAÒè+òlÅ†oYS>ÆE#|g€—_² ‚M¸jŠÈPÌMsÔ‚§pn…[®] ñbÇ}kÁ Üe—¾µ¤óôÔzAS¶|a¨Í;"‹¤ª’9*å¢"~\§h,P³ygÙ™u”¹Ò	œHÔh´jžï¤v‘süÓÈïa<œ1gDXaø°&¦SoŽ!¶Ä­èýœÉžð–eŸÖ2Ñxúu7‚ÈŸÍ‘`O\	<)gÂ‡¨Ü`ò9l"‹+a‹þ0 eS8<:  ‘A4Gì¼´½¨>î,ÃÃB>¢F‘s`K>aå}rø¨‰rBÌ_±¤‡µÖöÁ>çyóÊ®Ï‹jTÜsrDÎF`“`$€)óLCu“Ï =•†LN¡¨ÞèXäFxÖ!&J,>|ÙM
Çòë¯Ö#ö=W—F3ŽöxàS$˜¹§ F£î4™ð	Ã
ñ$§"u¤`®&ÁˆÙ€+É"¤×ˆ€›YÒ¿‚,¬SUü±ø]…V&CEÚ_M†#¿Ê»'§qÔ¼q×	G4(¯¢~RkuàPhq*'W¿eÝ‡È‰Ñ’cÉT-åÅb‹˜ÄÞ‘0BºÈ¡eO):ã™çŒå@!˜,bœMWÇÎÈ…Qe—ÐcÌ×óŽ¸©è‘~Þ)W ù¨WË«‚}ÁåËØ3ßpd¿yr<ÏýZs
IÄ\$lp‘£ßQ«±:{4ûmí 5¸#+<ßÁÞ¸º’0Dô»Ñ[{Fp†P¾G´þ"ßoýKC‘ÚÁ 3¬7zƒ$xØ-0ž·¼Y(FHéÚ¿®8¾}DN!Üõ3ìÉÑc¢ð™V–^ÀAöTwÈhŽÝ‘M­n åÐ´Fþk¼tH¯˜ÎÀ}žUí%ph¿Ö>¨µ†õV­¹/#ÑÍãÐgË	põn„ánç‹ä©uuûZAè`=$°*‚~½dk,0‹0œS‹ «PÔ‚h´ž§†qÁ²4\²ƒœÜ¤Å5¾Zy!6¶R…_xtj ¡ì<!;[o]¨&÷e(æÅEŒÍÚ0É7â ¶½4/Êª$èwHè‘¡<'ëIú-IÓ6Én–’~¼È­’>I Ì‰õå˜^ËÁe$±èºò‚ÁÌþHïoæöN+}S`R¡¸ñ—™ûTócD>?Uð	¹ƒ7Ö8ÐXB›†¦g¾+ÍHxñ…¦ <ÍÄ7Åyi1aìÁ	‘6ËÈ0P¡n£U“h E¹¾PNj=º´6¾þÚÐ0Ò|B-MêÀ¬c@çêðœ2‘>ÿC8½¶J?``Èƒ~é¥¡º€ü½øûÉãÏ|<1*îF$Ñ¡A\ÉÏÚD.@×@Ó ³ñ)ªËL«LÚ…ÂYƒÒV)”—›õG|âº˜…>ó5ß&â=…gAíÃï„,žj[y
ˆ|„¬„H1†-\5hülJ¶áHf)É;4.=k­99ø>€4IÃ¥um”ÚÀôóR=¶hþƒÕ‡r†)_sí;BšôÑö­iNÆš#ÝàTÔD–Lå¿Rÿb©æU ð¹c<úéåT?÷5*ËDTŒëvó´Gs+qéñçTp|Qúr¨0ÎzyüœÀËRà­¬,ÌE(ð·¹©¼WI) nüæØ¨o´<á5’Â›'¼Ñb„WÐQwƒ©µ÷-r÷ôÇOg,½½pS3ïS¢Oª<¡M_pöLôOˆ—X ý…Ì/ÏÁb]$·EÞ¨|aÃòÃà³B`£$SÇA>B¦ãCÔ›[çã¤kš‚™ÐËÚLÒ-ŸŒž^*¹ÈV@A‡'×Ññ\S—›)6-ÎÕØd2[Š»”fe)4mŠäÌ…¦t@ƒwÔÝŒ `eÒ¨4¥×žþ¸TÎ²{ŠG§¤u^¯=[ûwãoÊŸž™/©”<’ÉüÖZ£õ_ƒµRä4ý˜¾x·y¸)UÈVÛÌ˜pÖx»$Áí+ð•ŒÃù§Ñ~hæ±	öAx'˜=((a¼¶f¯[jB>ûˆ;îñ1åÊRY;Â¥l=UÞÛô½ÊZ	-ÁfISµ¦³8ªPYÀSË¦½ÌÁà8˜¾`+%ÎÑsGH^hÀu¡`‹T¦Gœ:4ÕÔßþý?	~3æŠŒƒý†N.Þ—…tSjãÓ`
„ “Ã¼Y^¯Y«©ÍW_=þœïâ}Fã˜9F²ò\“°vdÙþ9x
³T2¢tNi¹¨(çG[;ù³ñz·qÈÚä.æójæG§îq,±–ØÊÜD[3©.†XŒ›
@?°#ÜïÒë2Ïç#ŸÁGŒsŸq‹ÏæÓ­s7ÂåÍQÖ-œ
‹êhˆÖƒRì5!AbyIÚÏÃ~ýMcç ÕØ2k®›Wí,K–%Ï*–.KS
ÓÙ¦}ƒ••S·`Éµ½bL<)ŽFfRbO½) cÇ³ÏÑgMÏh+|#Ü|iêt i^_ú‡ÝùœlLå¸¼jªS[Â»o„Áju†¾$YùšÜâS7úŒ¦¬ÕÅõ„Õ3ÕøÔ Â¢ÕêÌŒöÈyÆÖ ÝÖ †*cº_>b¼|Ö½`ßdŸWUh‘w˜3oŽSË%€ËŠuÉØ¤w&Ó,#(çØ«J K Ö9>÷íWx?Ô{I ü›²Â1ä„ŠÙbf4ƒ©¸,ÈthþŽÞˆN¿µ~È¸ÌG§à#Ö18àÈ’qTâ ŒÈå~ÐÛúZÉñŸôKëì'4êEÉ¤\ˆW%Ââ;¡;ÞSìÔ>hÐ|Pig«´1€¢Ö–ôÄr;&+&“æDoWgôjt1WüC–Ä6dÖå\6+=›Ž‚	uí‘;¿ ]•©{¦¶:%|ï‘ãø”ÊÒ$k<!CÇ›I+ÎXp(dÒO}Bº,t>ëú½(Ä\4aì&¯üÝÆbc_$|ës…oÍâZï¬Ñê¼4®Æ4K+åAëW£u»™ÐAP·ý‘ã]3jæFù ²“£ìCÂÐ›à•Ä:ƒ	ùéF‰Y!%3Ÿý[ö‰íú&²Øgv¯ H¶³dr	CP…Ï‘‡Š–˜™h¹ ‡£å`rC8-Ö-P½ÄØP.SJ›0Z"ŽÄ’Œ¢n,-ãšÉT:×n5Ùš{Ã¾¢´»;Íþ~³ß§± ü(üº¦â¾Üq#øû†iE6qjøÑ,ä¤‰éwÇ´’3/ü¡3!tÉ
BŒ=b>˜”j§WlD7M°0þ)È‘±
u¿(Ô^£M¡ß%æ­\$UL_€ºÐÅ´$ª)Þ‡Èåk˜3W´jmŒ5tÐìt~l»+‰/³¯1<þªE:+á{"f|ý.ÞÁtßéièôíŽøs
Ë·=ƒiÓïw8:õu’0RMì¼¸,èVoç+Ú­½ÆŸýÁp¯Ñnôù†]íFH¿ôqâøî,júä‚+ÏùËÌ‰ÈPwƒÖU¬‡­p[Á°ök{µÛl7îÇŽXLwÉÞ"Úgh¥ruNÀ;{ÜÛ$ãÓt%(­Ä± ù kE\×’p€Dzß>±!|¥Õynq‘¤r³#³W­÷IÁdZlV­‰ç{±µ£`|NšúÑÁT¯’cë<˜…+Ÿ€`¬X¤ÄÇ`æ-/øàÀÁM:%0DŠí§BXÒó‹‘ÈhQ3Õ¬•*_}Õï¦È:ÛU²Ð¦=9Ó¸"7Ï*XwÛÄ¶SÐ6G`øWš0¨I@Žöò¦e±’‰v b±*ÜÓÓÂ®ð¦´iãXÈhf*(Ø&ezçDûq dhdÄ§‹”6ÜŽó„Ÿ!Ÿu‘“c©Óâ®Ê±Pì( Ht|¢c$/jÌ#ü~¸(Ë4x;l¶få{8&®ñ˜8§ü”¦¡Z•—¯Ï”r¥ï7¬}×ŸÅNTG†ÍüÁÚüý²ä ¦>ZvöO	íÇvˆ®ÿœúþ¹U·C²:Isèø!µù{­ÍhiÛØ$†‹Û±?Ø*NöôÄÎnë9*~æŒ[üûœ´ç9MmêM?­YóœêÏ”;™œ[»¶ç©€’[xÄVÇÖf,AÚƒ™xü9-q¡s…|ÃAïžá	¹±w^zÆCâ‹‰óò?,@èœØáà„ÙÀ"D_çÁ¸Gº2
ù07/ä]=Çã'ø-8Ákõz£;NïÎîîåó›~N÷ÁºŒäë"'ÝÕè„opdTGxQüÆá0ßsçcþúkúgiÅkÁ E!ÙÁ¡ëÇ‰MòŠ6‰3Ø:Ä…Ny¨uEä¦€t–m„a+÷UZâ¤õ¢3"t©¬´1ø ×^v3™·PñÃ¶„´Æâ …›ÒºTÇÒ;†Ú¿Ï·¤ÈÞi…uê<À +Kü É‰zS ”ª
ò7?µ½>Èc2Ó†”:Ø~ôÒ‡ö=(#	×DØ·à˜—¶˜Š#ÇšAøì$RÏ¾äÀó)H=Fh…_?µ}pp½Y È)Yß¬oGöèÌ³#ðÙ‘B
	½áõÝÉ=NPMêba¸øØ»Tóø¦ðDóÒGþôá2_J…„±óÊÚB`%c¦û2²Žf¿üBþ[^€@F›/©aš@V’¢ºm›GFúÞÌÙæ–H¦”å¿1WÈùŽ‰^hV ’BÁŠ0nôÌ‚‹Ð¿]msƒüÊªóŠ²îˆÕN‘tì#€PlUB&¾pfw3€âÈs,5ò-Ö.æfÍ™Ü'±ó)~D›Ö‹%–†äþ \>­?¼‚Kßï­×Ö“vãÇ~·Ömô¬^£ÛéžX¤íí^£öC³½gÁ×'(oÄ&¢Àè’§f¢OR3Ñ'dWŽÀè	ä¯HñØ>&Ô‡\/0/2F.¹ÈñfMª"^zÚ_!w4Â
Û!ÙÕŸ¦!„v'›|ìFötR¤[åæAŸËD‡g¡ˆá[æ¦ž;ÆˆãðäÝ ±´™ù©eªæUºÎZ<áò¼'‰]ñœå²ªÜVÙˆq€.;ä¼>·ÚÎÇhjO‘nÏŽNÀKòŸøcž=)Ks¸)š¸C™å+ëÛcÈtë%d/S'k€Î¼dÈ•²SJÃ“Å7	ã•'®Œ¡ “Äh<HÕOÒÙsFÃ ,Ü­µZöýÞ^ýê1
›ºNˆ¶èþÈyÐ°Þ«¼p¹ï÷Ã­ bÁM¤ŠÌb¢•RBwt™ÅD+ƒ¬Q€Pp¦‚t!ûš£Ä-q2l<ù½“ÅÕuŒª•Àh¡è¹8Nâ]è™ÈÍC“Ä©Á,4$f§¯+§ÞT§ÒXJ·mB‡eŒ˜õVb[q±yÆ+A×âÒ{ŽJL’³&iÒ S^yÕ–ó¬‰gÏ¬ÚtJøö#H
º#ô•™:#ð³GVÅÈz-c¾dSm±5pÊ%	M¿[¥}÷éµ´Q“§a]ñ+Œ3ïÀŠÉ{9]Æ=Ò™¹ª¡d#­ãÀ£Â(iVðaeˆúªÆZbÉ8‡ùŸzÎG;£<ŸOYÖh\êShÿI£cÛÉ·&Ù:§ë,e5ùI¦ÃExÓåh“šÚçöZÇÏ!OTøWM\äŠðdY)Ó>Ëë"Ú
"/Ä EõÁ;!iÇ%äZ»ò·»AF#i½—eH†EfŽ¨9š+Ð’ü¬ÕøÞáS;›X£^è4këÄ§³É‘O6¸6óä‹I˜$DÈ–	]¨/dE$]D¹Ìb.¨âá6¨õÃýÆþv£7|Ó¬ú’¦‚‹’¬cd6YÜ!@BANµ&ÖKê°eyÝ¨]ÐŽž	§Ä¼%%¬é#a p³vÓ3[Î0J"°AfF"ÔB3œ¦?X9¥ ó"ÏòUÇ	,˜¤ÑiI”&'1É«c7$ä8>µcÈ'™úT-?'3Æt•Á1a\¤ù'mÉÒŸº4ÉS[RðìŒ¸ V*nt
Æ¹Œ#rÿ|d){¯`ÐÌ(œ…Ã€š\èá)ÂIAá\ÚbÛ~ßCF¹ó‰
;¥¶Þ7ÉV„ôÈñ\çƒ£¬	Yƒ¹€¯T¬æ“	àüû_ÿëÿøoÖGÇó}&Ÿ‘¿Ÿè1yÌ)Kò¾X‘ANAîk39bûŒf-="ÝžAŸ®|D.àØq<Ê_Â. ‹1hñáïýÏÿ¨vK-—ÁþHêí‘5°ÏHmŒ­¡aò‡ 4g"õâS‹,Nôé‘Ãö(²†âýíüÏÿ÷¯ÿIíÔ¬ö¹æ| ƒUtÖd6:¥ã†Î£Ùt„¤·¿ÿõ¿i}6¢ÉØÓ'ï×ì4˜BàþycŠX²ŠÌ÷p!µu#mŸƒ`ˆ¡éu?€áùÛvQ³:µc×A>,Ç˜•@œqº¢0¡þ¿ï“þM˜y’jG%öøî5w…œ©~”fOFÇPøùÖ	1"`YvM×òa([‰²ç Q#5ÞF.—é–Ïçký&U1n®'X×ò!r!Ã~O¾ÉÆ>þìª,FB{q€RÀï²ã Öie„A^$îBip/ÊeEx
X zÂ©‡j¾Â:b1Žx_d 4¶;+é¨½qiR?Ýî60Å{¤8‹”YúgŒK¤¨ÇL¥k>ä¯ñ{\$	+¢q†b¶\ÓÇ5qƒ‰±Gd.0çÒs£B^Lˆ˜ü‡ˆEŽ¦ßàÓM Ÿ£!Kºª¾€9CŠƒFÙ"åŽefÎ’–U<T•ö9E*üTãhª¢/Gö*²Ö²W’È›MÎòÂs(½‘²$Æ$Ž"¤·p¾iRÖØÆ#áÎ-Ä&T`uÌ(¾T$W·nfïåqYå¶>DqïÑNà¿ôú×hï,pù»ÿ—¾k7)ˆ¦Þk'ë¤Kæœx$ðhG_FÀCyzø*/9cÉß‰ð˜a‘L¸¨pJ|æ^–ÕG4Ånó›N¸Sœ!>Fžb=^K€ýhF./H N.'èGÃ%Y©4áBeîÕç²÷fõ¹ô=Z}.¯VŸùÖSüÑdféS˜}âÏ¡öVÎq¡STM¢¦QÓk™t+²dã·†IW¡2,!ÚíÎA»Þ¸«,¶@?&m¤BrE<.×¯h¹QE_±C‘ÃãcÇ¢ÛóÈ´H•ÅQ˜i³ÍWšŠ;ãSç­P‘šb{Ê¢y®=Á?ž@Ü.	Â¯¥Ÿ,2¿pBÊ3šO·×D “YÏ<;tcxƒ…æ,óû¸Ôv!>·ùç¬yÍˆv>E/Ò¶ÐºÒ¾JßYB¢³½äl»?ß!‹ÒàÔ)¹Ö;ûíZý‡[@w<]4$±¶JÖÅE“"3ŸÑ˜u¥	,dªí|ŠCŠüšAn#ŸD¦#—ã:ç†h.§„ôªˆ«Tû39'÷‚Àtï‚zü37!PÚÈvÊAž`ª(@áY&bèW½Úç¬[q/Â«Ï9ÞÔúV¯18èµ;,°^Õ x6€¬Ÿ*f¾>Ì¢Áv!$ãÑ9ˆ{#~ÿã?óÿëœù
ˆú·œ0¾02Â«!íüäÐ’ à³úþB¡ïz'™D59„°B×|ñj~LÎö)¦!çðw®iKnCDíùMl‘ž}µnj£Öèä¹6‚·	vá>€¦ÜÕŽS×›8t&©˜zÞš,*é_f¶GV•‰1éã„ÜWÉ!h1õÔ¿\Éø.‡9€g5›`“÷b¾Ä®`Ðá—“äÁ×¼žnÂ>xz©}ðô94±)î…»œX®,¬¨¬¨ì«ˆÌËíÌU&1ÛLñ}\Ì4Œ{C®«èÂð:£t°4o„oRd+‹B•B¬m¯Ño†{µý†ÇÕõÝØ…ó	ïÊ‚«vj;¬B‚,}áœ1p†eKSœTÔ¦AìŸ§%É^ÞiìÖZƒa¿Û4wv[µŸ[Íþ ¯˜F:á‰ÔòvJÏ©V3³Õ4—%A{æÅ¼²Á²ö‘Ò)ãZ§XtÊ™V¥=r¼Ú
æ·T{×­i5ÃY6Ù`LÖ#6$kšò/T»z-˜iK,ÙË„9V[ÒHkÓb>’{¢ œÁG‹èÐ È[‘ ÈziØ zBÄjIÍÅ¡VUz‘n@2¤…EhêY†`F|æ·©¤”ï,÷ \ekC®ôîPC‚_UáÒ¢c¤4jçûÁXwo‘?£)§wžsA\bÔŠ?EŠX*ý@3(¥¿©	ù«Š³Uq‡"ùœ¤rÑˆ¿…L 3÷)ÍÄÁ1«ç/MÖ¿ä2
Ñ‘€š0akÏ¬cÇŽÿ]åµõ+þ5ÃhW¿Z_[¿®“>‘ÿÿd=sËï6+qèNÖöÁ’ã¡öÁu“Ž¶
VEìhÁÕZ:”u	0ø5z]y—8,+`—ã¬KRU  š G¸cŠ½Õ žvæ¢Ñ¯ÊÊÑ—tù0wÞbi	å7—^DÚÜU.#öp‰ý™—Ò´ˆK'BÌÌÖ(¼\¼lÌ«fLCÁ”©ø;WÔ [™eLf,Œ§H]ÖÕcååE‘®¨wKî–W‚
|ká…†­(œx,l z„²‹l7Þs|'„WÄµ´Ò˜D˜V€—x·&–bC§²‰³ŽÀz‡Éð´0)ì4$ >308É¦ûvìè¼TtÚ¥6´2 éÛ
Buét/Bj±/åž_Z±ŠÌ©»gqpöv¡N¤:Å»"Ç9fÞžS`±³0Êk(Þ †*!ÌÄò6Ï‹ÂC­¶@‡3RcÒwöÂÐ—êïÊN‰}á®¤:‹v…ø1à-ö©V.ÞùÔžÚ¡ýË/n÷4ˆ‹ã´Zm1,\¬/¡Fñnw½‘S«· (Á³*¦4
B1­Q¼æã·à¼”ZÅ»û´‹qY¤b½É•èl:þÝ°âtP?µãâíÓÒÅ›÷Èr— +zÎö™3fÁÎŒu—ìú-z‹.Ó1­©t›J'ÙÏžY];&§O»[·s€³!µÅªcôªâ7F–v—	g˜_&Ò¬¥ýh.ÑRZàÊä›e"Ÿ ¿´{I‘‹à“õ'·ž
ÌövÜhÊ½F­5ü±Ókíwšýzg¯Wë¾i6ú"Û/¶@Óxñú„³J~0NUÅ ¬?Bˆ™ÉÔ¢¯k‹NIiá¥¡Ò ŒÌ`mqÌGç{i­?¨]r¤·@¥préÈ£oªé¶g%_“´»Iïp‡/•:YcðdÍóƒ„ß[­“È¼õiC—„¯²¯‹F‰•éî¾Ì¥=ÝxŸ,²V~•^lŠ¨àr€“Ú<ºü ÝêÔö;Ãýf¢M\>†WŒ!W¯+f—§Çûî¨8I ™âoé6>ó½`t¦ÛÊD³£hºS*Þ³H¾ƒþ‚JK´Q (€+V€ž|+Ô†Z»mø<Ý¹ˆçÙ"ž›Ìa3KÞ¡
^ha7«‚Ž4‚¥Æi¨Šj|c=UˆQå‘lárTuˆèP½	½Ÿ ˜yNíluwjƒÆ°ßiïÿtPk5?¯ ‹~G€ô'*¹Žý4òìÉÔóó¢ž¦+g„8)Î%Ý…B :{¼c³pcª:HD$FoY(ÑÊ•Æj<kCDŽ¢A€D¼ôjÍÁJ±
…n×WqµØ€µj:ª7º÷ÈÀR¶“1î8a¹{+Èð)ÄN'\sè\_–cWA6Š!po!Ç…d¨xU %1LCB…Ð€ƒô7ûžNð#¼]HÁ'[Õ`R4XØààê6!õK‰;çÿ¡Â“‹UiÈ¦Â@l†õZ¯Ñèû9m.»—Û!áÉÑiXÞ¯¹¼sœšåÊ£|)®oçkÀ›Ü#	F89MŸÚa·H³ÛA@ÐÌ_“¶ãÆ`o™ÞW8ì gÏ¬và?’:3ŒË0²}«ÝxÛèYÑG$#8h½Ð†«ZÄÉxg,]Â˜t°"mšØµ˜ë'07aœ:NØÑƒÃ8±‚H8èìíµÃÝV§;lôjC¸ž= b!DÄž9¾H½¢.ÁÏÀ÷Îo_À¾µÚ-2ƒª%€«"|Xe°åª±…]hÜ?\!ã`¶|`ì!pºñltÖñÉÚ^ï!bŸð>×ŒÕI0R˜¤\$Fv©¢‘wËrÐtö‡»Úà §Ÿ¸Ÿ-sö&±Ñì¢œùI
!ªöL^KýK W¯¢¥ ÒÕº2ÐÃœY÷û·b¿-SVºáA–Ž-?¦QÁþ(çL½ÞkÀ†M½öc­·3ì¿éü¸XÖ$:¸„…´ŒÚq«|7W#À‹¦„B™6d/FÃéHý™¬WœYùY‰ƒSy	=L½a8ÿp°³×XÑh$0(£ñÓosøêýN»±‘¹ë×&¨­¸Êëé­¸Ã0	«0ãâ·˜Aó‡Aç‡án§ÕêüØè]ÚUü‹<µQÚåÆ²WB‡ò"ëÑlÃ…²WÛX’¥–£<Ÿ„öd¥«òsç`p°ÝâÝ¯÷šÛ«²Øªœ³xväô©ëh«Ân2{ÖÎpð¦±¿¹¦ãƒ¯öÕæ$½«ÎÑÞxpê@rádÖÅwC¿Öjô‡ÛNJ²ô4ü½{d{N„s­
³.ön¯3ì7÷ÚÃVm»Ñº<Ô1¹ÑµäßµS›	X¥£š?ÞƒxÌÑ)tç@SØ0§/˜é
Ôgh4¯o’Å—Í\J’Ë½ÅP®é-JØãJ‹†"@O{I5·PœâðsÅv\0Ê:š ;¾w.tH'Øš™ÓV¸¤:MÎ;uâX5&OÛbÞî9-2ˆ”f““\üä·Qàg7þ|+»q¡m1v!p´¹ïŽŸ‚kxIöÐ2kç”ÓRò9k ¿Ûš„´=è1«™oÕéò­ªY˜Ô…ÿÌ¦0CëõÂãï}†”*5ÂLm9èQHB°ÄÈB6ž…xçb9I6·¾_‘Õ·h
’¢=ÑŸf¾o×å×S0¥,2
z\Ý)nuJ¬hqIk£˜:Ü9áOP@É@"¦‘šú@Ÿµnë™˜Ì%¯Y4%z W³zL»`‘¡•HŽée¬IB1 ë¥,Q[4j~<ù%3bþãÏÌ -,åúgÈÛšØBkìØæG‘KV¬m» PÁ½üDMmÊâK¥3¬P3¹Ôe’Ÿ.”øTK\ºHˆèÍ…bDË.3ªuÜõ2Òsd±YVßðmªcSy¦äÊìæÿN:«dù`‰O—æ2ë„›?4»f\«ö÷k½}DÓ„Ùdb‡×bUÜ:a-”ÌVv
©mÂG÷Ì:c×îÓ™T…)U­P`îŽfÚ-,?Üº%Á£KãOº0	¥'-~ú"]g$É5Y¡ôgº'®o{uf°+O3ß0—Cwu¸Š¾…(®ðÁˆèDDOÖ!|)Ì]èŠšÕÇVÈýKCÑ¹”æÍ¥ûNCò*ê‚ÉÓ¿äf´…œß /øJÇ¹mj“ŸÑ7ØÇåz*Êd5¡•{¥a›ÜðhNƒ‚Qù(·î5§ÄáJÅìŒ5H±{î*E_™¶ÇKa;‹>²üý]ID|¤³¶Ý90[ÑÆO+4…T"×A¨cºnJ÷IP$[„.gw,›™fØ˜®ÓÜ9ó¥ÊA@Žkýˆ<çâa5–J4;Ày~ý5m”ýËÜG¨?9š>¡ùk2ü uw±¹y½
ÜOæÄ‡ÓCÃáÔ´|w`{Iî'†v›8¶ñnin&˜uéñgœRÇ‹Rõ«¯È˜ÖEIº­°»ŠÐ¾‹,ÎfS½,\.›Íü‹Êfq\Ë–}OŽB¡´<6:ÓžÀ;A çæ©ä×	KPÇ½ÎpÐ‚ömÿç!*êûýf§}âgËù\Ü¾ÏOÞlN{‹¹`¡ èzŽ­r}ÊX%,/±w Á–HÃl)I]ÑÚ"ÞÂ½ÐžLÎ#5
”Ád·Óc¸¶e¢híÁ“·_ãÅ`ˆÉMÎ3ú>€,«¯+©ŸÜ	‚6µy)ÍÅÚ€%¶O^ÑF±™XÈo¼VK@8òítTxÍHCUnpÖdD v‚Œ1ÌlÛ!­´Ìµ®$pb?§v:ìmMê9éå5N)ù)Žb]¡gÒ1í÷nðÃó³çL±ªqþFWÑŽÉÅ’0áÊWå‘¾>Ì¢rªz“ñc½Þèø±ÔmôáØ¯µë—PyNnM©Y×	!‘?r:|G±íªz%´'k¾T¢5œf¸´÷æ9Isÿ™æ§¾>‡§åÈª€Ñ…„$'<¡ÂZ+ôX°úËRÇe%­¢TZz›C±…Áª¹é¥M|Ï˜“$%zÅ”d›~V’É-–ýÛò
8£|Ò!ÚÇª´á„ÜóÁN£Þj¶—¥·˜EÏÚ²Äõ®ìN7}7·§nX¨í„BƒwtÎ¬õºå¶¬[^œ„žñÜº`Åt±…”d>M/ò:‘íp†ó¦˜òÏ_·ø)öK8Y4Ç’õo(¸#ˆ0yS'®˜¤J$‹	“~ÿ{.Lú~)aÒ÷¬úï&}»™ª½—”&]ž^š ^ârØsÆu\M-Ææb·Ã¹`:uÓíPŽxd¢]F“ßùØ"è´Ê§,%†·ÎãºhÈLÐØ€Ïù¹EM™E3im¡$Ì…Ø¡\†¨ÀP°`˜/U«Ní(NðVÌ˜”­¦Z™æ€:Ñ[ÓRIÑGÇEŸ%³WIËFæ*—½ƒý¨eŠbBÎH>[†› 6 eÓšÆ6	\Ý‰y_yÀ¾s8À…i#ãï¾p¦®ø–ÌÔ9Ôök
‡»¯pX~%Ú„ÚÄ.ªJ (ô G(Ä*Úû*|.¢¾œ*!Õ"pm:dˆ*¢QHdä4Ú¹:˜¤ã´}ï¹rAœaÕÎ3!eõ‚üiQÝÂ<y“=Àéó KK+˜(Æƒ˜ûºDÖÖÄ¾õ“ÜjÝÓ[DS<¦’¥u’÷Ó%ÅoLø–v%€›+‹È¾e‰ÞXÇXt)«…Êná•Èæ¬#A'xéUyö†´ø|ùÜ‹ÉÚKŠ7[D>·%l¥µ{	Ö^Bõ,ñÜ…Š—á¶nõá«è­ÔtŽLIµ57-ä¼Tß*-¤Â"y,éò’KºV¡þz8¯å
·ï¼~P|eÈHæî‰|.õA=v=ê18‚tc"B
Ë}çtc„Þ{Å`ìƒVìK×ŠÕL¿A•˜a…ôaÒF]H¶ÚÃñ^r„j°kcñ–Òm÷šƒ%ØƒLS‚m“k{Q- Ñƒ¬WxDÀzõ`€‘µ„cÍ¨Á u=KèFäéÇv¸Šùö°5š+2×^Ò9éÒ4’eg›6|7$û‰+Z@ïgl R5cUæKåM,ë•oW¤<ÄcûA™V0ÚõáÍ¨aŸ]þPi¶€q™m¢iM³)¤B,ì¹v·UcÇs!²e[ð‡£8˜’ñA¹4´„¦y€Ø“¢®oµ2&ÿ‘õ÷¿þÇ!ÿÿ_ûïÿ[×H^F¹%Ë"UA~Ÿh·UAŠ'¶®U)¶påŽ¦­²˜{ã'ÛwñJ¼ñuUNH?3Î%ßË1C[üâÒÚbUß<—W¼"u²ù([…>ù…S*ÜBZð QÎ7Îßsî.:å«Ñ)GñÌ‡¤h¨QNuÉYÌV%a¶þþ×ÿò¯+S8onlm­µŠ²Z/Xõ‹kœ·Rów_–Æèå½W9#?èœ¿tó¶ˆë7¨t6£ÖYÞ¬©W|€ÞOÆñAñ|}œà‚šgÑx»Ön7z_\Fô¢7uÀämÛ÷ªÊ†8Â×
kV4µ+åÄß>w^›qçÛãÎ3ï>«ýá0î|û`ÜùÀh;oo‡q§a…ØìKw®öp¼Lö‡ãÎëâ±çìA‰Á0™EVï´víá^«Csé>XzÞmKÏ¢W‡•ÅWáð$ðÆŽ?<ñ‚#Ç`ªa]§Oèæº= ÛÂè¶„ˆ\’2ŒLCúDînY"/Ž¡&ì4Ý\èÁšƒ•Êa¼´eñ—€©”þíùËJo,²¢Èôf´G*{ßñ}5†÷Ð”Ûay/wyöˆbyw¨Wž±¡þ¦ÖÞk[zm@Ž‘rÆÒzÁíi42ÿ ·£x?À†²³÷“::{{­Æ°³»‹ìýÎŽhôT hdz®ïìc2¶¢Â»œ®ûVkØkî½Y…Ÿ’;HOHÁxL\GM×“|âÖÛC¢puäRÚE,‡ž’¢ _KÃ4¨R–9”¤ò|zIFú“’.¡wý±4;Í Ø„7Z@w¬$ð¦![ÞÓM™cSïðû¡"¹¤È |—q4tONã¨OÎß.]Œ*MâÇKW´@}PpÍWÏÐ^ç£ï„-º¨U=[¼Üq‡% }k_¥(0ÇlLˆ1ß$Òn’ãU€/ÍôfÂ7©n1oð/e´^j¸¥ÏBiáv- kg3KFÄ…Ó´“ÑKSäOsV* dË!ô@øš‘7;Ñl²ª8È°edË¢äß3¯AüEA½¸¹vYŸ‘zOH²a¯Ü	»êHÏ’ÒÆæ%§gÇo­5¶TÖ3ˆ_V^â´Ý>øùjO¼A°=;_'e¢«Ê>›ŽYƒÔ°_uÔ÷ùxL4{|S¿b¦ôö§5	¹6d\+v>•WUh¡¬Q¾UÑé\æÒ~…¦ˆP  Ú°^§I«!	°>c±µÛw./½¶´WøªX„®¶v 	«¯}«šÎôÂ8q…¬õ(¶&ðÌÛ…sÀ¬ú9À'‹9xŠGÞòÖ^’"0Õl›í·ÍÁµäµL¤™ºüÅ}ƒO­Iý%Bã² ¸Q1V¥ã`{mŽXš=ÔœãúK“³šT§©Òõz“Õ¢®î
œýÕvxû/5}ÍÝß8¡/,Q­‹9r£¼ÿN{rgŒï6‘ëLSûÝ
ÓÔfU¸U¯Þêíz‰SýlÍ/Ò±ziÜ/œÎÖÌá—ª
N-°tî{1xw¤í]Îä_hçÒž"i[‚	·&ó(d=‹œï.Âz+–.7å¾³]Gph™î#ð\Æ…žË¹‘ÀsYWx²ÝIà¹0­§Ùb‘µsÀâbX{²$æºF$Ëdv0ÌÁ0¡Kø¸°,‘â×t½ÖåQôYÐÞ[áÔT P´7f',[Î`®ÀLõ9 OŽŠZ9Û…?ER¤¶³]SÒ§€“Jú\Â]%}ŒŽ+ÜO¥°_JFú‚_Vfž<IuQ¡£ÌÚš Ÿe¨°èË4Ñ¢®Ìd²ÈóÙ„F9›öÍa–%}ž.l¤‹lél˜^ÿœš¯Ç©™ê?¸5‹H),øskFÉÀ½wlVÜKàypmþ]›;¶ß s³q …Ü›•kY&¸ê£òþñ
tWÃù=89›Y¿¹»ÑÀôõíÆÃz§=èÕê¼LHºè9„ÞØUçår|‰!¿ÕgQLÖ0™STv»Ê†ÀJ™ÂV7:­”aÜÈÚö<:64¬!äUøõL¶:GvFqíI£tsd®|™pCv¼;lŒ»k\	(ù,D¤!ëµ:"š@cîÔd32Ð–­ªÕªm7Zýüb¼Sö˜kÚã 5'}oˆp£"œÍ#>$âq‹›·#_Èrk^¬âF;J¡{4
Òñ½ó²©{‹Ò~©*GŽÔP”àt|^`1Áóšaà(Í&'%z7P>D/7Ê¢‹ç5»NHkï»ã§§îÉ©Ü¶ü½|Ìú<¦Rß¿Û*Þ54+ÖýVö…–¦Î JýE*QKçØžy1¿–.»fÁžlh…JŠeÈ	ãlo§ñ,D­ÙŽ\ÍæÆwëÖ³gÖsd!£´]ïh6ùÓ, âûKÔ 9LØP²¯‘dXcÇöäQš„†V¸u00¥/ÂàÜöâóÄ–ïùôy`oç[G× Y)ë8y—ÂAb:y­¢”>!Dë‰IZò*±WçC³FÉ	«$tÛ³Gg©çŒ·Ï’“oùhéæCÌJijUš’xÈöå4Ï{a³½Óè6ÈÚ+;„nâÄA[a‘y‡¹'‘‚:â
(¤Áÿù„çò½ ½VÖÀõ
§Ÿõ^5Žâ>  ‹§XÛî†Ý^g·Ùº´ÕCÎªdíÈ³xÛô†n ”jÂ5;Ò
âí;R@p3\° ˜bÖ·|uzƒf0lî×öÄÅQ·û:O„Â\;2xãŒ»Á˜ôGZáÊ”!Ûf§±[;hìèìÔkýA_niâ„'RK`O$7Ÿµ¥
9]öè”°ôf5Œâ¨GrO”ù›BÉ)giäVÌÆïJ+ÓYtªön’4](L,tYBpµªÒËz‚1Ù ‡îâƒ’\¶ˆÂ¶ã=H‚^~/MvaÚ¹¡<?ŽŸÖ¹€5EJGˆe‹°ô‰39rBÓXñ{Y¹]Ë_óæ Ì‚ö¤N ßæŒÝ¨|ãˆ
ƒæn8Ê˜èGÑ)GB›µ	¢äD»¸é%´i‹þQsÛQˆå> Û?æÑ)F,rÍwBwºÛÒ¬œ
V!À¹ÆÅ–ŒÍ¡ªN8C®«ùg¤Èè|"g`×³Ïí#Q×ÈZ;sÇQÙ„’¦âúýŽT×PÃTÓŒ!kgˆgÙø¡xt%Ýéˆ!¡ÅîXÃ	Ó°$Ôê¾ãòu1~ÌÝQV>DHÃB›º8Ê°‚?DäŠa°!¥KóMŒÂ¶DÓ å[âÑ›Á¤Ö˜°`sùU½ºŽ	l28F<µ:•OøŠg‘ƒî{"üÉ+¬×üˆòèÔEp[U¬fDÓü”.âGS"°—šÚ@Ÿ¤¼åéŒ«2p²,vµƒ„ñZ|„:ŸÃðÛ­ŸwkíþªÑ{‡%ð½ócÛ×™Ýi»ÞÜ +š*€µWà¦¬Q¿14Û{ª‡xÒC–Ç„V`ÞŠTøèXÍ"þ_ÀÊçªì˜=ROöhvBw
hÓÝ‘cÀ!w¤žøó*Ç±&ÙÓ¾*à¸û¸B[Ž»tßÉŠ§dDž¿n{£™—ë»±k{–ãŸ#`®°¶?&¯GÁÄ‘Úg%[`øÀÝ»©ýA2½d¶ÀÈ\ýÖÒ,6*›[Ö7ðO")¿„mn<}¾õ6ÈEÈ5¹Ñ$wi(õ`Î4àgú p›ÂLÜ)t 5fž)o…ÙÈÑ4á1@|Éç‰!àEwŽN	®6âªV@»“%nÂ³mˆlÀnëé·¿!‹`‰Ð?š[nœ”c8¬Óå]²—g+e Lƒ6döH+”Ö)YÄ±•µS<4€ÖC ÓØ%Ø­1B¤Œ(%Ì~G\VQÂE«ªbZZ$&hQqDÉqc§(Þƒ(JØ ÈoÄ–^jõÛN,ÕÛƒÕz˜÷‚,þhËÝƒP?ðãSRõýãÏŠÈÅÓÇŸûqH˜Ý5ae„BçŒìïÊeÇq4kÏ×­ÒF©|ñÞ(pkØ¡OÚ‹¶Ïy·Èr¦«í(.D|dnå]2CéçÆÞO Z Ž hCPfC5-(ÐNÛ°¾ÑÀÿ²p¤o^?YÎ»‘l5;Ö4ª#ó³ƒ\æ&ÎØ%]{çÅ™‡M4ƒfÊÃvþºŒSS£OÄ¶·GW?-›¾e3–ÓØB°F©ß†ÕTæ¯ÔUð¼š#—çq¸á(çqz?446ç2†£„„³«Š‘d""×P•!bÏùËÌ‰TcÁÅŒbvgAoÙ€ª&Ð^bÚñ¦n×\£¸œ}Œë«Ÿ` Ta4	/©Ë+ä«€‡©<©”@
Ú¥ˆôŠcáÊ6­§RmÊEmÛ£³§£„K¥ä÷8&@ÃYmõ†(móWbï/Ôk3bÍ*(S¹Ž3U>å!:…ÇŒùeWÖäµÉÁ)½¥‡¨D§L¨¾`çé	[|©rZóåäƒ»Áã6_í¶°Ãl¿šÒá›Ÿ»Z ÚkSQ-¼wn¼ïŽÈY™ù^0:s´žUnþReåt¡dš6P²^£½‘5'wû
‰)4À'˜®ðÉixa‚€ˆÐ ý+Ï3û˜¿¨šŒ€ˆ7ƒ©¤&E™Îš±$_)Ð<s,cà»ÒÄög¶ÇMi³D;«ÅÁ$”ÁwûSD*—ï.þt¶[Íºf^p×hÙ%Öz:;òÜQ“êÀîý’7÷ÚÃí^­½3ÜiÔZ7¹ârCø5•¤Fª5ƒêà&*í×T½yrÆa°k.W»ŠTŠz¬pd¥¶Afˆnyä¤š.¼‘Í¤ùÍ‹$Q(öÀÜ(º‡:õ¼ ù)¹^¹#×ö¼sË¶H1}bÎÃ²'¤‹È¡\‚é”õ^ðÃÅ¯¿jí¦¹PÚšïô·¹Å=ï¶ô…üþ¾M\÷ôæ»þQw¿t J°I3s (ÊvD3Bô¢S÷8^BÊÞQñ•²î„0)Ò˜È=ññ6ÀwÇ±=ƒ˜²7Õ
n^ªq UTdÑö…Z!c¼Ö|ZqJ Û'¹T„ðçï>#mÐggA»Úx¹n±¶µ¯ìýº•v¡›_¦½_’›™d ¹? Gî%dmxl½mî4:Ã½Ú~ãÆÏ®û½óÞBø·=‚&Ew^Za;¯(Jæµ×ØkvÚµÖ°Ûé´j½æàç/“‡_ÛëÓ™g‡n|®áœ|ãR‹ÃºÉV: ë¡ÒT*¬œp¥ºíÛc»¤‰­J?^¶ìØõ­ÚÄ	Ý‘©R-r¯yy_$l{§ êaqÎ^˜g9%k2"Þn.x_øÖ˜
[â¾ßî˜™V¯ÑjÔúa½ó¶Ñ‚Ëë¤XÄqægP>8!©xª©^šmCB#–PT²-fb†™ŒÛa†àuFgPU¦Sµ3Ì²h¹Só¢€…Ö…ÕFª?>µckntÖ‘cÍ"°cËVtÎƒ²¦9õY”ñ<Íø‘•t2ÒÔ²•hQæds4e‰1„ %»Õ<G„ªŠ/
à­Jð/ÌzûŒ©~w›»5ÈJ×è­Pé;
<Ï>Š®4´	¯E÷{ìÛ?¡7®Ï¦èÀv)ío^ÀÂÊß[Ö—•¼K@­F°+KF]£w…uÊ ’[æ !©>6ô_4járìJ±?ŒÞÐÜ>XEÒÎÏVìÆž“’ÊkÆÎ—BW& y]áðJ%×=†äi2Õ…ãè/¬5 Œ…g‘•³t%ùßþÃ?•e79×ú£Sg<#ÍÀ‰EþåÏ¿•:¤9jÐu^“@ÊCCRXbÍ@<A[-ùÈ«ÂLÔýBLÓrÇUg¡Ãâ˜3p­[%„B?˜ùã’p³äøUkóÅ¹çˆó¾C–;Ÿ¦ž;rcæ}ž~ˆb²W&²¦²ž‚‡ßðm:²¾E¶çÈoþ2³=dZ‘?%Kõ†pü-,×È±ÜøId}ÄåÍ¦Â¾Ã³o¥ŽŸq=«dA×ÍÑªDZ E£Ž_?µCÙÚ`êØgÝ r) …nD˜øI†$”>¥Ñª_ë¸`”x‹F œYá‰uj!¤ŽOÁ˜„	K‰”ŠŽŒÐ02W˜žƒž1*K}Ü1¥b#g9ž¦Ò¿¼\~µŽÝ0ÛÒj-¾ÊÝ3w
f…ýÙdbƒ÷ýû§:%P ¯ËÕ	-»!ø0—*ÑÍ
Þíg˜%Æ[GçIÙB/»,;vHEF*È%¯DÈBùmìSêP±xÔË>uì1ØpÃxã€ö“óº„ö9!Æ.$ÿóÉÿH‰	ÒÉã ˆlÏ³À*Æ:ñøq.*BF2
—‚Ò%qùV3)Œ©6%L\çÇšæ-a×3R'®w®tÐÀòÈa€í¤Û•Ÿwã[mÝ@Ò­=Ÿ•2‡_Ð¯ýÎA{gÐûÿ   ÿÿì½ÛrY¶ ö^_‘„kŠd‰„xuZÅ@B‰·&@©Tj•’D–Htf‚KÍˆ?8žŸ3c‡}âLô‹'bì×óà¯épÂ¬µöÞ™û–‰I‘ª¢J2÷}¯½öº¯jíåu1Äuò§Áà~[V¤qŠ1¾òY+7ÀG4Õ…®äW1C‘µ2F>&é@\/‘/<;Èünþ'd¸^ÔÂu Ü—-
=¡ðk|0\D?´Ã’ä6Ñ³‡Ð²ÅòvfžêÀ,k4:D×:Q&FÆkúŽ%éM¢’Jæ+†AGÁ5NÖ_¬”b¼`£·‹)îbš[f	hðâ§\$£þ©ˆø).à¤ç ]¸Ó4o(”ÿ*ÇÐ¸‡ÒéG™ê”£=Ëß2ÀÎöê–‡}ÿÏC¯aÛ8|»oø’}ÿ\[1w&ïZðg©üHÚ§y}€ZcûÃ­}äÃIŽ.ébŽÖ(Éìçh+Ôî¡»5Sv,1Ådp¨’|xÎDÂe"æ ˜Î5‡ï°Ù¦,æZiÇý¨ÝM?è9ÍdØñÃ’~¥fÕ})@ŒZ·½Èã9˜H(1ÊNÇ\<ì!‡ö_€¼I¶@vÿçÁrÞSÌK¼+Ñ¿Ð£ß™_/sˆf9àÿ§yãBvê³Š:“Æ”ÃÛVœ«0¹6PâL.Áç¤<.ÿ2¨FÕ×èŸ„*-"“ Y_áâæâx*šï¯¦¥1r1³Ks~¼4iXZ#ßrNx›ÏIêœZzåï¼´aty¤@¦]û…ú#˜Ât4r¬¢FÎ!
êA}· âÕw:<Ý"3œ§aº)Ö× ÒU8†æÚ4žôü°­Í(»«’ðñ Lü“‹¬ì†— À¡(`mÇN;bj“:ð>ßi´€¯¨Ö^Ô··«·cq}l³L]Sôòvè¶»^0YÊõD/o{~ò{æ±q·ùº*fUéS¥¬#ll%Ð†1M±®%#¥ßñ€Âð:£°HŽéPzH0ÞÏvãê¾ÍWWš}J‰‹BÁÖÍ/Y(e«&8[MÂÈ0è›M¢Úô¡ÜäøÿÊ¹¿Dí ²õ­dB$ã~Ê“.§‡¸ö½’­­)Î­0M©W[‡õë(_Ç±M-(€@'£!ìR·ë;¾“Ú§0òW‘rÖÊM˜¦H«\qj2[¨ÌÛ#Á±8Ì…àë¡˜æP‘ÿ×“‘µrs'#[êk8ÔØ8F\…gdlvÍ2…+1lÂäKÝ8g—r(–UúÀŠóä\ùxË/ñˆÖ³'qµßÙB¦Ë3çÒ‰u‹|Y%1³´
r™Â¹}r’î°wÜ(©ô÷jXÛ”‰2Ë.‘³ºj3Ó¨«”É1Q[q4ê¼âÐŸ©¡ï¿ý¤Ìòr»¿Šeåf&‹h—’ª»Ê‘7Ü¶7÷Þ™C\Y¶Vš¿à”ÐenOØÉÐ@ç%{.tÝÆ~ÛQÏmê…*iMÒ]¬d_oDèš©þäçí®Ûïcž²ËÕuh¨ÖHœó°?›ÞÏEˆgV@ÔqŽ‡PÈ›Œ|ì¸ÎIàžfÛËÐ4BaPœÔtäÎ:LËÎÒ*` ÿ¤XáM°G›vF°‡ÖA¥éA¤Ä-Ñ‰ÀVN61â~Ö–ýí5ýXø,¯ª.Ëc9L¯ÈÏ”ŽôÕ¶úJwr`5G8?®mŠ)peRÌ!	[§Hay»ÆZ£ÂMu7Ê£W%n€Zhîín]…Xø½Ó	ˆÁ{ébƒ|Pð¦ˆiÈŒnþÈŒ™á!™C#Ø^vïäì‡yñó·ÌÂj}>æíŸÎ÷ržNëžzýÈ«H'tw¿&rölÕwêÍ·Ê
¼“£ 9/R€.Y‰ràõO“î¼„£Rqe)³IE.ÚDÀø¼ˆ°`føhN)Îq­$É0H.ÒèK}´ÛJó¬¡-ÞŒ¡€,6×ÎÔ–šqŠBœH?$ªã­ëã’ìq®eÿøVòZáî ­/ÍxzY:*ÚqÉf(…ƒÏÃ-L0=5ëe%¹ âž­_’ÿ`‘/‡z¨d¯Ã¬Ãïƒ×È3EÈ|H¯åä©føhžM4Ç€¿Ôb_[¿ón\oo)ô¥l‹À½çF¼æþ|Ø9ÕBC¦ïš¢^—&‡lžS³tëe-?æÉ³q¤Ž¶4—¶Ét°¡qW÷K$ë®¢kÖ·ë5Ù"}2rÎnf Ò×hd°±ÇC™Õª;ûÕÆÖ•-„¯˜£ÇcÇ1Sé2¹îÂŒBð¨Už†‡Ñh‰ë¦Ê0=SGÌ¢sá ¥cÂaÓð|¶›$ƒ¸rÿ>K­ˆªànŠ»€z÷Ý0	—×V¬­<~ô`ùÑ£µÅµÕ'O¸Ÿt\ïx¸íð¹„%ßøÉ³v¾ûó³ÇKß?{°´4{[Ì½ºý”Ã—"¡ Ð@ÀíŸûIn§t.‰ßw)×D’d§íö®ÚŸqþþ×ÿøßþö/ÿÕäØåmÐ^®TÄfNÅÍ¯LÁÍS>7¿šE>{<17§Åøã_Kø‘#†úý9¸’1|mÍHFŸóFØ\\p-XR®è!?á4æYÈêÎój³YÝØ»*±ÏŠ>Q¨-áQqäÈ-,¸ØçhU%­CÈ5KmL!ëªi(ÇZ–(}\+–T} RºôhÖÙ‚à”u–±WÏõ1Ü8gzrŠ){¦RÖ˜øAË‹Î¢–½&÷?É,Ñ½±Únä¾Ÿé¾z~P¯¾lìnUœ±n®cÏëS(@&¨fŽªF OºÄä[ï®ú÷ÿëú/ŸáòZNÅÉ¦‘E‹ÛKÞ9úúZË®¯åÉ¥ÑwúþbÏsÎv%=þj%3Z–%à»	¨ùkº——nï&D9ñQóÍníh»Q«ï6o5öç½
…z—²qY/ûŽá÷=‰ RÄmÈ¤r$…Ú÷¢6¹È3ÜË…ôjÒ[°ÀI³HGiˆ3³ˆ‰"µ¸.ý`Ú8ð+`BŸï*Y|µ.úíŠSeæçð}Û‡™Nê\£«K3Yz&ùÈÖ\{¦¤>P÷ kÐØ‹ŠåÂÉòÚ„ê-]l³²p–Å°]pç~`œ5n™„¹¯ d¶štwýûÿþÿW‹ª4…±ÃÃý QfÒj“Ü`•{dRökEÒÄNr­\]™ê}„i£° ]surõ#ú.À|.ç@Ñp)3±¡²JIäD:¾Ù‹ë8[{‡wc“^¦—•„¢ŒKK{w•pþ¶¦¥D+F#®Ÿ6Ãg¼pù8?ÀN×p›ö]Ÿ”ÃK)ÈcQ·Ó¡9A—6œP"yuK‡ãþ}g?8á "±É0æ$òX¨§íÞ1ÃÂÎÜžÐ”ö”,$o’<…¹Èz^¿ïõ½&¶™MâÌëá¸~÷ö„+i]—ŸjÍlâlmÌ©Þ.½[‡«´ýÁK(0µ¶DJôâ‚™'‚k6nè‚÷Îck ef>ãÂãrxŒÈx¦siHÞ¯Ài×8¼§ZK4RcÖ0r)æîízí´ƒÃ°ã”¨·ä~}Ÿ$‚p‰­›[‚}M¹çîÅ¼Ö§h¢9<†žeì@ªò–ŠcÄñ„0”kö¼Üãtx\fî,[N,ÂÜ”˜e¼Dá/^;9Èt])b íçSK“Údc`®nË¯Ëi±áqº+ÖÎÕ²QwK4ÊjÖ,ëaÑ„¹'Õú¡ Œ~üá™ó@2=žÏÛîÈ#2*Ýl¾(#6ý4Ô÷œµ“)GÕ€Ü<º­²ÛðÔºÛ3ð¢œ)×i‹ñQ4îÞbá‰·*‰-Õ:SöRW¸‰æ)^Lû¹ê&Ê¬…³ Ÿ»uù—2°sêFÁâ¢Fm^G~|(ðÀ3gfFjK.¶4kÊ DÂa.Øÿ BIïìX/X˜}‰×‹KHüZ
) Óœ­%
jv1_­1ˆèz÷»~¯¤5”º~l>¯LÒxŒ­Ë~¥jûö7‚cÓß¥Ï¥EÏâ{ s;€ù6âÔ”)¤À¿¾Iîè²RÀ`éy“Pìë0B;	 Ö÷é¥ ‹Òïå{hö=ê†Ì7–A#i€çØièƒIs)¹â†{!e³\pÖæ-G4>ŒUyyÞÒ5Ñ(5ÆŒ±°¢–M•90A·x$W'(<™P})¦Ÿ­á¥üž²'œï#›Ë$"•ÜjÓ½Ì»‘ß“–ê²ü§þŸúD@0jFCÙe‘ˆ Jº@#ž¢öNZªKly¹²öÄ”{e§Þ*ÛvfŒŸkNÑ$oˆZDaeÙâ)¬¬eß¨
×3žVóÅÏhî÷ÁšûÅÏXðIy©VWˆ›ÉpÕúy|0~.•}ÖÈúò`w­˜¤|_4'¼H¬Z9ÓT†žêir¸_}9Çñ\Ûë¬]µÀÙQþqêB­êAëŽ0ÍÜ¬ÙMâBëÌ¼÷ð«ÅyçyÀWz*€´
gèÊnE€Ä˜o#ãi^~ªŸV’<˜ÙÈ/ý®$6»4NNÚ6%»ø©ÝÉóÄÏˆ¼£ Rr-Ú##¥Ûºð­o4ôZb1 P…€âƒðtÎ,è$‘zŠ–+%#ÏÉÓÛ=7¦ã`å”¾>9|IvÇ\íW‰(=(‡;”‡|×÷ÊgØvh-'MÄÈ_è8k?TÊ’L0¦œxÏhc4dkVé—Ò—!•C„QK›(¯¸tMØØ$©(†F q+¡´a#‰s#xÜ$^ÄKjë˜o.¦€]
ÊÆ	duÝmwç˜KãÖr8ù ¿¥©C&²ÏHb1ëH[6>GgVvLj;ÓÄ8ì³¥Í!NÏëÉgÀèOjÇ4®Î>£	Ç4q§%ï&_ö±(vo´ìsåžìSDLâçR˜ì×¥z,(_lŠzF€~ZPü¬¾ìÝ±À^n9èÝ/èi†È'a>ÀÏÜ0Àçé	³ÏdÃ‡Ó|Æ7=º€ÿr’FÃÁŠü¥vGÐqY‰¨ã”¿;¦¤€“hc²€4ÈLH?''wÐ2:\8¬4v@çp˜ )ò˜È"Ïí\P\òbXwjá0è8Œðš8ÇaˆÇ0r~=r2ìwxG¨$[Ãz
«·¤¸ÀøZa"æJ'5—Ì+äW!¯ ÐðJ?ß}§ô[æ#d³Õîuô¹ÕžR"÷—hé1ŽÝö‡i½ÌI°!C*{›¿ÊQ]'9½ò¨bií. |yŒ´KaƒÁÞV)\¦Ë’ Iðçäª|ªÍÞ`o›¼‚öêÍêö-™Æ}>T%ÎÍ2Ô²]IQJÇë¡]í€_Ñ ghbí³²â(JØÂRªEòì˜•2è<‚—j„m~lË| ûé ¸ù‚^“£»Z
UjýôùÈ†íp_†g¸Àé^æûH«+3Á]QùÃ3DN
j7zeëÜl£„:ò¶4XÜ¡¥EèÐl€ÃÐ+fãÀ›à6?ôÝÐ¿fËd&Ïd"‹i)ÚîÀm£}ì÷Êò(´ÛésÕŸÏ‡j3Róß;sòdiýæUýÄ$3Û>hLÈ"ÀÔ#q3:OmÓj'C7À·b<hÄ›r!ë"ogì@ŠV¾Wú%#§ŽÒÄ=Ô0Ÿå'âžÜ‘6kôLÂÉÔ…NÅJ«R1ŠeNçéU92ÕnFEø™ZVˆªëpÊôßx¯FaÛ‹c ñ×–` ³¸6à˜ìZák×OÒ-s?Î)=/«y Ð Áš,z×’|ãq]]U˜4›æ«ñÿ8ô†úiä€ÌÞªöƒ¹[%Cå!;õèê}F¬TØ@²çžÞ´dP`(`¢fAŸ‹?+¶.ª#Ö
¸|å¥ÖA‘e´ŠÄ­ÈÀ±à¸½pHjEóÄ]ªM©V‰ÐÝ¿žoÜ8«‚ :ªnoïÕª×‘¢èŽsqFãŸjƒ`‘¼G4 _6esDÏ<CÜò<2ºLmh~ZˆÏ™íoàI­´]+¤ÒÝsiîã@¼TÜÔ¤
e§ÔÇÉ?$£
Õlf>8íÁ×å[þ–S·©øJš,{35ÚÏÙoïîoïUù9Ø±×+éMR"¨€¿>Â™>á™ó$ÇûëÎï›‰Õ…½*4F;É	6˜üu‚•)Ðäk½±~^4êG;ÕÝêÖ]ˆ;¼$Ü¨ûåCjÚÝ.4Á«z`áHŠžÒKÕÔ×èŒ¦‹F&®1k:1²uñ,‹ƒzý½ÖS%FÐBŠÊª=¬ý!ëæK<#ä…5ÃˆËêÆ;š˜Êóñ»‘=dnžù$”#êè³dŠ@Ñ o°Óbë}Œzä™Õž¶7×o_|ìé³ï©Pd¨³4–}
¤ÒÚÛÚÚN;Zá´ãE¡¼É‹bF¶ú_äIÈƒ*õšàÅôÝ}«á¦ØKÐ§ï]Å ËråU¾:Ä`®.[­£ƒúÖ-ó’_!FŒ{˜„[þéwJá#íwýô;ÿüðÍÑþvõÚéÕw[onŸ<ÈBˆ “ô=ŒÉfwyK˜Çid©¸€Ûùw¯ÂÒíóN)+«QÜÇ‰ËŠÁ}¿Qß¬n·Žšû{­Æf¶¤ÍôNÒæ˜Î¬ßñ>’_Ú7DôRÒÊˆ<òHZ^FõnTû@·¼ÅeÓQ”B_œ¥>’·J3ïd¶,sqÕ³Ø’áKýúÎðˆžÌbîiÒ¤S4[ÌžJDiÌœ¤#5(»±R…¹¢¤GE«ß½(Ý%›p[¡aRR'ë”±BüÍ´,Q*†[×Uä˜µJäÇOñ¼Î[#¢ó¼*@(ò¯¶ºEg	JÉÓ6ÏÇÖ²mÒV,Àªkè´ =¸@þ,ªi¨e+;:@)~
Ëñ_Ì¶\TX»§«LÈŽl£È“ÄÆ¸Ú:0:?8kKóÒ
Y='U×N°rD™\kÁñy2p’ü,È³À±³d×¢½Q(%CeÓoéø¸bôw'¨€	<`x”Y°”¿0?TV°p.Š¶lµ»ä¿UÊñK¹Ø2{j½‹ëÚn°ì“ÞeÙ%–s§eŸù¼¡ ]œ4—·™–*}l™Æx·‡øÈ}¼Uª½3¼ðÄ§h2ô^4Ö·º*í­Ø¥9¯KÇ€´5‰|CÙÏ3pËnê©U;½°Œ£uóåÐ›äŸZîr~
Òy3_¦–ÖÏËõ`E!ö@ziwEN§r13hÆýe°g¦¤J7^Ðh<®UNµèÌñù¯ë’*¦O^¥ÆÏIÆÛ¬×­;ÀÅ%ž‹Ä€ŽZõêNÓNÅêŠ/¨©gß¢Ör«ðªÌBÀˆW¯50ü¢Þ©DxpõÀ®·hVÐ·Dª¿{ÑÜópÜ]€©;Bô=Ÿò îo`X-ÌßòÓÑaS¹U„dd{Â…†/‡ð¬/Râé2¹:ßþj¶‚é7ÖGTA3'ó•
wg6fÊXyÞ‘Yá­«o³6ÒŸpjqÆ˜9;Ð3Fãj *‘Ö	¼ÂKÙ*žKß,PHÚJ¶”C¾ŽuQ•ú*eeß‹æ§‘ˆKéŒdHa“«¨ó— gþH9æ  òU£þúh¿ÚlmWŸ×·j/ª»»õíÉR2 ûnœlË9=lRLvÀÞ„ÃdxìÕX¦¾ŠS¢Tr¼F%oÃ+^”§A:Yµ½WÖƒ•‰èLÕWy úƒvƒe‹sÄE„Ùs¸²>ué¼ÍÚW‘:Ðî'€j˜v”ÔûIäS³sûZqÒoß)@ÏKð”»X@;ôŒC»pÓÁ f†½÷c&B;Û™¡R’P#›…vDXIùŒè“¤ˆ!¹3UßÞðt©³šïÇ#åQ,¤<øÍ¾ió„'9³ä3€öñ;”
H±Ò9­ˆ<ö€Ãea¤”Ð3ûPlKÅÇZXVÒ6Ìc?ŽC7ê¼“å¥¥Š~røAÔŠÉÁq™Ôh‹b‘çUW
™•›#*6y)-Uj¿ãŽ¨Ï
‰6Œî_Žêþe^Õm7ñû#jS™¼ª±?jðX$·úIä·G6@…Œ&ºa²šLFfo@*b«~àúÇ•Y£*%ŠÂ¾ß¦jyhÅŒfÚh]¶!—1H¡ºÄaµ!U™ÕÎCZ“5n9cy!@~:Ú?ØÛl\ÝK"féÖ=öÃ§ë¹xH –šbtÊ‹+ð6ú8£:%ÛŒêÄQÛ‚"š”§)I”åYš?÷ŠXØ%j_,‰,¿’±&ï ËÊö‘y÷‘íF*à¤ä
yÜ~Æã¨Òöòø*öAóIZù­bR°úªÚªŽ`²ªãàï“³R¹)±òªý®Ø¥j­VßoÕ_Õw[GÝWÖµ¸d|rP”ŽÙt–á<J7ÜŠSÎ/%ë/Š‘•Œ¶7…FØj`Žd}RÚdN±ãd,Fñô\ÀŸ1’ëìyˆ©å0À4¿FÿÌOÈI1Çùƒèxl`Á	YrÂìks³¤¶ÛÞ M-VdzNueÜ:d]‹€JCž-sEÝ‡¢X`uuÕQ	¨“¥ð'=L!Q¾Al0©7¤æ˜§ò÷n’xýµ0ñöÞîfã`‡¿j«UßÝÀèSeßÖ¦øx¦-o’PáJW6®“ÐQ­3´ñjÝfŒ¡r(Ì‚…Ÿ¡œËiØYtÀ¾fÁXK%Å¶(H9C4t.{^²å.öË-Ô¿89WN¬ÚWN‡%7<wcâÐG<`¡ñÒÛ‘×ñ1l(ÆfÕºJóG±Ü‡éqeªÑÂ	P°û}èÿbüºQäcd+m(âd\ÎÆ9C¤»Nß?í&8Úÿò?N:Ú8=^û‘×ó½ÈÔq2ì÷aÔaŸ‡ÏíÀQŠ<M >ð6YHÝl¶ãÍSžüíÿýßþÿÿöô9Œ»ŽtÔa9«•„÷bæ½q­+ñàn0?Œ4øì-Ì$°@öbt(¦5àWVu¼¤cöc£ã.-çëäX¥7¢¾âÛp 5rmŒ@[î9ð ˜x¡’$¤ƒ„¦œ‚Ê–s1¶ÅØf˜|1@›Íë·œÕÀ_. `"ƒ†f§ÓÚ¯ì±³-ß¦†,bÅÏhN+M3¸ñÀëÔ'!œñð«²×,lKpcd‡£Ìrr;”j®ñ˜€š’~0<|&±-jE*&5¶6™ÉF½¶ÝØ­ß[ñÈ–QŒ	˜®‡Ä$¤lÁLÆHæÎìËE|çsŽ¯ö¶ëG{››WwÒûä ì¹¿ú}`ïÎ>_'xžYÆù¯¼ß4¼ß«tý*vhÉ»T€ð†¨ú&KWÈ–±ƒvÐûÖ“[táÑ"‡¥.cÃÙ„ï‡ÓqˆÙˆŠ!%MŽ»ahwY‘_ýüÉ/'f-U-4¡Ê‹ºÌ±xË”r©el9/<ëu%nTS…ð€ª~ìœ†Ñ©cÁäÒ‘gIw¦, ÿ²lfk”ŠQåÆ¤yZ{eŠ¼Œ¥¤Ä“øS
u\
?SÜÊfD³îy€±§X2èÉ÷(ûÊÔêo—ÞQÃCLÓ'N–8ÛìX²Tç“rm–ˆÑcmèªTw’}›bdŒ¾L@daOÕ~|Nf½Òºi/)ý®[ËýÀ²ëœø´ñÇïª·	$‰q\°óÁãÀ{Lˆqát1\hX³Žã‡C
fÙ‹½à¤òÍ7û‡ùö“6÷²K.ÿöÿy2P[~7	^x|Þ?'ÜødùÆ—&G;?jwæâ®Û¹P3A%SösT¾/3ÓW¥¨kN/[6/)_—<nšJ-ìõ øTÇÏ÷ ÆM€4Hò£uÇ™³±Ã2lY!“Ý:|à…ƒ ” sÁÁ@‘}DB}Ç…Ë*ì8çî…ŒáÞ7ÃaÔöb'v/¬=“xÔe2Äåšb7]ì%™°¬Ãd¿ÿÌuÜÀ‹’uy U',gJ*òY1DmŽ«ìlE(K9rçZvþþ×ÿëRgÖó %ÃÒ%Ñ
u»xD“!ð‚²y¹}OÎzçMb€?áîÇsv7ôÛ^¶¢ï®õ–Kz¿Z—p
\½-8—JAî§'Ë.®‹Y³Þ?ãáœµåLysMŽo¦2Û'Öp?])ÄG–Ïè%R3­l}¥µŸ »dg¤
šN½ä<©œÕš_yd=áòJ°f£Bâ¦¼P)k²Ï-2¨Å¾“2vŠ$3'‚Em{ïpã¨Y}U?jlLÆe¶ƒpØi02ž’™Ñk£zÛáURÆìÀH*wýAÅ‘M¦@×}/âÓªwŽôÎ¨Ð"˜·WPµ½0ŸˆàÈÏ©ÌëâX;^¿ÃZQ³Špy'p/t”fY¤ÿ8žJøÛ÷In[ahÝÇvB‰¤ÝŽ­‘[µ|¿YiÃÀ}4€R_Oíì þª^Ý>:¨o“»ù¢±?Í±ù…&(«nd`6v„	LUC¬¼p‘rýÌ4‹dœª¹„³â¤‡L¿h#Êa­ž!‚Åµo0y½¥êÔI®R6´F`±)9¿¨ð	ïÓ÷H`{ÛÁ©ÜàÂ	 3 ‚Éw;íìÇÃ˜ÕÖeìvY~¯p)%ŽL(qAùí"Yoi‘å‚=9ñÛ¾À Ý¾ã'^OÊözšlëBiµ?šZmenþ¤Äæj.é7¶ð+ÍÉ:-—»26—›(d¡€Z/mp}”Z3-™)@ß}ÎÑÚ¥bC…êÕ)©^ü¢[Þ†)îœêÆ+Ô@|½t¦¹t4ÝxØÞ–AÎwÐF
ÕáFmL(™dñ‡{XÐë¤ò†öÃZ´4AÙåu –æ53JTå:ÎV/‘íJJ­ÎãmjÌïˆQ¥Ea	­#$yÍŽ^A'À0&N±ÍˆWÎQ¾ÓæCðy	¼úËmCÂ"¡³s×¾SLé6Ä%š•1ÈZ½þ)ìbG—;¾ÿû_ÿéß]‰4àÏ¼WZ®PËÿt¥–9Í¼7³ãYuå	ÆFc‘c'ó”®ý‰Œ)WO5nJýq•n’ÖM©ŸGw(GP‚u…¨ÏÓkäËHo8%ý U+]Ÿ†ºx¼4¯5SÑKÙ©TÜ79åñü ^}yt8µÁŠÿ¾ˆ	9\…´8©‘TSQQÁ&/7BèÄ>©ÉûH©"iÔB²gÞàºoé2¥;ë?9›a„
‚éfãÌÝèÓºøQ¯OÏ»ÚHµ‹ñ!“òû§Ú¾üÛ,×<|ÌË,?µõ¸Z»žøë]v›wÙÃ[¸ËÐßûhsïàh£ñjï`<§ª/ÿN.¶å€°óÈ‹ìz0µ4Ì´÷Â1ÆÄ˜>ËÆjåZ³·©âE³ ¶3¯Á“jÍˆÇZBÎ0¢É5ØIõÜDð»üÝ{õ»`\É÷k˜2ù	p3ûQãwløgaÔöÄƒ	Õ]TËë<¿¨Pþ£/R¢ÅIØÁW¿„¾äƒˆqOü^Ø¿Øw/B +Jý°ï™o«<é„?Û]?è4‡ƒA%9•å"–RÚ4Â•zôË°s*×Ç•ÛçÓGØ	¸/a|ºžøc²µT!»"Œ”YQ0fE¬ºÅëRRXÒFÿ¹›PÐæey‡Y°Øš4ð’”ú€2Âè¢¢„ÌðãM¿»ý+.µ®9üÂˆäL9J €úÑÚ`L€&$ƒ¯‰0åX»÷ë¾êdHä'*lê?Õ¶›WõŠÌDºÄvÈª‰ÏÏ9‰Â”·‚)¦è¦¯%¬w‰†W=Žñ2ÂTÞU½í–GÚäƒêœå‰=e2”/N†J×nž×ú:
0£Ù£5“ß9qû;^óPp²îýýküË¹Ÿtk7kí‘rÚ…¿>&àÅ¯øfœ&ÃÅOèÔùû_ÿñÿöŸÿot°•OØû&»œ8tzÃv×	B`‹’0§7€T,LÞ)Ü–Ç„Ñ@ï? ²Òv«ë9Àœù.,¤×¡üÀ‡l—½q7@+k¹qŒDVá¿ýËÿ’	5ø$°’×ÅµASG1»BÐÝÓR³ama¬sKÎ¥¥ôLI›[dÁ'³Øïs¾–×¤21·',Ë×&eõ2™çÊ•ù<¾}¿C>o
NNH‡Ÿk`Õš‡Ïw-Á¨a°®ý½fuûv86Æ¼‚ÝPv‰W
^+ËŸçôZiùe.•o¯ÃÞ2 úÐôÅ¬AAm½ïkgnIÍŒ®¡QY¢AÇËR«Q¼
k#åtØà$×(à«h\KØrL$VUÝ>DGÍ»ÆÌ~‚'rzÍØé$ä¿)k‡B>•¶mÑb¸ úVÄPM«ûBhLxs‹\])•óg©¼vmüfÖ
‡÷úGÀ¦±§5a\x$.Ó×F»F‹®eF™šÉ|t¼v€&Î¸.Å+d\bùHf,?oGQuˆ‡žc¸‘Ò8XÝnO'BoÃBýyèÅ¸þ˜›2ðÐ™Åö¸\@H~N1@_|rÁ`Àâ~âb§Ždøñ2¤¿äF¸\RNmÞ®1'™2—|d/WÉGùÂ——^#
SI‘R&·£2¯kWmL_‹¤ô·þ?€/tj{‡-‡E¹¬8Êf‰h[%ø3cËŽ‰ëèiäì2«..þ|Ê¸¾"ªÓjÄª'›ÌSgÛ&ŠÄd¬L£d‹Ä×ÿutô×qc¿Æ}Õ¨Ši¤iSâ&”%Ñ€ˆ%ì!É$ÅÇp†(âÌòÂÏÊHõ8h÷ïóÃ)ðúŒÀÜ¨?åí ¹¼ôUq½h§ÁJAm9e¨°}“Ò)*egŸJ.«³.VÆ‰!Ÿ]²3LF-½¯¢ë¦Àµ*ÿò‘ÍEäçã˜¥Œc’rý—›ky—›Rf²ËMSœ sŠú:=¹ˆ è4ò¼N3…ÕŠ·c\¦p'Óú9@&Ç"0b ãp!â&áDù§A´)ì«íÜw…é‘m5aÜùÁYRùW°´eëÃkó=oæH¾‹ýÎå{uXZ›÷U>³¹¼›{^«×¦;»øL:NB°¼NºÁ…ÝjVRc™Œsk_+ó N¿`ÔV*kÙj¼ÿ©¯ÓL´‚N¢#ÒêýjÒ{››Z£º£é‚;F2	æGµS¬ê2É:êþÆé:m’r™k2´Ê®2±Ù°äg"ða³Ò4"x±)¹d Û¼®¿ô;ñk?éî³]Ö¤à­ °â°çÉé$æ>˜áˆÇ©Yä¤õŒDÕ§áYãaþX
+¶…Aúˆº9mC¯åž`–k„)“cŽàä\æé7:Û“ü	Žˆˆ‡±ºó q€(ñ•”¿RÞ¸¾+úå1ñïØbïMÊ|“ý«$ªýÖŽ;Õ­[µ½û’DÑÓCÚÄ¶5ì#¹\g×’TžZ’0;M˜Ø­zëèyµöòèu£õâ¨þÓïCPþ%T±h¹ÖT9‘,Ò—¹ñ,Ò~FZÉI%Çðp¸+ÎìË-ú.üã?8Íý½V«¾‘CL£,ÔûhuPˆ<$ù½ÙÇS<	áâêzÑÌMº+ÂA;rÏ¼¯>W§þNmY®Ýg-]´vnÞia§zðò¨¾Sml³ÀÃGÕÝæëúA}ã+•.œŽÕ™-n·~7Éq»5¤ÎƒIÛH%ãÙm}[Æ›BvJa¼1(bÿÂÖŽ ³t:vP‡‹bwã¨µwT{Q¿#qÁ>Ý’©B”ë#)çuêPhê» ;ŒùÅè”‡³§0™GÃÌ>gVbËÊÍLÁÉØŽ¦°Ë?ãúÝŽïy«§	¶'ÇµÝõXø'7@KhZ’…|ß %>C‡4é>æ˜%Ón"ÿFëÁoË'uóþÏOº…%¾vÒ-Ë«Ux$OÂè  4&‹0*N/PÇkû7¡Ã[·€ñçaôAò@ƒ6JøSˆÛh$Ü(Œ™ñ¹¯Î–¯gyñ×Ç³•Ïg#çÿüW;ÀDH•ô¢ü wÞíù˜ÛY‘=ïl@€›†ŒÉYÌéc¢Oj‰3d,¯}FÈø-3×üí*~œwÿ ¾µ[Ý­½ùÊóåìò òNûn¿}aêu&œ.…@ébÃ\˜3Ï·YcŸ'0{'výZ¹/2¸–]Å®²e~Ü„‹ 0ò¾òºò&É3Ë‹ï“RwV‰zo¥M§ûBQÏþù¿:÷8ß|ËïãÀk3²Û9v/fÞg­T¦nEPá£fz9£yä^SÞÐÜ›‹®ª_XYÝIm&õÇåä´ñU¿|¨iäÓWæbò¦kºWr=‚B–^p1„%Ùå˜8“+šSœy´QoUÛÍÛÄþÝ}1¥]€yðe/f&%06z|}qãUýèyã õâ7sGŽJ[÷±ùKˆM‚áû6ê‡ìùTÚçØ’n>ÁãÇl©“PU¬—ôú¨[`„VØ£_;”§˜di¤¤‹š0a”-eÔ4I£ìi£,‰£ò…Aÿú÷¿þ»ÿÏi´f›NÕy^}þff,‘â¹´Ãe?·älÂôRHæ x’3kå¦5É7  zœK¸\•t‹xY) ^~Ÿœ¾tCå˜ -¨™FI²]àÖšn»-ÇoóÚ-(˜™ˆáecã¨V=¨_=iót7©Òíˆ‚Â³=zª—„‚ø–©åR‹^»Æ
Âà•»cœõ’‰z"%ÕEIUØ¡°©û° ] i“T1¤Û$Ék´…ÒiºÂB0ˆuf€¡¬cZ¨â¤ŒJ^¨-é”ÅŽÈ³çÜ€m½„zã~ÄÈ–Ä@ À`qƒôÇyä'é¸E:CZUü-C5ã?s®Z¾bëÜ`ñ/‘Ê•ºI2ˆ+÷ï³¬©e¸KwËpsÝ§äi‹ËkËW/=x°´¶´²ø°½â­>Y~òÀ{¼T2I~…’¿ÇO‡1ª÷é±ˆ¥a¬Dåc‹'/­¶ŠX>§`è±íÍÝÿS|ïþé‚S*Í—“p;<÷"tWRü38D‘ÖˆÆªûñ+/òO|‹ ëØaì{ü’G—*tþýšOHéEqÍˆòw"ô”æ+?Þ§5Sý¦ôu=qûU¿•*ÛD˜Éé0¢Í[}³úËê/,””XÖ¢{·V¼åú8Eã×Ë+îã'ã<?_‰-S´ðµòamœ¢g/þüÓj»;NÑ¥ý‡‡{'«å_ÞÈ²|î-UvçáO?/5Ç*ûbykíñOÆ*Û]k=éþüx¬²[k®?ŒÔ²úåà‚g/ægR{W£È½(£_ÐÜ'‡…µª8+k€Lœ¹#ÀÊtihÙ3ßCCß~òñZ–=ª¸7Õ& %;G–BÙ±}a Ž±›s|­§÷ÒÖ°8ÈÙ™xë;ÿFúÉƒv½ÿ\ÓÅ™žyŸ¦¨Ñ9Ô;9‹(ÌÃÏ¼t$PÔ–hJj)Eóú%Ù…›/o¿—Gì75uÄ£fÚ_øöC`H{ÎZr¡\ÁÊ÷Q©eÂÇ÷ã³Ó{{ÁSäX>XØ±»òóÅóU÷õÁ’»±äïþòG¿±ÕÜ×°#~¿øyðóOÚñêé“Æ/ÕÓZue—þoœþÜâc(wÜ{2ü¹Ù8õ¶–ããþÎ“F¯»ÔyQ}¸}ñdµ³Úv~Ý¯þØßþµq¾³Q=k¯þÜoüòàñ›•àâÍÊÇ ±µû`¿ÙøuÇoœ¾Yý ýì\4üçâ™è§±òÇ_w~ys±ë7Îö9§vöOŸ=+MpÑü2D·íË¸EÚI\pÕëÉç§‚Á•¬ž	ròQflNö]OìÊ¡)+° À\QÕûÞ…rU2Dz çT•ägá­DS'Ð"ýÈNMŠ(&l³¹xwcØ6|-[#òXŒ,µ•µäj”—"{.á±Ûc,Û(19\–Cl´´¡ï*°ŒÇ“µö¶¶¶ëGõÝÚÞán«~Ð,UÆßœŽãR×û„Ñ	8g¼Ñ† t¾½WÝhìn5kÀîN3‚mà€à¸5Û‘çõQ¨o‹F‚~Í7GÍÝê~óÅ^ë¨Ùz³]Ÿd@ñ Lü“‹fßÄ@Þ7“‹À‡ZG€y«µŠ™[;?íï5[“ôË ª%‚åæ‰¿•,Áj!”ã%½_€ÚWr„PGªbøA½¹·ýJ¡«²õŸxrîvÀ½êüîéN
ìc… ú í¥ÒOœîÇ°{Ö€·›-jcBš¡¯ãÌÃñ™aY01Îwß™¯ÄMg¼|›I%¹ÒÕ)µ»°<H
à²1ÙÒ;¸KÚÁ°ãÅsÐpGÂ’µ(Î9›”Z@Z§¬ˆ$°˜z)•øR²'(‚ŠQ'àÈ'ˆ.m¿Oà—µ(@3_²!ÉÊ9d»€¢°ÃQÔ¡æJÕE ÒËŠ,YB¤)Û±.WSÞhö¼Þq
s=¢#{EÝÌ«’‡lš¶kqÝ 9ö™s©#·¨#]Û6A\rE®–)@øþ|÷Øz’i·¼‰gž&þš¶)Ç#ôþŸ>1”ð§K`‚rD9šLÄb=ÐlC²Tò0·µ¥‰u%Ô
,b¸eÔ…•ûáyžrA|³êÒ)Ö,àø™: þ(¤(B3Z³ÀX§¾©Y`•×Æê=_­Zƒ¤·Ôµˆá¯¤~Ü!Zá0Ò 9ÁG2 „çUº¦dXNr¥4C65L³ºms_ÈëIƒñ«–_ˆckt½Nßõd£eA¡ˆ ÄBæ¥Ðvûm/¼NI^JÕ›€WÇšrŸ7–sl&%u¿^NßÐ$d†Ö¶òE¯m{ V‘QëÏ¾¤|E5ìŽ£¶¢u¹ÁÛb5”wœócÊ#÷#t— ŽÞV M¿ë''^›ô KóšÝ%HÄÜœ§øÁ£å}ŒŒý©Üâ#¶À=Æ€‚T)Uû°ö‘¤4¯C9~x—¨’Ã¯ óˆ3¬ûÙd¡íQ9Gâ©ÍžˆZëˆœKc¤ºÛ\ÁÈ•xI%Â…ysÄØ]èTð5NS€˜*Í3ÅTùiÇþÕ¢—ósØ¨1(òAJ cø¡ÙÀE>()zI	¶RàžÇC?9â1J™–kd7ƒ8›&Ð¬õ~]¥Òä&±YJ²†é‚˜CÃÌ~…§–š•"f,=ë}œ]ÈwËu#}`4?æNâàFí¤,%JqŠÖÜ’N:¦škc]–—ŒÂNá•!©ì¡Œ©zU} Ï#KbrsÉËšB4$
¢Å„²wlF“ÍE¶«œd8feŒd5 ²Q¢8ÐÇÃ~ä¹8Fx–Õ84ÚK¶Ÿ(åVÛ ò¨¢ÐOS˜'pÃÎÆÎÆsŒŸŽ9ü¾zAä*ý^ç˜ë½GYiJEu€#!¼fÇ ÏÌb©© Q˜¿Q«Èh,û~™¿õ[{èƒþ²Ú8j¶êÕ£f½u2‡¦ÐòBŒhÀž"+àøñœ?aCòÔXËì²Çò)Ý?ÿe qq2ÚÐ$¨¥®Ô”çöš0ÑAÉÀ.ŒñD3]“áø'‡ïæ‚„m"‰€@û§ød…½ð9P*¨œ¹HZÝaï¸oR¤zC0Ì§‰¼µÎb$„Áh{~’Hq0¦€qe¶pÉ1€°ÈzÞ´ÅôöèÛOI®†QepÄ¥—®ïÔ¼¾›(¥é&Ë•ØvKOä—K  Ôow½&'`höSvøHøBÉ M"òž³âüà¬­¤RMõÕ"¾²ÖPÔéÕ‚±,^úŽAàª:1˜,êmoÂ9,çÏa9Ëùs°58îºn\åÓ°¹ùÁk^é[ã¤Ðxõx—ãD¼?æ%o/³ÏÈ¸ì“œûI»ËÖÁbe«¼–ÍmÙ£w<²*¦§±•ÔÕVðûAý‡õ&CðµúnµÅÑüíS¯T ¼^R+µ»(ÿƒ
R©ûÈÍä¡½:ÇÎÏœ÷„(U¿‰ïej†Ï•T½‚Aˆs¦àŒK¦§¦áCÃh×ÙØ~ph®E£&¦V™E²cE²güÄÌ$?gEmJÃ Ò,3<þ˜'(°í%³˜¦ï¸ýÏ¥YNå7áŒó§çö+Œ p\ÄÝN8LÊk¨¦í¤ôÊÎ¦XŠ""t¼¦SèŒÆ,¼hc azuø§Ý„d@JB¾rœ ´8 g§lg–I‘rè%ùÃoyyƒŠNlz›*Å›€¶	[›‚ˆÃÉ‚ßhYƒðÃ7*À&X4vðézø3ãa|áD´7p¤ÊÎkOè–Ç=uý¾ƒš¯hÄŽYWî7pe¼›i
]@c t´ËØÝ:ÚjÜjx2ÍaŒ—"—î=<xˆÄ¥÷Àp÷àÕ–::§û«Œ¬Á"”ñ©vP`V…•;á™ïÍâX²g­WN³žÏÎ#Î–•ìødu†$«³XDveM\ŒæR=õúí‹†U›Œt¯p„$-Rª«–J%~B³³òRëSR»f‹ÔÃ7$oŸÝög`Øs§Õ<ovÁ™m|À‹€%œøûef;{€„Wñw•ÛØnú‘G¨¸wñùs7:ö=g¿c>áçnK´(5ßhàó?ŽÉS¡Ñ„ð³‚=Á[ÛñÝ$Œ  •lBÎk%d»Þ¹ó£×ñ½Æ†àõOÉr«éµa=© ¾øq¹ÐlÛyFAS¸°_mº0õŸødi€aa°i¶Â³—Íñµßþ€Ä*[™óæ Ç¾ÛÇ›‰ûHÚØyÂ"¬<ó~1Ä±9[ø8ìG>Ë°O÷`5ôãe÷:qì]Ì*: ±³lŸŠ²³i"býh¤°l@mÂE/XàÐ^wýÄs¶Ãd³ý€~q^-Š††^„CœØ	Ml#rOÃ>>®Ý0ò]1Çm\x(uÈÚñàÊFJˆ~Û˜-U› uýE€üz€ÉÀïo<´Jý–ÞK¨×^§ïÅ÷‚øóN!.uZ/¼ bÏ#¿ÃMØ˜öÞ€+úŸMÚ&Ô@7<ö³íÝñ£(ŒDc;}'Ó·o-YÑQâ’6‚íÃ™Û‚ýb;±…mÁš{'‰S&¡óŠNGíâØ‹ÃþgeéÑ#gc»†OýŽnvR³“\õ¼@0Å­â_Áb» 'ÿƒ³Fg`×Ù"”w\x$OZÌ™¯hÖ¼ˆeÞ
¶Æ!5ª´ Þ>”h1¼žVøÁY*?^uvÛ#+IŸÎ›:§Avv–kåR³u´.šUâN£±Ù¾{!Æ2n;´È·s'÷Qñ ÷0 Ö³éàydî¬S1’ïaKkó¨óRêÊ­ý +óV¨÷Ô.!1¶Ãn?Ek]×â„,Ý3¿ÃPcønÐp@Š<(ßþ€.\ª¿Íßï†nwVcëN<µÏz¯G˜b/ðÏÎ€û…€9F5r@ß›á Ë^î°?µ®a’üV{^À¿p£;âõ3/¸èë€Š²®›=Ÿ]8ï˜!
>;ŽBÂs¶a_¬G°öq9èÑ–µYçaÝ¡÷+o[´ÑnÏ˜gTÑ²˜"à®Áž¦ëTxˆBéYƒ—Ö¸0—½gÖ6ØéhÛMÇ™._Q«i!£MãTóf³Ûéªè8áƒ`ýž= xÊ¢]¾ÇBúC^JŒ8ãÖù"¬&w•'Ä§<ÐüŒÅ\ôg-­  ÅZˆ¤SQ×”‚A®;Ë(Å3/oxó^<P°\·¾Ï2~Ïf‚UæQql\æ«¡±‘ÌÎD~/¸È÷H·±½töIûí'ZKUtÌXÈ÷/¼‹§áœ†‰s°äÛu4¡‹5a.ÅAã.§$Z*•Q°àœ£˜ ]:0V"ßË2Þ›ÀgFk
òí·Ÿ`È“šò„Q	Çé'¬¡hˆ*••]º$ylL¡=S~³âvB2Æ‰ý°®Ì­Ð 0O(¡ˆa8·Q2¶ó‹d|ö¯Â¶æó0Éø/ã‘«µZ}?e‘)püm2É:óg²°¡…W6S1íg5TÖÕ¥²ÕaÇ'Ë‹Å8ìwÄ{UîªÕe¦Ø®bwm³O€ÛßË]¨lˆ?3œ¤TÒ²zq­2°¶çiÅŒ˜è%mX>Ãó¶Ò:þ§@/¨]
Æµ –V^ªõÒ@$›ÕßC#¡Þ {ª–<õú‘1!zh“ÄYÜL ´€…´Í÷ï;›ÂQ‚U£DqƒÐTcN-P
”·°ã¸Ã ÝZ8²‡ƒð[amµT¯xÇ±Ê<òä{ƒ×ïz~ÏCÁZ%õá£Cð~â5§¬q¡è¤â¼Ækåpà Ü[Ê„)øV§È­Ú„©ìâ;çuœáåÆE/†$EcæQf‚YÞq„r/‚mOß¯ZØþôåšÌ§ËMJ~úxEíI
È¥¬2u@V†Ø¾…L¯Î+ku3§³iÃ#œñ®a¯Åybâ
‰n¥¤D#§íçQ©öcdªyh:Õª¼ÌLtgÙ
ÏÎ#¿œR™y…õ-˜%ã_{Ùl™Yã*…_´®š®0îžñ¸6Òº¢±ÿ©ÍmµÀO*r¹Hg//Y	m+šHvöµa²Mà!c¥ Ç­³ ÛÀøf(Ô‘d8´0þŽG¶Œ€f2†Jƒ””ÕâäƒDëJ	FõÊO¤m£Lai2n˜’í›9&5K^JÒÖÛ Ohú‚"A:§»è4Õªn×w¦ÛªïÖõ&#P$P™@±7,÷hôÂ´–†.òtë®^¿|âyû^D1ýI=?¯ô”ãÿ—)A,h€õåÛ>{eeWÓ—9¬kEÛwûyËÊè¤aU¢'ÿHÍ&›Ü¬5™‹†¯ùù´°`ÊÌBØÆõH¨Â(0¾‹¶“Ëê³_ý#N2+O?¨¸r°u²ZÌªŒ<Ñ]7³þ²€ª«¥*@*d«=F¸wÜ}“{Uº‰ÚíÉÐÕÅÏ=àÞ=˜!¶r'ô†ß‹(Ë³ÜH}ã
CåZkÂÁsŠ^C<h3vbêÝø~Óí5#†}ûIÙöu{xÈØ?ÅŸ¨-
)‰#ú—„,‚Ë<ðèˆG©´CM#"O["}e…&HÔ°:Eäé4‡š+{¢úý'NI™€YÖõO’9i«çs¢[Qüd÷‡í-w¡³¸ÍÙÐ¢øèþSÊ]Z­úî†»Ô¶«Í[@Í|›ÄŸjÒp†(Xq”ÇÂÉ÷Û$§EEs³S«P4¿-´s±Ö[CêrÅÈ¦lË¨ßBÛü5±3²¥ÛÀ–‘×ñ²6F´1ä5U_¥Ù{Ù\
Ò]2”ÏƒóEZPµ¬¾N•tUlåj‹!{[ÀÏ÷+†y‹ú>óþ±œÂ³òb¯I©MšÍ£w_Ö[·R>-ˆúán¢dÁq)%c|«¬ÖùJý(ÔÓTHw>î)éY60ç¼©ÉuúÃ®Gd*_„p—ž‡a'Óè±CS˜2µ_†ý^rÓ´M­>1Z53Á<ñ€ºJgç`Ðq¹Gô„è-íŽ{Œ¶Hçv†Ñ:éö^ÄÃoÆ.K×Oæ<äÆƒiÈœ5^ùñ„dŽ úñÄÉ5ÔÄè!“ršˆˆ½‘Ò¡Û—ä ;ˆ¼8þ‘ h#D)i…7úB¾4ïŠ²>šÞðû—^ž·îJ^ÊŽì¼ÈÚ1)þ?¨×ö6Žvö^5êGÍ½ÃÝÖAµöò.ÝÂ_+FM`µö‡¡ƒ‚‹@£q$Q‡Êf/´«À4½?šŠ—†/¤ß³ÉØˆU­YD¼gëÜ¤•¯X\¨ô’´#c‹ (sö%Už/k5
þ\ßÕ»¯kÇ[¹ë2Þ:DysÖ|™˜oR¼óÇÃFëh³±½sG¬Çg¬`ZÈ’äÔZO£$™fÉ’:™žp” àIà·y:Væp—´IÉÄÂÐ7I‚¡.¿â5¿&˜ìäbÓóTrÚî-/i$/½¾âœt¤Ï²ïIþ~ˆ\65¡î0ILÚ9Ô3òøúŠú!éýÊÃ°•ÒhˆdŸj]ÔvÂ›%ùÆŒßHÀ) #¬Ø!E¾°²žÕüwNkççJJ,ïÚƒx*Å=‚D1‚™¶) PÏ	!r¬ãÀì4XGlãú°Ÿ³˜‡¶¸~ÏcÚÒo¿ý”ä}néŠAx6ý^gneþr‡¬YÁ§³¼ôoˆ5 ¼™Â·3‡md°ioe>Ë_+%l–u0»¶8Ç^à{'Ó/è¹|@Ñê	S.Çdl“³”'p¸hÚýf#èø(wóú˜š8¾˜Çèt0ã4Ù/ceÌ²‚!{:°n'Ã pbhÌ§-Îö=ZÎcò¾Ê“3üÊº¸2jåàØ†°üÉ]Ýãh8H ;f™‚ágy'PZ­-cª`Ê‡uÑ”OUY,B­! ¦ Äƒ¹1CÔ9GnŒ3Š!I›êáÞåOÈèíjó…>Ñ×Õí—õgos³ BÈP0Ž‡h…¸»çÔövvê»­’sÞõúÐ3n5¼:†ÃáÂJ¹¿þêÏ8~g£Ï›Oêðˆ¹0ž cKÖ‰'ÃÈGMAêÍ;hMZâ.£™<HXËž+¨j1õiX"BîÞH6L¾Þ“ðàYZú©Ò\¦šŠ‰³\Êý¨ÔÕô"@Ë¦¹¶µ#—UØÕªÈ£ÄOÇóaì÷9wª''®Éß3ƒÛÚÞ.²ˆ-§U? ê­Újìí:»{­F­^ÑÀX’¢pûÛÝ0á¶Ö5qþ¼¸Í¶¾ùfS„‡G[W2ËíÑ)F;¡dŸ¥v³`bÃD¾uµ°ðˆRÂE„çàGB=Á="®"›ÝnçŒüª9¥‰u.,QG½œ8Z•ï¨ìŠ2[Ÿ/óMûvª=Œ§+Òv(é‚ÝãT™Yý›oš;ˆ‹œ-@†}Ú†ø ôá`&³7$ßh8ÇdxJƒá»Ä½È²©ÖÊå+;0JÆÃâEŽ'ïI¬3RO¶dKT–aá<©GÀ$zÍ¢utc4B§;mÔkÛÝú±ÖYÀQÄÆ{á§›g†:^®Ù/XE\ ¹)€Ú` .•Ævýàèð`ûö¥“ë,æpz–;|f¶Ò·pEv'†7‚:T¸Ýö#¯ç{d“VÆ»çÍy8FOXàeN>l6¢y–óR|ä©ÃÜ+³ú³‰ËƒaÜÓk¯ü¤ž?û]ÚòÜ^~ ‰÷éôý3?qY–:¦á)[\ðÃÉdNáÎŽ>Â<ðò.·å•èbx…±/(¾Ó@‚wËìcŸÈÐ†¼£é¥1”ÊÆ(FÓ(Œ(¢ÜÇIÐX¡Ñ1GT0°ÆaàP°W¤Å­‚Óùá)
6ûû¥ãÃT$š‡0Lñ²_HÒf–‡Q`eg¯¸è¸À±)=”“âg;’®í½úŠ¢¿¢èÏŒ¢%TÌ,d\ý3ÅÌŸ3Úð²xqƒXÙfà¸PßiÔn5"óí£dÃtTÌz½^$;~ôVÞ¯¥•TPš<-k~UøýdÑW¦¼ß€uñHáõQ:ð¦euåÍ+:„ÊbÒˆÉ—L@ÌžØ=ÛQoQÍžÜî×©a˜‘Ä«‰ÿÊ¨€ù˜3û	Žê”H~_1çœ-d¦8A~(N6giÜ\¨¼n”6x_ºWÔÕq”ÒŽ¬ÚÕÕ™vWQRãC[[i˜¦Â¹—S€PÛ°4„mÓX@„6&yýv;Õþ©ÇŒF4'y'ä„{ƒæ+´ØL{ãv›ªÂ+N†ý˜Ôr³< †&–žÍh3¿T!LõÒ$É¸&ýí˜O„æá’™xb,ÕÄ&YZ­Z]Î´@+†Ó(~ŠÉÎË‘[tÅ6¬Ï¶ùÜ:è˜‹¡W†Äð Æm‰w0†[^º}D5Yw°hn–»Ž}l7ŸGÑ½§V.ºýØg’;0m»ø&dŸTP/Q= 	+ó.¿‘'éu»³p&øÕÚ›…íZ ¥ƒ+›±*­™IdliU´Ô/™§VA»²ÆÄ2>®3Y›·6 '÷Ñ.~öÉ¿þí.Rêõ~
¸°”ò–½Îtpƒc4ØM‰ó{çC¾’äS’äö¼R£Â¢yœÇU;5¶vdWþ7w*Ñ— 8jhCâòÓíÏv½ŠÉ¾¿nÐ5nPšvÊ-©îÖ^ÕÞì·öŽj{]iGŸH9‚Hl@)Fž†ð¯;ì·»û¥-'K
-\°\ŠPÏ‹D ‹‘¹whU&ÚÆ5LxÚ@¡ë+« tÍºwKXý~,¤Ùt0(Çœ:2Îžç19òôØ”aÃUjÃÓ£¼ÔÇj&f¾ÚéoZõì—´ú[Ïn}zZ±‘7*}¨¯@ö¦çF¼¤æ”æ`MìíàË°a4å[©†D†vÃ CÑ·•4ID±x^…Áã‰(&|ƒ¡Ð,|âäà&éŒ†,;é‚3Lü€ÈØ%™¾ãOë}´"ï`ål`W÷Ù#™ÎŸ¸ýZ0<NŸ…xUòŸrÃl^9‰ƒô³v¦S3VÛ©ô|Ø­£ôãcstfŒ&‚HE€¸É¢›ç‡o8®± —ìä¹yŒ1#Í9›MKŠx1iÅ3>#@Ö¾ÊÒ)Òü<ðÐ4úÈ.öv†Aâh`“ªÝ|ÏbEÿ¦ÁÍríZ—T¿1uÔVÉÙ	ã¸' QkPCT9û*Âô¡ÆÜtdmoG.Ûœ*g7é‰lÖ··GÉÈ;óúC»—¾\ãóœÊ¢ûs¡?@M¸‹®zJ7<ë)]LO)uò½Ï=CDûLbŽÊ$?\^˜  Ì|éÈàž ·;„¯X§§£W;ÞÏvGï/øT³.î6˜ßM¸ÍZ.ÔJ\P^3SÜbËåe½…Æ7xÞ¼5*gÕLF™³šàxD3eªE~DE¨)ŽáNõàe½•Sž9Aß˜;r G¿wûà}nbóÀØªþÅ\)²\(Fˆ·ömÔâ­ûudëPHöÉ­Y4Ó Û‘“‚äŠ†F8ó(knÜÝ&¯Ü`¨©0ò¥½Žá5Éð”{›=sæäN3×é%Ýž»]·#'s—å0ãT·ë-Ýgö—!ò)ó÷#Þ'Z†¢…)·.Ž]:îI‚ñÞažè[ˆá ÐáÛO»C<0—®Æ¼é_7ƒA¨È‘#a;ì<Ûa¸ƒØëÈÆ
¼\™ÂuUñ`Í*ßTÄK ¸ÑTu<ÿ2« äÜw\¿ÿ‚„|¹€nP)?ä•T%±Kåµ/Ã#1?L¦|&Õ:¹ê²mÙ"¦ÿÕšÈñZ´+ôñ†PíŸ¸ˆ :?þÝ©G(Ê¿=Éúzx
Ã#q­I¹nAxŽƒO‰¹6hOmmð˜|žZu¹Oîfã§˜\È¶Ã26"¢psÞf2qãµF¨õ…íŠŒ&¥Z{[[Ûu¡S:l5¶­7¢—ñ¶¨Ý"âDP¸A#FßlU¿ð–ÿÔLøÓÿä’Z]wW0‚ëÊÚ—AKßQú8ó'íQä² Ã{ònÍ´³Þ¹¡_FjUsV)0Uœ™f®—˜?Üß¨¶êGÕƒV£Ù:Ú<ÜÝ¸ÕhÊ_èu®¢­…)7áUc£~«ü”B¾ò;^«ÄÛ=#‹¡3´:Ë±Ê| ÎR‹Gé5ë!&£¡³/#4›yE]œ	6šçœª¨sM÷ïò¤Æyä9`Š¼Î°M¤3†V¡ÅMZ¾ØìQ•¾ÏKïq_pZB½ð1áå†ÀE}7`­‹&i+¾ÉlòÜf,ÔþÁÞE’~]¯¿LA±^|Xp?¸Ø	;™©|â÷<ö kwð=·fÇxh~Œi5‚‹CZO4¶ˆ†’±w©Áyå<HvÈŒ•m?š/jM¤°ÖK>_Þ!©o¹hÖ=»ïW3ÙkÒE–Á/SýcÅ^ØñO|¯£öì£:'Ó7šÉ«ý˜Iö\!¼P¾uõ#-›Å(DùÒàä…Ëºks3–ì.“Å…Šu·ôõþ}ç€8TéÈšJ\z©êÍÌDzŽ[¹…-sþÀs[Ú†G³?ì¤jYÈ3ª»l«ºÄ«Ö" âêæô»B•ëÛ,ž&šÎ ¿{3«l^à;Ì?Š=%:™ÙNÎx–©¡×]7ðœãáE~«öÅx"Õ=%.ˆÞ@áŠ´BŒk80¿…ö!<¦šm·çDÃ,EA9cx@M<§PQÃ‚X«/•±êžiÕUØG›ÿ sêÃv2$*Ó€kvšöSv0…³e‡LaÓ×„µï¹fVë lµd y]VyÅ¬+kªò¥EÊ'}Ï:Ú{j·ó¼'w]° ‹ÃAjbcHÝl"m›lÛXsVÔEN¬{½‘%Ëºr:<§þ6w$&6ÁõÐŠG^÷{é”ïe#¿'uÿTC’ñ J Ö¶H?æØFêâCžçÝVƒö{ý(Èc)6boçóï‰¯·yWeÝ,ÛÿLáör d%¯SsªÏÒ>ÕËÉ&<(„ñ<›ç»rÀŸ¹Å5µwª’ÚRJýá*ç˜˜¤õT¡Ò3½±ïõ#K`hvÏí.m £Ð»ëæâŠª‹…rhB«L³Ä•/ëmÝ“Û² v¤Ã“à¬mû~MÏ’§jGˆêšyúøa%:gSþt[róVÉ®—Ê¸ÌºWé6—+VÎ—ãáqÌ~=²:Mô)Ÿ^©Æô ì¾ýû_ÿù¬¡"†1ÒòTà8
³äùK>ybíù„b4ÂÞÔPc2:î¥ÐVä·…ÙlF¶µ"tV¯îø•…ZÑ0×HØªc¾ÒkïxÕù‹Ã—ñ/Îîf+Æ?!K ÙÇÀÈþÎ ueýxŸ¤Â9¡@ðãRö]è«›$ƒ¸rÿ>¹BRö°A 4# ŠÞýA7LÂÅå‡++W—ž<yüàÑ£Å•¥ãËíÎ’·ôèÁúù³åµ¥ïºôï‰Ÿ<kGáà»??{¼dKs¥T$›å¡<¯öÁaY ±J)0§çM¸§Y)íQ8™´î¼>Ý¿Ž›Åud6R'‹Ïûñò=f¦«=Ìð÷í§¶¤Ó›q^{ñå4Dò²³··Kçàïý_ÿwÃ‡˜ÚU›¡X2aøÅ¶nG^Ç?.€ð€ï:‘Ý÷Ãó²³öga$~£ÑtP¦ÆOÇ……‰aÃZ—X¢‹L&I‡ÊNÓG"æHàqNË¤…ìÂ²c$ds~?vû^ÙyîŸB³˜fb¸ËœöhyÝ7ÛqzÀwœ`xÓ3Ì¿Œ1¾C­‹²³í%³1,6|`ÿãÿü^kô¾é™‹ÁEŽÿ9~ÆtNÆO¦NÎ Õû&Õ/s0+Ê—Ì‹¤‰’míVì®-¡¨ñ<ÌS|ikbÌ@ÃE—©z3qDÇ5ÝH"ÎºšõPÙYkÆYü¨4 U¡ÊB[dÉlÙ_ÄmB8!#*»ÀE—†<UZ»ü†‡°r“Ä_‚ÅgY2;C iÛxfyøø‹:nŠ6Ú‘ËÃQ¹¤‚fúWæôîÄ@¯aÎ#ÆÝáˆí£›yf‘ÇŠIå‹ˆÒs6©ÜiBÉŽ c[ES¦Ää—+e6ª°LÔ¬Æ<^¿?Ôír¤Œ¬ÌÐ oÀnÍ¥›?7 l¢9QŒÂ­Í…ìe8’iü’âšŽÓÒ»jX1„wJ†6v²n†óìvå””æMYµ™F ˆ9ÝoZ:¹AY Â´}-*‡t$Ì)HÉom	¯121WTü|$Z9X£ŠQÆBïj€¶Tº€]Ç~ƒ2=³³6È é§GV6Ñø LÏ&jÅŠÌeñx‚¶.U6ÄrÊ^¶D)õÎ†ùi*jXP‘´Ý™½Sewt+’õuçq–•tnðcé!ÕUCº$ÆX!ŸÇÄuH:ÄZŒÀ•–}ª€þžÀˆ2ÂìF}LÒ$C;”H˜\ÞœÚ^PøéÞ¥°ï`ê`>ð"ègÜžÀÆa>õÌÅ4ÀÐynòO¡)vÿ‚Æ—Ï•·ù‹ÂKÃdù‹E¨V!ÁÖ¤Ò@pGÞ™ö8ZöŽ×~ªìØ‹idª²Å‘£w„³qbœCæÀk›Ú\Œ<·-“ŠÃ(™›sœcš³µî1òðÖ7îüüÛ¥Ç2 3°!¬tEQeíKT6¥w=i›²vî;F6]\B•\Ì: UÓ.Ê(‰	‘1äÃ)³q›ôš.KZ&!y\³T9"¼½ ®?à‰Üö ©'ŠÔW3kñ–`’HGµV©IC A÷òâšMD.w°<e©ƒ‡‹ËK#{Xš¸‡e¶Œ|ËÀpêdòY¬0SOÖÇÊòâ£±›zÀ¹jjmiñÉÒ7Ú–s9;T¡ (2þdi°þLùý¹	‚ŸÍÏ¯gÂ4cÖM˜Å0kÔû	IBÓ3¡£1ì‘qVB`½²ÃüTj?ÞðŽ‡Étÿá™ÔrþÁáœ£#§îÒŠ1-0Ÿ¥. ‡ïùÇ¡y‡aËK”Íã¡¨/VðÅŠåÅ*¾Xµ¼x€/X^¬á‹5|±¬"	GšÞûÒ·ŸÒE©‡Ž/€õŸ *X©I"àÒðºåR™È[ô™"B!	ö7]œKfàdTœç~‡˜OåÜ²0p9-UN”${¢)^‡rFBÖR¿”`J‘¤±ºÄpˆÂ -Ù1ÿCvÓØ.ß%›DLB©…­»Ë	÷àß
xvšieŒ¾b1™É;ëóÒqç`Ë ]Y¾”"k²¸ë.w~,0}»q,™ob|¾@œ-Ô¥«jÒý¦mÎ7Æ56HÉÁ¼4P´r:É·`[ØŠø2Šø·&L6òcÐüy2 Sþ2n–¨Ô@_­>ZpÃ$¦ÀDáˆá`Ê›”Ëj0	®ºcóÅŒÅ–×÷"”ˆœâ`1v÷kÎŸ‡a’fÅ#¦ñà
n¡¿Ëgë>’:)NI•ˆGÁò4sV¸V×NY¾dç™4eu0ªÔ¹`cR;QëdðŽ—I_Í´FLy&ûY¦ÅÚ;QÑ	"4zQMùûŒ»×Õ»T°–ÝW­.ÉËcvøýx]½œ¹¥žæQÆ2X†Ù‰à¨§•oàÇ6VÔ‚Ü•¾×ìA`Qt’7~ý ;¼¤7W¢
G¥ùyó W&>×ÇLÅ Y]2ª­¿©Ç€Aá<Æ«‡(.}:ÇnÇ	ÂÀ¢Q*mpE{]÷Ì(OŽ»¶B¯=§CÚˆ¶k	ÿ®HÔ½:ÿ.ÿb²mÂ£œ]8qûù{ ÈØ·ÃñS…jØÞ²OPlô.2`Ô•vöZ/ê¥§´·³å¼©7›MüÑ˜íÉ»ÔuQ'Tzgîiáêê{Q°ØæÉ¤¡^ãe©,PÎE)/Ï‚yp÷N*6ô:-ÐGŒ­7â¤×éc5Ûãd×é¨›2Ý©¢KW“¬1š0ªÚ¦]ËÜü	€ÁlŒX´I*W5ùÒ%‰j‡’üV†0´›ã"B¶»t×âQwÛmTÑÃÍ¡08N,8H@ScÂË¨ùï   ÿÿ …«Pxœ¬YmsÛ¸þî_±QÛ+ÕaQ%ùE¹ñÙÉÕ3qr“¸w2ž"!‰¾•-+>ý÷î|)Ÿ'Ö±dÄî>»xv±`rX…»#¨‚X)ã…Ü$ÙµÏrÉ3™ÿÈÕÛp)²/½~2!‹,†ôìû#óuWŽá*‰ÿ.!/Ò4yå¼áC†×»¥€Èa)<^äÒbŠäFDìÈ0_ê}2† cé 5_E~
7\nØ*L’ÌBÐjþøœaþQâ«@dý¶(ZØ
!¤«qR0zAýý5ÛE<ˆ!ç‘0&ì›`îûÕõ¾r‘¢»
b¾Û_’\æ,ñZnàÕbqgè`]GÏ_yç˜ oMtÌGá%q.³Â“ð¨äa‹ËUÁ÷á¾eðÞ”ýr ­ç€Ú$ú•CRd	Ò$õ2þ  ŒÏÅû«F¹xrÄk5SO`-Ÿà<™`¼Ò{‚ÖÜ˜·\Ïð0ÜßÆôÞç’3íÍ½v‡¤’×—w<ªªH@ú"ûúÚŸÊXŽáV'Ò}ÅâÛÊ‚B´$4ž‰ÆŠ_dÏ¯Põg®®¯ý;´eiK¦Múh§ðŸµœÐìð»FÎàTøà’‹†`Í7q¬šÖp¥J,²‹GùIb€7~œvüªÌ’VEàRE-}v„3ŽtÌ×"Ž}Jâõm†´B€Ö¿r‡Š‹h)² ¨Uà!!e‘7}X¼FPGvó˜=Áó]¯.6EìšðÏh¾¶›¡•Çý$²úg•®Ò8¼^À	åÔÁÉà†ÌqkÅ½OÏ7ðÏ@öÎºÓÆÆ´Ûàëmòõùy”—Õ¼Ü’?™fZ“-ü„—";œèúÞ†IªgìA„XCœ~Ÿ3Îw:3r¿Ë™ñ÷:czm:Óª÷>É"Ò"•xL“L–kü3VØ_²ä!Àì8ÅzÇ=ÉÞ^ž?·	B?q9ø>ñì_óˆõÕÓÁÑ^³¬&Íç5j,Àò”KoCÉ‹ÛÓGážÈ,šQ^°ä2à¡’P5½TäïŒN¼@.äuuWªRÓ-ÊRS&ÔsÐŸ5m–Jò]{¬%?|Fø'áŽ`Ê–C-Ñ^ùLÓ¾g¨z¢iäZú//p×¯döZÓÛ KžL,*X&ß¬V·šU’A	(X˜Ïh§ žbYuØ5Z*BœUû¦·B Î¡àÓ<	„¯«®MöÈ„†…!öÀ´ XwFý…Ô˜n2‰2q†gMG»êA˜x¸µ^ý„û`†F,nù.×Ã¶#gW<W
3Y¤ýÎŽ£æ~¢=‘mÉÉr¼ÏÙZH?žM¹ö­~¿)ècƒh4ýðÃsÃL¹Ä<Ü0EvC„qžQÞëYýÖ&ÕQGÞèeŽZˆ©¶:FzG…¯¨X‡%ˆGfÜ?à×±L4Oel>1åÕÖp˜j
zµÑÑ¼ƒ4PÃgFF?U¦[O w©8…Þ»W_~¾¸yÓ@ÊwD¯ÓCì¦–}µß‚GªÀYf€ÜOBÁp»ÊÞeR„>Ä‰¦®‘'h$ëí[÷`¡É_³¢X+Že¿ßÙíK.WYa©çûÕ%#ÑîtwóËó–4â‹TÄ>^7ÜÇë(Á<Lr¤q;Ç©—»Æ­øQøZÐÛðxýrê¿ªëò^µKŽÔÙ`vWM*Ê'òó6A³ÏW€n¨D‘02£ËÆ\¤œšÅÇ·Yi>Ö`ZôéäuZH$R€„9ÈîŽÓi×l‹HB (Dv;ËP-_‡NO«!3xVßhì­ÝÐØÑº$:d†/–H–Ð“ÂWFrtéAà*8CŒ/:ããIb…‰Ï)FÔ¡d*² ;T(ßÿ¿‡ÆiwëH‘H
êL1·nõõ}4¢ÍÄ+2ì&¤^eTb˜&ïõx÷(ýª%Õïl»*ï)‚_þútEZãdkõ÷x×êoUMêœ­ñ´Ïòb©ûhkÖßßŸµ”Ö»Oon¿\¾ûð¯«/Ÿ.~}óåúÊ¬{m,íÒ¹7®‘—ÕjÓ" ¾õÏÿ¨B¾þ_˜¾äÞ×u†ÜÒ”"ÍÚäKL ãðGW;ƒ|%K«3zÙoê÷BÁ³Š	%=þûä(¶•)RµWŠîâ¢<bIHÂDß€|K[g¯ôÅÖKA¨M7m›©UÑCð£©ösûáœ6MQÚ||
ú/ü?>üKsë¾©”Ã_B¾YyP$©ŒïÎÛ²Ôƒ¾Sf(	ßÔ±ŽbÑ£,m‚R1£«Ÿ5³îÎš3ÐsŠU`•fuõ’Òr°-VW,tDÍµ…
x“âxæÍ8)!®—j^Rz»ÃÚØ‹ëæÊÐ"wtÑËß²¸b1g¯üo¯vŸ^ ÕË­ðºùÖÈ«d(sãÜ0'xž¿G˜‹ÞrmbÏ>q‡ ¯½Ý¸ñDAloìÜÃØÇ°
Å£ú²½$|å¶‡5@dð{‘Ë`µ«nS{Ú{]çm×ÖÖ¦Æ"þhoíÈ‡Úöpªß=†¨eù†ûÉVÝ.“O…åïØ}	”òC_h¢üaØþ”<.zCÂh‚¿½6Jg
úZah—5S+ýüGø³éð¢¥=®³ÈÖ<Faœ/z)ÓÓããívË¶c–dëã­c4ÝA£aýÞ€¿èÝ8;9™ÂðÂþËÎˆ›úº=b·Gl5ò-rÙl†£36šq6s'ôÑ¶Ã†cŸÌ={ÄæœÏfc×ž2¼1g4³!›Žç8îL'$íÒ§”fã	©˜Ì¼	›*e¨xÎÜ©Í¦Ã #³é6vÙx6b£ÑŒMNpÐ™’I ãÓo)pì1ÍÑÀÉkp#¼]ž*p''Ž=GE.¢sçtG'„a4'a‡>:×uñÉ|8BxéØ™Á	›ÏÆ½pÆÌÇtÄ&hb:AìS6Ç U ûnh³á‘:ß"æ]D2qÏÉÈAc¡ñŒð œ	ÆŒpN†.w(~ ¿!šº*¬®KˆF…i¢	ÒRÜé3á:N¾õŽ;”&bu†6ŽIhÅ\J¤UK{âÎKôõ^|s7×—çÇ§£!=P 2u‚™ª´DØN©™c®`Ò?µß[ìÏÓŽÊç‹AUæFP6ZH°Ï\…X6ï‹ø¹"½£ôÓ®rMêjÍ-cX¦ã<AÛX†Á/ðÈ@7cD%x.llzÏ[Éå.‹§'Ø¾ÜœÂý_«PTgÙýßîa¿?~}~ŒÐ»‹y8t¸94Kâ"ÄHÚ(Rl¹=KÞx_€D.›ÅiÁe¥¸Ù‹Ö:µÌ7ýzÏjí&çtÚ¸D: V½½+¥xXPXjÝM“UUÝk3bînÏ^µÞ¶ì¿U§¨Ã]¹òT½'ÔÃçÇÏ§Éý³ÃW“Øø•/¤¬Î;FOkÐoÑJu–¡Z…Mõ0ÕDÜÀë7ÜÕ-7žÛéKÞè&¹2áÞ
KAÊ}õ$A¼õ¦´W.L½.¥!åÅ   ÿÿ J>[*