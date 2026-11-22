# UX-05: correo alineado con el registro

El formulario verifica el correo mediante `/api/v1/auth/validate-email` antes
de enviar `/register`. El backend usa exactamente el mismo tipo de campo que
el registro, evitando mantener dos implementaciones divergentes de IDNA y
Unicode. Esta consulta solo comprueba formato; no busca cuentas existentes.

`validateEmail()` contiene únicamente los guardas inmediatos de vacío y tamaño.
El resto de las reglas se evalúa en el backend al pulsar el botón de registro.
Si el formato es inválido, el mensaje aparece bajo Email y el botón queda
deshabilitado hasta editar el campo. Si la comprobación falla por red o HTTP,
se conserva el formulario y se permite reintentar, sin crear una cuenta.

Se usa `type="text"` con `inputMode="email"`, autocomplete y sin autocapitalizar:
el validador nativo de `type="email"` rechaza correos internacionales aceptados
por el backend. El correo normalizado se usa tanto al registrar como al iniciar
sesión automáticamente. El login de cuentas existentes no añade esta petición.

No hay dependencias nuevas ni consultas por cada tecla. El registro necesita
una petición adicional. Es obligatorio desplegar primero el backend que expone
el endpoint; no hay fallback que omita la validación.

Validación del 22 de noviembre de 2026: 113 pruebas del frontend, typecheck,
lint y build aprobados; 308 pruebas y mypy del backend aprobados. En navegador
se comprobó el error inline de `a..b@example.com` y el registro/login de una
cuenta sintética Unicode con dominio punycode, mostrado después como `bücher.de`.

La diferencia de validación de correo está resuelta. La historia UX-05 conserva
su dependencia de ERR-06; este cambio no implementa ERR-03 ni modifica el
tratamiento de los fallos del proxy. La diferencia de repertorio de dígitos de
contraseña Python/JavaScript documentada anteriormente tampoco cambia aquí.
