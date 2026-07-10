import { useEffect, useMemo, useState } from 'react';
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
  Volume2,
} from 'lucide-react';
import {
  FindWordTask,
  ListenTask,
  PairTask,
  PhraseTask,
  SceneTask,
  StrongWordsTask,
} from './components/therapyTasks';
import { createTherapySession, SESSION_STEPS } from './data/therapySession';
import { speakText } from './lib/audio';

const STORAGE_KEY = 'poruch_active_session_v1';

const loadSavedSession = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (!saved?.session?.id || !Array.isArray(saved.completed)) return null;
    return {
      session: saved.session,
      currentStep: Math.min(Math.max(Number(saved.currentStep) || 0, 0), SESSION_STEPS.length - 1),
      completed: saved.completed.slice(0, SESSION_STEPS.length),
      details: saved.details || {},
    };
  } catch {
    return null;
  }
};

function ProgressRail({ currentStep, completed }) {
  return (
    <ol className="progress-rail" aria-label="Шість кроків заняття">
      {SESSION_STEPS.map((step, index) => {
        const state = completed[index] ? 'done' : index === currentStep ? 'current' : 'upcoming';
        return (
          <li key={step.short} data-state={state} aria-current={index === currentStep ? 'step' : undefined}>
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

function HomeScreen({ saved, onStart, onResume }) {
  const [speaking, setSpeaking] = useState(false);
  const previewWord = () => {
    speakText('чай', { rate: 0.62 });
    setSpeaking(true);
    window.setTimeout(() => setSpeaking(false), 1100);
  };

  return (
    <div className="home-screen">
      <header className="home-header">
        <Brand />
        <div className="home-header__meta"><Clock3 aria-hidden="true" /> 6 кроків · близько 10 хв</div>
      </header>

      <main className="home-main">
        <section className="home-copy">
          <p className="home-kicker"><HeartHandshake aria-hidden="true" /> Для занять удвох</p>
          <h1>Коротке заняття.<br />Знайомі слова.<br /><em>Разом.</em></h1>
          <p className="home-lead">
            Спокійна практика для людини з афазією: одне завдання за раз, великі підказки й жодних штрафів за допомогу.
          </p>
          <div className="home-actions">
            {saved ? (
              <>
                <button className="start-button" type="button" onClick={onResume}>
                  Продовжити заняття <ArrowRight aria-hidden="true" />
                </button>
                <button className="secondary-button" type="button" onClick={onStart}>
                  <RotateCcw aria-hidden="true" /> Нове заняття
                </button>
              </>
            ) : (
              <button className="start-button" type="button" onClick={onStart}>
                Почати заняття <ArrowRight aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="clinical-note">Домашня практика доповнює, але не замінює роботу з логопедом.</p>
        </section>

        <section className="home-demo" aria-label="Приклад вправи">
          <div className="demo-rail" aria-hidden="true">
            {SESSION_STEPS.map((step, index) => <span key={step.short} data-active={index === 0 || undefined}>{index + 1}</span>)}
          </div>
          <div className="demo-label"><Headphones aria-hidden="true" /> Послухайте. Скажіть разом.</div>
          <div className="demo-word">ЧАЙ</div>
          <button className="demo-listen" type="button" onClick={previewWord}>
            <Volume2 aria-hidden="true" /> {speaking ? 'Слухаємо…' : 'Почути слово'}
          </button>
          <div className="demo-outcomes" aria-hidden="true">
            <span>Сказала сама</span><span>Сказали разом</span>
          </div>
          <p>Обидва результати добрі.</p>
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
  const speech = details[5];
  return (
    <main className="summary-screen">
      <Brand compact />
      <section className="summary-panel">
        <div className="summary-symbol"><Check aria-hidden="true" /></div>
        <p className="task-eyebrow">Заняття завершено</p>
        <h1>Сьогодні ви були поруч.</h1>
        <p className="summary-lead">Пройдено {completeCount} із {SESSION_STEPS.length} кроків. Важлива не оцінка, а спокійна практика й жива спроба.</p>
        {speech && (
          <div className="summary-stats">
            <div><strong>{speech.independent || 0}</strong><span>сказала сама</span></div>
            <div><strong>{speech.together || 0}</strong><span>сказали разом</span></div>
          </div>
        )}
        <div className="summary-actions">
          <button className="start-button" type="button" onClick={onRestart}>
            Нове заняття <Sparkles aria-hidden="true" />
          </button>
          <button className="secondary-button" type="button" onClick={onHome}>
            <Home aria-hidden="true" /> На головну
          </button>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const initial = useMemo(loadSavedSession, []);
  const [view, setView] = useState('home');
  const [session, setSession] = useState(initial?.session || null);
  const [currentStep, setCurrentStep] = useState(initial?.currentStep || 0);
  const [completed, setCompleted] = useState(initial?.completed || Array(SESSION_STEPS.length).fill(false));
  const [details, setDetails] = useState(initial?.details || {});

  useEffect(() => {
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ session, currentStep, completed, details }));
  }, [session, currentStep, completed, details]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelector('.session-main')?.focus({ preventScroll: true });
  }, [currentStep, view]);

  const startNew = () => {
    setSession(createTherapySession());
    setCurrentStep(0);
    setCompleted(Array(SESSION_STEPS.length).fill(false));
    setDetails({});
    setView('session');
  };

  const completeStep = (index, result = {}) => {
    setCompleted((current) => current.map((value, itemIndex) => itemIndex === index ? true : value));
    setDetails((current) => ({ ...current, [index]: result }));
  };

  const goNext = () => {
    if (currentStep === SESSION_STEPS.length - 1) setView('summary');
    else setCurrentStep((value) => value + 1);
  };

  if (view === 'home') {
    return <HomeScreen saved={Boolean(session)} onStart={startNew} onResume={() => setView('session')} />;
  }

  if (view === 'summary') {
    return <Summary completed={completed} details={details} onRestart={startNew} onHome={() => setView('home')} />;
  }

  const tasks = [
    <ListenTask data={session.listen} onComplete={(result) => completeStep(0, result)} />,
    <FindWordTask data={session.find} onComplete={(result) => completeStep(1, result)} />,
    <PairTask data={session.pair} onComplete={(result) => completeStep(2, result)} />,
    <PhraseTask data={session.phrase} onComplete={(result) => completeStep(3, result)} />,
    <SceneTask data={session.scene} onComplete={(result) => completeStep(4, result)} />,
    <StrongWordsTask words={session.strongWords} onComplete={(result) => completeStep(5, result)} />,
  ];

  return (
    <div className="session-screen">
      <header className="session-header">
        <button className="home-link" type="button" onClick={() => setView('home')} aria-label="Повернутися на головну">
          <ArrowLeft aria-hidden="true" />
        </button>
        <Brand compact />
        <span className="session-count">{currentStep + 1} з {SESSION_STEPS.length}</span>
      </header>
      <ProgressRail currentStep={currentStep} completed={completed} />

      <main className="session-main" tabIndex={-1} aria-label={`Крок ${currentStep + 1}: ${SESSION_STEPS[currentStep].title}`}>
        <div key={`${session.id}-${currentStep}`}>{tasks[currentStep]}</div>
      </main>

      <nav className="session-nav" aria-label="Навігація заняттям">
        <button className="nav-button nav-button--back" type="button" onClick={() => setCurrentStep((value) => Math.max(0, value - 1))} disabled={currentStep === 0}>
          <ArrowLeft aria-hidden="true" /> Назад
        </button>
        <div className="session-nav__status">
          {completed[currentStep] ? <><Check aria-hidden="true" /> Крок готовий</> : 'Можна перейти далі у будь-який момент'}
        </div>
        <button className="nav-button nav-button--next" type="button" onClick={goNext}>
          {currentStep === SESSION_STEPS.length - 1 ? 'Завершити' : 'Далі'} <ArrowRight aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
