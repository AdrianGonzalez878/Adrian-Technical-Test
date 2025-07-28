const mongoose = require('mongoose');
const app = require('./index'); // Import the configured app

const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('¡Conectado a MongoDB Atlas!');
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error de conexión a MongoDB:', err);
  });