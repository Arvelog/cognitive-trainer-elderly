import { guardAiRequest, jsonResponse } from '../server/apiSecurity.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    const guardResponse = guardAiRequest(req, {
        key: 'generate',
        limit: 8,
        maxBodyBytes: 1024,
    });
    if (guardResponse) return guardResponse;

    const envKey = process.env.OPENAI_API_KEY;
    if (!envKey) {
        return jsonResponse({ error: 'Missing OPENAI_API_KEY' }, 500);
    }

    const generationPrompt = `Ти створюєш домашні мовленнєві вправи українською мовою для дорослої людини з афазією після інсульту.
Мета: тренувати розуміння, називання, побудову фраз, читання та письмо. Це не тест інтелекту.

Поверни ОДИН JSON-об'єкт точно такої структури:
{
  "matchWord": { "word": "одна дозволена побутова дія" },
  "sequence": { "title": "коротка побутова дія", "steps": ["крок 1", "крок 2", "крок 3", "крок 4"] },
  "naming": { "word": "чашка", "emoji": "☕", "category": "посуд", "use": "з неї п'ють чай", "place": "на кухні", "firstLetter": "Ч", "syllables": 2 },
  "sentence": { "sentences": ["Просте речення з 4-7 слів", "Ще одне просте речення", "Третє просте речення"] },
  "associations": { "q": "Що стосується чашки?", "correct": ["☕ З неї п'ють", "🍽️ Це посуд", "🏠 Вона є на кухні"], "wrong": ["🚗 Нею їздять", "✂️ Нею ріжуть", "👟 Її взувають"] },
  "categories": { "groupLabels": ["Кухня", "Ванна", "Сад"], "groupIcons": ["🍲", "🛁", "🌱"], "items": [{"text":"🥄 ложка","group":0},{"text":"☕ чашка","group":0},{"text":"🧼 мило","group":1},{"text":"🧺 рушник","group":1},{"text":"🪴 лійка","group":2},{"text":"🪏 лопата","group":2}] },
  "trueFalse": { "statements": [{"text":"Чай наливають у чашку","answer":true},{"text":"Черевики одягають на руки","answer":false},{"text":"Ключем відчиняють двері","answer":true}] },
  "phraseCompletion": { "items": [{"text":"Чай наливають у ...","answer":"чашку","options":["чашку","шафу","подушку"]},{"text":"Двері відчиняють ...","answer":"ключем","options":["ключем","ложкою","рушником"]},{"text":"Перед сном я лягаю у ...","answer":"ліжко","options":["ліжко","магазин","автобус"]}] },
  "writing": { "words": [{"word":"ЧАШКА","emoji":"☕","hint":"З неї п'ють чай"},{"word":"КЛЮЧ","emoji":"🔑","hint":"Ним відчиняють двері"},{"word":"МИЛО","emoji":"🧼","hint":"Ним миють руки"}] },
  "verbs": { "title": "Жінка готує суп", "context": "Що відбувається на цій сцені?", "scene": "A mature woman cooking soup in a bright home kitchen, stirring a pot on the stove with vegetables nearby", "correct": ["Жінка готує суп", "Вона помішує суп у каструлі", "Жінка стоїть на кухні"], "wrong": ["Чоловік ремонтує машину", "Люди чекають на автобус", "Дівчина читає книгу в парку"] },
  "reading": { "phrases": [{"context":"Привітання","text":"Доброго ранку!"},{"context":"Прохання","text":"Дайте, будь ласка, води."},{"context":"Подяка","text":"Дякую вам за допомогу."}] }
}

Правила:
- Усі поля, крім verbs.scene, пиши тільки правильною українською мовою.
- Використовуй дуже знайомі побутові слова. Один рядок — одна проста думка.
- Не використовуй рідкісні слова, жарти з подвійним змістом, абстракції, ейджизм, сумні або лячні теми.
- Не роби вправи дитячими за тоном. Людина доросла.
- matchWord.word вибери ТІЛЬКИ з цього списку: "Заварити чай", "Почистити зуби", "Полити квіти", "Написати листа", "Приготувати суп", "Піти до магазину", "Почитати книгу", "Підмести підлогу", "Посадити квіти", "Попрасувати сорочку", "Зателефонувати", "Зачинити двері".
- sequence.steps мають бути у правильному природному порядку.
- naming.word — один конкретний предмет, 3-9 літер. Підказки мають прямо стосуватися предмета.
- sentence.sentences — рівно 3 речення по 4-7 слів із прямим порядком слів.
- associations — рівно 3 очевидні правильні та 3 очевидні неправильні ознаки одного предмета.
- categories — 3 чіткі групи, по 2 предмети в кожній; кожен items.text починається з доречного emoji.
- trueFalse — 3 короткі твердження, серед них мають бути і true, і false.
- phraseCompletion — 3 функціональні фрази; відповідь дослівно входить до options; інші 2 варіанти очевидно не підходять.
- writing.word — просте слово ВЕЛИКИМИ ЛІТЕРАМИ.
- reading.phrases — 3 корисні дорослі фрази для щоденного спілкування.
- verbs описує одну дорослу людину та одну чітку безпечну побутову дію. Уникай лікарні, небезпеки, сумних і дитячих сюжетів.
- verbs.scene — 16-28 англійських слів для генерації зображення: персонаж, головна дія, місце і 1-2 добре видимі предмети; без тексту, написів і дрібних деталей.
- verbs.correct — рівно 3 короткі стверджувальні речення про головну дію, людину та місце, які прямо відповідають verbs.scene.
- verbs.wrong — рівно 3 короткі стверджувальні речення про зовсім інші дії та місця; без заперечень.
- Відповідай тільки JSON без markdown.

Seed: ${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${envKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-5.4-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'Return strictly valid JSON. Write natural Ukrainian without Russian words. Use respectful adult language and simple aphasia-friendly phrasing.',
                    },
                    { role: 'user', content: generationPrompt },
                ],
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenAI API error (Status ${response.status}):`, errorText);
            if (response.status === 429) return jsonResponse({ error: '429' }, 429);
            return jsonResponse({ error: `OpenAI API fail: ${response.status}` }, response.status);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) return jsonResponse({ error: 'Unexpected AI response format' }, 500);

        const cleanJson = content.replace(/^```json/g, '').replace(/```$/g, '').trim();
        JSON.parse(cleanJson);
        return new Response(cleanJson, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Task generation error:', error);
        return jsonResponse({ error: 'OpenAI request failed' }, 500);
    }
}
