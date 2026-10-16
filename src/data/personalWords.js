export const PERSONAL_WORDS_KEY = 'poruch_personal_words_v1';
export const MAX_PERSONAL_WORDS = 12;

export const PERSONAL_KINDS = [
  { id: 'person', label: 'Людина', question: 'Хто це на фото?' },
  { id: 'pet', label: 'Тварина', question: 'Хто це на фото?' },
  { id: 'place', label: 'Місце', question: 'Що це за місце?' },
  { id: 'food', label: 'Їжа', question: 'Що це на фото?' },
  { id: 'thing', label: 'Річ', question: 'Що це на фото?' },
];

const STORY_DIRECTIONS = {
  person: ['Хто це? Назвіть або покажіть.', 'Ким вам доводиться ця людина? Скажіть словом або жестом.', 'Що ви любите робити разом? Одне слово або коротка фраза.'],
  pet: ['Хто це? Скажіть кличку або покажіть.', 'Скажіть одне слово про цю тварину.', 'Що вона любить робити? Слово, фраза або жест.'],
  place: ['Що це за місце? Назвіть або покажіть.', 'Що ви там робите? Скажіть слово або покажіть жестом.', 'З ким ви там буваєте? Одне слово або коротка фраза.'],
  food: ['Що це? Назвіть страву або продукт.', 'Яке воно на смак? Одне слово.', 'Коли це готують або їдять? Слово або коротка фраза.'],
  thing: ['Що це? Назвіть предмет або покажіть.', 'Для чого він? Покажіть дію або скажіть слово.', 'Де він лежить удома? Одне слово або жест.'],
};

const cleanText = (value, max) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
const validPhoto = (value) => typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(value);

export function normalizePersonalWords(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.flatMap((item) => {
    const word = cleanText(item?.word, 40);
    const id = cleanText(item?.id, 40);
    if (!word || !id || seen.has(id) || !validPhoto(item?.photo)) return [];
    seen.add(id);
    const kind = PERSONAL_KINDS.some((option) => option.id === item.kind) ? item.kind : 'thing';
    return [{ id, word, kind, hint: cleanText(item.hint, 80), photo: item.photo }];
  }).slice(0, MAX_PERSONAL_WORDS);
}

export function loadPersonalWords(raw) {
  try { return normalizePersonalWords(JSON.parse(raw)); }
  catch { return []; }
}

const firstLetter = (word) => word.trim().charAt(0).toLocaleUpperCase('uk-UA');
const questionFor = (kind) => PERSONAL_KINDS.find((option) => option.id === kind)?.question || 'Що це на фото?';
const isLiving = (kind) => kind === 'person' || kind === 'pet';

// Photo tasks are built from the family's own photos; the caregiver knows the right name, so any clear answer counts.
export function personalRecognitionTask(entry, others) {
  const sameKind = others.filter((item) => item.kind === entry.kind);
  const distractors = [...sameKind, ...others.filter((item) => item.kind !== entry.kind)].map((item) => item.word)
    .filter((word, index, all) => word.toLocaleLowerCase('uk-UA') !== entry.word.toLocaleLowerCase('uk-UA') && all.indexOf(word) === index);
  return {
    kind: 'choice', personal: true, contentId: `personal-${entry.id}`,
    title: questionFor(entry.kind), stimulus: '', image: entry.photo, ...(entry.hint ? { hint: entry.hint } : {}),
    answer: entry.word, options: [entry.word, ...distractors.slice(0, 2)],
    instruction: 'Подивіться на фото. Оберіть підпис.',
  };
}

export function personalWritingTask(entry) {
  return {
    kind: 'writing', personal: true, contentId: `personal-${entry.id}`,
    title: isLiving(entry.kind) ? 'Напишіть, хто на фото' : 'Напишіть, що на фото',
    word: entry.word, image: entry.photo, first: firstLetter(entry.word),
    hint: entry.hint || 'Це ваше фото. Пригадайте, як ви це називаєте.',
    accepted: `${entry.word}. Інша зрозуміла назва чи звертання теж підходить: це ваше фото.`,
  };
}

export function personalNoteTask(entry) {
  return {
    kind: 'writing', writingType: 'message', personal: true, contentId: `personal-note-${entry.id}`,
    title: 'Напишіть записку близькій людині', word: entry.word, image: entry.photo,
    stimulus: `Кому: ${entry.word}.\nНапишіть одне-два речення: подякуйте або запросіть у гості.`,
    hint: 'Почніть зі слова «Дякую» або «Приходь».', first: 'Д',
    modelText: 'Дякую тобі! Приходь у неділю на чай.',
    accepted: 'Це один приклад. Власна записка з подякою чи запрошенням теж підходить.',
  };
}

export function personalStoryTask(entry) {
  return {
    kind: 'conversation', scenario: 'photo', personal: true, contentId: `personal-story-${entry.id}`,
    title: 'Розкажіть про своє фото', image: entry.photo,
    prompt: 'Подивіться на фото. Одне запитання за раз.',
    setup: 'Покажіть фото. Ставте запитання нижче по одному й чекайте на відповідь.',
    directions: [...(STORY_DIRECTIONS[entry.kind] || STORY_DIRECTIONS.thing)],
    partnerResponse: 'Повторіть те, що зрозуміли. Можна додати одне слово й сказати його разом.',
    model: `${entry.word}.`, cue: `${firstLetter(entry.word)}…`,
    coach: 'Це ваше фото, тож відповідь знаєте ви. Приймайте ім’я, будь-яке зрозуміле слово, жест або письмо. Спогади важливіші за точну фразу.',
  };
}

// Phone photos are large; a small JPEG keeps a dozen of them inside browser storage.
export async function shrinkPhoto(file, maxSide = 480, quality = 0.8) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
