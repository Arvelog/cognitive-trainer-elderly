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
const TaskHeader = ({ icon, title, desc }) => (<div className="text-center mb-6 md:mb-8"><div className="text-6xl mb-3">{icon}</div><h2 className="text-4xl md:text-5xl font-extrabold text-warm-gray mb-4">{title}</h2><p className="text-2xl md:text-3xl font-semibold text-warm-gray-light leading-snug">{desc}</p></div>);
const Result = ({ correct, msg }) => (<div className={`mt-4 p-4 rounded-2xl text-center text-xl font-bold ${correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{correct ? '✅ ' : '❌ '}{msg}</div>);

// ═══════════════════════════════════════
// AI GENERATION (via Backend API)
// ═══════════════════════════════════════

async function generateAllTasks() {
    try {
        const response = await fetch('/api/generate', { method: 'POST' });

        if (response.status === 429) {
            console.warn('Backend reported 429 Too Many Requests.');
            return { _rateLimited: true };
        }

        if (!response.ok) {
            console.warn(`Backend request failed with status ${response.status}.`);
            return null;
        }

        const text = await response.text();
        // Vite config returns index.html for unknown routes if testing locally without API proxy
        if (text.trim().startsWith('<')) {
            return null;
        }

        let resultData = null;
        try {
            resultData = JSON.parse(text);
        } catch (parseError) {
            console.warn('Failed to parse backend JSON response:', parseError);
            return null;
        }

        if (resultData?.error) {
            const errorText = String(resultData.error);
            if (errorText.includes('429')) {
                console.warn('Backend response body indicates 429 Too Many Requests.');
                return { _rateLimited: true };
            }
            return null;
        }

        const data = resultData;

        // Validate essential fields exist
        if (!data || !data.findOdd || !data.sequence || !data.budget || !data.sentence ||
            !data.associations || !data.categories || !data.trueFalse ||
            !data.antonyms || !data.vowels || !data.verbs) {
            console.warn('App: incomplete data, using fallback');
            return null;
        }

        // Validate that findOdd generated exactly 4 items
        if (!Array.isArray(data.findOdd.items) || data.findOdd.items.length !== 4) {
            console.warn('App: findOdd data is malformed (not exactly 4 items), using fallback to prevent UI breakage');
            return null;
        }

        return data;
    } catch (e) {
        console.warn('AI generation failed:', e);
        return null; // Force fallback to default array
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
    { sentences: ['Дідусь поливає красиві квіти в саду', 'Бабуся в\'яже теплі шкарпетки для онуків', 'Кіт спить на теплій м\'якій подушці'] },
    { sentences: ['Пара гуляє в осінньому золотому парку', 'Дідусь читає свіжу газету на лавці', 'Бабуся пече смачний яблучний пиріг'] },
    { sentences: ['Онуки приїхали на літні канікули додому', 'Яскраве сонце зійшло над зеленим полем', 'Красиві квіти розцвіли біля старої хати'] },
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
    { statements: [{ text: 'Взимку ведмеді сплять у барлозі', answer: true }, { text: 'Кішки вміють гавкати', answer: false }, { text: 'Мед роблять бджоли', answer: true }] },
    { statements: [{ text: 'Сонце сходить на сході', answer: true }, { text: 'Рибу ловлять сачком для метеликів', answer: false }, { text: 'Вода замерзає при нулі градусів', answer: true }] },
    { statements: [{ text: 'Зайці люблять їсти капусту', answer: true }, { text: 'Щоб висушити одяг, його треба намочити у відрі', answer: false }, { text: 'Восени листя опадає з дерев', answer: true }] },
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
    { title: 'Кухня', context: 'Що відбувається на цій сцені?', correct: ['Жінка варить борщ', 'На плиті кипить каструля', 'На столі лежать овочі'], wrong: ['Хтось грає на гітарі', 'Діти будують сніговика', 'Чоловік миє машину'] },
    { title: 'Город', context: 'Що відбувається на цій сцені?', correct: ['Бабуся поливає грядки', 'Ростуть помідори', 'Сонце світить над городом'], wrong: ['Іде сильний дощ', 'Хтось читає книгу', 'Діти грають у м\'яча'] },
    { title: 'Парк', context: 'Що відбувається на цій сцені?', correct: ['Люди гуляють алеєю', 'На лавці сидить пара', 'Дерева зеленіють'], wrong: ['Хтось їде на лижах', 'Кухар готує обід', 'Машина їде дорогою'] },
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
        <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">{data.items.map((it, i) => (
            <button key={i} onClick={() => handleClick(i)} className={`p-4 md:p-6 text-3xl md:text-5xl font-bold rounded-2xl border-3 transition-all duration-200 ${done ? (i === data.odd ? 'bg-green-100 border-green-400' : i === selected ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200') : 'bg-white border-pastel-green hover:bg-pastel-green-light hover:scale-105 active:scale-95'}`}>{it}</button>
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
    const undoFrom = (fromIndex) => { if (checked || selected.length === 0) return; setSelected(selected.slice(0, fromIndex)); };
    const correct = selected.length === 4 && selected.every((s, i) => s.idx === i);
    return (<Card><TaskHeader icon="📋" title="Відновіть послідовність" desc={data.title} />
        <p className="text-center text-3xl md:text-4xl font-medium text-warm-gray-light mb-8">Натискайте на кроки у правильному порядку: 1, 2, 3, 4</p>
        {selected.length > 0 && <div className="max-w-lg mx-auto mb-4 space-y-2">
            <p className="text-sm font-bold text-warm-gray">Ваш порядок:</p>
            {selected.map((s, i) => (
                <div key={i} onClick={() => !checked && undoFrom(i)} className={`flex items-center gap-3 p-3 rounded-2xl ${checked ? (s.idx === i ? 'bg-green-100 border-2 border-green-400' : 'bg-red-100 border-2 border-red-400') : 'bg-pastel-green-light border-2 border-pastel-green cursor-pointer hover:bg-red-50 hover:border-red-300 active:scale-[0.98] transition-all'}`}>
                    <span className="w-10 h-10 flex items-center justify-center rounded-full bg-pastel-green text-white font-bold text-2xl">{i + 1}</span>
                    <span className="text-2xl font-semibold text-warm-gray">{s.text}</span>
                    {!checked && <span className="ml-auto text-warm-gray-light text-lg">✕</span>}
                </div>
            ))}
        </div>}
        <div className="space-y-3 max-w-lg mx-auto">
            {shuffled.map((item, i) => {
                const used = selected.find(s => s.idx === item.idx);
                if (used) return null;
                return <button key={i} onClick={() => tapStep(item)} disabled={checked} className="w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all text-xl md:text-2xl font-semibold bg-white border-pastel-beige-dark hover:bg-pastel-green-light hover:border-pastel-green active:scale-[0.98]">{item.text}</button>;
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
            <div key={i} className="flex justify-between p-4 bg-pastel-beige rounded-2xl text-2xl font-semibold text-warm-gray"><span>{it.n}</span><span>{it.p} грн</span></div>
        ))}
            <div className="pt-4 space-y-3">
                <div className="flex items-center gap-4"><label className="text-2xl font-bold text-warm-gray w-56">Загальна сума:</label><input type="number" value={inputTotal} onChange={e => setInputTotal(e.target.value)} disabled={checked} className="flex-1 p-5 text-3xl rounded-2xl border-2 border-pastel-green focus:outline-none focus:border-green-400" placeholder="?" /></div>
                <div className="flex items-center gap-4"><label className="text-2xl font-bold text-warm-gray w-56">Решта:</label><input type="number" value={inputRest} onChange={e => setInputRest(e.target.value)} disabled={checked} className="flex-1 p-5 text-3xl rounded-2xl border-2 border-pastel-green focus:outline-none focus:border-green-400" placeholder="?" /></div>
            </div>
            {!checked && <div className="text-center mt-4"><BigBtn onClick={check} disabled={!inputTotal.trim() || !inputRest.trim()} className="bg-pastel-green text-warm-gray">Перевірити</BigBtn></div>}
            {checked && <Result correct={correct} msg={correct ? 'Відмінно порахували!' : `Правильно: сума ${total} грн, решта ${rest} грн`} />}
        </div>
    </Card>);
}

// 4. Конструктор речень (3 речення послідовно, без картинки)
function Task4({ onScore, initialData }) {
    const [data] = useState(() => {
        if (initialData) {
            if (initialData.sentences) return initialData;
            // AI returned old format with single sentence — wrap
            if (initialData.sentence) return { sentences: [initialData.sentence] };
            return pick(SENTENCE_DATA);
        }
        return pick(SENTENCE_DATA);
    });
    const allSentences = data.sentences;
    const [current, setCurrent] = useState(0);
    const [pool, setPool] = useState(() => shuffle(allSentences[0].split(' ')));
    const [built, setBuilt] = useState([]);
    const [animating, setAnimating] = useState(false);
    const [slideIn, setSlideIn] = useState(true);
    const [results, setResults] = useState([]);
    const [done, setDone] = useState(false);

    const sentence = allSentences[current];
    const words = sentence.split(' ');

    const addWord = (w, i) => {
        if (animating || done) return;
        const newBuilt = [...built, w];
        setBuilt(newBuilt);
        setPool(pool.filter((_, j) => j !== i));

        // Auto-check when all words placed
        if (newBuilt.length === words.length) {
            const isCorrect = newBuilt.join(' ') === sentence;
            if (isCorrect) {
                playCorrect();
                setResults(r => [...r, true]);
                if (current < allSentences.length - 1) {
                    goToNext(true);
                } else {
                    setTimeout(() => { setDone(true); fireConfetti(); onScore(); }, 800);
                }
            } else {
                playWrong();
                // Reset after short delay
                setTimeout(() => {
                    setBuilt([]);
                    setPool(shuffle(words));
                }, 1200);
            }
        }
    };

    const removeWord = (w, i) => {
        if (animating || done) return;
        setPool([...pool, w]);
        setBuilt(built.filter((_, j) => j !== i));
    };

    const goToNext = (correct) => {
        setAnimating(true);
        setTimeout(() => setSlideIn(false), 600);
        setTimeout(() => {
            const nextIdx = current + 1;
            setCurrent(nextIdx);
            setBuilt([]);
            setPool(shuffle(allSentences[nextIdx].split(' ')));
            setSlideIn(true);
            setAnimating(false);
        }, 1000);
    };

    const correctCount = results.filter(Boolean).length;

    return (<Card><TaskHeader icon="✍️" title="Складіть речення" desc={`Речення ${current + 1} з ${allSentences.length}`} />
        <div className="max-w-lg mx-auto">
            {/* Progress dots */}
            <div className="flex justify-center gap-3 mb-6">
                {allSentences.map((_, idx) => (
                    <div key={idx} className={`w-4 h-4 rounded-full transition-all duration-500 ${
                        idx < results.length ? (results[idx] ? 'bg-green-400 scale-125' : 'bg-red-400 scale-125')
                        : idx === current ? 'bg-pastel-green scale-150 ring-4 ring-pastel-green/30'
                        : 'bg-gray-300'
                    }`} />
                ))}
            </div>

            {!done && (
                <div
                    key={current}
                    style={{
                        animation: slideIn ? 'snt-slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'snt-slide-out 0.4s cubic-bezier(0.7, 0, 0.84, 0) forwards'
                    }}
                >
                    {/* Sentence building area */}
                    <div className={`min-h-[100px] p-5 mb-6 rounded-3xl border-3 transition-all duration-300 flex flex-wrap gap-2 items-center justify-center ${
                        built.length === words.length
                            ? (built.join(' ') === sentence ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400 animate-pulse')
                            : 'bg-white border-pastel-green border-dashed'
                    }`}>
                        {built.length === 0 && (
                            <span className="text-warm-gray-light text-xl italic">Натискайте на слова, щоб скласти речення...</span>
                        )}
                        {built.map((w, i) => (
                            <button
                                key={`b-${i}`}
                                onClick={() => removeWord(w, i)}
                                className="px-5 py-3 bg-pastel-green text-white font-bold rounded-2xl text-2xl shadow-md hover:bg-green-500 active:scale-90 transition-all"
                                style={{ animation: 'snt-word-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
                            >
                                {w}
                            </button>
                        ))}
                    </div>

                    {/* Word pool */}
                    <div className="flex flex-wrap gap-3 justify-center">
                        {pool.map((w, i) => (
                            <button
                                key={`p-${i}-${w}`}
                                onClick={() => addWord(w, i)}
                                className="px-5 py-3 bg-white border-2 border-pastel-beige-dark text-warm-gray font-bold rounded-2xl text-2xl shadow-sm hover:border-pastel-green hover:bg-pastel-green-light hover:shadow-md active:scale-90 transition-all"
                            >
                                {w}
                            </button>
                        ))}
                    </div>

                    {/* Number hint */}
                    <p className="text-center text-warm-gray-light text-lg mt-4">
                        {built.length} / {words.length} слів
                    </p>
                </div>
            )}

            {done && (
                <div style={{ animation: 'snt-slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
                    <Result correct={correctCount === allSentences.length} msg={correctCount === allSentences.length ? 'Всі речення складено правильно! 🎉' : `Правильних: ${correctCount} з ${allSentences.length}`} />
                </div>
            )}
        </div>

        <style dangerouslySetInnerHTML={{__html: `
            @keyframes snt-slide-in {
                from { opacity: 0; transform: translateX(60px) scale(0.95); }
                to { opacity: 1; transform: translateX(0) scale(1); }
            }
            @keyframes snt-slide-out {
                from { opacity: 1; transform: translateX(0) scale(1); }
                to { opacity: 0; transform: translateX(-60px) scale(0.95); }
            }
            @keyframes snt-word-pop {
                from { opacity: 0; transform: scale(0.5); }
                to { opacity: 1; transform: scale(1); }
            }
        `}} />
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
        <p className="text-center text-3xl md:text-4xl font-medium text-warm-gray-light mb-8">Оберіть 3 правильні відповіді</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">{items.map((it, i) => {
            const isSel = sel.has(it); const isCorr = data.correct.includes(it);
            return <button key={i} onClick={() => toggle(it)} className={`p-3 md:p-5 text-2xl md:text-3xl font-bold rounded-2xl border-2 transition-all break-words whitespace-normal leading-tight ${checked ? (isCorr ? 'bg-green-100 border-green-400' : isSel ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200') : isSel ? 'bg-pastel-green border-green-400 scale-105' : 'bg-white border-pastel-beige-dark hover:bg-pastel-green-light'}`}>{it}</button>;
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
        <p className="text-center text-3xl md:text-4xl font-medium text-warm-gray-light mb-8">Оберіть усі правильні варіанти</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">{items.map((it, i) => {
            const isSel = sel.has(it); const isCorr = data.correct.includes(it);
            return <button key={i} onClick={() => toggle(it)} className={`p-3 md:p-5 text-2xl md:text-3xl font-bold rounded-2xl border-2 transition-all break-words whitespace-normal leading-tight ${checked ? (isCorr ? 'bg-green-100 border-green-400' : isSel ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200') : isSel ? 'bg-pastel-blue border-blue-400 scale-105' : 'bg-white border-pastel-beige-dark hover:bg-pastel-blue/30'}`}>{it}</button>;
        })}</div>
        {!checked && sel.size > 0 && <div className="text-center mt-4"><BigBtn onClick={check} className="bg-pastel-green text-warm-gray">Перевірити</BigBtn></div>}
        {checked && <Result correct={correct} msg={correct ? 'Все вірно! Чудова логіка!' : `Правильні: ${data.correct.join(', ')}`} />}
    </Card>);
}

// 7. Правда чи Ні? (3 твердження, по одному з анімацією)
function Task7({ onScore, initialData }) {
    const [data] = useState(() => {
        if (initialData) {
            if (initialData.statements) return initialData;
            return pick(TRUEFALSE_DATA);
        }
        return pick(TRUEFALSE_DATA);
    });
    const statements = data.statements;
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [animating, setAnimating] = useState(false);
    const [slideIn, setSlideIn] = useState(true);
    const [done, setDone] = useState(false);

    const handle = (v) => {
        if (animating || done) return;
        const isCorrect = v === statements[current].answer;
        const newAnswers = [...answers, { value: v, correct: isCorrect }];
        setAnswers(newAnswers);

        if (isCorrect) playCorrect(); else playWrong();

        if (current < statements.length - 1) {
            setAnimating(true);
            // Slide out current
            setTimeout(() => {
                setSlideIn(false);
            }, 800);
            // Slide in next
            setTimeout(() => {
                setCurrent(c => c + 1);
                setSlideIn(true);
                setAnimating(false);
            }, 1200);
        } else {
            // All done
            setTimeout(() => {
                setDone(true);
                const allCorrect = newAnswers.every(a => a.correct);
                if (allCorrect) { fireConfetti(); onScore(); }
            }, 1000);
        }
    };

    const correctCount = answers.filter(a => a.correct).length;
    const s = statements[current];
    const answered = answers[current] !== undefined;

    return (<Card><TaskHeader icon="🤔" title="Правда чи Ні?" desc={`Твердження ${current + 1} з ${statements.length}`} />
        <div className="max-w-lg mx-auto">
            {/* Progress dots */}
            <div className="flex justify-center gap-3 mb-8">
                {statements.map((_, idx) => (
                    <div key={idx} className={`w-4 h-4 rounded-full transition-all duration-500 ${
                        idx < answers.length ? (answers[idx]?.correct ? 'bg-green-400 scale-125' : 'bg-red-400 scale-125')
                        : idx === current ? 'bg-pastel-green scale-150 ring-4 ring-pastel-green/30'
                        : 'bg-gray-300'
                    }`} />
                ))}
            </div>

            {!done && (
                <div
                    key={current}
                    style={{
                        animation: slideIn ? 'tf-slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'tf-slide-out 0.4s cubic-bezier(0.7, 0, 0.84, 0) forwards'
                    }}
                >
                    <div className={`p-8 rounded-3xl text-center mb-8 transition-colors duration-500 ${
                        answered ? (answers[current]?.correct ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300')
                        : 'bg-pastel-yellow'
                    }`}>
                        <p className="text-4xl font-bold text-warm-gray leading-tight">"{s.text}"</p>
                        {answered && (
                            <p className={`mt-3 text-2xl font-bold ${answers[current]?.correct ? 'text-green-600' : 'text-red-500'}`}>
                                {answers[current]?.correct ? '✅ Правильно!' : (s.answer ? '❌ Це була правда' : '❌ Це було неправдою')}
                            </p>
                        )}
                    </div>
                    {!answered && (
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => handle(true)} className="flex-1 py-8 text-4xl font-extrabold rounded-3xl border-3 transition-all bg-white border-pastel-green hover:bg-pastel-green-light active:scale-95">✅ Правда</button>
                            <button onClick={() => handle(false)} className="flex-1 py-8 text-4xl font-extrabold rounded-3xl border-3 transition-all bg-white border-pastel-pink hover:bg-red-50 active:scale-95">❌ Ні</button>
                        </div>
                    )}
                </div>
            )}

            {done && (
                <div style={{ animation: 'tf-slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
                    <Result correct={correctCount === statements.length} msg={correctCount === statements.length ? 'Всі відповіді правильні! 🎉' : `Правильних: ${correctCount} з ${statements.length}`} />
                </div>
            )}
        </div>

        <style dangerouslySetInnerHTML={{__html: `
            @keyframes tf-slide-in {
                from { opacity: 0; transform: translateX(60px) scale(0.95); }
                to { opacity: 1; transform: translateX(0) scale(1); }
            }
            @keyframes tf-slide-out {
                from { opacity: 1; transform: translateX(0) scale(1); }
                to { opacity: 0; transform: translateX(-60px) scale(0.95); }
            }
        `}} />
    </Card>);
}

// 8. Протилежності (Антоніми) — three-level hints
function Task8({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(ANTONYM_DATA));
    const [answers, setAnswers] = useState(data.sentences.map(() => ''));
    const [checked, setChecked] = useState(false);
    const [hintLevel, setHintLevel] = useState(data.sentences.map(() => 0)); // 0=none, 1=1st, 2=1st+last, 3=1st,2nd+last,2nd-to-last
    const correct = data.sentences.every((s, i) => answers[i].trim().toLowerCase() === s.a.toLowerCase());
    const setAns = (i, v) => { const n = [...answers]; n[i] = v; setAnswers(n); };
    const addHint = (i) => { const n = [...hintLevel]; n[i] = Math.min(n[i] + 1, 3); setHintLevel(n); };
    const getHintText = (s, level) => {
        const u = s.a.toUpperCase();
        if (level === 1) return `Перша літера: "${u[0]}"`;
        if (level === 2) return `"${u[0]}${'_'.repeat(u.length - 2)}${u[u.length - 1]}" (${u.length} літер)`;
        if (level === 3) {
            if (u.length <= 4) return `"${u}"`;
            return `"${u[0]}${u[1]}${'_'.repeat(u.length - 4)}${u[u.length - 2]}${u[u.length - 1]}" (${u.length} літер)`;
        }
        return '';
    };
    const check = () => { setChecked(true); if (correct) { playCorrect(); fireConfetti(); onScore(); } else playWrong(); };
    return (<Card><TaskHeader icon="↔️" title="Протилежності" desc="Допишіть слово-антонім" />
        <div className="max-w-lg mx-auto space-y-4">{data.sentences.map((s, i) => (
            <div key={i} className={`p-4 rounded-2xl border-2 ${checked ? (answers[i].trim().toLowerCase() === s.a.toLowerCase() ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300') : 'bg-white border-pastel-beige-dark'}`}>
                <p className="text-2xl font-semibold text-warm-gray mb-3">
                    {s.s.replace(new RegExp(s.a, 'gi'), '...').replace(/\.\.\.\.\.\./g, '...')}
                </p>
                <div className="flex gap-3">
                    <input type="text" value={answers[i]} onChange={e => setAns(i, e.target.value)} disabled={checked} placeholder="..." className="flex-1 p-4 text-3xl rounded-2xl border-2 border-pastel-green focus:outline-none focus:border-green-400" />
                    {!checked && hintLevel[i] < 3 && <button onClick={() => addHint(i)} className="px-5 py-3 text-xl bg-pastel-yellow rounded-2xl text-warm-gray font-semibold flex items-center gap-1 hover:bg-yellow-200 active:scale-95 transition-all">💡{hintLevel[i] === 0 ? '' : ' ще'}</button>}
                </div>
                {hintLevel[i] > 0 && !checked && <p className="text-sm mt-2 px-3 py-1.5 bg-yellow-50 rounded-xl text-warm-gray italic">💡 {getHintText(s, hintLevel[i])}</p>}
                {checked && answers[i].trim().toLowerCase() !== s.a.toLowerCase() && <p className="text-sm text-red-500 mt-1">Відповідь: {s.a}</p>}
            </div>
        ))}</div>
        {!checked && <div className="text-center mt-4"><BigBtn onClick={check} disabled={answers.some(a => !a.trim())} className="bg-pastel-green text-warm-gray">Перевірити</BigBtn></div>}
        {checked && <Result correct={correct} msg={correct ? 'Всі антоніми правильні!' : 'Деякі відповіді неточні'} />}
    </Card>);
}

// 9. Письмо (Загублені голосні)
function Task9({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(VOWELS_DATA));
    const [answers, setAnswers] = useState(data.words.map(() => ''));
    const [checked, setChecked] = useState(data.words.map(() => false));
    const [allDone, setAllDone] = useState(false);

    const isCorrect = (w, i) => answers[i].trim().toUpperCase() === w.full.toUpperCase();
    const setAns = (i, v) => { const n = [...answers]; n[i] = v; setAnswers(n); };

    const checkWord = (i) => {
        if (!answers[i].trim()) return; // don't allow checking empty
        const n = [...checked];
        n[i] = true;
        setChecked(n);

        if (isCorrect(data.words[i], i)) {
            playCorrect();
        } else {
            playWrong();
        }

        const allChecked = n.every(c => c);
        if (allChecked) {
            setAllDone(true);
            const allCorrect = data.words.every((w, idx) => isCorrect(w, idx));
            if (allCorrect) {
                setTimeout(() => {
                    fireConfetti();
                    onScore();
                }, 500);
            }
        }
    };

    return (<Card><TaskHeader icon="📝" title="Загублені голосні" desc="Відновіть слова, вписавши пропущені літери" />
        <div className="max-w-lg mx-auto space-y-2 md:space-y-3">{data.words.map((w, i) => (
            <div key={i} className={`p-3 md:p-4 rounded-2xl border-2 ${checked[i] ? (isCorrect(w, i) ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300') : 'bg-white border-pastel-beige-dark'}`}>
                <p className="text-3xl md:text-4xl font-extrabold text-warm-gray tracking-[0.2em] text-center mb-1">{removeVowels(w.full)}</p>
                <p className="text-base md:text-lg text-warm-gray-light text-center italic mb-2">💡 {w.hint}</p>

                <div className="flex gap-2 items-stretch justify-center">
                    <input type="text" value={answers[i]} onChange={e => setAns(i, e.target.value)} disabled={checked[i]} placeholder="Слово..." className="flex-1 w-full min-w-0 p-2 md:p-3 text-2xl md:text-3xl uppercase rounded-xl border-2 border-pastel-green focus:outline-none focus:border-green-400 text-center" />

                    {!checked[i] ? (
                        <button onClick={() => checkWord(i)} disabled={!answers[i].trim()} className="px-6 py-2 text-2xl font-bold bg-pastel-green text-warm-gray rounded-xl shadow-md hover:bg-green-400 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center">
                            ✓
                        </button>
                    ) : (
                        <div className="flex items-center justify-center px-4 bg-white/50 rounded-xl">
                            {isCorrect(w, i) ? (
                                <p className="text-2xl text-green-600 font-bold">✅</p>
                            ) : (
                                <p className="text-lg text-red-500 font-bold leading-tight">❌ {w.full}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        ))}</div>
        {allDone && <Result correct={data.words.every((w, idx) => isCorrect(w, idx))} msg={data.words.every((w, idx) => isCorrect(w, idx)) ? 'Всі слова відновлено!' : 'Деякі слова невірні'} />}
    </Card>);
}

// 10. Що відбувається? (Сцена з картинкою)
function Task10({ onScore, initialData, imageUrl }) {
    const [data] = useState(() => initialData || pick(VERB_DATA));
    const [options] = useState(() => shuffle([...data.correct, ...data.wrong]));
    const [sel, setSel] = useState(new Set());
    const [checked, setChecked] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    const toggle = (opt) => { if (checked) return; const n = new Set(sel); n.has(opt) ? n.delete(opt) : (n.size < 3 && n.add(opt)); setSel(n); };
    const correct = data.correct.every(c => sel.has(c)) && sel.size === 3;
    const check = () => { setChecked(true); if (correct) { playCorrect(); fireConfetti(); onScore(); } else playWrong(); };

    const showImage = imageUrl && !imgError;

    return (<Card><TaskHeader icon="🖼️" title="Що відбувається?" desc={data.context || 'Подивіться на сцену та оберіть, що на ній відбувається'} />
        <div className="max-w-4xl mx-auto text-center">
            {showImage ? (
                <div className="mb-4 md:mb-6 flex justify-center">
                    {!imgLoaded && <div className="w-full max-w-md h-56 rounded-3xl bg-pastel-beige animate-pulse flex items-center justify-center"><Loader2 className="w-10 h-10 text-pastel-green animate-spin" /></div>}
                    <img src={imageUrl} alt={data.title} onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} className={`w-full max-w-md rounded-3xl shadow-lg object-cover ${imgLoaded ? '' : 'hidden'}`} />
                </div>
            ) : (
                <div className="mb-4 md:mb-6 p-6 bg-pastel-beige rounded-3xl">
                    <p className="text-4xl font-bold text-warm-gray">🖼️ {data.title}</p>
                </div>
            )}
            <p className="text-center text-3xl md:text-4xl font-medium text-warm-gray-light mb-8">Оберіть 3 правильні відповіді</p>
            <div className="space-y-3">{options.map((opt, i) => {
                const isSel = sel.has(opt); const isCorr = data.correct.includes(opt);
                return <button key={i} onClick={() => toggle(opt)} className={`w-full text-left p-4 md:p-5 text-xl md:text-2xl font-semibold rounded-2xl border-2 transition-all ${checked ? (isCorr ? 'bg-green-100 border-green-400' : isSel ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200') : isSel ? 'bg-pastel-blue border-blue-400' : 'bg-white border-pastel-beige-dark hover:bg-pastel-blue/30'}`}>{opt}</button>;
            })}</div>
            {!checked && sel.size === 3 && <div className="text-center mt-4"><BigBtn onClick={check} className="bg-pastel-green text-warm-gray">Перевірити</BigBtn></div>}
            {checked && <Result correct={correct} msg={correct ? 'Все правильно! 🎉' : `Правильні: ${data.correct.join(', ')}`} />}
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
    const [rateLimitError, setRateLimitError] = useState(false);
    const [started, setStarted] = useState(false);
    const [verbImage, setVerbImage] = useState(null);
    const [verbQuestions, setVerbQuestions] = useState(null);
    const addScore = useCallback(() => setScore(s => s + 1), []);
    const next = () => setSlide(s => Math.min(s + 1, SLIDES - 1));
    const prev = () => setSlide(s => Math.max(s - 1, 0));
    const restart = () => { setSlide(0); setScore(0); setAiData(null); setGenError(false); setRateLimitError(false); setStarted(false); setVerbImage(null); setVerbQuestions(null); setTaskKeys(Array.from({ length: TOTAL_TASKS }, () => Math.random())); };

    const generateImage = async (scene) => {
        try {
            const res = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: scene })
            });
            if (!res.ok) return;
            const { url, questions } = await res.json();
            if (url) setVerbImage(url);
            if (questions) setVerbQuestions(questions);
        } catch { /* silently fail — emoji fallback */ }
    };

    const startSession = async () => {
        setGenerating(true); setGenError(false); setRateLimitError(false); setVerbImage(null);
        const data = await generateAllTasks();
        setGenerating(false);
        if (data && data._rateLimited) {
            setRateLimitError(true);
            setAiData(null);
        } else if (data) {
            setAiData(data);
            if (data.verbs?.scene) generateImage(data.verbs.scene);
        } else {
            setGenError(true);
        }
        setStarted(true);
        next();
    };

    useEffect(() => { if (slide === SLIDES - 1) { playVictory(); fireConfetti(); setTimeout(fireConfetti, 800); } }, [slide]);

    const tasks = [
        <Task1 key={taskKeys[0]} onScore={addScore} initialData={aiData?.findOdd} />,
        <Task2 key={taskKeys[1]} onScore={addScore} initialData={aiData?.sequence} />,
        <Task8 key={taskKeys[7]} onScore={addScore} initialData={aiData?.antonyms} />,
        <Task3 key={taskKeys[2]} onScore={addScore} initialData={aiData?.budget} />,
        <Task4 key={taskKeys[3]} onScore={addScore} initialData={aiData?.sentence} />,
        <Task5 key={taskKeys[4]} onScore={addScore} initialData={aiData?.associations} />,
        <Task6 key={taskKeys[5]} onScore={addScore} initialData={aiData?.categories} />,
        <Task9 key={taskKeys[8]} onScore={addScore} initialData={aiData?.vowels} />,
        <Task7 key={taskKeys[6]} onScore={addScore} initialData={aiData?.trueFalse} />,
        <Task10 key={taskKeys[9]} onScore={addScore} initialData={verbQuestions?.correct ? verbQuestions : null} imageUrl={verbImage} />,
    ];

    return (
        <div className="min-h-screen bg-pastel-beige flex flex-col relative">
            {rateLimitError && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-3 text-center text-sm md:text-base font-bold shadow-md z-50">
                    ⚠️ Штучний інтелект перевантажено (забагато запитів). Увімкнено базові завдання. Спробуйте пізніше для нових завдань.
                </div>
            )}

            {/* Header */}
            <header className="bg-white/70 backdrop-blur-md shadow-sm py-4 px-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3"><Brain className="w-8 h-8 text-pastel-green" /><h1 className="text-xl md:text-2xl font-extrabold text-warm-gray">Тренажер Пам'яті</h1></div>
                {slide > 0 && slide < SLIDES - 1 && <div className="flex items-center gap-2"><Star className="w-6 h-6 text-yellow-500" /><span className="text-lg font-bold text-warm-gray">{score}/{TOTAL_TASKS}</span></div>}
                {slide > 0 && slide < SLIDES - 1 && <div className="flex items-center gap-1 text-sm font-semibold text-warm-gray-light">{aiData && <Sparkles className="w-4 h-4 text-pastel-green" />}{slide} / {TOTAL_TASKS}</div>}
            </header>

            {/* Content */}
            <main className="flex-1 flex items-start justify-center p-4 md:p-8 overflow-y-auto mt-2">
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
                                    <p className="text-sm text-warm-gray-light flex items-center gap-1"><Sparkles className="w-4 h-4 text-pastel-green" /> AI генерує унікальні завдання щоразу</p>
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
            {(slide > 0 || started) && (
                <nav className="bg-white/80 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.05)] py-4 px-6 flex justify-between items-center sticky bottom-0 z-10">
                    <BigBtn onClick={prev} className="bg-pastel-beige-dark text-warm-gray" disabled={slide === 0}><ChevronLeft className="inline w-5 h-5 mr-1" />Назад</BigBtn>
                    <div className="flex gap-1">{Array.from({ length: SLIDES }).map((_, i) => <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i === slide ? 'bg-pastel-green scale-125' : i < slide ? 'bg-pastel-green/50' : 'bg-gray-300'}`} />)}</div>
                    <BigBtn onClick={next} className="bg-pastel-green text-warm-gray" disabled={slide === SLIDES - 1}>Вперед<ChevronRight className="inline w-5 h-5 ml-1" /></BigBtn>
                </nav>
            )}
        </div>
    );
}
