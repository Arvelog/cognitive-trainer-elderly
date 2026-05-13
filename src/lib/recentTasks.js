export const normalizeRecentValue = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[’`]/g, "'");

export const getRecentValues = (storageKey) => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeRecentValue).filter(Boolean);
      }
    } catch {
      // Support older single-value storage entries.
    }

    const legacyValue = normalizeRecentValue(raw);
    return legacyValue ? [legacyValue] : [];
  } catch {
    return [];
  }
};

export const rememberRecentValue = (storageKey, value, limit = 5) => {
  const normalized = normalizeRecentValue(value);
  if (!normalized) return;

  try {
    const recent = getRecentValues(storageKey).filter((item) => item !== normalized);
    window.localStorage.setItem(storageKey, JSON.stringify([normalized, ...recent].slice(0, limit)));
  } catch {
    // Ignore storage failures.
  }
};

export const isRecentValue = (storageKey, value, limit = 5) => {
  const normalized = normalizeRecentValue(value);
  if (!normalized) return false;
  return getRecentValues(storageKey).slice(0, limit).includes(normalized);
};

export const selectExcludingRecent = (items, storageKey, getValue, limit = 5) => {
  const source = Array.isArray(items) ? items : [];
  if (source.length === 0) return null;

  const recent = new Set(getRecentValues(storageKey).slice(0, limit));
  const choices = source.filter((item) => !recent.has(normalizeRecentValue(getValue(item))));
  const pool = choices.length > 0 ? choices : source;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const pickExcludingRecent = (items, storageKey, getValue, limit = 5) => {
  const source = Array.isArray(items) ? items : [];
  const picked = selectExcludingRecent(source, storageKey, getValue, limit);
  if (!picked) return null;
  rememberRecentValue(storageKey, getValue(picked), Math.min(limit, Math.max(1, source.length - 1)));
  return picked;
};
