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
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      ingredients TEXT NOT NULL,
      instructions TEXT NOT NULL,
      category TEXT,
      servings INTEGER DEFAULT 1,
      prep_time INTEGER,
      cook_time INTEGER,
      image_url TEXT,
      is_public INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Agregar columna is_public a recetas existentes (si no existe)
  db.run(`ALTER TABLE recipes ADD COLUMN is_public INTEGER DEFAULT 1`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error al agregar columna is_public:', err);
    }
  });

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