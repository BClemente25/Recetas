const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define la carpeta donde se guardarán las imágenes
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Crea un nombre de archivo único para evitar colisiones
    // Ej: recipe-1700000000000.jpg
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, 'recipe-' + uniqueSuffix);
  }
});

const upload = multer({ storage: storage });

// Definir la ruta POST /api/upload
// 'recipeImage' debe coincidir con el nombre del campo en el formulario del frontend
router.post('/', upload.single('recipeImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo.' });
  }

  // Devolvemos la URL pública del archivo subido
  res.status(201).json({ imageUrl: `/uploads/${req.file.filename}` });
});

module.exports = router;