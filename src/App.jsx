import { useEffect, useReducer, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Headphones,
  HeartHandshake,
  Home,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  FindWordTask,
  ListenTask,
  ListenButton,
  PairTask,
  PhraseTask,
  SceneTask,
  StrongWordsTask,
} from './components/therapyTasks';
import { createTherapySession, SESSION_STEPS } from './data/therapySession';
import { newProgress, restoreProgress, speechTotals, STORAGE_KEY, therapyReducer } from './lib/therapyProgress';

const loadSavedSession = () => {
  try {
    return restoreProgress(window.localStorage.getItem(STORAGE_KEY)) || newProgress();
  } catch {
    return newProgress();
  }
};

function ProgressRail({ currentStep, completed }) {
  return (
    <ol className="progress-rail" aria-label="Шість кроків заняття">
      {SESSION_STEPS.map((step, index) => {
        const state = index === currentStep ? 'current' : completed[index] ? 'done' : 'upcoming';
        return (
          <li key={step.short} data-state={state} aria-label={`Крок ${index + 1}: ${step.title}${completed[index] ? ', виконано' : ''}`} aria-current={index === currentStep ? 'step' : undefined}>
            <span className="progress-rail__beat">{completed[index] ? <Check aria-hidden="true" /> : index + 1}</span>
            <span>{step.short}</span>
          </li>
        );
      })}
    </ol>
  );
}
function Brand({ compact = false }) {
  return (
    <div className="brand" data-compact={compact || undefined}>
      <span className="brand__mark" aria-hidden="true">П</span>
      <div>
        <strong>Поруч</strong>
        <span>домашня практика мовлення</span>
      </div>
    </div>
  );
}

function HomeScreen({ saved, finished, currentStep, persisted, onStart, onResume, onSummary }) {
  const [confirmNew, setConfirmNew] = useState(false);

  return (
    <div className="home-screen">
      <header className="home-header">
        <Brand />
        <div className="home-header__meta"><Clock3 aria-hidden="true" /> 6 кроків · близько 10 хв</div>
      </header>

      <main className="home-main" tabIndex={-1}>
        <section className="home-copy">
          <p className="home-kicker"><HeartHandshake aria-hidden="true" /> Для занять удвох</p>
          <h1>Знайомі слова.<br /><em>Разом.</em></h1>
          <p className="home-lead">
            Слухайте, обирайте й говоріть разом. У вашому темпі.
          </p>
          <p className="home-duration"><Clock3 aria-hidden="true" /> 6 кроків · близько 10 хв</p>
          {saved && <p className="saved-session" role="status"><Check aria-hidden="true" /> {persisted ? 'Збережено · крок' : 'Крок'} {currentStep + 1} із 6</p>}
          {finished && <p className="saved-session"><Check aria-hidden="true" /> Попереднє заняття завершено</p>}
          <div className="home-actions">
            {saved ? (
              <>
                <button className="start-button" type="button" onClick={onResume}>
                  Продовжити заняття <ArrowRight aria-hidden="true" />
                </button>
                <button className="secondary-button" type="button" onClick={() => setConfirmNew(true)}>
                  <RotateCcw aria-hidden="true" /> Нове заняття
                </button>
              </>
            ) : (
              <button className="start-button" type="button" onClick={onStart}>
                {finished ? 'Нове заняття' : 'Почати заняття'} <ArrowRight aria-hidden="true" />
              </button>
            )}
            {finished && <button className="secondary-button" type="button" onClick={onSummary}>Підсумок заняття</button>}
          </div>
          {confirmNew && (
            <div className="restart-notice" role="group" aria-label="Нове заняття">
              <p>Почати заново? Поточне заняття буде замінено.</p>
              <button className="secondary-button" type="button" onClick={() => setConfirmNew(false)}>Залишити поточне</button>
              <button className="text-action" type="button" onClick={onStart}>Так, почати заново</button>
            </div>
          )}
          <p className="clinical-note">Домашня практика доповнює, але не замінює роботу з логопедом.</p>
        </section>

        <section className="home-demo" aria-label="Приклад вправи">
          <p className="demo-caption">Приклад вправи</p>
          <div className="demo-label"><Headphones aria-hidden="true" /> Послухайте. Скажіть разом.</div>
          <div className="demo-word">ЧАЙ</div>
          <ListenButton text="чай" />
          <p className="demo-reassurance">Самостійно або разом —<br />обидві спроби цінні.</p>
        </section>
      </main>

      <div className="home-footer-line" aria-hidden="true">
        {SESSION_STEPS.map((step) => <span key={step.short}>{step.short}</span>)}
      </div>
    </div>
  );
}

