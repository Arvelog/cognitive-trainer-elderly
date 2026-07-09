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
  verbs: { scene: 'A woman cooking soup in a bright kitchen with vegetables and a pot on the stove' },
  reading: {
    phrases: [
      { context: 'Привітання', text: 'Доброго ранку!' },
      { context: 'Прохання', text: 'Дайте, будь ласка, води.' },
      { context: 'Подяка', text: 'Дякую вам за допомогу.' },
    ],
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

console.log(JSON.stringify({
  ok: true,
  aiSource: aiResult._source,
  localAnswerBlocks: aiResult._localAnswerBlocks,
  fallbackResult,
  openAiCalls,
}, null, 2));

await vite.close();
