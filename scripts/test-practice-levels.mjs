import assert from 'node:assert/strict';
import { createPracticeSession, getSessionSteps, validPracticeSession } from '../src/data/practiceSession.js';
import { createTherapySession } from '../src/data/therapySession.js';
import { levelLabel, normalizePracticeSettings, restorePracticeSettings, RICHER_SETTINGS } from '../src/data/practiceLevels.js';
import { NUMBER_CONTEXTS, PLANS } from '../src/data/richerPractice.js';
import { chooseAnswer, nextSequenceSteps, recordOwnResponse, recordReasoningAnswer, recordSemanticName, recordWritingStage, resultMode, summarizeBlock } from '../src/lib/practiceResults.js';
import { newProgress, restoreProgress, therapyReducer } from '../src/lib/therapyProgress.js';

const defaultSettings = normalizePracticeSettings();
assert.equal(defaultSettings.blocks.numbers, 3, 'The existing harder math remains the default');
assert.deepEqual(restorePracticeSettings('{broken'), defaultSettings);
assert.deepEqual(normalizePracticeSettings({ blocks: { numbers: 999 }, shortWords: '3' }), defaultSettings);
const settingsAt = (level) => ({ blocks: Object.fromEntries(Object.keys(defaultSettings.blocks).map((key) => [key, level])), shortWords: level });

for (const level of [1, 2, 3]) {
  for (let run = 0; run < 80; run += 1) {
    const full = createPracticeSession(null, null, settingsAt(level));
    assert.equal(full.tasks.length, 13);
    assert.ok(validPracticeSession(full));
    assert.ok(full.tasks.every((task) => task.level === level));
    const reading = full.tasks[1];
    if (level > 1) {
      assert.equal(reading.kind, 'reasoning');
      assert.equal(reading.questions.length, level, 'Higher reading levels require multiple details and inferences');
      assert.ok(reading.questions.every((q) => q.ownResponse === (level === 3) && q.prompt && q.options.includes(q.answer)));
    }
    const math = full.tasks.find((task) => task.equation);
    const [, left, operator, right] = math.stimulus.match(/(\d+) ([+−]) (\d+)/);
    const a = Number(left), b = Number(right), answer = Number(math.answer);
    assert.equal(answer, operator === '+' ? a + b : a - b);
    if (level === 1) {
      assert.ok(Math.max(a, b, answer) <= 10);
      assert.deepEqual(math.counters, [a, b]);
      assert.equal(math.options.length, 2);
    } else if (level === 2) {
      assert.ok(operator === '+' ? a % 10 + b < 10 : a % 10 >= b, 'Middle level needs no regrouping');
    } else {
      assert.ok(operator === '+' ? answer > 10 : a > 10 && answer < 10);
    }
    const sequence = full.tasks.find((task) => task.kind === 'sequence');
    assert.equal(sequence.steps.length, level + 1);
    assert.deepEqual([...sequence.steps].sort(), [...sequence.choices].sort());
    assert.ok(sequence.validOrders.every((order) => order.length === sequence.steps.length && new Set(order).size === order.length && order.every((step) => sequence.choices.includes(step))));
    const category = full.tasks.find((task) => task.id === 'meaning-2');
    assert.equal(category.title, level === 1 ? 'Оберіть спільну назву' : level === 2 ? 'Що тут зайве?' : 'Назвіть спільну назву');
    assert.equal(category.ownResponse, level === 3);
    const writing = full.tasks.filter((task) => task.kind === 'writing');
    assert.equal(writing[0].startStage, level === 1 ? 'model' : 'write');
    if (level === 3) {
      assert.equal(writing[0].writingType, 'message');
      assert.notEqual(writing[0].contentId, writing[1].contentId);
    } else assert.notEqual(writing[0].image, writing[1].image);
    assert.deepEqual(getSessionSteps(full), full.tasks, 'Display refresh must not replace a new level snapshot');
  }
}

