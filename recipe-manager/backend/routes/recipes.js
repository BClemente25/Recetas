const express = require('express');
const db = require('../database');

const router = express.Router();

// Obtener todas las recetas del usuario (privadas y públicas)
router.get('/:userId', (req, res) => {
  const { userId } = req.params;

  db.all(
    'SELECT * FROM recipes WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, recipes) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener recetas' });
      }
      res.json(recipes);
    }
  );
});

// Crear nueva receta
router.post('/', (req, res) => {
  const {
    user_id,
    title,
    description,
    ingredients,
    instructions,
    category,
    servings,
    prepTime,
    cookTime,
    image_url,
    is_public
  } = req.body;

  if (!user_id || !title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Campos requeridos faltantes' });
  }

  db.run(
    `INSERT INTO recipes (user_id, title, description, ingredients, instructions, category, servings, prepTime, cookTime, image_url, is_public)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, title, description, ingredients, instructions, category, servings, prepTime, cookTime, image_url, is_public ? 1 : 0],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error al crear receta' });
      }

      res.status(201).json({
        message: 'Receta creada exitosamente',
        recipeId: this.lastID
      });
    }
  );
});

// Actualizar receta
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    ingredients,
    instructions,
    category,
    servings,
    prepTime,
    cookTime,
    image_url,
    is_public
  } = req.body;

  db.run(
    `UPDATE recipes 
     SET title = ?, description = ?, ingredients = ?, instructions = ?, 
         category = ?, servings = ?, prepTime = ?, cookTime = ?, image_url = ?, is_public = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title, description, ingredients, instructions, category, servings, prepTime, cookTime, image_url, is_public ? 1 : 0, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error al actualizar receta' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Receta no encontrada' });
      }

      res.json({ message: 'Receta actualizada exitosamente' });
    }
  );
});

// Eliminar receta
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM recipes WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar receta' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    res.json({ message: 'Receta eliminada exitosamente' });
  });
});

module.exports = router;