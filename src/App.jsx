import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Brain, Star, RefreshCw, Loader2, Heart, Sparkles, Volume2 } from 'lucide-react';
import { Card, BigBtn } from './components/common';
import { generateAllTasks } from './lib/generate';
import { playVictory, fireConfetti, pick } from './lib/audio';
import { TOTAL_TASKS, SLIDES, VERB_DATA } from './data/taskData';
import { Task1, Task2, Task3, Task4, Task5, Task6, Task7, Task8, Task9, Task10, Task11 } from './components/tasks';

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
    const [verbScene, setVerbScene] = useState(null);
    const [verbLoading, setVerbLoading] = useState(false);
    const addScore = useCallback(() => setScore((s) => s + 1), []);
    const next = () => setSlide((s) => Math.min(s + 1, SLIDES - 1));
    const prev = () => setSlide((s) => Math.max(s - 1, 0));
    const restart = () => {
        setSlide(0);
        setScore(0);
        setAiData(null);
        setGenError(false);
        setRateLimitError(false);
        setStarted(false);
        setVerbImage(null);
        setVerbQuestions(null);
        setVerbScene(null);
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
            if (url) setVerbImage(url);
            if (questions) setVerbQuestions(questions);
            return Boolean(url);
        } catch {
            // Silently fail; Task10 falls back to the emoji version.
            return false;
        }
    };

    const startSession = async () => {
        setGenerating(true);
        setGenError(false);
        setRateLimitError(false);
        setVerbImage(null);
        setVerbQuestions(null);
        setVerbScene(null);
        setVerbLoading(false);
        const data = await generateAllTasks();
        setGenerating(false);
        if (data && data._rateLimited) {
            setRateLimitError(true);
            setAiData(null);
        } else if (data) {
            setAiData(data);
            const scene = typeof data.verbs?.scene === 'string' && data.verbs.scene.trim().length >= 24
                ? data.verbs.scene
                : pick(VERB_DATA).scene;
            setVerbLoading(true);
            setVerbScene(scene);
            (async () => {
                try {
                    const ok = await generateImage(scene);
                    if (!ok) {
                        const fallback = pick(VERB_DATA).scene;
                        setVerbScene(fallback);
                        await generateImage(fallback);
                    }
                } finally {
                    setVerbLoading(false);
                }
            })();
        } else {
            setGenError(true);
            const fallback = pick(VERB_DATA).scene;
            setVerbLoading(true);
            setVerbScene(fallback);
            (async () => {
                try {
                    await generateImage(fallback);
                } finally {
                    setVerbLoading(false);
                }
            })();
        }
        setStarted(true);
        next();
    };

    useEffect(() => {
        if (slide === SLIDES - 1) {
            playVictory();
            fireConfetti();
            setTimeout(fireConfetti, 800);
        }
    }, [slide]);

    const tasks = [
        <Task1 key={taskKeys[0]} onScore={addScore} initialData={aiData?.matchWord} />,
        <Task2 key={taskKeys[1]} onScore={addScore} initialData={aiData?.sequence} />,
        <Task8 key={taskKeys[7]} onScore={addScore} initialData={aiData?.antonyms} />,
        <Task3 key={taskKeys[2]} onScore={addScore} initialData={aiData?.budget} />,
        <Task4 key={taskKeys[3]} onScore={addScore} initialData={aiData?.sentence} />,
        <Task5 key={taskKeys[4]} onScore={addScore} initialData={aiData?.associations} />,
        <Task6 key={taskKeys[5]} onScore={addScore} initialData={aiData?.categories} />,
        <Task9 key={taskKeys[8]} onScore={addScore} initialData={aiData?.vowels} />,
        <Task7 key={taskKeys[6]} onScore={addScore} initialData={aiData?.trueFalse} />,
        <Task10 key={taskKeys[9]} onScore={addScore} initialData={verbQuestions?.correct ? verbQuestions : null} imageUrl={verbImage} scenePrompt={verbScene} loading={verbLoading} />,
        <Task11 key={taskKeys[10]} onScore={addScore} initialData={aiData?.whatChanged} />,
    ];

    return (
        <div className="min-h-screen bg-pastel-beige flex flex-col relative">
            {rateLimitError && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-3 text-center text-sm md:text-base font-bold shadow-md z-50">
                    ⚠️ Штучний інтелект перевантажено (забагато запитів). Увімкнено базові завдання. Спробуйте пізніше для нових завдань.
                </div>
            )}

            <header className="bg-white/70 backdrop-blur-md shadow-sm py-4 px-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Brain className="w-8 h-8 text-pastel-green" />
                    <h1 className="text-xl md:text-2xl font-extrabold text-warm-gray">Тренажер Пам'яті</h1>
                </div>
                {slide > 0 && slide < SLIDES - 1 && (
                    <div className="flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-500" />
                        <span className="text-lg font-bold text-warm-gray">{score}/{TOTAL_TASKS}</span>
                    </div>
                )}
                {slide > 0 && slide < SLIDES - 1 && (
                    <div className="flex items-center gap-1 text-sm font-semibold text-warm-gray-light">
                        {aiData && <Sparkles className="w-4 h-4 text-pastel-green" />}
                        {slide} / {TOTAL_TASKS}
                    </div>
                )}
            </header>

            <main className="flex-1 flex items-start justify-center p-4 md:p-8 overflow-y-auto mt-2">
                <div className="w-full max-w-2xl">
                    {slide === 0 && (
                        <Card className="text-center py-12">
                            <div className="text-7xl mb-6">🧠</div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-warm-gray mb-4">Вітаємо!</h1>
                            <p className="text-xl text-warm-gray-light mb-2">Цей тренажер допоможе вам тренувати пам'ять та увагу.</p>
                            <p className="text-lg text-warm-gray-light mb-8">11 цікавих завдань чекають на вас. Не поспішайте і отримуйте задоволення!</p>
                            {generating ? (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-14 h-14 text-pastel-green animate-spin" />
                                    <p className="text-xl font-bold text-warm-gray animate-pulse">✨ Створюємо нові завдання...</p>
                                    <p className="text-sm text-warm-gray-light">Зазвичай це займає 5-10 секунд</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <BigBtn onClick={startSession} className="bg-pastel-green text-warm-gray text-2xl">
                                        <Sparkles className="inline w-6 h-6 mr-2" />
                                        Розпочати
                                    </BigBtn>
                                    <p className="text-sm text-warm-gray-light flex items-center gap-1">
                                        <Sparkles className="w-4 h-4 text-pastel-green" />
                                        AI генерує унікальні завдання щоразу
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
                            <div className="text-7xl mb-4">🏆</div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-warm-gray mb-4">Вітаємо з завершенням!</h1>
                            <div className="text-6xl font-extrabold text-pastel-green mb-2">{score} / {TOTAL_TASKS}</div>
                            <p className="text-xl text-warm-gray-light mb-2">
                                {score >= 8
                                    ? 'Чудовий результат! Ваша пам\'ять у відмінній формі! 🌟'
                                    : score >= 5
                                        ? 'Гарний результат! Продовжуйте тренуватися! 💪'
                                        : 'Не засмучуйтесь! Кожне тренування робить вашу пам\'ять кращою! ❤️'}
                            </p>
                            <div className="flex items-center justify-center gap-1 my-4">
                                {Array.from({ length: TOTAL_TASKS }).map((_, i) => (
                                    <Heart key={i} className={`w-7 h-7 ${i < score ? 'text-red-400 fill-red-400' : 'text-gray-300'}`} />
                                ))}
                            </div>
                            <BigBtn onClick={restart} className="bg-pastel-green text-warm-gray text-xl mt-4">
                                <RefreshCw className="inline w-5 h-5 mr-2" />
                                Пройти ще раз
                            </BigBtn>
                        </Card>
                    )}
                </div>
            </main>

            {(slide > 0 || started) && (
                <nav className="bg-white/80 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.05)] py-4 px-6 flex justify-between items-center sticky bottom-0 z-10">
                    <BigBtn onClick={prev} className="bg-pastel-beige-dark text-warm-gray" disabled={slide === 0}>
                        <ChevronLeft className="inline w-5 h-5 mr-1" />
                        Назад
                    </BigBtn>
                    <div className="flex gap-1">
                        {Array.from({ length: SLIDES }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${i === slide ? 'bg-pastel-green scale-125' : i < slide ? 'bg-pastel-green/50' : 'bg-gray-300'}`}
                            />
                        ))}
                    </div>
                    <BigBtn onClick={next} className="bg-pastel-green text-warm-gray" disabled={slide === SLIDES - 1}>
                        Вперед
                        <ChevronRight className="inline w-5 h-5 ml-1" />
                    </BigBtn>
                </nav>
            )}
        </div>
    );
}
