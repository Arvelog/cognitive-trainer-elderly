import { LEXICON } from './lexicon.js';

const pick = (items) => items[Math.floor(Math.random() * items.length)];
const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
const unique = (values) => [...new Set(values)];
// Wrong options come from another room, so they cannot also be true for this word.
const elsewhere = (item, field) => shuffle(unique(LEXICON.filter((other) => other.zone !== item.zone && other[field]).map((other) => other[field])));

export function semanticFromLexicon(item, optionCount = 3) {
  const wrong = (field) => elsewhere(item, field).slice(0, optionCount - 1);
  return {
    kind: 'semantic', title: 'Розкажімо про предмет', word: item.word, emoji: item.emoji, contentId: `lex-features-${item.word}`, generated: true,
    questions: [
      { prompt: 'До якої групи належить?', answer: item.label, options: [item.label, ...wrong('label')] },
      { prompt: 'Для чого це потрібно?', answer: item.use, options: [item.use, ...wrong('use')] },
      { prompt: 'Де це зазвичай буває?', answer: item.place, options: [item.place, ...wrong('place')] },
    ],
  };
}

export const LEXICON_FEATURES = (optionCount) => LEXICON.filter((item) => item.use).map((item) => semanticFromLexicon(item, optionCount));

export function categoryNameTask(label) {
  const members = shuffle(LEXICON.filter((item) => item.label === label)).slice(0, 3);
  const other = pick(unique(LEXICON.filter((item) => item.zone !== members[0].zone).map((item) => item.label)));
  return {
    kind: 'choice', title: 'Оберіть спільну назву', generated: true, contentId: `lex-group-${label}`,
    stimulus: members.map((item) => item.word).join(' · '), answer: label, options: [label, other],
    hintSteps: [`Подумайте, де все це буває: ${members[0].place}.`],
  };
}

export const LEXICON_CATEGORY_NAMES = () => unique(LEXICON.map((item) => item.label))
  .filter((label) => LEXICON.filter((item) => item.label === label).length >= 3).map(categoryNameTask);

const plural = (n, forms) => {
  const tail = n % 100;
  if (tail >= 11 && tail <= 14) return forms[2];
  return forms[n % 10 === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 ? 1 : 2];
};
const PENCILS = ['олівець', 'олівці', 'олівців'];
const between = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const neighbours = (answer, count) => (count === 2 ? [answer, answer > 1 ? answer + pick([-1, 1]) : answer + 1] : [answer - 1, answer, answer + 1]).map(String);
const equation = (a, operator, b) => `${a} ${operator} ${b} = ?`;

// Level 1: up to 10 with counters; level 2: up to 20 without crossing ten; level 3: crossing ten.
export const numberProblems = (level, count = 12) => unique(Array.from({ length: count * 3 }, () => numberProblem(level)).map((task) => JSON.stringify(task)))
  .slice(0, count).map((task) => JSON.parse(task));

export function numberProblem(level) {
  const add = Math.random() < 0.5;
  if (level === 1) {
    const a = add ? between(1, 5) : between(3, 7);
    const b = add ? between(1, 4) : between(1, a - 1);
    const answer = add ? a + b : a - b;
    return {
      kind: 'choice', title: add ? 'Скільки всього?' : 'Скільки залишилося?', stimulus: equation(a, add ? '+' : '−', b), answer: String(answer),
      options: neighbours(answer, 2), equation: true, counters: [a, b], operator: add ? '+' : '−', generated: true, contentId: `num-1-${a}${add ? '+' : '-'}${b}`,
      hintSteps: add ? ['Порахуйте перші крапки.', 'Додайте до них інші крапки. Порахуйте всі разом.']
        : [`Візьміть ${a} ${plural(a, PENCILS)}.`, `Відкладіть ${b}. Порахуйте, скільки залишилося.`],
    };
  }
  if (level === 2) {
    const a = add ? between(11, 16) : between(13, 19);
    const b = add ? between(1, 9 - (a % 10)) : between(1, a % 10);
    const answer = add ? a + b : a - b;
    return {
      kind: 'choice', title: add ? 'Скільки всього?' : 'Скільки залишилося?', stimulus: equation(a, add ? '+' : '−', b), answer: String(answer),
      options: neighbours(answer, 3), equation: true, generated: true, contentId: `num-2-${a}${add ? '+' : '-'}${b}`,
      hintSteps: [`Почніть із ${a}.`, `${add ? 'Додайте' : 'Відніміть'} ${b} по одному. Десяток залишається.`],
    };
  }
  if (add) {
    const a = between(6, 9);
    const b = between(11 - a, 9);
    const toTen = 10 - a;
    return {
      kind: 'choice', title: 'Скільки всього?', stimulus: equation(a, '+', b), answer: String(a + b), options: neighbours(a + b, 3),
      equation: true, generated: true, contentId: `num-3-${a}+${b}`,
      hintSteps: [`Розділіть ${b} на ${toTen} і ${b - toTen}.`, `Спочатку ${a} + ${toTen} = 10.`, `Додайте ще ${b - toTen}.`],
    };
  }
  const a = between(11, 18);
  const b = between(a % 10 + 1, Math.min(9, a - 2));
  const ones = a % 10;
  return {
    kind: 'choice', title: 'Скільки залишилося?', stimulus: equation(a, '−', b), answer: String(a - b), options: neighbours(a - b, 3),
    equation: true, generated: true, contentId: `num-3-${a}-${b}`,
    hintSteps: [`Віднімайте ${b} частинами: спочатку ${ones}, потім ще ${b - ones}.`, `${a} − ${ones} = 10.`, `Скільки буде 10 − ${b - ones}?`],
  };
}
