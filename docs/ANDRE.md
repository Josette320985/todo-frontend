# Tareas de Andre Chacon

Base: equipo3. Todos los cambios se mantienen en commits pequeños.

## SEG-H11 (#78)
Los logs del cliente incluyen solo contexto fijo y código HTTP; nunca el error
completo, cabeceras, cuerpo ni mensajes arbitrarios que puedan contener secretos.

## SEG-H14 (#81)
Gestor único: npm, con package-lock.json. Instalar con npm ci. Se aplicó npm
audit fix sin --force: cero vulnerabilidades al preparar este cambio.
No se introducen lockfiles de otros gestores.
