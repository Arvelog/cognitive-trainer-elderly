import { SESSION_STEPS } from './therapySession.js';
import { levelLabel, normalizePracticeSettings } from './practiceLevels.js';
import { CATEGORY_CONTEXTS, CONTEXTS, DECISIONS, DIALOGUES, ITEM_FEATURES, NUMBER_CONTEXTS, PLANS, READING_CONTEXTS, RELATIONS, WRITTEN_MESSAGES } from './richerPractice.js';

export const PRACTICE_BLOCKS = [
  { id: 'understanding', short: 'Розуміння', title: 'Слухаємо й читаємо', minutes: '2–4 хв', description: 'Слова, повідомлення, зміна планів і висновки.' },
  { id: 'meaning', short: 'Асоціації', title: 'Знаходимо зв’язки', minutes: '3–5 хв', description: 'Ознаки, порівняння та вибір за призначенням.' },
  { id: 'logic', short: 'Логіка', title: 'Думаємо по порядку', minutes: '3–5 хв', description: 'Планування справ, умови й пояснення рішення.' },
  { id: 'numbers', short: 'Рахунок', title: 'Рахуємо в побуті', minutes: '3–4 хв', description: 'Приклади, бюджет, покупки, решта й час.' },
  { id: 'writing', short: 'Письмо', title: 'Пишемо в зошиті', minutes: '4–6 хв', description: 'Від назви предмета до речення й власного повідомлення.' },
  { id: 'communication', short: 'Розмова', title: 'Спілкуємося разом', minutes: '3–5 хв', description: 'Прохання, уточнення та домовленості в діалозі.' },
];

