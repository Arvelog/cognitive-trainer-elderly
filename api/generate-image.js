import { guardAiRequest, jsonResponse, normalizeText, readJsonBody } from '../server/apiSecurity.js';

const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5';

const buildScenePrompt = (scene) => [
    scene,
    'Create a realistic, warm, adult-friendly educational scene for language rehabilitation.',
    'Show one clear everyday action with the person, their hands, and the main objects fully visible.',
    'Use a simple uncluttered background, natural daylight, clear shapes, and high visual contrast.',
    'No text, letters, numbers, labels, logos, watermark, collage, split scene, medical setting, or childish cartoon style.',
].join(' ');

export default async function handler(req) {
    const guardResponse = guardAiRequest(req, {
        key: 'generate-image',
        limit: 4,
        maxBodyBytes: 4096,
    });
    if (guardResponse) return guardResponse;

    const envKey = process.env.OPENAI_API_KEY;
    if (!envKey) {
        return jsonResponse({ error: 'Missing OPENAI_API_KEY' }, 500);
    }

    try {
        const { data: body, error: bodyError } = await readJsonBody(req, 4096);
        if (bodyError) return bodyError;

        const prompt = normalizeText(body?.prompt, 800);
        if (!prompt) {
            return jsonResponse({ error: 'Missing prompt' }, 400);
        }

        if (prompt.length < 24 || prompt.split(/\s+/).length > 40) {
            return jsonResponse({ error: 'Invalid prompt' }, 400);
        }

        const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${envKey}`,
            },
            body: JSON.stringify({
                model: IMAGE_MODEL,
                prompt: buildScenePrompt(prompt),
                n: 1,
                size: '1536x1024',
                quality: 'medium',
                output_format: 'webp',
                output_compression: 78,
                background: 'opaque',
            }),
        });

        if (!imageResponse.ok) {
            const errorText = await imageResponse.text();
            console.error(`GPT Image API error (Status ${imageResponse.status}):`, errorText);
            return jsonResponse({ error: `OpenAI image generation failed: ${imageResponse.status}` }, imageResponse.status);
        }

        const imageData = await imageResponse.json();
        const base64Image = imageData.data?.[0]?.b64_json;
        if (!base64Image) {
            return jsonResponse({ error: 'No generated image in response' }, 500);
        }

        return jsonResponse({
            url: `data:image/webp;base64,${base64Image}`,
            source: 'ai',
            model: IMAGE_MODEL,
        });
    } catch (error) {
        console.error('Image generation error:', error);
        return jsonResponse({ error: 'Image generation failed' }, 500);
    }
}
