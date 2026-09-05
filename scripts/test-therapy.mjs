import assert from 'node:assert/strict';
import { createTherapySession } from '../src/data/therapySession.js';
import { newProgress, restoreProgress, speechTotals, therapyReducer } from '../src/lib/therapyProgress.js';

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
