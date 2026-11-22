# Tareas de Andre Chacon

Rama: `andre/tareas-asignadas`, derivada de `andre/rendimiento` y `origin/equipo3`.
Estado: implementación local, pendiente de revisión y merge a equipo3. No se
han modificado estados de Shortcut ni publicado comentarios.

## Resultado por historia

| Historia | Resultado local | Pendiente |
| --- | --- | --- |
| SEG-H11 #78 | Logs limitados a contexto fijo y status, sin errores completos ni tokens. Prueba de regresión. | Revisión/merge |
| SEG-H14 #81 | npm único, lockfile actualizado sin force; auditoría en cero al instalar. | Revisión/merge |
| ARQ-06 #51 | api/token, auth, tasks y lib/dates; componentes sin URLs HTTP ni localStorage. | Revisión/merge |
| TEST-07 #62 | Vitest, jsdom, Testing Library, npm test y mocks en api/. | Revisión/merge; coordinación con TEST-10 para CI |
| ARQ-07 #52 | useTasks, TaskForm, TaskItem, TaskList; ningún componente supera 150 líneas. Flujo CRUD verificado. | Revisión/merge |
| PERF-04 #113 | Axios eliminado; fetch conserva JSON, formularios, 204, errores y evento 401. | Revisión/merge |
| ERR-07 #123 | AbortSignal.timeout(10000), mensaje específico y controles rehabilitados. | Revisión/merge |
| PERF-06 #115 | Estado del formulario aislado; cero commits de filas al escribir con 1000 tareas. Sin memo innecesario. | Revisión/merge |
| ERR-06 #122 | Normalizador compatible con FastAPI actual y contrato propuesto; 404 retira fila, 422 por campo, 429 con espera, red/timeout/5xx. | Integración con ERR-02 #118 (Fabian RdzH) y ERR-03 #119 (Elias Cardona), ambas Backlog al consultar |
| UX-05 #87 | Título 200, vacío deshabilitado, fechas junto al campo, contraseña mínima/letra/dígito/72 bytes UTF-8. | Validación integrada con ERR-06 y errores backend definitivos |

El cliente soporta el contrato publicado en ERR-02 mediante pruebas simuladas;
esto no demuestra que el backend pendiente ya lo emita. El email sigue sujeto
al validador del servidor, especialmente IDN/Unicode: no se promete eliminar
absolutamente todo 422 con validación del navegador. La contraseña acepta letras
Unicode y dígitos decimales; no se intentó replicar toda la normalización Python.

## Comprobaciones realizadas

- npm run typecheck y npm run lint: correctos.
- npm test: 25 pruebas, incluyendo flujo CRUD, errores, timeout, cooldown,
  validaciones, sesión 401 y React Profiler con 1000 filas.
- Build normal y TypeScript del escenario de rendimiento correctos.
- Registro/login/crear/completar/editar/eliminar/logout en navegador real contra
  el backend local equipo3: correctos, sin errores de consola observados.
- PERF-06: 3 repeticiones escribiendo `rendimiento`; contador de TaskItem
  1000 antes y 1000 después en cada una, delta 0. Instrumentación React Profiler
  solo en performance/vite.config.mjs; no modifica el build normal.
- Auditoría tras actualizar y retirar Axios: cero vulnerabilidades.

## Tamaño de producción

Medido con Node 24.14.1, Vite 8.3.8, gzip nivel 9 y el script del repositorio.

| Estado | JS bytes | JS gzip bytes | CSS bytes | CSS gzip bytes |
| --- | ---: | ---: | ---: | ---: |
| Base equipo3 eae4b88 | 330540 | 104826 | 230306 | 30378 |
| Cambios de Andre | 277558 | 86256 | 230306 | 30378 |

Diferencia neta: -52982 bytes JS (16.0%) y -18570 bytes gzip (17.7%).
Incluye refactor, dependencias y validaciones; no atribuir todo el ahorro solo
al transporte. No es una medición de tiempo de descarga ni de latencia.

## Uso

`npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Para la app, configurar proxy /api al backend local o usar el nginx del proyecto.
Para PERF-06: `npx vite --config performance/vite.config.mjs` y abrir el puerto 5174.
Para el bundle: ejecutar el build normal y `node scripts/performance/bundle-size.mjs`.

El escenario de perfil usa tareas ficticias y un mock fetch, no la base real.
La prueba funcional dejó una cuenta sintética qa-andre-20261121@example.com en
la base local; su tarea de prueba se eliminó y se cerró la sesión.
