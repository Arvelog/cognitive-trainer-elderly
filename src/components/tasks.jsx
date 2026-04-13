import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, BigBtn, TaskHeader, Result } from './common';
import { playCorrect, playWrong, fireConfetti, shuffle, pick } from '../lib/audio';
import {
    MATCH_NEED_DATA,
    FIND_ODD_DATA,
    SEQUENCE_DATA,
    BUDGET_DATA,
    SENTENCE_DATA,
    ASSOC_DATA,
    CATEGORY_SORT_DATA,
    TRUEFALSE_DATA,
    ANTONYM_DATA,
    VOWELS_DATA,
    VERB_DATA,
    WHATCHANGED_DATA,
    removeVowels,
} from '../data/taskData';

export function Task1({ onScore, initialData }) {
    const [data] = useState(() => {
        if (initialData?.prompt && Array.isArray(initialData.options) && Array.isArray(initialData.correct)) {
            return initialData;
        }
        if (initialData?.word && Array.isArray(initialData.options) && Array.isArray(initialData.correct)) {
            return { prompt: initialData.word, options: initialData.options, correct: initialData.correct, hint: initialData.hint };
        }
        return pick(MATCH_NEED_DATA.length ? MATCH_NEED_DATA : FIND_ODD_DATA);
    });
    const [selected, setSelected] = useState([]);
    const [checked, setChecked] = useState(false);
    const [wrong, setWrong] = useState(false);
    const done = checked && selected.length === data.correct.length;
    const selectedSet = new Set(selected);
    const correct = data.correct.every((idx) => selectedSet.has(idx)) && selected.length === data.correct.length;
    const handleClick = (i) => {
        if (checked || selected.includes(i)) return;
        const next = [...selected, i];
        setSelected(next);
        if (next.length !== data.correct.length) return;
        const ok = next.length === data.correct.length && data.correct.every((idx) => next.includes(idx));
        setChecked(true);
        if (ok) {
            playCorrect();
            fireConfetti();
            onScore();
            setWrong(false);
        } else {
            playWrong();
            setWrong(true);
        }
    };
    return (
        <Card>
            <TaskHeader icon="🔍" title="Що потрібно для цього?" desc="Оберіть 2 речі, без яких це не вийде." />
            <div className="max-w-2xl mx-auto mb-6 text-center">
                <div className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-pastel-green-light text-warm-gray font-extrabold text-4xl md:text-5xl">
                    {data.prompt}
                </div>
            </div>
            <p className="text-center text-2xl md:text-3xl font-medium text-warm-gray-light mb-6">Потрібно вибрати 2 предмети.</p>
            <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
                {data.options.map((it, i) => (
                    <button
                        key={i}
                        onClick={() => handleClick(i)}
                        className={`min-h-[88px] flex items-center justify-center p-4 md:p-6 text-2xl md:text-3xl font-bold text-center leading-tight rounded-2xl border-3 transition-all duration-200 ${
                            checked
                                ? selectedSet.has(i)
                                    ? data.correct.includes(i)
                                        ? 'bg-green-100 border-green-400'
                                        : 'bg-red-100 border-red-400'
                                    : data.correct.includes(i)
                                        ? 'bg-green-100 border-green-400'
                                        : 'bg-gray-50 border-gray-200'
                                : selected.includes(i)
                                    ? 'bg-pastel-green-light border-pastel-green scale-[1.02]'
                                : 'bg-white border-pastel-green hover:bg-pastel-green-light hover:scale-105 active:scale-95'
                        }`}
                    >
                        {it}
                    </button>
                ))}
            </div>
            {checked && <Result correct={correct} msg={correct ? 'Чудово! Ви вибрали все потрібне.' : `Потрібно: ${data.correct.map((idx) => data.options[idx]).join(' + ')}`} />}
            {wrong && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => {
                            setSelected([]);
                            setChecked(false);
                            setWrong(false);
                        }}
                        className="px-6 py-3 rounded-full bg-pastel-beige text-warm-gray font-semibold text-lg hover:bg-pastel-beige-dark transition-colors"
                    >
                        Спробувати ще раз
                    </button>
                </div>
            )}
        </Card>
    );
}

