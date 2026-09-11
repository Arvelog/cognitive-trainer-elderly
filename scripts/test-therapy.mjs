import assert from 'node:assert/strict';
import { createTherapySession } from '../src/data/therapySession.js';
import { newProgress, restoreProgress, speechTotals, therapyReducer } from '../src/lib/therapyProgress.js';
import { createPracticeSession, getSessionSteps, getStepCount, PRACTICE_BLOCKS, validPracticeSession } from '../src/data/practiceSession.js';
import { existsSync } from 'node:fs';

const session = createTherapySession();
let state = newProgress(session);
const apply = (action) => { state = therapyReducer(state, action); };
const reload = () => { state = restoreProgress(JSON.stringify(state)); };

// A completed answer must remain complete and selected after navigating and reloading.
apply({ type: 'progress', index: 1, progress: { chosen: session.find.answer, attempts: 2, done: true } });
apply({ type: 'next' });
apply({ type: 'back' });
reload();
assert.equal(state.completed[1], true);
assert.equal(state.details[1].chosen, session.find.answer);
const successfulState = state;
apply({ type: 'progress', index: 1, progress: { chosen: 'wrong', attempts: 3, done: false } });
assert.equal(state, successfulState, 'A second click cannot undo a successful answer');
apply({ type: 'repeat', index: 1 });
assert.equal(state.completed[1], false);
assert.equal(state.details[1], undefined);

// Even an unfinished sequence of spoken words survives leaving the screen and reloading.
for (let index = 0; index < 5; index += 1) apply({ type: 'next' });
apply({ type: 'progress', index: 5, progress: { results: ['independent', 'together'], hint: true, done: false } });
reload();
assert.equal(state.currentStep, 5);
assert.deepEqual(state.details[5].results, ['independent', 'together']);
assert.equal(state.details[5].hint, true);
assert.equal(state.completed[5], false);
assert.deepEqual(speechTotals(state.details[5]), { independent: 1, together: 1 });

// Finishing early is distinct from pausing and retains partial results for the summary.
apply({ type: 'next' });
reload();
assert.equal(state.status, 'completed');
assert.equal(state.completed.filter(Boolean).length, 0);
assert.deepEqual(speechTotals(state.details[5]), { independent: 1, together: 1 });
const finishedState = state;
apply({ type: 'repeat', index: 5 });
assert.equal(state, finishedState);

// All four word outcomes are retained after completing the last step.
apply({ type: 'start', session: createTherapySession() });
assert.equal(state.status, 'active');
assert.deepEqual(state.details, {});
assert.equal(state.currentStep, 0);
for (let index = 0; index < 5; index += 1) apply({ type: 'next' });
apply({ type: 'progress', index: 5, progress: { results: ['independent', 'together', 'together', 'independent'], done: true } });
reload();
assert.equal(state.status, 'active', 'Completing a step does not end the session before the user chooses Finish');
assert.equal(state.completed[5], true);
assert.deepEqual(speechTotals(state.details[5]), { independent: 2, together: 2 });
apply({ type: 'next' });
assert.equal(state.status, 'completed');

// Existing saved sessions retain their completed answers and get the clarified phrase.
const legacy = {
  session: { ...session, phrase: { lead: 'Я хочу', answer: 'чай', options: ['чай', 'чоботи'], spoken: 'Я хочу чай' } },
  completed: [true, true, false, false, false, false], currentStep: 1, details: { 1: { attempts: 1 } },
};
const migrated = restoreProgress(JSON.stringify(legacy));
assert.equal(migrated.details[0].done, true);
assert.equal(migrated.details[1].chosen, session.find.answer);
assert.equal(migrated.session.phrase.lead, 'Я п’ю');
assert.equal(migrated.status, 'active');
assert.equal(restoreProgress('{broken'), null);
assert.equal(restoreProgress(JSON.stringify({ session: { id: 'missing-data' }, completed: [] })), null);
console.log('Therapy progress: resume, answer locking, repeat, partial summary, finish, migration passed.');

