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

    try {
        const { prompt } = await req.json();
        if (!prompt) {
            return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400 });
        }

        // Step 1: Generate image with DALL-E
        const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${envKey}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: `${prompt}. Friendly cartoon illustration, bright warm colors, one clear everyday action, 1-2 people max, 2-4 visible objects, no text, no labels, no collage, no split scenes.`,
                n: 1,
                size: '1024x1024',
                quality: 'standard'
            })
        });

        if (!imageResponse.ok) {
            const errorText = await imageResponse.text();
            console.error(`DALL-E API error (Status ${imageResponse.status}):`, errorText);
            return new Response(JSON.stringify({ error: `DALL-E API fail: ${imageResponse.status}` }), { status: imageResponse.status });
        }

        const imageData = await imageResponse.json();
        const imageUrl = imageData.data?.[0]?.url;

        if (!imageUrl) {
            return new Response(JSON.stringify({ error: 'No image URL in response' }), { status: 500 });
        }

        // Step 2: Analyze image with GPT Vision to generate matching questions
        const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${envKey}`
            },
            body: JSON.stringify({
                model: 'gpt-5.4-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You analyze images and generate quiz questions in Ukrainian. Output ONLY valid JSON, no markdown.'
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Подивись УВАЖНО на цю картинку і створи завдання для когнітивного тренажера для літніх людей.

Створи JSON:
{
  "correct": ["Речення 1", "Речення 2", "Речення 3"],
  "wrong": ["Речення 1", "Речення 2", "Речення 3"]
}

ПРАВИЛА:
- ВСІ речення мають бути СТВЕРДЖУВАЛЬНИМИ (описувати що щось ВІДБУВАЄТЬСЯ або Є)
- "correct" — 3 речення УКРАЇНСЬКОЮ про НАЙГОЛОВНІШЕ, що видно на картинці. Описуй тільки те, в чому ти впевнений на 100%: головний персонаж, його основна дія, та місце дії. НЕ описуй дрібні деталі чи фонові предмети.
- "wrong" — 3 речення УКРАЇНСЬКОЮ про ЗОВСІМ ІНШУ СЦЕНУ. Неправильні відповіді повинні описувати дії та місця, які АБСОЛЮТНО не пов'язані з картинкою. Наприклад, якщо на картинці кухня — неправильні варіанти мають бути про вулицю, парк, магазин тощо. Якщо на картинці город — неправильні мають бути про кімнату, пляж, школу.
- ЗАБОРОНЕНО писати заперечення ("немає", "не видно", "відсутній")
- Речення мають бути прості, зрозумілі для літніх людей
- НЕ використовуй російські слова, тільки українську мову
- Відповідай ТІЛЬКИ JSON`
                            },
                            {
                                type: 'image_url',
                                image_url: { url: imageUrl }
                            }
                        ]
                    }
                ],
                response_format: { type: 'json_object' }
            })
        });

        let questions = null;
        if (visionResponse.ok) {
            const visionData = await visionResponse.json();
            const content = visionData.choices?.[0]?.message?.content;
            if (content) {
                try {
                    questions = JSON.parse(content.replace(/^```json/g, '').replace(/```$/g, '').trim());
                } catch (e) {
                    console.error('Failed to parse vision response:', e);
                }
            }
        } else {
            console.error('Vision API error:', await visionResponse.text());
        }

        return new Response(JSON.stringify({ url: imageUrl, questions }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('Image generation error:', e);
        return new Response(JSON.stringify({ error: 'Image generation failed', details: e.message }), { status: 500 });
    }
}
