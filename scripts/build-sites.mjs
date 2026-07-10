import { mkdir, writeFile } from 'node:fs/promises';

const worker = `const withSecurityHeaders = (response) => {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== 'GET') return withSecurityHeaders(response);

    const url = new URL(request.url);
    url.pathname = '/index.html';
    const fallback = await env.ASSETS.fetch(new Request(url, request));
    return withSecurityHeaders(fallback);
  },
};
`;

await mkdir(new URL('../dist/server/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/server/index.js', import.meta.url), worker, 'utf8');

