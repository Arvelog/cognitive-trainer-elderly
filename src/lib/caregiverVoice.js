import { deleteItem, listStore, MAX_PROMPTS, putItem } from './voiceStore.js';

// A word recorded by the caregiver plays instead of the browser's synthetic voice,
// which on many devices has no Ukrainian voice at all.
export const promptKey = (text) => String(text || '').toLocaleLowerCase('uk-UA').replace(/[«»"“”…!?.,:;]+/g, ' ').replace(/\s+/g, ' ').trim();

const prompts = new Map();
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());
export const onPromptsChange = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };

export async function loadPrompts() {
  if (typeof indexedDB === 'undefined') return [];
  const items = await listStore('prompts').catch(() => []);
  prompts.clear();
  items.forEach((item) => prompts.set(item.id, item));
  notify();
  return items;
}
export const listPrompts = () => [...prompts.values()].sort((a, b) => a.text.localeCompare(b.text, 'uk'));
export const promptFor = (text) => prompts.get(promptKey(text)) || null;

export async function savePrompt(text, blob, durationMs) {
  const id = promptKey(text);
  if (!id) return false;
  if (!prompts.has(id) && prompts.size >= MAX_PROMPTS) throw new Error('full');
  const item = { id, text: String(text).trim().slice(0, 80), blob, durationMs, createdAt: new Date().toISOString() };
  await putItem('prompts', item);
  prompts.set(id, item);
  notify();
  return true;
}
export async function removePrompt(id) {
  await deleteItem('prompts', id);
  prompts.delete(id);
  notify();
}

let current = null;
export function playPrompt(text, { onEnd, onError } = {}) {
  const item = promptFor(text);
  if (!item) return false;
  current?.pause();
  const url = URL.createObjectURL(item.blob);
  const audio = new Audio(url);
  current = audio;
  const done = (callback) => () => { URL.revokeObjectURL(url); if (current === audio) current = null; callback?.(); };
  audio.onended = done(onEnd);
  audio.onerror = done(onError);
  audio.play().catch(done(onError));
  return true;
}
export const stopPrompt = () => { current?.pause(); current = null; };
