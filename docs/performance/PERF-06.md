# PERF-06 / Shortcut #115

Responsable: Andre Chacon. Implementado localmente tras separar TaskForm,
TaskItem y useTasks (ARQ-07). El estado del formulario ya no vive en TaskList.
No se añadió memo porque la medición no lo justifica.

## Escenario reproducible

```sh
npm ci
npx vite --config performance/vite.config.mjs
```

Abrir http://127.0.0.1:5174. La página usa el TaskList real con 1000 tareas
ficticias deterministas. Su mock fetch no realiza solicitudes reales.
El plugin del escenario envuelve cada TaskItem en React Profiler y publica
sus commits en un contador del DOM; no se incluye en la configuración normal.
No guardar: este mock es de solo lectura. No medir en build de producción,
donde React desactiva el Profiler estándar.

Esperar al montaje de las 1000 filas; anotar `Commits de TaskItem`; escribir
`rendimiento` en Nueva tarea; el contador no debe aumentar. Repetir tres veces.
El contador del árbol completo puede aumentar por el formulario: no equivale
al contador de filas. Puede inspeccionarse también con React DevTools Profiler.

## Resultado observado el 21/11/2026

En navegador real, tres repeticiones: 1000 antes, 1000 después, delta 0.
Prueba automatizada adicional en src/test/renders.test.tsx: 1000 TaskItem reales,
React Profiler y escritura con user-event; cero commits adicionales.
No se afirma una reducción de milisegundos frente a una grabación anterior,
porque esa grabación no existe. Se verifica el criterio funcional de la historia.

La paginación SEG-H12 es una tarea distinta. Este escenario sintético no propone
cargar 1000 tareas en producción ni eludir futuros topes. Adaptar el mock al
contrato de paginación cuando llegue esa dependencia de otro responsable.

Para comprobar el código del escenario:

```sh
npx tsc --noEmit -p performance/tsconfig.json
```