function Summary({ completed, details, onRestart, onHome }) {
  const completeCount = completed.filter(Boolean).length;
  const speech = speechTotals(details[5]);
  return (
    <main className="summary-screen" tabIndex={-1}>
      <Brand compact />
      <section className="summary-panel">
        <div className="summary-symbol"><Check aria-hidden="true" /></div>
        <p className="task-eyebrow">Заняття завершено</p>
        <h1>Сьогодні ви були поруч.</h1>
        <p className="summary-lead">Повністю виконано {completeCount} із {SESSION_STEPS.length} кроків. Важлива не оцінка, а спокійна практика й жива спроба.</p>
        {(speech.independent + speech.together > 0) && (
          <div className="summary-stats">
            <div><strong>{speech.independent || 0}</strong><span>сказала сама</span></div>
            <div><strong>{speech.together || 0}</strong><span>сказали разом</span></div>
          </div>
        )}
        <div className="summary-actions">
          <button className="start-button" type="button" onClick={onHome}>
            <Home aria-hidden="true" /> На головну
          </button>
          <button className="secondary-button" type="button" onClick={onRestart}>
            Нове заняття <Sparkles aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [progress, dispatch] = useReducer(therapyReducer, undefined, loadSavedSession);
  const { session, currentStep, completed, details, status } = progress;
  const [view, setView] = useState('home');
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    try {
      if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  }, [progress, session]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.speechSynthesis?.cancel();
    document.querySelector('main')?.focus({ preventScroll: true });
  }, [currentStep, view]);

  const startNew = () => {
    dispatch({ type: 'start', session: createTherapySession() });
    setView('session');
  };

  const goNext = () => {
    dispatch({ type: 'next' });
    if (currentStep === SESSION_STEPS.length - 1) setView('summary');
  };

  if (view === 'home') {
    return <><SaveNotice failed={saveFailed} /><HomeScreen saved={Boolean(session) && status === 'active'} finished={Boolean(session) && status === 'completed'} currentStep={currentStep} persisted={!saveFailed} onStart={startNew} onResume={() => setView('session')} onSummary={() => setView('summary')} /></>;
  }

  if (view === 'summary') {
    return <><SaveNotice failed={saveFailed} /><Summary completed={completed} details={details} onRestart={startNew} onHome={() => setView('home')} /></>;
  }

  const Task = [ListenTask, FindWordTask, PairTask, PhraseTask, SceneTask, StrongWordsTask][currentStep];
  const taskData = session[['listen', 'find', 'pair', 'phrase', 'scene'][currentStep]];
  const done = completed[currentStep];

  return (
    <div className="session-screen">
      <SaveNotice failed={saveFailed} />
      <header className="session-header">
        <button className="home-link" type="button" onClick={() => setView('home')} aria-label="Повернутися на головну">
          <Home aria-hidden="true" />
        </button>
        <Brand compact />
        <span className="session-count">{currentStep + 1} з {SESSION_STEPS.length}</span>
      </header>
      <ProgressRail currentStep={currentStep} completed={completed} />

      <main className="session-main" tabIndex={-1} aria-label={`Крок ${currentStep + 1}: ${SESSION_STEPS[currentStep].title}`}>
        <Task key={`${session.id}-${currentStep}`} data={taskData} words={session.strongWords} progress={details[currentStep] || {}} onProgress={(value) => dispatch({ type: 'progress', index: currentStep, progress: value })} />
        {done && <button className="text-action repeat-button" type="button" onClick={() => dispatch({ type: 'repeat', index: currentStep })}><RotateCcw aria-hidden="true" /> Повторити крок</button>}
      </main>

      <nav className="session-nav" aria-label="Навігація заняттям">
        <button className="nav-button nav-button--back" type="button" onClick={() => dispatch({ type: 'back' })} disabled={currentStep === 0}>
          <ArrowLeft aria-hidden="true" /> Назад
        </button>
        <div className="session-nav__status">
          {done ? <><Check aria-hidden="true" /> Крок готовий</> : 'Можна пропустити без відповіді'}
        </div>
        <button className={`nav-button ${done ? 'nav-button--next' : 'nav-button--skip'}`} type="button" onClick={goNext}>
          {currentStep === SESSION_STEPS.length - 1 ? (done ? 'Завершити' : 'Завершити зараз') : (done ? 'Далі' : 'Пропустити')} <ArrowRight aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

function SaveNotice({ failed }) {
  return failed ? <p className="save-notice" role="alert">Не вдалося зберегти заняття на цьому пристрої. Не закривайте сторінку, щоб продовжити.</p> : null;
}
