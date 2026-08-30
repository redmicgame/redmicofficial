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
  ActingAudition,
  ActingCoverUploadOffer,
  ActingOffer,
  ActingPremiereOffer,
  ActingRole,
  ActingTrailerUploadOffer,
  ActiveEncounter,
  ActiveSyncLicense,
  AlbumChartEntry,
  AmaAward,
  AmaCategory,
  AmaCategoryName,
  AmaContender,
  AmaNominationOffer,
  AmaRedCarpetOffer,
  AmaSubmissionOffer,
  AppleMusicPlaylist,
  Artist,
  ArtistData,
  BillionsClubOffer,
  Brand,
  BrandAmbassadorContract,
  BritAward,
  BritCategory,
  BritCategoryName,
  BritContender,
  BritNominationOffer,
  BritRedCarpetOffer,
  BritSubmissionOffer,
  ChartEntry,
  ChartHistory,
  CheatingScandalEmail,
  CoachellaOffer,
  CoachellaSelectionOffer,
  Contract,
  CryptoCoin,
  CustomLabel,
  DivorceCase,
  DivorceProposal,
  Email,
  EncounterChoice,
  EventInvitationOffer,
  FallonOffer,
  FeatureOffer,
  FeatureReleaseNotification,
  FeatureVideoOffer,
  FifaWorldCupOffer,
  GameAction,
  GameDate,
  GameState,
  GameView,
  GeniusOffer,
  GiveBirthEmail,
  GoldenGlobeAward,
  GoldenGlobeCategory,
  GoldenGlobeContender,
  GrammyAward,
  GrammyCategory,
  GrammyContender,
  GrammyNominationOffer,
  GrammyRedCarpetOffer,
  GrammySubmissionOffer,
  Group,
  ITunesVersion,
  ImdbProfile,
  InstagramPost,
  InstagramReel,
  InstagramStory,
  Kid,
  Label,
  LabelSubmission,
  LeakNotification,
  Manager,
  MerchProduct,
  NpcAlbum,
  NpcContractRenewalOffer,
  NpcSong,
  OnTheRadarOffer,
  OnlyFansOffer,
  OnlyFansPost,
  OnlyFansProfile,
  OscarAward,
  OscarCategory,
  OscarContender,
  OscarRedCarpetOffer,
  OscarsNominationOffer,
  OscarsSubmissionOffer,
  PaparazziPhoto,
  PaparazziPhotoCategory,
  Podcast,
  PodcastEpisode,
  PodcastPitchOffer,
  PopBaseOffer,
  Pregnancy,
  PrenupAgreement,
  PromoInterviewOffer,
  PromoInterviewSource,
  Promotion,
  RedCarpetLook,
  RedMicProState,
  RedditComment,
  RedditPost,
  Relationship,
  Release,
  ReleaseType,
  Review,
  SecurityTeam,
  SignedNpc,
  Song,
  SongMediaRequest,
  SoundtrackAlbum,
  SoundtrackOffer,
  SoundtrackTrack,
  SpotifyPlaylist,
  SpotifyPlaylistTrack,
  StreamLocation,
  Tab,
  TalentAgency,
  TikTokPromoteOrder,
  TikTokVideo,
  Tour,
  TouringDataUpdate,
  TrshdOffer,
  TwitchStreamSchedule,
  Venue,
  Video,
  VideoChartEntry,
  VogueOffer,
  VoguePhotoshoot,
  XAppealResultEmail,
  XChat,
  XComment,
  XMedia,
  XMessage,
  XPollOption,
  XPost,
  XSuspensionEmail,
  XSuspensionStatus,
  XTrend,
  XUser,
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
            else if (axœì½ksG²(ö¿¢ˆå-8(A«-„‚ ‰à ´<MöÌ40½ìéžÓÝCâ"â„?ØaG8NÛqãøú:vÜ_GœûÙþ=û¬Ÿp3³ªºë‘ÕÓ _Ú]˜é®GVUV¾*3«¨’²ºUQo˜GÃqœ¦Q¯¬¢jVŠõõu±Oã,.–®	ëS%UU…X/’Rìlïíì='y!n¼‰
¦Ql(ÉNïçÅ…ˆª_YÆi»mNãš›@YÞª`tñú /«²7ËÊqrR-¾q MF}1,Î§UÞ+¢l”O?Þ¹·¸´ì‹fÕ8/v ðÂ4Ÿ¢2^p‹ó¬Š³ª/^è!ùI’Æ½,šÄ0r=„±¥O³ø {çqT\\á¶›L¢Ó¸ï<´†(¿î`¹²—ÆÙi5_‹¯Š¡jO™ÂøyUãÞIšçÅ"}•s´¸$>€‹òóŒyÚ³lŸ$Y<r‡ž&/ã²ßÄêÚ
|–Ä¯ÅçøÅm ˆ«³8®ÚÛ¸³¦šXcZx•Ägsª¯¬¬øMŒ`qûB­²ýòbÉAÜÛ·Åæ¬Ê'Q•£4=SÀ^ñ$ŸÏ1 3ŠsTq!¾‹ã—0ü“¬v ¡ìÔÓxö»ë¨€øÓŸÄÂñ8Of“H/|Å4F#ãdq[º¹IÏo^Àê½ŠÅß‚×`´à½³ã™þk¨¿¥YXWÝÊY¡°þæ– mÚ7ìÏ&ƒ,JÒ~hlôž®<£‰WÕ´ìß¾ÈÝthšFåar{:Î«üÖêÚêçkwàŸÏV¿X½õ›èó/F«¿Ž¾\ýíÆÙú—++¥©Î§ ÞÂ.Îï$ƒQ6ô)Ò|Ü]ý²uûtÜX7‘O'À&háé3g¦1PÑ{´7Þˆ^¯§ÐA\xÍŒ£,‹S"¾5xƒÌF§1P_ŠœEiR÷ÅoWa¦AK,N<µ±n]ôÂB?}¶ôÌÄá‹kî·Ýlò[·n‰ÍG›¥ØÝ°³…?Õ»4®TlN¢½˜Ð@þ¾x »çønüt!šD[³¢€‰}Ç(µðL¬×"“Ž{Á²_°%¹óY_Ü‹°@‘AFiU69‹uz÷žam”î|&>ùÄïÿh6˜$e‰ÍÌ{ïó®%c“K* ÝZµ-æÅùÓg¸`Æ"ÈQ]"‰í
H’d%cÝ$ýù	ls ‰0o®-ìÅgb^™Ít0›„_å µß>š•ÉPH*,t?z‚írO8mž–÷PàõÃdzëá¼>êB-ýè2-}~r·½*ÐÒ¾oi°&kïAiéC–hée+ŸeUqÞÞO]¨¥']¦mÆòáË9SF%Úæ´tqyËíí4VEžfzÝ=3)Šø‹ŠaÛÙÚˆKûÖ%èQ\¨mªz[’ÉÓ8+âûI
D«ô¤@UàO"›¥)Ç?n…¤¤yÐÛJD YøÅp6æ—’óà—3
Z“jÌI/É†él—‹½XžbÕ\TÕë5ò:¿·…%SD·Åu¢ªbfÍ@×y”î}Ž‹xÉë!PÚ ³mSá ÃUg‚aïuå&m_dåØœÁ: ¶smlBh€žº³h@ñ¦x#voˆ>Ó>íØ Qt¦	ù¼c#ŠX3Íè7]‡ô˜>îØ„K²m4nÓ^q$m¥å<.Lan—áN¨Y{K,¹_ÿZ”½ak 0šÀ›¬gÉ¥ÁOÊÙ ·É’£	*±¯ÒÒÙ•ð‘Dø>…Ö´Æ6zÆé»–~‹
tšP×ª•Ílô ÈgSr6Zt¶åbDCŽzÉˆkvg«!Kvç¸¬×àAµ¸n²D|2Éœ­*¹R9Ìvå+ïUR~ŠÐˆåS²[‡ì»óª'F©n¶MA=ä'¦£ é(Ìé ‚6ñ•og:$dªu"QX— Š²Bæ¨*âhBÊ¨¨·¥uÆm]óâ’vü\X¿/¤)RM–E>}Ø4dÆ,Móé,€”ŸƒÊl<ƒFï».¿>%ò\«[|¢V¦ÞŠÞB°5Ûfß÷J5Ñ·ÅêÊ;˜c1©:‹JbìMgåØ³îšÖžðlÊ!)êÛ;Ÿ[~y9gýD–ed‹º”KêŒÉt_8ëaNÒ…OŸ³Ùdo:¬Ef$Ï«k.»˜³ÁQ·ž©Hé@Ó+Ód/®,û}*Ö\co¸´Wèûv4/.FØ-â¦7=óÙ\æÙtøüÆjN­÷…gSoª¨7JseõjËr³,ùÇYÌ­¸¹æ²lÅÙñC‹®lk†AmÍ³_!*´I‹(™Ò*¿¾åwI5>Täúƒ/³$(ïj•‰üt]d£pÛS±nKLE?Ü
ÛSâÙHª8Š+Ÿýš;»eÕz“hºXK.rª|Èìî‘NÓ¼/Íf¯—…úò×új{¾nu2´­ÇÆŒÞÚl €SÒ‡´‘Á!þzžÊ¼¨`f—Å€ætÐ“<ú¬$}³QL-©qŒÌÂl¨Y@—è
†¥–#2–_½Œæ-$ÿS	Õ‘ûü,É24÷è÷OWœ“w®˜YóÌëh.² nš ™)JÚméLuÎ¦ÑU$£pö°y*«¾¼½òâª.œÐÄ “Ú-óbõÒ;I£êÒÀêþöôº.9e¥R‰øGEáo¯Ùv”Öqä’gËð`4Y|ò‰Ýˆ‹Ù¼¿.·6´è’ÝUÿD¬]`àúT|Öª-Ê©G¥q¸rBz½Mr~'VzkveÔ
ùÇðâà´pu¥ßÂòµkÀ"N‹¨x	¸ëâ»@ŽAG!b$ª\DY–Ï sqžÏ
¹=©0ê¸	ÐèåùŠÍI\$Ã(Ò·y£²íšsìONÍG4>ðŠPcmp©’T…†¼ R#acQÁ~æ*ª4•¿†¹üó?ý_0VÝ»vÿ¸%` q5ç¸XpGê’~DYfm]¾Zw|ms4Jp„è:°,Îbq–ÏÒ‘ÄbœgÀh©ÆÑ+Z&íB#¢Š–gñ$ÏÎ{â@*øE\NóŒêTã¤ñ$JRZìá0žV–uS<0Äú9ÂÖó–¯îæú Ð®áÙç•©Ô™£|/h3%Ù Íóô
Pº+XÃë‹½fY|à„*À˜³ÁãaÕG›Ÿ³cžä³›°c úl5Ž¯û§Ø0Y—ðAÍú0Ž`ˆdÓq_ÒŠàñºòˆ,¶·°\OKA.|ÎÊ, ÕVTLãjû}¬œÛú\ÂìURÑLõåQý!l	»l 9>L‚$ô»—?~=„ÝO;*Áæå>„_gQú’6îÑ!u"·%l;$–7K‚¡G§µwqsÂäŠj"ŸR• ¥)nõaþ*¦Ã0l/~lJµ¥‘äÏJñ2ËÏº@ï7e¥¨BñkÎE9Ž¨¢åiž¿„¤¿‚'
¿Sä<Ô«Ý ¦^¿®¹ß.<W‡5ZP…#bK‘=UŠÄ\Ï·a¥ƒ9>¦¼Àƒ¢íú-Øþž|yS·|'‹º*ÍÑWå¥ˆ,ŸÝ2â§ÿù¿«9~ið1ÅÆTg·ÄÍoä÷†¡Ý_?lÄ³^OÓTŠÛß—·O—ÅÂÂÒ…øÃöiëõ^Eéx.##7ŒÄ°îÑ<_ÏÎ.bü=kOÿÅ|¿©ÏµßÕ*çtØÑqqu¥Åqñ’®‹ÒrË´ÒºÁ]»Å|åë¯X!2~½‹ío)éTÀÜáµŒÊ>eRKê #Í=‹jº%åwŠ ù;Ä&H.@MãÆîB÷ÁE\V/Ã£›…›‚æö­4a]Vü!|—ªÿœ<Ý&Ù¢!ƒŠ	õF%‹¡Xj=úÂ¢êáãcæŸr8…y‹Xð ¥q!^xœ¡€’1$WãÁåNKšoÃŽ}®m.DWánäúyÞ=Ü9>
9zÞyzà]gWÏpaÏ×sÕòõDðÊK{{®2ÞžB«»§Sà*þž8_s>Mòø4«\Íå[HÊ±x+·N9Ï‡I‰’5¬0ûúnp4¦N|IîœCîÍa|ƒn“ìÓ­oòé“A	cÀ,(öøñ	plÀ¹&Q*&$?6db4gef/ñB2\wîÍ"±›L#ýFº=VçiŒZêÂæ(NcürpòÃ9~½½¢G[ V@lÅ±ãÀˆªTt%Y¯G£ôHØvB­n–“&â[À_‡ PÑDM’jl·¶=Gã8á‰ªæéýP¸bˆóò(Ï^ÆçÔðA’½<ˆ2TÎâÒV1vã3Pé¶¢i”Ž,¼Ÿ&¯’ö£ly7©0Ââ(™ü@£LÊaš—³"–]¥¹8ˆŠ—å»P-Î—ö¦˜ç}I[¦ÅýR3~×MÐê•ÄÂ[‡kÏñµó›ó¶•ë×æ·Ãìx®%¹[q³òƒó¶4×lgÕ]¸wßsíÀÎ‡=Ê7bRv Q{]M;ØºÙ ½®¢.\Ý†¾´6á¡KùŸ¹Lå8 ñ²ü/hïÝ­Ùq¾¨|h+ÊDž¥çÒÎ••	Ð' óP­ÚÙÍJœž4ˆaÑbF0†ÕGåwy†ô©­O½U^E)Ò	íUæ;X1úD}p¥ñÏ{Ú ]ªA†ÐÎNBµÑl/.FÃá²mÁWPLËÚûŠÜÜ–á?ßýª>%z˜WGï°2ŸÄœ¦t	ÐÑFæÂ]Ð´À@ê=€5ß!;%€ì\œBÛé:âÖ× yÇbœœ¢ÃÄ†ÄëPÙ„½˜j—ònža³91 ³·Ò_k;‰Øk+¢?}Àk7D¯úíÆØR/Íˆ2tDÛNokØ°†»•±Ú—Pë³•¯pâÂÄˆi‘¢A‚!p0]i•LÓf©Ú ™Ï ¹#Ä+FÙº¢gdÍñ.ïÉNÅœ
ßxuÉ¿|7×ù~®ŸitkÊªH,ò%•agtuÍG°äK«îûÈ:r’§i~†‡òî}ÇxÒæL÷1¼mwÛ/š•¦7t™îü ã
P‚syá»ªÎû3¼ßÉô¯µÓu˜þNè8wö”|GbíCÂµ£cüû@á_|Ìiºú˜Ë½Ÿ¿w°%ŸQOQãÑï|Gô_\Ëõ'àrúô8½syïci ¡×ÂÍ‘2àÁBf9h©)P—Ñ9žâ¥ðÜªhüš•ûÜ8È½Ô’"ãÆE*›åâ
:ŠtÛC÷,©n) Ä]~¡u‹óY—œëWL+7·éf¥_Eo–â¨š’\ÓØš¥ÿb´‚NÎÆ×Âï?H¤Á/±â=lá_v¢³qþ/³&•8J²Ó4‹Fµ¥½ÃÆ+ ÚÊ4]¢ù¶qF³xžÏ²Ó¸¸][´ƒènï?%k×à¶Æã ÷ÜÂ=óÀó–JÜäg¸pwÿìAÍb8N^ÅªJ|èÏVÐÙK€àÌFµAÇ÷¤gÁ,ñù‚c$µ2œ‚Ca%—‘äâeøåÚ…·9§ça¹	"Z#ß¡¹]oäio¹i¼^ç¶s9þÍ>*kÎÓœåSüm­Q€;o³nò$‡_·"jÖmÞQ©wÔ¸ù{q\DÃ˜ªìæ°ÆèíšÉùD¼$ûYìíÂè—eä—­}éP-°ŒÙ ^ÆßçÅ#} -EcÐRi3n¥q.ŽòTm²‰xgå8:Ãßw1cÙ¸Þ”î’ÉöY2o‰Z—Ì:ËäWdÝa½tsìÃý» “MÉ#àU\Lò,'¾‰ØÇqå.¡îè—5ôÖ,°†žl$©ÎåvÛ=ƒï >±Ô9¤õ
«ÐÚuz©PÖn¬!…äJ+òKë[G°:~ƒÝBXÃ>‚m1¬°WÐ¯6’a;Fº¬dFmý‡é>Ež‰?¬3EÁ¾næ-¼ûçxöwòêŸëÑßäoFíÃ](~çA‡MPPž!òOˆ³zZÈÅ}7Ð²ëâ§ÿûƒÿþo´¿¢¹tvåüð/ê´«þÉz·ÐÝÀ^ýùaŸ¯5a\Êã`È€i¥Xr0¬È‡ 8*ßkú?A3c3ëDÿ‡ð]þ[]~~±Õ_àñZxÖÅ»õ·¾Åir:®œðëjŒî1ä.Ã$µ­ Nšö·‰ý}vÅPloÀußßg;ãa~šQL6z&Q@e>«Ê*’Á–äÈD‹\¨—iE$wÅÜÙ ŸÇFw5.’4å¢Gu 7e\‡ždZ÷Ñ¬ŽpAÅ È£ÑÍj€#Èäöï€¬gQÃžêØoX·“š$ˆ§Í¨{þL]Ÿäé">E\Zþ>;VcÓs¿8²äqKÖ½Çá#Æ„;à¶‡£`ÕKü"nÍˆ»u”¸'´¿ß(ñ-Z¾m˜8š¡ëÈi‰¸Ô0gøøyÄ’¿Ë¥·ÂÈÝ-`ÌË¢ÜKW-\"† mNÒsEF-QåÖÖïÀzbÇŠ÷˜¢‰ŸÐëht{>Ê‡3Têèq4v€Èß»vü¥+ùÔ€¨á	<¦«ærœŸ±I;øÜ™º÷‡ŽúaÑW×ú:èHtxUDåaü*˜U=64}ÕMëwcÓ»5ñþƒÓÝ­‚ÚÒ÷Ù÷™CIcB!êþ§ÿõí‚Ô]Mëi6ÐCñêµ«ÝrÕxõ;ú²æ².Šçg¿Ä«„xõ®$á—€uŠ°þE§h×ÑòmAPÞš_vêÜâ YKL7…v·L$OÀÔÓo	ÛGÄgãöÍó÷²¿Dî¿ãÈ}7à<ºßnøn‰Ýßz|t¼ÿHl~·yxO=ÜÿÎ‹ã'Çqêd8ƒUž¼rB¬‰¶ŒlOÛpë·¬\Ç¶Ù+ëê(A:;CqŽ45:éƒ™íÁ£Aÿ®I.pÓl¹)~óÙ×^°¯–s0¼¹UÊ©dÐ]’â‡ˆë:’3‰#<â³ÉJc[ÍròfçÌ1Æb µ­k‰Š›Âõ¸‰c7yZ$êÆ‘NX‘d[-½:’ÙÍ`ÀúLL‰-œèº[ÀìíGKOW¼)lF¦á\rÐD‘¦FT¨ÉÒœžiÚ¢[©J¢P?&·FÆ©MX'êì,“ƒl÷i6â=h¦ïáÌt1¦)v±èUÄò±½‰sj>Ý>¸¹Ä,J Ô‚V‡÷—¾L@pÞê¦T²¾Î& l;Kq~l§RÚ6XÕÍïí†Uò*ÞT {Ó2—úq­¸øA‡,¾ª!'|žL\B™¬-a<âåÛ*Vùt|Îˆ†QÔœò©<þ‹Gœ;­2=AƒPiTjLWa@/äA~ÔøU1GqsŒH>bZHÉ
2PÀã]B(h¤72+Õæ  zÏyôŒpµ»&ƒÁ›1£<Ë—ëŒ
|3<×.ÚÐÄÈ{tg8‡`?KÉJó÷g(Sƒ¸¢ÂÙ¹êæ}ú¦]r“Œ’æfäd™ÓÄäMc*ÆqÃ”T=;@²°Ã#›ŠÓâó2ùŠ¸š™xÓ„EhÄŒh4.šÅM¥YÜ\ÖSqáØùlY•4˜±ùdÉô"äÈ¨ž¼v¹ÖXÔ–‡œ¡ÖãäØY|œ6™àY‘£p>=ú…y•.Á…ÌÙÆS”|V±ìA1¡°oP7T»][ãx(gðèQ2D'`Cåxãq-†Ä2µvLxè2MT5i£*Uºy¦‚C'÷ÆB½Ìÿæ°?'ï¥xŸ9.–³…Í•ŠA+Ò¼×‚hA	±¡/ž«!eE÷7½20e´X°ºSLP¢-«0<bnÙ)l¥Y•ß¢¥4&5¥_ò!%j‘üãX¦iúU(¾+‹òñ\êuc™µýu®{ï)è+“†ÚÚ¾Éª nUPvzÕUZæpîšÑcl©ùûœ"ºªOÐ7£Ö+q¿¦#%Øj­/T–ãcc…ÎAÍZÜ6~á+zLÃünu	¡Ÿmè@ž=”1wI-þ@Ó†PÈ–`ÃaÛï.*gÑF -ø³>ùÑ“MÙþéXNÒ¿¾ðá€3Çp/Ü®/ÚVø/ô®¯gê*Gq_¾‹ÔÑw~Ž©£ÂZÄe\y›kž¸äZõº¨û¦½“;­GKðƒÃÍGžó¸>(¢Éä<”Éõ”ÞvÎåÚVÜËæúùš™ÍUÂHçêñÔÏ×dÎ.£Wcf64GÐ™¼,…ÏÏ*ûŸ“¡µ!iº-ÊÓMÆžùIZãaRÑ³¯ÎIÝÚ-ïªKz<1ôŠ½ž25úW²SFæ1sé}Ç¬ŸÍDÏËø©ÖÍËùiTúw®ÅÊ³¤Ží;½ht2¦·ï9·UãgþÝçø¡ é¯˜¾›5œÓ7wÉõ»è¿F–9ý»÷c¿ƒ¾í}r¥¹ŸsÙúüîë½xåé{ôž¿Ò
¼M÷>‘sAx[ìòipŸ)æ‘bŒ«“¹ö–Kbgò¨~é—ÊÕvùaéâ"€Ýà,3`F |Œ®Àõw¿æ_éÝæL¸c½uz7´ ïŒØ¬³tk2’ëÛŒ£%ÛfÏ6ùkaQÐž!ÓÇ~-®_/>=&¸-Q–òSË _ s_×"ÉbF‘Ð¤ÊôŠ·@Q¯Œ‰“€©ŒºleÜ”hWå
ô(÷”2ùPW(4-º¤ðjÜ‹eÓ€š¡2ŒAŽ>o.DTŠ7â)õ¦wÎ³>¦UøÞùúÃ£
=m“èy!s9®[ÎÆ|.ÍAÆkÖz=\0ž‰‰>¾¤ˆ&œ€ÃZXHÅ{‚ù¶%ÝpS¹¿¢W§ÿN¥Üô]	å‡CºÅr6Ñiœá+àF©Sw.S†Æ.mÉÅOŽ¢±f¨?¥Tó3FJ?„3’j¤I?
,]k¢FüøëÒîµg{+p	æÕ.Dú)q³øñ8)Ÿ›ˆO?™EœC¹/ÅM~¢«p>|ÌöPÔDwŽþ/j]æ§ðfÀÙ¨qT&2e0ûäÄ³ÜqÉÈ™ÜŸÊk”zîXgGÅ$“èÔ÷ÈŸñ×]ÃÛ·%¯kThk>Dú_¸Lå¶eÃa|ÚÇ‘¬6’`åV$žéÁµ 90–…Zh£óèÀœ=‰®Mx²< ,ï¦Ñð%f«ŒGwÏw£Aœ²³æfW_é­Ò±Åök˜Iœž‹q}P7ÄC Œqäà3?H2'ókÖ!ëkð`=ä<\J¢OKÈÂ™µå*_Î·×Sæ¸Ô±V¢ß÷•:\ü´“Jô­³ÇvØ™Kšøò­t¡A-ÍËT®Ýdyvó2©6â£óQjAŸ“³º	ÿÐÑ|ù¿ž–þ±ß•zj<ûŸ97¶Än4–6;Éêo/§·Ëè¬˜}Ù<xyÇ¥dòZøf€ê(_FÒËážHàí²·Iç”»þÒvØÝ<‡v³àâƒÄ~`
1-uÚ)hær5År£‡‡•Fûò"¶> „³ë¡™U~Dsó¿&òag]ra[p^*îšûñ>.¢Nƒµh¯ˆ–R—äÅ-\ÅÆ¶%¡±L6l('¥ì\ï¢ì¼MbæV.YÓßKªï€´ý®ˆ67gsÖ!_³‰fórEwÆ2jÈÙœÕZq,,å×òùŸþÄz1®ªiÙ¿}{–ÜŠ^°³7Ì'·£ir{'býÆ›8æ£øñáÎV>™æYœU‹Æ—.>€p}Z G­KO†yšë'''Ÿ”Éñ:¨ŒZGÄ·×ñ©‹½à¸8Š+Ÿš²a²I† ­ãjTž)×~ð,ˆËÌ–é˜2°;
wÊóWÌ–,íi/ƒ»Œ¯0y›\aÙÉøÖÙ=ï”nùÛüPÚ2"+èiåý¼ 7«K8{Ìq×x;_°³‡ç©Ò(ôjÀ¿ž[‹›ÔJïða­¥:û»6_›óÓd¹²b|=KóèSå
GÚ×¡õzï:ÛM¼Yy7êm‚G›^v¨bü$Qoº¿’NR%ç(égÓ½þšÝ¥™D’åHTR¯f@ ²¼øôS|B ~úéP`Ôõýcžd‹ßgnž"• Í‡žˆmÍõFõ¶­¼q¦iSïÂI:ø&vðLd¡Ép^"YÈÎ»ðr©B¸æ{'®6*¹•­®‰AŠj"ŒhB®QˆG\1…ˆh’v=WQî±áù›ÎmÂwù^h:fåÓ¬IÕ'ŸtÌ¯ÙæûK¶ÍÞšÏÄ®–Ló˜ÂoPš@‡“Ía4Š'ç¸AÚ±\“R’5Ûí?|Ø€d‡’þÍdÓ¤Ÿî(»&Òuzms4Jdâ¹ô|Yœ	1Çy–r‰HàÀl˜:¦’RtxP×²ˆKÐY©N5†e¦ìn´ÈÃa<­,ç(¦èJõ)9\Ï[ºº#˜Kè@»Æ¢’/ó|¬„–híy¥ìß–Ù0œÔR!¾Î_Éæ4|÷	ü<ŒW	ýN]å‡	ÌLžà’wÊåËÌšÿLr[¾s,0ó[jñ¿Éky…t–ßÅˆDñë¡Îbiçºä´¤ÍŒ¤÷fiÓ]“èl•E™ãUUí	¼£¬óW’¤®³æÆ¯@&†Í¯H2™Y)0©ÀsSVŠ*4%`­Á¹(ÇQQg¿´ÒWú´áÝïç?LËµ;Z±wYª‚lèÉÚ&\³ÍÎÐ9se×FÞîJ_ž¸]‡ÉÀCE:Ë`îÊ[âû&u%½ù~nÞÊ&qe­ˆÿµ&¬$Å´¯&«å,e¾®úù»ˆ¦[ý9FÓ/ÿÆ”?^÷~Šñ.R[Z:àÏ/Ñ¥šR3à@Wñ/5A&sH;çN«-‰:;¯c×œŽ|‹?¿|Ž~ÈN0£ã¼£‰–œŽ›÷î‰­‡›‡ÇbûÑæÎî‘8Þ;{w÷ÿ`DõBQôAECÀ:¤QY-‹èµb)é1ÍO“am@Ñ¦§ê_‰º^™¶2”õ>0rRm/CaçÓ×%·SÀn¼T
“Àäè¯=ªÓiÒ´?>¸·y¼­g¿™tÓ²åÃ¦ÐÚ]Øešê^öë1i·˜W@¶³
½x¥Ñ¤®.ßñ1a1#Å5§3&@Ö“M¾0÷A7æ]uüÎÒFt…Ï›t®}S”NÍøqçSuð}…¡ÊÓ¸ðX·(Ç=î‘ËË•ÇêHîÌšš¶O Zþd´œßš¦C_+ÕøWk§Aµ“´;Üðé9ÞñMëÛ]Œ»Rð*ºÑ¥ÆÕ!âjÙ»æÞs2\-Í\ûôÓ¦¨¬ðÓO]“•à6C#ïãÕ°þ1¥ÓÓ¯ÐùÊ¡èúòí~ò'¹Åø¦?Ž†Ýq±B£¾Ó6b«í;àz÷@BÂQÎ†˜©ðº¾ø¢èqM\ä±Ið[Öf¢ºÇËåcüNî—âžÞ­õÏ2Wâ“h–ºV§Œò˜âírç­|$)eèô›”M '[µ]D[xOÒé¬îº°‚ß’
¤©‘s™EÐÕ³i>ˆÒ¿8¶årZA7âÆþné7åy“»MÊ"VS¬¶F	9Ëx'ù/É½I–F)ë²‹øDˆM"Ô•Q%b8Õy•Ë6{’7©¸¥¡c·æœÎ4ê›8ž‚øIóq
u+q–/‘"Y¦ü`$Éîv]r€|Lrô‡'H¥cAò¿ñ–éÜhÌì’§ãÔR¹š ÜÕèD‰êæ¥ý£t‹€ìtoûþæãÝãçGûÇ;÷Ÿ<?ØÝ|²»st|¤ê*ïÈ©ªãànÝûÝtÃÞ'ÿrg¤H9eêŠ½]Bæfh¦¥þ‚û[W²Bƒ€d5¿k?ä!·›”Ú
¯XÖž¿K­*ö/uŠ÷@ÒE@õÐ*| „aÊ|[)ª)“J4]~åƒi7
äÐzÐ‹F£x„(ÉGù)³5ìýr'ÓëŠ+oNß
5*sÎ£Å Z6ûp%|ÍFiL“I‚&Ui(ÿŒ‹YVa1xÄ#ÄBUúbõN(~á”èñÚ
”Z—*¢é0z•`f±úy°
gY{‘I|“
1w®èîòáËa•e2,ÛK`Ww:=â*ÏÚËbÉ¡sãŠ*»$ŸU++e{±¦®œä£ŠÝaiTlœLÇùtˆ,&JÛ‹Vã"?COðöbÓ|:Æô Px¹Æy5Ä ¥â¼½œìoWæ4’nt\´;-+›Ì+QdƒöÈ1 öBÃ1ÈÎzZÀÉóÑ ÏK rX°ÙPFi/õ&¾½Äp\À~ŸDsªâ8›C¢¥	#Ðºãô¤HF–]¡îÜ¡ÉAr*w^K™S˜µWÉ .Û‹ýqVVj	>ã*æŽÏª$J°'q{Y˜Þ‚.#j'W´øñHbRK¹W	l8áj¸×è¤Èa+Ëb-½ÊÍ4ÄSãxœÏJÌ*·ÔôN4µ¥o=)­ýb‡^EÓN$¤2L‘‹ŽÌE‡IôUT$×yZ³édôŒ‚¦šCl™¾Ø/KªóŽý"wyð×ë5(¡œ"ÂœË.††úÓZëd8?Ù˜eSFÕv)ÝèËP(–kAëlô’Ùd…7ÿa«gÐ“Q9ìè>l	Äµ¥2ÂÝ>Œ˜6uº8×M­µÆåvziÝíí4—"Ï’á‚¯š?]0^/‹…í{ðÏCÚ¶ÏŒ˜5ùVõKÁË¸¥ø®7#úÅ[÷€ið¼ÖñáÖðxÓ>½Bk[5ôG_¿zëñs‹Åbùø
Pï’Ðêµ'_¡½¢ë^{òñÚÛ¬y”×fóêí±JräóÎí‡(«I/ì¸ †öió™+Ù!ui4Võª|7?‹‹­¨Œ—šmŽMÈëâ…j¤Ëû!¼C×v3ª¬€¡kÞjëÅý\VZïâ{DG>¤ÒêP
z×(Yƒ3×•¹ÉÙàXi{ mé{ê~8†ëºUL‡¨¾›	—Úó_Ü¾-ŠÞ„ªÎ¨14²ƒH(I9àùæW¦ÿàµg*×n{¦M€†®Ë8ÏÄ}Âi±ˆÿ[Eoì¤TÐ3þÔÒš»…õ´Èâ‡:õV§áaÃt™6ÝV¡‘™Š‹%"¼¸ã6±VåRÄ¨	sv¨ iÔ{[gÙGÚ@³Št‚G!=S{Óá^|D#h =gq[Ó¨í—M%©€¿vêCRõçèÈ(Ìªï8T’T…Þ?a/Bd©²;„ZQ Í!ŒFcÒèÉH3¥éÐ¶º‹_{QÐ”6‹.¾DÚF…7ðÉ¨—2,!®Á
:YòÏMß’*ßESBw²ìã¶Ì.úNér4¬fQzäfTÓÐZ´™Ùl|çsûf$ua‚ÂPÈæmO¯A(5ÍKWøZ¸Z.§"ª$dëB›äŸßÝß‡ÿ?z¼{¼s°»³}H˜õ09ãIú``LÒ˜Ïýœd>M±.ž"þgP/Î¢”rNPŠ4Aæ'rm$§ÁV-‰ì$OS”bpÊ³•Íëän–]€A®Ú²ÚÁœ`D˜¼Q¨€­K0&ÆHdË~ö#—
Ó{Ý9lµ-º;¢ÍêžÒ­‹ÝÍ»Û»GÁìŽ€©)ajj{Y±oô¨U>/	kÀ¡PfêŽk…}W•¯±9SùYO’¨Gž.GU
<~¢dw1—"²žÄ`ÏëÚBÝË“?p^Æ?óW}ùZ¯×Ãü_Ô°s×šIÁç¦‹°
×)!VÌSku×Yg€Ó:Glô˜\ß\öBìÃh Fô|Í0”Kœ-¹VžÆ›ZÝ‰õd:-Ê†úÁVlÒa éöÀ&Ïò–£³ÂqC`3Ú,Ì”«÷®ß¼s¦£u„V^køÁŠc|Â„ÏëäNÃ`0Â4/%E+žþÞDé#µþeÎ7B¯D(ÀÝÚ$–ogýöÿætšžÃÆ/€™ p^Ë$z$9å–M»8Lë²wówmà³áÛÉ=y¿}ÄÌy¥zá³µºÛÉÁ9×ñšqÎ·zÄ@'ãw¯žÔúè=$³5Ó¿>¯‰\4¥aLkÁc§Ž6M —d×òÃÄ2]úÚOöÆŠN5 áöu®÷Ôþ0:gA–ÒvXÌ·(,ÄJvÖ´ñs½«vF¯¥ÿÂqCzQJzàîÖýµæòs<°¸µ:Bh ,§ÄÂŒªËl:>F
l¦ ÉÊ¸¨äÈØ‹(0êÀQN°Ñ &=¹–Ìîiz¼x•OÈ­’vc£èVuÎ³ã /AÍÚ:-Ãèê:á,o&Ûc(_E3žºý`¾9‹çÔÅÃpø19^W†)è^¾”?‰ó°înðÄX2f]»K€Ä,uçæž‰vž†_\¶Ô\\-›“†“%/®ë™B¨&¨j„e¿é„NëX¯/6‹":ïùÄwLZj¦Õpdm‹›²SŠ§’Q>[h´1Ò}¢ì\aV}ÄY‚þ“ë …IC‘j¶%8ÄNSÇzzu‹UÁSTû01Ä¯­´ù£:ƒ«Ï®[nðAç<eOÄ[L1!ê$y½rä™¼toVÇµÏ)Î™Kp);|QaÀ7å­×þ•bTãSÌ/†‡õ¶¦%§Þ?LÈ%ï) ŽÕ«ŸHõŸ«·dø]˜÷~cPi P”Æº¥L·¸‚‹‘Û^¤íUö<ÞHx¥ª™SB/ÐvùþÕ½€Eîí 6£6üÝÿG^ÆÓÂQbEŒºÄt\ÍÓµvU@ê±9¬	ú#Ô,ÍñF›ZH=1BIy	¡) âG3Ò`s\ aèönƒiÖ‹ÎSŒ²='«q”™ú”+ÚA9#è>Œ‚&?ñkäž‰_ÿÄ=H¾éqã‹NXûl§Ô¨äa3#A%J¦ávŠNvùB³¨zûfl^ÒQ\‹d*'ÿ…Ž¹´+õ(¦ö¾Rûn™1“Œ.Ü®µ¯ƒÚÙ÷¶c€p‹4LÆ€`ò%9i÷ks'RÆ°™@#7—_OÅ/Ôéa¢Jñ¡è£o½PTIÍ’«ú{šª;ä`09íŒ0mèD]I,Cw˜žžH[m´uŽÈø+]8ÈÉ¯Þn«c ³úÛl*­Y¢åóDµ³(½Ÿ2°E¥Þ4@bH*ÈM„³9;Á`„¨‘µúŒüeuýûÜt˜vˆlŸ	›e‹ß)àÓcTIî¬Ùõœ—Væ+Y/+3/ØžëW»Ïú±Y‰byÌ^¶ŒÖÓm#néM÷)3Õ24Èœgù$Xôzu|›Œâ¼ôk/Í^á¼oÝ§LŸÌN1E¶¢,Ef1ù„kí«µo˜"äd–¢LÁÍ2±:Åß\±“"Úé‰Ytöò0DUš*ûØz.lÎçcî]U¢˜Ùñ$XÔîÄaV,¢Q’ïAšÛ*½¼Oq`2äÉ{ù¸ %”¯wOù[ã‚±9äŸ]½Rƒ—2:%åÖèÊ‚élËû´jyEüš´ÐˆÇçÕx’ÞnŽfi!pÖ¥s¡÷zœƒ`0=’Ž€2›ßN±Ãhz˜t!ùË,×>¥ÊnÛÏ,ri,ž$—Õ4 4qû¡÷˜…×©b=lÞ¬¶Í¾
Åâ þs†êìA2ŒSv'¿S]³t6ÊîuN!ƒaÕw4EJ¼D9]NEî9Ï›'ÉI$iÕÑp
Æ#]‰yeO‹%ºìËŒríU_ÆÒ~›Äg}tõ·êRjcÜrò²Ü{²·ùhgK?úq¸½»y¼³¿wôpç@|"ìÁ—ƒý£c3aÈÛdY¹J‚•ÎY«"6ŠãQ=bîKÖœ®“ò~<‰d×:aâ°ð ”'ìå8¾=Ž‹¦	˜ß;§}B¦±L\A_$dÒd(þ8K†ç4û”øa¬Æñ¹Ì­ZÄ*SÁ8™–Ö0"}«eóžûÅ~Vß•;ŽòQû!iG?„u¶]e,dÚÄö™š•RÙSô³u^ $ {˜7“¨€=Z°Õ }¥½»(míÆ¯¯Ôdüšmíe2jÚ¢]k•ôkMs`°ƒ4ÞÆÅw3/95pÝ±agE->´›®yOOÃ_Ù½KµˆH”*M£çØ™3Ö 9‰íWN³ÝÄ¯Ÿƒ˜½DLñ_l•"NN³¤ŠŸ{KàÕ`ï@ƒá#ybÀ’ù$UXj­ü|ZÄ§Y”UW‚WÐYêîó:^³ú|ÎÛzw!qškíZí Wè%cU{Ú’p‘í`é™7ËèñSM~Øª“{.,xe¸•App‡ºÌŸFÖÛ:ÀrmkÁÀ‹Þ7Þ@•\ôxV »ØÒ0‰¬ÊÑ¶–bÿ,bÌ¥›Äƒ¾õ°¡Þ$¾}ã“¦¡WÎ2n{qeù‹%×2/,ß:=ÖFk›
24ÉýÜ6ÖŽï4?ýø¯ÿ&¶ÿ°µûøhçÛí>­üÃ7KìûÆ›øu#P³¸ ë”€æ³Óq%âæ)«Dš#‹7ÊYÃ+³ìŒðÆo$„·ã×æÌ¢4iÎþŸÿ×›(¡á*E‘ËlWtÂÈÍÞõÎsâôâÄÀ4©nëL·¦°&¢mÓWófCÛæÐ#”w¢3…gQ)EôCœ¥ç‚€DÇ›<ƒhl¤ÉÍòŠ¬Ýƒ`âY"\>…ÖÄ¯@h»ÌLácO‰?ÐÐ¤DBCí##;;gù$Î.19.»úÐS£\Õ@ýŒGßHŽˆ½’ÿ^¢ü÷'&¯Î·êÌß’ê‚í€üÒšæyvX'gÂÔR,‹m=kâ.ÌšIˆ`…ŒŽè2Z"½{þÒËó®¡»$Òtaýl­„Î!“rö„­i°k>mõ1ÒjLÚÖ„°oÌd°ì%.|Z]MIŸËåÒ¾ÓÖÔ¥RjóW@ÕŸÖTOôaÝœ”~å¤Do–ÕÙ-ôáëË¿Ê²½w”ñÝý;[dô°ß·½ýÍîqoçÛýÃ­mqp¸ÿàpûèhgO|"v·7¿92ªÊš?[{I(ñl‹ÉÛ#8$5ÎµœÆàã¹+´ÚûÙiŽ”ç^ò*/@>ÚO£èÆ|YÅ•ë‘m¸ Jd» øñ­|£,DŽMÎ3.ÄÃÃäÎ—î®C¢Ö¥ÏšÛ®‡èFžJi!€I¥Â/éîgy—ºÓ Æ+F™8šM§è?|ý8þƒÙ M†b‡nßûz]üfÍ©‡s¤VwJeeÑñ%¬ÕàmJ¿a™œ\ä“(S€ìOuæè§ÌVñÊû¨ù{á`²#Ðd¼eE_Õ´^GUtŽîaè¾üÓÿò/þ?þÓÿÿÿý3{Aë‹#uH™‹Él8iþŠ¢¸üG3uM	t˜bäÔÿôãÿöÏþÿ™oÿa>ÅZÒÞwÞ7Ìg°Å,ÕÏ½®®=‚7°hÈ~úñþ÷|è«1‰GI$5QHc£	ÑD”¢¼v6FAšU½JNÑ3†Æ¥¦Püù?þ/¼žª^Ôcd3¶z	Žj0Shôy)Qåù ö<X|Î¶X³]óÚH¯p-Gr}Ìg×w4cü,À;1êÏU#_ðmt½¤QÃÁ62‡53|™eÊ%˜ÿ>yÚÆXXÄÁ©ÚŒÓ"Ÿæ%ì0ØCÌ„	¯¤ðX¿bˆ•IÕÑÈnUËk‹( žÿq6:YDYo¡rÃž¹fCû…ZÞ¤ÛÏ(Ì„»lçemEŸ!øÄœ­†Ú"+Ôk#„¬¯Ùc=9!i]¬¡/ÆÉ)£À²í€è«_ÆQI	:@Ã˜‹!Ìxgb@{ÔåqEü³¸ÄY)c¤­Ô7@›à¥ ¤n– ”'çò€M@ñ„’[åBJ Š(†5çÀ{‘z,P¬pÙ†=ëÖÎ«=–'™ÈÙÌjË8ŸL¹gÇÆ»«øeº”ÆÒI]©‰æ‹?ÿ‡¬Slí?®oèkÇ¬bŒ!í´±Ú¡ðC3c)Dæ2ßœ€œžÓyø.sÉPXéDs¿œ«Í'»_6W­…Á™«ù×¶·jí(÷iñôz2DŠz¼Ê Ûî¾	•A¦A˜ CÇLÂFOý
`|šàÍhÑy^¨òæ£ÖJ›ô2°kÉg‚ÕHIf‡ÞóùÕ­®ýïˆ®™Ë	ºfVk¡kííê“à“³¸5Ntyòå®ó•Ì« ™XÕ K}¥êÛ$ƒ^Æÿ V/Ÿ¾PWÙÝóà%•µãåR'Ë"×‡GÍx\"¹é:@g8Nµµ)‹5_C‹(‡¬7”mÅøPü4ó*¡¦1ôZ-=û–K·àzâË|ºA‰d<‘¹½ÝßfÉ5p§ˆqÇ0‰FÑ¬ŒË%xÄ)ªºKþ…ù¹d¬ÌœMA°)+ˆEŸ/ëóò²v¦‡‚Õ8õ/C•Ž×1Ö`a,¡GcùuôIé_ÆbÜµFÜyI·°Zmü¹êÂvã?øy«ÕýÙËÁû÷ïïlílîúÇØC“Ÿœ$ÃoÍÖ²ïH`Àé»—lç
“ÝÿRºå¯ÑÄÏ|ñö‹Æî't•&~:	¸¼m$
'”IuŽ ¿^ÀŒpÄŸù¢ ó?épw *ŠI¤ú–—U`Ä¡·oJ$…7/4»9AõÊ.^oô@úèjþ¨Õù%.­VØ ý;y¿°WÃ7n|Þ%÷h/ÊäSâí„U)"éG·jûP•KcJÈD#[Ø’ê2åõÅbÍþ$þ˜cÖyü¦J/,ÉËôÔ›åæÅrÍM‚¦P»Gtâ@hõ“â*´c[ýnjŒ2îSÜÕËò†\¥Ëþ¬­ÿÏÃ¼OÉÖž>‹ÝàXt×âé*Š©æØæJôÅ
C^¬~õ†èª_‚ãh«ÈÝó¾PœQk¶"°ÖrK³Õ¸ÙR²Ö)]lañuÙfêýfyÆ]%PgÙæj×ÔÛ6È†ŒÖj‚/g¼n×Ž´`Ð§³xrµCh2Ç@Ç8ù ™NR´Ó5¤Ô°µŒâ	šáTBLšm<«®È[Qó”?‡-üðÒÌ|Yæ3-7|ù6Ç"_òÐÕÎEÖœ»À¯r0âŸt4Ü:Ì5¿^¶à«‚³>Š^«#lq£éHÜúZÙ`“²œ¾Av<KD‰xÇ¾ÅOÕQ¡£y¶š
iþØ&>ñt¨KMBâ'CƒÞ–õ ñZô@\(!kžu%iï "dËÈ .M³ºØÐ®dA›c?sÑˆ!W±¡YrÆ}‰ÏïCÚèhE»¼­ƒ­“ý¬ÍzæÎ=_ÊšD¾HØ†æ[Ð8Õì]G.m¹„…ëªÖ-i 	Ñ¦¹–ÎÊSæ®ß¥LRW0 ]Á|ô¶Æ#9sÊWï`DbÃ~¾òYc8Ú”7Ú‹Õ[t€éI´ìŸ¬ƒGyM²x-…IOÞCou”ÚÑÑÔ°í\YJ[µ|`®(¨}Ù˜š>›š:ˆjÞÃ#SØÄÔÙÀÔÙ¼ÔÙ¸ÔÝ´äç(rG{hä];wºv:Æ ÙžØ£—¦Ïæ&
$e¬ÒU×b7Â³ø›5íc3'Ææûn¶°¤(¯0ãö‰0sEÝ’–´e•Þ0 ˆõöÆäU"êÚÐö’Ü½!ug[ê:fçŽÕð¼«GŒn ãµ¡”óŒ»èZ›ç’ãBÛb6§€g+záú$(ðTâji8kïnù\!:Ü€Ò½ŽªBTczwmO4O´6ÄÂýYšŠEéá½„Æ®¸265å·_SÙ…ß£j'×Vn¯­,ùQ–5@JÊ2²OC7Ä‹7ÞàûE“£4>’^šK·'ùìúÆJKRL0‡ïHF—þÛ9ý;ÆÅ·ÂðþÃ&¿þí{ÊÀroëñ£í½ã£¾¸Wx´ÈO¸FÍ¨£ššad¬¿Ä:‘ghz¿.¶´ö}ãMƒâOB‰°tüT/
¾°$5ª§æ0ióó8V3æûªÇa_tOºJ(µwìçá–æË(¿í$£|„ã°w}ÕÆÛ ‹Ù3".tdÝŒiê6;ê‹“ÁäÁöÞöáæ®8þn{ûo.a	
R+sÓœb.ãd(äN°ºñ™òOý¤¸|¬ŽÌÇ"š àëi> ~9¥¬:Æ´ùï³4*’êœ2:~Å/\Ÿé–è2{•zàq©î±—Ä~êXÏ.Çõ§’j5 Ë¯Ãˆ4~§v€‘yèq‰¹ÀêV?áb¯,µ‚Ä™FŠq<ëvÝ.)L –žm Îá–Gc
(á#D\ÞÊƒÁ<ã\åµøä†ø&ž¢ÀËÀšx‚ÑI“sQ%“9aÈKâÅÃ<‹Ë*=÷µ_:çÈ'±À{¨eÞíeq~—–iOUh3vld½u8GØY°£&ØV(/&Ø|†‚ówÒPÃ^[2^'B¿hTrEG â¡vÔÅV0ô"¦?È"9	ïà6s/é‚<ªÄ|”q†ç?ÞBu
r¨C>ÿ¬;Ÿ{ºm“z8JesÌ‚˜úõ: *9{Ú®½ÚrKO—&Uó…§dYüšŒcøTvÚCÓÍKÄà³£‚«x0}Pb~Ý¢XVçÀG€7B_á…„½¬Ö¶×6€¢mž¿Ü?ýø¯ÿSgäæ³t$“­cb€¨	ZÂ}ŠDã„k(ÕY, êKPó³dH\ÃbŒ66:C…Iáð#ÜhÂFÂlS_5%9ò÷ÝMŒüû§ð6:‰ã”ß;¸Êdæƒ|p¡‘’ ¬Oßg“I\„W×§tBfÅÒKU$˜Ù$ËÏ6ÄfùÒˆ,’8õ~»MŠtÔ¯øèO÷àš±¿|›=¸Gs†až€M4‹<BÕ³z=´2 ÏòrÆ‡áÀWÎŠiDûsuE<JÒãŠ”AZQJ`ªÁžî‚Ú¸³÷€éH#0`éÈ9òúˆûˆ¿ÐZ¼‚ˆÅaj
´¨ ˆ3å-Å ^‚ÖXœ73lò»ñ¹!3ðÚF‚±§ÄGÖío·Ÿ?„1÷êQ»þø,!^°)‡
€¸äpG"aEÒU¾…NbfùAMŽÎÉúm¤ÊEI‘©@øþKçiýãL&g“žx«k§'IŒ‚ÃÎÝÒÁ¸ÈbL(…4c†žD§ Ñ ŽÔl‰a\È„Pë† ¾ƒtJ¦ÒëIÊœÝ¤Kg'ñÇ£¬…Ïì=‹Š²q..Ô»oa)˜ÅÒjK'#Z0¶ñ%%â}­]]DJñÁªVØõ~n}¾æct6¿I€×º`j™#ÉïNö!/mÄG|Ñi”dABxüè8˜—jkÝ¸cÐ×(+ñ/›»1Ð
 áUXby·8¥ôÝ"b#yÝlg€:ØÎ“|&†î¨Ó™ôÙ©JfÈiÆ Ùã>ôâô/#àÄé›j”j!«p[ƒœÕÈA™
Éã=J<ÏäÃ[äJ¡âh+Ø!JX!¢ªï(Êá‰´„a7X
¶=Bq–¬‰"¢£ËnÎ_m¢êL™ˆ_ƒþ\&¯bñíÎ¹Ú©lA›·è0ó"¼ô˜ôà´H¦Nž‘ð1œ¥Õ¬ˆ›¼ƒX
‰ñG”².G5a…‰N'rI[°Pš”íóm¢É¬Ñõ-Á7Ð¾ë 3Mç¡ð zôøó+Óãv#‹9tv¶”«’IXÖÅ,#M41³0éá9Ù
ë“T¤t#
Ï ìq×mÁF‹RÓ¢»16æf()·µ¼ee(Â½‚¹ç®-M67lIgè6óýÈ~ú\¾uI@Ý |ZkËÔ?fïs“$(ÕÇ\»á§+Ïê;Ð²‡5 w“j÷)ÛË-±ÚÒŽÖ$™Ð+Ô¤ÿ˜‹«³·=ˆ³öìm—ËÝÖœUéo‚Mê6c—ÊÒxûÍ\ŠÍ?Ø"MZÆh-©”j¶:n©æî¨ÖVƒ­Í?àRMÉÓ²y9èærqé¡4ojýƒ·µ¤uk9'R…‰
ç3ØˆhÛ™r§Ä_ÍA½QRb¾‘ú½u°QN¦ lšYLãz ¦¥îƒ “ŠÓ‘½'Pp %/«üe]o#Çœwß
¿G@Øæ0êÖZ»5ýƒŒrÆ­t·°wqƒYïz¼bº9ºNB•ð7õ¡&µ>è,ž7ýCO#¸¡i‰Kî§ƒ¹§¢ÖÎvsrÀ˜$Å»]ÔjMà8m¹œÕŽy"yiÒÀ•ÞgŸ™=³w ×)Ï”X§1Þ4ç<w=Ø"ö–c4·@Ø»°åx²¢5ë{ÛÆñH¸ß6gfè’-ÞÎ÷Lb<k0È=°ýüAM&çGU–†âæN‚1üS·ŠcEéõz‹­ÅeÃ²]…¦)SòÂÀæ$ºô‘U¾t§ln†@ß…Ýt)¨v…v°ÝÂA¸0XÀ‡“ƒ|4Œ`_%“™ôYQïP9ƒ½§Þë[†M¦ú•„¥nß®)ïWWïë6ŒY•¼*=L4ÂÞ¾6hÆ/Ê¨ªÚænÃ•d‚^÷âiRæ£ØudPŽ>ª—|´¾Cý•!*M…nÏ©`¤MÝV%ÈåÁ§ü¾Ôë~:Ê¤Ë#Õ…¦ËRÁT‘›‚ó *Y±· )­ÖO—´Ÿì¢é(ë—Å§¬Õ‚y¤‚æjÝõi–¥T®CH/3ÚÒ“X_°Š²¼KxÑäükdoK”‚ð³•[_®üÚ	šZÊO€ÆºÊt;GS¼<D«ø‡Oó³Å•Þ—ËõBI(ïÅÃèœƒ¤Ûœ,I?íºrˆê˜¼Pòœ¹éVÝR2íb¡@ºFœOWa5¼l¢0ê«V™O¦D¯ÞÊŠÌ5ycüÅP•›³G ¼Cºû¥[ë8K­Þ‹D˜ã@Z9!áêãî’¤ä×5¡Þ«5‹ûrGÒwYFÀÍ *á-¾ó³É,n‹]fÃxq±œM–’já;€¢Ç²,Væu…ùüÔ>§E~VÒ	47"3Œóâw¡m½û§³<³ÝžÆü4Ð*™šhÈaÿo5g?Ú²„beÍõÃ“kV~½^wàGÆ´®@{Œšk6ªGMBß%6®°Æ¤¾X\aã®msî¸\'\vˆ€`{[¢PBš€˜3TîfÄÐ8¾ýNä‹¤Ü›y„ãý[–1|‡ImoÛÓ¶;!„
¢Œ§Ï³éðù7ÄÖ3`FKðËê2œ‘?UR¥Y©@Üx’¯ð
Ö¦ì{Ü7é0U5"ƒtË­§tª­YÉ†Z]í¥o|[C†ØÓ~Áƒú(’>§MEÄ[K£’î`î;ìòkiõø[&Ä\.…Ÿö¯?ÍÎÚT¨×zY¢Þ³Ë€×î†/<Ü(ÚøÄØÈÏze^T‹‹Ñ²÷2Û-5¿–zeš ¯£ä<-”³9H;iM0=ÕeÆ­2ù¶$Ófej«ÝíVæí{¾Éªéjr3à5å1NÚÇõ©$\äíÖÓéä‹úÒØ4—½oÐ.DÍ­TF|6•}–E®öHö¥œåé *˜ób;ŽƒjÐ´!*ºlXgÒ“Âè94$K‚Ñ2:ŽUŽ”žÖDç‹è›ÿ"ñ‚}.Óå‘Ã¾Š³(©–Ujp)¾ámUQZÄÑè\ g¢&Ž>ü7Å2N^oN×›Êïyçûf©¼¾"éH7JÐz¿	5ÃIÛL˜RÝ.u?B—°2™LSÌrO»£OB¢¡,×“`O“¢;
U,tÊÜŸ"?ŠvHÑÔÀ]=žl;SýÀª4~8½X‰ —ò¶šCÒzè‘”Sé º,)æ¤vö!tõa²^À$3UXÇÍÝ]q¼óhÛ]K¬)ýW±k„—ØZcÀÍR·Ü3Ì=3¬3êlìþÎýMñÝþáî=±õø  ¸ûø^½½y´mDQÁç,’^œ»°¿à/Ê6©.¶b*^‹­/ÄëáË²ªt“Z¨œwç-.þë*ÜšŽQxè`µDæ7Rp[ú¿¥i4(ÅEÇÐü3MËhÞcœ0šHW%¥<1Á»ÜC¡Ëè÷°8ýöÕp%…Ê1yo%í_Š‰Q@‘,µ€R"zêà¥-r’z˜DjŸ©w„v„FLˆhYuŸðRa
G-e¦°æ•iÞÕ/W´‰%(öúõã×SsºW&-ÿ™×÷„[wP$êE—Ó‰Ø{5âÔêŠö!¯ÄÊPq‚Ì'6±°‡ eSY(‚¶z³,ùÇYÌ»C(Ôá½F…XxC¸Ò+Ž“	ÅÍí¤él’ZE¿¾MÐµï¿‚À9™Â:,0XªZ<L@ë|<ÅÒèó÷yKÝ{’Ï
ê	èãf‹ýŒª¦Ã,çÓ)žÉ.0m·æ‹„¹foúÑ[gI	¬óñ¹£»át7¬~{¼ö0›KŸÂ0`ÃApiÈj?¥£Kê- Ô¯ÕEBkð[¨Ï9P¹ Ù¿\+”2©³‘Öå÷UÔˆb¦„Ÿ[3tLµ®Þ Œ.®K¿a1^™nÊ5õ øQO¿_ä$)æ£œ”¤2R	y:G/T°†_À“|í_ŒÀ¹4šñÞòhKë…¬ƒÚ'àkR˜‡qsNÃŒ€ð:Œ{Yº=C»Éþ ï²éÅYU$ÜëŠ»2Bs¢í ©†cr¿(9†rOðz·œ©ªq”‰;r¾}fhØˆ—v_i5ésEô¼7š+š«2-"¹ ë~~Rã(tèòí=Ã‘ÆÐ  +…ö)§,oH„%Oœ1YJ¨d_ð‚nÓ9#Öý{xïwìé7[£éD›Gú¦mÂ{-:}ÏÄÓ8èÆ”>ãdÌô4¯’“s2ð`Pöuä<lŠ’4äQ1z˜W«++Tú®ýŒ)|w6à}‰aŠ;kv-ç¥QÝ|ñPÞJ#«2/˜^ó©Æ³¿úqS…ÎÍ¶ŒÆ¤bµ-·ì¦ûÔ›ÜÐbÎ¬|b’\«è#Œ$shé×2^š¼Â'pßºO=à™]<>ò
lEY4ŠÌBò‰ßÒ7VKßxv1ŠÖ,C¼b›ebu‡¿ýB'E2´‹Ñ“¦àì¥r“V,J>¶…Ššó÷˜{cV”¨dva<	´;ð_4ÕŠh”äû¯(žÇi‘^ÝÏ‹IäÑzõ¸DWç Ÿr·Æ÷xsÈ=…Î¿ØBw¯âœ}‚2`îÃ¤r'Ç|}˜_òpÐð¡·i|EÜcš~‡ãój<IØw›@Ò«Ðs+;‰ÜZã¼‚Õ@ÕNîó‡Ío«Ða4=ÌºˆüÕ ±rˆ·å*ˆ©Ø¶ýÌ uÆIRÇ®˜™‰­½ÇœNëaj³Ò6ûŠƒEµýçÝØƒæ¥l(»’ß·ìd¦¨ÊÓë=ø‚áP:$Ä*b0—=ýKPg?R âÁë‚Ìîþ|ëñÑñþ£ç;6l-ôkYˆòqçµ”^jY‹9K)/wŒÂÉbe–"LQ´6FœL!ßsßgÑ/àKyÓ&«A·‚æEc”nÒw°i¤¨‡ö­7ž¨ È³Þ$<…Ù`”‚¹À‡Û[û‡÷žíï=ø8ëªšÀó'
G-@C9ˆ‹¡ŒÏ«¢šûgY\ìFƒ8ÝaU8û˜­öM7Õ"¶!¦N/•omïs® ÐIô¦&1«˜ÌƒH;÷ùr£	´éÂpúïÞÓÑ4Mªn=áái¸]jH•÷`š×ºulØmµ…—ºŒNâ7‹Rô€—KÓ <EÜõþQ¾5W]é;f]Tunf³É .nâ†Ú£¯x€í-AÃ¶»\«ÇÒÒ9"zSËÞ(ä‘ýÿoyzx;˜Úlö9¬ÚÂN•+Ö?ÆG‹-,«‡‡ˆ	† Ÿ?ÂÃ;4‘g(o.Ë†µo¬—’t%éymyj#½¥î·ân0ÏYÒÇ’>óÌaQND‰¢9Þ»Dz’g1p]ûé‰ÚÆÌb.qS±'Yç©ÕjOåùRËüÌƒðc°*c>šâ-ü}kÿÑÝ½íç‡ÛvþðqY»JkO¶:ð·¾ýÞbµñÃq×Ùå²|àÍ¦gBª.ƒKé5©cì¾—LÊsÝ|çÎ5À"ž$¯ãÒïìgõ¢Õ}Sùý=xà–JÚ«wÊ’57Ã|2À}§¶·ËXë×‘lf_îÚg¡bö¡A¨Ø¡:‡¼Þ‹+«„?‡jÀ;ÚWFÅÕïJJ¾ûõb3z5ßµ7Ê"=pœ	Üéùõº¬×S§(NZH{ºšÂô“/êN^]É9‰	Tw'µ®îÑªë©¬«i/ ¾¸1ùu¬yfW’qä²Qµ"Žb¯V/¼
Œ4Ð,!yÛrÄÊ)ªJš¬Þ;¿Ë¾º¾xùµäo-téôY›¾ÆJ7C@v€‘TK%Éù @yœéeü‘ØŠC}­šX½DGæú;«eµ¿­JøÔ®â.BeÏÍfœb7èDBƒæ›:[Æn°öï$<hÐÚl@¡»]±ÙT×Ùfõf™-\ø˜Þø@}åã¾%ç˜¹+Î¦Xh\_,Tr7á8*J"ka ôÖ8¾Ä:	ºˆMgæŒÔ¶S}5êë“öòìÊ ÅèÉ£ýRÞ™dMà"ô	à9Jm"%¼è»^SsâÏ)—ôDí–dd)Í^ˆîuÚšWÓÉóW­IªðJ™—^y‹%%žÎI™Òt‰Ðã%[jš•qA.1MX¬…t˜©óÛÜþ¾¼}Jym(kýY\`NîÅ%RdÅ»à¯8 vþà¥Ã˜{xm$hG@Ÿa\æ‘ÍÍ5˜îïo¼ÑÃ¹P›I¥êU8¸} s6Y¤v£jÍ•8Ióé4aþ½ÿ=Ö§2a5á›Ì†c+ÿgÇKi˜Ì2a¬u›ªóÓ^¬º×»ghJé3´Š§ùô.,î»X¼:A5³r7Þ0'óbi‚H^¥Zü5}áÆs¿÷È·ábAæzµ—N<{—Z®/7ÿtZ®úÚ µË®WsuÑÚ×ë’*­ÒMMyÂ¬ä}—4EdÆPn<Y®·û²Ý­ÊòÌ‡ý/CÙ=ÜFc6éºÏ6·¾ùøê®²”ÒJD—@3F-"’ni;Ýáäu3} k‘áªõ³±ÑÈÀšè¿P;r~~¼ÿøð¹¾fóðÉÇÇ`ÌëcË£øDÉ6WÕNØˆå\3
>k5Ÿ`mžº÷2uðŸÓžs7Þ`’=õzwÞË‡3¼.'*Î-'9u#à1Ð(cy[ Ë]\¸p§'Ö»sº}­¡ø^Š”ú*7­aZÕÉ'ïq‘ö}Ä—/,8(×w_ÌsÀ\][¢ qL°,ëØPü^ãd;ú†LÃ._XYïPvÎ1¡©ŽÛ¬Î’al,¯Õ¨Ô
’Þ%ï×±<øZ>YbU]ÃnZÜNnÙËf…Ð~ÆO·cÂº½Ða¡‚¦™KI¼¬)ZÖ³Á:	?i…'I¶ˆ^LÖ‰¾¯µÒ;¼çm“g¨­%ç~o\Çpîà1Ìƒww¾Ý~N‘Ÿ‚½’5‘`aïº+½«R¹ÚŒÍKÒìÙ¼TOSG—ÆÔ¼Høðú2¼¹I˜åÄ]>*GWv1‰ë‘ÚVqw‡¨ ~è¤¶ö3DÜuÞÔs¾~¶‘Ù1‡÷È0šŽ¹¿`”±¸‹ñ£g2þnÚçŠß+Ã÷ÖFWö8Î€ZÚýýl¾ùãö3	Râ<Í]êZf4"ÑB7«eõõ	d;NÙE$ÇòÅŠº¥yÂ„Ä‰%N„ 7Ÿ¹]ï•õ¬oL‚ÅìMŸ|_£Äö2ï·Z‘ð3Ç/¿yÍ C‹»~‹£~òxÒˆAÐôu(š Ø…ÔsÙëï’Â¥óÓœúúÅ²±	ÜÔ —ãì[û›[·ww7f<“Õ£#UY’WŸ4ž [3	¼SCíG|º²6>ßÇ Hû³{ÜÊx¸É›Kïøí$å|?qçƒÒ%ÕíâÀåEum+;;–Êƒðµiñþô{É´ï#ÓÞÊ£á8NÓèû¥·“eqó&Ó8‚£ÛRßô¥ù¿ÝÔÒ+l/îJ0TD†·(gŸÕ&f4šð´É<­ÒN›œ£˜X=ÊÀy¡=‚9}m…ç‰0íÂ‹!¶°,¹XÚ/nU¦t·ç®âŒÏ·qÿ[ˆg¾0µfI˜È³s£÷tå¾?«Íæ¹©rQ–JDº–¹‘Á›†7QìšE¾—¬j±–µ9ärã¶ˆmùÐ¡êôlŽ­ìöüøn‡nRøIUz2oô€BNä9V}"!¯<¾%˜²»cž¹xñ•ßÑ–^Ñuñ6‹[CãäÏ€ô©¶­3Æ{^æl0×“mA
íæZJçË­Rg‹Ì”8ƒòf·½mî-OµìØ;Ù Ç3ns³&ôL¦H•iBýøXsF%ˆtsâð6zÄGŠKe…Ô¸Gï\¡pž¢HQc­µ
X4¥Å£!|HnK‚ðó^%÷"æ¶=5²‘Jý”RB(ºedáÆgw],¨åMBmÄ¼äH]ÌØpó1WëƒÈÏ?è)æç6q÷3Äb>îy ·yB
ÕU©Ë)QïF
Ñ·hˆ]€?‡uEd!‹ÙnàRÖàÕ5G¶x7v`&à$|”up¸ÿûí­ãuiÑÙ@ŒUkÜõÎ	BˆÚÊH…ì•"@íLFZ¥3’³.òÊÕ¢TmdhaiÃvæ3AyàFÍQÎG¶q!” rZ,¯‘ßÿœ¨	UÜ•R FªÐ§Æ)™·pì+Ó›ñÂò¡Æ´“%¨Õ
Zy†yÐÅÎ†¾‡’˜¥LþËØÜ3„ÂiyuÍ”ÒéÄ¯œF¶Ú¸3¿)¶´ñùJ°+PãQ¢5§¿¬yÂu‰{ÚHŽÞ°l®÷¢•ói#.ú©õB\íø5ìitÀCP¹à9m<Sx«ð6Ú<ð–Ú”ßÊVbÌšÓ"ÏòÞ.„—r£ôtÞSEKê5Žo“‰™_h&¥ù¤ßÞD‰mÄ…£[qŸ€Eâ‘«€}`¯²F€Ã;’ÌÎT‹o7Þx3y!où|ÃîÈ”ïü7RÌëùÒ›WÔ·Øÿ»£U“ÞÅ"ãó˜–1Ð êÞ‚>¥åeWQE=JZŠ¨+ov%OA¼$qA_<
ÈÉu.zâžòÅë^MoPºý4ÎfxY²F°Lö…ww¢'âg£Ó¸'~úñù~úñ?ýIŒ=cŠKÑ4*¢~HÆy•›IÎ}®óÔ*‰Ÿ–åžÛµ{fÿ¬7+Rg¿3g‚óÑûó·qŽýÒðp½vÿvŽ–Ò†ÜÒ%~^ù–ð²ÍnÌ¤:æõ¥¤­§+†ïXËKÏJîÝ/UJƒ#H­H“ÊÕÌ:Š¼týçÛKóèÉß25ˆFŠåµ·	Ã³ÏuMÒd¨/o”JGôÚMÈæ?/š >ûå
¦j»ãTY²¬òõÁ	òq˜È©‰ï–Ÿ-Hðêžƒ|í,/^µ#Çv6$`(ã%ÈjÚ/ðªaiµ ‹â'§•†uÒÒ¥ô¶|$ÆI´·4´ý7ÏeÁ#iþÒu#lòs9ò&?Æ®”poQë@ý¸ƒQüø).ñãÓFùiñš˜O'¿°¼ùÝú¨åê+ÈÏ|¢y§‰(ør…"D;åÇIÏì¥û]˜¹ú7Ó
Ñ—„#%˜{š-·}&ÎÆç˜ÄÓÞ|¸ñ0¾„v^³Å66Ä^ýb–^¯Ùná"~ÄÇeÖ¹iàò«¼º`ÈïtïüÜÖxçæÉ ¥Xå8¾$Ò^îY:ÂK¤_ÊLÖi~Ö#/àš’ÂÃ*J É+­;/Ì\bÝï¬)»üAs©u÷íŽë^
^Ž‹rËãQ‡.…î¸…¸X»Ì3‡×ß¾-Ž¦ÑYlïó[”Br úA•c1˜œ¸ew›¤ü¨~)_H†(o8E©G_0ÃPL³ Kó™8‰@×–W&Ñ=R×ð/Q².Ÿf¥RãèmC¦Êüz–÷ŽwS’rÜ–ÇKâ,™•]<*kïP‰;ÙjÓ]•2ÆŒ† òÈ×žÔSÎ(»)lÏoã"9I`KîàíšˆÍ$’8¢Ë†·ëùèª?aÆÚÌË×®}ß9gœÊ	ÏOÄ9ºæÒf–Å;­D2<Ã‘Ðö´0*ðŠoÁ_hàÂ†nj˜oÂ81é–"c˜åg$…‰ô¼H†%­ò$Ž(XqA! ·2víÚµ]ÌPQŠ—Y~†ë äHgðzf 6×®Ýq÷ 1R«w(ãÍ†ÜÄmhÂöá¹!›\Y.ßÎMNù%/ÖgÍ²Z½ª\~u•ê›–"aüM“rs8Œ§hH­°p:^8DÍñ5~àÑþÃhÛê¶8><zxóž.¡ÀÃd*!¸T:[ÕW®`"
¥Bªª®Ö}Ï»6x¥÷ó’!—Àð~³¦o°bÅ4*ãD+_VËkhR1g‡l*r~8ù@­ÉAÓè\ÂC7qÕåqÎ¬}ñ9”Ê¢U5½²z•SØÓ”¨@ÉšÂÄvJw†íd¯¥t94ˆqW$îIÎQ8 Iƒ8ÎÄC‡Bf?ü ¢óÏ#yšÆì‚Ô+‘p!•ƒ_Xµ¬f£$—êaæ.ûIY:Oé4=8 VúP(gÀù@yÙ‘ƒ"·ìýÅR³«Ð³9­…^Õ+Ï .‹òWóôçÑ¬NTË§[aÔ¼ðˆ™›¦š¿æô¶&]ïwÃ¨í?g«TE9f¯Ø¨w‰"³ÆféeÃä;P@D;Åø5w§<ÑÛ€X®ÇøW'‘Tõ€Ëç‡oY¥wÂ0Ÿ Å„®ç!fžFç’ÉG&êÓ6‘# ˜Â£Tipu¬Eø/Ëý\žVæ/ß¯qßÙ‹Õ[¬¹Ûhl)!OC}s¯Á<n¦¼¤qf¡MÐÑ6‹":ÿÝ‚7 ‚XHj	òj¼ðµ£VYuÌù1*[©•æÉ3,íÝ½¯Á3Î…tÛÝ$M)}’`jZ”¯QînÌ‚!àÜ¹Îc}bîæ8…ÓIµ9¶U²éÓb¼¹d:Çy†iÅÑ$î£**ˆwþ>™LÎÅý(Mólã…m
RVÑxˆLNë•²Î¦ì¤*­ç×%o¦c¦"Ac“¥†H;/š2Îð¹š
¼´-~–T—U.¬‰!¦ìLƒí/ ×¡A¿à*4zÝ{Yƒãw6í$¸¤)z©äY|->)±†hÏªë
Bi+òtCsQ”ÌTÏ%åpV–TH>~ %"R\ÍéÈ÷·E¶ '‹¨Â»â’7JöN7
|6ÆØrâŒéØØ/tSÄ0²ª÷Ë¶¹wÏfóïyÅE´EH3Ä3“ä7™Ó±ÅÔÊ›põÌß—“B‚ò‡%þÞX°’‰’IdqN(ñ>]é¤æO}ŸÝ9Ž˜íŒ+»˜oi¥‘S.‚ÛÞ±•Ã¥n*t2ÜK²a:Åå¢’ÇÌcªå‚‹ñ>¾/wëÔ5BÏV>™&r³¢…@ÉÎº%IIQOŠoTÕ}˜`†åÚJgŽ{XsÅ"ùoQÊÅæ§vùò³á¬(â¬ÚÐ¥Kµçgí†­ï2£ù×•¨}’mô‹ž[lÙãÿëjM|ÙÓÿ&ºõÃæ­X¹õÛg˜[íæMÌ­öH®¢n¶Pt‚&î<ÄôyŽ©¯—ÞÅNª	I5Ó8×ù g”ðrÖÓ·òá$ÓÏÚ‹žÊ#kÃK,Ð30yþPw”Y4Z-<k0tF‰	Á©3ù›‹`·ÉÌ:ñ®xU7"½{'Ð‘wÅ2ß`çÌŸµÉÏrÂlÍÇ‚ùE4%äûž?¿ñçàâ…UÙ®@@•]Jâ³M½LUõ %§‡Rè¢Ê¿»¨^.™NíkKãdäæäí°ú±Ìå@\%¹¼I)	QódL¿Qä©ž ¹Àä“õ¹>[ŒèŒUŒ?)±0Ð%¼™íJQ&¶Î²*‹à[:Î±	ß­º?®ªœ I³Ôde—¥ZžÉÖ„çëuñ™wU;	åçÃ¼ªÅeI×YøÇ‡B¼¸»ÿdkÿøX?Ü9Ò— ƒR´-¾ÛÜ;¹ÑÛ‚ìBÜÝÜúæºø•jáÆM /Ä¯înoëºòÉÝÃ½æ#¬-~úñÿÆ:óâÞ¾ØÛ?GÇ‡Û›$l÷Žwvm€. àãÇ‡{Gâx_¨þI~;¨8€µg;‰Ó¼MKD'yr!äPGu ÄXd`YzãºØ¼{´¿ûøx{÷	Žµ÷ÎAÞË]ÖÅ?lî«Y=÷÷‰ÇGo9YNÇî5¸.”§„Ÿì0tÇDbí¡ ÀkZÙx;Ô¤>]†Ž¸³©Í¿sÊ?yÉ§Ýš‚]¼páŒNyÓùÑÆç‚{W»Ràä0ï/áá´Êy@Èauñ~Ñ~Ÿ­ñ­Ì÷…øíÃ_]Ûê?1MG›¼BP‰ÏÛ)àCP‡ Œ¢Žª§5›ülŒÎFJJ€9ISk?ÿôã¿þŸ,-CGjM9ÊjvrB¾Nù¬ª›ý¯   ÿÿì}ÛrÛH–à»¿f»[b•LKr©ÊÅj—‚¢h›S©!)ÛÕ^¯‘ˆ6I°P²JÍˆ}Ø˜}Ø}èØˆÙ·oØ_êOØ<'3¼ %Y²ËˆŠ²ä=Ož[žmv{ÛÁKSLˆðöÎEZ&ÒîXÎ÷…{‰Ã>›]FŽz©Ko¼{BDÆø¡s8!b…ïƒgôóï¦~Þ½Ð£v[Òh¢vÒ5¤Fo¹Àô~]B/&4ð¿çb
i¯¾â‰ÛÅß‰VˆË£‰õs+xòÑÄw‰ÉÔ÷·Š%Ì7ºá^{ÎpUµŠ›*ó½åzù£âÃª,é™¿"êDhJ{ÖM
—×o%Ç6Å4\ÑQ']ejø–ûSM2'³ï.óœÁšúÍ‰¬¨o<ðü?óäÛÝ=ê4^7oWZõ()Èa€ÀG0(¨!7Ô!-h•ÁÜÔ§–-"8ñ¦•,®´xe  p²P#R\ø¤¦!cÍ¾¥¾É¦ô† õB.ˆäò¬²%Š.ª¥àÿhl;ñ±òµ©]üP‘¤#c;›
0¶¤ëÀ8³ð\Ø#1fH Ù7-0{oŠÉÄÔ‘½€ïõ¿a	ßi[«n«EÊë¦b¢
ƒI:…+EB´?`5ª	•°.<²Êž¬H7·ŠŠÝ,ô›¬–Œhxlìt1ylì¾fxË­¼6ln Ü¡Ð«C‡&¾!Ç2äLT0ÙÇõ).Ñp}:ìEq½1àÒ¼Áô^èQ†ð­ádgô^±³€z¯›»ö}ˆ ‡Éº)ý0Rˆš_ücSÿxLî`ðLw»:oisó[ÚÈoéµAàüß¼0«!»×=G-÷š¹³GÞ×±Ë9Ëó®ðJôõýœ äÓ2w\÷pg¿Ù;Úï½¾—ÇŽ × ¦þËqÐÝ¤üßÿî¬€ÍèEÆÃË¹Ž±*äMzîùå
ÁîO· Ÿó×B;äÛ&|KCV$ñtNGo÷»Œf¡Us®ÌÖ(#E;ÑòIÔŒAv"9¶Îª>M¶De$M÷c™À¾Ü‘™²žÏ¹,ÏMC+Ý7ñºMx‰^gïž!6‹j:öHÈ•sOaþ¹~ðÏ¥ƒ_ôÌŸ+ Ÿ¿¦Z$Òÿ‘Æ¿RtFY§úüs;Õü Jyð,'Íp¶6—bÐuì7:õWw¿~ìõ`Zð6;`2O5òQfÔ!a©¶µšÂÇªxÛ^´Å´M¬&}QLîïQ»@6Æ™á’ÈIQ°^~\&9Ó'‰Æ$DpÕ«ú<Âl/ýõ“+ÇÆ	+ž“Y„	¹À¦­Lï…‹ƒL¥®}¥ëJ*ìÁ¤÷‘ÚãatÙÏm–‡OÙdzgò©që^4>öG3gÅ§§¾#Š•—£àÄstüèÊTlîà[YQ»ÅÅÚóQ«d\= ˜‚å¸ôè*ž—ŽË•¿5­¬9+¢=ƒxoS`Qjõ„#¹ºçzÁq{udä½=ŠH‹—Ô^”XÂ@d%rVËY¯tMnÙÍ½díÙZ›ŒoÏ	Ãî0p±xê¹uztµ©C«jÖ²P+Ñ
nÚ|B)ðšËŽô,®–pâ´¯›Uá¨	¾Û†à[…n›’p*½.vÍÄòŸ*µxä?³†àÊºXØŽ\è¥²ôÞ(U>/I¡Õ.¨ìòÚŸ\’/¤ê»Æ·nyqì­”ïÊúO»ãN Ú]ßßKî,tâ½ŸÄBÓÈŸÙ§b•ÅÏì–›ák…?¾™#ûYðþv‰~Õˆ“…t•[ðÂþP“âñí‚Ší•^µ¦×¤ÅB !:n¯]ÿå¾ˆL´Ú‡U‘1$.½…K·0	¿­Ê²”€72cÈôô?TI-üƒ µRÍl+–ý‰³fµ¿`·c	à:<Ø…+„­£ƒN³ÞøÂ L€«ièƒã¶RßâõßçB7 ÝWÍÈÓûåÂ@4ôÑ¶p©¢RRüøû…ˆNc¿ýºq÷äæsXj.™CŽª@æuC”á 4£Áéõuæì4w[µƒî«vïh§Öj5:_w1×:Ð$èŽ‘å<s8Éœ„;Oí¡|H•*'øú0Qƒ“…sQHèúëîæŸÑn„žy3–?_/;µýý_¿®öúŸ…îx|ykoØ€öÞn£uôr¯½Ó¸ö6Ü‹E,¸ñÊ
£7¥ØuA\_âv·^ë|q'Äƒ¨ï†7]~möo ®¿ðµ¿fñÌøŒÐ.±	»½FÒ ï5ökÍ½î×°l ÷>XF©µ_ëürÔlí´ßuµÝ¯kœ½Æ{Šo¨ü‹!?P¬Ð\§ ‘"|UxxH=…â¼¼ŒÀÑ«ýÒ8Úm¿iuÛ­—_·Ñ²Ì‚ÌhÿG3o(ûYDj
¨Få©öŽOL¶?QÏýàMvƒ‹‰9¡&/fNFj¥gH±ltQsXÜó½‚¥ór1Ë­,cÝu/‹tž[LuÝ@S”ë‹ô;‡ hÔ¹ó¦Dx¡úê?« 
êjó¤d¦¥‘³O@Yiõ^Ÿ~»²ß°x‹j(²=^`µ¶SEÅ"ˆCKÁK	qd ‚|E]"¡9¯…-§‹–l_~0áŠÙš²ÓIËöÝ¹çø7c‹gzçÏ'^ø@q‡{íÚîQ¯}D#m4?oD÷¥â¢OpˆèÉúÛÂ‘öº½Fç³§³_ÁW¸mþ7p±3$ Ž*ìÜÛo¡]Ž2ö]\±,ä„÷Yd6}™ƒ¼¥ •9%m0·šJÔî€Of1¹>Ï#ü…Ÿáë²³¶¸¯|maœ˜^ZÞÔ‚~åpå?íšýfï°ÕèÞ½Õ½F/ŸÍŒg/:0š…='|  y[@Ñk¿|¹×8ªÿïv›õ£ÆÛƒZk·±{To¿þzõs»›##Ì®ƒ`©étäa¬‡ÆÇ©KÈ fâäx@eƒ…±yQÿFO™Z«¹OpËWqîÈ¸	ÀÔ&þLò`Ã‘3®Rà¶€¯Ý$„Óí6Z½fmïîM>±¿zÞÇŽ^#‚ð‹[Úüë‹€>ÉÂXWz0,3ÆsçÄU2]°çÒòÉQ£·¥oUÃVK–JZ”@‹z² FæZÂ¼¿ª6VSUW¯ØÁAêÕÉtÄ	€?OÅZ>?º
Y¶šŽìòd aF]È®„^F®2¯(df6ªÌÝº¶ÈÞA!
ágŸ´3
ÎVæ•ãrVfnGMn«³¦l#B¹Üüì©DV:½f·wD¨M¯ÙzùÕÂv²SÛ9«£À`‰BßkgÏRLBZë¶ÎÁÑîE ’ÊÇ²yÝ'å,ýó²Ð…¬‹Æà—"C 3Æ€lƒ`þïöÁDf§ò÷¼©Å-ÃRz]âü±Àiâù;Ø«ýºGNàÝÓe„FdE|ðM9'9’‚é±;ž=ºde\¬–ç<I:wY¬ÄA³ˆ¬>ý¾\‰f'4§Èêæšóƒ”.1©¶‹øV(„=Ô­c£“óéœ¸ƒ3¨ƒÁ\Œ}I÷g¡¡±¸ðUá²84ÜA0]»;4fH¿a+øñiët°"Ž!Šƒ±•m”?§ÕXDJÝÁ…¾§ÎˆB/¡ÌgÌó*Å˜àD¢Am’gð#Y\²g
”(7®&¬ÓÏ§'£¯:ï„s€NžÚ,cg ¼÷çäÿþ6Y›1åÍ§VÞ|j‘9þ1óêÙ<ôÔÄs¯bj4ì*k¢×ÉÕÜxådèAÄ¢¦Žò0ï‚Ý%HØÐWÔ½`o"×û+ŠýaŠñMs,F+§H$ŒS]€È,Ø9§8z¯y4ÊÚOQÁhz‚7ÿŠžï)zfþ–CO-®•6^FOŸØ8ßƒ«åÂj’©©!ÕmšL¾‰Îç–ZÿìLMîä’@1ªþWºJX{!§!ýWSqµÕ/ÈT¼Û«uzGö~»×l·îM]A:éq`ÿLËÞk,b7vI¦†‰ZG—uÍÚ%)¡‡N?­¥Å– ëµV½±w?6ý^o¤¸Æ°ÅnÈa-x}5ïÔrw»{zOxÌ×5]Ï$iôk'Xå¢3×y˜Œæ;©Å`~Î‹vgÿèeóŽìgYàôÌ?«»ÑPÃ92Ô¡ÜD­]Ì8/À+2CIIÈ¦ËTü¨Ž’Gp&G¤Ù½ÚNc¯ËbÄR‡½ç2’fFÔ>IÉsƒoeæÂ4¿õz£"¥ƒHj%Sè%	´§^_–ÊRõõÊ†X=	Î8â´±æl|¦ÕÛ4Ö“m$ö½6³ïý³aI²k*¸\ä–ëÓ’P@fwäá~—1Í´AèT¨”&#…,þ×7iñ´à2¹yXªÜ×x½Y:sÇ^é>`N	ü–¯€\üv"Û+Çx(éõá)àžšg‹Ø?bÏã£o(ÑH•„OT9h%äŸ^Z×ÙîÒ!Ü«Ú‡£³Ž¥º;qnÉÈW–±|Øs‰ÔìÔÆ^è÷m•k‘oýtÊë)ßtõÌ;Mj:cÉ<`²ïµ½ø.[Î2	À(U+0î…§A8ö/ý3H„
bŒ.¡å=š/[Gõv«×©ÕïH¹%71QºŠ†»„i~a¼òöÉ_	R9wG3"ì&s´âÂråtäÆû FsÕ&í@	Ì~•ò¹é8×X‚dPÛêt
2IÕE™y-q5`£ÑÒ*ºêQm2x	qò5‘É>éÀe»%(‹äžçîC§UØ+€éƒÐÓ…%ÜíVç°(á=Œ€zK*Æ¿ÒÉ¾…JJ¡ðGø¬® [‡®ÃLÔ	eu¡$áWÕÖcÚED›R8ÀtŠ2(‡ì•±d¡¤¹i<çR<þ­$ÔC9³dÈC’µŸú}ŸÀÒ¥ùg Ðw	.èáÀxî³5;®(k…Õ*N7˜…:r/?^s«ñlû©­Ô«(É”Yçt*î9Y=E}–—YË¬Òö‚){Y\f¹vT½iFï-=WïÀµgéßYšÇÛã"ÐÐ„~íÄ>(0íŒÜþPæ{ƒKD¦F£56³x—NaÛhíÞ­¼2n%XÖj¤×d4¿­.ÙŠèÄ4º¹™ÈeÑ!C/5ÁVBìy’ªŠðáþÇÁ7Ÿ¹à¤màÅ3—ž#]‡÷ÛÓ‚îÇ\Ý¨?¢4ìŸ©±ÒÏ«ecËü‚Ár5C¯øŠbT $¶­$‰éqSY2Xš«ª–†aâ;HšôŠ9¯¨øa…Œwb-QuÍ-PiUa‰YKÔ‹[¼$·®¶$˜L7µ´%Pcši’v7µ’VHRtaÞÅ'õ,35fO*ÌréL—éÐ§èIa¤nå‰ËMƒG-Ë1DÞd /)š¾7É:ž)\E4Cž|íxgn8 àíüJg×›’	ÌBO©p-9~å;œa3¤lÅÚƒo¼•s”»„¹ˆ'r	ÍxsÎiŒ0¼¦cvjHMrÏBÏ&gð"ˆW‚SçÑ£+©Ü¸5ƒ¼Q«ð¾L¹žÏ›–3àúhÃØ™ÛïC<úÊƒ/f!é*!9GdßaX0ßˆ‘Ú@Ðîñ@]2xl8ôÆÁ9o7â·gdIÃs3gLsåŸù1á¯"ˆiJ
N÷+@®hƒÁ™žxìkBw:Ãe€qÏƒÊ?–Y³ãâLI>L#¸™üŠÒ›:‘y1ñœ&¼òaº
ÞÉ\ÌªØ°²,ÙÂšùèŒÅ{½×ª3™Fp‡¬—°pˆò­ƒ:DTAr}g,J"Ã°_–O<[àÃõTž2:ÍsÁ}2EKñµ„átÂàÒÅ—¼Û€õá4A[e	÷Ož8/ŠföQƒè,Q“­˜2*¸Q4£—üoÄÐŽ€²TU˜#_RË
¼K{y¯ZáRé«5íUNwU¨Y¾²ì#ÊRqs>…´Ò&|½º:Aª4I9¶¾C'7õós9Y˜Ž7ñÎ‚Ø•ÚYª¬Iz|'µð^IOg+*! ˆáúKt1%j’m™ôÅbdü(BBÝˆl
™ÖíBp|.›^E\–D§Ó¨4ìR59÷uúp‚Ï½ÉÌ{IÀ"ì¦¨P½SoBwôñÙwy®ç,²œÚåCÅÐ-CMÏÕ›{ñl&Ê*©ŽtbŸ‹0§‰-J3ân¨kÔ—4§Òèºñ™4vkTíE§½ÿ;¦kõÑ)]º„‡JxdŠ€«GÞê´E‚2Qn#ÖR0ƒéÔ”Ýe#ËJgLê&èAP\ßGq¯U|°®qA]Ún³wÔ=ÜÙov»ÍvëbîÒŠÉ´×ÝÙÉØ"0’õ¸“ÂWÁLSsk”’¤²-Ý7‹VÂ„ÉŽðKikâ]ì¢×VÆ!ˆÄ#ð ›ºÂUÃž,sÝ	 ×»	éK2›Ó—ÿô]©¬“e‡úå‚Ë(å_¶“í/V©ºÀãºÂYÔS„6›œ=;¡#wRR†ËåÈàØ8oÈ£àÊ‘FÇ¤O#ÒÈ0Äýtw÷é5/YX•2š@y¥õ+¢Fõ.å$#óÆ›|o¾êŸ‹×Ñ¸wûp'9¡9˜“ÆÁg÷üì_YTÇçÂE6ã‡’ÕÏ!Ê5;%	i0˜$f§¤õ†&ŠIIáŠê#‚Ó#„j6^#R¥Á½±@˜nuô¶ûÒ‰ó-Uão‹‘1×¥âó5Ð<ç¨›1Í¤î†¾‡JÐEÓ5—¥ˆÑ„ÓÀ07'§Õèë¦ÒÄ¹´ hq*w®^hè «THÍ“ÓRòz©$¹˜÷ü>Há&'V®Aâ%·ƒJ}YòûU©‡†êžÄA˜ümõu¢fhîG}ZiÝ²ËQæmZe½–6vÙDü%¤‚SÕCY×±·ƒdÓŠŠ·L†kig•~y”—†\x2Âå©¿/§ž8Š¤ZŠD’è÷iò÷RlNJdH›d@•Í-™âàvfƒ3/.41˜–p#mÂËÔ
…ü£.Ü7æ©Xí«”ÛÅ”£Ä/
F¥Êéž‚xN¿žÁÅãveìÁÝV¤]“…Lµ½jà.\¼Øm¦ÒÆ{FØMævÖU¦:5?zá‡gUÈÜDµJr­.«T’{uQò“Òl­ÎÚ¡;‰0{¼¯’4øsrÖ	Ã„¶fÆ/¼‡ŸÓö¥n¸	×‡hf&šÎ–2gÒ»q¸ä}&@¯t‘ß[1Ñ/Ì“`6áZ í
ûÑs½'C/„“Q"Ã½(*Ø.áJ?émÓàtƒF|ŠÞ~qS4Òä	iÒjŽö²GÎ£+q^sõzx›Y«]ø£‘3ðNfx#:Æø,Q@8³©™Ò¾]ÔÚì7ùzª[|²7Ûäliõó-Î¨YR}!“3qëBCÿ4^¶Zd½T¼	[’e d>¢ßÒ«À×jfñxè]>!ÿ£5z¯¿"LvIÝ²†·$‚J‘
bè-:ø…ƒ &„Š:Þ`àÇ6¬
_UÔ Eì18å2éŒ#Ìô½F^^åÉyuh{j><Ìè†5IÊ>Þ(ãô'3O,i‰aï’æÞëX„ës˜u¢NÅúR-±¼Ð°†zœÄÎGe£&A'!xIW“eÀ´Ÿ—XQk§%•mçÉ`%NC°"ÂÛÒ·†º'´7/t›€™Z©ï:ecÚOÝ	–užkµß­¿W¹TZgH†Zkm ÇBáÆŽ·6·ioNiOCS:ï_±mJ	Y¥#·ßß(™Ê¥ô¨¹ïtÛNãm½Ùkì:/ÚBŠÐ–LÕÜ©õNïU³ëìµÛ¿@­Úîî®óÏüÿøç?þûÿ96uÄß2S‘|’”AQèSˆ.ÙÍ¨é“OœžÊ´ÉÔH¶ù‘bpGŸ[„„z€‚  ç‡LùCD Ózî¶”û}‚„œÒ9CÓ©Öòq@VÜ9®Jûýh[š/&=“œ³  íx}wFøÃú!ÿùçÀNò‚TÊ‚œôà.;[éŽ-9)ä,8©ý3ö%X#9=·‘ÂlV ž+üÁ
A@×Õ\Ò•„_Ug%‚³î(˜x¼!M-p‹ðlf®“ÕP<>^Zðúp'€ÑÀ,‘À¯RÖÐêéÑ_Î¹S’@º”	¥"EXN¶{Ó!×e¾éSXÓ±,®Â/…= œ%òÂÐRS®²ŒÁ°5’4í¸Ü§V¨E(×Y½AÃl®¬ðÈ @>Ùb þ•5'öÇ^í, ï6†ägx+íý—hÁ
–ö„ì¦£põð¡óB){€^OÜþ‡‡¤ÞlzÄ ßm­«ž‘Å‡…2á‚›I#Û”GÖ#£ò)Ïhž“‘;ñ*NNBì\¸~\‡ôts]ò"mÄ<õ@ÏÅ"·¸)ý!9ênLHV˜±3Ço†—¸ü©Ø2ÖÜI¼Jp’ƒ5†ËðÛö±°,äP-¿S‘;8UàGÙ%##r$€à"¥L©¨K>A
#Œ¹¼kßÜµ[ÛBãÃÌ:"ÿ2% “’‘m§IÀo&éd¨39;24^gÙûn4sG9+¿‡¼O{èZšäŸñÏqD„ã]`dc@u0â77ò–^DåvÏ
î= ÜÝ	wS"ÜÝ”pw„[÷­¤» Ùæ‹_ªÍâ`?xoR#ÛÉv”,&Á…¡Æ=~÷¢Óè¾rj­Vû°Uoì7Z½÷6¥Ùc…]eTÝ=›—5"žâˆ6ã’m†Ó€ªŽÓI³êÂël‚³ëGýY9%yµþˆÉ!âžµOi<6ªÊÁå¢ó·Ùü°¶[Œ‡YP:' fpÙñ@v¤Y< µa¨gŒ3vý	· ²Ã|pét!=3W“Ëq én²³7§§²Þ“õ*ëê¤ÅTP²®ë!êºpçÐM=¿dAë,›,@´†î%Â8Õê<çM"ð¸ñÇãY%LÏc”=Õ|ÑPTûE†3µ`y»™§ƒGTŒåµ§²»ê,óôe°èø4"ø&ŽÝþ’|VˆmÌ‰7
.T±Ï¨^ÃaÖú¸â™Î)’©€K·^PÂå4hP£¥ÍHz¹¼†¨šî:Ý)š»¼¦6whè±ŒûV\FÐ*¨ãc³þ4z>œG¾®žÐ÷Ás#:?xnDïOžLAÏ'€•l] <÷[ˆ³/¢„çÚzAxnB7Ïèá¹€iºÂbÓª:\”Þ.¥I„çœŒ,­"[»;Ð,âœŠiá¹	#<7£e„ç†4ð|ås2kqóµðØ™,ãÙ1³P….ðÜSÅdÑ¡}:å$<Ú^	JÊEñÕ'Ø·û¢»,:Þ»Ñ_fmì­oÑ§Ög;Óiš·#ãfÒ=[œÙPÕË0i?á)¨…gáËË\M(<´¡´Ø-kDÙ. ÍÛŸ…•¤ð\SQJgqóÊRÜfmy“ºcöFUÏ`Ñ®
sÍÒ°Â£ÞËò$û¾¬ÓhÒ,¨`ËUgO.dŒ5;1yÙÂ^)SÕàìD³nã®Õ¡«ƒÙÈh§ˆ"öf¶\MÜÍ”‚&Uý¥Vwm¢¥‰dësaÍÐ ÷ ¨Š?2Êu§xà•ƒ”Nlv"øêêVÿŸ™oh¶kn•1‰È¨ jB?ª
=És5{pÊ‡=#¼º='k³ÕíÕ^vjûGí»Jú%5qŒFÀÀ*8…0ý±{ºãÉwpW¬KD.Øòs¨ip‘}ÍÙ¨lQ<.·Ñ×“†¤Þ­F¯~ò)Ô^¯l‚fFŒ«¦äÁÝäì!={qè÷#PNŠ`»t– 7KÇ%JïÜ£ þü[¡ô»AÞ$s†¡¤—'²ökÒ‹]œ6­l‘ÿ+¤í1¼NHz²q¨Ô|Ì6ÈJ¦M~+õVVlØû)ç-45bƒÑ(ìze}‹´HþÙ -ÁÒnü8Óïÿ&ãXMvòªN“Œæ¶‘Ëž!ý>G:^M¾§ÎB=¾+}ŸÄÁ
õØB¤olZŒ¹rB`“_º˜hÐ°ˆO˜®D5ÛG_<sdå¹SJ^Ö*îUÙ®M¢s®Ø¦Ú
ò—É½­`$ºk-ß6P¨æF†6öVÇÀlŒ3û-Ô1o}Â
4Ê¢œBü’uÀ&/´m:n77|fÞ¸MÓáhÛ8üþ&o R6Íä,ÿŒ˜f»àuâO¨–wè†^´¢¡q@ oéAv'—òåo¾x•­¼Õõµ-”‚¸ ÃŸ£è2¤Qü0³ö	ZØ®.\(ž¯u¥MIm¡n!MëwMkÑK+³'UQLt†Xè…@±8P¸BUKYk|ª”ÃÔ+YbW5æ‹Ä'¿XâëUÛ!92¥)É`0é‡Ê.|+`ì²aÉúUòþ­º¸úHÙˆ¼DKAØ2,‘pÄ)"#§R¨ñÎê¸\ crÞ^ŒõgB–AØpûCÞ¨*óvú}Òò˜ç(Ë#p¡Ý¨l¥5[(Ã¦YÇlcZËöÝMöXø‘JJLdãÞ>Ô÷–,õððBïåõË/¯­£y•ZŠ[jÁÕTYr]Q£I9DÜÉÓšà?þÑ‚#$VŸÝ"2Z·×îüz÷y/	¶ìÒ Å	—¿—c³­ä´k\xÿîNà‹‹ä{ŒÞàŠÙ	+«ƒSñÔ™*ôtwìÎåüõk
úO%A?•ÒAç‚R:\YkbúÖ5ÄtÚ2´ò¬ˆ˜~ÎbÓ™œNÛÌ–Óòþ9ŠAHß 2ú“Ñ·PFßØB!«Ýœ@÷;$Iü\CŽQâ–öqÒ7#ûÎŽMÀ¶èIb0ôDQv6“i?OÀm]­w˜vØb†DáO;Å‚_™ö¯LûW¦ýwÊ´/Ï{cØ^áv¤Ó~ÑÜ»F Ë{Á¡dØ,¾ãå;ñKé=òA+>"/o‚•­·÷÷[ÍÞ5„¡/`Cà6!ln³"(k­'0Ò+îS/i
WÊ~¢ÿ°ø>¿hïíµßûÜ:¨_Wbáaå53#ö!C¾Y.d>‹Ë&/ÊV·Šá¿F–%)]–“xš«*ÙDõ"¤Vlœ¢Uw^](•™îZz›k|A“¾³Gù\jVíqÚÑüåi	l+$–‘I<;nÿCãœÉ!E7F¬–½CRt‚œFÖä-œ%÷-ê’ ‡w	²tŽÒ”X[
--j¡úx³Ú‡÷ò@Yö‚d1up.å¡¾ &¸î¥Š­@½q …8]·œ×¼ç\ä¦óÚwo;oç¾óvn<é»’6ôÂ+œÙ–š¥,s›ã3c3¨^TmÒÌ»Øø0Ž§QõÉjr†žÓ‘+Dh‚‚7¶66¾ÿaã‡g›?üðããþ?ž6p7ßm»³8xN3ìýéÔŸ÷Ã`ú§¿=¶þ§‹çO¿ûa]s‚é8Ï¼˜-ô»š&¡R*0ísîÍA)˜Ÿæx·ØnH!M ?Î£+6Æ9z€UK¢„‘]VØ¥)ªöa³ÊwKüTÀ0¹9}¦ú†,vuº±©T/šø8õÈ’ëÛÝQæÂvŠ$à¸«¨ÏH¾
XNGôÆzb¡¶ªáxîXôß:OµìžÜF†„—wÎ¯¡5»=Îìsu1&ôÞ*†w7Îì›tXYÌïaë+û»$û›Ç‚XãS{á*OP£æý»qa˜9Øk×vêµÖëZ÷º ²”†×7…5¿ªQIÁ ‚¶TNÓ €9¥!X§”ö¤&t\&|E±ÀéÊ¨%ìNÎÝè5Ü?¸•àå_6…€¹n¶8d$B”ÀpN(
u‚Etùi›B¿U¥;µ½Ãý/êP„IÔxa»’èðÈŽ‡p
BË)H“†‹ IÔ~=ÈWÓ˜ðÛú[½0ÐO¹Ø›˜™UÍ“ÉY=ÅÅO%ƒÃ'3=mÅOgZg*@8û‘Þò—yz™–·×ü¥×þåþº"Äþ‡8øpýÄ&ò­6³¬¤¶2Í
yd›'d['°fž<q4Ýz}ÏZ?hwtá^Fd©wâ¡+øZ°¤A@Ïô²^ºÇ(®–Á6š&l”å!n=ÞXÿ£ÓâR7ä¹º#6ÖÕýÇ?líÓ” —[ÿ3hÑŸ‰Í¶|Â€V Ö¼ëdõyüALÕ4ì
 à|_!S'¤Z3øîG­i¿KÃŽº£È?ž±ÇÁ´N–œ5 fhdÎL)¬´B€fÂ8zãÇÃÕaÕJŠÒJeÊqüS]Ë@„Xû¡7¹}5¾FÖÀ|m’tAÈ„''Ô
MÕÉšMü¿Í<vkýjt‹5¥GÐ·ƒ¥î±?)ÅÍ ®@
>ß<w6-tÅ–Œ)3MZ”Ï}i6BW‰C×iŠžÿ¡GŽô+?.©ë’þ©eð*dçÛ11Ã"“½Q1·%±%[SF›¥¢®ªCç‹œÄb6K©ÏDÈDK#¦ÉS–èû´ Ý(=)¤$=9¡ÎÆ'××¥’/ËAõ1ôà _ÇÊhµEíÒhZÀÖE£*<¯
ì?-‚Å2öb2«±ÝÌj+1™ã¶rþ*{d°¦QÀT¹æ4-¯p8²¥tº¶“4¼¬Wˆ"[a'Z<iBrè²eéFšP²'ÊK]µ—s-•n€	ç1t"`NÃŽ WÓÁ³Sèˆ,üÉ’am™×ÁuiU…¥Ä¶SÂ¦iÒl]Óô¼Ü®q’ÃÉ‡Ip1UÁâmV\Š›ÎR%]¬9.¡÷,m•´Âsç¯?ÁXWŒZ¡„Mš¯0,HH–7¨Á®ŠEj³ÅF+¢Íp¡U‹&¤ƒ2¼„Ì¹~|î…­ŠÍ¼DUÂGf¯x	Rå"”—GBÈ,;)‰Ôl;Å‚&ÛøkYw¦#±˜wšQø†ÔDAS—ƒÃNýU­ËÅ]00Ûoßmfø>ËµœŒÿ,pGkòOGQ'mœ¡óBÊ¸á™c¬Šô%J;®9ÒAfRÔˆ1ú—ÝËñI ö„þ™?qGuV@©çE±?`êxÑlGûþ$ë«ûQø:˜ÒAèá.ˆ‰|ƒ4±@²‚!pL<–ß—ˆhtF™f5îù‡Â¨æ@@Ì0vñ7UnC	×3lÁ	9Ê92Ld9OE–sÎ+°6Ê,–Œ@°–¤`É}*$7	öø. 
€‚¯n.h6=	)Kýú¼dvŽô¾®%5MŠpm@+ü„G¢>	«ŸnÊ7Jëe9Û©Xp½ò´lé•ÇiH{EÊµl¯Êl¾¡ª Kßu£p¢-»	ñJ7B‚únrš7pRˆE¥Ò7pJ?]k#McyjÍÚáÀu·s`¡ŽéQ:¢Ù}½£GW»¨.VËsòKb*q@XeÂ­>ý¾¡ˆ"úksÍù¾<ØÄ²V$[ÕÞÀqZÁáz!x•®<EÄUáo¨²šb‡üðyª?Œ(ôá‹^*ù	Hg;•ûÒ£o4¶‘Í øÛRIí††/ñÚ¶ø‹K® p0d$±1î´B±Ÿ°,ŒðXèNUù+\¯=0Ñ£ªñ-Z)Ý™ÈU&µ’ehÊ¨T§HÖZ¡=³¼­•«k‚xrîµ²ý©pjµòâ‘Vô5e®x:=ÓVT¼YV›Û£’‚h4¸jƒhA‰…^×‡*®J5Ïë`Kè@dnª2«Càò‡´`èAÊ‚rK¢âuŠ!vÛúîCœ1<·âMvET’htv-rÐ\äQ>`kÄtå„ûš†^DàS×$0–Æp9#2;¢Þ anR¼®¶%ý¦z•6	'²¬un°$;¯œ³KÛ	NÝóÊˆEQ²cQl<¯$ŠÉoõ-(vIQ]ª”îzmF]¦Û®²Ø[òéóê†ì»hhÃúÇÒ†G“ÕÕÊc%P2< |“x‘ñ°¼¼ä5ÜÁ™mÄNso¯Ùnuê{‡;GÍýÚËkËœWà’HzL_œøö+±î\ÓÒò§:bD_•Y!Òh0ÍÖwMi™j›*)m¼gÂ–‹ÄÍ¶WÅ­Œ{«y„¸•òÚ=¤‰2ÄUµÍÉI ˜`ùðŠ¢DÜpÅ:Ä÷|D*@3Kß§§^¸æ[*ø£DQ¬f'Ê1ª'YxlI>LØl•j°…ŽÖÀ^ùp
0G¦CmáZl$§@šãq˜Œ[OðhºÖâšT°¹êWBßPè(u§AìŸ^–ÔOÍ>x—"ýóì"}Ùä×`:;lAXQ‡ æßfžó'§Lú^;»^L&	ÂÇI0 Øðø•¯Æ¦¡×<xã‘u<÷HO}È´u:ƒ<¡×÷XœKè•²óÉ+æÙy8S:¸Wþ>|ð ¢¼÷Ù0ý‰sà†~ä\@´ò‰ãž3ªÙÖ°/Ð*Ÿºˆ
ŸŒdê…h}OÚ©8Ð$ë,×O<@üÐŸNiN¬@Šò ±çŽ+üâySç„0.Àv”L4yÿØa›ãôHAa	í:^?êxî JoÃ×t°üeÁÔ©‡°¾ôoŒ)fo’ÂFÌâÿ˜éž:IŒé,.x²Î¿€ËšÙ‚Åx#k±ôÌƒ aýá>KÙfëNó^ð¥”DÝñ2@9³ŠðSì†@Él±Øí€a-ÿf`Ó~3`ƒ4nhG•[œ¼eÇ:ÊÜ%û1&ç3œº&Øp§ÁoÁA$¦'2¹¡Íý>ÙÜ­%6—Gÿ~ÁÍ¢ç=[|sSY)<ÁE„‹èNÏ€p¥&ºl»Ÿ6]+¼pËKðáŽ@{ÒŽ)D‘!áYU-Y<þ€³tÍ>H‹ )iË œOu€O­©‘A	2ëÈWËsH["¦Ú±€/åô †
½ý0ˆ"ü;ffÀ(ìâ…·2ûé-öÆ ÚžsØÄ³ÑÛÿ²¦ýäñ‹‡\QâLý>`¸	ÞxJöy/ ð„T81~Óy­L<vê'2w µLµ—.9.¡;€ÔcÏAVš,Ìi éŠ”xz0«„ªZ?!›”©Ñý ð.£„æ±*±’ækÔwÔÍ‹Þ¢Ê3uŒæ]×”&kõzã wô²ÑjvÚ/^4:×#¹ôÈ‡ÛÅ>¥°CxcF“’Â‰»yÇj„?žÆ ‚¥Xüº‚Íg©ÊáÖ®¯¬¨û/qçÚ|Ù50µaªþ|©ì{¾<;UÍV¯ÑyÝl¼)r²¨p/|}ê¨¢õ(jŠq0¨ŸÐÎRƒæD˜åCƒ!^
ÁIª`še
vb' ´OJÆá€jŸÛÙ8ç¦42E ¯×èçÅƒfYsæÅ¯ðZr*è+Ë&c›­\ãQËÊoA¤÷xv’â¢Öª7öl4ª0SQxHˆa²Äˆf»Õ{ÕèÔvk¯„³á&½¡×qnˆ›`!œ)±\„@~yTqùSªf³ºÅlË[¶ÕL[„Ó´S8\Î‹vg°ÀRT™ÄLE•™^“’ÒDªg¨QµÂDêE£•¯töÖèìæza:«Ð›¡µ¤­0½]hhEin¯Ó}µû•Ü!·q_)mÚÊ½¦´½d·– ²Xy1úJÒuIk:ê/˜ª¦“üJP¿x‚*žÃ›¡¥f’U\^p@E)è‹ÚÞ^»uS$4	HÂhuù2	ê©;“{BQYh?ŒânìMœçIåd/èÈ|T½Í©ÇœWÓT¦*—IÌOæM°v]
¿àj[jðsÀk× ñ/Rø©æpàõ¦Ua]m,€ùtŸÿ×ÍÝF{)’/Ì"ÓþŒ}nKø	pj@¨š*î¢A±l`WÄ®Ž‚m˜ZXü,H—'w©ž6½|ƒë)a3êÌñBß˜uõpqþîÌ&ï”ùæãèR7É>‘}KŽü#"îÕmr¯_Î:29Œq“²<Ñ<³'wBŽ5ÁsÿîõeÛ§Éº`Ì_þÅ/z*¼qãþ°ê GP9ñžDÍÁhïÙëgOëýc³¡~Õe3ß)Ž&Ì5,KaÄ,øaP,;aqY¤0˜³I+ PèB¡qäSWae#:¡¡÷dèKÝ†×ò«jf#´BH®TÛ‰Ô†`ÅCïRóÚgM eHtsð£›™„á-„¯ÇHˆg/¦è§øN¨zzçž;ŠT…ðI±óèJÛÇ¹sáNbõpÈ‡Õ|Bþ7FêM#”æ`ë4hp&p¼o®Œrž.¨ï†Ô6óì/24ð$„`>çd;MÐhÞCZ»OÖJÅi®è`à•’Jà8Fˆw\tb‰È@X4™^ºÅüõ#n=˜Öª«Âì}$çÝÃQ@y.é›œ5ÿl;“à‚pkñJD'5ðáÄrÚ€ÜÑ2ž2;4{.øã8'ÞœJÛÀ.wt2zagp›¢êN§#/†¼ƒ¡6ÁKîÈ¹ÂÎ%X4	Þ›ÁÊ{0âx£  YHƒbþB”®À{—ac¤e6Êïç	.œ‹¤C€Žô’,à·[„ø™Š%”Qü–oàõÔ–¸˜×‚¡–X9ßÊë™ÕÈ+'¦5ÿS`q˜íQbÏvÄ³!‚éœY3mØ3K£HEx8	âaILªe«¡ìUD™‚U!‹RoCñjéL\PÊ¦bqE“NÖ80³ –,®È+sì¢›¿½G®·Ð60m[‘ªIafÑÊ&X	°¤'‰ Ç{¶jP,*‹Â*Iðºžew÷¨Öé5»½›q¹ºŽÐÃ#Xñ¸Ga’u€#]ˆ¤ŠA%³“Åìƒàb†¿3=ÍbúñÒsCÇTà….Ük1_\MM`?®%+¸Œ3Ÿ O…%òO
O¯¥˜2`™òºŠB—²¶U‰™×Z0oÈšR…/¸ü~YÐ<¨Ô:µ¿ü¥ytðªÝ»SèTÁê R¸˜”.B€<LóRr¤Žî5üLÝ©º¿ýæã*äBŽRÜ 3òJÁ³Ìì6öR~¿ƒv·w—Ps¯w1ÉfÁŒ™4Ädô<ÙÅ…¡ŸQ0áiYUÐpY¥=| þUdï:Ùøç±ƒ,•qnöb¾ƒ!f·þÙ-;Ÿ®±ƒ,Ýs÷zÿä8ùÁÖpï¨-Aõ­y÷x„’…·¯ÛèÕŽÚÝëßÏ~±zƒ}¿j•ô%U¢çN§<B˜¼süƒT~¾ä)¼/²â½ÞLYÖ²‰´ìôùeïg.M‚SAÈ%ze±–à•~ ðø<3Ö¥qì}‘Ü>ƒÝÕd\I3Å¶Â~Ÿ³û,a¿Ï{
‘’üÁï÷=‡îõ–kâ‰]IXZägoj¿j­î›F‡H;š÷_Ý^³ÝºÁ Iî$ºðÂO`Ô0¹—^x¡ŠW¼#÷F^?öøý-bÁKI÷>ÂGýŽØqVgxK<ãËg5/îCš¼jë+m>¢Í(AÒ©ej(qÍM¶]´;ñ3.%SÀtäøu›^2@è€šw“ªÐ{y A®±Ë§1Cƒc›äNa)CÕô)š¢!_ÓZàhLÆ%0EìP°tàÅ!{Ò©ßÇ…’ÑƒÖÞñ£«^Ø½¤;„†z€€'“/ôÂ l: ´Ñ™à
ôÑížGù<HoûæÕJ®èiž—Ò+ÊÔHÃ2t³­F¡a“dH›AÔÐ`²q/’¶aÉçGê,OËo»H½¡H4ò`Òù÷¤ßI·•k"Ôåß’>cuŸ.	ã»¢_d”¶VhÞÍ-	š«'ðç»#‚„7Ö	vÜú<tÒÅãV0`*¥bi¶dyXn/x‰JÉ£vëhÿ×îA­˜ãÃ­e¨Ü)BR’Ù‹#Uõ}z¯rÙº}Þ¯°€ãôƒÀ\)»%”0=P‰“QpÆ·úýšs2‘±øü)\°èY%	9ŠóRW‰³¬l¥ïôuCGY‹J2^Å:ÊÑ4…“*Ñ'óú€?c}
Á¹Ð|M=’¶ˆßW¢‘ß÷V!ËàzY§ÒÅ²ï
ÙYëŽ<5îÈÆõ÷ƒƒSî~Ä4°P©å]8;¤ÆÏ+©+|owÏÓ²k[Ù›–R Ûîñ¨Ò`*™Ä(5¤´P¶ÝÞ2î¶p*•Ù±Î»,¬¹Ï´ö“'Nm0 ;:¹LâÆAx4J‹Dž°° e‰–lYÍ†Â¬w:D¾91yä­Ÿ„vÔŒìdÛLþV`s[;'ð`ø7Ãû¬´_â,uÝ°j¤"üASšjÅæÊ)a˜´à‹`&ˆŽˆFâÆý,@D„Å¹Q|@ÚëÍx6ñ¢7ä,KÖ¾
2€]ÝÄå‘ŽfÛÔ=­ÈI(Hä=ÎÁqh"º3»[PjK‘*üÌ÷¡‚2`À\ü'a¿BËL¯>LXoTU6ðV¹[ÄÅ,£pFê+!íð·	ö^&wÕáÁ.¸1>RW½hîÝƒÔU÷“»ÕN&Z¢²í”cQ5ÀÛŸìíÓ˜Ë#T,xÀ/ëK«¦õ«–ÈÃxùýEG TÒç-}Ïè=¦Ï^„¾7íZ¬¡õ+|ü<Dð‚x§hf:&æ¾½)Ø¿0-¶°˜•Ø 6SsJÁ$M28m™Ë>ÏDÏPþþlûÓ‘+¹É\„óæÊm²Ž'³—‡gLþ¤?Œ£ùÖÌ#ÁûFŠT«èæ³R;1Óq¬o–iÂÝMÌÐÎsîJs¢Üöˆ¥Q3´½A“ÀcÚhšý}“¶uT÷V.pR7‘5´Æ¢>¼TÌóhümÄ^ûî‹,b›¬÷rX?"Ôñ®(ó<vÃ^|D•¸ÈE?Z¨Ä¡dÌ5ÛZ¸ø“,ÇId2•d(K«Vb¿ÿ¶Þ)·ÔCÝ©€y…ÔhmtN“(ýsv¿ªÄÁRL™Œú9±R¹'Ý"Aamà¹#ùº†­Ï×VÔÚWüI4xV¬Ýh»gr™²ž'^¾³ªkÊd+¼ÁkNV|Õ$Å”Åûº†~ AL˜s„%âÙÝùðö%h–¦µÍ?Jo«Î1Û‘ÜwQ	LA1ŸÈK&ÝÛ¸=P¾oJíntB£•k—*J&öôÂ„ÿ¥Ýˆ(©ÜmWGXUþ‡n`/]|&
¾ì»ŸTÏ¿ÄÜ	øH2WqÕ$‹}kÆÞX‡½+4Yƒ*c?ŠHÅó.è¥Ö~Rá8iC†æ‘{âºÉÇ|½”4“:JY@S±jŠå“²²#•ŒA>XHb¨S,¬7V"-Ì}ÂQ=ó“¥zªškÁ'µûHÖ’uWŠ‚`"˜YÒvBG%_
=†Œª±™î±e(/E…5ÜIG¤£dm¸Ç¨D"¨$«DÍóµÜb€®çÇvD-(ÌÒõ€˜Q#[ €±˜¼3ô]Ô:ÜÑXg¢f''ÅÔ²R6¬.v /#}_3ƒ¬©„Yû’µ3Zõma?M» Ì¹i…¯Eê’Ùjäõt%„K¦v|K]
P%žµ'B–¢
å¼"èLÎöi65Ö…Ô8N"EFú\èjÉ%ò#ÖáÉÚ¸Ø—N“/Çd1ßo(zåCZØ2²fXvŒ°l‚&¹_C˜>¦ù;«­ èã£+¥µ¿ÞwueÍY)Ï4"Ì/ÁŒ0æ¾?%Ã§iAü(	Ú1˜yÀyé2Nü;‘ý`ŸìŽð…\ásáMY…ZÔÌ†^t#à7‡,"èÎKêÁI"°Ó:¯¨+	/åA0†Ç@Xú`XA(\>ß¾äÙº`#¢ÜhÎ¶bÈÔOC“-kú(xì˜#óò"£•xã Q–h©¨¸aÁÊ¨ƒ¾!XyðÎ¡Q©ÂÒfe9´Üû¹âÈ£#d­Ä”àüˆ_•ã²-},®…VÒC¶ÀSÍjÌµ…·gþ’Doy`yo]*K„»X*-°ÎµVÊ¨']‘Ëü>Iü›¨æ¬ôÍ¾NjÉŒ©¥p´Å-¹¡)3}ìî`uïÓØ7;æ¹˜n†ôÈyÂX7F²Cèç ¦SjÂ©r<ÏSž7)¦_ÃE.!É9£Tš; p@ô!ÂÞ¬DÎ0 Œµ1$YÍF&šÎ 4ìaÈOOLhú ìÁ„Hœ³	Ps„2”3¿tðÔþ0ð€Bb±ÑeÅùç?þÇÿýç?þí¿‰Ÿ²/Æó)[c8ÄözïgÑ1ê…%Ú–;2“•¨tOŸ÷•Y82 œä
hQªŸX•n,Iõ¹e©§Ñÿq]â9n”æ³ó(Ó{ÂÏ×‡^ÿð¾È[;<2ÁP ê¢¬'0¡<µ+aëÎÂË''Áe?ˆÉ1§ªò`BcS1–ª®"—À™Y(3º÷m±}.çsœ¦ÙeZ],H_Ël‡ÀÐò¾Eff¡µf²°áGÚvDÕ4R× XË÷\“ª„‘ŽÜ¾·úäÝvÿV{ü—õÇ?¾rFäˆ•²œQnÖ÷Ô%Ø%ñØŒ†EÕ”æôK—wXS4#©¢¦ã÷^(Í€|˜^|áÍü|íÕ¾‡N
ßQ”.N©?$ˆœ,¨?X²ãhâN#‚JïS=9ÜÙ•©@7ãwxå²]†uÌâc6Üþpuu\Öµõ‰ j½¿DùÒ(CÂçmë:ê+9¾·‹¨ÛmIc?&dÎG-éyDÄ4ÒÆüXkD®„ŒŠ–†…·ž+¿YU²_µ0t/+§!Á¬€˜º^¼Ê>–e˜øbð+—ƒ¬Ÿ	*°“¸®"}Cñcüw~Ô#™7‹!Î’­  ÈíI‚çÈÈÍÝ1LgìDOâà€Å ´« ÓÇIŸ¶êtÁ(d‹7YjMÃZ‹ãúù9¡°f•!‰;2mZAoi"Wï#A}»¦‹Ú`w÷´™}ÂÚ'²fÇÌŸãö¯õv¯çô^5»N§±×¨u7çM­Õ5’°JÎÛZý—‡ÎX®8™;xÑi4x]úf§Ól½_AmÂSþ¯;6s\Ç»m§Õî9Ý^§QÛ§ã;lõš{ò ædÐ½ÃN«ëôÚòâ×™mPT'­„÷” MÒ·°És4O„œÀêhO<Ÿ>ÒÒÛÚN·½wØkìý
ó­ÜÊ°[:ŽçÎ_6[Ý®ó¢ÓÞw»×\4“¬Ÿ5G…NãEäP›|'8ÏÈD8ÎN%"I°—ïV	òÖ0	¶ûG¥ü{¸uÕh	Çœº¶>ÞQM—.?…dÎôáÓ³}OPX1K™˜oèCúKgžxµmÙ[Ê—B~X—d kKYòHú¨$ÚþV[™>à bÀCËV´‹òI>Ò}\8}ÒÚe0KÄ¡\!¼r`‰ Å ¸q‘Éÿ·íÌþ#ˆ9ªŠâÙé)ÒªæÛÞÞvz  8Å¨?Qà\„paDÿ„rá^âÎf—TdK4¨m°MÂ=‰à>t''ÞÈ÷Î]ˆ_Nºúw[Wo†iœÔTýÐùUìDÒ7j7@‘?†.¡WÀ¬`ûE±“´‰_q“¾>Ÿ7%Êg×FMëVµHúä£¦ï¶x;ßRÌ”)É5æªm‚	ì÷ŠFÝ‘­ÈÝš's§zAÐ\ãcß©^æ_Á4‡àoB©YácPMÀgVF¤z|á9S"qy4ªzìAk	x z‘gÆcÇÁ\QÎ‚Q¥ºòèŠ)î1L„
ÛÕ´¡W4®é=|¨waÔÕ²†çÎ)øõ“úðñÔ\‘{îÁÕ)%z{®o‰‰Ÿ4ºˆö™›g ê™†v/Í·æ¾Ó}Uû…ðwú|²®1æ“qÿuRDƒ{ƒŠ=f<)žŽï,`sõ&,ä{0ñ”~Þg…jß*¿Wd¬D¨Qkm»2Úl$=‚TÈøbUüýïÅZÔÎ.íÂpÐeåŠ­€ n1y'j^˜.¦¨Æˆ”f’‘_úh”@sÕ¤`³«@Úf¿•Á†ŠR¢ôv&í×8úÄ(P¸wÖK%$KÀ4z©|¢µ•¡Á‡ç&èU>¥ÚÊe¢óˆÔ\¥CFÒÀ64Cùiˆ|$šY_#/ì L7øÀ3¤và ¿-Î““QBÛqs%f<®D[:Ðá›LÅ\V]þÐ›Îb0£Ç
Ìl¨’Ö4dÅ÷ôr2‡ªP¢ù¹S…ÛAè÷½ª­e±@{e}Ët™¤eÜÈr0w%n“
	cBw.AÇŽ¬‘J>f%²–ËÜú6?û—€ë‚À–~ªð£‚aº…+l1¡þÁìŒ0`°´Òw“G—ˆ<è¿:Hv"!²TÆ–ƒƒBƒ–^4Ñi+WlöÃmj@«n¸ÅÊ^Z¦@âf-¬ë3-ZWèlµPîX¿!pCÅÁá#.Áô•ùAä±ÒÀýÐKÎßžÎNF~ß•l¢ÑàßcÌ]ÂÊ¡Ô]±Žôgç©â\¡5»¹…>O#cèQßÅ—* ¢M2Ÿ‹0ò¼6¶Ä½1®˜P‰{mÝ"‡%`Ñ A¨ùXíü.,ðXÏ,–ÁHµœ±ÙÍ§§~ßG±‚ÁC„y©]É;— ‘`vÙ¿2L'ÝÕ9h×>ìŠ„¡ù ó 2m•ñŽ²Øvïz¼Ýõ4ìüœž")×4cùZˆÏ_Ìúê«ä%¿ØëV8½YFiíî¥sá9¸ÆÇüu ¨eûk\qºàS†‹Iä0œC-8¤&}?™— Þÿóÿó¿*rúõÄ¡ëŠB×ƒ®gÑ¤‹>sù ¤8‰¹üÉšËû4%A‰ 5÷ÜóKçÄí ÏÐ;š‘ôËn(FÞÆ/ äJÁŠêý='ÅÂè]p©àß…AèÙ‚ÐmÅ	›n#y@VáJ¤‡àî^Eww;ë³`¯²
U•1
ja"²ó¤õxi*ÝBéÂ9õ`<öãØSUè;ZLÒËÍë¸±ÌB2-¦8Em¤®}=	—¤Ö+o4‚ËoÚ×<xã9‘{X1äqX*‡€~ÌFBZO@ qÀíšþ2Þhê€¹â™ÿ¢Zç<ˆN9{ ðˆœ“à¶–4¸÷Z,ÆˆÊ‰¤ð•¦%D Ó¥n?êx.jÂ»+Ô#ÀiÐ –xŸËì~ä^³"HÙ3¼±U	ëFã`™aÉ‘¯2ÆOðß7ÄpX·ÍíÆhL%£qZµ–€b5» ”BÓ‘D.ž`’ÚïÖ@È‹”7ŒÐÏÞùŽ–ÒÙ¼;VeHœ˜ï¥Ó8Øûõ¨×>z{çi—¸c6ÍB´¦…ÊH.uMñÓ¥6&Þà3¤³oÙ_Ë9àk÷Š“}¯xFb×…]F«xÃkð4 ¬Š!8Ïæg„¥o2FöV±ÐTÓÂ÷é:±Ä…´aþŽ%³YVö½…ÖjÀ¡¡äl”?˜JYºmœG±ÃÕmì5ê=r´jõzû°uÓu/V«ày–—ÒMIÏŸÓïƒ`+£á‚«Üi`ª†£îA»×|ñëÑëF§ù¢Y¯ÝDò†ëà3Å²>‰ØD˜H&–Iýâ}}xâÇ¡^:ÃY8y÷i÷­!À£.•µ¹ÈNÓ,µ‘¯µ½£n³õr¯qÔëÔê¿á¹Ùm¿¹Ó”ð´Ð#'ÜÝ:;1 mòÖŒVˆb’T	f4	¶š´Ë\nTIíÜsGÞ ÎnÍ9ûãªP½¢Öà4@©–K©c‘¾×¸»PUœfq!•DÚ"·z/‹
%U\-vðÐì5ï#·dTœ¼XÍ†9Jh8ôç‘!†#S¬$_QÏOŠðÊ÷þ¬;Y‡]þèG=>Í;Æ:V¦G^Z-ˆ‰ª-PU^Ñ9DD—óÏ´a¸Ë3oDp¿B–B+¦b@µda,c‚”÷s|.ýÄý‘eƒD0!/Í`ÂÏ‘qCo¤G…Jp³ê¼hãòIy•Xß`h‹JÆfXTûï­U¢+© +Óuœ„´˜ÁYøåä~NiÉp­§”¯÷RZ“NAý”Þ Òßò¬ÀP™µÍ¡`›FùQ¹é´&\T@j„ÊË
Œ¿ˆ=èñ§h\$l®+áâús1ìžÉ\·ãöP¡'©W"êBÃtVÈ§d
óçŸÿøoÿïÁƒö,vXÜ&aäóJjV^]º‹êƒÇR0R-Ê0oW:'Ûô@ÇÜÃvÍñ	~™M-BÚñ]ù :Ÿƒyf<?–­7hL Ò‚;	XYò8†ãŒ9ßAª&{ Aq¿5½G¡Û)ÙÄ|1Wû­“8¥·R'q1“µ0ùðþóPp˜ŒDº…æF$·ØÍOùzLlB}Ó’œ`š/Éz.Á
ìµk»©äx÷‰tï/OYX~DõÌ ¸˜¤Ä_éØ7p]_…½[öv=z{_õ\ÔZóÏz’(;Û [´)Q?jg‚Çaf83ËQH”ŠÅ˜å™Ê*§
-•ð=%Ê9+Úõ'}/3oJ€Ï¬R9!H¤Yu,±éž_—Þ:5º$‘ó'gÇË"Ðúä¦·ôÆõƒ1†|¶cŸ0iAv³ÞCð˜‰fý¾E§3¸‚%­DýÐ?ñRug•p\ú2ÒË½³`4À»ê—øÁÎhæ•æåÊƒÐ¤uÀ¾çŒ´úèÑÜ »q-=½´9¿2S?„À„uVÀa1ä#œB5Š1ô3œÅÁîÉ©øÆ°zô†îäÞA£‡S8‹Ð:ç­hOa¿2^Ï?Vž¾ªt>åxâ¥TÌbÛ„”CFóG¾ãð­†€Æïï—@‘Ý^­7/w˜¬QláwŸÊâÓDC?Þ#‹ïM˜‡›Žp‚©ßc‡Q„¡’L¶¤*ÍäÊÅðævQU6¼lNNùXp1ððLNg>[Ÿ–Z<ÏlÑŒ8ö~»×8ê¶[/13Î}Á)WI¢d£sSË{¡K„øScŒyqƒÿœ…h¦æ‡P4ëî`@X– ðyÚKHŽM•! 0)‡
¥!ÊÖ:Æº-‹iÝÔ»7i¹Y2Ú]¯Ðô,e‹â¶›x#nvÌ,Ý¢§[€(=ë"À=)¥ÙÔ¥	¡=5ç¢¸ÎZUšo‘ULr.¦Õ`45´åêBiš„VW^ç6$zUqbŸ‰]îlUÚú%0B£µ{°Àï˜³ ›<ÒÚxŽÌÝ„†¤HQaéœ\:3X4œvÃ``ÒÐ@^C0œ"o?Í¯`¬øU¸¤œ*ÎÓJräùs™OAG×
#Ý4ÑR%¡Ø¢¾Ò.3¹uiõñF:ÑOZ’©Ð*báwI7ïUÇ_K±\ÖÃ^5úC\Ø*¨œÍçÊ†\Óp¬Þi@ŽÍ0»Y4“¨Lú»2ûTËí$¡Pž;[s¨=LÎ+áä·¦Ë‰4©‚5E†,&h¬	ð2-ØÃXŒ îœ,F¨›¶ákAyâZòNdòéº©gATH)–ær6ÀªèïH?ÖLýô¹œ(¦~PÑÕCPÌî0-¯8|<™»½Æïédþù¹£R8™ûzunì€æ>†àæü”.¨ØeÃK©«Àv<ÌPëj$“tÙÖ`ˆÄjÔ&Ë½‰3µ±8à>˜¨y?«hW ÚÏ_œ%NÚëfãx%ðüÒÅ—ŠÇbl,èh Œ×¾wQuJÂ€€bzûÍ%§þªÖ[j,õ¡/0(¾ëÅ®?2çE{o¯:ì6:÷èöçãNošƒ(õ¹•g]¾ÇFîÖS NL'Gâ×5e“—Ñ:¶îÍNÛb…D•ÆÐgé~6¹£ò›Ø¥š‚ýF·{Wp†žQc3WÛ·Ü®›ˆ7 #•xã;ª&ƒ.fá5×Ð±›obaƒá{23vÀ°>•||Ÿy‡
u×¨÷ˆq)«Òb/nµƒ°{Ô=ì4ZÝ;³zLWW€œî,šz°~èÆ,â}¡r DÁW90ÄÃÌJ‚Öu	qCFÎ3
»£˜ç(c{®ÂBVgâ®Éýæ1˜%è0š¥ùpZR3a•@«:éªmíí±¤SvXZ	eíkmg¯P¾Ó­wš`ÿÒ½/re9•„íYˆÅR8[O*
Š®TŸæbÂX¾•Ü×–5÷‰¬û¿Y¬A…ŠTF»8"S„6?¢Q&Ûvx¦^ø!Ò´0øÖP˜ÓSÃ[½pbýFUG‹û¨E '«ÉÌëÝ=Íaâÿ  ÿÿì}ÛrI–Øû|E	îmÛDJb·A
Û À@õ´eºÉª0UI5ßá·uÄî>Øëè‡7ì‡õ«cÃŸ3?àùç9™Y•·*.¼Šˆn¨ÊëÉ“'Ož«0ñ×¹ hhòfk@ ÇsOÝcÏËEÁƒÀªÅ0>ÐŸ8¿·a‡ F/0	y[ÏiÝt»åßÂê"F°ÀG«}ÔôÞÔ yÃÉúrI–¶Ï¥÷nsFÕÞ½Ï¤a†¿$ÁšŸö.CŒ´Ö,Šùº¢6‚Zîš¶Më5úƒZ·ßìõ‡Íúâ‰pÓvÝáy¶ä¯¸%R³_±Z[µŸnÚÉ7Ãê›m@[ïôúÄ]?Ímp¡Zk¼ÕýM•ý˜Nå"Šñ„Ë£qðzž5ÐND˜¥,ªXý3‡å
°P‰–`ÀŒ–ÓÆ!AkxjûÌþ—ü;œBêU&ÝåHGÍªí¾­µëÁÆ¸L }fj&³¦ZGÃ txŠ0e®âOÙÖHuõ,ŽTå¤xY€…Ž*Õt™v:d…p½|ßÒÔ]£uÙvÉ,½
C¡dÃÖ	xpÔkÖ¿ÐÍ{cØoO&žs 1öÁíà¨·þ¿mZÍz£Ý»QÓ¹[½\Crœã¸ŽÉñÝ4ž!Æ®—±]„Ú’Ñ*ýè¦«É8=•Y¦çž¦œ¹Zø‘cˆê¤15¥æW‹A¥ÏE”/Ì†ª~Ôëw­ÚN£µ¼ú 4]„Ê
LžÔzî©µÊHÕ:¤ú:„¤ú!}'”zÁ'uV¦jño’Û£8P¥_$;7ª#š¨—7›ˆK±åq
ênHã“-îF—ûˆùzŽfÇÄ«¥ Â(¦½§Õ¥ï`5<
X35„IÉµ3ÂBdÙš“–‹§,Ö×µ‹™í5Ü]ÎtW4Þ]È|W4(Òó1 ¨¹ª”¬Q%V *ž›­©2Ç×ìq…¥Î„gÎ“3w\2¸Ò™éÏ«æf"hÇ	õò´%óˆ¸— õ]òü¥ðPh˜ÍHB‹é&á	Ï%¦¦ö"[,žƒpÄÉRé«ÏtKc¥ŠµCŠ“ãÿƒU¤T…°<´äÈ±=Èºu`ÿ1Ð„cIVfxI†ˆD´ÇVŸÆ°INss/ÕÖ²'ëÙSˆI#m¼à¹ãIèBøOeV€Ù\>ÎÜ	MËüÕg$¾r)ÏV<`ø–5åcœ7Âwf xù!’!Ø„«&¡ˆÅ\Ñ4G-øÃÍ¢pËµ$^Lã¸oÏ„»¬óÒ—Â¡v„tžžZk4eË†Ú¬#²Hª*™£R.*âËŠÆ‚ 5›w–Y‡É‘+ÀiÄAF¡–áùNj—9Ç?üÆÃqF„†ëb:õæÒ`KÜŠ~ Ñ×™ì	oé½LãÓZ&OßÎàFù³9ì)ƒ+OÊ™ð!*7˜|Ž›ÈâJØ"¤?H™ ÆN#N'(HdÍ;/l/ª;Ëðð”O¨QäìÛÇà’OXyŸ>ªA¢†ó×c,éA­µstÀÂyÞ¼²ë³Å¢Z÷œ’³ØÃ$	`Êì ÓPÝä3HOF%‚!“S(ª7:¹$‡µCcH…‰‹_v“Â±üò‹õˆ½ÏÕ¥ÑŒ£]xÅ	fæ)ˆQÇ¨û@&¼Â°B<É©H)˜«É71p%Y„ôp3KúM ÈÂ:UÅóßUhe2T¤ýÕd8òs¡¼{zG½À:áÅâUÔWj­
-Nåäjâ»¬û91Zr,™ª¥<˜o“Ø;FH9´ì)EÃ3g4õœ‘(“EŒ²éêÈº0ªìzŒ9ãzÞ7=ÒÏ;å
 õjyU0¢/¸\b›bæ»Žì7OŽg¹_kN!‰€˜‹„®!rôá»#j5"Ö~g‚f¿­µúwd…g;ØWW†‚~7zkO	ÎÊ÷ˆ6Âäû­1(RekÐ«¿iìµ»Æ¬Ý<¦¤1ëúAÝö‡Ž'ãËÌÑ,F^±¨xÂÚKÓÖ‘ív~ ®ä ‰Æ•¡	ºâ3ÌáE*;²¦>û1²ìSÛõ¥³W4N$E_å½'Á~3d
|;×S4kòRW¶ËÅì¤ôè®p“2*±nšú#‡¬¤£ÜØ`JiÆBhèŒÁ¨C2®™¡\\»Ë„æÊî6{Í^jiÀ°~ÝpXC4íº|¿aÚÄF‘Mœ~49ir©ÅÌˆVrFbXþ3\YAˆV}!zÚ§T«8½b#ºi‚…¡5ð‡HAnˆŒ=P¨ûE¡ö;hÇƒ-Œ60LO€º¦*7-‰*›C9å!á5³Op«vÔF+øøp%^‡ÒÐPì}Ž‡«Ž–œ9“4Le;³i˜ˆ†|ÈâŸ«RéIèôìŽnR=åÛ™ŽN¸7AŽN}œ„âRCfÎŸ¦âVoç+Ë†CS‚í7ÚÍ£ß°«Ý©ùKß§ŽïN£&äQ]b×ùÓó©î!=¬«X[á·‚a?Ôökÿ¾ÙnÜ1_†©HVÊˆh/ëS’7¹šà=Lak³ËSåÁ!ÈèY+âº&ÑºìSûÏ„¯´!_s'R¹$/sR0Ù‚ÛƒUë«Ï†ôA¨µ¹”²³Þ?:MCNn
=a¹‚l°b‘Bbfrcp“NytlÛOÓ2“ž§XŒÜ@†Sry*åŒ¨TùÍoô$ÍUÈ™(™ËóŒ2Ó1SÐ6‡ =)Ô$ '' {yÓ2­V2ÑR,?„û€1_“r¹àMõiÓÆ±ÑL	TXžâR7ÀxíV/´‚Œøt™Ò†Ûqž$ùø¬‹œwåˆPŽ…bGAÁØéó²Lý·ƒf»ßèb¼£‡câ	L§þJ i‚Y´7Mé)WúvÓ:pýiìD%qdØÌo­­ï_} × _¨~àƒÖÙêÛ‹íýÊÿ.8óý«n‡&÷¢Í9„~Êm~¯µÙƒ‰66‰†x»ö;BÅÉžÛÙm=E‹²ãÃÿÎ¾ íùANS[zSAl{ü´ZdÍsª?Rîx|aíÙž§JnáM[_X›°ifFà«Ïi‰K(tàz÷OðÈ-¸óÒ3\ŠÇÎcð¬X€Ð9µÃÀ	;Î1øÞ\çÁ¸Gº2
ù07/ä]=Çã'ø-8Ákõzã°/œÞ½½å#Ç}N÷Á†Œä"'ÝÕè„opdTGxQüÆá0Ÿsçcþúkúµ‚´âu¨uPDöFpèúqb“<¢Mn`T v<Ä5Sjc]¹é7`Î’¡Ñ ø@å¡%^@Z/:#B—ÊJýzíE7“yß8lKHk|)î Z¸)­Ku~,Í±#`ìˆ\a/f[Rdï´Â:uþÔó2†VBÐäß¢ÞT  ¥ª‚üÆÍ¶£âyLfÚRÛ>fde$ášûœðrÀöSqúƒðÉi¤=ÉÀó	H=†˜n°~fû§ÀUm¾”Š@–Ê¬wÇ’ÔŽÎÈd^ê½áõÜ1øøcÂ Âò9dÆÃX®>ö,Õ<®ÁÖÊªÓŒ>òÇ¯—ùR*$Œý›WÖ6+3Ý—‘u<ýóŸÉ?±E£{SW©aš@V’B™ÒY##}oåŽlk[$SÊò/CÌr¾+øø	Í
DR(X&Â“ÁŒíOë›JNÓ¬:ßè (—Í]a*Ô¢}`áoŠ­JÈÄÎìqPzzŠN¬]ÄM	>”É]‹Oñ5lZ/–fÏúê³rùÄðßßÿ½õÚZk7~ìÖ]«Û8ìtûki{§Û¨ýÐlï[ðvíåØ„![¶µ†±8ðáÚ%Ù•C0zžÁ)Û'1äë .`¹ä"Ç›5Q¨ŠxéIh…ÜÑ+l‡dWš„à4G6ùÈìÉ$ ¥H·ÊÍƒ~–ñÃ‚Ï\¾XÛæ&ž;{F_.øäÝ %2"IQ'7Ù€^ºÎZ¬qyÞA—BËeÁ ã ]vÉy}aµÑÄž8!"Ý¾œ€‡äŸøcž¯É‰µ/eŠ&îÐOI~¶Ç6„d%B‰÷F²—©‹5@g^2äJÙÁ:á“Å7	ã•'®Œ¡ “‰ÑX µtöœÑ0÷j­V§}?Ä„·W¿z‚Â¦C'Ä´§þÐyÐ°Þ«¼p¹ï9÷Ã­ bÁM¤ŠÌb¢•RBwt™ùD+ƒ¬Q€Pp¦‚t!ûº£`q2l<ù½“y,8F@ÕJ`4—_ŽS†xGz&²EóÐ$qj0!oécÃÊ©7Õ‰4–Ò­G[ƒÐa#æF½•ØVÜclEžñJÐµ¸ôãž£“ä,€Iš4Ç è”W¾¢ÀÿOžXµÉ„ðíÇjtGè+3q†î‰;DVÅÈz-b¾`€8m±5pÊ%	±âž¯Ò¾{†ôZÚ¨Ž)0‘a]ñ+Œ3ïÀŠÉ{9]Æ}Ìäª†’ LSÍI³‚·+95¯zm}šÁo2Îad®óÑG(ÏƒÄ×ƒ+±F¿C,ÎØöcòî†I¶ÎÙÊêBøÎpÞt1Ú¤M¸½Öñ3ÈþUS¹"¼YAÊ´Ïò†ˆ¶‚È1@D}pGN`p‡^B®±+O®óoúañ
~–eH†EfŽ¨9œ+Ð¢oN!¦Xú°DK•.Â%¦v6±F)¼0A®ŸMÇÇ>ÙàÚÌ“7&a’à^Ÿ-Òâ|ËŠHºˆr™ù<ÐÅÃ­_ëöƒFwð¦Yëõ$M$ñ\È$l²¸9B€ÅƒØˆõ’:lEYÄj4†£gÌ)1oI	yöH Ä¬ÝôLÆ–3†ø`°3#j!‚™Î
Ó¬œRpLvôA´Å¢Õi²åyÃ_‘&!ò±9Ùo‡ÁÄ‚>áÑ‰rŸÙ1DêJ}	ª–¯>'3Æ@`Á	a\¤ù§mÉÒŸ¹˜‹gDmI¿úL1â’Z©¸Ñ0cä2ŽÉýó‘¥ì½ÙB]õdRïµ„ºÛ›i„­ùclamq…£l]j‹}bû={±zúÎ'*ì”Úú¹I¶"œ ÇŽç:äè”×„¬ÁLÀW*Vsmøÿúëùß9+¬ŽçúL*>!ß×Èô˜¼¦”%ù¹X‘=‚VÏ@îkS9bûœÆƒ;&ÝžCŸ®|D.àÄq<Ê_Â. ‹1hñá¯¿þÃ?©Ý„AËe°?’z{dõís‚FbkhØ…|Ç!$Í™È@½ø£‡ÃD;0¼!a"‹`8 Þ_þÛÿøÿöŸÕNýÀúh_è`Î0X5añÀO‡gtÜ4tùd„¤·¿þú_µ¾FÎÑdd‚éZÄ{Ä5;&Ð81øYÅˆà˜ïáBjëFÚ¾ +À¸„BÓ‹ý£Kà0<&ßm5«;väÓÀrŒY™!Ä§+
ú—ÿûsÒß{fó< )©eQ)_sWÈ)êGi\Jt…Ÿ<rYvM×Ây*[‰²ç Q#5ÞF–‹!ÈçóÎµþ&U1nm$/XÞò{ÈŸÃþ™¼3øê³«²	íÅÎIŸsòóbñø‚	ù›—ú¥ç
0xY.k(ÂƒëÕN=TóðÖ‹qÄ"¡±ÝYáÜÜèKÃ%éž€t·ù(Þ#ÅyT £@féŸ;¬ªÖÀ¦Ò5"ƒù½N.’„Ô8C1¡éåº¸Á(Dq×Èš¶÷9Çu"ŽAÀÒßúáBÐú^ýÎð²”¡«ê˜30¤8h”-òWîHfæÁþXÅ÷ªÒ>§¨Q…ŸjMUôåÈ^EÖZöJ²y³ÉY^ø¼—žH‚YcGÒ[8’')klã‘Àpçb*°:æ_ª’À«[7³ÀwùE\T¹­QÜ{´ø—§CÛãòwÿ/}×nR M½ÖNÖI—Ì;9ñ2,Hà£}åéáW¨¼püåŒ%'ÂÇ‹dÂE…SâgæeYýˆ¦XÂmþbˆ÷bŠ3„ÃÇÈSŒ¡Çk	°ß€hìPáÀÉå„…ÈV¥	—*s¯~–½7«Ÿ¥ïÑêgù{µú™m=Å?šÌ,ýfŸøç½öTÎŠq©STM¢¦QÓ‡´*â«[Ã¤#•e§¿Q¿™,!ÚíÎd»ùU[ /“6R!¹"—ëŠW4Ø*‚¤YÚ*†|U´u‘ÃK"úOýèÌ=‰åyº=‹L‹TY…™6Û|¥©¸3>s.Ð
U©)¶§,IÀú~YÃœ"„_K?+XÊNHyF³éöºt2ë©g‡n|€ßÞ„/Íä÷q©íB4|fóOYóšílŠ^¤m¡u¥}•¾²„Dg{ÈÙw¾Cæ¥9À©Sr3¨w;µ›MôÉZð<vÑÄÚ*ýÙmÝÄá3³¡4…LµOqhƒ@Ñ>ö>¹|™ŽœÅwgi‡^çå*§„ôªˆ«Tû39'÷ƒÀtïÂ¬Äì57!PÚÈvÊAž`¢¿(@á©+ö«^íó‰?Ö-È¸áÕgoj=«ÛèuÛÝG˜xTàÙ ²~ª,˜ú.ø40‹Û…ŒÇ î@úýOÿÂÿ×9óõgœ0¾02Â«!íüäØÒŽø¬€¾¿Pè»ÞI&‘‡Ï¥’•HBX¡k¾x5?&gûÓK“søù&9wE¯(øˆ¨=»‰mÒÂS¡£¯ÖmBmÔž!wÃfBð6Ánà€ <ÂÐ”»ÚIêz‡ÎØ!SÏR“E%ýÓÔöÈÊ¢21&}œ’û*Ù#-& žú×+ÙÏs˜ø¬flñ^Ì—Øì:|:“§×¿oÁ>x¼Ô>xüšØw‚Â‚ÝN,WVTVTöUDæe‚vfƒ*“˜m¦ø>ÎgÆ½!7TtaxÑ	:Xš7Â7)²•E¡J!Ö¶Û€œ´ûµƒ†ÇÕõÝ˜\äz)ïÊ‚«vj»¬B‚”eÞˆfSô([šâ¤b 6	b÷ä"-Iöònc¦l8ìô›{?%Ù¡{Ši¤žJ} o§ôœj53[­œaÃž­¯d€ì¼²Á²ö‘Ò)ãZ'XtÂ™V¥=r¼Ú
&ÞS{×­i5ÃY6Ù`DÖ#Ž4î” {#@õ°³[¯e3mI€%{˜0ÇjK: i~2Y£€#øhzy+ Yï/àRCˆX-©¹8ÔªJ/ÒH†´pc¢Mý1«ÂÌˆÏü6ùE(¹®Ü1hì…²\e{S®ôî½6†¿ª*Â¥EG.HiÔ.‚‘îÞ"¿FSNî<5æ‚¸Ä¨2Œ±Tú‚€\úMÍHÈ·*ÎVÅŠ<äuEL—%þNc”¦îcšO2‚c¶dÀ¶þÀø%—QhŒˆÔ„	[b8vü*¯­_ðÛ£]ýb}mý²Aþ|"ÿÿÁzâ–ßm¾¯Ä¡;^WØKŽ‡BÚO³«UÁªˆ­ ¸ZO‡²!ßF¯+ïÒïË
Ø%Á8ë’T(ˆ&Èî˜bo5Ìû—µhô­²rô!]>Ç·€X@ZBùÉÒ‹H›»ÊeÄ®q!±?óRšQ`éDˆ	0]¼lÌªÀ¡;¢‚)Sñw®¨A¶2Ë˜ÌXO‘»l¨%FÊÃË"]QïÒ¡ B	*ðA¬¥™lEéŒà4äÚ†ï¢÷H(K°Èvã}ÇwBxd@\K+MÚ?eàaž­‹¥ØÅPÀ©lâ¬#°Þa2<-L
;	¨ÏN²F6'%ÇŽ.JE§]jÓA+~±­ T—N÷r!Ô ûJNíY¥«Èœ
±{çoçêDªS¼+rœÏr6%+0ÇØƒiå5Hogs}CžáEQx¨ÕæèPHY\¸7±Nñ®ì”ØîJª3oWˆ}îÐ2gŸjåâOì‰Úþ³{xÄÅqZ­6Î×—P£x7‰»ÞœÈ©Õ›”àYÓ ¡˜Ö(Þóñ›s^J­âÝ}ÚCˆ¸,R±ÞäJstÖŽnXñ9:¨ŸÙqñöiéâÍ{ä
¹GÐ=g{Ì³`gÆºvý½Eé˜ÖTº5e°?´crú´ërN}p6¤¶XuŒ^UüÆHYP8Î1¿L¤YKûSÐ\¢¥´À•É7ËD>A~i÷’"ÁµµŒÛOf{»n4Hån£ÖüØé¶v»Í^½³ß­¾i6z"Û/¶@Óxñú„³J~0NUÄ ¬ßAˆ™ÉJC¥E1úº¶è””^*ÀÈ&ÐÇŒqt¾—Öú­Ú%÷ÑÐx@zT
'—>€<ú¦šn{Vòîyrïpï_*u²,Æà“5ÏWßX[“©¬Yæ­Oº$´x•}]4J¬Lw÷E.íé&Àûd‘m°ò«ô|`SDËNhsðèBð£v«SÿaÐmìšuˆ6±|¯C®^WÌ."NÜáaà$dŠ¿¥ÛøÔ÷‚á¹n+M£aèN`¨4z7Î"yú*1,ÑD  ®4l0Xzò­PjEì¶ác.uExðq–-â…Éü6³äªà…v³*¸áH#ÈPzaœ†ª¨–Á'Öc%€UÉ^!‡AU‡ˆÕ›Ðû	€™åÔÎ¶Ñán¥Uüþ¨ÖjöZA,<ýŽ é÷TrûièÙã‰3â=æE=MVÎq²Dâo:{9¿7“	UÕA^Þª”Þj<kCDŽ¢A€D¼êwkÍþJ±
…n×WqµØ€µj:ª7º÷ÈÀR¶“¿wœ°ÜÝdøb§®9t®/ˆ?Ë±« Å¸·ãB2T¼*’¦…¡F¡BhÀAú›½O§øÞ.¤à“­j0),ìppõN›‰úÒDâÎù¨ðäbU²©0ýA½Öm4ºƒ^_N›ËîåvHxrt–wÆk.ï¥f¹ò(_ŠëÁÛYbx’{Ä#Á'§é3;"ìiv'šùëÒ¶cÜì-Óó
ç “ôä‰ÕüÇRgŠq†¶oµo]+úè‚d!°·ÚÂpU#¹ïŒ¥K³Vä¢M»sýæ&Œ³CÇ	{1zp'V	ûýýVc°×êÝÚ ®gˆX±gŽ/R¯(¤Kð3ð½‹›Æ°om„v‹Ì j	àª/æD™l¹jla$÷WÈ8‡-{œn<žw|²¶×Ã{ˆØ'<Ï5cuŒ&)I§‘]ªhdç]Â²õúƒÁ^£Ö?êê'îgËÇœ=…„Il4{(§C~’Bˆª=“Ç’@¿ÀÈÕ«h)¨tµ¡ô}Î¬»ƒÎÛF±‰ß–)+Ýð K'À–ŸÐ¨‡`_Ê9S¯wpaS¯ýXëîzo:?Î—5‰®!B!-£vÜ*ïÍÅð¢)¡P¦Ù‹Ñp:’CfëgÖ[|VâàT^BSoÎßíî7V4	ÊhüôÝ¾ú Ón¬@$Fîúµ1j+®òzz+î0LÂ*Ì¸ø-¦ßü¡ßùa°×iµ:?6ºK»ŠQ€§6J{ÜøAöJHàPžg=šm¸PvkK²Ð’`”çÓÐ¯tU~êõvB¼{õnsçaUæ[•‹`OÕa¯`UØMf¿ÓÚôß4V ×t|ðÕ¾Úœ¤·b5À9ÚõÏH.œÌºønèÕZÞ`§Óé­@É@–ž†‚¿÷`lÏ‰p®UaÖÅÀ~ØízÍýö UÛi´–‡:&7º–ü»vj3áÑ «´`TóGû€9:%`àòâh
æô³"]!zÌæõM²ø²™KIr¹7£Ê5½A	{ôRiÑPèi I æŠS¾®¸Ñ®FYÇS tÇ÷.dƒ©ñR3sÚ
—T§Éy'N«Æäi[ÌÛ=§E‘Òt|Z‚‹Ÿü4
üìÆŸng7.T -Æ.Îƒ6ÜÑcp/ÉZ¦b­àãŒRý`RJ^gô»í@HÛƒ³šy¦N—oUÍÂ¤ž(ø70›Â­»Ô?\ôRªÔ3µå ?F!	Á##Ùhâ‹å$ÙÚþvDVÏÐ$56D{¢ßO }Ï6äÇS0¤,2
z\Ý	nuJ¬hqIkÃ˜:Ü9á €’D(L#5+ô~Ö§¸­§b2—¼.dÑ”è\Íê1í‚E†V"9¦S”±&	Å€®—²DmÞ¨ùñøÏ™ó¿úÌÐÒÀR®¼­±ýÇ ´FŽíñ`~Ù±dÅÚq!±
å!ÜËOÕÔ¦,¾T:Ã
õ7“K-“üt®Ä§ZâÒyBDoÍ#Zv™Q­ã®—†œ#‹Í²°ú†oSƒ˜Ê3%Wf7ÿwbÐY%ËK|º€4—Y'üØü¡yØØmÖÈµêà Ö]ÐG4M˜ŽÇvx-vPÅ­ÖCÉlÅ`§Ú&|tÏÝ‰3ríIU˜RÕ
è.àh¦ÝÂâøÃ­[<ZÒ…Ið(=i)ðÓéú8CI®Ér¥?ƒÐ=u}Û«3ƒ]Axšù„¹œº«£ÀU„ð-Dq…FD$"z²áKaîBWÔ¬68±Bî_ŠÎ¥4o.ÝÐpÚ7PQ7Lž~“›Ñrvƒ¼à+ä¶©M~F{Ü`ÿÊõT”ÉjB+÷JÃ6¹ááŒ£òanÜ'jF;‰Ã•ŠÙkb÷ÌUŠ¾2m—Âv}dùó»’ˆø
Hgm§sÔg¶¢?¬ÐTR‰\=¢Žéºy(eÜ#$A‘lº˜Ý±lfšacºAsç@Î—*9®õ#Zðœÿ»¨±T¢ÙÎóë¯i£ì/s¡þähú„æ¯ÉðÔÝÅfæõ*p?™N‡SÓòÝí%¹ŸDÚmìØ>Æ»=¡¹™`Ö¥¯>ã¼:^–ª¿ùyÓº,I·vWúÂ'b‘9ÒÙl©—…å²ÙÌ¾¨l¥Çõ¸lÙ÷á(TJËc£3í		¼pfžJ~]‘ ± uÜïúhß~ ¢¾×kvÚ· ~v±<°ÏÕÀ}áóüäÍæ´·˜
€Î ëØZ WÑ§ŒUÂòâ{l4Ì–’Ô­-â½ Üíñø"R£@L@ö:]†k+P&ŠÖ<yû5^V€˜|Ðä<£ÏÈ²úº’úÉ"hS›—ÒL¬XbûämÐ›‰…üÆóaµ„cßNG…×Œd1TågM†j§ÈÃÌvÒJÛùÈ\ëJç ösf§ÃÞñaÑ¤ž“^^ã”’ŸÒá(¶AÐz&Ó~ï?<;+qÎ«*gotí˜\,	®¼åQ¾éã÷Y”CNUo2~¬×‡}~,6º„pÔÚõ%TÞ…“[Sjvè„'‰È:¾£ØvÕ½Ú“5_ªÑÎƒ ³\ZŽ{óœŠ¤¹ÿLóS_ŸÃÓbdUÀh‰ÂÎB’žPa­•z,Xýe©ã²’VQ*-=Í¡ØÂ`ÕÜôÒ&¾gÌI’½bJ²M_+ÉäNËþl³¼Î(Ÿtˆö±*m8%·Ä<B°Û¨·šíE)Á-fÑ³¶lq½+»ÃMßÍí©j;¡ÐÅ`Îã3kÝÃÆ
„r[6,/ÎBÏxn	]°bºØˆÂNJ2Ÿ¦yÈv8C„ySLùç¯[ü”û’%ˆ,šcÉúwÜD˜ ¼‰WLR%’ù„IßÏ…Iß.$Lú–UÿnnaÒ³­Tí½ 4iyr¸4A\ârØuFu\M-Ææ|·Ã¹`:uÓíPŽxd¢]F“ßùØ"è´ Ê§,%†·ÎãºhÈLÐØ€Ï—ù¹EM™E3im¡$Ì…Ø¡\†¨ÀP°`˜-U«Nì(NðVÌ˜”­¦Z™æ€:Ñ[ÓRIÑ2ŽË>Kf¯’–ÌU.{%ûQ3ÊÅ„œ‘|¶7Am@Ê¦5m¸ºó¾ò€)|gp€sÓFÆß}áL]ñ-™©s¨Ôw_á°*üJ´	µ±]T•@PèAPˆU´Çö-T"ø\D½œ*!Õ"pm:dˆ*¢QHdä4Ú¹:˜¤ã9´}ï¹rAœaÕÎ3!eõ‚üj^ÝÂ,y“=Àéó KK+˜(Æƒ˜ûºDÖÖØ¾õ“ÜjÝÓ[DS<¦’¥u’÷Ó’â7&|K»ÎÀÍ”Eä
ß²Do¬ã,º”ÕBå·ðJdsÖ‘ Œ¼ôª<{CZ|¶|îÅ¦dí%Å›-"ŸÛ–¶ÒÚ…½k/¡z–xîRE‡e¸­[}ø*z+5#SRmÏL9+ä3¥…TX$ï‘]^rI×*Ô_çµ\áö×Š¯ÉÌ=‘Ï¥>¨Ç®G=GðƒnLDHa¹ïœnŒÃ{¯Œ}ÐŠ}éZ±š€é7¨3£>LÚ¨s)ÃV{8ÞKŽðAvm,ÞB:°n³ÿ {P‚iJ°rm/ª$zPƒâ
	Xï¯!²p¬¹5 °®c	Ýˆœ!½ØW1ß.¶fAsEæÚM:']šF²èlÓ†ï†äqnŸ"qEèýŒ¤@ªf¬ÊlI£¼‰eÝ¡òîŠ”‡xl?H#Ó
FBû >¼õ!ì³+Ð*ÍP .²M4¢i6…Tˆ…=×î¶ªqäx.¤Q¶l¾XÑYð1Šƒ	”KCKhšÇ>ˆ=é!êúV+ còYýõ?ý+ùÿþåŸÿ—®‘\F¹-Ë"çUA~›h·çUAŠ'¶¯U)¶påŽ¦­2Ÿ{ã'ÛwñJ¼ñË†*'¤¯ç’ïå˜¡-~±´¶XÕ7Ïä¯Hl>ÊV¡O~`á”
·<h”3Ä³·ÅŒ»ËƒNùjtÊQ<õ!)j”S]r³UI˜­¿þúÿ¶2…óÖæö¦ÑZ«(«õ‚U1¿Æy;Õ8?ÿ²4Î@/ï½ÊøAçü¥ëœwD\¿A¥³i…´ÎòfKí¼âô~2ŽŠçëãçÔ<³x¸ˆÆ;µv»Ñýâ2¢½©&ïØ¾PU6Ä1>VX³¢©])'þöÁ¸óÚŒ;ß>w&˜y÷Yí_€qçÛãÎFÛy{;Œ;Ã(ÄfXØ¸sµ‡ãýc²?<w^=cJž€É,²z§µÛhö[šK÷ÁÒón[z½:¬,¾úà$§7rüÁ©;³Pë:=B7ÐíÝæF·½ ìDä’”a|,`šÒ_ rwËy~5a§éæBÖ¬Tã…-‹¿L¥ôoÈ_fPzc‘E¦7£=RÙûŽï«1¼€¦ÜË{¹Ëû³GË»C}¹òŒõ7µö~cÐêÔk}Âp<ˆ”3–Ö†hO£	”ù¥¸Å6”½·˜Ô¹ßÙßo5½=¼`tvE£§@#Ðs}ç ‘¡°žåtÝk´ZƒnsÿÍ*ü”ÜØCBxB
F`â:$hº‘ä·>Ø…«#ŸÒ.b9ô”øX*¦ùC•²üÍ{I*Ï§—d¤?-éz×9@³Ó€Mx¢¥tGJoZ²å=Þ’i06õß¿W$—„÷2Ž†îéYõÈù{H£J“øñÒ­ P\óÕ3´×ùè;a‹.jUÏ/wÜa	@ßÂÚW)
Ì0ÓbÌ7‰tÃ€›äxàK3½†™ðMª›@Ì|ÇK­—šnéµ…ƒPZ¸]K ÀÆÙÃÌ’‘ qaà4ídôRÅÔùÓœ•
(Ùr=¾fèMGN´¤¬*2lÙ²(ù÷Ì+A^PÏîù@®]Ög¤Þ’Æ£lØ+wÂ®:Ò³$††´±yÉãéÙñ·Ö:[*ë	Ä/+/pÚîýtµ'^?Ø™^l2ÑUeŸMÇ¬Aê·Ø¯:êû|<&š=¾©_1SzûÓº„\›2®;	Ë«*´PÖ(ßªÎèt.3i¿BSD(PmZ¯Ó¤ÕXŸ±ØÚí;—^Û9Ú‚+|U,Â
W[;„Õ×ÞUMgzaœ¸ÇŒBÖz[øÌÚ…3À¬ú9ÀOsð¼Å­½$E`ªÙ4Ûo›ýkÉk™
H3uùóûŸZ-’úK„Æ² ¸Q1V¥ã`{mŽXš=ÔŒãúK“³šT§©Òõz“Õ¢®î
œýÕvxû/4}ÍÝß8¡/,Q­ó9r£¼ÿN{rgŒï6‘ëLSû|…ij3ˆÆ*ÜªWHoõv]âT¿[ó‹t¬^÷§³5sø¥ª‚Ssì9;Ä^Þi{Ë™üí,í)’¶%˜pk2BÖó¸Èùî"¬·bérSî;Ûu‡–é>Ÿe\Hà³œ	|–u%O¶;	|.Mëiö‚˜g-Å°¸Ö¾l É?3]#’e2»Gæ`˜Ð>.l¤ø5]¯uyýÌiï­pj*(Ú³–-ç@0W`¦úÐOŽŠZ9Û…Š:¤Hmg»¦¤ŸN*ég	w•ôct\á~*…ýR2:ÐüÒ°2³äIª‹
ý8Ê¬¨)ð³}™&Z@Ô•9ƒLy6›ðÀ(gÓ¾Ìò¼¤ïÁÓ…tž-ÍÓëßƒSóõ85SCý·f)…¿snÍ(¸÷ŽÍŠ{	|\›¿@×æŽ„í7èÜlH!÷feÃšF–É®ú¨¼üŸÝÕp~NÎfÖoæn40}ÝF»ñã Þi÷»µz/’.º¡7¶GÕy¹_bÈïFõiãLæ•Ý®²!°Ræ†°ÕM€ƒN+e7²¶=Žky~½“­Îña\A{Ò(Ý™+_&ÜÀáîU†BJ>é…CÈz­Žˆ&ÐX§;5ÙŒ´e«jµj;V/¿ï”ýsM{ô¤æ¤ïMnt@„³yÄ‡¤3àQ<j±qÓâvdáYnÍ‹UÜh—@)t§@A:¾wQ6uoQÚ/UåÈ‘ŠœŽ/Jb,&x^3¥éø´DïÊ‹(ðåFYtñ¼Fc×	iíwôøÌ==“Û–ß·‚Y¯ûÁDêû»íâ]C³bÝgÒ°/µì4uP‚èì©D-v{êÅüùzºìš{²¡*)–!;$Œ³½FÓµf?:p5[›Ï7¬'O¬§ÈBFi»Þñtüûi Ä÷)–¨Asþˆ°¡d_#É°FŽíÉ5¢.5	#­pë``J„Á…íÅ‰-ßÓMè!òÀÞÎ»°Ž	®@³RÖIò.…ƒÄtò2ZE)}Bˆ6“´äQb¯Î‡f“VHèŽgÏ=RÏí\ $'ßâÑÒÍ‡˜•ÒÔª4%ñ(2íå4ÏûA³½Û8lÚ+;„nâÄA[a‘y‡¹'‘‚:â
(¤Áÿy„ò½ ½VÖÀõ
§¯ßë½jÅ}@@O±¶Ó9ê»½fki«‡œU-ÈÚ;¦ñŽè!Ý@)Õ„kv¤ÄÛw¤€àf¸`0Å¬oùêtûÍ^Ð<¨í‹‹£n÷ Ÿ…™vdðÄ#ÒOi…+þ†l›ÝÆ^í¨E°£³[¯õú=¹¥±žJ-=‘Ü|B2Ô–*ätiØÃ3Â6Òs˜Õ0Š£É=Qæo%'œ¥‘[1¿+­L¦Ñ™Ú»IÒt©0±Ò=Xd	Á9ÔªJ/	ÆdƒºGˆHrÙ"
ÛŽ÷ 	zù½4Ù…iç†òü86¼ÚàÖe4*!J”-Â
Ð/cg|ì„¦±âû²r»–ßæÍA˜íI >Í»QùÆÍÝp”1Ñ—¢SŽ„6ëcDÉ±:vqÓKhÓ;üæ¶£Ë: ¶Ì£SŒXäšï„ît·¤Y92¬B8€sŠ-›CUp†\WóÏH‘ÑùDÎÀCÏ¾°=F]#kýÜEeJšŠë÷;R]CSM3†¬Ÿ#~œgã‡âÑ•t§#†„?¸#'LÃ’PC¨ûŽwôž¯‹ñeîŽ²ò!BÚÔÅQ†üÃQD®öòXº4ßÄ0 lK4	P¾%½Lj?`	6“_Õ«ë˜À&ƒcÄ“Q«Sù„ï¨Hq9è¾'ÂŸ<R1ÁzÍÀ(N]·UÅjF„1ÍOÙá"~d1%{©©ôIÊ[žÎ¸*'ËbW;H¯ÅG¨ó9Ü¿Ýúi¯Öî­Š½·qXß»8±}Ù„Á‰ëÍ°¢©X{n
Éõý~³½¯zˆ'=dyLhf­H…ŽÕ,âOñ¬|®Ê.Ù#õd¦ÇÑ0t'€6‡¡;t8äÕBå8Ö${ºÓSwWhÁÉ!Ýw²â)Y‘ç¯ÛÞpêÁÁåúnìÚžåø§äƒ+¬íÈãa0v¤öYÉ>p÷njL/B…-02Wki
›•­mëø“CÊ/a`[›Ÿnÿd"äšÜh’;‰4”z0†gFð}8„­Ma¦Núî:3ÏˆÎ€”·B„ldhšð ¾äóˆÄðàpÏ®6âªV@»“%nÂ³mŠlÀnûñ³Í¿!‹`‰Ð?ž^Xnœ”c8¬Ó.å]²—g;e Lƒ6döHÿV(%¬S²ˆc+k§xh ­‡@§±G°[3"b„HQJ4˜ýŽ¸¬¢„‹"VUÅ´´HLÐ¢*âˆ.’ãÆNQ¼Q”,°ßˆ-½Ôê·Xª-¶«õ1ïYüá4–»¡þAàÇg¤êÏ_}VD.õ¹‡„Ù]VF(ôÑqÎÉÞy^.8Žz YXºa•6KåËŸ·†ú¤½hç‚w‹,gºÚŽRàRÄ÷GæVÞ%Óx/"ýÌÂØû)@ÔmÊlª¦Ú©`Ö7ø_nôÍë'Ëy7’­fÇú‘&CuD#~vËÜØ¹¤kï¢8ó ‰fÃLyØÎßqjb4â‰ƒØööéê§eÓ§lÂr[hÖ(õÛ°šÊü•º
žW3pdy‡Žr§ÛøýQCcs–1%$4˜^UŒ$¹ž€ª»ÎŸ¦N¤Îg³7õrx‹T5Á€îôš¨ÓŽ7u»æÅåìc\_ý 
£IxI]^‘ _ý¨<LåéK¥RÐCŠH¯8F®lËz,Õ¦\ÔŽ=<<L¸TJ~OÂ`4œÕViˆÒ6%öþ²@½6#Ö¬‚2•ë8SåãP¢SèpÌ˜_veM^›œÒSzˆJtÊ„êsvžž°Å—*§5_^@>¸<nóÕns;Ìö¨)¼ùéPD{íb*ª…ãÎÜ!90+Sß†çŽÖ³ÊÍ¿Aª¬œ.”LÓJÖk´7²fän_!1¥ØàÓ>9/LQ¤¡åyfó·U3ñ¦q0•Ôä"£(ÓY7–ä+šgŽ€e|WÛþÔö¸)m–hgµ8˜„Ò#ø®cŠHåòÝÅŸÃ£V³®™Ü5Z¶ÄZO¦Çž;lRØ½_òæ~{°Ó­µw»Zë&W\nß¦’ÔHµfPÜD¥ýºª¢7OCnÂ8vÍåjW‘JQîƒ¬Ô6ÈÑ-Ü‚TÓ%÷!²™4¿y‘$
Å˜EB÷Ðc@§>ƒ— ?%×+wèÚžwaÙ)¦OìÒÂyXö˜tÙ£ TƒK0²Þ¾¸üå­Ý2—J[³þ¶¶¹çÝ¶¢ßß³ÄuOo`¶ëu÷K 4 ›43‚¢lG4#D/:sOâu!t¡ì_)ëN“"‰ÜSßí |wÛ3ø€){S­áæ¥*QEAmŽQ¨2FÁkÍ¦g2±}šKEþî3Ò}v´«½€‡k[{ËžoXiºùeÚûå{r3 “Ì$÷äÈ½€¬­·ÍÝFg°_;hÜøÙu¿wÞ[ÿ¶OÐ¤èÎK+¬`çE	Â¼vûÍN»ÖvZµn³ÿÓ—ÉÃ†Î)¯í“©g‡n|¡áœ|ãR‹ÃºÉV:ë¡ÒD*¬œp¥ºíÛ#»¤‰­JG?¶ìØõ­ÚØ	Ý¡©R-rOxy_$l{§ êûâœ½0ÏrJÖ.eD¼+Ü>\ð¾ð­1¶Ä}¿Ý13­n£Õ¨õƒzçm£Ëë¤XÄqægP>8!©xª©nšmCB#–PT²-fb†™ŒÛa†àuFgPU¦Sµ3Ì²h¹Só¢€…Ö…ÕFª?>³ckntÖ±cM#°cËVtÎƒ²¦9õX”ñ<Íø‘•t2ÒÔ²•hQæds4e‰1„ %»Õ<G„ªŠ/
à­Jð/ÌzûŒ©~÷š{5ÈJ×è®Pé;<Ï>Ž®4´	¯E÷{âžØ?¡7ªO'èÀ¶”ö7/`aåï­Fë%B%ïP«AìÊÒ€Q×è=ar¨C ä–y#(dAªýZ¸»Rì£74wŽV‘´ó³»±ç¤¤ò‚±ó¥Å•	h^Wx¼RÉuO yZ†Luá8úKk cáÂYdå,]Iþ—ÿøßË‰²›œk½á™3š’fàÄ"àDCEùÓgR‡4GºÎkHyh`èO
K¬ˆ'h¢%rU˜‰ºß@ˆicZî„ ê4tXs®«„PèSTn–Ü¿jm½Ø$—áqÞ·bÈrçÓÄs‡nÌ¼ÏÓQLöÊXÖÔCÖSððïÞMBçCÖ»ÈöùÉŸ¦¶‡L+ò§d©Þî‚?…å:–¯EÖG\îát"ì;<ûvQêø×³JtÃ­J¤P4êøõ3;”­&Ž}~D. ðÂ?Ò„Ò«4ZµámŒoÑ”3+ü›X§ö2p@êøŒI˜°”H©èÈX#s…é9è£r°ÔÃS*6r–ã‰`*ý&àåâ«uâ†ÙØ–¾ÔPkþUþèž»0+ìMÇc¼ï.qªS•ðº\mÐ°‚3©Ý¬àÝ~ŽYiœ‘u|‘”-ðð’°ÛÀÒ¹#‡Tdô òÇ€\òJ„,”/ÑÆ>¥‹GÍ°ì3Ç7Œ7È1a19¯KhŸbìBòŸOþ#%ÆH'O‚ >¶=Ï«ëÔàÇ…¨:dÈ(4\>JÄå[Í¤0¦Ú”0qƒjš·„]ÏH¸!lÜ™ÒAË#‡E ¶“nW~Þ
lµH·ölVÊ~A¿Fô:Gí]DõÃª.xëdN‚ÁÝ/+Ò(¡÷ˆ´•+¸Gôd@W³Ð+ÿB‘¶R “°!VËä‹O72;›¯c‡L<ûÂ	û BûR à¿ÆÃD@øCÙ,)CnQ{%[,kçÑK™E"ìŽÈµÊ”q†²ñŠþ†QI|Ë¬ÇùªfÐ‘sŒ£õ-%/˜øí|Ž;Ÿç¯8xþS,’rÿX„ÿ6Œ0Ös2Ì]iœ7)”ÿªD¤q¤Óß¥ªŠ
¤®ézö’)vºf¤neê»š:MÓÂÁëÌuƒ—ôûu-Å|·3q…ä‚¿³6+ß	ëTV×‡pkt}˜µ¸9ÑÑ%Y@ÈÑÆ©ã:.…ÜÝcÒÝ¶.;.ÅDt¨¡|x‘›‰@Ë´ˆP˜!`2×Œ{‡É6Å£1×Jö	·»çzc«OGnPR´ÙWuWP'’Ím/tXA†&I	çFvÇz4ƒö_„x£líþ)Í#àüF2/•è"„¡GwT~]aMsoÿ_f®S×6*ìLSÆÝ¶j-sÉ5¡»ä"~Î{Çe_æ@µ¢h”r}Mÿ$y‘ÑÐÈø
€›…ˆÅT4[_EK£åb¦‡f¹Xš4(­°o»‡¿Í¾Iª7µäÊ^yaÁððHL9ösõGd
‹ñÈ‘LÙ‘sò»™®¾Wñé/ÃY¦«ºúj\º|ŽHsCO²èÒ¦¤Õ•YøhÄîÉEZv×‰	ÂPä\m'Š1µyxŽvš}r¯¨Õß4Z­ÚÍE¬îÚ,2B+Š^>ìá™ãyT–²šèå½éñØ¿ä;6¬6ƒ«dV•<•ÊZÜVÁTrmÁÖäp-i	°ÈPü‘C8g4‹Šd˜%›âý´šËû6/¯4ûœ0¹‚­«Û_¢PJVÍ±·zH‘É ¯6‰jÏ‰!„rÑÿ¥s?lDe#RøVS!’¶?gI—“Mì¾S2µµÀ¾å¦)Zÿ¨ÛX@yÛ6±@À ;)a–º­nûÎkŸB5Ê"å´•«0M \åqjR”(,TfíHpÌ·u!xØ‹l
4òØi+W·3RP¯`{`cEŒ¸r÷Háëša
K]Ø¸É—8º"{sH–UêÀòóä,½½Å—°E=
ëé“¨æöAçÁ„€	xÖmÜ±vž/« f  –ÉÛg+>›Ž}‚E3•^œáÞ M m3Q¦Ù%2 +7³ˆºJšµåG³ÀÎ«þYHúóWŸ¥Y^n0÷WVffòìRuW%t&ž=tÖ¶ÖVVŒ•Ê?oX%°AYïp;hY°aB×ƒiä-yß&^¨‚Ö$YÅjúõJ„®©êO|><³}òä!ÛL]†jÍØúøkdÑÏ‚<Ä3-ÀëXÇSRÈYó<ˆ|lÙÖ‰gŸ¦Ë‰Ø4CaŸÔtæÊç:L‹ÎÒ2b€ÿ$‡ð'8ÆEû€¸ÖA¥ÅQ¤Ä,Á‰ÀTN41b~Ö†õŸí5ý‚û,?“]–9L?ž5,é«mô•eàj†p¾¨.Š.p¥7Ê![Hay³ÆZ³Â-t6ÏÊ£0Ë²WÀ-ô:íýe˜…/O 
¦ÙËKöA¢›<¦!5ºù=5f&Ñ„˜4í¥çNÆzè?{KÍ ŒÖçOÿd¾—3ètR÷ÔñC§*ìÐöaçìÙo´»Þ;	ïÅ(H–ÅŠäKZ¢â9þi|VhTb .2ThƒMŸ¢™<Z—Š3ZëK2õâ‹$ú’vÛ^©¼AÚgÍh
È|síTm©§HÌ‰ðCà:Vh]/—¤3-û‹[50ÌëíÉPM1½¬„Ue»¤³#$„ƒ;A@A@&˜ìš×)¹ äž­‚ÿ`ž/‡¼©D¯Ã´ÍïƒÕÈ2EH}HW²ód3|0ÏÆCÍø—Xì+°pGï‹b@±µÅÐ—&´ÍC÷±ž;1™ûÎttª„†LÞõ&È½nÎÙ,¦" §	è^W”ü˜K²gE¤Î¶4–Iw°˜¡q—‘÷.²u+àèzV£.Z¤ÏÇÎ™Ídþ`…F»Ê¬^;8¬5÷—¶^3‡Ç1“ù2±îÆCðÈ•œGál‰í¦F0½’GL£sÁ …mBAÓäùÚYO¢ê“'4µ"ª"gStF¨ÃøÉä,ˆƒÇ[ÛÏžo?}ñÝó­ï¾Û~¼ýìûïŸÛß~?²ã×ä¶¼B—°øë7~5ƒÉ×zõbóë¯žon®ÝÔå^‚ŸÜð…HhR†ð@ä¶ÿÑÏÈé”,Á%Þ÷mÌ5(ÙÚã‰ížú¬¿þúÿö—þ_ú]\ååÓ*_Ì…nóO¸Íã¥|‘Ûü³4òÙ‹¹oó·ZŒ_üX‚1Ôõ×É‘ákëöD0ú,kasàJ°¤LÑCv0ÂEÌ;Ò8µƒZ¯WÛíÜ•Øµ’Ojt”o9tó.Y•Yë{D\ÓÔÆ²®–„r¬§‰Òç µ¤ò™ÓÅG-g“à,R¯±íB¸qvéÉ(&­™ÌYCâ%/:Zö#ºÿ	fÐˆZè'£íFã{MçÕN·Qû¡ÙÞ¯Z…N®cÇñ1 TSGU-€'bâ©g×?üý_ý§¹†Ãk+'?_DÍO/%xçìãk;=¾¶æ—Fßêó‹>ÏØÛÕdûË•ôhY†€ïB$8Âm”WtnmÞÜIrâAï§v}ÐjÖíÞ†Â¾Þ£«w1k“õÒï~ŸÜ@OB‚)ü4¤R9”B:á]ä)íeB
|5ï©I¨Á“^žŽ8ÊÓ§:fEhñµðƒjã,B_	%tið®’ÁWëÂV­5?'ß[.™é¼Î5ªº4•¥§’æÊ3)õ¼iƒÚZTÏ O¶¶ç<Poè`[å€k4þƒé€ûèzÄYc–IûŠ”L¡‰g×ßÿ+ùÿÿT¥	6@ˆî˜2W›çûV:Gæ½~=4±óœ_O—W¦:ŸÈ´AXH]qu²Õ#º`ö.cCápµ)S±¡¥N$2"_í‰ÅtœýÎÑm¸±	/“ÃJ QÚ¡¥¼[&œ¿©)M)Ñ¦áŒãgHé+\9‚s²ÒuX¦CÛEåðf‚ò@Ô0FDÐÅG’ˆ^ÝÂæxòÄ:& ‚…4 Yl‚‚Ñ0æ$th¨kèxÎ1¥ÂÖúsž‡7RÚ±@²tC¼Iôf"ë²4~7êøNÚL'ñÁñ§d»~ýµò„)®[/•fö`H¦6ÖåGï6ß¿&GéðÜ‰10¶¶‰Jôü‚©' k:nÒëÅ:WPJÏ|Æ„Ç}¸áQ&ã•zKöþ)ÙíÊï¥ÒŽT›5¹€r÷ž9Ãs\Áé„\Ç1Q=,É“Æ!JÉÄ—n}“¬kòËþh_”•>y½é1éY¤¨ZAo©(‚ AŒNpC¹é±bÏË<N§ÇêN@³åD<ÌM‰Z6×“0ø£3Œ»©®+!¨ý|ih’a›hÌÔmÙu/6=NVÅØ¹¼Bæ"òjñ¦AYM›¥=<ÖqA¬ÄÆ‰µ~XJ0üö•õ\0=.g-wè •,6ÊŒE?Ô5§í¤ÊQ9 7‹n+­6yj\íGäE%U®ãÃ£°èÚBá¹—”TâKªt&­¥ú.wõ]ü8égÙE¯<Ì‚¸ï^‹¿øÉÕ`]^(\Ð¨•U²áFGœ¼²=ÚÆ ÀFPþÿ   ÿÿì½ÛrI² ø^_‘ÄÔ)’%"x“•Š …oM€R©Ô22	$‰,%èÌ)–šfÇÆöammÇfÎÌîÚî±ë—]³yÙ×±}Ø¯éØþ„u÷ˆÈŒ[& ’*JU…îÌ›‡‡»‡_l)_€	G8@`ýc@%½³c=`aô%^/.!ók)¤ A/¦9$
jv5_ÐFô¼‡=¿_Ò@ RÏÍçÕi€Ç]ö+UáÛß‰M—>—&=‹ïÎí€æ;HSS¡VBBÿÆ&¹£?hÈJL„¥ç-"±¯Ãí $ØpNÒC$¥Ýë {‚wCæK§‘5À}â4´Á´¹”\qÓ½’²Y.8kó–-_'ª\™·4M<J	c,¬¨eQe	Lð-éÅ
Ï`¤V_‹ágsxí€¼§¬	—ûè‚Íe±Jnµé\æÍ‡(ïISu]þóàÏb ·½¡ì²€ÈDQ
€’ðˆçx{'MÕ5Â¯TªkOœa¹_ví²meÆÈÀø¹ãMò‚¨EQ–Mž"ÊZÖªð{†ÂÝªI¾ø/ý®®Ù¥_üL$?‘./Õê“*q3®Z?OÆÏµ²Î[_Žâž5“”â‹–„IôQË¢DbšÊÐS=MBŽô«O#—8¾‡c{ƒÁUŒ‘¥ãnœB¨];l&B37ëAqCÓ¸Ð<3ï=üjqÞÃÇ9Að•ž
 ­ÂÅ:ò†;@ IæÛÈÃ¸Cš—Ÿêç‡•$f62ÂK¿+‰Í®“ÂCP²‹ŸÚØg¹Ÿø‘—qF
F®Mkd¤ÔbKW€¾Í&Ã^K,DªH|žÏ™$òÏÏÑr¥dä9yz¿ûà“Ýq°rJ[>Ç¤»c®öH«D”ÔŒÃÊC>Mê{ë=lÛ´–&bd/tœµo*e I¦S:N²g‚N´>º5«öKiŠëÀË®Ã(‰¥E”g\:&lb’TC#ºÆ™P`ØXâÜ^€7‰±‹%:&Á›‹)`—"„²~[Ýp;½9æÒø½F5¤ŽÄ>èoiè“°‰ì3–YLÇ:Ö–Ñ™•Ó€ÛNÃt3ë,BisŒÓózò0þ“à˜ÆÕÙg<ã˜&î´äÝäÓ>ÑŠÝ-ûÜ:‡'û1“ø¹V0&ûu­nÊ›’ž1¨ŸT?«oA{w"´—!ç ½ûe#=Ð@ù$ÌGø™OŒðy÷„ÙgºÃõ›#|&7=úÿ`ä¤=+ò—ÚA'I$¦Ž;Pþî„’I¢ƒÉBº¹@aBú9=»ƒ¾è”ÑáÊapÐØut\ÂaŠ¦Èc7@nyn÷Šâú“Ã†SGA×éb„×Ä9À<†‘óóˆø‘³Ñ ËÂ;A²5<¤§0{Kšô¯ÖY'òx®tPsÉ¼Â~Ê

¯´óÍ7J»eÞC6Zí¬Q{Ÿ[í)%¢q/ðâÍ 1=Æ©Ûy“M/‹CnÈ˜ÊÞæÏ²U7HO¯<ªZ }d'_#­ÅRØd¸‡§UŠ—)Æ²$@~Ã>¹­œj³7Øß!¯ ƒÃF«¶sO¦q¿©ûfÞ²UIIJ×ë£]í_Ó gdb°²b+JÔÂRªMúì˜•2ø<Â—Z„¾mË¼#i¸ù‚^““»zŠUjýôùX@ÃN´‚OÃ3œà´K‹F+óÎCäÕ•‘àª(@¾{†ÄI!íF«lž[´‘P{¾ÉV€:‹+´´š 8½b6·‘ ü¡ïÆýk6}0@f²ñLf²Ø-EÇº´ýV™…Wb+}éâõçóÑ•
Fÿ­3'–æo^½¿‘„dfÛÀ´Ž,òìz$n…A÷©mXdäøVôxÓN.dMäõà‚mHå[¥]2yjÐ(mC<Àæ‹ÜbbG<ÒzcžI4™šÐ¹XiVªæD±Ìé¼!½*'Æ¢š Íx~¡–U¢êüž²ûo<W£°ãÅ1 øÐ€È8Y\xLöíðµë'é’¹æ”–+jGV$\“UïZ’oÜ®++Šf»9ä×øy#}7rÌDfoUûÁÜ¥Œ¡òíÎªºuu†>cVª¬#
ÛóÀ‚o LDÔ,èségU¢ÖEuÄ\Ôa¢¯<Õ:*²ŒVñ¡Ø¢U9·ŽèZÑÜq×*(Õ*q
¾û7 óMgusS0DÇµýzí.R}æRÜ¬Ñä»Ú`X$ïÁ+¦Žb®€é™g„[GÆ—©€æoŠñ9£ým"<]+í4&
©ôù¢¹4öI0^*nÞ¤ŠËN%¨“¿IÆW³™ùàM7–8.ßò·œ»MÕWÒ`Ù›“ýœžýö6ÁÑÁÎ~ïƒƒûí‰"‘~ª@—*â pvŸðÌy’ãýõÙ¯‰Õ…½*4F™8É)6˜þuŠ™)¸É×Zcí¼h6Žwk{µíÏ!î4È’pþáÝ/ïRËîv¡Ñ^Í¸Ž¤è)-h±TM}Îhºjxâ:³¦=ÛßÈ²8¸¢×ßj-U3eM¤¨¬ú×3ÅÚwY3_â†£/¬F\V7ÞñÌTž¯Xì!sóÌg¡QG%» }CœkÜ`Ô#Ï¬îð´½¹~ûâcOŸý@Å"ã:KÙo@TÚûÛÛ;évG+œvs²(”Ÿò ˜‘‘‡Íþ¹ò°J=&x1}ußj´)öôé{W5Ç2]y•o1˜kG Ëvsûø°±}Ï²ä#ú=JÂmÿüÐ;§ð‘ö³þæ+ÿüèÍñÁNíÚé7öÚ‡oîŸ=ÈBˆ “ô=ŒÉfwyK˜Çil©8€;ùg¯"ÒðF)+«ŒQÜÇ‰ËŠÁy¿ÙØªí´[ûíæV6¥­ôLÒÆ˜ŽlÐõ>_Ú61DôRº•{4ì‘4;¼ŒêÝ¨¶ny‹ÓQ”B_¥Þ“·
˜w²X–¹¸êYlÉp‹¥~}gxD	Of1ö€4èôš¡‚-æO%¢ 3éHàã!e7Vª0W”t«è}õ±¥«dSn+<LÊêd2Q(Ã_à™*§b¸uÝ&QAŽY«ÔA¾ý´ÏúçUB‘µÕ-:KPJž¶y>¶–e“–bf]#§éÁñg1PMC-[ÙñJñS˜x\ŽÿZ`¶%ð¢ªàÚýÊ„ìÈ6‹<IìhŒ³­#£ó½³¶4/Í0°ÕsRum+[”éµŸ''ÍÏ‚<
ì;Kv-à#))»‰ñ–N«F{Ÿ0…2k –ò×r#Ì7•F,’‹r[v0Š:=òß…*å¡ø¥l™=µD§â:PÛ	–}Ò³,;ÄrÎ´ì3Ÿ×´‹“Æò6»¥J[†1Ùé!>ro•jï/<ñ)½,õ­~•¶j+vmŽëÚñ`íÆ"ßPö×é¸e5õÔ…ª^TÆÀÑªºøÆtè û§–»ž¿ë¼•¯SKëçåz0
Œã…x ½Àç¢§S¥˜4ãþ2Ä3SS¥/h<u×ª§Ztæøø7tM»œL_¥ÆÏžIÇÛjÔ›íÏ@ŠK<ˆ·µÝ–‹Õ/¾ ¦ž}‹ å(VáU™…€+P¯Þi`øE½Q‰ñàèUoÓ ª¬ o‰TÿùEsÏ£qŸN}Ö$D_ónà£ƒM«…ù[~<>j)§ŠÐŒŒbO¸² ÁðåžDJ<]'"WçË_Ë¦AýÆüHˆŠ!hæd¹²IáîL`¦n•ç™Þºú2k=ý‡§aŒ™³=c¼0Î’i®ñ‘ +l²”¥â¹”ñÍ…¤­fS9âóXU'U©_¥RVñ½h|‹ˆ¸”ŽHÆ6¸ª:~	{n")ûÂìdB¾j6^ÔZíãÚóÆÎqýEmo¯±3]Jt6ðÀ“9§‡M‹É6Ø›p”ŒN½:ËÔWuJ’JŽ×¨äm¸bÅ‹ò4H;«¾ÿÊº±2í©:Êêc7Ô`ØiR l±¸Š0{GÖGà.·üwU©í|¬†aGIcD>óØ×ª“¾¸zûNAz^‚§ÜÅÚž gãØ›v•03ì½3úÛÙö•Z”Ù(´-ÂJÊ{D$EÉ©úö—ûDã`{¤¨¢<Š…–¿³‘Â7mœð$g”|PÀÞ‡RI=V§‘{À°n¸,Œ”ÒzfïŠmb©øDËJÚºyêÁièFÝaRYZªê;‡oD­˜—i¶)y^u¥Yù¨5¦âQ‹Ç‘Ò¢ñWuàö»î˜ú¬€a4ÿr\ó/óªî¸‰?S›Êä¨Åþ¸Îc‘Üêg‘ß€
 zar[LGf ±U?t‡‡ƒÓ‚Ê¬€Q•’EáÀïPµ< Z1L­ £«Br@ŠÕíp(6«¨Êb¬¶Òš¸eå… ùñøàp«y{7,‰™¥S÷Ôœžçvá!E€rXjŠñ)/n!WØøãŒë”\l3®{mŠhrž¦&QÖge<hþØ«b`•¾˜Y%SMÞ –•í#óÎ#Û‰T IÉò¤)üL&Q¥ðòä*öÃóAZå­bV°öªÖ®²j“¡àïS²R¥)±ò¬ý®Ä¥Z½Þ8h7^5öÚÇÍ½WÍö¸d|tP•ŽÙt–á2J/ÒŠSÎ/%ë/Š‘•Œ¶ŸŠŒ*¸ÕÄÉ*ù¤´ÉœcÇÁXŒâé¹À/>bd×ÙóSÊa€i|ÍÁ…Ÿ“bŽóññ`Á	YrÂìƒ¹€YR;o˜¦–…	+2=§º2m½fÝ‰‚J#žMsU]‡¢X`uÕ^	¬“¥ø'=L1Q>Al8©RsLHSå{7I¼A—ºZ˜x{o«y¸Ë·_­Ýnìmbt‹eßÖ&¦x{¦-?%£Â/]Y¿ÎBGµÎÐú«5›	†Ê¦2~†r.§agÑ1xëšc-•Û¢´#åŒÐÐ¾ì{É¶¸Ø/·ÐàêìRÙ±j[i8–ÜðÒIn@ñ€…ÆLïD^×?Å°¡›Uk*ÍÅr¦Û•]€‚Ý@ûW“÷Ð"#[i];ãz6Îé"eØuþy/ÁÞþ_ÿnÚÞÆéö:ˆ¼¾ïEÞä½Ž“Ñ` ½<|n¶R4äiðÑÃd!u³NØ¶7Oyò÷ÿû?þÿÏÐÇ0é<ÒV‡~äÌVvÝ«™ãXWâÁ}Âü0Rç³·<2“ Ù‹ñ¡˜–Õ€_YÕÉ’ŽÙCŽ»TÉ4ÖÍ±0JOD}Æw`CjìÚ¶ÜKA1ñB5ŸHHM>8•-ûcl‹°Ì0øb„6Áë§œÕÀ_. p"ÃFfovh?²'Î¶|Ÿ7di+¾Gs"Xi7ó@½nhâ€_½fa[‚#;e–“áP.8¨¹Æcj—ôÃÑià3m©˜lí&f&›úNs¯ñéÄŠ_m'ð€é|HBB*ÌdbdîÌ¾|QÌw¾äøjû¨q¼¿µu{'½àžû‹? ñóYç» /ÂóË8ÿ‡ìwÙïU:U;¶ä*ÀxCT}‹¥¿+ËX„A;jO|êÉ-:ðh
»ÃR—±îlÁ÷£Ã›IˆYŠ·!%MŽ{ahwY‘ß~ÿÉ/§f-U-4¡Ê‹ºÌ±xË”r¹el9/<ë]%nTS…ð€ª~ìœ‡Ñ¹Žb!äÐ¥#Ï’®LY`ÿuÙÌÖ(£ÊÍió2®
^{ùyKI‰§añ§þÊ¤~vMp/‹Ïv¸—ÆžbÉ §_£ì+»V»ôŽâab˜I²$ÙfÛ’¥:ŸVj³DŒžhAW¤ºÓ,èjnŠ‘	Tø2“…-Õñ%™õJó¦½¤ôs8om÷=Ë®sæG ãOßÔîI/â¼`û;‚Æõ™ãÊéa¸Ðˆf]Ç=GÌ²{ÁYõ«¯þþÏÿåëÚØË.ý¹þû?ÿ×éP­ònºðø6²N¸ñéò/MO#v"ÒîÌÅ=·{¥f‚,J&¦¬ç¸|_f¦¯j kN/[6/)_—ÜoJ=ì÷ùTÇÏ“fã&Àš &ùÑ†cÃÌÙØa¶¬˜ÉN>ôÂa ÊP¹à` È¡ãÂavK÷J¦p'­pu¼Ø‰Ý+kË¤u™±O¹¦ØI{IA&,k7ÙogÓ¿p7ð¢dCîHú	Ó™²Š|TŒP›ý*;ÛêRN]Ä±–üíÿøÔ‘õ= É0uIt…JÝnÑ$D¼¢l^î ú“3ßyƒbÀO8ûqÁ\§ÓýŽ—Íè»;=å’þ/â%!œ‚Woö¥RûéÉº‹»âFÖ¬çÏd4g-%97<¹¦§772Û'Ñð )ÄGÖÏè%R3­l~¥¹Ÿ"»dg¤*šÎ½ä<©ƒœÕš_edR=áôJ¸f£Bê¦¼P)k²Ï=
¨Å¾Ó
vŠ&3'‚E}gÿhó¸U{Õ8nnN'ev‚pÔmŸ06ž’™Ñk³vßáURÁìÐH+÷üaÕ‘Mw2„¦^Ä¦UïéQ¡M8o¯ ÞöÂx"
€S ?§2¯‹cíxƒ.ƒ¢"<fá òÎà\è*`Y¤ÿ.8žKôÛHo[eh»ÏÚ	%’V;¶FnÕòýf¥CöÑJ}}“hg‡WÚÎñac‡4Ø­Íƒ›l›/PiÂ‰á¡2ëFfcE˜ÂT5ÄÊ)×ÏL³HÇ)°šk8«NºÉôƒ6¢ì¶Þê"X\ËÉ:“×Zzú!ÉµQ*ƒÀ†Ö,6%—9á$Íq¶÷¡ŒË®œ (^p#ûnçýØaT ²zÁ†LÝ®Ë'Šô‘râ(„’”ÙzD–öìÌïøn tŽŸx})Ûë]Þd['²èVûƒy«­ŒÍŸ–Ù\Éeý&V~¥9Yo*å.O,åæ„
Y( ƒ×KnŒ»ÖLKf ï¾çhíP±†ÂëÕr½øL·¼78sj›¯ðâCç&‡ŽvC7µ·eóã]´‘Âëp£6&”L²øÃ},èuSýCC{Èa-ZšàìòPKó†Z'*õrG«—ÈV%åVçñ45
æ7Ä¸Ò¢†°„Ö²¼fC¯ “C˜FC“§Ç3âß•}Tpßió!øu<ú…Èm#Â"¡³As‘Ö¾SLé4Ì%š•1Ø[½Á9¬bW×;žüãoÿéßßŠ5à€gNÈU‚üŸn™ãÐÌ‰˜­€í˜Ìª+O16ŽÙ˜ˆÝ˜8™§tì/¨DdB½zzã¦ÔŸôÒMºuSêçñÊ”p]a*Äóôù2ÒÞP¶ª&•nÜ„»x¼4¯©ê¥ìÜGªî›žóx~Ø¨½<>º·ÁŠÿ¾˜)%\E´8©‘TSUQÁ&/7FéÄ>©Éû@©"iÔB²gÞg ußÓaJgÖÿâl…Ab(v7/`îFŸæíÌú…rzÞÑFW»2)Ÿ<ÕúðåŸf¹æáfù©­'½µ±ßÿq–ÝçY¶~gú{oío6_íNæTõåŸi eÁ²u{Ý¥–º™¶^ØÇ˜ÓgY_­Rkö6½xÑìHìÌ#dRŒx¬%ÔèŽ"\+ÁŽ…QßM„¼»ÉßÍQ¿X»Æ‘lH¿†)“Ÿ€4s…@1~Ç¦FO<˜òº‹jyÝçWUÊtåEJ´¡8	»øêçÐ—|1î‰ßWîUlEi<óm'½“èg§çÝÖh8£$§²\Ä!å=0A#©Ç?ºçr}œ¹>¬I”@øÖaÃ§ó‰?¦›K³«ÊÈA™•Æ¬ˆõnñ®®
),isðÜM(hsE^a,6Å&½¤K} atUUBføñ–?€Õþ§Z¿9üÂ˜äìr” ïGsx[À1aTš’¾#Æ”Síþ/ª“!±ŸxaÓø±¾sÔj¾jTíl&^ ¡Kl—¬šøøœ³(ìCy+škŠnjðZ¢z×hxÕç/cL•îÝÖKÑny¤þ7xS™ÚcQfCùôèl¨tìæyqml 3š=Z3å3w°ëÅ1'ß½Ÿ¼ö°s ¿\úIÏù·v³Ö0)ç=øëc^üÊ‘oÆi¡1\Œñ„Îüí_þåïÿõÿD[y‡´Ø)àÄ¡ÓuzN‚X”„9­¦baj,ðÎá´<%šˆzÿØížç€pæ»0‘^—òŠ]vàn€VÖrb‰¬Âÿ/ÿS¦Ô4â“ÀLÞ•Ô Žcv„£»§¥f9ÂÜB_ç–œURº§¤Å-²à“ŠYì÷&Ù_•5iƒL-í	ËòµiE½Lç¹|k9/ßïPÎ»$§F¤ÃÏˆj­£ç»Í¶Ô0X×Á~«¶s?›Îc~†Ý¸ì¯,¼V–?ÏcèµÒòË\.ß^‡½- ô®é%ŠEƒ‚ÚzÛw.:ÜÓ53º†Fe‰,K­Æñ*<¬A–[Ð`Cn0\ã€osãú[¢–±Æ«ÚÎ:j~dÌ„ð»P<‘Ók&öH;!ÿMYÛò®´-‹ÃÉ·¢†* ­®‘1áÍ-ru¥\ÎwÎRyíÎäÍ
Ç÷Æ ¦±§‹0.<2—ék®QÄr×2£Í>º^'@gœ—âƒ•v2N±¼%3‘ŸÃQ®:ÄÃCÏ1ÜHéìÌn§§qoÃBýeäÅ8ÿ˜›2ðÐ™Åñ¸R@H~N1`_|vÅpÀâ~âb§®løéˆ2¤‘¼äFÝ¸\RNmÜ­1™"2–|b/WÉ'ùÁ—§^c
SM‘R&·¡2¯kWm_‹¤ô÷ýß@.têûG‡m‡E¹¬:Êb‰ŽhK%ä3cÉNIêÝÈÙu"Ö»¸ø×»Œ(ªª	­F¬÷dÓùbêbÛT‘˜Lƒ•›\²Åê»ˆÿ:>úë¤±_ã¾j\ÅM¤)(qÊšh Äõt’âc8CIfyágå¤z´‡ùæt}FPn¼?
åm#¹¼ômi½€SH`%Š BN*„oŠQº E¥ìâ“!@ÉeuÑÅ*8±.ä‹KvÉ¨¥·UtÜ¸Vå>²¹ˆü|³”ILRîþp“q-ïpSÊLw¸i'èœ¢¾N7Áf.!$:<¯ÛJqµ*áí‡)lÄæ™Ãný`“c‘N1Ôq¸q“p¢þÓ`ÚñÕÀvî»ÂîQl5qÜùÞYRåW±´eëÃcó„ƒ9–Ïb¿{}¢ÎKksRã#›Ë;¹çµz:³‹÷¤ã$¤ +Áë¤\)Ø­f%5¦ÉØ·ö¹27êÍ'Œ`¥zá‰¦­NXÀÛ¿ÑäQš©fP£I´EÚý_L>pk«YoÖvrnºàŒ‘L‚ùVí_u™l5ÿÉù:mr™;2´Ê®2µÙ°äg&p½ÀYé&*x±(¹l [¼ž¿ô»ñk?é°UÖ´ïá­`°â°ïÉé$æÞ“šá="ˆÇ©2Yæ¤õŒDÕçáEãaþX
+¶AHº9oC¯å–d–'kŒ)“cŽàäæé':[“üŽ‰ˆ‡
1ºó u€(ñ+'¬¼q|WõÃc:æß±ÅÞ›V>ø*ûWIT!û­7wkÛ÷j{÷%©¢oŽiSÛÖ°ärKRuzjIrlàìMÂÄn7ÚÇÏkõ—Ç¯›íÇŠò/É ŠE›Èµ¦Ê‰d‘¾Ìg‘¶3ÖJN*9‡Ãçâ¼À¾Ü£ïÂ¿ü³Ó:Øo·›9Ì4êB½V…ÈC–ßë“}Š1Å“®žÍ|Jw…a8ìDî…÷‡ÏÂmÕ©¿S[–;÷Y@KÎ§wZØ­¾<nìÖš;,ððqm¯õºqØØüƒƒÊAÎÇêBˆ·[?›ä¸ÝQçÁ¤m¬’ñŒ÷…ì¶¾-
ãM!;¥0ÞqpeƒccÀ,Þ„	;lÀA±·yÜÞ?®¿h|&qÁ~>,º'S…(×;Fºœ×¹C= ­«ï>ßaŒ/B£<œ=…É<•`ö9°2[Viæ’ŒmkÚÛ‰`ñ3©ßíäž·zš`{‚ÁI<Q;=…r´„¦)YÈ÷Pâ3té&ÝÇ³dÚMìßø{ðûòIÆ¼ÿ×gÝŠÂß9ë–åÕ*Ü’gatXPšPD§¨ëu|Â›ÐáÐ-hCòÄe½—üÐ`£ƒþcãÉŸÇÌøÜwg•[âY^üõIðlù×Ç³±Èó¿ÿw;ÂDÈ• £ü WÞíûÝ˜ÛY‘=ïl`ÀOÓ‹˜7‰>­%Î0£²ö+bÆoYx¼Ëào·ñƒ à¼‡í½Ú^ýÍ2_Î*#ï|à:Wæ½ÎÔa€Ó	C£(]l¸sá¹á6k¬ó´f?‹U¿Sé‹®e×D±j…b™·à Œ¼¯¼®¼ˆÄòÌòât©;«ŽD=·RÐéºPÔ³ýoÅ=É7ßòÀû0ô:ŒívNÝÓ«™“JõÆP>n¤×3šGîåÍñÈýtÑUõ+«;­ÍÂ´þ¸ü€¼i|Õ/†j7òé«‰r1}Ó„Ë¹
C!k/¸Â’ìrBšÉ/šSšy¼Ùh×š;­û¤ý›ˆÜ}1¥€yøe/f&%0zòûâæ«ÆñóæaûÅoæŒ—¶î%Ró—¨›†ÂlÜÙó©¼Ï©%½|†ÇY'V'3 ªZéq§4Àˆ[ag&=¾w(¡O1ÄÒ¢H)H5eÂ([Ê¨›$²§²$ŽÊWý÷üíßÿ¿N³=ÛrjÎóÚó73©/½ ö)û¹%g¦—B6Õ“™”O}“ü	@s—Û².1/ËÌËïSÒ—N¨´5Ó(I¢œÂZÓm“cûÝä‚yí.˜™Šáesó¸^;lÜ>ióÍNR­ˆBÂ³5zª—„‚ø–]Ë¥½ö#(WÎ^x4‰qÖKÖ%j‰.©Þ+—T…
›º÷Òš¦1I/†t›$yŽ¢C:MÂWX1Ïl ÐUCtLU”ƒQÙ’ÎY¼ç„<{ÎØÒK¤7~ïAŒbI ü¿
" ˆ"îp˜þ¸Œü$ý§HwD³Š¿e¬fògÎQËglƒ,þõ¯R¹R/I†qõáC–5µgé0pã^N®‡”<m±²VY_~¼´ºº´¶´¼¸ÞYöVžTž¬z—J&ëÁPò÷øñ(Æë}úcLbi+QùØäÉS«Í"–Ï)”Zìxsÿ?xx¾à”Jóå$Ü	/½Ý•ÿ6Q¤ÑDu?~åEþ™oQdú!ô}ŸòèR…Î²_ó]FzQ\7¢ü‰{Jó•Ðœ©~Sú¼ž¹ƒõ_J•-"Œä|Ñâ­¼Yùyåç?•‡JJ,kÑýõíe¯Ò˜¤hüº²ì>~2IÑáóËåèÑÒ$E;€_Ëï×&)zñâ/?®tz“]:X?Ú?[)ÿ<ôÆ–]ÿáQ¸_9¨ìîú?-]´&*û¢²½öøOg•í­µŸô~z<QÙíµ¿4ÖãCµ¬~x ºàÞ‹ù¤ÔÞµ(r¯Êè4÷Ñaa­ªÎògî¨2ZöÌ ôõGeÙ£Š{SmR²mpl)”mÛp,˜ÝœíkÝ½×6Àb#g{â­ïü“ô“íz7ù¾¦Š==s’¿§¸Ñ9¼wrQ™‡=ž7"xéD – %AJIÃ¼~Höàä‹&[ïÊ˜õ&PÇ<j¦mò…ÿá ´!†´æ’å
ÖP>ºÈ-=~_œ?øÐž¢Ä²¾ºpðboù§«ç+îëÃ%wsÉßûùO~s»¸¯»aWü~ñÓð§»õÓ•ó'ÍŸkç»õÚòý×<ÿ©Ä§Pî´ÿdôS«yîmWâÓÁî“f¿·Ô}Q[ß¹z²Ò]éŒº¿ìŽNW~ìüÒ¼ÜÝ¬]tV~4^}üf9¸z³ü!hnï­´š¿ìúÍó7+ï¡Ý«¦ÿüJ<í4—ÿôËîÏo®öüæÅÁÏ—çàüÙ³ÒÍÏ#tÛ²Œ»P¤“ÄGMñ=ùüpp9«g¢œ¼•™˜“}×»rlÊ
,(8—ÇTõÃw¥•L‘È9U¥Çø^x+q#$Ô	²H?²]“Š©Û ,G.žÝö„u_ËÖˆ2cKme-¹å©ÈžKtìþK&6J‚@Ž”å--è»ª,“ÉdíýííÆqc¯¾´×n¶JÕÉ§ëÇ8ÕQtÂ.Äo´.(ïì×6›{ÛÇ­:H…{7éÁH@°ÝZÈóF/Ô·E=A¿…æÖ›ãÖ^í õb¿}Üj¿ÙiLÓ¡x&þÙUkàc`ï[ÉU`¨C‹zP;jïó+†zãzÓ¬3‡¶izáŽ’ðˆ°¨îB 7Ílôž83 HfÚÐý5Ì$ß[y1Ð+²ÔóÖAíÖöŽj;| oŽ›íÆîgtMRØÌtÂpöÓF„6˜ÊÀE^Àò»uà¶N0E¶Ú£âì°Õ«[ÒŽŽ”)(=(¿àt`ÝÔµ‘SÎÒQ/ŸºkLŽÐq•)1B’ñ®dKÜ
ÑÞSQ°Äøè©YôÐ<×Œ=U,ƒÙ˜Rº”¶¨Å8¯m¦UÁ¯Z0E_ˆ5bs8¯p6	DÙ¢+#tÚ÷:•âG/K¨?j)¹ùrÂQ}ý1[ìëÙØ)}ý‘:’øIà]—ð^Ò"Cã|ýQ,èµãÈÌ±>)–´øf‹ò0‘Ž›¡çîô ·ÈJ–ôBã¢KQ{ì6ŸÆ×Av@a½Ì„žSó”¬JÕHãgb\[*üŒ×‹çG÷f¦ç›I»€œ·aEÚzèuÂ¨›Þ³YRi®fsŸ®±T¯4l°À#peAí–ÑkPvÂ@?ŒEraå®Iéx¡Cjoµé‘û$¯r]ÉŠdC0H'¢,Ü€ý²Rþîþ‰Â,™¯R_]˜ý-Ò1Ä›“†•tgÚ¶öD´áÑR–˜pzÚ°šÙö–¹ø¹#ÚÎÔý“Þ•Ï„BðÞX‰ÄqÃHŒJUád´•`Ô«ª¹â[;®´CzÄ­Òû<{.nõZðÃÍ}KA ¶s¯‘‰wr@\ÀôÓd°B †¾,Áî-Í–Þu1¤š[À·9VTGùÖ/9Ä/‹ÿn^ß­%åuj¾g€¤Üsc!ÌÛ2s§RÔ31øò¹—¤Ufžš5nÆüêRB/0'00ž/ÜJ2¸¥\p[© ÷ÜWÚ;îà¸ÏK	`JŸò“ŸñEAÿeþßÈ´~kž_§÷?AjýÊ4áŽ…„ÏŠ,‹·n)ÜV(¸Ò0¹8ð	©ƒUø•	„Æþ)¹A~kL«Ñ>®ÕÛh9ßÞýéø`¿ÕžêƒºÐùÿò,úyæW°ÿŒër3ÂµèRT¶DRëµÅa£µ¿óJº»­°òÑéôB¿ãñPwGQ0Vÿ	å^
uï‚8Cä¥@`}.û1¬ž5‡ß»éÕlàé¶W‹]â8s##ÎÌ¨,ì²œo¾1_‰Ë{ãåÛÌÐšû‘)g‹Sâ·p1¿…+½+ûƒN0êzñÜä{$šF7é Ô³^š§¬ˆdÞhQ>*•øT²'Höžb í37(ÌÙ!ÀAŒègµë|cMÉüŸc¶y^´vyLTeËüC€•^VeIv£H>U–cC®¦¼Ñ ö½þiŠs}â»ú…b°jL™³@¸ÖÊâ¹ócåm]5EªUÅT8óéàëóÍ7bé‰¹h{ýa Í›»‰¿&Ÿ[ÔˆKêéÃ?sÖïÏ×ŽÜð°â»à&‡š»kjîc[[šÚ]¢„\Ü"fD¶¡œgž¿„ø&¿MyÁtFä·&‹‡ýgðGa¹{œñÎÀÊ$õMU^›¨õ|O‰”¿MO¨kñ,¸•G…tÕÚG‘†Í	>’ÑX !<¯Ñ1%ãrúûÙ1bS¯íÕ;¶«Ø¼™†_­/øBl[£éún^ÄÎ‚²+@‰…,ðRÇt¼ ðº¥±d¬ykõ16µÑC•rþ†!ÛèÙf¾èµmÔ*2ÉcíÙ§”Ï¨FÝ±×V².¼/þYyÇÙ˜?ŒûsÔJGo*	Ô¦ß³3¯CZÜ¥ùyÛ6â^ÏÍxŠÜZÞ‡áØtfÊY!>ÒfÜSŒÑ-X•Rm sAÖKó:–ã‡7‰=~]@e/PÕŒêÂz¶X¶^ô7"‹Q	æÏ¸À„Q=§‚smôTXÐs%D‰haÞ1	x.ø‡©v@•e¸ÁPùnÇöÕ¢×óº¾C«2PÒÔOé¡õlè"o””¼¤[)p/ã‘Ÿó4¥ìRbl7Ã8[ÈIàYƒ.FKóµÇf©L
g>baf.¹TÛëÎJAÀ•žõ>Ì.äGÁËzG.NÑü„+‰·’²ákJS4pÆÕnêŒgÌKÅ¼vr¯ŒHeeJeð«ê}Y^öO7¼DðÄC¢ÒK({ÇF4ÝXäPÓû¬ô‘!õÎáCÖ«â^'8øp4ˆ<·»Ûˆi±”øêK¶ž¨Ta{TUø§h`¸!iswó9¦„Ýjîü‘!Oûæ÷»§üVu\à	©¨ŽpäW ¹fÂ3³XýÀ(ÌßhVvõ:é·÷1¬îËZó¸Õ>lÔv[öÑÁý¯“áE‹¬ÝËL;ÙžÖ:‹”ìøñ!ì?á[ E¦ò²Yùy"qqfÙÐ4¨¥÷®Ü”çö[0ÐaÉ .ŽµŽžï6Û2’ÝQ,œ_Í'ÙeÀ©ÇñÉ0
ûásàTÐßä*i÷FýÓ&Eú”*ÕO„Ã|˜([KºÇâpAdïÖè´ï'‰Úû8®Œ9†]Ï	`ËqLo¿þ˜±äjf8V {\zéúNÝ¸‰r˜.²\‰-·ôD^xé±„JýNÏëb¾eFf?f›”/Î¥•‰|à,;ß;kË©VS}µˆ¯¬µ u~µ  –ÅCß1\ÕÍ¬zÇ›r•ü1TòÇPÉƒà¤cè¹qÃ¹^3ôJßª'ÅÆÛ§ðš$‰×äi¼8¼<RÌ>cS]±Oré'›KàåµA„=zW ó(K¡Rzê[Im…¾6þtÔh1_oìÕÚœÌß?!ÉJÊë%µR§‡ú?¨ •zˆÒLÙkpêüÌ9!B©’8ø¥h|¯S»	~i@Õ«˜W)gŠÎ8eªmÀw¢k˜À3ëÛ÷Îª–´S Õ(1AeNž¼Ëvƒc»î?1ÆgÏ§ÏY‘f‡²Ú3„4ËŒNá	
ìxÉ,æ»8.'ÿ3FéSÊ‰\zÎ8o@Àqúî ¤ÂÇEÚí„£¤ì0@Ý0…“æ*;[~`)2`éz	=¦hàÍYxAF"ôê,ðÏ{	é€â²ÑÁZbªf94l{–i‘rø%ùÃOyyŠvlz›WŠŸvÙ",mŠ"g=|£$Çf¾ÀP–0Á¢±ŒOÏÃŸaèœŽâ+'¢µ-Uv^{@xZF¹ç®?pðæ+³bÖ™ûoÅbÚ]!Ð$í2ö¶·›÷šqE‹ÇKu0$Ï>n<$âÒ{¸ûðjÛ?—É¢­kb
”žâ†5D„2>Õ ìÖ+ÊÊÝðÂ÷f±/Ù³ö+§Õ/gç‘fË—lûfu†4+³XDŽÎ™¸ ¾vî:W9«6é\áIš¤ô®Z*E–0ÖÙYyªõ!Ùìûø†ôí³›£ÐÌäê´{‘çÍ.8³­¡tb¨„³Š¿_`T±³Dx×xØ-?òˆ×â>îF§¾ç,ã÷6äçnS¼(o6ñù®ÇdÖìCøz
Cx‚/¶·ë»IAA*Ù‚6œ×.jÈö¼Kç¯ë;ûtŒuÁœ“3zËëÀ|RA|ñÃ(rlÇyFA³Ò“²_m¹0ôù`©“›@a†a°a¶Ã¡³‡ñµßyÌ*›™ËÆ Ç;À“‰ûXÚØyÂ$,¯‹q¿aßœm|"¶eÈl0ªah*Qv¿{ÇÞÕ¬r V–­ÓÛ{CV‚Í¿Ó·FšÔÃ†Ô&^Äð‚¡víuÏO<g'LF1[hÇÕ¦/øèE8ÂÑÀ6#÷<àãÆhØ#ßcÜÁ‰‡RGŽG6rBôcÔéx„`Ý`0?Å2ðûmüSï%àµ×xq×½" Á.Ä©Në…WTìyäw¡»	ëÓðpD¿gè³åÌQB záùh-ï®Ea$€íRBÌÀ¾D4eE+DŠHZ¶nÖ‹­Ä6Â‚9÷Î§6JBçíŽúÕ©Gƒ÷ÎòÒ£GÎæNŸ61lÝl§f;¹
óy…hŠKÅ¿‚ÄVvþ{gö:à®³5B,ïºðH´3ï^Ñ¨yË¸j5Cª@POŸJ´]O+ õ:Èª³;~pðé,ˆ©sJggù¡\j¶ÖE³J*M46;pSƒíI“ò`!»tò/ä†=îGÖá‘5*zò-Œ`imï¼”:Æ€rk¯beþÀ*õáœÚ#"†ÈöCØ¤d‘kZ¼€ˆ¥{áwißíè"ÊwÞãßÃ+—êïð÷{¡Û›ÕÄº3Om³Ñï¥ØüF3à|!dŽñ9 ï­pØc/wÙŸzÏ‚0Ik}/`_¸ÑmñÆ…\ôÆÑH9kºÕ÷ÙÑ€ãŽ¡à£ã$$¼dóÄ|ƒÓA¶Ý¨Ã?»ÀèŽ¼_8„hW.¢!#œž©¿—ÝC §Â@J÷¬¸4ÇEu¥bÆNÍ:ºã¦ýL§¯jZÈ€iìj6;^ág|­OØÊê£LÚõ	¦EÐòR¢Ç™´Îÿc5}ô_"|Ê-tª‹þ¬­• X‹³‚|*Þu§`p£NµxæáoÃ‹UUËïÖ@ÌÃéË$«Î£êØ¤Ì	fC#™‰ü^H‘'È·±µtöKûõGæ¯¢¨Ž™yòÂ»ZpšÎy˜8WáK¾\gÀºX¦áD4îB¯8îWFÅ‚s‰jŒR…éŸøj\—ñÜ93ò(ìÈ×_„U àx ÊF%,Ã˜Ÿ0@	0
 ˆ*••Uº&}lLÙÊ@Ry¶Br7¤.cê»÷ÊØ
ó”Š†K%c9¿HÁ×ÿªli~!ÿe2r­^o¤"2åÂ½O!YþL6´ÈÊÆd*¦ý¬†*ººT¶6êúd™`±øGƒ®x¯ê]µº6?g[Ÿ%OgÙGjBClô™Ñ$¥4§YR )ÐT[¨ó´bFlA?ô’6*ŸÑy[iþÓ	 ÔãXPK+/5ß"qÔ:˜lÊnM{@B {ª–<÷‘1 zhÓÄYÜL´ …´Ì:[ÂQ‚U©žÆ‰ š›°kSÀœN×;sGºµp$dá·Â`µÔ@¿ŽcÕyäé+ö‡CoÐóü¾‡Š	´J ÁÇ§QˆÇœ2Ç…ª“ªó•£¡ƒz„”)Sð­ªN‘¡Ú”©îâçu\àáÆU/†&EæQgâoŠ=”[b{ú~Å"ö§/×d9])Iøéãeµ%U) —²êÔYbû
½º¬¬IÔ-ï/#|RÀ’ œÉ®a¿Íebã
™n¥¤Ä#§ðó¸Tû62ÕªÜ5kU^f&º³l†gçQ^N¹Ì¼ÂúÌ’ñ¯½l6Í¸ÊáW¯kã¦«Lºg2®µ®jâ¿Æjs[`-—…J\ÇÎòÙ•%+£m%³‚ÈÎ¾v£,#È±R€ÓÖYÀm|3j¨H2Z˜RÀ#[F 3‡™@¥aJ*jqöAG¢¥ãzå'Ò2ˆ^¦8Š<7LÉÖÍì“šYX7`ºÖÚ0SOh÷EŠtÎwÑ; Õ®í4ö€§ÛnìÕ›cPdP™A±–•{ÔzaZHK]—6y:

_G¯_>ó¼/¢4Åt=?¯´”ãÿ—]‚XÈ kË·m|öÊ*®¦/sD×ª¶îöý–•ÑYÃªDÏgžn›-6¸Yk~t–à^óýiÁ”‘…°Œ›ê–S…q`|m;—Õg¿ûÇìdVž~Pqecë.öˆC{¢»nfíe1UWK#ú±TÈV{‚Êï¸û&÷ª,tµÛ“¡=^?÷@z÷lrR†Ø*ÐÉŸ=Ïr#õ+Ìþg­=‡ÏQ)z).ÍtP©wãÉ–ÛnFä@A<”°NFÆ«Ø?Ç0½x[â„Gè3\ºêˆG©¶CŽ¶/’iZ’—d…¦È=½rƒdšiˆžµiSifY<õó;O’n³4ÂlÎ’9i©BD|¡ªÕÙ0ûdç‡í-w¡³¸ÍÙÈ¢øèþ7Ô»´Û½M¡w©ïÔZ÷šT“ø6>Õ´áŒP°â¨…ïwHO‹AÌÍN­B	Š¶ÑÎÅZo¹Ëe%ð±±,ßQ»…< ·ùkac6bK/v0ô’ÅŠÖG´1ä5U_ìƒl,_H¬•<<_¤	UËêóTMgÅV®¸˜…°òü j˜·¨ï3ïË)Ü+/ö[”­½Õ:þáhïe£}ÿ;å#ñ‚h¡Žà$Jwc’ò­²Zç+õ£PÏ¼-ù<ºw%ä<kÏv#Ì%o¹AØñˆBå‹ÎÒË0ì¦j=ÚoŠS†öóhðÞK>5oÓD«OŒÉL0Ï<àîÓã	Çv\/ä1=!zK;£¡ãž¢m'ò9t;Ãxty¯ãá·Œc×¥»gsžvcõ&lŽ%øxJ6GÊ¹ùxê|áj ¼i9MBÄÞ0Ü’ýt•Í%9è#/Ž ÚQKš&Œ¾¢/»ªÌ¦‡7ü~Å¡—ç­»œ—…<Ûoc‘OKÿõýÃÍãÝýWÍÆqkÿho³}X«¿üœNá¯ãMPµÎû:‘ƒ‚ƒ@ãq$U‡*f/´£À4½?ž‹Ÿ”‡/äß³ÁØ˜õZ³ˆyÏæ¹E3_µ¸Pé%iEªÆRæ¬ƒ‹öWóe­FÃŸë»šc÷uçt+w^&›‡(oÌZÀ/“òMKwþtÔlo5wv?ëñ+š
Dç¤9µÖÓ8Iv³dªÌÙsºÏŸ™±‡ÃXÁMŠH¦†¶Iuù¯ù5y d'W[ž§êSh¸WYÒX^zrÅ%Ý‘>Ë| üý0¹…KÇ{FW™N–óý_x¶R‘ì3Ãa½‡·ðfI~1#ä7r
Â+vL‘¬¬å“üí_ÿ›óü°Q{	ÛÌiïþTu”0¿ºbw¥8G)F4êÀe8î9Á DŽµ3«#)¶q~ØÏÙk…¸~ßc·¥_ý1EÈ‡ÜÒƒðlù¼îÜòüõ.Y³ƒN§²ôO$ ÝLñÛ™CnÚ¡Ìg‘ˆ¯3suyR‡a £ë¸sê¾wvó	½tƒ÷¨Z=c—Ë1ÛäLå.š¶A»Yº>êÝ¼A'’tødž¢ÓÁŒÓb¿Œy–/`”ƒ3ÙÓ…y;»Àc^9±·Ðtž’‡ÈUž«YÆÐÅåq3Û6„éçDîv˜èžF£axØõ†ðºŸ¥ÒFmµ6é Èh€S>ìh¨‹¦|z¯ÊbÚký0E%Ì‚àsäáÂ8£’T×.°ÀFïÔZ/ô¾®í¼ll:û[[B†‚q<B+Ä½}§¾¿»ÛØk—œËž7€–q©áÕ)lfÊýåÆiº£}Þ|º˜ã¶dx6Š|¼)H½ãQ·Ð¤)îÁ6šÉÃ„µì¹Bª3UŸÆ%"äîí4˜ÕÔðùžFÏª?‘žÞT,/M)†ËýS\7¨³éE@–	MsmkÇN«°«U‰G‰ïŽç£Ø€pîÔÎÎ\?’sØf·õý=ÛN»qÜ%•tööÛÍz£ª¡±¤Eáö·{aÂm­ëbÿzq‡;l}õÕ–Èx‹¶®Ë9ˆ»o¬Ø%û,µ™“&ò©ƒ¤…¥µE’Bô"ÜWØj	ÎqÙìv»äWÍÉ(H¬	ta‰ºêáÄÉª|FeG”	}¾üÕWmlÛ©õ1žÌHÇ¢¦VSôKpefõ¯¾j!î -r¶há+c²ÍašŸ[^|£á“áNÒ‹,!›×Zùª|eÆéxX¼ÈÉô=)ÕcFjáÉTrìD…ó´Fœ Q©•…A´Nn Tð¦j§ÍF}§¹×øll£upœ±ñ^øéæ™¡ZåÈßÒqæ¦ DhÀ8Tš;Ãã£Ã{ÍéuÓ;$‹9œt¥DÃÀgön+mWawbx#¨]…Óí òú¾G60ie¼ûÞœ‡}ô„^æäÃF#ê‘g9/Å{žªÀ0Ì½2
©={P‘ÛeL=2¾´í¹ýü@'éð›ƒ?áyAØOÙâ
„ÎŽ p
g6Hô&·	P–p¹-¯ÄÃ+ŒµxEñEˆ™Æ4"Ldö±MhC^‹÷…ñôRJe£ã‚iFQÎcŒ$hÌÐø˜#*XcŽ0t¨
\È+ÒæVÁéx‹è›ýýÒéaªÍ#¦zÙJ/$m3GË£(0Œ²³W\u\àØ”nÊié³H×÷_ýA¢ÿ Ñ¿2‰–H1³iõ”ùÊü«RfBA]/>!U¶86v›Ã{È|ÿ$ÙãÊ0³Vï–ÈN½•·+Gi¥+(ŽMž‚5¿*ü~²è«€SÞoÀºølHáõQâiì0-Ë¸(/^Ñ&T&“zL¾dcöÅêéÄØNz‹¢höe¸‡^·ŽaF#¬&þ+“æcÎìw%8>ll×k‡Š9çÔd!3Å	Âð}q²9ps¢òšQ`ð¶t¯¨ÛÓ(Ž|µ«_Tg·»Ê%5>´ÁJÃ4Ž½œ"„
Ã0;¦±€mLúú0vjƒs	Œ'y'ä„{œ€ç+´ØL[ãv›ê…WœŒ1]ËÍò€šZz6ãÍüp…0Ôk“%ãv˜=ô·`>70ëFÒÔ	/€¨&‚xd0ANçJv´lÉê<Ží¼»ÔÀWìÀüÜb™/Ý¨‹Ž¹zqØH ß–x¸å¥ËG\“u‹ÆfM‹Û‰ÇÇQtî©•‹N?ö™æLaŸ„ì“*ê¥-š“J5ÈÐ“ô¸ÀÕY8üj(íÍÂö[ ¥[›±*ÐÌ$2¶´*Zê—ÇÌS« ®|cbé¿3Y›·Ð“ûh?ûäÿv)õx?ZXÊCyK„^çfxÿ	ûhˆ!Ú%Îï]ùƒ%¿!KnÏ+5ž ,šÛyÒk§æöÞ±ìÊÿæ³Jgô% ŽÚÀÐ…¸üÅÍÖg§QÃdß,Ð.Pšö†KR;Ú«¿8®¾9hï×÷›{ÒŠ9‘r“ØyZŒ <á_w4èô"J[N–Z4¸b¹( ž‰ csïÐ¬LµŒ3j˜ð@¡ë+« 4Í:º	SXýA,¤Ùp0(Çœ:2Îžç19òî”aÃUêÀÓã¼ÔÇj&f>Ûéošõì—4û™XÏN}zZµ‘*}¨Ï@ö¦ïFï½¤îp0'v8øò,COùVª!±¡½0èRôm%M`Q,žWa0Âx"Š	ßp$n>rvp“tF#–tÁ%~@lì’Ìßñ§Z‘w±r°'”ûl‚‘Mç¿ÏÜA=¦¿/B<*ùO0WNâ }¯ÝƒéÔŒÕv*Ývë(}ûØ™ ‰(R(n!2…äæùÑNk,dÆ%;9F@>=Å˜‘ÆœŒ‚nNK‰xŽ0iÅ3>" Ö¶ÊÒ.Òü<pÓ4È.övGAâh ‚É?Õf¾e±¢Óèf9v­SªŸ˜:i«æ¬„q<Ø¨ÔUÎºÊ…0}¨16XÛáÈe`™s°B•ì¦Ý‘­ÆÎÎø-yÞ`d÷Ò—kü:»²há¾ã}.ôñâ¨gÑmwé¦gÝ¥‹é.¥F¾•ã¹gaˆhaŸIÂQ™ô‡•…)ÂìÀ—NtûŒèÁâ]Òëðt’ ðãvÛûùÑáÞ¸íýïjÖÄçæŸ'ÞfD-k%)(ÌN±J¹¢CQx|CæÍ›£rVÍ”¹x )ŽÇ€)S-ò#*Ò@Ý`îÖ_6Úù1•™ôùL6äxæ÷óÞx¿6³ù	ÐØzý1‹ù¥H¥Pz$><Ú>8²q‹÷î×‘ÍC!Û'C³h¦¶-'É€Æ8ó(knÜÛ%¯Ü`¤]aäJ{!ÂkW$£sîmöÌ™“Í\§—txîNt×ŽœÌ]–ãŒSÛi¶uŸÙŸG¬ËçÌsÜx›hŠ¦XÜ:	L9ví¸g	Æ{‡q¢o!†ƒB{„¯?î0ðÀ\:ó¦Ý¡vP!GŽ„°?<ò4î„Aàc¯++Lðrù>¨+ŠkVùSE¼T€M¥AQ'ó/³*@.Ýx×õ/HÉ—‹è—ò}^IU»T^û2<óÃdÊ{R­“{]–s[¶ˆé59^‹öýE<!T ãýUç'?;õEù§'Y_Î¡{¤®U0)÷†[0ž“ÐS®ÞÓÆ[<¦œgÇV]ï“»Øø)f²å°ô†õˆ8Üœ·™NÜx­qj}a»"Ó„iù„öþööNCÜ)µ›;ÍöÓËûx_Üns"(Ü £/¶z¿ð–ÿÔLøÓMÿì IP7œÅeŒàº¼öeðÒŸ)œ¢y“ö8vY áyµæÞYoÜ¸_š|DjUsT)2U™gî–™?:Ø¬µÇµÃv³Õ>Þ:ÚÛ¼×hÊ_èq®’­….Â«æfã^å)…|åw½0V™·zFCh1t‘c1”ù@\¤ÒkÖBLFC_Fh<6òª:9S,4Ï9UUÇš®ßõWÈóÈs zÝQ‡Xg­J	Š[4|²Ù£}Ÿ—Þãºà°ÄõÂ‡„?–7A:‹nÀ ´_e6yn3êàp›"I¿n4^¦ X+>L¸\í†ÝÌT>ñû{€µ»øž[³c<4?Æ´ÁÕÍ'[D#ŽÉØºp^Ù’rcåìGóEÐD
k½ÝçË+$µ-ÍšÇn¼ËZ†a"{M:É2úeWÿX±vý3ßëª-;$¨ÎÉüM³‹fòj;f’=W(/Ô‚o]}KËf1
Ó#c¾Ô9yâ²æ:ÜŒ%;Ëdu¡bÝ-}}øÐ9$	ÕÁ‹Žtä›Jœz©Þ›™=ˆô·r
[æ|Çs[àÀˆ½9õ‡Rµ,äÕ­Øª.ñªõ˜ø‚º9í.SåÆ‡‹§…‰æ@2È‡³l³ÂúàÞ©ãÁø£ØS¢“™prúS!@¯{nà9§£«| +öÉx"Õ=%.ˆ pFÚ!Æµ?˜aÕÞ…Ç ÕqûN4êÃT@ÈéÃ*xN¡¢F=°V_*?bÕ=7Òª«¸6ÿæÔ;FdD\¦×l7¤â8P<
gË6™"¦¯	k3ÞsÍÜ$¬Ö Ù* y]VyÙ¬+ukªú¥EÊ'ýÀÚÛj³ó¼'w^° ‹ÃA×,‚*ÄF—zÙ@:6Ý¶1%æ¨¨‰¬yÈ’e^9ž‡¿Íí‰IMEp=´â‘çýA:äYÏHÍ?ÕH§d<@½’T'À€u,Ú9¶ºúçy·Õà½ýVß
r_ŠÄÛùüsbÓëÀiÞS0C™7Ëò?S¤½YÎkÔê³´£Oõr²I#
a<ÏÆù®ðgnqMmª¤¶”R{8Ë9&&i=U©ôLö­¾e	Íæ¹Ý¥a~wÃœ\Qu±PJhUh–¤òŠëËBtVíD‡'?ÀQÛÖýášž%OcÔ†Ô¯›yúøf%>gSþx[rs¨d×KeÏ\fÝ«´‹Ë/VÖçËñè4f¿Y&”O¯Tg÷ ì¼ýÇßþõŸ­¡"F1òòTõà4
³äùK>ybmùŒb4ÂÚÔñÆd|ÜKq[‘³ÙŒ…µ,î.¬^Ýñ+/"µªQ®ï‘!°U9Å<|¥×ÞéŠóW‡Oã_½­vŒB–@r€‘1ü#ìAëÌúñi…sBàÇ¥ì»ÐV/I†qõáCr…¤ìaÃ xF ý‡Ã^˜„‹•õååõ•¥'O¯>z´¸¼tºZét—¼¥G«—Ï*kKßôèß3?yÖ‰Âá7yöxÉè–æJ©h6ËCy^í
‚£²@•RdNÏ›xO£RàQ8™´î¼ÞÝ¿Ž›Åõ€e6R'‹ÏÉxøž2ÓÕ>føûúcGºÓ›q^{ñå<Ä;=åewöÁ?þö?ÿ¯†1ÁUÁP,™0|Ïb[w"¯ëŸWÀxÀŠ÷œÈÇæáeÙÙ³Ð?ŽñÑtP&àMŠ'ŠýÂÂHÄ°Ö$–è¡IÚ¡²ÓòñNó$ð82ÝBö`Ú1²9»¯ì<÷Ï,&„†Ñ„î2M¯;ôf»Nÿ
äŽ3ozù—1Æw¨5Qvv¼d6†É†LðþO4 ïôEÏ\/rüÏñ3¡s2~²ëäSí±oÒûeŽfEù’y‘4Q²Þø‹Ýµ¥"5™‡yJ/m &4\DpÙUo¦Žèº¦©A@Ä^W³*+kÍ8‹•´j"T½Á‚r…ÐÑÔY2[öi›PNÈ„Ê®pÑµ!Oh×_ñÖÀn’úC°ø,Kfw,m÷, ñŽ›¢‡ÃNäòpT.]A³ûWæôîÄÀ¯aÎ#&Ýaí½›yfÑÇŠAå«ˆÒ}6­ÞiJÍö k›ES§Ä€ñËÕ2UX&jVcž6¯?év9RFÖnfh€‰7`µæÒÅŸR¶N£pks!{…f¿¤´&Åã4…ôžšVtá’¡õ†…¬™Ñ<;]y#%$¥ySWG0Ó 1çû­CK7,R˜Â×¢rH[’áœÒˆ”üÖ–ð#cw•IµQÁÏ{¢…‘ƒ9ªe"ò®aS¥+Øuê7,Ó3»hƒ‚°~zde“ŒËôl*(Vb>,‹ÇSÀºVÅÊ)kA·%J©w6êÈ¿J“HQÓBŠ¤åÎìEØUvW·"ÙØpgYIPAçï1–r]uäKbŒÒõy<@œiƒ¤]sk€¸Ò²ãwHÃïÃ3èqF˜}Â¨Išdl‡iSÊ[Å¡í€„¯bH÷…}‚PãyÁ $ƒxèö½06ó¹—`~(vC çö)ÿšb®¨ÿqùRyû×¿*²4–¿X„je„&•†;ò.´‡ Ñ²w¼öS­c§^L=ãX•MŽ½[œ˜õã2~œXÛÐæb”±¸m™(£dnÎ]pNiÌÖº§(Ã[ß¸óóo—2ËHŒÀF°ÒÅk,k[¢²©½ëKË”ÁyèÙdtu	U>t1ë TM›(£&&DÁ/çÌ&éµ\–´L".r¿g©$rTxz^¿Ç¹7ê¨'ŠÖg3ƒø=K0I¬£Z«ˆÕ¤.¢»²¸fS‘ËTnØÀ:5°¾XYÛÂÒÔ-TØ4òAT@à×Èô£Xf¦ž¬åÊâªÑÆÄ V¹tA Ö–Ÿ,}¥-9×³C
€"ÓO–KÐÏTÞŸ›"øÙüüF¦,@3fÝ„Yt©Fc&4Ý:ÃÖ‘g%Õû>ÛÌOu¤öãMït”ÜðwÏ$Èù‡KŽŽœºK+Ænù(u‰Ø|ÏGè8`ä†>T–(›7ÆCQ_,ã‹eË‹|±by±Š/V-/ÖðÅ¾¨¨DÂ‘†wRúúc:I"õÐéˆþS`a+U"Mš·\+y‹
SÄ($áÃþ¦“sÊ|‚ŠóÜ‚Óó©¼€S:.§¥Ê‰’DhO<Åë0BÉH`È†Sêâ—ÌA)ò5V§Q°%Ûæße'íð]²iÄ”.”ºQ8Ôš»žrþ­°€g»™fvÈø+Ó˜™¼³6¯7qþ›XŽéÌò©Y“ÅYw½ëðmésØ‰cÉ|ãó’l¡.uP“Î7mq¾2Ž±aÊæ¥¢u˜R:ÐY¾ÛÄVÅ—qÌ¿5a²°‘Ÿ€çÏÓ™ú—I³D¥újõñŠ 1E&
GS^¤\QƒipÕ›/,¶½¡Fä¿€ˆ±wPwþ2
“4(n1MWøpÿýXÞ[‘ÕI¹pJªDl8*.Pp ŒY1tà·ºntÎò%;Ï¤!«QµÎ“Ú‰Z³€g¼Ìúj¦5R_`È3ÙÏ2MÖþ™JN Ñ‹Z*ßgÒ½~½KëÙyÕî‘¾<f›ß7ÔÃ™[Êàng,ƒe˜öú¦úüØÃŠZˆ»Òöš=,ªÎ£BöÆï¢±P‡×@ôæJTá¸4?ož ôÊ¤çzŸ©€Õ5£Úü›÷°"¨œÇxõ âÒÇ¡sêv ,7J¥­ ŽÈS¯ç^ø€åÉiÏVèµçté6¢ãZ‚Ã¿+Ru¯Ì¿Ë?˜l‹ð(gÎÜAþh=2VÄír:Ã®B5joY'(6~•Îè2`Ü•v÷Û/‡¥§´¿»í¼i´Z-üÑœíË«ÔsñN¨ôÎ\ÓÂÙÕ×¢`²ÍI]½ÃÃR™ œƒRžžsãîŸU%j:íqZp1ñ}ˆ8§=N«Ù§;NÇ”éJ’ˆ¸šfñì@QU˜ve,W0pó'@‰h“\®jò¥kÕ%ý­Œah7ÇU„lué¬Å­îv:xE'K„Êà8}°à MŒ‰.ó{‘@6¤‰HÖvÚ,,ž‡úQ”S‘§ T«’¥QF¡étx¹g?‚ïW§žsÃ:õ:îoq˜v´GÖæÀTöËò®´F`5Üæ>H•Ê /THÿ#VqE²¬IÆ rõa¼¯Harðë}ÏŽÆrn	?­xˆ7QítÄ†Ë¿vèÒF£NÂ]Ä˜à‘^](žÈu_»~² á-’)=?1I't)»lãóSÛÛÌ€{˜ù,•dÊJ(h2ñ)ò†\%>Eiº€'«7 Ä2x!v"Ý5°á`­p@—ìÆˆ´íKvLûAê5+_\1+0m¦ç™ý«hztéI]‚Æ#/k¦èZUVÈ2•¯Œ>iüiýJ.”ŽKWâNå˜…Ë¡‚í´bc)w”ª÷†v£)9Ksií§²ƒMPjG€V¨žýËÈe.`rú^ LÛ~gà3fkÅè¡ppÈÞ3×sã«RJlÒxš¤£Ê³A°xãèÀü÷LæL™‡sÀ¥Vß{Î?)=Õ‹­HÅÚþûvøÞ^÷¥(ÇôÓöbr«Axé<aji³àš9TVB(dôÒK“¦2á`–×&ÌÊ¤ƒ‘G-&CªÒ%ÆˆTÞ‡a%|Ñæ 
ÑÝ'ª½s;Iy«þÝGSý aþ]z¸‡ž-×ß#æ‘³»ðÕõ¼ê€óö<sÜéúñÐM:=Ü¼p<q_œ9É/g§2¨ÑtÆwB² ]À¤âMñ‹ƒ¢âs¸Kå:+ã9ÇÃ’jî¨Ï”úK–Ê»PN¹.¤T-ñw4°íK¨d¡ˆyox¡*¦ÀS_Ô¹f¶üÈ;¥¤O¹FƒrÀ—Â»CNLLMùY>²"ss³ÃÔ·R!žŠs¶wâÄJ³ôq\x]FuEš·»ÍÃ|ÄWƒŽ3§°S¨þÎè/òGÔ§vˆMâú($áÚ¥˜ç#p6ŸÃ9A#snp‰×Hôx‘=c,YL £d4ÌdŽ4 ž‘Ï0¡¦{ZŽáw\6~þ«‘ivçæ5CYÅB’.M¥ÇÜ¥¥P/"W®ÂryOK©R:EZ}™ÓVz,Õ²]bÆï+|éu…£›€ÁCv½®ï6h}‹x*[ ævÁ‚ÓÅÑ`î*„ž:,glzüTbÀð#vúÜG‘òmg¿¶y¼]Ûm€0Êý «fß¯m‡ÓAPÎœEºü€¹‡à1p•¥z8
ºt°¥}bÍôøf<X ã¯LQæÈøHK'b…ˆ]ÁTJ×H—¤öŽq7{@ž/‘ÁFºÞÐtQc•â>|§p,æ&g&ŠRß‘—kÂQüÁë²ŠÌ¡pëÏ¤t†4r*©Á{nA%ÌÎæ•!î'g;„fí@§™^<ì fèØ{C™ÂÇ­(ì3|L;£ ¶¯‡£	µÆîfÁøÁ´fDÊA ÂvµeË§¡“áïê(“'t×]¤ÓP:Ñt$21£ëÊtp	;A8êR#1éÂƒU¨,ÁüÂ`º1Ú¬ zã!C†ö{^ä‡ÚA”Ÿ¿sÄÁçxºé„Þ¯!ÝdÂÞj³s“¡]R2Ç¶ÊÜu—7£gÏuQzF©eèõ4'8ƒÇ_ÜtEòkø5¡ÏÂµr;d£w˜V¶¾³´yÜÂhÿÍM™î©}¹Î5/E§G±Ú¸ÐÅJp(8ó*ÜóÛ`ú©Ûy÷†R™5Y„é\uÅL2äãX*dtÎo²ïž	Làè1ýæX lã[$ß©¸µIHovºËUd¯GBßk~ƒ’6±m2Tné©6äl8ŠÑ§ê\ïT3&H\ãŠ×UG„Zs¶±ðË¦|¯Ìý‚ŠX+r¯¾Së"þ–Ùá&ÆFbÎÙe“"0C‡€²R¤Û•Tæ:`šX‚LßŠ€ò5 ¶˜¾•ûŠ¨Ì´ïZt<Ûâ óF.A\ç`ŠÀ£qµö˜5V1k]‹‡§Ãâš—°Ø•#>È)þú×l¹ž2ß¬çb3ð½ñ]×¿€=áÆ1{V:=_üÅtŸ¬-9	ôwñ²ç£…?Xì-Æ˜ûsxèŸÅN8ðº/v˜ùÆóÏ®ÄÏáâz)»¦ÐÛº\DÆËé»/û]'m{iÉ!Ràu—? å1ÞtÃKúyFÎŒýaý{¸VÔ)û^R/M¾‹/ÎIÉý<üð¬´ä,9Ë«ðÿ’ÚËÊºÓÃÎü Xä4“}ûo*^÷ÑúÒ;§º¸î¸¿ë¼8¶–œý`?#¤êÃ‡———åË•r?Äûï‡ÐtI¿Âýî9Ýg¥ÝJ¥üäÉº³T«,;ðÿ%þ¿Ê²+?`ßÕ'‹ê“EzòK­üè<}T^~ä–­­â¬Æb¥¼´ÏWw—ËW¡|ùÑÊÚâz¾.—+Ë+Kåõ•Çð¼²¾Šµ×ð?^»¼²Š VuVËë ?.¯­/–×—90GëÑ}~­¼òh¹¼¼ü¨¼úVÖ±I_ÿ¥ *‹+ååÇÐÀ“UøÚ¹eø¹²´ÖÁ·Ô¹'O*‹Ðôníñ*¯¼´üû°ü+Wð?Ñ»µµ5xóxiºÇzºRyä<)?~´„QTVÊkV ëËåUhb}ú¾^~S­¢³ü“µ`±¼´=­üÒ/W–Ö '«ìÏ“å
ôa…ÍÐÊ#ìtgæû¹º´æVpþö/ô{´¾FÓº¶†=Zf=ÂiZ¥ž.a—Öa@Ô¥µu„
ÞÃ —V)=ÔPK{Ô«ÈM˜‹é,$‹§œ¼ˆ¾Ë¥ï›În³þÝÃ^Eƒ04 ÐN]…JPúÀNúæ1ìØôU½Åõw‡H;14à±DèE§ÖAk‹³ AÏïv½m!\ã)~T*—m]YiÈô öñêtÈ°ÓEäÕº¸½BCÝÅMž¬­ÄÉUà=ûøÑ¹ô»IòtjúŸë:q®Ídxß÷º®/¦ùÈ\Š±“-Ét±Ÿ,®:#LþI`4¼f]„.yq’-NÖ#§Î#n*ë¤4/ý˜OÏ,å4ù¥ºäü”…öŽ×¾À¨{0-)ìŒÉJ	îU
4$nö§jˆ ãüœ"›n1”BOÈ÷ÐÖq,<ÿÔTMãÇRsšŽ±Ã 0-7'¦i#F„<Õp‹:éE ·ãmIƒ1É¢Á>¹jz¼K$þÀqMi‰/Lº.¼!Åÿ  ÿÿ bà