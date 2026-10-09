import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Calculator, Check, Clock3, HeartHandshake, Leaf, Link2, ListOrdered, MessageCircle, PencilLine, Pause, Play, ShieldCheck, X } from 'lucide-react';
import { getStepCount, PRACTICE_BLOCKS } from '../data/practiceSession';
import { levelLabel, RICHER_SETTINGS } from '../data/practiceLevels';
import { PracticeSettings } from './PracticeSettings';

export const BLOCK_ICONS = { understanding: BookOpen, meaning: Link2, logic: ListOrdered, numbers: Calculator, writing: PencilLine, communication: MessageCircle };

export function Brand({ compact = false }) {
  return <div className="brand" data-compact={compact || undefined}><span className="brand__mark" aria-hidden="true"><HeartHandshake /></span><div><strong>Поруч<span className="brand__dot">.</span></strong><span>практика мовлення</span></div></div>;
}

function ReplaceSessionDialog({ pending, onCancel, onConfirm }) {
  const dialog = useRef(null);
  const keepCurrent = useRef(null);
  useEffect(() => {
    if (pending) {
      dialog.current?.showModal();
      keepCurrent.current?.focus();
    }
    else dialog.current?.close();
  }, [pending]);
  return <dialog ref={dialog} className="restart-dialog" aria-labelledby="restart-title" aria-describedby="restart-description" onCancel={onCancel} onClose={onCancel}>
    <button className="dialog-close" type="button" onClick={onCancel} aria-label="Закрити"><X aria-hidden="true" /></button>
    <span className="section-icon"><BookOpen aria-hidden="true" /></span>
    <h2 id="restart-title">Почати нове заняття?</h2>
    <p id="restart-description">Воно замінить незавершене заняття та його відповіді. Можна повернутися й продовжити з того самого місця.</p>
    <div className="dialog-actions"><button ref={keepCurrent} className="start-button" type="button" onClick={onCancel}>Залишити поточне</button><button className="secondary-button" type="button" onClick={onConfirm}>Почати нове</button></div>
  </dialog>;
}

