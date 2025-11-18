const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const userRoutes = require('./routes/user');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/public', publicRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Recipe Manager API funcionando correctamente' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});