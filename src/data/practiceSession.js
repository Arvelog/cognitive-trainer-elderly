import { SESSION_STEPS } from './therapySession.js';

export const PRACTICE_BLOCKS = [
  { id: 'understanding', short: 'Розуміння', title: 'Слухаємо й читаємо', minutes: '2–3 хв', description: 'Слова, речення та їхній зміст.' },
  { id: 'meaning', short: 'Асоціації', title: 'Знаходимо зв’язки', minutes: '3–4 хв', description: 'Ознаки предметів, пари й категорії.' },
  { id: 'logic', short: 'Логіка', title: 'Думаємо по порядку', minutes: '2–3 хв', description: 'Послідовності зі щоденного життя.' },
  { id: 'numbers', short: 'Рахунок', title: 'Рахуємо в побуті', minutes: '2 хв', description: 'Кількість і прості приклади до 10.' },
  { id: 'writing', short: 'Письмо', title: 'Пишемо в зошиті', minutes: '4–5 хв', description: 'Малюнок → слово. За потреби — зразок.' },
  { id: 'communication', short: 'Розмова', title: 'Спілкуємося разом', minutes: '2–3 хв', description: 'Прохання та власна коротка розповідь.' },
];

const choice = (title, stimulus, answer, options, extra = {}) => ({ kind: 'choice', title, stimulus, answer, options, ...extra });
const UNDERSTANDING = [
  choice('Що потрібно, коли дощить?', 'Надворі дощ.', 'парасоля', ['парасоля', 'подушка'], { emoji: '🌧️', instruction: 'Прочитайте або послухайте. Оберіть відповідь.' }),
  choice('Що потрібно, щоб читати?', 'Я хочу прочитати історію.', 'книга', ['ложка', 'книга'], { emoji: '📖' }),
  choice('Що допоможе в темряві?', 'У кімнаті темно.', 'лампа', ['лампа', 'рушник'], { emoji: '💡' }),
];
const READING = [
  choice('Оберіть потрібне слово', 'Яблуко — це фрукт.', 'фрукт', ['одяг', 'фрукт'], { instruction: 'Прочитайте речення. Що таке яблуко?' }),
  choice('Оберіть потрібне слово', 'Хліб лежить на столі.', 'на столі', ['у шафі', 'на столі'], { instruction: 'Прочитайте речення. Де хліб?' }),
  choice('Оберіть потрібне слово', 'Олена читає книгу.', 'читає', ['читає', 'спить'], { instruction: 'Прочитайте речення. Що робить Олена?' }),
];
const FEATURES = [
  { kind: 'semantic', title: 'Розкажімо про предмет', word: 'парасоля', emoji: '☂️', questions: [
    { prompt: 'Коли потрібна?', answer: 'під час дощу', options: ['під час дощу', 'під час сну'] },
    { prompt: 'Від чого захищає під дощем?', answer: 'від води', options: ['від шуму', 'від води'] },
    { prompt: 'Де її тримають, коли йдуть?', answer: 'у руці', options: ['у руці', 'на тарілці'] },
  ] },
  { kind: 'semantic', title: 'Розкажімо про предмет', word: 'ложка', emoji: '🥄', questions: [
    { prompt: 'До чого належить?', answer: 'столове приладдя', options: ['одяг', 'столове приладдя'] },
    { prompt: 'Що нею роблять?', answer: 'їдять суп', options: ['їдять суп', 'пишуть'] },
    { prompt: 'Де нею користуються?', answer: 'за столом', options: ['у ліжку під час сну', 'за столом'] },
  ] },
];
const ASSOCIATIONS = [
  choice('Що підходить разом?', 'Ключ + …', 'замок', ['замок', 'тарілка'], { emoji: '🔑' }),
  choice('Що підходить разом?', 'Олівець + …', 'зошит', ['подушка', 'зошит'], { emoji: '✏️' }),
  choice('Що підходить разом?', 'Зубна щітка + …', 'паста', ['паста', 'сіль'], { emoji: '🪥' }),
];
const CATEGORIES = [
  choice('Назвіть одним словом', 'Яблуко · груша · слива', 'фрукти', ['фрукти', 'меблі']),
  choice('Що тут не є посудом?', 'Чашка · тарілка · шапка', 'шапка', ['тарілка', 'шапка', 'чашка']),
  choice('Назвіть одним словом', 'Стіл · стілець · шафа', 'меблі', ['овочі', 'меблі']),
  choice('Що тут не є овочем?', 'Морква · цибуля · черевик', 'черевик', ['морква', 'цибуля', 'черевик']),
];
const SEQUENCES = [
  { kind: 'sequence', title: 'Миємо руки', steps: ['Намочити руки', 'Намилити руки', 'Змити мило'], instruction: 'Торкніться дій по черзі. Що спочатку?' },
  { kind: 'sequence', title: 'Надсилаємо лист', steps: ['Написати лист', 'Покласти в конверт', 'Відправити'], instruction: 'Торкніться дій по черзі. Що спочатку?' },
  { kind: 'sequence', title: 'Малюємо олівцем', steps: ['Взяти олівець', 'Намалювати коло', 'Відкласти олівець'], instruction: 'Торкніться дій по черзі. Що спочатку?' },
];
const LOGIC = [
  choice('Що зробити далі?', 'Руки помиті й мокрі.', 'витерти рушником', ['витерти рушником', 'одягнути рукавички']),
  choice('Що потрібно знайти?', 'Хочемо відчинити замкнені двері.', 'ключ', ['ложку', 'ключ']),
  choice('Що зробити спочатку?', 'Хочемо написати слово в зошиті.', 'відкрити зошит', ['закрити зошит', 'відкрити зошит']),
];
const NUMBERS = [
  choice('Скільки всього?', '2 + 3 = ?', '5', ['4', '5', '6'], { equation: true, dots: [2, 3], hint: 'Покладіть 2 олівці, додайте ще 3. Порахуйте разом.' }),
  choice('Скільки залишилося?', '5 − 2 = ?', '3', ['3', '4', '2'], { equation: true, hint: 'Покладіть 5 олівців. Заберіть 2 й порахуйте решту.' }),
  choice('Скільки всього?', '3 + 1 = ?', '4', ['5', '3', '4'], { equation: true, dots: [3, 1], hint: 'До 3 олівців додайте ще один. Порахуйте всі.' }),
];
const EVERYDAY_NUMBERS = [
  choice('Скільки яблук?', '🍎  🍎  🍎', '3', ['2', '3', '4'], { instruction: 'Порахуйте й оберіть число.', visualCount: true }),
  choice('Скільки коштує разом?', 'Хліб — 4 грн. Пакет — 1 грн.', '5 грн', ['4 грн', '6 грн', '5 грн'], { instruction: 'Уявна покупка. Оберіть загальну суму.', hint: 'Складіть 4 + 1. Можна рахувати на пальцях.' }),
  choice('Скільки чашок ще потрібно?', 'Нас троє. На столі 2 чашки.', '1 чашка', ['1 чашка', '3 чашки'], { hint: 'Покажіть 3 пальці. Дві чашки вже є.' }),
];
export const WRITING_PICTURES = [
  { word: 'борщ', image: '/images/practice/01.webp', hint: 'Це страва з буряком. Її їдять ложкою.', first: 'Б', accepted: 'Борщ. Якщо вийшло «суп» — обговоріть назву разом: зображення можна сприйняти по-різному.' },
  { word: 'яблуко', image: '/images/practice/02.webp', hint: 'Це фрукт. Він росте на дереві.', first: 'Я', accepted: 'Яблуко.' },
  { word: 'ключ', image: '/images/practice/03.webp', hint: 'Цим відмикають двері.', first: 'К', accepted: 'Ключ.' },
];
const CONVERSATION = [
  { kind: 'conversation', title: 'Попросіть про допомогу', situation: 'Потрібна допомога з ґудзиком.', prompt: 'Як покликати людину поруч?', model: 'Допоможи, будь ласка.', cue: 'Допоможи…', coach: 'Зіграйте короткий діалог. Відгукніться на прохання. Приймайте власну фразу, жест або вказування.' },
  { kind: 'conversation', title: 'Попросіть потрібну річ', situation: 'Ви хочете написати щось у зошиті.', prompt: 'Попросіть олівець.', model: 'Дай олівець, будь ласка.', cue: 'Дай…', coach: 'Покладіть олівець поруч. Після прохання передайте його: фраза має живий зміст. Приймайте жест.' },
  { kind: 'conversation', title: 'Скажіть про свій вибір', situation: 'Людина поруч пропонує ще одну вправу.', prompt: 'Попросіть відпочити.', model: 'Хочу відпочити.', cue: 'Хочу…', coach: 'Запитайте, чи справді потрібна перерва, і поважайте відповідь. Не вимагайте точної фрази зі зразка.' },
];
const STORY = { kind: 'conversation', title: 'Розкажіть про малюнок', image: '/images/scenes/woman-cooking.jpg', situation: 'Подивіться на сцену.', prompt: 'Хто тут? Що робить?', model: 'Жінка готує їжу на кухні.', cue: 'Жінка…', coach: 'Прийміть одне слово або жест. Додайте до відповіді одне слово й запропонуйте сказати разом. Запитайте: «Що ви любите готувати?»' };
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export function createPracticeSession(blockId = null) {
  const groups = [
    [pick(UNDERSTANDING), pick(READING)],
    [pick(FEATURES), pick(ASSOCIATIONS), pick(CATEGORIES)],
    [pick(SEQUENCES), pick(LOGIC)],
    [pick(NUMBERS), pick(EVERYDAY_NUMBERS)],
    [{ kind: 'writing', title: 'Напишіть назву малюнка', ...WRITING_PICTURES[0] }, { kind: 'writing', title: 'Ще одне слово в зошиті', ...pick(WRITING_PICTURES.slice(1)) }],
    [pick(CONVERSATION), STORY],
  ];
  const tasks = groups.flatMap((group, i) => group.map((task, j) => ({
    ...task, block: PRACTICE_BLOCKS[i].id, id: `${PRACTICE_BLOCKS[i].id}-${j}`,
    ...(task.options ? { options: shuffle(task.options) } : {}),
    ...(task.steps ? { choices: shuffle(task.steps) } : {}),
  }))).filter((task) => !blockId || task.block === blockId);
  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, mode: 'extended', blockId, tasks, createdAt: new Date().toISOString() };
}

