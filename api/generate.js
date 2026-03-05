export const config = {
    runtime: 'edge', // Using Edge runtime since it's faster and well-suited for fetch calls
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!DEEPSEEK_API_KEY) {
        return new Response(JSON.stringify({ error: 'Missing DEEPSEEK_API_KEY' }), { status: 500 });
    }

    const GENERATION_PROMPT = `Ти генеруєш дані для когнітивного тренажера для літніх людей (українською мовою).
Створі ОДИН JSON-об'єкт із 10 полями — по одному набору даних для кожного завдання.
Все має бути про побутові, знайомі літнім людям теми: кулінарія, город, побут, тварини, здоров'я, природа.

Точна структура (додержуйся типів!):
{
  "findOdd": { "cat": "назва категорії", "items": ["emoji предмет1", "emoji предмет2", "emoji предмет3", "emoji НЕвідповідний"], "odd": 3 },
  "sequence": { "title": "назва процесу", "steps": ["крок1", "крок2", "крок3", "крок4"] },
  "budget": { "wallet": 1200, "label": "назва", "items": [{"n":"товар","p":150},{"n":"товар2","p":200},{"n":"товар3","p":100},{"n":"товар4","p":80}] },
  "sentence": { "img": "SINGLE english noun for image (e.g. dog, nature, food)", "sentence": "Просте речення з 4-6 слів" },
  "associations": { "q": "Питання?", "correct": ["emoji правильний1", "emoji правильний2", "emoji правильний3"], "wrong": ["emoji неправильний1", "emoji неправильний2", "emoji неправильний3"] },
  "categories": { "q": "Що належить до ...?", "correct": ["emoji вірний1", "emoji вірний2", "emoji вірний3"], "wrong": ["emoji невірний1", "emoji невірний2", "emoji невірний3"] },
  "trueFalse": { "text": "Твердження про світ", "answer": true },
  "antonyms": { "sentences": [{"s": "Речення з антонімом...", "a": "антонім"}, {"s": "Ще речення...", "a": "антонім"}, {"s": "І ще...", "a": "антонім"}, {"s": "Четверте...", "a": "антонім"}] },
  "vowels": { "words": [{"full": "СЛОВО", "hint": "Підказка"}, {"full": "ДРУГЕ", "hint": "Підказка"}, {"full": "ТРЕТЄ", "hint": "Підказка"}] },
  "verbs": { "obj": "emoji Предмет", "correct": "Дієслово", "wrong": ["НеправильнеДієслово1", "НеправильнеДієслово2"], "context": "Контекстне питання?" }
}

ВАЖЛИВО:
- Кожного разу генеруй НОВІ унікальні дані, не повторюй приклади
- Використовуй emoji де вказано
- "odd" — це індекс зайвого (0-3), зайвий завжди має бути з іншої категорії
- "steps" в sequence — в ПРАВИЛЬНОМУ порядку
- "wallet" — сума в гаманці (має бути більша за суму items)
- "vowels.words[].full" — ВЕЛИКИМИ ЛІТЕРАМИ
- Відповідай ТІЛЬКИ JSON, без markdown, без коментарів

УВАГА: Це новий користувацький запит. Згенеруй АБСОЛЮТНО НОВІ варіанти, не використовуй ті ж самі слова, що і минулого разу.
Використай цей випадковий seed для унікальності: ${Math.random().toString(36).substring(2, 10)} - ${Date.now()}`;

    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that only outputs strictly valid JSON.' },
                    { role: 'user', content: GENERATION_PROMPT }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('DeepSeek API error:', errText);
            return new Response(JSON.stringify({ error: `DeepSeek API status: ${response.status}` }), { status: response.status });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Deepseek might return markdown backticks even with json_object format, standard safety parsing:
        const cleanJsonStr = content.replace(/^```json/g, '').replace(/```$/g, '').trim();

        return new Response(cleanJsonStr, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('Edge function error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
