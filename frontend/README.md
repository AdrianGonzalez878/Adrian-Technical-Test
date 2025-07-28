## Cómo Ejecutar el Proyecto

### Requisitos Previos
* Node.js (v18 o superior)
* npm
* Una cuenta de MongoDB Atlas
* Una clave de API de Google Maps Platform

### Backend
1.  Navega a la carpeta: `cd backend`
2.  Crea un archivo `.env` y añade tus variables `MONGO_URI` y `JWT_SECRET`.
3.  Instala las dependencias: `npm install`
4.  **Ejecuta el script de "seeding" para poblar la base de datos:**
    ```bash
    npm run seed
    ```
5.  Inicia el servidor: `node server.js`
    * El servidor estará corriendo en `http://localhost:5001`.

### Frontend
1.  Navega a la carpeta: `cd frontend`
2.  Crea un archivo `.env.local` y añade tu `NEXT_PUBLIC_Maps_API_KEY`.
3.  Instala las dependencias: `npm install`
4.  Inicia la aplicación: `npm run dev`
    * La aplicación estará disponible en `http://localhost:3000`.

### Credenciales de Acceso
Después de ejecutar el script "seed", puedes acceder como administrador con las siguientes credenciales:

* **Email**: `admin@example.com`
* **Contraseña**: `password123`