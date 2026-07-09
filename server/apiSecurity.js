const rateBuckets = globalThis.__cognitiveTrainerRateBuckets || new Map();
globalThis.__cognitiveTrainerRateBuckets = rateBuckets;

const byteLength = (value) => new TextEncoder().encode(String(value || '')).length;

export const jsonResponse = (body, status = 200, headers = {}) =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    });

const getHost = (req) =>
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    '';

const getRequestSource = (req) =>
    req.headers.get('origin') ||
    req.headers.get('referer') ||
    '';

const isAllowedSource = (req) => {
    const source = getRequestSource(req);
    const host = getHost(req);
    if (!source || !host) return true;

    try {
        return new URL(source).host === host;
    } catch {
        return false;
    }
};

const isAllowedFetchSite = (req) => {
    const fetchSite = req.headers.get('sec-fetch-site');
    if (!fetchSite) return true;
    return ['same-origin', 'same-site', 'none'].includes(fetchSite);
};

const hasBrowserProvenance = (req) =>
    Boolean(req.headers.get('sec-fetch-site') || getRequestSource(req));

const getClientIp = (req) => {
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0].trim();

    return (
        req.headers.get('x-real-ip') ||
        req.headers.get('cf-connecting-ip') ||
        req.headers.get('x-vercel-forwarded-for') ||
        'unknown'
    );
};

const rateLimit = (req, { key, limit, windowMs }) => {
    const now = Date.now();
    const bucketKey = `${key}:${getClientIp(req)}`;
    const recent = (rateBuckets.get(bucketKey) || []).filter((timestamp) => now - timestamp < windowMs);

    if (recent.length >= limit) {
        const retryAfterMs = windowMs - (now - recent[0]);
        return jsonResponse(
            { error: 'Too many requests' },
            429,
            { 'Retry-After': String(Math.max(1, Math.ceil(retryAfterMs / 1000))) },
        );
    }

    recent.push(now);
    rateBuckets.set(bucketKey, recent);
    return null;
};

export const guardAiRequest = (req, { key, limit, windowMs = 60_000, maxBodyBytes = 4096 }) => {
    if (req.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
    }

    if (!hasBrowserProvenance(req) || !isAllowedFetchSite(req) || !isAllowedSource(req)) {
        return jsonResponse({ error: 'Forbidden' }, 403);
    }

    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > maxBodyBytes) {
        return jsonResponse({ error: 'Payload too large' }, 413);
    }

    return rateLimit(req, { key, limit, windowMs });
};

export const readJsonBody = async (req, maxBodyBytes) => {
    const text = await req.text();
    if (byteLength(text) > maxBodyBytes) {
        return { error: jsonResponse({ error: 'Payload too large' }, 413) };
    }

    if (!text.trim()) {
        return { data: {} };
    }

    try {
        return { data: JSON.parse(text) };
    } catch {
        return { error: jsonResponse({ error: 'Invalid JSON' }, 400) };
    }
};

export const normalizeText = (value, maxLength = 200) =>
    String(value || '').trim().slice(0, maxLength);
