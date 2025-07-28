const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./src/routes/userRoutes'); 
const authRoutes = require('./src/routes/authRoutes');

const app = express();

// Middlewares
app.use(cors()); 
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Only export the app
module.exports = app;