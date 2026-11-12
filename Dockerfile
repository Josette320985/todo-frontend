
# Stage 1: Build the React application.
# Uses Node.js 22 on Alpine Linux to install dependencies
# and generate optimized production files with Vite.
FROM node:22-alpine AS build

# Set the working directory inside the build container.
WORKDIR /app

# Copy dependency manifests and install exact locked versions.
COPY package*.json ./
RUN npm ci

# Copy the application source code and generate the production build.
COPY . .
RUN npm run build

# Stage 2: Serve the production build using Nginx.
# Uses a lightweight Nginx image without Node.js build dependencies.
FROM nginx:1.27-alpine

# Copy the compiled frontend files from the build stage.
COPY --from=build /app/dist /usr/share/nginx/html

# Apply the custom Nginx server configuration.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Document the HTTP port used by the container.
EXPOSE 80

# Run Nginx in the foreground to keep the container running.
CMD ["nginx", "-g", "daemon off;"]
