const express = require('express');
const db = require('../database');

const router = express.Router();

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

// PUT /api/user/:userId/avatar - Actualizar el avatar de un usuario
router.put('/:userId/avatar', (req, res) => {
  const { userId } = req.params;
  const { avatarUrl } = req.body;

  if (!avatarUrl) {
    return res.status(400).json({ error: 'La URL del avatar es requerida.' });
  }

  const sql = 'UPDATE users SET avatar_url = ? WHERE id = ?';
  db.run(sql, [avatarUrl, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar el avatar.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ message: 'Avatar actualizado exitosamente.', avatarUrl });
  });
});


/**
 * --- RUTAS DE SEGUIMIENTO ---
 * NOTA: Para estas rutas, asumimos que el ID del usuario actual (el que realiza la acción)
 * se envía en el cuerpo de la solicitud (ej: req.body.currentUserId).
 * Una implementación más avanzada usaría tokens de autenticación (JWT).
 */

// POST /api/user/:userId/follow - Seguir a un usuario
router.post('/:userId/follow', (req, res) => {
  const { userId: userToFollowId } = req.params;
  const { currentUserId } = req.body;

  if (!currentUserId) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const sql = 'INSERT INTO followers (follower_id, following_id) VALUES (?, ?)';
  db.run(sql, [currentUserId, userToFollowId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al intentar seguir al usuario.' });
    }
    res.status(201).json({ message: 'Usuario seguido exitosamente.' });
  });
});

// DELETE /api/user/:userId/unfollow - Dejar de seguir a un usuario
router.delete('/:userId/unfollow', (req, res) => {
  const { userId: userToUnfollowId } = req.params;
  const { currentUserId } = req.body;

  if (!currentUserId) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const sql = 'DELETE FROM followers WHERE follower_id = ? AND following_id = ?';
  db.run(sql, [currentUserId, userToUnfollowId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al dejar de seguir al usuario.' });
    }
    res.json({ message: 'Dejaste de seguir al usuario.' });
  });
});

// GET /api/user/:userId/follow-status - Verificar si el usuario actual sigue a otro
router.get('/:userId/follow-status/:currentUserId', (req, res) => {
  const { userId, currentUserId } = req.params;

  const sql = 'SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?';
  db.get(sql, [currentUserId, userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar el estado de seguimiento.' });
    }
    res.json({ isFollowing: !!row });
  });
});

// GET /api/user/:userId/followers - Obtener la lista de seguidores de un usuario
router.get('/:userId/followers', (req, res) => {
  const { userId } = req.params;
  const sql = `
    SELECT u.id, u.username, u.avatar_url 
    FROM users u
    JOIN followers f ON u.id = f.follower_id
    WHERE f.following_id = ?
  `;
  db.all(sql, [userId], (err, rows) => {
    res.json(rows || []);
  });
});

// GET /api/user/:userId/following - Obtener la lista de usuarios que alguien sigue
router.get('/:userId/following', (req, res) => {
  const { userId } = req.params;
  const sql = `
    SELECT u.id, u.username, u.avatar_url 
    FROM users u
    JOIN followers f ON u.id = f.following_id
    WHERE f.follower_id = ?
  `;
  db.all(sql, [userId], (err, rows) => {
    res.json(rows || []);
  });
});

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