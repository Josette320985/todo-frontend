# PERF-06 / Shortcut #115 — preparación

Responsable: Andre Chacon. Bloqueada por ARQ-07 (#52), según Shortcut
consultado el 21 de noviembre de 2026. No extraemos TaskForm ni TaskItem:
esa separación pertenece a la dependencia de arquitectura.

## Escenario reproducible sin backend

```sh
npm ci
npx vite --config performance/vite.config.mjs
```

Abrir http://127.0.0.1:5174. La página monta el TaskList real con 1,000 tareas
deterministas y un adapter de Axios que nunca accede a la red. No usa el
token almacenado ni modifica la base de datos. Solo está pensada para
escribir en el formulario: las escrituras al API se rechazan expresamente.
No forma parte del entry point ni del build normal de producción.

## Protocolo antes y después

1. Usar la misma máquina, navegador, viewport y modo de desarrollo.
2. Esperar a que aparezcan las 1,000 tareas antes de iniciar la grabación.
3. En React DevTools Profiler activar el registro de por qué se renderiza
   cada componente. Grabar mientras se escribe `rendimiento` en Nueva tarea.
4. Exportar el perfil e identificar componentes y commits causados por
   esas teclas. Repetir tres veces. Separar el montaje inicial de las teclas.
5. Tras integrar ARQ-07, repetir. Criterio: ningún TaskItem se renderiza
   al escribir en TaskForm. Agregar memo solo si la medición lo justifica.

El contador de la página mide commits del árbol completo, no renders de
TaskItem. No demuestra por sí solo el criterio de aceptación. En la versión
actual TaskItem aún no existe. No se afirma haber cumplido el criterio ni
medido una mejora; el perfil real antes/después sigue pendiente.

Si PERF-04 elimina Axios, adaptar este mock al nuevo transporte antes de
repetir el perfil. Mantener el aislamiento: nunca enviar solicitudes reales.

Validación del escenario:

```sh
npx tsc --noEmit -p performance/tsconfig.json
npx vite build --config performance/vite.config.mjs
```

Para medir PERF-04 después, ejecutar `npm run build` de nuevo: elimina
la compilación auxiliar de `dist/performance` y evita sumarla al bundle real.
