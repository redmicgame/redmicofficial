import Dexie, { type Table } from 'dexie';
import type { GameState } from '../types';

export interface GameSave {
  id?: number;
  state: any; // Stored state with media separated
}

export interface MediaSave {
  id: string;
  data: string;
}

class RedMicDexie extends Dexie {
  saves!: Table<GameSave, number>; 
  media!: Table<MediaSave, string>;

  constructor() {
    super('red-mic-game');
    this.version(2).stores({
      saves: '++id', 
      media: 'id'
    });
  }
}

export const db = new RedMicDexie();

export const getActiveSaveId = (): number => {
    const stored = localStorage.getItem('redmic_active_save_id');
    return stored ? parseInt(stored, 10) : 1;
};

export const setActiveSaveId = (id: number): void => {
    localStorage.setItem('redmic_active_save_id', id.toString());
};

const NON_MEDIA_KEYS = new Set([
  'chartHistory',
  'albumChartHistory',
  'videoChartHistory',
  'hotPopSongsHistory',
  'hotRapRnbHistory',
  'electronicChartHistory',
  'countryChartHistory',
  'ukSinglesChartHistory',
  'ukAlbumsChartHistory',
  'chartRun',
  'chartRunEntries',
  'streamsHistory',
  'priceHistory',
  'radioPlays',
  'radioImpressions',
  'dailyStreams',
  'weeklyStreams',
  'firstWeekStreams',
  'billboardHot100',
  'billboard200',
  'billboardBubblingUnder25',
  'billboardHot100WeeklyArchive',
  'ukSinglesChartWeeklyArchive',
  'radioOverallChart',
  'radioFormatCharts',
  'radioUrbanChart',
  'radioPopChart',
  'radioChrChart',
  'radioAcChart',
  'radioHotAcChart',
  'radioCountryChart',
  'radioClassicHitsChart',
  'radioClassicRockChart',
  'radioActiveRockChart',
  'radioAltRockChart',
  'radioAaaChart',
  'radioUrbanAcChart',
  'radioRhythmicChart',
  'radioAdultHitsChart',
  'radioLatinChart',
  'radioChristmasChart',
  'hotPopSongs',
  'hotRapRnb',
  'electronicChart',
  'countryChart',
  'spotifyGlobal',
  'spotifyUS',
  'spotifyCanada',
  'spotifyUK',
  'spotifyLatin',
  'spotifyAsia',
  'spotifyAfrica',
  'ukSinglesChart',
  'ukAlbumsChart',
  'activeSuperstarHits',
  'fanUsers',
  'haterUsers',
  'radioHistory',
]);

export const separateMediaFromState = async (state: GameState, onProgress?: (progress: number, msg?: string) => void): Promise<any> => {
  const mediaToSave: MediaSave[] = [];
  
  if (onProgress) onProgress(0, "Analyzing state structure...");
  
  // Reference-preserving traversal to avoid memory churn and clone explosions
  const traverseAndReplace = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string' && obj.startsWith('data:')) {
        let hash = 0;
        for (let i = 0; i < obj.length && i < 1000; i++) {
          hash = (Math.imul(31, hash) + obj.charCodeAt(i)) | 0;
        }
        const id = `__media_${hash}_${obj.length}`;
        mediaToSave.push({ id, data: obj });
        return id;
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0 || typeof obj[0] === 'number' || typeof obj[0] === 'boolean') {
        return obj;
      }
      let changed = false;
      const arr = new Array(obj.length);
      for (let i = 0; i < obj.length; i++) {
        const item = obj[i];
        const res = traverseAndReplace(item);
        arr[i] = res;
        if (res !== item) changed = true;
      }
      return changed ? arr : obj;
    }

    let changed = false;
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (NON_MEDIA_KEYS.has(key)) {
          newObj[key] = obj[key];
        } else {
          const val = obj[key];
          const res = traverseAndReplace(val);
          newObj[key] = res;
          if (res !== val) changed = true;
        }
      }
    }
    return changed ? newObj : obj;
  };
  
  const newState = traverseAndReplace(state);

  if (mediaToSave.length > 0) {
    if (onProgress) onProgress(50, "Saving unique media assets...");
    const uniqueMedia = Array.from(new Map(mediaToSave.map(item => [item.id, item])).values());
    
    const chunkSize = 100;
    for (let i = 0; i < uniqueMedia.length; i += chunkSize) {
        const chunk = uniqueMedia.slice(i, i + chunkSize);
        await db.media.bulkPut(chunk);
        if (onProgress) onProgress(50 + Math.floor((i / uniqueMedia.length) * 50), `Saving media chunk ${i} / ${uniqueMedia.length}...`);
        await new Promise(r => setTimeout(r, 2));
    }
  }
  
  if (onProgress) onProgress(100, "Done separating media!");
  return newState;
};

export const injectMediaIntoState = async (state: any, onProgress?: (progress: number, msg?: string) => void): Promise<GameState> => {
  const mediaIds = new Set<string>();
  
  if (onProgress) onProgress(0, "Analyzing save file structure...");
  
  // Fast targeted collection
  const collectMediaIds = (obj: any) => {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string' && obj.startsWith('__media_')) {
        mediaIds.add(obj);
      }
      return;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0 || typeof obj[0] === 'number' || typeof obj[0] === 'boolean') {
        return;
      }
      for (let i = 0; i < obj.length; i++) {
        collectMediaIds(obj[i]);
      }
      return;
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (!NON_MEDIA_KEYS.has(key)) {
          collectMediaIds(obj[key]);
        }
      }
    }
  };
  
  collectMediaIds(state);

  if (onProgress) onProgress(15, "Retrieving assets from local database...");
  const mediaIdArray = Array.from(mediaIds);
  const mediaMap = new Map<string, string>();
  
  const chunkSize = 100;
  for (let i = 0; i < mediaIdArray.length; i += chunkSize) {
      const chunk = mediaIdArray.slice(i, i + chunkSize);
      const records = await db.media.bulkGet(chunk);
      chunk.forEach((id, index) => {
          if (records[index]) {
              mediaMap.set(id, records[index]!.data);
          }
      });
      if (onProgress) {
          const pct = Math.floor(15 + ((i / mediaIdArray.length) * 35));
          onProgress(pct, `Loading assets (${i} / ${mediaIdArray.length})...`);
      }
      await new Promise(r => setTimeout(r, 2)); 
  }

  if (onProgress) onProgress(50, "Constructing game state...");
  
  // Reference-preserving injection
  const traverseAndInject = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string' && obj.startsWith('__media_')) {
        return mediaMap.get(obj) || obj; 
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0 || typeof obj[0] === 'number' || typeof obj[0] === 'boolean') {
        return obj;
      }
      let changed = false;
      const newArr = new Array(obj.length);
      for (let i = 0; i < obj.length; i++) {
        const item = obj[i];
        const res = traverseAndInject(item);
        newArr[i] = res;
        if (res !== item) changed = true;
      }
      return changed ? newArr : obj;
    }

    let changed = false;
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (NON_MEDIA_KEYS.has(key)) {
          newObj[key] = obj[key];
        } else {
          const val = obj[key];
          const res = traverseAndInject(val);
          newObj[key] = res;
          if (res !== val) changed = true;
        }
      }
    }
    return changed ? newObj : obj;
  };
  
  const finalState = traverseAndInject(state);
  if (onProgress) onProgress(100, "Ready!");
  
  await new Promise(r => setTimeout(r, 50));
  
  return finalState as GameState;
};
