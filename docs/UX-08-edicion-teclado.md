# UX-08 · Edición inline usable con teclado

**Responsable:** Ángel Quezada · **Historia:** Shortcut #90 · **Rama:** `ux-08-edicion-teclado` → `equipo3`

## Problema

Editar una tarea solo era cómodo con el ratón:

- Al entrar a editar, el foco se quedaba en el botón; había que dar clic en el campo.
- No había forma de cancelar con el teclado.
- Al guardar o cancelar, el botón de editar desaparecía y volvía a aparecer, así que el
  foco se perdía (regresaba al inicio de la página) y quien usa teclado o lector de
  pantalla perdía su lugar en la lista.

## Solución (`src/components/TaskItem.tsx`, `src/components/TaskFields.tsx`)

| Acción | Resultado |
|---|---|
| Entrar a editar | El cursor queda en el título (`autoFocus`) |
| **Enter** | Guarda (envío del formulario, como ya funcionaba) |
| **Escape** | Cancela sin guardar |
| Guardar o cancelar | El foco regresa al botón "Modificar" **de esa misma fila** |

- El regreso del foco solo ocurre cuando la fila cerró su propio editor (`returnFocus`).
  Si abres la edición de otra fila, el foco va al nuevo campo y no "brinca" a la anterior.
- **Sin animación** al abrir o cerrar la edición: es una acción frecuente y de teclado. El
  cambio es instantáneo; las animaciones de entrada y salida de filas (UX-17) no se tocan.
- Escape se ignora mientras se está guardando, para no cerrar a medio envío.

## Pruebas (`src/test/keyboard-edit.test.tsx`)

- Al dar editar, el título tiene el foco.
- Enter guarda y el foco vuelve al botón de editar de esa tarea.
- Escape cancela, no llama a la API y el foco vuelve al botón.
- Flujo completo solo con teclado: Enter en el botón → editar → Escape → foco de regreso.
- Abrir otra fila no le roba el foco al campo nuevo.

## Integración con UX-11 y UX-12

Mientras esta rama estaba abierta se integraron a `equipo3` UX-11 (indicador de
vencimiento) y UX-12 (campo descripción), que también modifican `TaskItem.tsx`. El
conflicto se resolvió conservando ambos cambios: el guardado envía la descripción (UX-12)
y además regresa el foco al botón (UX-08).

Con el campo de descripción, el comportamiento de teclado queda así:

- En el **título** y las **fechas**, Enter guarda.
- En la **descripción** (área de texto de varias líneas), Enter hace un salto de línea, como
  se espera en un área de texto. Para guardar desde ahí: Tab hasta "Guardar", o Enter en otro campo.
- **Escape cancela desde cualquier campo**, incluida la descripción.

## Pendiente

- Ninguno propio.
