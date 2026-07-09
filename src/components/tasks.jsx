import React, { useEffect, useRef, useState } from 'react';
import { Check, EyeOff, Lightbulb, Loader2, RotateCcw, Volume2 } from 'lucide-react';
import { Card, BigBtn, ChoiceButton, MiniBtn, TaskHeader, Result } from './common';
import { playCorrect, playWrong, fireConfetti, shuffle, pick, speakText } from '../lib/audio';
import { isRecentValue, pickExcludingRecent, rememberRecentValue } from '../lib/recentTasks';
import { useTaskImages } from '../lib/taskImages';
import {
    MATCH_NEED_DATA,
    FIND_ODD_DATA,
    SEQUENCE_DATA,
    NAMING_DATA,
    SENTENCE_DATA,
    ASSOC_DATA,
    CATEGORY_SORT_DATA,
    TRUEFALSE_DATA,
    PHRASE_COMPLETION_DATA,
    WRITING_DATA,
    VERB_DATA,
    READING_DATA,
} from '../data/taskData';

const MATCH_REPEAT_KEY = 'cognitive_trainer_recent_match_prompts';
const SEQUENCE_REPEAT_KEY = 'cognitive_trainer_last_sequence_title';

function VisualTile({ visual, imageUrl, compact = false, large = false, hideLabel = false }) {
    const item = visual || { label: '', fallback: '', emoji: '' };
    const fallback = item.emoji || item.fallback || item.label || '';
    const fallbackText = fallback.length <= 4 ? fallback : item.label?.slice(0, 1);
    const imageSize = large
        ? 'h-44 w-full max-w-[220px] md:h-56 md:max-w-[280px]'
        : compact
            ? 'h-14 w-14'
            : 'h-24 w-24 md:h-28 md:w-28';
    const fallbackSize = large
        ? 'text-7xl md:text-8xl'
        : compact
            ? 'text-3xl'
            : 'text-5xl md:text-6xl';

    return (
        <div className={`flex w-full flex-col items-center justify-center gap-2 ${compact ? 'min-w-0' : ''}`}>
            <div className={`${imageSize} flex items-center justify-center overflow-hidden rounded-2xl bg-white/80 shadow-inner`}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={item.label}
                        loading="lazy"
                        className="h-full w-full object-contain"
                    />
                ) : (
                    <span className={`${fallbackSize} font-extrabold text-warm-gray`}>
                        {fallbackText}
                    </span>
                )}
            </div>
            {!hideLabel && (
                <span className={`${compact ? 'text-sm md:text-base' : 'text-xl md:text-2xl'} max-w-full text-center font-extrabold leading-tight text-warm-gray`}>
                    {item.label}
                </span>
            )}
        </div>
    );
}

