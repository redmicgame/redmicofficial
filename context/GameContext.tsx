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
  autoUpdateCertifications: true,
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
            merchIncome += actualSales * item.price;

            const isPhysical = item.type === 'Vinyl' || item.type === 'CD' || item.type === 'Cassette' || item.type === 'T-Shirt' || item.type === 'Hoodie' || item.type === 'Tour Exclusive Merch';
            
            if (isPhysical && item.shippingDate && !item.isShipped) {
              const shipTotalWeeks = item.shippingDate.year * 52 + item.shippingDate.week;
              const currentTotalWeeks = newDate.year * 52 + newDate.week;
              
              const prevPreorders = item.preorderUnitsSold || 0;
              const newPreorders = prevPreorders + actualSales;

              if (currentTotalWeeks >= shipTotalWeeks) {
                // Shipment dispatches this week!
                const totalDelivered = newPreorders;

                const sub = artistData.labelSubmissions?.find(
                  (s) => s.release?.id === item.releaseId,
                );
                const rel = artistData.releases?.find(
                  (r) => r.id === item.releaseId,
                );

                if (sub && sub.status === 'scheduled') {
                  sub.preorderSales = (sub.preorderSales || 0) + totalDelivered;
                } else if (rel && rel.releaseDate) {
                  const relTotalWeeks = rel.releaseDate.year * 52 + rel.releaseDate.week;
                  if (currentTotalWeeks <= relTotalWeeks + 1) {
                    rel.preorderSales = (rel.preorderSales || 0) + totalDelivered;
                  }
                }

                return {
                  ...item,
                  stock: item.stock - actualSales,
                  unitsSold: (item.unitsSold || 0) + actualSales,
                  preorderUnitsSold: newPreorders,
                  isShipped: true,
                  isPreorder: false,
                  _actualWeeklySales: totalDelivered,
                  shippedWeekSales: totalDelivered,
                };
              } else {
                return {
                  ...item,
                  stock: item.stock - actualSales,
                  unitsSold: (item.unitsSold || 0) + actualSales,
                  preorderUnitsSold: newPreorders,
                  _actualWeeklySales: 0,
                };
              }
            }

            if (item.isPreorder) {
              const sub = artistData.labelSubmissions?.find(
                (s) => s.release?.id === item.releaseId,
              );
              if (sub) {
                sub.preorderSales = (sub.preorderSales || 0) + actualSales;
              }
            }

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
              artistData.releases.push({
                ...release,
                releaseDate: newDate,
                releasingLabel: releasingLabelInfo,
                preorderSales: sub.preorderSales || 0,
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
        if (artistProfile) {
          const shouldAutoCertify = state.autoUpdateCertifications !== false;
          const newCertificationPosts: XPost[] = [];
          const albumsWithNewCerts = new Set<string>();

          // Song Certifications and Billions Club
          artistData.songs = artistData.songs.map((song) => {
            if (!song.isReleased) return song;

            const currentCert = getSongCertification(song.streams);
            const currentCertString = formatCertification(currentCert);

            if (
              shouldAutoCertify &&
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
              shouldAutoCertify &&
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

          // Inject accumulated preorder sales on the first charting week
          const relDate = release.releaseDate || {
            year: state.date.year,
            week: state.date.week,
          };
          if (
            newDate.year * 52 +
              newDate.week -
              (relDate.year * 52 + relDate.week) ===
            1
          ) {
            totalWeeklySales += release.preorderSales || 0;
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

      // Generate chartdata posts for other player songs in newBillboardHot100
      newBillboardHot100.forEach((entry) => {
        if (entry.isPlayerSong && entry.songId && entry.rank > 1) {
          const song = allPlayerSongsFlat.find((s) => s.id === entry.songId);
          if (song && updatedArtistsData[song.artistId]) {
            const aData = updatedArtistsData[song.artistId];
            const songArtistName = entry.artist || (allPlayerArtistsAndGroups.find((a) => a.id === song.artistId)?.name) || "Artist";
            const playerHandle = aData.xUsers.find((u) => u.isPlayer)?.username || songArtistName.toLowerCase().replace(/[^a-z0-9]/g, "");
            const chartDataPost = formatChartDataHot100Post({
              rank: entry.rank,
              lastWeekRank: entry.lastWeek,
              peak: entry.peak,
              weeksOnChart: entry.weeksOnChart,
              title: entry.title,
              artist: songArtistName,
              handle: playerHandle,
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
            const itunesWeeklyPreorders = Math.max(1, Math.round(weeklyPreSavesGain * 0.06 * (0.8 + Math.random() * 0.4)));
            sub.preorderSales = (sub.preorderSales || 0) + itunesWeeklyPreorders;

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
              subject: `Coachella ${newDate.year} Lineup Submissions`,
              body: autoSubmit
                ? `Hi ${artistProfile.name},

We are now preparing the lineup for the ${newDate.year} Coachella Valley Music and Arts Festival. Your manager has automatically submitted your materials for a spot on the lineup.

Please note: This is not a guarantee of placement, but a request for consideration.

- Coachella Team`
                : `Hi ${artistProfile.name},

We are now preparing the lineup for the ${newDate.year} Coachella Valley Music and Arts Festival. Based on your recent numbers, we would like to invite you to submit for a spot on the lineup.

Please note: This is not a guarantee of placement, but a request for consideration.

- Coachella Team`,
              date: newDate,
              isRead: autoSubmit,
              offer: {
                type: "coachellaOffer",
                emailId,
                isSubmitted: autoSubmit,
              },
            });
          }
        }
      }

      // Week 12: Golden Globe Submissions
      if (newDate.week === 12) {
        for (const artistId in updatedArtistsData) {
          const artistData = updatedArtistsData[artistId];
          const hasEligibleRoles = (artistData.actingRoles && artistData.actingRoles.length > 0) || (artistData.songs && artistData.songs.some(s => s.soundtrackTitle)) || (artistData.releases && artistData.releases.some(r => r.soundtrackInfo));
          if (hasEligibleRoles) {
              const emailId = crypto.randomUUID();
              artistData.inbox.unshift({
                id: emailId,
                sender: "Hollywood Foreign Press Association",
                subject: "Golden Globe Submissions Now Open",
                body: "The HFPA is now accepting submissions for the upcoming Golden Globe Awards. Please submit your eligible film and television work for consideration.",
                date: newDate,
                isRead: false,
                offer: {
                  type: "goldenGlobeSubmission",
                  emailId,
                },
              });
          }
        }
      }

      // Week 12: Coachella Selection
      if (newDate.week === 12) {
        for (const artistId in updatedArtistsData) {
          const artistData = updatedArtistsData[artistId];
          const artistProfile = allPlayerArtistsAndGroups.find(
            (a) => a.id === artistId,
          );

          if (
            artistData.coachella &&
            artistData.coachella.status === "submitted"
          ) {
            let status: "headliner" | "mid" | "small" | "opener" = "opener";
            let payoutSize = 0;
            let openingFor: string | undefined;

            if (artistData.popularity >= 70) {
              status = "headliner";
              payoutSize =
                Math.floor(Math.random() * (20000000 - 5500000)) + 5500000;
            } else if (artistData.popularity >= 50) {
              status = "mid";
              payoutSize =
                Math.floor(Math.random() * (2000000 - 300000)) + 300000;
            } else if (artistData.popularity >= 25) {
              status = "small";
              payoutSize = Math.floor(Math.random() * (100000 - 25000)) + 25000;
            } else {
              const realOtherArtists = [
                "Taylor Swift",
                "BeyoncÃ©",
                "The Weeknd",
                "Kendrick Lamar",
                "Bad Bunny",
                "Rihanna",
              ];
              status = "opener";
              openingFor =
                realOtherArtists[
                  Math.floor(Math.random() * realOtherArtists.length)
                ];
              payoutSize = Math.floor(Math.random() * (25000 - 5000)) + 5000;
            }

            let stageName = "Sonora Tent";
            if (status === "headliner") stageName = "T Mobile Stage";
            else if (status === "mid") stageName = "Outdoor Theatre";
            else if (status === "small") stageName = "The Yuma Tent";

            artistData.coachella.status = status;
            artistData.coachella.payoutSize = payoutSize;
            artistData.coachella.openingFor = openingFor;
            artistData.coachella.stage = stageName;

            let slotText = "OPENER (1 song)";
            if (status === "headliner") slotText = "HEADLINER (10-20 songs)";
            else if (status === "mid") slotText = "MID-TIER (8-10 songs)";
            else if (status === "small") slotText = "SMALLER SLOT (3-5 songs)";

            let body = `Hi ${artistProfile?.name},

We are thrilled to let you know that you have been selected to perform at Coachella ${newDate.year}!

Performance Details:
â€¢ Slot: ${slotText}
â€¢ Stage: ${stageName}
â€¢ Payout: $${formatNumber(payoutSize)}
${status === "opener" ? `â€¢ Opening For: ${openingFor}\n` : ""}
Please select your setlist below. Selected setlist songs will receive a 10% boost in streams and sales after your performance!

- Coachella Booking Team`;

            const emailId = crypto.randomUUID();
            artistData.inbox.push({
              id: emailId,
              sender:
                status === "opener"
                  ? openingFor || "The Headliner"
                  : "Coachella",
              senderIcon: "coachella",
              subject: `Coachella ${newDate.year} Status - ${stageName}`,
              body,
              date: newDate,
              isRead: false,
              offer: {
                type: "coachellaSelection",
                emailId,
                slot: status,
                stage: stageName,
                isSetlistSelected: false,
              },
            });
          }
        }
      }

      // Week 15: Coachella Performance & Tweets & YouTube Video & Live Album Offer
      if (newDate.week === 15) {
        for (const artistId in updatedArtistsData) {
          const artistData = updatedArtistsData[artistId];
          const artistProfile = allPlayerArtistsAndGroups.find(
            (a) => a.id === artistId,
          );

          const didPerformAtCoachella =
            artistData.coachella &&
            artistData.coachella.year === newDate.year &&
            ["headliner", "mid", "small", "opener"].includes(
              artistData.coachella.status
            );

          // Only offer Live Coachella Album email in Week 15 if the artist performed at Coachella
          if (didPerformAtCoachella) {
            const hasLiveAlbumOffer = (artistData.inbox || []).some(
              (e: any) => e.offer?.type === "coachellaLiveAlbumOffer" && e.offer.year === newDate.year
            );
            if (!hasLiveAlbumOffer) {
              const liveAlbumEmail = {
                id: crypto.randomUUID(),
                sender: "Coachella Music Festival",
                senderIcon: "coachella",
                subject: `Live From Coachella ${newDate.year} Album Proposal`,
                body: `Coachella ${newDate.year} was an absolute triumph!\n\nWe would love to invite you to record and release an official Live From Coachella album.\n\nYou can select your album title, upload custom cover artwork, and tracks to include. Every song on the project will feature the official "(Live From Coachella)" title suffix.\n\nWould you like to record & release your live album now?`,
                date: { ...newDate },
                read: false,
                offer: {
                  type: "coachellaLiveAlbumOffer",
                  year: newDate.year,
                  isReleased: false,
                },
              };
              artistData.inbox = [liveAlbumEmail, ...(artistData.inbox || [])];
            }
          }

          if (didPerformAtCoachella) {
            // Pay the artist
            if (artistData.coachella.payoutSize) {
              artistData.money += artistData.coachella.payoutSize;
            }

            let titleStr = "";
            if (artistData.coachella.status === "headliner")
              titleStr = "is HEADLINING";
            else if (artistData.coachella.status === "opener")
              titleStr = `is OPENING for ${artistData.coachella.openingFor} at`;
            else titleStr = `is performing at`;

            artistData.xPosts.unshift({
              id: crypto.randomUUID(),
              authorId: "popbase",
              content: `${artistProfile?.name} ${titleStr} Coachella ${newDate.year}!`,
              image:
                artistData.artistImages.length > 0
                  ? artistData.artistImages[
                      Math.floor(Math.random() * artistData.artistImages.length)
                    ]
                  : undefined,
              likes: Math.floor(Math.random() * 150000) + 40000,
              retweets: Math.floor(Math.random() * 25000) + 5000,
              views: Math.floor(Math.random() * 2000000) + 500000,
              date: newDate,
            });

            // Automatically post YouTube video after Week 15 Coachella
            const stageName = artistData.coachella.stage || "The Yuma Tent";
            const videoTitle = `${artistProfile?.name || 'Artist'} live @ ${stageName} Coachella ${newDate.year}`;
            
            const coachellaVideo = {
              id: crypto.randomUUID(),
              artistId: artistId,
              title: videoTitle,
              thumbnail: artistData.artistImages?.[0] || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
              type: "Live Performance",
              views: Math.floor(Math.random() * 180000) + 40000,
              likes: Math.floor(Math.random() * 15000) + 2500,
              comments: [],
              releaseDate: { ...newDate },
              channelId: "cxœì½ksG–(ö¿"‰áŠ€l” ÑBCaA$1	\ GKÑduw]ÃêªÞªj‚þ`‡áØXÛqc}}
;6Â×»Ÿíß3Àú	÷œ“™Uù8YU _šuHDwU>Ož<¯<çd&qšFËW„õÎÇ'qµ.VÜÿ0Ò¤:[ë¼:ÿêŠõ;*ª¤¬îFU4x•Œã¼·ÅÓQ®:ü-‹Á`°èüãÅÓgKÏ¾2Ú;¿â~;×ÝÝ¼)nÜ¸!6n–bwïþÎþTïÒ¸Y|º9åÓ$‹ª$ÏÊuq?šÆ‡UTÅO¢i´5/Š8«¾‹£Â(µðLÜ®;-±ð Xö+c,Oâø¥¸õÙº¸WqEbš0J«²É±X¬;€AÞÅ.N±öíÛ·¡ñÉ'~ÿ‡óá4)Kl¦ëý ³“j"¾+ªÜ’xS×A	‚ Ô´t’gOŸá‚‹ kDu‰$¶+< ÊJÆº-lÒêŠüXT“X Ü,\[xŸŠ®2›ép>¿>Ì³“ðÛ‡ó2	Â·p¡{Ñ+˜P‹ý|¦†ÓV ÇÓòxý ™ÝxÐÕG]¨¥]¦¥¯ƒOî´÷CZúÀ÷-íïÖdí=¨"-}È-½låó¬*ÎÚû©µô¤Ë´A,½ì •hƒhéân”â›Ûi<ªŠ<Ìôº{fÒã¼‹rãŒm†ˆlmDsgë
ÿVq6ŽµMõOocK2ygE|/Ih­=)ØTÙ<M¡8þq+$%ÁAo(u¥eìCht—’pðË-ŠI5`2H²Q:Çå"C/–€§X5Uõ:Aƒ¼v÷¶°´d”^²jú€ªŠ¹¾ó(Ýûœ!ñ’×C ´AfÚ@á Ãe!Á°Œ÷ºÆr“¶/²‹ÀrnÎä Û@X› §.t(~À4oÄƒþÑgÁ§= ŠÎ4!Ÿ÷lDk¦ý¦ït€sóÁÇ=›pI¶ÂmÚ+ná€¤Í³4:‹S˜»ÍËpÇÔ¬½%ÜßþZ”ƒQk 0šƒ7YÏ’9KƒŸ”ó!no$6+©Å¾ZH‡‘Îgcèl,¾Ä‡O¡µ,³3¶X‹ÝÀ~‘ÃŒbh#JÓ}êZµ²™ïù|†SÎÆ‹Î¶\ŒhÊÑ ÓdÍîl5dÉî—õª1xP-®ZCY">™dÎV•\©åvå+ïUR~ŠÐ˜åS²[‡ì»pÕ€)â4ŽJI£©‡<0 £0ÁmêÃ‡™jÝ‘¨g¬ËÀ Š²Bæ°*âhJÊÙÊ’¸)ÖVàã¶.¸¸¤?çÖïsè4°,òéMÌ€Ò,ŸÍÓHù™øµù|r6ózn—¿>%ò\«[|¢V¦ÞŠÞB°€ÇšmPÇ÷ƒRú¦X]y0æ“ª³©$ÆÁl^Nýê=·Þ²›rHŠÖí?Èò¤†E0[oAdYF¶¨K¹¤Î ¦ûøÜYHç>}ÎæÓG³Q-2#y^]sÙEÇGÝz6¢"¥3šA™&£xqeÙïèS±¶Ô»´Wèûv4š,.FØ-â¦žîE6—ùE6=¿ö†šSë}þÂ‡¹³âFi®¬^mYnž%ÿ0¹7×\–­’*e–\-úºxU“Aeã|º¸„°ôìWˆ
­DÒ"J¦´Ê¯où$©&Š\ðe–å]­2‘Ÿ¾‹ln[c*Öo‰©è‡[a$O]°Àâ0®|ökîì–UL£Ùb-¹HPù#³<"…/Íf¯—…úò×úr{¾nµÚÖ¿gcÆFom6€À)AàqÁã628Ä_Ã©Ì‹
 »,†Óá@òè°’ôÍjD1´¤Æ12³¡f]¢+–ZŽÈ4Z~õ2‚[Hþ§ª#÷ùi’ehîÑïŸ®<sŒú¬¨yæu4Y£nš ™)JÛméLuÎ¦ÑU$£pö°.†U_Þ^yqUNhbImƒ¸X½ŽÓ¨zˆôð€:„¿½®KNY©T"þQQø;h¶1J5ã’Ú–<[†7F‘Å'ŸØ¸˜ÍËñ·åÖ†]²[ÜEßvU€×§â³VmQ‚~•ûq¸6EM~ïø˜ôz›äüV¬ÖìÊ¨ó1ÎáÅ]Ài¡©ž)úž/_¹,â¤ˆ*/îªxÃcPÅQˆ‹*Q–åsè\œåóBnO*Œún4z]{£Î ·s±9‹deBšâ6O£b\®_¹òâ+î&pj>¢ñW„kƒK•¤*4â‘	‹
öÓ©¨(°üÓ?þ_0WÝ»ÄÅs Ä  @\Í9ÎÜ™º¤Q–Y[—¯Ö_Ùœ!l÷³eq‹Ó|žŽÅ0“<@K5‰^Ñ2‰™lWD-Ï(.âižÄ¾Tð‹¸œåÕ©&I)âi”¤´Ø£Q<«,ë8¥x`ˆõsÛÀ[¾ft‡ Oè†vÏ>_p¨L}ì ¦8*ÎfU®øñã»‹K^ÐfJ²aþšç5	°tÕ¨»‚%1¼u±À"¢wÂ,‹ïÀ8¡
p¦Ä|ø‡xT­£ÍÏÙ1ßåóë°c úl5Ž¯ú§Ø ,÷Òýu}Þê¾LÊƒ8‚)’MÇ}I+².ÞˆêlËA›çÅË5`X
rîsVfÁ ©¶¢bWÛïcåÜÖ?àîd¯’Š µ.ê`ûÈÁ°Ë’ãƒ$HBŸÄ¸üñëì~ÚQ	6/÷!ü:Ò—´‰pŽ¨¹-aÛ!±¼^ÒtZ{7' WäP£ùªÙ(Mq«òW1†a{ñ+X`Sª-$^Š—Y~ŠÔz¿.+EŠXkx&ÊID-Oóü%4 ý<Qø"ç^í5}àðÒøuÅývî¹:¬Ñ‚*[Šì©R$æz¾k(tøT˜òsŠ¶ë´`øRðåMÝòh,êª4G_¥œ_!Ëg·ŒøéÇúïjŽ_|L±1ÕÙqýÚù½ah×ÅßÕñlPÄ³4•âæ÷åÍ“e±°°t.~Åp€=ÚzƒWQ:žËÈÈã3¬{<x½ŸCQPÞËIr\1J#’†:1æÀy5ÉD¿Ô†°u¼=¯•/Æ˜&/ÑÕ„°cØ?Å¢«þ}ŽvÒ%üVÑ*í·PÄ _ÕÞÈªn„oãUŸ¶7p‹Ìµrò«ßJëwíÝÊ×_°BdüzÛßRÒ©€¹Ãk•=|Ê¤–ÔCGê<‹jº%åE€üb¤w@MãÆîB÷ÁE\T/Ã£›…›‚æö­4a]Vü|—ªÿœ<Ý&Ù¢!ƒŠ	õF%‹¡Xj=Ö…EÕÃÇÆuŸr8…y‹Xð Eâ#báq†JÆ\;-i¾;ö¹¶¹}@†»‘ëçyç`çè0äèy0,äé9„w½]=Ã…=_ÏUË×‡W^ØÛs•ñöÄ!´º{:.ãï‰ðêpø6EÈãÓ¬r9—Ol!)'â­Ü:%œ’%kXaöõÆÑx˜:Eð%¹sŽ¸7QðºM²oL·¾QÈ§ðfä!À,(öøñ	plÀ¹&Q*¦$?6db4geæ/ñB2\wîÎ#±›Ì"ýDº=VgiŒZêÂæ8NcürpúÃ~½½¢G[0¬±ÇŽ#ªRÑI”dƒŒÒW i`Û	µºZNšˆßoý€0@]DSq8Mª‰ÝÚöXNâ„'ªš§côC¡Á#„ËÃ<{ŸQÃûIör?ÊP9‹K[Å\ØOA¥ÛŠfQ:N°ð^š¼J"Ø²åÝ¤mN&Óh–I9Jór^Ä²«4ûQñ²\`ªÅùÒÞ]Þ—´eZÜ/5ãwÝ­^‘L´l®=Ç×ÎoÎÛbì¨\¿6¿fÇs-ÉÝŠ›•Ÿœ·¥¹F`;«îÂm¸ûžkv>ìQ¾“2°‰ÚëjÚÁÖÍ†íuuáê6ô¥µ	‡]ÈÿÌe*ïÄ—åñ@{ïhÍŽóE}àC[Q&ò,=“v®¬L€>™‡ºhÕÎ®Wâô¤a‹3j„1­Á$*ŸäÒ§¶>õZTy¥H'´W™ï`ÅèõÁ•Æ?å¤†²ÔÉèR2„v×¸OÍÀç£xq1–…l¾‚b²XÖÞWäæ¶ÿûîWõ)Ñƒ¼:x‡•ù4æ4¥mdî€@¸š˜‘z`ÍwÈN	Ãv.N íŠtqãk<F1INÐ:š é÷'*›° Wp &p)ïäÙÒ ŒÙ[é¯µDlˆµ±?ý×nˆ^õ›±'¤^šeè
ˆ¶ÁÖ°ÇîVþÅj_B­ÏV¾BÀ= ÀˆY‘£a‚!p ®´JfiÐBª6„Æ_æs@î$ñŠQ¶.éYs¼‹;E² ¸… ðW—ð˜üówsíösýL£[SVÅ@b‘/©ÑÕ5Á>’w,­ºï#ë Èqž¦ù)jÊ»÷ãI›3ÝÇð¶]tÜm¿hVšÞ|Ðef¸ó}Œ+@	Îå…ïT½÷gx;¾ð¯µÓu /tì„~ƒ’ïˆ@¬}Èq‡‡ÚÓ1þ} ð/>æ†¾>æroÇÐBñhK4>£ž¢Æ9¢ßúŽè¿¸–ëOÀåô7èqzëâÞÇÒ 8F¯…šÿ"eÀƒ…ÌrÐRS .ã3<ÅKá¹UÑ4ø5+÷¹q;©%EÆ‹T6ËÅté¶%FîYRÝR@‰»øBë»Y—ìô+¦•ëlºYéFÑë¥8¬æã$—Æ4¶f`é¿X#­ —³ñ•ðûiðKì€x[ø—èìD„ÿE6âƒ¤‡Iv’ÆbÑ¨¶ô±·aØxT[™¦K4`#ß6ÎhÏòyv7k+ ’vÝíý§díºÜÖxàž[¸gxÞR‰;ó‚üîíîáŸGPc³M’W±*ƒú³töÃ@ðËÑól@Çw¥gÁ>,ñÙ‚c$µe8‡ÂJ."É)ÄËñ&Êµo§ça¹	"Z#ß¡N.Œ7ò4·\ƒ4^¯sÛ¹‚f•5çiÎò©NþºÖ(À­·Y7y’Ã¯[5ëÖuTê5nþNÑ(¦*»9¬1z»frg> /‰Å^{»0úeùek_F:T,c6¬—ñwyñ‡HH‹…‡Ñ´TÚŒ[iœ‹Ã<U›l*ÄY9‰Nñ÷ÌX6©7¥»d²ý_–Ì[¢Ö%³Î2ù•YwT/]§‚}¸d²y¼Š‹ižåÄ7Ñû(®Ü%Ôý²†ÞšÖÐ“¤A#Õ¹Ünºgð=Äç/–z‡´^bÚ#PÛ¢N/ÊÚ/5¤\jE~‰`}ëVÇo°_kØG°-†ö
úÕcÀF2J`ÇH—•Ì¨­£ÿ¦Zgâ÷ëÌP°¯›yïþÏþ^^ýýÊ›vjæìBñ‹6AAuBäŸg5XÈÅ}7‡¡eWÅO?þ÷ÿÿÿßh!~E°tvewøÀÚ‚Ë?Yï: øÂ«ß6ðùZ6°ÆœíCL+Å’ƒaE>ÅQùÖXàÿÍŒ	@Ö‰"þ%à»ü%¶ºþüüb«¿Àãµ0n‹[vëo|=ŽÓädR9á×ÕÝcÈ]†!Hj[A4í¯)ûûì’¡ØÞ„ë¾¿Ïv2 Æ£ü$£˜lôL¢€Ê|^•U$ƒ-É‘	ˆ¹P/ÓŠHî:Ê§ óU±Â]MŠ$M¹èQÈ&¸æÚûN Aæuh„*†EGhVA&·wdÝ8‹öTÇ~Ãº'Ð$xÖÌzàCêJ`ú$Oñ	âÒò÷Ù‘š›æ˜{ÅI”%?à·ôd_°!Æ%&Ün{(1
V-±Ä/‚áàDÜ½¨£Ä=¡ýýF‰mÑòmÃÄÑ]GNKÄ¥†9ÃÇÏ#–ü].½Fîn.‹rÿ-]"´p‰´9MÏi·D•[[¿#ˆ+Þc†&~
@¯£Ñuìù8ÍQ	¨£ÇÑØ"ÿàÊò—®äSc<@áñl’cš‰\”“üt„MÚÁçèÞc:.è‡	D_][·ÐAG¢ƒÄ«"*âW1ŒYÕcCÓWÐô°~×;6½_ï?8ÝÝ*¨-}Ÿ}Ÿ9”1&¢þ§ü_ß.H½ÑÕ´žfú¯(^½vu[ýò-âÕo©FP¼L¼úg¿Ä«„xõ¾$á—€uc9`ý‹^Ñ®£åÛAyk~Ù«s‹ƒd-1uín™Hž€¨¦ß¶ˆÏÆí›/º÷²¿Dî¿ãÈ}7à<ºßnøn‰Ýßz|x´÷Pl>Ù<¸+ì=ñâøÉqœ:Ía•§$¯‚k¢-ã ÃÓöf¸õ[V®cÛ”uu” ¡8Gš¬ƒ™=‚FÃ4þm“\àºÙrSüú³¯½`_-ç`xs«”S3È (º /Äˆ«:’3‰#<â³ÉJc[ÍròfgÌ1Æb µ­k‰Š›Âõ¸Žc×yZ$êÆ‘NX‘d[-½:’ÙÍ`ÀúLL‰-èºÀìíGKOW<63Óã\rÐD‘¦FT¨ÉÒ„GÏ4mÑ­Ô%Q¨“[#ãÔ&¬uÊä ÛÌF¼Aºñ¤‹nHSìb1¨ˆâ@ÈÇö:ÂÔ|º½}‰Y”@¨­ÿîÏ}™h Áuz›Q7¥š!ëëlƒmg)ÎOƒ-ð4PJÛÆ«ºù½¡ýÑ¨J^Å›jèX:©×Š‹tÈâ«à]0qe²¶„ñ<ˆ—;l«XUä³É#FQä3yü9wZeûB¥Q©1]…z.Bèô£îÄ·¨ŠÅQt‘|Ä´’d¡€;Ç»€PÐHodVªÍAôîxôŒpµ»&ƒ; ƒ7cFy–/×øfšñ\u¸hC;t ìÑá‚ýÐXJVBèÞŸ¡Lâ’
{dçf¨›÷é›vÉM2JšCƒÜ0#'Ëœ “7©ÇS2Põì ÉÂl*rL‹Ï?Èä(âj^dâM¡U3þ¡Ñ4úh×•fq}YƒâÜ=°óÙ²*i0cóÉ’é'DÈ‘Q½7t•Âr­±¨-=8S­çÉ±³ù¬qÚd‚gEŽvÂùôXlè.äUº 2¡§(ù¼bÙƒbBaß ~<¨v	º*¶&ñHÏà9ÐÃd„N0À†ÊÉ0ÇãZ<‰ejí™ðÐe–¨jÒFUªt'òL!4Ü>0ÿë`NÞñ>s^,g›+‚V¤y¯Ñ‚ Lb;C^<WCÊŠîoze d´X°º3LP¢-«0=bnÙ	l¥y•ß ¥4&5¥_òGJÔ"ù!Æ)±LÓô«P|Wåã¹ÔëÆ2kûë\õÞSÐW&µµ}“UÜª ì««´Ì!ìšÙcl©œy‡}N]Õƒ'è›¿Që‡•8Š_Ó‘lµÖç*Ëñ‘±‰Bç f-n¿ð•½F¦a~·ºÇ„ÐÏ6t ÏÉ˜»¤ iC(
dK0á°‚mŽw•³hã -ø³>ùÑÀ¦lÿt,'éßºðá€3Çpç/Ü®ÏÛVøÏôn]Cê2Gq_¾‹ÔÑ·~Ž©£ÂZÄe\y›«K\r­z}Ô}ÓÞÉÖ£%øþÁæÃ‡ßó¸Þ/¢éô,”Éõ„ÞöÎåÚVÜËæúùš™ÍUŽ#ÎÕã©Ÿ¯Éœ]F¯d64GÐ™¼,…ÏÏ*ûïÈÐÚ4]åé‚&cÏü$­ñ(©è’ÙW;R·öË»êß’^'O½b/¤§Lþ•ì”„‘yÌ\zß3ëgè®ŒŸjÝ¼œŸF¥qçºQ¬<MªÑÄ¾óØ;€FÇ!¼ëÑé¸­?ÝwŸã‡‚¦¿búnÖ°£oî’ëwÑ,ý»÷c¿ƒ¾í}r)Øw\¶ÞÝ}½/þ·‚Þó—Z·éÞ'rîÞ»|¼ÎóH±?ŒËL“¹ö–Kbgò¨~é—ÊÕ”vùaéâ"»ÁYæÀŒ`ð1º×ßýš¡w›[cÂƒè­Ó»¡xgÌf¥k\“±\ßf-Ùö 0›x¶É_‹‚ö™>ökqõjðé1‡Ûe)?µLú0÷ÛâªA$¹óQìÁ(:€T™^±à(ê•890•Q—­Œ{ƒíª|C>ðåžR&ê
…¦E÷‘žAMâ{ñ£lP3Tæœ1ÈÑçÍ¹ˆJñF<¥ÞôÎy¶Ži•†¾w¾þpÇ¨Bƒmý!/d.ÇÛ–ó‡Ï¥Nê0^³ÖÓèà‚ù`øLlˆH¬CáñÀ'à°…Rñž`¾mI7ÜTnÇ¯èÕÉP)7}WBùán±œOugø
¸QêÔË”¡±O[rgñÀQ46ÐŒ1êO)ÕcwÆH©â‡pFRmƒ4éG¥kMÔˆ]Ú½ölo.Á¼¡Ú…H?%nV?š$åwä&âÓOf;(÷…¸	ÃOtÎ‡ÙŠšèÎÑÿE­Kw
of85ŽªÓD¦fŸœz–;.9“ûSy²ð×¨çážuvTL2N|ÜîŒ¿îÞ¼)y]£B³Xó!Òÿ’Àe*°-ãÓ>Ždµ‘+w°"	ô,Hn­È±,ÔB%è¢{þ)\›ðdy@YÞI£ÑKÌVïœíFÃ8e¡æfW_¬Ò±Åök€Ç4NÏÄ¤>¨á!PÆ8rð“éÎ’td~Ízd}¬‡œ‡K©@¬Ó’²€pfm¹Êóíõ”9.u¬•è÷}¥ŽÅ ?í¤}ëì±=væ’&¾<Fk]hPKó2•k?YžÝ¼LªM‡øè|”ZÐçä¬~Â?tÔ-ÿ7ÓÓÒ?ö»RƒÆ³ÿ™°±%v£©°´ÙKV{9½]FgÅìKÈæÁË;.$“×Â73¨žÒøE$°î‰Þ.{›tÎA¹ëÏm‡ÝÉsh7.>HìûF ÓR¯‚f.WóX,7xXi´//’aë³@(0»šYågÔ™ÿ5é•;ë“Ûâ€]©¸kîÇû¸ˆ:Ö¢½"ZJ]’·pÛ–Eˆe²¹`C9é,eçjeçm3·rÉšþ^@P}´ …ì÷E´ÎœÍY|Í&šuåŠîeÔ³95ªµâXXÊ¯åó?þ‘-ôbRU³rýæÍyr#zÂ2@o”OoF³äæâöµ7q6ÊÇñãƒ­|:Ë³8«)/2áú¤ Ž2¾-=>åi^Ü>>>þ¤L~ˆoƒúÀx õD|{Ÿº¨1 Ž‹Ã¸ò) )¶ ›dÚ:®få™ríÏ‚¸Ìl™ž)û£p¯<5ÁlÉò×žVð"¸Ëø
“·É%–ý—lo-ÐóNé—/°Í¥-c !²‚žVÞËr³º€³G‡»ÆÛù‚„=<O•F¡W3ø=þõÜZÜ¤Vz‡j-ÕÙßµùÚ„O“åÊŠñõ\,Í£O•#(i_‡Öë½ël7yðfåÝ¨·	mzÙ5¢Šñ“D½é\üJ:I•œ£¤ŸML÷úkfì.Í$’,g¢’z5•åÅ§Ÿâà§Ÿ¾ FýxáQß?äI¶¸ð}¶àæ)R¹Ð|è‰Ø¬7Z¸¨7Ø°må3M›ªØxNjÔÃ7±‡gb 3Ã}xd!·8ïÂ‹¥
áZèöN\m2Tr	*[]ƒÕD;Ñ„\£¸d
Ñ%íz®¢Ücç¯:·	ßå{M é`˜•O³&UŸ|Ò3¿f›sì/Ù6k>»\2Í#
¿AiN6GÑ8žžQàiÇvrMJIÖl3´ÿða’JnøW“M“~.¸³ì›H3Ôé•Íñ8‘‰çÒ³eqj$ÄœäY^È%"³aêT˜JJÑáAu^Ë".Ag¥:Õ–™²»Ñ"Fñ¬°œãx”¢+5Ö§äpoéšÑ,¡Ú•|™çc%´ô†Öž×PÊþm™ÃI-âëü•lNÃwŸÀÏÃx•ÐïÄU~˜ÀŒ ðG¼S._~`Öüg’Ûòc™ßR‹ÿM^ËK¤³|#Å¯G:‹¥ë6Ó’63’Þë¥MwM ³UbeŽWUa´'ðŽ²Î_I’ºÎš¿™6¿"Èdæ¥À0d¤b0žë²RT¡)kÏD9‰Š:û¥•¾Ò§ï~Ø8ÿaÒX®ÝÒŠ½›ÈRdCOÖn5ášmv†Þ™+û6òþsWúòÄÍ:|H*ÒYsWÞß7©+éÍ÷y+›Ä•µ"þ—š°’Óu¬–³”n]õówM·úsŒ¦3^þ•)¼îý6ã]¤¶´tÀŸ_¢KR3à†ÚUñÏ5A&sHÛq§Õ–D×±oNG¾ÅŸ_>G?d'˜Ñ±ëh¢%§ãæÝ»bëÁæÁ‘Ø~¸¹³{(ŽöÄÎ£;{¿7¢z¡(ú ¢!`Œ	Ò¨¬–EtŒ‡Ú@±”ô˜æ'É¨6 h3Põ/E]/M[Êz9©¶¡°ÝôuÉí°o•Â$09úëGêtšöÇûw7¶5ô ›–-g6•€Öî€À.Ó¤P÷²_ÙH»ýƒ¼ê°UèÅ+&uuùŽ	‹(®é81y²6ùÂÜÝ˜wÖñ;KuÐ>lÒNû¦œ(šñó<ÊgêàûS•§qá¹:nQŽÿz< ——KÏÕ‘Ü™55mŸ@µ|`´œßš¦C_+ÕøWk§@µ“´;ÜðéÞñÍêÛ]Œ»Rð*ºÑ¥ÆÕâj9¸âÞsÒ=¯–‹f®|úiÓÔGVøé§®ÉJp›¡‘÷ñjXÿ˜ÒééWèüåPt}yŽv?ù“Üb|ÓÇÓî¹X¡Yßj›±ÕöÇp3z÷@BÂQÎG˜©ðª¾ø¢žèQM]ä±Ið[Öf¢ºÇËåc|"÷€KŽpOŒ?ïÖúg™«Æñq4O]«S‹?	FyÌðv¹³V>’”2túMÊŽ&Ð“­Ú.¢-¼'éd^Èw]XÁoIÒÔ…È¹™EÐÕ³ûi>ŒÒ?;¶år¬ qs·ô›ò¼ÉÝ&åG++‚­QBBY ï$ÿ%¹7ÉÒ(e= AvŸ±³éA„ú’ J£D§zD^å²ÍäM*ngé\èØ­ŽÓ™†@}Ç3?	'P·§yñ)’µaÊF’ìn»è’3ÈÇ$Gx‚TÊat$ÿoù—Îd—<§–Ê pWc %F¨›—öÒ-²ÓÝí{›wžîïíÜûîùþîæw»;‡G‡ª®òŽœ©:îÖ½ß‰@7ã}ò/wÆŠt‘S¦®8Ú%dn†,õÜßº’$«ù]û!¸Ý¤Ðö ðÚˆÅQíù»Ô bÿR§x¯aH@º¨AP=µ
(a˜2ßVŠjÊ¤M—_ùÃ´rh=Dãq<F”ä£ü”Ùö~¹“éuÅ•·§o„•9çÑƒ‡b -›}¸¾f£´ƒL“i‚&Ui(ÿ­Œ‹YVa1xÄ#ÄBUMÖÅê­P8üÂ	Ñãµ(µ.UD³Qô*ÁÌ$bõó`1Î²ö"Óø$š$bî\ÑÝå£—£4*ËdT¶—Â®îtrÅUžµ—Å’#9æÆUvI>¯VVÊöbCL]9ÍÇ1»ÅÒ¨Ø$™MòÙYL”¶­&E~ŠžàíÅfùl‚èA¡ðrMòj„JÅY{99Ù¿]éh$7Üè¸h·ZV6é*QdÃöÈ1a@í…F5Z†“çãaž—@å°`;²¡ŒÒ^ê% ¾½ÄhRÀ~ŸFUqœÍ€!ÑÒ„h	Ýqz\$ãË®‹ŽQwîÑä09‘;¯¥Ì	@íU2ŒËöb˜—•Z‚ÏÂ¸Š¹ã³*‰R ìIÜ^À[ÐeDíäŠ?KLj)÷*§F¸î5:.rØÊ²XK¯r3ðÔ8žäó'³ÊÆ-5½Mmé[¥µ_ì°Â«hÚ©‚¤€T†)rÞ“Ù è0^£ŠŠƒä:Ok6ŒŸQÐT“chƒ-³.v@ÇË’ê¬g¿ÈÇ]üõíz(¡œ"ÂœË.††úÓZëd8?Ù˜eSFÕv)ÝèËP(–kAëlô’Ùd…7ÿa«g 	&£$rØÿÈ}ØˆjKe„»y1mêtq®›Zk/Œ5Êíô.Òº›Û)h.Ež%£_5º`¼^ÛwâŸ´mŸ1
øVõ—à–â»Dô‹·îÓày­ãÃK¬áð>¦1|z‰Ö¶jèÏ¾~õÖóÿæ‹Åòñ%F½KB«×ž||‰övˆ®{íÉÇ—ho³æQ^›Í«·Ç*ÉA|\Ï{·¢¬&y<·ãÚ§Íg®d„Ô¥ÑX5¨òÝü4.¶¢2^\j¶96!¯‹ª‘f.ï‡ðŽ\Û!@TYC×¼ÕÖ‹{¹¬t»ïù8ü±J«C)è]£d=œNWæ&gÇJÛ£ºÑ–¾§î‡óg¸ª[Åtˆê»™p©=ÿÅÍ›â!È èM¨êŒC#;‰„’$‘žo~eú^{Ö«rí¶gÚX04ãºøŒóLÜ#œ‹øÏ*zc'¥z„žÙð§–ÖÜ-¬Á"‹èÔ[½¦‡ÓeÚ\\t[…Fvd*.j”ˆðâŽ3ØÄz.X•K£ æL"ìPA`Ôö·hœå:Ò‚*Ò	…4¤ÍFâÓ AéÙý8‹Üª˜6@m¿l&IüµS_’ª #ãx8¯žp¨$©
½ÿŽ½‘¥ÊîzhE0@xÜAÆ¤Ñ“#fJÓ‘mu¿ö¢ )m]|1‹´
oà“2P/eXB\(èdÉ?7}Kª|M	ýÉ²Û2»è;¥ËÑ¨šGé¡›QMÖ¢ÍÌfã;ïì›‘Ô…9†B6oz¥h„RÓ¼p…¯…«år*¢JBv[h“üó;{{ðïÃÇ»G;û»;Û„Y’“	žT¡ÿÆ$ùÜÏIæÓdëââõâ,J)ç¥Hd~"×¦arlÕ’ÈŽó4E)'©<[ÙL°NNáfÉÑ”áª-«À#ÂäBl]cbÌD¶ìgÿ1r©0½×ÃVÛ¢»#Ú¬î)Áè¶ØÝ¼³½{Ìî˜š¦¦¶—ÛñÆ€Zåó’°Ö œ
Õi@wT+ì³¸ª|ÍågI¢bxºœU)ðø‰’ÝÅ\ŠÈˆÁž)Ö´…º—[&`WÆ?óW}ùÚ`0Àü_Ô°s×šIÁ;ÓEX…ë”+æ©µºëƒ¬3Ài#6zL®o.{!öa´¿Fô|Í0”œ-¹VžÆ›ZÝ‰50eCëÁVlÒQ éöÀ&Ïò–£·ÂˆqC`3Ú,Ì•«÷n½yç˜ŽÖq´ò‚\ÃVá&|^'wƒfy™È()Zyôô÷ ¥ÔÖ/r¸z%BîÖ&±|;ëï°ÿ7g³ô6~Ì…óZ&Ñ3iÈ)·lÚÅaV¿ð½Ÿ¿kÓ ŸßNîÉûí#¶`Î+ÕŸ­ÕÝNÎãp¯ç|«Gt2~j ÖGï!™­ÿí®&BrÑŒ¦1«f:Ú4\’]ËË0ték?Ù+:Õ	'°¯sí¸§öÑi8²”¶Ãbn×¢°#V²³A?×»jgüZú/5¤¥¤×îÎQaÝ_kž± ?7G‚7VCGÍ(Ë±0£ê2›Ž‘$Y•€Œ½ˆ³åÔÍÀ¤'×rƒÙMO€¯ò©¹a«¤ÝØ(ºUñì8èKP³¶^Kã0ººN8Ë›Éö
ÆWÑŒ§n?˜oÎâ9uñp ~L¤×•áBjô/
_	ÊŸÄyHXw·xb,³®ý%À@b–ºssÏ†D;OÃ¯@.[j.®–M !°ä%Àu=SÕUÍ°\oú¡Ó:Ö[›EŽ‹|ê;&-5`5¦YÛbÄÅ¦ì”â©d”ÏmŒtŸ(;SX§Uqš ÿämÐÂ¤¡H5Ûb§©c=½úÅªà)ª}˜â×VÚüqÁÕg×-7ø sž²'â-¦˜uš¼Þ;>ôÌ^º7«ãÚçaæ\Ê_TðMyëµ¥XÕøó‹áa½­iÉÉ©÷rÉ{
ˆcõê'D½Åçê-~‡æ½ßT(¥±.B)“Ä®àbä6‡i{•}#7^©j@cJ(âÚ.ŸÃÚ£°È½ÔfÔ†¿ãÿÈËxZ8Jl¡ˆQ—˜Ž«.=ÐXkW¤Þ›Ãš ?CÍÒÜo´©…Ô#””šú!~4#6Ç†nï6˜f½è\1Å(Ûs²×I™©O¹¢=”3Ý‡QÐä'~Ü3ÑÃ×?qÏ’ozÜø¼Ã>Û)5*yØÌHP‰’i¸¢“]¾Ð,ªÞ¾›—t—£"™Ià¿Ð1—v¥ÁÔÞWjß-S f’Ñ…Ûµ6ãuP[ ×½mÃ Ü"“1 ˜|Ií^mîDÊ6häæòë©ø…#=LT)>}ô­Š*)(¹ª¿§©ºS“ÓÎÓÖ€NÔ—Ä2t‡éé)i«¶Î¥7rò«·ÛêÀ¬þ6›Jk–hù< Qí4Jïå…lQ©7!1$d&ÂÙ„N0!jd­uFþ2‹ºÎþë8Ì
C;Dv	›e‹ß™‡)àÓcTIn­Ùõœ—Væ+Y/+3/ØžëW»Ïú±Y‰byÌ^¶Œˆé¶·ô¦û”µ2á,Ÿ‹>D¯Žo“qœ—~-ã¥ÙÀ+|âï[÷)ÓçãC³“Ç‡L‘­(‹Æ‘YL>áZûÆjí¦y ™¥èSp³L¬Nñ7Wì¸HFvAzb¿<ÌQ•€Ae[Â…Mx>æÞØU%Š™ÝO‚EíNüfÅ"'ù°´¡¹­ÒË{&Cž¼—PBùzûùŒ±5)ø›#þ9Ð…Ð+å0x)£#PRn-€®|¡!myŸV-/£ˆA@Íè`rVM¦IàíæxžVá	ò¡.½×“ƒÙ¡tô ”yÐüvŠD³ƒl¨É_f‘¸ö)mPvÛ~f‘Kcñ$¹¬¦1B·xÙñ:U¬‡-£7«m³¯Bs±8€ÿœ¡: Æ)»“ß©®Y:›d÷º§Á°ê»	š"%^¢@‚œ.§"÷œçMãä8’´êp4‰ã±®Ä¼²Áb‰.{2£\»@cÕ—±´ß&ñé:ºú[õ)µ1n9yYî~÷hóáÎ–8zø÷â`{wóhgïÑáƒ}ñ‰¸¿wx_ö÷Ì„!o“eå2	Vzg­ŠØ4*ŽGýÕˆ¹/YpºNÊ{ñ4’]ë„‰3ÀrÀƒRž°—“øæ$.˜& ¾·þFû„Ìb™¸‚¾È‘I“¡øÃ<ô)ñ!Ž±šÄg2·j«L“dVZÓˆô­–Í{J@ì?vRûY}Wn9ÊGí„¤ýn³í*{`!ÓŽ ¶ÏTÆHeOÐÏÖy#ÝkÌ¼™Fìèñ‚­è+èÝ¥†ÒÖnüúRMÆ¯ÙÖ^&ã¦-úAÑµVI¿Ö,;Lãm\|7ó’S×vVÔòèC»éš÷ô·ðô7Ìñ•Ý»TË€ˆD@©Ò4zŽ9s=w$Ø~å4ÛMüú9h€ÙKÄßøÅV)âä$Kªø¹·Þ°ì½ÄÐ`úHž˜aÉü	’*,µV~>+â“,ÊªKWÐYêþp/¨>FÃ³¶ÞÝ‘8Íµv­vÐ+ô’±ª=mI¸Èv°ôÌƒ2züTÓ¶êäž^nep8¸C]æO#ëm`¹¶‘kÁŒ?Öx_\{5TrÑ£yìbKIìdUŽ¶µ¤{§™xc.Ýl,îðm€¦ñÍko˜4ƒr>”qÛ‹+Ë_,¹–yaùÖihX­dh’û¹ÖŽïŸ~ü—Û¿ßÚ}|¸óíö:­üÃ×KìûÚ›øõ #P³¸ ë”€æó“I%â)æ)«Dš#‹7J¨á•YvFøsã7Âó›ñë^0³(ÍG‚Ùÿóÿz€z\¥(r™íŠN9è]í§'¦Iu[gºíÂšˆ¶¯ çÍ†¶ÁÐ#”=w¢ÂÓ¨Ã"ú!ÎÒ3AƒDÇ›<Âhl$àfyEÖîá0ñ4.ŸAkâW ´]GøØ ñ'J$ô¨}dd¡sšOãìÀqÙÕ‡rUõ3#E8"öJþ{‰òßK ¯Î·êÀoIuÁv@~iMó<;¬“ð}µËb[CMÜ¨	™„VÈèˆ.Ã %ò×{à/±<ïzt„‡4}X3¶VBçéû9{ÂÖ4Ø7Ÿ¶úiµaLÚÖf8Âu’Á²¸ði5t5%}.–KûV[SJ©Í_UZS=Ñ‡usRú•“½YV_d·Ð‡K¬/ÿ*sÈö£»¤ŒïîÝßÙ"£‡ýþÉöö7»ß‰»;ßîlm‹ýƒ½ûÛ‡‡;{Ä'bw{ó›C£ª¬ù³µ—„Ïö±˜¼½1‚óARólQËÉa1ž°B«±—äHyî&¯òä£Ýø$JaÌ—U\¹Ù†ªD¶?¾•Ob”…È±Éy†Á…xx˜üÀ¹âÒÝrJÔÀmé³æ¶ë!ºQg RZÈ	`R©ðKºûYÞ¥î4ˆñŠQ&ç³úO_ÿ=Î>L“‘Ø¡Û÷¾¾-~³æÔC©ÕQYYtcC|	ëG5x›ÒoX&'ù8ÊÔ@öf:sôSf«¿x‚ò>jFÄ@þÎc8˜ìôoYÑWÖ«â°ŠÎÐ=Ý—úñŸÿùOÿÇ¿þÿÿß?±´¾8T÷ˆ”¹˜ÎG‘æ¯(ŠËïq<W×”@‡)!ÖP‚þ§ÿ·úÓþ/|ûòÖ’ö¾ãô¾Q>‡e(æ©~îuuUÀìi x‹ÙO?þÏÿ‘ï}5¦ñ8‰€¤Æc
iLc4!ú“ˆR”×N'H#H³Ê¢WÉ	zÆÐ¼ÅŸþóÿøÂë‰‘¡êE=B6`«à¨3…FŸ—Už/ bwiÄâs¶Åšíz˜×&@z…k9’ë£›]ßÒŒñ³ [ìÅ¨?W|Á·Ñ÷’F=¶‘ÖÌðe–)k”`2üûäicagj3ÎŠ|–—°Ã`wŒ0&¼’ÂcýŠ!V&qTG#ûº! T-¯-> ñüóñIÌê$Êz•öÌ5Ú/Ôò&Ý~Fa&Üe{—µ}†às¶j‹¬P¬qdëš=ÖÀ	IÃèbex1N‚Œ2 Ë¶¢¯~}G%%èüæ\Œ âž‰íQ—Çñ?Ìã¡RÆH[§¨o€*6ÅKHÝ,A(Ïä›€â	%·Ê…” Qk Î÷"ØA±ÂeöÜ¶ ØU{"O2‘³™Õ–žL¹gÇÆ»«øeºÆÒK]©‰æ‹?ý§ÿ¬Slí=®oXÖ
N"XÅCÚi!cµCá‡f&ÆR‰Ìe¾99=§%òã»È%CaE¤Íý²S7ê&»_6W­…‡Ó©ù×¶·jí(÷iñôj2DŠz¼Ê Ûî¿	•A¦A˜Ð FŽ™„qõ+€ñi‚7£íGgy¡Ê›Z+mNÑËÀ®%Ÿ6Vc%9˜zÏ»«[]û/Þ]3—ÿtÍ¬ÖB×ÚÛ3Ô'Á'gqkëòäË]ç+éª šXÕ K}¥êÛ$ƒ^Æÿ V/Ÿ¾PWÙÝóà%•µãåR/Ë"×‡1Žš-ð¸DrÓ}t€ÎpžjkSk¾†QYoœQ¶ãC	ðÓÀ?TB1ôZ-=û–K·àzâË|ºA‰d<‘¹½ÝßfÉ5p§ˆqÇ0‰FÑ¬ŒË%xÄ)ªºKü5äç’±b0Oš2‚`SV‹>+^
Öåå(díL«Iê_†*?¯c¬ÁÂXBÆòëè“Ò?Å¤q×qï%ÝÂjµñç²Ûÿàç­V÷g/ïÝ»·³µ³¹ëccM~|œŒ¼5[Ë¾c§ï^²í&ûþ¥tË_£‰Ÿnñö‹Æî+t•&~z	¸¼m$
'”IµC_/`F8âÏ|QÐù¿ëqw *ŠI¤Ö-/«ÀŒCïº)‘ôÞ¼ÐìæÕ+»xµMÐé£¯ù£Vç—¸´ZaôoåýÂ^ß¸ñyŸÜ[ ½ì+“O‰·V¥ˆ¤q\Ü¨íCU.)!laKªÊ”·.k¦ðG±ð‡³Îã7UzaI^¦§Þ,7/–kn4…Ú=¢ƒ7„V?)®BË1¶Õï¦fÀ(ã>Å]½,oÈUz°ÜèÏÚúÿ<ÜÉû”lmðYìç¢»ÞOWiVdH5çÖ5)±.Vòbõ«7D_EøG[Eîœ­Å)µfk!k-·4[›-%kÒÅv ¾.Û¬B½ƒ ß,Ï¸«¤ê,»Â\íšzÛÙÑz_øbÆëvíØA}z‹'—;	‰&:ÆÉÍt’¢®!¥†­eOÑ§b´ñ¬º"oEmÌSþ¶ðÃK3Ý²ÌgZnøòmŽE¾0ä¡Ë‹¬9w_æ`Ä?éh¸u˜k~}Øf€ÿ­
JÌú0z­Ž°ÅAŒ~¤cqãkeƒMÊrúÙEð,%N`àEû?uVG…»,l5Òü±M|âéPŸ*š*„ÄO†½-ëâµèqI T@„¬yÖ—¤½ƒ![FuašÕÇ†v)Z‡ýÌE#†4^Æ†fÉ÷$>¿i£§íâ6´´^ö³6ë™{¾”D¾HØ†æ[Ð8Õì]G.l¹€…ë²Ö-i 	Ñ¦NKgå@¹ëw!“Ô%H—0½­ñHB®ÇDùê=ŒHìaØÏW>kG›òF{±zƒn0=‰–ý“Ubð(¯I¯¥0ÉãÉ{è­ŽR{:š¶KKi«–Ì%µ/SÓgaSSQÍ{Øbd
›˜z˜z›—z—ú›–üEîìƒsÍ¼oçN×NÇ$;»qôÒôÙÜDaƒ¤ŒUºêZìF¸a³¦alæÄXÃ|ßÍö–åfÜ>qÌ\Q·¤%mYeƒ7åPÄíöÆäU"êÚÐö’Ü½!ug[ê:fçŽÕp×Õ#F7Œ¡ãµ¡”óŒ»èZ›ç’ãBÛb6AÀ³½pë$(ðTâri8kïnù\!:Ü€Ò½«BTczwmO4O´6ÄÂ½yšŠEéá½„Æ®¸265å·_SÙ…ß¡j'×Vn®­,ùQ–õ€””eÈ>Ý/®]{ƒoìM6ŠÒøPzi.ßœæ/°ëk+-ýI1Áœ¾/ ]úo;úvŒ‹o…áý§ÿB~ýÛw•åîÞÖã‡ÛŽ×ÅÝ¸Âû E~Ì…4jFÕÔ,#cý%Ö‰<CÓûU±¥µïkod8J„¥ã§zQð…%©Q=Ã@¤ÍÏãXÍ€÷eÃ¾è!Ÿô•PjïØÏÃ-uË(ÛKFùÇaïú4ª·«AÂXÌ†œq¡#·Í8¦n±£¾8Lîo?Ú>ØÜGO¶·ÿê–  µÒ™näs'#!w‚ÕÏ”oyê'ÅåcÕpd>Ñ _ÏòÙðË)eýÐ‰0fuÈ|Ÿ§Q‘Tg”Ññ+¦xáúL·t@—Ù«ÔKu½$~ôSÇzÎq9®>•T«ºü:*€HãwÊaØ™×€Îa—˜	¬nuð.öÊRëØ)ÓL1Žç¶]·OÊs KÏ6çð†Ë#§1”ð¢\ÞÊƒÁ<“\åµøä†ø&ž¡ÀËÀšxŠÑIÓ3Q%Ó9aÈKâÅƒ<‹Ë*=óµ_:çÈ§±À{¨eÞíeqv—–iÏTh3vld½u8GØY°£¦ØV(/¦Ø|†‚ówÒPÃ^[2^'B¿hTröDGS â¡vÔÅV0õ"¦?È"9	ïà6s7é‚<ªÄ|”q†ç?ÞBõ
r¨CÞ}Öwžnä¤ÞŽRÙ³ ¦~}P•œ½m×Þm¹¥§Ë“*xá)Y¿¦ã>•Ðtó1ø4Çèƒà*^L–˜_wÌŸ¨Á–ÕðàÐWx!a/«u„mÄ5ƒ h›ç/7ÄO?þËÿÔ9Gù<Ëdë˜  j‚–p`Ÿ€"ÅxÇµ”ê4Põ%(†ùœÙG2$®Œa1Æ½G…Iáð#ÜhÂF´)ˆ¯š“ùûî&FþýcxÇqÊï\e9d˜æƒ|p¡‘’ ¬OßçÓi\„W×§tBfÅÒKU$˜Ù$ËO7ÄfùÒˆ,’8~»MŠtÔ¯øèO½÷àš±¿|›=¸G0Ã0OÀ&‚"P5T¯†VfÆ³…¼œñßCÆa8ð•óbÑþ\]“4Å¸"eV”˜j°§; 6î<ºÏt¤°täy}Ä½Ä_è-^AÄâ05ZTÐˆ3å-Å ^‚ÖXœ5	6ùdr&ÆÈ¼¶‘``ì)ñQëö·Ûß=€9÷êa»þè4!^cS06à’§À‰|„iIWufø8™å59:#ë·‘2(%E¦áû÷Þ`ýÃ\&g“žx«k§ÇIŒ‚ÃÎ}ÝÒÁ¸ÈbL(†…4c†=N@¢2@	¨?Ø£¸	¡0Ö/@#|é;”Le0”9»N—ÎNãG/XŸÙzeã\\¨wßÂR0Š3J«-ŒhÁØÆ””ˆ÷µvu)Åc¨ZÇ®÷sËÐ»5£³î6$^ëG€©eŽ$¿;Ù‡0¼´ñUD'Q’	áÑÃ¿ghàp~Vª­uí–A_£¬Ä¿@nîÄ@+€r<€WaAŠåÝâ„Òw‹d„9Œäu°aÔÁv¾ËçbáŽ:É‘IŸNz d†œf’=îC/Nÿ" NßT£Té\…Ûä¬F&ÊTHïRây&7Þ"W
G[ÁQÂ
U}GQO¤u <vƒ¥`ÛcgÉš(":ºìçüÕ&º¡Î”‰ø5èÏeò*ßîì“«Ê´yƒnÁ 	3/ÂKINŠdàä	£yZÍ‹¸É‹0Œ¥D)ëbT6P˜èô"—´Û¥I¹ÐþÑmû=Hf®o9|íûN¢1Óôž
?@~izÜnd1§ÎBKÙ±*™„å¶˜g¤‰Æc“ž³‘­°>IEA7¢ðÜÊxÝl´h(5-ºÛ3`cn†’r[Ë[V–ñ"lÑ+€=wm±h²¹aK:C·™ïG>ðÓçò-¨KêÈàÓZ[¦þ1{ïL’8 TsUì†Ÿ®<«ï@
ŒÆ=¬	½ó1©vŸ²½Ü«}GÚ³Óš$z…šôs1`uö¶ûqÖž½íb¹Ûš³*ý-P°IÝfìÒ@Yšïz‹@±îƒ-Ò¤eŒÖ’J©h«×á–jî–jm5ØZ÷—jJž–uå ë:åâÒCiÞÔúojIëÖrN¤
Îç°
Ñ¶3å O‰¿š;‚ã¤Ä|#õ{ëa£œLAÙ4s[0ë‰˜”º{‚L2Ú/LGöž†è„Rò²Ê_Ö%ðÆ0rÌywÃá;`†‚Æïq lóÌ0êÖZ»5ýƒŒrÆ­t·°wqƒYïjËxÅtst„*ánêCMj3|ÐY=oú‡žFpCÓ—ÜO	§¢ÖÎvsrƒ1IŠw»¨Õš‚ã´årV:æ‰äM¤uHWŸ}föÌÞ^§<oPâ¶8‰ñ¦9ç¹ëÁ±·{Cs„½[Ž'›Q´f}oÛ8	÷ÛæÌ}²Å»ƒó=ÓŸ…ØÏrl?¿_DÓéÙ!FF•¥¡¸¹@0¦âVq¬(ƒÁ`±µ¸ŒaX¶«°ƒiÊÔ³<w&°9.4úÈ*ß>t§lpÜözúì¦zhWh¶[88ngìÀ‡“ý|<Š`_&Ó¹ôYQïP9ƒ½§Þë[†Í!Íô+9–º}»¦¼G,\]½¯Û0 *yUzö˜h„½}í¡¿(£ªj›»W’	z=ˆgI™c×‘A9ú¨R\òÑúmô[T†¨4º=§‚‘6u[• —g8ðxÆßàK½î¥c Lº<R]hº,å ˜*’bSpTÅ #Ë!ö4¥µÓúé’ö“]4eý²ø”µZ04B¬n»þ/Í²4#•ëÒËŒ¶4ëVQ–w	/šœìm‰R~¶rãË•¿A;ASKù	Ð\W™n;4Å‹hÿÐãY~º¸2ør¹^(9Ê»ñ(:ãFÒæÆˆ–¤Ÿö]9DuL^(†yÎÜt«n)™N°ÐN ]£5œOWa5¼l¢0ëËÏV™OfSD¯ÁÊŠÌ5ymüÅP•ëØ#0¼ºû¥'¶ÖJ­Þ‹D˜ã@Z9!ÇµŽ»K’’_×CÕ(ð^­y¼.w$}—µ`½P	oñŸMfyt“ÐXä0èz<Å‹‹å|ºC!©¾ÃPô\–ÅJWW˜ÏOíqRä§Õ„!0’æFdfƒq^üîh[ïþ©ç,Ïl·g9?´J¦&šrØÿ[MÂÙv‡,¡XYsýðäÇ‚Ê¯o×ø‘1­+Ð#¤`ÍFõ( ¬»Pbã
kLZ·‹+lÜµmNÒ—ë„ËNìÑþ–¨E”¦ æŒ”»14Žo¿ù")ÍF<Âñþ­
Ë¾Ã¤¶Æ·íYÛBQÆ³çÙlôüÚbë0£¥søeuÎÈ…Ÿ*©RŒ¬T ®½	ÉWx…GkSö=î›t˜ª‘A	ºåÖS:ÕÖ¼ˆdC­®öÒ7¾­!Cìi¿àA}IïhSñÖR“¨¤;˜×vù5Š4zü-¢“Ká§}ÇëO³óŸ6êµ^–¨÷ì"ÃkwÃž@n”mü€blägƒ2/ªÅÅhY‰{™í†ˆš_Kƒ2M€×QržJƒÙ¤‹´&˜žê2ãˆV™|[’i³2µÕþv+óö=ßdÕt5=¸DMyŒ“öqu&	y»&t:ù¢¾46Íeï´Qs+•Q ŸÏäCŸe‘«=’})gy:€À¼ØŽF“Å 4kˆŠ.Ö™4P=‡¦d©C0[FÇ±Ê‘ÒÓºƒè|}3à?$^°Ïeº<rØ ÀWq%Õ²J.Å7¼­*J‹8Ÿ	àL#ÔÄÑ§ ƒÿÇãXæ¯Aà:ºÞT~ÏËïë¥òúŠ¤#Ý8Aëiü&Ô'm3I`zHu»Ôý]ÂÊd:K1Ë=íŽue¹‚&wˆî(T±ÐsŠü(Ú!ES{tõxvhH°íLõ«Òøáôb5%¹”·Ië¡;DRNu4ÀAuYRÌIíìCèê	a²^À$3UXÇÍÝ]q´ópÛ]K¬)ýW±k„—ØZcÀõR·<0Ì=3¬3êlìÞÎ½Mñdï`÷®Øz¼£¸óø!^½½y¸mDQÁç,’^»°¿à/Ê6©.¶b*^‹­/Ä·Ã—eUé&µP9ïÎ[\ü[ÖU¸56¢ðÐÁj‰Ìo¤à¶,ô!9~KÓhXŠóž ø3MËhÞ#ÒßUI)OLð.÷Pè2ú=ìN¿}5\I¡rNÞ[ÉG×/ÄÄ( H–Z@)=uðÒ	¤&‘ZÄgê¡¡"ZV@Ý§¼T˜FCçaK™l…®2À»úåŠ6±Å^¿~üzbNB÷Ê¤¥ã?sîúžpëŠD½èœx½×Q#N­®øgòJ¬' È|b{h´l*…@ÐÖ`ž%ÿ0yw…:¼×¨÷sèWú>bÅQ2¥¸¹4OAR«è×·	ºöáW8§3X‡KU‹	hgX}þž·$Ð½ïòyA=}Ü,b±—Qã÷SÕôc€r>›á™ìÓvk¾H€5{ÓÞ%%°vãs;F÷Ãé~Xýöxía6—>…aÀ†ƒàÒ5Ô~JG—Ô[@©^«‹„ÖöÀo >çŒÊý+ÀµB)“z;i]~OE(fJø¹5GÇTëê]Ñ€ÑÅ5cYoXŒW¦ŸrM= ~Ôà÷‹'E7ÊII*#•§³qôr_kø<É×þÅˆœK£ï-¶´^ˆÁ:¨}¾&…y×qf„×aÜËÒåèÚMö†x—Í Îª"Áà^?PÜ•š[ÕÐö“j4!÷‹’Ó€`*ñ¯wËéªšD™¸%áí3ã@ÃF¼´ûJ+¨yXHïÑóÁ¸S4WeZDr%@×ýü¤2ÆQ6èÐåÛ{† #	 AAW
]§œb°¼!–<qjÄd)¡’ë‚t›ÎA°îßÃ{¿c¯Èz³5šN´ydÝ´Mx¯¥AgÝ3ñ4z†1eq2 =Ë«äø…<”}:›âÃ$M‡yTŒäÕêÊ
•¾c?c
ß™‡x_âc€CqkÍ®å¼4ª›/È[idUæÓëQ>ÓØcöW?nªÃ¹ÙÃ–ñÀ *VÛrËnºO=àÞ§€²ò‰Ir­¢1Ì¡¥_Ëxi6ð
ŸxƒûÖ}êîñ¡ÙÅãC¯ÀV”EãÈ,$Ÿø-}cµôW`£hÍ2ôÀ+¶Y&VwøÛ/t\$#»=i
Î_*7iÅ¡äcëQ¨¨	¿ÇÜ³¢D%³ãI  Ýÿ¢©VDã$ß{Eñ<N‹ôê^^L#&Ð«ÇÅ0Ê¸:ûùŒ{¼5)¸Ç›#î)ìtþÅº{gì+”s$•óõA>zÉƒî„½M«à«(âxø9LÎªÉ4aßmI¯BS tÀVv¹µ&y«ªÜçšßV¡ƒhvuù«) båoËU#¦bÛö3ƒÔ$I»bÆÈLl}à=fÆéT°GmVÚf_ñs°¨¶ÿÜ£ y)Ê®ä÷-;™)ªòôú|Áp(b1˜Ë#ýKPg?R áÁë‚Ìîþ|ëñáÑÞÃç;7ïo.¬×²åâÎ=j#(½Ô²s–R^ì…“ÅÊ*,E˜¢hm.Œ8™B¾çuGœE7¾€3,åM›b¬Ý
šQº-HßÁ¦‘A Ú·Þœ{J @žf éäÑ8$È£Ì>ØÞÚ;¸ûüpïÑý³®ª	<¢pÔò4”ý¸Éø¼ú ª)°wšÅÅn4ŒÓV…³ÙjßtS-bbêRùÖö>ç
Daj³ŠÉ<ˆÔ¸sŸ/7K@›.§ÿþ=ÎÒ¤ê×ž†Û¥†TyoL]­[Ç†ýV‹Q¸p©Ëè8þó(Ex¹4ÂSÄÝàä[sÕ•¾cÖEUçz6Ÿãâ:n¨GôP£G‹FAÐ°í.×ê¹´tŽˆÞÔ²·
ydÿÄ-OoS›Í>‡õ@[Ø‰rbÅúGøh±e$ËjÇá!b‚!ÈgñðMäÊ[€…Ë²aíë¥$GIzV[gžÆHo©×[ñ 7˜ç¬NécÉ:óÌaQND‰¢9„]"=Í³¸®ýôDm²˜KÜTìIÖyjµ:Py¾Ô2?óFø1X•¦øyßÚ{xgçÑöóƒí‡;¿ÿ¸¬]%‰€µ'Û
ø[ß~o±Úx‚á¸·Ùå²|àÍ¦gBª.ƒKé5©cì¾—LÊsÕ|çBÈš`O“×qéwHö³zÑê¾©üÞ±†‡7<p„–JÚ«wÊ’›Q>â¾SÛÛe¬õëH6³/wí3ƒP±}ûÐ Tì@C^?Š+«„C5áí+#ãê·%%ßýz±™½‚wí²Hg<¿¾-ëÔ)Š“ÒWS˜~òE]àÕ•œ“˜@u¨uuçˆ&P]ƒ²®¦½ øâðëYóÌ®$ãÈe£jE1Ä^­A4{i YBò¶äˆ•ST•4Y½w6~Ÿ}uuñâ;kÉßZèÒ3ë³6}•n†ÙcŒt Z:(IÎÊã€—ñDb+õy ´jbõ™[èïTD¬–Õjü¶*áS»Šwº•9<7›q6ˆÝ w	r˜o6èl»ÁÚ¿“ð Ak³…îvÅfP]gW˜Õ›Md¶pîczãõ•û–œcæ®h8›N`¡q}±`PÉÝ„“¨\,(‰¬…9€Ð[“xôë$è"6›˜w2RÛNõeÔ¨¯Oz”gT(Æ@í—òÎ$€‹Ð'ÏQjy(ám@§ØÕššnH¹¤'j·$cKiöBt¯£­y5<eÐš¤
¯”yé•·XRâé”¹!M=^²¥¦yäÓ„ÅZ£3u~››ß—7O(¯e­?ÌÉ½¸Dê‚¬¸`w üõ÷ûtÁÎï½t‡×F‚vèó	ÌË¼3²¹¹3ÐýÝµ7z:çj3©T½
·÷eÎ&‹ÔãQ4G­¹Çi>›ÅcÌ¿÷ß¢ÇúL†â!¬&|Óùhbåÿìy)“y¢W&Œ5£nSµ;íÅª{Í±{†¦”>C«8w°q–ÏîÀâ¾‹Å«T3+wíƒp2/–&ˆäUªÅ_PÓ®½1÷û€|Îd®WkqéÄsp¡åú2póO¯åª¯Z»èz5W­]r½.¨Ò*ÝÔ”'ÌÉJÎ°î2¦ˆÌxÊ­'Ëõv_¶»UùQžùcÿóPv¶Ñ˜MºîóýÍ­o>¾º«¬¥´Ñ%ÐŒ‘G‹ˆ¤[ÚNw¼~Æ£d-2\µ~66XB€þ3µÓ(÷èçG{žëa6¾ûøŒy}lyŸ(Ù†"ðªúÂ	{±œkFÁg­æŒ£ÍS÷^¦þsÚsîÚìC²§uÞwóÑ¯Ë‰Š3ËINÝx„4ÊXÞ–Œå]\¸p§ÇÖ»3º}­¡ø^Š”ú*7­aZÕÉ'ïq‘®ûˆ/_Xã \ßë¢Ësum‰‚Æ1Á²¬`CñkXlxÀvô™†]¾°²Þ¡ìœcBS·Y&£ØX^«Q©$½KÞ¯cyðµ|²Äªº‡Ý´¸Ü²—Í
¡ýŒŸ~Ç„u{¡ÃB5š–’xY ZÖÐ`ƒ'„Ÿ´ÂÓ$[D/&ëÄß×Zé-Þó¶É3ÔÖ’s?
‰7®c8wðæÁ»;ßn?§ÈOÁÞI‰šH
°°wÝ¥‰Þe©\mÆæ%iöl^ª?†§©£Kcj^$|x}ÞÜÆ$Ìrâ.•³+û˜ÄõLm«¸»CTP?tR[û"î:ojØ„¯Ÿ…mdvÌá=2Œ¦c®DÃ/%E,îbü(…Ä™…¿›öÃ¹â7ÆÊð}ƒµÑ•=Ž3F-í~~6_ü‡q{™Râ<Í]êZf4"ÑB7«eõõ	šd;NÙE$ÇòÅŠº¥.aBâÄ'B›ÏÜƒ®÷Êz¶n Ábö¦O¾¯QâG{™¯·Z‘ðÓá—ß¼fÐ¡Å]¿ÅQ¿y<iÄ hú:M l‚Bê¹ìõ÷¿IáÂ
ŽùiN}ýbÙØnj€‹qö­½Í­Û»»›?3ÉêÑ‘Àª,É«OO­†™¿¼SCíG|º²6>¿Ž öf÷¸•ñp“-ÖIïøí$ågø~âÎK¥KªÛÅ‹‹êÚV˜vv$•á3jÓâýé÷’ißC¦½•G£Iœ¦Ñ÷K×n&Ëâúu¦qŽnH}Ó—æÿvSK/¬Tt²¼¸+ÁP}Þ¢œ}V›˜ÑxhŽ§Mæi•vÚäÅÄêYÎítôµîaÚ…ClaYr-°´_ÜªLénÏ}ÅŸoãþ·Ï|ajÍ’0‘gçÆàéÊ3|W›ÍsSå¢,î(éZ`#‚7o¢Ø5‹|/1XÕ.b,9ÔæËÛv"¶åC‡ªÓ³Gtle·çÇw;t“Â¯HªÒû“yc r*Ï±ê	yåñÁìXÝóÌù‹¯üŽ¶ôŠÞo³¸õhÜÃ€ü>Õ¶u@`¼çeÎs­9ÙÔ ÐÙŽa®¥´[îl•:[dÎ Ä”7ûímsoy2¨eÇÞÉ†9žq››5¡g2EªLêÀÇš3*A¤Ÿ‡·Ñ#–8R\*+¤Æzç
…]Š"EY´Ö*`Ñ”†ð!¹u,	ÂÏ{=”|1·í©™Uê§”BÑ-#×Þ8»ë|AÝø(oj# æ%Gêb†À†ë>Ä\­"?ÿ §˜·œÛÄÝSÌ‹ù¸çÞæ	)T—T¥.¦D9¼)ÄºECìü9¬("é\Ìv²¯®9²Å»±3'á£¬ýƒ½ßmo}Ô¨“`¨H‹Îb¬ZãF¨wNhBÔ^PF*,`¯ jg2Ö*‘œu‘W®¥Šhû#CK¶3Ÿ™ÊnÔå|´Á6.„r¨œ‹Ákä÷ß5¡Š»R
Œ‘jãèSã”Ì[8ö•éÍxnùPãÚÉF…Ôj­<Å<èbg~€’˜¥LþËØÜ3„ÂiyuÍ”ÒéÄ¯œF¶÷Û¸ÕÝ€[Úø|%Ø†¨ƒñˆ(ÑÀšÓ_Ö<áºÄ=m¤NGoX6×{ÑÊù4ýÔúF!®vüö4:à¡¨\ðœ6ž)¼UxmxKmJŒïe+1fÍY‘gùoÂK¹Qú:ï©¢¥õšÄ7'ÉÔÌ/´“Ò|²ÞÞD‰mÄ…£[qŸ€Eâ‘«€}`¯²F€Ã;’ÌÎT‹o×Þx<—·|¾awä9Êwþ)æ|éÍ+ê[ìÿ‚ÝÑªéïb‘ñŠÇî¦ƒe4¨º· ÏhyÙUTQ’–"êÊ›]ÉS/I\Ðr`r…ó¸«|AñºWÓ”îA?‰³9^–¬l“}áÝè‰ø‡ùø$ˆŸ~ü_þ‡Ÿ~ü×÷ÄØ3¦¸Í¢"úá‡d’W¹™äÜÙwá:O­’øiYîÎ®Ý3ûgƒy‘:û9ìFïÏßÆ9öKÃÃõ"Øý·ZJrK—ø.¼ò-áe›Ü€¤:æõ¥¤­§+†ïXËKÏJîÝ/UJƒ#H­H“ÊÕÌ:Š¼týçÛKóèÉß25ŒÆŠåµ·	Ó³ÏuMÓd¤/o”JGôÚMÈæ?/š >ûå
¦j»åTY²¬òõÁ9ä£0‘S€ï—Ÿ-Hðêžƒ|í4/^µ#ÇvklHÀP ÇKØÏñªaiµ ‹â'§•†õ€ÒÒ¥ô¶|$&I´·4´ù7ÏeÁ#iþÒõ#lòs1ò&?Æ®”poQëAý¸ƒQüø).ñãÓFùiñšè¦“_XÞüný^Ôruä§›hÞj"
¾\á¢òã¤‡göÒ½ˆ.Ì\}‡›éŒèKÂ‘Ì=Í–Û>§“3Lâio>Üx_B;¯Ùbb¯~H1K¯×l¿p?âã"ëÜ4pñU^]	0äwºÆ·~nk¼s}Šd€R¬‹r’^’ i/÷<ã%Ò/e&ë4?pMIáa%Ðä¥Öf.°î·V‡”ýþ ¹ÐºûvÇÛ^
^Ž‹rËãQ‡>…n¹…¸X»Ì3‡×ß¼)gÑilïó”BrúA•1œ»ew›¤ü¨~)_H†(o8A©G_0ÇPL³ Kó™8Ž@×–W&Ñ=R×ð/Q².Ÿf¥RãèmC¦Êüú6,ï-ï¦$å¸-—îÇY2/ûxTÖÞ¡w²Õ¦»*eŒAä‘¯=©§œSvSØžßÆErœÀ–ÜÁÛ5›I$qD—o×óñT ÂŒµ™—¯\y_9g˜œH€çÇâ]si3Ë‹âÖ"žáÈÑ´0*ðŠoÁ_hÆ…]×c¾óÄ¤[XŠŒabœŸ’&Ò³"•´ÊÓ8¢`Åa<…€ÞÊØµ+Wv1CE)^fù)®3t‚#G:ƒ×3±¹råNŒ»‰‘Z½#@r·¡	wØ‡ç†lre¹|;#<6]8á—0p¼XŸ5ËjõªrùÕUªoZŠ„ñ7MÊÍÑ(žQ Q 	´ÂÂt<wˆšã-jüÀ3¢ýÑ¶ÕMqtpøàú]9]BÉL< B q©t¶ª¯\ 
¥Bªª®Öw]¼2øyÉK`z¿YÓ7X1„b–FÌqª•/«å54©˜Ð!›Š„Ï'¨5Ùoí$<tW]afuèû‹wP*‹Vé0¨¨é•Õ[¨œÚÀž& DJÖn?.°Sº3l'{•(¥Ë¡AŒ“¸"qßå…š4ŒãLL 9t(ôpþÃ"*0pÉÓ4d¤^‰R9ø…UËj>Nr©fî²1¥³”.AÓ“b¥oÑ…rœÄ‘—a9(rÃÞ_,5»=ë h-ôª¦Xyã¢aQþj>ƒ~ÍêEµ|ºFÍs˜¹iªùkNojÒõ~7ŒÚþ[¥*Ê	{ÅF½K™56Ëº°P6¼Až€š "Ú	Æ¯¹;å;½ˆåzŒpuIU¸<q~ø–Uz'Œò)ZLèzbæit&™|d¢>m9@ñ	!<J•WÇZ„ÿ²ÜÏéieþ¼ðý
÷½X½Åš»½¿€æÁ–ò4Ô7÷ªtq3å%=‚6AGÛ,Šèì·ÞÀÄBR‹Høk˜W“…¯µÊªcÂÇ¨l=¦Vš'ÏÜaiïî==<ãœQƒn»›¤)¥OLM‹ò5ÊÝ“Y0ä|ƒ;×y¬OÌ½¡9NátRmÂÃ¶J6}ZŒ7—Lç(Ï0 8œ€Ä}XEñÎß%Óé™¸¥ižm¼°±M”U4 “Ó:F¥ì³);©JëyãUÉ›é˜©HÐØd©!ÒÎ‹¦ŒS|®@—¶¡¥‚ÂÏ’ê¢Ê…bÊl½úW¡ÑëÞË½3°“à’¦è¥’gñu´ø¤Ä¢a>¯®ªJ[‘§š‹¢d¦6Xpœ”£yYR!uúø–ˆHApu6g3 ßßÙœ,¢
ïŠKrÜ(Ù;Ý(8àÓ	Æþ“gLÇ&À~¡›"†™Uƒ·X¶ÍGwm6ÿžWÌPD[„4C<3I~#9[ŒA­¼ùWÏü}1)$(Xâß1á5V2Q2‰,Î	%~ÀG3BW:©ùÓºÏîGÌv	Æ•]Ì·†´ÒÈ)çÁÀmïŒØÊáR7:$Ù(ãrQÉcæ1Õ†rÁÅxß—»tÐ³•Og‰Ü¬èAáP²P·2))j ØùFUÝ	f¸P®­tVà¸‡5W,’ÿ¥\l~j—/_0Í‹"ÎªÍ!]ºT{~ÖnØúþ ã1š]ÙˆzÑ'ÙF¿è¹Å–=Šðø¿®ÖÄ—=ýo¢?lÞøû•ûs«]¿Ž¹ÕÉUÔÍŠŽÑÄ§˜>Ï1õõãÒ»ØI5!©†c§â:àœ^ÎúV>2ý¬í±øà©<²6ü±Ä]1À‹ð‡º‹ Ì¢ÐÐjáYƒ¡sJ$HNÉß\\ ³¸MfÖ©wÅ«º9èÝ;…Ž¼+–©ø3jÓŸ%ÀlÍÇó‹h<NÈö9<~íÂàü…UÙ®@ƒ*û”D ³M½LUõ %g€Rè¢Ê¿»¨^.™NíkKãdìæäí±ú±Ìå@\%¹¼I)	QódB¿Qä©¾CrÉ'ës}¶Ñ«þRba Kx2Û•¢LlœeUÁ·tœc¾u\U	 I³°²‹R-ÏdkŽçëÛâ3ïªvÊÏFyU=ŒË’®³ð…xqgï»­½£#qô`çP_JÑ¶x²ùèäFsØÖÈÎÅÍ­o®Š_©®½Ñú\üêÞÁö¶®+ŸÜ9Øytß|„µÅO?þïÿÌXg^ÜÝöŽÄáÑÁöæC9¶ÇŽvvíÃ€<:G{BõOÂðÛŠÐöl'qzŠ·i‰è¸"¯ cAÎe€ê¨ÎH‡1VX–Þ¸*6ïîí>>ÚÞýç:xçC~”»c¸-þ~û`OAõPÜ;Ø{(¾%°œŽÝkp],4(O	?ÝaèŽ‰ÄÚC¯ieãíR“zøt:BâÎ¦6ÿÆ)ÿä%Ÿvk
vþÂ·`d¨pÊ›Þˆ6>Ü»Ú•Ã¼¿€‡Ó*ç!§ÕÇûEûQ|¶Æ·ÒíñÛ†¿º¶Õ!?~bšž6y…> ŸµSÀ 0Ž@EU'Nk6ùé#&œ””0æ$M­ýüÓÿò²´©5å(«ùñ1ù:åóÊivcCÐ¡ÎqÙ^œhe‚vÿ=°¿O£3öÉü¬Q78êšøÀà£!¨ŒÕUñ8µ"‰_adöó¯\?O&qK¿-k´WÉA»îZfR“§\èú?&ð‹L¦þ×NJa­Õ/tâýÒ‰ÏM/ÄË“‰•w+üt“‰Ïk—©/Þ+•àO2|;ÂÏ:r¶G¬k5pÂTUì­¶“Ø/V¤'qõ 
lÒÔôì»:!¯¿¶Û×pÇ6$ƒt©ÑS,-uÎœøØ]9C5ý-Ú‘Y?¦½Éˆ` ?ô¯Šä»{÷ùÁö·;ÛOŒPZõ¨ÉWÀfÀÄG8(¨¡3Õ¡,ÔÁ¢&¦Vƒx›JPZ:2B@<¹“K'R<Õü¯   ÿÿì}ÛrÛH²à»¿æxFb·LKr«ÛÍ·‚¢h›§%R‡¤l÷x½DB"Æ$Á@Éj#öaàlìÃÙØ‡‰Ø}ÛóûKó	[™UÔ )Ù’ÜFt´E î•÷ÊÊL­fRÆÛLø–ÞM6• '„° •¨vA4—g•-QuQïP
÷m'w,…|mj?T$íÈØÎ¦FŒ-é60.,<öHLhvåŠ˜‰½7ÅdbæÈ^Àw‰«úÊ½a‰Þi[«n«ÅÊë¦b¢
ƒÉ
:…#EÂ´?`5j	•¨.<²Éž¬H7Ÿ”»Yä7Y-™ÐðØØébòØØ}Íñ–Zy'lÔÜ@¸C¡!W‡M|'BNeNT0“Ø§õ)-Ñh}:ìEi½1àÒ¼Áõ^èQ†ð­³3z/HØY@½×ÍÝFû.DÐÃdÝ”¹FBÍþ±)ËýxLî`ðÌ;îöûé¼¥=pÌÍoi#¿¥×~óóÂ¬†ì·î9i¹ÓÂ=ò¾N]ÎYžwEV¢¯×èçì %ŸW¸+ˆrÝÃýfïh¿÷úN¢!¯ALï/g  “à»Iù¿ÿÝYŸÑ‹ Œ‡—+r'
cUÈ›:ôÜóËBÝŸn=ç¯…vÈ·Mø–†¬Hâè’ŽÞîwÍB«æ\™'¬QF5Jv¢å“¨ƒìDrlU}šl‰Ê2HšÎÇ22}1´#3e<÷¸,/MC+}iâu›È½ÎÞ#lÔ„öÈÈ¼§0ˆ®#þ¹„øEqþ\íøü5µ"‘öø4þ•b3ÊÂêóû†Õ¥ÈD<¦pks [Ç~£SuûðëÇÞX¦o³Ó&óT#eF–j[«)|¬Š§íE[LÛÄjÒ¥Áäü­Ôacœ.‰`ŠBõòã2Éá˜>K4&!‚«^Õç&`{é¯Ÿ”X9>NXñ$˜Ì"LÈ>è`z/d}të+]·P2ù`&»Ô£Ë~n³„<|Ê&¨Ð;#OX'ð¢ñ±?ša8+>=õ=8Q¬¼'î„£ãGW¦bsç˜ ßÊŠÚ-.ÖžV%ãê/À,Ç¥GWñ¼t\®ü5 ¤ieÍYýÄs›ú0 RëM8Âû¡{îá-8îï£ŽŒ¼·G)pð’^†%–°Y‰œ•Äs–Æ+]A—[¶As/Y{¶Ö&çÛs"pÀu˜8X<õ\B:=ºÚôB«jÖ²P+Ñ
nÚ|B)ðšËéY\-ã´¯›UÕ„»Û†à[…N›’p*¿.vÌÄ/å?Uj¸‘ÿÌ‚+ë`I#8q¡‡zÈÒs£Ôø¼<’B«	\PÝåµ?¹$_8H?ÔwoÝ(òâØ[)ß-’õb»ãN Ú]ßƒ»—6ÚYã½ŸÄBÓÈ­ãìS1„Êâ8û£ådøZáoeï…ìo×èW‰8YHW¹/ì5-ß®!¨ØŽQéQkzLZ,rA¢ÓèöÚõ_îŠÁT«}X™BâBÑS˜±t
“ÈÛªî!k	x"3†L¯AÿC•ÔÂ?P+ÕÜ1¡&±âÙŸ\ÖL ö÷¬âv,\‡»pdƒ°utÐiÖ_„	p5}¸¸­Á·xüwß@èæ ûªy yz¿\ˆ†>úî"WTJŠ¿Ñiì·_7nŸÝÜ‡¥Öà’]ÈQH < mˆ
œÔf48½¾Íœas·U;è¾j÷Žvj­V£óus½MŠÐYÏ3‡ó—ÜIøå©¢ôÀR¥Ê	¾>GÔádá\¹þº»ù8ÚƒÐ3oÆòøõ²SÛßÿõëúg¯ÿYèŽÇ—7°ö†hïí6ZG/÷Ú;koÃXÄ‚¯¬p0x0Š]Äõ%nwëµÎWw2A<ˆúnxÓÔå×öaïðàú_ûË`Ïl€Ïí›°ÛØkô ðÞQc¿ÖÜë~Ý ËðÛËµök_Žš­öÛ£N£¶ûu³×XOñÕ1äªÚÕ)H¤_UEO¡8//£pôj¿4ŽvÛoZGÝvëå×m´l#ó 3úÿÑÌÊ>E•ƒº*…Ñxª½ãSA€íOÔs?x“ÝàbbN¨É‹™“‘ZcéR,¯¨9,îù^ÁÒy¹˜åV
–†±îº—E:Ï-¦^Ý@W”ë«ô;‡ hÔ¹uS"¼P{õŸU sµyÒ@2ÓÒÈ‰ÙPVZ½ÓØo7öoQEöX­íÔP±áÐRðÒG"d „ _Q—h(DÇcavÑ’í"¯áL8b¶¦,Ç„iÙwwî8ýÍXÆâ™Þùó™þHÜáÁ^»¶{ÔkÑHÍûMè¾TZôˆ"L&Ð* ìm¯Ûktî=Ÿý
~¼Â§¦áƒ+v†ÔQ…}sû-ôËQ†À¾ãWc,9á}›MC_æo)@eNIæVS™Ú-ÈÉ,&×ýDá/‡¯+ÎÚà¾Êµ…ibzhySúUÂ•ÿ´[ö›½ÃV£{û~Vwš¼|F13žM¼èÀèþœð ä§Š^ûåË½ÆQíà€üÿ°Û¬5ÞÔZ»Ý£zûõ×£ŸkømÜa~„JM§#c=4>N]BDup× Ç› ),LÍ‹Þøoô$©µšû„¶|ç®Œ› LmâÁ%æ0i0ã*>ðà±›DpºÝF«×¬íÝ¾Ë§!öWÏûê5"¿¹¥íÁ¿¾èÓ„,Œu¥Ã2c<wNQ%Ó{.-Ÿ5z[úVå1¼`Õ±d©¤E	´\BOÀ(\K´“÷WÕÆjªêê;8H½:™Ž8¸ÏS±V‡ÏÇ®B–­ƒæ…#»<@˜Q²+á-£GW™G²0Uæ×º¶ÈÞA!
/ÂÏ>igœ­Ì+Çå¬ÌÜŽšÜVMÙF„r¹ù5ÄS‰­tzÍnïˆp›^³õò«„³SÛ9«£Àà‰Bßk¸g)&‘­u[çpÑîE š*Ç²yÝ'å,ýó²Ð…¬‹Æà—"C 3Æ€lƒ`÷ß1ìƒ‰ÍNåïyR‹[†¥ôºþ±Ài"þìÕ~Ý#xû|4¡YîŽ¦„œ¿“.’Â5Òcw<=ztÉÊ$¸X-Ïy’t~e±]Ì"²úôûr%šÐœ"«›kÎRºt¤¤Ú.â[¡ôP·ŽNÎ§sâÎ<àw1ö%-ÜŸ…n„ÆâÂ7T…ËâÐ@pÁtEìüÐ,”!ý†­üáÇ§ý­ÓÁŠ8†(ÆV±QþœVc)õ.ô=½Œ(ôz |ÖÈ<¯RŠ	—H4¨Mò~$‹KöŒCåÆÕÀ„uzÏhz2úªóNÀ¼ä©-Á2~pÎ{w0ÿ÷·ÉÚŒ©l>µÊæS‹~ÈéYVÏ–¡§&A˜ß*Vé ÆÃ®²¨&Þ:¹šœ=ˆTÔÔQå]°»„ú*@ºìM¤ázE©ÿ¢3L)¾iŽÅxÅ¢ó™„qª0™;çGï5GYû)ªMo@1âÎà_Éó%Ïì¾%£ÐSËÕJ/c§O|œïÀÑrá5ÉÔÔê6K&_ÄæƒsK­ß;W“[9$Pœª?Ç‘®Ö^HÃiˆ@ÿÕU\mõrïöjÞÑA§½ßî5Û­Û'SWNzXã?Ó²wšŠØ]’©a¢ÖÑe]óvIJè¡ÓOki±eÈz­UoìÝM¿Ó)n†q#l±rD^_Í;µÜÙî^£ÞÓóuM×3IýšÆ	V¥èŒÆu&£ùNê1˜ßÁA£ó¢ÝÙ?zÙ¼%ÿYÖ8=óÏên4ÔhN…u(÷QëB3ÎpÁßŠÂPR²éò?ª£†¤ÇËiv¯¶ÓØë²±ôÂÞˆKI3#êŸ¤ä¹Á·²	sašßú½Q‘ÒA$µ’)ô’ÚS/Ž/Ke©úzeC¬žgñÚXs6>ÓêmëIH@‰}/¤ÍìûƒÇCÿlXRƒìš
î¹åzÁ´$Åy¸ßeL3m:U'*¥ÉH!‹ÿõMZ<-¸Ln–*÷5o–ÎÜ±Wº”ÓÆ¿å+ ÿ4‘í4Jv}xŠ¸§îÙ"õOƒØóøèJC4R%‘…U	Z	ù§WÖu±»tçªöáè¢c©îNÜ[2Ê•¥Ã_,ö\¢5;µ±ú}[åZä[?òzÊ7Ý<óNÓšÎX2˜ì{m/~§Ë–³L0JUç
Œ{áiŽ½ÁKÿ¡‚£khEeæËÖQ½Ýêujõ[2nÉMŒF”¯¢ã.Ú„_¯¼}òW"£TÎÝÑŒ(»É­´°\9¹ñ>¨ÑäÁÜ´I;P³_¥rAnºÎç5‘ Ô¶:‚Â@Ò@uQ!B^K\˜Æht€¼Š®zT›^Bœ|Íf¤D²O:pÙn	Æ"¹§Á¹;ÁPÅiö
`zÁ ôta‰´E»Õ%,Êx#àÞ’É„É¯t²o¡€’’@(ü>«+ÀÖa†ë0mBY](,IøUµõ˜vÑ¦	0¢,Ê!{e*Y(inÏ¹+ÉõPÎ,òÐ…dí§~ß'°téDþô]BúA8pž;ÂlÍÎ£+*ZaµŠÓf!D€ŽÜKÇWÀÝj<Åþcêkõ*J2eÂ9]€Š{NVO1ŸåÇeÃ2«¼½`Ê^—Y®] UošÑ{KÏÕ;píYzç·–æñÓI‹Œè€dB?vb˜ˆvFnÿó½ÁÎ%S£‰Ñ›YDÃ¥SØ6Z»Ÿ†W^7È,k5Òc2šßV×lErbÝÜÌä²ø¡—‡šb+ö<MU%øp~Èãà›qîÀ´DXÄ¹tÞslOºsswbþˆÒ4²¦ÎJ?¯–-óËÑ=vàg*ŠSØ¶’$¦ÇMeÉ``iRªªz†M˜ï iÒ(î¼¢á‡2žaˆµDÓ5÷@¥U‚%f-Q2lið’ÜºÚ’`2ÝÔÓ–@i¦IÚÝÔKZ] ÉÐ…9xŸ,Ô³ÌÔ˜=©°È¥]&¤OÉ“"&HÝÊ–›ZVbˆ¼É .¼¤ húÞ$ë@d
,¤HÑevòµã¹á€€·ó+œ]oJ&0=¥ÂI0 ¼äø•ïp1„ÍŠk¼ñVÎ=0îá""’È%47àÍ9§a0vÀñšŽÙ©E 59PÈ==oL„œ5"‹ ]	NG®@¥rãÖòF­Âû2•zN<oBZÌ@ê£cgn¿ñè+¼˜…¤«p„È¾Ã°`¾G‘ú@Ðî¡‡.<6zãàœ·ñÓ3²¤á¹™3&D¸òÏü˜ÈWÄ4%'Dúƒ W4„ÁàLO<Hö5¡ƒ;á2ÀÆ¸çAåË¢Ùqq¡$¦1ÜLyE
éÍ(¼˜d	Î^ù0]ïd)fÕÀlXY–laÍŒº`ñ^ïµêLf£‘ Ü¢è%,Üª|ë U]ßšˆ’!…Ê0ì—åÏÖôp=Õ§Œ—æ¹â>™¢§øZ"p:apéŽâËžmÀ{‹Hš`-‰²”û'Oœ„D3ÿ(JAt‘¨IPë#¦Œ†
nÍ(â’ÿÙq¸€,UæÈ—Ô²ïÒ^Þ«^¸TûjMûÀUAÒ]jV„¯,ûˆ²TÜ†O!­€¼	_¯®N+MR	„­¯$ÐÉMýü\ÎG¦ãM¼³ öÁ¤v–k’ßI-¼WÒÄÙŠŠ( 1#R‰.¦ÄMRÔ–YŸQ-!F¦"ô(Üè¦iÝ®Ô	è›HÙô(âÊ°$:Ÿ.À¥a—ª	
ÜÕéŸ{“™÷’€EÔM1¡z§Þ„:ïèã³ïò\ÏYdÁÚe¤bä–‘¦çêÉ½ˆ›‰±Jª#aìsq æ4±E9bFÜuú’åTÂ7î	Kc§ÖÈÕ^tÚû¿c¾VÐò¥;Àx¨†G& (x°zä­Î[$(õ6R`-% ƒ0˜N½A‰ð]6²¬tÆ¤nBÃõ]$wÚÄW€ºà´¥í6{GÝÃýf·Ûl·ŽàBÌmz1™öº;;ûQnB²ýwRø*¸i*`nR’T¶¥ûfÑJ˜2Ù~)mM¼‹]¼µ•‘ˆ÷ ØÔ®öd™ãN ¸Þ§Ñ¾$·9}ùßIß•ÊB˜<;ŒÐ/\Æ(ÿ²l'ÜÒh•ª,0Î +à¢~1EøhóÙÁÙ3=¹“’2\æ(GÇÆyC7
®itLû4GÜÏwvŸóB…U)£ù ŒWZ¿"iTÏÒQO2
o¼É÷æ£þ¹x{·g’Óºƒ9‰c|vÏÏþ•Eu|.d3y(Yýö ³SF‘°ˆIjvZ@Zah¢š”®¨wB0cz„QÍÆkD«4\o,¦[½í|tâ|KÍøÛbdÌu©ø|lOÄ9jÃfB3©»¡ï¡tÑtÌe)btá4ÌÍÉi@-úº+‡4ñEÎÅDB'-zœÊ«:È*R÷ä´”¼G†^*I.æ=¿Z¸é+· ñ’†ÓA¥†¾,ùýªÜC‹GCmOâ L÷mõu¢nhîG}ZiÝ³ËQæmZe½–6vùˆøKH§š‡²Žc?\M+*ž2Ž¥mpTvøáQ\ráÉ—§þ¾œzâ(’j)I¢ß§ÉßK5ð9)‘!m’mT6·dˆƒÛ™Î¼¸ÐÄ`ZÂ‰´‰.S/òºpß˜§bõ¯RNSaŒ2¿(”+§{
ê9ýzÛ•±g[‘vL"2Õö>¨³L¸âÅN3•6Þ3ÎÀN2·³Ž2Õ©ùÑ?Œ¸¨Bæ&šU’cuÙ¤’œ«‹æ”Ÿ”fk}¸¬º“³Çû*Kƒ?'g€LèkfüÂ{ø9m_ê†û˜p{ˆæf¢Ùà·”9“ÞÃ%ï3z¥‹òÞŠ‰`ž³	'Ð mWØ×ˆâE4ôž½0£D†zQT"°]Â!•~ÒÛ¦; éø»ýâ®h¤ÉÒ¤ÕídÿŽœGWâ¼æêñð6óV»ðG#gàÌðDtŒñY¢€HfW3¥|»¨·Ù3îòõT÷ø*äo¶ÉØÒêç{œQ?³¤úB.gâþ&Þ…6†þi¼*lµ(z©t¶$Ê È|$¿¥W€¯ÕÌâñÐ»|BþGkô^5~E˜ì’ºen#H”#ÄÐ[tðA&„J:Þ`àÇ6ª
_UÒ (Eì18å:	ÇQ>fö^£¬Nòä¼:´=5ŸbsºaM’²7Êˆƒþdæ‰%#1â]ÒÜ{Šp{óRÌ©X_ª%–ÖH“øù¨BcÔ$ä$„[ÒÕdðŸÄmÅç%VÔÚiICe>¼ Äi^DxZúÖAÀP÷„öæ…n(r+õÀ§lBû©;Á²Îs­ö»õ÷ª”JëÉPCk­¼±P¸1Fã­ÍmÚ›SÚÓÈ”.ûdAl›RFDVéÈí÷7J¦r)?jî;Ý¶Óx[oö»Î‹v‡°"tCc%F5wj½†Ó{Õì:{íö/Pk§¶»»ëüóÿþÿüÇÿ?Ç¦Žcâ[f*’Ï’28
}
ñ%»5}ò™ÓS™7™Év?Rîèó	a ¡  àòC¦ü!"Ðé=wŠ[Êý>!BÎi‰àÐtê·|wGŽëE„“Ä~?ÚV æÄ‹IÏäç,H;^ßù0†~Ègþ9ˆ…“€¼ •² 'EÜå`g+Ý±¥!g#…œå g#õ£¿AÀaÎ¾„jc$§ç6V@„íÁ
Äs…?X!èºšË: ’ð«ê¬DbÖ7¤™>!<›…ëd5”Š,-Üúp'@ÑÀ-‘À¯VÖÐëéÑ_Î¹S’@º”	¥"GXN±{Ó!×¾éSXÓ±,®Â/E< ’%ÊÂ°RS©²ŒÁ±5’,í¸Ü§V¨E(×E½AÃl®¬ðÈ @>Ùb þ•5'öÇ^í, ï6†ägx+íý—èÁ
žö„í¥£põð¡óB){@^OÜþ‡‡¤ÞlzÄ ßm­«7#‹uÂ7“F¶)¬GFåS™È<Q&#wâUœ:`Bì\¸~\‡ôts]ò"mÄ<½žKE>á¦ô‡Õ/Ü˜°¬0cgŽß/qùSµt¬¹“ÜR $ÁIFÞ.£oÛÇÂ²¤Z~§"wpªÀ²KFF%€á"§L¹¨K>A
#Œ¹¼kßÜµO¶„Ç‡?þ˜…"ÿ2# “²‘m§IÀo.édèe:‚;24^gÙûn4sG9+¿‡²O{ØZš…AÎøç8""ñÀ.0¶1 6qˆ›yK/’@s»g÷0îî‚Œ»)1înÊ¸»Æ-«ûVÖ]móÅ/Õfq°<Œ7©±íd;J“àÂPc¿{Ñit_9µV«}Øª7ö­Þ{›Ñì±"Œ®2®îžÍËOiD›ÉÉ66 )ƒÓtÒ¬ºðº˜àìúQE!IÞC­¿br˜¸EfíS$­Ãª‚¸\uþ6[Öv‹É0jçÄ®#_<P†©CÄ`–#¢Â½ãŒ]Â½€í°;¸t‚Eº™›Éå8HÐt7ÙÙ›³SYÏƒÉz•usÒb&(ÙÖõm]¸sxMÅ_² u–M– ÚC÷aœZuó&Ü¸ñÇãY%ÌÎcÔ=µ|Q(jý‚ÇbÃ™‹V°¼ÝÌ3ŠÁ#ÆòÚSÅ]u–yö2Ø	¼ø4"ô&ŽÝþ²|VˆmÌ‰7
.TµÏh^ÃaÞú¸"NçÉ4À¥[/ár4˜ÑÒf$»\^CÔLwîË]^S›…;4ôXHÆ}+®#h´ñ±Y;Î#ßÖÏØûà¹›<7b÷ƒ'O'†Ç`Æç3ÀJ¶-ž»mÄÙ±	Âsm» <7a„çFìƒð\À4[a1†i5.Êo—²$Âó0#ËªÈÖî,‹8§bÖExnÂÂÏÍXá¹!K#<E_ycœÌ–G\À|ë#<v!Ëˆ;fªÁž;j˜,:´Ïgœ„GÛ+ÁH¹(½úûvWl—EÇ{;öË¬ýä[ô¹í™…AçÖlšæíÈ8™tÏ6Tsç2ÂÆBÖOx
Z@áYøð2×
Ok(-ö‰-¢l°ŠæíÏÂFRx®i(¥³¸yc)î?ó¶¼I[‹1{£jg°XW…¹fYXáQÏeù¿’}_öÒhÒ,˜`ËUgO.dŒ5;1Ý²…½R¦¦ÁÙ‰æÝÆ¯VG„¯f#o asDìÌm¹š\7S
šn¬êï,µºX-M$[Ÿk†ø€ªø#£\wŠ¯ Rn8±Ù‰pWW÷ú¿gwC³¯æ¦Q“ˆŒ
 &ü£ªð“¼ë æœ2²g„W·çdm¶º½ÚËNmÿè }[I¿¤&NƒÑX…¦¡?vÏBwü"ùNîŠu‰ªóÂ_~~j\d„C_s6*[”ŽËí@ôõ¤!)†7Fk§Ñ«Ÿ€~
µ×+›`™ã*+¹Ch7Á=ä‡c/ý~2"Ij—Îìfé¸¤a@é=ÐÛa Ÿ+Ôƒ~7È›dÎ0”tàò„@×~M:`±‹Ó†¡•-ò…µ=†×	+ÀÛ£l*7„;fd%Ó&¿•z++>ìýTòš±Áhv½²¾EZ$ÿl–`i7þ’é÷—q¬&ƒÃ¼ªÓä £]ÛÈÏ†#®&_¬s§PDïJß§q°B=¶é›c®`lòKñ	³•¨nûxÇqƒ¬<wJÉ…äµÊõªì«Mâå\±Mµ”/“s[Á'H¼®µ|GØ@¡>Ø•02´±·:acœÙo¡Žy£x'¬@£,Ê)DÁ/Ylº…¶MÇíæ†ÏÌ·©q:üm‡ÿ@£ÿÁäDÊf ™àòÏHi¶Á°·Nü	µòÝÐ‹V42ô-Edwr)þæ«WÙÆ[Ý^ÛB-ˆ+*0ü9ª.Óa@:Õ³hŸ…í
‘Â…âùVWz¡)	¡-Ô-diýÎbi-zhe¾IU”!z!plM®0&FÕRÑÀŸ*•0õJ–ØUBù"sàÉ¯–øzÕ$vH™Ò†”d0˜ôC¾(vÙ0†dýª{ÿV]\}¤lD]"Š¥ l–H@qJÈÖÃ…iCº³:. ˜\¶cý™ˆe6Üþ7ªê|†]†~ßƒ¶<æ9ÊòX…\hCÆkT¶Òš/”aÓ¬c¶	­eûî&{,üHµ%&²qoê{K–ÎŠ<¼Ð{yýòËkëh^E¥–r-µàj*,¹®†¨Q‹¤H"î‹ìiM¸?þÑB#$VŸÝ":Z·×îüzûy/	µìÒ Å‰”¿—³­ì´h\xÿnÏŽà‹‹ä{ŒßàŠÙ+«ƒSñÔ™*ôt·ìÖõüõk*úO%E?ÕÒÁæ‚Z:YkjúÖ5ÔtÚ2´ò¬ˆš~ÎbVÓ™žNÛÌÖÓúþ9ŠAIß :úÓÑ·PGßØB%«Ýœ@S÷;$Iü\ŒCŽQâ–PöqÒ7£ûpÇf`[ô$qú¢¿(;›)´Ÿ'à¶®Ö»;B;l1#¢ð§†bÁ¯BûW¡ý«Ðþ;Ú——½1l¯p:Òi¿hî]#åP
l–ßñóø¥ôž?ù ‘—7!ÊÖÛûû‡­fïÊÐ°!pˆ?›1·…Y”µÖé÷)—,…«eÇh&?,¾Ï/Ú{{í7Â>·ê×ÕXxXyÍÍˆ}ÈÐo–™Ïâ²É‹C£²ÕàÚNÅð_£È’”.ËI<ÍU•l¢zR«>NÑ*;¯.”*L‹ƒ…ëZz›k|A“¾³Gù\jVíqÚÑüåi	l+$–‘IR<;nÿCãœé!E7F¬–½CRt‚žFÖä-œ%÷-Ú’ ‡w	²tŽÒ”X[
--j¡úx³Ú‡÷ò@Yö‚d1up)å¡¾ &¸Î¥Š­@½q …8]§œ×<ç\ä¤óÚgO;?Íyç§9ñ¤ïJÚÐ¯pf[j–BðÌmŽÏŒÍ yQ	´I3ïbãÃ8žFÕ'O¨Ë98zNGn4¬¥ý	>ÞØÚØøþ‡žmþðÃû?þ0x:ØüÁÝ|·íÎâà9Í°÷§S?~ÞƒéŸþöüÙúŸ.ž?ýî‡uaÌ	¤ã<ób¶lÐïjš„J©À¬Ï=84¥,à~šs»ÅvB
i9B:®Øçx3 ¼Z#Œ|e…šÒ©j6«|·ÄOn&'§ÏÔ»!‹nl*Õ‹&>NodÉõí×QæÂvŠ,à¸«hÏH¾
TN'ôÆzb¡¶jáxîXìß:OµâžÜF††—wÎ¡5¿=Îìsuq&ôÞ*Žw7.ì›lXYÂïaë«ø»¤ø›'‚DãS{á*:OÐ £æý»qa˜9Øk×vêµÖëZ÷º ²”…×7…-¿ªSIÁ ‚µTNÓ €9¥!x§”ö¤&t\&|E±ÀéÊ¨%ìNÎÝè5œ?8•àå_1…€¹î¶8d$F”ÀpN(
u‚Elùi›Aÿ¤F;†µ½Ãý/
)Â$j¼°]ItxÇCÀ‚Ð‚iÒp’Dí×ƒ|5	?- ¿ÕËÅÞÄÌ¬jö˜¼HÎ*ÇJ‡03Å¶âØ™ÖY Cg?Rä-™ØË¬¼½æ/½ö/w÷*Bìˆƒwø‚ØD¾wÂf–w‚ÔV¦{B¡[Ùî	ÙÞ	¬™'OœAE÷ß³–á´;ºp/#²Ô;ñÐîZ°¤A@Ïô°^:Ç(®–Á7º&l”å!n=ÞXÿ£ÓâRÁmÈs?tGl¬«ûØÚ§)@.·þg°¢?	šmù„­þ@½y×Éêóø	‚šª!4ì
|_!3'¤V3øîG­i¿KÃŽº£È?ž±ÇÁ´N–œ5 fhÎL)¬´B@fÂ8zãÇÃÕÕJŠÑJeÊqüS[Ë@W„Xû¡7¹}5¾FÖÀ|m’tA	È„''Ü
]ÕËšMü¿Í<vjýj|‹5¥GÐ·ƒ¥×cRŠ›7@]|¾yîlZøŠ-Sfš´(_ú6òl…®‡®Ó4=ÿC ô+?.©ë’þ©eð*dçû11Ç"“¿Q±kKbK¶¦Œ>K=$]U‡Î%‰Å|–Rž‰‘‰žFÌ’§:,Ñ÷iAºQzRHI{rAO&®¯;K%_–w‚êcèÁA-¾Î-(£ÔõK£iXD*¨È¼*°ÿ´c"È`@Ú‹É¬Æv7«­ÄeŽûÊAø«`ì‘5ÀšFS•šÓ´¼rd#¥„]ÛI^Ö+D‘­°¿+ž4!9ôÙ²t#Í	(Ù€ã¥nÚË9–J7ÀDó9(§aG@ªi‡p³Sèˆ"üÉ’am™×áêÒª
J‰m§„MÓ¤9Øºfé/x¸!ã$'‡““àb"4ª‚ÅÛ¬¸7¥J:Xs\ÂïYÚ*i…çÎ_‚±®˜ ´B=›4_aT°,o2Pƒ]‹Ôf‹V8D›%
àB1ªMH%ex'(™s}î„¯ŠÍ½¢*Ñ#ó­x	Rå"T–GFÈ<;)‹Ô|;Å‚&ßøkyw¦#±¸wšIø†ÔDAW—ƒÃNýU­ËÕ]p0Ûoßnfø>ËµœŒÿ,pGkòOGQ'mœáå…T.pÃ3/ÆXéKÔv ]s
¤ƒ:^šII#Æ,è_v/Ç'ØWúgþÄÕY¥žÅþ€©ãE³Qíû“¬¯îGáë`FXá‡» &òÒÔÉB„Àq0ñX~_¢¢ÑeºÕ¸çgtŠ b˜1ÃØAÇßTïs³J¸î\€dNØQÊ0•å<UYÎ¹¬ÀÚ(³X22l ÃZ’ƒ%gö©’Ü$Ôoà»€* ¾ºI¤ Ùô4$|¦,õëó’Ø9Òûº–Ô4)Â­ ­4ò¢*D}V?Ý”o”ÖËr¶S±àzåiÙÒ+ÓöŠœkÙ^•Ù|CM–¾ëFåDZvâ‘n:…„ôÝä4´ÛÀI!•JßÀ)ýpt­4å©A7k‡/Ô¯ƒuLQéˆf÷õŽ]í¢ ¸X-ÏÉ/I8¨Ä•‰´úôû2„"Šè¯Í5çûò\sÊZ‰lU{è´‚áz!x•®<%ÄUáo¨²šR‡ü/àóÔû0¢Ò‡/z©æ'íTïKQßèl#»Añ·¥’Ú_&Òµmñ×\Aá`ÄHPbcÜi…R?aYã±ðªòW¸^{$4`âGUã[ô,Rº3±«Ln%ëÐTP©*4NÑ¬µB{f}[+W×ñïµ²ý©€µZy¥U }M…kNqÚJŠ7Ëjs{TS0àÍWmP-$±PÃëúPÅU©fÑ¹bl	ˆÂMUu\þ=H™ARnI4¼î¢"A1à/¤n{Aßaˆ3FçV¼ÉãÃ®HJ‹Î®Eš‹òÀ!êl˜­œH_ÓÐ‹|ê–&ÒgDaG´$ÂMJ×Õ¶¤ßÔ®’!&áDÖµÎždç•sv¨aÃàDÑ=¯ŒX%‹jãy%1L~«#´`Ø%Eu­R:ëµ9u™N»ÊboÉ§ûÔÅwÑÑ†	ô5¢¦ª«•¥ÆJ d*x@å¦ñ¢àaQxyÉk\g¾;Í½½f»Õ=ªïî5÷k/¯­s^9@KF é1{qr·ß¨X‰uoà˜––g4Õ#úªâÈš‘F‡i¶¾kJXÈTÛPIiã=S¶\$ n¶¸ªneœ»XÝ#Ä­”×†ì!Mü“¡®2¨mNNÅË‡W”$â†+wA¡C|ÏGÄ ,³ô}pzê…Ûi¾¥Ò‰?AÅúhv¢œø£z’…Ç–ddÂf«Ô‚-t´þÊ‡S€92êƒÇbkÜ!9Òœ‡Éh°õ„Ž¦k-®™Á›k~%ü•ŽRwÄþéeIýÔìÃ­óR¤ž@¤O¢›üÌBg‡-¨+êÀüÛÌsþäÔƒIßcg×‹É"Aù8	„¿òÕØÀ44ðÚƒo<²Žçé©™¶NgÇ ôú‹s	½Rq"rÃ<û gJ‡ÇáJÀß‡@”÷>¦?qÜÐœˆV>qÜ‚Ã¨šaû«ò©;¨ðÉH¦^ˆÞ÷¤ŠM²>ÁsýÄóÄýé”æ$Á
¤(Ò{î¸òàÁ/ž7uNˆàò|GÉDƒp‘÷¶9N–Ðnãõ£Žçªô4|MÈ_LzëKÿÆÈ‘bö&)¬aÄ<þß›ŽpS'É‚1EÃE O¶ù÷a pY3[°¸ÑoD€€PM¢–žyp  ¬?œg)ÛaÝiÞ¾”2€¨û/(8«(?ÅN”Ì‹ÈÖòO6í'6ˆ@ã†vT9ÅÉÛP†ÖQæ.ÙÑ˜àg8u#L:°á0IƒŸ(Â‘˜bd0rC›û}²¹[Kl.þý‚›+DÏ{¶øæ¦ºrxB‹ˆÑÿ aÏ€H¥&¾l;Ÿ6+²pÊKèáŽÀ{ÒŽ)D•!‘YU+Y<þ€³tÍwRÒ–@¹œê€œZ5r'¢ƒbÖ	¯–ç¶DLµc_*éAzûaEø7v8Ì>Ì€QØÅoe4‚ëK¤·Øh{Îaq£·ÿMû#Èã¹¡Ä™ú} p12¼ñ”ìó$^ à-©pbý¤óZ™xìÜOî j™i/]r\Bw ©%Æžƒ¢4Y˜Ó@³Q(z0«„ªV?!›”©Ñý ð6£„á±*‰’æcÔwôš=E•gêÝ':®-¨MÖêõÆAïèe£Õ<ìµ_¼ht®¯Frí‘+ŸFy[øœÊ‘ýMJ
÷	ô?ªùxƒ	–Rñë*6÷Ò”Ã½]Â¯¬¨û/qçÚ|Ù50µQjþ|©ì{¾<Ãªf«×è¼n6ÞÁ,ªÜ„Agc5´~CM1	í®!×0XN„Y>48â¥œ¤
¦Y¦`'vÊ+S2ªÝ7Ü8ç®42G ¯×èçÅƒæYsæÅ¯ðXr*Ø+Ë&g›­\#ªeå· Ú{<;ÉNqQkÕ{6UX¨(<$¤0YbL³Ýê½jtj»µÎWÆY„q“ÞÐë¸7ÄM°0Î”Y.Â ¿<®¸<–ªÙ¬®Á1Ûò–-Á5Óå´ ïë ÑyÑîìXŠƒ*“ø‚¹¨2ÓkrRšHõñí@ 
£U˜h½è´ò•Ï~2>»¹^˜Ïjz3¼6ƒµæ·­(Ïíuº¯v¿²Û"ì6£áà+§M[¹Óœ¶—ìÖL+/Æ_)"]—µ¦£þ‚¹j:É¯õ‹g¨"Þ/5³¬â¶ð‚*ÊA_ÔööÚ­›b¡I@ÆCèÕ‘/“¡žº£Q0¹#•…¶ðÃ(îÆÞ€ÀyžTNö‚Ž<¡G%aÐÛœ{¼Ày5Meªr‘ÅüdÙkçÐ¥ðŽ¶¥ï]»‹‘ÂO5uà¯7­
ëj$Èçûý_7wí¥X¾0‹Lÿ3Æô¹/ág ª¡ê6¨\_Še»"~uôhÃlÐÀšàgAž¸<»Kí´éá+8\O‰˜Qg/Ôè ðy×Ñ.ÎßÙdà²»ù8ºôšˆäŸÈ¾%(¿GäˆÄ‚ßê6]¯_Î;2ÁG&¸ÉYžhžÛ“;!hMèÜÀ?s}Ù÷iEò.X÷—ñÇãK‡"BåÁƒ7nÜV”*'Þ“¨9í={ýìi½¬Sv!Ô¯ºlæ3ÅÂ‘Ã„ù¯†e)Œ˜¦ÅR°—…A
ƒI0›´….´ 0GÆº
+Ñ	½'C\’è6¼–_U3‰ Âr¥*ØN¤6„+z—Ú­}Öäz†D71?º™IÞÒIøzì„yöÂ`Š÷ß	UCïÜsG‘
¢>)v]iû8w.ÜI¬"‡<pXÍ'äcäÞ40Bi¾Nƒ€g¢ÈûæÊØ!øtéD}7¤¾™§àé‘ ƒ'ABùœ“Yì4	@£{iü>Y+§¹2 /@?‚WJR(ã!ÞqñKD:À¢ÉôÒ-†ä¯qëÁµV]6`ï#ÁwGä¹¤o‚kþÙ0v&Á‘Öâ•ˆNjàÆrÚ€ÜÑ2ž2;t{.ÜÇqN¼!ÁJÛÀ.wt2ya8¸MI½N§/†¼ƒ£6¡KîÈ¹ÂÎ%x4	Ý›ÁÊ{0âx£  YHƒbþ"”®À{—ác¤e6Êïç	-œ‹¬C€Nô’,àŸ8>¶0ñ;sK8£ø-ßÁë©-#p1¯G-±r¾—×3«“WNLkþ§ â0ß£Äžíˆ92fC×91²fÚ°!g–Æ‘*ŠòpÄÃ’˜TËV/BÝªˆ:«&B¤Þ†âÕÒ™¸ TLÔãŠ&
¢;H`f,Y\5WæØÅkþö¹ÝBÛÀ´m9Dª¦…™U+›b%À’¢œ$ŠïÙjA±˜,
›P$Åëz6”ÝÝ£Z§×ìönæÊÕu”ÁŠÇ=
“¬œèB$U*™,f. .æø;ÓÓ,¦/=7iL^è
ÉVóÅÕÔ6ñãZ²‚Ë\æà©°FþYáéµ3@,ó@¾BWQèRÖ¶*	óZæYSªð—ß/šµƒZ§ö—¿4^µ{·
*X@
“ÑE‡i^ŠCŽÔÑ†Ÿ©;uC÷·ß|\…\ÈQŠ`æ@^)x–™ÝÆ^CÊïwÐîönjîô.&Ù,Ø… c&1=Ov1EeègTLxZVô\Vi¨ÙÁÛN6~?v¥2ÎÍ^Ìw0ÄìÖ?;ð¯eáÓ5v…£»u©âNïŸç!?Øîõe€ "h¾5ïP²ðöu½£ÚÁÁQ»³{ýóÙ/vãBo°ï÷Â@­£²¾¤ ÊôÜé”G“wŽÊÏ—ÄÂ»¢+ÞéÍ”u-›JË°Ï‡,{?;phœ:øB.Ñ#+ˆµ¯t„tàÆç™Y—¦±wEs»»«é:¹šfJm…ý>gçYÂ~Ÿ÷"%ùƒÞï;¤Ýé-×Ô».’ˆ´(ÏÞÔ~ÕZÝ7Ñ>v 4ï¿6º½f»uƒ’ÜItá…ŸÁ©a:r/½ð0B¯xFî¼~ìðû[( Ä‚—’î}„ú±ã¬Îð”x&Æ—Ïj^Ü‡4+xÕÖWÚ|D›Q‚¥SË´Pâš›|»h'vâ)n\J¦€ÙÈñë6=d€Ð4ï&5¡þò@ƒ\g—Ïã†h›äNa)CÕô)º¢!_ÓzàhLÎ%0EìPðtàÅ!{Ò©ßÇ…’ÓƒÖÞñ£«^Ø¹¤;„†z€€'“ôÂ |: ´Ñ™àôÑížGù<HOûæÕJ®(6ÏKéeê¤aºÙW£Ð°ƒI2¤¿Í jh0ÙÆ8ŒIÛ°dü‘:Ë³òÛRo(<˜´@þ9éwÒiåšuù§¤ÏXÝ§ËGÂø®hà™¤€¯ºwsGBæê	üùîˆáuB·î‡MºxÜ
L…¢T,íÃ–,oÏíñÀ(yÔníÿÚ=¨»øðÉ2Ôí!)ÉìÅ‰ªú>=W¹ìNÝ>ïWXÀqúA®”ÝJ	”¸ÄÉ(8ã[ý~Í9™ÈXü	þX	t„€€¬’DÅy
©«ÄYV¶Ò÷†úº£ˆ£¬E%¯âåh–‚ÂI•è“y|ÀB±>H…à…\h¾¦¢¤mbÁ÷•hä÷½UÈ2¸^Ö¹´À±ì»BvÖº#O;²qýýàà”»1,TjyÎ©…ñóJê
ßÙ]ãó´ìÚVö¦¥À¶{<ª4x£J.1J)-”m··Œ»-`¥2;Öy—¥‚5÷™Ö~òÄ©dG'—IÜ8FCBCiQ‚Èst¡,Ñ’/«ÙQ˜õN‡È—!'!¼õ“ÐŽ:ð‚‘Ýà‘|›Éß
lnkx†3¼ÏJû%ÎÒX×¨F*Â4¥©Vl®¼‘†I¾e‚èˆè$nÜÏLDXì‘Å¤½^ÐŒg/zCpYòöUˆìê&.„þ™mÓëiE0¡ w’÷8‡Æ¡‹èÎì|A©,A¢Uø=˜ïC…d €¹ôO¢~…8–™_ÝLX‚lTU6ð“J·H‹YFáŒÔWBÚáoê½LîªÃƒ]¸Ää`H]õ¢¹wRWÝMévÔ:™X‰Ê6,Ç¢i€·?ÙÛ§1—GhXð@^*Ö—VMëW-‘1†ñ,òû‹Ž@©¤Ï[úžÑ{LŸ½}o2(ÚµXCëWøx?Tð‚t§hf:¦æ¾½)Ø¿0+¶°˜Ø`6SsFÁ$M28o…Ë>ÏDÏHþþlûÓ‘+¹É\ŒóæÊm²Ž'³—‡gLþ¤?Œ£ùÖ,#ÃûFŠT«Øæ³R;1Óq¬o–iÂÝMÌÐÎsîJs¢Üöˆ¥Q3´½A“ÀcÚhšý}“¶uÔë­\á¤×DÖÐ‹Þá¥jŽ˜Gão³ öÚ§p^dQÛd»x)‡õ#BïŠ
Ïc7üàÅGÔˆ‹RôC¡…Jú0A&\³m¡…ë?Éº8‰Bæ£’eiÕJì÷?ÀÖ;%¸-õP¿TÀn…Ôhm¼œ&!(ýsv¿ªÌÁRL™Œú9ñR½'Ý"Aemà¹#ù¸†­Ï×V´ÚWüI4xV¬Ýh»gr™²ž'^>³ªkêd+¼Á“hNV|Õ¤Å”Åóº†~ AM„s„%êÙíÝáíKÐ,Mk›”ÞVc¶#]ßE#D0Ã|¢/™îè~ŠÓäû¦ÔîÆKhb´ríPEÉÄž˜ð¿´%•»í¨Ãá«ÊÿÐì¥ƒÏÄÀ—}6ð“zó/1ww$ÙUqÕ%‹}kÆÞX‡½+tYƒ*c?ŠHÅ”òè¥Ö~Rá8iC†æ‘{âºÉÇ|»”4“9JY@S±jŠå“²2”JÆ #²z)Ö¿ƒ(‘æwÂÑ<ó“¥ÞT5×‚Oj5ö‘¬%ë®ÁD0²dí„ŽJ*½z$-Tc;
:œcË4P^Š
k¸“ŽH'ÉÚpÑˆDHIV;Hšçk¹Å€\Ïí„Z0˜¥ë1£F¶@
 c1ygè»¨tøEc]ˆ ˜aNJ©e%¥lX]ì@_Fú¾nY$6R	³ö%kg´êÛÂ~>švAe˜sÓ
_‹Õ%³ÕØ<*v%ŒK¦†¾¥.…¨qí‰¥¨¬BÁWÉÙ>Í¦ÆºÇI¤ÄHŸ]-¹¡DÄ:<Y÷ãÒiúå˜,æûmE¯|H[FÑËŽ‘–MÐ$÷kÓÇ4ßcgµ |t¥´öW"û®®¬9+å¹sáFDø%”ÆÜ÷§dø4-ˆ%A;3$!@&Ð‰'ºì“ý"|¡«ð¹—áMY…ZÔÍ†a/º€ð›Ctç%õà$‘¶Î+êJÂËcyLà10–>8VN'—Ï÷/y¶.øˆ('…³­2µÀSÀÑdËš>
»æÈ²¼(h%·ñÐ(K¼T4Ü°àG„dFÔ‚Aßª<x	xh4ª°4‡YY-ç>ÅB®8òè[+ñÀ#%Àñ«‚.ÛÒÇáZh%=d<Õ¬Æ,Q[x{æ/Iô––÷Ö¥²DØ¹¥Òë\k¥zÒ¹Ìá“Ä¿‰jaÎÚHßìë¤–Ì˜ZG[Ü’š"8ÓÇîQ÷.Ý0pÓ¸cž‹éfXœ'Œucd;„Â`:¥.œªÄó<•yp#3aú5ŒQä–Là‘J¥¹
D"âÍJä"XC"‘Õœad¢éB#Á®üô4À„†`? ÎLˆÆ9› ÷1Gø!C9óûÀOýØé($]Vœþãßÿï?ÿñoÿÅÈü”}ÉpžOÅÛë½3à¢c´J¼-wd&/Ñèž>ï+³pd 9ÉÐ¢\?ñ*ÝX’ësÏR5þN¦ÿãº$sÜ(Ïgø(ó{"Ï×‡^ÿÈ¾([;<2¡P`ê¢¢'¡<µ+ëÎÂË''Áe?ˆ	šSSy0¡±©˜È‡	UWQJàÂ,”]Š{ˆ>ŒØ>×óŒ9NÓ
Šî€:­®¤¯e±CGhyß¢3·ÐÚ	sYØñ#m
;¢f©kÐ?¬å{.(ŠIU"ÈNGnß[}òî?»«=þËúãß?9#zÄJYÎ(7	ë{êêŒxlFÃ¢jFszˆ¥ë;¬)š‘T1Óñs/ÔÇf >L¾ðd~¾öÀkßÃK
ßQ’.(N©?$„œ,¨?X²ãhâN#BJïS;9œÙ•©B7ãgxå²]‡uÌêc6Üþpuu\Ö­õ‰"j=¿DýÒ¨CÂçmë:ê+9¾³‹¨ûmIc?&lÎG+éyDÔ4ÒÆüXkD®„ŒŠ–†…·ž+¿YU²_µ0t/+§!¡¬@˜º^¼Ê>–e˜øbÈ+—ƒ¬Ÿ	*°“¸­"}Cécîïü
¤Gro0Cš%{A@û/’
„Î‘‘›»c”ÎØ‰:Ÿä‚ƒÐ®BL'}ÚªÓ£4-ÞdQ*¨5k-Žëçç„ÃšM:„%îÈ¼x5^zK¹z	ésØ1]ôÐÐ;»§ÍìÑn"k~Ìü9ÞiÿZo÷zNïU³ët{Z·ñÐyÓpÞÔZ=0#	Ë ä¼Ý©ÕyèüµðèŠ3¹ó‡Fƒ×¥ov:ÍÖKñÔ&2åÿü·c³Äu¼ÛvZížÓíuµ}:¾ÃV¯¹'jNÝ;ì´ºN¯í°1 ,~½‘ÙEÍÑ°!€Ùè%ä¸§„h’¾…Mž£{"äVG{âùÔñ‘–Þ~èÔvºí½Ã^cïW˜oå“»¨ãxîü¥Ñi³Õí:/:í}ç°{ÍE3	É:®9*t
/"H5nZèà\=#á4;Õ,ˆ&Á^¾[%ÄDk $Øî•òïáÔUã%œrêÖvúdG5]ºüÒ9Ó‡OÏö=Q@aÅ,eH`¾¡kéS,yr«mËÞR¾òÃº¤Y[ÊÒGÒGeÑö·ZØÊô{ v Ü0²l%»¨ŸäÝWÁ…Ó'­]³DmÊÅ‚Á+Kø(Ã½H;ˆNþ¿l8@ä æ¤*Šg§§ÈC¨™[l{{Ûéà£þDsÂiü?2Ê…{‰8›]R•-±| µÁ6	÷$"€ûÐ9œœx#ß;w!~9éêÛºz3ôHã¤¦2è‡Î¯bï ¾Ñº†ø1t	¿aÛ/J¤MüJ›ôõù,´)1†<»6iZ·šEÒ'Ÿ4}·ÅÛùþ³R¦L¥H®1W}L `?W4ÚnˆŽhhEîÖD<Ùuª„Ì5>öý˜Úeþ\smð&IÍƒi‚ >ó2Ú0ÕãÏ™Ë£QÕcVK ñÐ‹<3;†på,Mª+®˜áÓÁDh°ÐLz%ÁâÊ‰ÞÃ‡zF[-kxîœÂ½~ÒB>ž™+rÏ=8:¥l@oïÂõ-1ñ“F±>s÷4=ÓÐî¥ù¶ÓÜwº¯j¿ùNOÖ5Ç|2î¿Î@‹ƒhÐcoP±ÇŒ'ÅÓñl®Þ„…|&žÒÏû¬Pí[å÷ŠŽ•€5ê­m7F›¤R
™ÞB¬Š¿ÿ½X‹îÒ.ˆ.Wls‹©È;ÑòÂl1E0F¢4“œüÒGãªš¤&Ý ›_ò6û©6T”¥§3i¿ÆÑ'NÂ¹³^*aY¥ÑKå3­­><7Á¯ò9ÕV®Ç¤æ*2²¶¡ÆOCä#ÑÍúy‰xdq`ºÃ' ¦˜ õû•èqž`F	}ÇÍ•˜ó¸âmé@‡o2sYuùCo:‹1ÀŒ+0³¡JZÓ„ÈÊÝ?¼¤—Û9T…íž;5¸„~ß«ÚZ´WÖ·L‡IZÆ¬Ëæ®ÄmR!aLøÎ%ØâÊ%!¡äcVò'k¹Ì­_`óó·y ¸.léç Š<*8¦[¤ÂVîÌÎˆ K+}7Ýè‰ýW	"N!D–ÊØr¸ Ð å@MlÚÊ›¹MhÕ‡¡XÙK+â¥)Ð¸YëúL‹Ö:[-Tƒ_¬ßX¸¡âà€È—àúÊîAä±ÒÀýÐKÎßAžÎNF~ß•|¢ÑáßcÌ]"Ê¡Ô]±Žôgç©r¹Bkvsï<`Œ¡CT}w_ª ˆ>É|,ÂÈózØØ÷Æ¸bB%~kkì~%,‰‹BÍÇjç·á_À{f±FªçŒÍo&8=õû>ª"ÌKõèJÞ¹ ‰³Ë~ø}Ôa:é®ÎÁº6ðaP%<½È ›}”Y«|ˆw<Õ¶ëHx×“í®ç a—çôI¹®Ëch!91ï«¯š—üb¼[{³œÒÚÜKçÂs pùëÀPËök\qºp§!“Èa*8?†Z€¤&}?™— Þÿóÿã¿*zúõÔ¡ëªB×Uƒ®çÑ¤«>s
rœÄ]þäVÝå}Ž’D°š{îù¥sâö?gè€Í…Húe'#ïã q¥`Eíþž“Ra¼]p©Ðß…AèÙ­‚Ð§tŠ6ÝFò€þ¬Â•Èáº{¯»Û%XŸ{•M¨ªŽQÐ
‘‡ ­ÇKséjîÈ©ã±Çžj
Ä»s`Å$½°Ü¼Ž;Á,$Ób†S´FêÖ×“`pIj½òF#8ü }íÁƒ7ž¹@C‡UàrèÁl$¤õ<Ñ®yx_ÆMpW<óCRëœ1ð)g‘óa\ÀÖ’Wà\‹ÅQ%‘¾Ò´„dºÖíGÏEKwåz8Äïs…ÝüÖ¬ÒTöŒÛØª†u£q°L°äÈWã'ôïâ8¬Ûæ@‹vct¦’É8­ZK@±š†]J¡ëH"O0Iíwk äÀAÊ…FxÏÞùŽ–ÒÅ¼[VeHœ˜ï¥Ó8Øûõ¨×>z{ëi—øÅlš…hM•‘êšâ§KmL¼ gÈgß²¿–»€¯Ý¸W.Ù¹ÏXìº°Òh•ÛðÚxVÅœgsaé›Œ‘½U*4Õ¬ð}ºN,q!m˜¿cÉlÖ„•}oáµZ ph(Áòýˆ©”eÛÆyC®nc¯QïÔªÕëíÃÖ5°ëN¬VA|–—ÒMIÏŸÓïƒb+“á‚«Üi`ª†£îA»×|ñëÑëF§ù¢Y¯ÝDò†ëÐ3Å³>‰ØD„H¦–Iýây}xâÇ¡^:ÃY8ywi÷­!À£.Õµ¹ÊNÓ,µ‘¯µ½£n³õr¯qÔëÔê¿!Þì¶ßÜêNJtZè‘îƒ†nÈ6ykF+Ä 1iª„³ˆš†
[MÚeWnTMíÜsGÞ —ÝšsöÇU¡zE­Áy€R-'–.<6V!Ç0"}¯ñëBUqšYÌ…Ty‹ÜêDJª¸ZwiöšwA[2*N^¬fCˆ%4Þç‘!†#MR¬$_ÑÎOŠðÊw×,d—?úQO³ÃÐX§Êå¥Õ‚˜¨ÚUåCDÔy9§Ã]n˜y#‚ó²Z1•ê¤¥ «P¤tø=ÇçÓO®?²l&ä¥L8¾7ôFzT¨„6«—mR>)¯2ëÛmQÉØ‹Êbÿ½µjCt%be:Ž“ˆs8+Ÿ¢œœÏ)-Žõ”òñ^ÊkÒ)¨ŸÒ@ú[žøê1³¶9lÓ(?° ª4Ö„ƒ
HPCçByÙÀ€‘Ò±=þ‹„Íu¥ \Ü~.†ÝÁ"™ë¶sœÀô$“àJD¯Ã0ò)™Â|Åùç?þÛÿ{ð =‹·Iù¼’º•W—î¢úàÁ±ŒT‹2ÌÛ•ðd›"tÌoØ®9>¡/3ð©EH;þÃ£+LçspÏŒçÇ²÷	TúOp&+KþÇpœ1ç[HÕd4(î·f÷(t:%»˜/vÕ~kÁ$Né©ÔÂIœDÊ$E-L>¼¿“’È·ÐÝˆ€ä;ù)_OˆM¸oZ’3L³á%YÏ%DáÃƒ½vm7Õo?‘îÝ•)ëhž“”ù+û©ë«²÷I”½Ã_ÞÞU;õÖü³ž…$ÊÎ6ÈV}JÁú™ :ÌÈ0³ BbT,&,ÏTQ95h©Â€ï)¹PÎYÑ®?é{™yS² |fÕ2†4 ‘fÕi°Ä¦0x~L\zëÔè’DÎŸœ4""‹Àë““ÞÒoÔÆ~ð-øŒ}"<¦ÙÉ.ÜþÂ™hÖï{Qt:ƒ#XÒJÔýo UwV‰Ä¥/#=Ü;F<«~‰ìŒf^i^®<x ½@ºQü{ÎH«]Á	°·PÐÒÓ‹@›ó#ãÐ9õC,@D—a.,†|„S¨FC1†J†³8Ã99uƒƒ»1¬Þƒ½¡;ù€gÐxÃ)œEèóVô§°ˆç÷CT ØW•ðS./¥B`Û&  ÍùŽÃ·¿¿_‚Dv{µœ¼Üb²F±…ß}*‹Ïýx,¾7a7Üt‚Lý¾;´˜Š"¥f²%U)è&W.FG0·‹j²‰àesrÈh=ÂÅ@ä-˜œÎŒ[÷‚J-žg¶hFœN{¿ÝkuÛ­—˜ç®Ð”«$QH²Ñ¹©å½Ð%Jü©1Æ¼¸ÁÎBtSóC(–uw0 "Kø<mŒ%$hGSeLÊ¡ÂGiÈ£²µŽ±nË"AZ7õîFZn–Œv×+4=ËFÙb¸íf'^ÄˆÛ‚3K·(Äé JÏºpOJi>uiÂEhOÍ¹(®³V•æ[d“œ‹i5X ÍA}¹ºPš¦¡Õ•×¹‰7ªŽ8±{â×;[•¶~	ŠÐhíÞ*ð;–,À'´ƒ>žã s7¡#)²C4X:'—Î–§Ýð8Øƒ64×§ÈÛF÷++~)§Êå†i%9òü¹,§àE×
cÝ4ÑR%áØ¢¾Ò3¹wiõñF:±OZ’©Ð*báwI7ïÕ‹¿–b¹¢‡½j:õ‡"¸°UP%›û*†\Óq¬Þi@ŽÍp»Y2“˜Lö»2«åv’P(Ï-ƒ;Ôž?&øJ$ù-‡Ùr"M«`MÅ‚ÑÀ‹	z +J¼L‹ õ0ã¨;'‹ê®møZ0žøV†¼…|ºn*.ˆ)ÅÓ\ÎXï;ÒOD4S?ÝŒbæ•œQ;„ ÅüÓòÊ…¯‚˜¹ÛØküž0óÏÏ•ë fîCè´ý¹±–û‚›s,]Ð°Ë†—rWAìx˜aÖÕX&sè²­/ ‰ Õ,hM–{gjqàú`bæ½Wh7 Úq/Î˜öºÙx·x~éâKÅ‡cq6ìF4Ækß»¨:¥a@@1=ýfƒ’†SUë-5–úÐßõb×™‡ó¢½·×†v;túóñç7ÍA”Þ¹•g]¾ÃNîV,'¦³#ñëš²ÉËX[wf‡ïÓ¶X!Qå1ôYG:BŸŒFî¨¼Ä&v©¥`¿ÑíÞ€Âœ€áÍ¨1™kí[n×MÌÈ‘Ê¼ñ5“ÁÀ³ðšÛèØÍ'±°Áð=™C0¬Ï_%ßgž¡BÃ1êÝb\Êª´ØK€[íà |Àßu»V÷Öü„ÓÕ §;‹¦Þ¼º1‹x_¨QðÕ@ñ0³„ uG]Â\Á‘‘ËŒÂî(î9ÊØž«°Õ™¸kr¿¹ÁAn	:Œf@i>œ…ÔLX%ÐªNºj[;ÅzléT–VB GÙúZÛÙk ”ïtëæø¿tïŠFEN%a{–bñÎ¶“ŠJ„b+Õ§¹˜2–ïe#÷µ„gÍÇ}¢+Æþo– kP¡"•ÑÎ@ŽÈ¡ÍèA”É·ž©~ˆ4+¾5¦ÁôÔÂðV/œx¿„QÕÑâ>j‘à’Õdæu‡nˆ7Í•‰oWäpB“5[C x¼‘æŸŒ<P."´^-†ñÁ™ñ©ñ{nÇè&!£õ‚ÞMw›-ç(¾…‹Á‚;Z­ÃÆQ÷U’7|%Y¿_’¥á¹ô}I4gTíÝ{+3 ü5	Öâ´÷:ÄH+áäQÌíŠÚžr¥iÐ´ÿ  ÿÿì}ÛrÛH–à{Ì­)‰S-ÙV•‹n·ƒ¢(™]”¨&)W×z2DB"Z À@Ûj—Þ6bßf#fæa7b6*bc'vf_7&ösú¶>aóœÌò¼èj!ºË÷sòäÉs5Þl{ÇµN¯Ùí6ë?<ˆ'2–›¶{èöÏ³%Å-‘š½úkˆÕrØªýtÓN¾Vß|hÇt°õv·—AÜ…ðÓÜGª¡µÆ;QÝßôQÙéT.¢Ø­A¸<ß¡çXmA„YÊ¢ŠÕ:,W€…ÒHt°s f´œ6	ZÃ3Ûgö¿ä¿ý	¤^eaòÑ]Ž´qÔ¬ÚÎ›ÚA½qüc£ñƒ.SHŸ€™šÉl£‰‡ÖÁQ?ž"L™«ø§lk¤ºzG
ª‡rR¼,ÀBÇ°*ÕLÛm!œF7ß÷‚4u×h]¶]²K¯ÂP(Ù°µÃCÂîu›õ/tóÞöÛã±çìCÌÄÃ‡}pCû ¸…Æë-‚ÿoÇ­f½qÐ½QÓ¹[®>9Î‚Q\Çd†ønÏc×ËØ.BmÉh•>ºéj2NOe–éã|ÂÓôƒÓ"W?rQô"¦¦ÔüJ`1¨ô9ò…ÙPÕº½öþq«¶Ýh-®A‡>M¡²“'õ‚®{æ_­2Ru‡)¾!)†~HÁGß	¥^ðM•©Zü—$Åö(TéÉÆêˆ&êåÍf#âRlyœ‚ºÒød‹»Ñå>b¾žƒé1ñjéaÓÞÓêÒo Ï£ÂÖLÍ`Rr-äL°Y¶&Æ¤åâ)‹õumÃ|f»Ew3Ýwç2ßŠô|DlÔ\UJÖ¨+•ÏÍ`ªÌñ{]áE©3áÐy<tG%‰+ÝH_57A;N¨—§-™¿@Ä}¸¨ß’÷/„€Bý$hFZL7	ox.15µÙê`ñ„N–J_}¦[[(U¬mRœÿœ¨"¥*ðÐ’Çö ëÖ¾ý§@Ž%Y™á#"Ñ.ƒ>a“œ6ææ^¨­eOÖ³'~“FÚxÁsGãÐ…ðŸÊ¬Ö  ²5¸|Ý1MËüÕg$¾r)ÏV<`ø–5åcœ5Âwf xù%’!Ø„«&¡ˆÅ\Ñ4G-x
‡áfQ¸åÚ/¦qÜ·fÂ]ÖyéKáP;B:OO­•š²åCmÚY$U•ÌQ)ñãEcA€šÍ;ËÎ¬ýäÈ•Nà´@â F£…PËð|'µËœãŸF~ãá8#Â
Ã‡U1zs i°%nE?èçLö„·ôN¦ñi-§_§p#ˆüÙ	ö”Á•À“r&|ˆÊ&Ÿ#Á&²¸„ôR&c
§‘.N'è’ÈK4Eì<·½¨>î,ÃÃ3B>¢F‘³gŸ€K>aå}rø¨‰rBÌ_±¤k­í£}Îóæ•]Ÿ-Õ
,¨¸çdŸœÀ&ÁH S¦˜†ê&ŸAz2*™œBQ½Ñ±Èð 9¬C*L”X|ø²›ŽåçŸ­Gì{®.fíðÀ+¦H0SOAŒ:FÝÿh2á†âINEêH—¹šü‚³W ¤×ˆ€›YÒ_AàTÿ˜ý®B+“¡"í¯&Ã‘ßåÝ³auopè„}‹WQ?©µÚp(´8•“«‰ß²îCäÄhÉ±dª–òb6 &±w$Œ.rhÙSŠúCg0ñœ(“E²éêÀé»0ªìzŒ9#<ïˆ›Šéç­rzµ¼*Ñ.—˜Ç¦˜ù®€#ûÍ“ãiî×šSH" æ"aƒkˆ}ønÄˆZŽˆµ×Þƒ ÙojG­Þðt{#t%aˆ èw£7ö„à¡|h#üE¾ßúƒ"uÐX¶Ž»õ×£Vcç˜1k7)iÌº^P·ý¾ãÉø25d4‹‘W,*ž {iÚÚ ²ÝÎ÷Á•4Ñš +b/ÊPÙ‘5ñÙË>³]_š1ûDÓàDRôUÞ{ì—1C¦À·3m1E³&!uÕa°\ÌNJná
7)ƒ¡ëØ ‰?p$åÆSJ›0šCC7gFý’qÍtåâÚ]&4WÐp§ÙÝov»TK†Ýð×‡5ÔIÓŽÁï¦MlÙÄ©áG““&—ZÌh%g †å1Ã•„hÕ¢§}JµŠÓ+6¢›&XZÿ)È‘±
u¿(Ô^íxP¢…Áfq¦“é
«®©ÊM Qes(§<$¼F`ö	nÕŽÐŠƒ>>\Š×¡44{_£ãá²£%g‡GÎ$“Ã†6³ÑYüsU*=®ýÁÑMªÇ ¾íÉàÌ‰»c”!áèÔ×I(.5dæìi*nõv¾²l84%Ø^ã yÔåv¹!!éâÌñÝIÔ„<ª Kì8ž`>ÕÝ ¤‡u•/ÖÃV¸Æ­`Øûµ½Úl4îÇŽ˜-ÃT$+eD´—õ)É—\M
ðÎ¦°5ÈÙå©òàÆŠ†dô¬®I´î}ûÌþá+­CÈ×Å‰T.ÉËœL¶ Åö`Õúê³!}jm.¥lÇ,¤÷ŽEÓ“›FÏÆµ\Á6X±H	!13¹1¸I§<:¶í§i™IÏ,Fn ý	¹<•rFTªüæ7z’fˆ*äŒ•ÌåyF™é˜éÒ6û =)ØªI‹œžÂÚË›–iµ’‰¶¡bù!ÜŒùš”ËoªG›6Ž…ŒfBV…å).uŒ×nuã@+ÈÐÈˆO—)m¸çI’ÿÏºÈÉ1×iqWŽåX(vŒ>+ËÔ{sÜ<è5:ïèá˜¸ÆcÓ©¿h†`íMSz@Ê•¾Ý°ö];QI6ó[kóûçdÈ5Àªø u¶ºCB`»±¢_ùïƒ¡ï_Xu;Œ0¹mÎ!ôSnó{­ÍL`“hˆ·c kG¨8ÙÓ#;»­'hQ6e|ØâïíÒžä4µ©7Ä¶ÇA«E`žSýÉ,+åŽFÖ®íyêBÉ-¼b«í°YKö`f¾úœ–¸Ô¹B¾á wÏñÜØ‚;/=ãÁ¥xä¬ƒg­À„Î™`°1°ãïÍuìñ‡Ûp¤+£s3 ïê9x8ÁoÁ	^«×‡=áônïî.9îsºÖd$_Ñ89è®æ@7 |GFu\/Šß8†ã{Žã|Ì_MVV¼ª u N 
ÈÞ…'6É+ÚäFE bÇC\“uÊCm¬+"7ýL ÒY2´>ï«<´ÄHð¢3"t©¬´Ñû ×žw3™·PñÃ¶„ãKqÐÂM	.ÕÙ±4CÆŽcGä
{1Ý’"{§Ö	¨óð'ž—1´.Mžñ-êMPª*ÈoÜüh;*~Çd¦)u°ýècFæPF®‰°oÁ)/l?0' ?ŸAjÑ“ü <ƒÔ£éëCÛ?®jã…T²Tf};”¤v4$_]x¡÷B†×uGàã	ƒËç÷ca¸Òò±w©æq¦°RVfô‘¯¿$\æ©0öo^Z[¸XÉ˜é¾Œ¬“É_þBþ[4º7u%‘š¦	dE )”)62Ò÷fîÈ6·D2¥€b®óÁÇOhV ’BÁŠ0žfdZÝXSršfÕùF_ŠrÙÜ¦B-ÚþFXB±U	™8àÌW°Š}OOÑ‰µ‹¸)ÁC™Ü•Øù¯ QÃ¦õbiö¬¯>+—Oÿýý÷ß[¯¬•ƒÆÝÃÚa£cu‡íNoÅ"mowµš{|]¹Dy#6aÈ–m­`,|¹rIveßŒgpŠÇöiù:¨‹†G.¹ÈñfMª"^zÚ_!w4Â
Û!ÙÕŸÆ!8Í‘M>p#{<H)Ò­ró Ï"~XðÌä‹µenaì¹ÓÇ`ôå‚'ïÅ0(É0IŠ:¹ÉôÊ¢ë¬Å
—ç­t).® Ùè²CÎëëÀùí±"ÒíyÁ	Á	xIþÂó9±ö¥LÑÄú)ÉÂöØš¬D(ñÎHö2ub±¶Ð™—¹Rv°Nx²ø&a¼òÄ•1`2à‘ðZIgÏƒ°p·Öjµî‡˜ðöêWOQØtè„˜öÔï;ÖÛ¡a•7î#÷=ã~¸‹Xp©"3†˜h¥”ÐÝBf6‘ÆÒVÖ(@(8SAºŒ}ÕQ°86žüÞÉ<£@ j%k4“_ŽS^ñ¶.ôLd‹æ¡IâÔ`BÞÒ×È©7Õ±4–Ò­G[ƒÐa#æF½•ØVÜclEžñJÐµ¸ôãž£“äÌIš4Ç°Ð)¯|Eÿ?¶jã1áÛO ÔèŽÐWfìôÝS·¬Š‘õšÇ*|Î q°5pÊ%	±âž-Ó¾{ŠôZÚ¨Ž)0‘®øÆÆ™wàÅä½œ‚qóD¹ª¡d#ÓTsÒ¬à+®•œšW½¶>I‰à/ç0²FÇùh‡”çÁ â‹1‹Ç‰ð ÁJ¬Aà¯Ä‹3¶ý˜|;ƒa’­3\cÁ@YB]ßÎÂ›ÎG›Ô 	·×:~
y¢Â¿j*à"W„× Ë"H™öY^ÑVy!(‚¨îÀ	îÐÈµ"våÉuþM¯à½,C2 ™18¢æ|=W E¿œAL±ôe‰–*]„KLílbÒõÂh<¹N<œŒN|²Áµ™'_LÂ$Á½>[&¤Åù–‘ˆr™Ù<ÐÅÃ­WëôŽ÷ûÛÎñëf­wÔ•4\Äs!“°	ps„ ó±ë%uDYÄj4‚£gÄ)1oI	yöH Ä¬ÝôLÆ–3†ø`°3#j!‚™Î
Ó?X9¥à8o“ÕÑ‹V§É–gEš„ÈÇæXd¿cú„W§nHÈq<´cˆÔ•úT-_}NfŒÀ‚SÂ$¸HóÏÚÐ]ÌÅ3 ¶¤_}¦qI­TÜhÆ¹Œrÿ|d){oºPW=™Ô{m¡îÖFakö[X[Aá([—°Om¿k VOÏùD…R[ï›d+Â	zâx®CŽN&S¾R±š+#À(øë/ÿõ[ä¬°>:žGè3©ø˜ü^! ÇäE0y¤€ä}7°"{ ­AîkŸ9bûœÆƒ;!ÝžCŸ®|D.àÔq<Ê_Â. ‹1hñá×_þáŸÔn	Â å2ØI½=²zö¹A#±54l‚B¾ã„æLd ^<Äèá0Ñõ†×'ìQdÄûëÿŸÿïßÿ‹Ú©Xí}™ó¬š0Œx`&ý!7]>!éí×_þ›Ö×Àù`#šLkºñfÃ`=`€óƒï(F/À|©Á´}V€q	…¦1ûG—¬¬á	ùm»¨YÛ±ë Ÿ–cÌÊ	 Î8…(Lè_þïû¤¿w&Ìæy@RRË¢R¾â® ÕÒ¸”è
òüÉeÙ5Uh\ç©l%ÊžƒF0ÔxY,† ŸÏ[×ú›TÅ¸¹–|`yxËï 
û=ùrL6ÎñWŸ]•ÅHh/pF
øŒ“ŸçóÇLÈß¬Ô/08S€ÁËrYC\¨žpê¡š‡CXG,Æï‹„Ævg…ss£×.—¤{ÒÝæ£xçQŒ™¥rì°ªZ›J×|ˆÚç÷:¹HvPãÅ8„¦«â£+Š»FÖ´½Ë9†ô¨sq–þ–Ð‚¶Ðoðéw¦Ÿ¢!KºªÀœ!ÅA£l‘¿r23göÇ*¾S•ö9E*üTãhª¢ƒ#Š¬µlH²y³É/<ï¤7’àC–Ä˜ÄQ„ôŽäIÊÛx$0Ü¹…Ø„
@Ç<€â * 	¼:¸™¾‹q^å¶>DqïÑNà¿<ÚÎ—¿ûé»v“hêm°v²NºdÞÉ‰—aAvôeü1”§‡_¡òÂñ—3–üy-’	N‰ÏÔË²úˆ¦XÂmþbˆ÷bŠ3„ÃÇÈSŒ¡Çk	°ß€häPáÀÉå„…ÈV¥	—*s¯>‹Þ›Õgá{´ú,~¯VŸéÖSüÑdféS˜}âÏ;í­œãR§¨šDM£¦iUÄO·†IG*%ÊN£þ2YB´ ãØÍCYl~LÚH…äŠx\®+^Ñ`«’fi«òUÑÖE/‰è?ñ£¡{Ëò"t{™©²8
3m¶9¤©¸3:h…ªˆÔÛS–$`u¬`Îq…_IV°”%œòŒ¦ÓíUqÑÉ¬'žºñ,üÖxNh&¿Km¢áS›Âš×Œh§Sô"m­+í«ô]%$:Û»@Îf¸ûó2+ÍN’›ãz{¿±]»ÙDŸ¬ÏcI¬­ÒŸ5h«&ŸÑ˜5¥	,dªí|ŠCŠö‰çð!Èmä“Ètä,¾;K;ô*/ïP9%¤WE\¥ÚŸÉ9¹¦{f%fŸ¹	ÒF¶SzôcýC
O]Ù°_õjŸOü±nAÆ½¯>å x]ëZFï¨sÐØy„‰GA5 ž ë§Ê‚‰ï‚O³h°]ÉxrâÞ¤ßÿô/üÿ:g¾¢þ”ÆçFFx9¤Ÿ›ÚÑÏèûs…¾ëdyx.•¬DÂ
]sàÕü˜œícL/MÎágäÜ½¢àQ{z[¤…'BF_­Û„Ú¨5:"wÃfBð6Ánà€ <ÂÐ”»Úiêz‡ÎÈ!SÏR“E%ýóÄödQ™“>ÎÈ}•ì‚cPOýÛ•ìg9Ì<ËÙ›¼ó%v	»€ŸÎäÉõoƒõMØëíƒõ'ÐÄ¦¸ì.pb¹²°¢2°¢²¯"2/Ójg6¨2‰Ùæ`Šïãl¦aÜrME†× ƒ¥y#|“"[Yªbm;ÈI»WÛo¨q\]ßÉE®›ò®,¸j»¶Ã*$¨AY&àh6E²¥)N*jã vO/Ò’d/ï4viÊ†Ãv¯¹ûS’º«˜F:á™ÔòvJÏ©V3³ÕÊi6ìþpu• dGà•–µ”N×:Æ¢cÎ´*íè‘ãÕV0ñžÚ»nM«Î²É8Ò¸S‚ì‹°ª‡íz-k1Ó–„µd/æXmI_@ZCY?yY£tÇÆå£EôÕV·"- ëý…a\êa«%5_µªÒ‹t’WZ¸1Q„¦þ˜UafÄg~›?ÿ,”\Uî4öBY®²µ!WzûNC‚_UáÒ¢¤4dÕ.öƒîÞ"FSNî<5æ‚b¾¨Ü±Tú,¹ô75#!¿ª8[w(òÏ1]–øwƒ 4q×i>ÉŽÙ’üñK.£Ð=ÉR&lõ±uêØñßU^Y?ã¯	F»úÙúÚúyüó‰üÿÖc·üvã]%ÝÑªÂ>Xr<Ò~š]­
VEìhÁÕj:”5iaðkôªò6-ð®¬,»$g]’ªÑ9ÂSì­†yÿ²€F¿*£/)ø0w ±€BùÍÂ@¤Í]%±‡k$ög¥	ˆK'®˜ÓÅËÆ´
|uT0e*þÖ5ÈVf“ã)Rc—5µÄ@yyY¤+êC:4.ˆP‚
|kiæB[Q:#8$¹¶á·è=Ê,²ÝxÏñ^×ÒJ“öÏXxÙƒw«b)v1p*›8ë¬w˜O“‚‹†Ôg'Y£ ›“’cG¥¢Ó.ÐA+þb[A¨.îåB¨A-ö•œÚÓJ+V‘9b÷<ÎßÌÔ‰T§xWä8ïs6%+0ÃØƒIå5Hogs}MÞáEÑõP«ÍÐ¡²¸pobâ]Ù)±/Ü•TgÖ®?zÜ¡eÆ>ÕÊÅ;Ûc;´ÿò÷pÄÅqZ­6ÎÖ—P£x7‰»ÞŒÈ©Õ›a)Á³*¦4
®bZ£x7ÌÇoÆy)µŠw÷iWÄe	Šõ&Wš¡³^èø3tÃŠÏÐA}hÇÅÛ§¥‹7ï‘+ä.AWôœí2gÌ‚ëÎÙõô§cZSéÖ”ÁþÐŽÉéspX·sê³!µÅªcôªâ7FÊ‚Â‘pŽùe"ÍZÚŸ€æ-¥®L¾Y&ò	ò—v/)r\Y[É¸ðT`¶·ãFý€Tî4j­ãÛÖÎñN³[oïuj‡¯›®Èö‹-Ð4^¼>á¬’?§ª¿bÖï DÌd¥¡Ò¢}][tJJ/•ú°ÀÈ&«-Ž#âè|/­õ[µKî£¡ñ€ô¨N.}°òè›jºíYÉW¸çÉM¼Åq¼{¡ÔÉ²ƒ'kž/ÙJ|cmJL¦³Ì[Ÿ6tIhñ2ûºh”X™îîó\ÚÓM€÷É"Û`éWéÙ–M,¶p²@›/.?:hµë?w;ÇûÍ:D›X<†WŒ!W¯+f—§ûnÿ0p’@2Å¿¥ÛøÄ÷‚þ¹n+MN¢~èŽa¨4z7Î"ùú*1,ÑD °\iØ`°ôä[¡6ÔŠØmÃÇ\êŠðàã4[Ä“ù!lfÉ;TÁ-ìfUpÃ‘F¡ôÂ8UQ-ƒo¬u%€UÉ^!_ƒª¾"úªÞ„ÞOX˜iNílîÔXZõã?ÕZÍÞOKˆ…Ç¢ß‘Eú†\Ç~ê{öhìxyQOÓ•3Bœ,ø›Î^ÎïÍdBUu—·*¥·ÏÚ‘£h ¯zZ³·T¬B¡ÛuÆU\.6 @­šN„êî=2°”íä_Œ;NXîÎ2|
±Ó	×:×ÄŸåØUƒ‡âFÜ[Èq!*^HIÓÂP#„P!4à ý›}O§øÞ.¤à“­jkR4XØkààêíB$ê‰;çÿ¡®'«ÒM…±Ñ;®×:Fç¸Û“Óæ²{¹ž†åñŠË;©Y®<Ê"<x;À€7!¹G<ŒpršÚa·H³ÛA@ÐÌ_•¶ãÆ`o™ÞW8ì Ç­ƒÀ_“:ŒËÐ·}ë ñ¦Ñ±¢.HF qÐ{;¡-Wµˆ1’;ðÎXº„1è`E.Ú4±k1×OÖÜ„qvè8a7FãÄ
"a¯½·×jï¶Ú‡ÇNí®gˆX±gŽ/R¯(¤Kð3ð½‹›Æ°om„v‹Ì j	ËU>Ìˆ2ØrÕØÂ.H4îBÈ8‡Œ=N7žôÏÛ>íõð"ö	ïsÍX#…IÊEÒid—*Ùy‡°,GÝ^{ÿx·Qëuô÷³åcÎžBÂ$6š]”Ó!?IWˆª=“×’@¿ äêU´TºZSú.gÖÆ~ûM£ØÄoË”•nx¥S`ËOiÔC°ƒ€åœ©×;¸À°©×~¬uvŽ»¯Û?Î–5‰®!B!-£vÜ*ßÍÅð¢)¡Pæ ²£át$‡þÌÖ+Î¬;ÿ¬ÄÁ©¼„¦Þ0œßíì5–4i”Ñøé·)|õ~û ±‘¹ë×F¨­¸Êëé­¸Ã0	«0ãâ·˜^ó‡^û‡ãÝv«Õþ±ÑYØUü‹Zxj£´Ëd¯„dÊ³À£y ÊNmÿ$s£<Ÿ…öh©Pù©}Ô;ÚnâÝ­wšÛP™*Á$žœ8]ªÃ:YTØMf¯ÝÚ9î½nì/A®éøà«}µ9Io4À9Úô†$Nf]|7tk­F÷x»Ýî.AÉ@@OCÁßûelÏ‰p®UaÖÅ–ý°Ó>î6÷Ž[µíFkñUÇäF×’×Nm&<`•Œjþ`â0G§dx ƒ¼8šÂ†9}Á¬HW¸H]æFóú&Y|ÙÌ¥$¹Ü›QåšÞ‚ „=ø ©´h(aéi I æŠS~®¸ÑŽFY'Xè¶ï]ÈRã	6¤fæ´.©N“óŽ8VÉÓ¶˜·{N‹lEJ“ÑY	.~òÛ(ð³²•Ý¸P¶»8ÚÜwëà^’=´LÅZÁÇ)¥zÁ¸”|Îèw[S!mzÌjæ©:]¾U5“z¢Pà¿Àl
3´îP/<þ^pÑgH©R#ÌÔ–ƒþ…$KŒŒ dƒIˆw.–“dsëÛ5Y=ESÔØí‰þ0	€ô=]“_GLÁ4²°•á« ÇÕãV‡ ÄŠ—´Ö©Ãþ
(H„Â4R³Bè³:Ám=“¹äu!‹¦DàjVi,2´É1¢Œ5I(t½”%j³FÍGÉŒ˜ÿÕgf€––rýsämì?¡5pló£ÈŽ%+Ö¶	Œ]P(÷á^~¦¦6eñ¥ÒV¨¿™\j‘ä§3%>Õ—Î"zs¦Ñ²ËŒjw½„4äYl–…Õ7|›êÄTž)¹2»ù¿ƒÎ*Y>XâÓ9¤¹Ì:áÇæÍÃÆN³F®UûûµÎ„>¢iÂd4²Ãk±ƒ*n°Jf+;…Ô6á£{îŽkwéLªÂ”ªV(°@wG3íæÇnÝ’àÑÂø“&Á£ô¤¥‹Ÿ¾Háãô%¹&Ë!”þ„î™ëÛ^ì
ÂÓÌ7ÌåÄÐ]®â
ßBWø`DôG"¢'p_sº¢fµÁ©rÿÒPt.¥ysé~€†ÓÐ†¼Šº`òô—ÜŒÈéò‚/u,Û¦6ùíqƒ}üW®§¢LVZ¹—¶É÷§4(•÷sà>QSÚI®TÌÎ€AŠÝS¡ }iÚ/„í,úÈò÷w%ñÎÚvû¨ÇlE\¢©(¤¹zDÓuóPÊ¸GH‚"Ù"t>»cÙÌ4ÃÆtæÎœ/U¾ä¸ÖhÁsþ<ì¢ÆR‰f8Ï¯¿¦²™ûõ'GÓ'4M†€  î.65¯WûÉ”øpzh8œš–ïl/Éý$ÂÐn#Çö1Þí)ÍÍ³.}õç…Ôñ²TýÍoÈ˜ÖeIº­°»ŠÐ¾‹ÌÎfS½,,–ÍfúEe38®ÇeË¾§G¡ŠPZiOHà €SóTòëŠ´sPÇ½öq¯}Ú·ýŸŽQQßí6Û· ~v±<°ÏÕÀ}áûüäÍæ´·˜
€Î ãØZ WÑ§ŒUÂòâ{lŽ4Ì–’Ô­-âÝ ÜíÑè"R£@L@vÛ†kKP&ŠÖ<yû5^–€˜|Ðä<£ïÈ²úª’úÉáÒ¦6/¥©X°ÄöÉ+Ú( 36ùgÃjiN|;^3`¨ÊÎšôÉª!c3ÛvH+ÎGæZW8±Ÿ¡{Û I='½¼Â)%J‡£ØAWè™tLû½üðô¬Ä9S¬ª‹8}£«hÇäbI˜på+ò‘¾~—E9äTõ&ãÇz½qØãÇÒa£CÇ~í ¾€Ê»prkJÍð"ù}§ÍwÛ®š¡WB{²æKu!ZÃy+À¬ç[-Ç½yNEÒÜ¦ù©¯Ïái>²*`´Da§/B’žPa­•z,Xýe©ã²’VQ*-½Í¡ØÂ`ÕÜôÒ&¾gÌI’½bJ²M?+ÉäæNËþt£¼Î(Ÿtˆö±*m8#·Ä<B°Ó¨·šóR‚[Ì¢gmÙâzWv'†›¾›ÛS7,ÔvB¡‹ÁŒÇ;:gÖ:‡%å¶¬Y^œ…žñÜº`Åt±];)É|š^äU"ÛáæM1åŸ¿nñS2ìK–p ²hŽ%ë?ÐåŽ Âxä¸b’*±%™M˜ôý÷\˜ôí\Â¤oYõïf&=ÝLÕÞsJ“'‡Ä.‡gPGhj16g»ÖÈí Ó©›n‡rÄ#í2šÄøÎÇA§9P>u`)1¼•pÞ×ECf‚Æ|¾ÌÏ-jÊ,šIk%a.Äå2Dn€‚Ãta¨ZulGq‚G 1c"PMµ2Í%t¢·¦¥’¢2ŽË>Kf¯’–ÌU.{%ûQ3ÊÅ„œ‘|¶7Am@Ê¦5m¸¼ó¾ò€éúNá g¦Œ¿ûÂ™ºâ[2SçPÛ¯=(î¾ÂaYø•hj#»¨* Ðƒ¡«hì[¨Dð¹ˆz1UBªEàÚtÈUD£ÈÈi´su0IÇ3húÞså‚8Ãªy9ÌD„”Õò§YuÓäiLö §Ïƒ,-­`¢bîë>Y[#û
ÔOr«tOslMñd˜J–ÖIÞOŠß˜ð-í:K 7U‘+|Ë½±Ž#°èR …Êná•ÈæÈZG‚0N0ðÒ«òìiñéò¹ç’µ—o¶ˆ|nK2ØJk6ö¬½„êYâ¹Ká¶nõá«è­ÔtŽLIµ55-ä´TO•Ra‘¼GætyÉ%]ËP=œ×r…Ûw^?(¾2d$S÷D>—ú »õÁº1!pß9Ý!‡÷^1û ûÒµb5ÓoP%fF!}˜´QgR†-÷p¼—áƒìÚX¼¹t`ÛfïA	ö Ó”`ÛäÚ^THô +Äže½¿z0@„ÈšÃ±æ
Ô`€ÀºŒ%Ht#r†tc;\Æ|;ØšÍ™k'éœtiÉ¼³M¾’Ç™}ŠDˆÐûH©š•é’FyËºCåÛ)ñØ~F¦Œ„öA}x3êCØgW ?Tš- @œg›hDÓl
©{®ÝmUãÀñ\H£lÙü°¢að1Šƒ1”KCKhšÇˆ=é!êúV+ còY¿þòŸÿüÿýõŸÿU×H.¢‚Ü’e‘³ª ¿M´ˆ[³ª Å€[×ª‚[¸rGÓV™Í½ñÎ“í»Àx%ÞøcM•ÒÏŒsÉ÷rÌÐ?_X[¬ê›§òŠW¤N6eËÐ'?°pJ…[H4ÊâÆéÛbÊÝåA§|5:å(žø5Ê©.9‹Ùª$ÌÖ¯¿üã¿/Má¼¹±µa´Ö*Êj=gÕŸÏ®qÞJ5ÎÏ¾,3ÐË{¯rF~Ð9é:çm×oPélG!­³¼YgR;/ù ½ŸŒãƒâùú8Á5Ï,.¢ñvíà Ñùâ2¢½©&oÛ¾«ªlˆ|­°fES»RNüÍƒqçµw¾y0îL0óî³Ú¾ ãÎ7ÆŒ¶óævw†QˆÍþ0·qçrÇûÇdx0î¼.{Ê”<“Ydõvk§qp¼×jÓ\º–žwÛÒ³èÕaiñÕOƒðø,ðŽ|æ'ŽÁ,TÃºv—ÐÍt{@·™Ñm7Û¹$e˜&†ôˆÜÝ²DžCMØiº¹Ðƒ5+•ÃxnËâ/S)ýÛò—”ÞXdI‘éÍhTö¾ãûrï )·Ãò^îòþìe‰åÝ¡~\zÆ†úëÚÁ^ã¸Õ®×z„áx)g€ÖúhO£	”ù¥¸Åû6”½·˜Ô¹×ÞÛk5ŽÛ»»xÁÞoïˆFOl@Ïõý`@†Â *¼ËéºÛhµŽ;Í½×ËðSrcg	á	)¬‰kŸ éZ’OÜú`{H®Ž|BJ»ˆåÐSRàk©`˜æUÊò/ï$©<Ÿ^’‘þ¬¤Kè]à ÍN3 6á–Ð(	¼iEÈ–·¾)Ó`lê-~§H.)2ßeÝ³auÉù{HQ¥IüxéŠV ¨
®9ôíµ?úNØ¢@­êÙâåŽÛ,è€}•¢À³1M Æ|“H7lq“¯ÂúÒL¯aæú&ÕMKÌ|ËKZ/5m¹¥ÏBiáv@Xkg3KFÂŠ§i'£*¦&ÈŸæ¬T–’Cèð5}o2p¢UØ eUqaËÈÀ¢äß3C‚ þ¬K=ÓrÏ¶äÚ²ËúŒÔ{BÒx”{åNØUGz–ÄÐ66/y<=;þÖZe ²Cü²ò§íöÑOW{âõ‚íÉÅ)]UöÙtÌÚJýûUG}ŸÇD³Ç7õKfJoZ•kCÆµb'áºU¡…²Fù–uF§s™Jûš"®YªëUš´’ ë3[»}çòÜ°á -á«b–mí@ ¯}«šÎôÂ8q…,xƒ	<Óvá”eÖ–ú9À'‹9XÇ#o~k/I˜j¶›oš½kÉk™
H3uù³ûŸZ-’úK\E—àVDÄX–Ž_XÛksÄÒì¡¦×_šœÕ¤`8M•®×›¬uuWàì¯¶[ÀÛ®ékîþÆ	}a‰jk0›#7Êûï´'wÆønù¸Î4µÏ–˜¦6ƒh,Ã­z‰4ðVo×Nõ[°5¿HÇê¹q¿p:[3‡_ª*85Ã˜Ñ¹CìÅàÝ‘¶·˜É¿ÐÎÂž"i[‚	·&ó(d=@Îwa½K—›rßÙ®#8´L÷xq!g17xu%'ÛžK<Í^³ÀRÌ‹À°ödHþLuHÀdv0ÌÁ0¡|\ØæHñkº^ëò(úÌhï­pjê
à¢hoÌN0X¶œ³‚¹3Õç€>9(jålGþuH‘ÚÎvMIŸN*é³€»JúW¸ŸJa¿”Œt€_ 3Mž¤º¨ÐÇÀQfí@M	€Ï<HTXôešhQWæ2YäélÂ£œMû¦0Ë³’¾O6ÒY¶t6L¯NÍ×ãÔLõÜšE¤ ~çÜšQ2pï›÷x\›¿@×æ¶„í7èÜlH!÷feÃšF–É.û¨¼üŸ²ºËáüœœÍ¬ßÔÝh`ú:ƒÆÇõöA¯S«g 0ð2!é¢ãzc{T—Ëñ%†ünTŸDq0Zc‹Éœ¢²ÛU6VÊÜ¶º	pÐi¥ãFÖ¶çÑ±¡a!¯Â_oÁd«}ò'§WÐž4J7G&äË„²ã}ØaÜ]ƒJ_è@ÉgKDzá+d½RGDh¬ÒšlF¶´e«jµjÛV7¿ï”ýæšöàHÍIßâºÑÎæ’Î€Gñ ÅÆM‹Û‘…/d¹5/Vq£²J¡{2
Òö½‹²©{‹Ò~©*GŽÔP”àt|Q`1ÁóšaËQšŒÎJôn |ˆ_n”EÏk4vÖÞwëC÷l(·-o³>÷‚±Ô÷w[Å»†fÅºO¥a_jÙiêlA	¢³_¤µØqNí‰ó÷«)Ø5ödC+TR,CvHg{;&!jÍ~tàj67ž­Y[O…ŒÒv½“Éè“ ˆï,QƒæüaCÉ¾F’aÛ“kDjFZáÖÁ–)}¶_$¶|O6 ‡È{;ïÂ:!¸Fš•²Nƒw)$¦“—Ñ*JéB´–˜¤%¯{u>4«Ÿ H€ÐmÏîŸ{¤ž3Ø¾@4HN¾ù£¥›1+¥©UiJâQd Û‹iž÷ÚÇÍƒÆaƒüç`i‡ÐMœ8h# ™w˜{)¨#‚P@!mý_“/Ax!ßñ×ûge\¿¡púùÞ«ÆQÜdñkÛí£Þña§½Ûl-lõÕ‚¬½°r'Á$Þv=„¡(¥špÍŽ´‚xûŽ”%¸.XX˜bÖ·:^³Û;nî×öDà¨Û}È'®ÂT;2xãƒé'Ž´Â•1ÿB¶ÍNc·vÔ"ØÑÞ©×º½®ÜÒÈ	Ï¤–ÀžHn>!jKrº4ìþ°ôf5Œâ¨GrO”ùCÉ1giäVÌÆïJ+ãI4T{7Iš.&–¬t€,!8_µªÒËZ‚1Ù ‡îâƒ’\DaÛñ$A/¿—&»0íÜPžÇ†Ok\Àš¢ŒÆ@¥#D‰²EXúcäŒNœÐ4Vü^Vn×ò×¼9³ =©À·9c7*ß8¢Â ¹Ž2&úQtÊ‘Ðfu„(9RÇ.nz	m`Úb‡¿ÓÜvb¹OÀöytŠ‹\ó­Ðîvƒ4+§B†U_à\cƒb cs¨ªÎëjþ)2:ŸÈxèÙö‰Ç¨kd­ž»ƒ¨lBISqý~Gªk¨aªiÆÕsÄólüP<º’îtÄÐâw á„iXjußòŽÞq¸?æî(+EHÃB›º8Ê Á?EäŠa°!¥KóMôÂ¶Dã å[âÑ›Á¤öÖ˜ °©üª^]Ç6#žŒZÊ'üFEŠ“ÈA÷=qýÉ+¬Wlù#åÑ©‹ËmU±šaLóSv¸ˆYL‰À^jj}’ò–§3®Ê‹“e±«$Œ×â#Ôùn„Ðúi·vÐ]#zoã°¾wqjû:³;ƒS×›`ES°ö
Üu½^ó`OõOzÈò˜Ð
LƒH…ŽÕ,âOñ@>We—¬Ù#õd&'Q?tÇ€6‡¡Ûw8äöÕBå8Ö${ºÝUwWhÁé!Ýw²â)Èó×m¯?ñààr}7vmÏrü3rŒÀÖöäu?9Rû¬d¸{7µ?H¦—¡Â ŒÌÕßZš…ÂFesËúþI„!å0°Íõ'[ÃFY ¹&7šäN"¥Œ`ÀY£‘üXasC©“ž;†¤ÆÌ3¢3 å­W6²@4Mx_òyDbˆxq8	ûC‚«M\qU+ ÝˆÉ·áÙ6D¶ÖnkýéÆß XâêŸL.,7NÊ1Öi‡ò.ÙàÙJ Ó`…™=Ò¿J	pÊBqleíO õè4v	vkFDŒ)#J‰³ßÁ*J¸(bUULK‹Ä-ª"Žè"9nìÅ{aE	€ùØÒ­þKµÅö ZÏóžà÷'±Ü=õ÷?’ªï¿ú¬ˆ\®õ¹‡„Ù] #úè8çdï<+—É:º YX}²f•6JåË÷F[Ã}Ò^´}Á»E–3…¶£¸ñý‘¹•·É4Þ‰H?µ0ö~«ê‚6e6TÓ‚íT°ëmù_nôÍë'à¼ÉV³cýH“¡:¢?;Èenä\ÒµwQœyHÐD3Èa¦<lç¯É856ñÄAl{{úiÙô-› Nc€5Jý€¦2¥®‚çÕYœÇá†£œÇé4þpÔÐØœEG		&W#ÉDD®' *CÄŽóç‰©Æ‚³ÅìN<‚Þ¼UMk@wzMTˆiÇ›º]sârö1ÂW?Á`Q…Ñ$¼¤.¯H¯~Ô¦òä…R)è!E¤—£W¶i­Kµ)µm÷Ï×û	—JÉïiŒ€†³Úê1 QÚæ/ÅÞ_¨wÀˆ5« Lå:ÎTù8”‡è:3æ—]Y“×&§ô–¢2¡úŒ§'lqPå´æË äƒ»Áã6_í6³Ãl·šÒã×?jh¯]LEµðbÜ¹Á¾Û'feâ{AÿÜÑzV¹ù×H••Ó…’iÚ@Éz…öFÖ”ÜíK$¦4Ð œ`ºÂ'§á…iDÔ€iè_yžÙÇümDÕdD¼iL%5¹È(ÊtV%9¤@óÌ°ŒïJ#ÛŸØ7¥Íí,“PzßuìO©\¾»øsx´ÝjÖ5ó‚»FË€õxrâ¹ý&ÕÝ{7÷Ž·;µƒãF­u“—Â¯©$5R­T7Qi¿ªªèÍÓ›0ƒ]s¹ÚU¤RÔc…û +µ2CtË#· Õt	ä}ˆl&Ío^$‰B±¦F‘Ð=ôØ¢SŸÁKŸ’ë•ÛwmÏ»°l‹Ó'viá<,{DºˆìAªÁ%˜NYï?\þü³Önº2—J[Óþ6·¸çÝ–¢ßßÓÄuOo`ºëu÷K 4 ›43‚¢lG4#D/º§ñª€ºPöŽŠ¯¸Â¤Hc"÷ÌwÛ°¾;Ží|À”½©VÈpóR•¨¢Š ‹¶?Ã(Ô
£àµ¦ÓŠ!Y™Ø>Ë¥"„?ûiƒ>;ÚÕ>ÀË5‹µ­}eï×¬´Ýü2íýò¹Iæ-$÷äÈ=‡¬­7ÍFûx¯¶ß¸ñ³ë~ï¼7þm IÑ—VXÂÎ+Š„yí4öšíƒZëø°}xÔªuš½Ÿ¾L6tÎÈúÚÞa0žxvèÆÎÉ7.µ8ÀMF°ÒXw•ÆRaå„+ÕmßØ%MlU:úÁð²eÇ®oÕFNèöM•j‘k|}ÊË‹ø"aÛ[ÕèTßçì…y–S²v)#â]áöá‚÷…o±°%îûíŽ™iu­F­Û8®·ß4:à@°¸NŠEg~õàƒ’Š×¨šê¤Ù6$4b	PA%Ûb&f˜ÉØ¹f^gtUe:U+1Ã,‹–;5/
ØPh]€6Z˜ÐPýñÐŽ­¸ÑY'Ž5‰ÀŽ,[Ñ9ÊšæÔeQþÅó4;à?:DVÒÉHSËV¢E™“ÍÑ”%Æ‚–ìVó<ª*¾(ü,oUZÿÂ¬‡°Ï˜êw·¹[ƒ¬tÎ•¾ýÀóì“èJ£A›ñZt¿§î©ýczƒúdŒlióâ VþÞj´^ Tò.Yj5"ˆ€]Y0ê½+À)7€:Jn™7‚B†pIõ±¡ÿ¢Q—cWŠýaô†æöÑ2’v~¶b7öœ”T^C0v
Y\™,Í«
/€W*¹î)$OëÁ©.Gi­ÂÂX8‹@ÎÒ•äýOÿ£œ(»É¹ÖíÁ„4'ùN4T”?y*uHsÔ ë¼&”‡†þ¤°Äšx‚¶ Zò‘!W…™¨û„˜¦eLËT„‹cÎ–kÍ*á*tƒ‰?(	7Kî€_µ6ŸoËpŽ8ï[1d¹óiì¹}7fÞçé‡(&{e$kê!ë)xøwßÆ¡ó!ë[d{ŽüæÏÛC¦ùSª×„»ào\}Çrã•ÈúˆàîOÆÂ¾Ã³o¥ŽŸžUÐ5s´*‘@Ñ¨í×‡v([Œûü0ˆ\º€Â7"Lü(HCJŸÒhÕ†¯u%Þ¢(gVø/±Ní!dà€Ôöé2&aÂR"¥¢#c4ŒÌ¦ç gŒÊÁRwL©ØÈYŽ'‚©ô—€—óCëÔ³±-ý¨¡ÖìPþèž»c0+ìNF#¼ïß—8Õ)Ê x]®6Hh	ØÁ‡©T‰nVðn?Ç,€4ÎÀ:¹HÊ
xxIØm`éÜC*2zPùS@.y%BÊ—hcŸR‡ŠÅ£fXöÐ±`ÃãrLØ#LÎëÚç„»üÏ'ÿ#%FH'Oƒ >±=Ï«ëÌàQÒwÈÉ¢Ðpù (—o5“Â˜jSÂÄ5~¨iÞv=#uâš°q§J,ØNº]ùy7(°ÕÖD ÝÚÓY)søýÑmì@ ª–u™À['pî~Y‘F	Åx¸G¤­\Á=¢+/t5½ò/i+ò1	b¹L¾8ðt#³³ù:vÈØ³/œ°ë@h_º(øÃ¯±Á0þ¡l–”!7‰Ž¨=„’-–µóè…ŠÌ"vGäZeÊ8CÙxEÃ¨$~‰eV‰ã|U3èÈ9ÆÑú‹–’ŒLüv>ÇÏs‹W<ÿS,’rÿX„ÿ)l-`¬ç¸Ÿiœ7)”ÿªD¤q¤Óß¥ªŠ
¤Ât5d
ƒÂŒÔ­L|÷Ï§i|Î„|¤¿¯³ÝÎDÉgmT¾àTVáC¸5
fí#nNttI 9ZÃ8µs\EPÈÝ­“î¶tÙ±p)æ( ¢CåÃóÜLZ¦Ý@„Â“¹fÜ;L¶)¹VÚ·ÿD¸Ý]×YÝx2pƒ’z¤M¿ª»B€:‘´hn{¡Ã
24HbH87²;V£É<°ÿ"Äeh÷OiYÎo$óR‰.’•ð/âèÊ¯*£iÎã5òÿYã‚ëÔµ
;Æ”q·­Z‹\rM¨Ä.¹ˆŸ³ÞqÙP­(¥\_Ó?d^DdA442~‚ÅÍBÄb*š€ÁWÑÒh¹˜é¡Y.–&J+ì[Æîá_³o’êM-9†²!/ É”c?WD¦0É¤‘Ý9÷ [“éê;Ÿnð2œ¥aºª«¯Æ¥Ëàˆ4×Çñ$û‡‚6}!AWfá£q»§iÙ'&W@1sµ-œ(vÊÔfuà9ÚÞoöÈ½¢VÝhµj7c±¼k³È-)zy?°ûCÇó¨,e9ÑË»““‘Éwl€6[WÉ¬*y+•µ¸­‚©ä"Ú$‚­É×µ¤%À"Cñá0œÁ4*’a:”lˆ÷Ój.îÛ¼¸ÒìsÂ\ä
¶®n‰B)MX5ÃÞê"E&ƒ¾Ú$ª]'†Ê]FÿÎmü°•H×·š
‘´]ø9Kºœlb?ð’©­9ö-7MiÔzGÆrÊËØ¶‰ ØIy³ÔmyÛwVûªQ~)§­\…iŠ°ÊU§&E‰ÂBeÖNÇ|;P‚‡M1Ï¦@#ÿ‡‘¶ru;#]ê%ll¬ˆWî)|]3La¡7ùGWdïbNÉ²JX~žœ…··ø¶¨çQa=}ÕüÁè<˜0YžUw¬çË*ˆ™…UËäÎí³'£Ÿ`ÑT¥g¸×@@ÛÆL”iv‰ŒÕ•›™G]%MŽŠÚò£Y`çUÿ™Kúþ«ÏÒ,/×˜û+_Vff²v)‰º«:cÏî;«ï­U •c¥òû5«6(«mn'ƒ-ö"Lèº?‰Ü¾%ïÛÄUÐš$P¬¦?¯DèšªþÄ÷ý¡íû'‡Ùfê:0TkÆÖÇÀ_!@yˆgZ€×±N&¤³âyùØ²­SÏ>KÁ‰Ø4EaŸÔt*äs¦Egi1À’¯ð '8B }@Üë Òü(Rb–àD`*'š1?kü§{M?ç>ËOe—åBÓOD‡gK§új}¥¸š!œ/ê„@Ñ®ôõZB9aë),oÖXkZ˜£¹ÎæiùcÆaQ–á
¸…nû`ofáKç€‚iö2ÂÁR€}è&iHnþ@™ÉK4!&@{é¹“ýàg_©„Ñú¼àéŸÌ÷r
Nêž9~èT…zpXç9{öF÷­´ïÄ(H–ÅŠäKZ¢â9þY<,4*1—–2ThƒMŸ¢™¼Z•Š3ZëK2ñâ‹$ú’vÛ^©¼FÚcÍh
È|síTm©§HÌ‰ð‡Àu,Ñº^2.I_gZö·j`˜×Æ}uiŠée%ì¨*Û%!	 Üºd‚É®yU‘’JîÙêÑ)øæùrÈ›Jô:L[Ðü>X,S„Ô‡t);O6ÃólH1Ô,€‰Å¾²îà]Q([}iBÛ<tÙá¹“¹oOgJhÈä[wŒÜëÆì˜Í2`*rš€îUEÉ¹ {V4@êtKsLºƒÅ»Œ¼w‘­[G×m´uÑ"}6vÎlf óK42Øi³PfõÚþa­¹·°…ð˜9|]8Ž™Ì—‰u§0f‚Gæ¨¼à,8
§Kth75š€é¥<b)lš°š&ïW†q<ŽªÓÔŠ¨ŠœMÑP‡Ñãñ0ˆƒõÍ­§Ï¶ž<ÿîÙæwßm­o=ýþûgö·ßlçä¹m/Ñ%,þúÔ_öÃ`üõŸ_>ßøúãËg+7u¹—ÁOnøB$´1)Cx rÛÿèÆCr:% ¸Äû¾¹&¢ %;}{4¶Ý3ÿ‘õë/ÿøïýçÕoì"”Oª˜sÝæŸÌq›ÇKù<·ù§iä³ç3ßæoµ¿ø±1ÔõWÉ‘ákëöX0ú,kasaÁ•`I™¢‡ì`„ó˜w¤q kûÛµn·¶Ó¾*±k%Ÿ Ôè(ßrèæ]2²*³Ö÷ˆ¸¦©1d]-	åXO¥Ï@kù’Ê/dN_µÈ:œ´Î"õÙ.„g—žŒbÌdÎ?(yÑiÔ²ÑýO0Ë€FÔB?m72ßk:¯¶;ÚÍƒ½ªUèä:qCRA5uTÕxâ!&žjpvýÃßÿúË?ýË5^›‰8ùÙ<²h~z)Á;§_[éñµ9»4úVŸ_ô}ÆÞ®&Û_®¤GË2|"Án£¼¤ƒpsãæNBw:¨·šõÆA÷FCa_ïQÈÕ»˜5ˆÉzéo¿On §!Á~R©J¡°.ò”ö2!~šõÔ$T„àI7OGåiˆS3‰"´øJøƒjã,B_	%tið®’ÁWëÂïW­5?'¿[.™é¬Î5ªº4•¥§’tÍ•wRêiƒ,ª†w€'›[3¨7t°­ˆrÀÿÁtÀ}t=â¬1Ë$È}EJ¦«‰g×ßÿùÿÿ1¨Jl€;,Ü0e:¯6Ë	ö­tŽÌzýz"hbg9¿ž,®Lu>‘iƒ° ºâêd«; 	FtÀì\Æ†ÂájS¦bCi•Ö8‘Èˆt|µ'ÓqöÚG·áÆ&|L+Di‡–òm‘pþ¦¦4¥D/˜„SŽŸ>¥g¬på$Î	¤ë ¦CÛEåðF‚ò@Ô0FDÐE€#ID¯nas<~lcÁB€,6AÁu4Œ9jÆê;žsB©°µúŒ†ç!ä”v,,Æo=…™Èº,ßÚ¾Ó…6ÓI|pü	Ù®_­¼aŠD\×ÍJ3»0$S«ò«·ï^‘£´îÄ˜F[Û@%z~ÁÔ‚Ð57é‚õÎb+(¥g>cÂãÜð(“ñR½¥{ÿ„ìvå†÷Bi	GªÍšŒ\H@¹{‡Nÿ!8“ë8&ª<n¢DAt«®É_öGû¢¬ôÉ›èNNHÏ"u@Õ
zKEbt‚ÊMN{^æq:9©Pwš-'âanJÔ²|‡ÁŸœ~ÜIu]	a@íçC“ÛDc`¦nË®Ëx±ÉIcç2„ÌEdhñ¦AYM›¥=¬ë¸ VbãÄZ¿,%†üö¥õL0=.g;tJ€Íe
ÐÏæ´T9*äfÑm%h“·Fh?"*©rA¯Â¢°…Â3ƒ”Tâ U:“`©~Ë¢¾‹×“~¢xµàaÄ}÷Jü‹™\Ve@‘ÅZY%ntÄéÀKëÑ#¡-a°ØÂŒ)_'L|r€øG!¤ôÎ–ñ€%³/±zQ	˜_C!©ðbZ5µ„AÍ.ÊÞÅˆ¡óxèŽJJÐHièFúûê,GÐºèW*·oþÂolê·ä½°èi|pn'hÞšš\
ú7!Éþ†¬ð@GX|ßEûc‚„€ ¯¬÷É¡@n,R¿—ïI³ïA7¤1XØ7ä:Mú Ò\L®¸c_Ù,×¬­²a‹FÆ…*o–]#R§—1VÔ TñÆùåŠ|§d¦V_òé§kxi‘ûžvïC›M$d•ì˜ÔÆs™uÀ}OXªËÊßùç#A¹2Ì.K0˜¨1H@ICñðˆg ½–êÚßÜ¬n}o+£ŠÕèUL™r†gÉ)šD€ÈE¤«,]<é*k€Vaz†ÜÝªÜ|á™~û}¶e¾ýÂSèü½ ¼”«â¦2\¹~Ö=žK	Î
[_O¢¡1“âNß„×­ÿ  ÿÿì½ÛrI² ø^_‘ÂÔ)’%x“•Š …oM€R©tdTHYJ Ñ™	R,5ÍŽÍÃØÚŽÍœ™ÝµÝc3Ö/;fó2¯cû°_Ó?°ý	ëî‘·L $U”ª
Ý%™7w¿ è£–E‰Ä4•¡§zš„éWŸF.q|Çöƒ«˜ !;JÇ?\;…P§~ØùL„fnÖƒâ†¦q¡yfÞ{øÕâ¼‡s‚<à+=@Z…‹täwˆ*@’Ì·‘‡q‡4/?ÕÏ+IÌld„—~W›];'…‡ d?µ±Ïr?ñ="/ã$ŒŒ\‡ÖÈH©Å–® }››-†½–XˆT!ø <›7:IäŸ¡åJÉÈsòän÷Á'»ã`å”¶>:|ŽIwÇ\í‘V‰(=¨‡3”‡|šÖ÷Æ{Ø¶i-;MÄÈ:_è8kßTÊ ’L1¦tœdÏ;h}4tkVí—Ò×!—]…QK‹(Ï¸tLØÄ$©(†F u3¡À°±Ä¹¼ o/bK*tL‚7SÀ.Eeý¶ºévûóÌ¥ñ{jH9‰}ÐßÒÐ§aÙg"³˜Žu¢-£3';¦·†éfÖY„Òæ§çõä#`ü'Á1«³ÏdÆ1MÜiÉ»É§}ª»7Zö¹qOö)b&ñs¥`LöëJÝ”/6%=P?-¨"~Vß‚öîTh/CÎAz÷ËFz¡òI˜ð÷>1ÂçÝfŸÙn×¯ð™Üôð üo€‘“nô0¬È_jwV$‘˜:î@ù»J
$‰.&	èæ…	éçììú¢SF‡K‡ÁAcÔÑq	‡)š"Ý ¹Aä¹½KŠëO^N#=§‡^ç$óFÎÏcâGNÇÃoïÉÖðžÂìU4è_'l°Näñ\é æ“…ý*”^iç›o”vË¼‡l´ÚY£ö>·ÚJDãžãÅ%šAczŒ·ûþ:›^‡$Ü1•½ÍŸe«nž^yT³@ûÈN¾>FZŠ¥°ÉpO«/SŒeI€$ü†}rS9Õfo°¿C^A‡Ív}çŽLã~=R%öÍ:¼'d«’’”ž7@»Ú3¾¦A*ÎÈÄ8:`eÅV”¨…¥T‡ôÙ1+eðy„/õ »|Û–yGÒpó½&'w«Ôúéó‰€FÝhŸ†§8Ái—–ŒVœÈ«+#ÁUQ€|÷‰“BÚVÙ<·»h#¡ö|“­ uW¨²š 8½d6·‘ ü¡ïÆýk6}0@f²ñTf²Ø-E×¹]´ýV™…Wb+}áâõç³ñ¥
Fÿ­3/–æoA½¿‘„dfÛÀ´Ž,ñìz$n‡Aï‰mXÝdìøVôxÓN.fMäõàœmHå[¥]2ybÐ(mCÜÇæóÜbbGÜ—ÒzcžI4™šÐ¹XiVjæD±Ìé¼!½*'Æ¢š Íx~®–U¢êüž²ûo<W£°ëÅ1 øÈ‚È8Y\xLöð•ë'é’¹æ•–«jGV$\“UïZ’oÜ®++Šf»9ä×ø{c}7rÌDfoUûÁÜ¥Œ¡òíÎšºuu†>cVj¬#
Ûsß‚o LDÔ,èségM¢ÖEuÄ\Ôa¢¯<Õ:*²ŒVñ¡Ø¢59wŽéZÑÜqW*(Õ*q¾û7 óMgusS0DÇõýFý6R}æRÜ¬Ñô»Ú`X$ïÁ«¦Žb¾€éY`„[GÆ—©€®‹ñ9£ým"<]+í4§
©ôù¢¹4öi0^*nÞ¤ŠËN%¨“¿I&W³™ùàu7–8.ßð·œ»MÕWÒ`Ù›k“ýœžýö6ÁÑÁÎ~ïƒƒçû©"‘~ª@—*â pvŸðÔyœãýõÙ¯‰Õ…½*4F™:É)6˜þu†™)¸É×Zcí<o6wë{õíÏ!î4È’pþáÝ/ïRÛîv¡Ñ^Í¸Ž¤è)-h±TM}Îhºjxâ³¦=ÛßÈ²8¸¤×ßj-Õ2eM¤¨¬ú×3ÅÚwY3_â†˜ /lF\V7ÞÉÌTž¯Xì!sóÌg¡QG%» }CœkÜbÔ#Ï¬îð´½¹~ûâcOŸ}_Å"ã:KÙ¯AT:ûÛÛ;évG+œNkº(”Ÿò ¸'#›ý/r'äa•zLðbúê¾ÑhSì%èÓ÷¶f eºò*ßc0×Ž@—íÖöñasûŽeÉ?0Fô{œ„ÛþÙ¡wFá#ígýõWþÙÑëãƒúk´Ó;nîu_ß={…A'é{“Íî"ó–,0ÓØRq wóÏ^E¤;àRVV£¸—ƒó~³¹U?Úé·ö;­­lJÛé™¤1Ù°ç} ¿ µmbˆè¥t+;"öh$Ø#ivxÕ»QmÝò–ª¦£(…¾8J½'o0oe±,sqÕ³Ø’áKýúÖðˆžÌbì) iÐé4C[ÌžJDfÒ‘ÀÇ#Ên¬Ta®(éVÑûêc/JWÉ¦ÜVx˜”ÕÉe¢P†¿À3U%NÅpëºI¢‚³V©ƒ|ûi!ž78ô)":/¨
„"ÿj«[t– ”<mó|l-Ë&-Å"ÌºFNÒƒâÏb š†Z¶²“”â§0ñ¸ÿµÀlKàEMÁµûú•	Ù‘my’ØÑg[GFç{g­² Í0°ÕóRum+[”éµŸ''ÍÏ¢<
ì;Kv-àM"))»Žñ–NkF{Ÿ0ƒ2k –ò×r#Ì7•F,’‹r[v0Žº}òß…*å‘ø¥l™=µD§â:PÛ	–}Ò³,;ÄrÎ´ì³×´‹“Æò&»¥J[†1Ýé!>ro”jo/<ñ)½,õ­~•¶j+veŽëÊñ`í&"ßPö×é¸e5õÔ…ª^TÆÀÑšºøÆtè û§–»Z¸ë¼•¯SKëçåz0
Lâ…x ½Àç¢§S¥˜{hÆýeˆg¦¦J7^Ðx<ê®UOµäÌóñoèš*v8¾JŸ=5>’Ž·Ýl¶:Ÿ—x.<:î4ë»m;«_|AM=ûAËQ¬Â«2W ^½ÕÀðKz£7âÁÑ«Þ¡AÔXAß©þó‹æžGã>œú¬Iˆ¾æ×ÜÀG›Vó·üx|ÔVN¡Çžp!dAƒáË<Š”xºND®Î—¿žMƒúù‘CÐÌËre‹ÂÝ™ÀLÝ+Ï2+¼qõeÖzú#-NÃ3gzÆxaœ$%Ò\ã#AWØd)KÅs)ã›E
I[Ë¦rÌç±¦NªR¿F¥¬â{Ñø4q)‘Œ)lp5uüö\G>Rö…ÙÉ„|Ùj¾:>¨·;Ç;õgÍãÆóúÞ^sg¶”èlà';rN›“m°×á8Ÿx–©¯æ”($•¯QÉÛpÉŠåivVcÿ¥uce*ÚS”Õ'n¨á¨Û¢@ÙbqaöŽ¬À]:o2øokRÚùXÃŽ’æ0‰|;ï±¯5'}qùæ­‚ô¼O¹‹´=AÏ8Æ±7í*aî±÷~ÌtBèogÛ3TjQRjd£Ð¶+)ï}1$w¤êÛO<\jìwŠí‘¢Šò(ZüÎF
ß´qÂ“œQò@{ÿJ$õXiœfDî{Àºá²0RJGè™½+¶‰¥âSM,+iëæ‰'¡õž‡IµR©é;‡oD­˜—i¶)y^u¥Yù¨=¡âQ›Ç‘Ò¢ñWàö{î„ú¬€a4ÿbRó/òªî¸‰?œP›Êä¨Çþ¤Îc‘Üê§‘ß€
 úarŽÚLGf ±U?tG‡Ã“‚Ê¬€Q•’EáÐïRµ< Z1L­ £ËBr@ŠÕp$6«¨Êb¬¶Òš¸eå… ùñøàp«us7,‰™¥S÷Ä¾çöà!E€rXjŠÉ)/n WØøãŒë”\l3®{mŠhrž¦&QÖge<hþØkb`•¾˜Y%SMÞ –•í#óÎ#Û‰T IÉò¤)üL'Q¥ðòä*ö™ÀóAZå­bV°þ²Þ©O²êÓ¡àïS²R¥)±ò¬ý®Ä¥z£Ñ<è7_6÷:Ç­½—­Î­¸d|tP•ŽÙt–á2J?ÒŠSÎ/%ë/Š‘•Œ¶ŸŠŒ*¸ÕÂÉ*ù¤´ÉœcÇÁXŒâé¹À/>bd×ÙóSÊa€i|­á¹Ÿ“bŽóññ`Ñ	YrÂìƒ¹ˆYR»]o”¦–…	+2=§º2m½fÝŠ‚J#žMsM]‡¢X`MuÕ^	¬“¥ø'=L1Q>Al8©RsLHSå{7I¼aºZ˜x{o«u¸Ë·_½Óiîmbt‹keßÖ&¦x{¦-?%£Â/]Y¿NCGµÎÐú«5›	†Ê¦1~†r.§agÑ1xëšc-•Û¢´#åŒÐÐ¾xÉ¶¸Ø/·ÐðòôBÙ±j[i8–ÜðÂIn@ñ€…ÆLïF^Ï?Á°¡›Uk*ÍÅr¦Û•]€‚Ý@û—Ó÷Ð"#[i];ãj.Îé"eØu†þY?ÁÞþ·3koãt{DÞÀ÷"oú^ÇÉx8„^‡C>·[)ñ4øhÄa²ºY'lÛ›§<ùÛÿøÿßÿóô1L;´Õ¡9³•„=÷òÞ;ãXWâÁ}Âü0Rç³·<2“ Ù‹É¡˜–Õ€_YÕé’ŽÙCŽMŽ»TÍ4ÖË±0JOD}Æw`CjìÚ¶ÜA1ñB-ŸHHM>8•-ûcl‹°Ì0øb„6Áë§œÕÀ_. p"ÃFf¯wh?²§Î¶|—7di+¾Gs"Xi7ó@½^ƒhâ€_½fa[‚#;e–“áP.8¨¹Æcj—ô£ñIà3m©˜lí:f&›ÍÆNk¯ùéÄŠ_m™$ð€é|HBB*ÜËÄÉÜ™}ù¢˜ï|ÉñåþöQóxkëæNzÀ=÷âç³Î·) ž‡gc–qþÙï:²ßËtþjvlÉ;T€ñ†¨úKW(–±ƒvÔžúÔ“;[tàÑ$v‡¥.cÝÙ‚ïG‡×“³oCJš÷ÃÐî²"¾ùþ“_ÎÍZªZhB•u™bñ–)årË"Ør^xÖÛJÜ¨¦
áUýØ9£3/ÇBÈ¡KGž!$]™²Àþ«²™­Q*F•[³æe\¼öò5ò2>’’ÏÂâ?J9ü•i9üìšàN+ ží4p/Œ=Å’AÏ¾FÙWv­þ¦ò–âab˜!I²$ÙfÛ’¥:ŸUj³DŒžjAW¤º³,èjnŠ‘)Tø2“…-Õ‡ñ™õJó¦½¤ôs8o÷=Ë®sêG ãOßÔïI/â¼`û;‚Æ˜ãÒéc¸Ð>ˆf=Ç=	ÇÌr{Áií«¯þöOÿåëÚØË.ý¹úÛ?ý×ÙP­úvºðè&²N¸ñÙòWf'ˆ»?iwæã¾Û»T3A%SÖsR¾/3ÓW­€5§—-›—”¯Kî7¥€|ªãç»Vã&Àš &ùÑ†cÃÌ¹Øa¶¬˜ÉN>òÂQ ÊP¹è` È!¡¡ãÂaöœ÷R¦pïÚá8êz±»—Ö–I=ê2â€rM±“.ö’‚LXÖn²ßÎ¦î:nàEÉ†Ü‘:ô¦3eù¨¡6ûUv¶#Ô¥œ »ˆc-;ÿëÿõoÕ‘< É0uIt‰JÝ>nÑ$D¼¤l^çîú“3ßyƒaÀO8ûqÁ\§Ûý®—ÍèÛ[=å’Á/â%!œ‚Wo
ö¥RûéÉº‹ÛâFÖ¬çÏt4g-%9×<¹f§7×2Û'Ñð )ÄGÖÏè%R3­l~¥¹Ÿ!»dg¤*šÎ¼ä9<i€œÕZX”edR=áôJ¸f£Bê¦¼P)k²Ï
¨Å¾³
vŠ&3'‚Ecgÿhó¸]Ù<nmÎ&evƒpÜkŸ01ž’™Ñk³~×áURÁìÐH+÷ýQÍ‘Ív2‚¦‡^Ä¦UïéQ¡C8o¯ ÞöÂx"
€S ?§2¯ŠcíxÃƒ¢"<fá òNá\è)`Y¤ÿ8žIôÛHo[ch»ÏÚ	%’V;¶FnÕòýf¥CöÑJ}}hg‡Í—ÍúÎñas‡4Øíç­ƒël›/PiÂ‰á¡2ëFfcE˜ÂT5ÄÊ)×ÏL³HÇ)°šk8kNºÉôƒ6¢ì¶Þê"X\Ëé:“×Zzú!ÉµQ*ƒÀ†Ö,6%—9á]šãlïC7#—\:P¼àFöÝÎ;û±Ã¨ &dõ‚™º]•ß)ÒGÊ‰£JRP>\dë-Y.ØÓS¿ë»tÐ:~â¤l¯·y“mÈ¢[íæ­¶26Vfs%—õ›Zù•æd½®”»<µ”›(d¡€^/¸1éZ3-™]€¾ý2œ£µCÅF
¯W¯ÉõâG0Ýò2\ãÌ©o¾Äˆ?ë:ÚÝtÔÞ–AÎwÑF
¯ÃÚ˜P2Éâ° ×Kõ3í!‡µhi‚³Ëk@-Íjgœ¨ÔË­^"[•”[]ÀÓÔ(˜ßãJ‹ÂZCÈòš½2‚NŽ@`Lœ#ÌˆWöQÁ}§Í‡à×eðè"·‹„ÎÍEZûV1Y¤ÓX0C–8hVfÄ`G4lõ†g°Š=]ïøîïýOÿþF¬|ï¹FÿÓ sº÷ÎÌVÀvLgÕ•§›ÄlLÅnLÌS:öU"2¥^=½qSêO{é&Ýº)õóøeJ¸®0âyzŒ|é¯É?([U“J7®Ã]<ª,h`jz);÷‘ªûfç<ž6ë/Ž®Åm°â¿/fcF	W‘-NjF$ÕTUT`°ÉËMP:±OªGò>PªHšµì™÷HÝwt˜Ò™õ¿9[a„
‚ÝÍÆ‹˜»Ñ§y;õ£A¡œžw´ÑÕ.Æ‡LÊïžh}øòO³\óð)³üÔÖÓÞÚØï‰ÿ8Ëîò,[¿ƒ³ý½·ö7[/÷§sªúòÏ4²`Y‰:O<Èn‡RKÝL[/ìcL‚éÓ¬¯V©5{›^¼hö$væ2©F<ÖjôÆ®`ÇNÃhà&BÞÝäïæ©ß‹¬ÝEãH6¤_Ã”ÉO@š9ˆB À¿cÓ?£®'ÌxÝEµ¼Þ³Ëå?ºô"%ÚPœ„=|õsèK>ˆ÷Ä„ÃË÷2¶¢4‡žù¶Î“ÞIô³Û÷ƒ^{<…Q’SY.bò˜ ŽÔãŸÇ½3¹>ÎÜÖ4ÊN |
°áÓùÄ³Í¥ŠÙ5	eä ÌÊcVÄz·x[W…–´5|æ&´¹*¯0›b“†^Ò¥>Œ0º¬)!3üxËÂjÿ‚S­ß~aLrv9J€÷£9¼-à˜Œ0*ÍÈßcÊ©öà—ÕÉØO¼°iþØØ9j·^6kv6/Ð%¶GVM||Îi ¼M5E75x-Q½+4¼pŠ—1¦J÷nê¥h·<Òÿ¼Î©Îì±(³¡|zt6T:vó¼¸66P‰€Í®™òÎ©;Üõâ˜‡‚“ïÞß½ò°s ¿\øIßù×v³Ö>0)g}øëc^üÊ‘ïžÓFc¸ã	9ÿë?ÿóßþëÿ¶ò{×f§€‡Î`Üí;AbQæ´˜Š…©±À;ƒÓò„h"èýt@V`wúžÂ™ïÂDz=Êx(vÙ»ZYËMˆm$²
ÿí¿ü/™RÓˆO3y[R€:ŽÙzŒîž–šåx|s}¯,:«
¤tOI‹[dÁ'³ØïM³¿ªkÒ™YÚ–åk³Šz™ÎsùÆr_¾ß¡œwINH‡Ÿ[ÕÚGÏv[!¨a°®ƒýv}çn$6Çü»qÙ%^Y8x­,žÇÐk¥å—¹\¾½{[( è]ÓK‹µõ¶o]t¸£kftÊ:]–ZãUxXƒ,· 3À†Ü a¸ÆßäÆõ·D-§$bÍ—õ#tÔü<È˜	áw¡x"§×Lì‘vBþ›²¶)ä]i[-†’oEU Z]"cÂ›[äêJ¹œïœJyíÖäÍ
Ç÷æ ¦±§‹0.<2—ék®QÄr×rOš)|ô¼n€&Î8/Å+ídœbyKf"?‡£\uˆ‡‡žc¸‘ÒØ˜ÝNO'âÞ†…úóØ‹qþ17eà¡3‹âñ ¤€üœbÀ¾øô’á€ÅýÄÅ N=Ùð“1eH#yÉzq¹¤0œÚ¸3Zc2E e,ùÄ^®’Oò‚/O½Æ¦š"¥LnCe^!×®Ú¾Iéoÿò€\è4ö;‹rYs”ÅÑ–JÈgÆ’Ô1,º‘³ëD¬wqñ¯w7TTUSZXïÉfóÅÔÅ¶™"1™+×¹d‹Ô·ÿurô×ic¿Æ}Õ¸Šë(HSPâ$”5Ñ@ˆ%ê!é$ÅÇp†(’ÌòÂÏÊHõ8hðÍ)èú=A¹ñNüT(”ïiÉå¥oJëœB+Qr*P!|SŒÒ)*eŸJ.«‹.VÁ‰u!_\²LF-½­¢ã¦Àµ*ÿð‘ÍEäçÓ˜¥Lc’rû‡›Œky‡›Rf¶ÃM»8Açõuº	6s	!!ÐYäy½vŠ«5	o§8La#¶Nvëç ›ŒtÂˆ¡ŽÃ•ˆ‹˜„õŸÓ¦ˆ¯¶sßv¯ˆb«‰ãÎ÷NE•_5ÆÒ–­ÍwÌ±|û½«wê±´6ïê|dóy'÷‚V¯Kgvñžtœ„`%xôƒK»Õ¬¤Æ4ûÖ>WæF½þ„¬T/<Õ´5xû×š¼"J3Ój4‰¶Hgð‹Éîomµ­úNÎMœ1’I0ßª½â«.“­£æ?9_§R.sK†VùÁUf6Ö‚üLÃ®8+]G/%—d‹×wã~/~å'ý¶Êš¶á=¼V<9Äü{R3¼Gá8U&KÂœ´ž‘¨ú,<ob¼1ÌKaÅ¶1¨ÁI7çmèµÜ²ÌòdM0%prÌœœ#Ãœ"ýDgk’?À	ñP! æ@w£¤%þ`åo…•7Žïš~xÌÆü;¶Ø{³Ê_eÿ*‰*d¿µãÖn}ûNmï¾$Uôõ1mfÛö‘\®³cIªNO-IŽœ½N˜ØífçøY½ñâøU«óü¸ùãïCQþ%T±h¹ÖT9‘,Ò—¹ñ,Òv&ZÉI%§ðpø\œØ—;ô]øçrÚûNs3‡™F]¨÷Áê yÈò{=`²O0¦xÂÁÕ÷¢{ŸÒ]aŽº‘{îýá³pSuêïÔ–åÖ}ÐÒEƒóévë‡/Ž›»õÖ<|\ßk¿j67ÿà rÐ…ó±º¢ÅíÖÏ&9n·FÔy0i«d<ã}c!»­o‹ÂxSÈN)Œ7E^ÚàØ0K£×aÂ›pPìmwöÏ›ŸI\°_ƒ‹îÈT!ÊõŽ‘.çuîPhëêÛOÀwã‹GÐ(gOa2Ç#%˜}Î ¬Ì–Uš¹†$cÛš6Æv*XüLëw;½ç­ž&Øž`pOÔnßcáŸÜ -¡iJó}”ø=ºI÷1Ç,™vû7ùü®|Rg1ïÿõY·¢°Ä·Îºeyµ
·äi”¦&ÅéEêy]Ÿð&t8tÚ<qFï%¿ 4Øè¢†?ÅØ¸‹F2Á'Å13>÷màYõ†x–}<[þõñl"òüŸÿÓŽ0r%CÀ(?À•w~/ævVä@ÏÂ;Ø#0äScÆì"æõc¢Ïj‰sÌ¨®ýŠ˜ñ[o3øÛMü (8ïÁas{¯¾×xý‡Ì—³Ê£È;ºÃî¥y¯3sàtÂÐ(JnàÄœ{n`¸Íë<k„ÙÏbÕoUú"ƒkÙ5Q¬Z¡XæÇm8#ï+¯+/"±<s¼ø]êÎ©#QÏ­tº.õì_þ»Cq@òÍ·<ð>Œ¼.c»÷äòÞ»JíÚP>i¤W÷4Ü[Êšã‘ûé¢«êVVwV›…YýqùyÝøª_=ÔnäÓW‹åbú¦[:—s=†BÖ^p5„%Ùå”4“_4§4óx³Ù©·vÚwI;%ú7¹ûb0J; óðË^ÌLJ`,ôô÷Å­—Íãg­ÃÎóßÌ9)mÝ¤æ/P!6…Ú¸²çSyŸ?Júù³N¬Nf@U³Ò“Ni4€·ÂÎ0Lz|;îPBŸb6.ˆ¥E‘R.jÆ„Q¶”Q×IeOeI•¯úŸÿë¿ÿVg®íÔgõg¯ïM¥R¼ð‚n8 ìç–œM˜^
ÙTO2dfP>õMò'P =Êe\nÊºLÅ¼,0/¿OI_:¡rLÐÔL£$Yˆ.r
kM·]LŒíwæµ;¸`f*†­ÍãFý°yó¤Í×;I´"
	ÏÖè‰^
â[v-—ZôÚoŒ  t^9{áÑ4ÆY/X—¨%º¤z¯\R6(lêÞ/JhšÆ$½Òm’ä9:ˆBé4_aaÄ<³@WÑ1-TsRFe/TH:gñžòì9w`K/‘Þø½1Š%10 ðÿˆ€ Š¸£Qúã"ò“ôœ"½1Í*þ–±šÉŸ9G-Ÿ±n°ø—¿HåJý$ÅµXÖÔ2œ¥£Àûe8¹Pò´¥êZu}ùQeuµ²VY^Zï.{+«W½G•’Ézð#”ü=~<ŠñzŸþ“XÇJT>6yòÔj³ˆås
å»ÞüƒŒï?8[tJ¥…rî„^„îJŠ€›(Ò€h¢º¿ô"ÿÔ·(²Nüú¾Ïyt©BçÙ¯ù”.#½(nQþNÅ=¥ùÊhÎT¿)}^OÝaú¯F¥ÊFr6ŽhñV^¯ü¼òóŸÊ#%%–µèþúö²WmNS4~U]v=ž¦èèÙÅrô°2MÑ.à×òûµiŠž?ÿó+Ýþ4E+ëGû§+åŸGÞÄ²ë?<÷«'S•Ý]ÿñ§Êy{ª²Ï«Ûkþt:UÙþZçqÿ§GS•Ý^ûss=>TËê‡ î½˜ïAJí]"÷²Œ~AóÖªæ,¯1qæ*Ó¡¡eÏ|€¾þèã±,{Tqoª-@J¶Ž-…²mûÃ f7gûZwï•°ØÈÙžxã;ÿ ýäA»ÞN¿¯©‡bOß{—¿§¸Ñy¼wr–P™‡=^0"xéD – %AJIÃ‚~Höáä‹¦[ïê„õ&PÇ<j¦mò…ÿá0´!†´æ’å
ÖP>zÈ-=~ŸŸÝÿ0ž Ä²¾ºxð|où§Ëg+î«ÃŠ»Yñ÷~þ“ßÚîî«^Ø¿Ÿÿ4úéÇ^ãdåìqëçúÙn£¾¼GÿµÎ~ñ	”;<ÿÔnyÛÕød¸û¸5èWzÏëë;—Wz+Ýqï—ÝñÉÊÃ_Z»›õóîÊOÃÖÏ«^/—¯—?­í½Õƒvë—]¿uözå=´³{ÙòŸ]Šg¢ÖòŸ~Ùýùõåžß:?øù‚àœ=}Zšá ùyŒnÛ#–qŠt“¸à¨)¾'_¸.gõL”“·2s²ïzbWŽMYEçò˜ªA8ô.•£’‰ Ò9§ªôøßo$n„„:AéG¶kRB1“b„åÈÅ³Ãž°îkÙQÆbl©­¬%W£<Ùs‰ŽÝ`ÉÄFIÈ‘²£¥}[3e:™¬³¿½½Ó<nî5öö:ÍÃv©6ýâôü§º9$ŠNØÀ…8ãÖ¥ñýúfkoû¸Ý ©pï:=Ø	¶[»yÞÐè…ú¶¨'è·ÐÚz}ÜÞ«´ŸïwŽÛ×;ÍY:ÂÄ?½lÝQì};¹uhQêGýc~ÅÐhBoZæÐ6K/Üq5<@à¦™‚Þç’™6tC3É÷VDôŠ,õ‚uP»õ½£úÈëãV§¹û]“63›0œý´¡¦2p‘p…ün¸­L‘­öhƒ8;lµÄê–´£ã#eÊJÏÊ/:]X7ueä”3„tÔË§ƒî“#t@\eJŒd¼+Ù·C´÷T,1>zb=ôÏµÄcOË`6$¦”nå€-j1Îk›iUð«L‘ÇbØ.hœMQ¶èÒö=†NC¥øÑ‹jÁÚJn¾œpT_Ìûj.vJ_¤Ž$~xW%¼À†´ˆÄÐ8_zåøC2sƒG¬OŠ%-~Ä‚Ù¢<L¥ãæDEè¹»}è-²’%½Ð¤èRÔ»Í§ñuÑPX/3¥çÔ%«R5Òø™Ú ×‡
?“õâùÑ½Ù‡)ÆùfÒ. lE‘¶zÝ0ê¥†÷l–Tš«ÙÜ§k,Uç+ìð\YT»eôÄ”0Ðc‘\Xc¹kRC:^hçÚ[mzä>ÉÆë‚\CW²"ÙÒ©(÷`¿¬¿»{¢0Gæ«ÔFæ~‹tAñú¤a%Ý™¶­=mxXÉÎNV3Û~Ã2?·DÒ™º{òÀ»ò™PÞ+‘ø"n‰Q©)œÌ¢¶ŒzÕt"W|kÇ•vH¸•BzŸgÏÅ­^~¸¾o©"Ôwî42ñïNˆ˜~šVÀÐ%Ø½JÑì`é]Cú¡¹|›gõñHõq”oü²Cü²Øùo´ñÝXâP.PgæûqøHÊ}7À‚-3w*E=ƒ/ŸyIZåÞ³ÆõX‚_]J(â¦â¦à&s“eƒI7”n*äžûêA{òÀ-÷y)LI`êS~ú3¾(è¿Ìÿ™ÖoÌóëÔ ãþg!R­_™&Ü²ðY‘…bÑàf‚ÁÅ‚›
·@¦>!u°
¿2ÐØÿ/%7Èoéo7;ÇõF-ç;»?ì·;3]bP:"ÿ_žE?ÃüöŸq½±AnF¸ÝÀCŠÊ–Hªb½¶8l¶÷w^J·b7V>:Ý~èw=êî(
&já?¡|ÃK¡î]ghƒ²¬Ïe?†Õ³æðÛb7½š<Ýöj±Kg~lÄÂ¹7.»,ç›oÌWâòÞxù&3´æ~dÊÙâ”ø-\ÌoáJoËþ°Œ{^<?Æ#9Ã‰¦ÑÍB:(õ¬—æ)+"™7Z”J%>•ì	’½'HûÔ
sFvp#údí*ßXS2ÿç˜íFží†=“UÙ2Ã`¥—5Y’Ý(’O•åØ«)o4€op’¢Æü€ø®A¡¬SfÃ,®µò€xîÂDy[×EÍjU1Î|:øú|óXzb.:Þ`@óænâ¯É'ÂV#5â’zúà9ë÷WŽÜð°â»à&Gš»kjîc[«Ìì.QB.n	3H"ÛPÎ3Ï_B|“ß¦¼`:#ò[“ÅÃþ3ø£°\ˆ=Îdg	`ešú&Ç*¯MÕz¾§DÊß¦§ÔµxÜÈ£Bºjí„ãHÃæÉh,ž×é˜’q9}Èýì±iÔ÷ÍÛUl^ƒLÃ¯Ö‹|!¶­Ñô}7/bgAÙ Äbx©ë»^x½ÒD2Ö¼±ú˜F›ÚÀè¡J9Cƒmôl3_ôÚ¶j™ä±öìSÊgT£îØk+Y—Þÿ¬¼ãÆlÌÆý€9j%Œ£·@•jÓïæé©×%-neaAç¶¸×óóžâ·–÷a41™rVˆ´Ù÷ctV¥TÂÜcõÒ‚ŽåøáM"C_QÙT5£º°žm–­ýÈbT‚¹È3.0aTÏ©à\=Õ#ô\IQ"Z˜7FLG‚ž€¾ÅaªCeÙ®1T¾Û±}µèÕ‚®ïÐÃjç£”4õSzh=ºÈ%%/)ÃV
Ü‹xì'Ç<ME)»”˜XÅÍ0ÎrxÖæ°‡ÑßÒ|í±Y*“ÂXØBF†™K.ÕözsRpA¥ç¼s‹ùQðr£Þ‘‹S´0åJbç&­¤løšÒœqµ›:ãóR5ïÆ+#RÙC™Rüªú@G–—ýÓ$/<ñ¨ôÊÞ±Í69TÄ,ƒÀ>+}$GH½søõª¸Å	>#ÏííÂ6bZ,%þ„ú’­'êUÄÕþénHÚÚÝ|†)a·Z;¤CÈÓ¾ùƒÞ	¿UxB*ª#ùh®™ðÌ,–F?0
ó7šÅƒ•]½Ê_úí}«û¢Þ:nw›õÝãv³stp÷Á+&dxÑb'k÷2SÄN¶§µÎ"%;~|ûO¸Åh‘©¼¬CVA~žH\œYÅF64jé½ë7å¹ƒ6tT2¨‹„cí£g»­ŽŒd·ç£ÃWsÑ	Bv°Hêq|2ŠÂAø8ô7¹L:ýñàdˆI‘>¥Jõá0&ÊÖR„î‰8\Ù»=>øI"…ö¾Ž+£…CŽ!„E×ó°å8¦·Ç_ÌXr53+€=.½p}§áÝD¹LY®Ä–[z"/¼ôXB¥~·ïõ0ß2#³³ÍGÊçÂÊDÞw–ïµåT«©¾ZÂWÖZ€Š:¿Z Ëâ¡ï®êæƒV½ëÍ8†jþªùc¨æÁpÚ1ôÝ¸Î‡a‹\¯z¥oUŠ“bãÍSxM“Äkú4^^)fŸ‰©®Ø'¹ð“nŸÍƒ%pˆòZŽ Â½-y”¥P)=õ­¤Î¶Bß›:j¶o4÷êNæïž‹d¥åuE­Ôí£þ*H¥ 4“Göšœ:?uÞ¡TIüR4¾W©Ý¿4 ê5Ì«€”3Egœ2Õ6à;Ñ5Là™õí{gUKÚ)€j”˜ 2'OÞe»Á±]÷ŒŸã³çÓç¬H«KYíBšeÆ'?ƒðv¼dóÝ—“ÿ{FéÊ‰\zÞs^ƒ€ãÜ!H… Ž‹´Û	ÇIÙa€za
'Í	Tv¶ü ÀRdÀÒózLÑÀ[sð‚ŒDèÕiàŸõÒÅe£‚!´ÄTÍrhØö,Ó"åðKò‡ŸòòíØô<6¯?=ì²E(XÚEÎzøFIŽÍ>|¡,a‚EcŸ¾‡?ÃÐ9Ç—NDk[ªì¼ò€ð´ŒrÏ\èàÍW4aÅ¬3÷82ÞˆÅ´'º,B )H:Úeìmo·î4ãŠ—êbHž}ÜxHÄ¥÷ pàÕ¶&“E[×Ä(=Åkˆe|ª Ø­yV••»á¹ïÍa_²g—N»^Ì- Í–/Øö!Íê=Òt®Ìa9:gâb€úú™7ì^æ¬Ú`¤s…$i’Ò»j©YþÁXçæä©Ö‡d³gàÒ·ÏmŽ‡@30“«ÓéGž7·èÌµG>Ð‰% Î*þ~1„QÅÎ>áü]çaC¶üÈ#R\ûøü™øž³Œß;@’Ÿ¹	Lð¢¾ÕÂç»~“mXk0
áë	á1¾ØÜžï&a©dÚp^¹¨!Ûó.œ¼žïìGÐ1ÖoxFÎèm¯óIñÅãÈ°]çU=ÌJOÊ|µåÂÐäƒ¥Nn……aÀ†Ù	GÎ6f4ÆW~÷=2«lf.B_€vîO&Vì`icçY“°¼.Æý|Œ}s¶ñtp<Œ|Ø–!³Áª†¡©DÙýÞe{—sÊ€XY¶No
ìY	nüµðVßiRR›xÃ†ØµW}?ñœ0Çl= ]W‡¼à£çávJÛŒÜ³pˆ›ãQ?Œ|WŒq'J18ÙÈ	Ñq·ëF8€uÃ%Àü{@ÈÀï¯=´ñ3L½—€W^oèÅ=÷’ üy»§:­^R±g‘ßƒî&¬OÀoÀýž¡Ï–0Ç	è‡gãa¶¼»~…‘ ¶K	Ep0CûÑ”­(^ i!Ø:œ»X/¶ÛæÜ;Mœú8	—´;—'^4ß;Ë•‡Í>mcØºÙNÍvræóÑ—Š?~	ˆ­ìü÷ÎíuÀ]gkŒXÞsá‘<h1fÞ½¢Qó"–q+Ôk†T ž>”è0ºžV@+êuUçv<
üààÓ9Sç•"(ÎÎñB¹Ô\­‹æ”Tšhlvà¦ÛÓ&åÁ Cvéä^<È-Œz6Ü¬#"Â#kTôä[Aemï¼”:Æ€rk¯beþÀ*àœÚ#"†ÈöCØ¦d‘kZ¼€ˆ¥{î÷ißè"ÊwßãßÃK—êïð÷{¡ÛŸÓÄºSOm³9¥ØüsF3à|!dŽñ9 ïípÔg/wÙŸFß‚0Ië/`Ÿ»Ñˆmñæ¹\õÆÑH9kº=ðÙÑ€ãŽ¡à£ã$$¼`óÅ|ƒÓA¶Ý¨Ë?{ÀèŽ½_8„hW.¢!#œž©¿—ÝC §Â@J÷¬¸4ÇEu¥bÆNÍ:ºã¦ýL§¯jZÈ€iìj6;^âg|­ß±”ÕG™´«w˜AÈK‰gÒ:ÿCŒÕìÑ‰ð)´Ð©b,ú³ŽV€b-Ì
ò©x×œ‚Án8UÔâ™‡7¼y/VU,¿[? 1§/“¬:šc“2§˜MŒdv&ò{!E¾C¾­¥³ÏXÚ¯?2EuÌDÈwÏ½ËE§åœ…‰sŽ±äËu
<¡‹5a®@ÄAã.ôŠãqeT,8¨&À(U˜þ‰¯ÆUÏM3#ÂŽ|ýõGX
Ž <aTÂ2Œù	” £ €¨RYY¥+ÒÇÆ”­$gû $÷Bê2¦¾{¿¡Œ­Ð 0O)¡¨a¸´Q2–ó‹|ñ¯Æ–æ×’ñ_&#×æA*"S.Ü»’uáÏaC‹¬lL¦bÚÏj¨¢«KeëãžO–	‹ÿp<ì‰÷ªÞU«kós¶õYòt‘}¤&T1ÄFŸMR*Asš%’½Aµ…:O+f„ÁôC/i£ò·•Öé? zAíP0Žµ´òRó-'@½‹É¦<àÖ´÷ $Ô²§jÉ3o¢‡6MœÅÁD@ZHËüà³%%X5êiœªµ	»8Áéô¼Sw [GÒ@öp~+VQ@ôë8VGž¾b4ò†}Ïx¨˜@«¤!|Œqz…xÌ)s\¨:©9¯ðX99¨w@H™2ßªêªM‘ê.¾q^…Á9n\õbhR4au&.ð¦ØC¹!¶§ïW,búrM–Óe’„Ÿ>^V[R•r)«NAíU ¶¯A¡Ð«ËÊšDÝöþ<Á',	Â™ì:\&V1®éVJJ<r
?Kµo#ƒQ­É]Ó¹Våef¢;Çfxnåå”ËÌ+¬/ÁÿÚËfÓÌ€«~Mðº6nºÆ¤{&ãÚXëš&þk¬6·ÖrY¨Äuâl Ÿ]­Xm+™Dvî•aA†Œ•œ¶Înƒà›‘PCE’ÑÐÂ”Ù2™9Ì*SRQ‹³:m(%×+?‘–Aô2ÅQäÉ¸aJ¶nfŸÔÌ:À:¸Óµ°ÖF™zB»/(R¤s¾‹Þ¨N}§¹<Ývs¯Ñj¶ƒ’ ƒ’ÈŠ°¬Ü£.ÐÓBZêº´ÉÓQPøj8Bxýò©çx¥)¦kè…¥¥ÿ¿ìÄBX[¾mã³WVq5}™#ºÖ´u·ï·¬ŒÎÚV%z>ótÛl±ÁÍYó£³¿ðšïO‹¦Œ,„eÜT·ô„*Œã«hÛ¹¬>ûEØ?a'³òôƒŠ+[7p±GÊØÝu3k/‹¬ºZÑ¥B¶ÚSDP~ËÝ7¹We¡›¨Ýžíðºø™Ò»g“#2ÄVé„ÞHþìy–©o\aö?kíQ8z†JÑ[Hqi¦ƒJ½ßm¹àfDÄC	ëdd¼Šý3Ó‹·E!Nx„>Ã%¡‹A€ Žx”j;ähû"™¦%yIVh†ÜÓ+×H¦™†èY›5•f–ÅS?¿óÔ)é6Kã!ŒÑÁæ4™—–º DÄª:Q³Ov~ØÞr:‹Ûœ,ŠîqM½K§ÓÜÛz—ÆN½}§I5¹Ñ€oÓ¸àSMÎ+ŽúXØù~—ô´xÄÜìÔ*” hí\¬õÖ»\VËòµ[Èr›¿66f#¶ôbC¿ Y¬j}DC^Sõ¥QÀÞÏÆò…ÄZÉÃó%šPµ¬>OµtVlå‹Y; Ïk†y‹ú>óþ±ìÂ½ò|¿MÙÚÛíãŽö^4;w¿S>/ˆúáN¢dÑq‡1&™!ß*«u¾R?
õÌÛÒ™Ï£;pWBÎs°öl7Â\ò&ô‡(T>á,½Ã^ª¦ÑÓ¡ý¦80eh?‡ï½äSó6-´úÄˆÌóÔî8=žpœaÇÕbÓ¢·´39î	Úv"ŸC·3Œ×I—÷
0~Ë8vUº}6ç±`7V¯ÃæˆP‚fds¤œ›fÎ®Â™–Ó$DìÃ-ÙOWÙ\’ƒî(òâøB Íµ¤ibÁè!úÒ¸kÊühzxÃïWzyÞºËyYÈ³ý6!ù¬ôÿ°ÙØ?Ü<ÞÝÙj·÷ö6;‡õÆ‹ÏéþZ1Þ Uë¾o9(84GRu¨Â`öB;
L³Ððñ“¹øiyøBþ=ŒùW¯5‹˜÷lžÛ4ó5‹•^’V¤f, eÎ:¸h`¹PÖj0ü¹¾«9v_·N·rçeºyˆòÆ¬ø2)ß¬tçOG­ÎñVkg÷3±¿gEÓBèŒ4§Öz'Én–L•9{ŽA·¡àià33ápë1¸IÉÔÂÐ6i‚¡.?â5¿&„ìärËóTr
÷ªå¥· W\ÐéÓ¬ÁûÀß“;U¸t¼gtµéd9?ø…‡a+¥ÑÉ>35úxÛ	o*òŒ!¿‘S FX±cŠ|`e-¿ûû_ÿå¿;Ï›õ°ÍœÎîO5G	ó«+qWŠs™bD3¡ìR†càžBäXûqÏau$Å6Îû9w…¡×xì¶ôë¯?¦ù€[ºbž-ÿƒ×›_^¸Ú%kÖQ0ÂéT+ÿ@¢ÐÍ¿y„‘á¦ÊB‰ø*3W—'u0º®8'^à{§×ŸÐ7xªÕSv¹“±MÎTžÂ1à¢i´›õ ç£ÞÍváp"I‡Oæ	:ÜsÚì—1ÏòŒrxŠ!{z0o§ã pbxÌK§+öö}šÎò¹Ê“c5Ëº´<iæ`Û†0ýœÈÝÝ“h<J {ÞÞA÷³TÚ¨­Ö¦1½pÊ‡uÑ”OïUYLb­!¦¨Äƒ¹1C¼sŽ<\gC’!‚àÚåØèzû¹>ÐWõÍMgk« CÈP0ŽÇh…¸·ï4öww›{’sÑ÷†Ð2.5¼:ÍáÂL¹¿üâßsZÃÞ8FŸ7Ÿ®Ã#æÂx
‚-Y'žŽ#o
RoÆxÜë4iŠû°îåaÂZö\!UK™ªOãÀr÷f
Ìjjø|Ï"ƒçÕŸJ
Oo*–+3Šá²Eÿ×êlzeBÓ\ÛÚ‰Ó*ìjUâQâ»ãÙ8ö‡ œ;õÓS×ä¶™ÁmcEÄŽÓi÷FI%½ýN«Ñ¬ih,iQ¸ýí^˜p[ë†Ø‡^Üå[_}µ%2Þ¢­kÄrâ.Æ+¶CÉ>KmfÑ¤†‰|ê iaim‘¤=„ƒ÷Á%ö„Z‚sDE6»ÝÞ9ùUs2J'k]X¢žz8q²*ŸQÙeB_(õUÛvêŒ§3ÒuG¨é‚Õý\™Yý«¯Úˆ;H‹œm †CZFøÊ˜ls”æç–$ßh8ÇdøšÃŸ“ô"KÈæµV¾*_YI:/r:}OJ`õ˜‘Zx2…»/Qá<­'ÀTFjea­“¼®Úi³ÙØií5?Ûh]œäAl¼~ºyf¨V9ò·tE\ ¹)ÀÚp •ÖNóðøèðNsz]÷Éb'])Ñ0ð™½ÛJÛÂAØÞjWát;ˆ¼ï‘LZï7ïa=a—9ù°ÑˆzäYÎKñž§*0s¯ŒBjÏTäfY SÏŸƒŒ/íxî ?Ä»tø­á¹Ÿð¼ ì†§lqÂgGP8…3$ú“Û(K¸Ü–Wâ‹áÆZ¼¤ø"ÄLc&2ûØ&
´!¯ÅûÂxz©¥²Ñ‹IÁ4
#Š(ç1F4fhrÌ¬1G:Ô.äép«àt¼Eô@Š‚Íþ~éô0U‰æS½l¥’¶™£åQFÙÙ+®:.plJ7å¬ôÙN¤û/ÿ Ñè_™DK¤˜YÈ´úÊüeþU)3¡ .‹Ÿ*Û›»­æáFd¾{’ìqe˜NŠY«·Kd§ÞÊÛ•£´ÒÇ&OÁš…_~?YôUÀ)ï7`]ü	6¤ðú(ñ4v˜–eÒ”¯h*“I=&_21ûbõtbl'½EQ42ÜC¯×À0#‰Vÿ•Ió1gö;‚67õÃÅœsf²™âaø¾8Ùœ¸9QyÍ(0x[ºWÔÍi”G¾ÚÕ/ª³Û]å’Ú`¥aš
Ç^NB…a„]ÓX@„6&}ýN;õá™ÇŒ&€“¼rÂ=NÁóZl¦­q»MõÂ+NÆÃ˜®åæx@M-=—ñfþ¸Bê•É’q;LŽúÛ)0‹˜u#iê”@TA<´@˜"§s5»Z¶dužÄv^M\jà+v`~n°ÌnÔCÇ\½‚8ì$†ÐoK¼ƒ)ÜòÒå#®Éº‚Ec³¦ˆÅíÄãã(:÷ÔÊE§ûÌr¦°‹OBöIõÒÍI¥šdäÆIz\àêÇ,œ	~5”öfaû-€ÒÀÍXhf[Z-õË#æ©U W¾1±ôß™¬-XèÉ}´ƒŸ}ò»‹”z¼Ÿ-,å¡¼%B¯s=¼ÿ„}4Äíç÷.‡üÁ’_“%·ç•šL–Ìí<íµSk{ïXvåýY¥3úGm`èB\þâzë³Ó¬c²ï?è(Í{Í%©í5ž7_töû­=iE„œH9‚Iì¾G-Fž…ð¯;vû¥-'K
-\²\Š‹PÏ‹D ‹‰¹whVfZÆ{j˜ð@¡ë+« 4Í:ºSØýa,¤Ùp0(Ç¼:2Î^à19òî”aÃUêÂÓã¼ÔÇj&f>Ûéošõì—4û™XÏN}zZ³‘*}¨Ï@öfàFï½¤áŽp0'v8øò9,COùFª!±¡ý0èQôm%M`Q,ž—a0Æx"Š	ßh,n>rvp“tFc–tÑ'~@llEæïøÓæ­È{Xy ØÊ}6ÁÈ¦óß§î°ŒOÒßç!•ü§˜+'q¾×îÀtêžÕv*Ývë(}ûØ™ ‰(R(n!2…äæÙÑkNk,dÆ%;9F@>=Å¸'9]Ÿ–0ñ,cÒŠ§|D@*¬m•¥]¤ùyà¦i1]ìíŽƒÄ,Ð@“ªÍ|ËbEÿ¦ÑÍrìZ§T?1uÒVËY	ã¸/°Q¨ªœu•aúPcl:±¶Ã‘ËÀ2ç`…*ÙÍº#ÛÍÉ[2òÎ½áØî¥/×øuveÑÂ}Çû\èãÅ7PÎ¢›îÒMÏºK—Ò]J|+ÇsÏÂÑÂ>•„£2é«‹3 „Ù/ÜèöÑƒ¥Û¤Öáé$AàÇÍ¶÷³£Ã½IÛûÞÕ¬‰ÏÍ?O¼ÍˆZ.ÖJRP˜kœbÕrU‡¢ðø†Ì›7Gå¬š)(sñ@SO S¦ZäGT¤ºÆ6Ü­¾hvò7b*3'èó™lÈÉÌïç½ñ~mfó ±õúcóK‘j¡õH|x´}pdãïÜ¯#›‡B¶O†f1ÐLl[N
’+ MpçQÖÜ¸¿?N^ºÁX»ÂÈ'”öB:…×®HÆgÜÛì©3/7š¹NWtxîNtÛŽœÌ]–ãŒSßivtŸÙŸÇ¬ËgÌsÜx›hŠ¦XÜ:	L9vå¸§	Æ{‡q¢o!†ƒB{„¯?î1ðÀ|:¦Ý=Bí BŽ	»á`xäiÜƒÀÅ^O6V˜!àåò5|PWÖ¬ò§Šx©  7šJƒ¢Nç_fU€\¸ñ®ëŸ“’/Ñ.åû¼’ª&¶R^û2<óÃdÊ{R­“{]–s[¶„é59^‹öý%<!T “ý—U¦?;õEù§'Y_Ï {¤®U0)÷†[0žÓÐS®ÞÓÆ[<¦œgÇV]ï“»Øø)f²å°ô†õˆ8Üœ·™NÜx­qj}a»"Ó„Yù„ÎþööNSÜ)uZ;­ÎkÓËûxWÜns"(Ü £/¶z¿ð†ÿÔLøÓMÿô IP7œ¥eŒàº¼öeðÒŸ)œ¢y“ö$vY á}yµÞYoÜ¸_š~DjUsT)2Õœ{ÎÜ.3t°Yï4ë‡V»s¼u´·y§Ñ”¿Ðã\%[‹×\„—­ÍæÊS
øÒïya¬2oçôŒ,†ÎÑbè<Çb(ó8O-¥×¬…˜Œ†Î¿ŒÐxlä5urfXhžsª¦Ž5]¿«¯ç‘ç@(:ôzã.±Î,Z·i6ød³Guú¾ ½ÇuÁa‰ë…	,ntÝ€A i)¾ÊlòÜf,ÔÁáþ6E’~Õl¾HA±V|˜p?¸Ü{™©|â<ö k÷ð=·fÇxh~Œi5‚Ë#šO4¶ˆÆ“±u	à‚²$;äÆÊØŠ ‰Öz	ºÏ—WHj[.š5ÝzõÃDöšt’eôË®þ±â ìù§¾×S[vHP—ù›VÍäÕvÌ${®P^¨ß¸ú––Íb¦GÆ|©sòÄeÍu¹Kv–ÉêBÅº[úúàsHªƒéÈ7•85ôR½73{é9nå"¶ÌùŽç:¶À{s0Œ¤jYÈ3ª[µU­ðª˜ø‚º9í.Såæ‡.‹§…‰æ@2È‡³l³ÂúàÞ‰ãÁø£ØS¢“™prúS%@¯únà9'ãË| +öÉx,Õ=%.ˆ pF:!Æµ?˜aÕÞ…G ÝuN4ÀT@ÈéÃ*xF¡¢Æ=°V¯”²êžiÕUÜG›ÿ sêãn2&.ÓÀk¶›Rq(…³e›LÓ×„µï¹fnVë9l
¼.«¼lÖ•:‰5UýÒå“¾oíí}µÙÞ€“;/XÅá kAb£Kýl ]›nÛ˜sTÔDÖ¼¤b™WÎ‡çÀáos{bRS\­xäy¿Ÿù~ÖóûRóO4Ò)P¯$Õ	0`]‹öcž-¤®>äyÞm5xo¿Õ·‚Ü—b#ñv!ÿœØôºpš÷ÌPæÍ²üOi/C–ó5‡ú4íè½œlÒÈƒBÏ³q¾-Çü™_ZS[§*©-¥ÔÎrŽ‰IZOU*=Õ}«oYBC³ynwiC…ßÝ0'WT]*ÔC£Zš%©¼ªÃº/Ã²U;ÑáÉpÔ¶u°¦gÉÓ˜µ!$õëfž>¾Y‰ÏÙÂT ?Å–ÜÂ*ÙõRÙãS—Y÷*­ÀâòK‡•õ…r<>‰Ù¯‡V§‰!åÓ+5Ø=;oÿþ×ù'k¨ˆqŒ¼<U`=8‰Â¬yþ’[[>¥°6¼1™÷RÜVäÃÂl6a-‹»«WwüÒ‹ˆC­i”ë{dlUN0_é•w²âüÅáÓøgo«ãŸ%b`dÿ{Ð:³~|@ZáœP øq)û.´ÕO’Q\{ð€\!){Ø( žÅàÁ¨&áRu}yy}¥òøñ£Õ‡—–+'«Õn¯âU®n\<­®U¾éÓ¿§~ò´…£oþüôQÅè–æJ©h6ËCy^í1
‚ã²@•RdN/˜xO£RàQ8™´î‚ÞÝ¿Ž›Åõe6R'‹Ï»ðð=a¦«Ìð÷õÇ®t§wÏyåQÄ—³ïôx”—Ýýý=Úÿëÿú¿>ÄWC±dÂð=‹mÝ¼ž\ã +Þw"›†eg3ÎAOü8ÆDÓA™€·(ž(ö#CÀZ“X¢B&i‡ÊNÛÇ;EÌÀãÈtÙ‡iÇHÈæüaì½²óÌ?°˜Fb¸Ëx4½îÈ›ë9ƒK;N1¼é9æ_Æß¡ÖDÙÙñ’¹&>0Áÿùß½Ó€¾Õ=sq ¼Èñ?ÇÏ”ÎÉøÉ®“3LµÇ¾Iï—9šåKæEÒDÉ6x“/v×*E$j:ó”^Ú@Lh¸ˆà²«ÞLÑsM7Rƒ€ˆ½®f=TVÖšq?*hÕD¨zƒEå
¡«©²d¶ì/Ò6¡œ	•]á¢kCž(Ð®¾â!¬Ý$õ†`ñY–ÌÞXÚ.îYþ þâ7EGÝÈåá¨\º‚f÷¯ÌéÝ‰_ÃœGLºÃÛ{wï©E+•¯"J÷Ù¬z§5KØƒžmM
Ä/WËlTa™¨YÚ¼þp¬ÛåHY{™¡&Þ€ÕšO~DÙ8QŒÂ­Í‡ìe8šiü’ÒšÓÒ{jXÑ…·J†Öv²fÆìtå”’”L]ÁL# Äœï·-Ü¨,Ha
_‹Ê!mI†sJ#Rò[[ÂkŒLŒÝU:$ÕF?ï‰Fæh¤R”©È»`„M•®`×©ß¨LÏì¢
Àúé‘•M2>*Ó³™ X‰ù¨,Ï ëJCl(§¬Ý–(¥ÞÚ¨#ÿB*M"E-)’–;³aWÙ=ÝŠdcÃy”e%A¼ÇXzÈu5/‰1VHÏçñ q¤’vqÂ­FàJËNÞU ¿O¡Äaö	£>&i’±J¤L)o‡¶?¾Š!Ýûö}BŒç=Câ‘;ôÂØÌg^‚ù¡Øtž; üShŠ=¼¤þÇååí_þ¢ÈÒ0Xþb	ª•AFHšTîÈ;×‚DËÞñÚO´Žx1õŒcU69rônApbÖOŒsÈøqbmC›QÆâ¶e2 8Œ’ùywÑ9¡1[ëž o}ã.,¼©d4–!‘`¥3Š×XÖ¶DeS{7–)ƒóÀ1²Éèêª|èbÖ¨š6QFMLˆ‚!_Î™MÒk»,i™D\ä~=ÊRIä¨0ðô¼~;ro< P­%Îfñ{–`’XGµV«I] EwuiÍ¦"—¨^³uj`}©Z™ØBeæªlù ª pOjdöQ,3SOÖÆruiÕhcjP«\º Pk•¥Ç•¯´%çzv¨BPdúÉÒ`	ú™Êûó3?[XØÈ”hÆ¬›0‹n ÕhÒ„¦{B'cØ:ã¬„ zßg›ù‰ŽÔ~¼éŒ“ëþî©9ãpÉÑ‘SwiÅØ-0¥® ›ïÙÇŒ¼ÂÐ‡j…²yc<õÅ2¾X¶¼XÁ+–«øbÕòb_¬á‹ªJ$ixïJ_L'I¤:¹Ñ¬ L`¥J¤‰€C3Àã–ke"oÉCaŠ…$aØßtr®P™/PPqžùApb>•çpÊBÇå´T9Q’í‰§xF(	ÙpJ=üR‚9(E>°Æê4À!
¶dÛü»ì¤±¾›FLéB©…#­¹«×à_x¶›ifGŒ¿b1™É;kóÊqç_±‰åHÎ,ŸJ‘5YœuW»ß˜>‡8–Ì71>_$ÉêÒQ5é|Óç+ã¥ì`^(Z‡¥å[´MlM|™Äü[&ù)xþ<©™6KTj ¯VŸ¬¸áSd¢pÄ°1åEÊ5˜W]±…bÁbÛzjDÎðˆ{çÏã0I³âÓdp…·ðßä½õ Y”§¤JÄ†£âå€Á˜C~«ëFg,_²óT²ÚUë\°0©¨u0‹xÆË¬¯fZ#õ†|/ûY¦ÉÚ?UÉ	4zQOåûLº×¯w©`#;¯:}Ò—Çlóûñ†z8sKÜÍ“Œe°³Á^_W¿Û`XQqWÚ^³EÕyTÈÞø=4öêð
ˆÞ|‰*—Ì€^™ô\ï3°ºfT›óV•ó¯ P\ú8tNÜž„åF©´ÀyâõÝs°<9éÛ
½òœÝFt]Kpø·Eªî•…·ù“mæ¬Â©;Ì_­GÆŠ¸=NgØU¨Fí-ëÅ&¯Ò)]LZ£Òî~çyó°´è”öw·×Ív»?Zsy•ú.Þ	•ÞškZ8»úZL¶¹3©«·xX*”sPÊÓ³hnÜýÓšDMg=Nî#¦¾'â¬Çé#5ÛãlÇé¤“2]©¢CWÓ¬1ž(ª
Ó®Œå
nþÈ`#‘m’€ËUM¾tM¢Ú ¤¿•1íæ¸Š­.µ¸ÕÝn¯èád‰P§d )ƒ1Ñe~/È¦ƒ4©ÂÚN›…ÅóH?Šr*ò„jU²"Ê(4/·áìGðýòÄs.aX'^×ã-ÓŽöÉÚ˜ÊAYÞ•Ö¬¦‚ÛÜ©Rä…*éÄ*N£H–5ÉD® >Œ÷%éÀ#L.0~}àÙÑXÎí!á§ñ&j¨=ƒŽØpYã×=BÚhÜM¸‹<Ò««wJƒïäº¯\?YÔðÉ”‹žŸ˜¤º”]¶ñù©ïmfÀ½Ì|–J²e¥4™øy£À®’	Ÿ¢4]À“UPb¼{'Ý5½cÃÁZá.ÙiÛ—ì˜öƒÔkV¾¸bV`ÚL/0ûWÑõèÂ“ºG^ÖLÑµª¬e*_}ÒøÓú•]2(—®Ä%œÊ1—CÛ/hÅÆRî(UïíFSr– æ ÒÚOd	.š Ô‰ ­P=ûç±Ë\À†äô½H™¶ýî8ÀgÌÖŠÑCáà½g,®çÆ—¥”Ø¤ñ4IG•gƒ.`ñÆÑù1î™Ì™ 3ç€Kí÷ç~Rz¢[‘Šuü÷ð½½îKQŽé§íÅäVƒðÂy6ÆÔÒfÁ5	r¨¬„PÈè¥+Ó¦:å`–×¦ÌÊ´ƒ‘G-&CªÒ%ÆˆTÞ‡Q%|Ñæ 
ÑÝ'ª½s»Iy«ñÝGSý aþ]z¸‡ž-Wß#æ‘³»øÕÕ‚ê€óæ,sÜéùñÈMº}Ü¼p<q_œyÉ/g‘§2¨ÑtÆwB² ]Ä¤â-ñ‹ƒ¢âó¸Kå:+ã9ÃÃ’jî¨Ï”úKå]('‚\—?Rª–ø;š@Øö%	ÔG²PÄ¼7¼PSàÀ©/ê\1H[~äPÒˆ'ÜN£I9à‰KáÝ!'&¦¦üŠ,Y‘ùy‰Ùaê[©OÄ9Û;ñb¥YúÇ8Î½£º"M‡ÛÛæa>âËa×™WØ)Tgôù#êS'Ä&ñF}’píÒÌó8›ÏàŒ ‘y7¸Àk$z¼Äž1–,&€Q2e2Gš?ÐÏÈ§˜ÐÓ;)Çð;.?ÿÕÉ‡‹´zóš¡€¬bH!I—¦ÒcîR‡R¨‘+Wa9‰¼§¥T©N"­¾Ìi+=–jÙ®1ã÷%¾ôzÂÑM‹?Äà!»^Ïw[C´¾E<•€-ó	»`ÑÄâh0÷BO–3¶=~"1`ø;}þ£Hù¶³_ß<Þ®ï6Aå~5³ïW6Ãé"(gÞ‹"]~ÀÜCð¸ÊR#=ºÀFØÒ>±fz|3,ñW¦(ód|¤¥Š±BÄ®`*¥«E¤KÒF{Ë¸›= ÏÈà@#=oä{¨±Jq¾S8s“3E©ïÈËµà(þàõXEæP¸õï¥t†4r*©Á{nA%ÌÎæ•!î'g'„fí@§™^<ìfèØ{#™ÂÇ­(0|L;£ ¶¯Gã	µÆîfÁøÁ´fDÊA ÂvµeË§¡“áïê(“'tW]¤ÓP:Ñt$21£ç Êtq	»A8îQ#1éÜƒU¨V`~a0½mV ½qŽ!Cû=/òCí"Ê/Ü:âàs<ÝtBï×n2aouØùéÐˆ.)™c
[eîºË›ÆÑ³çº(}O©eèõ4ïp¿þ¸éŠäWðkJŸ…+åvÈFï0­lcgÿhó¸Ñþ[›2ÝSûr•k^ŠNbµq Š•àPp(æU¸g7Áô·ûï;‡¥2k²Ó¹êŠ™dÈÇ±TÈèœßdÞ<7˜ÀÑcöÍ±HØÆ·H¿Sqk’Þì.:t—«È^‹Ž„¾Wü%m:cÛd¨ÜÒSmÈÙp£OÕ¹Þ©eL¸Æ¯kŽµælcÿà/–Mù&^#˜û±Vä^~§ÖEü³%ÂM Ä:œ²;Ë&E`†e¥H·+©ÌuÀ4±™¾åk l1}+<Q™iß•èx¶ÅAæ\‚¸ÎÁGãjí1k¬bÖºO‡Å5ÿ.a±+G|#Rüå/Ùr3<e¾YÏÅfà{ã»ž{Âc÷´tr¶ô‹?ì.=^«8	ôwé¢ï£…?\ê/Å]˜û¡sxèŸ¥n8ðz/u™ùÆóO/ÅÏÑÒz)»¦ÐÛºXBÆË¸–.–='m»Rqˆx½¥å@y„7½ð‚~ž„†3cXÿ¬uŠÆÁ¾—ÔK“ïâó3Rr??<-UœŠ³¼
ÿ/©½¬®;}üçÔ‚%N3Ð7ÿªêõ®WÞ:ƒ“¥uÇúXç¥Ñ°µä|Ãø)y$Õ<¸¸¸(_¬”ÃèìÞ?€¦Kúôèwßé=-íV«åÇ×J½ºìÀÿ+üÕeW~À¾«O–Ô'Kôä—ÁZùáCxú°¼üÐ-?\[ÅÿX¥j¹²ÏWu—–ËV¡|ùáÊÚÒz¾.—«Ë—ª•òúÊ#x^]_ÅÚkø¯]^YE«»«åu€•×Ö—Êë•‡äáú#tŸ_+¯<\.//?,¯>†‡ÕulÒÁÆ× €êÒJyù4ðxþŸvn~®TÖºø–:÷øqué ZƒÞ­=Z…á•+Ë±Ë°rÿ½[[[ƒ7*ËÐ=ÖÓ•êCçqùÑÃè Œ¢ºR^{¸ýX_.¯Bë«Ð÷õò#˜hå¯KåJzZýeP®VÖ '«UìÏãå*ôa…ÍÐÊCìtgæû¹ZYs«8ûúƒ=Z_£i][Ã-³á4­RO+Ø¥uuimÝ¡Š7Æ0ÈÊê/¥J#biúU¡	sq#†Ãdé$€“Ñw¹ôýasÓÙm5¾{Ð¯jF Ú©«°S	Ê Øéñ Á<‚½›þ£ª·¸úîÁHi'‚<’h ½èãÔ:hmq !èû½ž7´m „k<ÅJå²­Ë +™Æ>^.vzãˆ¼Z—V Wh¨»¢É“µ•8¹¼§?:~/éSžNMÿsõïœ+3Þ÷ß=€®ë‹i>2—âCìdK²]$K«Î“R`#M¯Y— K^œd‹“õÈiðˆ›Ê:)ÍK?Ò3K9M¾Ciƒ.9?$e¡½ãµÏ1êLK
;c²ÒG‚{•I§›ý©"È8§È¦[å£Ð²Çß=°u/<1U“Àøq…Ô¼¦cì2L‹ÆÁÍK iÚˆ‡á O5Üâ€NúÈíx[ÒdL²hp@®šïÑ‰?t\ESZâ“®oˆFñÿ  ÿÿ c>»