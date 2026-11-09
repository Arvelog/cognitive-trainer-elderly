const DB_NAME = 'poruch-voice';
// clips: the patient's own answers; prompts: words and phrases recorded by the caregiver.
const STORES = ['clips', 'prompts'];
export const MAX_CLIPS = 40;
export const MAX_PROMPTS = 80;

const open = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 2);
  request.onupgradeneeded = () => STORES.forEach((name) => { if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'id' }); });
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
const run = async (store, mode, action) => {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const result = action(tx.objectStore(store));
    tx.oncomplete = () => { db.close(); resolve(result?.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
};

export async function listStore(store) {
  const items = await run(store, 'readonly', (os) => os.getAll());
  return (items || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export const putItem = (store, item) => run(store, 'readwrite', (os) => os.put(item));
export const deleteItem = (store, id) => run(store, 'readwrite', (os) => os.delete(id));
export async function replaceStore(store, items) {
  await run(store, 'readwrite', (os) => os.clear());
  for (const item of items) await putItem(store, item);
}

export const listClips = () => listStore('clips');
// Recordings stay in this browser only; the oldest go first when the limit is reached.
export async function saveClip(clip) {
  await putItem('clips', clip);
  const clips = await listClips();
  await Promise.all(clips.slice(MAX_CLIPS).map((old) => deleteClip(old.id)));
}
export const deleteClip = (id) => deleteItem('clips', id);
