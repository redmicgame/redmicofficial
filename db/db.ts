import Dexie, { type Table } from 'dexie';
import type { GameState } from '../types';
import {
  compressRasterDataUrlIfOversized,
  compressUploadedFileToBlob,
  dataUrlToBlob,
  type ImageCompressionOptions,
} from '../utils/imageUpload';

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
      media: 'id',
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

// In-memory External Media Vault maps so React state only holds tiny ~48-char blob: URLs
// instead of multi-megabyte inline data: strings.
const blobUrlToMediaId = new Map<string, string>();
const mediaIdToBlobUrl = new Map<string, string>();
const mediaIdToDataUrlCache = new Map<string, string>();

const computeMediaId = (dataUrl: string): string => {
  let hash = 0;
  const len = dataUrl.length;
  const step = len > 2000 ? Math.floor(len / 500) : 1;
  for (let i = 0; i < len; i += step) {
    hash = (Math.imul(31, hash) + dataUrl.charCodeAt(i)) | 0;
  }
  return `__media_${hash}_${len}`;
};

const isExtractableDataUrl = (val: string): boolean => {
  if (!val.startsWith('data:')) return false;
  // Keep tiny inline vector icons (<1.5KB SVGs) inline to avoid unnecessary IndexedDB lookups
  if (val.startsWith('data:image/svg+xml') && val.length < 1500) return false;
  return val.length >= 1000 || !val.startsWith('data:image/svg+xml');
};

export const registerMediaInVault = (mediaId: string, dataUrl: string, existingBlob?: Blob | null): string => {
  const existingUrl = mediaIdToBlobUrl.get(mediaId);
  if (existingUrl) {
    return existingUrl;
  }

  const blob = existingBlob || dataUrlToBlob(dataUrl);
  if (!blob) {
    return dataUrl;
  }

  const blobUrl = URL.createObjectURL(blob);
  blobUrlToMediaId.set(blobUrl, mediaId);
  mediaIdToBlobUrl.set(mediaId, blobUrl);
  // Only cache compact data URLs transiently in map if needed for instant save/export; do not bloat heap on huge saves
  if (dataUrl.length <= 350 * 1024 && mediaIdToDataUrlCache.size < 150) {
    mediaIdToDataUrlCache.set(mediaId, dataUrl);
  }
  return blobUrl;
};

export const storeUploadedImageInVault = async (
  file: File,
  options?: ImageCompressionOptions
): Promise<string> => {
  const { blob, dataUrl } = await compressUploadedFileToBlob(file, options);
  const id = computeMediaId(dataUrl);
  await db.media.put({ id, data: dataUrl });
  return registerMediaInVault(id, dataUrl, blob);
};

export const storeDataUrlInVault = async (dataUrl: string): Promise<string> => {
  if (!dataUrl || !isExtractableDataUrl(dataUrl)) return dataUrl;
  const compressed = await compressRasterDataUrlIfOversized(dataUrl);
  const id = computeMediaId(compressed);
  if (!mediaIdToBlobUrl.has(id)) {
    await db.media.put({ id, data: compressed });
  }
  return registerMediaInVault(id, compressed);
};

export const getMediaIdForUrl = (url: string): string | undefined => {
  return blobUrlToMediaId.get(url);
};

// Pure numeric / text keys that NEVER contain user-uploaded image URLs
const NON_MEDIA_KEYS = new Set([
  'chartRun',
  'chartRunEntries',
  'streamsHistory',
  'priceHistory',
  'radioPlays',
  'radioImpressions',
  'dailyStreams',
  'weeklyStreams',
  'firstWeekStreams',
  'spotifyDailyViews',
  'regionalStreams',
  'fanUsers',
  'haterUsers',
  'radioHistory',
  'lyrics',
  'date',
  'releaseDate',
  'firstEntered',
  'peakDate',
]);

