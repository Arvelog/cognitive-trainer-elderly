export function usedSupport(progress = {}) {
  return Boolean(progress.usedHint || progress.usedAnswerAudio || progress.usedModel || progress.optionsRevealed || progress.answerRevealed);
}

export function chooseAnswer(progress, option, answer) {
  const attempts = (progress.attempts || 0) + 1;
  const done = option === answer;
  const answerRevealed = Boolean(progress.answerRevealed || (!done && attempts >= 2));
  return {
    ...progress, chosen: option, attempts, done, answerRevealed, responseKind: 'choice',
    ...(done ? { mode: usedSupport({ ...progress, answerRevealed }) ? 'supported' : 'independent' } : {}),
  };
}

export function recordOwnResponse(progress, mode) {
  return { ...progress, responseKind: 'own', mode: mode === 'independent' && usedSupport(progress) ? 'supported' : mode, done: true };
}

export function recordSemanticName(progress, showWord, mode) {
  const naming = recordOwnResponse({ ...progress.naming, usedModel: Boolean(showWord || progress.nameShown), usedAnswerAudio: progress.usedAnswerAudio }, mode);
  const parts = [...(progress.answers || []), naming];
  const outcome = parts.some((part) => part.mode === 'attempted') ? 'attempted'
    : parts.every((part) => part.mode === 'independent') && !usedSupport(progress) ? 'independent' : 'supported';
  return { ...progress, naming, mode: outcome, done: true };
}

export function recordReasoningAnswer(progress, index, answer, count) {
  const answers = [...(progress.answers || [])];
  answers[index] = answer;
  const done = answers.length === count && Array.from({ length: count }, (_, i) => answers[i]?.done).every(Boolean);
  const mode = answers.some((part) => part?.mode === 'attempted') ? 'attempted'
    : usedSupport(progress) || answers.some((part) => usedSupport(part || {}) || part?.mode === 'supported') ? 'supported' : 'independent';
  return { ...progress, answers, done, ...(done ? { mode } : {}) };
}

export function nextSequenceSteps(task, selected = []) {
  const orders = task.validOrders || [task.steps];
  return [...new Set(orders.filter((order) => selected.every((step, index) => order[index] === step)).map((order) => order[selected.length]).filter(Boolean))];
}

export function recordWritingStage(progress, stage, mode) {
  const hinted = stage === 'model' ? false : stage === 'recall' ? progress.recallHint : progress.writeHint || progress.usedHint;
  const result = { mode: mode === 'independent' && hinted ? 'supported' : mode, hinted: Boolean(hinted) };
  return {
    ...progress, stage, stageResults: { ...progress.stageResults, [stage]: result },
    usedModel: Boolean(progress.usedModel || stage === 'model'),
    mode: stage === 'model' || progress.usedModel ? (mode === 'attempted' ? 'attempted' : 'supported') : result.mode,
    done: stage !== 'model',
  };
}

export function resultMode(task, detail = {}) {
  if (detail.mode === 'attempted') return 'attempted';
  if (task.kind === 'writing' && (detail.stage === 'model' || detail.usedModel || task.startStage === 'model')) return 'supported';
  const parts = [...(detail.answers || []), ...(detail.naming ? [detail.naming] : [])];
  if (usedSupport(detail) || parts.some((part) => usedSupport(part) || part.mode === 'supported')) return 'supported';
  if (detail.mode === 'supported') return 'supported';
  if (detail.mode === 'independent') return 'independent';
  // Old completed records lack evidence of independent performance.
  return 'unknown';
}

export function summarizeBlock(session, completed, details, block) {
  const totals = { independent: 0, supported: 0, attempted: 0, unknown: 0, revealed: 0, retries: 0, audio: 0, naming: [], writing: [], forms: [] };
  session.tasks.forEach((task, index) => {
    if (task.block !== block) return;
    const detail = details[index] || {};
    if (completed[index]) totals[resultMode(task, detail)] += 1;
    const parts = [detail, ...(detail.answers || [])];
    totals.revealed += parts.filter((part) => part.answerRevealed).length;
    totals.audio += parts.filter((part) => part.usedAudio).length;
    totals.retries += parts.reduce((sum, part) => sum + Math.max(0, (part.attempts || 0) - 1) + (part.errors || 0), 0);
    if (task.kind === 'semantic' && detail.naming?.done) totals.naming.push({ word: task.word, mode: resultMode({ kind: 'choice' }, detail.naming) });
    if (task.kind === 'writing') {
      Object.entries(detail.stageResults || {}).forEach(([stage, result]) => totals.writing.push({ word: task.word, stage, mode: result.mode }));
    }
    if (task.kind === 'conversation' && detail.responseForm) totals.forms.push(detail.responseForm);
  });
  return totals;
}
