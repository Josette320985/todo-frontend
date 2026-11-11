# To-Do Frontend — Equipo 1 (Build It)

Interfaz de usuario para la aplicación To-Do List, construida con **React, Vite y Bootstrap**.

> **Nota:** Para levantar la aplicación completa (Frontend + Backend) mediante Docker, consulta las instrucciones de despliegue en el archivo `README.md` del repositorio **`todo-backend`**.

---

## Ejecución en modo desarrollo (Local)

Si necesitas modificar el código de la interfaz y visualizar los cambios en tiempo real sin utilizar Docker, sigue estos pasos:

**1. Entra a la carpeta del frontend:**

```bash
cd todo-frontend
```

**2. Instala las dependencias (solo la primera vez):**

```bash
npm install
```

**3. Inicia el servidor de desarrollo de Vite:**

```bash
npm run dev
```

*Nota: Asegúrate de tener el backend ejecutándose en Docker para que las peticiones a la API funcionen correctamente.*

---

## Estructura y explicación de archivos

### Archivos en la raíz (Configuración y despliegue)

| Archivo | Descripción |
|---|---|
| `Dockerfile` | Archivo multi-etapa. Primero utiliza `node:22-alpine` para instalar dependencias y compilar React mediante `npm run build`. Después, toma la carpeta estática generada (`dist/`) y la sirve utilizando un servidor `nginx:alpine`, haciendo que la imagen final sea ligera. |
| `nginx.conf` | Configuración del servidor Nginx. Sirve los archivos estáticos de React con fallback a `index.html` (necesario para el funcionamiento de las Single Page Applications). También actúa como **Proxy Inverso**, interceptando las peticiones que comienzan con `/api/` y redirigiéndolas internamente al contenedor de FastAPI (`http://backend:8000/api/`). Esto evita problemas de CORS. |
| `package.json` | Contiene las dependencias del proyecto (`react`, `axios`, `bootstrap`, `react-bootstrap`) y los scripts necesarios para su ejecución y construcción. |
| `index.html` | Archivo HTML principal de la aplicación. Es el documento que se renderiza en el navegador y donde React inyecta todo el contenido dinámico. |

### Carpeta `src/` (Código fuente React)

- `main.jsx`: Punto de entrada de la aplicación. Importa la hoja de estilos global de **Bootstrap** (`bootstrap/dist/css/bootstrap.min.css`) y monta el componente `<App />` en el DOM.

- `App.jsx`: Componente principal y controlador de estado. Consulta el `localStorage` para verificar si el usuario tiene un token JWT (sesión activa). Dependiendo de ello, decide si muestra el componente `<LoginForm />` o `<TaskList />`. También incluye la barra de navegación superior y el botón de "Cerrar Sesión".

#### `src/api/` (Comunicación con el Backend)

- `client.js`: Configura **Axios** y establece que todas las peticiones se realicen a través de la ruta relativa `/api`. Incluye un **Interceptor de peticiones** que busca el token JWT almacenado en `localStorage` y lo adjunta automáticamente en las cabeceras HTTP:

```http
Authorization: Bearer <token>
```

Esto permite autenticar las peticiones antes de enviarlas al backend.

#### `src/components/` (Componentes de la interfaz de usuario)

- `LoginForm.jsx`: Formulario de inicio de sesión y registro. Utiliza componentes de `react-bootstrap` (Card, Form, Button y Alert). Captura los errores enviados por el backend y los muestra en pantalla. Cuando el usuario inicia sesión correctamente, guarda el token JWT y notifica a `App.jsx` para actualizar la vista.

- `TaskList.jsx`: Componente principal encargado de las operaciones CRUD de tareas.

  - **GET:** Realiza una petición al backend cuando se monta el componente para cargar las tareas del usuario autenticado.
  - **POST:** Incluye un formulario rápido para crear nuevas tareas.
  - **PUT:** Utiliza casillas de verificación (checkboxes) para marcar las tareas como completadas.
  - **DELETE:** Incluye botones para eliminar las tareas seleccionadas.

---

## Tecnologías utilizadas

- **React:** Biblioteca para construir la interfaz de usuario.
- **Vite:** Herramienta de desarrollo y construcción del proyecto.
- **Bootstrap:** Framework CSS para el diseño y los componentes visuales.
- **React Bootstrap:** Componentes de Bootstrap adaptados para React.
- **Axios:** Biblioteca para realizar peticiones HTTP al backend.
- **Nginx:** Servidor web y proxy inverso para la comunicación con el backend.
- **Docker:** Contenerización de la aplicación.

---

## 👥 Equipo de desarrollo

- **Elisa Aguilar Valadez**
- **Josette Nayla Hernández Cazarín**
- **Erika Reyes González** 
- **Glafira Rodríguez Esparza** 
- **Janette Valenzuela González**
