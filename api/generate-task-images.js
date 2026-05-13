export const config = {
    runtime: 'edge',
};

const MAX_ITEMS = 8;
const IMAGE_MODEL = 'gpt-image-2';

const normalizeText = (value) => String(value || '').trim();

const buildPrompt = ({ task, label, prompt }) => {
    const base = normalizeText(prompt) || normalizeText(label);
    const taskHint = task === 11
        ? 'The object must be easy to remember and visually distinct from other objects.'
        : task === 6
            ? 'The object must be easy to recognize as a sortable household category item.'
            : 'The object must clearly represent one possible answer in an association exercise.';

    return [
        `Create a clear educational illustration of: ${base}.`,
        taskHint,
        'Single centered object or simple object pair, plain light warm background, friendly soft colors.',
        'No text, no letters, no numbers, no labels, no watermark, no collage, no split scene.',
    ].join(' ');
};

const generateOne = async (envKey, item, task) => {
    const label = normalizeText(item?.label);
    const id = normalizeText(item?.id) || label;
    if (!label || !id) {
        return { id, ok: false, error: 'Missing label' };
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${envKey}`,
        },
        body: JSON.stringify({
            model: IMAGE_MODEL,
            prompt: buildPrompt({ task, label, prompt: item?.prompt }),
            n: 1,
            size: '1024x1024',
            quality: 'low',
            output_format: 'webp',
            background: 'opaque',
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`GPT Image API error for ${id} (${response.status}):`, errorText);
        return { id, ok: false, error: `OpenAI ${response.status}` };
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
        return { id, ok: false, error: 'No b64_json in response' };
    }

    return {
        id,
        ok: true,
        url: `data:image/webp;base64,${b64}`,
    };
};

const runLimited = async (items, limit, worker) => {
    const results = new Array(items.length);
    let index = 0;

    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (index < items.length) {
            const current = index;
            index += 1;
            try {
                results[current] = await worker(items[current]);
            } catch (error) {
                console.error('Task image generation failed:', error);
                results[current] = {
                    id: normalizeText(items[current]?.id) || normalizeText(items[current]?.label),
                    ok: false,
                    error: error.message || 'Image generation failed',
                };
            }
        }
    });

    await Promise.all(runners);
    return results;
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
        const body = await req.json();
        const task = Number(body?.task);
        const items = Array.isArray(body?.items) ? body.items.slice(0, MAX_ITEMS) : [];

        if (![5, 6, 11].includes(task)) {
            return new Response(JSON.stringify({ error: 'Unsupported task' }), { status: 400 });
        }

        if (items.length === 0) {
            return new Response(JSON.stringify({ error: 'Missing items' }), { status: 400 });
        }

        const images = await runLimited(items, 2, (item) => generateOne(envKey, item, task));

        return new Response(JSON.stringify({ images }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Task image endpoint failed:', error);
        return new Response(JSON.stringify({ error: 'Image generation failed', details: error.message }), { status: 500 });
    }
}
