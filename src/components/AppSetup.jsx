import { useEffect, useState } from 'react';
import { CalendarPlus, MonitorDown } from 'lucide-react';
import { buildReminderIcs, loadReminder, REMINDER_KEY, WEEKDAYS } from '../lib/reminder';

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const installed = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

function InstallApp() {
  const [prompt, setPrompt] = useState(null);
  const [done, setDone] = useState(installed);
  useEffect(() => {
    const capture = (event) => { event.preventDefault(); setPrompt(event); };
    const finish = () => { setDone(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', finish);
    return () => { window.removeEventListener('beforeinstallprompt', capture); window.removeEventListener('appinstalled', finish); };
  }, []);
  const install = async () => { prompt.prompt(); const choice = await prompt.userChoice.catch(() => null); if (choice?.outcome === 'accepted') setDone(true); setPrompt(null); };

  return <>
    <h3 className="diary-heading">Значок «Поруч» на екрані</h3>
    {done ? <p className="form-note">«Поруч» уже встановлено на цьому пристрої. Заняття відкриваються зі значка навіть без інтернету.</p>
      : prompt ? <><p>Додайте значок на головний екран: заняття відкриватиметься одним дотиком і працюватиме без інтернету.</p><button className="secondary-button" type="button" onClick={install}><MonitorDown aria-hidden="true" />Встановити на екран</button></>
        : isIos() ? <p>На iPad чи iPhone відкрийте цю сторінку в Safari, натисніть «Поділитися» (квадрат зі стрілкою вгору) і оберіть «На початковий екран». Після першого відкриття заняття працюватиме й без інтернету.</p>
          : <p>У меню браузера оберіть «Встановити застосунок» або «Додати на головний екран». Після першого відкриття заняття працюватиме й без інтернету.</p>}
  </>;
}

function Reminder() {
  const [reminder, setReminder] = useState(() => { try { return loadReminder(window.localStorage.getItem(REMINDER_KEY)); } catch { return loadReminder(null); } });
  const [status, setStatus] = useState('');
  useEffect(() => { try { window.localStorage.setItem(REMINDER_KEY, JSON.stringify(reminder)); } catch { /* Only remembers the last choice. */ } }, [reminder]);
  const toggle = (code) => setReminder((value) => ({ ...value, days: value.days.includes(code) ? value.days.filter((day) => day !== code) : [...value.days, code] }));
  const download = () => {
    const ics = buildReminderIcs(reminder, new Date(), `${window.location.origin}/`);
    if (!ics) { setStatus('Оберіть хоча б один день.'); return; }
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: 'poruch-nagaduvannia.ics' });
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Відкрийте завантажений файл і підтвердьте додавання в календар. Змінити чи видалити нагадування можна в самому календарі.');
  };
  return <>
    <h3 className="diary-heading">Нагадування в календарі</h3>
    <p>Регулярність важливіша за тривалість: слова на повторенні повертаються через 1, 3 і 7 днів. Календар телефону нагадає про заняття у вибрані дні.</p>
    <fieldset className="reminder-days"><legend>Дні</legend><div>{WEEKDAYS.map(([code, label]) => <label key={code} data-selected={reminder.days.includes(code)}><input type="checkbox" checked={reminder.days.includes(code)} onChange={() => toggle(code)} />{label}</label>)}</div></fieldset>
    <label className="reminder-time" htmlFor="reminder-time"><strong>Час</strong><input id="reminder-time" type="time" value={reminder.time} onChange={(event) => event.target.value && setReminder((value) => ({ ...value, time: event.target.value }))} /></label>
    <button className="secondary-button" type="button" onClick={download}><CalendarPlus aria-hidden="true" />Додати нагадування в календар</button>
    <p className="form-note" role="status">{status}</p>
  </>;
}

export function AppSetup() {
  return <details className="practice-settings app-setup">
    <summary>Для близьких: значок на екрані й нагадування</summary>
    <div className="practice-settings__body"><InstallApp /><Reminder /></div>
  </details>;
}
