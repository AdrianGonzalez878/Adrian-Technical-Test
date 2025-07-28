const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController.js');

// La ruta de login ahora usa la función del controlador
router.post('/login', loginUser);

// La ruta de registro público
router.post('/register', registerUser);

module.exports = router;