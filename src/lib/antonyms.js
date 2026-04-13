import { ANTONYM_DATA } from '../data/taskData';

const SAFE_ANTONYM_WORDS = new Set([
  'холодний',
  'маленька',
  'темно',
  'близький',
  'пізній',
  'брудна',
  'порожня',
  'вузька',
  'мокрий',
  'гучна',
  "м'яка",
  'легка',
  'новий',
  'низький',
  'короткий',
  'повільний',
  'гострий',
  'темна',
  'сумний',
  'нерівне',
  'важка',
]);

export const isSafeAntonymBlock = (antonyms) => {
  const sentences = antonyms?.sentences;
  if (!Array.isArray(sentences) || sentences.length !== 4) return false;

  return sentences.every((item) => {
    const sentence = typeof item?.s === 'string' ? item.s.trim().toLowerCase() : '';
    const answer = typeof item?.a === 'string' ? item.a.trim().toLowerCase() : '';
    if (!sentence || !answer) return false;
    if (!SAFE_ANTONYM_WORDS.has(answer)) return false;
    return sentence.includes(answer);
  });
};

export const fallbackAntonymBlock = () => {
  const idx = Math.floor(Math.random() * ANTONYM_DATA.length);
  return ANTONYM_DATA[idx];
};
