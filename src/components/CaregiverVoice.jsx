import { useEffect, useId, useRef, useState } from 'react';
import { Mic, Play, Square, Trash2 } from 'lucide-react';
import { listPrompts, onPromptsChange, playPrompt, promptKey, removePrompt, savePrompt } from '../lib/caregiverVoice';
import { MAX_PROMPTS } from '../lib/voiceStore';

const MAX_SECONDS = 8;
const supported = () => typeof window !== 'undefined' && Boolean(window.MediaRecorder && navigator.mediaDevices?.getUserMedia && window.indexedDB);

function usePrompts() {
  const [items, setItems] = useState(listPrompts);
  useEffect(() => onPromptsChange(() => setItems(listPrompts())), []);
  return items;
}

function RecordRow({ text, recorded, recording, onRecord, onStop }) {
  return <li>
    <span><strong>{text}</strong><span>{recorded ? 'Записано вашим голосом' : 'Звучить голос пристрою'}</span></span>
    <span className="caregiver-voice__actions">
      {recorded && <button className="icon-action" type="button" onClick={() => playPrompt(text)} aria-label={`Послухати «${text}»`} title="Послухати"><Play aria-hidden="true" /></button>}
      {recording ? <button className="confirm-button" type="button" onClick={onStop}><Square aria-hidden="true" />Зупинити</button>
        : <button className="secondary-button" type="button" onClick={onRecord}><Mic aria-hidden="true" />{recorded ? 'Перезаписати' : 'Записати'}</button>}
      {recorded && <button className="icon-action" type="button" onClick={() => window.confirm(`Видалити запис «${text}»?`) && removePrompt(promptKey(text))} aria-label={`Видалити запис «${text}»`} title="Видалити"><Trash2 aria-hidden="true" /></button>}
    </span>
  </li>;
}

// The caregiver records words once; tasks then play the familiar voice instead of the synthetic one.
export function CaregiverVoice({ suggestions = [] }) {
  const id = useId();
  const prompts = usePrompts();
  const [active, setActive] = useState(null);
  const [status, setStatus] = useState('');
  const [custom, setCustom] = useState('');
  const recorder = useRef(null);
  const timer = useRef(null);
  useEffect(() => () => { clearTimeout(timer.current); if (recorder.current?.state === 'recording') recorder.current.stop(); }, []);
  if (!supported()) return null;

  const recordedKeys = new Set(prompts.map((item) => item.id));
  const texts = [...new Map([...suggestions, ...prompts.map((item) => item.text)].filter(Boolean).map((text) => [promptKey(text), text])).values()].slice(0, MAX_PROMPTS);

  const start = async (text) => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const media = new MediaRecorder(stream);
      const started = Date.now();
      media.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      media.onstop = async () => {
        clearTimeout(timer.current);
        stream.getTracks().forEach((track) => track.stop());
        setActive(null);
        try {
          await savePrompt(text, new Blob(chunks, { type: media.mimeType || 'audio/webm' }), Date.now() - started);
          setStatus(`«${text}» тепер звучить вашим голосом.`);
        } catch (error) { setStatus(error.message === 'full' ? `Записано ${MAX_PROMPTS} слів, це найбільше. Видаліть одне, щоб записати нове.` : 'Не вдалося зберегти запис на цьому пристрої. Спробуйте ще раз.'); }
      };
      recorder.current = media;
      media.start();
      setActive(text);
      setStatus(`Скажіть: «${text}». Запис зупиниться сам через ${MAX_SECONDS} секунд.`);
      timer.current = setTimeout(() => media.state === 'recording' && media.stop(), MAX_SECONDS * 1000);
    } catch { setStatus('Мікрофон недоступний. Дозвольте його в налаштуваннях браузера.'); }
  };
  const stop = () => { if (recorder.current?.state === 'recording') recorder.current.stop(); };
  const addCustom = (event) => {
    event.preventDefault();
    const text = custom.replace(/\s+/g, ' ').trim();
    if (!text) return;
    setCustom('');
    start(text);
  };

  return <details className="practice-settings caregiver-voice">
    <summary>Для близьких: ваш голос у вправах</summary>
    <div className="practice-settings__body">
      <p>Запишіть слова й фрази своїм голосом. Коли у вправі натиснуть «Послухати», прозвучить ваш голос, а не голос пристрою. Знайомий голос легше впізнати, і він правильно вимовляє українські слова.</p>
      <p className="form-note">Записи зберігаються лише на цьому пристрої. Говоріть повільно й чітко, як під час заняття.</p>
      {texts.length > 0 && <ul className="caregiver-voice__list" aria-label="Слова для запису">{texts.map((text) => <RecordRow key={promptKey(text)} text={text} recorded={recordedKeys.has(promptKey(text))} recording={active === text} onRecord={() => start(text)} onStop={stop} />)}</ul>}
      <form className="caregiver-voice__form" onSubmit={addCustom}>
        <label htmlFor={`${id}-text`}><strong>Інше слово або фраза</strong><span className="form-note">Точно так, як написано у вправі</span>
          <input id={`${id}-text`} value={custom} maxLength={80} autoComplete="off" onChange={(event) => setCustom(event.target.value)} />
        </label>
        <button className="secondary-button" type="submit" disabled={!custom.trim() || Boolean(active)}><Mic aria-hidden="true" />Записати</button>
      </form>
      <p className="form-note" role="status">{status}</p>
    </div>
  </details>;
}
