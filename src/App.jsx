import { useEffect, useReducer, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock3, HeartHandshake, Home, Pause, PencilLine, RotateCcw } from 'lucide-react';
import { FindWordTask, ListenTask, PairTask, PhraseTask, SceneTask, StrongWordsTask } from './components/therapyTasks';
import { PracticeTask } from './components/practiceTasks';
import { createTherapySession } from './data/therapySession';
import { createPracticeSession, getSessionBlocks, getSessionSteps, getStepCount, PRACTICE_BLOCKS } from './data/practiceSession';
import { newProgress, restoreProgress, speechTotals, STORAGE_KEY, therapyReducer } from './lib/therapyProgress';

const loadSavedSession = () => {
  try { return restoreProgress(window.localStorage.getItem(STORAGE_KEY)) || newProgress(); }
  catch { return newProgress(); }
};
function Brand({ compact = false }) {
  return <div className="brand" data-compact={compact || undefined}><span className="brand__mark" aria-hidden="true">П</span><div><strong>Поруч</strong><span>домашня практика мовлення</span></div></div>;
}
function ProgressRail({ session, currentStep, completed }) {
  const extended = session.mode === 'extended';
  const groups = getSessionBlocks(session);
  return <ol className="progress-rail" aria-label={extended ? 'Блоки заняття' : 'Кроки заняття'}>{groups.map((block, i) => {
    const indices = extended ? session.tasks.flatMap((task, j) => task.block === block.id ? [j] : []) : [i];
    const current = indices.includes(currentStep);
    const done = indices.every((j) => completed[j]);
    return <li key={block.id || block.short} data-state={current ? 'current' : done ? 'done' : 'upcoming'} aria-current={current ? 'step' : undefined} aria-label={`${block.short}${done ? ', виконано' : ''}`}><span className="progress-rail__beat">{done ? <Check aria-hidden="true" /> : i + 1}</span><span>{block.short}</span></li>;
  })}</ol>;
}
function EvidenceNote() {
  return <details className="evidence-note"><summary><BookOpen aria-hidden="true" />Для близьких: як побудовані вправи</summary>
    <p>Головна мета — розуміння, добір слів, читання, письмо й повсякденне спілкування. Складність і потрібні саме вам вправи варто узгодити з логопедом. Домашня практика доповнює роботу з ним.</p>
    <p>Завдання на ознаки предметів спираються на принцип семантичних підказок. Письмо пропонує спробу, списування та відтворення з пам’яті. Це спрощені домашні вправи, а не повні клінічні протоколи.</p>
    <p>Логіка й рахунок — додаткова практика побутових навичок. Немає підстав обіцяти, що самі приклади чи головоломки відновлюють мовлення. 15–20 хвилин — орієнтир для цього набору, а не лікувальна доза. Можна завершити раніше.</p>
    <p>Залишайте час на власну відповідь. Приймайте слова, письмо й жести. Якщо виникає втома або роздратування — зробіть перерву. Записи «сама / з допомогою» — спостереження близької людини, а не оцінка прогресу реабілітації.</p>
    <ul><li><a href="https://www.strokeguideline.org/chapter/communication-and-language/" target="_blank" rel="noreferrer">Настанова з реабілітації після інсульту, 2023</a></li><li><a href="https://www.asha.org/Practice-Portal/Clinical-Topics/Aphasia/" target="_blank" rel="noreferrer">ASHA: підходи до роботи з афазією</a></li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3929384/" target="_blank" rel="noreferrer">Дослідження письма: Copy and Recall Treatment</a></li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6700375/" target="_blank" rel="noreferrer">Big CACTUS: можливості й межі комп’ютерної практики</a></li></ul>
  </details>;
}
function HomeScreen({ progress, persisted, onStart, onResume, onSummary }) {
  const { session, status, currentStep } = progress;
  const saved = Boolean(session) && status === 'active';
  const finished = Boolean(session) && status === 'completed';
  const [pending, setPending] = useState(null);
  const requestStart = (mode = 'extended', block = null) => {
    if (saved) setPending({ mode, block });
    else onStart(mode, block);
  };
  return <div className="home-screen">
    <header className="home-header"><Brand /><div className="home-header__meta"><Clock3 aria-hidden="true" />6 блоків · 15–20 хв</div></header>
    <main className="home-main home-main--practice" tabIndex={-1}>
      <section className="home-copy">
        <p className="home-kicker"><HeartHandshake aria-hidden="true" />Для занять удвох</p>
        <h1>Слова. Думки.<br /><em>Життя поруч.</em></h1>
        <p className="home-lead">Слухайте, міркуйте, пишіть і розмовляйте. Короткими кроками, у вашому темпі.</p>
        <p className="home-duration"><Clock3 aria-hidden="true" />6 блоків · орієнтовно 15–20 хв</p>
        <p className="notebook-note"><PencilLine aria-hidden="true" />Приготуйте зошит та олівець.</p>
        {saved && <p className="saved-session" role="status"><Check aria-hidden="true" />{persisted ? 'Збережено' : 'Поточне заняття'} · завдання {currentStep + 1} з {getStepCount(session)}</p>}
        {finished && <p className="saved-session"><Check aria-hidden="true" />Попереднє заняття завершено</p>}
        <div className="home-actions">
          <button className="start-button" type="button" onClick={saved ? onResume : () => requestStart()}>{saved ? 'Продовжити заняття' : 'Почати 15–20 хв'}<ArrowRight aria-hidden="true" /></button>
          {saved && <button className="secondary-button" type="button" onClick={() => requestStart()}>Нове повне заняття</button>}
          <button className="secondary-button" type="button" onClick={() => requestStart('short')}>Знайомі слова · близько 10 хв</button>
          {finished && <button className="text-action" type="button" onClick={onSummary}>Підсумок попереднього заняття</button>}
        </div>
        {pending && <div className="restart-notice" role="group" aria-label="Заміна поточного заняття"><p>Нове заняття замінить поточне. Почати заново?</p><button type="button" className="secondary-button" onClick={() => setPending(null)}>Залишити поточне</button><button type="button" className="text-action" onClick={() => onStart(pending.mode, pending.block)}>Так, почати заново</button></div>}
        <p className="clinical-note">Не обов’язково пройти все. Можна пропустити завдання або зробити перерву.</p>
      </section>
      <section className="practice-plan" aria-labelledby="plan-title"><p className="demo-caption">Сьогодні в занятті</p><h2 id="plan-title">Різні навички.<br />Один спокійний ритм.</h2><ol>{PRACTICE_BLOCKS.map((block, i) => <li key={block.id}><span className="plan-number">{i + 1}</span><div><strong>{block.short}</strong><p>{block.description}</p></div><span className="plan-duration">{block.minutes}</span></li>)}</ol><details className="block-picker"><summary>Попрактикувати один блок</summary><div>{PRACTICE_BLOCKS.map((block) => <button key={block.id} className="secondary-button" type="button" onClick={() => requestStart('extended', block.id)}>{block.short}<span>{block.minutes}</span></button>)}</div></details></section>
      <EvidenceNote />
    </main>
  </div>;
}
function Summary({ progress, onHome, onRestart }) {
  const { session, completed, details } = progress;
  const extended = session.mode === 'extended';
  const speech = speechTotals(details[5]);
  return <main className="summary-screen" tabIndex={-1}><Brand compact /><section className="summary-panel"><div className="summary-symbol"><Check aria-hidden="true" /></div><p className="task-eyebrow">Заняття завершено</p><h1>Сьогодні ви були поруч.</h1><p className="summary-lead">Виконано {completed.filter(Boolean).length} із {completed.length} завдань. Важлива спокійна практика, а не оцінка.</p>
    {extended ? <div className="block-summary">{getSessionBlocks(session).map((block) => {
      const indices = session.tasks.flatMap((task, i) => task.block === block.id ? [i] : []);
      return <div key={block.id}><strong>{block.short}</strong><span>{indices.filter((i) => completed[i]).length} з {indices.length}</span></div>;
    })}</div> : (speech.independent + speech.together > 0) && <div className="summary-stats"><div><strong>{speech.independent}</strong><span>сказала сама</span></div><div><strong>{speech.together}</strong><span>сказали разом</span></div></div>}
    {extended && <p className="summary-note">Збережіть записи в зошиті: вони допоможуть обговорити з логопедом, що було посильно й де знадобилася допомога.</p>}
    <div className="summary-actions"><button className="start-button" type="button" onClick={onHome}><Home aria-hidden="true" />На головну</button><button className="secondary-button" type="button" onClick={onRestart}>Нове заняття</button></div>
  </section></main>;
}
function BreakScreen({ nextBlock, saveFailed, onContinue, onHome, onFinish }) {
  return <main className="summary-screen break-screen" tabIndex={-1}><Brand compact /><section className="summary-panel"><div className="summary-symbol"><Pause aria-hidden="true" /></div><p className="task-eyebrow">Можна перепочити</p><h1>У вашому темпі.</h1><p className="summary-lead">Відкладіть екран і відпочиньте стільки, скільки потрібно.</p>{nextBlock && <p className="next-block">Далі: <strong>{nextBlock.title}</strong> · {nextBlock.minutes}</p>}<div className="summary-actions"><button className="start-button" type="button" onClick={onContinue}>Продовжити<ArrowRight aria-hidden="true" /></button><button className="secondary-button" type="button" onClick={onHome}>Повернутися пізніше</button><button className="text-action" type="button" onClick={onFinish}>На сьогодні досить</button></div><p className="clinical-note">{saveFailed ? 'Не закривайте сторінку: збереження на пристрої недоступне.' : 'Місце й відповіді збережено на цьому пристрої.'}</p></section></main>;
}
export default function App() {
  const [progress, dispatch] = useReducer(therapyReducer, undefined, loadSavedSession);
  const { session, currentStep, completed, details } = progress;
  const [view, setView] = useState('home');
  const [saveFailed, setSaveFailed] = useState(false);
  useEffect(() => {
    try { if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); setSaveFailed(false); }
    catch { setSaveFailed(true); }
  }, [progress, session]);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); window.speechSynthesis?.cancel(); document.querySelector('main')?.focus({ preventScroll: true });
  }, [currentStep, view]);
  const startNew = (mode = 'extended', block = null) => { dispatch({ type: 'start', session: mode === 'short' ? createTherapySession() : createPracticeSession(block) }); setView('session'); };
  const goHome = () => setView('home');
  const finish = () => { dispatch({ type: 'finish' }); setView('summary'); };
  const notice = <SaveNotice failed={saveFailed} />;
  if (view === 'home') return <>{notice}<HomeScreen progress={progress} persisted={!saveFailed} onStart={startNew} onResume={() => setView('session')} onSummary={() => setView('summary')} /></>;
  if (view === 'summary') return <>{notice}<Summary progress={progress} onRestart={() => startNew()} onHome={goHome} /></>;
  const extended = session.mode === 'extended';
  const steps = getSessionSteps(session);
  const block = extended ? PRACTICE_BLOCKS.find((item) => item.id === steps[currentStep].block) : null;
  if (view === 'break') return <>{notice}<BreakScreen nextBlock={block} saveFailed={saveFailed} onContinue={() => setView('session')} onHome={goHome} onFinish={finish} /></>;
  const goNext = () => {
    dispatch({ type: 'next' });
    if (currentStep === steps.length - 1) setView('summary');
    else if (extended && steps[currentStep + 1].block !== steps[currentStep].block) setView('break');
  };
  const Task = extended ? PracticeTask : [ListenTask, FindWordTask, PairTask, PhraseTask, SceneTask, StrongWordsTask][currentStep];
  const data = extended ? steps[currentStep] : session[['listen', 'find', 'pair', 'phrase', 'scene'][currentStep]];
  const done = completed[currentStep];
  return <div className="session-screen">{notice}<header className="session-header"><button className="home-link" type="button" onClick={goHome} aria-label="Повернутися на головну"><Home aria-hidden="true" /></button><Brand compact /><div className="session-tools"><span className="session-count">{currentStep + 1} з {steps.length}</span><button className="pause-button" type="button" onClick={() => setView('break')}><Pause aria-hidden="true" />Перерва</button></div></header><ProgressRail session={session} currentStep={currentStep} completed={completed} />
    <main className="session-main" tabIndex={-1} aria-label={`Завдання ${currentStep + 1}: ${steps[currentStep].title}`}>
      <Task key={`${session.id}-${currentStep}`} data={data} words={session.strongWords} progress={details[currentStep] || {}} onProgress={(value) => dispatch({ type: 'progress', index: currentStep, progress: value })} />
      {done && <button className="text-action repeat-button" type="button" onClick={() => dispatch({ type: 'repeat', index: currentStep })}><RotateCcw aria-hidden="true" />Повторити завдання</button>}
    </main>
    <nav className="session-nav" aria-label="Навігація заняттям"><button className="nav-button nav-button--back" type="button" onClick={() => dispatch({ type: 'back' })} disabled={currentStep === 0}><ArrowLeft aria-hidden="true" />Назад</button><div className="session-nav__status">{done ? <><Check aria-hidden="true" />Завдання готове</> : 'Можна пропустити без відповіді'}</div><button className={`nav-button ${done ? 'nav-button--next' : 'nav-button--skip'}`} type="button" onClick={goNext}>{currentStep === steps.length - 1 ? (done ? 'Завершити' : 'Завершити зараз') : (done ? 'Далі' : 'Пропустити')}<ArrowRight aria-hidden="true" /></button></nav>
  </div>;
}
function SaveNotice({ failed }) {
  return failed ? <p className="save-notice" role="alert">Не вдалося зберегти заняття на цьому пристрої. Не закривайте сторінку, щоб продовжити.</p> : null;
}
