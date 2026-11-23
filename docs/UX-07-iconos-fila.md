# UX-07 · Acciones de fila con iconos

**Responsable:** Ángel Quezada · **Historia:** Shortcut #89 · **Rama:** `ux-07-iconos-fila` → `equipo3`

## Problema

Cada tarea mostraba dos botones de texto, "Modificar" y "Eliminar". En una lista larga
eso es mucho texto repetido que compite con el título de la tarea. Además, para un
lector de pantalla todos los botones se llamaban igual ("Modificar", "Modificar"...),
así que no había forma de saber a qué tarea correspondía cada uno.

## Solución (`src/components/TaskItem.tsx`, `src/styles.css`)

- Botones de **icono** (lápiz y bote de basura) como SVG en línea. No se agregó ninguna
  librería: los iconos heredan el color de los botones de Bootstrap que ya existían
  (amarillo para modificar, rojo para eliminar).
- **Nombre accesible con el título de la tarea:** `aria-label="Modificar: Comprar pan"`.
  El lector de pantalla distingue cada fila. El `title` ("Modificar"/"Eliminar") da el
  tooltip al pasar el ratón. El SVG va con `aria-hidden`.
- **Área táctil de 40×40 px** (`.icon-button`).
- **En computadora** (`@media (hover: hover) and (pointer: fine)`) los iconos se ven
  tenues (opacidad 0.45) y se encienden al pasar el ratón por la fila **o al llegar con el
  teclado** (`:focus-within`), para que quien navega con Tab no tenga botones "invisibles".
- **En pantallas táctiles** siempre están al 100%, porque no existe el "pasar el ratón".
- La transición usa las variables de movimiento que ya tenía el proyecto (`--duration-base`,
  `--ease-out`).

## Pruebas

- Nuevo `src/test/row-actions.test.tsx`: nombres accesibles por tarea, tooltip, sin texto
  visible, icono oculto a lectores, clase de 40 px y que el icono borra la tarea correcta.
- `src/test/tasks.test.tsx` se actualizó: los botones ahora se buscan por su nuevo nombre
  accesible (`Modificar: Primera`, `Eliminar: Editada`). El flujo que prueba no cambió.

## Pendiente

- Ninguno propio. UX-08 (edición con teclado) trabaja sobre estos mismos botones.
