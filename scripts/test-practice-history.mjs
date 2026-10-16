import assert from 'node:assert/strict';
import { createPracticeSession } from '../src/data/practiceSession.js';
import { normalizePracticeSettings } from '../src/data/practiceLevels.js';
import { newProgress } from '../src/lib/therapyProgress.js';
import { levelSuggestions, loadHistory, recordSession, summarizeSession, weeklyDiary } from '../src/lib/practiceHistory.js';

const levels = normalizePracticeSettings().blocks;
const sessionOn = (date) => ({ ...createPracticeSession(null, null, normalizePracticeSettings()), createdAt: `${date}T10:00:00Z` });
const finishAll = (progress, mode) => ({
  ...progress,
  completed: progress.completed.map(() => true),
  details: Object.fromEntries(progress.session.tasks.map((task, i) => [i, { done: true, mode, ...(task.kind === 'semantic' ? { naming: { done: true, mode } } : {}) }])),
});

assert.deepEqual(loadHistory('{broken'), []);
const empty = newProgress(sessionOn('2026-10-12'));
assert.equal(summarizeSession(empty), null, 'Untouched sessions are not recorded');
let history = recordSession([], empty);
assert.deepEqual(history, []);

const first = finishAll(newProgress(sessionOn('2026-10-13')), 'supported');
history = recordSession(history, first);
assert.equal(history.length, 1);
assert.equal(history[0].done, 13);
assert.equal(history[0].blocks.numbers.supported, 2);
assert.equal(recordSession(history, first), history, 'Unchanged progress keeps the same array');
history = recordSession(history, { ...first, completed: first.completed.map((done, i) => i < 3) });
assert.equal(history.length, 1, 'The same session is updated, not duplicated');
assert.equal(history[0].done, 3);
assert.ok(JSON.stringify(history).length < 2000, 'Records stay small');
assert.ok(!JSON.stringify(history).includes('data:image'), 'No photos in the diary');

for (const date of ['2026-10-14', '2026-10-15', '2026-10-16']) history = recordSession(history, finishAll(newProgress(sessionOn(date)), 'independent'));
const weeks = weeklyDiary(history, new Date('2026-10-16T12:00:00Z'));
assert.equal(weeks[0].start, '2026-10-12');
assert.equal(weeks[0].sessions, 4);
assert.equal(weeks[1].sessions, 0);
assert.equal(weeks[0].blocks.numbers.independent, 6);
const up = levelSuggestions(history, { ...levels, numbers: 2, meaning: 2 });
assert.ok(!up.some((item) => ['numbers', 'meaning'].includes(item.block)), 'Suggestions need three sessions at the current level');
assert.ok(up.some((item) => item.block === 'understanding' && item.direction === 'up'), 'Three independent sessions at level 2 suggest trying level 3');
const atLevel = (mode, level) => finishAll(newProgress({ ...createPracticeSession(null, null, { ...normalizePracticeSettings(), blocks: { ...levels, numbers: level } }), createdAt: '2026-10-16T10:00:00Z' }), mode);
let numbers = [];
for (let i = 0; i < 3; i += 1) numbers = recordSession(numbers, atLevel('independent', 2));
assert.ok(levelSuggestions(numbers, { ...levels, numbers: 2 }).some((item) => item.block === 'numbers' && item.direction === 'up'));
numbers = [];
for (let i = 0; i < 3; i += 1) numbers = recordSession(numbers, atLevel('attempted', 2));
assert.ok(levelSuggestions(numbers, { ...levels, numbers: 2 }).some((item) => item.block === 'numbers' && item.direction === 'down'));
assert.ok(!levelSuggestions(numbers, { ...levels, numbers: 3 }).some((item) => item.block === 'numbers'), 'Records from another level do not count');
console.log('Practice history: compact records, updates, weekly totals and level suggestions passed.');