const easy = createPracticeSession('numbers', null, settingsAt(1));
const originalEasy = structuredClone(easy);
const easySave = newProgress(easy);
assert.deepEqual(restoreProgress(JSON.stringify(easySave)), easySave, 'New easy math must not be mistaken for old math to upgrade');
const next = createPracticeSession(null, easy, settingsAt(3));
assert.deepEqual(easy, originalEasy, 'Changing settings for a new session does not modify the earlier snapshot');
assert.equal(next.levels.numbers, 3);
const previous = createPracticeSession(null, null, RICHER_SETTINGS);
const following = createPracticeSession(null, previous, RICHER_SETTINGS);
previous.tasks.forEach((task, index) => {
  if (task.contentId) assert.notEqual(following.tasks[index].contentId, task.contentId, 'Consecutive sessions vary the same task slot');
});
assert.notEqual(following.tasks[11].contentId, following.tasks[12].contentId, 'Two dialogue tasks must have different scenarios');
assert.deepEqual(restoreProgress(JSON.stringify(newProgress(previous))).session, previous, 'All richer task types restore as their original snapshots');
const previousLevels = structuredClone(originalEasy);
previousLevels.curriculumVersion = 2;
previousLevels.tasks.forEach((task) => { task.curriculumVersion = 2; delete task.levelLabel; });
assert.deepEqual(restoreProgress(JSON.stringify(newProgress(previousLevels))).session, previousLevels, 'Previously published level snapshots stay intact');
assert.equal(levelLabel('understanding', 3, 2), 'Власна відповідь', 'Older session levels retain their original meaning');

let passageProgress = recordReasoningAnswer({}, 0, chooseAnswer({}, 'yes', 'yes'), 2);
assert.equal(passageProgress.done, false, 'One answered question does not complete a multi-question task');
passageProgress = recordReasoningAnswer({ ...passageProgress, question: 1 }, 1, recordOwnResponse({ usedHint: true }, 'independent'), 2);
assert.equal(passageProgress.done, true);
assert.equal(passageProgress.mode, 'supported');
assert.equal(passageProgress.answers[0].mode, 'independent');
const passageSession = createPracticeSession('understanding', null, settingsAt(3));
let passageSave = newProgress(passageSession);
passageSave = therapyReducer(passageSave, { type: 'progress', index: 1, progress: { ...passageProgress, done: false } });
assert.deepEqual(restoreProgress(JSON.stringify(passageSave)).details[1], passageSave.details[1], 'Partial question results and the active question survive reload');

const prices = NUMBER_CONTEXTS[0].stimulus.match(/\d+/g).map(Number);
assert.equal(Number(NUMBER_CONTEXTS[0].questions[0].answer.match(/\d+/)[0]), prices[0] + prices[1]);
assert.equal(Number(NUMBER_CONTEXTS[0].questions[1].answer.match(/\d+/)[0]), prices[2] - prices[0] - prices[1], 'Change is computed from the full purchase, not one item');
const quantities = NUMBER_CONTEXTS[1].stimulus.match(/\d+/g).map(Number);
assert.equal(Number(NUMBER_CONTEXTS[1].questions[0].answer.match(/\d+/)[0]), quantities[0] * 2 + quantities[1]);
assert.equal(Number(NUMBER_CONTEXTS[1].questions[1].answer.match(/\d+/)[0]), quantities[2] - quantities[0] * 2 - quantities[1]);

const addressPlan = PLANS.find((task) => task.title === 'Продовжіть справу після зміни адреси');
const addressSteps = addressPlan.longerSteps;
const addressTask = { steps: addressSteps, validOrders: addressPlan.stepOrders.map((order) => order.map((index) => addressSteps[index])) };
assert.ok(nextSequenceSteps(addressTask).includes('Уточнити, чи працює майстерня сьогодні'), 'Opening hours may be checked before asking for the new address');
assert.ok(!nextSequenceSteps(addressTask).includes('Вирушити новим маршрутом'), 'Leaving still requires the address, route and opening hours');
assert.deepEqual(nextSequenceSteps(addressTask, [addressSteps[1], addressSteps[0]]), [addressSteps[2]], 'An alternative start preserves the later route prerequisite');
assert.deepEqual(nextSequenceSteps(addressTask, [addressSteps[0], addressSteps[2]]), [addressSteps[1]], 'After planning the route, opening hours are still required before leaving');
assert.deepEqual(nextSequenceSteps({ steps: ['first', 'second'] }, []), ['first'], 'Old snapshots keep their existing fixed order');

