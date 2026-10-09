const PREVIOUS_LEVEL_OPTIONS = {
  understanding: ['Два варіанти', 'Три варіанти', 'Власна відповідь'],
  meaning: ['Ознаки й категорії з опорою', 'Ознаки й зайвий предмет', 'Власна відповідь'],
  logic: ['Дві дії', 'Три дії', 'Чотири дії'],
  numbers: ['До 10 з предметами', 'До 20 без переходу через 10', 'До 20 з переходом через 10'],
  writing: ['Спочатку списування', 'Спроба → підказка → зразок', 'Спроба → письмо з пам’яті'],
  communication: ['Показати або сказати слово', 'Слово або коротка фраза', 'Фраза й одна подробиця'],
  shortWords: ['Знайомі предмети', 'Предмети й дії', 'Предмети, дії та ознаки'],
};

export const LEVEL_OPTIONS = {
  ...PREVIOUS_LEVEL_OPTIONS,
  understanding: ['Знайомі слова з опорою', 'Короткі тексти й дві деталі', 'Висновки й зміна умов'],
  meaning: ['Ознаки й категорії з опорою', 'Функції предметів і точні ознаки', 'Порівняння та пояснення зв’язків'],
  logic: ['Дві знайомі дії', 'План із трьох дій', 'Планування з умовами'],
  numbers: ['До 10 з предметами', 'До 20 без переходу через 10', 'Приклади до 20, покупки й час'],
  writing: ['Спочатку списування', 'Назва й коротке речення', 'Власні записки й повідомлення'],
  communication: ['Показати або сказати слово', 'Розмова з уточненням', 'Домовленість і пояснення'],
};

export const RICHER_SETTINGS = { blocks: { understanding: 2, meaning: 3, logic: 3, numbers: 3, writing: 3, communication: 3 }, shortWords: 2 };

export const DEFAULT_LEVELS = { understanding: 1, meaning: 1, logic: 2, numbers: 3, writing: 2, communication: 2 };
export const SETTINGS_KEY = 'poruch_practice_settings_v1';
const validLevel = (value, fallback) => [1, 2, 3].includes(value) ? value : fallback;

export function normalizePracticeSettings(value) {
  return {
    blocks: Object.fromEntries(Object.entries(DEFAULT_LEVELS).map(([key, fallback]) => [key, validLevel(value?.blocks?.[key], fallback)])),
    shortWords: validLevel(value?.shortWords, 1),
  };
}

export function restorePracticeSettings(raw) {
  try { return normalizePracticeSettings(JSON.parse(raw)); }
  catch { return normalizePracticeSettings(); }
}

export const levelLabel = (block, level, version = 3) => (version === 2 ? PREVIOUS_LEVEL_OPTIONS : LEVEL_OPTIONS)[block]?.[level - 1] || 'Попередній набір';
