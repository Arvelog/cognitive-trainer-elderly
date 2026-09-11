import { useEffect, useRef } from 'react';
import { BookOpen, Calculator, Check, Lightbulb, Link2, ListOrdered, MessageCircle, PencilLine, RotateCcw } from 'lucide-react';
import { ChoiceButtons, ListenButton, TaskFrame } from './therapyTasks';
import { PRACTICE_BLOCKS } from '../data/practiceSession';

const ICONS = { understanding: BookOpen, meaning: Link2, logic: ListOrdered, numbers: Calculator, writing: PencilLine, communication: MessageCircle };
function Frame({ data, instruction, coach, children }) {
  const block = PRACTICE_BLOCKS.find((item) => item.id === data.block);
  return <TaskFrame icon={ICONS[data.block]} eyebrow={block.short} title={data.title} instruction={instruction || data.instruction} coach={coach}>{children}</TaskFrame>;
}

function Hint({ shown, onToggle, children, label = 'Підказка' }) {
  return <div className="practice-hint">
    <button type="button" className="hint-button" aria-expanded={shown} onClick={onToggle}><Lightbulb aria-hidden="true" />{label}</button>
    {shown && <div className="hint-content">{children}</div>}
  </div>;
}

function ChoiceTask({ data, progress, onProgress }) {
  return <Frame data={data} instruction={data.instruction || 'Оберіть відповідь. Можна міркувати вголос або разом.'} coach={data.block === 'numbers' ? 'Можна рахувати на пальцях або з олівцями. Труднощі з читанням числа не завжди означають труднощі з кількістю. Якщо некомфортно — пропустіть.' : 'Не поспішайте. Прочитайте завдання вголос за потреби. Після вибору запитайте «Чому?» — відповідь може бути словом або жестом.'}>
    <div className={`practice-stimulus ${data.equation ? 'practice-stimulus--number' : ''}`}>
      {data.emoji && <span className="practice-emoji" aria-hidden="true">{data.emoji}</span>}
      <strong aria-label={data.visualCount ? 'Яблука для підрахунку' : undefined}>{data.stimulus}</strong>
    </div>
    {!data.visualCount && <ListenButton text={data.stimulus.replace('−', ' мінус ').replace('+', ' плюс ').replace('= ?', ' дорівнює скільки?')} label="Послухати завдання" />}
    {data.hint && !progress.done && <Hint shown={Boolean(progress.hint)} onToggle={() => onProgress({ ...progress, hint: !progress.hint })}>
      <p>{data.hint}</p>
      {data.dots && <div className="counting-dots" aria-hidden="true">{data.dots.map((n, i) => <span key={i}>{i > 0 && <b>+</b>}{Array.from({ length: n }, (_, j) => <i key={j} />)}</span>)}</div>}
    </Hint>}
    <ChoiceButtons {...data} progress={progress} onProgress={(next) => onProgress({ ...progress, ...next })} />
  </Frame>;
}