export function Task1({ onScore, initialData }) {
    const [data] = useState(() => {
        const fallbackItems = MATCH_NEED_DATA.length ? MATCH_NEED_DATA : FIND_ODD_DATA;
        if (initialData?.prompt && Array.isArray(initialData.options) && Array.isArray(initialData.correct)) {
            if (isRecentValue(MATCH_REPEAT_KEY, initialData.prompt, 12)) {
                return pickExcludingRecent(fallbackItems, MATCH_REPEAT_KEY, (item) => item.prompt, 12) || pick(fallbackItems);
            }
            rememberRecentValue(MATCH_REPEAT_KEY, initialData.prompt, 12);
            return initialData;
        }
        if (initialData?.word && Array.isArray(initialData.options) && Array.isArray(initialData.correct)) {
            if (isRecentValue(MATCH_REPEAT_KEY, initialData.word, 12)) {
                return pickExcludingRecent(fallbackItems, MATCH_REPEAT_KEY, (item) => item.prompt, 12) || pick(fallbackItems);
            }
            rememberRecentValue(MATCH_REPEAT_KEY, initialData.word, 12);
            return { prompt: initialData.word, options: initialData.options, correct: initialData.correct, hint: initialData.hint };
        }
        return pickExcludingRecent(fallbackItems, MATCH_REPEAT_KEY, (item) => item.prompt, 12) || pick(fallbackItems);
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
                <div className="mt-3">
                    <MiniBtn onClick={() => speakText(data.prompt)} className="bg-pastel-blue text-warm-gray">
                        <Volume2 className="h-5 w-5" />
                        Почути
                    </MiniBtn>
                </div>
            </div>
            <p className="text-center text-2xl md:text-3xl font-medium text-warm-gray-light mb-6">Потрібно вибрати 2 предмети.</p>
            <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
                {data.options.map((it, i) => {
                    const state = checked
                        ? data.correct.includes(i)
                            ? 'correct'
                            : selectedSet.has(i)
                                ? 'incorrect'
                                : 'muted'
                        : selected.includes(i)
                            ? 'selected'
                            : 'idle';
                    return (
                        <ChoiceButton
                            key={i}
                            onClick={() => handleClick(i)}
                            state={state}
                            className="min-h-[88px] flex items-center justify-center border-3 p-4 md:p-6 text-2xl md:text-3xl font-bold leading-tight hover:scale-[1.03]"
                        >
                            {it}
                        </ChoiceButton>
                    );
                })}
            </div>
            {checked && <Result correct={correct} msg={correct ? 'Чудово! Ви вибрали все потрібне.' : `Потрібно: ${data.correct.map((idx) => data.options[idx]).join(' + ')}`} />}
            {wrong && (
                <div className="flex justify-center mt-6">
                    <MiniBtn
                        onClick={() => {
                            setSelected([]);
                            setChecked(false);
                            setWrong(false);
                        }}
                        className="bg-pastel-beige text-warm-gray hover:bg-pastel-beige-dark"
                    >
                        <RotateCcw className="h-5 w-5" />
                        Спробувати ще раз
                    </MiniBtn>
                </div>
            )}
        </Card>
    );
}

export function Task2({ onScore, initialData }) {
    const [data] = useState(() => {
        if (initialData?.title && Array.isArray(initialData.steps)) {
            if (isRecentValue(SEQUENCE_REPEAT_KEY, initialData.title, 7)) {
                return pickExcludingRecent(SEQUENCE_DATA, SEQUENCE_REPEAT_KEY, (item) => item.title, 7) || pick(SEQUENCE_DATA);
            }
            rememberRecentValue(SEQUENCE_REPEAT_KEY, initialData.title, 7);
            return initialData;
        }
        return pickExcludingRecent(SEQUENCE_DATA, SEQUENCE_REPEAT_KEY, (item) => item.title, 7) || pick(SEQUENCE_DATA);
    });
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
                        <ChoiceButton
                            key={i}
                            onClick={() => !checked && undoFrom(i)}
                            disabled={checked}
                            state={checked ? (s.idx === i ? 'correct' : 'incorrect') : 'selected'}
                            align="left"
                            className="flex w-full items-center gap-3 p-3"
                        >
                            <span className="w-10 h-10 flex items-center justify-center rounded-full bg-pastel-green text-white font-bold text-2xl">{i + 1}</span>
                            <span className="text-2xl font-semibold text-warm-gray">{s.text}</span>
                            {!checked && <span className="ml-auto text-warm-gray-light text-lg">✕</span>}
                        </ChoiceButton>
                    ))}
                </div>
            )}
            <div className="space-y-3 max-w-lg mx-auto">
                {shuffled.map((item, i) => {
                    const used = selected.find((s) => s.idx === item.idx);
                    if (used) return null;
                    return (
                        <ChoiceButton
                            key={i}
                            onClick={() => tapStep(item)}
                            disabled={checked}
                            align="left"
                            className="w-full p-4 md:p-5 text-xl md:text-2xl font-semibold"
                        >
                            {item.text}
                        </ChoiceButton>
                    );
                })}
            </div>
            {checked && <Result correct={correct} msg={correct ? 'Бездоганний порядок!' : 'Правильний порядок: ' + data.steps.join(' → ')} />}
        </Card>
    );
}

