import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'vite';
import { expect, it } from 'vitest';
import { apiProxy } from '../api-proxy.js';

it('preserves backend 5xx and identifies only an unreachable upstream', async () => {
  const upstream = createHttpServer((request, response) => {
    response.writeHead(Number(request.url?.split('/').pop()), { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ code: 'backend_error' }));
  });
  await new Promise<void>(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const address = upstream.address();
  if (!address || typeof address === 'string') throw new Error('Missing test server port');
  const vite = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0, proxy: { '/api': apiProxy(`http://127.0.0.1:${address.port}`) } },
  });
  try {
    await vite.listen();
    const base = vite.resolvedUrls!.local[0];
    for (const status of [500, 502, 503, 504]) {
      const response = await fetch(`${base}api/${status}`);
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({ code: 'backend_error' });
    }
    await new Promise<void>((resolve, reject) => upstream.close(error => error ? reject(error) : resolve()));
    const response = await fetch(`${base}api/offline`);
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ code: 'upstream_unavailable' });
  } finally {
    upstream.close();
    await vite.close();
  }
});
