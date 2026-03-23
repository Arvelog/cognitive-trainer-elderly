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

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${envKey}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: `${prompt}. Style: friendly cartoon illustration, bright colors, no text, no letters, no words anywhere in the image.`,
                n: 1,
                size: '1024x1024',
                quality: 'standard'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`DALL-E API error (Status ${response.status}):`, errorText);
            return new Response(JSON.stringify({ error: `DALL-E API fail: ${response.status}` }), { status: response.status });
        }

        const data = await response.json();
        const url = data.data?.[0]?.url;

        if (!url) {
            return new Response(JSON.stringify({ error: 'No image URL in response' }), { status: 500 });
        }

        return new Response(JSON.stringify({ url }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('Image generation error:', e);
        return new Response(JSON.stringify({ error: 'Image generation failed', details: e.message }), { status: 500 });
    }
}
