# SEG-H12 (frontend) · Aviso del tope de tareas por usuario

**Responsable:** Ángel Quezada · **Historia:** Shortcut #79 (parte de frontend) · **Rama:** `seg-h12-aviso-tope` → `equipo3`
**Backend:** PR #32 de `todo-backend` (paginación y tope de 500 tareas)

## Contexto

El backend (SEG-H12) limita a **500 tareas por usuario** y responde **409**
`task_limit_reached` si se intenta crear la 501. La parte de frontend se dejó pendiente
para no chocar con el refactor de ARQ-07; ya integrado ARQ-07, se completa aquí.

Antes de este cambio el 409 ya se mostraba (con el texto del servidor), pero el usuario
solo se enteraba después de escribir la tarea y darle "Agregar".

## Solución

| Archivo | Cambio |
|---|---|
| `src/lib/limits.ts` | `MAX_TASKS_PER_USER = 500` (copia del valor del backend) y el mensaje del aviso |
| `src/components/TaskList.tsx` | Calcula si el usuario está en el tope y se lo pasa al formulario |
| `src/components/TaskForm.tsx` | Con el tope alcanzado, "Agregar" se deshabilita y aparece el aviso, ligado al botón con `aria-describedby` |
| `src/api/errors.ts` | Un 409 con `code: "task_limit_reached"` muestra el mismo aviso claro |

Mensaje: *"Llegaste al máximo de 500 tareas. Elimina alguna para agregar otra."*. Dice qué
pasó y qué hacer, sin culpar al usuario.

- El aviso tiene `role="status"`, así que el lector de pantalla lo anuncia.
- Si el valor del frontend llegara a desincronizarse del backend, no se rompe nada: el
  backend sigue siendo la autoridad y su 409 se muestra con el mismo mensaje.
- **Paginación en la lista:** no hace falta todavía. Como el tamaño máximo de página del
  backend es igual al tope, `GET /tasks` sin parámetros ya trae todas las tareas del usuario.

## Pruebas (`src/test/task-limit.test.tsx`)

- Con 500 tareas, "Agregar" queda deshabilitado, con el aviso como descripción accesible y sin llamar a la API.
- Con menos tareas, el formulario funciona normal y no hay aviso.
- Si el backend responde 409 (por ejemplo, tareas creadas desde otra pestaña), aparece el mismo aviso.
- Solo el 409 de `task_limit_reached` se traduce; otros 409 conservan su mensaje.

## Pendiente

- Si en el futuro el tope sube por encima del tamaño de página, la lista tendrá que pedir
  páginas (`limit`/`offset`). Hoy no aplica.
