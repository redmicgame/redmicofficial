export interface SongAudioEntry {
    type: 'file' | 'spotify';
    url: string;
    name: string;
    spotifyTrackId?: string;
    spotifyUrl?: string;
    blob?: Blob;
}

const UNIFIED_DB_NAME = 'ChartRaceAudioDB';
const STORE_NAME = 'songAudio';

// Legacy DB names to migrate from
const LEGACY_HOT100_DB = 'Hot100AudioDB';
const LEGACY_UK_DB = 'UkSinglesAudioDB';

function openSpecificDB(dbName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName, 2);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(STORE_NAME)) {
                req.result.createObjectStore(STORE_NAME, { keyPath: 'songId' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function openAudioDB(): Promise<IDBDatabase> {
    return openSpecificDB(UNIFIED_DB_NAME);
}

export async function saveAudioToDB(songId: string, entry: SongAudioEntry): Promise<void> {
    try {
        const db = await openAudioDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({
            songId,
            type: entry.type,
            name: entry.name,
            url: entry.url,
            spotifyTrackId: entry.spotifyTrackId,
            spotifyUrl: entry.spotifyUrl,
            blob: entry.blob,
        });

        // Also write to legacy DBs for backwards safety
        try {
            const h100Db = await openSpecificDB(LEGACY_HOT100_DB);
            const hTx = h100Db.transaction(STORE_NAME, 'readwrite');
            hTx.objectStore(STORE_NAME).put({
                songId,
                type: entry.type,
                name: entry.name,
                url: entry.url,
                spotifyTrackId: entry.spotifyTrackId,
                spotifyUrl: entry.spotifyUrl,
                blob: entry.blob,
            });
        } catch {
            // ignore legacy write failure
        }

        try {
            const ukDb = await openSpecificDB(LEGACY_UK_DB);
            const ukTx = ukDb.transaction(STORE_NAME, 'readwrite');
            ukTx.objectStore(STORE_NAME).put({
                songId,
                type: entry.type,
                name: entry.name,
                url: entry.url,
                spotifyTrackId: entry.spotifyTrackId,
                spotifyUrl: entry.spotifyUrl,
                blob: entry.blob,
            });
        } catch {
            // ignore legacy write failure
        }
    } catch (e) {
        console.error('Failed to save audio to unified DB', e);
    }
}

async function readAllFromDB(dbName: string): Promise<any[]> {
    try {
        const db = await openSpecificDB(dbName);
        return new Promise((resolve) => {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                resolve([]);
                return;
            }
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
        });
    } catch {
        return [];
    }
}

export async function loadAllAudioFromDB(): Promise<Record<string, SongAudioEntry>> {
    try {
        const results: Record<string, SongAudioEntry> = {};

        // 1. Check legacy DBs first to migrate any older saved songs
        const legacyH100 = await readAllFromDB(LEGACY_HOT100_DB);
        const legacyUk = await readAllFromDB(LEGACY_UK_DB);
        const unified = await readAllFromDB(UNIFIED_DB_NAME);

        const allItems = [...legacyH100, ...legacyUk, ...unified];

        allItems.forEach((item: any) => {
            if (!item || !item.songId) return;
            if (item.type === 'spotify') {
                results[item.songId] = {
                    type: 'spotify',
                    url: item.url,
                    name: item.name || 'Spotify Track',
                    spotifyTrackId: item.spotifyTrackId,
                    spotifyUrl: item.spotifyUrl,
                };
            } else if (item.blob) {
                results[item.songId] = {
                    type: 'file',
                    url: URL.createObjectURL(item.blob),
                    name: item.name || 'uploaded.mp3',
                    blob: item.blob,
                };
            } else if (item.url) {
                results[item.songId] = {
                    type: 'file',
                    url: item.url,
                    name: item.name || 'Audio Track',
                };
            }
        });

        // Ensure all combined items are persisted in the unified DB
        try {
            const db = await openAudioDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            allItems.forEach((item: any) => {
                if (item && item.songId) {
                    store.put(item);
                }
            });
        } catch (syncErr) {
            console.log('Unified audio sync note:', syncErr);
        }

        return results;
    } catch (e) {
        return {};
    }
}

export async function deleteAudioFromDB(songId: string): Promise<void> {
    try {
        const db = await openAudioDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(songId);

        try {
            const h100 = await openSpecificDB(LEGACY_HOT100_DB);
            h100.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(songId);
        } catch {}

        try {
            const uk = await openSpecificDB(LEGACY_UK_DB);
            uk.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(songId);
        } catch {}
    } catch (e) {
        console.error('Failed to delete audio from unified DB', e);
    }
}
