import { summarizeBlock } from './practiceResults.js';
import { reviewWord, taskOutcome } from './wordReview.js';

export const HISTORY_KEY = 'poruch_history_v1';
const MAX_SESSIONS = 120;
const BLOCK_IDS = ['understanding', 'meaning', 'logic', 'numbers', 'writing', 'communication'];
const DAY = 24 * 60 * 60 * 1000;

// A small record per session: enough for weekly trends without keeping answers or photos.
export function summarizeSession(progress) {
  const { session, completed, details } = progress;
  if (session?.mode !== 'extended') return null;
  const blocks = {};
  BLOCK_IDS.forEach((block) => {
    const total = session.tasks.filter((task) => task.block === block).length;
    if (!total) return;
    const stats = summarizeBlock(session, completed, details, block);
    blocks[block] = { total, independent: stats.independent, supported: stats.supported, attempted: stats.attempted, level: session.levels?.[block] || null };
  });
  const words = session.tasks.flatMap((task, index) => {
    const word = completed[index] && reviewWord(task);
    const mode = word && taskOutcome(task, details[index]);
    return word && ['independent', 'supported', 'attempted'].includes(mode) ? [{ word, mode }] : [];
  });
  const done = completed.filter(Boolean).length;
  return done ? { id: session.id, date: (session.createdAt || new Date().toISOString()).slice(0, 10), done, total: completed.length, blocks, words } : null;
}

export function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item.id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && item.blocks && typeof item.blocks === 'object')
    .map((item) => ({ ...item, words: Array.isArray(item.words) ? item.words.filter((entry) => entry?.word && entry?.mode) : [] }))
    .slice(-MAX_SESSIONS);
}

export function loadHistory(raw) {
  try { return normalizeHistory(JSON.parse(raw)); }
  catch { return []; }
}

export function recordSession(history, progress) {
  const summary = summarizeSession(progress);
  if (!summary) return history;
  const index = history.findIndex((item) => item.id === summary.id);
  if (index >= 0 && JSON.stringify(history[index]) === JSON.stringify(summary)) return history;
  const next = index >= 0 ? history.map((item, i) => i === index ? summary : item) : [...history, summary];
  return normalizeHistory(next.sort((a, b) => a.date.localeCompare(b.date)));
}

const mondayOf = (date) => {
  const day = new Date(`${date}T12:00:00Z`);
  return new Date(day.getTime() - ((day.getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10);
};

export function weeklyDiary(history, now = new Date(), weeks = 4) {
  const thisWeek = mondayOf(now.toISOString().slice(0, 10));
  return Array.from({ length: weeks }, (_, i) => {
    const start = new Date(new Date(`${thisWeek}T12:00:00Z`).getTime() - i * 7 * DAY).toISOString().slice(0, 10);
    const sessions = history.filter((item) => mondayOf(item.date) === start);
    const blocks = Object.fromEntries(BLOCK_IDS.map((block) => {
      const sum = sessions.reduce((acc, item) => {
        const stats = item.blocks[block];
        return stats ? { independent: acc.independent + stats.independent, supported: acc.supported + stats.supported, attempted: acc.attempted + stats.attempted } : acc;
      }, { independent: 0, supported: 0, attempted: 0 });
      return [block, sum];
    }));
    return { start, sessions: sessions.length, tasks: sessions.reduce((sum, item) => sum + item.done, 0), blocks };
  });
}

// Suggestions only: the caregiver and speech therapist decide whether to change a level.
export function levelSuggestions(history, levels) {
  return BLOCK_IDS.flatMap((block) => {
    const recent = history.filter((item) => item.blocks[block] && item.blocks[block].level === levels[block]).slice(-3);
    if (recent.length < 3) return [];
    const sum = recent.reduce((acc, item) => ({
      done: acc.done + item.blocks[block].independent + item.blocks[block].supported + item.blocks[block].attempted,
      independent: acc.independent + item.blocks[block].independent,
      attempted: acc.attempted + item.blocks[block].attempted,
    }), { done: 0, independent: 0, attempted: 0 });
    if (sum.done < 4) return [];
    if (levels[block] < 3 && sum.independent / sum.done >= 0.8) return [{ block, direction: 'up' }];
    if (levels[block] > 1 && sum.attempted / sum.done >= 0.5) return [{ block, direction: 'down' }];
    return [];
  });
}
