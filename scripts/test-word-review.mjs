import assert from 'node:assert/strict';
import { createPracticeSession, validPracticeSession } from '../src/data/practiceSession.js';
import { normalizePracticeSettings } from '../src/data/practiceLevels.js';
import { dueWords, loadReview, REVIEW_INTERVALS, reviewWord, updateReview } from '../src/lib/wordReview.js';

const day0 = new Date('2026-10-16T09:00:00Z');
const later = (days) => new Date(day0.getTime() + days * 86400000);
const writing = { kind: 'writing', word: 'ключ', block: 'writing' };
const supported = { done: true, mode: 'supported', stage: 'write', stageResults: { write: { mode: 'supported', hinted: true } }, usedHint: true };
const independent = { done: true, mode: 'independent', stage: 'write', stageResults: { write: { mode: 'independent', hinted: false } } };

assert.deepEqual(loadReview('{broken'), {});
assert.deepEqual(updateReview({}, writing, independent, day0), {}, 'Words done independently the first time are not tracked');
assert.equal(reviewWord({ kind: 'writing', writingType: 'message', word: 'Записка' }), null, 'Free notes are not single words');
assert.equal(reviewWord({ kind: 'choice', answer: 'фрукт' }), null, 'Only personal captions count among choices');
assert.equal(reviewWord({ kind: 'choice', personal: true, answer: 'Марія' }), 'Марія');

let state = updateReview({}, writing, supported, day0);
assert.deepEqual(state.ключ, { word: 'ключ', box: 1, due: '2026-10-17' });
assert.deepEqual(dueWords(state, day0), [], 'Not due on the same day');
assert.deepEqual(dueWords(state, later(1)), ['ключ']);
state = updateReview(state, writing, independent, later(1));
assert.equal(state.ключ.box, 2);
assert.equal(state.ключ.due, '2026-10-20', `Second step waits ${REVIEW_INTERVALS[1]} days`);
state = updateReview(state, writing, { done: true, mode: 'attempted' }, later(4));
assert.deepEqual(state.ключ, { word: 'ключ', box: 1, due: '2026-10-21' }, 'Needing help again starts over');
for (const step of [5, 8, 15]) state = updateReview(state, writing, independent, later(step));
assert.deepEqual(state, {}, 'Three independent answers in a row retire the word');

const semantic = { kind: 'semantic', word: 'ножиці' };
state = updateReview({}, semantic, { done: true, mode: 'supported', naming: { done: true, mode: 'independent' } }, day0);
assert.deepEqual(state, {}, 'Semantic tasks count the naming attempt');
state = updateReview({}, semantic, { done: true, mode: 'supported', naming: { done: true, mode: 'supported', usedModel: true } }, day0);
assert.ok(state.ножиці);

const at = (level) => ({ ...normalizePracticeSettings(), blocks: Object.fromEntries(Object.keys(normalizePracticeSettings().blocks).map((key) => [key, level])) });
for (let run = 0; run < 40; run += 1) {
  const session = createPracticeSession(null, null, at(2), [], ['ножиці', 'КЛЮЧ']);
  assert.ok(validPracticeSession(session));
  const meaning = session.tasks.find((task) => task.id === 'meaning-0');
  assert.equal(meaning.word, 'ножиці');
  assert.ok(meaning.review);
  assert.equal(session.tasks.find((task) => task.id === 'writing-0').word, 'ключ');
  assert.equal(session.tasks.filter((task) => task.review).length, 2);
}
const photo = 'data:image/jpeg;base64,AAAA';
const family = [{ id: '1', word: 'Марія', kind: 'person', photo }, { id: '2', word: 'Петро', kind: 'person', photo }, { id: '3', word: 'Дача', kind: 'place', photo }];
for (let run = 0; run < 20; run += 1) {
  const session = createPracticeSession(null, null, at(2), family, ['петро']);
  const recognition = session.tasks.find((task) => task.id === 'understanding-0');
  assert.equal(recognition.answer, 'Петро');
  assert.ok(recognition.review);
}
assert.ok(createPracticeSession(null, null, at(2)).tasks.every((task) => !task.review));
console.log('Word review: intervals, reset, retirement, semantic naming and due words in sessions passed.');
