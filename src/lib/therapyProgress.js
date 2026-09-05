import { SESSION_STEPS, clarifyPhrase } from '../data/therapySession.js';

export const STORAGE_KEY = 'poruch_active_session_v1';

export const newProgress = (session = null) => ({
  session,
  currentStep: 0,
  completed: Array(SESSION_STEPS.length).fill(false),
  details: {},
  status: 'active',
});

export function restoreProgress(raw) {
  try {
    const saved = JSON.parse(raw);
    if (!saved?.session?.id || !Array.isArray(saved.completed)
      || !Array.isArray(saved.session.strongWords) || !saved.session.strongWords.length
      || !['listen', 'find', 'pair', 'phrase', 'scene'].every((key) => saved.session[key])) return null;
    const completed = SESSION_STEPS.map((_, index) => Boolean(saved.completed[index]));
    const details = { ...saved.details };
    completed.forEach((done, index) => {
      if (!done) return;
      details[index] = { ...details[index], done: true };
      const task = saved.session[['listen', 'find', 'pair', 'phrase', 'scene'][index]];
      if (task?.answer) details[index].chosen = task.answer;
    });
    return {
      session: { ...saved.session, phrase: clarifyPhrase(saved.session.phrase) },
      currentStep: Math.min(Math.max(Math.trunc(Number(saved.currentStep)) || 0, 0), SESSION_STEPS.length - 1),
      completed,
      details,
      status: saved.status === 'completed' || (saved.status == null && completed.every(Boolean)) ? 'completed' : 'active',
    };
  } catch {
    return null;
  }
}

export function therapyReducer(state, action) {
  switch (action.type) {
    case 'start': return newProgress(action.session);
    case 'progress': {
      if (state.status !== 'active' || state.completed[action.index]) return state;
      return {
        ...state,
        completed: state.completed.map((done, index) => index === action.index ? Boolean(action.progress.done) : done),
        details: { ...state.details, [action.index]: action.progress },
      };
    }
    case 'repeat': {
      if (state.status !== 'active') return state;
      const details = { ...state.details };
      delete details[action.index];
      return { ...state, details, completed: state.completed.map((done, index) => index === action.index ? false : done) };
    }
    case 'back': return { ...state, currentStep: Math.max(0, state.currentStep - 1) };
    case 'next': return state.currentStep === SESSION_STEPS.length - 1
      ? { ...state, status: 'completed' }
      : { ...state, currentStep: state.currentStep + 1 };
    default: return state;
  }
}

export function speechTotals(progress = {}) {
  if (!Array.isArray(progress.results)) return { independent: progress.independent || 0, together: progress.together || 0 };
  return {
    independent: progress.results.filter((mode) => mode === 'independent').length,
    together: progress.results.filter((mode) => mode === 'together').length,
  };
}
