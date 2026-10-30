const DB_NAME = 'StudentTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'cacheStore';

const LEGACY_KEYS = [
    'cachedAdvisers',
    'cachedAdvisersTimestamp',
    'cachedStudents',
    'cachedStudentsTimestamp',
    'cachedOrganizations',
    'cachedOrganizationsTimestamp',
    'cachedEvents',
    'cachedEventsTimestamp',
    'cachedRoles',
    'cachedRolesTimestamp',
    'cachedEventRegistrations',
    'cachedEventRegistrationsTimestamp',
    'cachedOrgMemberships',
    'cachedOrgMembershipsTimestamp'
];

let dbPromise = null;

function getDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.indexedDB) {
                console.warn('[CacheService] IndexedDB not supported in this environment');
                resolve(null);
                return;
            }

            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                console.error('[CacheService] IndexedDB open error:', event.target.error);
                resolve(null);
            };
        });
    }
    return dbPromise;
}

export class CacheService {
    static async get(key) {
        try {
            const db = await getDB();
            if (!db) {
                const fallback = window[`__mem_${key}`];
                return fallback !== undefined ? fallback : null;
            }

            return new Promise((resolve) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onsuccess = () => {
                    if (request.result && request.result.value !== undefined) {
                        resolve(request.result.value);
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = (e) => {
                    console.error(`[CacheService] Error getting key "${key}":`, e);
                    resolve(null);
                };
            });
        } catch (err) {
            console.error(`[CacheService] Exception reading key "${key}":`, err);
            return null;
        }
    }

    static async getWithMeta(key) {
        try {
            const db = await getDB();
            if (!db) return null;

            return new Promise((resolve) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onsuccess = () => {
                    if (request.result) {
                        resolve({
                            value: request.result.value,
                            timestamp: request.result.timestamp || 0,
                            updatedAt: request.result.updatedAt || ''
                        });
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = () => resolve(null);
            });
        } catch (err) {
            return null;
        }
    }

    static async getTimestamp(key) {
        const meta = await this.getWithMeta(key);
        return meta ? meta.timestamp : 0;
    }

    static async set(key, value) {
        try {
            const db = await getDB();
            if (!db) {
                window[`__mem_${key}`] = value;
                return true;
            }

            return new Promise((resolve) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const record = {
                    key: key,
                    value: value,
                    timestamp: Date.now(),
                    updatedAt: new Date().toISOString()
                };

                const request = store.put(record);

                request.onsuccess = () => resolve(true);
                request.onerror = (e) => {
                    console.error(`[CacheService] Error setting key "${key}":`, e);
                    resolve(false);
                };
            });
        } catch (err) {
            console.error(`[CacheService] Exception writing key "${key}":`, err);
            return false;
        }
    }

    static async remove(key) {
        try {
            const db = await getDB();
            if (!db) {
                delete window[`__mem_${key}`];
                return true;
            }

            return new Promise((resolve) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(key);

                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            });
        } catch (err) {
            return false;
        }
    }

    static async clear() {
        this.cleanLegacyLocalStorage();

        try {
            const db = await getDB();
            if (!db) return true;

            return new Promise((resolve) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.clear();

                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            });
        } catch (err) {
            console.error('[CacheService] Error clearing cache:', err);
            return false;
        }
    }

    static cleanLegacyLocalStorage() {
        if (typeof window === 'undefined' || !window.localStorage) return;

        LEGACY_KEYS.forEach((k) => {
            try {
                localStorage.removeItem(k);
            } catch (e) {
            }
        });
    }

    static async migrateFromLocalStorage() {
        if (typeof window === 'undefined' || !window.localStorage) return;

        const dataKeys = [
            'cachedAdvisers',
            'cachedStudents',
            'cachedOrganizations',
            'cachedEvents',
            'cachedRoles',
            'cachedEventRegistrations',
            'cachedOrgMemberships'
        ];

        for (const key of dataKeys) {
            try {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed) {
                        await this.set(key, parsed);
                    }
                }
            } catch (e) {
            }
        }

        this.cleanLegacyLocalStorage();
    }
}

if (typeof window !== 'undefined') {
    CacheService.migrateFromLocalStorage();
}

export default CacheService;

