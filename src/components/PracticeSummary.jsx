import { PRACTICE_BLOCKS } from '../data/practiceSession';
import { levelLabel } from '../data/practiceLevels';
import { summarizeBlock } from '../lib/practiceResults';

const STAGES = { write: 'Перша спроба', model: 'Списування', recall: 'Письмо з пам’яті' };
const MODES = { independent: 'самостійно', supported: 'з допомогою', attempted: 'спробували' };
const FORMS = { word: 'слово', phrase: 'фраза', writing: 'письмо', gesture: 'жест' };

export function PracticeSummary({ session, completed, details }) {
  return <details className="practice-summary"><summary>Для близьких: відповіді й підтримка</summary>
    <p>Це записи про сьогоднішні спроби. Озвучення завдання відзначається окремо від підказки до відповіді.</p>
    {PRACTICE_BLOCKS.filter((block) => session.tasks.some((task) => task.block === block.id)).map((block) => {
      const stats = summarizeBlock(session, completed, details, block.id);
      return <section key={block.id} className="practice-summary__block"><h2>{block.short}</h2>
        <p className="form-note">{session.tasks.find((task) => task.block === block.id)?.levelLabel || levelLabel(block.id, session.levels?.[block.id], session.curriculumVersion)}</p>
        <dl><div><dt>Самостійно</dt><dd>{stats.independent}</dd></div><div><dt>З допомогою</dt><dd>{stats.supported}</dd></div><div><dt>Спробували</dt><dd>{stats.attempted}</dd></div></dl>
        {stats.unknown > 0 && <p>Попередні записи без деталізації допомоги: {stats.unknown}.</p>}
        {stats.revealed > 0 && <p>Правильну відповідь відкрито: {stats.revealed}.</p>}
        {stats.retries > 0 && <p>Повторні або помилкові спроби: {stats.retries}.</p>}
        {stats.audio > 0 && <p>Використали озвучення завдання: {stats.audio}.</p>}
        {stats.naming.map((entry, i) => <p key={i}>{entry.word} · називання предмета: {MODES[entry.mode] || 'попередній запис'}.</p>)}
        {stats.writing.length > 0 && <ul>{stats.writing.map((entry, i) => <li key={i}>{entry.word} · {STAGES[entry.stage]}: {MODES[entry.mode] || 'попередній запис'}.</li>)}</ul>}
        {stats.forms.length > 0 && <p>Спосіб відповіді: {stats.forms.map((form) => FORMS[form] || 'інший').join(', ')}.</p>}
      </section>;
    })}
  </details>;
}
