import { isSafeAntonymBlock, fallbackAntonymBlock } from './antonyms';
import { ANTONYM_DATA, BUDGET_DATA, MATCH_NEED_DATA, SEQUENCE_DATA, VERB_DATA } from '../data/taskData';
import { pick } from './audio';
import { isRecentValue, normalizeRecentValue, selectExcludingRecent } from './recentTasks';

const SEQUENCE_REPEAT_KEY = 'cognitive_trainer_last_sequence_title';
const MATCH_REPEAT_KEY = 'cognitive_trainer_recent_match_prompts';
const BUDGET_REPEAT_KEY = 'cognitive_trainer_recent_budget_labels';
const ANTONYM_REPEAT_KEY = 'cognitive_trainer_recent_antonym_blocks';

const pickSequenceFallback = () =>
  selectExcludingRecent(SEQUENCE_DATA, SEQUENCE_REPEAT_KEY, (item) => item.title, 7) || pick(SEQUENCE_DATA);

const isValidScenePrompt = (scene) => {
  const text = String(scene || '').trim();
  return text.length >= 24 && /[A-Za-z]/.test(text) && /[a-z]/i.test(text);
};

const pickSceneFallback = () => pick(VERB_DATA).scene;

const normalizeMatchText = (value) =>
  normalizeRecentValue(value);

const pickMatchNeedFallback = () =>
  selectExcludingRecent(MATCH_NEED_DATA, MATCH_REPEAT_KEY, (item) => item.prompt, 12) || pick(MATCH_NEED_DATA);

const pickBudgetFallback = () =>
  selectExcludingRecent(BUDGET_DATA, BUDGET_REPEAT_KEY, (item) => item.label, 4) || pick(BUDGET_DATA);

const antonymBlockKey = (block) =>
  (block?.sentences || [])
    .map((item) => normalizeRecentValue(item?.a))
    .filter(Boolean)
    .join('|');

const pickAntonymFallback = () =>
  selectExcludingRecent(ANTONYM_DATA, ANTONYM_REPEAT_KEY, antonymBlockKey, 5) || fallbackAntonymBlock();

const toTrustedMatchNeedBlock = (matchWord) => {
  const prompt = normalizeMatchText(matchWord?.word || matchWord?.prompt);
  const trusted = MATCH_NEED_DATA.find((item) => normalizeMatchText(item.prompt) === prompt);

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
    let trustedMatchWord = toTrustedMatchNeedBlock(matchWord);
    const matchPrompt = normalizeMatchText(trustedMatchWord?.prompt);
    if (!trustedMatchWord || isRecentValue(MATCH_REPEAT_KEY, matchPrompt, 12)) {
      console.warn('App: matchWord semantic quality is not trusted, using fallback block');
      data.matchWord = pickMatchNeedFallback();
    } else {
      data.matchWord = trustedMatchWord;
    }

    const antonymKey = antonymBlockKey(data.antonyms);
    if (!isSafeAntonymBlock(data.antonyms) || isRecentValue(ANTONYM_REPEAT_KEY, antonymKey, 5)) {
      console.warn('App: antonyms data is too similar, repetitive or unsafe, using fallback block');
      data.antonyms = pickAntonymFallback();
    }

    const budgetLabel = normalizeRecentValue(data.budget?.label);
    if (!budgetLabel || isRecentValue(BUDGET_REPEAT_KEY, budgetLabel, 4)) {
      console.warn('App: budget data is repetitive, using fallback block');
      data.budget = pickBudgetFallback();
    }

    const scenePrompt = data.verbs?.scene;
    if (!isValidScenePrompt(scenePrompt)) {
      console.warn('App: scene prompt is missing or too weak, using fallback scene');
      data.verbs = { ...(data.verbs || {}), scene: pickSceneFallback() };
    }

    const sequenceTitle = String(data.sequence?.title || '').trim().toLowerCase();
    if (!sequenceTitle || sequenceTitle.includes('компот') || isRecentValue(SEQUENCE_REPEAT_KEY, sequenceTitle, 7)) {
      console.warn('App: sequence data is repetitive, using fallback block');
      data.sequence = pickSequenceFallback();
    }

    return data;
  } catch (e) {
    console.warn('AI generation failed:', e);
    return null;
  }
}
