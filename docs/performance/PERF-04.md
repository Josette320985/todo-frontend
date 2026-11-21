# PERF-04 / Shortcut #113

Responsable: Andre Chacon. Implementado localmente tras SEG-H11 y ARQ-06.
Pendiente de revisión/merge a equipo3; el historial previo de preparación se
conserva en Git.

Se eliminó Axios del código y lockfile. El wrapper fetch conserva /api,
Authorization, JSON/form-urlencoded, respuesta vacía 204 y evento de 401 salvo
login. Un 401 antiguo no elimina una sesión nueva. AbortSignal limita cada
solicitud a 10 segundos y diferencia cancelación, red y timeout. Los errores
no almacenan request, token ni cabeceras de autorización.

Pruebas: src/test/client.test.ts y src/test/errors.test.ts. Flujo completo
verificado además en navegador contra backend equipo3 local.

## Medición

```sh
npm ci
npm run build
node scripts/performance/bundle-size.mjs
```

El script informa commit, cambios locales, Node, bytes y gzip nivel 9 por asset.
Construir siempre antes de medir: evita sumar el build auxiliar de performance.
La suma de chunks no equivale a la descarga inicial ni a latencia.

Base eae4b88: JS 330540 bytes / gzip 104826.
Resultado con todos los cambios de Andre: JS 277558 / gzip 86256.
Ahorro neto 52982 bytes (16.0%) / gzip 18570 bytes (17.7%). Incluye cambios
adicionales de formularios y dependencias; no es una comparación aislada de Axios.
CSS sin cambios: 230306 / gzip 30378. Node 24.14.1 y Vite 8.3.8.

El reporte de seguridad del 17/11/2026 confirmó la necesidad de preservar
SEC-08 y evitar logs de tokens (SEG-H11). Se conserva esa cobertura. ERR-06
soporta por pruebas el contrato futuro ERR-02/ERR-03, cuya integración real
continúa pendiente de los responsables del backend.
