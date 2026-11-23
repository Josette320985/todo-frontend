# ERR-06: cierre de integración

Revisión del 22 de noviembre de 2026. Rama `fix/err06-cierre`, creada desde
`equipo3` frontend `9cef471`; backend de pruebas `c35655f`.

## Dependencias resueltas

ERR-03 ya devuelve `Retry-After` en respuestas 429. La prueba de integración
ahora exige un valor positivo y el mensaje correspondiente; ya no permite
aprobar con el encabezado ausente. No se modifica el backend.

## Cambios

- El transporte conserva el código público de error del servidor.
- Nginx y Vite devuelven HTTP 503 con `code: upstream_unavailable` cuando
  no pueden conectar con el backend. El cliente muestra «No hay conexión
  con el servidor. Revisa tu internet.» y conserva el borrador.
- Nginx limita a tres segundos el establecimiento de conexión para responder
  antes del timeout del cliente. Los tiempos de lectura no se modifican.
- Los errores 5xx recibidos del backend siguen siendo errores internos;
  no se convierten indiscriminadamente en fallos de conexión.
- La respuesta de desconexión no se almacena en caché y conserva las cabeceras
  de seguridad. Se mantienen las protecciones de IP y tamaño de petición.

## Verificación

- Typecheck, lint, build y 114 pruebas unitarias/de componentes aprobadas.
- Cinco pruebas de integración aprobadas: límites del formulario, 404, campos
  422, registro inválido, 429 con Retry-After y contrato del proxy Vite.
  El proxy transmite sin cambios respuestas 500, 502, 503 y 504 del upstream;
  únicamente una conexión fallida recibe el código de desconexión.
- Nginx real con build de producción: backend aislado detenido devuelve
  503 y el mensaje de conexión en el formulario. El borrador se mantiene;
  después de restaurar el backend, el reintento crea la tarea correctamente.
- El formulario recibe un 429 real, muestra la espera y deshabilita Entrar.

Ejecutar las pruebas de integración con `npx vitest run --config
vitest.integration.config.ts --reporter=verbose`. Requieren un backend
**exclusivamente de pruebas** en `127.0.0.1:8011`. Crean cuentas sintéticas y
consumen límites de intentos; reiniciar ese backend o esperar 60 segundos
antes de repetirlas. La prueba del proxy utiliza servidores locales efímeros.

Este cierre resuelve los dos pendientes de ERR-06 descritos en el informe
anterior. No modifica el alcance de UX-05 ni otras historias del equipo.
