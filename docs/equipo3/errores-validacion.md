# ERR-06 y UX-05: validación de integración

Revisión del 22 de noviembre de 2026 sobre frontend `519bd6c` y backend
`946dc3e`, ambos de `equipo3`.

## Cambios

- Los errores 422 que tienen un campo visible se muestran junto al campo,
  sin duplicarlos en la alerta global. Errores sin campo o de campos no
  visibles conservan la alerta para no ocultar fallos.
- El backend actual devuelve el error de orden de fechas en `errors[].field`
  como `body`. El cliente reconoce esa regla concreta y la ubica en `end_date`;
  otros errores del cuerpo siguen siendo globales.
- Se validan títulos vacíos y mayores de 200 caracteres, descripciones mayores
  de 1000 y fechas de calendario, además del orden de las fechas. La validación
  también protege el manejador de envío, no solo el atributo HTML maxLength.
- Retry-After rechaza valores negativos, fracciones y formatos numéricos no HTTP;
  admite segundos enteros y fechas HTTP. Las fechas ya pasadas producen espera 0.
- Una respuesta exitosa con JSON inválido tiene un mensaje propio.

## Compatibilidad de la base recibida

Se restauraron los temporizadores de Deshacer de UX-19, perdidos al integrar
los filtros: la base tenía siete pruebas de eliminación fallidas. Se mantuvo
la pausa cuando la pestaña está oculta. También se hicieron privados dos
auxiliares del contador que incumplían lint, y se corrigió la carrera entre
render y el evento load que dejaba la pantalla de carga bloqueada.
Cada corrección tiene un commit independiente.

## Evidencia

- 111 pruebas unitarias/de componentes aprobadas; typecheck, lint y build correctos.
- Cuatro pruebas HTTP del cliente real contra un backend aislado: valores
  límite aceptados (título 200, descripción 1000 y contraseña de 72 bytes),
  404 tras borrar, campos de error 422 reales y respuesta 429.
- Navegador: contraseña corta bloquea registro; registro válido funciona;
  fechas invertidas muestran feedback junto al campo y deshabilitan Agregar;
  fechas válidas permiten crear; tras detener y restaurar el backend se
  conserva el borrador y el reintento crea la tarea. Sesión de prueba cerrada.

Las pruebas de integración son optativas: `npx vitest run --config
vitest.integration.config.ts --reporter=verbose`. Requieren un backend
**exclusivamente de pruebas** en `http://127.0.0.1:8011`, con base de datos
aislada. Crean una cuenta sintética y consumen el rate limit; reiniciar ese
backend o esperar la ventana de 60 segundos antes de repetirlas. No se ejecutan
con `npm test` ni usan la base de desarrollo del equipo.

## Pendientes de aceptación

- ERR-02 ya está integrado. ERR-03 (#119, Elias Cardona) sigue en Backlog y
  bloqueado por ARQ-05 (#50). La prueba HTTP confirmó que el 429 real no trae
  Retry-After. El frontend maneja el header cuando existe, pero no inventa una
  espera cuando falta. La prueba reporta expresamente esta dependencia; sus
  cuatro resultados aprobados no certifican que ERR-03 esté implementado.
- Con el backend detenido detrás del proxy Vite, el navegador recibe HTTP 500,
  por lo que muestra el mensaje de 5xx. El mensaje de conexión se usa cuando
  fetch no recibe una respuesta HTTP, cubierto por las pruebas de componentes.
  La aceptación literal de ERR-06 para backend apagado necesita acordar el
  tratamiento del proxy; no se clasifica cualquier 500 como fallo de red.
- UX-05 sigue dependiendo de ERR-06. No se afirma que ningún 422 sea alcanzable:
  el email-validator del backend tiene reglas adicionales a type=email del
  navegador (incluyendo Unicode/IDN), y Python isdigit acepta más caracteres
  que la comprobación decimal del cliente. No se duplicó a ciegas ese validador.

Estas dos historias no se marcaron Done. No se modificó código del backend ni
se asumieron las tareas asignadas a otros integrantes.
