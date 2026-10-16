const DB_NAME = 'poruch-voice';
const STORE = 'clips';
export const MAX_CLIPS = 40;

const open = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
const run = async (mode, action) => {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const result = action(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(result?.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
};

export async function listClips() {
  const clips = await run('readonly', (store) => store.getAll());
  return (clips || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Recordings stay in this browser only; the oldest go first when the limit is reached.
export async function saveClip(clip) {
  await run('readwrite', (store) => store.put(clip));
  const clips = await listClips();
  await Promise.all(clips.slice(MAX_CLIPS).map((old) => deleteClip(old.id)));
}

export const deleteClip = (id) => run('readwrite', (store) => store.delete(id));
