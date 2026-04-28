import { isSafeAntonymBlock, fallbackAntonymBlock } from './antonyms';
import { MATCH_NEED_DATA, SEQUENCE_DATA, VERB_DATA } from '../data/taskData';
import { pick } from './audio';

const SEQUENCE_REPEAT_KEY = 'cognitive_trainer_last_sequence_title';

const getLastSequenceTitle = () => {
  try {
    return window.localStorage.getItem(SEQUENCE_REPEAT_KEY) || '';
  } catch {
    return '';
  }
};

const setLastSequenceTitle = (title) => {
  try {
    window.localStorage.setItem(SEQUENCE_REPEAT_KEY, title);
  } catch {
    // Ignore storage failures.
  }
};

const pickSequenceFallback = (excludeTitle = '') => {
  const title = String(excludeTitle || '').trim().toLowerCase();
  const choices = SEQUENCE_DATA.filter((item) => item.title.toLowerCase() !== title);
  return pick(choices.length > 0 ? choices : SEQUENCE_DATA);
};

const isValidScenePrompt = (scene) => {
  const text = String(scene || '').trim();
  return text.length >= 24 && /[A-Za-z]/.test(text) && /[a-z]/i.test(text);
};

const pickSceneFallback = () => pick(VERB_DATA).scene;

const normalizeMatchText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[’`]/g, "'");

const pickMatchNeedFallback = (excludePrompt = '') => {
  const prompt = normalizeMatchText(excludePrompt);
  const choices = MATCH_NEED_DATA.filter((item) => normalizeMatchText(item.prompt) !== prompt);
  return pick(choices.length > 0 ? choices : MATCH_NEED_DATA);
};

const toTrustedMatchNeedBlock = (matchWord) => {
  const prompt = normalizeMatchText(matchWord?.word || matchWord?.prompt);
  const options = Array.isArray(matchWord?.options) ? matchWord.options.map(normalizeMatchText) : [];
  const correctIndexes = Array.isArray(matchWord?.correct) ? matchWord.correct : [];
  const correctOptions = new Set(
    correctIndexes
      .filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < options.length)
      .map((idx) => options[idx]),
  );

  const trusted = MATCH_NEED_DATA.find((item) => {
    if (normalizeMatchText(item.prompt) !== prompt) return false;

    const expectedCorrect = new Set(item.correct.map((idx) => normalizeMatchText(item.options[idx])));
    if (expectedCorrect.size !== correctOptions.size) return false;

    return [...expectedCorrect].every((option) => correctOptions.has(option));
  });

  return trusted ? { ...trusted } : null;
};

export async function generateAllTasks() {
  try {
    const response = await fetch('/api/generate', { method: 'POST' });

    if (response.status === 429) {
      console.warn('Backend reported 429 Too Many Requests.');
      return { _rateLimited: true };
    }

    if (!response.ok) {
      console.warn(`Backend request failed with status ${response.status}.`);
      return null;
    }

    const text = await response.text();
    if (text.trim().startsWith('<')) {
      return null;
    }

    let resultData = null;
    try {
      resultData = JSON.parse(text);
    } catch (parseError) {
      console.warn('Failed to parse backend JSON response:', parseError);
      return null;
    }

    if (resultData?.error) {
      const errorText = String(resultData.error);
      if (errorText.includes('429')) {
        console.warn('Backend response body indicates 429 Too Many Requests.');
        return { _rateLimited: true };
      }
      return null;
    }

    const data = resultData;

    if (
      !data ||
      (!data.matchWord && !data.findOdd) ||
      !data.sequence ||
      !data.budget ||
      !data.sentence ||
      !data.associations ||
      !data.categories ||
      !data.trueFalse ||
      !data.antonyms ||
      !data.vowels ||
      !data.verbs
    ) {
      console.warn('App: incomplete data, using fallback');
      return null;
    }

    const categories = data.categories;
    const categoryItems = Array.isArray(categories?.items) ? categories.items : [];
    const groupCounts = [0, 1, 2].map((group) => categoryItems.filter((item) => item?.group === group).length);
    if (
      !categories ||
      !Array.isArray(categories.groupLabels) ||
      categories.groupLabels.length !== 3 ||
      categories.groupLabels.some((label) => typeof label !== 'string' || !label.trim()) ||
      new Set(categories.groupLabels.map((label) => label.trim().toLowerCase())).size !== 3 ||
      !Array.isArray(categories.groupIcons) ||
      categories.groupIcons.length !== 3 ||
      categories.groupIcons.some((icon) => typeof icon !== 'string' || !icon.trim()) ||
      categoryItems.length !== 6 ||
      categoryItems.some((item) => typeof item?.text !== 'string' || !item.text.trim() || !Number.isInteger(item.group) || item.group < 0 || item.group > 2) ||
      groupCounts.some((count) => count !== 2)
    ) {
      console.warn('App: categories data is malformed, using fallback to prevent UI breakage');
      return null;
    }

    const matchWord = data.matchWord || data.findOdd;
    const normalizedPrompt = String(matchWord?.word || '').trim().toLowerCase();
    const normalizedOptions = Array.isArray(matchWord?.options)
      ? matchWord.options.map((option) => String(option || '').trim().toLowerCase())
      : [];
    const normalizedCorrect = Array.isArray(matchWord?.correct) ? matchWord.correct : [];
    if (
      !matchWord ||
      typeof matchWord.word !== 'string' ||
      !Array.isArray(matchWord.options) ||
      matchWord.options.length !== 5 ||
      !Array.isArray(matchWord.correct) ||
      normalizedCorrect.length !== 2 ||
      !normalizedCorrect.every((idx) => Number.isInteger(idx) && idx >= 0 && idx < 5) ||
      new Set(normalizedCorrect).size !== 2 ||
      !normalizedPrompt ||
      normalizedOptions.some((option) => !option) ||
      new Set(normalizedOptions).size !== 5 ||
      normalizedOptions.includes(normalizedPrompt)
    ) {
      console.warn('App: matchWord data is malformed, using fallback to prevent UI breakage');
      return null;
    }

    const trustedMatchWord = toTrustedMatchNeedBlock(matchWord);
    if (!trustedMatchWord) {
      console.warn('App: matchWord semantic quality is not trusted, using fallback block');
      data.matchWord = pickMatchNeedFallback(matchWord.word || matchWord.prompt);
    } else {
      data.matchWord = trustedMatchWord;
    }

    if (!isSafeAntonymBlock(data.antonyms)) {
      console.warn('App: antonyms data is too similar or unsafe, using fallback block');
      data.antonyms = fallbackAntonymBlock();
    }

    const scenePrompt = data.verbs?.scene;
    if (!isValidScenePrompt(scenePrompt)) {
      console.warn('App: scene prompt is missing or too weak, using fallback scene');
      data.verbs = { ...(data.verbs || {}), scene: pickSceneFallback() };
    }

    const sequenceTitle = String(data.sequence?.title || '').trim().toLowerCase();
    const lastSequenceTitle = getLastSequenceTitle();
    if (!sequenceTitle || sequenceTitle.includes('компот') || sequenceTitle === lastSequenceTitle) {
      console.warn('App: sequence data is repetitive, using fallback block');
      data.sequence = pickSequenceFallback(lastSequenceTitle);
    }

    if (data.sequence?.title) {
      setLastSequenceTitle(data.sequence.title);
    }

    return data;
  } catch (e) {
    console.warn('AI generation failed:', e);
    return null;
  }
}