let response = chooseAnswer({}, 'wrong', 'right');
assert.equal(response.answerRevealed, false);
response = chooseAnswer(response, 'wrong', 'right');
assert.equal(response.answerRevealed, true);
response = chooseAnswer(response, 'right', 'right');
assert.equal(response.mode, 'supported');
assert.equal(response.attempts, 3);
assert.equal(chooseAnswer({ hint: false, usedHint: true }, 'right', 'right').mode, 'supported', 'Closing a hint does not erase assistance');
assert.equal(chooseAnswer({ usedAudio: true }, 'right', 'right').mode, 'independent', 'Reading a stimulus aloud is a recorded modality, not an answer cue');
assert.equal(recordOwnResponse({ optionsRevealed: true }, 'independent').mode, 'supported');
assert.equal(recordOwnResponse({ responseForm: 'gesture' }, 'independent').mode, 'independent', 'An independent gesture is independent communication');

let copy = recordWritingStage({}, 'model', 'independent');
assert.equal(copy.done, false, 'Copying leaves a route to recall');
assert.equal(copy.stageResults.model.mode, 'independent');
assert.equal(copy.mode, 'supported', 'Independent copying is not spontaneous written naming');
const recall = recordWritingStage({ ...copy, stage: 'recall' }, 'recall', 'independent');
assert.equal(recall.done, true);
assert.equal(recall.stageResults.recall.mode, 'independent', 'Recall without fresh cues is distinct from the earlier model');
assert.equal(recall.stageResults.model.mode, 'independent');
assert.equal(recordWritingStage({ usedHint: true, writeHint: true, hint: false }, 'write', 'independent').stageResults.write.mode, 'supported');
assert.equal(recordWritingStage({ recallHint: true }, 'recall', 'independent').stageResults.recall.mode, 'supported');

const writingSession = createPracticeSession('writing', null, settingsAt(1));
let writingState = newProgress(writingSession);
writingState = therapyReducer(writingState, { type: 'progress', index: 0, progress: recall });
const restoredWriting = restoreProgress(JSON.stringify(writingState));
assert.deepEqual(restoredWriting.details[0].stageResults, recall.stageResults);
const totals = summarizeBlock(restoredWriting.session, restoredWriting.completed, restoredWriting.details, 'writing');
assert.equal(totals.supported, 1);
assert.deepEqual(totals.writing.map((entry) => entry.stage), ['model', 'recall']);
assert.equal(resultMode({ kind: 'choice' }, { done: true, attempts: 1 }), 'unknown', 'Legacy completion is not evidence of independence');

const ownSession = createPracticeSession('understanding', null, settingsAt(3));
let ownState = newProgress(ownSession);
ownState = therapyReducer(ownState, { type: 'progress', index: 0, progress: recordOwnResponse({}, 'independent') });
assert.equal(restoreProgress(JSON.stringify(ownState)).details[0].chosen, undefined, 'Reload must not invent a multiple-choice answer for a free response');
const unknown = summarizeBlock(ownSession, [true, false], { 0: { done: true } }, 'understanding');
assert.equal(unknown.unknown, 1);

const semanticSession = createPracticeSession('meaning', null, settingsAt(3));
const semanticDetails = { 0: { done: true, mode: 'supported', answers: [{ done: true, mode: 'supported', usedHint: true }], naming: recordOwnResponse({}, 'independent') } };
const semanticTotals = summarizeBlock(semanticSession, [true, false, false], semanticDetails, 'meaning');
assert.equal(semanticTotals.supported, 1);
assert.deepEqual(semanticTotals.naming, [{ word: semanticSession.tasks[0].word, mode: 'independent' }], 'Independent naming stays distinct from supported feature answers');
const attemptedFeatures = recordSemanticName({ answers: [recordOwnResponse({}, 'attempted')] }, false, 'independent');
assert.equal(attemptedFeatures.mode, 'attempted', 'An unfinished feature attempt must not be relabelled as assistance');
assert.equal(attemptedFeatures.naming.mode, 'independent');
assert.equal(recordSemanticName({ answers: [recordOwnResponse({}, 'independent')] }, true, 'independent').naming.mode, 'supported', 'Visible naming model is recorded as support');

for (let run = 0; run < 60; run += 1) {
  const simple = createTherapySession(1);
  assert.ok([simple.listen, ...simple.strongWords].every((word) => ['чай', 'вода', 'чоботи', 'чашка'].includes(word.word)));
  assert.equal(new Set(simple.strongWords.map((word) => word.word)).size, 4);
  const middle = createTherapySession(2);
  assert.ok([middle.listen, ...middle.strongWords].every((word) => !['вчасно', 'часто', 'чистий'].includes(word.word)));
}
console.log('Practice levels: arithmetic tiers, category operations, sequence lengths, cue history, writing stages, independent gestures and saved snapshots passed.');
