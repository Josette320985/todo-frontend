# To-Do Frontend — Team 1 (Build It)

User interface for the To-Do List application, built with **React, Vite, and Bootstrap**.

> **Note:** To run the complete application (Frontend + Backend) using Docker, refer to the deployment instructions in the `README.md` file of the **`todo-backend`** repository.

---

## Running in Development Mode (Local)

If you need to modify the frontend code and preview changes in real time without using Docker, follow these steps:

**1. Navigate to the frontend directory:**

```bash
cd todo-frontend
```

**2. Install dependencies (first time only):**

```bash
npm install
```

**3. Start the Vite development server:**

```bash
npm run dev
```

*Note: Make sure the backend is running in Docker so that API requests work correctly.*

---

## Project Structure and File Descriptions

### Root Files (Configuration and Deployment)

| File | Description |
|---|---|
| `Dockerfile` | Multi-stage Dockerfile. First, it uses `node:22-alpine` to install dependencies and build the React application using `npm run build`. Then, it copies the generated static files (`dist/`) into an Nginx image to serve the application while keeping the final image lightweight. |
| `nginx.conf` | Nginx server configuration. Serves the React static files with a fallback to `index.html`, which is necessary for Single Page Applications (SPAs). It also acts as a **reverse proxy**, intercepting requests beginning with `/api/` and forwarding them internally to the FastAPI container (`http://backend:8000/api/`). This helps avoid CORS issues. |
| `package.json` | Defines the project dependencies (`react`, `axios`, `bootstrap`, `react-bootstrap`) and the scripts required to run and build the application. |
| `index.html` | Main HTML document of the application. It is loaded by the browser and provides the root element where React renders dynamic content. |

### `src/` Directory (React Source Code)

- `main.jsx`: Application entry point. Imports the global **Bootstrap** stylesheet (`bootstrap/dist/css/bootstrap.min.css`) and mounts the `<App />` component into the DOM.

- `App.jsx`: Main application component and authentication state controller. Checks `localStorage` for the presence of a JWT token. Depending on whether a token exists, it renders either `<LoginForm />` or `<TaskList />`. It also includes the navigation bar and the logout button.

#### `src/api/` (Backend Communication)

- `client.js`: Configures **Axios** with the relative base URL `/api`. Includes a **request interceptor** that retrieves the JWT token from `localStorage` and automatically attaches it to outgoing HTTP request headers:

```http
Authorization: Bearer <token>
```

This allows the backend to receive the authentication token with API requests.

#### `src/components/` (User Interface Components)

- `LoginForm.jsx`: Login and registration form. Uses `react-bootstrap` components (`Card`, `Form`, `Button`, and `Alert`). Captures errors returned by the backend and displays them in the interface. After successful login, it stores the JWT token and notifies `App.jsx` to update the displayed view.

- `TaskList.jsx`: Main component responsible for task CRUD (Create, Read, Update, Delete) operations.

  - **GET:** Sends a request to the backend when the component mounts to retrieve the authenticated user's tasks.
  - **POST:** Provides a form for creating new tasks.
  - **PUT:** Uses checkboxes to mark tasks as completed or pending. It also allows users to modify existing task titles.
  - **DELETE:** Provides buttons for deleting selected tasks.

---

## Technologies Used

- **React:** JavaScript library for building the user interface.
- **Vite:** Development server and build tool.
- **Bootstrap:** CSS framework for layout and visual styling.
- **React Bootstrap:** Bootstrap components adapted for React.
- **Axios:** HTTP client library for communicating with the backend.
- **Nginx:** Web server and reverse proxy for backend communication.
- **Docker:** Containerization platform for packaging and deploying the application.

---

## 👥 Development Team

- **Elisa Aguilar Valadez**
- **Josette Nayla Hernández Cazarín**
- **Erika Reyes González**
- **Glafira Rodríguez Esparza**
- **Janette Valenzuela González**
