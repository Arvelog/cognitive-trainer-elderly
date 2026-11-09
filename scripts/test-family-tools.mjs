import assert from 'node:assert/strict';
import { buildBackup, parseBackup, restoreItems } from '../src/lib/backup.js';
import { buildReminderIcs, normalizeReminder } from '../src/lib/reminder.js';
import { deepestCue, firstSyllable, namingCues } from '../src/lib/namingCues.js';
import { recordSemanticName } from '../src/lib/practiceResults.js';
import { recordSession, weeklyDiary } from '../src/lib/practiceHistory.js';
import { normalizeScripts, parseLines, scriptCue, nextScript, updateScriptStage } from '../src/data/scripts.js';
import { normalizePlan, parsePlanWords, planProgress, planTask } from '../src/data/therapyPlan.js';
import { createPracticeSession, validPracticeSession } from '../src/data/practiceSession.js';
import { normalizePracticeSettings } from '../src/data/practiceLevels.js';
import { promptKey } from '../src/lib/caregiverVoice.js';

// Backup: only app keys travel, a restore replaces old data, and foreign files are refused.
class Store {
  constructor(entries = {}) { this.map = new Map(Object.entries(entries)); }
  get length() { return this.map.size; }
  key(i) { return [...this.map.keys()][i] ?? null; }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}
const source = new Store({ poruch_history_v1: '[1]', poruch_personal_words_v1: '[]', other_site: 'x' });
const backup = buildBackup(source, { clips: [{ id: 'a', createdAt: '2026-11-01', data: 'data:audio/webm;codecs=opus;base64,AAAA' }] }, new Date('2026-11-09T10:00:00Z'));
assert.deepEqual(Object.keys(backup.items), ['poruch_history_v1', 'poruch_personal_words_v1']);
const parsed = parseBackup(JSON.stringify(backup));
assert.equal(parsed.audio.clips.length, 1);
assert.deepEqual(parsed.audio.prompts, []);
const target = new Store({ poruch_word_review_v1: '{}', poruch_history_v1: '[]', keep_me: '1' });
restoreItems(target, parsed.items);
assert.equal(target.getItem('poruch_history_v1'), '[1]');
assert.equal(target.getItem('poruch_word_review_v1'), null, 'Data missing from the backup does not linger');
assert.equal(target.getItem('keep_me'), '1', 'Other sites\' keys are untouched');
assert.throws(() => parseBackup('{"format":"other"}'), /format/);
assert.throws(() => parseBackup('not json'), /format/);
assert.throws(() => parseBackup(JSON.stringify({ ...backup, version: 99 })), /version/);
const hostile = parseBackup(JSON.stringify({ ...backup, items: { evil: 'x', poruch_ok_v1: 'y', poruch_obj_v1: {} }, audio: { clips: [{ id: 'b', data: 'javascript:alert(1)' }] } }));
assert.deepEqual(hostile.items, { poruch_ok_v1: 'y' });
assert.deepEqual(hostile.audio.clips, []);

// Reminder: a weekly event on the chosen days, starting on the next chosen day.
assert.deepEqual(normalizeReminder({ days: ['SU', 'XX', 'MO'], time: '25:00' }), { days: ['MO', 'SU'], time: '11:00' });
const ics = buildReminderIcs({ days: ['TU', 'TH'], time: '09:30' }, new Date(2026, 10, 9, 12));
assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=TU,TH/);
assert.match(ics, /DTSTART:20261110T093000/, 'Monday 9 Nov → first event Tuesday 10 Nov');
assert.match(ics, /DTEND:20261110T095000/);
assert.ok(ics.includes('\r\n') && ics.startsWith('BEGIN:VCALENDAR'));
assert.equal(buildReminderIcs({ days: [], time: '10:00' }), null);

// Naming cues: meaning, sound, syllable, then the word; the deepest one used is recorded.
assert.equal(firstSyllable('чашка'), 'ча');
assert.equal(firstSyllable('яблуко'), 'я');
assert.equal(firstSyllable('зубна щітка'), 'зу');
const semantic = { kind: 'semantic', word: 'чашка', questions: [{ answer: 'посуд' }, { answer: 'щоб пити чай' }, { answer: 'на кухні' }] };
assert.deepEqual(namingCues(semantic).map((cue) => cue.kind), ['meaning', 'sound', 'syllable', 'word']);
assert.deepEqual(namingCues({ ...semantic, word: 'яблуко' }).map((cue) => cue.kind), ['meaning', 'sound', 'word'], 'No syllable step when it equals the first sound');
assert.equal(deepestCue(semantic, 0), 'none');
assert.equal(deepestCue(semantic, 2), 'sound');
const answered = { answers: [{ done: true, mode: 'independent' }], featuresDone: true };
assert.equal(recordSemanticName(answered, false, 'independent').mode, 'independent');
const cued = recordSemanticName({ ...answered, cueLevel: 2, usedHint: true }, false, 'independent');
assert.equal(cued.naming.mode, 'supported', 'A cue makes naming supported');
assert.equal(cued.naming.cueLevel, 2);
assert.equal(recordSemanticName(answered, true, 'independent').naming.cueLevel, null, 'Visible word: no cue record');
const session = { id: 's1', mode: 'extended', createdAt: '2026-11-09T10:00:00Z', levels: {}, tasks: [{ ...semantic, block: 'meaning' }] };
const history = recordSession([], { session, completed: [true], details: [cued] });
assert.deepEqual(history[0].naming, ['sound']);
assert.equal(weeklyDiary(history, new Date('2026-11-10T10:00:00Z'))[0].naming.sound, 1);

