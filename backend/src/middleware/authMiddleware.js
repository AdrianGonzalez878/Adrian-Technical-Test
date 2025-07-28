const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    // 1. Buscamos el token en los encabezados (headers) de la petición
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 2. Extraemos el token (quitando "Bearer ")
            token = req.headers.authorization.split(' ')[1];

            // 3. Verificamos el token con nuestra clave secreta
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 4. Si el token es válido, añadimos los datos del usuario a la petición
            //    (sin la contraseña) para que las rutas posteriores puedan usarlo.
            req.user = decoded;

            // 5. Continuamos hacia la siguiente función (el controlador del endpoint)
            next();

        } catch (error) {
            // Si el token no es válido (o expiró), enviamos un error
            res.status(401).json({ message: 'No autorizado, token falló' });
        }
    }

    // Si no hay ningún token en los encabezados, enviamos un error
    if (!token) {
        res.status(401).json({ message: 'No autorizado, no hay token' });
    }
};

// NUEVO MIDDLEWARE PARA VERIFICAR EL ROL DE ADMIN
const isAdmin = (req, res, next) => {
    // Esta función se ejecuta DESPUÉS de 'protect', así que ya tenemos req.user
    if (req.user && req.user.role === 'Admin') {
        next(); // Si el usuario es Admin, continuamos a la ruta
    } else {
        // Si no, enviamos un error 403 Forbidden (Prohibido)
        res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Administrador.' });
    }
};

module.exports = { protect, isAdmin };