export function Task2({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(SEQUENCE_DATA));
    const [shuffled] = useState(() => shuffle(data.steps.map((s, i) => ({ text: s, idx: i }))));
    const [selected, setSelected] = useState([]);
    const [checked, setChecked] = useState(false);
    const tapStep = (item) => {
        if (checked || selected.find((s) => s.idx === item.idx)) return;
        const next = [...selected, item];
        setSelected(next);
        if (next.length === 4) {
            const ok = next.every((s, i) => s.idx === i);
            setTimeout(() => {
                setChecked(true);
                if (ok) {
                    playCorrect();
                    fireConfetti();
                    onScore();
                } else playWrong();
            }, 300);
        }
    };
    const undoFrom = (fromIndex) => {
        if (checked || selected.length === 0) return;
        setSelected(selected.slice(0, fromIndex));
    };
    const correct = selected.length === 4 && selected.every((s, i) => s.idx === i);
    return (
        <Card>
            <TaskHeader icon="📋" title="Відновіть послідовність" desc={data.title} />
            <p className="text-center text-3xl md:text-4xl font-medium text-warm-gray-light mb-8">Натискайте на кроки у правильному порядку: 1, 2, 3, 4</p>
            {selected.length > 0 && (
                <div className="max-w-lg mx-auto mb-4 space-y-2">
                    <p className="text-sm font-bold text-warm-gray">Ваш порядок:</p>
                    {selected.map((s, i) => (
                        <div
                            key={i}
                            onClick={() => !checked && undoFrom(i)}
                            className={`flex items-center gap-3 p-3 rounded-2xl ${
                                checked
                                    ? s.idx === i
                                        ? 'bg-green-100 border-2 border-green-400'
                                        : 'bg-red-100 border-2 border-red-400'
                                    : 'bg-pastel-green-light border-2 border-pastel-green cursor-pointer hover:bg-red-50 hover:border-red-300 active:scale-[0.98] transition-all'
                            }`}
                        >
                            <span className="w-10 h-10 flex items-center justify-center rounded-full bg-pastel-green text-white font-bold text-2xl">{i + 1}</span>
                            <span className="text-2xl font-semibold text-warm-gray">{s.text}</span>
                            {!checked && <span className="ml-auto text-warm-gray-light text-lg">✕</span>}
                        </div>
                    ))}
                </div>
            )}
            <div className="space-y-3 max-w-lg mx-auto">
                {shuffled.map((item, i) => {
                    const used = selected.find((s) => s.idx === item.idx);
                    if (used) return null;
                    return (
                        <button
                            key={i}
                            onClick={() => tapStep(item)}
                            disabled={checked}
                            className="w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all text-xl md:text-2xl font-semibold bg-white border-pastel-beige-dark hover:bg-pastel-green-light hover:border-pastel-green active:scale-[0.98]"
                        >
                            {item.text}
                        </button>
                    );
                })}
            </div>
            {checked && <Result correct={correct} msg={correct ? 'Бездоганний порядок!' : 'Правильний порядок: ' + data.steps.join(' → ')} />}
        </Card>
    );
}

export function Task3({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(BUDGET_DATA));
    const total = data.items.reduce((s, i) => s + i.p * (i.qty || 1), 0);
    const rest = data.wallet - total;
    const [inputTotal, setInputTotal] = useState('');
    const [inputRest, setInputRest] = useState('');
    const [checked, setChecked] = useState(false);
    const correct = Number(inputTotal) === total && Number(inputRest) === rest;
    const check = () => {
        setChecked(true);
        if (correct) {
            playCorrect();
            fireConfetti();
            onScore();
        } else playWrong();
    };
    return (
        <Card>
            <TaskHeader icon="💰" title={`Бюджет: ${data.label}`} desc={`У вашому гаманці ${data.wallet} грн. Порахуйте витрати.`} />
            <div className="max-w-md mx-auto space-y-3">
                {data.items.map((it, i) => (
                    <div key={i} className="flex justify-between p-4 bg-pastel-beige rounded-2xl text-2xl font-semibold text-warm-gray">
                        <span>{it.n}{it.qty ? ` ×${it.qty}` : ''}</span>
                        <span>{it.p} грн{it.qty ? ` / шт` : ''}</span>
                    </div>
                ))}
                <div className="pt-4 space-y-3">
                    <div className="flex items-center gap-4">
                        <label className="text-2xl font-bold text-warm-gray w-56">Загальна сума:</label>
                        <input type="number" value={inputTotal} onChange={(e) => setInputTotal(e.target.value)} disabled={checked} className="flex-1 p-5 text-3xl rounded-2xl border-2 border-pastel-green focus:outline-none focus:border-green-400" placeholder="?" />
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="text-2xl font-bold text-warm-gray w-56">Решта:</label>
                        <input type="number" value={inputRest} onChange={(e) => setInputRest(e.target.value)} disabled={checked} className="flex-1 p-5 text-3xl rounded-2xl border-2 border-pastel-green focus:outline-none focus:border-green-400" placeholder="?" />
                    </div>
                </div>
                {!checked && (
                    <div className="text-center mt-4">
                        <BigBtn onClick={check} disabled={!inputTotal.trim() || !inputRest.trim()} className="bg-pastel-green text-warm-gray">
                            Перевірити
                        </BigBtn>
                    </div>
                )}
                {checked && <Result correct={correct} msg={correct ? 'Відмінно порахували!' : `Правильно: сума ${total} грн, решта ${rest} грн`} />}
            </div>
        </Card>
    );
}

