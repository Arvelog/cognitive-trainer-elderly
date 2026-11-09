// Personal conversation scripts: a few lines for a real situation, practised with less and less text on screen.
export const SCRIPTS_KEY = 'poruch_scripts_v1';
export const MAX_SCRIPTS = 6;
export const MAX_LINES = 6;
export const SCRIPT_STAGES = ['Уся репліка на екрані', 'Лише початок репліки', 'Без тексту'];

const clean = (value, max) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
const isoDay = (date) => new Date(date).toISOString().slice(0, 10);

export function normalizeScripts(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.flatMap((item) => {
    const id = clean(item?.id, 40);
    const title = clean(item?.title, 60);
    const lines = (Array.isArray(item?.lines) ? item.lines : []).map((line) => clean(line, 100)).filter(Boolean).slice(0, MAX_LINES);
    if (!id || !title || seen.has(id) || lines.length < 1) return [];
    seen.add(id);
    const stage = [1, 2, 3].includes(item.stage) ? item.stage : 1;
    const lastPracticed = /^\d{4}-\d{2}-\d{2}$/.test(item.lastPracticed || '') ? item.lastPracticed : null;
    return [{ id, title, lines, stage, lastPracticed }];
  }).slice(0, MAX_SCRIPTS);
}
export function loadScripts(raw) {
  try { return normalizeScripts(JSON.parse(raw)); } catch { return []; }
}

export const parseLines = (text) => String(text || '').split('\n').map((line) => clean(line.replace(/^[-–—•\d.)\s]+/, ''), 100)).filter(Boolean).slice(0, MAX_LINES);

// What stays on screen for each line: everything, the first two words, or nothing.
export function scriptCue(line, stage) {
  if (stage <= 1) return line;
  if (stage === 2) { const words = line.split(' '); return words.length > 2 ? `${words.slice(0, 2).join(' ')}…` : `${line.charAt(0)}…`; }
  return '';
}

// The script practised longest ago comes next.
export const nextScript = (scripts) => [...scripts].sort((a, b) => (a.lastPracticed || '').localeCompare(b.lastPracticed || ''))[0] || null;

export function scriptTask(script) {
  return {
    kind: 'script', scriptId: script.id, contentId: `script-${script.id}`, personal: true,
    title: script.title, lines: script.lines, stage: script.stage,
    prompt: 'Розіграйте цю розмову разом. Людина поруч грає співрозмовника.',
  };
}

// Independent: less text next time. Only an attempt: more text back. With help: the same.
export function updateScriptStage(scripts, scriptId, mode, now = new Date()) {
  return normalizeScripts(scripts.map((script) => script.id !== scriptId ? script : {
    ...script,
    stage: mode === 'independent' ? Math.min(3, script.stage + 1) : mode === 'attempted' ? Math.max(1, script.stage - 1) : script.stage,
    lastPracticed: isoDay(now),
  }));
}
