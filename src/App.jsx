import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Brain, Star, RefreshCw, Loader2, Heart, Trophy, Sparkles, Check, X, Volume2 } from 'lucide-react';

// ─── Sound helpers ───
const audioCtx = () => { if (!window._actx) window._actx = new (window.AudioContext || window.webkitAudioContext)(); return window._actx; };
const playTone = (freq, dur, type = 'sine') => { try { const c = audioCtx(); const o = c.createOscillator(); const g = c.createGain(); o.type = type; o.frequency.value = freq; g.gain.value = 0.15; o.connect(g); g.connect(c.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur); o.stop(c.currentTime + dur); } catch (e) { } };
const playCorrect = () => { playTone(523, 0.12); setTimeout(() => playTone(659, 0.12), 120); setTimeout(() => playTone(784, 0.2), 240); };
const playWrong = () => { playTone(300, 0.15, 'square'); setTimeout(() => playTone(250, 0.2, 'square'), 150); };
const playVictory = () => { [523, 587, 659, 698, 784, 880, 988, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.2), i * 150)); };

// ─── Confetti loader ───
const fireConfetti = () => {
    if (window.confetti) { window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } }); return; }
    const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
    s.onload = () => window.confetti && window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
    document.head.appendChild(s);
};

// ─── Shuffle helper ───
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[b[i], b[j]] = [b[j], b[i]]; } return b; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ─── Shared UI ───
const Card = ({ children, className = '' }) => (<div className={`bg-white rounded-3xl shadow-lg p-6 ${className}`}>{children}</div>);
const BigBtn = ({ children, onClick, className = '', disabled }) => (<button disabled={disabled} onClick={onClick} className={`px-8 py-4 text-xl font-bold rounded-3xl shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50 ${className}`}>{children}</button>);
const Spinner = () => (<div className="flex flex-col items-center justify-center py-16 gap-4"><Loader2 className="w-12 h-12 text-pastel-green animate-spin" /><p className="text-xl text-warm-gray">Завантаження...</p></div>);
const ErrorBox = ({ msg, onRetry }) => (<div className="flex flex-col items-center justify-center py-12 gap-4"><X className="w-12 h-12 text-error" /><p className="text-xl text-warm-gray text-center">{msg}</p><BigBtn onClick={onRetry} className="bg-pastel-green text-warm-gray"><RefreshCw className="inline w-5 h-5 mr-2" />Спробувати знову</BigBtn></div>);
const TaskHeader = ({ icon, title, desc }) => (<div className="text-center mb-6"><div className="text-5xl mb-3">{icon}</div><h2 className="text-2xl md:text-3xl font-extrabold text-warm-gray mb-2">{title}</h2><p className="text-lg text-warm-gray-light">{desc}</p></div>);
const Result = ({ correct, msg }) => (<div className={`mt-4 p-4 rounded-2xl text-center text-xl font-bold ${correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{correct ? '✅ ' : '❌ '}{msg}</div>);

// ═══════════════════════════════════════
// AI GENERATION (via Backend API)
// ═══════════════════════════════════════

async function generateAllTasks() {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST'
        });

        if (!response.ok) {
            console.warn('Backend API error:', response.statusText);
            return null;
        }

        const data = await response.json();
        // Validate essential fields exist
        if (!data.findOdd || !data.sequence || !data.budget || !data.sentence ||
            !data.associations || !data.categories || !data.trueFalse ||
            !data.antonyms || !data.vowels || !data.verbs) {
            console.warn('Gemini: incomplete data, using fallback');
            return null;
        }
        return data;
    } catch (e) {
        console.warn('Gemini generation failed:', e);
        return null;
    }
}

// ═══════════════════════════════════════
// DATA POOLS
// ═══════════════════════════════════════
const FIND_ODD_DATA = [
    { cat: 'Город', items: ['🥕 Морква', '🥒 Огірок', '🍅 Помідор', '🔧 Гайковий ключ'], odd: 3 },
    { cat: 'Кухня', items: ['🍳 Сковорода', '🥄 Ложка', '🔨 Молоток', '🍽️ Тарілка'], odd: 2 },
    { cat: 'Аптечка', items: ['💊 Таблетки', '🩹 Пластир', '🌡️ Термометр', '🎸 Гітара'], odd: 3 },
    { cat: 'Одяг', items: ['👕 Сорочка', '👖 Штани', '🧣 Шарф', '🔑 Ключі'], odd: 3 },
    { cat: 'Фрукти', items: ['🍎 Яблуко', '🍌 Банан', '🍊 Апельсин', '🧲 Магніт'], odd: 3 },
    { cat: 'Інструменти', items: ['🔨 Молоток', '🪛 Викрутка', '🔧 Ключ', '🍕 Піца'], odd: 3 },
];
const SEQUENCE_DATA = [
    { title: 'Рецепт борщу', steps: ['Почистити буряк', 'Нарізати овочі', 'Зварити бульйон', 'Додати овочі у каструлю'] },
    { title: 'Виклик лікаря', steps: ['Відчути нездужання', 'Зателефонувати в поліклініку', 'Записатися на прийом', 'Піти до лікаря'] },
    { title: 'Посадка помідорів', steps: ['Підготувати ґрунт', 'Зробити лунки', 'Посадити розсаду', 'Полити водою'] },
    { title: 'Прання білизни', steps: ['Зібрати брудний одяг', 'Завантажити у машинку', 'Додати порошок', 'Увімкнути програму'] },
    { title: 'Приготування чаю', steps: ['Закип\'ятити воду', 'Покласти чайний пакетик у чашку', 'Залити окропом', 'Додати цукор за смаком'] },
];
const BUDGET_DATA = [
    { wallet: 1000, label: 'Комунальні', items: [{ n: 'Газ', p: 250 }, { n: 'Вода', p: 150 }, { n: 'Електрика', p: 300 }, { n: 'Інтернет', p: 200 }] },
    { wallet: 1500, label: 'Ринок', items: [{ n: 'М\'ясо', p: 350 }, { n: 'Овочі', p: 200 }, { n: 'Хліб', p: 50 }, { n: 'Молоко', p: 80 }] },
    { wallet: 800, label: 'Ліки', items: [{ n: 'Вітаміни', p: 180 }, { n: 'Сироп', p: 120 }, { n: 'Мазь', p: 95 }, { n: 'Пластир', p: 45 }] },
    { wallet: 2000, label: 'Продукти', items: [{ n: 'Крупи', p: 150 }, { n: 'Риба', p: 280 }, { n: 'Масло', p: 90 }, { n: 'Сир', p: 160 }] },
];
const SENTENCE_DATA = [
    { img: 'grandfather watering flowers in sunny garden', sentence: 'Дідусь поливає квіти в саду' },
    { img: 'grandmother knitting warm socks by fireplace', sentence: 'Бабуся в\'яже теплі шкарпетки' },
    { img: 'elderly couple walking in autumn park', sentence: 'Пара гуляє в осінньому парку' },
    { img: 'old man reading newspaper on bench', sentence: 'Дідусь читає газету на лавці' },
    { img: 'grandmother baking pie in cozy kitchen', sentence: 'Бабуся пече пиріг на кухні' },
];
const ASSOC_DATA = [
    { q: 'Що потрібно, щоб зв\'язати светр?', correct: ['🧶 Пряжа', '🪡 Спиці', '📐 Схема'], wrong: ['🔨 Молоток', '🍕 Піца', '📱 Телефон'] },
    { q: 'Що ми беремо на дачу?', correct: ['🌱 Розсада', '🪣 Відро', '🧤 Рукавиці'], wrong: ['🎸 Гітара', '💻 Ноутбук', '🎩 Капелюх'] },
    { q: 'Що потрібно для риболовлі?', correct: ['🎣 Вудка', '🪱 Наживка', '🪣 Відро'], wrong: ['📚 Книга', '🎨 Фарби', '🧹 Мітла'] },
];
const CATEGORY_DATA = [
    { q: 'Що ми кладемо в холодильник?', correct: ['🥛 Молоко', '🧀 Сир', '🥩 М\'ясо'], wrong: ['📖 Книга', '🧹 Мітла', '🔑 Ключі'] },
    { q: 'Що можна побачити на клумбі?', correct: ['🌷 Тюльпан', '🌻 Соняшник', '🌹 Троянда'], wrong: ['🐟 Риба', '📺 Телевізор', '🧊 Лід'] },
    { q: 'Що можна знайти в лісі?', correct: ['🍄 Гриби', '🌲 Ялинка', '🐿️ Білка'], wrong: ['🚗 Машина', '📱 Телефон', '🛋️ Диван'] },
];
const TRUEFALSE_DATA = [
    { text: 'Взимку ведмеді сплять у барлозі', answer: true },
    { text: 'Щоб висушити одяг, його треба намочити у відрі', answer: false },
    { text: 'Сонце сходить на сході', answer: true },
    { text: 'Кішки вміють гавкати', answer: false },
    { text: 'Вода замерзає при нулі градусів', answer: true },
    { text: 'Рибу ловлять сачком для метеликів', answer: false },
    { text: 'Мед роблять бджоли', answer: true },
    { text: 'Зайці люблять їсти капусту', answer: true },
];
const ANTONYM_DATA = [
    { sentences: [{ s: 'Чай гарячий, а морозиво...', a: 'холодне' }, { s: 'Слон великий, а мишка...', a: 'маленька' }, { s: 'Вдень світло, а вночі...', a: 'темно' }, { s: 'Цукор солодкий, а лимон...', a: 'кислий' }] },
    { sentences: [{ s: 'Літо тепле, а зима...', a: 'холодна' }, { s: 'Камінь твердий, а подушка...', a: 'м\'яка' }, { s: 'Черепаха повільна, а заєць...', a: 'швидкий' }, { s: 'Гора висока, а яма...', a: 'низька' }] },
];
const VOWELS_DATA = [
    { words: [{ full: 'КАСТРУЛЯ', hint: 'У ній варять суп' }, { full: 'ТЕЛЕВІЗОР', hint: 'Його дивляться ввечері' }, { full: 'ХОЛОДИЛЬНИК', hint: 'Зберігає продукти холодними' }] },
    { words: [{ full: 'КОВДРА', hint: 'Нею вкриваються вночі' }, { full: 'КАПЕЛЮХ', hint: 'Одягають на голову влітку' }, { full: 'ЛІХТАР', hint: 'Освітлює вулицю вночі' }] },
    { words: [{ full: 'ПІДЛОГА', hint: 'По ній ходять вдома' }, { full: 'ДЗЕРКАЛО', hint: 'У нього дивляться щоранку' }, { full: 'КОШИК', hint: 'У ньому несуть продукти з ринку' }] },
];
const VERB_DATA = [
    { obj: '📰 Газета', context: 'Що ми робимо з газетою?', correct: 'Читати', wrong: ['Дивитися', 'Малювати', 'Слухати', 'Їсти'] },
    { obj: '🍵 Чай', context: 'Що ми робимо з чаєм?', correct: 'Пити', wrong: ['Їсти', 'Варити', 'Нюхати', 'Читати'] },
    { obj: '👗 Сукня', context: 'Що ми робимо із сукнею?', correct: 'Одягати', wrong: ['Вдягнути', 'Прасувати', 'Прати', 'Носити'] },
    { obj: '🎹 Піаніно', context: 'Що ми робимо з піаніно?', correct: 'Грати', wrong: ['Слухати', 'Настроювати', 'Співати', 'Торкати'] },
    { obj: '🧹 Мітла', context: 'Навіщо потрібна мітла?', correct: 'Мести', wrong: ['Прибирати', 'Витирати', 'Чистити', 'Мити'] },
    { obj: '✉️ Лист', context: 'Що ми робимо з листом?', correct: 'Писати', wrong: ['Читати', 'Відправляти', 'Складати', 'Друкувати'] },
    { obj: '🌱 Розсада', context: 'Що ми робимо з розсадою?', correct: 'Садити', wrong: ['Поливати', 'Вирощувати', 'Збирати', 'Пересаджувати'] },
    { obj: '🎣 Вудка', context: 'Навіщо потрібна вудка?', correct: 'Ловити рибу', wrong: ['Кидати', 'Тримати', 'Нести', 'Плавати'] },
];

const VOWELS_UK = ['А', 'Е', 'И', 'І', 'Ї', 'О', 'У', 'Ю', 'Я', 'Є'];
const removeVowels = (w) => w.split('').map(c => VOWELS_UK.includes(c.toUpperCase()) ? '_' : c).join('');

// ═══════════════════════════════════════
// TASK COMPONENTS
// ═══════════════════════════════════════

// 1. Знайди зайве
function Task1({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(FIND_ODD_DATA));
    const [selected, setSelected] = useState(null);
    const done = selected !== null;
    const correct = selected === data.odd;
    const handleClick = (i) => { if (done) return; setSelected(i); if (i === data.odd) { playCorrect(); fireConfetti(); onScore(); } else playWrong(); };
    return (<Card><TaskHeader icon="🔍" title="Знайди зайве" desc={`Категорія: ${data.cat}. Один предмет не підходить!`} />
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">{data.items.map((it, i) => (
            <button key={i} onClick={() => handleClick(i)} className={`p-5 text-xl font-bold rounded-3xl border-3 transition-all duration-200 ${done ? (i === data.odd ? 'bg-green-100 border-green-400' : i === selected ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200') : 'bg-white border-pastel-green hover:bg-pastel-green-light hover:scale-105 active:scale-95'}`}>{it}</button>
        ))}</div>
        {done && <Result correct={correct} msg={correct ? 'Чудово! Ви знайшли зайве!' : `Зайве було: ${data.items[data.odd]}`} />}
    </Card>);
}