// Scripts: fading text, the oldest first, and stage changes from the outcome.
assert.deepEqual(parseLines('- Привіт, Олю!\n\n2) У мене все добре.\n'), ['Привіт, Олю!', 'У мене все добре.']);
assert.equal(scriptCue('Приїжджай у неділю на чай', 1), 'Приїжджай у неділю на чай');
assert.equal(scriptCue('Приїжджай у неділю на чай', 2), 'Приїжджай у…');
assert.equal(scriptCue('Добрий день', 2), 'Д…');
assert.equal(scriptCue('Добрий день', 3), '');
let scripts = normalizeScripts([{ id: 'a', title: 'Дзвінок', lines: ['Привіт'], stage: 1, lastPracticed: '2026-11-08' }, { id: 'b', title: 'Аптека', lines: ['Дайте ліки'], stage: 2 }, { id: 'c', title: '', lines: ['x'] }]);
assert.equal(scripts.length, 2);
assert.equal(nextScript(scripts).id, 'b', 'Never practised comes first');
scripts = updateScriptStage(scripts, 'b', 'independent', new Date('2026-11-09T10:00:00Z'));
assert.deepEqual([scripts[1].stage, scripts[1].lastPracticed], [3, '2026-11-09']);
scripts = updateScriptStage(scripts, 'a', 'attempted');
assert.equal(scripts[0].stage, 1, 'Stage never drops below 1');

// Plan: words from the checked list become naming tasks, other words dictation.
assert.deepEqual(parsePlanWords('чашка, ліки\nонука;'), ['чашка', 'ліки', 'онука']);
assert.deepEqual(normalizePlan({ words: ['Чашка', 'чашка', ' ліки '] }).words, ['Чашка', 'ліки']);
assert.equal(planTask('чашка').kind, 'semantic');
assert.equal(planTask('ліки').kind, 'writing');
assert.equal(planTask('ліки').dictation, 'ліки');
const plan = { words: ['чашка', 'ліки'], note: '', from: '2026-11-01' };
const planHistory = [{ date: '2026-10-30', words: [{ word: 'чашка', mode: 'independent' }] }, { date: '2026-11-05', words: [{ word: 'Чашка', mode: 'supported' }, { word: 'ліки', mode: 'attempted' }] }];
assert.deepEqual(planProgress(plan, planHistory), [{ word: 'чашка', independent: 0, supported: 1, attempted: 0 }, { word: 'ліки', independent: 0, supported: 0, attempted: 1 }]);

// Sessions: a script takes the first conversation slot; plan words appear in meaning and writing.
const at = (level) => ({ ...normalizePracticeSettings(), blocks: Object.fromEntries(Object.keys(normalizePracticeSettings().blocks).map((key) => [key, level])) });
for (const level of [1, 2, 3]) {
  for (let run = 0; run < 20; run += 1) {
    const practice = createPracticeSession(null, null, at(level), [], [], { scripts, plan });
    assert.ok(validPracticeSession(practice));
    const conversation = practice.tasks.find((task) => task.id === 'communication-0');
    assert.equal(conversation.kind, 'script');
    assert.equal(practice.tasks.find((task) => task.id === 'meaning-0').word, 'чашка');
    const writing = practice.tasks.find((task) => task.id === 'writing-1');
    if (level < 3) assert.equal(writing.dictation, 'ліки');
    else assert.equal(writing.dictation, undefined);
  }
}
assert.equal(createPracticeSession(null, null, at(2)).tasks.some((task) => task.kind === 'script' || task.planned), false, 'Nothing changes without scripts or a plan');

// Caregiver voice: the same text with other punctuation or case finds the same recording.
assert.equal(promptKey('«Привіт, Олю!»'), promptKey('привіт олю'));

console.log('Family tools: backup, reminder, naming cues, scripts, therapy plan and caregiver voice keys passed.');
