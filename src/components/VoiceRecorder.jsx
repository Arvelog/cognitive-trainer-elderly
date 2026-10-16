import { useEffect, useRef, useState } from 'react';
import { Mic, RotateCcw, Square } from 'lucide-react';
import { saveClip } from '../lib/voiceStore';

const MAX_SECONDS = 30;
const supported = () => typeof window !== 'undefined' && Boolean(window.MediaRecorder && navigator.mediaDevices?.getUserMedia && window.indexedDB);

// Optional: a recording lets the family and speech therapist hear progress over weeks. Nothing is scored or sent anywhere.
export function VoiceRecorder({ title }) {
  const [state, setState] = useState('idle');
  const [url, setUrl] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef(null);
  const timer = useRef(null);
  useEffect(() => () => { clearInterval(timer.current); if (recorder.current?.state === 'recording') recorder.current.stop(); }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  if (!supported()) return null;

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const media = new MediaRecorder(stream);
      const started = Date.now();
      media.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      media.onstop = async () => {
        clearInterval(timer.current);
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: media.mimeType || 'audio/webm' });
        setUrl(URL.createObjectURL(blob));
        try {
          await saveClip({ id: `${started}-${Math.random().toString(16).slice(2, 8)}`, createdAt: new Date(started).toISOString(), title, durationMs: Date.now() - started, blob });
          setState('saved');
        } catch { setState('unsaved'); }
      };
      recorder.current = media;
      media.start();
      setSeconds(0);
      setState('recording');
      timer.current = setInterval(() => setSeconds((value) => {
        if (value + 1 >= MAX_SECONDS && media.state === 'recording') media.stop();
        return value + 1;
      }), 1000);
    } catch { setState('denied'); }
  };
  const stop = () => { if (recorder.current?.state === 'recording') recorder.current.stop(); };

  return <div className="voice-recorder">
    {state === 'recording' ? <button className="confirm-button" type="button" onClick={stop}><Square aria-hidden="true" />Зупинити запис · {seconds} с</button>
      : <button className="secondary-button" type="button" onClick={start}>{url ? <RotateCcw aria-hidden="true" /> : <Mic aria-hidden="true" />}{url ? 'Записати ще раз' : 'Записати відповідь голосом'}</button>}
    {url && state !== 'recording' && <audio controls src={url} aria-label="Ваш запис" />}
    <p className="form-note" role="status">{state === 'recording' ? `Говоріть. Запис зупиниться сам через ${MAX_SECONDS} секунд.`
      : state === 'saved' ? 'Запис збережено в щоденнику на цьому пристрої.'
        : state === 'unsaved' ? 'Запис можна послухати зараз, але зберегти його не вдалося. Можна продовжити без запису.'
          : state === 'denied' ? 'Мікрофон недоступний. Можна відповісти без запису або дозволити мікрофон у налаштуваннях браузера.'
            : 'За бажанням. Запис не оцінюється й нікуди не надсилається.'}</p>
  </div>;
}
