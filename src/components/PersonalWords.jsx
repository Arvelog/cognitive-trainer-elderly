import { useId, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { MAX_PERSONAL_WORDS, PERSONAL_KINDS, shrinkPhoto } from '../data/personalWords';

export function PersonalWords({ words, onAdd, onRemove, error }) {
  const id = useId();
  const fileInput = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [word, setWord] = useState('');
  const [kind, setKind] = useState('person');
  const [hint, setHint] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [wordError, setWordError] = useState('');
  const full = words.length >= MAX_PERSONAL_WORDS;

  const choosePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    try { setPhoto(await shrinkPhoto(file)); }
    catch { setPhoto(null); setPhotoError('Це фото не вдалося відкрити. Спробуйте інше фото у форматі JPG або PNG.'); }
  };
  const submit = (event) => {
    event.preventDefault();
    if (!photo) { setPhotoError('Оберіть фото, щоб додати його до вправ.'); return; }
    if (!word.trim()) { setWordError('Напишіть, як ви це називаєте вдома.'); return; }
    if (onAdd({ id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, word, kind, hint, photo })) {
      setPhoto(null); setWord(''); setHint(''); setWordError('');
      if (fileInput.current) fileInput.current.value = '';
    }
  };
  const remove = (entry) => { if (window.confirm(`Видалити фото «${entry.word}» з вправ?`)) onRemove(entry.id); };

  return <details className="practice-settings personal-words">
    <summary>Для близьких: свої фото й слова</summary>
    <div className="practice-settings__body">
      <p>Додайте фото рідних, улюбленої тварини, знайомих місць чи страв і підпишіть їх так, як ви кажете вдома. Вони з’являться у вправах на розуміння, письмо й розмову в новому занятті. Найкраще працюють слова, які потрібні щодня.</p>
      <p className="form-note">Фото зберігаються лише на цьому пристрої й нікуди не надсилаються.</p>
      {words.length > 0 && <ul className="personal-words__list" aria-label="Додані фото">{words.map((entry) => <li key={entry.id}>
        <img src={entry.photo} alt="" />
        <span><strong>{entry.word}</strong><span>{PERSONAL_KINDS.find((option) => option.id === entry.kind)?.label}{entry.hint ? ` · ${entry.hint}` : ''}</span></span>
        <button className="icon-action" type="button" onClick={() => remove(entry)} aria-label={`Видалити «${entry.word}»`} title="Видалити"><Trash2 aria-hidden="true" /></button>
      </li>)}</ul>}
      {words.length === 1 && <p className="form-note">Додайте ще одне фото, і з’явиться вправа «Хто це на фото?» з вибором підпису.</p>}
      {full ? <p className="form-note">Додано {MAX_PERSONAL_WORDS} фото, це найбільше. Щоб додати нове, видаліть одне з наявних.</p> : <form className="personal-words__form" onSubmit={submit} noValidate>
        <div className="personal-words__photo">
          {photo ? <img src={photo} alt="Вибране фото" /> : <span className="personal-words__placeholder" aria-hidden="true"><ImagePlus /></span>}
          <label className="secondary-button" htmlFor={`${id}-photo`}><ImagePlus aria-hidden="true" />{photo ? 'Обрати інше фото' : 'Обрати фото'}</label>
          <input ref={fileInput} className="visually-hidden" id={`${id}-photo`} type="file" accept="image/*" onChange={choosePhoto} aria-describedby={photoError ? `${id}-photo-error` : undefined} />
          {photoError && <p className="field-error" id={`${id}-photo-error`} role="alert">{photoError}</p>}
        </div>
        <div className="personal-words__fields">
          <label htmlFor={`${id}-word`}><strong>Підпис</strong><span className="form-note">Ім’я або назва, як кажете вдома</span>
            <input id={`${id}-word`} value={word} maxLength={40} autoComplete="off" onChange={(event) => { setWord(event.target.value); if (event.target.value.trim()) setWordError(''); }} aria-invalid={Boolean(wordError)} aria-describedby={wordError ? `${id}-word-error` : undefined} />
          </label>
          {wordError && <p className="field-error" id={`${id}-word-error`} role="alert">{wordError}</p>}
          <label htmlFor={`${id}-kind`}><strong>Що на фото</strong>
            <select id={`${id}-kind`} value={kind} onChange={(event) => setKind(event.target.value)}>{PERSONAL_KINDS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
          </label>
          <label htmlFor={`${id}-hint`}><strong>Підказка, необов’язково</strong><span className="form-note">Відкривається, коли важко пригадати</span>
            <input id={`${id}-hint`} value={hint} maxLength={80} autoComplete="off" placeholder="Наприклад: ваша онука" onChange={(event) => setHint(event.target.value)} />
          </label>
          <button className="start-button" type="submit">Додати фото до вправ</button>
        </div>
      </form>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  </details>;
}
