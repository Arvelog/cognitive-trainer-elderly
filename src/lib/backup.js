// One file with everything the family has built up on this device: settings, photos, diary,
// words on review, scripts, plan, the caregiver's recorded voice and the patient's recordings.
export const BACKUP_FORMAT = 'poruch-backup';
export const BACKUP_VERSION = 1;
const KEY_PATTERN = /^poruch_[a-z0-9_]+$/;
const MAX_BYTES = 60 * 1024 * 1024;

export const backupKeys = (storage) => Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter((key) => KEY_PATTERN.test(key || '')).sort();

export function buildBackup(storage, audio = {}, now = new Date()) {
  const items = Object.fromEntries(backupKeys(storage).map((key) => [key, storage.getItem(key)]));
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), items, audio };
}

const validClip = (clip) => clip && typeof clip.id === 'string' && typeof clip.data === 'string' && /^data:audio\/[\w.+-]+(;[\w=.+-]+)*;base64,/.test(clip.data);

export function parseBackup(text) {
  if (typeof text !== 'string' || text.length > MAX_BYTES) throw new Error('size');
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('format'); }
  if (data?.format !== BACKUP_FORMAT || typeof data.items !== 'object' || !data.items) throw new Error('format');
  if (data.version > BACKUP_VERSION) throw new Error('version');
  const items = Object.fromEntries(Object.entries(data.items).filter(([key, value]) => KEY_PATTERN.test(key) && typeof value === 'string'));
  const audio = Object.fromEntries(['clips', 'prompts'].map((store) => [store, Array.isArray(data.audio?.[store]) ? data.audio[store].filter(validClip) : []]));
  return { exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : null, items, audio };
}

// Replaces this device's data with the backup; keys missing from the backup are removed, so nothing old mixes in.
export function restoreItems(storage, items) {
  backupKeys(storage).forEach((key) => { if (!(key in items)) storage.removeItem(key); });
  Object.entries(items).forEach(([key, value]) => storage.setItem(key, value));
}

export const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

export async function dataUrlToBlob(url) {
  const [head, body] = url.split(',');
  const type = head.slice(5).split(';')[0];
  const bytes = Uint8Array.from(atob(body), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type });
}

export const backupFileName = (now = new Date()) => `poruch-${now.toISOString().slice(0, 10)}.json`;
