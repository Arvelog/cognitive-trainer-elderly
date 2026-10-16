import assert from 'node:assert/strict';
import { createPracticeSession, validPracticeSession } from '../src/data/practiceSession.js';
import { normalizePracticeSettings } from '../src/data/practiceLevels.js';
import { loadPersonalWords, MAX_PERSONAL_WORDS, normalizePersonalWords } from '../src/data/personalWords.js';

const photo = 'data:image/jpeg;base64,AAAA';
const entry = (id, word, kind = 'person', hint = '') => ({ id, word, kind, hint, photo });
const family = [entry('1', 'Марія', 'person', 'ваша онука'), entry('2', 'Барсик', 'pet'), entry('3', 'Дача', 'place'), entry('4', 'Петро')];
const at = (level) => ({ ...normalizePracticeSettings(), blocks: Object.fromEntries(Object.keys(normalizePracticeSettings().blocks).map((key) => [key, level])) });

assert.deepEqual(loadPersonalWords('{broken'), []);
assert.deepEqual(normalizePersonalWords([{ id: 'x', word: 'Без фото' }, { id: 'y', word: ' ', photo }, { id: 'z', word: 'Зовнішнє', photo: 'https://example.com/a.jpg' }]), [], 'Entries need a name and an embedded photo');
assert.equal(normalizePersonalWords(Array.from({ length: 20 }, (_, i) => entry(String(i), `Слово ${i}`))).length, MAX_PERSONAL_WORDS);
assert.equal(normalizePersonalWords([entry('a', 'Хата', 'unknown')])[0].kind, 'thing');

for (const level of [1, 2, 3]) {
  const plain = createPracticeSession(null, null, at(level));
  assert.ok(plain.tasks.every((task) => !task.personal), 'Without photos the session is unchanged');
  for (let run = 0; run < 60; run += 1) {
    const session = createPracticeSession(null, null, at(level), family);
    assert.equal(session.tasks.length, 13);
    assert.ok(validPracticeSession(session), `Personal session is valid at level ${level}`);
    const recognition = session.tasks.find((task) => task.block === 'understanding' && task.personal);
    assert.ok(recognition, 'Two or more photos add a recognition task');
    assert.ok(recognition.options.includes(recognition.answer));
    assert.equal(recognition.options.length, level === 1 ? 2 : 3);
    assert.equal(new Set(recognition.options).size, recognition.options.length);
    assert.equal(recognition.ownResponse, level === 3);
    const story = session.tasks.find((task) => task.block === 'communication' && task.personal);
    assert.equal(story.directions.length, level, 'Photo story asks one question per level');
    const writing = session.tasks.filter((task) => task.block === 'writing' && task.personal);
    assert.equal(writing.length, 1);
    if (level === 3) assert.equal(writing[0].writingType, 'message');
    else assert.equal(writing[0].startStage, level === 1 ? 'model' : 'write');
  }
}

const one = createPracticeSession(null, null, at(2), [entry('1', 'Марія')]);
assert.ok(!one.tasks.some((task) => task.block === 'understanding' && task.personal), 'One photo is not enough for a choice of captions');
assert.ok(one.tasks.some((task) => task.block === 'writing' && task.personal));
const pets = createPracticeSession(null, null, at(3), [entry('2', 'Барсик', 'pet'), entry('3', 'Дача', 'place')]);
assert.ok(!pets.tasks.some((task) => task.block === 'writing' && task.personal), 'Notes are written only to people');

let previous = createPracticeSession(null, null, at(2), family);
for (let run = 0; run < 30; run += 1) {
  const next = createPracticeSession(null, previous, at(2), family);
  const shown = (session, block) => session.tasks.find((task) => task.block === block && task.personal)?.contentId;
  assert.notEqual(shown(next, 'communication'), shown(previous, 'communication'), 'The photo story rotates between sessions');
  previous = next;
}
console.log('Personal words: validation, storage limits, photo tasks per level and rotation passed.');
