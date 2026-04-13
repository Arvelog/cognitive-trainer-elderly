import { isSafeAntonymBlock, fallbackAntonymBlock } from './antonyms';

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

    const matchWord = data.matchWord || data.findOdd;
    const normalizedPrompt = String(matchWord?.word || '').trim().toLowerCase();
    const normalizedOptions = Array.isArray(matchWord?.options)
      ? matchWord.options.map((option) => String(option || '').trim().toLowerCase())
      : [];
    if (
      !matchWord ||
      typeof matchWord.word !== 'string' ||
      !Array.isArray(matchWord.options) ||
      matchWord.options.length !== 4 ||
      !Number.isInteger(matchWord.correct) ||
      matchWord.correct < 0 ||
      matchWord.correct > 3 ||
      !normalizedPrompt ||
      normalizedOptions.some((option) => !option) ||
      new Set(normalizedOptions).size !== 4 ||
      normalizedOptions.includes(normalizedPrompt)
    ) {
      console.warn('App: matchWord data is malformed, using fallback to prevent UI breakage');
      return null;
    }

    data.matchWord = matchWord;

    if (!isSafeAntonymBlock(data.antonyms)) {
      console.warn('App: antonyms data is too similar or unsafe, using fallback block');
      data.antonyms = fallbackAntonymBlock();
    }

    return data;
  } catch (e) {
    console.warn('AI generation failed:', e);
    return null;
  }
}
