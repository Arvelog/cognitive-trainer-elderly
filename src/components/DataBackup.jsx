import { useId, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { backupFileName, blobToDataUrl, buildBackup, dataUrlToBlob, parseBackup, restoreItems } from '../lib/backup';
import { listStore, replaceStore } from '../lib/voiceStore';

const AUDIO_STORES = ['clips', 'prompts'];
const dateLabel = (iso) => new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

async function exportAudio() {
  if (!window.indexedDB) return {};
  const entries = await Promise.all(AUDIO_STORES.map(async (store) => {
    const items = await listStore(store).catch(() => []);
    return [store, await Promise.all(items.map(async ({ blob, ...rest }) => ({ ...rest, data: await blobToDataUrl(blob) })))];
  }));
  return Object.fromEntries(entries);
}

// Everything lives in this browser; a file lets the family keep a copy or move to a new tablet.
export function DataBackup() {
  const id = useId();
  const input = useRef(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const backup = buildBackup(window.localStorage, await exportAudio());
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup)], { type: 'application/json' }));
      const link = Object.assign(document.createElement('a'), { href: url, download: backupFileName() });
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('Файл збережено в завантаження. Перешліть його собі або збережіть у хмару, щоб не загубити.');
    } catch { setStatus('Не вдалося створити файл. Спробуйте ще раз або звільніть місце на пристрої.'); }
    setBusy(false);
  };
  const restore = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    let backup;
    try { backup = parseBackup(await file.text()); }
    catch (error) { setStatus(error.message === 'version' ? 'Цей файл створено новішою версією «Поруч». Оновіть сторінку й спробуйте ще раз.' : 'Цей файл не схожий на копію «Поруч». Оберіть файл, який починається з «poruch-».'); return; }
    const when = backup.exportedAt ? ` від ${dateLabel(backup.exportedAt)}` : '';
    if (!window.confirm(`Відновити копію${when}? Фото, щоденник і записи на цьому пристрої буде замінено даними з файлу.`)) return;
    setBusy(true);
    try {
      restoreItems(window.localStorage, backup.items);
      if (window.indexedDB) for (const store of AUDIO_STORES) {
        await replaceStore(store, await Promise.all(backup.audio[store].map(async ({ data, ...rest }) => ({ ...rest, blob: await dataUrlToBlob(data) }))));
      }
      window.location.reload();
    } catch { setStatus('Не вдалося відновити все: на пристрої замало місця. Видаліть зайві фото чи записи й спробуйте ще раз.'); setBusy(false); }
  };

  return <details className="practice-settings data-backup">
    <summary>Для близьких: резервна копія</summary>
    <div className="practice-settings__body">
      <p>Фото, щоденник, слова на повторенні, налаштування й записи голосу зберігаються лише в цьому браузері. Якщо очистити браузер або змінити пристрій, вони зникнуть. Збережіть копію у файл раз на тиждень.</p>
      <div className="data-backup__actions">
        <button className="start-button" type="button" onClick={save} disabled={busy}><Download aria-hidden="true" />Зберегти копію у файл</button>
        <label className="secondary-button" htmlFor={`${id}-file`} aria-disabled={busy || undefined}><Upload aria-hidden="true" />Відновити з файлу</label>
        <input ref={input} className="visually-hidden" id={`${id}-file`} type="file" accept="application/json,.json" onChange={restore} disabled={busy} />
      </div>
      <p className="form-note">Щоб перенести заняття на новий планшет, збережіть копію тут, а потім відкрийте «Поруч» на планшеті й оберіть «Відновити з файлу». Файл нікуди не надсилається.</p>
      <p className="form-note" role="status">{status}</p>
    </div>
  </details>;
}
