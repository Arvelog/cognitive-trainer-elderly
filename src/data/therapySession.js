const WORDS = [
  { word: 'чай', emoji: '☕', sound: 'Ч', syllables: 'ЧАЙ', phrase: 'хочу чай' },
  { word: 'вода', emoji: '💧', sound: 'В', syllables: 'ВО-ДА', phrase: 'ось вода' },
  { word: 'водити', emoji: '🚗', sound: 'В', syllables: 'ВО-ДИ-ТИ', phrase: 'водити авто' },
  { word: 'чистити', emoji: '🪥', sound: 'Ч', syllables: 'ЧИ-СТИ-ТИ', phrase: 'чистити зуби' },
  { word: 'чоботи', emoji: '🥾', sound: 'Ч', syllables: 'ЧО-БО-ТИ', phrase: 'мої чоботи' },
  { word: 'вчасно', emoji: '⏰', sound: 'ВЧ', syllables: 'ВЧАС-НО', phrase: 'прийти вчасно' },
  { word: 'часто', emoji: '🔁', sound: 'Ч', syllables: 'ЧА-СТО', phrase: 'дуже часто' },
  { word: 'чистий', emoji: '✨', sound: 'Ч', syllables: 'ЧИ-СТИЙ', phrase: 'чистий рушник' },
];

const FIND_TASKS = [
  { prompt: 'Покажіть слово «вода»', visual: '💧', answer: 'вода', options: ['вода', 'чай'] },
  { prompt: 'Покажіть слово «чай»', visual: '☕', answer: 'чай', options: ['чоботи', 'чай'] },
  { prompt: 'Покажіть слово «чоботи»', visual: '🥾', answer: 'чоботи', options: ['чоботи', 'вода'] },
];

const PAIR_TASKS = [
  { lead: 'чай', leadEmoji: '☕', answer: 'чашка', options: ['чашка', 'ключ'], spoken: 'чай і чашка' },
  { lead: 'чистити', leadEmoji: '🪥', answer: 'зуби', options: ['зуби', 'книга'], spoken: 'чистити зуби' },
  { lead: 'вода', leadEmoji: '💧', answer: 'склянка', options: ['телефон', 'склянка'], spoken: 'вода у склянці' },
];

const PHRASE_TASKS = [
  { lead: 'Я хочу', answer: 'чай', options: ['чай', 'чоботи'], spoken: 'Я хочу чай' },
  { lead: 'Ось', answer: 'вода', options: ['вода', 'вчасно'], spoken: 'Ось вода' },
  { lead: 'Треба', answer: 'чистити', options: ['чистити', 'часто'], spoken: 'Треба чистити зуби' },
];

const SCENE_TASKS = [
  {
    imageUrl: '/images/scenes/woman-cooking.jpg',
    alt: 'Жінка готує їжу на кухні',
    prompt: 'Що робить жінка?',
    answer: 'готує їжу',
    options: ['готує їжу', 'спить'],
    spoken: 'Жінка готує їжу',
  },
];

const pick = (items) => items[Math.floor(Math.random() * items.length)];

const shuffle = (items) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
};

export const SESSION_STEPS = [
  { short: 'Почути', title: 'Слухаємо слово' },
  { short: 'Знайти', title: 'Знаходимо слово' },
  { short: 'Разом', title: 'Поєднуємо слова' },
  { short: 'Фраза', title: 'Доповнюємо фразу' },
  { short: 'Сцена', title: 'Розуміємо сцену' },
  { short: 'Сказати', title: 'Сильні слова' },
];

export const createTherapySession = () => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  listen: pick(WORDS),
  find: pick(FIND_TASKS),
  pair: pick(PAIR_TASKS),
  phrase: pick(PHRASE_TASKS),
  scene: pick(SCENE_TASKS),
  strongWords: shuffle(WORDS).slice(0, 4),
  createdAt: new Date().toISOString(),
});