export const getSessionSteps = (session) => session?.mode === 'extended' ? session.tasks : SESSION_STEPS;
export const getSessionBlocks = (session) => session?.mode === 'extended'
  ? PRACTICE_BLOCKS.filter((block) => session.tasks.some((task) => task.block === block.id)) : SESSION_STEPS;
export const getStepCount = (session) => getSessionSteps(session).length;

export function validPracticeSession(session) {
  if (!Array.isArray(session.tasks) || !session.tasks.length || session.tasks.length > 30) return false;
  return session.tasks.every((task) => {
    if (!task || !PRACTICE_BLOCKS.some((block) => block.id === task.block)) return false;
    if (task.kind === 'choice') return Array.isArray(task.options) && task.options.includes(task.answer);
    if (task.kind === 'semantic') return Array.isArray(task.questions) && task.questions.length > 0 && task.questions.every((q) => q.options?.includes(q.answer));
    if (task.kind === 'sequence') return Array.isArray(task.steps) && task.steps.length > 0 && Array.isArray(task.choices) && task.choices.length === task.steps.length && new Set(task.choices).size === task.steps.length && task.steps.every((step) => task.choices.includes(step));
    if (task.kind === 'writing') return typeof task.word === 'string' && Boolean(task.image);
    return task.kind === 'conversation' && typeof task.model === 'string';
  });
}
