import { useEffect, useRef, useState } from 'react';
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

const useCompleteOnce = (onComplete) => {
  const completeRef = useRef(false);
  return (details) => {
    if (completeRef.current) return;
    completeRef.current = true;
    onComplete(details);
  };
};

function CoachNote({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="coach-note">
      <div className="coach-note__label">
        <HeartHandshake aria-hidden="true" />
        <span>Для людини поруч</span>
      </div>
      <p>{children}</p>
      <button className="text-action" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <Lightbulb aria-hidden="true" />
        {open ? 'Сховати підказку' : 'Як допомогти'}
      </button>
      {open && (
        <div className="coach-note__hint" role="status">
          Дайте 8–10 секунд на відповідь. Якщо важко — скажіть перший звук або промовте слово разом.
        </div>
      )}
    </aside>
  );
}

function TaskFrame({ icon: Icon, eyebrow, title, instruction, children, coach }) {
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

function ListenButton({ text, label = 'Почути слово', rate = 0.62 }) {
  const [speaking, setSpeaking] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const play = () => {
    speakText(text, { rate });
    setSpeaking(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSpeaking(false), 1200);
  };

  return (
    <button className="listen-button" type="button" onClick={play} data-speaking={speaking || undefined}>
      <Volume2 aria-hidden="true" />
      {speaking ? 'Слухаємо…' : label}
    </button>
  );
}

function ChoiceButtons({ options, answer, onComplete, spoken }) {
  const [chosen, setChosen] = useState(null);
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const complete = useCompleteOnce(onComplete);

  const choose = (option) => {
    setChosen(option);
    if (option === answer) {
      setMessage('Так. Саме так.');
      speakText(spoken || answer, { rate: 0.68 });
      complete({ attempts: attempts + 1 });
      return;
    }
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setMessage(nextAttempts > 1 ? `Правильна відповідь: ${answer}. Натисніть її разом.` : 'Це інший варіант. Спробуйте ще раз.');
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
              aria-pressed={chosen === option}
            >
              {isCorrect && <Check aria-hidden="true" />}
              {option}
            </button>
          );
        })}
      </div>
      <div className="task-feedback" data-positive={chosen === answer || undefined} role="status" aria-live="polite">
        {message || 'Оберіть один варіант.'}
      </div>
    </>
  );
}

export function ListenTask({ data, onComplete }) {
  const [done, setDone] = useState(false);
  const complete = useCompleteOnce(onComplete);
  const finish = () => {
    setDone(true);
    complete({ mode: 'practice' });
  };

  return (
    <TaskFrame
      icon={Headphones}
      eyebrow="Крок 1 · слухаємо"
      title="Одне знайоме слово"
      instruction="Послухайте повільно. Потім скажіть як вийде."
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

export function FindWordTask({ data, onComplete }) {
  return (
    <TaskFrame
      icon={Hand}
      eyebrow="Крок 2 · знаходимо"
      title={data.prompt}
      instruction="Подивіться на знак і торкніться потрібного слова."
      coach="Прочитайте обидва варіанти вголос, якщо самостійно вибрати важко."
    >
      <div className="visual-prompt" aria-label={`Зображення для слова ${data.answer}`}>{data.visual}</div>
      <ListenButton text={data.answer} label="Почути підказку" />
      <ChoiceButtons {...data} onComplete={onComplete} spoken={data.answer} />
    </TaskFrame>
  );
}

export function PairTask({ data, onComplete }) {
  return (
    <TaskFrame
      icon={Link2}
      eyebrow="Крок 3 · поєднуємо"
      title="Що підходить разом?"
      instruction="Додайте до першого слова те, що з ним пов’язане."
      coach="Спочатку назвіть перше слово. Потім повільно прочитайте два варіанти."
    >
      <div className="pair-prompt">
        <span aria-hidden="true">{data.leadEmoji}</span>
        <strong>{data.lead}</strong>
        <b aria-hidden="true">+</b>
        <span className="pair-prompt__empty">?</span>
      </div>
      <ListenButton text={data.lead} label="Почути перше слово" />
      <ChoiceButtons {...data} onComplete={onComplete} />
    </TaskFrame>
  );
}

export function PhraseTask({ data, onComplete }) {
  return (
    <TaskFrame
      icon={MessageCircle}
      eyebrow="Крок 4 · фраза"
      title="Закінчіть коротку фразу"
      instruction="Прочитайте початок і виберіть останнє слово."
      coach="Проведіть пальцем під словами та промовте всю фразу разом."
    >
      <div className="phrase-prompt">
        <span>{data.lead}</span>
        <strong>…</strong>
      </div>
      <ListenButton text={data.lead} label="Почути початок" />
      <ChoiceButtons {...data} onComplete={onComplete} />
    </TaskFrame>
  );
}

export function SceneTask({ data, onComplete }) {
  return (
    <TaskFrame
      icon={ImageIcon}
      eyebrow="Крок 5 · розуміємо"
      title={data.prompt}
      instruction="Подивіться на знайому дію та виберіть коротку відповідь."
      coach="Спочатку дайте час просто роздивитися сцену. Не поспішайте читати варіанти."
    >
      <img className="scene-image" src={data.imageUrl} alt={data.alt} />
      <ChoiceButtons {...data} onComplete={onComplete} />
    </TaskFrame>
  );
}

export function StrongWordsTask({ words, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [hint, setHint] = useState(false);
  const [results, setResults] = useState([]);
  const complete = useCompleteOnce(onComplete);
  const done = results.length === words.length;
  const word = words[Math.min(current, words.length - 1)];

  const mark = (mode) => {
    if (done) return;
    const next = [...results, mode];
    setResults(next);
    setHint(false);
    if (next.length === words.length) {
      complete({
        independent: next.filter((item) => item === 'independent').length,
        together: next.filter((item) => item === 'together').length,
      });
    } else {
      setCurrent((value) => value + 1);
    }
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
          <div className="primary-actions">
            <ListenButton text={word.word} />
            <button className="hint-button" type="button" onClick={() => setHint((value) => !value)} aria-expanded={hint}>
              <Lightbulb aria-hidden="true" />
              Підказка
            </button>
          </div>
          {hint && (
            <div className="sound-hint" role="status">
              <span>Початок: {word.sound}…</span>
              <strong>{word.syllables}</strong>
              <ListenButton text={word.phrase} label={word.phrase} rate={0.68} />
            </div>
          )}
          <p className="outcome-label">Як вийшло цього разу?</p>
          <div className="choice-grid">
            <button className="choice-button choice-button--outcome" type="button" onClick={() => mark('independent')}>
              <Check aria-hidden="true" />
              Сказала сама
            </button>
            <button className="choice-button choice-button--outcome" type="button" onClick={() => mark('together')}>
              <Users aria-hidden="true" />
              Сказали разом
            </button>
          </div>
        </>
      ) : (
        <div className="speech-summary" role="status" aria-live="polite">
          <Check aria-hidden="true" />
          <h2>Чотири слова — готово</h2>
          <p>Сама: {results.filter((item) => item === 'independent').length} · Разом: {results.filter((item) => item === 'together').length}</p>
        </div>
      )}
    </TaskFrame>
  );
}

