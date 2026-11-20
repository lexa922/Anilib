const DB_NAME = 'anilib_catalog_cache_db';
const DB_VERSION = 2;
const ITEMS_STORE = 'items';
const META_STORE = 'meta';
const META_KEY = 'kitsu_full_catalog_v3';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function openCacheDb() {
    return new Promise((resolve) => {
        if (typeof indexedDB === 'undefined') {
            resolve(null);
            return;
        }

        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (db.objectStoreNames.contains('snapshots')) {
                    db.deleteObjectStore('snapshots');
                }
                if (!db.objectStoreNames.contains(ITEMS_STORE)) {
                    db.createObjectStore(ITEMS_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(META_STORE)) {
                    db.createObjectStore(META_STORE);
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
            request.onblocked = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
}

export async function readCatalogCache(expectedStrategy = 'kitsu') {
    const db = await openCacheDb();
    if (!db) return null;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction([META_STORE, ITEMS_STORE], 'readonly');
            const metaReq = tx.objectStore(META_STORE).get(META_KEY);
            const itemsReq = tx.objectStore(ITEMS_STORE).getAll();

            let metaRecord = null;
            let items = null;

            metaReq.onsuccess = () => {
                metaRecord = metaReq.result;
            };
            itemsReq.onsuccess = () => {
                items = itemsReq.result;
            };

            tx.oncomplete = () => {
                db.close();
                if (!metaRecord || !Array.isArray(items) || items.length === 0) {
                    resolve(null);
                    return;
                }
                if (metaRecord.strategy && metaRecord.strategy !== expectedStrategy) {
                    clearCatalogCache().finally(() => resolve(null));
                    return;
                }
                if (Date.now() - (metaRecord.timestamp || 0) > CACHE_TTL_MS) {
                    resolve(null);
                    return;
                }
                resolve({
                    strategy: metaRecord.strategy || expectedStrategy,
                    items,
                    totalCount: Number(metaRecord.totalCount) || 0,
                    nextOffset: Number(metaRecord.nextOffset) || 0,
                    isComplete: Boolean(metaRecord.isComplete),
                    timestamp: metaRecord.timestamp
                });
            };

            tx.onerror = () => {
                db.close();
                resolve(null);
            };
            tx.onabort = () => {
                db.close();
                resolve(null);
            };
        } catch {
            db.close();
            resolve(null);
        }
    });
}

export async function appendCatalogItems(batchItems = [], meta = {}) {
    const db = await openCacheDb();
    if (!db) return;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction([ITEMS_STORE, META_STORE], 'readwrite');
            const itemsStore = tx.objectStore(ITEMS_STORE);
            const metaStore = tx.objectStore(META_STORE);

            if (Array.isArray(batchItems)) {
                for (const item of batchItems) {
                    if (item && item.id) {
                        itemsStore.put(item);
                    }
                }
            }

            metaStore.put(
                {
                    strategy: meta.strategy || 'kitsu',
                    totalCount: Number(meta.totalCount) || 0,
                    nextOffset: Number(meta.nextOffset) || 0,
                    isComplete: Boolean(meta.isComplete),
                    timestamp: Date.now()
                },
                META_KEY
            );

            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                db.close();
                resolve();
            };
            tx.onabort = () => {
                db.close();
                resolve();
            };
        } catch {
            db.close();
            resolve();
        }
    });
}

export async function clearCatalogCache() {
    const db = await openCacheDb();
    if (!db) return;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction([ITEMS_STORE, META_STORE], 'readwrite');
            tx.objectStore(ITEMS_STORE).clear();
            tx.objectStore(META_STORE).delete(META_KEY);

            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                db.close();
                resolve();
            };
            tx.onabort = () => {
                db.close();
                resolve();
            };
        } catch {
            db.close();
            resolve();
        }
    });
}
