const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Every route in this file requires an admin
router.use(authenticate, requireRole('admin'));

// Create a barber
router.post('/barbers', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'barber')
       RETURNING id, name, email, role`,
      [name, email.toLowerCase(), phone, passwordHash]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// List users by role: /admin/users?role=barber
router.get('/users', async (req, res) => {
  const role = req.query.role || 'client';

  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, is_active
       FROM users WHERE role = $1 ORDER BY name`,
      [role]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Activate or deactivate a user
router.patch('/users/:id/active', async (req, res) => {
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'El valor is_active debe ser true o false' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET is_active = $1
       WHERE id = $2 AND role <> 'admin'
       RETURNING id, name, role, is_active`,
      [is_active, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;