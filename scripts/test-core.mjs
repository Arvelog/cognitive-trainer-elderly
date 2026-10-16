import assert from 'node:assert/strict';
import { normalizeRotationIndex, splitSentenceWords } from '../src/lib/taskState.js';

const rotationCases = [
  [null, 2, 0],
  ['garbage', 2, 0],
  [-1, 2, 0],
  [1.5, 2, 0],
  [0, 2, 0],
  [1, 2, 1],
  [2, 2, 0],
  [7, 2, 1],
];

rotationCases.forEach(([value, groups, expected]) => {
  assert.equal(normalizeRotationIndex(value, groups), expected);
});

assert.deepEqual(
  splitSentenceWords('  Жінка   наливає\nчай\tу чашку  '),
  ['Жінка', 'наливає', 'чай', 'у', 'чашку'],
);
assert.deepEqual(splitSentenceWords('   '), []);

const sceneRoute = await import('../api/generate-image.js');
const taskImageRoute = await import('../api/generate-task-images.js');
assert.equal(typeof sceneRoute.POST, 'function');
assert.equal(typeof taskImageRoute.POST, 'function');
assert.equal(sceneRoute.default, undefined);
assert.equal(taskImageRoute.default, undefined);

process.env.OPENAI_API_KEY = 'test-key';
const routeHeaders = {
  'content-type': 'application/json',
  origin: 'https://app.example',
  host: 'app.example',
  'sec-fetch-site': 'same-origin',
  'x-forwarded-for': '192.0.2.10',
};
const makeImageItem = (id) => ({ id, label: `Предмет ${id}`, prompt: `Simple object ${id}` });
const oversizedBatchResponse = await taskImageRoute.POST(new Request('https://app.example/api/generate-task-images', {
  method: 'POST',
  headers: routeHeaders,
  body: JSON.stringify({ task: 6, items: [makeImageItem('1'), makeImageItem('2'), makeImageItem('3')] }),
}));
assert.equal(oversizedBatchResponse.status, 400);

const oversizedLabelResponse = await taskImageRoute.POST(new Request('https://app.example/api/generate-task-images', {
  method: 'POST',
  headers: routeHeaders,
  body: JSON.stringify({ task: 6, items: [{ id: 'valid-id', label: 'А'.repeat(81), prompt: 'Simple object' }] }),
}));
assert.equal(oversizedLabelResponse.status, 400);

console.log(JSON.stringify({ ok: true, rotationCases: rotationCases.length, sentenceCases: 2, vercelRouteContracts: 2, imageBoundaryCases: 2 }, null, 2));
