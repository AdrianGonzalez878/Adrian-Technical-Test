const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: Only images are allowed!'));
  }
}).single('profilePicture');

// Import controllers and middleware
const { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController.js');
const { protect, isAdmin } = require('../middleware/authMiddleware.js');

// --- Route Definitions ---

// This route is protected for any logged-in user
router.route('/').get(protect, getUsers);

// These routes are protected for Admins only
router.route('/').post(protect, isAdmin, upload, createUser);

router.route('/:id')
  .put(protect, isAdmin, upload, updateUser)
  .delete(protect, isAdmin, deleteUser);

module.exports = router;