export function Task4({ onScore, initialData }) {
    const [data] = useState(() => {
        if (initialData) {
            if (initialData.sentences) return initialData;
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
        if (newBuilt.length === words.length) {
            const isCorrect = newBuilt.join(' ') === sentence;
            if (isCorrect) {
                playCorrect();
                setResults((r) => [...r, true]);
                if (current < allSentences.length - 1) {
                    goToNext(true);
                } else {
                    setTimeout(() => {
                        setDone(true);
                        fireConfetti();
                        onScore();
                    }, 800);
                }
            } else {
                playWrong();
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

    const goToNext = () => {
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

    return (
        <Card>
            <TaskHeader icon="✍️" title="Складіть речення" desc={`Речення ${current + 1} з ${allSentences.length}`} />
            <div className="max-w-lg mx-auto">
                <div className="flex justify-center gap-3 mb-6">
                    {allSentences.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-4 h-4 rounded-full transition-all duration-500 ${
                                idx < results.length
                                    ? results[idx]
                                        ? 'bg-green-400 scale-125'
                                        : 'bg-red-400 scale-125'
                                    : idx === current
                                        ? 'bg-pastel-green scale-150 ring-4 ring-pastel-green/30'
                                        : 'bg-gray-300'
                            }`}
                        />
                    ))}
                </div>

                {!done && (
                    <div
                        key={current}
                        style={{
                            animation: slideIn ? 'snt-slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'snt-slide-out 0.4s cubic-bezier(0.7, 0, 0.84, 0) forwards',
                        }}
                    >
                        <div className={`min-h-[100px] p-5 mb-6 rounded-3xl border-3 transition-all duration-300 flex flex-wrap gap-2 items-center justify-center ${built.length === words.length ? (built.join(' ') === sentence ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400 animate-pulse') : 'bg-white border-pastel-green border-dashed'}`}>
                            {built.length === 0 && <span className="text-warm-gray-light text-xl italic">Натискайте на слова, щоб скласти речення...</span>}
                            {built.map((w, i) => (
                                <button key={`b-${i}`} onClick={() => removeWord(w, i)} className="px-5 py-3 bg-pastel-green text-white font-bold rounded-2xl text-2xl shadow-md hover:bg-green-500 active:scale-90 transition-all" style={{ animation: 'snt-word-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
                                    {w}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-3 justify-center">
                            {pool.map((w, i) => (
                                <button key={`p-${i}-${w}`} onClick={() => addWord(w, i)} className="px-5 py-3 bg-white border-2 border-pastel-beige-dark text-warm-gray font-bold rounded-2xl text-2xl shadow-sm hover:border-pastel-green hover:bg-pastel-green-light hover:shadow-md active:scale-90 transition-all">
                                    {w}
                                </button>
                            ))}
                        </div>

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

            <style
                dangerouslySetInnerHTML={{
                    __html: `
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
        `,
                }}
            />
        </Card>
    );
}

export function Task5({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(ASSOC_DATA));
    const [items] = useState(() => shuffle([...data.correct, ...data.wrong]));
    const [sel, setSel] = useState(new Set());
    const [checked, setChecked] = useState(false);
    const toggle = (it) => {
        if (checked) return;
        const n = new Set(sel);
        n.has(it) ? n.delete(it) : (n.size < 3 && n.add(it));
        setSel(n);
    };
    const correct = data.correct.every((c) => sel.has(c)) && sel.size === 3;
    const check = () => {
        setChecked(true);
        if (correct) {
            playCorrect();
            fireConfetti();
            onScore();
        } else playWrong();
    };
    return (
        <Card>
            <TaskHeader icon="🔗" title="Асоціації" desc={data.q} />
            <p className="text-center text-3xl md:text-4xl font-medium text-warm-gray-light mb-8">Оберіть 3 правильні відповіді</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {items.map((it, i) => {
                    const isSel = sel.has(it);
                    const isCorr = data.correct.includes(it);
                    return (
                        <button key={i} onClick={() => toggle(it)} className={`p-3 md:p-5 text-2xl md:text-3xl font-bold rounded-2xl border-2 transition-all break-words whitespace-normal leading-tight ${checked ? (isCorr ? 'bg-green-100 border-green-400' : isSel ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200') : isSel ? 'bg-pastel-green border-green-400 scale-105' : 'bg-white border-pastel-beige-dark hover:bg-pastel-green-light'}`}>
                            {it}
                        </button>
                    );
                })}
            </div>
            {!checked && sel.size === 3 && (
                <div className="text-center mt-4">
                    <BigBtn onClick={check} className="bg-pastel-green text-warm-gray">
                        Перевірити
                    </BigBtn>
                </div>
            )}
            {checked && <Result correct={correct} msg={correct ? 'Всі асоціації правильні!' : `Правильні: ${data.correct.join(', ')}`} />}
        </Card>
    );
}

export function Task6({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(CATEGORY_SORT_DATA));
    const [items] = useState(() => shuffle(data.items));
    const [placements, setPlacements] = useState({});
    const [selectedItem, setSelectedItem] = useState(null);
    const [dropCue, setDropCue] = useState(null);
    const [checked, setChecked] = useState(false);
    useEffect(() => {
        if (!dropCue) return;
        const timer = setTimeout(() => setDropCue(null), 420);
        return () => clearTimeout(timer);
    }, [dropCue]);
    const assign = (idx, group) => {
        if (checked) return;
        setPlacements((prev) => ({ ...prev, [idx]: group }));
        setDropCue({ itemIdx: idx, groupIdx: group });
        setSelectedItem(null);
    };
    const unassign = (idx) => {
        if (checked) return;
        setPlacements((prev) => {
            const next = { ...prev };
            delete next[idx];
            return next;
        });
    };
    const chosenCount = Object.keys(placements).length;
    const correct = items.length > 0 && items.every((item, idx) => placements[idx] === item.group);
    const check = () => {
        setChecked(true);
        if (correct) {
            playCorrect();
            fireConfetti();
            onScore();
        } else playWrong();
    };
    return (
        <Card>
            <TaskHeader icon="📦" title="Розкладіть по 3 кошиках" desc={data.groupLabels.join(' · ')} />
            <p className="text-center text-3xl md:text-4xl font-medium text-warm-gray-light mb-4">Спочатку виберіть предмет знизу, потім натисніть кошик зверху.</p>
            <p className="text-center text-2xl md:text-3xl font-semibold text-pastel-green mb-6">Розкладено: {chosenCount} з {items.length}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto mb-8">
                {data.groupLabels.map((label, groupIdx) => {
                    const assignedItems = items.filter((item, idx) => placements[idx] === groupIdx);
                    const basketStyles = [
                        'border-rose-300 bg-rose-50/80 hover:bg-rose-100',
                        'border-amber-300 bg-amber-50/80 hover:bg-amber-100',
                        'border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100',
                    ];
                    const iconRing = [
                        'bg-rose-200 text-rose-700',
                        'bg-amber-200 text-amber-700',
                        'bg-emerald-200 text-emerald-700',
                    ];
                    return (
                        <button
                            key={label}
                            onClick={() => selectedItem !== null && assign(selectedItem, groupIdx)}
                            disabled={checked}
                            className={`min-h-[180px] rounded-3xl border-4 border-dashed p-4 md:p-6 text-left transition-all active:scale-[0.99] ${basketStyles[groupIdx % basketStyles.length]} ${dropCue?.groupIdx === groupIdx ? 'animate-basket-pop' : ''}`}
                        >
                            <div className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full text-5xl md:text-6xl mb-3 ${iconRing[groupIdx % iconRing.length]}`}>
                                {data.groupIcons?.[groupIdx] || '🧺'}
                            </div>
                            <div className="text-3xl md:text-4xl font-extrabold text-warm-gray mb-2">{label}</div>
                            <div className="text-lg md:text-xl font-semibold text-warm-gray-light">Предметів: {assignedItems.length}</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {assignedItems.map((item, idx) => (
                                    <span key={`${groupIdx}-${idx}`} className="inline-flex items-center px-3 py-2 rounded-full bg-white text-warm-gray font-bold text-lg shadow-sm">
                                        {item.text}
                                    </span>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>
            <div className="max-w-4xl mx-auto mb-6 text-center">
                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white shadow-sm text-warm-gray font-bold text-xl md:text-2xl">
                    {selectedItem !== null ? `Вибрано: ${items[selectedItem].text}` : 'Виберіть предмет знизу'}
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {items.map((it, i) => {
                    const placed = placements[i] !== undefined;
                    const isCorrectPlace = checked && placements[i] === it.group;
                    const isWrongPlace = checked && placements[i] !== undefined && placements[i] !== it.group;
                    const isSelected = selectedItem === i;
                    const justDropped = dropCue?.itemIdx === i;
                    return (
                        <button
                            key={i}
                            onClick={() => {
                                if (checked) return;
                                if (placed) {
                                    unassign(i);
                                    if (selectedItem === i) setSelectedItem(null);
                                } else {
                                    setSelectedItem((prev) => (prev === i ? null : i));
                                }
                            }}
                            className={`p-4 md:p-5 rounded-2xl border-2 transition-all text-2xl md:text-3xl font-bold ${
                                checked
                                    ? isCorrectPlace
                                        ? 'bg-green-100 border-green-400'
                                        : isWrongPlace
                                            ? 'bg-red-100 border-red-400'
                                            : 'bg-gray-50 border-gray-200'
                                    : placed
                                        ? `bg-pastel-green-light border-pastel-green ${justDropped ? 'animate-basket-pop' : ''}`
                                        : isSelected
                                            ? 'bg-pastel-blue border-blue-400 scale-[1.02]'
                                            : 'bg-white border-pastel-beige-dark hover:bg-pastel-green-light'
                            }`}
                        >
                            {it.text}
                        </button>
                    );
                })}
            </div>
            {!checked && chosenCount === items.length && (
                <div className="text-center mt-4">
                    <BigBtn onClick={check} className="bg-pastel-green text-warm-gray">
                        Перевірити
                    </BigBtn>
                </div>
            )}
            {checked && <Result correct={correct} msg={correct ? 'Все вірно! Чудово розкладено.' : `Потрібно було розкласти на: ${data.groupLabels.join(', ')}.`} />}
        </Card>
    );
}

export function Task7({ onScore, initialData }) {
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
        if (isCorrect) playCorrect();
        else playWrong();
        if (current < statements.length - 1) {
            setAnimating(true);
            setTimeout(() => {
                setSlideIn(false);
            }, 800);
            setTimeout(() => {
                setCurrent((c) => c + 1);
                setSlideIn(true);
                setAnimating(false);
            }, 1200);
        } else {
            setTimeout(() => {
                setDone(true);
                const allCorrect = newAnswers.every((a) => a.correct);
                if (allCorrect) {
                    fireConfetti();
                    onScore();
                }
            }, 1000);
        }
    };

    const correctCount = answers.filter((a) => a.correct).length;
    const s = statements[current];
    const answered = answers[current] !== undefined;

    return (
        <Card>
            <TaskHeader icon="🤔" title="Правда чи Ні?" desc={`Твердження ${current + 1} з ${statements.length}`} />
            <div className="max-w-lg mx-auto">
                <div className="flex justify-center gap-3 mb-8">
                    {statements.map((_, idx) => (
                        <div key={idx} className={`w-4 h-4 rounded-full transition-all duration-500 ${idx < answers.length ? (answers[idx]?.correct ? 'bg-green-400 scale-125' : 'bg-red-400 scale-125') : idx === current ? 'bg-pastel-green scale-150 ring-4 ring-pastel-green/30' : 'bg-gray-300'}`} />
                    ))}
                </div>

                {!done && (
                    <div
                        key={current}
                        style={{
                            animation: slideIn ? 'tf-slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'tf-slide-out 0.4s cubic-bezier(0.7, 0, 0.84, 0) forwards',
                        }}
                    >
                        <div className={`p-8 rounded-3xl text-center mb-8 transition-colors duration-500 ${answered ? (answers[current]?.correct ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300') : 'bg-pastel-yellow'}`}>
                            <p className="text-4xl font-bold text-warm-gray leading-tight">"{s.text}"</p>
                            {answered && <p className={`mt-3 text-2xl font-bold ${answers[current]?.correct ? 'text-green-600' : 'text-red-500'}`}>{answers[current]?.correct ? '✅ Правильно!' : s.answer ? '❌ Це була правда' : '❌ Це було неправдою'}</p>}
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

            <style
                dangerouslySetInnerHTML={{
                    __html: `
            @keyframes tf-slide-in {
                from { opacity: 0; transform: translateX(60px) scale(0.95); }
                to { opacity: 1; transform: translateX(0) scale(1); }
            }
            @keyframes tf-slide-out {
                from { opacity: 1; transform: translateX(0) scale(1); }
                to { opacity: 0; transform: translateX(-60px) scale(0.95); }
            }
        `,
                }}
            />
        </Card>
    );
}

export function Task8({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(ANTONYM_DATA));
    const [answers, setAnswers] = useState(data.sentences.map(() => ''));
    const [checked, setChecked] = useState(false);
    const [hintLevel, setHintLevel] = useState(data.sentences.map(() => 0));
    const correct = data.sentences.every((s, i) => answers[i].trim().toLowerCase() === s.a.toLowerCase());
    const setAns = (i, v) => {
        const n = [...answers];
        n[i] = v;
        setAnswers(n);
    };
    const addHint = (i) => {
        const n = [...hintLevel];
        n[i] = Math.min(n[i] + 1, 3);
        setHintLevel(n);
    };
    const getHintText = (s, level) => {
        const u = s.a.toUpperCase();
        if (level === 1) return `1 літера: ${u[0]}`;
        if (level === 2) return `${u[0]}${'_'.repeat(u.length - 2)}${u[u.length - 1]}`;
        if (level === 3) {
            if (u.length <= 4) return u;
            return `${u[0]}${u[1]}${'_'.repeat(u.length - 4)}${u[u.length - 2]}${u[u.length - 1]}`;
        }
        return '';
    };
    const check = () => {
        setChecked(true);
        if (correct) {
            playCorrect();
            fireConfetti();
            onScore();
        } else playWrong();
    };
    return (
        <Card>
            <TaskHeader icon="↔️" title="Протилежності" desc="Коротке слово" />
            <div className="max-w-xl mx-auto space-y-4">
                {data.sentences.map((s, i) => (
                    <div key={i} className={`p-4 md:p-5 rounded-3xl border-2 ${checked ? (answers[i].trim().toLowerCase() === s.a.toLowerCase() ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300') : 'bg-white border-pastel-beige-dark'}`}>
                        <p className="text-2xl md:text-3xl font-extrabold text-warm-gray mb-3 leading-tight">{s.s.replace(new RegExp(s.a, 'gi'), '...').replace(/\.\.\.\.\.\./g, '...')}</p>
                        <div className="flex gap-2 md:gap-3 items-stretch">
                            <input type="text" value={answers[i]} onChange={(e) => setAns(i, e.target.value)} disabled={checked} placeholder="..." className="flex-1 min-w-0 p-3 md:p-4 text-3xl md:text-4xl rounded-3xl border-2 border-pastel-green focus:outline-none focus:border-green-400 text-center tracking-wide" />
                            {!checked && hintLevel[i] < 3 && <button onClick={() => addHint(i)} className="px-3 md:px-4 py-3 md:py-4 text-base md:text-lg bg-pastel-yellow rounded-3xl text-warm-gray font-semibold flex items-center gap-1 hover:bg-yellow-200 active:scale-95 transition-all">💡{hintLevel[i] === 0 ? '' : ' ще'}</button>}
                        </div>
                        {hintLevel[i] > 0 && !checked && <p className="mt-2 inline-flex text-sm md:text-base px-3 py-2 bg-yellow-50 rounded-2xl text-warm-gray font-semibold">💡 {getHintText(s, hintLevel[i])}</p>}
                        {checked && answers[i].trim().toLowerCase() !== s.a.toLowerCase() && <p className="text-sm md:text-base text-red-500 mt-2 font-semibold">Відповідь: {s.a}</p>}
                    </div>
                ))}
            </div>
            {!checked && <div className="text-center mt-4"><BigBtn onClick={check} disabled={answers.some((a) => !a.trim())} className="bg-pastel-green text-warm-gray">Перевірити</BigBtn></div>}
            {checked && <Result correct={correct} msg={correct ? 'Всі антоніми правильні!' : 'Деякі відповіді неточні'} />}
        </Card>
    );
}

export function Task9({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(VOWELS_DATA));
    const [answers, setAnswers] = useState(data.words.map(() => ''));
    const [checked, setChecked] = useState(data.words.map(() => false));
    const [allDone, setAllDone] = useState(false);

    const isCorrect = (w, i) => answers[i].trim().toUpperCase() === w.full.toUpperCase();
    const setAns = (i, v) => {
        const n = [...answers];
        n[i] = v;
        setAnswers(n);
    };

    const checkWord = (i) => {
        if (!answers[i].trim()) return;
        const n = [...checked];
        n[i] = true;
        setChecked(n);
        if (isCorrect(data.words[i], i)) {
            playCorrect();
        } else {
            playWrong();
        }
        const allChecked = n.every((c) => c);
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

    return (
        <Card>
            <TaskHeader icon="📝" title="Загублені голосні" desc="Відновіть слова, вписавши пропущені літери" />
            <div className="max-w-lg mx-auto space-y-2 md:space-y-3">
                {data.words.map((w, i) => (
                    <div key={i} className={`p-3 md:p-4 rounded-2xl border-2 ${checked[i] ? (isCorrect(w, i) ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300') : 'bg-white border-pastel-beige-dark'}`}>
                        <p className="text-3xl md:text-4xl font-extrabold text-warm-gray tracking-[0.2em] text-center mb-1">{removeVowels(w.full)}</p>
                        <p className="text-base md:text-lg text-warm-gray-light text-center italic mb-2">💡 {w.hint}</p>

                        <div className="flex gap-2 items-stretch justify-center">
                            <input type="text" value={answers[i]} onChange={(e) => setAns(i, e.target.value)} disabled={checked[i]} placeholder="Слово..." className="flex-1 w-full min-w-0 p-2 md:p-3 text-2xl md:text-3xl uppercase rounded-xl border-2 border-pastel-green focus:outline-none focus:border-green-400 text-center" />

                            {!checked[i] ? (
                                <button onClick={() => checkWord(i)} disabled={!answers[i].trim()} className="px-6 py-2 text-2xl font-bold bg-pastel-green text-warm-gray rounded-xl shadow-md hover:bg-green-400 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center">
                                    ✓
                                </button>
                            ) : (
                                <div className="flex items-center justify-center px-4 bg-white/50 rounded-xl">
                                    {isCorrect(w, i) ? <p className="text-2xl text-green-600 font-bold">✅</p> : <p className="text-lg text-red-500 font-bold leading-tight">❌ {w.full}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {allDone && <Result correct={data.words.every((w, idx) => isCorrect(w, idx))} msg={data.words.every((w, idx) => isCorrect(w, idx)) ? 'Всі слова відновлено!' : 'Деякі слова невірні'} />}
        </Card>
    );
}

export function Task10({ onScore, initialData, imageUrl, scenePrompt, loading }) {
    const baseDataRef = useRef(initialData || pick(VERB_DATA));
    const [data, setData] = useState(() => baseDataRef.current);
    const [options, setOptions] = useState(() => {
        return shuffle([...baseDataRef.current.correct, ...baseDataRef.current.wrong]);
    });
    const [sel, setSel] = useState(new Set());
    const [checked, setChecked] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        if (!initialData) return;
        setData(initialData);
        setOptions(shuffle([...initialData.correct, ...initialData.wrong]));
        setSel(new Set());
        setChecked(false);
    }, [initialData]);

    useEffect(() => {
        setImgLoaded(false);
        setImgError(false);
        if (imgRef.current?.complete) {
            setImgLoaded(true);
        }
    }, [imageUrl]);

    const toggle = (opt) => {
        if (checked) return;
        const n = new Set(sel);
        n.has(opt) ? n.delete(opt) : (n.size < 3 && n.add(opt));
        setSel(n);
    };
    const correct = data.correct.every((c) => sel.has(c)) && sel.size === 3;
    const check = () => {
        setChecked(true);
        if (correct) {
            playCorrect();
            fireConfetti();
            onScore();
        } else playWrong();
    };

    const showImage = imageUrl && !imgError;

    if (loading && !imageUrl) {
        return (
            <Card>
                <TaskHeader icon="🖼️" title="Що відбувається?" desc="Зачекайте, ми готуємо картинку та відповіді." />
                <div className="max-w-4xl mx-auto">
                    <div className="h-72 rounded-3xl bg-pastel-beige animate-pulse flex items-center justify-center">
                        <Loader2 className="w-12 h-12 text-pastel-green animate-spin" />
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <TaskHeader icon="🖼️" title="Що відбувається?" desc={data.context || 'Подивіться на сцену та оберіть, що на ній відбувається'} />
            <div className="max-w-4xl mx-auto text-center">
                {showImage ? (
                    <div className="mb-4 md:mb-6 flex justify-center">
                        <div className="relative w-full max-w-md h-56">
                            {!imgLoaded && (
                                <div className="absolute inset-0 rounded-3xl bg-pastel-beige animate-pulse flex items-center justify-center">
                                    <Loader2 className="w-10 h-10 text-pastel-green animate-spin" />
                                </div>
                            )}
                            <img
                                ref={imgRef}
                                src={imageUrl}
                                alt={data.title}
                                onLoad={() => setImgLoaded(true)}
                                onError={() => setImgError(true)}
                                className={`w-full h-56 rounded-3xl shadow-lg object-cover transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="mb-4 md:mb-6 p-6 bg-pastel-beige rounded-3xl">
                        <p className="text-4xl font-bold text-warm-gray mb-2">🖼️ {data.title}</p>
                        {scenePrompt && <p className="text-lg md:text-xl text-warm-gray-light leading-snug">{scenePrompt}</p>}
                    </div>
                )}
                <p className="text-center text-3xl md:text-4xl font-medium text-warm-gray-light mb-8">Оберіть 3 правильні відповіді</p>
                <div className="space-y-3">
                    {options.map((opt, i) => {
                        const isSel = sel.has(opt);
                        const isCorr = data.correct.includes(opt);
                        return (
                            <button key={i} onClick={() => toggle(opt)} className={`w-full text-left p-4 md:p-5 text-xl md:text-2xl font-semibold rounded-2xl border-2 transition-all ${checked ? (isCorr ? 'bg-green-100 border-green-400' : isSel ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200') : isSel ? 'bg-pastel-blue border-blue-400' : 'bg-white border-pastel-beige-dark hover:bg-pastel-blue/30'}`}>
                                {opt}
                            </button>
                        );
                    })}
                </div>
                {!checked && sel.size === 3 && (
                    <div className="text-center mt-4">
                        <BigBtn onClick={check} className="bg-pastel-green text-warm-gray">
                            Перевірити
                        </BigBtn>
                    </div>
                )}
                {checked && <Result correct={correct} msg={correct ? 'Все правильно! 🎉' : `Правильні: ${data.correct.join(', ')}`} />}
            </div>
        </Card>
    );
}

export function Task11({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(WHATCHANGED_DATA));
    const changedGrid = useState(() => {
        const g = [...data.items];
        data.changes.forEach((c) => {
            g[c.idx] = c.to;
        });
        return g;
    })[0];
    const changedIndices = useState(() => new Set(data.changes.map((c) => c.idx)))[0];
    const [revealed, setRevealed] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [checked, setChecked] = useState(false);
    const numChanges = data.changes.length;
    const resetAttempt = () => {
        setRevealed(false);
        setSelected(new Set());
        setChecked(false);
    };

    const toggle = (i) => {
        if (!revealed || checked) return;
        const n = new Set(selected);
        n.has(i) ? n.delete(i) : (n.size < numChanges && n.add(i));
        setSelected(n);
    };

    const correct = selected.size === numChanges && [...selected].every((i) => changedIndices.has(i));
    const check = () => {
        setChecked(true);
        if (correct) {
            playCorrect();
            fireConfetti();
            onScore();
        } else playWrong();
    };

    const grid = revealed ? changedGrid : data.items;
    const selectedCount = selected.size;

    return (
        <Card>
            <TaskHeader
                icon="👀"
                title="Що змінилось?"
                desc={revealed ? `Тепер знайдіть ${numChanges} змінені картки.` : 'Спочатку запам\'ятайте 6 карток, потім натисніть кнопку.'}
            />
            <div className="max-w-md mx-auto">
                <div className="mb-4 p-4 rounded-2xl bg-white/70 border border-pastel-beige-dark text-center">
                    <p className="text-xl md:text-2xl font-extrabold text-warm-gray">{revealed ? 'Крок 2: Знайдіть зміни' : 'Крок 1: Запам\'ятайте'}</p>
                    <p className="text-sm md:text-base text-warm-gray-light mt-1">
                        {revealed ? `Знайдено ${selectedCount} з ${numChanges}.` : 'Просто дивіться і запамʼятовуйте.'}
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {grid.map((item, i) => {
                        const isSel = selected.has(i);
                        const isChanged = changedIndices.has(i);
                        return (
                            <button
                                key={i}
                                onClick={() => toggle(i)}
                                disabled={!revealed}
                                className={`aspect-square text-5xl md:text-6xl rounded-2xl border-3 transition-all duration-200 flex items-center justify-center ${!revealed ? 'bg-white border-pastel-beige-dark cursor-default' : checked ? (isChanged ? (isSel ? 'bg-green-100 border-green-400' : 'bg-yellow-100 border-yellow-400') : isSel ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200') : isSel ? 'bg-pastel-blue border-blue-400 scale-105' : 'bg-white border-pastel-beige-dark hover:bg-pastel-green-light hover:scale-105 active:scale-95 cursor-pointer'}`}
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>
                {!revealed && (
                    <div className="text-center mt-6">
                        <BigBtn onClick={() => setRevealed(true)} className="bg-pastel-green text-warm-gray">
                            Показати зміни
                        </BigBtn>
                    </div>
                )}
                {revealed && !checked && selected.size === numChanges && (
                    <div className="text-center mt-6">
                        <BigBtn onClick={check} className="bg-pastel-green text-warm-gray">
                            Перевірити
                        </BigBtn>
                    </div>
                )}
                {revealed && !checked && selected.size < numChanges && (
                    <p className="text-center text-sm md:text-base text-warm-gray-light mt-4">
                        Залишилось вибрати: {numChanges - selected.size}
                    </p>
                )}
                {checked && <Result correct={correct} msg={correct ? 'Чудова пам\'ять! Ви знайшли всі зміни!' : `Змінились: позиції ${[...changedIndices].map((i) => i + 1).join(', ')}`} />}
                {checked && !correct && (
                    <div className="text-center mt-4">
                        <BigBtn onClick={resetAttempt} className="bg-pastel-beige-dark text-warm-gray">
                            Спробувати ще раз
                        </BigBtn>
                    </div>
                )}
            </div>
        </Card>
    );
}
