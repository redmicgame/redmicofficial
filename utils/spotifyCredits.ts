import { ChartEntry, GameDate, Song } from '../types';
import { LABELS, NPC_ARTIST_GENRES } from '../constants';

export interface SpotifySongDetails {
  title: string;
  artist: string;
  coverArt: string;
  rank: number;
  lastRank: number | null;
  peak: number;
  streak: number; // days in daily, weeks in weekly
  streams: number;
  producers: string[];
  songwriters: string[];
  source: string; // Record label
  releaseDate: string; // e.g. "Aug 23, 2024"
  firstEntryDate: string; // e.g. "Apr 12, 2024"
}

// Convert GameDate to formatted "MMM D, YYYY" (e.g. "Aug 23, 2024")
export const formatGameDateToChartDate = (
  d?: { week: number; year: number; day?: number },
  fallbackYear = 2024,
  fallbackWeek = 1
): string => {
  const year = d?.year ?? fallbackYear;
  const week = d?.week ?? fallbackWeek;
  const day = d?.day !== undefined ? (d.day - 1) : 0;
  
  const dayIndex = Math.max(1, (week - 1) * 7 + 1 + day);
  const dateObj = new Date(year, 0, dayIndex);
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Known real-world credits for iconic tracks
const KNOWN_TRACK_CREDITS: Record<string, {
  producers?: string[];
  songwriters?: string[];
  source?: string;
  releaseDate?: { week: number; year: number };
}> = {
  // Sabrina Carpenter
  "espresso": {
    producers: ["Julian Bunetta"],
    songwriters: ["Amy Allen", "Julian Bunetta", "Steph Jones", "Sabrina Carpenter"],
    source: "Island Records",
    releaseDate: { week: 15, year: 2024 }
  },
  "please please please": {
    producers: ["Jack Antonoff"],
    songwriters: ["Amy Allen", "Jack Antonoff", "Sabrina Carpenter"],
    source: "Island Records",
    releaseDate: { week: 23, year: 2024 }
  },
  "taste": {
    producers: ["Julian Bunetta", "John Ryan", "Ian Kirkpatrick"],
    songwriters: ["Sabrina Carpenter", "Amy Allen", "Julia Michaels", "John Ryan", "Ian Kirkpatrick"],
    source: "Island Records",
    releaseDate: { week: 34, year: 2024 }
  },
  "feather": {
    producers: ["Julian Bunetta"],
    songwriters: ["Sabrina Carpenter", "Amy Allen", "Julian Bunetta"],
    source: "Island Records",
    releaseDate: { week: 31, year: 2023 }
  },
  "nonsense": {
    producers: ["Julian Bunetta"],
    songwriters: ["Sabrina Carpenter", "Steph Jones", "Julian Bunetta"],
    source: "Island Records",
    releaseDate: { week: 46, year: 2022 }
  },

  // Billie Eilish
  "birds of a feather": {
    producers: ["FINNEAS"],
    songwriters: ["Billie Eilish O'Connell", "Finneas O'Connell"],
    source: "Darkroom / Interscope Records",
    releaseDate: { week: 20, year: 2024 }
  },
  "lunch": {
    producers: ["FINNEAS"],
    songwriters: ["Billie Eilish O'Connell", "Finneas O'Connell"],
    source: "Darkroom / Interscope Records",
    releaseDate: { week: 20, year: 2024 }
  },
  "chihiro": {
    producers: ["FINNEAS"],
    songwriters: ["Billie Eilish O'Connell", "Finneas O'Connell"],
    source: "Darkroom / Interscope Records",
    releaseDate: { week: 20, year: 2024 }
  },
  "what was i made for?": {
    producers: ["FINNEAS", "Andrew Wyatt", "Mark Ronson"],
    songwriters: ["Billie Eilish O'Connell", "Finneas O'Connell"],
    source: "Darkroom / Interscope Records",
    releaseDate: { week: 28, year: 2023 }
  },
  "bad guy": {
    producers: ["FINNEAS"],
    songwriters: ["Billie Eilish O'Connell", "Finneas O'Connell"],
    source: "Darkroom / Interscope Records",
    releaseDate: { week: 13, year: 2019 }
  },

  // Chappell Roan
  "good luck, babe!": {
    producers: ["Dan Nigro"],
    songwriters: ["Kayleigh Rose Amstutz", "Daniel Nigro", "Justin Tranter"],
    source: "Amusement / Island Records",
    releaseDate: { week: 14, year: 2024 }
  },
  "hot to go!": {
    producers: ["Dan Nigro"],
    songwriters: ["Kayleigh Rose Amstutz", "Daniel Nigro"],
    source: "Amusement / Island Records",
    releaseDate: { week: 33, year: 2023 }
  },
  "pink pony club": {
    producers: ["Dan Nigro"],
    songwriters: ["Kayleigh Rose Amstutz", "Daniel Nigro"],
    source: "Amusement / Island Records",
    releaseDate: { week: 14, year: 2020 }
  },
  "casual": {
    producers: ["Dan Nigro", "Ryan Linvill"],
    songwriters: ["Kayleigh Rose Amstutz", "Daniel Nigro", "Morgan St. Jean"],
    source: "Amusement / Island Records",
    releaseDate: { week: 43, year: 2022 }
  },

  // Taylor Swift
  "fortnight": {
    producers: ["Jack Antonoff", "Louis Bell", "Taylor Swift"],
    songwriters: ["Taylor Swift", "Jack Antonoff", "Austin Post"],
    source: "Republic Records",
    releaseDate: { week: 16, year: 2024 }
  },
  "i can do it with a broken heart": {
    producers: ["Jack Antonoff", "Taylor Swift"],
    songwriters: ["Taylor Swift", "Jack Antonoff"],
    source: "Republic Records",
    releaseDate: { week: 16, year: 2024 }
  },
  "cruel summer": {
    producers: ["Jack Antonoff", "Taylor Swift"],
    songwriters: ["Taylor Swift", "Jack Antonoff", "St. Vincent"],
    source: "Republic Records",
    releaseDate: { week: 34, year: 2019 }
  },
  "anti-hero": {
    producers: ["Jack Antonoff", "Taylor Swift"],
    songwriters: ["Taylor Swift", "Jack Antonoff"],
    source: "Republic Records",
    releaseDate: { week: 42, year: 2022 }
  },
  "blank space": {
    producers: ["Max Martin", "Shellback"],
    songwriters: ["Taylor Swift", "Max Martin", "Shellback"],
    source: "Big Machine Records",
    releaseDate: { week: 44, year: 2014 }
  },

  // Post Malone & Morgan Wallen
  "i had some help": {
    producers: ["Louis Bell", "Charlie Handsome", "Hoskins"],
    songwriters: ["Austin Post", "Morgan Wallen", "Louis Bell", "Ryan Vojtesak", "Ashley Gorley", "Ernest Smith", "Chandler Paul Walters", "Hoskins"],
    source: "Mercury / Republic Records",
    releaseDate: { week: 19, year: 2024 }
  },

  // Kendrick Lamar
  "not like us": {
    producers: ["Mustard", "Sean Momberger"],
    songwriters: ["Kendrick Lamar", "Dijon McFarlane", "Sean Momberger"],
    source: "pgLang / Interscope Records",
    releaseDate: { week: 18, year: 2024 }
  },
  "euphoria": {
    producers: ["Cardo", "Kyuro", "Johnny Juliano", "Sounwave"],
    songwriters: ["Kendrick Lamar", "Ronald LaTour", "Matthew Samuels"],
    source: "pgLang / Interscope Records",
    releaseDate: { week: 18, year: 2024 }
  },

  // Charli XCX
  "360": {
    producers: ["Cirkut", "A. G. Cook"],
    songwriters: ["Charlotte Aitchison", "Alexander Guy Cook", "Henry Walter", "Blake Slatkin", "Omer Fedi"],
    source: "Atlantic Records",
    releaseDate: { week: 19, year: 2024 }
  },
  "apple": {
    producers: ["George Daniel", "Linus Wiklund"],
    songwriters: ["Charlotte Aitchison", "George Daniel", "Linus Wiklund", "Noonie Bao"],
    source: "Atlantic Records",
    releaseDate: { week: 23, year: 2024 }
  },
  "guess": {
    producers: ["The Dare"],
    songwriters: ["Charlotte Aitchison", "Harrison Patrick Smith", "Dylan Brady"],
    source: "Atlantic Records",
    releaseDate: { week: 23, year: 2024 }
  },

  // Olivia Rodrigo
  "vampire": {
    producers: ["Dan Nigro"],
    songwriters: ["Olivia Rodrigo", "Dan Nigro"],
    source: "Geffen Records",
    releaseDate: { week: 26, year: 2023 }
  },
  "bad idea right?": {
    producers: ["Dan Nigro"],
    songwriters: ["Olivia Rodrigo", "Dan Nigro"],
    source: "Geffen Records",
    releaseDate: { week: 32, year: 2023 }
  },
  "drivers license": {
    producers: ["Dan Nigro"],
    songwriters: ["Olivia Rodrigo", "Dan Nigro"],
    source: "Geffen Records",
    releaseDate: { week: 1, year: 2021 }
  },
  "good 4 u": {
    producers: ["Dan Nigro", "Alexander 23"],
    songwriters: ["Olivia Rodrigo", "Dan Nigro", "Hayley Williams", "Josh Farro"],
    source: "Geffen Records",
    releaseDate: { week: 20, year: 2021 }
  },

  // Tommy Richman
  "million dollar baby": {
    producers: ["Tommy Richman", "Max Vossberg", "Jonah Roy"],
    songwriters: ["Tommy Richman"],
    source: "ISO Supremacy / Pulse Records",
    releaseDate: { week: 17, year: 2024 }
  },

  // Shaboozey
  "a bar song (tipsy)": {
    producers: ["Nevin Sastry", "Sean Cook"],
    songwriters: ["Collins Chibueze", "Sean Cook", "Jerrel Jones", "Joe Kent", "Nevin Sastry", "Mark Williams"],
    source: "American Dogwood / EMPIRE",
    releaseDate: { week: 15, year: 2024 }
  },

  // Benson Boone
  "beautiful things": {
    producers: ["Evan Blair"],
    songwriters: ["Benson Boone", "Evan Blair", "Jack LaFrantz"],
    source: "Night Street / Warner Records",
    releaseDate: { week: 3, year: 2024 }
  },

  // Teddy Swims
  "lose control": {
    producers: ["Julian Bunetta"],
    songwriters: ["Jaten Dimsdale", "Julian Bunetta", "Marco Rodriguez-Diaz", "John Sudduth", "Joshua Coleman"],
    source: "Warner Records",
    releaseDate: { week: 25, year: 2023 }
  },

  // Tate McRae
  "greedy": {
    producers: ["Ryan Tedder", "Amy Allen", "Grant Boutin"],
    songwriters: ["Tate McRae", "Ryan Tedder", "Amy Allen", "Jasper Harris"],
    source: "RCA Records",
    releaseDate: { week: 37, year: 2023 }
  },
  "exes": {
    producers: ["Ryan Tedder", "Spry"],
    songwriters: ["Tate McRae", "Ryan Tedder", "Tyler Spry"],
    source: "RCA Records",
    releaseDate: { week: 46, year: 2023 }
  },

  // Ariana Grande
  "we can't be friends (wait for your love)": {
    producers: ["Max Martin", "ILYA", "Ariana Grande"],
    songwriters: ["Ariana Grande", "Max Martin", "Ilya Salmanzadeh"],
    source: "Republic Records",
    releaseDate: { week: 10, year: 2024 }
  },
  "yes, and?": {
    producers: ["Max Martin", "ILYA", "Ariana Grande"],
    songwriters: ["Ariana Grande", "Max Martin", "Ilya Salmanzadeh"],
    source: "Republic Records",
    releaseDate: { week: 2, year: 2024 }
  },

  // SZA
  "kill bill": {
    producers: ["Rob Bisel", "Carter Lang"],
    songwriters: ["Solána Rowe", "Rob Bisel", "Carter Lang"],
    source: "Top Dawg Entertainment / RCA Records",
    releaseDate: { week: 50, year: 2022 }
  },
  "snooze": {
    producers: ["Babyface", "The Rascals", "BLK"],
    songwriters: ["Solána Rowe", "Kenneth Edmonds", "Leon Thomas III", "Khristopher Riddick-Tynes"],
    source: "Top Dawg Entertainment / RCA Records",
    releaseDate: { week: 17, year: 2023 }
  },
  "saturn": {
    producers: ["Carter Lang", "Rob Bisel", "Solána Rowe", "Monsune"],
    songwriters: ["Solána Rowe", "Carter Lang", "Rob Bisel", "Jared Solomon", "Scott Zhang"],
    source: "Top Dawg Entertainment / RCA Records",
    releaseDate: { week: 8, year: 2024 }
  },

  // The Weeknd
  "blinding lights": {
    producers: ["Max Martin", "Oscar Holter", "The Weeknd"],
    songwriters: ["Abel Tesfaye", "Ahmad Balshe", "Jason Quenneville", "Max Martin", "Oscar Holter"],
    source: "XO / Republic Records",
    releaseDate: { week: 48, year: 2019 }
  },
  "starboy": {
    producers: ["Daft Punk", "Doc McKinney", "Cirkut", "The Weeknd"],
    songwriters: ["Abel Tesfaye", "Thomas Bangalter", "Guy-Manuel de Homem-Christo", "Martin McKinney", "Henry Walter"],
    source: "XO / Republic Records",
    releaseDate: { week: 38, year: 2016 }
  },

  // Dua Lipa
  "houdini": {
    producers: ["Danny L Harle", "Kevin Parker"],
    songwriters: ["Dua Lipa", "Kevin Parker", "Danny L Harle", "Caroline Ailin", "Tobias Jesso Jr."],
    source: "Warner Records",
    releaseDate: { week: 45, year: 2023 }
  },
  "levitating": {
    producers: ["Koz", "Stuart Price"],
    songwriters: ["Dua Lipa", "Clarence Coffee Jr.", "Sarah Hudson", "Stephen Kozmeniuk"],
    source: "Warner Records",
    releaseDate: { week: 13, year: 2020 }
  },

  // Harry Styles
  "as it was": {
    producers: ["Kid Harpoon", "Tyler Johnson"],
    songwriters: ["Harry Styles", "Thomas Hull", "Tyler Johnson"],
    source: "Columbia Records",
    releaseDate: { week: 13, year: 2022 }
  },

  // Travis Scott
  "fe!n": {
    producers: ["Travis Scott", "Jahaan Sweet"],
    songwriters: ["Jacques Webster", "Jordan Carter", "Jahaan Sweet"],
    source: "Cactus Jack / Epic Records",
    releaseDate: { week: 30, year: 2023 }
  }
};

// Known artist record labels
const KNOWN_ARTIST_LABELS: Record<string, string> = {
  "Sabrina Carpenter": "Island Records",
  "Taylor Swift": "Republic Records",
  "Billie Eilish": "Darkroom / Interscope Records",
  "Olivia Rodrigo": "Geffen Records",
  "Chappell Roan": "Amusement / Island Records",
  "Kendrick Lamar": "pgLang / Interscope Records",
  "Drake": "OVO Sound / Republic Records",
  "Ariana Grande": "Republic Records",
  "SZA": "Top Dawg Entertainment / RCA Records",
  "Travis Scott": "Cactus Jack / Epic Records",
  "Post Malone": "Mercury / Republic Records",
  "Morgan Wallen": "Big Loud / Republic Records",
  "The Weeknd": "XO / Republic Records",
  "Dua Lipa": "Warner Records",
  "Charli XCX": "Atlantic Records",
  "Tate McRae": "RCA Records",
  "Beyoncé": "Parkwood Entertainment / Columbia Records",
  "Harry Styles": "Columbia Records",
  "Doja Cat": "Kemosabe / RCA Records",
  "Tommy Richman": "ISO Supremacy / Pulse Records",
  "Benson Boone": "Night Street / Warner Records",
  "Shaboozey": "American Dogwood / EMPIRE",
  "Teddy Swims": "Warner Records",
  "Justin Bieber": "Def Jam Recordings",
  "Bruno Mars": "Atlantic Records",
  "Lady Gaga": "Interscope Records",
  "Bad Bunny": "Rimas Entertainment",
  "Miley Cyrus": "Columbia Records",
  "Kanye West": "YZY / Def Jam Recordings",
  "Eminem": "Shady / Aftermath / Interscope",
  "Rihanna": "Westbury Road / Roc Nation",
  "21 Savage": "Slaughter Gang / Epic Records",
  "Future": "Freebandz / Epic Records",
  "Metro Boomin": "Boominati / Republic Records",
  "Ice Spice": "10K Projects / Capitol Records",
  "Playboi Carti": "Opium / Interscope Records",
  "Lana Del Rey": "Polydor / Interscope Records",
  "Luke Combs": "Columbia Records",
  "Zach Bryan": "Warner Records",
  "Frank Ocean": "Blonded",
  "Tyler, the Creator": "Columbia Records",
  "J. Cole": "Dreamville / Interscope Records",
  "Adele": "Columbia Records",
  "Ed Sheeran": "Atlantic Records",
  "Coldplay": "Parlophone / Atlantic Records",
  "Katy Perry": "Capitol Records",
  "Selena Gomez": "Interscope Records",
  "Camila Cabello": "Geffen Records",
  "Shawn Mendes": "Island Records",
  "Hozier": "Columbia Records",
  "Noah Kahan": "Mercury / Republic Records",
  "Jack Harlow": "Generation Now / Atlantic Records",
  "Central Cee": "Columbia Records",
  "Megan Thee Stallion": "Hot Girl Productions",
  "Cardi B": "Atlantic Records",
  "Nicki Minaj": "Young Money / Republic Records"
};

// Deterministic simple string hash
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// Procedural generator for unknown tracks
const generateProceduralCredits = (artist: string, title: string, genre = "Pop") => {
  const hash = hashString(`${artist}__${title}`);

  const POP_PRODUCERS = ["Julian Bunetta", "Jack Antonoff", "Max Martin", "Benny Blanco", "Dan Nigro", "Ian Kirkpatrick", "Cirkut", "Shellback", "Omer Fedi", "FINNEAS"];
  const HIPHOP_PRODUCERS = ["Metro Boomin", "Mike Dean", "Boi-1da", "Tay Keith", "Southside", "Mustard", "Wheezy", "Murda Beatz", "London on da Track"];
  const RNB_PRODUCERS = ["Timbaland", "Babyface", "D'Mile", "Darkchild", "The Rascals", "Leon Thomas III"];
  const ROCK_PRODUCERS = ["Rick Rubin", "Dan Auerbach", "Jack Antonoff", "FINNEAS", "Kid Harpoon"];
  const COUNTRY_PRODUCERS = ["Joey Moi", "Dann Huff", "Dave Cobb", "Julian Bunetta", "Charlie Handsome"];

  let producerPool = POP_PRODUCERS;
  const lowerGenre = genre.toLowerCase();
  if (lowerGenre.includes("hip") || lowerGenre.includes("rap")) producerPool = HIPHOP_PRODUCERS;
  else if (lowerGenre.includes("r&b") || lowerGenre.includes("soul")) producerPool = RNB_PRODUCERS;
  else if (lowerGenre.includes("rock") || lowerGenre.includes("indie") || lowerGenre.includes("alt")) producerPool = ROCK_PRODUCERS;
  else if (lowerGenre.includes("country")) producerPool = COUNTRY_PRODUCERS;

  const chosenProducer1 = producerPool[hash % producerPool.length];
  const chosenProducer2 = producerPool[(hash + 3) % producerPool.length];
  const producers = (hash % 3 === 0) ? [chosenProducer1, chosenProducer2] : [chosenProducer1];

  const POP_COWRITERS = ["Amy Allen", "Steph Jones", "Julia Michaels", "Justin Tranter", "Ali Tamposi", "Tobias Jesso Jr.", "Savan Kotecha", "Noonie Bao"];
  const HIPHOP_COWRITERS = ["Starrah", "Nija Charles", "James Fauntleroy", "Boi-1da"];
  const coWriterPool = (lowerGenre.includes("hip") || lowerGenre.includes("rap")) ? HIPHOP_COWRITERS : POP_COWRITERS;
  
  const chosenWriter1 = coWriterPool[hash % coWriterPool.length];
  const chosenWriter2 = coWriterPool[(hash + 5) % coWriterPool.length];
  
  // Include artist, producers, and 1-2 co-writers
  const songwritersSet = new Set<string>();
  songwritersSet.add(artist);
  producers.forEach(p => songwritersSet.add(p));
  songwritersSet.add(chosenWriter1);
  if (hash % 2 === 0) songwritersSet.add(chosenWriter2);
  const songwriters = Array.from(songwritersSet);

  // Label pool
  const MAJOR_LABELS = [
    "Island Records",
    "Republic Records",
    "Interscope Records",
    "Columbia Records",
    "RCA Records",
    "Atlantic Records",
    "Epic Records",
    "Warner Records",
    "Geffen Records",
    "Capitol Records"
  ];
  const source = KNOWN_ARTIST_LABELS[artist] || MAJOR_LABELS[hash % MAJOR_LABELS.length];

  return { producers, songwriters, source };
};

export const getSpotifySongDetails = (
  entry: ChartEntry,
  gameState: any,
  isDaily: boolean
): SpotifySongDetails => {
  const cleanTitle = (entry.title || "").toLowerCase().trim();
  const known = KNOWN_TRACK_CREDITS[cleanTitle];

  // Try to find player song
  let playerSong: Song | undefined;
  let playerArtistData: any;
  let playerArtistProfile: any;

  if (entry.isPlayerSong && gameState.artistsData) {
    for (const aId in gameState.artistsData) {
      const data = gameState.artistsData[aId];
      const s = data?.songs?.find((item: any) => item.id === entry.songId || item.title === entry.title);
      if (s) {
        playerSong = s;
        playerArtistData = data;
        playerArtistProfile = gameState.artists?.[aId] || 
          (gameState.careerMode === 'solo' ? gameState.soloArtist : gameState.group);
        break;
      }
    }
  }

  // 1. PRODUCERS
  let producers: string[] = [];
  if (playerSong?.producers && playerSong.producers.length > 0) {
    producers = [...playerSong.producers];
  } else if (known?.producers) {
    producers = [...known.producers];
  } else {
    const genre = NPC_ARTIST_GENRES[entry.artist] || "Pop";
    const generated = generateProceduralCredits(entry.artist, entry.title, genre);
    producers = generated.producers;
  }

  // 2. SONGWRITERS
  let songwriters: string[] = [];
  if (playerSong?.songwriters && playerSong.songwriters.length > 0) {
    songwriters = [...playerSong.songwriters];
  } else if (known?.songwriters) {
    songwriters = [...known.songwriters];
  } else if (playerSong) {
    // Player song with no explicit songwriters: credit player & features
    const artistName = playerArtistData?.artistName || playerArtistProfile?.name || entry.artist;
    songwriters = [artistName, ...(playerSong.features || [])];
    if (producers.length > 0) {
      producers.forEach(p => {
        if (!songwriters.includes(p)) songwriters.push(p);
      });
    }
  } else {
    const genre = NPC_ARTIST_GENRES[entry.artist] || "Pop";
    const generated = generateProceduralCredits(entry.artist, entry.title, genre);
    songwriters = generated.songwriters;
  }

  // 3. SOURCE (Record Label)
  let source = "Independent";
  if (playerSong && playerArtistData) {
    // 3a. Check if the song has an explicit release with label details
    const playerRelease = playerArtistData.releases?.find((r: any) => r.songIds?.includes(playerSong.id));
    const releasingLabel = (playerSong as any).releasingLabel || playerRelease?.releasingLabel;

    if (releasingLabel?.exclusiveLicenseTo) {
      source = releasingLabel.exclusiveLicenseTo;
    } else if (releasingLabel?.dealWithMajor) {
      source = releasingLabel.dealWithMajor;
    }

    // 3b. Check active contract
    if (source === "Independent" && playerArtistData.contract) {
      const contract = playerArtistData.contract;
      // If signed to a major / indie label directly
      const labelObj = LABELS.find((l) => l.id === contract.labelId);
      if (labelObj) {
        source = labelObj.name;
      } else {
        // Custom label contract: check if custom label has an exclusive license or distribution deal with a major
        const allCustoms = [
          ...(playerArtistData.customLabels || []),
          ...(gameState.customLabels || []),
        ];
        const customLabel = allCustoms.find((cl: any) => cl.id === contract.labelId);
        if (customLabel) {
          if (customLabel.exclusiveLicenseId) {
            const exc = LABELS.find((l) => l.id === customLabel.exclusiveLicenseId);
            if (exc) source = exc.name;
          } else if (customLabel.dealWithMajorId) {
            const maj = LABELS.find((l) => l.id === customLabel.dealWithMajorId);
            if (maj) source = maj.name;
          } else {
            source = customLabel.name;
          }
        }
      }
    }

    // 3c. Check any custom label owned by the artist for distribution deals or exclusive licenses
    if (source === "Independent" && playerArtistData.customLabels && playerArtistData.customLabels.length > 0) {
      for (const cl of playerArtistData.customLabels) {
        if (cl.exclusiveLicenseId) {
          const exc = LABELS.find((l) => l.id === cl.exclusiveLicenseId);
          if (exc) {
            source = exc.name;
            break;
          }
        }
        if (cl.dealWithMajorId) {
          const maj = LABELS.find((l) => l.id === cl.dealWithMajorId);
          if (maj) {
            source = maj.name;
            break;
          }
        }
      }
      // If still independent but custom label exists, use the custom label's name
      if (source === "Independent" && playerArtistData.customLabels[0]?.name) {
        source = playerArtistData.customLabels[0].name;
      }
    }

    // 3d. Check rights owner or label submissions
    if (source === "Independent") {
      if (playerSong.rightsOwnerLabelId) {
        const owner = LABELS.find((l) => l.id === playerSong.rightsOwnerLabelId);
        if (owner) source = owner.name;
      } else if (releasingLabel?.name) {
        source = releasingLabel.name;
      } else if (playerArtistData.labelSubmissions) {
        const sub = playerArtistData.labelSubmissions.find((ls: any) => ls.itemId === playerSong.id || ls.release?.songIds?.includes(playerSong.id));
        if (sub?.release?.releasingLabel?.name) {
          source = sub.release.releasingLabel.name;
        }
      }
    }
  } else if (known?.source) {
    source = known.source;
  } else if (KNOWN_ARTIST_LABELS[entry.artist]) {
    source = KNOWN_ARTIST_LABELS[entry.artist];
  } else {
    // Check if NPC has album with label
    const npcAlbum = gameState.npcAlbums?.find((a: any) => 
      a.songIds?.includes(entry.uniqueId) || a.artist === entry.artist
    );
    if (npcAlbum?.label) {
      if (npcAlbum.label === "Island") source = "Island Records";
      else if (npcAlbum.label === "Republic") source = "Republic Records";
      else if (npcAlbum.label === "RCA") source = "RCA Records";
      else if (npcAlbum.label === "UMG") source = "Interscope Records";
      else source = npcAlbum.label;
    } else {
      const genre = NPC_ARTIST_GENRES[entry.artist] || "Pop";
      source = generateProceduralCredits(entry.artist, entry.title, genre).source;
    }
  }

  // 4. PEAK
  const peak = entry.peak || entry.rank;

  // 5. PREVIOUS RANK (Prev Day or Prev Week)
  const lastRank = entry.lastWeek;

  // 6. STREAK
  // In daily charts, streak is days on chart. In weekly charts, weeks on chart.
  const streak = isDaily
    ? Math.max(1, (entry.weeksOnChart * 7) - (7 - (gameState.date?.day || 1)))
    : Math.max(1, entry.weeksOnChart);

  // 7. STREAMS
  const streams = isDaily
    ? (entry.dailyStreams || Math.round(entry.weeklyStreams / 7))
    : entry.weeklyStreams;

  // 8. FIRST ENTRY DATE & RELEASE DATE
  const history = gameState.chartHistory?.[entry.uniqueId];
  const currentDate = gameState.date || { week: 1, year: 2024 };

  // Calculate first entered date
  let firstEntryDateObj: GameDate | undefined = history?.firstEntered;
  if (!firstEntryDateObj) {
    const weeksAgo = Math.max(0, entry.weeksOnChart - 1);
    let fYear = currentDate.year;
    let fWeek = currentDate.week - weeksAgo;
    while (fWeek <= 0) {
      fYear -= 1;
      fWeek += 52;
    }
    firstEntryDateObj = { year: fYear, week: Math.max(1, fWeek), day: 1 };
  }
  const firstEntryDate = formatGameDateToChartDate(firstEntryDateObj, currentDate.year, currentDate.week);

  // Calculate release date
  let releaseDateObj: GameDate | undefined;
  if (playerSong?.releaseDate) {
    releaseDateObj = playerSong.releaseDate;
  } else if (known?.releaseDate) {
    releaseDateObj = known.releaseDate;
  } else {
    // If not known, release date is either first entered or 1 week prior
    let rYear = firstEntryDateObj.year;
    let rWeek = firstEntryDateObj.week - 1;
    if (rWeek <= 0) {
      rYear -= 1;
      rWeek = 52;
    }
    releaseDateObj = { year: rYear, week: rWeek, day: 5 }; // Friday release
  }
  const releaseDate = formatGameDateToChartDate(releaseDateObj, currentDate.year, currentDate.week);

  return {
    title: entry.title,
    artist: entry.artist,
    coverArt: entry.coverArt,
    rank: entry.rank,
    lastRank,
    peak,
    streak,
    streams,
    producers,
    songwriters,
    source,
    releaseDate,
    firstEntryDate
  };
};