const choice = (title, stimulus, answer, options, extra = {}) => ({ kind: 'choice', title, stimulus, answer, options, ...extra });
const UNDERSTANDING = [
  choice('Що потрібно, коли дощить?', 'Надворі дощ.', 'парасоля', ['парасоля', 'подушка'], { emoji: '🌧️', instruction: 'Прочитайте або послухайте. Оберіть відповідь.' }),
  choice('Що потрібно, щоб читати?', 'Я хочу прочитати історію.', 'книга', ['ложка', 'книга'], { emoji: '📖' }),
  choice('Що допоможе в темряві?', 'У кімнаті темно.', 'лампа', ['лампа', 'рушник'], { emoji: '💡' }),
];
const READING = [
  choice('Оберіть потрібне слово', 'Яблуко — це фрукт.', 'фрукт', ['одяг', 'фрукт'], { question: 'Що таке яблуко?', instruction: 'Прочитайте речення. Що таке яблуко?' }),
  choice('Оберіть потрібне слово', 'Хліб лежить на столі.', 'на столі', ['у шафі', 'на столі'], { question: 'Де хліб?', instruction: 'Прочитайте речення. Де хліб?' }),
  choice('Оберіть потрібне слово', 'Олена читає книгу.', 'читає', ['читає', 'спить'], { question: 'Що робить Олена?', instruction: 'Прочитайте речення. Що робить Олена?' }),
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

const EASY_NUMBERS = [
  choice('Скільки всього?', '2 + 3 = ?', '5', ['4', '5'], { equation: true, counters: [2, 3], operator: '+', hintSteps: ['Порахуйте дві крапки.', 'Додайте ще три. Порахуйте всі крапки.'] }),
  choice('Скільки залишилося?', '5 − 2 = ?', '3', ['3', '4'], { equation: true, counters: [5, 2], operator: '−', hintSteps: ['Візьміть п’ять олівців.', 'Відкладіть два. Порахуйте, скільки залишилося.'] }),
  choice('Скільки всього?', '4 + 2 = ?', '6', ['5', '6'], { equation: true, counters: [4, 2], operator: '+', hintSteps: ['Порахуйте чотири крапки.', 'Додайте ще дві. Порахуйте всі крапки.'] }),
];
const MID_NUMBERS = [
  choice('Скільки всього?', '12 + 3 = ?', '15', ['14', '15', '16'], { equation: true, hintSteps: ['Почніть із 12.', 'Додайте три одиниці по одній.'] }),
  choice('Скільки залишилося?', '17 − 4 = ?', '13', ['12', '13', '14'], { equation: true, hintSteps: ['Почніть із 17.', 'Відніміть чотири одиниці по одній.'] }),
  choice('Скільки всього?', '11 + 6 = ?', '17', ['16', '17', '18'], { equation: true, hintSteps: ['Почніть із 11.', 'Додайте шість одиниць. Десяток залишається.'] }),
];
const EASY_EVERYDAY = [
  choice('Скільки яблук разом?', 'Було 3 яблука.\nДодали ще 2.', '5 яблук', ['4 яблука', '5 яблук'], { counters: [3, 2], operator: '+', hintSteps: ['Порахуйте три яблука або три олівці.', 'Додайте два. Скільки тепер разом?'] }),
  choice('Скільки чашок залишилося?', 'Було 6 чашок.\nПрибрали 2.', '4 чашки', ['3 чашки', '4 чашки'], { counters: [6, 2], operator: '−', hintSteps: ['Візьміть шість предметів.', 'Приберіть два. Порахуйте решту.'] }),
];
const MID_EVERYDAY = [
  choice('Скільки яблук разом?', 'Було 12 яблук.\nДодали ще 3.', '15 яблук', ['14 яблук', '15 яблук', '16 яблук'], { hintSteps: ['Потрібно додати 12 + 3.', 'Додайте три одиниці до 12.'] }),
  choice('Скільки чашок залишилося?', 'Було 17 чашок.\nПрибрали 4.', '13 чашок', ['12 чашок', '13 чашок', '14 чашок'], { hintSteps: ['Потрібно відняти 17 − 4.', 'Відніміть чотири одиниці від 17.'] }),
];

const EXTRA_CHOICES = {
  парасоля: 'сумка', книга: 'закладка', лампа: 'дзеркало', фрукт: 'овоч', 'на столі': 'під столом', читає: 'пише',
  замок: 'кнопка', зошит: 'рушник', паста: 'цукор', фрукти: 'овочі', меблі: 'посуд',
  'витерти рушником': 'намилити руки', ключ: 'ручку', 'відкрити зошит': 'взяти олівець',
};
const SEQUENCE_EXTENSIONS = {
  'Миємо руки': ['Намочити руки', 'Намилити руки', 'Змити мило', 'Витерти руки'],
  'Надсилаємо лист': ['Написати лист', 'Покласти в конверт', 'Заклеїти конверт', 'Відправити'],
  'Малюємо олівцем': ['Взяти олівець', 'Намалювати коло', 'Зафарбувати коло', 'Відкласти олівець'],
};

function prepareTask(source, block, level) {
  let task = { ...source, level, levelLabel: levelLabel(block, level), curriculumVersion: 3 };
  if (task.kind === 'choice') {
    if (block === 'logic' && task.answer === 'відкрити зошит' && level > 1) task.stimulus = 'Зошит закритий. Хочемо побачити чисту сторінку.';
    if (block !== 'numbers' && level > 1 && task.options.length === 2 && EXTRA_CHOICES[task.answer]) {
      task.options = [...task.options, EXTRA_CHOICES[task.answer]];
    }
    task.ownResponse = level === 3 && block !== 'numbers';
    if (task.ownResponse) {
      task.instruction = 'Спробуйте відповісти словом, письмом або жестом. Варіанти можна відкрити за потреби.';
      if (task.title.startsWith('Оберіть')) task.title = task.question || 'Дайте відповідь на запитання';
    }
    if (block === 'numbers') {
      task.stimulus = task.stimulus.replace(/\. (?=[А-ЯІЇЄҐ])/g, '.\n');
      task.hintSteps = task.hintSteps || task.hint?.split(/(?<=[.!?])\s+/);
    }
    task.options = shuffle(task.options);
  }
  if (task.kind === 'reasoning') {
    task.instruction = 'Прочитайте або послухайте ситуацію. Відповідайте на одне запитання за раз.';
    task.questions = task.questions.map((q) => ({ ...q, ownResponse: level === 3 && block !== 'numbers', options: shuffle(q.options) }));
  }
  if (task.kind === 'semantic') {
    task.title = level === 1 ? 'Оберіть ознаки предмета' : 'Знайдіть ознаки й назвіть предмет';
    task.showWord = level === 1;
    task.questions = task.questions.map((q) => ({ ...q, options: shuffle(q.options) }));
  }
  if (task.kind === 'sequence') {
    task.steps = level === 1 ? task.steps.slice(-2) : level === 3 ? task.longerSteps || SEQUENCE_EXTENSIONS[task.title] : [...task.steps];
    task.validOrders = level === 3 && task.stepOrders ? task.stepOrders.map((order) => order.map((index) => task.steps[index])) : [task.steps];
    task.instruction = task.stimulus ? 'Прочитайте умови. Оберіть дії в порядку, який виконає цей план.' : task.instruction;
    task.choices = shuffle(task.steps);
  }
  if (task.kind === 'writing') {
    task.startStage = level === 1 ? 'model' : 'write';
    if (level === 2) {
      task.title = 'Напишіть назву й коротке речення';
      task.writingGoal = 'Напишіть назву предмета. Потім додайте коротке речення: що з ним роблять або для чого він потрібен.';
      task.modelText = { борщ: 'Борщ їдять ложкою.', яблуко: 'Яблуко росте на дереві.', ключ: 'Ключем відмикають двері.' }[task.word];
      task.accepted = 'Це один приклад речення. Власне зрозуміле речення про предмет теж підходить.';
    }
  }
  if (task.kind === 'conversation') {
    task.responseGoal = ['Достатньо показати або сказати одне слово.', 'Скажіть слово або коротку фразу. Жест теж підходить.', 'Спробуйте фразу. За бажанням додайте одну подробицю.'][level - 1];
    if (task.guided) {
      task.directions = level === 2 ? task.directions.slice(0, 2) : [...task.directions];
      task.responseGoal = 'Передайте потрібні деталі своїми словами. Можна доповнити відповідь письмом або жестом.';
    }
    if (task.scenario === 'scene') {
      task.title = level === 1 ? 'Назвіть або покажіть людину на малюнку' : 'Назвіть людину й дію на малюнку';
      task.prompt = 'Подивіться на малюнок. Одне запитання за раз.';
      task.directions = level === 1 ? [source.directions[0]] : [...source.directions];
      if (level === 3) task.directions.push('Де вона готує? Скажіть або покажіть одну подробицю.');
    }
  }
  return task;
}

// Only untouched old problems are replaced; a recorded answer must keep its original problem.
const LEGACY_NUMBER_REPLACEMENTS = new Map([
  ['2 + 3 = ?', NUMBERS[0]], ['5 − 2 = ?', NUMBERS[1]], ['3 + 1 = ?', NUMBERS[2]],
  ['🍎  🍎  🍎', EVERYDAY_NUMBERS[0]],
  ['Хліб — 4 грн. Пакет — 1 грн.', EVERYDAY_NUMBERS[1]],
  ['Нас троє. На столі 2 чашки.', EVERYDAY_NUMBERS[3]],
]);
export function upgradeUntouchedNumberTask(task) {
  if (task.curriculumVersion >= 2) return task;
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
  if (task.kind !== 'conversation' || task.curriculumVersion >= 2) return task;
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

export function createPracticeSession(blockId = null, previousSession = null, settings = null) {
  const profile = normalizePracticeSettings(settings);
  const levels = profile.blocks;
  const previousFirstImage = previousSession?.tasks?.find((task) => task.kind === 'writing')?.image;
  const firstPicture = pick(WRITING_PICTURES.filter((picture) => picture.image !== previousFirstImage));
  const secondPicture = pick(WRITING_PICTURES.filter((picture) => picture.image !== firstPicture.image));
  const fresh = (items, block, slot, except = null) => {
    const previous = previousSession?.tasks?.find((task) => task.id === `${block}-${slot}`)?.contentId;
    const candidates = items.filter((item) => !item.contentId || (item.contentId !== previous && item.contentId !== except));
    return pick(candidates.length ? candidates : items);
  };
  const choose = (items, block, slot) => fresh(items, block, slot);
  const firstMessage = choose(WRITTEN_MESSAGES, 'writing', 0);
  const secondMessage = fresh(WRITTEN_MESSAGES, 'writing', 1, firstMessage.contentId);
  const firstDialogue = choose(DIALOGUES, 'communication', 0);
  const secondDialogue = fresh(DIALOGUES, 'communication', 1, firstDialogue.contentId);
  const categories = levels.meaning === 1 ? CATEGORIES.filter((task) => task.options.length === 2).map((task) => ({ ...task, title: 'Оберіть спільну назву' })) : CATEGORY_CONTEXTS[levels.meaning];
  const groups = [
    [choose(levels.understanding === 1 ? UNDERSTANDING : CONTEXTS[levels.understanding], 'understanding', 0), choose(levels.understanding === 1 ? READING : READING_CONTEXTS[levels.understanding], 'understanding', 1)],
    [choose(levels.meaning === 1 ? FEATURES : ITEM_FEATURES, 'meaning', 0), choose(levels.meaning === 1 ? ASSOCIATIONS : RELATIONS[levels.meaning], 'meaning', 1), choose(categories, 'meaning', 2)],
    [choose(levels.logic === 1 ? SEQUENCES : PLANS, 'logic', 0), choose(levels.logic === 1 ? LOGIC : DECISIONS[levels.logic], 'logic', 1)],
    [pick([EASY_NUMBERS, MID_NUMBERS, NUMBERS][levels.numbers - 1]), choose([EASY_EVERYDAY, MID_EVERYDAY, NUMBER_CONTEXTS][levels.numbers - 1], 'numbers', 1)],
    levels.writing === 3 ? [firstMessage, secondMessage] : [{ kind: 'writing', title: 'Напишіть назву малюнка', ...firstPicture }, { kind: 'writing', title: 'Ще одне слово в зошиті', ...secondPicture }],
    levels.communication === 1 ? [pick(CONVERSATION), STORY] : [firstDialogue, secondDialogue],
  ];
  const tasks = groups.flatMap((group, i) => group.map((task, j) => ({
    ...prepareTask(task, PRACTICE_BLOCKS[i].id, levels[PRACTICE_BLOCKS[i].id]), block: PRACTICE_BLOCKS[i].id, id: `${PRACTICE_BLOCKS[i].id}-${j}`,
  }))).filter((task) => !blockId || task.block === blockId);
  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, mode: 'extended', curriculumVersion: 3, levels: { ...levels }, blockId, tasks, createdAt: new Date().toISOString() };
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
    if (task.kind === 'semantic' || task.kind === 'reasoning') return (task.kind !== 'reasoning' || typeof task.stimulus === 'string') && Array.isArray(task.questions) && task.questions.length > 0 && task.questions.every((q) => q.options?.includes(q.answer));
    if (task.kind === 'sequence') {
      const validSteps = Array.isArray(task.steps) && task.steps.length > 0 && Array.isArray(task.choices) && task.choices.length === task.steps.length && new Set(task.choices).size === task.steps.length && task.steps.every((step) => task.choices.includes(step));
      return validSteps && (task.validOrders === undefined || (Array.isArray(task.validOrders) && task.validOrders.length > 0 && task.validOrders.every((order) => Array.isArray(order) && order.length === task.steps.length && new Set(order).size === task.steps.length && order.every((step) => task.steps.includes(step)))));
    }
    if (task.kind === 'writing') return typeof task.word === 'string' && Boolean(task.image || (task.writingType === 'message' && task.stimulus && task.modelText));
    return task.kind === 'conversation' && typeof task.model === 'string';
  });
}
