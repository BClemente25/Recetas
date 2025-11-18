const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'recipemanager.db'), (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('✓ Conectado a la base de datos SQLite');
  }
});

// Crear tablas
db.serialize(() => {
  // Tabla de usuarios
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      bio TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de recetas con campo is_public
  db.run(`
    CREATE TABLE recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    ingredients TEXT,
    instructions TEXT,
    category TEXT,
    servings INTEGER,
    prepTime INTEGER,
    cookTime INTEGER,
    image_url TEXT,
    is_public BOOLEAN DEFAULT 0, -- 0 para privado, 1 para público
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Agregar columnas bio y avatar_url a usuarios existentes
  db.run(`ALTER TABLE users ADD COLUMN bio TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error al agregar columna bio:', err);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN avatar_url TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error al agregar columna avatar_url:', err);
    }
  });

  console.log('✓ Tablas creadas/verificadas correctamente');
});

module.exports = db;