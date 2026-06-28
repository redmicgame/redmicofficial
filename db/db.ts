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

// Traverse and separate base64 data URIs into the media table
export const separateMediaFromState = async (state: GameState): Promise<any> => {
  const mediaToSave: MediaSave[] = [];

  const traverseAndReplace = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string' && obj.startsWith('data:')) {
        // Hash it or just random UUID. A simple hash prevents duplicates.
        let hash = 0;
        for (let i = 0; i < obj.length; i++) {
          hash = (Math.imul(31, hash) + obj.charCodeAt(i)) | 0;
        }
        const id = `__media_${hash}_${obj.length}`;
        mediaToSave.push({ id, data: obj });
        return id;
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(traverseAndReplace);
    }

    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = traverseAndReplace(obj[key]);
      }
    }
    return newObj;
  };

  const newState = traverseAndReplace(state);

  // Bulk put all discovered media
  if (mediaToSave.length > 0) {
    // deduplicate media to save
    const uniqueMedia = Array.from(new Map(mediaToSave.map(item => [item.id, item])).values());
    await db.media.bulkPut(uniqueMedia);
  }

  return newState;
};

// Re-inject media from the media table into the state
export const injectMediaIntoState = async (state: any): Promise<GameState> => {
  // Collect all media IDs needed
  const mediaIds = new Set<string>();
  
  const collectMediaIds = (obj: any) => {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string' && obj.startsWith('__media_')) {
        mediaIds.add(obj);
      }
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach(collectMediaIds);
      return;
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        collectMediaIds(obj[key]);
      }
    }
  };

  collectMediaIds(state);

  // Fetch all needed media
  const mediaRecords = await db.media.bulkGet(Array.from(mediaIds));
  const mediaMap = new Map<string, string>();
  Array.from(mediaIds).forEach((id, index) => {
    if (mediaRecords[index]) {
      mediaMap.set(id, mediaRecords[index]!.data);
    }
  });

  // Replace IDs with actual base64
  const traverseAndInject = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string' && obj.startsWith('__media_')) {
        return mediaMap.get(obj) || obj; // Fallback to ID if not found
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(traverseAndInject);
    }
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = traverseAndInject(obj[key]);
      }
    }
    return newObj;
  };

  return traverseAndInject(state) as GameState;
};