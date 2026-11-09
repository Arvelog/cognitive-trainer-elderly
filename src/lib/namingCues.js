// A cueing hierarchy for naming: meaning first, then sounds, the whole word last.
// Each step gives a little more; the deepest step used is kept for the diary.
const VOWELS = 'аеєиіїоуюя';
export const CUE_KINDS = ['none', 'meaning', 'sound', 'syllable', 'word'];
export const CUE_LABELS = { none: 'без підказки', meaning: 'після підказки про значення', sound: 'після першого звука', syllable: 'після першого складу', word: 'після показаної назви' };

export function firstSyllable(word) {
  const letters = String(word || '').trim().toLocaleLowerCase('uk-UA').split(' ')[0];
  const vowel = [...letters].findIndex((char) => VOWELS.includes(char));
  return vowel < 0 ? letters : letters.slice(0, vowel + 1);
}

export function namingCues(task) {
  const word = String(task?.word || '').trim();
  if (!word) return [];
  const meaning = (task.questions || []).map((question) => question.answer).filter(Boolean).slice(0, 3);
  const first = word.charAt(0).toLocaleUpperCase('uk-UA');
  const syllable = firstSyllable(word);
  return [
    meaning.length && { kind: 'meaning', label: 'Підказка про значення', text: `Згадайте: ${meaning.join(' · ')}.` },
    { kind: 'sound', label: 'Перший звук', text: `Слово починається на «${first}…».` },
    syllable.length > 1 && syllable.length < word.length && { kind: 'syllable', label: 'Перший склад', text: `Початок слова: «${syllable}…».` },
    { kind: 'word', label: 'Показати назву', text: word },
  ].filter(Boolean);
}

export const deepestCue = (task, used = 0) => used > 0 ? namingCues(task)[used - 1]?.kind || 'word' : 'none';
