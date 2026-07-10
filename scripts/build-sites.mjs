import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'server' || entry.name === '.openai') continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else files.push(path);
  }

  return files;
}

const files = await collectFiles(dist);
const embeddedAssets = {};

for (const file of files) {
  const pathname = `/${relative(dist, file).split(sep).join('/')}`;
  embeddedAssets[pathname] = {
    body: (await readFile(file)).toString('base64'),
    type: contentTypes[extname(file).toLowerCase()] || 'application/octet-stream',
  };
}

const worker = `const assets = ${JSON.stringify(embeddedAssets)};

const decode = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

const respond = (asset, { cache = false } = {}) => {
  const headers = new Headers({
    'Content-Type': asset.type,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
  });
  headers.set('Cache-Control', cache ? 'public, max-age=31536000, immutable' : 'no-cache');
  return new Response(decode(asset.body), { status: 200, headers });
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    const asset = assets[pathname];

    if (asset) {
      const cache = pathname.startsWith('/assets/');
      return request.method === 'HEAD'
        ? new Response(null, { status: 200, headers: respond(asset, { cache }).headers })
        : respond(asset, { cache });
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      const index = assets['/index.html'];
      return request.method === 'HEAD'
        ? new Response(null, { status: 200, headers: respond(index).headers })
        : respond(index);
    }

    return new Response('Not found', { status: 404 });
  },
};
`;

await mkdir(resolve(dist, 'server'), { recursive: true });
await writeFile(resolve(dist, 'server/index.js'), worker, 'utf8');
