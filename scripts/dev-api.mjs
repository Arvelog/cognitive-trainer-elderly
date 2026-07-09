import { createServer as createHttpServer } from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer as createViteServer } from 'vite';

const root = process.cwd();
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 5174);

const apiRoutes = new Map([
  ['/api/generate', 'api/generate.js'],
  ['/api/generate-image', 'api/generate-image.js'],
  ['/api/generate-task-images', 'api/generate-task-images.js'],
]);

const vite = await createViteServer({
  root,
  appType: 'spa',
  server: {
    middlewareMode: true,
  },
});

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const toHeaders = (req) => {
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item));
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  });
  return headers;
};

const handleApi = async (req, res, routePath) => {
  try {
    const moduleUrl = `${pathToFileURL(path.join(root, routePath)).href}?t=${Date.now()}`;
    const { default: handler } = await import(moduleUrl);
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req);
    const request = new Request(`http://${req.headers.host || `${host}:${port}`}${req.url}`, {
      method: req.method,
      headers: toHeaders(req),
      body: body?.length ? body : undefined,
    });

    const response = await handler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Local API handler failed:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Local API handler failed' }));
  }
};

const server = createHttpServer(async (req, res) => {
  const pathname = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`).pathname;
  const routePath = apiRoutes.get(pathname);

  if (routePath) {
    await handleApi(req, res, routePath);
    return;
  }

  vite.middlewares(req, res);
});

server.listen(port, host, () => {
  console.log(`Local app with API routes: http://${host}:${port}/`);
});
