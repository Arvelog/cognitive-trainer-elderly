import { useEffect, useState } from 'react';
import {
  Check,
  Ear,
  Hand,
  Headphones,
  HeartHandshake,
  Image as ImageIcon,
  Lightbulb,
  Link2,
  MessageCircle,
  Users,
  Volume2,
} from 'lucide-react';
import { speakText } from '../lib/audio';
import { speechTotals } from '../lib/therapyProgress';

function CoachNote({ children }) {
  return (
    <aside className="coach-note">
      <details>
        <summary><HeartHandshake aria-hidden="true" /><span>Як допомогти</span></summary>
        <p>{children}</p>
        <p className="coach-note__hint">
          Дайте 8–10 секунд на відповідь. Якщо важко — скажіть перший звук або промовте слово разом.
        </p>
      </details>
    </aside>
  );
}

export function TaskFrame({ icon: Icon, eyebrow, title, instruction, children, coach }) {
  return (
    <div className="task-layout">
      <section className="task-stage" aria-labelledby="task-title">
        <div className="task-heading">
          <div className="task-heading__icon"><Icon aria-hidden="true" /></div>
          <div>
            <p className="task-eyebrow">{eyebrow}</p>
            <h1 id="task-title">{title}</h1>
            <p>{instruction}</p>
          </div>
        </div>
        {children}
      </section>
      <CoachNote>{coach}</CoachNote>
    </div>
  );
}

export function ListenButton({ text, label = 'Почути слово', rate = 0.62 }) {
  const [speaking, setSpeaking] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    setSpeaking(false);
    setUnavailable(false);
    return () => window.speechSynthesis?.cancel();
  }, [text]);

  const play = () => {
    setUnavailable(false);
    const started = speakText(text, {
      rate,
      onEnd: () => setSpeaking(false),
      onError: () => { setSpeaking(false); setUnavailable(true); },
    });
    setSpeaking(started);
    if (!started) setUnavailable(true);
  };

  return (
    <div className="listen-control">
      <button className="listen-button" type="button" onClick={play} data-speaking={speaking || undefined} aria-label={label}>
        <Volume2 aria-hidden="true" />
        {speaking ? 'Слухаємо…' : label}
      </button>
      {unavailable && <span className="audio-notice" role="status">Звук недоступний. Прочитайте вголос.</span>}
    </div>
  );
}

export function ChoiceButtons({ options, answer, progress, onProgress, spoken }) {
  const { chosen = null, attempts = 0, done = false } = progress;
  const message = done ? 'Так. Саме так.' : chosen == null ? 'Оберіть один варіант.'
    : attempts > 1 ? `Правильна відповідь: ${answer}. Натисніть її разом.` : 'Це інший варіант. Спробуйте ще раз.';

  const choose = (option) => {
    if (done) return;
    onProgress({ chosen: option, attempts: attempts + 1, done: option === answer });
    if (option === answer) {
      speakText(spoken || answer, { rate: 0.68 });
    }
  };

  return (
    <>
      <div className="choice-grid">
        {options.map((option) => {
          const isCorrect = chosen === answer && option === answer;
          const isWrong = chosen === option && option !== answer;
          return (
            <button
              key={option}
              type="button"
              className="choice-button"
              data-state={isCorrect ? 'correct' : isWrong ? 'retry' : undefined}
              onClick={() => choose(option)}
              disabled={done}
              aria-pressed={chosen === option}
            >
              {isCorrect && <Check aria-hidden="true" />}
              {option}
            </button>
          );
        })}
      </div>
      <div className="task-feedback" data-positive={chosen === answer || undefined} role="status" aria-live="polite">
        {message}
      </div>
    </>
  );
}

export function ListenTask({ data, progress, onProgress }) {
  const done = Boolean(progress.done);
  const finish = () => {
    if (!done) onProgress({ done: true, mode: 'practice' });
  };

  return (
    <TaskFrame
      icon={Headphones}
      eyebrow="Крок 1 · слухаємо"
      title="Послухайте й скажіть"
      instruction="Можна повторити самостійно або разом."
      coach="Не виправляйте вимову одразу. Тут важлива сама спроба."
    >
      <div className="word-stage">
        <span className="word-stage__emoji" aria-hidden="true">{data.emoji}</span>
        <strong>{data.word}</strong>
        <span>Перший звук: {data.sound}</span>
      </div>
      <div className="primary-actions">
        <ListenButton text={data.word} />
        <button className="confirm-button" type="button" onClick={finish} disabled={done}>
          <Check aria-hidden="true" />
          {done ? 'Готово' : 'Спробували сказати'}
        </button>
      </div>
      <div className="task-feedback" data-positive={done || undefined} role="status" aria-live="polite">
        {done ? 'Чудово. Рухаємося далі.' : 'Можна слухати стільки разів, скільки потрібно.'}
      </div>
    </TaskFrame>
  );
}

