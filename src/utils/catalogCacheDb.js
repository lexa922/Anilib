const DB_NAME = 'anilib_catalog_cache_db';
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';
const CACHE_KEY = 'kitsu_full_catalog_v3';
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
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                resolve(null);
            };

            request.onblocked = () => {
                resolve(null);
            };
        } catch {
            resolve(null);
        }
    });
}

export async function readCatalogCache() {
    const db = await openCacheDb();
    if (!db) return null;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(CACHE_KEY);

            request.onsuccess = () => {
                const record = request.result;
                db.close();

                if (!record || !Array.isArray(record.items)) {
                    resolve(null);
                    return;
                }

                if (Date.now() - (record.timestamp || 0) > CACHE_TTL_MS) {
                    resolve(null);
                    return;
                }

                resolve(record);
            };

            request.onerror = () => {
                db.close();
                resolve(null);
            };
        } catch {
            db.close();
            resolve(null);
        }
    });
}

export async function writeCatalogCache(payload) {
    const db = await openCacheDb();
    if (!db) return;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(
                {
                    items: Array.isArray(payload?.items) ? payload.items : [],
                    totalCount: Number(payload?.totalCount) || 0,
                    nextOffset: Number(payload?.nextOffset) || 0,
                    isComplete: Boolean(payload?.isComplete),
                    timestamp: Date.now()
                },
                CACHE_KEY
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
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(CACHE_KEY);

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
