const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// ==================== MODELS ====================
const User = require('../models/User');

// ==================== MULTER CONFIGURATION ====================
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5000000 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: Solo se permiten imágenes!'));
  }
}).single('profilePicture');

// ==================== VALIDATION RULES ====================

// Create User Validation Rules
const userValidationRules = [
  body('firstName')
    .notEmpty()
    .withMessage('El nombre es requerido.'),
  
  body('lastName')
    .notEmpty()
    .withMessage('El apellido es requerido.'),
  
  body('email')
    .isEmail()
    .withMessage('Debe ser un correo electrónico válido.'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres.'),
  
  body('phoneNumber')
    .isLength({ min: 10, max: 10 })
    .withMessage('El número de teléfono debe tener 10 dígitos.'),
];

// Update User Validation Rules
const updateUserValidationRules = [
  body('firstName')
    .optional()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío.'),
  
  body('lastName')
    .optional()
    .notEmpty()
    .withMessage('El apellido no puede estar vacío.'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Debe ser un correo electrónico válido.')
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: value });
      // If a user is found, check if it's the same user we are editing
      if (user && user._id.toString() !== req.params.id) {
        return Promise.reject('El correo electrónico ya está en uso.');
      }
    }),
  
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres.'),
  
  body('phoneNumber')
    .optional()
    .isLength({ min: 10, max: 10 })
    .withMessage('El número de teléfono debe tener 10 dígitos.'),
];

// ==================== VALIDATION MIDDLEWARE ====================
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = {};
  errors.array().forEach(err => {
    if (err.path) {
      extractedErrors[err.path] = err.msg;
    }
  });
  
  return res.status(422).json({ 
    errors: extractedErrors 
  });
};

// ==================== CONTROLLERS AND MIDDLEWARE ====================
const { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController.js');

const { 
  protect, 
  isAdmin 
} = require('../middleware/authMiddleware.js');

// ==================== ROUTE DEFINITIONS ====================

// GET /api/users - Get all users (protected)
// POST /api/users - Create new user (admin only)
router.route('/')
  .get(protect, getUsers)
  .post(
    protect, 
    isAdmin, 
    upload, 
    userValidationRules, 
    validate, 
    createUser
  );

// PUT /api/users/:id - Update user (admin only)
// DELETE /api/users/:id - Delete user (admin only)
router.route('/:id')
  .put(
    protect, 
    isAdmin, 
    upload, 
    updateUserValidationRules, 
    validate, 
    updateUser
  )
  .delete(
    protect, 
    isAdmin, 
    deleteUser
  );

// ==================== EXPORT ====================
module.exports = router;