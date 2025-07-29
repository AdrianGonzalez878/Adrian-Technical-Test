const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ==================== HELPER FUNCTIONS ====================

/**
 * Handle duplicate key errors from MongoDB
 * @param {Error} err - The error object
 * @param {Response} res - Express response object
 * @returns {Response} JSON error response
 */
const handleDuplicateKeyError = (err, res) => {
  if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
    return res.status(409).json({ 
      message: 'El correo electrónico ya está en uso.' 
    });
  }
  return res.status(400).json({ 
    message: 'Error en la validación de datos.', 
    error: err.message 
  });
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role, 
      firstName: user.firstName, 
      lastName: user.lastName 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Parse address from string if needed
 * @param {Object} userData - User data object
 * @returns {Object} Modified user data
 */
const parseAddressIfNeeded = (userData) => {
  if (userData.address && typeof userData.address === 'string') {
    userData.address = JSON.parse(userData.address);
  }
  return userData;
};

/**
 * Hash password with bcrypt
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// ==================== AUTHENTICATION CONTROLLERS ====================

/**
 * User login
 * POST /api/auth/login
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });

    // Validate credentials
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ 
        message: 'Credenciales inválidas' 
      });
    }

    // Generate and return token
    const token = generateToken(user);
    res.status(200).json({ token });
    
  } catch (error) {
    res.status(500).json({ 
      message: 'Error del servidor', 
      error: error.message 
    });
  }
};

/**
 * User registration (public route)
 * POST /api/auth/register
 */
const registerUser = async (req, res) => {
  try {
    // Prepare user data with default role and status
    let userData = { 
      ...req.body, 
      role: 'User', 
      status: 'Active' 
    };
    
    // Parse address if it's a string
    userData = parseAddressIfNeeded(userData);
    
    // Create new user
    const newUser = new User(userData);
    
    // Add profile picture if uploaded
    if (req.file) {
      newUser.profilePicture = req.file.path;
    }
    
    // Save user to database
    await newUser.save();
    
    // Generate and return token
    const token = generateToken(newUser);
    res.status(201).json({ token });
    
  } catch (error) {
    console.error('ERROR EN REGISTRO:', error);
    return handleDuplicateKeyError(error, res);
  }
};

// ==================== USER MANAGEMENT CONTROLLERS ====================

/**
 * Get users with filters, search and pagination
 * GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      status, 
      search 
    } = req.query;
    
    // Build query object
    const query = {};
    
    // Add role filter
    if (role) {
      query.role = role;
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Get total count for pagination
    const count = await User.countDocuments(query);
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Return paginated results
    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalUsers: count,
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener usuarios', 
      error: error.message 
    });
  }
};

/**
 * Create new user (Admin only)
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    // Prepare user data
    let userData = { ...req.body };
    userData = parseAddressIfNeeded(userData);
    
    // Create new user
    const newUser = new User(userData);
    
    // Add profile picture if uploaded
    if (req.file) {
      newUser.profilePicture = req.file.path;
    }
    
    // Save user to database
    await newUser.save();
    
    res.status(201).json(newUser);
    
  } catch (error) {
    console.error('ERROR CAPTURADO:', error);
    return handleDuplicateKeyError(error, res);
  }
};

/**
 * Update existing user (Admin only)
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    // Prepare update data
    let updateData = { ...req.body };
    
    // Handle password update
    if (updateData.password && updateData.password !== '') {
      updateData.password = await hashPassword(updateData.password);
    } else {
      delete updateData.password;
    }
    
    // Parse address if needed
    updateData = parseAddressIfNeeded(updateData);
    
    // Add profile picture if uploaded
    if (req.file) {
      updateData.profilePicture = req.file.path;
    }
    
    // Update user in database
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Remove password from response
    user.password = undefined;
    
    res.status(200).json(user);
    
  } catch (error) {
    console.error('ERROR CAPTURADO al actualizar:', error);
    return handleDuplicateKeyError(error, res);
  }
};

/**
 * Delete user (Admin only)
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    // Find and delete user
    const user = await User.findByIdAndDelete(req.params.id);
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    res.status(200).json({ 
      message: 'Usuario eliminado exitosamente' 
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al eliminar el usuario', 
      error: error.message 
    });
  }
};

// ==================== EXPORTS ====================
module.exports = {
  // Authentication
  loginUser,
  registerUser,
  
  // User Management
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};