function SemanticTask({ data, progress, onProgress }) {
  const index = progress.question || 0;
  const questionHeading = useRef(null);
  useEffect(() => {
    if (index > 0) {
      questionHeading.current?.focus({ preventScroll: true });
      questionHeading.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, [index]);
  const answers = progress.answers || [];
  const question = data.questions[index];
  const current = answers[index] || {};
  return <Frame data={data} instruction="Знайдемо кілька ознак. Потім назвіть предмет ще раз." coach="Спочатку запропонуйте свою відповідь. Варіанти допомагають, якщо слово не знаходиться. Наприкінці з’єднайте ознаки в коротку фразу.">
    <div className="practice-stimulus semantic-stimulus"><span className="practice-emoji" aria-hidden="true">{data.emoji}</span><strong>{data.word}</strong></div>
    {progress.done ? <div className="practice-completion" role="status"><Check aria-hidden="true" /><p>Ознаки знайшли. Спробуйте ще раз назвати предмет і сказати, для чого він.</p><ListenButton text={data.word} label="Почути назву" /></div> : <>
      <p className="round-label">Ознака {index + 1} з {data.questions.length}</p>
      <h2 className="subtask-title" tabIndex={-1} ref={questionHeading}>{question.prompt}</h2>
      <ListenButton text={question.prompt} label="Послухати запитання" />
      <ChoiceButtons {...question} progress={current} onProgress={(next) => {
        const updated = [...answers]; updated[index] = next;
        onProgress({ ...progress, answers: updated });
      }} />
      {current.done && <button className="confirm-button" type="button" onClick={() => onProgress({ ...progress, question: Math.min(index + 1, data.questions.length - 1), done: index === data.questions.length - 1 })}>{index === data.questions.length - 1 ? 'Ознаки готові' : 'Наступна ознака'} <Check aria-hidden="true" /></button>}
    </>}
  </Frame>;
}

function SequenceTask({ data, progress, onProgress }) {
  const selected = progress.selected || [];
  const choose = (step) => {
    if (progress.done || selected.includes(step)) return;
    if (step !== data.steps[selected.length]) return onProgress({ ...progress, retry: true });
    const next = [...selected, step];
    onProgress({ ...progress, selected: next, retry: false, done: next.length === data.steps.length });
  };
  return <Frame data={data} coach="Прочитайте дії разом. Можна показати їх жестами. Тут не потрібне перетягування: один дотик обирає одну дію.">
    <p className="round-label">{progress.done ? 'Усі дії на своїх місцях' : `Оберіть дію ${selected.length + 1} з ${data.steps.length}`}</p>
    <div className="sequence-choices">
      {data.choices.map((step) => {
        const position = selected.indexOf(step);
        return <button className="choice-button" type="button" key={step} onClick={() => choose(step)} disabled={position >= 0 || progress.done} data-state={position >= 0 ? 'correct' : undefined}><span className="sequence-number">{position >= 0 ? position + 1 : '•'}</span>{step}</button>;
      })}
    </div>
    <div className="task-feedback" role="status">{progress.done ? 'Послідовність готова. Промовте або покажіть її разом.' : progress.retry ? 'Ця дія буде пізніше. Спробуйте іншу або відкрийте підказку.' : 'Що спочатку, а що потім?'}</div>
    {!progress.done && <Hint shown={Boolean(progress.hint)} onToggle={() => onProgress({ ...progress, hint: !progress.hint })}><p>Зараз: {data.steps[selected.length]}</p><ListenButton text={data.steps[selected.length]} label="Почути наступну дію" /></Hint>}
    {selected.length > 0 && <ol className="sequence-result" aria-label="Обраний порядок">{selected.map((step) => <li key={step}>{step}</li>)}</ol>}
  </Frame>;
}

function Outcomes({ done, mode, onMark, writing = false, partnerResponse }) {
  const labels = writing ? ['Написала сама', 'Написали з допомогою', 'Спробували'] : ['Вийшло самостійно', 'Разом / із підказкою', 'Жестом або інакше'];
  const modes = writing ? ['independent', 'supported', 'attempted'] : ['independent', 'supported', 'alternative'];
  return <div className="practice-outcomes">
    {partnerResponse && <p className="conversation-response"><strong>Після спроби · для людини поруч</strong>{partnerResponse} Потім оберіть нижче, як вийшло.</p>}
    {!partnerResponse && <p className="outcome-label">Для людини поруч: як вийшло?</p>}
    <div className="outcome-buttons">{labels.map((label, i) => <button key={label} type="button" className="secondary-button" disabled={done} aria-pressed={mode === modes[i]} onClick={() => onMark(modes[i])}>{mode === modes[i] && <Check aria-hidden="true" />}{label}</button>)}</div>
    {done && <p className="task-feedback" role="status">Спробу збережено. Можна рухатися далі.</p>}
  </div>;
}

function WritingTask({ data, progress, onProgress }) {
  const stage = progress.stage || 'write';
  const revealed = stage === 'model';
  const change = (patch) => onProgress({ ...progress, ...patch });
  return <Frame data={data} instruction={stage === 'recall' ? 'Закрийте попередній запис. Напишіть слово ще раз із пам’яті.' : revealed ? 'Подивіться на зразок. Спишіть слово в зошит.' : 'Напишіть олівцем у зошиті, що зображено. Не поспішайте.'} coach="Не називайте предмет до першої спроби. Якщо важко: ознака → перша літера → зразок. Можна списати, сховати зразок і спробувати з пам’яті. Рухові труднощі з письмом не є оцінкою мовлення; можна написати одну літеру або пропустити.">
    <img className="writing-picture" src={data.image} alt="Малюнок для письмового завдання; назва відкриється за запитом" />
    {revealed && <div className="writing-model"><strong>{data.word}</strong><ListenButton text={data.word} label="Почути назву" /><p>{data.accepted}</p></div>}
    {stage === 'recall' && <p className="recall-note">Зразок сховано. Новий рядок — нова спроба.</p>}
    {!progress.done && <div className="writing-tools">
      <div className="writing-actions">
        {!revealed && <button type="button" className="secondary-button" onClick={() => change({ stage: 'model', usedModel: true, hint: false })}>Показати зразок</button>}
        {revealed && <button type="button" className="confirm-button" onClick={() => change({ stage: 'recall', hint: false, firstLetter: false })}><RotateCcw aria-hidden="true" />Сховати й написати з пам’яті</button>}
      </div>
      {!revealed && <Hint shown={Boolean(progress.hint)} onToggle={() => change({ hint: !progress.hint, usedHint: true })} label="Допомогти пригадати"><p>{data.hint}</p><button className="text-action" type="button" onClick={() => change({ firstLetter: true })}>Показати першу літеру</button>{progress.firstLetter && <strong className="first-letter">{data.first}…</strong>}</Hint>}
    </div>}
    <Outcomes writing done={progress.done} mode={progress.mode} onMark={(mode) => change({ done: true, mode })} />
  </Frame>;
}

function ConversationTask({ data, progress, onProgress }) {
  return <Frame data={data} instruction={data.prompt} coach={data.coach}>
    {data.setup && <p className="conversation-setup"><strong>Перед початком · для людини поруч</strong>{data.setup}</p>}
    {data.image && <img className="scene-image" src={data.image} alt="Сцена для розповіді" />}
    {data.directions ? <ol className="conversation-directions" aria-label="Що зробити">{data.directions.map((direction) => <li key={direction}>{direction}</li>)}</ol> : <p className="conversation-situation">{data.situation}</p>}
    <ListenButton text={[data.prompt, ...(data.directions || [data.situation])].filter(Boolean).join(' ')} label="Послухати, що зробити" />
    {!progress.done && <Hint shown={Boolean(progress.hint)} onToggle={() => onProgress({ ...progress, hint: !progress.hint, usedHint: true })} label="Початок фрази"><strong className="subtask-title">{data.cue}</strong><button type="button" className="text-action" onClick={() => onProgress({ ...progress, model: true, usedModel: true })}>Показати приклад фрази</button></Hint>}
    {progress.model && <div className="hint-content"><p>{data.model}</p><ListenButton text={data.model} label="Почути приклад" /><p className="conversation-note">Власна відповідь теж підходить.</p></div>}
    <Outcomes done={progress.done} mode={progress.mode} partnerResponse={data.partnerResponse} onMark={(mode) => onProgress({ ...progress, mode, done: true })} />
  </Frame>;
}

const TASKS = { choice: ChoiceTask, semantic: SemanticTask, sequence: SequenceTask, writing: WritingTask, conversation: ConversationTask };
export function PracticeTask(props) {
  const Task = TASKS[props.data.kind];
  return <Task {...props} />;
}
