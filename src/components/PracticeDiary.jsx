import { useRef } from 'react';
import { Printer } from 'lucide-react';
import { PRACTICE_BLOCKS } from '../data/practiceSession';
import { LEVEL_OPTIONS } from '../data/practiceLevels';
import { levelSuggestions, weeklyDiary } from '../lib/practiceHistory';
import { planProgress } from '../data/therapyPlan';
import { CUE_KINDS, CUE_LABELS } from '../lib/namingCues';
import { VoiceClips } from './VoiceClips';

const dateLabel = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const weekLabel = (start, index) => index === 0 ? 'Цей тиждень' : index === 1 ? 'Минулий тиждень' : `Тиждень з ${dateLabel(start)}`;
const MODES = [['independent', 'Самостійно'], ['supported', 'З допомогою'], ['attempted', 'Спробували']];

function ShareBar({ counts }) {
  const total = counts.independent + counts.supported + counts.attempted;
  if (!total) return <span className="diary-bar diary-bar--empty">немає записів</span>;
  return <span className="diary-bar" role="img" aria-label={MODES.map(([key, text]) => `${text.toLowerCase()}: ${counts[key]}`).join(', ')}>
    {MODES.map(([key]) => counts[key] > 0 && <span key={key} data-mode={key} style={{ flexGrow: counts[key] }}>{counts[key]}</span>)}
  </span>;
}

export function PracticeDiary({ history, review, levels, plan = { words: [], note: '' } }) {
  const details = useRef(null);
  const weeks = weeklyDiary(history);
  const suggestions = levelSuggestions(history, levels);
  const reviewWords = Object.values(review).sort((a, b) => a.due.localeCompare(b.due));
  const print = () => {
    details.current.open = true;
    document.body.classList.add('print-diary');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-diary'), { once: true });
    window.print();
  };

  return <details className="practice-settings practice-diary" ref={details}>
    <summary>Для близьких: щоденник занять</summary>
    <div className="practice-settings__body">
      {!history.length ? <p>Тут з’являться підсумки після першого виконаного завдання. Записи зберігаються лише на цьому пристрої.</p> : <>
        <p>Підсумки за чотири тижні: скільки завдань вийшло самостійно, з допомогою або як спроба. Це спостереження для розмови з логопедом, а не оцінка.</p>
        <div className="diary-legend" aria-hidden="true">{MODES.map(([key, text]) => <span key={key}><i data-mode={key} />{text}</span>)}</div>
        <table className="diary-weeks">
          <caption className="visually-hidden">Заняття за тижнями</caption>
          <thead><tr><th scope="col">Тиждень</th><th scope="col">Занять</th><th scope="col">Завдань</th></tr></thead>
          <tbody>{weeks.map((week, index) => <tr key={week.start}><th scope="row">{weekLabel(week.start, index)}</th><td>{week.sessions}</td><td>{week.tasks}</td></tr>)}</tbody>
        </table>
        <h3 className="diary-heading">Блоки: цей тиждень і чотири тижні тому</h3>
        <ul className="diary-blocks">{PRACTICE_BLOCKS.map((block) => <li key={block.id}>
          <strong>{block.short}</strong>
          <span className="diary-row"><span>Зараз</span><ShareBar counts={weeks[0].blocks[block.id]} /></span>
          <span className="diary-row"><span>Тоді</span><ShareBar counts={weeks[3].blocks[block.id]} /></span>
        </li>)}</ul>
        {CUE_KINDS.some((kind) => weeks[0].naming[kind]) && <><h3 className="diary-heading">Називання цього тижня</h3><p className="form-note">Яка підказка знадобилася, щоб назвати предмет. Менше підказок з часом — добрий знак.</p>
          <ul className="diary-notes">{CUE_KINDS.filter((kind) => weeks[0].naming[kind]).map((kind) => <li key={kind}>{CUE_LABELS[kind]}: {weeks[0].naming[kind]}</li>)}</ul></>}
        {plan.words.length > 0 && <><h3 className="diary-heading">Слова з плану логопеда</h3>{plan.note && <p className="form-note">Порада: {plan.note}</p>}
          <ul className="diary-notes">{planProgress(plan, history).map((item) => <li key={item.word}>{item.word}: {item.independent + item.supported + item.attempted ? `самостійно ${item.independent}, з допомогою ${item.supported}, спроба ${item.attempted}` : 'ще не траплялося'}</li>)}</ul></>}
        {suggestions.length > 0 && <><h3 className="diary-heading">Можна обговорити рівень</h3><ul className="diary-notes">{suggestions.map(({ block, direction }) => {
          const name = PRACTICE_BLOCKS.find((item) => item.id === block).short;
          const next = LEVEL_OPTIONS[block][levels[block] - 1 + (direction === 'up' ? 1 : -1)];
          return <li key={block}>{name}: {direction === 'up' ? 'три заняття поспіль майже все вийшло самостійно.' : 'три заняття поспіль багато завдань залишилися спробою.'} Можна спробувати рівень «{next}» у налаштуваннях складності.</li>;
        })}</ul></>}
        {reviewWords.length > 0 && <><h3 className="diary-heading">Слова на повторенні</h3><p className="form-note">Ці слова минулого разу вийшли з допомогою. Вони повертаються в заняття через 1, 3 і 7 днів.</p>
          <ul className="diary-notes">{reviewWords.map((entry) => <li key={entry.word}>{entry.word} · наступне повторення {dateLabel(entry.due)}</li>)}</ul></>}
        <VoiceClips />
        <button className="secondary-button diary-print" type="button" onClick={print}><Printer aria-hidden="true" />Роздрукувати або зберегти PDF</button>
      </>}
    </div>
  </details>;
}
