const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function for handling duplicate key errors
const handleDuplicateKeyError = (err, res) => {
  if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
    return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
  }
  return res.status(400).json({ message: 'Error en la validación de datos.', error: err.message });
};

// Iniciar sesión
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        firstName: user.firstName, 
        lastName: user.lastName 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Obtener usuarios con filtros, búsqueda y paginación
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    const count = await User.countDocuments(query);
    const users = await User.find(query).select('-password').limit(limit * 1).skip((page - 1) * limit).exec();
    
    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalUsers: count,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

// Crear un nuevo usuario (usado por un Admin)
const createUser = async (req, res) => {
  try {
    const userData = { ...req.body };
    if (userData.address && typeof userData.address === 'string') {
      userData.address = JSON.parse(userData.address);
    }
    const newUser = new User(userData);
    if (req.file) {
      newUser.profilePicture = req.file.path;
    }
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error('ERROR CAPTURADO:', error);
    return handleDuplicateKeyError(error, res);
  }
};

// Registrar un nuevo usuario (ruta pública)
const registerUser = async (req, res) => {
  try {
    const userData = { ...req.body, role: 'User', status: 'Active' };
    if (userData.address && typeof userData.address === 'string') {
      userData.address = JSON.parse(userData.address);
    }
    const newUser = new User(userData);
    if (req.file) {
      newUser.profilePicture = req.file.path;
    }
    await newUser.save();
    const token = jwt.sign({ id: newUser._id, role: newUser.role, firstName: newUser.firstName, lastName: newUser.lastName }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token });
  } catch (error) {
    console.error('ERROR EN REGISTRO:', error);
    return handleDuplicateKeyError(error, res);
  }
};

// Actualizar un usuario
const updateUser = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.password && updateData.password !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      delete updateData.password;
    }
    if (updateData.address && typeof updateData.address === 'string') {
      updateData.address = JSON.parse(updateData.address);
    }
    if (req.file) {
      updateData.profilePicture = req.file.path;
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    user.password = undefined;
    res.status(200).json(user);
  } catch (error) {
    console.error('ERROR CAPTURADO al actualizar:', error);
    return handleDuplicateKeyError(error, res);
  }
};

// Eliminar un usuario
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
};