import { resultMode } from './practiceResults.js';

export const REVIEW_KEY = 'poruch_word_review_v1';
// Days until a word that needed help comes back; each independent answer moves it one step further.
export const REVIEW_INTERVALS = [1, 3, 7];
const MAX_WORDS = 60;
const DAY = 24 * 60 * 60 * 1000;

export const normalizeWord = (word) => String(word || '').trim().toLocaleLowerCase('uk-UA');
const isoDay = (date) => new Date(date).toISOString().slice(0, 10);
const addDays = (date, days) => isoDay(new Date(date).getTime() + days * DAY);

export function reviewWord(task) {
  if (!task) return null;
  if (task.kind === 'semantic' || (task.kind === 'writing' && task.writingType !== 'message')) return task.word || null;
  if (task.kind === 'choice' && task.personal) return task.answer;
  return null;
}

export function taskOutcome(task, detail = {}) {
  if (task.kind === 'semantic' && detail.naming) return resultMode({ kind: 'choice' }, detail.naming);
  return resultMode(task, detail);
}

export function normalizeReview(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const entries = Object.entries(value).flatMap(([key, item]) => {
    const box = Number(item?.box);
    const due = typeof item?.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.due) ? item.due : null;
    const word = String(item?.word || '').trim().slice(0, 40);
    return key && word && due && box >= 1 && box <= REVIEW_INTERVALS.length ? [[normalizeWord(key), { word, box, due }]] : [];
  });
  return Object.fromEntries(entries.sort((a, b) => a[1].due.localeCompare(b[1].due)).slice(-MAX_WORDS));
}

export function loadReview(raw) {
  try { return normalizeReview(JSON.parse(raw)); }
  catch { return {}; }
}

export function updateReview(state, task, detail, now = new Date()) {
  const word = reviewWord(task);
  const mode = word && taskOutcome(task, detail);
  if (!word || !['independent', 'supported', 'attempted'].includes(mode)) return state;
  const key = normalizeWord(word);
  const current = state[key];
  const next = { ...state };
  if (mode !== 'independent') next[key] = { word, box: 1, due: addDays(now, REVIEW_INTERVALS[0]) };
  else if (!current) return state;
  else if (current.box >= REVIEW_INTERVALS.length) delete next[key];
  else next[key] = { word, box: current.box + 1, due: addDays(now, REVIEW_INTERVALS[current.box]) };
  return normalizeReview(next);
}

export const dueWords = (state, now = new Date()) => Object.entries(state).filter(([, item]) => item.due <= isoDay(now)).map(([key]) => key);
