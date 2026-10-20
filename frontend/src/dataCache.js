// Tiny IndexedDB cache (no library). IndexedDB can hold hundreds of MB, unlike
// localStorage (~5 MB), so it can keep 1,500+ parts and their images between visits.
const DB_NAME = 'autospares-cache-v2';
const META = 'meta';
const IMAGES = 'images';

let dbPromise = null;

const openDb = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
      if (!db.objectStoreNames.contains(IMAGES)) db.createObjectStore(IMAGES);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  dbPromise.catch(() => {});
  return dbPromise;
};

const promisify = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export async function getCachedBundle() {
  try {
    const db = await openDb();
    return (await promisify(db.transaction(META).objectStore(META).get('bundle'))) || null;
  } catch (error) {
    return null;
  }
}

export async function saveCachedBundle(bundle) {
  try {
    const db = await openDb();
    db.transaction(META, 'readwrite').objectStore(META).put(bundle, 'bundle');
  } catch (error) {
    console.warn('Unable to cache data:', error.message);
  }
}

// Returns { [id]: imageUrl } for the ids that are cached.
export async function getCachedImages(ids) {
  const found = {};
  try {
    const db = await openDb();
    const store = db.transaction(IMAGES).objectStore(IMAGES);
    await Promise.all(
      ids.map(async (id) => {
        const value = await promisify(store.get(id));
        if (value !== undefined) found[id] = value;
      })
    );
  } catch (error) {
    // cache unavailable - fall back to the network
  }
  return found;
}

export async function saveCachedImages(map) {
  try {
    const db = await openDb();
    const store = db.transaction(IMAGES, 'readwrite').objectStore(IMAGES);
    Object.entries(map).forEach(([id, url]) => store.put(url, Number.isNaN(Number(id)) ? id : Number(id)));
  } catch (error) {
    console.warn('Unable to cache images:', error.message);
  }
}

export async function removeCachedImage(id) {
  try {
    const db = await openDb();
    db.transaction(IMAGES, 'readwrite').objectStore(IMAGES).delete(id);
  } catch (error) {
    // ignore
  }
}