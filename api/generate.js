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
Створі ОДИН JSON-об'єкт із 11 полями — по одному набору даних для кожного завдання.
Все має бути про побутові, знайомі літнім людям теми: кулінарія, город, побут, тварини, здоров'я, природа.

Точна структура (додержуйся типів!):
{
  "findOdd": { "cat": "назва категорії", "items": ["emoji предмет1", "emoji предмет2", "emoji предмет3", "emoji НЕвідповідний"], "odd": 3 },
  "sequence": { "title": "назва процесу", "steps": ["крок1", "крок2", "крок3", "крок4"] },
  "budget": { "wallet": 1200, "label": "назва", "items": [{"n":"товар","p":150},{"n":"товар2","p":80,"qty":2},{"n":"товар3","p":100},{"n":"товар4","p":45,"qty":3}] },
  "sentence": { "sentences": ["Речення 1 мінімум 5-7 слів", "Речення 2 мінімум 5-7 слів", "Речення 3 мінімум 5-7 слів"] },
  "associations": { "q": "Питання?", "correct": ["emoji правильний1", "emoji правильний2", "emoji правильний3"], "wrong": ["emoji неправильний1", "emoji неправильний2", "emoji неправильний3"] },
  "categories": { "q": "Що належить до ...?", "correct": ["emoji вірний1", "emoji вірний2", "emoji вірний3"], "wrong": ["emoji невірний1", "emoji невірний2", "emoji невірний3"] },
  "trueFalse": { "statements": [{"text": "Твердження 1", "answer": true}, {"text": "Твердження 2", "answer": false}, {"text": "Твердження 3", "answer": true}] },
  "antonyms": { "sentences": [{"s": "Речення з пропуском (замість антоніма пиши ...)", "a": "антонім"}, {"s": "Ще речення...", "a": "антонім"}, {"s": "І ще...", "a": "антонім"}, {"s": "Четверте...", "a": "антонім"}] },
  "vowels": { "words": [{"full": "СЛОВО", "hint": "Підказка"}, {"full": "ДРУГЕ", "hint": "Підказка"}, {"full": "ТРЕТЄ", "hint": "Підказка"}] },
  "verbs": { "scene": "Short English description of a cozy everyday scene for image generation, e.g. A grandmother watering tomatoes in a sunny garden with a cat nearby" },
  "whatChanged": { "items": ["emoji1","emoji2","emoji3","emoji4","emoji5","emoji6"], "changes": [{"idx":1,"to":"новий_emoji"},{"idx":4,"to":"новий_emoji"}] }
}

ВАЖЛИВО:
- МОВА: ВИКЛЮЧНО УКРАЇНСЬКА! НЕ використовуй російські слова! Наприклад: "прогулянка" (НЕ "прогулка"), "городина" (НЕ "овощі"), "кошик" (НЕ "корзина"), "ліжко" (НЕ "кровать"), "праска" (НЕ "утюг"), "холодильник", "каструля". Перевіряй кожне слово — воно має бути саме українською мовою, а не русизмом.
- Для "vowels": слова мають бути ПРОСТИМИ, ПОВСЯКДЕННИМИ УКРАЇНСЬКИМИ словами, які знає кожна людина (наприклад: КАСТРУЛЯ, ТЕЛЕВІЗОР, КОВДРА, КАПЕЛЮХ, ПІДЛОГА, ДЗЕРКАЛО). НЕ використовуй рідкісні, наукові чи специфічні слова. Голосні літери в українській мові: А, Е, И, І, Ї, О, У, Ю, Я, Є. Перевір, що після видалення голосних маска збігається зі словом.
- Кожного разу генеруй НОВІ унікальні дані, не повторюй приклади
- Використовуй emoji де вказано
- "findOdd.items" — ПОВИННО БУТИ РІВНО 4 ЕЛЕМЕНТИ (масив з 4 рядків)
- "odd" — це індекс зайвого (0-3), зайвий завжди має бути з іншої категорії
- "steps" в sequence — в ПРАВИЛЬНОМУ порядку
- "wallet" — сума в гаманці (має бути більша за суму items з урахуванням qty)
- У "budget.items" 2 з 4 товарів ПОВИННІ мати поле "qty" (2, 3 або 4). Ціна "p" — ціна за штуку. Загальна вартість = p × qty. Товари без qty купуються 1 штуку
- "vowels.words[].full" — ВЕЛИКИМИ ЛІТЕРАМИ
- Уникай ейджизму, сумних тем, стереотипів про старість чи хвороби. Завдання мають бути життєрадісними та поважними до літніх людей.
- Для "antonyms" речення ПОВИННІ мати життєвий та логічний сенс (наприклад: "Чай гарячий, лід холодний"). КАТЕГОРИЧНО НЕ генеруй абсурдні твердження або негативні стереотипи (НЕ пиши, що літні люди "стомлені", "повільні" чи "хворі"). Тільки позитивні або нейтральні факти.
- Для "antonyms" використовуй тільки дуже прості, чіткі антоніми з РІЗНИХ коренів. Не утворюй відповідь від того ж слова чи тієї ж основи. Заборонено пари типу "теплий/тепліший", "високий/вищий", "кращий/кращий", "молодий/молодший", "тихий/тихіший". Відповідь має виглядати як окреме просте слово, а не як порівняльна форма, зменшена форма або слово з тим самим коренем. СЛОВО-ВІДПОВІДЬ МАЄ БУТИ НЕ БІЛЬШЕ 7 ЛІТЕР.
- Речення для "antonyms" мають бути дуже короткі та прості: 3-5 слів, без складних зворотів. Краще один короткий факт і одне слово-відповідь.
- Для "whatChanged": 6 різних побутових emoji (фрукти, тварини, предмети). "changes" — рівно 2 об'єкти, кожен з "idx" (0-5) та "to" (новий emoji, що відрізняється від оригіналу). Заміни мають бути з тієї ж теми але іншим предметом (яблуко→груша, кіт→собака)
- Для "verbs.scene": напиши КОРОТКИЙ опис побутової сцени АНГЛІЙСЬКОЮ мовою для генерації картинки (DALL-E). Сцена має бути побутова, зрозуміла, позитивна, з кількома чіткими діями та предметами. ОБОВ'ЯЗКОВО чергуй РІЗНІ теми — НЕ повторюй бабусю, город чи яблука! Обирай одну з тем: базар/ринок, кухня з кількома людьми, дитячий майданчик, рибалка на озері, пікнік у парку, майстерня, свято/день народження, прибирання двору, зимові розваги. Приклад: "A family having a birthday picnic in a park, children playing with balloons, a dog running nearby, a cake on the table"
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
