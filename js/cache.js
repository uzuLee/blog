// ============================================
// Cache - IndexedDB with SHA-based invalidation
// ============================================

const DB_NAME = 'wiki-blog-cache';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

let db = null;

/**
 * Initialize IndexedDB
 */
export async function initCache() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'path' });
                store.createIndex('sha', 'sha', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

/**
 * Get cached document
 * Returns null if not found or SHA mismatch
 */
export async function getCached(path, expectedSha = null) {
    if (!db) await initCache();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(path);

        request.onsuccess = () => {
            const result = request.result;

            // No cache entry
            if (!result) {
                resolve(null);
                return;
            }

            // SHA mismatch - cache invalid
            if (expectedSha && result.sha !== expectedSha) {
                console.log(`Cache invalid for ${path}: SHA mismatch`);
                resolve(null);
                return;
            }

            // Valid cache
            resolve(result.content);
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Store document in cache with SHA
 */
export async function setCached(path, content, sha = null) {
    if (!db) await initCache();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const entry = {
            path,
            content,
            sha,
            timestamp: Date.now()
        };

        const request = store.put(entry);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Clear all cache
 */
export async function clearCache() {
    if (!db) await initCache();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            console.log('Cache cleared');
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
    if (!db) await initCache();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const entries = request.result;
            const totalSize = entries.reduce((sum, e) => sum + (e.content?.length || 0), 0);

            resolve({
                count: entries.length,
                size: totalSize,
                sizeKB: (totalSize / 1024).toFixed(2),
                sizeMB: (totalSize / 1024 / 1024).toFixed(2)
            });
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Remove old cache entries (older than N days)
 */
export async function pruneCache(daysOld = 30) {
    if (!db) await initCache();

    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(cutoff);

        let deleted = 0;
        const request = index.openCursor(range);

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                deleted++;
                cursor.continue();
            } else {
                console.log(`Pruned ${deleted} old cache entries`);
                resolve(deleted);
            }
        };

        request.onerror = () => reject(request.error);
    });
}
