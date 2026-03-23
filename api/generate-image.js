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
                prompt: `${prompt}. Style: friendly cartoon illustration, bright warm colors, no text, no letters, no words anywhere in the image. The scene should clearly show specific actions and objects.`,
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
                                text: `Подивись на цю картинку і створи завдання для когнітивного тренажера для літніх людей.

Створи JSON:
{
  "correct": ["Речення 1", "Речення 2", "Речення 3"],
  "wrong": ["Речення 1", "Речення 2", "Речення 3"]
}

ПРАВИЛА:
- ВСІ речення мають бути СТВЕРДЖУВАЛЬНИМИ (описувати дію або факт, що щось ВІДБУВАЄТЬСЯ/Є)
- "correct" — 3 короткі СТВЕРДЖУВАЛЬНІ речення УКРАЇНСЬКОЮ, що ТОЧНО описують те, що видно на картинці (хто що робить, які предмети є, яке місце)
- "wrong" — 3 короткі СТВЕРДЖУВАЛЬНІ речення УКРАЇНСЬКОЮ, які описують дії або предмети, яких НЕМАЄ на картинці, але звучать правдоподібно. Наприклад: "Дівчинка грає з м'ячем", "На столі стоїть ваза з квітами", "Чоловік читає газету"
- ЗАБОРОНЕНО писати заперечення! НЕ пиши "немає", "не видно", "відсутній". Кожне речення має стверджувати, що щось Є або ВІДБУВАЄТЬСЯ
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
