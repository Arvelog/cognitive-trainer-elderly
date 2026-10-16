import { fetchWithTimeout, guardAiRequest, jsonResponse, normalizeText, readJsonBody } from '../server/apiSecurity.js';

const MAX_ITEMS = 2;
const MAX_ID_LENGTH = 260;
const MAX_LABEL_LENGTH = 80;
const MAX_PROMPT_LENGTH = 160;
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
    const label = normalizeText(item?.label, MAX_LABEL_LENGTH);
    const id = normalizeText(item?.id, MAX_ID_LENGTH) || label;
    if (!label || !id) {
        return { id, ok: false, error: 'Missing label' };
    }

    const response = await fetchWithTimeout('https://api.openai.com/v1/images/generations', {
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
            output_compression: 60,
            background: 'opaque',
        }),
    }, 50_000);

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
                    id: normalizeText(items[current]?.id, MAX_ID_LENGTH) || normalizeText(items[current]?.label, MAX_LABEL_LENGTH),
                    ok: false,
                    error: error.message || 'Image generation failed',
                };
            }
        }
    });

    await Promise.all(runners);
    return results;
};

export async function POST(req) {
    const guardResponse = guardAiRequest(req, {
        key: 'generate-task-images',
        limit: 12,
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
        const rawItems = Array.isArray(body?.items) ? body.items : [];

        if (task !== 6) {
            return jsonResponse({ error: 'Unsupported task' }, 400);
        }

        if (rawItems.length === 0) {
            return jsonResponse({ error: 'Missing items' }, 400);
        }

        if (rawItems.length > MAX_ITEMS || rawItems.some((item) => (
            typeof item?.id !== 'string' ||
            typeof item?.label !== 'string' ||
            (item.prompt !== undefined && typeof item.prompt !== 'string') ||
            !item.id.trim() ||
            !item.label.trim() ||
            item.id.trim().length > MAX_ID_LENGTH ||
            item.label.trim().length > MAX_LABEL_LENGTH ||
            String(item.prompt || '').trim().length > MAX_PROMPT_LENGTH
        ))) {
            return jsonResponse({ error: 'Invalid items' }, 400);
        }

        const items = rawItems.map((item) => ({
            id: normalizeText(item.id, MAX_ID_LENGTH),
            label: normalizeText(item.label, MAX_LABEL_LENGTH),
            prompt: normalizeText(item.prompt, MAX_PROMPT_LENGTH),
        }));

        const images = await runLimited(items, 2, (item) => generateOne(envKey, item, task));

        return jsonResponse({ images });
    } catch (error) {
        console.error('Task image endpoint failed:', error);
        return jsonResponse({ error: 'Image generation failed', details: error.message }, 500);
    }
}
