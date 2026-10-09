import { PRACTICE_BLOCKS } from '../data/practiceSession';
import { LEVEL_OPTIONS } from '../data/practiceLevels';

export function PracticeSettings({ settings, onChange, saved }) {
  return <details className="practice-settings">
    <summary>Для близьких: складність вправ</summary>
    <div className="practice-settings__body">
      <p>Оберіть підтримку для кожного блоку. Зміни діятимуть у новому занятті; почате заняття продовжується зі своїми завданнями.</p>
      <div className="practice-settings__grid">{PRACTICE_BLOCKS.map((block) => <label key={block.id} htmlFor={`level-${block.id}`}><strong>{block.short}</strong>
        <select id={`level-${block.id}`} value={settings.blocks[block.id]} onChange={(event) => onChange({ ...settings, blocks: { ...settings.blocks, [block.id]: Number(event.target.value) } })}>{LEVEL_OPTIONS[block.id].map((text, index) => <option key={text} value={index + 1}>{text}</option>)}</select><span className="form-note">{LEVEL_OPTIONS[block.id][settings.blocks[block.id] - 1]}</span>
      </label>)}
      <label htmlFor="level-shortWords"><strong>Коротке заняття</strong><select id="level-shortWords" value={settings.shortWords} onChange={(event) => onChange({ ...settings, shortWords: Number(event.target.value) })}>{LEVEL_OPTIONS.shortWords.map((text, index) => <option key={text} value={index + 1}>{text}</option>)}</select></label></div>
      <p className="form-note" role="status">{saved ? 'Вибір збережено на цьому пристрої.' : 'Вибір діє зараз, але не зберігся після закриття сторінки.'}</p>
    </div>
  </details>;
}
