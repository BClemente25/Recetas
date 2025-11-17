const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');

const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Usuario o email ya existe' });
          }
          return res.status(500).json({ error: 'Error al crear usuario' });
        }

        res.status(201).json({
          message: 'Usuario creado exitosamente',
          userId: this.lastID,
          username: username
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Login de usuario
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    try {
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      res.json({
        message: 'Login exitoso',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al verificar contraseña' });
    }
  });
});

module.exports = router;