const createLocalStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
};

globalThis.window = {
  localStorage: createLocalStorage(),
};

const validAiPayload = {
  matchWord: { word: 'Заварити чай' },
  sequence: { title: 'Ранковий чай', steps: ['Налити воду', 'Закип\'ятити воду', 'Покласти чай у чашку', 'Налити гарячу воду'] },
  naming: { word: 'чашка', emoji: '☕', category: 'посуд', use: 'з неї п\'ють чай', place: 'на кухні', firstLetter: 'Ч', syllables: 2 },
  sentence: { sentences: ['Жінка наливає чай у чашку', 'Кіт спить на м\'якій подушці', 'Онука телефонує своїй бабусі'] },
  associations: {
    q: 'Що стосується чашки?',
    correct: ['☕ З неї п\'ють', '🍽️ Це посуд', '🏠 Вона є на кухні'],
    wrong: ['🚗 Нею їздять', '✂️ Нею ріжуть', '👟 Її взувають'],
  },
  categories: {
    groupLabels: ['Кухня', 'Ванна', 'Сад'],
    groupIcons: ['🍲', '🛁', '🌱'],
    items: [
      { text: '🥄 ложка', group: 0 },
      { text: '☕ чашка', group: 0 },
      { text: '🧼 мило', group: 1 },
      { text: '🧺 рушник', group: 1 },
      { text: '🪴 лійка', group: 2 },
      { text: '🪏 лопата', group: 2 },
    ],
  },
  trueFalse: {
    statements: [
      { text: 'Чай наливають у чашку', answer: true },
      { text: 'Черевики одягають на руки', answer: false },
      { text: 'Ключем відчиняють двері', answer: true },
    ],
  },
  phraseCompletion: {
    items: [
      { text: 'Чай наливають у ...', answer: 'чашку', options: ['чашку', 'шафу', 'подушку'] },
      { text: 'Двері відчиняють ...', answer: 'ключем', options: ['ключем', 'ложкою', 'рушником'] },
      { text: 'Перед сном я лягаю у ...', answer: 'ліжко', options: ['ліжко', 'магазин', 'автобус'] },
    ],
  },
  writing: {
    words: [
      { word: 'ЧАШКА', emoji: '☕', hint: 'З неї п\'ють чай' },
      { word: 'КЛЮЧ', emoji: '🔑', hint: 'Ним відчиняють двері' },
      { word: 'МИЛО', emoji: '🧼', hint: 'Ним миють руки' },
    ],
  },
  verbs: {
    title: 'Жінка готує суп',
    context: 'Що відбувається на цій сцені?',
    scene: 'A mature woman cooking soup in a bright home kitchen, stirring a pot on the stove with vegetables nearby',
    correct: ['Жінка готує суп', 'Вона помішує суп у каструлі', 'Жінка стоїть на кухні'],
    wrong: ['Чоловік ремонтує машину', 'Люди чекають на автобус', 'Дівчина читає книгу в парку'],
  },
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const { createServer: createViteServer } = await import('vite');
const vite = await createViteServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
});

const { generateAllTasks } = await vite.ssrLoadModule('/src/lib/generate.js');

globalThis.fetch = async () =>
  new Response(JSON.stringify(validAiPayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const aiResult = await generateAllTasks();
assert(aiResult?._source === 'ai', 'Expected valid AI response to be marked as ai');
assert(aiResult?._localAnswerBlocks?.includes('matchWord'), 'Expected matchWord to be marked as trusted local answers');
assert(aiResult?.matchWord?.prompt === 'Заварити чай', 'Expected trusted matchWord prompt from AI-selected word');
assert(aiResult?.verbs?.correct?.length === 3, 'Expected AI scene plan and matching answers to be preserved');

globalThis.fetch = async () => new Response('', { status: 404 });
const fallbackResult = await generateAllTasks();
assert(fallbackResult === null, 'Expected failed backend response to trigger app-level fallback');

process.env.OPENAI_API_KEY = 'test-key';
const openAiCalls = [];
globalThis.fetch = async (url, options) => {
  const body = JSON.parse(options.body);
  openAiCalls.push({ url: String(url), model: body.model });
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validAiPayload) } }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

const { default: generateHandler } = await import('../api/generate.js');
const handlerResponse = await generateHandler(new Request('https://app.example/api/generate', {
  method: 'POST',
  headers: {
    origin: 'https://app.example',
    host: 'app.example',
    'sec-fetch-site': 'same-origin',
  },
}));

assert(handlerResponse.status === 200, 'Expected /api/generate handler to return 200 with mocked OpenAI');
assert(openAiCalls[0]?.url === 'https://api.openai.com/v1/chat/completions', 'Expected /api/generate to call OpenAI chat completions');

const imageCalls = [];
globalThis.fetch = async (url, options) => {
  const body = JSON.parse(options.body);
  imageCalls.push({ url: String(url), ...body });
  return new Response(JSON.stringify({ data: [{ b64_json: 'dGVzdC1pbWFnZQ==' }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

const { default: generateImageHandler } = await import('../api/generate-image.js');
const imageHandlerResponse = await generateImageHandler(new Request('https://app.example/api/generate-image', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    origin: 'https://app.example',
    host: 'app.example',
    'sec-fetch-site': 'same-origin',
  },
  body: JSON.stringify({ prompt: validAiPayload.verbs.scene }),
}));
const imageHandlerPayload = await imageHandlerResponse.json();

assert(imageHandlerResponse.status === 200, 'Expected /api/generate-image handler to return 200 with mocked OpenAI');
assert(imageCalls.length === 1, 'Expected scene generation to use one image request without a second Vision call');
assert(imageCalls[0]?.model === 'gpt-image-1.5', 'Expected the current GPT Image model for scene generation');
assert(imageCalls[0]?.size === '1536x1024', 'Expected a landscape image for the scene exercise');
assert(imageHandlerPayload.url === 'data:image/webp;base64,dGVzdC1pbWFnZQ==', 'Expected a durable WebP data URL');

console.log(JSON.stringify({
  ok: true,
  aiSource: aiResult._source,
  localAnswerBlocks: aiResult._localAnswerBlocks,
  fallbackResult,
  openAiCalls,
  imageModel: imageCalls[0]?.model,
  imageRequestCount: imageCalls.length,
}, null, 2));

await vite.close();
