import {
  ASSOC_DATA,
  CATEGORY_SORT_DATA,
  MATCH_NEED_DATA,
  NAMING_DATA,
  PHRASE_COMPLETION_DATA,
  SENTENCE_DATA,
  SEQUENCE_DATA,
  TRUEFALSE_DATA,
  VERB_DATA,
  WRITING_DATA,
} from '../data/taskData';
import { pick } from './audio';
import { isRecentValue, normalizeRecentValue, selectExcludingRecent } from './recentTasks';

const SEQUENCE_REPEAT_KEY = 'cognitive_trainer_last_sequence_title';
const MATCH_REPEAT_KEY = 'cognitive_trainer_recent_match_prompts';

const isObject = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const hasUniqueStrings = (value, length) => {
  if (!Array.isArray(value) || value.length !== length) return false;
  if (value.some((item) => !isNonEmptyString(item))) return false;
  return new Set(value.map((item) => item.trim().toLowerCase())).size === length;
};

const hasNoOverlap = (left, right) => {
  const normalizedLeft = new Set(left.map((item) => item.trim().toLowerCase()));
  return right.every((item) => !normalizedLeft.has(item.trim().toLowerCase()));
};

const pickSequenceFallback = () =>
  selectExcludingRecent(SEQUENCE_DATA, SEQUENCE_REPEAT_KEY, (item) => item.title, 7) || pick(SEQUENCE_DATA);

const pickMatchNeedFallback = () =>
  selectExcludingRecent(MATCH_NEED_DATA, MATCH_REPEAT_KEY, (item) => item.prompt, 10) || pick(MATCH_NEED_DATA);

const isValidScenePrompt = (scene) => {
  const text = String(scene || '').trim();
  const wordCount = text.split(/\s+/).length;
  const unsafeScene = /\b(hospital|medical|doctor|nurse|injury|blood|weapon|danger|scary|crying|sad|child|boy|girl|baby)\b/i;
  return text.length >= 24 && wordCount >= 16 && wordCount <= 32 && /[A-Za-z]/.test(text) && !unsafeScene.test(text);
};

const toTrustedMatchNeedBlock = (matchWord) => {
  const prompt = normalizeRecentValue(matchWord?.word || matchWord?.prompt);
  const trusted = MATCH_NEED_DATA.find((item) => normalizeRecentValue(item.prompt) === prompt);
  return trusted ? { ...trusted } : null;
};

const isValidSequenceBlock = (sequence) =>
  isObject(sequence) &&
  isNonEmptyString(sequence.title) &&
  Array.isArray(sequence.steps) &&
  sequence.steps.length === 4 &&
  sequence.steps.every(isNonEmptyString);

