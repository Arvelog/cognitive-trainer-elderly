import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Brain, Star, RefreshCw, Loader2, Heart, Sparkles, Volume2 } from 'lucide-react';
import { Card, BigBtn } from './components/common';
import { generateAllTasks } from './lib/generate';
import { playVictory, fireConfetti, pick } from './lib/audio';
import { TOTAL_TASKS, SLIDES, VERB_DATA } from './data/taskData';
import { Task1, Task2, Task3, Task4, Task5, Task6, Task7, Task8, Task9, Task10, Task11 } from './components/tasks';

const hasThreeUniqueStrings = (value) =>
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === 'string' && item.trim()) &&
    new Set(value.map((item) => item.trim().toLowerCase())).size === 3;

const isValidVerbQuestions = (questions) => {
    if (!questions || !hasThreeUniqueStrings(questions.correct) || !hasThreeUniqueStrings(questions.wrong)) {
        return false;
    }

    const correct = new Set(questions.correct.map((item) => item.trim().toLowerCase()));
    return questions.wrong.every((item) => !correct.has(item.trim().toLowerCase()));
};

const VERB_FALLBACK = VERB_DATA.find((item) => item.imageUrl) || VERB_DATA[0];

export default function App() {
    const [slide, setSlide] = useState(0);
    const [scoredTasks, setScoredTasks] = useState(() => new Set());
    const [taskKeys, setTaskKeys] = useState(() => Array.from({ length: TOTAL_TASKS }, () => Math.random()));
    const [aiData, setAiData] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [rateLimitError, setRateLimitError] = useState(false);
    const [generationSource, setGenerationSource] = useState('idle');
    const [fallbackBlocks, setFallbackBlocks] = useState([]);
    const [localAnswerBlocks, setLocalAnswerBlocks] = useState([]);
    const [started, setStarted] = useState(false);
    const [verbImage, setVerbImage] = useState(null);
    const [verbQuestions, setVerbQuestions] = useState(null);
    const [verbFallbackData, setVerbFallbackData] = useState(null);
    const [verbLoading, setVerbLoading] = useState(false);
    const score = scoredTasks.size;
    const addScore = useCallback((taskIndex) => {
        setScoredTasks((current) => {
            if (current.has(taskIndex)) return current;
            const next = new Set(current);
            next.add(taskIndex);
            return next;
        });
    }, []);
    const next = () => setSlide((s) => Math.min(s + 1, SLIDES - 1));
    const prev = () => setSlide((s) => Math.max(s - 1, 0));
    const restart = () => {
        setSlide(0);
        setScoredTasks(new Set());
        setAiData(null);
        setRateLimitError(false);
        setGenerationSource('idle');
        setFallbackBlocks([]);
        setLocalAnswerBlocks([]);
        setStarted(false);
        setVerbImage(null);
        setVerbQuestions(null);
        setVerbFallbackData(null);
        setVerbLoading(false);
        setTaskKeys(Array.from({ length: TOTAL_TASKS }, () => Math.random()));
    };

    const generateImage = async (scene) => {
        try {
            const res = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: scene }),
            });
            if (!res.ok) return false;
            const { url, questions } = await res.json();
            if (!url || !isValidVerbQuestions(questions)) return false;

            setVerbImage(url);
            setVerbQuestions(questions);
            return true;
        } catch {
            // Task10 keeps a bundled scene available when image generation fails.
            return false;
        }
    };

    const prepareVerbTask = async (scene) => {
        setVerbLoading(true);
        setVerbFallbackData(VERB_FALLBACK);

        try {
            let ok = await generateImage(scene);
            if (ok) return;

            const fallback = VERB_FALLBACK;
            ok = await generateImage(fallback.scene);

            if (!ok) {
                setVerbImage(null);
                setVerbQuestions(null);
                setVerbFallbackData(fallback);
            }
        } finally {
            setVerbLoading(false);
        }
    };

    const startSession = async () => {
        setGenerating(true);
        setRateLimitError(false);
        setGenerationSource('loading');
        setFallbackBlocks([]);
        setLocalAnswerBlocks([]);
        setVerbImage(null);
        setVerbQuestions(null);
        setVerbFallbackData(null);
        setVerbLoading(false);
        const data = await generateAllTasks();
        setGenerating(false);
        if (data && data._rateLimited) {
            setRateLimitError(true);
            setGenerationSource('rate-limited');
            setFallbackBlocks(['all']);
            setLocalAnswerBlocks([]);
            setAiData(null);
        } else if (data) {
            setGenerationSource(data._source || 'ai');
            setFallbackBlocks(data._fallbackBlocks || []);
            setLocalAnswerBlocks(data._localAnswerBlocks || []);
            setAiData(data);
            const scene = typeof data.verbs?.scene === 'string' && data.verbs.scene.trim().length >= 24
                ? data.verbs.scene
                : pick(VERB_DATA).scene;
            prepareVerbTask(scene);
        } else {
            setGenerationSource('fallback');
            setFallbackBlocks(['all']);
            setLocalAnswerBlocks([]);
            prepareVerbTask(VERB_FALLBACK.scene);
        }
        setStarted(true);
        next();
    };

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        document.querySelector('main')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [slide]);

    useEffect(() => {
        if (slide === SLIDES - 1) {
            playVictory();
            fireConfetti();
            setTimeout(fireConfetti, 800);
        }
    }, [slide]);

    const sourceLabel = {
        ai: localAnswerBlocks.length ? 'AI + перевірені відповіді' : 'AI завдання',
        mixed: 'AI + базові блоки',
        fallback: 'Базові завдання',
        'rate-limited': 'Базові завдання',
        loading: 'Створюємо',
    }[generationSource];
    const sourceTitle = [
        fallbackBlocks.length ? `Fallback: ${fallbackBlocks.join(', ')}` : '',
        localAnswerBlocks.length ? `Локальні відповіді: ${localAnswerBlocks.join(', ')}` : '',
    ].filter(Boolean).join(' | ');

    const tasks = [
        <Task1 key={taskKeys[0]} onScore={() => addScore(0)} initialData={aiData?.matchWord} />,
        <Task2 key={taskKeys[1]} onScore={() => addScore(1)} initialData={aiData?.sequence} />,
        <Task3 key={taskKeys[2]} onScore={() => addScore(2)} initialData={aiData?.naming} />,
        <Task4 key={taskKeys[3]} onScore={() => addScore(3)} initialData={aiData?.sentence} />,
        <Task5 key={taskKeys[4]} onScore={() => addScore(4)} initialData={aiData?.associations} />,
        <Task6 key={taskKeys[5]} onScore={() => addScore(5)} initialData={aiData?.categories} />,
        <Task7 key={taskKeys[6]} onScore={() => addScore(6)} initialData={aiData?.trueFalse} />,
        <Task8 key={taskKeys[7]} onScore={() => addScore(7)} initialData={aiData?.phraseCompletion} />,
        <Task9 key={taskKeys[8]} onScore={() => addScore(8)} initialData={aiData?.writing} />,
        <Task10 key={taskKeys[9]} onScore={() => addScore(9)} initialData={verbQuestions || verbFallbackData} fallbackData={verbFallbackData || VERB_FALLBACK} imageUrl={verbImage} loading={verbLoading} />,
        <Task11 key={taskKeys[10]} onScore={() => addScore(10)} initialData={aiData?.reading} />,
    ];

    return (
        <div className="min-h-screen bg-pastel-beige flex flex-col relative">
            {rateLimitError && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-3 text-center text-sm md:text-base font-bold shadow-md z-50">
                    ⚠️ Штучний інтелект перевантажено (забагато запитів). Увімкнено базові завдання. Спробуйте пізніше для нових завдань.
                </div>
            )}

            <header className="bg-white/70 backdrop-blur-md shadow-sm py-3 px-3 md:py-4 md:px-6 flex items-center justify-between gap-2 sticky top-0 z-10">
                <div className="flex min-w-0 items-center gap-2 md:gap-3">
                    <Brain className="h-7 w-7 shrink-0 text-pastel-green md:h-8 md:w-8" />
                    <h1 className="truncate text-base md:text-2xl font-extrabold text-warm-gray">Мовлення щодня</h1>
                </div>
                {slide > 0 && slide < SLIDES - 1 && (
                    <div className="flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-500" />
                        <span className="text-sm md:text-lg font-bold text-warm-gray">Самостійно {score}</span>
                    </div>
                )}
                {slide > 0 && slide < SLIDES - 1 && (
                    <div className="flex flex-col items-end gap-1 text-sm font-semibold text-warm-gray-light">
                        <div className="flex items-center gap-1">
                            {generationSource !== 'fallback' && generationSource !== 'rate-limited' && <Sparkles className="w-4 h-4 text-pastel-green" />}
                            {slide} / {TOTAL_TASKS}
                        </div>
                        {sourceLabel && (
                            <span title={sourceTitle} className="hidden text-xs text-warm-gray-light md:block md:text-sm">
                                {sourceLabel}
                            </span>
                        )}
                    </div>
                )}
            </header>

            <main className="flex-1 flex items-start justify-center p-3 pb-28 md:p-8 md:pb-10 overflow-y-auto mt-2">
                <div className="w-full max-w-5xl">
                    {slide === 0 && (
                        <Card className="text-center py-12">
                            <div className="text-7xl mb-6">🗣️</div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-warm-gray mb-4">Час для мовлення</h1>
                            <p className="text-xl text-warm-gray-light mb-2">Короткі вправи на слова, фрази, читання та письмо.</p>
                            <p className="text-lg text-warm-gray-light mb-4">Працюйте у своєму темпі. Підказки можна і треба використовувати.</p>
                            <p className="text-sm text-warm-gray-light mb-8">Домашня практика доповнює, але не замінює заняття з логопедом.</p>
                            {generating ? (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-14 h-14 text-pastel-green animate-spin" />
                                    <p className="text-xl font-bold text-warm-gray animate-pulse">✨ Створюємо нові завдання...</p>
                                    <p className="text-sm text-warm-gray-light">Зазвичай це займає 5-10 секунд</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <BigBtn onClick={startSession} className="bg-pastel-green text-warm-gray text-2xl">
                                        <Sparkles className="w-6 h-6" />
                                        Розпочати
                                    </BigBtn>
                                    <p className="text-sm text-warm-gray-light flex items-center gap-1">
                                        <Sparkles className="w-4 h-4 text-pastel-green" />
                                        Щоразу з'являються нові знайомі слова й фрази
                                    </p>
                                    <div className="flex items-center gap-2 text-warm-gray-light">
                                        <Volume2 className="w-5 h-5" />
                                        <span className="text-sm">Увімкніть звук для кращого досвіду</span>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    {slide > 0 && slide < SLIDES - 1 && tasks[slide - 1]}

                    {slide === SLIDES - 1 && (
                        <Card className="text-center py-12">
                            <div className="text-7xl mb-4">🌷</div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-warm-gray mb-4">Заняття завершено!</h1>
                            <div className="text-3xl md:text-4xl font-extrabold text-pastel-green mb-2">Самостійно: {score} із {TOTAL_TASKS}</div>
                            <p className="text-xl text-warm-gray-light mb-2">
                                {score >= 8
                                    ? 'Сьогодні багато вийшло самостійно. Чудова робота!'
                                    : score >= 5
                                        ? 'Гарна робота. Підказки допомагають мозку вчитися.'
                                        : 'Ви завершили все заняття — це вже важливий крок. Підказки можна використовувати.'}
                            </p>
                            <div className="flex items-center justify-center gap-1 my-4">
                                {Array.from({ length: TOTAL_TASKS }).map((_, i) => (
                                    <Heart key={i} className={`w-7 h-7 ${i < score ? 'text-red-400 fill-red-400' : 'text-gray-300'}`} />
                                ))}
                            </div>
                            <BigBtn onClick={restart} className="bg-pastel-green text-warm-gray text-xl mt-4">
                                <RefreshCw className="w-5 h-5" />
                                Пройти ще раз
                            </BigBtn>
                        </Card>
                    )}
                </div>
            </main>

            {(slide > 0 || started) && (
                <nav className="bg-white/80 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.05)] py-3 px-3 md:py-4 md:px-6 flex justify-between items-center gap-2 sticky bottom-0 z-10">
                    <BigBtn onClick={prev} className="bg-pastel-beige-dark px-3 text-base text-warm-gray md:px-8 md:text-xl" disabled={slide === 0}>
                        <ChevronLeft className="w-5 h-5" />
                        Назад
                    </BigBtn>
                    <div className="hidden gap-1 md:flex">
                        {Array.from({ length: SLIDES }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${i === slide ? 'bg-pastel-green scale-125' : i < slide ? 'bg-pastel-green/50' : 'bg-gray-300'}`}
                            />
                        ))}
                    </div>
                    <BigBtn onClick={next} className="bg-pastel-green px-3 text-base text-warm-gray md:px-8 md:text-xl" disabled={slide === SLIDES - 1}>
                        Вперед
                        <ChevronRight className="w-5 h-5" />
                    </BigBtn>
                </nav>
            )}
        </div>
    );
}
