import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteClip, listClips } from '../lib/voiceStore';

const when = (iso) => new Date(iso).toLocaleString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

function Clip({ clip, onDelete }) {
  const [url, setUrl] = useState(null);
  useEffect(() => { const next = URL.createObjectURL(clip.blob); setUrl(next); return () => URL.revokeObjectURL(next); }, [clip.blob]);
  return <li><span><strong>{clip.title}</strong><span>{when(clip.createdAt)} · {Math.max(1, Math.round(clip.durationMs / 1000))} с</span></span>
    {url && <audio controls preload="none" src={url} aria-label={`Запис: ${clip.title}`} />}
    <button className="icon-action" type="button" onClick={() => onDelete(clip)} aria-label={`Видалити запис «${clip.title}»`} title="Видалити"><Trash2 aria-hidden="true" /></button>
  </li>;
}

export function VoiceClips() {
  const [clips, setClips] = useState(null);
  const refresh = () => listClips().then(setClips).catch(() => setClips([]));
  useEffect(() => { if (window.indexedDB) refresh(); else setClips([]); }, []);
  const remove = async (clip) => {
    if (!window.confirm(`Видалити запис «${clip.title}»?`)) return;
    await deleteClip(clip.id).catch(() => {});
    refresh();
  };
  if (!clips?.length) return null;
  return <><h3 className="diary-heading">Записи голосу</h3>
    <p className="form-note">Послухайте, як змінюється мовлення від тижня до тижня. Записи зберігаються лише на цьому пристрої, найстаріші видаляються після сорокового.</p>
    <ul className="voice-clips">{clips.map((clip) => <Clip key={clip.id} clip={clip} onDelete={remove} />)}</ul></>;
}