export const separateMediaFromState = async (
  state: GameState,
  onProgress?: (progress: number, msg?: string) => void
): Promise<any> => {
  const mediaToSave: MediaSave[] = [];

  if (onProgress) onProgress(0, 'Analyzing state structure...');

  const traverseAndReplace = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        if (obj.startsWith('blob:')) {
          const mappedId = blobUrlToMediaId.get(obj);
          if (mappedId) {
            return mappedId;
          }
          return obj;
        }
        if (isExtractableDataUrl(obj)) {
          const id = computeMediaId(obj);
          if (!mediaIdToBlobUrl.has(id)) {
            mediaToSave.push({ id, data: obj });
          } else if (!mediaIdToDataUrlCache.has(id)) {
            mediaToSave.push({ id, data: obj });
          }
          return id;
        }
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
    if (onProgress) onProgress(50, 'Saving unique media assets...');
    const uniqueMedia = Array.from(new Map(mediaToSave.map((item) => [item.id, item])).values());

    // Skip writing media IDs that already exist in db.media
    const existingKeys = await db.media.bulkGet(uniqueMedia.map((m) => m.id));
    const missingMedia = uniqueMedia.filter((_, idx) => !existingKeys[idx]);

    const chunkSize = 100;
    for (let i = 0; i < missingMedia.length; i += chunkSize) {
      const chunk = missingMedia.slice(i, i + chunkSize);
      await db.media.bulkPut(chunk);
      if (onProgress) {
        onProgress(
          50 + Math.floor((i / Math.max(1, missingMedia.length)) * 50),
          `Saving media chunk ${i} / ${missingMedia.length}...`
        );
      }
      await new Promise((r) => setTimeout(r, 2));
    }
  }

  if (onProgress) onProgress(100, 'Done separating media!');
  return newState;
};

// Runtime hydration: loads media from IndexedDB into lightweight external blob: Object URLs
// so React state never holds large base64 data strings in the JS heap.
// Also compresses oversized legacy raster media records on the fly.
export const hydrateMediaForRuntime = async (
  state: any,
  onProgress?: (progress: number, msg?: string) => void
): Promise<GameState> => {
  const mediaIds = new Set<string>();
  const legacyDataUrls = new Set<string>();

  if (onProgress) onProgress(0, 'Analyzing save file structure...');

  const collectMediaRefs = (obj: any) => {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        if (obj.startsWith('__media_')) {
          mediaIds.add(obj);
        } else if (isExtractableDataUrl(obj)) {
          legacyDataUrls.add(obj);
        }
      }
      return;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0 || typeof obj[0] === 'number' || typeof obj[0] === 'boolean') {
        return;
      }
      for (let i = 0; i < obj.length; i++) {
        collectMediaRefs(obj[i]);
      }
      return;
    }

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (!NON_MEDIA_KEYS.has(key)) {
          collectMediaRefs(obj[key]);
        }
      }
    }
  };

  collectMediaRefs(state);

  if (onProgress) onProgress(15, 'Loading media into external vault...');
  const runtimeUrlMap = new Map<string, string>();
  const idsToFetch: string[] = [];

  for (const id of mediaIds) {
    const cachedBlobUrl = mediaIdToBlobUrl.get(id);
    if (cachedBlobUrl) {
      runtimeUrlMap.set(id, cachedBlobUrl);
    } else {
      idsToFetch.push(id);
    }
  }

  const chunkSize = 80;
  for (let i = 0; i < idsToFetch.length; i += chunkSize) {
    const chunk = idsToFetch.slice(i, i + chunkSize);
    const records = await db.media.bulkGet(chunk);
    const updatedRecords: MediaSave[] = [];

    for (let index = 0; index < chunk.length; index++) {
      const id = chunk[index];
      const rec = records[index];
      if (!rec?.data) continue;

      const compressed = await compressRasterDataUrlIfOversized(rec.data);
      if (compressed !== rec.data) {
        const newId = computeMediaId(compressed);
        updatedRecords.push({ id: newId, data: compressed });
        const blobUrl = registerMediaInVault(newId, compressed);
        runtimeUrlMap.set(id, blobUrl);
      } else {
        const blobUrl = registerMediaInVault(id, rec.data);
        runtimeUrlMap.set(id, blobUrl);
      }
    }

    if (updatedRecords.length > 0) {
      await db.media.bulkPut(updatedRecords);
    }

    if (onProgress) {
      const pct = Math.floor(15 + (i / Math.max(1, idsToFetch.length)) * 35);
      onProgress(pct, `Optimizing assets (${i} / ${idsToFetch.length})...`);
    }
    await new Promise((r) => setTimeout(r, 2));
  }

  // Externalize any legacy inline data: strings left in older save objects
  if (legacyDataUrls.size > 0) {
    const newMediaBatch: MediaSave[] = [];
    for (const rawData of legacyDataUrls) {
      const compressed = await compressRasterDataUrlIfOversized(rawData);
      const id = computeMediaId(compressed);
      if (!mediaIdToBlobUrl.has(id)) {
        newMediaBatch.push({ id, data: compressed });
      }
      const blobUrl = registerMediaInVault(id, compressed);
      runtimeUrlMap.set(rawData, blobUrl);
    }
    if (newMediaBatch.length > 0) {
      await db.media.bulkPut(newMediaBatch);
    }
  }

  if (onProgress) onProgress(55, 'Constructing game state...');

  const traverseAndAttachUrls = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        if (obj.startsWith('__media_') || isExtractableDataUrl(obj)) {
          return runtimeUrlMap.get(obj) || obj;
        }
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
        const res = traverseAndAttachUrls(item);
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
          const res = traverseAndAttachUrls(val);
          newObj[key] = res;
          if (res !== val) changed = true;
        }
      }
    }
    return changed ? newObj : obj;
  };

  const finalState = traverseAndAttachUrls(state);
  if (onProgress) onProgress(100, 'Ready!');
  await new Promise((r) => setTimeout(r, 20));
  return finalState as GameState;
};

