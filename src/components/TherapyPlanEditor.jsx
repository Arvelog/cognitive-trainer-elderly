import { useId, useState } from 'react';
import { MAX_PLAN_WORDS, parsePlanWords } from '../data/therapyPlan';

const today = () => new Date().toISOString().slice(0, 10);

export function TherapyPlanEditor({ plan, onChange }) {
  const id = useId();
  const [words, setWords] = useState(plan.words.join('\n'));
  const [note, setNote] = useState(plan.note);
  const [status, setStatus] = useState('');
  const parsed = parsePlanWords(words);
  const save = (event) => {
    event.preventDefault();
    const changed = parsed.join('|') !== plan.words.join('|');
    onChange({ words: parsed, note, from: changed ? today() : plan.from || today() });
    setStatus(parsed.length ? 'План збережено. Слова з’являтимуться в заняттях по одному.' : 'План очищено.');
  };

  return <details className="practice-settings therapy-plan">
    <summary>Для близьких: план від логопеда</summary>
    <div className="practice-settings__body">
      <p>Запишіть слова, над якими логопед радить працювати найближчі тижні. У кожному занятті одне з них потрапить у вправу на ознаки й називання, а слово, якого немає в словнику застосунку, — у письмо під диктовку. Щоденник покаже, як ішло кожне слово.</p>
      <form className="therapy-plan__form" onSubmit={save}>
        <label htmlFor={`${id}-words`}><strong>Слова з плану</strong><span className="form-note">До {MAX_PLAN_WORDS}, кожне з нового рядка або через кому</span>
          <textarea id={`${id}-words`} rows={4} value={words} onChange={(event) => setWords(event.target.value)} placeholder={'чашка\nліки\nонука'} />
        </label>
        {parsed.length > MAX_PLAN_WORDS && <p className="form-note">Збережуться перші {MAX_PLAN_WORDS} слів.</p>}
        <label htmlFor={`${id}-note`}><strong>Що порадив логопед, необов’язково</strong>
          <textarea id={`${id}-note`} rows={2} maxLength={300} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Наприклад: більше письма, давати час на відповідь" />
        </label>
        <button className="start-button" type="submit">Зберегти план</button>
      </form>
      <p className="form-note" role="status">{status}</p>
    </div>
  </details>;
}