export function Task3({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(NAMING_DATA));
    const [answer, setAnswer] = useState('');
    const [hintLevel, setHintLevel] = useState(0);
    const [checked, setChecked] = useState(false);
    const normalize = (value) => String(value || '').trim().toLowerCase().replace(/[’`]/g, "'");
    const correct = normalize(answer) === normalize(data.word);
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
            <TaskHeader icon="🗣️" title="Назвіть предмет" desc="Скажіть слово вголос, потім напишіть його" />
            <div className="max-w-lg mx-auto text-center">
                <div className="text-8xl md:text-9xl mb-4" aria-label={data.word}>{data.emoji}</div>
                <div className="flex flex-wrap justify-center gap-2 mb-5">
                    <MiniBtn onClick={() => speakText(data.word)} className="bg-pastel-blue text-warm-gray">
                        <Volume2 className="h-5 w-5" />
                        Почути слово
                    </MiniBtn>
                    {!checked && hintLevel < 3 && (
                        <MiniBtn onClick={() => setHintLevel((level) => level + 1)} className="bg-pastel-yellow text-warm-gray">
                            <Lightbulb className="h-5 w-5" />
                            {hintLevel === 0 ? 'Підказка' : 'Ще підказка'}
                        </MiniBtn>
                    )}
                </div>
                {hintLevel > 0 && (
                    <div className="mb-5 space-y-2 text-left rounded-2xl bg-yellow-50 p-4 text-xl text-warm-gray">
                        {hintLevel >= 1 && <p><strong>Для чого:</strong> {data.use}</p>}
                        {hintLevel >= 2 && <p><strong>Де буває:</strong> {data.place}</p>}
                        {hintLevel >= 3 && <p><strong>Початок слова:</strong> {data.firstLetter} · складів: {data.syllables}</p>}
                    </div>
                )}
                <label className="block text-xl font-bold text-warm-gray mb-2" htmlFor="naming-answer">Напишіть назву</label>
                <input
                    id="naming-answer"
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={checked}
                    className="w-full p-4 text-3xl rounded-2xl border-2 border-pastel-green focus:outline-none focus:border-green-500 text-center"
                    placeholder="Слово"
                    autoComplete="off"
                />
                {!checked && <div className="mt-4"><BigBtn onClick={check} disabled={!answer.trim()} className="bg-pastel-green text-warm-gray">Перевірити</BigBtn></div>}
                {checked && <Result correct={correct} msg={correct ? 'Так, це правильне слово!' : `Це слово: ${data.word}. Послухайте і повторіть його.`} />}
                {checked && !correct && (
                    <div className="mt-4 flex justify-center gap-2">
                        <MiniBtn onClick={() => speakText(data.word)} className="bg-pastel-blue text-warm-gray"><Volume2 className="h-5 w-5" />Почути</MiniBtn>
                        <MiniBtn onClick={() => { setAnswer(''); setChecked(false); }} className="bg-pastel-beige-dark text-warm-gray"><RotateCcw className="h-5 w-5" />Спробувати ще</MiniBtn>
                    </div>
                )}
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
                                <ChoiceButton key={`b-${i}`} onClick={() => removeWord(w, i)} state="selected" className="px-5 py-3 text-2xl font-bold shadow-md hover:bg-green-200 active:scale-90" style={{ animation: 'snt-word-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
                                    {w}
                                </ChoiceButton>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-3 justify-center">
                            {pool.map((w, i) => (
                                <ChoiceButton key={`p-${i}-${w}`} onClick={() => addWord(w, i)} className="px-5 py-3 text-2xl font-bold shadow-sm hover:shadow-md active:scale-90">
                                    {w}
                                </ChoiceButton>
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
            <TaskHeader icon="🔗" title="Ознаки предмета" desc={data.q} />
            <div className="mb-5 flex justify-center">
                <MiniBtn onClick={() => speakText(data.q)} className="bg-pastel-blue text-warm-gray"><Volume2 className="h-5 w-5" />Почути питання</MiniBtn>
            </div>
            <p className="text-center text-2xl md:text-3xl font-medium text-warm-gray-light mb-8">Оберіть 3 ознаки</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {items.map((it, i) => {
                    const isSel = sel.has(it);
                    const isCorr = data.correct.includes(it);
                    return (
                        <ChoiceButton
                            key={i}
                            onClick={() => toggle(it)}
                            state={checked ? (isCorr ? 'correct' : isSel ? 'incorrect' : 'muted') : isSel ? 'selected' : 'idle'}
                            className="min-h-[112px] p-4 text-xl md:text-2xl font-bold leading-snug"
                        >
                            {it}
                        </ChoiceButton>
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
    const { visualItems, images, loading: imagesLoading } = useTaskImages(6, items);
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
            {imagesLoading && (
                <p className="text-center text-sm md:text-base font-semibold text-warm-gray-light mb-4">Картинки завантажуються у фоні.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto mb-8">
                {data.groupLabels.map((label, groupIdx) => {
                    const assignedEntries = items
                        .map((item, idx) => ({ item, idx }))
                        .filter(({ idx }) => placements[idx] === groupIdx);
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
                        <ChoiceButton
                            key={label}
                            onClick={() => selectedItem !== null && assign(selectedItem, groupIdx)}
                            disabled={checked}
                            align="left"
                            className={`min-h-[140px] rounded-xl border-4 border-dashed p-4 text-left transition-all active:scale-[0.99] md:min-h-[180px] md:p-6 ${basketStyles[groupIdx % basketStyles.length]} ${dropCue?.groupIdx === groupIdx ? 'animate-basket-pop' : ''}`}
                        >
                            <div className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full text-5xl md:text-6xl mb-3 ${iconRing[groupIdx % iconRing.length]}`}>
                                {data.groupIcons?.[groupIdx] || '🧺'}
                            </div>
                            <div className="text-3xl md:text-4xl font-extrabold text-warm-gray mb-2">{label}</div>
                            <div className="text-lg md:text-xl font-semibold text-warm-gray-light">Предметів: {assignedEntries.length}</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {assignedEntries.map(({ idx }) => {
                                    const visual = visualItems[idx];
                                    return (
                                        <span key={`${groupIdx}-${idx}`} className="inline-flex max-w-full items-center gap-2 px-3 py-2 rounded-full bg-white text-warm-gray font-bold text-lg shadow-sm">
                                            {visual && images[visual.cacheKey] && (
                                                <img src={images[visual.cacheKey]} alt="" className="h-12 w-12 rounded-xl object-cover" />
                                            )}
                                            <span className="truncate">{visual?.label || ''}</span>
                                        </span>
                                    );
                                })}
                            </div>
                        </ChoiceButton>
                    );
                })}
            </div>
            <div className="max-w-4xl mx-auto mb-6 text-center">
                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white shadow-sm text-warm-gray font-bold text-xl md:text-2xl">
                    {selectedItem !== null ? `Вибрано: ${visualItems[selectedItem]?.label || items[selectedItem].text}` : 'Виберіть предмет знизу'}
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {items.map((it, i) => {
                    const placed = placements[i] !== undefined;
                    const isCorrectPlace = checked && placements[i] === it.group;
                    const isWrongPlace = checked && placements[i] !== undefined && placements[i] !== it.group;
                    const isSelected = selectedItem === i;
                    const justDropped = dropCue?.itemIdx === i;
                    const visual = visualItems[i];
                    return (
                        <ChoiceButton
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
                            state={checked ? (isCorrectPlace ? 'correct' : isWrongPlace ? 'incorrect' : 'muted') : placed ? 'selected' : isSelected ? 'selectedBlue' : 'idle'}
                            className={`min-h-[230px] p-4 md:min-h-[390px] md:p-6 ${justDropped ? 'animate-basket-pop' : ''}`}
                        >
                            <VisualTile visual={visual} imageUrl={visual ? images[visual.cacheKey] : null} large />
                        </ChoiceButton>
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
            <TaskHeader icon="👂" title="Так чи ні?" desc={`Твердження ${current + 1} з ${statements.length}`} />
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
                        <div className="mb-4 flex justify-center">
                            <MiniBtn onClick={() => speakText(s.text)} className="bg-pastel-blue text-warm-gray">
                                <Volume2 className="h-5 w-5" />
                                Послухати
                            </MiniBtn>
                        </div>
                        <div className={`p-8 rounded-3xl text-center mb-8 transition-colors duration-500 ${answered ? (answers[current]?.correct ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300') : 'bg-pastel-yellow'}`}>
                            <p className="text-4xl font-bold text-warm-gray leading-tight">"{s.text}"</p>
                            {answered && <p className={`mt-3 text-2xl font-bold ${answers[current]?.correct ? 'text-green-600' : 'text-red-500'}`}>{answers[current]?.correct ? '✅ Правильно!' : s.answer ? '❌ Це була правда' : '❌ Це було неправдою'}</p>}
                        </div>
                        {!answered && (
                            <div className="flex gap-4 justify-center">
                                <ChoiceButton onClick={() => handle(true)} className="flex-1 rounded-3xl border-3 border-pastel-green py-8 text-4xl font-extrabold">
                                    ✅ Так
                                </ChoiceButton>
                                <ChoiceButton onClick={() => handle(false)} className="flex-1 rounded-3xl border-3 border-pastel-pink py-8 text-4xl font-extrabold hover:bg-red-50 hover:border-pastel-pink">
                                    ❌ Ні
                                </ChoiceButton>
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
    const [data] = useState(() => initialData || pick(PHRASE_COMPLETION_DATA));
    const [current, setCurrent] = useState(0);
    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState(null);
    const [done, setDone] = useState(false);
    const item = data.items[current];
    const answer = (option) => {
        if (selected !== null || done) return;
        const correct = option === item.answer;
        setSelected(option);
        setResults((values) => [...values, correct]);
        correct ? playCorrect() : playWrong();

        setTimeout(() => {
            if (current < data.items.length - 1) {
                setCurrent((value) => value + 1);
                setSelected(null);
            } else {
                setDone(true);
                if ([...results, correct].every(Boolean)) {
                    fireConfetti();
                    onScore();
                }
            }
        }, 900);
    };
    return (
        <Card>
            <TaskHeader icon="💬" title="Завершіть фразу" desc={`Фраза ${current + 1} з ${data.items.length}`} />
            {!done ? (
                <div className="max-w-xl mx-auto">
                    <div className="mb-5 flex justify-center">
                        <MiniBtn onClick={() => speakText(item.text.replace('...', ''))} className="bg-pastel-blue text-warm-gray">
                            <Volume2 className="h-5 w-5" />
                            Почути фразу
                        </MiniBtn>
                    </div>
                    <p className="mb-7 rounded-2xl bg-pastel-yellow p-6 text-center text-3xl md:text-4xl font-extrabold leading-snug text-warm-gray">{item.text}</p>
                    <div className="space-y-3">
                        {item.options.map((option) => (
                            <ChoiceButton
                                key={option}
                                onClick={() => answer(option)}
                                disabled={selected !== null}
                                state={selected === null ? 'idle' : option === item.answer ? 'correct' : option === selected ? 'incorrect' : 'muted'}
                                className="w-full p-5 text-2xl md:text-3xl font-bold"
                            >
                                {option}
                            </ChoiceButton>
                        ))}
                    </div>
                    {selected !== null && <p className="mt-4 text-center text-xl font-semibold text-warm-gray">Повна фраза: {item.text.replace('...', item.answer)}</p>}
                </div>
            ) : (
                <Result correct={results.every(Boolean)} msg={results.every(Boolean) ? 'Усі фрази завершено самостійно!' : 'Фрази завершено. Підказки та повторення допомагають навчанню.'} />
            )}
        </Card>
    );
}

export function Task9({ onScore, initialData }) {
    const [data] = useState(() => initialData || pick(WRITING_DATA));
    const [current, setCurrent] = useState(0);
    const [phase, setPhase] = useState('copy');
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [done, setDone] = useState(false);
    const item = data.words[current];
    const isCorrect = answer.trim().toUpperCase() === item.word.toUpperCase();
    const submit = () => {
        if (!answer.trim()) return;
        if (!isCorrect) {
            setFeedback('wrong');
            playWrong();
            return;
        }

        playCorrect();
        setFeedback(null);
        setAnswer('');
        if (phase === 'copy') {
            setPhase('recall');
            return;
        }

        if (current < data.words.length - 1) {
            setCurrent((value) => value + 1);
            setPhase('copy');
        } else {
            setDone(true);
            fireConfetti();
            onScore();
        }
    };

    return (
        <Card>
            <TaskHeader icon="✍️" title="Напишіть і згадайте" desc={`Слово ${current + 1} з ${data.words.length}`} />
            {!done ? (
                <div className="max-w-lg mx-auto text-center">
                    <div className="text-8xl mb-3">{item.emoji}</div>
                    <p className="text-xl text-warm-gray-light mb-4">{item.hint}</p>
                    <div className="mb-5 flex justify-center gap-2">
                        <MiniBtn onClick={() => speakText(item.word)} className="bg-pastel-blue text-warm-gray"><Volume2 className="h-5 w-5" />Почути</MiniBtn>
                    </div>
                    <div className="mb-5 rounded-2xl bg-pastel-beige p-5">
                        <p className="text-lg font-bold text-warm-gray-light mb-2">{phase === 'copy' ? '1. Перепишіть слово' : '2. Напишіть слово з пам\'яті'}</p>
                        {phase === 'copy' ? (
                            <p className="text-4xl md:text-5xl font-extrabold text-warm-gray">{item.word}</p>
                        ) : (
                            <p className="flex items-center justify-center gap-2 text-xl font-semibold text-warm-gray-light"><EyeOff className="h-5 w-5" />Слово приховано</p>
                        )}
                    </div>
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => { setAnswer(e.target.value); setFeedback(null); }}
                        className="w-full p-4 text-3xl uppercase rounded-2xl border-2 border-pastel-green focus:outline-none focus:border-green-500 text-center"
                        placeholder="Напишіть слово"
                        autoComplete="off"
                    />
                    <div className="mt-4"><BigBtn onClick={submit} disabled={!answer.trim()} className="bg-pastel-green text-warm-gray"><Check className="h-6 w-6" />Готово</BigBtn></div>
                    {feedback === 'wrong' && (
                        <div className="mt-4 rounded-2xl bg-yellow-50 p-4 text-xl font-semibold text-warm-gray">
                            <p>Подивіться на слово ще раз: <strong>{item.word}</strong></p>
                            <MiniBtn onClick={() => { setAnswer(''); setFeedback(null); }} className="mt-3 bg-pastel-beige-dark text-warm-gray"><RotateCcw className="h-5 w-5" />Спробувати ще</MiniBtn>
                        </div>
                    )}
                </div>
            ) : (
                <Result correct msg="Ви переписали й пригадали всі слова!" />
            )}
        </Card>
    );
}

export function Task10({ onScore, initialData, fallbackData, imageUrl, loading }) {
    const baseDataRef = useRef(initialData || fallbackData || VERB_DATA.find((item) => item.imageUrl) || pick(VERB_DATA));
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

    const activateFallback = () => {
        setImgLoaded(false);
        setImgError(true);
        if (!fallbackData) return;
        setData(fallbackData);
        setOptions(shuffle([...fallbackData.correct, ...fallbackData.wrong]));
        setSel(new Set());
        setChecked(false);
    };

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

    const activeImageUrl = imgError
        ? fallbackData?.imageUrl
        : imageUrl || data.imageUrl || fallbackData?.imageUrl;
    const showImage = Boolean(activeImageUrl);

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
                        <div className="relative aspect-[3/2] w-full max-w-2xl">
                            {!imgLoaded && (
                                <div className="absolute inset-0 rounded-3xl bg-pastel-beige animate-pulse flex items-center justify-center">
                                    <Loader2 className="w-10 h-10 text-pastel-green animate-spin" />
                                </div>
                            )}
                            <img
                                ref={imgRef}
                                src={activeImageUrl}
                                alt={data.title || fallbackData?.title || 'Побутова сцена'}
                                onLoad={() => setImgLoaded(true)}
                                onError={activateFallback}
                                className={`h-full w-full rounded-3xl object-cover shadow-lg transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="mb-4 md:mb-6 p-6 bg-pastel-beige rounded-3xl">
                        <p className="text-7xl mb-3">{data.emoji || '🖼️'}</p>
                        <p className="text-4xl font-bold text-warm-gray">{data.title || 'Побутова сцена'}</p>
                    </div>
                )}
                <p className="text-center text-3xl md:text-4xl font-medium text-warm-gray-light mb-8">Оберіть 3 правильні відповіді</p>
                <div className="space-y-3">
                    {options.map((opt, i) => {
                        const isSel = sel.has(opt);
                        const isCorr = data.correct.includes(opt);
                        return (
                            <ChoiceButton
                                key={i}
                                onClick={() => toggle(opt)}
                                state={checked ? (isCorr ? 'correct' : isSel ? 'incorrect' : 'muted') : isSel ? 'selectedBlue' : 'idle'}
                                align="left"
                                className="w-full p-4 md:p-5 text-xl md:text-2xl font-semibold"
                            >
                                {opt}
                            </ChoiceButton>
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
    const [data] = useState(() => initialData || pick(READING_DATA));
    const [completed, setCompleted] = useState(() => new Set());
    const done = completed.size === data.phrases.length;
    const markRead = (index) => {
        if (completed.has(index)) return;
        const next = new Set(completed);
        next.add(index);
        setCompleted(next);
        if (next.size === data.phrases.length) {
            playCorrect();
            fireConfetti();
            onScore();
        }
    };

    return (
        <Card>
            <TaskHeader icon="📖" title="Читайте вголос" desc="Слухайте, повторюйте і говоріть у своєму темпі" />
            <div className="max-w-xl mx-auto space-y-4">
                {data.phrases.map((phrase, index) => {
                    const isDone = completed.has(index);
                    return (
                        <div key={`${phrase.context}-${index}`} className={`rounded-2xl border-2 p-5 ${isDone ? 'border-green-300 bg-green-50' : 'border-pastel-beige-dark bg-white'}`}>
                            <p className="mb-2 text-base font-bold uppercase text-warm-gray-light">{phrase.context}</p>
                            <p className="mb-4 text-3xl md:text-4xl font-extrabold leading-snug text-warm-gray">{phrase.text}</p>
                            <div className="flex flex-wrap gap-2">
                                <MiniBtn onClick={() => speakText(phrase.text)} className="bg-pastel-blue text-warm-gray">
                                    <Volume2 className="h-5 w-5" />
                                    Послухати
                                </MiniBtn>
                                <MiniBtn onClick={() => markRead(index)} disabled={isDone} className="bg-pastel-green text-warm-gray">
                                    <Check className="h-5 w-5" />
                                    {isDone ? 'Прочитано' : 'Я прочитала'}
                                </MiniBtn>
                            </div>
                        </div>
                    );
                })}
                {done && <Result correct msg="Чудово! Ви прочитали всі корисні фрази." />}
            </div>
        </Card>
    );
}
