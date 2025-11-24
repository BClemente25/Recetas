const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // <-- 1. Importar el módulo 'fs'

// Importar rutas
const authRoutes = require('./routes/auth');
const recipesRoutes = require('./routes/recipes');
const publicRoutes = require('./routes/public');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload'); // <-- Nueva ruta

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// --- 2. Crear la carpeta 'uploads' si no existe ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Servir archivos estáticos de la carpeta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/user', userRoutes); // <-- Usar la nueva ruta
app.use('/api/upload', uploadRoutes); // <-- Usar la nueva ruta

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});