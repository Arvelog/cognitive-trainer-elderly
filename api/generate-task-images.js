import { guardAiRequest, jsonResponse, normalizeText, readJsonBody } from '../server/apiSecurity.js';

const MAX_ITEMS = 8;
const IMAGE_MODEL = process.env.OPENAI_TASK_IMAGE_MODEL || 'gpt-image-1-mini';

const buildPrompt = ({ task, label, prompt }) => {
    const base = normalizeText(prompt) || normalizeText(label);
    const taskHint = task === 6
        ? 'The object must be easy to recognize as a sortable household category item.'
        : 'The object must be clear and familiar.';

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
    const guardResponse = guardAiRequest(req, {
        key: 'generate-task-images',
        limit: 6,
        maxBodyBytes: 16_384,
    });
    if (guardResponse) return guardResponse;

    const envKey = process.env.OPENAI_API_KEY;
    if (!envKey) {
        return jsonResponse({ error: 'Missing OPENAI_API_KEY' }, 500);
    }

    try {
        const { data: body, error: bodyError } = await readJsonBody(req, 16_384);
        if (bodyError) return bodyError;

        const task = Number(body?.task);
        const items = Array.isArray(body?.items)
            ? body.items.slice(0, MAX_ITEMS).map((item) => ({
                id: normalizeText(item?.id, 260),
                label: normalizeText(item?.label, 80),
                prompt: normalizeText(item?.prompt, 160),
            }))
            : [];

        if (task !== 6) {
            return jsonResponse({ error: 'Unsupported task' }, 400);
        }

        if (items.length === 0) {
            return jsonResponse({ error: 'Missing items' }, 400);
        }

        if (items.some((item) => !item.id || !item.label || item.label.length > 80 || item.prompt.length > 160)) {
            return jsonResponse({ error: 'Invalid items' }, 400);
        }

        const images = await runLimited(items, 2, (item) => generateOne(envKey, item, task));

        return jsonResponse({ images });
    } catch (error) {
        console.error('Task image endpoint failed:', error);
        return jsonResponse({ error: 'Image generation failed', details: error.message }, 500);
    }
}
