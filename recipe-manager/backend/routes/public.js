const express = require('express');
const router = express.Router();
const db = require('../database'); // Asumo que tienes un archivo para la conexión a la BD

// GET /api/public/recipes - Obtener todas las recetas públicas
router.get('/recipes', (req, res) => {
  const sql = `
    SELECT r.*, u.username 
    FROM recipes r
    JOIN users u ON r.user_id = u.id
    WHERE r.is_public = 1
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: rows,
    });
  });
});

// GET /api/public/users/:userId/recipes - Obtener las recetas públicas de un usuario
router.get('/users/:userId/recipes', (req, res) => {
  const { userId } = req.params;
  const sql = `
    SELECT r.*, u.username 
    FROM recipes r
    JOIN users u ON r.user_id = u.id
    WHERE r.is_public = 1 AND r.user_id = ?
  `;
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: rows,
    });
  });
});

module.exports = router;