export function FindWordTask({ data, progress, onProgress }) {
  return (
    <TaskFrame
      icon={Hand}
      eyebrow="Крок 2 · знаходимо"
      title={data.prompt}
      instruction="Торкніться потрібного слова."
      coach="Прочитайте обидва варіанти вголос, якщо самостійно вибрати важко."
    >
      <div className="visual-prompt" aria-label={`Зображення для слова ${data.answer}`}>{data.visual}</div>
      <ListenButton text={data.answer} label="Почути підказку" />
      <ChoiceButtons {...data} progress={progress} onProgress={onProgress} spoken={data.answer} />
    </TaskFrame>
  );
}

export function PairTask({ data, progress, onProgress }) {
  return (
    <TaskFrame
      icon={Link2}
      eyebrow="Крок 3 · поєднуємо"
      title="Що підходить разом?"
      instruction="Оберіть пару до слова."
      coach="Спочатку назвіть перше слово. Потім повільно прочитайте два варіанти."
    >
      <div className="pair-prompt">
        <span aria-hidden="true">{data.leadEmoji}</span>
        <strong>{data.lead}</strong>
        <b aria-hidden="true">+</b>
        <span className="pair-prompt__empty">?</span>
      </div>
      <ListenButton text={data.lead} label="Почути перше слово" />
      <ChoiceButtons {...data} progress={progress} onProgress={onProgress} />
    </TaskFrame>
  );
}

export function PhraseTask({ data, progress, onProgress }) {
  return (
    <TaskFrame
      icon={MessageCircle}
      eyebrow="Крок 4 · фраза"
      title="Закінчіть фразу"
      instruction="Оберіть останнє слово."
      coach="Проведіть пальцем під словами та промовте всю фразу разом."
    >
      <div className="phrase-prompt">
        <span>{data.lead}</span>
        <strong>…</strong>
      </div>
      <ListenButton text={data.lead} label="Почути початок" />
      <ChoiceButtons {...data} progress={progress} onProgress={onProgress} />
    </TaskFrame>
  );
}

export function SceneTask({ data, progress, onProgress }) {
  return (
    <TaskFrame
      icon={ImageIcon}
      eyebrow="Крок 5 · розуміємо"
      title={data.prompt}
      instruction="Подивіться й оберіть відповідь."
      coach="Спочатку дайте час просто роздивитися сцену. Не поспішайте читати варіанти."
    >
      <img className="scene-image" src={data.imageUrl} alt={data.alt} />
      <ChoiceButtons {...data} progress={progress} onProgress={onProgress} />
    </TaskFrame>
  );
}

export function StrongWordsTask({ words, progress, onProgress }) {
  const { results = [], hint = false, done = false } = progress;
  const current = results.length;
  const totals = speechTotals(progress);
  const word = words[Math.min(current, words.length - 1)];

  const mark = (mode) => {
    if (done) return;
    const next = [...results, mode];
    onProgress({ results: next, hint: false, done: next.length === words.length });
  };

  return (
    <TaskFrame
      icon={Ear}
      eyebrow="Крок 6 · говоримо"
      title="Сильні слова"
      instruction={done ? 'Усі чотири слова сьогодні прозвучали.' : `Одне слово за раз · ${current + 1} з ${words.length}`}
      coach="Обидва результати однаково цінні: самостійна спроба і слово, сказане разом."
    >
      {!done ? (
        <>
          <div className="word-stage word-stage--compact">
            <span className="word-stage__emoji" aria-hidden="true">{word.emoji}</span>
            <strong>{word.word}</strong>
          </div>
          <div className="primary-actions primary-actions--speech">
            <ListenButton text={word.word} />
            <button className="hint-button" type="button" onClick={() => onProgress({ ...progress, hint: !hint })} aria-expanded={hint}>
              <Lightbulb aria-hidden="true" />
              Підказка
            </button>
          </div>
          <p className="outcome-label">Для людини поруч: як вийшло?</p>
          <div className="choice-grid choice-grid--outcomes">
            <button className="choice-button choice-button--outcome" type="button" onClick={() => mark('independent')}>
              <Check aria-hidden="true" />
              Сказала сама
            </button>
            <button className="choice-button choice-button--outcome" type="button" onClick={() => mark('together')}>
              <Users aria-hidden="true" />
              Сказали разом
            </button>
          </div>
          {hint && (
            <div className="sound-hint" role="status">
              <span>Початок: {word.sound}…</span>
              <strong>{word.syllables}</strong>
              <ListenButton text={word.phrase} label={word.phrase} rate={0.68} />
            </div>
          )}
        </>
      ) : (
        <div className="speech-summary" role="status" aria-live="polite">
          <Check aria-hidden="true" />
          <h2>Чотири слова — готово</h2>
          <p>Сама: {totals.independent} · Разом: {totals.together}</p>
        </div>
      )}
    </TaskFrame>
  );
}
