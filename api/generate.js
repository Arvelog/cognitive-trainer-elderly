export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const envKey = process.env.OPENAI_API_KEY;

    if (!envKey) {
        return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), { status: 500 });
    }

    const GENERATION_PROMPT = `Ти генеруєш дані для когнітивного тренажера для літніх людей (українською мовою).
Створі ОДИН JSON-об'єкт із 10 полями — по одному набору даних для кожного завдання.
Все має бути про побутові, знайомі літнім людям теми: кулінарія, город, побут, тварини, здоров'я, природа.

Точна структура (додержуйся типів!):
{
  "findOdd": { "cat": "назва категорії", "items": ["emoji предмет1", "emoji предмет2", "emoji предмет3", "emoji НЕвідповідний"], "odd": 3 },
  "sequence": { "title": "назва процесу", "steps": ["крок1", "крок2", "крок3", "крок4"] },
  "budget": { "wallet": 1200, "label": "назва", "items": [{"n":"товар","p":150},{"n":"товар2","p":200},{"n":"товар3","p":100},{"n":"товар4","p":80}] },
  "sentence": { "svg": "<svg viewBox=\\"0 0 512 512\\" xmlns=\\"http://www.w3.org/2000/svg\\">...beautiful clean scalable vector graphic code illustrating the sentence. Use pastel colors. NO markdown. Escape quotes if needed...</svg>", "sentence": "Просте речення з 4-6 слів" },
  "associations": { "q": "Питання?", "correct": ["emoji правильний1", "emoji правильний2", "emoji правильний3"], "wrong": ["emoji неправильний1", "emoji неправильний2", "emoji неправильний3"] },
  "categories": { "q": "Що належить до ...?", "correct": ["emoji вірний1", "emoji вірний2", "emoji вірний3"], "wrong": ["emoji невірний1", "emoji невірний2", "emoji невірний3"] },
  "trueFalse": { "text": "Твердження про світ", "answer": true },
  "antonyms": { "sentences": [{"s": "Речення з пропуском (замість антоніма пиши ...)", "a": "антонім"}, {"s": "Ще речення...", "a": "антонім"}, {"s": "І ще...", "a": "антонім"}, {"s": "Четверте...", "a": "антонім"}] },
  "vowels": { "words": [{"full": "СЛОВО", "hint": "Підказка"}, {"full": "ДРУГЕ", "hint": "Підказка"}, {"full": "ТРЕТЄ", "hint": "Підказка"}] },
  "verbs": { "obj": "emoji Хто/Що", "correct": ["Правильне1", "Правильне2", "Правильне3"], "wrong": ["Невірно1", "Невірно2", "Невірно3"], "context": "Що може робити...?" }
}

ВАЖЛИВО:
- МОВА: ВИКЛЮЧНО УКРАЇНСЬКА! НЕ використовуй російські слова! Наприклад: "прогулянка" (НЕ "прогулка"), "городина" (НЕ "овощі"), "кошик" (НЕ "корзина"), "ліжко" (НЕ "кровать"), "праска" (НЕ "утюг"), "холодильник", "каструля". Перевіряй кожне слово — воно має бути саме українською мовою, а не русизмом.
- Для "vowels": слова мають бути ПРАВИЛЬНИМИ УКРАЇНСЬКИМИ словами. Голосні літери в українській мові: А, Е, И, І, Ї, О, У, Ю, Я, Є. Перевір, що після видалення голосних маска збігається зі словом.
- Кожного разу генеруй НОВІ унікальні дані, не повторюй приклади
- Використовуй emoji де вказано
- "findOdd.items" — ПОВИННО БУТИ РІВНО 4 ЕЛЕМЕНТИ (масив з 4 рядків)
- "odd" — це індекс зайвого (0-3), зайвий завжди має бути з іншої категорії
- "steps" в sequence — в ПРАВИЛЬНОМУ порядку
- "wallet" — сума в гаманці (має бути більша за суму items)
- "vowels.words[].full" — ВЕЛИКИМИ ЛІТЕРАМИ
- Уникай ейджизму, сумних тем, стереотипів про старість чи хвороби. Завдання мають бути життєрадісними та поважними до літніх людей.
- Для "antonyms" речення ПОВИННІ мати життєвий та логічний сенс (наприклад: "Чай гарячий, а лід... [холодний]"). КАТЕГОРИЧНО НЕ генеруй абсурдні твердження або негативні стереотипи (НЕ пиши, що літні люди "стомлені", "повільні" чи "хворі"). Тільки позитивні або нейтральні факти.
- Відповідай ТІЛЬКИ JSON, без markdown, без коментарів

УВАГА: Це новий користувацький запит. Згенеруй АБСОЛЮТНО НОВІ варіанти, не використовуй ті ж самі слова, що і минулого разу.
Використай цей випадковий seed для унікальності: ${Math.random().toString(36).substring(2, 10)} - ${Date.now()}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${envKey}`
            },
            body: JSON.stringify({
                model: 'gpt-5.4-mini',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that only outputs strictly valid JSON. You MUST write ONLY in Ukrainian language (українська мова). NEVER use Russian words. For example: use "прогулянка" NOT "прогулка", "кошик" NOT "корзина", "праска" NOT "утюг", "городина" NOT "овощі". Every single word must be correct Ukrainian.' },
                    { role: 'user', content: GENERATION_PROMPT }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenAI API error (Status ${response.status}):`, errorText);

            if (response.status === 429) {
                return new Response(JSON.stringify({ error: '429' }), { status: 429 });
            }

            return new Response(JSON.stringify({ error: `OpenAI API fail: ${response.status}`, details: errorText }), { status: response.status });
        }

        const data = await response.json();

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            console.error('Unexpected OpenAI response format:', JSON.stringify(data));
            return new Response(JSON.stringify({ error: 'Unexpected AI Response format' }), { status: 500 });
        }

        const cleanJsonStr = content.replace(/^```json/g, '').replace(/```$/g, '').trim();

        return new Response(cleanJsonStr, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('Edge function error:', e);
        return new Response(JSON.stringify({ error: 'OpenAI request failed', details: e.message }), { status: 500 });
    }
}
