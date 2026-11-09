import { useId, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { MAX_LINES, MAX_SCRIPTS, parseLines, SCRIPT_STAGES } from '../data/scripts';

export function ScriptsEditor({ scripts, onChange }) {
  const id = useId();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const full = scripts.length >= MAX_SCRIPTS;
  const submit = (event) => {
    event.preventDefault();
    const lines = parseLines(text);
    if (!title.trim()) { setError('Напишіть, що це за ситуація.'); return; }
    if (!lines.length) { setError('Напишіть хоча б одну репліку, кожну з нового рядка.'); return; }
    onChange([...scripts, { id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, title, lines, stage: 1, lastPracticed: null }]);
    setTitle(''); setText(''); setError('');
  };
  const remove = (script) => { if (window.confirm(`Видалити сценарій «${script.title}»?`)) onChange(scripts.filter((item) => item.id !== script.id)); };

  return <details className="practice-settings scripts-editor">
    <summary>Для близьких: свої розмови</summary>
    <div className="practice-settings__body">
      <p>Запишіть кілька реплік для справжньої ситуації: подзвонити доньці, попросити ліки в аптеці, привітати сусіда. Сценарій з’явиться в розмові замість одного із завдань. Коли він виходить самостійно, тексту на екрані стає менше: уся репліка, потім лише початок, потім без тексту.</p>
      {scripts.length > 0 && <ul className="personal-words__list scripts-editor__list" aria-label="Сценарії">{scripts.map((script) => <li key={script.id}>
        <span><strong>{script.title}</strong><span>{script.lines.length} репл. · {SCRIPT_STAGES[script.stage - 1]}</span></span>
        <button className="icon-action" type="button" onClick={() => remove(script)} aria-label={`Видалити «${script.title}»`} title="Видалити"><Trash2 aria-hidden="true" /></button>
      </li>)}</ul>}
      {full ? <p className="form-note">Додано {MAX_SCRIPTS} сценаріїв, це найбільше. Видаліть один, щоб додати новий.</p> : <form className="scripts-editor__form" onSubmit={submit} noValidate>
        <label htmlFor={`${id}-title`}><strong>Ситуація</strong><span className="form-note">Наприклад: дзвінок доньці</span>
          <input id={`${id}-title`} value={title} maxLength={60} autoComplete="off" onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label htmlFor={`${id}-lines`}><strong>Репліки людини</strong><span className="form-note">Кожна з нового рядка, до {MAX_LINES}. Короткі фрази, як кажете вдома.</span>
          <textarea id={`${id}-lines`} rows={5} value={text} onChange={(event) => setText(event.target.value)} placeholder={'Привіт, Олю!\nУ мене все добре.\nПриїжджай у неділю.'} />
        </label>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="start-button" type="submit">Додати сценарій</button>
      </form>}
    </div>
  </details>;
}
