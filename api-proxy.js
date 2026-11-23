/** Same gateway failure contract as nginx, without reclassifying backend 5xx. */
export function apiProxy(target = 'http://127.0.0.1:8000') {
  return {
    target,
    configure(proxy) {
      proxy.on('error', (_error, _request, response) => {
        if ('writeHead' in response && !response.headersSent && !response.writableEnded) {
          response.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          response.end(JSON.stringify({
            detail: 'No hay conexión con el servidor. Revisa tu internet.',
            code: 'upstream_unavailable',
          }));
        }
      });
    },
  };
}