// Full and single-block sessions have their own lengths; the original six-step save still restores.
const fullSession = createPracticeSession();
assert.equal(getStepCount(fullSession), 13);
assert.deepEqual([...new Set(fullSession.tasks.map((task) => task.block))], PRACTICE_BLOCKS.map((block) => block.id));
for (const block of PRACTICE_BLOCKS) {
  const single = createPracticeSession(block.id);
  assert.ok(validPracticeSession(single));
  assert.ok(single.tasks.every((task) => task.block === block.id));
  let blockState = newProgress(single);
  for (const task of single.tasks) blockState = therapyReducer(blockState, { type: 'next' });
  assert.equal(blockState.status, 'completed');
  assert.equal(blockState.completed.filter(Boolean).length, 0, 'Skipped tasks are not recorded as completed');
  assert.equal(restoreProgress(JSON.stringify(blockState)).status, 'completed');
}
apply({ type: 'start', session: fullSession });
const writingIndex = fullSession.tasks.findIndex((task) => task.kind === 'writing');
assert.equal(fullSession.tasks[writingIndex].word, 'борщ', 'The requested unlabelled borscht exercise is always included');
for (let i = 0; i < writingIndex; i += 1) apply({ type: 'next' });
apply({ type: 'progress', index: writingIndex, progress: { stage: 'recall', usedModel: true, hint: false, done: false } });
reload();
assert.equal(state.currentStep, writingIndex);
assert.equal(state.details[writingIndex].stage, 'recall', 'Reload must not reveal the writing model again');
assert.equal(state.details[writingIndex].usedModel, true);
assert.equal(state.completed[writingIndex], false);
apply({ type: 'progress', index: writingIndex, progress: { ...state.details[writingIndex], mode: 'supported', done: true } });
reload();
const writingDone = state;
apply({ type: 'progress', index: writingIndex, progress: { done: false } });
assert.equal(state, writingDone);
apply({ type: 'repeat', index: writingIndex });
assert.equal(state.details[writingIndex], undefined, 'Repeat starts with the answer hidden');

const featureIndex = fullSession.tasks.findIndex((task) => task.kind === 'semantic');
const sequenceIndex = fullSession.tasks.findIndex((task) => task.kind === 'sequence');
apply({ type: 'progress', index: featureIndex, progress: { question: 1, answers: [{ chosen: 'example', done: true }], done: false } });
apply({ type: 'progress', index: sequenceIndex, progress: { selected: [fullSession.tasks[sequenceIndex].steps[0]], hint: true, done: false } });
reload();
assert.equal(state.details[featureIndex].question, 1);
assert.equal(state.details[sequenceIndex].selected.length, 1);
assert.equal(state.details[sequenceIndex].hint, true);
apply({ type: 'finish' });
reload();
assert.equal(state.status, 'completed', 'Finishing from a break retains partial practice without marking skipped work complete');
assert.equal(state.completed.filter(Boolean).length, 0);
apply({ type: 'start', session: fullSession });
for (let i = 0; i < 12; i += 1) apply({ type: 'next' });
reload();
assert.equal(state.currentStep, 12, 'Resume after task six must not clamp to the old session length');
assert.equal(state.status, 'active');
apply({ type: 'next' });
assert.equal(state.status, 'completed');
assert.equal(restoreProgress(JSON.stringify({ ...state, session: { ...fullSession, tasks: [{ kind: 'unknown', block: 'writing' }] } })), null);

// Generated task variants must be playable, have sound answer sets and bundled writing pictures.
for (let i = 0; i < 80; i += 1) {
  const generated = createPracticeSession();
  assert.ok(validPracticeSession(generated));
  assert.equal(new Set(generated.tasks.map((task) => task.id)).size, generated.tasks.length);
  for (const task of generated.tasks) {
    if (task.options) assert.equal(task.options.filter((value) => value === task.answer).length, 1);
    if (task.equation) {
      const [, a, operator, b] = task.stimulus.match(/(\d+) ([+−]) (\d+)/);
      assert.equal(Number(task.answer), operator === '+' ? Number(a) + Number(b) : Number(a) - Number(b));
    }
    if (task.kind === 'writing') assert.ok(existsSync(new URL(`../public${task.image}`, import.meta.url)), `Missing picture: ${task.image}`);
  }
}
console.log('Extended practice: 13 tasks, six blocks, paper-writing recall, nested progress, early finish, variants and assets passed.');

// A task already saved on a user's device must receive corrected instructions without losing their place or answer.
const conversationSave = newProgress(createPracticeSession('communication'));
conversationSave.session.tasks[0] = {
  id: 'communication-0', block: 'communication', kind: 'conversation',
  title: 'Попросіть потрібну річ', situation: 'Ви хочете написати щось у зошиті.',
  prompt: 'Попросіть олівець.', model: 'Дай олівець, будь ласка.', cue: 'Дай…',
};
conversationSave.details[0] = { hint: true, model: true, mode: 'supported', done: true };
conversationSave.completed[0] = true;
const resumedConversation = restoreProgress(JSON.stringify(conversationSave));
const refreshedTask = getSessionSteps(resumedConversation.session)[0];
assert.equal(refreshedTask.scenario, 'pencil');
assert.notEqual(refreshedTask.title, conversationSave.session.tasks[0].title);
assert.equal(refreshedTask.directions.length, 2);
assert.ok(refreshedTask.setup && refreshedTask.partnerResponse);
assert.equal(refreshedTask.id, 'communication-0');
assert.equal(refreshedTask.situation, undefined, 'Outdated context is removed');
assert.deepEqual(resumedConversation.details[0], conversationSave.details[0]);
assert.equal(resumedConversation.currentStep, 0);
assert.equal(resumedConversation.completed[0], true);
assert.equal(conversationSave.session.tasks[0].title, 'Попросіть потрібну річ', 'Refreshing display data does not mutate the saved snapshot');
console.log('Conversation correction: existing sessions show current instructions and retain answers.');
