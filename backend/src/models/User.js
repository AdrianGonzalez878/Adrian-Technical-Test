const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // 1. IMPORTAR BCRYPT

// Versión corregida (campos opcionales)
const addressSchema = new mongoose.Schema({
    street: { type: String },
    number: { type: String },
    city: { type: String },
    postalCode: { type: String },
}, { _id: false });

// ... el código de userSchema se mantiene igual hasta el final ...
const userSchema = new mongoose.Schema({
    // ... todos los campos de antes (firstName, lastName, etc.) ...
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'User'], default: 'User' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    address: { type: addressSchema, required: false },  // para que no sea tardado estar agregando ususarios por su direccion
    profilePicture: { type: String, required: false }
}, {
    timestamps: true
});


// 2. AÑADIR EL HOOK "PRE-SAVE"
// Esta función se ejecutará ANTES de que un documento 'User' se guarde en la BD
userSchema.pre('save', async function(next) {
    // Si la contraseña no ha sido modificada, no hacemos nada y continuamos
    if (!this.isModified('password')) {
        return next();
    }

    // Si la contraseña es nueva o se cambió, la hasheamos
    try {
        const salt = await bcrypt.genSalt(10); // Genera una "sal" para mayor seguridad
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});



// AÑADIR ESTE MÉTODO PARA COMPARAR CONTRASEÑAS
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};


const User = mongoose.model('User', userSchema);
module.exports = User;