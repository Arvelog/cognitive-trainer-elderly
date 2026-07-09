import { useEffect, useMemo, useState } from 'react';

const DB_NAME = 'cognitive-trainer-task-images';
const STORE_NAME = 'images';
const IMAGE_CACHE_VERSION = 'gpt-image-1-mini-low-webp-v2';

const memoryCache = new Map();
let dbPromise = null;

const EMOJI_LABELS = {
  '🍎': 'Яблуко',
  '🍐': 'Груша',
  '🍋': 'Лимон',
  '🍕': 'Піца',
  '☕': 'Чашка чаю',
  '🍵': 'Чашка зеленого чаю',
  '🌸': 'Квітка',
  '🌺': 'Квітка',
  '🌻': 'Соняшник',
  '🌳': 'Дерево',
  '🐱': 'Кіт',
  '🐈': 'Кіт',
  '🐶': 'Собака',
  '🐦': 'Пташка',
  '🐟': 'Риба',
  '🐸': 'Жаба',
  '🚗': 'Автомобіль',
  '🚌': 'Автобус',
  '🧸': 'Іграшковий ведмедик',
  '🎈': 'Повітряна кулька',
  '🍰': 'Торт',
  '🎯': 'Мішень',
  '💡': 'Лампа',
  '🧤': 'Рукавички',
  '🎵': 'Нота',
  '🎶': 'Ноти',
  '🎹': 'Піаніно',
  '📚': 'Книги',
  '📖': 'Книга',
  '📰': 'Газета',
  '🏠': 'Будинок',
  '🎩': 'Капелюх',
  '🎨': 'Фарби',
  '🧶': 'Пряжа',
  '🪡': 'Спиці та голка',
  '📐': 'Схема для роботи',
  '🔨': 'Молоток',
  '📱': 'Телефон',
  '🌱': 'Розсада',
  '🪣': 'Відро',
  '🎸': 'Гітара',
  '💻': 'Ноутбук',
  '🎣': 'Вудка',
  '🪱': 'Наживка',
  '🧹': 'Мітла',
  '🍲': 'Суп',
  '💊': 'Ліки',
  '👕': 'Сорочка',
  '🛒': 'Кошик для покупок',
  '🛋️': 'Диван',
  '☀️': 'Сонце',
  '❄️': 'Сніг',
  '🌷': 'Весняна квітка',
};

const openImageDb = () => {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'));
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open image cache'));
  });

  return dbPromise;
};

const getCachedImage = async (key) => {
  if (memoryCache.has(key)) return memoryCache.get(key);

  try {
    const db = await openImageDb();
    const value = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    if (value) memoryCache.set(key, value);
    return value;
  } catch {
    return null;
  }
};

const setCachedImage = async (key, value) => {
  if (!value) return;
  memoryCache.set(key, value);

  try {
    const db = await openImageDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Memory cache is enough for the current session when IndexedDB is unavailable.
  }
};

const getEmoji = (value) => {
  const match = String(value || '').match(/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/u);
  return match?.[0] || '';
};

const stripEmoji = (value) =>
  String(value || '')
    .replace(/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu, '')
    .replace(/[\uFE0F\u200D]/g, '')
    .trim();

const normalizeKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '');

const cacheKeyPart = (value) => {
  const normalized = normalizeKey(value);
  if (normalized) return normalized;
  return Array.from(String(value || 'item'))
    .map((char) => char.codePointAt(0).toString(16))
    .join('-');
};

const rawValueKey = (value) => {
  if (value && typeof value === 'object') {
    return JSON.stringify({
      id: value.id,
      label: value.label || value.text || value.name,
      prompt: value.imagePrompt || value.prompt,
      group: value.group,
    });
  }
  return String(value || '');
};

export const toVisualItem = (value, task, index = 0) => {
  const raw = value && typeof value === 'object'
    ? value.label || value.text || value.name || value.id || ''
    : String(value || '');
  const emoji = getEmoji(raw);
  const stripped = stripEmoji(raw);
  const label = String(value?.label || value?.text || value?.name || stripped || EMOJI_LABELS[emoji] || raw || `Картка ${index + 1}`).trim();
  const prompt = value?.imagePrompt || value?.prompt || EMOJI_LABELS[emoji] || label;
  const stableId = value?.id || `${task}-${normalizeKey(rawValueKey(value)) || index}`;

  return {
    id: stableId,
    cacheKey: `${IMAGE_CACHE_VERSION}:${task}:${cacheKeyPart(prompt || label)}`,
    label,
    prompt,
    fallback: raw,
    emoji,
  };
};

export const useTaskImages = (task, values) => {
  const valuesKey = useMemo(() => JSON.stringify((values || []).map(rawValueKey)), [values]);
  const visualItems = useMemo(
    () => (values || []).map((value, index) => toVisualItem(value, task, index)),
    [task, valuesKey],
  );
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadImages = async () => {
      if (visualItems.length === 0) {
        setImages({});
        return;
      }

      setLoading(true);

      const uniqueItems = [...new Map(visualItems.map((item) => [item.cacheKey, item])).values()];
      const cachedEntries = await Promise.all(uniqueItems.map(async (item) => [item.cacheKey, await getCachedImage(item.cacheKey)]));

      if (cancelled) return;

      const nextImages = {};
      cachedEntries.forEach(([key, url]) => {
        if (url) nextImages[key] = url;
      });
      setImages((prev) => ({ ...prev, ...nextImages }));

      const missing = uniqueItems.filter((item) => !nextImages[item.cacheKey]);
      if (missing.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/generate-task-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task,
            items: missing.map((item) => ({
              id: item.cacheKey,
              label: item.label,
              prompt: item.prompt,
            })),
          }),
        });

        if (!response.ok) throw new Error(`Image endpoint failed: ${response.status}`);

        const data = await response.json();
        const generated = {};
        await Promise.all((data.images || []).map(async (image) => {
          if (!image?.ok || !image.url || !image.id) return;
          generated[image.id] = image.url;
          await setCachedImage(image.id, image.url);
        }));

        if (!cancelled) {
          setImages((prev) => ({ ...prev, ...generated }));
        }
      } catch (error) {
        console.warn('Task image generation unavailable:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [task, visualItems]);

  return { visualItems, images, loading };
};
