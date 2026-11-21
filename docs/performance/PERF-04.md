# PERF-04 / Shortcut #113 — preparación

Responsable: Andre Chacon. Bloqueada por SEG-H11 (#78), según Shortcut
consultado el 21 de noviembre de 2026. Coordinar el timeout con ERR-07 (#123).
Este avance añade medición; todavía no sustituye Axios ni cierra la historia.

## Medición reproducible

Con Node 24 y el lockfile del repositorio:

```sh
npm ci
npm run build
node scripts/performance/bundle-size.mjs
```

El informe incluye commit, estado de cambios, versión de Node, bytes y gzip
nivel 9 por archivo y totales separados JS/CSS. Construir siempre antes de
medir. Guardar los resultados fuera del repositorio o adjuntarlos al PR.
Comparar antes/después con la misma versión de Node y sin cambios ajenos a
PERF-04. La suma de chunks no equivale a la descarga inicial; gzip es una
estimación reproducible, no una medición de red.

Línea base local (21/11/2026), código de `origin/equipo3` en `eae4b88`,
Node v24.14.1, Vite 8.3.8 y lockfile existente. Solo se habían añadido los
instrumentos de rendimiento, sin modificaciones al código de producción:

| Tipo | Bytes | Bytes gzip nivel 9 |
| --- | ---: | ---: |
| JavaScript | 330540 | 104826 |
| CSS | 230306 | 30378 |

Validado: TypeScript, ESLint, build normal y ejecución del medidor.

## Cuando se desbloquee

1. Integrar SEG-H11 y acordar con ERR-07 el comportamiento de AbortSignal.
2. Preservar base `/api`, Authorization y el evento de 401, excepto login.
3. Mantener los tipos y mensajes de errores, incluidos los errores 422.
4. Probar éxito JSON, respuesta vacía 204, errores HTTP, red, cancelación,
   timeout, login 401 y sesión expirada antes de quitar Axios del lockfile.
5. Medir de nuevo. Los 58 KB / 21 KB gzip de la historia son una hipótesis
   previa, no un ahorro demostrado en esta rama.

## Revisión con el reporte de seguridad del 17/11/2026

El documento `seguridad todo.pdf` analiza el frontend dc9618e y el backend
c590efd; no representa necesariamente el estado actual de equipo3.
SEC-08 (páginas 3 y 10) exige conservar la eliminación del token y la salida
de sesión ante un 401 protegido. SEG-H11 confirma que los errores completos
de Axios pueden exponer Authorization en consola. En el código revisado
de esta rama siguen existiendo esos console.error en TaskList.

Además de los casos anteriores, comprobar que los errores del futuro wrapper
no arrastren cabeceras, tokens ni cuerpos con contraseñas y que un login 401
no dispare el evento de sesión expirada. Una respuesta 204 de logout tampoco
debe fallar intentando parsear JSON. El informe refuerza la dependencia de
SEG-H11; sustituir Axios por sí solo no demuestra que la fuga esté corregida.
