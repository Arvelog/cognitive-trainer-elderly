import { LEXICON } from './lexicon.js';
import { semanticFromLexicon } from './generatedPractice.js';

// The speech therapist's words for the coming weeks. They come into sessions one at a time
// and the diary shows how each went since the plan was set.
export const PLAN_KEY = 'poruch_plan_v1';
export const MAX_PLAN_WORDS = 10;

const clean = (value, max) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
const key = (word) => clean(word, 40).toLocaleLowerCase('uk-UA');

export function normalizePlan(value) {
  const seen = new Set();
  const words = (Array.isArray(value?.words) ? value.words : []).map((word) => clean(word, 40)).filter((word) => word && !seen.has(key(word)) && seen.add(key(word))).slice(0, MAX_PLAN_WORDS);
  const note = clean(value?.note, 300);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(value?.from || '') ? value.from : null;
  return { words, note, from };
}
export function loadPlan(raw) {
  try { return normalizePlan(JSON.parse(raw)); } catch { return normalizePlan(); }
}
export const parsePlanWords = (text) => String(text || '').split(/[\n,;]+/).map((word) => clean(word, 40)).filter(Boolean);

const lexiconItem = (word) => LEXICON.find((item) => item.word === key(word) && item.use);

// A word from the checked list becomes a features-and-naming task; any other word is written to dictation.
export function planTask(word, optionCount = 3) {
  const item = lexiconItem(word);
  if (item) return { ...semanticFromLexicon(item, optionCount), planned: true, contentId: `plan-${key(word)}` };
  return {
    kind: 'writing', planned: true, contentId: `plan-${key(word)}`,
    title: 'Напишіть слово під диктовку', word: clean(word, 40), dictation: clean(word, 40),
    writingGoal: 'Послухайте слово й напишіть його в зошиті.',
    first: clean(word, 40).charAt(0).toLocaleUpperCase('uk-UA'),
    hint: 'Послухайте ще раз повільно. Можна писати по складах.',
    accepted: 'Слово з плану логопеда. Якщо вийшла частина слова, це теж спроба.',
  };
}
export const planUsesWriting = (word) => !lexiconItem(word);

// Per plan word: how it went in sessions since the plan was set.
export function planProgress(plan, history) {
  return plan.words.map((word) => {
    const counts = { word, independent: 0, supported: 0, attempted: 0 };
    history.filter((item) => !plan.from || item.date >= plan.from).forEach((item) => (item.words || []).forEach((entry) => {
      if (key(entry.word) === key(word) && counts[entry.mode] !== undefined) counts[entry.mode] += 1;
    }));
    return counts;
  });
}