// 2. Відновлення послідовності (tap-in-order)
function Task2({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(SEQUENCE_DATA));
    const [shuffled] = useState(() => shuffle(data.steps.map((s, i) => ({ text: s, idx: i }))));
    const [selected, setSelected] = useState([]);
    const [checked, setChecked] = useState(false);
    const tapStep = (item) => { if (checked || selected.find(s => s.idx === item.idx)) return; const next = [...selected, item]; setSelected(next); if (next.length === 4) { const ok = next.every((s, i) => s.idx === i); setTimeout(() => { setChecked(true); if (ok) { playCorrect(); fireConfetti(); onScore(); } else playWrong(); }, 300); } };
    const undo = () => { if (checked || selected.length === 0) return; setSelected(selected.slice(0, -1)); };
    const correct = selected.length === 4 && selected.every((s, i) => s.idx === i);
    return (<Card><TaskHeader icon="📋" title="Відновіть послідовність" desc={data.title} />
        <p className="text-center text-lg text-warm-gray-light mb-4">Натискайте на кроки у правильному порядку: 1, 2, 3, 4</p>
        {selected.length > 0 && <div className="max-w-lg mx-auto mb-4 space-y-2">
            <p className="text-sm font-bold text-warm-gray">Ваш порядок:</p>
            {selected.map((s, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl ${checked ? (s.idx === i ? 'bg-green-100 border-2 border-green-400' : 'bg-red-100 border-2 border-red-400') : 'bg-pastel-green-light border-2 border-pastel-green'}`}>
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-pastel-green text-white font-bold text-lg">{i + 1}</span>
                    <span className="text-lg font-semibold text-warm-gray">{s.text}</span>
                </div>
            ))}
            {!checked && <button onClick={undo} className="text-sm text-warm-gray-light underline mt-1">↩ Скасувати останній</button>}
        </div>}
        <div className="space-y-3 max-w-lg mx-auto">
            {shuffled.map((item, i) => {
                const used = selected.find(s => s.idx === item.idx);
                return <button key={i} onClick={() => tapStep(item)} disabled={!!used || checked} className={`w-full text-left p-4 rounded-2xl border-2 transition-all text-lg font-semibold ${used ? 'opacity-40 bg-gray-100 border-gray-200 cursor-not-allowed' : 'bg-white border-pastel-beige-dark hover:bg-pastel-green-light hover:border-pastel-green active:scale-[0.98]'}`}>{item.text}</button>;
            })}
        </div>
        {checked && <Result correct={correct} msg={correct ? 'Бездоганний порядок!' : 'Правильний порядок: ' + data.steps.join(' → ')} />}
    </Card>);
}

// 3. Математика (Бюджет)
function Task3({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(BUDGET_DATA));
    const total = data.items.reduce((s, i) => s + i.p, 0);
    const rest = data.wallet - total;
    const [inputTotal, setInputTotal] = useState('');
    const [inputRest, setInputRest] = useState('');
    const [checked, setChecked] = useState(false);
    const correct = Number(inputTotal) === total && Number(inputRest) === rest;
    const check = () => { setChecked(true); if (correct) { playCorrect(); fireConfetti(); onScore(); } else playWrong(); };
    return (<Card><TaskHeader icon="💰" title={`Бюджет: ${data.label}`} desc={`У вашому гаманці ${data.wallet} грн. Порахуйте витрати.`} />
        <div className="max-w-md mx-auto space-y-3">{data.items.map((it, i) => (
            <div key={i} className="flex justify-between p-3 bg-pastel-beige rounded-2xl text-lg font-semibold text-warm-gray"><span>{it.n}</span><span>{it.p} грн</span></div>
        ))}
            <div className="pt-4 space-y-3">
                <div className="flex items-center gap-3"><label className="text-lg font-bold text-warm-gray w-40">Загальна сума:</label><input type="number" value={inputTotal} onChange={e => setInputTotal(e.target.value)} disabled={checked} className="flex-1 p-3 text-xl rounded-2xl border-2 border-pastel-green focus:outline-none focus:border-green-400" placeholder="?" /></div>
                <div className="flex items-center gap-3"><label className="text-lg font-bold text-warm-gray w-40">Решта:</label><input type="number" value={inputRest} onChange={e => setInputRest(e.target.value)} disabled={checked} className="flex-1 p-3 text-xl rounded-2xl border-2 border-pastel-green focus:outline-none focus:border-green-400" placeholder="?" /></div>
            </div>
            {!checked && <div className="text-center mt-4"><BigBtn onClick={check} className="bg-pastel-green text-warm-gray">Перевірити</BigBtn></div>}
            {checked && <Result correct={correct} msg={correct ? 'Відмінно порахували!' : `Правильно: сума ${total} грн, решта ${rest} грн`} />}
        </div>
    </Card>);
}

// 4. Конструктор речень
function Task4({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(SENTENCE_DATA));
    const words = data.sentence.split(' ');
    const [pool, setPool] = useState(() => shuffle(words));
    const [built, setBuilt] = useState([]);
    const [checked, setChecked] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    const imgPrompt = data.img || `Illustration for sentence: ${data.sentence}`;
    const primaryImgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?width=512&height=512&nologo=true`;
    // Fallback to a nice abstract shape based on the sentence if AI generation is down
    const fallbackImgUrl = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(data.sentence)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    const imgUrl = imgError ? fallbackImgUrl : primaryImgUrl;

    const addWord = (w, i) => { if (checked) return; setBuilt([...built, w]); setPool(pool.filter((_, j) => j !== i)); };
    const removeWord = (w, i) => { if (checked) return; setPool([...pool, w]); setBuilt(built.filter((_, j) => j !== i)); };
    const correct = built.join(' ') === data.sentence;
    const check = () => { setChecked(true); if (correct) { playCorrect(); fireConfetti(); onScore(); } else playWrong(); };

    return (<Card><TaskHeader icon="✍️" title="Складіть речення" desc="Розставте слова у правильному порядку" />
        <div className="max-w-md mx-auto">
            <div className="w-full h-52 bg-pastel-green-light rounded-2xl mb-4 overflow-hidden relative">
                {!imgLoaded && <div className="absolute inset-0 flex items-center justify-center text-pastel-green"><Loader2 className="w-8 h-8 animate-spin" /></div>}
                <img
                    src={imgUrl}
                    alt="Ілюстрація"
                    className={`relative z-10 w-full h-full object-cover rounded-2xl transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => { if (!imgError) setImgError(true); setImgLoaded(true); }}
                />
            </div>
            <div className="min-h-16 p-3 mb-3 bg-pastel-beige rounded-2xl border-2 border-dashed border-pastel-green flex flex-wrap gap-2">
                {built.length === 0 && <span className="text-warm-gray-light text-lg">Натискайте на слова нижче...</span>}
                {built.map((w, i) => <button key={i} onClick={() => removeWord(w, i)} className="px-4 py-2 bg-pastel-green text-warm-gray font-bold rounded-2xl text-lg">{w}</button>)}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">{pool.map((w, i) => <button key={i} onClick={() => addWord(w, i)} className="px-4 py-2 bg-white border-2 border-pastel-green text-warm-gray font-bold rounded-2xl text-lg hover:bg-pastel-green-light">{w}</button>)}</div>
            {!checked && built.length === words.length && <div className="text-center mt-4"><BigBtn onClick={check} className="bg-pastel-green text-warm-gray">Перевірити</BigBtn></div>}
            {checked && <Result correct={correct} msg={correct ? 'Речення складено правильно!' : `Правильно: "${data.sentence}"`} />}
        </div>
    </Card>);
}

// 5. Асоціації
function Task5({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(ASSOC_DATA));
    const [items] = useState(() => shuffle([...data.correct, ...data.wrong]));
    const [sel, setSel] = useState(new Set());
    const [checked, setChecked] = useState(false);
    const toggle = (it) => { if (checked) return; const n = new Set(sel); n.has(it) ? n.delete(it) : (n.size < 3 && n.add(it)); setSel(n); };
    const correct = data.correct.every(c => sel.has(c)) && sel.size === 3;
    const check = () => { setChecked(true); if (correct) { playCorrect(); fireConfetti(); onScore(); } else playWrong(); };
    return (<Card><TaskHeader icon="🔗" title="Асоціації" desc={data.q} />
        <p className="text-center text-lg text-warm-gray-light mb-4">Оберіть 3 правильні відповіді</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">{items.map((it, i) => {
            const isSel = sel.has(it); const isCorr = data.correct.includes(it);
            return <button key={i} onClick={() => toggle(it)} className={`p-4 text-lg font-bold rounded-2xl border-2 transition-all ${checked ? (isCorr ? 'bg-green-100 border-green-400' : isSel ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200') : isSel ? 'bg-pastel-green border-green-400 scale-105' : 'bg-white border-pastel-beige-dark hover:bg-pastel-green-light'}`}>{it}</button>;
        })}</div>
        {!checked && sel.size === 3 && <div className="text-center mt-4"><BigBtn onClick={check} className="bg-pastel-green text-warm-gray">Перевірити</BigBtn></div>}
        {checked && <Result correct={correct} msg={correct ? 'Всі асоціації правильні!' : `Правильні: ${data.correct.join(', ')}`} />}
    </Card>);
}

// 6. Категорії (Логіка)
function Task6({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(CATEGORY_DATA));
    const [items] = useState(() => shuffle([...data.correct, ...data.wrong]));
    const [sel, setSel] = useState(new Set());
    const [checked, setChecked] = useState(false);
    const toggle = (it) => { if (checked) return; const n = new Set(sel); n.has(it) ? n.delete(it) : n.add(it); setSel(n); };
    const correct = data.correct.every(c => sel.has(c)) && [...sel].every(s => data.correct.includes(s));
    const check = () => { setChecked(true); if (correct) { playCorrect(); fireConfetti(); onScore(); } else playWrong(); };
    return (<Card><TaskHeader icon="📦" title="Категорії" desc={data.q} />
        <p className="text-center text-lg text-warm-gray-light mb-4">Оберіть усі правильні варіанти</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">{items.map((it, i) => {
            const isSel = sel.has(it); const isCorr = data.correct.includes(it);
            return <button key={i} onClick={() => toggle(it)} className={`p-4 text-lg font-bold rounded-2xl border-2 transition-all ${checked ? (isCorr ? 'bg-green-100 border-green-400' : isSel ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200') : isSel ? 'bg-pastel-blue border-blue-400 scale-105' : 'bg-white border-pastel-beige-dark hover:bg-pastel-blue/30'}`}>{it}</button>;
        })}</div>
        {!checked && sel.size > 0 && <div className="text-center mt-4"><BigBtn onClick={check} className="bg-pastel-green text-warm-gray">Перевірити</BigBtn></div>}
        {checked && <Result correct={correct} msg={correct ? 'Все вірно! Чудова логіка!' : `Правильні: ${data.correct.join(', ')}`} />}
    </Card>);
}

// 7. Правда чи Ні?
function Task7({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(TRUEFALSE_DATA));
    const [answer, setAnswer] = useState(null);
    const done = answer !== null;
    const correct = answer === data.answer;
    const handle = (v) => { if (done) return; setAnswer(v); if (v === data.answer) { playCorrect(); fireConfetti(); onScore(); } else playWrong(); };
    return (<Card><TaskHeader icon="🤔" title="Правда чи Ні?" desc="Чи правильне це твердження?" />
        <div className="max-w-lg mx-auto">
            <div className="bg-pastel-yellow p-6 rounded-3xl text-center mb-6"><p className="text-2xl font-bold text-warm-gray">"{data.text}"</p></div>
            <div className="flex gap-4 justify-center">
                <button onClick={() => handle(true)} className={`flex-1 py-6 text-2xl font-extrabold rounded-3xl border-3 transition-all ${done ? (data.answer === true ? 'bg-green-100 border-green-400' : answer === true ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200') : 'bg-white border-pastel-green hover:bg-pastel-green-light active:scale-95'}`}>✅ Правда</button>
                <button onClick={() => handle(false)} className={`flex-1 py-6 text-2xl font-extrabold rounded-3xl border-3 transition-all ${done ? (data.answer === false ? 'bg-green-100 border-green-400' : answer === false ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200') : 'bg-white border-pastel-pink hover:bg-red-50 active:scale-95'}`}>❌ Ні</button>
            </div>
            {done && <Result correct={correct} msg={correct ? 'Правильно!' : (data.answer ? 'Це правда!' : 'Це неправда!')} />}
        </div>
    </Card>);
}

// 8. Протилежності (Антоніми) — two-level hints
function Task8({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(ANTONYM_DATA));
    const [answers, setAnswers] = useState(data.sentences.map(() => ''));
    const [checked, setChecked] = useState(false);
    const [hintLevel, setHintLevel] = useState(data.sentences.map(() => 0)); // 0=none, 1=first letter, 2=length+more
    const correct = data.sentences.every((s, i) => answers[i].trim().toLowerCase() === s.a.toLowerCase());
    const setAns = (i, v) => { const n = [...answers]; n[i] = v; setAnswers(n); };
    const addHint = (i) => { const n = [...hintLevel]; n[i] = Math.min(n[i] + 1, 2); setHintLevel(n); };
    const getHintText = (s, level) => {
        if (level === 1) return `Перша літера: "${s.a[0].toUpperCase()}"`;
        if (level === 2) return `"${s.a[0].toUpperCase()}${'_'.repeat(s.a.length - 2)}${s.a[s.a.length - 1]}" (${s.a.length} літер)`;
        return '';
    };
    const check = () => { setChecked(true); if (correct) { playCorrect(); fireConfetti(); onScore(); } else playWrong(); };
    return (<Card><TaskHeader icon="↔️" title="Протилежності" desc="Допишіть слово-антонім" />
        <div className="max-w-lg mx-auto space-y-4">{data.sentences.map((s, i) => (
            <div key={i} className={`p-4 rounded-2xl border-2 ${checked ? (answers[i].trim().toLowerCase() === s.a.toLowerCase() ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300') : 'bg-white border-pastel-beige-dark'}`}>
                <p className="text-lg font-semibold text-warm-gray mb-2">{s.s}</p>
                <div className="flex gap-2">
                    <input type="text" value={answers[i]} onChange={e => setAns(i, e.target.value)} disabled={checked} placeholder="..." className="flex-1 p-3 text-xl rounded-2xl border-2 border-pastel-green focus:outline-none focus:border-green-400" />
                    {!checked && hintLevel[i] < 2 && <button onClick={() => addHint(i)} className="px-4 py-2 bg-pastel-yellow rounded-2xl text-warm-gray font-semibold flex items-center gap-1 hover:bg-yellow-200 active:scale-95 transition-all">💡{hintLevel[i] === 0 ? '' : ' ще'}</button>}
                </div>
                {hintLevel[i] > 0 && !checked && <p className="text-sm mt-2 px-3 py-1.5 bg-yellow-50 rounded-xl text-warm-gray italic">💡 {getHintText(s, hintLevel[i])}</p>}
                {checked && answers[i].trim().toLowerCase() !== s.a.toLowerCase() && <p className="text-sm text-red-500 mt-1">Відповідь: {s.a}</p>}
            </div>
        ))}</div>
        {!checked && <div className="text-center mt-4"><BigBtn onClick={check} className="bg-pastel-green text-warm-gray">Перевірити</BigBtn></div>}
        {checked && <Result correct={correct} msg={correct ? 'Всі антоніми правильні!' : 'Деякі відповіді неточні'} />}
    </Card>);
}

// 9. Письмо (Загублені голосні)
function Task9({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(VOWELS_DATA));
    const [answers, setAnswers] = useState(data.words.map(() => ''));
    const [checked, setChecked] = useState(false);
    const correct = data.words.every((w, i) => answers[i].trim().toUpperCase() === w.full.toUpperCase());
    const setAns = (i, v) => { const n = [...answers]; n[i] = v; setAnswers(n); };
    const check = () => { setChecked(true); if (correct) { playCorrect(); fireConfetti(); onScore(); } else playWrong(); };
    return (<Card><TaskHeader icon="📝" title="Загублені голосні" desc="Відновіть слова, вписавши пропущені літери" />
        <div className="max-w-lg mx-auto space-y-5">{data.words.map((w, i) => (
            <div key={i} className={`p-4 rounded-2xl border-2 ${checked ? (answers[i].trim().toUpperCase() === w.full.toUpperCase() ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300') : 'bg-white border-pastel-beige-dark'}`}>
                <p className="text-3xl font-extrabold text-warm-gray tracking-widest text-center mb-2">{removeVowels(w.full)}</p>
                <p className="text-sm text-warm-gray-light text-center italic mb-3">💡 {w.hint}</p>
                <input type="text" value={answers[i]} onChange={e => setAns(i, e.target.value)} disabled={checked} placeholder="Введіть слово..." className="w-full p-3 text-xl rounded-2xl border-2 border-pastel-green focus:outline-none focus:border-green-400 text-center" />
                {checked && answers[i].trim().toUpperCase() !== w.full.toUpperCase() && <p className="text-center text-sm text-red-500 mt-1">Відповідь: {w.full}</p>}
            </div>
        ))}</div>
        {!checked && <div className="text-center mt-4"><BigBtn onClick={check} className="bg-pastel-green text-warm-gray">Перевірити</BigBtn></div>}
        {checked && <Result correct={correct} msg={correct ? 'Всі слова відновлено!' : 'Деякі слова невірні'} />}
    </Card>);
}

// 10. Хто що робить (Дієслова) — upgraded
function Task10({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(VERB_DATA));
    // Show correct + 4 wrong (pick 4 random from wrong pool)
    const [options] = useState(() => shuffle([data.correct, ...shuffle(data.wrong).slice(0, 4)]));
    const [selected, setSelected] = useState(null);
    const done = selected !== null;
    const correct = selected === data.correct;
    const handle = (v) => { if (done) return; setSelected(v); if (v === data.correct) { playCorrect(); fireConfetti(); onScore(); } else playWrong(); };
    return (<Card><TaskHeader icon="🎯" title="Хто що робить?" desc={data.context || 'Оберіть правильну дію'} />
        <div className="max-w-md mx-auto text-center">
            <div className="text-7xl mb-6">{data.obj.split(' ')[0]}</div>
            <div className="space-y-3">{options.map((opt, i) => (
                <button key={i} onClick={() => handle(opt)} className={`w-full p-4 text-xl font-bold rounded-3xl border-2 transition-all ${done
                    ? (opt === data.correct ? 'bg-green-100 border-green-400' : opt === selected ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200')
                    : 'bg-white border-pastel-green hover:bg-pastel-green-light active:scale-95'
                    }`}>{opt}</button>
            ))}</div>
            {done && <Result correct={correct} msg={correct ? 'Правильна дія! 🎉' : `Правильно: ${data.correct}`} />}
        </div>
    </Card>);
}

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
const TOTAL_TASKS = 10;
const SLIDES = TOTAL_TASKS + 2; // intro + 10 tasks + outro

export default function App() {
    const [slide, setSlide] = useState(0);
    const [score, setScore] = useState(0);
    const [taskKeys, setTaskKeys] = useState(() => Array.from({ length: TOTAL_TASKS }, () => Math.random()));
    const [aiData, setAiData] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState(false);
    const addScore = useCallback(() => setScore(s => s + 1), []);
    const next = () => setSlide(s => Math.min(s + 1, SLIDES - 1));
    const prev = () => setSlide(s => Math.max(s - 1, 0));
    const restart = () => { setSlide(0); setScore(0); setAiData(null); setGenError(false); setTaskKeys(Array.from({ length: TOTAL_TASKS }, () => Math.random())); };

    const startSession = async () => {
        if (!GEMINI_KEY) { next(); return; }
        setGenerating(true); setGenError(false);
        const data = await generateAllTasks();
        setGenerating(false);
        if (data) { setAiData(data); } else { setGenError(true); }
        next();
    };

    useEffect(() => { if (slide === SLIDES - 1) { playVictory(); fireConfetti(); setTimeout(fireConfetti, 800); } }, [slide]);

    const tasks = [
        <Task1 key={taskKeys[0]} onScore={addScore} initialData={aiData?.findOdd} />,
        <Task2 key={taskKeys[1]} onScore={addScore} initialData={aiData?.sequence} />,
        <Task3 key={taskKeys[2]} onScore={addScore} initialData={aiData?.budget} />,
        <Task4 key={taskKeys[3]} onScore={addScore} initialData={aiData?.sentence} />,
        <Task5 key={taskKeys[4]} onScore={addScore} initialData={aiData?.associations} />,
        <Task6 key={taskKeys[5]} onScore={addScore} initialData={aiData?.categories} />,
        <Task7 key={taskKeys[6]} onScore={addScore} initialData={aiData?.trueFalse} />,
        <Task8 key={taskKeys[7]} onScore={addScore} initialData={aiData?.antonyms} />,
        <Task9 key={taskKeys[8]} onScore={addScore} initialData={aiData?.vowels} />,
        <Task10 key={taskKeys[9]} onScore={addScore} initialData={aiData?.verbs} />,
    ];

    return (
        <div className="min-h-screen bg-pastel-beige flex flex-col">
            {/* Header */}
            <header className="bg-white/70 backdrop-blur-md shadow-sm py-4 px-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3"><Brain className="w-8 h-8 text-pastel-green" /><h1 className="text-xl md:text-2xl font-extrabold text-warm-gray">Тренажер Пам'яті</h1></div>
                {slide > 0 && slide < SLIDES - 1 && <div className="flex items-center gap-2"><Star className="w-6 h-6 text-yellow-500" /><span className="text-lg font-bold text-warm-gray">{score}/{TOTAL_TASKS}</span></div>}
                {slide > 0 && slide < SLIDES - 1 && <div className="flex items-center gap-1 text-sm font-semibold text-warm-gray-light">{aiData && <Sparkles className="w-4 h-4 text-pastel-green" />}{slide} / {TOTAL_TASKS}</div>}
            </header>

            {/* Content */}
            <main className="flex-1 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
                <div className="w-full max-w-2xl">
                    {/* Intro */}
                    {slide === 0 && (
                        <Card className="text-center py-12">
                            <div className="text-7xl mb-6">🧠</div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-warm-gray mb-4">Вітаємо!</h1>
                            <p className="text-xl text-warm-gray-light mb-2">Цей тренажер допоможе вам тренувати пам'ять та увагу.</p>
                            <p className="text-lg text-warm-gray-light mb-8">10 цікавих завдань чекають на вас. Не поспішайте і отримуйте задоволення!</p>
                            {generating ? (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-14 h-14 text-pastel-green animate-spin" />
                                    <p className="text-xl font-bold text-warm-gray animate-pulse">✨ Створюємо нові завдання...</p>
                                    <p className="text-sm text-warm-gray-light">Зазвичай це займає 5-10 секунд</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <BigBtn onClick={startSession} className="bg-pastel-green text-warm-gray text-2xl"><Sparkles className="inline w-6 h-6 mr-2" />Розпочати</BigBtn>
                                    {GEMINI_KEY && <p className="text-sm text-warm-gray-light flex items-center gap-1"><Sparkles className="w-4 h-4 text-pastel-green" /> AI генерує унікальні завдання щоразу</p>}
                                    <div className="flex items-center gap-2 text-warm-gray-light"><Volume2 className="w-5 h-5" /><span className="text-sm">Увімкніть звук для кращого досвіду</span></div>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Tasks */}
                    {slide > 0 && slide < SLIDES - 1 && tasks[slide - 1]}

                    {/* Outro */}
                    {slide === SLIDES - 1 && (
                        <Card className="text-center py-12">
                            <div className="text-7xl mb-4">🏆</div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-warm-gray mb-4">Вітаємо з завершенням!</h1>
                            <div className="text-6xl font-extrabold text-pastel-green mb-2">{score} / {TOTAL_TASKS}</div>
                            <p className="text-xl text-warm-gray-light mb-2">{score >= 8 ? 'Чудовий результат! Ваша пам\'ять у відмінній формі! 🌟' : score >= 5 ? 'Гарний результат! Продовжуйте тренуватися! 💪' : 'Не засмучуйтесь! Кожне тренування робить вашу пам\'ять кращою! ❤️'}</p>
                            <div className="flex items-center justify-center gap-1 my-4">{Array.from({ length: TOTAL_TASKS }).map((_, i) => <Heart key={i} className={`w-7 h-7 ${i < score ? 'text-red-400 fill-red-400' : 'text-gray-300'}`} />)}</div>
                            <BigBtn onClick={restart} className="bg-pastel-green text-warm-gray text-xl mt-4"><RefreshCw className="inline w-5 h-5 mr-2" />Пройти ще раз</BigBtn>
                        </Card>
                    )}
                </div>
            </main>

            {/* Navigation */}
            {slide > 0 && (
                <nav className="bg-white/80 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.05)] py-4 px-6 flex justify-between items-center sticky bottom-0 z-10">
                    <BigBtn onClick={prev} className="bg-pastel-beige-dark text-warm-gray" disabled={slide === 0}><ChevronLeft className="inline w-5 h-5 mr-1" />Назад</BigBtn>
                    <div className="flex gap-1">{Array.from({ length: SLIDES }).map((_, i) => <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i === slide ? 'bg-pastel-green scale-125' : i < slide ? 'bg-pastel-green/50' : 'bg-gray-300'}`} />)}</div>
                    <BigBtn onClick={next} className="bg-pastel-green text-warm-gray" disabled={slide === SLIDES - 1}>Вперед<ChevronRight className="inline w-5 h-5 ml-1" /></BigBtn>
                </nav>
            )}
        </div>
    );
}