export function HomeScreen({ progress, persisted, onStart, onResume, onSummary, settings, onSettings, settingsSaved, children }) {
  const { session, status, currentStep, completed } = progress;
  const saved = Boolean(session) && status === 'active';
  const finished = Boolean(session) && status === 'completed';
  const [pending, setPending] = useState(null);
  const requestStart = (mode = 'extended', block = null, levels = null) => saved ? setPending({ mode, block, levels }) : onStart(mode, block, levels);
  const completedCount = completed.filter(Boolean).length;
  const sessionName = saved && session.mode !== 'extended' ? 'Знайомі слова' : saved && session.blockId ? PRACTICE_BLOCKS.find((b) => b.id === session.blockId)?.short : 'Практика на сьогодні';
  const fullLevels = saved ? session.levels : settings.blocks;
  const expanded = Object.values(fullLevels || {}).filter((level) => level > 1).length >= 3;

  return <div className="home-screen">
    <a className="skip-link" href="#main">До основного вмісту</a>
    <header className="home-header"><Brand /><nav aria-label="Головна навігація"><a className="header-link" href="#practice">Обрати вправи</a><a className="header-link" href="#guide"><HeartHandshake aria-hidden="true" />Для близьких</a></nav></header>
    <main id="main" className="home-main" tabIndex={-1}>
      <section className="home-intro" aria-labelledby="welcome-title"><p className="eyebrow"><span className="eyebrow-line" />МІСЦЕ ДЛЯ СПОКІЙНОЇ ПРАКТИКИ</p><h1 id="welcome-title">Маленькі кроки.<br className="mobile-break" /> <em>Більше спілкування.</em></h1><p>Займайтеся разом із близькою людиною. Без поспіху, у своєму темпі.</p></section>
      <section className="session-options" aria-label="Оберіть заняття">
        <article className="daily-card">
          <div className="daily-card__top"><span className="card-label"><BookOpen aria-hidden="true" />{saved ? 'ПРОДОВЖУЄМО РАЗОМ' : 'ПОВНЕ ЗАНЯТТЯ'}</span><span className="duration-pill"><Clock3 aria-hidden="true" />{saved && session.mode !== 'extended' ? 'близько 10 хв' : saved && session.blockId ? PRACTICE_BLOCKS.find((b) => b.id === session.blockId)?.minutes : expanded ? 'у своєму темпі' : '15–20 хв'}</span></div>
          <h2>{sessionName}</h2><p>{saved ? `Ви зупинилися на завданні ${currentStep + 1} з ${getStepCount(session)}. Продовжимо з цього місця.` : 'Слухайте, знаходьте слова, пишіть і розмовляйте. Шість блоків — одне невелике заняття.'}</p>
          {saved && <div className="saved-progress"><progress value={completedCount} max={getStepCount(session)} aria-label="Виконані завдання" /><span>{completedCount} з {getStepCount(session)} виконано</span></div>}
          <div className="daily-card__actions"><button className="start-button start-button--light" type="button" onClick={saved ? onResume : () => requestStart()}>{saved ? 'Продовжити заняття' : 'Почати заняття'}<ArrowRight aria-hidden="true" /></button>{saved ? <button className="daily-reset" type="button" onClick={() => requestStart()}>Почати заново</button> : <span className="daily-reassurance"><HeartHandshake aria-hidden="true" />Удвох легше</span>}</div>
          {saved && <span className="daily-save"><ShieldCheck aria-hidden="true" />{persisted ? 'Відповіді збережено на цьому пристрої' : 'Збереження недоступне — залишайте сторінку відкритою'}</span>}
          <button className="daily-richer" type="button" onClick={() => requestStart('extended', null, RICHER_SETTINGS)}>Спробувати змістовніший набір<ArrowRight aria-hidden="true" /></button>
          <div className="daily-richer-note">Тексти, планування, покупки й власні повідомлення. Можна виконати частину.</div>
        </article>
        <article className="short-card"><span className="short-card__icon"><Leaf aria-hidden="true" /></span><span className="card-label">ТРОХИ МЕНШЕ НА СЬОГОДНІ</span><h2>Знайомі слова</h2><p>Послухати, знайти, промовити.<br />{levelLabel('shortWords', settings.shortWords)}.</p><button className="short-start" type="button" onClick={() => requestStart('short')}><span><Play aria-hidden="true" />Почати коротке заняття</span><ArrowRight aria-hidden="true" /></button><span className="short-duration"><Clock3 aria-hidden="true" />близько 10 хвилин</span></article>
      </section>
      {finished && <button className="previous-session" type="button" onClick={onSummary}><span><Check aria-hidden="true" />Попереднє заняття завершено</span><span>Переглянути підсумок<ArrowRight aria-hidden="true" /></span></button>}
      <PracticeSettings settings={settings} onChange={onSettings} saved={settingsSaved} />
      <section id="practice" className="practice-library" aria-labelledby="practice-title"><div className="section-heading"><div><p className="eyebrow">ОКРЕМІ ВПРАВИ</p><h2 id="practice-title">Що попрактикуємо?</h2></div><p>Можна обрати лише один блок.</p></div><div className="block-grid">{PRACTICE_BLOCKS.map((block, index) => { const Icon = BLOCK_ICONS[block.id]; return <button key={block.id} className="block-card" data-block={block.id} type="button" onClick={() => requestStart('extended', block.id)} aria-label={`${block.short} · ${block.minutes}`}><div className="block-card__top"><span className="block-icon"><Icon aria-hidden="true" /></span><span className="block-duration">{block.minutes}</span></div><h3>{block.short}</h3><p>{block.description}</p><div className="block-card__bottom"><span>БЛОК {String(index + 1).padStart(2, '0')}</span><ArrowRight aria-hidden="true" /></div></button>; })}</div></section>
      <aside className="preparation-note"><span className="section-icon"><PencilLine aria-hidden="true" /></span><div><strong>Перед початком</strong><p>Приготуйте зошит та олівець. Оберіть тихе місце, де зручно сидіти поруч.</p></div><span className="preparation-note__aside"><Pause aria-hidden="true" />Перерву можна зробити будь-коли.</span></aside>
      <section id="guide" className="caregiver-guide" aria-label="Для близьких">{children}</section>
    </main>
    <footer className="home-footer"><span>Поруч. Кожне слово має значення.</span><span>Домашня практика доповнює заняття з логопедом.</span></footer>
    <ReplaceSessionDialog pending={pending} onCancel={() => setPending(null)} onConfirm={() => pending && onStart(pending.mode, pending.block, pending.levels)} />
  </div>;
}
