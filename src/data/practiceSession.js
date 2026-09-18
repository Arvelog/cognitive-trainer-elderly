import { SESSION_STEPS } from './therapySession.js';

export const PRACTICE_BLOCKS = [
  { id: 'understanding', short: 'Розуміння', title: 'Слухаємо й читаємо', minutes: '2–3 хв', description: 'Слова, речення та їхній зміст.' },
  { id: 'meaning', short: 'Асоціації', title: 'Знаходимо зв’язки', minutes: '3–4 хв', description: 'Ознаки предметів, пари й категорії.' },
  { id: 'logic', short: 'Логіка', title: 'Думаємо по порядку', minutes: '2–3 хв', description: 'Послідовності зі щоденного життя.' },
  { id: 'numbers', short: 'Рахунок', title: 'Рахуємо в побуті', minutes: '2 хв', description: 'Додавання, віднімання й покупки в межах 20.' },
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
  choice('Скільки всього?', '8 + 5 = ?', '13', ['12', '13', '14'], { equation: true, hint: 'Розділіть 5 на 2 і 3. Спочатку 8 + 2 = 10. Додайте ще 3.' }),
  choice('Скільки залишилося?', '14 − 6 = ?', '8', ['7', '8', '9'], { equation: true, hint: 'Віднімайте 6 частинами: спочатку 4, потім ще 2. 14 − 4 = 10. Скільки буде 10 − 2?' }),
  choice('Скільки всього?', '9 + 7 = ?', '16', ['15', '16', '17'], { equation: true, hint: 'Розділіть 7 на 1 і 6. Спочатку 9 + 1 = 10. Додайте ще 6.' }),
  choice('Скільки всього?', '6 + 8 = ?', '14', ['13', '14', '15'], { equation: true, hint: 'Розділіть 8 на 4 і 4. Спочатку 6 + 4 = 10. Додайте ще 4.' }),
  choice('Скільки залишилося?', '16 − 7 = ?', '9', ['8', '9', '10'], { equation: true, hint: 'Віднімайте 7 частинами: спочатку 6, потім ще 1. 16 − 6 = 10. Відніміть ще 1.' }),
  choice('Скільки залишилося?', '18 − 9 = ?', '9', ['7', '9', '11'], { equation: true, hint: 'Віднімайте 9 частинами: спочатку 8, потім ще 1. 18 − 8 = 10. Відніміть ще 1.' }),
];
const EVERYDAY_NUMBERS = [
  choice('Скільки яблук разом?', 'У кошику 7 яблук. Додали ще 5.', '12 яблук', ['11 яблук', '12 яблук', '13 яблук'], { instruction: 'Додайте яблука й оберіть відповідь.', hint: 'Потрібно додати 7 + 5. До 7 додайте 3 — буде 10. Додайте ще 2.' }),
  choice('Скільки коштує разом?', 'Булочка — 8 грн. Сік — 6 грн.', '14 грн', ['12 грн', '14 грн', '16 грн'], { instruction: 'Уявна покупка. Оберіть загальну суму.', hint: 'Потрібно додати 8 + 6. До 8 додайте 2 — буде 10. Додайте ще 4.' }),
  choice('Скільки решти?', 'Покупка коштує 12 грн. Ви дали 20 грн.', '8 грн', ['6 грн', '8 грн', '10 грн'], { instruction: 'Уявна покупка. Скільки гривень вам повернуть?', hint: 'Потрібно відняти 20 − 12. Спочатку відніміть 10, потім ще 2.' }),
  choice('Скільки чашок ще потрібно?', 'Для 12 людей потрібно 12 чашок. На столі вже є 7.', '5 чашок', ['4 чашки', '5 чашок', '6 чашок'], { instruction: 'Оберіть, скільки чашок треба додати.', hint: 'Потрібно відняти 12 − 7. Спочатку відніміть 2 — буде 10. Відніміть ще 5.' }),
];

