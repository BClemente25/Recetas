const express = require('express');
const db = require('../database');

const router = express.Router();

// Buscar usuarios por nombre
router.get('/search', (req, res) => {
  const { query } = req.query;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'La búsqueda debe tener al menos 2 caracteres' });
  }

  db.all(
    `SELECT id, username, bio, avatar_url, created_at 
     FROM users 
     WHERE username LIKE ? 
     ORDER BY username ASC 
     LIMIT 20`,
    [`%${query}%`],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Error al buscar usuarios' });
      }
      res.json(users);
    }
  );
});

// Obtener perfil de usuario por ID
router.get('/:userId', (req, res) => {
  const { userId } = req.params;

  db.get(
    'SELECT id, username, bio, avatar_url, created_at FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener usuario' });
      }

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    }
  );
});

// Obtener recetas públicas de un usuario
router.get('/:userId/recipes', (req, res) => {
  const { userId } = req.params;

  db.all(
    `SELECT r.*, u.username 
     FROM recipes r
     JOIN users u ON r.user_id = u.id
     WHERE r.user_id = ? AND r.is_public = 1 
     ORDER BY r.created_at DESC`,
    [userId],
    (err, recipes) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener recetas' });
      }
      res.json(recipes);
    }
  );
});

// Obtener todas las recetas públicas (feed)
router.get('/feed/public', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  db.all(
    `SELECT r.*, u.username, u.avatar_url 
     FROM recipes r
     JOIN users u ON r.user_id = u.id
     WHERE r.is_public = 1 
     ORDER BY r.created_at DESC 
     LIMIT ? OFFSET ?`,
    [parseInt(limit), parseInt(offset)],
    (err, recipes) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener recetas públicas' });
      }
      res.json(recipes);
    }
  );
});

module.exports = router;