// Full data-URL injection (used for portable JSON save exports & external inspection)
export const injectMediaIntoState = async (
  state: any,
  onProgress?: (progress: number, msg?: string) => void
): Promise<GameState> => {
  const mediaIds = new Set<string>();

  if (onProgress) onProgress(0, 'Analyzing save file structure...');

  const collectMediaIds = (obj: any) => {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        if (obj.startsWith('__media_')) {
          mediaIds.add(obj);
        } else if (obj.startsWith('blob:')) {
          const mappedId = blobUrlToMediaId.get(obj);
          if (mappedId) mediaIds.add(mappedId);
        }
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

  if (onProgress) onProgress(15, 'Retrieving assets from local database...');
  const mediaIdArray = Array.from(mediaIds);
  const mediaMap = new Map<string, string>();

  const chunkSize = 100;
  for (let i = 0; i < mediaIdArray.length; i += chunkSize) {
    const chunk = mediaIdArray.slice(i, i + chunkSize);
    const records = await db.media.bulkGet(chunk);
    chunk.forEach((id, index) => {
      if (records[index]) {
        mediaMap.set(id, records[index]!.data);
      } else if (mediaIdToDataUrlCache.has(id)) {
        mediaMap.set(id, mediaIdToDataUrlCache.get(id)!);
      }
    });
    if (onProgress) {
      const pct = Math.floor(15 + (i / Math.max(1, mediaIdArray.length)) * 35);
      onProgress(pct, `Loading assets (${i} / ${mediaIdArray.length})...`);
    }
    await new Promise((r) => setTimeout(r, 2));
  }

  if (onProgress) onProgress(50, 'Constructing game state...');

  const traverseAndInject = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        if (obj.startsWith('__media_')) {
          return mediaMap.get(obj) || obj;
        }
        if (obj.startsWith('blob:')) {
          const mappedId = blobUrlToMediaId.get(obj);
          if (mappedId && mediaMap.has(mappedId)) {
            return mediaMap.get(mappedId)!;
          }
        }
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
  if (onProgress) onProgress(100, 'Ready!');
  await new Promise((r) => setTimeout(r, 30));
  return finalState as GameState;
};

// Cross-slot garbage collection: removes unreferenced media rows in IndexedDB
export const garbageCollectOrphanedMedia = async (): Promise<number> => {
  try {
    const allSaves = await db.saves.toArray();
    const referencedIds = new Set<string>();

    const collectReferenced = (obj: any) => {
      if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string') {
          if (obj.startsWith('__media_')) {
            referencedIds.add(obj);
          } else if (obj.startsWith('blob:')) {
            const mapped = blobUrlToMediaId.get(obj);
            if (mapped) referencedIds.add(mapped);
          }
        }
        return;
      }
      if (Array.isArray(obj)) {
        if (obj.length === 0 || typeof obj[0] === 'number' || typeof obj[0] === 'boolean') return;
        for (let i = 0; i < obj.length; i++) collectReferenced(obj[i]);
        return;
      }
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && !NON_MEDIA_KEYS.has(key)) {
          collectReferenced(obj[key]);
        }
      }
    };

    for (const save of allSaves) {
      if (save?.state) {
        collectReferenced(save.state);
      }
    }

    const allMediaKeys = await db.media.toCollection().primaryKeys();
    const orphaned = allMediaKeys.filter((id) => !referencedIds.has(id));

    if (orphaned.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < orphaned.length; i += chunkSize) {
        await db.media.bulkDelete(orphaned.slice(i, i + chunkSize));
      }
    }
    return orphaned.length;
  } catch (err) {
    console.warn('Orphan media GC skipped:', err);
    return 0;
  }
};
