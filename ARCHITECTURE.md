# Arquitectura del frontend

React 19 + TypeScript + Vite + React Bootstrap. Este documento dice **dónde va
cada cosa**; revísalo en cada PR (ARQ-10).

## Capas

```text
main.tsx ─► <AuthProvider> ─► <App>
                                 │
src/components/   UI: renderiza, maneja formularios y eventos
     │  usa
     ▼
src/hooks/        estado y casos de uso: useAuth, useTasks, useCooldown
     │  llama
     ▼
src/api/          único lugar con fetch, URLs y token (client, auth, tasks, errors)
     │
     ▼
   /api/v1/*      backend (nginx hace de proxy)
```

Transversal: `src/lib/` (funciones puras: fechas, validación, animaciones) y
`src/types/` (tipos que reflejan los schemas del backend).

## Reglas

1. **Los componentes no hablan HTTP.** Nada de `fetch`, URLs ni `localStorage`
   en `src/components/`: pasan por un hook o por `src/api/`.
2. **La sesión vive en `AuthProvider`** (ARQ-08). Los componentes leen
   `isLoggedIn`, `userEmail`, `sessionExpired`, `login`, `register` y `logout`
   con `useAuth()`. El token solo lo tocan `api/token.ts` y `api/auth.ts`.
3. **Un 401 se maneja en un solo lugar.** `api/client.ts` borra el token y
   dispara `AUTH_UNAUTHORIZED_EVENT`; `AuthProvider` lo escucha y muestra el
   aviso de sesión expirada (UX-06).
4. **Los errores se normalizan en `api/errors.ts`** (`getApiError`): mensaje,
   errores por campo y `Retry-After`. La UI no interpreta respuestas crudas.
5. **`lib/` es puro.** Sin React, sin red: se prueba con tests unitarios.
6. **Fechas como texto `YYYY-MM-DD`.** Se comparan como strings con el día
   local (`lib/dates.ts`), nunca con `new Date(fecha)` (desfase por zona horaria).
7. **Componentes chicos.** Si uno pasa de ~150 líneas, sepáralo (ARQ-07).
8. **Estilos con Bootstrap primero.** Lo que falte va en `src/styles.css`
   usando sus tokens (`--duration-*`, `--ease-*`) y respetando
   `prefers-reduced-motion` y el modo oscuro.

## Dónde va el código nuevo

| Tipo de cambio | Dónde |
|---|---|
| Pantalla, formulario o pieza de UI | `src/components/` |
| Estado compartido o caso de uso (cargar, guardar, sesión) | `src/hooks/` |
| Endpoint nuevo del backend | función en `src/api/<recurso>.ts` |
| Tipo de dato que manda o recibe la API | `src/types/` |
| Cálculo o validación sin React | `src/lib/` |
| Estilo global, animación o ajuste responsive | `src/styles.css` |
| Mensaje de error de la API | `src/api/errors.ts` |
| Prueba | `src/test/<tema>.test.ts(x)` (Vitest + Testing Library) |
| Escenario de rendimiento | `performance/` |
| Decisión o evidencia de una historia | `docs/` |

## Checklist de PR

- [ ] El cambio está en la capa que dice la tabla.
- [ ] `npm run typecheck`, `npm run lint`, `npm test` y `npm run build` pasan
      (los corre `.github/workflows/frontend-ci.yml`).
- [ ] Si agregaste una carpeta o regla, actualizaste este archivo.
