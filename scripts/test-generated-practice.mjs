import assert from 'node:assert/strict';
import { LEXICON } from '../src/data/lexicon.js';
import { LEXICON_CATEGORY_NAMES, LEXICON_FEATURES, numberProblem } from '../src/data/generatedPractice.js';
import { createPracticeSession, validPracticeSession } from '../src/data/practiceSession.js';
import { normalizePracticeSettings } from '../src/data/practiceLevels.js';

assert.equal(new Set(LEXICON.map((item) => item.word)).size, LEXICON.length, 'Each word appears once');
assert.ok(LEXICON.every((item) => item.word && item.emoji && item.label && item.zone && item.place));
const byZone = (field, value) => new Set(LEXICON.filter((item) => item[field] === value).map((item) => item.zone));
for (const field of ['label', 'use', 'place']) {
  for (const value of new Set(LEXICON.map((item) => item[field]).filter(Boolean))) assert.equal(byZone(field, value).size, 1, `${field} «${value}» belongs to one room only, so it cannot be a true distractor`);
}

for (let run = 0; run < 30; run += 1) {
  for (const count of [2, 3]) {
    for (const task of LEXICON_FEATURES(count)) {
      const item = LEXICON.find((entry) => entry.word === task.word);
      for (const question of task.questions) {
        assert.equal(question.options.length, count);
        assert.equal(new Set(question.options).size, count);
        assert.equal(question.options.filter((option) => option === question.answer).length, 1);
        const wrong = question.options.filter((option) => option !== question.answer);
        assert.ok(wrong.every((option) => !LEXICON.some((entry) => entry.zone === item.zone && Object.values(entry).includes(option))), `«${task.word}»: no distractor from the same room`);
      }
    }
  }
  for (const task of LEXICON_CATEGORY_NAMES()) {
    const words = task.stimulus.split(' · ');
    assert.equal(words.length, 3);
    assert.ok(words.every((word) => LEXICON.find((item) => item.word === word).label === task.answer));
    assert.equal(task.options.length, 2);
    assert.notEqual(task.options[0], task.options[1]);
  }
}

const solve = (stimulus) => {
  const [, a, operator, b] = stimulus.match(/^(\d+) ([+−]) (\d+) = \?$/);
  return { a: Number(a), b: Number(b), operator, answer: operator === '+' ? Number(a) + Number(b) : Number(a) - Number(b) };
};
for (let run = 0; run < 3000; run += 1) {
  for (const level of [1, 2, 3]) {
    const task = numberProblem(level);
    const { a, b, operator, answer } = solve(task.stimulus);
    assert.equal(task.answer, String(answer));
    assert.ok(answer >= 0 && task.options.includes(task.answer) && new Set(task.options).size === task.options.length);
    assert.ok(task.options.every((option) => Number(option) >= 0));
    assert.ok(task.hintSteps.length >= 2 && task.hintSteps.every(Boolean));
    if (level === 1) assert.ok(answer <= 10 && b >= 1 && task.options.length === 2 && task.counters[0] === a && task.counters[1] === b);
    if (level === 2) assert.ok(a > 10 && answer <= 19 && (operator === '+' ? a % 10 + b < 10 : a % 10 >= b));
    if (level === 3) assert.ok(operator === '+' ? answer > 10 && a < 10 : a > 10 && answer < 10);
  }
}

const at = (level) => ({ ...normalizePracticeSettings(), blocks: Object.fromEntries(Object.keys(normalizePracticeSettings().blocks).map((key) => [key, level])) });
const seen = new Set();
for (let run = 0; run < 300; run += 1) {
  const session = createPracticeSession(null, null, at(1 + (run % 3)));
  assert.ok(validPracticeSession(session));
  session.tasks.filter((task) => ['meaning', 'numbers'].includes(task.block)).forEach((task) => seen.add(task.stimulus || task.word || task.contentId));
}
assert.ok(seen.size > 120, `Meaning and numbers vary widely across sessions (${seen.size} distinct)`);
const bank = LEXICON_FEATURES(3).length + LEXICON_CATEGORY_NAMES().length;
console.log(`Generated practice: ${LEXICON.length} checked words, ${bank} word tasks, arithmetic by level and session variety (${seen.size} distinct in 300 sessions) passed.`);