const isValidNamingBlock = (naming) =>
  isObject(naming) &&
  isNonEmptyString(naming.word) &&
  /^[А-ЯІЇЄҐа-яіїєґ'’-]{3,9}$/u.test(naming.word.trim()) &&
  isNonEmptyString(naming.emoji) &&
  isNonEmptyString(naming.category) &&
  isNonEmptyString(naming.use) &&
  isNonEmptyString(naming.place) &&
  isNonEmptyString(naming.firstLetter) &&
  Number.isInteger(naming.syllables) &&
  naming.syllables >= 1 &&
  naming.syllables <= 6;

const isValidSentenceBlock = (sentence) =>
  isObject(sentence) &&
  Array.isArray(sentence.sentences) &&
  sentence.sentences.length === 3 &&
  sentence.sentences.every((item) => {
    if (!isNonEmptyString(item)) return false;
    const wordCount = item.trim().split(/\s+/).length;
    return wordCount >= 4 && wordCount <= 7;
  });

const isValidAssociationsBlock = (associations) =>
  isObject(associations) &&
  isNonEmptyString(associations.q) &&
  hasUniqueStrings(associations.correct, 3) &&
  hasUniqueStrings(associations.wrong, 3) &&
  hasNoOverlap(associations.correct, associations.wrong);

const isValidCategoriesBlock = (categories) => {
  const items = Array.isArray(categories?.items) ? categories.items : [];
  const counts = [0, 1, 2].map((group) => items.filter((item) => item?.group === group).length);
  return (
    isObject(categories) &&
    hasUniqueStrings(categories.groupLabels, 3) &&
    hasUniqueStrings(categories.groupIcons, 3) &&
    items.length === 6 &&
    hasUniqueStrings(items.map((item) => item?.text), 6) &&
    items.every((item) => isNonEmptyString(item?.text) && /\p{Extended_Pictographic}/u.test(item.text) && Number.isInteger(item.group) && item.group >= 0 && item.group <= 2) &&
    counts.every((count) => count === 2)
  );
};

const isValidTrueFalseBlock = (trueFalse) =>
  isObject(trueFalse) &&
  Array.isArray(trueFalse.statements) &&
  trueFalse.statements.length === 3 &&
  trueFalse.statements.every((item) => isNonEmptyString(item?.text) && typeof item.answer === 'boolean') &&
  new Set(trueFalse.statements.map((item) => item.answer)).size === 2;

const isValidPhraseCompletionBlock = (block) =>
  isObject(block) &&
  Array.isArray(block.items) &&
  block.items.length === 3 &&
  block.items.every((item) =>
    isNonEmptyString(item?.text) &&
    item.text.includes('...') &&
    isNonEmptyString(item.answer) &&
    hasUniqueStrings(item.options, 3) &&
    item.options.includes(item.answer));

const isValidWritingBlock = (writing) =>
  isObject(writing) &&
  Array.isArray(writing.words) &&
  writing.words.length === 3 &&
  hasUniqueStrings(writing.words.map((item) => item?.word), 3) &&
  writing.words.every((item) =>
    isNonEmptyString(item?.word) &&
    item.word === item.word.toUpperCase() &&
    /^[А-ЯІЇЄҐ'’-]{3,12}$/u.test(item.word) &&
    isNonEmptyString(item?.emoji) &&
    /\p{Extended_Pictographic}/u.test(item.emoji) &&
    isNonEmptyString(item?.hint));

const isValidVerbBlock = (verbs) =>
  isObject(verbs) &&
  isNonEmptyString(verbs.title) &&
  isNonEmptyString(verbs.context) &&
  isValidScenePrompt(verbs.scene) &&
  hasUniqueStrings(verbs.correct, 3) &&
  hasUniqueStrings(verbs.wrong, 3) &&
  hasNoOverlap(verbs.correct, verbs.wrong);

export async function generateAllTasks({ signal } = {}) {
  try {
    const response = await fetch('/api/generate', { method: 'POST', signal });

    if (response.status === 429) return { _rateLimited: true };
    if (!response.ok) {
      console.warn(`Backend request failed with status ${response.status}.`);
      return null;
    }

    const text = await response.text();
    if (text.trim().startsWith('<')) return null;

    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.warn('Failed to parse backend JSON response:', error);
      return null;
    }

    if (!isObject(data) || data.error) return null;

    const fallbackBlocks = [];
    const localAnswerBlocks = [];
    const replaceInvalid = (name, valid, fallback) => {
      if (valid) return;
      fallbackBlocks.push(name);
      data[name] = pick(fallback);
      console.warn(`App: ${name} data is malformed, using fallback block`);
    };

    replaceInvalid('naming', isValidNamingBlock(data.naming), NAMING_DATA);
    replaceInvalid('sentence', isValidSentenceBlock(data.sentence), SENTENCE_DATA);
    replaceInvalid('associations', isValidAssociationsBlock(data.associations), ASSOC_DATA);
    replaceInvalid('categories', isValidCategoriesBlock(data.categories), CATEGORY_SORT_DATA);
    replaceInvalid('trueFalse', isValidTrueFalseBlock(data.trueFalse), TRUEFALSE_DATA);
    replaceInvalid('phraseCompletion', isValidPhraseCompletionBlock(data.phraseCompletion), PHRASE_COMPLETION_DATA);
    replaceInvalid('writing', isValidWritingBlock(data.writing), WRITING_DATA);
    const trustedMatchWord = toTrustedMatchNeedBlock(data.matchWord || data.findOdd);
    const matchPrompt = normalizeRecentValue(trustedMatchWord?.prompt);
    if (!trustedMatchWord || isRecentValue(MATCH_REPEAT_KEY, matchPrompt, 10)) {
      fallbackBlocks.push('matchWord');
      data.matchWord = pickMatchNeedFallback();
    } else {
      data.matchWord = trustedMatchWord;
      localAnswerBlocks.push('matchWord');
    }

    const sequenceTitle = normalizeRecentValue(data.sequence?.title);
    if (!isValidSequenceBlock(data.sequence) || !sequenceTitle || isRecentValue(SEQUENCE_REPEAT_KEY, sequenceTitle, 7)) {
      fallbackBlocks.push('sequence');
      data.sequence = pickSequenceFallback();
    }

    if (!isValidVerbBlock(data.verbs)) {
      fallbackBlocks.push('verbs');
      data.verbs = { ...pick(VERB_DATA) };
    }

    data._source = fallbackBlocks.length > 0 ? 'mixed' : 'ai';
    data._fallbackBlocks = fallbackBlocks;
    data._localAnswerBlocks = localAnswerBlocks;
    return data;
  } catch (error) {
    if (signal?.aborted) throw error;
    console.warn('AI generation failed:', error);
    return null;
  }
}
