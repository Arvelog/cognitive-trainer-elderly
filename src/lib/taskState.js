export const normalizeRotationIndex = (value, groupCount) => {
  const count = Number(groupCount);
  const parsed = Number(value);
  if (!Number.isInteger(count) || count <= 0) return 0;
  if (!Number.isInteger(parsed) || parsed < 0) return 0;
  return parsed % count;
};

export const splitSentenceWords = (sentence) =>
  String(sentence || '').trim().split(/\s+/).filter(Boolean);
