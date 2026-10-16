import { useEffect, useRef } from 'react';
import { ArrowRight, BookOpen, Calculator, Check, Lightbulb, Link2, ListOrdered, MessageCircle, PencilLine, RotateCcw } from 'lucide-react';
import { ChoiceButtons, ListenButton, TaskFrame } from './therapyTasks';
import { VoiceRecorder } from './VoiceRecorder';
import { PRACTICE_BLOCKS } from '../data/practiceSession';
import { levelLabel } from '../data/practiceLevels';
import { nextSequenceSteps, recordOwnResponse, recordReasoningAnswer, recordSemanticName, recordWritingStage, usedSupport } from '../lib/practiceResults';

const ICONS = { understanding: BookOpen, meaning: Link2, logic: ListOrdered, numbers: Calculator, writing: PencilLine, communication: MessageCircle };
function Frame({ data, instruction, coach, source, children }) {
  const block = PRACTICE_BLOCKS.find((item) => item.id === data.block);
  const level = data.level ? data.levelLabel || levelLabel(data.block, data.level, data.curriculumVersion) : null;
  const review = data.review && 'Повторюємо слово, з яким минулого разу знадобилася допомога. Якщо зараз вийде самостійно, воно повернеться пізніше.';
  return <TaskFrame icon={ICONS[data.block]} eyebrow={block.short} title={data.title} instruction={instruction || data.instruction} coach={review ? `${review} ${coach || ''}`.trim() : coach} level={level} source={source}>{children}</TaskFrame>;
}
function ReasoningTask({ data, progress, onProgress }) {
  const index = Math.min(progress.question || 0, data.questions.length - 1);
  const heading = useRef(null);
  useEffect(() => { if (index > 0) heading.current?.focus({ preventScroll: true }); }, [index]);
  const question = data.questions[index];
  const current = progress.answers?.[index] || {};
  const update = (next) => onProgress(recordReasoningAnswer(progress, index, next, data.questions.length));
  return <Frame data={data} coach="Текст можна перечитувати й слухати. Ставте одне запитання за раз. Для власної відповіді приймайте зрозуміле формулювання з потрібним змістом; пояснення не має збігатися зі зразком дослівно." source={<>
    <div className="practice-context"><p>{data.stimulus}</p></div>
    <ListenButton text={data.stimulus} label="Послухати ситуацію" onListen={() => onProgress({ ...progress, usedAudio: true })} />
  </>}>
    <p className="round-label">Запитання {index + 1} з {data.questions.length}</p>
    <h2 className="subtask-title" tabIndex={-1} ref={heading}>{question.prompt}</h2>
    <ListenButton text={question.prompt} label="Послухати запитання" onListen={() => update({ ...current, usedAudio: true })} />
    {question.hint && !current.done && <Hint shown={Boolean(current.hint)} onToggle={() => update({ ...current, hint: !current.hint, usedHint: true })}><p>{question.hint}</p><ListenButton text={question.hint} label="Послухати підказку" /></Hint>}
    <AnswerResponse data={question} progress={current} onProgress={update} />
    {current.done && index < data.questions.length - 1 && <button className="confirm-button" type="button" onClick={() => onProgress({ ...progress, question: index + 1 })}>Наступне запитання<ArrowRight aria-hidden="true" /></button>}
  </Frame>;
}
function Hint({ shown, onToggle, children, label = 'Підказка' }) {
  return <div className="practice-hint"><button type="button" className="hint-button" aria-expanded={shown} onClick={onToggle}><Lightbulb aria-hidden="true" />{label}</button>{shown && <div className="hint-content">{children}</div>}</div>;
}
function Outcomes({ done, mode, onMark, writing = false, stage, disabled = false, label = 'Для людини поруч: як вийшло?' }) {
  const labels = writing ? stage === 'model' ? ['Списала сама', 'Списали разом', 'Спробували списати'] : ['Написала сама', 'Написали з допомогою', 'Спробували'] : ['Вийшло самостійно', 'Разом / із підказкою', 'Спробували'];
  const modes = ['independent', 'supported', 'attempted'];
  return <div className="practice-outcomes"><p className="outcome-label">{label}</p><div className="outcome-buttons">{labels.map((text, i) => <button key={text} type="button" className="secondary-button" disabled={done || disabled} aria-pressed={mode === modes[i]} onClick={() => onMark(modes[i])}>{mode === modes[i] && <Check aria-hidden="true" />}{text}</button>)}</div>{done && <p className="task-feedback" role="status">Спробу збережено.</p>}</div>;
}
function AnswerResponse({ data, progress, onProgress }) {
  if (data.ownResponse && progress.responseKind === 'own' && progress.done) return <p className="task-feedback" role="status">Власну спробу збережено. Можна рухатися далі.</p>;
  return <ChoiceButtons {...data} progress={progress} onProgress={onProgress} />;
}
function Counters({ values, operator = '+' }) {
  return <div className="counting-dots" role="img" aria-label={`${values[0]} ${operator === '+' ? 'плюс' : 'мінус'} ${values[1]} предметів`}>
    {values.map((count, index) => <span key={index} aria-hidden="true">{index > 0 && <b>{operator}</b>}{Array.from({ length: count }, (_, j) => <i key={j} />)}</span>)}
  </div>;
}
function ChoiceTask({ data, progress, onProgress }) {
  const hintSteps = data.hintSteps || (data.hint ? [data.hint] : []);
  const hintIndex = Math.min(progress.hintStep || 0, hintSteps.length - 1);
  return <Frame data={data} instruction={data.instruction || 'Оберіть відповідь. Можна міркувати вголос або разом.'} coach={data.block === 'numbers' ? 'Можна рахувати з олівцями. Оберіть посильний рівень наступного заняття в налаштуваннях для близьких. Якщо некомфортно — пропустіть.' : 'Дайте час на відповідь. Озвучення завдання допомагає читати; зразок відкривайте за потреби.'}>
    <div className={`practice-stimulus ${data.equation ? 'practice-stimulus--number' : ''}`}>
      {data.image && <img className="personal-photo" src={data.image} alt="Ваше фото; підпис оберіть нижче" />}
      {data.emoji && <span className="practice-emoji" aria-hidden="true">{data.emoji}</span>}{data.stimulus && <strong>{data.stimulus}</strong>}
      {data.counters && <Counters values={data.counters} operator={data.operator} />}
    </div>
    {!data.visualCount && <ListenButton text={[data.stimulus.replace('−', ' мінус ').replace('+', ' плюс ').replace('= ?', ' дорівнює скільки?'), data.question || data.title].join(' ')} label="Послухати завдання" onListen={() => onProgress({ ...progress, usedAudio: true })} />}
    {hintSteps.length > 0 && !progress.done && <Hint shown={Boolean(progress.hint)} onToggle={() => onProgress({ ...progress, hint: !progress.hint, usedHint: true })}>
      <p className="round-label">Крок {hintIndex + 1} з {hintSteps.length}</p><p>{hintSteps[hintIndex]}</p>
      <ListenButton text={hintSteps[hintIndex]} label="Послухати підказку" />
      {data.dots && <Counters values={data.dots} />}
      {hintIndex < hintSteps.length - 1 && <button className="secondary-button" type="button" onClick={() => onProgress({ ...progress, hintStep: hintIndex + 1, usedHint: true })}>Наступний крок підказки</button>}
    </Hint>}
    <AnswerResponse data={data} progress={progress} onProgress={onProgress} />
  </Frame>;
}
function SemanticTask({ data, progress, onProgress }) {
  const index = Math.min(progress.question || 0, data.questions.length - 1);
  const questionHeading = useRef(null);
  useEffect(() => { if (index > 0 || progress.featuresDone) questionHeading.current?.focus({ preventScroll: true }); }, [index, progress.featuresDone]);
  const answers = progress.answers || [];
  const question = data.questions[index];
  const current = answers[index] || {};
  const naming = progress.naming || {};
  const showWord = data.showWord ?? true;
  const markName = (mode) => onProgress(recordSemanticName(progress, showWord, mode));
  return <Frame data={data} instruction={progress.featuresDone ? 'Тепер назвіть предмет словом, письмом або жестом.' : 'Одне запитання за раз. Потім спробуємо назвати предмет.'} coach="Власна відповідь може бути словом або жестом. Відкривайте назву за потреби. Називання записуємо окремо від вибору ознак.">
    <div className="practice-stimulus semantic-stimulus"><span className="practice-emoji" aria-hidden="true">{data.emoji}</span>{(showWord || progress.nameShown) && <strong>{data.word}</strong>}</div>
    {progress.done ? <div className="practice-completion" role="status"><Check aria-hidden="true" /><p>Спробу збережено.</p></div> : progress.featuresDone ? <>
      <h2 className="subtask-title" tabIndex={-1} ref={questionHeading}>Як називається предмет?</h2>
      {!showWord && !progress.nameShown && <button className="hint-button" type="button" onClick={() => onProgress({ ...progress, nameShown: true, usedModel: true })}>Показати назву</button>}
      {(showWord || progress.nameShown) && <ListenButton text={data.word} label="Почути назву" onListen={() => onProgress({ ...progress, usedAnswerAudio: true })} />}
      <VoiceRecorder title={`Назва предмета: ${data.word}`} />
      <Outcomes mode={naming.mode} onMark={markName} label="Для людини поруч: як назвали предмет?" />
    </> : <>
      <p className="round-label">Ознака {index + 1} з {data.questions.length}</p><h2 className="subtask-title" tabIndex={-1} ref={questionHeading}>{question.prompt}</h2>
      <ListenButton text={question.prompt} label="Послухати запитання" onListen={() => onProgress({ ...progress, usedAudio: true })} />
      <AnswerResponse data={question} progress={current} onProgress={(next) => { const updated = [...answers]; updated[index] = next; onProgress({ ...progress, answers: updated }); }} />
      {current.done && <button className="confirm-button" type="button" onClick={() => onProgress({ ...progress, question: Math.min(index + 1, data.questions.length - 1), ...(index === data.questions.length - 1 ? data.curriculumVersion >= 2 ? { featuresDone: true } : { done: true } : {}) })}>{index === data.questions.length - 1 ? 'Спробувати назвати предмет' : 'Наступна ознака'}<Check aria-hidden="true" /></button>}
    </>}
  </Frame>;
}
function SequenceTask({ data, progress, onProgress }) {
  const selected = progress.selected || [];
  const nextSteps = nextSequenceSteps(data, selected);
  const choose = (step) => {
    if (progress.done || selected.includes(step)) return;
    if (!nextSteps.includes(step)) return onProgress({ ...progress, retry: true, errors: (progress.errors || 0) + 1 });
    const next = [...selected, step];
    onProgress({ ...progress, selected: next, retry: false, done: next.length === data.steps.length, mode: usedSupport(progress) || progress.hint ? 'supported' : 'independent' });
  };
  return <Frame data={data} coach="Прочитайте дії разом або покажіть жестами. Один дотик обирає одну дію. Підказка називає наступний крок; її використання збережеться." source={data.stimulus && <><div className="practice-context"><p>{data.stimulus}</p></div><ListenButton text={data.stimulus} label="Послухати умови" onListen={() => onProgress({ ...progress, usedAudio: true })} /></>}>
    <p className="round-label">{progress.done ? 'Усі дії на своїх місцях' : `Оберіть дію ${selected.length + 1} з ${data.steps.length}`}</p>
    <div className="sequence-choices">{data.choices.map((step) => { const position = selected.indexOf(step); return <button className="choice-button" type="button" key={step} onClick={() => choose(step)} disabled={position >= 0 || progress.done} data-state={position >= 0 ? 'correct' : undefined}><span className="sequence-number">{position >= 0 ? position + 1 : '•'}</span>{step}</button>; })}</div>
    <div className="task-feedback" role="status">{progress.done ? 'Послідовність готова.' : progress.retry ? 'Ця дія буде пізніше. Спробуйте іншу або відкрийте підказку.' : 'Що спочатку, а що потім?'}</div>
    {!progress.done && <Hint shown={Boolean(progress.hint)} onToggle={() => onProgress({ ...progress, hint: !progress.hint, usedHint: true })}><p>Можна зараз: {nextSteps[0]}</p><ListenButton text={nextSteps[0]} label="Почути наступну дію" /></Hint>}
    {selected.length > 0 && <ol className="sequence-result" aria-label="Обраний порядок">{selected.map((step) => <li key={step}>{step}</li>)}</ol>}
  </Frame>;
}
function WritingTask({ data, progress, onProgress }) {
  const stage = progress.stage || data.startStage || 'write';
  const revealed = stage === 'model';
  const stageContent = useRef(null);
  useEffect(() => { if (stage !== 'write') stageContent.current?.focus({ preventScroll: true }); }, [stage]);
  const change = (patch) => onProgress({ ...progress, ...patch });
  const stageResult = progress.stageResults?.[stage];
  const message = data.writingType === 'message';
  const model = data.modelText || data.word;
  const mark = (mode) => { const next = recordWritingStage(progress, stage, mode); if (data.level === 3 && !message && stage === 'write') next.done = false; onProgress(next); };
  const recall = () => change({ stage: 'recall', hint: false, firstLetter: false, usedModel: Boolean(progress.usedModel || revealed) });
  return <Frame data={data} instruction={stage === 'recall' ? 'Закрийте попередній запис. Напишіть його ще раз із пам’яті.' : revealed ? 'Спишіть зразок у зошит. Це окрема спроба списування.' : message ? 'Напишіть у зошиті коротке повідомлення за ситуацією. Власне формулювання підходить.' : data.writingGoal || 'Напишіть олівцем у зошиті, що зображено. Не поспішайте.'} coach={message ? 'Дайте час на власне повідомлення. Перевірте, чи передано потрібні деталі. Не вимагайте однакового формулювання зі зразком. Приклад відкривайте за потреби; якщо руці важко, можна сказати або пропустити.' : 'Не називайте предмет до першої спроби. Допомога: ознака → перша літера → зразок. Списування й письмо з пам’яті записуємо окремо. Якщо руці важко, достатньо літери або можна пропустити.'} source={(data.image || data.stimulus) && <>
    {data.image && <img className="writing-picture" src={data.image} alt={data.personal ? 'Ваше фото для письмового завдання' : 'Малюнок для письмового завдання; назва відкриється за запитом'} />}
    {data.stimulus && <><div className="practice-context"><p>{data.stimulus}</p></div><ListenButton text={data.stimulus} label="Послухати ситуацію" onListen={() => change({ usedAudio: true })} /></>}
  </>}>
    <p className="round-label">{stage === 'write' ? 'Перша спроба' : revealed ? 'Списування' : 'Письмо з пам’яті'}</p>
    {revealed && <div className={`writing-model${data.modelText ? ' writing-model--sentence' : ''}`} ref={stageContent} tabIndex={-1} aria-label="Зразок запису"><strong>{model}</strong><ListenButton text={model} label="Послухати зразок" onListen={() => change({ usedAnswerAudio: true })} /><p>{data.accepted}</p></div>}
    {stage === 'recall' && <p className="recall-note" ref={stageContent} tabIndex={-1}>Зразок сховано. Закрийте й запис у зошиті.</p>}
    {!progress.done && <div className="writing-tools">
      {!revealed && !stageResult && <button type="button" className="secondary-button" onClick={() => change({ stage: 'model', usedModel: true, hint: false })}>Показати зразок</button>}
      {revealed && <button type="button" className="confirm-button" onClick={recall}><RotateCcw aria-hidden="true" />Сховати й написати з пам’яті</button>}
      {stage === 'write' && stageResult && <button type="button" className="confirm-button" onClick={recall}>Закрити запис і написати з пам’яті</button>}
      {!revealed && !stageResult && <Hint shown={Boolean(progress.hint)} onToggle={() => change({ hint: !progress.hint, usedHint: true, [stage === 'recall' ? 'recallHint' : 'writeHint']: true })} label="Допомогти пригадати"><p>{data.hint}</p>{data.first && <button className="text-action" type="button" onClick={() => change({ firstLetter: true, usedHint: true, [stage === 'recall' ? 'recallHint' : 'writeHint']: true })}>Показати першу літеру</button>}{progress.firstLetter && <strong className="first-letter">{data.first}…</strong>}</Hint>}
    </div>}
    {(stage === 'recall' ? progress.recallHint : progress.writeHint) && <p className="form-note">У цій спробі використали підказку. Допомога залишиться в записі.</p>}
    <Outcomes writing stage={stage} done={progress.done || Boolean(stageResult)} mode={stageResult?.mode || (progress.done ? progress.mode : undefined)} onMark={mark} />
    {!progress.done && stage === 'model' && stageResult && <button className="secondary-button finish-copy" type="button" onClick={() => change({ done: true, mode: stageResult.mode === 'attempted' ? 'attempted' : 'supported', usedModel: true })}>Завершити після списування</button>}
  </Frame>;
}
const RESPONSE_FORMS = { word: 'Словом', phrase: 'Фразою', writing: 'Письмом', gesture: 'Жестом' };
function ConversationTask({ data, progress, onProgress }) {
  const index = Math.min(progress.directionIndex || 0, (data.directions?.length || 1) - 1);
  const question = useRef(null);
  useEffect(() => { if (index > 0) question.current?.focus({ preventScroll: true }); }, [index]);
  const story = Boolean(data.guided || data.scenario === 'photo' || (data.scenario === 'scene' && data.curriculumVersion >= 2));
  return <Frame data={data} instruction={data.prompt} coach={data.coach} source={(data.setup || data.image || (data.guided && data.situation)) && <>
    {data.setup && <p className="conversation-setup"><strong>Перед початком · для людини поруч</strong>{data.setup}</p>}
    {data.image && <img className="scene-image" src={data.image} alt={data.personal ? 'Ваше фото для розповіді' : 'Сцена для розповіді'} />}
    {data.guided && data.situation && <><div className="practice-context"><p>{data.situation}</p></div><ListenButton text={data.situation} label="Послухати ситуацію" onListen={() => onProgress({ ...progress, usedAudio: true })} /></>}
  </>}>
    {story ? <><p className="round-label">Запитання {index + 1} з {data.directions.length}</p><h2 className="subtask-title" tabIndex={-1} ref={question}>{data.directions[index]}</h2></> : data.directions ? <ol className="conversation-directions" aria-label="Що зробити">{data.directions.map((direction) => <li key={direction}>{direction}</li>)}</ol> : <p>{data.situation}</p>}
    {data.responseGoal && <p>{data.responseGoal}</p>}
    <ListenButton text={story ? data.directions[index] : [data.prompt, ...(data.directions || [data.situation])].filter(Boolean).join(' ')} label="Послухати, що зробити" onListen={() => onProgress({ ...progress, usedAudio: true })} />
    {!progress.done && <Hint shown={Boolean(progress.hint)} onToggle={() => onProgress({ ...progress, hint: !progress.hint, usedHint: true })} label="Початок фрази"><strong className="subtask-title">{data.cue}</strong><button type="button" className="text-action" onClick={() => onProgress({ ...progress, model: true, usedModel: true })}>Показати приклад фрази</button></Hint>}
    {progress.model && <div className="hint-content"><p>{data.model}</p><ListenButton text={data.model} label="Почути приклад" /><p>Власна відповідь теж підходить.</p></div>}
    {story && index < data.directions.length - 1 && !progress.done ? <button className="confirm-button" type="button" onClick={() => onProgress({ ...progress, directionIndex: index + 1 })}>Наступне запитання</button> : <>
      {data.partnerResponse && <p className="conversation-response"><strong>Після спроби · для людини поруч</strong>{data.partnerResponse}</p>}
      {!progress.done && <VoiceRecorder title={data.title} />}
      <fieldset className="response-forms" disabled={progress.done}><legend>Для людини поруч: як відповіли?</legend><div>{Object.entries(RESPONSE_FORMS).map(([key, text]) => <label key={key} data-selected={progress.responseForm === key}><input type="radio" name="response-form" value={key} checked={progress.responseForm === key} onChange={() => onProgress({ ...progress, responseForm: key })} />{text}</label>)}</div></fieldset>
      {!progress.done && !progress.responseForm && <p className="form-note">Спочатку оберіть спосіб відповіді, потім — чи потрібна була допомога.</p>}
      <Outcomes done={progress.done} mode={progress.mode} disabled={!progress.responseForm} onMark={(mode) => onProgress(recordOwnResponse(progress, mode))} />
    </>}
  </Frame>;
}
const TASKS = { choice: ChoiceTask, reasoning: ReasoningTask, semantic: SemanticTask, sequence: SequenceTask, writing: WritingTask, conversation: ConversationTask };
export function PracticeTask(props) { const Task = TASKS[props.data.kind]; return <Task {...props} />; }