// Only untouched old problems are replaced; a recorded answer must keep its original problem.
const LEGACY_NUMBER_REPLACEMENTS = new Map([
  ['2 + 3 = ?', NUMBERS[0]], ['5 − 2 = ?', NUMBERS[1]], ['3 + 1 = ?', NUMBERS[2]],
  ['🍎  🍎  🍎', EVERYDAY_NUMBERS[0]],
  ['Хліб — 4 грн. Пакет — 1 грн.', EVERYDAY_NUMBERS[1]],
  ['Нас троє. На столі 2 чашки.', EVERYDAY_NUMBERS[3]],
]);
export function upgradeUntouchedNumberTask(task) {
  const replacement = task.block === 'numbers' && task.kind === 'choice' && LEGACY_NUMBER_REPLACEMENTS.get(task.stimulus);
  return replacement ? { ...replacement, id: task.id, block: task.block, options: shuffle(replacement.options) } : task;
}
export const WRITING_PICTURES = [
  { word: 'борщ', image: '/images/practice/01.webp', hint: 'Це страва з буряком. Її їдять ложкою.', first: 'Б', accepted: 'Борщ. Якщо вийшло «суп» — обговоріть назву разом: зображення можна сприйняти по-різному.' },
  { word: 'яблуко', image: '/images/practice/02.webp', hint: 'Це фрукт. Він росте на дереві.', first: 'Я', accepted: 'Яблуко.' },
  { word: 'ключ', image: '/images/practice/03.webp', hint: 'Цим відмикають двері.', first: 'К', accepted: 'Ключ.' },
];
const CONVERSATION = [
  {
    kind: 'conversation', scenario: 'help', title: 'Попросіть допомогти з ґудзиком',
    prompt: 'Зверніться до людини, з якою займаєтеся.',
    setup: 'Покладіть перед вами одяг із розстебнутим ґудзиком.',
    directions: ['Покажіть людині поруч на ґудзик.', 'Попросіть допомогти його застебнути — словом, фразою або жестом.'],
    partnerResponse: 'У відповідь на прохання допоможіть із ґудзиком.',
    model: 'Допоможи, будь ласка.', cue: 'Допоможи…',
    coach: 'Залиште час на власне прохання. Якщо важко — відкрийте початок фрази або приклад і скажіть разом. Відгукніться й на жест.',
  },
  {
    kind: 'conversation', scenario: 'pencil', title: 'Попросіть олівець',
    prompt: 'Зверніться до людини, з якою займаєтеся.',
    setup: 'Візьміть олівець у руку й тримайте так, щоб його було видно.',
    directions: ['Подивіться на олівець у руках людини поруч.', 'Попросіть її дати вам олівець — словом, фразою або жестом.'],
    partnerResponse: 'У відповідь на прохання передайте олівець.',
    model: 'Дай олівець, будь ласка.', cue: 'Дай…',
    coach: 'Не давайте олівець до спроби попросити. Достатньо слова «олівець» або зрозумілого жесту. Якщо важко — відкрийте приклад і промовте разом.',
  },
  {
    kind: 'conversation', scenario: 'rest', title: 'Попросіть зробити перерву',
    prompt: 'Зверніться до людини, з якою займаєтеся.',
    setup: 'Скажіть: «Потренуймо, як попросити зробити перерву».',
    directions: ['Подивіться на людину поруч.', 'Повідомте їй, що хочете відпочити — словом, фразою або жестом.'],
    partnerResponse: 'Підтвердьте, що зрозуміли прохання, і запропонуйте перепочити.',
    model: 'Хочу відпочити.', cue: 'Хочу…',
    coach: 'Власне формулювання або жест теж підходять. Якщо потрібна справжня перерва, зробіть її. Не вимагайте повторити зразок дослівно.',
  },
];
const STORY = {
  kind: 'conversation', scenario: 'scene', title: 'Розкажіть про малюнок',
  image: '/images/scenes/woman-cooking.jpg', prompt: 'Розкажіть людині поруч, що ви бачите.',
  setup: 'Покажіть малюнок. Ставте запитання нижче по одному й чекайте на відповідь.',
  directions: ['Хто зображений на малюнку? Назвіть або покажіть.', 'Що ця людина робить? Скажіть слово, фразу або покажіть дію жестом.'],
  partnerResponse: 'Повторіть те, що зрозуміли з відповіді. За бажанням додайте одне слово й скажіть разом.',
  model: 'Жінка готує їжу на кухні.', cue: 'Жінка…',
  coach: 'Не обов’язково складати ціле речення. Приймайте власну відповідь, одне слово або жест. Зразок відкривайте лише за потреби.',
};

// Sessions contain task snapshots. Refresh the instructions when an older session resumes.
export function clarifyConversationTask(task) {
  if (task.kind !== 'conversation') return task;
  const current = [...CONVERSATION, STORY].find((item) => task.scenario ? item.scenario === task.scenario : item.model === task.model);
  if (!current) return task;
  const { situation, ...saved } = task;
  return { ...saved, ...current };
}
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export function createPracticeSession(blockId = null, previousSession = null) {
  const previousFirstImage = previousSession?.tasks?.find((task) => task.kind === 'writing')?.image;
  const firstPicture = pick(WRITING_PICTURES.filter((picture) => picture.image !== previousFirstImage));
  const secondPicture = pick(WRITING_PICTURES.filter((picture) => picture.image !== firstPicture.image));
  const groups = [
    [pick(UNDERSTANDING), pick(READING)],
    [pick(FEATURES), pick(ASSOCIATIONS), pick(CATEGORIES)],
    [pick(SEQUENCES), pick(LOGIC)],
    [pick(NUMBERS), pick(EVERYDAY_NUMBERS)],
    [{ kind: 'writing', title: 'Напишіть назву малюнка', ...firstPicture }, { kind: 'writing', title: 'Ще одне слово в зошиті', ...secondPicture }],
    [pick(CONVERSATION), STORY],
  ];
  const tasks = groups.flatMap((group, i) => group.map((task, j) => ({
    ...task, block: PRACTICE_BLOCKS[i].id, id: `${PRACTICE_BLOCKS[i].id}-${j}`,
    ...(task.options ? { options: shuffle(task.options) } : {}),
    ...(task.steps ? { choices: shuffle(task.steps) } : {}),
  }))).filter((task) => !blockId || task.block === blockId);
  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, mode: 'extended', blockId, tasks, createdAt: new Date().toISOString() };
}

export const getSessionSteps = (session) => session?.mode === 'extended' ? session.tasks.map(clarifyConversationTask) : SESSION_STEPS;
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
