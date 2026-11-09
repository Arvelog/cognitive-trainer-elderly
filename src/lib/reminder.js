export const REMINDER_KEY = 'poruch_reminder_v1';
export const WEEKDAYS = [['MO', 'Пн'], ['TU', 'Вт'], ['WE', 'Ср'], ['TH', 'Чт'], ['FR', 'Пт'], ['SA', 'Сб'], ['SU', 'Нд']];
const CODES = WEEKDAYS.map(([code]) => code);
export const DEFAULT_REMINDER = { days: ['MO', 'TU', 'WE', 'TH', 'FR'], time: '11:00' };

export function normalizeReminder(value) {
  const days = Array.isArray(value?.days) ? CODES.filter((code) => value.days.includes(code)) : DEFAULT_REMINDER.days;
  const time = /^([01]\d|2[0-3]):[0-5]\d$/.test(value?.time || '') ? value.time : DEFAULT_REMINDER.time;
  return { days, time };
}
export function loadReminder(raw) {
  try { return normalizeReminder(JSON.parse(raw)); } catch { return normalizeReminder(); }
}

const pad = (n) => String(n).padStart(2, '0');
const local = (date) => `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
const stamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// A repeating calendar event works on every phone, unlike web notifications on iPad.
// Floating local time (no time zone) keeps 11:00 at 11:00 wherever the phone is.
export function buildReminderIcs(reminder, now = new Date(), url = 'https://poruch-speech-practice.vercel.app/') {
  const { days, time } = normalizeReminder(reminder);
  if (!days.length) return null;
  const [hours, minutes] = time.split(':').map(Number);
  const first = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  while (!days.includes(CODES[(first.getDay() + 6) % 7])) first.setDate(first.getDate() + 1);
  const start = `${local(first)}T${pad(hours)}${pad(minutes)}00`;
  const endDate = new Date(first.getFullYear(), first.getMonth(), first.getDate(), hours, minutes + 20);
  const end = `${local(endDate)}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Poruch//Reminder//UK', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:poruch-${stamp(now)}@poruch`, `DTSTAMP:${stamp(now)}`,
    `DTSTART:${start}`, `DTEND:${end}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${days.join(',')}`,
    'SUMMARY:Поруч: заняття разом',
    `DESCRIPTION:15–20 хвилин практики мовлення. Зошит\\, олівець і тихе місце. ${url}`,
    `URL:${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Час для заняття «Поруч»', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}
